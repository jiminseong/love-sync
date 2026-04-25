import { generateDummyResult, computeResult } from './lib/score.js';
import { generateReport, renderReportBodyHTML } from './lib/report.js';
import { captureReportCard } from './lib/capture.js';
import { startVision, stopVision, getVisionSnapshot } from './lib/vision.js';
import { startAudio, stopAudio, getAudioSnapshot } from './lib/audio.js';
import { runFinale, stopFinale } from './lib/finale.js';
import { fetchEnhancement } from './lib/gemini.js';

const SCREENS = ['landing', 'scan', 'report', 'finale'];
const REPORT_COUNTUP_MS = 1200;

// scan 화면 자동 트리거 임계값.
// proximity는 0(멀다)~1(가깝다) 범위.
// proximityToCm = 12 - p*10  →  p=0.5가 7cm. 7cm 이하에서 발동.
const PROXIMITY_TRIGGER = 0.5;
// proximity가 임계 근처(>= NEAR)면 안내 라벨을 "쪽 소리 들으면 끝낼게"로 바꿔 준다.
const PROXIMITY_NEAR = 0.3;
// 트리거 후 화면이 fade되는 시간. 너무 길면 흐름이 끊기고, 너무 짧으면 어색.
const SCAN_FINALIZE_FADE_MS = 800;

// 토스트/트리거 판정용 dB 임계. 마이크별 baseline 편차가 커서 보수적으로 잡으면
// 사용자 입장에선 "둔감"하게 느껴진다. 일반적인 "쪽" 정도로도 잡히게 낮춰 둔다.
// (proximity 조건과 AND이므로 노이즈 오트리거는 거리 조건이 거른다.)
const LOUD_KISS_DB = -30;
const WEAK_KISS_DB = -38;

// 조건이 풀린 뒤에도 이만큼 더 보여 준다. 매 프레임 호출되는 동안에는 계속 노출.
const TOAST_VISIBLE_MS = 1600;

const SCAN_PHASES = {
  warmup:     '잠깐 준비할게',
  ready:      '입술 가까이 가져와봐',
  listening:  '쪽 소리 들으면 끝낼게',
  finalizing: '잡았다, 잠시만',
};

const state = {
  current: 'landing',
  scanRaf: null,
  finalizeTimer: null,
  countupRaf: null,
  toastTimer: null,
  lastToast: { kind: null, at: 0 },
  scanSamples: {
    stability: [],
    proximity: [],
    peakDb: [],
  },
  scanTriggered: false,
  vision: {
    active: false,
    fallback: false,
    proximity: 0,
    distanceStability: 0.5,
    hasFace: false,
  },
  audio: {
    active: false,
    fallback: false,
    rmsDb: -60,
    peakDb: -60,
    kissDetected: false,
    lastKissAt: 0,
  },
  // 분석이 끝나는 순간 캡처해 두는 사용자 얼굴 dataURL.
  // finale 페이지의 흑백·블러 배경으로만 쓰이고, 어디로도 송신/저장되지 않는다.
  shameImageUrl: null,
  lastEnhancement: null,
  enhancementRequestId: 0,
};

function setScreen(name) {
  if (!SCREENS.includes(name)) return;
  const root = document.querySelector('main');
  if (!root) return;
  root.dataset.activeScreen = name;
  state.current = name;
}

function detectDeviceProfile() {
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) {
    return { name: '아이폰', lines: [
      '아이폰이 입술 내밀고 있어 ♥',
      '아이폰이 너만 기다려 ♥',
      '아이폰이 살짝 떨고 있어 ♥',
    ]};
  }
  if (/iPad/i.test(ua)) {
    return { name: '아이패드', lines: [
      '아이패드가 두근거리는 중 ♥',
      '큰 화면, 큰 사랑 — 아이패드가 기다려 ♥',
    ]};
  }
  if (/Macintosh/i.test(ua)) {
    return { name: '맥북', lines: [
      '맥북이 너 기다리는 중 ♥',
      '맥북이 입 모으고 있어 ♥',
      '맥북이 슬쩍 화면 가까이 ♥',
    ]};
  }
  if (/Galaxy|SM-/i.test(ua)) {
    return { name: '갤럭시', lines: [
      '갤럭시가 살짝 설레는 중 ♥',
      '갤럭시가 입술 내밀고 있어 ♥',
    ]};
  }
  if (/Pixel/i.test(ua)) {
    return { name: '픽셀', lines: [
      '픽셀이 너 기다려 ♥',
      '픽셀이 화면 반짝이는 중 ♥',
    ]};
  }
  if (/Android/i.test(ua)) {
    return { name: '안드로이드', lines: [
      '안드로이드가 너 기다리는 중 ♥',
    ]};
  }
  if (/Windows/i.test(ua)) {
    return { name: '윈도우', lines: [
      '윈도우 PC가 슬쩍 두근대는 중 ♥',
      '키보드 옆에서 너만 기다려 ♥',
    ]};
  }
  return { name: '네 기기', lines: ['네 기기가 너를 기다리는 중 ♥'] };
}

function applyDeviceLabel() {
  const host = document.querySelector('[data-device-label]');
  if (!host) return;
  const profile = detectDeviceProfile();
  const line = profile.lines[Math.floor(Math.random() * profile.lines.length)];
  host.textContent = line;
}

/**
 * 랜딩 헤드라인의 "내 기기" 자리를 userAgent로 매핑한 이름으로 치환한다.
 * 알 수 없는 기기는 "내 기기" 그대로 둠.
 */
function applyDeviceHeadline() {
  const host = document.querySelector('[data-device-name]');
  if (!host) return;
  const profile = detectDeviceProfile();
  if (profile.name && profile.name !== '네 기기') {
    host.textContent = `내 ${profile.name}`;
  }
}

/**
 * finale 본문의 "차가운 ○○ 액정"에 끼워 넣을 기기 이름.
 * detectDeviceProfile이 일반명("네 기기")을 돌려주면 null로 처리해 fallback 문구 사용.
 */
function getFinaleDeviceName() {
  const profile = detectDeviceProfile();
  return profile.name && profile.name !== '네 기기' ? profile.name : null;
}

function proximityToCm(proximity) {
  const p = Math.max(0, Math.min(1, proximity || 0));
  return (12 - p * 10).toFixed(1);
}

function writeSensor(key, value) {
  document.querySelectorAll(`[data-sensor="${key}"]`).forEach((el) => {
    el.textContent = value;
  });
}

function setScanPhase(name) {
  const node = document.querySelector('#scan-status');
  if (!node) return;
  if (node.dataset.phase === name) return;
  node.dataset.phase = name;
  const text = SCAN_PHASES[name] || SCAN_PHASES.warmup;
  node.innerHTML = `${text} <span class="heart" aria-hidden="true">♥</span>`;
}

/**
 * scan 화면 하단에 안내 토스트를 띄운다.
 *
 * - 매 프레임 호출돼도 깜빡이지 않게 종류(kind)가 바뀔 때만 텍스트를 다시 쓴다.
 * - 호출 때마다 hide 타이머를 연장하니, 조건이 만족되는 동안에는 계속 보이고
 *   조건이 풀리면 TOAST_VISIBLE_MS 뒤에 자연스럽게 사라진다.
 */
function showScanToast(text, kind) {
  if (state.scanTriggered) return;
  const node = document.querySelector('#scan-toast');
  if (!node) return;

  if (state.lastToast.kind !== kind) {
    node.textContent = text;
    state.lastToast = { kind, at: performance.now() };
  }
  node.dataset.visible = 'true';

  if (state.toastTimer) clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    node.dataset.visible = 'false';
    state.toastTimer = null;
    state.lastToast = { kind: null, at: 0 };
  }, TOAST_VISIBLE_MS);
}

function hideScanToast() {
  const node = document.querySelector('#scan-toast');
  if (node) node.dataset.visible = 'false';
  if (state.toastTimer) {
    clearTimeout(state.toastTimer);
    state.toastTimer = null;
  }
  state.lastToast = { kind: null, at: 0 };
}

function updateVisionMetrics() {
  const v = state.vision;
  writeSensor('distance', `${proximityToCm(v.proximity)} cm`);
}

function updateAudioMetrics() {
  const a = state.audio;
  const peak = isFinite(a.peakDb) ? a.peakDb : -60;
  writeSensor('db', `${peak.toFixed(1)} dB`);
}

/**
 * #video 요소에서 현재 프레임을 캡처해 dataURL로 반환한다.
 * 전면 카메라 미러링 보정을 위해 좌우 반전해서 그린다.
 * 실패하면 null을 반환 — 호출 측은 graceful하게 무시.
 */
function captureLastVideoFrame() {
  const video = document.querySelector('#video');
  if (!video || !video.videoWidth || !video.videoHeight) return null;
  try {
    // 배경용이라 해상도는 적당히 압축
    const targetW = Math.min(640, video.videoWidth);
    const scale = targetW / video.videoWidth;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // 셀카 모드처럼 좌우 반전 — 보는 사람 시점과 일치
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.78);
  } catch (err) {
    console.warn('[ppoppoppo] captureLastVideoFrame failed', err);
    return null;
  }
}

function cancelScanWatch() {
  if (state.scanRaf) {
    cancelAnimationFrame(state.scanRaf);
    state.scanRaf = null;
  }
  if (state.finalizeTimer) {
    clearTimeout(state.finalizeTimer);
    state.finalizeTimer = null;
  }
  state.scanTriggered = false;
  state.scanSamples.stability.length = 0;
  state.scanSamples.proximity.length = 0;
  state.scanSamples.peakDb.length = 0;

  const scanSection = document.querySelector('section[data-screen="scan"]');
  if (scanSection) scanSection.dataset.finalizing = 'false';

  hideScanToast();
}

/**
 * scan 화면 진입 후 매 프레임 표본을 누적하면서, proximity와 kissDetected가
 * 동시에 충족되는 순간 한 번만 finalizeScan을 호출한다.
 */
function startScanWatch() {
  cancelScanWatch();

  const tick = () => {
    if (state.scanTriggered) return;

    const v = state.vision;
    const a = state.audio;

    if (v.active) {
      state.scanSamples.stability.push(v.distanceStability);
      state.scanSamples.proximity.push(v.proximity);
    }
    if (a.active && isFinite(a.peakDb)) {
      state.scanSamples.peakDb.push(a.peakDb);
    }

    // phase 라벨 갱신 — 시각적 가이드
    if (v.proximity >= PROXIMITY_NEAR && a.active) {
      setScanPhase('listening');
    } else if ((v.active || v.fallback) && (a.active || a.fallback)) {
      setScanPhase('ready');
    }

    // "쪽" 신호: detectKiss가 어택 패턴을 잡았거나, 그게 실패해도 단순히 큰 소리
    // (peakDb ≥ LOUD_KISS_DB)면 우회 트리거로 인정. 어택 매칭이 까다로워서
    // 분명히 큰 소리인데도 못 잡는 경우를 막는다.
    const loudPeak = isFinite(a.peakDb) && a.peakDb >= LOUD_KISS_DB;
    const kissSignal = a.kissDetected || loudPeak;

    if (kissSignal) {
      a.kissDetected = false;
      if (v.proximity >= PROXIMITY_TRIGGER) {
        // 거리 + 소리 동시 충족 → 트리거.
        state.scanTriggered = true;
        state.scanRaf = null;
        hideScanToast();
        finalizeScan();
        return;
      }
      // 소리는 충분한데 거리가 부족.
      showScanToast('소리는 충분한데 좀더 가까이와!', 'too-far');
    } else if (
      isFinite(a.peakDb) &&
      a.peakDb >= WEAK_KISS_DB &&
      a.peakDb < LOUD_KISS_DB &&
      v.proximity >= PROXIMITY_TRIGGER
    ) {
      // 거리는 충분한데 소리가 약함.
      showScanToast('소리가 너무 작아!', 'too-quiet');
    }

    state.scanRaf = requestAnimationFrame(tick);
  };

  state.scanRaf = requestAnimationFrame(tick);
}

/**
 * 트리거 발동 → 짧은 fade out → 그동안 누적한 표본으로 결과 계산 → report로.
 */
function finalizeScan() {
  setScanPhase('finalizing');
  const scanSection = document.querySelector('section[data-screen="scan"]');
  if (scanSection) scanSection.dataset.finalizing = 'true';

  state.finalizeTimer = setTimeout(() => {
    state.finalizeTimer = null;

    const samples = state.scanSamples;
    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const max = (arr) => (arr.length ? Math.max(...arr) : null);

    const visionSnap = getVisionSnapshot();
    const audioSnap = getAudioSnapshot();

    const stability =
      avg(samples.stability) != null
        ? avg(samples.stability)
        : visionSnap.distanceStability;

    const avgPeak = avg(samples.peakDb);
    const maxPeak = max(samples.peakDb);
    const audioPeakDb =
      avgPeak != null && maxPeak != null
        ? avgPeak * 0.5 + maxPeak * 0.5
        : audioSnap.peakDb != null
        ? audioSnap.peakDb
        : -45;

    const visionReal = state.vision.active && !state.vision.fallback;
    const audioReal = state.audio.active && !state.audio.fallback;

    let result;
    if (visionReal || audioReal) {
      result = computeResult({
        distanceStability: stability,
        audioPeakDb,
        kissDetected: true,
      });
    } else {
      const dummy = generateDummyResult();
      result = {
        ...dummy,
        distanceStability: Number(stability.toFixed(3)),
      };
    }

    // 카메라 트랙을 끊기 직전에 마지막 프레임을 잡아둔다.
    // finale 페이지의 흑백·블러 배경으로만 쓰이고 외부로 나가지 않는다.
    state.shameImageUrl = captureLastVideoFrame();

    stopVision();
    stopAudio();
    state.vision.active = false;
    state.audio.active = false;

    if (scanSection) scanSection.dataset.finalizing = 'false';

    renderReport(result);
    setScreen('report');
  }, SCAN_FINALIZE_FADE_MS);
}

function animateScoreCountup(targetScore) {
  const node = document.querySelector('#report-score');
  if (!node) return;
  if (state.countupRaf) cancelAnimationFrame(state.countupRaf);
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / REPORT_COUNTUP_MS);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = String(Math.round(eased * targetScore));
    if (t < 1) {
      state.countupRaf = requestAnimationFrame(tick);
    } else {
      state.countupRaf = null;
    }
  };
  state.countupRaf = requestAnimationFrame(tick);
}

function buildEnhancementPayload(result, report) {
  return {
    score: report.score,
    personality: result.personality,
    distanceStability: Number(result.distanceStability.toFixed(3)),
    audioPeakDb: Number(result.audioPeakDb.toFixed(1)),
    deviceName: getFinaleDeviceName(),
  };
}

function replacePrescription(text) {
  const node = document.querySelector('#report-body .prescription');
  if (!node || !text) return;

  node.classList.add('is-updating');
  setTimeout(() => {
    node.textContent = text;
    requestAnimationFrame(() => {
      node.classList.remove('is-updating');
    });
  }, 220);
}

function renderReport(result) {
  const report = generateReport(result);
  const enhancementRequestId = state.enhancementRequestId + 1;
  state.enhancementRequestId = enhancementRequestId;
  state.lastEnhancement = null;

  const scoreNode = document.querySelector('#report-score');
  if (scoreNode) scoreNode.textContent = '0';

  const body = document.querySelector('#report-body');
  if (body) body.innerHTML = renderReportBodyHTML(report);

  const idNode = document.querySelector('[data-report-id]');
  if (idNode) idNode.textContent = `no. ${report.reportId}`;

  const dateNode = document.querySelector('[data-report-date]');
  if (dateNode) dateNode.textContent = `${report.date}`;

  animateScoreCountup(report.score);

  const enhancementPayload = buildEnhancementPayload(result, report);
  fetchEnhancement(enhancementPayload).then((enhancement) => {
    if (!enhancement || state.enhancementRequestId !== enhancementRequestId) return;
    state.lastEnhancement = enhancement;
    if (state.current === 'report') {
      replacePrescription(enhancement.prescription);
    }
  });

}

function onVisionUpdate(update) {
  state.vision.active = true;
  state.vision.fallback = Boolean(update.fallback);
  state.vision.proximity = update.proximity;
  state.vision.distanceStability = update.distanceStability;
  state.vision.hasFace = Boolean(update.hasFace);
  updateVisionMetrics();
}

function onAudioUpdate(update) {
  state.audio.active = true;
  state.audio.fallback = Boolean(update.fallback);
  state.audio.rmsDb = update.rmsDb;
  state.audio.peakDb = update.peakDb;
  if (update.kissDetected) {
    state.audio.kissDetected = true;
    state.audio.lastKissAt = performance.now();
  }
  updateAudioMetrics();
}

async function beginVisionPreview() {
  const video = document.querySelector('#video');
  writeSensor('camera', '연결 중');
  try {
    const res = await startVision({
      video,
      onUpdate: onVisionUpdate,
    });
    state.vision.active = true;
    state.vision.fallback = Boolean(res && res.fallback);
    writeSensor('camera', res && res.fallback ? '데모' : '준비됨 ♥');
  } catch (err) {
    console.warn('[ppoppoppo] vision start failed', err);
    state.vision.active = false;
    writeSensor('camera', '실패');
  }
}

async function beginAudioCapture() {
  writeSensor('mic', '연결 중');
  try {
    const res = await startAudio({ onUpdate: onAudioUpdate });
    state.audio.active = true;
    state.audio.fallback = Boolean(res && res.fallback);
    writeSensor('mic', res && res.fallback ? '데모' : '준비됨 ♥');
  } catch (err) {
    console.warn('[ppoppoppo] audio start failed', err);
    state.audio.active = false;
    writeSensor('mic', '실패');
  }
}

/**
 * Landing의 "지금 뽀뽀하러 가기" 클릭 핸들러.
 * 카메라+마이크를 동시에 시작하고, scan 화면에서 자동 트리거 watch를 켠다.
 * 별도의 "허용하고 시작" 단계는 두지 않는다 — 흐름을 끊지 않기 위해서.
 */
function goScan() {
  setScreen('scan');
  setScanPhase('warmup');
  // 둘 다 비동기로 시작 — 권한 다이얼로그가 두 번 떠도 사용자는 한 번에 처리한다.
  beginVisionPreview();
  beginAudioCapture();
  startScanWatch();
}

function goLanding() {
  cancelScanWatch();
  if (state.countupRaf) {
    cancelAnimationFrame(state.countupRaf);
    state.countupRaf = null;
  }
  stopVision();
  stopAudio();
  state.vision.active = false;
  state.vision.fallback = false;
  state.audio.active = false;
  state.audio.fallback = false;
  state.audio.peakDb = -60;
  state.audio.rmsDb = -60;
  state.audio.kissDetected = false;
  state.shameImageUrl = null;
  state.lastEnhancement = null;
  state.enhancementRequestId += 1;
  writeSensor('camera', '대기');
  writeSensor('mic', '대기');
  writeSensor('distance', '—');
  writeSensor('db', '—');
  setScanPhase('warmup');
  setScreen('landing');
}

/**
 * "서비스 의도 확인하기" 클릭 핸들러.
 * 반드시 이 클릭 이벤트의 동기 체인 안에서 runFinale()을 호출해야
 * 그 안에서 만드는 Audio.play()가 브라우저 autoplay 정책을 통과한다.
 */
function handleRevealIntent() {
  const btn = document.querySelector('#reveal-intent-btn');
  if (btn) {
    btn.disabled = true;
    btn.setAttribute('aria-hidden', 'true');
  }

  // runFinale은 내부에서 1.5초 페이드아웃을 기다린 뒤
  // onSwitchScreen 콜백을 호출 → 그때 setScreen('finale')로 화면 교체.
  runFinale({
    shameImageUrl: state.shameImageUrl,
    deviceName: getFinaleDeviceName(),
    dynamicSegments: state.lastEnhancement?.finaleSegments || null,
    onSwitchScreen: () => {
      setScreen('finale');
    },
  }).catch((err) => {
    console.warn('[ppoppoppo] finale failed', err);
  });
}

/** finale 페이지의 "처음으로 다시 가기" 버튼 핸들러. */
function handleFinaleRestart() {
  stopFinale();
  // reveal 버튼 다시 클릭 가능하게 복원
  const btn = document.querySelector('#reveal-intent-btn');
  if (btn) {
    btn.disabled = false;
    btn.removeAttribute('aria-hidden');
  }
  goLanding();
}

async function handleSaveClick() {
  const saveBtn = document.querySelector('#save-btn');
  const scoreNode = document.querySelector('#report-score');
  const filename = scoreNode ? `ppoppoppo-${scoreNode.textContent}.png` : 'ppoppoppo.png';

  const originalLabel = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '이미지 생성 중...';
  }
  try {
    await captureReportCard({ filename });
  } catch (err) {
    console.warn('[ppoppoppo] capture failed', err);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalLabel || '이미지로 저장한다';
    }
  }
}

function bindEvents() {
  const startBtn = document.querySelector('#start-btn');
  if (startBtn) startBtn.addEventListener('click', goScan);

  const saveBtn = document.querySelector('#save-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSaveClick);

  const restartBtn = document.querySelector('#restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', goLanding);

  const revealBtn = document.querySelector('#reveal-intent-btn');
  if (revealBtn) revealBtn.addEventListener('click', handleRevealIntent);

  const finaleRestartBtn = document.querySelector('#finale-restart-btn');
  if (finaleRestartBtn) finaleRestartBtn.addEventListener('click', handleFinaleRestart);
}

function init() {
  applyDeviceLabel();
  applyDeviceHeadline();
  bindEvents();
  setScreen('landing');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
