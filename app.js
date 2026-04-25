import { generateDummyResult, computeResult } from './lib/score.js';
import { generateReport, renderReportBodyHTML } from './lib/report.js';
import { captureReportCard } from './lib/capture.js';
import { startVision, stopVision, getVisionSnapshot } from './lib/vision.js';
import { startAudio, stopAudio, getAudioSnapshot } from './lib/audio.js';
import { runFinale } from './lib/finale.js';

const SCREENS = ['landing', 'scan', 'action', 'report', 'finale'];
const ANALYSIS_DURATION_MS = 3200;
const SCAN_TO_ACTION_DELAY_MS = 900;
const REPORT_COUNTUP_MS = 1200;

const state = {
  current: 'landing',
  analysisTimer: null,
  analysisRaf: null,
  countupRaf: null,
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

function setProgress(ratio) {
  const bar = document.querySelector('#progress-bar');
  if (!bar) return;
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  bar.style.width = `${pct}%`;
  bar.setAttribute('aria-valuenow', String(Math.round(pct)));
}

function setProgressLabel(text) {
  const label = document.querySelector('#progress-label');
  if (!label) return;
  label.textContent = text;
}

function proximityToCm(proximity) {
  const p = Math.max(0, Math.min(1, proximity || 0));
  return (12 - p * 10).toFixed(1);
}

function writeMetric(key, value) {
  document.querySelectorAll(`[data-metric="${key}"]`).forEach((el) => {
    el.textContent = value;
  });
}

function writeSensor(key, value) {
  document.querySelectorAll(`[data-sensor="${key}"]`).forEach((el) => {
    el.textContent = value;
  });
}

function updateVisionMetrics() {
  const v = state.vision;
  writeMetric('distance', `${proximityToCm(v.proximity)} cm`);
  writeMetric('stability', v.distanceStability.toFixed(2));
  writeMetric('tremor', (1 - v.distanceStability).toFixed(2));
  writeSensor('distance', `${proximityToCm(v.proximity)} cm`);
}

function updateAudioMetrics() {
  const a = state.audio;
  const peak = isFinite(a.peakDb) ? a.peakDb : -60;
  writeMetric('db', `${peak.toFixed(1)} dB`);
  writeSensor('db', `${peak.toFixed(1)} dB`);
}

function updateActionMetricsMock(ratio) {
  const v = state.vision;
  const a = state.audio;

  if (!v.active) {
    writeMetric('distance', `${(3.2 - ratio * 1.6).toFixed(1)} cm`);
    writeMetric('stability', (0.2 + ratio * 0.7).toFixed(2));
    writeMetric('tremor', (0.4 - ratio * 0.28).toFixed(2));
  }

  if (!a.active) {
    writeMetric('db', `${(-45 + ratio * 25).toFixed(1)} dB`);
  }
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

function clearAnalysisTimers() {
  if (state.analysisTimer) {
    clearTimeout(state.analysisTimer);
    state.analysisTimer = null;
  }
  if (state.analysisRaf) {
    cancelAnimationFrame(state.analysisRaf);
    state.analysisRaf = null;
  }
}

function runAnalysisSequence(onDone) {
  clearAnalysisTimers();
  setProgress(0);
  setProgressLabel('사랑 측정 중... ♥');

  const start = performance.now();
  const stages = [
    { at: 0.0, text: '사랑 측정 중... ♥' },
    { at: 0.25, text: '입술 위치 잡는 중...' },
    { at: 0.5, text: '소리 듣는 중...' },
    { at: 0.75, text: '점수 계산 중...' },
  ];
  let stageIdx = 0;

  const stabilitySamples = [];
  const proximitySamples = [];
  const peakDbSamples = [];
  let kissCount = 0;

  const tick = (now) => {
    const elapsed = now - start;
    const ratio = Math.min(1, elapsed / ANALYSIS_DURATION_MS);
    setProgress(ratio);
    updateActionMetricsMock(ratio);

    if (state.vision.active) {
      stabilitySamples.push(state.vision.distanceStability);
      proximitySamples.push(state.vision.proximity);
    }
    if (state.audio.active && isFinite(state.audio.peakDb)) {
      peakDbSamples.push(state.audio.peakDb);
      if (state.audio.kissDetected) {
        kissCount++;
        state.audio.kissDetected = false;
      }
    }

    while (stageIdx < stages.length && ratio >= stages[stageIdx].at) {
      setProgressLabel(stages[stageIdx].text);
      stageIdx++;
    }

    if (ratio < 1) {
      state.analysisRaf = requestAnimationFrame(tick);
    } else {
      state.analysisRaf = null;
      state.analysisTimer = setTimeout(() => {
        state.analysisTimer = null;
        const avg = (arr) =>
          arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        const max = (arr) => (arr.length ? Math.max(...arr) : null);
        onDone({
          avgStability: avg(stabilitySamples),
          avgProximity: avg(proximitySamples),
          avgPeakDb: avg(peakDbSamples),
          maxPeakDb: max(peakDbSamples),
          kissCount,
        });
      }, 600);
    }
  };

  state.analysisRaf = requestAnimationFrame(tick);
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

function renderReport(result) {
  const report = generateReport(result);

  const scoreNode = document.querySelector('#report-score');
  if (scoreNode) scoreNode.textContent = '0';

  const body = document.querySelector('#report-body');
  if (body) body.innerHTML = renderReportBodyHTML(report);

  const idNode = document.querySelector('[data-report-id]');
  if (idNode) idNode.textContent = `no. ${report.reportId}`;

  const dateNode = document.querySelector('[data-report-date]');
  if (dateNode) dateNode.textContent = `${report.date}`;

  animateScoreCountup(report.score);
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

function goScan() {
  setScreen('scan');
  beginVisionPreview();
}

function goActionFromScan() {
  beginAudioCapture();

  setTimeout(() => {
    setScreen('action');
    runAnalysisSequence((samples) => {
      const visionSnap = getVisionSnapshot();
      const audioSnap = getAudioSnapshot();

      const stability =
        samples && samples.avgStability != null
          ? samples.avgStability
          : visionSnap.distanceStability;

      const avgPeak = samples && samples.avgPeakDb != null ? samples.avgPeakDb : null;
      const maxPeak = samples && samples.maxPeakDb != null ? samples.maxPeakDb : null;
      const audioPeakDb =
        avgPeak != null && maxPeak != null
          ? avgPeak * 0.5 + maxPeak * 0.5
          : audioSnap.peakDb != null
          ? audioSnap.peakDb
          : -45;

      const kissDetected = Boolean(samples && samples.kissCount > 0);

      const visionReal = state.vision.active && !state.vision.fallback;
      const audioReal = state.audio.active && !state.audio.fallback;

      let result;
      if (visionReal || audioReal) {
        result = computeResult({
          distanceStability: stability,
          audioPeakDb,
          kissDetected,
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

      renderReport(result);
      setScreen('report');
    });
  }, SCAN_TO_ACTION_DELAY_MS);
}

function goLanding() {
  clearAnalysisTimers();
  if (state.countupRaf) {
    cancelAnimationFrame(state.countupRaf);
    state.countupRaf = null;
  }
  setProgress(0);
  setProgressLabel('사랑 측정 중... ♥');
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
  writeSensor('camera', '대기');
  writeSensor('mic', '대기');
  writeSensor('distance', '—');
  writeSensor('db', '—');
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
    onSwitchScreen: () => {
      setScreen('finale');
    },
  }).catch((err) => {
    console.warn('[ppoppoppo] finale failed', err);
  });
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

  const permissionBtn = document.querySelector('#permission-btn');
  if (permissionBtn) permissionBtn.addEventListener('click', goActionFromScan);

  const saveBtn = document.querySelector('#save-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSaveClick);

  const restartBtn = document.querySelector('#restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', goLanding);

  const revealBtn = document.querySelector('#reveal-intent-btn');
  if (revealBtn) revealBtn.addEventListener('click', handleRevealIntent);
}

function init() {
  applyDeviceLabel();
  bindEvents();
  setScreen('landing');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
