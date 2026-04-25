const FACE_MESH_ESM = 'https://esm.sh/@mediapipe/face_mesh@0.4.1633559619';
const MEDIAPIPE_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619';

const LIP_TOP = 13;
const LIP_BOTTOM = 14;
const LIP_LEFT = 78;
const LIP_RIGHT = 308;

const STABILITY_WINDOW = 30;

const state = {
  faceMesh: null,
  stream: null,
  video: null,
  rafId: null,
  running: false,
  onUpdate: null,
  lastProximity: 0,
  proximityHistory: [],
  usingFallback: false,
  fallbackSeed: Math.random() * 1000,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / values.length;
  return Math.sqrt(variance);
}

function computeStability(history) {
  if (history.length < 3) return 0.5;
  const sd = stdDev(history);
  const normalized = clamp(sd / 0.25, 0, 1);
  return Number((1 - normalized).toFixed(3));
}

function pushHistory(value) {
  state.proximityHistory.push(value);
  if (state.proximityHistory.length > STABILITY_WINDOW) {
    state.proximityHistory.shift();
  }
}

function computeProximityFromLandmarks(landmarks) {
  if (!landmarks || landmarks.length === 0) return null;

  const top = landmarks[LIP_TOP];
  const bottom = landmarks[LIP_BOTTOM];
  const left = landmarks[LIP_LEFT];
  const right = landmarks[LIP_RIGHT];
  if (!top || !bottom || !left || !right) return null;

  const horizontal = Math.hypot(right.x - left.x, right.y - left.y);
  const vertical = Math.hypot(bottom.x - top.x, bottom.y - top.y);

  let minX = 1;
  let maxX = 0;
  let minY = 1;
  let maxY = 0;
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const faceWidth = Math.max(1e-6, maxX - minX);
  const faceHeight = Math.max(1e-6, maxY - minY);
  const faceArea = clamp(faceWidth * faceHeight, 0, 1);

  const lipSpan = (horizontal + vertical) * 0.5;

  const areaProx = clamp((faceArea - 0.08) / 0.55, 0, 1);
  const lipProx = clamp((lipSpan - 0.04) / 0.22, 0, 1);
  const proximity = clamp(areaProx * 0.65 + lipProx * 0.35, 0, 1);

  return Number(proximity.toFixed(3));
}

function emit(update) {
  if (typeof state.onUpdate === 'function') {
    try {
      state.onUpdate(update);
    } catch (err) {
      console.warn('[vision] onUpdate handler error', err);
    }
  }
}

function handleResults(results) {
  if (!state.running) return;

  const landmarks =
    results &&
    results.multiFaceLandmarks &&
    results.multiFaceLandmarks[0];

  let proximity = computeProximityFromLandmarks(landmarks);
  if (proximity == null) {
    proximity = Math.max(0, state.lastProximity - 0.02);
  }

  state.lastProximity = proximity;
  pushHistory(proximity);

  emit({
    proximity,
    distanceStability: computeStability(state.proximityHistory),
    hasFace: Boolean(landmarks),
    fallback: false,
  });
}

function fallbackTick() {
  if (!state.running) return;

  const t = performance.now() / 1000;
  const seed = state.fallbackSeed;
  const base =
    0.55 +
    0.18 * Math.sin(t * 0.9 + seed) +
    0.08 * Math.sin(t * 2.3 + seed * 0.7);
  const jitter = (Math.random() - 0.5) * 0.04;
  const proximity = clamp(base + jitter, 0, 1);

  state.lastProximity = proximity;
  pushHistory(proximity);

  emit({
    proximity: Number(proximity.toFixed(3)),
    distanceStability: computeStability(state.proximityHistory),
    hasFace: true,
    fallback: true,
  });

  state.rafId = requestAnimationFrame(fallbackTick);
}

async function attachStream(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia not supported');
  }
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  });
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await new Promise((resolve) => {
    if (video.readyState >= 2) {
      resolve();
    } else {
      const once = () => {
        video.removeEventListener('loadeddata', once);
        resolve();
      };
      video.addEventListener('loadeddata', once);
    }
  });
  try {
    await video.play();
  } catch (_err) {
    // Autoplay may be blocked; caller can retry after user gesture.
  }
  return stream;
}

async function loadFaceMesh() {
  const mod = await import(FACE_MESH_ESM);
  const FaceMeshCtor = mod.FaceMesh || (mod.default && mod.default.FaceMesh) || mod.default;
  if (!FaceMeshCtor) throw new Error('FaceMesh constructor not found');
  const fm = new FaceMeshCtor({
    locateFile: (file) => `${MEDIAPIPE_CDN_BASE}/${file}`,
  });
  fm.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  fm.onResults(handleResults);
  return fm;
}

function startPumpLoop() {
  const loop = async () => {
    if (!state.running || !state.faceMesh || !state.video) return;
    if (state.video.readyState >= 2 && !state.video.paused) {
      try {
        await state.faceMesh.send({ image: state.video });
      } catch (err) {
        console.warn('[vision] face mesh send failed', err);
      }
    }
    state.rafId = requestAnimationFrame(loop);
  };
  state.rafId = requestAnimationFrame(loop);
}

function startFallback(reason) {
  console.warn('[vision] falling back to dummy proximity:', reason);
  state.usingFallback = true;
  state.running = true;
  state.rafId = requestAnimationFrame(fallbackTick);
}

export async function startVision({ video, onUpdate } = {}) {
  if (state.running) stopVision();

  state.video = video || document.querySelector('#video');
  state.onUpdate = typeof onUpdate === 'function' ? onUpdate : null;
  state.proximityHistory = [];
  state.lastProximity = 0;
  state.usingFallback = false;
  state.fallbackSeed = Math.random() * 1000;

  if (!state.video) {
    startFallback('video element missing');
    return { fallback: true };
  }

  try {
    state.stream = await attachStream(state.video);
  } catch (err) {
    startFallback(err && err.message ? err.message : 'getUserMedia failed');
    return { fallback: true };
  }

  try {
    state.faceMesh = await loadFaceMesh();
  } catch (err) {
    startFallback(err && err.message ? err.message : 'MediaPipe load failed');
    return { fallback: true };
  }

  state.running = true;
  startPumpLoop();
  return { fallback: false };
}

export function stopVision() {
  state.running = false;
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  }
  if (state.faceMesh && typeof state.faceMesh.close === 'function') {
    try {
      state.faceMesh.close();
    } catch (_err) {
      // ignore close errors
    }
  }
  state.faceMesh = null;
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
  if (state.video) {
    try {
      state.video.pause();
    } catch (_err) {
      // ignore
    }
    state.video.srcObject = null;
  }
  state.video = null;
  state.onUpdate = null;
  state.proximityHistory = [];
}

export function getVisionSnapshot() {
  return {
    proximity: state.lastProximity,
    distanceStability: computeStability(state.proximityHistory),
    samples: state.proximityHistory.length,
    fallback: state.usingFallback,
  };
}
