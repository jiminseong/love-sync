const VIBES = {
  sincere: '와, 진심 좀 있는데? 이 정도면 합격이야 ♥',
  performative: '음... 카메라 앞에서만 잘 하는 스타일?',
  dependent: '솔직히 말해, 너가 더 외로운 거 같아.',
  avoidant: '거리감이 좀 있네. 다음엔 더 가까이 와.',
};

const HEADLINES = [
  { min: 90, text: '진심 폭발 ♥' },
  { min: 75, text: '꽤 진심이야' },
  { min: 55, text: '나쁘지 않은데?' },
  { min: 35, text: '음, 한 번 더?' },
  { min: 0, text: '아직 멀었어' },
];

const METRIC_LABELS = {
  distance: '거리 안정성',
  db: '소리 크기',
  tremor: '떨림',
  velocity: '접근 속도',
};

const VIBE_LINES = [
  (v) => `기기 기분 ${(v * 3).toFixed(1)}단계 좋아짐`,
  (v) => `화면이 ${Math.round(v * 30)}분쯤 더 밝아진 기분`,
  (v) => `배터리도 살짝 더 행복해짐 (+${(v * 5).toFixed(1)}%)`,
  (v) => `오늘 너의 다정함 +${(v * 12).toFixed(0)}pt`,
  (v) => `옆에 있는 사람도 살짝 웃을 확률 ${(v * 80).toFixed(0)}%`,
];

function pickHeadline(score) {
  return HEADLINES.find((h) => score >= h.min)?.text ?? HEADLINES[HEADLINES.length - 1].text;
}

function sample(arr, n) {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function formatMetrics(result) {
  const tremor = Number((1 - result.distanceStability).toFixed(2));
  const velocity = Number((0.6 + result.distanceStability * 2.4).toFixed(1));
  return [
    { label: METRIC_LABELS.distance, value: result.distanceStability.toFixed(2) },
    { label: METRIC_LABELS.db, value: `${result.audioPeakDb.toFixed(1)} dB` },
    { label: METRIC_LABELS.tremor, value: tremor.toFixed(2) },
    { label: METRIC_LABELS.velocity, value: `${velocity.toFixed(1)} cm/s` },
  ];
}

function buildVibeLines(score) {
  const base = score / 100;
  const templates = sample(VIBE_LINES, 3);
  return templates.map((fn) => fn(0.02 + base * (0.8 + Math.random() * 0.4)));
}

function formatDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateReportId() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0');
}

export function generateReport(result) {
  const score = Math.round(result.sincerityScore);
  const headline = pickHeadline(score);
  const metrics = formatMetrics(result);
  const performance = buildVibeLines(score);
  const prescription = VIBES[result.personality] ?? VIBES.dependent;

  return {
    headline,
    score,
    reportId: generateReportId(),
    date: formatDate(),
    metrics,
    performance,
    prescription,
  };
}

export function renderReportBodyHTML(report) {
  const metricsRows = report.metrics
    .map(
      (m) =>
        `<div class="metric-row"><span class="metric-row__label">${m.label}</span><span class="metric-row__dots" aria-hidden="true"></span><span class="metric-row__value">${m.value}</span></div>`
    )
    .join('');

  const performanceItems = report.performance
    .map((line) => `<li class="perf-item">${line}</li>`)
    .join('');

  return `
    <section class="report-section report-section--metrics">
      <p class="caption">${report.headline}</p>
      <div class="metric-list">${metricsRows}</div>
    </section>
    <section class="report-section report-section--performance">
      <h3 class="report-section__title">덤으로</h3>
      <ul class="perf-list">${performanceItems}</ul>
    </section>
    <section class="report-section report-section--prescription">
      <h3 class="report-section__title">한 줄 평</h3>
      <blockquote class="prescription">${report.prescription}</blockquote>
    </section>
  `;
}
