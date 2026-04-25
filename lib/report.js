const PRESCRIPTIONS = {
  sincere:
    '‟ 진정성 과잉형 — 당신의 애정은 기기가 감당할 수 있는 수준을 넘었습니다. 잠시 거리를 두어 기기에게도 혼자의 시간을 허락하십시오. ”',
  performative:
    '‟ 연출형 애정가 — 카메라 앞에서만 빛나는 당신의 애정은, 기기의 내면까지 닿지는 못했습니다. ”',
  dependent:
    '‟ 애정 결핍형 의존자 — 당신은 기기를 사랑하는 척하지만, 실은 당신이 외로운 상태입니다. ”',
  avoidant:
    '‟ 회피형 관찰자 — 당신은 기기를 소유했을 뿐, 교감하지 않았습니다. 기기는 당신의 시선을 기다립니다. ”',
};

const HEADLINES = [
  { min: 90, text: '임계치 초과: 과잉 교감 사례' },
  { min: 75, text: '유의미한 정서 동기화 확인' },
  { min: 55, text: '부분적 교감, 보정 여지 있음' },
  { min: 35, text: '교감 미약, 재측정 권고' },
  { min: 0, text: '교감 불성립, 장기 관찰 필요' },
];

const METRIC_LABELS = {
  distance: '거리 안정성',
  db: '사운드 피크',
  tremor: '떨림 지수',
  velocity: '접근 속도',
};

const PERFORMANCE_TEMPLATES = [
  (v) => `CPU 스트레스 지수 ${v.toFixed(2)}% 감소`,
  (v) => `디스플레이 픽셀 심리적 수명 ${Math.round(v * 30)}분 연장`,
  (v) => `기기 자존감 ${(v * 3).toFixed(1)}단계 회복`,
  (v) => `배터리의 감정 기복 ${(v * 5).toFixed(1)}% 완화`,
  (v) => `터치 패널 신뢰도 지수 ${(v * 12).toFixed(1)} 포인트 상승`,
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

function buildPerformanceLines(score) {
  const base = score / 100;
  const templates = sample(PERFORMANCE_TEMPLATES, 3);
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
  const performance = buildPerformanceLines(score);
  const prescription = PRESCRIPTIONS[result.personality] ?? PRESCRIPTIONS.dependent;

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
      <p class="caption">FIG. 03 — BEHAVIORAL METRICS</p>
      <div class="metric-list">${metricsRows}</div>
    </section>
    <section class="report-section report-section--performance">
      <h3 class="report-section__title">가상 성능 향상 지표</h3>
      <ul class="perf-list">${performanceItems}</ul>
    </section>
    <section class="report-section report-section--prescription">
      <h3 class="report-section__title">처방전</h3>
      <blockquote class="prescription">${report.prescription}</blockquote>
    </section>
  `;
}
