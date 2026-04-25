import { generateDummyResult, computeResult } from './lib/score.js';
import { generateReport, renderReportBodyHTML } from './lib/report.js';
import { captureReportCard } from './lib/capture.js';
import { startVision, stopVision, getVisionSnapshot } from './lib/vision.js';
import { startAudio, stopAudio, getAudioSnapshot } from './lib/audio.js';

const SCREENS = ['landing', 'scan', 'action', 'report'];
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
};

function setScreen(name) {
  if (!SCREENS.includes(name)) return;
  const root = document.querySelector('main');
  if (!root) return;
  root.dataset.activeScreen = name;
  state.current = name;
}

function detectDeviceLabel() {
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) {
    const match = ua.match(/iPhone(?: OS)?[ _](\d+)/i);
    return match ? `iPhone OS ${match[1]}` : 'iPhone';
  }
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Macintosh/i.test(ua)) return 'MacBook';
  if (/Galaxy|SM-/i.test(ua)) return 'Galaxy';
  if (/Pixel/i.test(ua)) return 'Pixel';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows PC';
  return null;
}

function applyDeviceLabel() {
  const host = document.querySelector('[data-device-label]');
  if (!host) return;
  const name = detectDeviceLabel();
  if (!name) return;
  host.textContent = `DETECTED SUBJECT: ${name} 의 영혼이 감지됨`;
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
  writeSensor('distance', `${proximityToCm(v.proximity)} CM`);
}

function updateAudioMetrics() {
  const a = state.audio;
  const peak = isFinite(a.peakDb) ? a.peakDb : -60;
  writeMetric('db', `${peak.toFixed(1)} dB`);
  writeSensor('db', `${peak.toFixed(1)} DB`);
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
  setProgressLabel('AI 애정 진정성 분석 중...');

  const start = performance.now();
  const stages = [
    { at: 0.0, text: 'AI 애정 진정성 분석 중...' },
    { at: 0.25, text: '입술 좌표 추출 중...' },
    { at: 0.5, text: '파장 분해 중...' },
    { at: 0.75, text: '진정성 회귀 분석 중...' },
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
  if (idNode) idNode.textContent = `REPORT NO. #${report.reportId}`;

  const dateNode = document.querySelector('[data-report-date]');
  if (dateNode) dateNode.textContent = `${report.date} · LOVE-SYNC ANALYSIS ENGINE v0.1`;

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
  writeSensor('camera', 'REQUESTING');
  try {
    const res = await startVision({
      video,
      onUpdate: onVisionUpdate,
    });
    state.vision.active = true;
    state.vision.fallback = Boolean(res && res.fallback);
    writeSensor('camera', res && res.fallback ? 'SIMULATED' : 'ACTIVE');
  } catch (err) {
    console.warn('[love-sync] vision start failed', err);
    state.vision.active = false;
    writeSensor('camera', 'FAILED');
  }
}

async function beginAudioCapture() {
  writeSensor('mic', 'REQUESTING');
  try {
    const res = await startAudio({ onUpdate: onAudioUpdate });
    state.audio.active = true;
    state.audio.fallback = Boolean(res && res.fallback);
    writeSensor('mic', res && res.fallback ? 'SIMULATED' : 'ACTIVE');
  } catch (err) {
    console.warn('[love-sync] audio start failed', err);
    state.audio.active = false;
    writeSensor('mic', 'FAILED');
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
  setProgressLabel('AI 애정 진정성 분석 중...');
  stopVision();
  stopAudio();
  state.vision.active = false;
  state.vision.fallback = false;
  state.audio.active = false;
  state.audio.fallback = false;
  state.audio.peakDb = -60;
  state.audio.rmsDb = -60;
  state.audio.kissDetected = false;
  writeSensor('camera', 'PENDING');
  writeSensor('mic', 'PENDING');
  writeSensor('distance', '—');
  writeSensor('db', '—');
  setScreen('landing');
}

async function handleSaveClick() {
  const saveBtn = document.querySelector('#save-btn');
  const scoreNode = document.querySelector('#report-score');
  const filename = scoreNode ? `love-sync-${scoreNode.textContent}.png` : 'love-sync.png';

  const originalLabel = saveBtn ? saveBtn.textContent : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '이미지 생성 중...';
  }
  try {
    await captureReportCard({ filename });
  } catch (err) {
    console.warn('[love-sync] capture failed', err);
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
