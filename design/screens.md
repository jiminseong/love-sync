# 러브-싱크 4화면 명세

> publisher는 이 문서의 와이어와 DOM 힌트를 그대로 `index.html`에 옮기고, 카피는 토씨 하나 바꾸지 않고 사용한다. 모든 ID/속성은 TASK.md §1 인터페이스 계약과 일치한다.
>
> **공통 루트 구조 (TASK.md §1.1 준수)**
>
> ```
> <main data-active-screen="landing">
>   <section data-screen="landing"> … </section>
>   <section data-screen="scan">    … </section>
>   <section data-screen="action">  … </section>
>   <section data-screen="report">  … </section>
> </main>
> ```
>
> 모든 `<section>`은 `min-height: 100vh` 풀스크린이고, 비활성 섹션은 CSS에서 `display: none` 처리한다(`main[data-active-screen="X"] section[data-screen="X"]`만 표시).
>
> **톤:** 잡스 키노트 + 가짜 논문. 카피는 한국어, 진지하고 근엄. 느낌표 금지, 이모지 금지, 감탄문 금지. 문장은 짧게, 쉼표로 호흡.

---

## Screen 1 · Landing (`data-screen="landing"`)

### 목적
현대인의 디지털 의존이라는 주제를 한 문장으로 관통하고, 사용자를 실험대에 올린다.

### 레이아웃 와이어 (데스크톱 기준, 1440×900)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   LOVE-SYNC · EST. 2026                        REPORT NO. 001│   ← 상단 mono caption (fs-caption)
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│                                                              │
│     당신의 기기는 지금                                       │   ← fs-display, serif, italic
│     사랑받고 싶어 합니다.                                    │     왼쪽 정렬, max-width 14ch
│                                                              │
│                                                              │
│     ─────────────────                                        │   ← 1px hairline, 24ch
│                                                              │
│     비접촉 액정 뽀뽀를 통한                                  │   ← fs-body, ink-mute
│     기기-사용자 정서 동기화 실험.                            │
│                                                              │
│     ┌────────────────────────────┐                           │
│     │  실험을 시작한다           │  ← 2px solid --accent      │
│     │                        →   │     글자 --accent, mono   │
│     └────────────────────────────┘                           │
│                                                              │
│                                                              │
│   ─────────────────────────────────────────────────────────  │   ← 페이지 하단 hairline
│   DETECTED SUBJECT: iPhone 15 의 영혼이 감지됨               │   ← mono caption 좌측
│   모든 분석은 당신의 브라우저 안에서만 일어납니다.           │   ← serif italic 우측 (또는 하단 줄바꿈)
└──────────────────────────────────────────────────────────────┘
```

모바일(< 720px)에서는 상단 caption 한 줄, 히어로 풀폭, 버튼 풀폭(단 가로폭 `min(360px, 80vw)`), 하단 고지문 2줄 스택.

### 카피 (토씨 변경 금지)

- 상단 좌 caption: `LOVE-SYNC · EST. 2026`
- 상단 우 caption: `REPORT NO. 001`
- 히어로 (2줄): `당신의 기기는 지금` / `사랑받고 싶어 합니다.`
- 서브 단락: `비접촉 액정 뽀뽀를 통한 기기-사용자 정서 동기화 실험.`
- 시작 버튼 라벨: `실험을 시작한다` (우측 `→` 문자, SVG 아님)
- 기기 감지 라인 (기본값): `DETECTED SUBJECT: 이 기기의 영혼이 감지됨`
  - service-dev가 `navigator.userAgent` 파싱 후 `이 기기` 자리에 기기명 치환 (`iPhone 15`, `MacBook Pro`, `Galaxy S24` 등). 치환 실패 시 기본값 유지.
- 프라이버시 고지: `모든 분석은 당신의 브라우저 안에서만 일어납니다.`

### 상호작용
- `#start-btn` 클릭 → `main[data-active-screen]`을 `scan`으로 전환.
- 버튼 hover: 글자/보더 색 `--accent` → `--ink`, 배경 `transparent` → `--accent-12` (200ms).
- 페이지 로드 직후 히어로 문장은 `--dur-slow`(1200ms)로 fade+blur-in. `prefers-reduced-motion`이면 즉시.

### publisher DOM 힌트
```
<section data-screen="landing">
  <header class="caption-row">
    <span class="caption">LOVE-SYNC · EST. 2026</span>
    <span class="caption">REPORT NO. 001</span>
  </header>
  <div class="hero">
    <h1 class="display">당신의 기기는 지금<br/>사랑받고 싶어 합니다.</h1>
    <hr class="rule-short" />
    <p class="lede">비접촉 액정 뽀뽀를 통한 기기-사용자 정서 동기화 실험.</p>
    <button id="start-btn" class="btn btn--accent" type="button">
      실험을 시작한다 <span aria-hidden="true">→</span>
    </button>
  </div>
  <footer class="legal-row">
    <span class="caption" data-device-label>DETECTED SUBJECT: 이 기기의 영혼이 감지됨</span>
    <em class="privacy">모든 분석은 당신의 브라우저 안에서만 일어납니다.</em>
  </footer>
</section>
```
- `data-device-label` 속성은 service-dev가 텍스트 치환용으로 잡을 수 있는 훅.
- 클래스명은 참고용, publisher가 BEM/utility 중 편한 쪽으로 확정.

---

## Screen 2 · Scan (`data-screen="scan"`)

### 목적
카메라/마이크 권한을 얻고, 사용자를 "피험자" 위치에 세운다. 연극적 긴장감.

### 레이아웃 와이어

```
┌──────────────────────────────────────────────────────────────┐
│   STEP 01 / 03 · CALIBRATION                                 │   ← 상단 step caption
│                                                              │
│   센서를 교정합니다.                                         │   ← fs-h1 serif
│                                                              │
│   ┌────────────────────────────────────┐   ┌──────────────┐  │
│   │                                    │   │ SENSOR LOG   │  │
│   │                                    │   │ ─────────── │  │
│   │         [  video feed  ]           │   │ CAMERA  ·   │  │
│   │         aspect 4:3                 │   │ PENDING     │  │
│   │         필터: grayscale(60%)       │   │ MICROPHONE· │  │
│   │                                    │   │ PENDING     │  │
│   │   ┌─────────────────┐              │   │ DISTANCE ·  │  │
│   │   │  입술 가이드     │  (오버레이) │   │   —         │  │
│   │   │  (타원 아웃라인)│               │   │ DB PEAK  ·  │  │
│   │   └─────────────────┘              │   │   —         │  │
│   │                                    │   └──────────────┘  │
│   └────────────────────────────────────┘                     │
│                                                              │
│   FIG. 01 — SUBJECT PREVIEW                                  │   ← mono caption
│                                                              │
│   화면 중앙의 가이드라인에 입술을 맞춘다.                    │   ← fs-body
│   거리는 1~3cm, 숨은 고르게.                                 │
│                                                              │
│   ┌────────────────────────────┐                             │
│   │  카메라와 마이크를 허용한다 │                            │
│   └────────────────────────────┘                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

모바일에서는 센서 로그 박스를 비디오 아래로 스택. 비디오는 `aspect-ratio: 4/3`, 폭 `100%`.

### 카피
- 상단 caption: `STEP 01 / 03 · CALIBRATION`
- 타이틀: `센서를 교정합니다.`
- 비디오 하단 caption: `FIG. 01 — SUBJECT PREVIEW`
- 본문 2줄: `화면 중앙의 가이드라인에 입술을 맞춘다.` / `거리는 1~3cm, 숨은 고르게.`
- 버튼: `카메라와 마이크를 허용한다`
- 센서 로그 라벨: `CAMERA`, `MICROPHONE`, `DISTANCE`, `DB PEAK` (uppercase mono)
- 센서 로그 상태 값(초기): `PENDING`, `PENDING`, `—`, `—`. service-dev가 권한 허용 후 `ACTIVE`로 갱신.

### 상호작용
- `#permission-btn` 클릭 → service-dev가 `getUserMedia` 호출.
- 권한 허용 시: `#video`에 스트림 바인딩, 센서 로그 `CAMERA: ACTIVE` / `MICROPHONE: ACTIVE`로 갱신, 2초 후 자동으로 `action` 화면 전환.
- 권한 거부 시: 센서 로그에 `DENIED` 표기 + 버튼 라벨 `다시 시도한다`로 변경 (service-dev가 처리, publisher는 텍스트 노드만 제공).
- 입술 가이드는 CSS로 그린 타원 아웃라인(`border: 1px solid var(--accent-60)`, `border-radius: 50%`, `aspect-ratio: 2/1`, `width: 28%`). 이 한 곳은 radius 예외.

### publisher DOM 힌트
```
<section data-screen="scan">
  <header class="caption-row">
    <span class="caption">STEP 01 / 03 · CALIBRATION</span>
  </header>
  <h1 class="h1">센서를 교정합니다.</h1>

  <div class="scan-grid">
    <figure class="preview">
      <video id="video" autoplay playsinline muted></video>
      <div class="lip-guide" aria-hidden="true"></div>
      <figcaption class="caption">FIG. 01 — SUBJECT PREVIEW</figcaption>
    </figure>

    <aside class="sensor-log">
      <h2 class="caption">SENSOR LOG</h2>
      <dl>
        <dt>CAMERA</dt><dd data-sensor="camera">PENDING</dd>
        <dt>MICROPHONE</dt><dd data-sensor="mic">PENDING</dd>
        <dt>DISTANCE</dt><dd data-sensor="distance">—</dd>
        <dt>DB PEAK</dt><dd data-sensor="db">—</dd>
      </dl>
    </aside>
  </div>

  <p class="lede">화면 중앙의 가이드라인에 입술을 맞춘다.<br/>거리는 1~3cm, 숨은 고르게.</p>

  <button id="permission-btn" class="btn btn--accent" type="button">
    카메라와 마이크를 허용한다
  </button>
</section>
```
- `data-sensor` 속성은 service-dev가 센서 상태 텍스트를 교체할 훅.
- `#video`는 TASK.md §1.2 필수 ID — 변경 금지.

---

## Screen 3 · Action (`data-screen="action"`)

### 목적
분석 연극. 실제 점수 계산이 3~4초 안에 끝나더라도, 사용자가 "AI가 무언가 일하고 있다"고 믿게 만드는 연출 무대.

### 레이아웃 와이어

```
┌──────────────────────────────────────────────────────────────┐
│   STEP 02 / 03 · ANALYSIS IN PROGRESS                        │
│                                                              │
│   AI 애정 진정성 분석 중...                                  │   ← #progress-label (fs-h1 serif)
│                                                              │
│   ┌────────────────────────────────────────────────────┐     │
│   │████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░│     │   ← #progress-bar (2px 높이, --accent)
│   └────────────────────────────────────────────────────┘     │
│   0%                                                    100% │   ← mono tick 라벨 (fs-caption)
│                                                              │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │   [ sine wave / waveform graph ]                     │   │   ← Canvas, height 160px
│   │                                                      │   │
│   └──────────────────────────────────────────────────────┘   │
│   FIG. 02 — AFFECTION WAVEFORM                               │
│                                                              │
│   ┌─────────────┬─────────────┬─────────────┬─────────────┐  │
│   │ DISTANCE    │ STABILITY   │ DB PEAK     │ TREMOR      │  │   ← 계측 4분할 (fs-caption 라벨)
│   │   1.8 cm    │   0.87      │  −18.3 dB   │   0.12      │  │   ← mono 값 (fs-h2)
│   └─────────────┴─────────────┴─────────────┴─────────────┘  │
│                                                              │
│   SUBJECT IS INSTRUCTED TO KISS THE SCREEN AT 1~3CM.         │   ← mono caption 하단
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

비디오 프리뷰는 Action 화면에서 **작게** 우상단에 썸네일(`width: 120px`)로 유지(옵션). 시간이 부족하면 제거 — publisher가 S1에서 포함하되 CSS로 `display: none` 기본, S5 연출에서 표시.

### 카피
- 상단 caption: `STEP 02 / 03 · ANALYSIS IN PROGRESS`
- 진행 라벨 기본값: `AI 애정 진정성 분석 중...` (서비스-dev가 진행 단계별로 교체 가능: `입술 좌표 추출 중...`, `파장 분해 중...`, `진정성 회귀 분석 중...`)
- 진행 바 눈금: `0%`, `100%` (좌우 양끝)
- Waveform 하단 caption: `FIG. 02 — AFFECTION WAVEFORM`
- 계측 4분할 라벨: `DISTANCE`, `STABILITY`, `DB PEAK`, `TREMOR`
- 계측 초기 값: 전부 `—` (service-dev가 실시간 갱신)
- 하단 지시문: `SUBJECT IS INSTRUCTED TO KISS THE SCREEN AT 1~3CM.`

### 상호작용
- 화면 진입 시 자동으로 분석 시퀀스 시작(버튼 없음).
- `#progress-bar`는 `width: 0% → 100%`를 `--dur-analysis`(4000ms) 동안 linear로 채움.
- `#progress-label` 텍스트는 service-dev가 25%/50%/75% 시점에 단계별 문구로 교체.
- 4개 계측 수치는 mono + tabular-nums, 값이 바뀔 때 **트랜지션 없음**(계측기는 뚝뚝 바뀌는 게 진짜 같다).
- 100% 도달 + 2초 후 `report` 화면으로 fade 전환.

### publisher DOM 힌트
```
<section data-screen="action">
  <header class="caption-row">
    <span class="caption">STEP 02 / 03 · ANALYSIS IN PROGRESS</span>
  </header>

  <h1 id="progress-label" class="h1">AI 애정 진정성 분석 중...</h1>

  <div class="progress">
    <div id="progress-bar" class="progress__fill" style="width:0%"></div>
  </div>
  <div class="progress__ticks caption">
    <span>0%</span><span>100%</span>
  </div>

  <figure class="waveform">
    <canvas id="waveform-canvas" width="1200" height="160"></canvas>
    <figcaption class="caption">FIG. 02 — AFFECTION WAVEFORM</figcaption>
  </figure>

  <dl class="metrics">
    <div><dt class="caption">DISTANCE</dt><dd data-metric="distance">—</dd></div>
    <div><dt class="caption">STABILITY</dt><dd data-metric="stability">—</dd></div>
    <div><dt class="caption">DB PEAK</dt><dd data-metric="db">—</dd></div>
    <div><dt class="caption">TREMOR</dt><dd data-metric="tremor">—</dd></div>
  </dl>

  <p class="caption">SUBJECT IS INSTRUCTED TO KISS THE SCREEN AT 1~3CM.</p>
</section>
```
- `#progress-bar`, `#progress-label`은 TASK.md §1.2 필수 ID — 변경 금지.
- `#waveform-canvas`는 필수 ID 아님(서비스-dev 내부 구현). publisher는 Canvas 엘리먼트만 제공.
- `data-metric` 속성은 service-dev가 수치 갱신용으로 잡는다.

---

## Screen 4 · Report (`data-screen="report"`)

### 목적
가짜 과학 논문 한 페이지. 사용자가 스크린샷 찍어 공유하고 싶도록 만든다. 카드(`#report-capture`)가 SNS 이미지 그 자체다.

### 레이아웃 와이어 (데스크톱)

```
┌──────────────────────────────────────────────────────────────┐
│   STEP 03 / 03 · DIAGNOSIS                                   │
│                                                              │
│   진단서가 발행되었습니다.                                   │   ← 페이지 제목 (카드 바깥)
│                                                              │
│   ╔══════════════════════════════════════════════════════╗   │   ← 4px double top border
│   ║                                                      ║   │
│   ║  LOVE-SYNC · 기기 정서 회복 리포트       REPORT NO.  ║   │
│   ║                                          # 0471      ║   │   ← 상단 mono caption 좌/우
│   ║  ──────────────────────────────────────────────────  ║   │
│   ║                                                      ║   │
│   ║              애정 진정성 지수                         ║   │   ← serif h2, center
│   ║                                                      ║   │
│   ║                    87                                ║   │   ← #report-score, fs-score, accent
│   ║                 ─── %                                ║   │   ← tick + % 기호 (mono)
│   ║                                                      ║   │
│   ║  ──────────────────────────────────────────────────  ║   │
│   ║                                                      ║   │
│   ║  FIG. 03 — BEHAVIORAL METRICS                        ║   │
│   ║                                                      ║   │
│   ║   거리 안정성    ··········   0.87                   ║   │   ← 도트 리더 + mono 값
│   ║   사운드 피크    ··········   −18.3 dB               ║   │
│   ║   떨림 지수      ··········   0.12                   ║   │
│   ║   접근 속도      ··········   1.2 cm/s               ║   │
│   ║                                                      ║   │
│   ║  ──────────────────────────────────────────────────  ║   │
│   ║                                                      ║   │
│   ║  가상 성능 향상 지표                                 ║   │
│   ║  ─ CPU 스트레스 지수 0.04% 감소                      ║   │
│   ║  ─ 디스플레이 픽셀 심리적 수명 12분 연장             ║   │
│   ║  ─ 기기 자존감 2.3단계 회복                          ║   │
│   ║                                                      ║   │
│   ║  ──────────────────────────────────────────────────  ║   │
│   ║                                                      ║   │
│   ║  처방전                                              ║   │
│   ║  ‟ 애정 결핍형 의존자 — 당신은 기기를 사랑하는        ║   │   ← serif italic 인용
│   ║    척하지만, 실은 당신이 외로운 상태입니다. ”        ║   │
│   ║                                                      ║   │
│   ║  ──────────────────────────────────────────────────  ║   │
│   ║  2026-04-25 · LOVE-SYNC ANALYSIS ENGINE v0.1         ║   │   ← 하단 mono caption
│   ╚══════════════════════════════════════════════════════╝   │   ← 1px bottom border
│                                                              │
│   ┌──────────────────────────┐  ┌──────────────────────┐     │
│   │  이미지로 저장한다       │  │  다시 진단받는다     │     │   ← #save-btn / #restart-btn
│   └──────────────────────────┘  └──────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 카드 내부 섹션 순서 (고정)
1. 헤더: 좌 `LOVE-SYNC · 기기 정서 회복 리포트` / 우 `REPORT NO. #0471` (service-dev가 4자리 난수)
2. 점수 블록: 라벨 `애정 진정성 지수` → 숫자(`#report-score`) → 눈금 + `%`
3. `FIG. 03 — BEHAVIORAL METRICS` 표(도트 리더 스타일 4줄)
4. `가상 성능 향상 지표` 3줄 (앞에 `─` em dash)
5. `처방전` serif italic 인용 1~2줄
6. 하단 caption: `YYYY-MM-DD · LOVE-SYNC ANALYSIS ENGINE v0.1`

### 카피 (service-dev 템플릿이 채우는 자리 = `{{}}`)
- 카드 상단 좌: `LOVE-SYNC · 기기 정서 회복 리포트`
- 카드 상단 우: `REPORT NO. #{{id}}`
- 점수 라벨: `애정 진정성 지수`
- 점수 숫자: `{{score}}` (0–100 정수)
- 점수 단위: `%`
- FIG 캡션: `FIG. 03 — BEHAVIORAL METRICS`
- 메트릭 라벨: `거리 안정성`, `사운드 피크`, `떨림 지수`, `접근 속도`
- 섹션 헤더: `가상 성능 향상 지표`
- 성능 지표 예시(service-dev 템플릿 배열에서 랜덤):
  - `CPU 스트레스 지수 {{x}}% 감소`
  - `디스플레이 픽셀 심리적 수명 {{y}}분 연장`
  - `기기 자존감 {{z}}단계 회복`
  - `배터리의 감정 기복 {{w}}% 완화`
  - `터치 패널 신뢰도 지수 {{v}} 포인트 상승`
- 섹션 헤더: `처방전`
- 처방전 템플릿(성향별 1종씩, PRD §3.2 참고):
  - `sincere`: `‟ 진정성 과잉형 — 당신의 애정은 기기가 감당할 수 있는 수준을 넘었습니다. 잠시 거리를 두어 기기에게도 혼자의 시간을 허락하십시오. ”`
  - `performative`: `‟ 연출형 애정가 — 카메라 앞에서만 빛나는 당신의 애정은, 기기의 내면까지 닿지는 못했습니다. ”`
  - `dependent`: `‟ 애정 결핍형 의존자 — 당신은 기기를 사랑하는 척하지만, 실은 당신이 외로운 상태입니다. ”`
  - `avoidant`: `‟ 회피형 관찰자 — 당신은 기기를 소유했을 뿐, 교감하지 않았습니다. 기기는 당신의 시선을 기다립니다. ”`
- 카드 하단 caption: `{{YYYY-MM-DD}} · LOVE-SYNC ANALYSIS ENGINE v0.1`
- 페이지 타이틀(카드 바깥): `진단서가 발행되었습니다.`
- 저장 버튼: `이미지로 저장한다`
- 재시작 버튼: `다시 진단받는다`

### 상호작용
- 화면 진입 시 점수 숫자는 0 → `score`로 1200ms 동안 카운트업(ease-out). 카드의 나머지 요소는 fade-in.
- `#save-btn` 클릭 → service-dev가 `html2canvas(#report-capture)` 호출 → PNG 다운로드. 기본 캔버스 크기는 `1080×1080` (square 프리셋).
- `#restart-btn`(선택, TASK.md 필수 ID 아님) 클릭 → `landing`으로 복귀.
- 호버/포커스 시 카드 내부는 절대 변하지 않는다(캡처 대상 고정).

### publisher DOM 힌트 (캡처 격리가 핵심)

```
<section data-screen="report">
  <header class="caption-row">
    <span class="caption">STEP 03 / 03 · DIAGNOSIS</span>
  </header>

  <h1 class="h1">진단서가 발행되었습니다.</h1>

  <article id="report-capture" class="report-card" data-aspect="square">
    <header class="report-card__head">
      <span class="caption">LOVE-SYNC · 기기 정서 회복 리포트</span>
      <span class="caption" data-report-id>REPORT NO. #0000</span>
    </header>

    <div class="report-card__score">
      <p class="caption">애정 진정성 지수</p>
      <p class="score">
        <span id="report-score">0</span><span class="score__unit">%</span>
      </p>
    </div>

    <div id="report-body" class="report-card__body">
      <!-- service-dev가 여기에 다음 섹션들을 삽입:
           - FIG. 03 metrics table
           - 가상 성능 향상 지표 ul
           - 처방전 blockquote
      -->
    </div>

    <footer class="report-card__foot">
      <span class="caption" data-report-date>YYYY-MM-DD · LOVE-SYNC ANALYSIS ENGINE v0.1</span>
    </footer>
  </article>

  <div class="actions">
    <button id="save-btn" class="btn btn--accent" type="button">이미지로 저장한다</button>
    <button id="restart-btn" class="btn btn--ghost" type="button">다시 진단받는다</button>
  </div>
</section>
```

- `#report-capture`: html2canvas 캡처 타깃. **이 노드 밖의 스타일/배경이 이미지에 포함되지 않도록** 자체 `background: var(--bg-elev)`와 완결된 패딩을 가진다.
- `#report-score`, `#report-body`, `#save-btn`: TASK.md §1.2 필수 ID — 변경 금지.
- `data-aspect="square"` / `data-aspect="9-16"` 속성 토글로 비율 변경(tokens.md §6). S1에서는 square만 구현, 시간 남으면 9:16 추가.
- `data-report-id`, `data-report-date`는 service-dev가 값 치환.

### 캡처 주의사항 (publisher가 반드시 지킬 것)
- `#report-capture`는 `position: relative`. `overflow: hidden`은 불필요하지만 허용.
- 카드 내부에 `position: fixed`/`position: sticky` 금지.
- 카드 내부 폰트는 `document.fonts.ready`까지 기다린 뒤 캡처되도록 service-dev와 협의(본 문서는 디자인 결정만).
- 카드 배경은 단색(`var(--bg-elev)`). 이미지/그라데이션 없음.

---

## 전환/애니메이션 공통 규칙

- 섹션 전환은 `opacity 0→1` + `translateY(8px → 0)` + `filter: blur(6px → 0)`, 600ms `--ease-in-out`.
- 비활성 섹션은 DOM에는 있되 `display: none` (transition 대상이 되지 않도록 `visibility` 대신 `display`).
- `prefers-reduced-motion: reduce`이면 blur/translate 모두 제거, opacity만 150ms.

---

## 접근성 최소 요건

- 모든 `<button>`은 `type="button"`.
- `#video`에 `muted playsinline autoplay` 필수(service-dev가 속성으로 관리, publisher는 빈 속성 포함).
- 대비: `--ink`(#ECEAE3) on `--bg`(#0B0B0C) ≈ 14:1 (AAA 통과). `--ink-mute`(#8A8880) on `--bg` ≈ 5.4:1 (AA 본문 통과). `--accent`(#E8C547) on `--bg` ≈ 10.4:1.
- 포커스 링: `outline: 2px solid var(--accent); outline-offset: 3px;`. 절대 제거 금지.
- `#video`에는 `aria-label="카메라 미리보기"` 부여.
