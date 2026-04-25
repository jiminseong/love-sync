const FFT_SIZE = 2048;
const SMOOTHING = 0.2;
const FLOOR_DB = -80;
const PEAK_HOLD_MS = 250;

const KISS_THRESHOLD_DB = -32;
const KISS_RESET_DB = -42;
const KISS_MIN_ATTACK_MS = 10;
const KISS_MAX_ATTACK_MS = 220;
const KISS_COOLDOWN_MS = 450;

const state = {
  running: false,
  ctx: null,
  analyser: null,
  source: null,
  stream: null,
  timeBuf: null,
  rafId: null,
  onUpdate: null,
  usingFallback: false,
  fallbackSeed: Math.random() * 1000,
  lastPeakDb: FLOOR_DB,
  lastPeakAt: 0,
  attackStartAt: null,
  attackStartDb: FLOOR_DB,
  lastKissAt: 0,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toDb(linear) {
  if (!(linear > 0)) return FLOOR_DB;
  const db = 20 * Math.log10(linear);
  return db < FLOOR_DB ? FLOOR_DB : db;
}

function computeRmsAndPeak(buf) {
  let sumSq = 0;
  let peak = 0;
  const len = buf.length;
  for (let i = 0; i < len; i++) {
    const v = (buf[i] - 128) / 128;
    const abs = v < 0 ? -v : v;
    sumSq += v * v;
    if (abs > peak) peak = abs;
  }
  const rms = Math.sqrt(sumSq / len);
  return { rmsDb: toDb(rms), peakDb: toDb(peak) };
}

function emit(update) {
  if (typeof state.onUpdate === 'function') {
    try {
      state.onUpdate(update);
    } catch (err) {
      console.warn('[audio] onUpdate handler error', err);
    }
  }
}

function detectKiss(peakDb, now) {
  let kissDetected = false;
  let attackMs;

  if (state.attackStartAt == null) {
    if (peakDb < KISS_RESET_DB) {
      state.attackStartAt = now;
      state.attackStartDb = peakDb;
    }
  } else {
    if (peakDb < state.attackStartDb) {
      state.attackStartAt = now;
      state.attackStartDb = peakDb;
    }
    if (peakDb >= KISS_THRESHOLD_DB) {
      const elapsed = now - state.attackStartAt;
      if (
        elapsed >= KISS_MIN_ATTACK_MS &&
        elapsed <= KISS_MAX_ATTACK_MS &&
        now - state.lastKissAt > KISS_COOLDOWN_MS
      ) {
        kissDetected = true;
        attackMs = elapsed;
        state.lastKissAt = now;
      }
      state.attackStartAt = null;
      state.attackStartDb = FLOOR_DB;
    }
  }

  return { kissDetected, attackMs };
}

function tick() {
  if (!state.running || !state.analyser || !state.timeBuf) return;

  state.analyser.getByteTimeDomainData(state.timeBuf);
  const { rmsDb, peakDb } = computeRmsAndPeak(state.timeBuf);

  const now = performance.now();
  let displayPeak = peakDb;
  if (peakDb >= state.lastPeakDb || now - state.lastPeakAt > PEAK_HOLD_MS) {
    state.lastPeakDb = peakDb;
    state.lastPeakAt = now;
  } else {
    displayPeak = state.lastPeakDb;
  }

  const { kissDetected, attackMs } = detectKiss(peakDb, now);

  emit({
    rmsDb: Number(rmsDb.toFixed(1)),
    peakDb: Number(displayPeak.toFixed(1)),
    kissDetected,
    attackMs,
    fallback: false,
  });

  state.rafId = requestAnimationFrame(tick);
}

function fallbackTick() {
  if (!state.running) return;

  const t = performance.now() / 1000;
  const seed = state.fallbackSeed;
  const base =
    -38 +
    8 * Math.sin(t * 1.7 + seed) +
    4 * Math.sin(t * 3.1 + seed * 0.4);
  const jitter = (Math.random() - 0.5) * 4;
  const rmsDb = clamp(base + jitter, FLOOR_DB, 0);
  const peakDb = clamp(rmsDb + 6 + Math.random() * 6, FLOOR_DB, 0);

  const now = performance.now();
  let kissDetected = false;
  let attackMs;
  if (
    Math.random() < 0.01 &&
    now - state.lastKissAt > KISS_COOLDOWN_MS * 4
  ) {
    kissDetected = true;
    attackMs = 60 + Math.random() * 80;
    state.lastKissAt = now;
  }

  emit({
    rmsDb: Number(rmsDb.toFixed(1)),
    peakDb: Number(peakDb.toFixed(1)),
    kissDetected,
    attackMs,
    fallback: true,
  });

  state.rafId = requestAnimationFrame(fallbackTick);
}

function startFallback(reason) {
  console.warn('[audio] falling back to dummy dB:', reason);
  state.usingFallback = true;
  state.running = true;
  state.rafId = requestAnimationFrame(fallbackTick);
}

async function attachStream() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia not supported');
  }
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  });
}

export async function startAudio({ onUpdate } = {}) {
  if (state.running) stopAudio();

  state.onUpdate = typeof onUpdate === 'function' ? onUpdate : null;
  state.usingFallback = false;
  state.fallbackSeed = Math.random() * 1000;
  state.lastPeakDb = FLOOR_DB;
  state.lastPeakAt = 0;
  state.attackStartAt = null;
  state.attackStartDb = FLOOR_DB;
  state.lastKissAt = 0;

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    startFallback('AudioContext not supported');
    return { fallback: true };
  }

  try {
    state.stream = await attachStream();
  } catch (err) {
    startFallback(err && err.message ? err.message : 'getUserMedia failed');
    return { fallback: true };
  }

  try {
    state.ctx = new AudioCtor();
    if (state.ctx.state === 'suspended') {
      try {
        await state.ctx.resume();
      } catch (_err) {
        // ignore resume failure; will be retried by browser on gesture
      }
    }
    state.source = state.ctx.createMediaStreamSource(state.stream);
    state.analyser = state.ctx.createAnalyser();
    state.analyser.fftSize = FFT_SIZE;
    state.analyser.smoothingTimeConstant = SMOOTHING;
    state.source.connect(state.analyser);
    state.timeBuf = new Uint8Array(state.analyser.fftSize);
  } catch (err) {
    startFallback(err && err.message ? err.message : 'AudioContext init failed');
    return { fallback: true };
  }

  state.running = true;
  state.rafId = requestAnimationFrame(tick);
  return { fallback: false };
}

export function stopAudio() {
  state.running = false;
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  if (state.source) {
    try {
      state.source.disconnect();
    } catch (_err) {
      // ignore
    }
    state.source = null;
  }
  state.analyser = null;
  state.timeBuf = null;
  if (state.ctx) {
    try {
      state.ctx.close();
    } catch (_err) {
      // ignore
    }
    state.ctx = null;
  }
  if (state.stream) {
    state.stream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch (_err) {
        // ignore
      }
    });
    state.stream = null;
  }
  state.onUpdate = null;
}

export function getAudioSnapshot() {
  return {
    peakDb: state.lastPeakDb,
    fallback: state.usingFallback,
    running: state.running,
  };
}
