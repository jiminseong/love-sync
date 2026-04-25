const PERSONALITIES = ['dependent', 'performative', 'avoidant', 'sincere'];

const DB_FLOOR = -60;
const DB_CEIL = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeDb(audioPeakDb) {
  const db = typeof audioPeakDb === 'number' && isFinite(audioPeakDb) ? audioPeakDb : DB_FLOOR;
  return clamp((db - DB_FLOOR) / (DB_CEIL - DB_FLOOR), 0, 1);
}

function decidePersonality({ score, stability, normalizedDb, kissDetected }) {
  if (score >= 80 && stability >= 0.7 && kissDetected) return 'sincere';
  if (normalizedDb >= 0.6 && stability < 0.55) return 'performative';
  if (stability >= 0.65 && normalizedDb < 0.4) return 'avoidant';
  if (score < 40 && stability < 0.45) return 'avoidant';
  if (score >= 75 && stability >= 0.6) return 'sincere';
  if (normalizedDb >= 0.55) return 'performative';
  return 'dependent';
}

export function generateDummyResult() {
  const distanceStability = Number(Math.random().toFixed(3));
  const audioPeakDb = Number((DB_FLOOR + Math.random() * (DB_CEIL - DB_FLOOR)).toFixed(1));
  const kissDetected = Math.random() < 0.6;
  return computeResult({ distanceStability, audioPeakDb, kissDetected });
}

export function computeResult({
  distanceStability = 0,
  audioPeakDb = DB_FLOOR,
  kissDetected = false,
} = {}) {
  const stability = clamp(Number(distanceStability) || 0, 0, 1);
  const normalizedDb = normalizeDb(audioPeakDb);
  const kissBonus = kissDetected ? 0.1 : 0;

  const weighted = stability * 0.5 + normalizedDb * 0.4 + kissBonus;
  const sincerityScore = Math.round(clamp(weighted * 100, 0, 100));

  const personality = decidePersonality({
    score: sincerityScore,
    stability,
    normalizedDb,
    kissDetected: Boolean(kissDetected),
  });

  return {
    sincerityScore,
    distanceStability: Number(stability.toFixed(3)),
    audioPeakDb: Number(Number(audioPeakDb).toFixed(1)),
    personality,
  };
}

export { PERSONALITIES, normalizeDb };
