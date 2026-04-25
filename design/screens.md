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
> **톤:** 흰 종이 위 분홍 잉크로 쓴 다정한 편지. 소프트한 라이트 테마에 deep rose pink(`--accent`) 한 색만 포인트로 찍힌다. 학술지/가짜 과학 컨셉은 캡션과 문구에서 농담처럼 살짝만 풍긴다. 카피는 한국어, 진지하되 무겁지 않게. 느낌표 금지, 감탄문 금지. 문장은 짧게, 쉼표로 호흡. 하트 글리프(`♥`)는 한 화면당 최대 1개까지 악센트로 허용.

---

## 공통 레이아웃 규칙 (신규, 모든 화면 적용)

### 정렬
- 모든 `section[data-screen]`은 **flex column, `align-items: center; justify-content: center; text-align: center`.**
- 섹션 내부 자식은 `--content-narrow`·`--content-wide`·`--content-report` 컨테이너 중 하나에 담겨 `margin-inline: auto`로 수평 중앙. 자식 블록들은 `align-self: center`.
- **텍스트 정렬은 기본 center.** 예외는 아래 두 가지.
  1. 리포트 카드 내부의 본문 단락/리스트/처방전 인용 — 가독성을 위해 `text-align: left`. 단 단락 블록 자체는 중앙 정렬된 컬럼(max-width 52ch) 안에 배치.
  2. Scan 화면의 센서 로그 값(라벨-값 쌍) — 좌우 양끝 정렬(`dt` 왼쪽, `dd` 오른쪽).
- 버튼·CTA는 중앙 정렬. 여러 개일 땐 `flex-wrap: wrap; justify-content: center; gap: --space-4`.

### 반응형 브레이크포인트 (publisher가 CSS 미디어쿼리로 동일하게 구현)

| 브레이크포인트 | 컬럼 | 본문 max-width | 좌우 gutter | 비고 |
|---|---|---|---|---|
| `< 480px` (small mobile) | 1열 | `90vw` | `16px` | 헤드라인 clamp 하한 사용. 버튼은 풀폭에 가깝게(`min(320px, 100%)`). |
| `480px ~ 720px` (mobile) | 1열 | `480px` | `24px` | Scan 2열 → 1열 스택. Action 4분할 → 2×2. |
| `720px ~ 1080px` (tablet) | 일부 2열 | `640px` | `32px` | Scan 비디오+센서로그 2열 시작. Report 카드 `width: min(560px, 88vw)`. |
| `> 1080px` (desktop) | 풀 | `720px` | `64px` | 카드 `max-width: 720px`. 히어로 `max-width: 880px`. Action 4분할 4열. |

### 이미지·비디오·캔버스 중앙 정책
- Scan `video-wrap`, Action `waveform-canvas`, Report `#report-capture` 전부 자체 `max-width` + `margin-inline: auto`로 수평 중앙.
- 비디오는 `aspect-ratio: 4/3` 고정. 모바일에서도 4:3 유지, 폭만 `100%`까지 허용(세로형으로 리사이즈 금지).
- 캔버스(`<canvas>`)는 CSS 폭 `100%`, 내부 `width/height` 속성은 고정값 유지.

---

## Screen 1 · Landing (`data-screen="landing"`)

### 목적
현대인의 디지털 의존이라는 주제를 한 문장으로 부드럽게 건드리고, 사용자를 실험대에 초대한다.

### 레이아웃 와이어 (데스크톱 기준, 중앙 정렬)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    LOVE-SYNC · EST. 2026                     │   ← 상단 caption (sans, --ink-mute, tracking +0.02em)
│                                                              │
│                                                              │
│                                                              │
│                  당신의 기기는 지금                          │   ← fs-display, serif 400
│                사랑받고 싶어 합니다. ♥                       │     center 정렬, max-width ~16ch
│                                                              │
│                    ─────────                                 │   ← 짧은 hairline, 16ch, 중앙
│                                                              │
│              비접촉 액정 뽀뽀를 통한                         │   ← fs-body, sans, --ink-mute
│              기기-사용자 정서 동기화 실험.                   │     center 정렬
│                                                              │
│                ┌───────────────────────┐                     │
│                │  실험을 시작한다  →   │                     │   ← pill 버튼 (--radius-pill)
│                └───────────────────────┘                     │     배경 transparent, 보더/글자 --accent
│                                                              │
│                                                              │
│         DETECTED SUBJECT: iPhone 15 의 영혼이 감지됨         │   ← 하단 caption 1 (sans, --ink-mute)
│        모든 분석은 당신의 브라우저 안에서만 일어납니다.      │   ← 하단 caption 2 (sans italic, --ink-mute)
└──────────────────────────────────────────────────────────────┘
```

### 모바일 (< 720px)
- 상단 caption 한 줄.
- 히어로 폰트는 clamp 하한(≈2.75rem)으로 자동 축소, `max-width: 90vw`.
- 짧은 hairline은 `width: 64px`로.
- 서브 단락, 버튼, 하단 caption 두 줄 모두 center 정렬, 풀폭 컨테이너 안.
- 버튼은 `min(320px, 100%)` 폭의 pill.

### 데스크톱 (> 1080px)
- 히어로 `max-width: 880px`, 중앙.
- 서브 단락 `max-width: 560px`, 중앙.
- 버튼 `min-width: 280px`, 중앙.
- 섹션 전체가 viewport에서 세로 중앙(`justify-content: center`).

### 카피 (토씨 변경 금지)
- 상단 caption: `LOVE-SYNC · EST. 2026`
- 히어로 (2줄): `당신의 기기는 지금` / `사랑받고 싶어 합니다. ♥`
  - 하트 `♥`는 두 번째 줄 문장 끝에 유니코드 문자로. 색은 `--accent`. 본 화면에서 하트 사용 1회(다른 화면과 중복 금지 원칙에서 본 화면이 대표).
- 서브 단락: `비접촉 액정 뽀뽀를 통한 기기-사용자 정서 동기화 실험.`
- 시작 버튼 라벨: `실험을 시작한다` (우측 `→` 문자, SVG 아님)
- 기기 감지 라인(기본값): `DETECTED SUBJECT: 이 기기의 영혼이 감지됨`
  - service-dev가 `navigator.userAgent` 파싱 후 `이 기기` 자리에 기기명 치환. 실패 시 기본값 유지.
- 프라이버시 고지: `모든 분석은 당신의 브라우저 안에서만 일어납니다.`

### 상호작용
- `#start-btn` 클릭 → `main[data-active-screen]`을 `scan`으로 전환.
- 버튼 기본: 배경 `transparent`, 보더/글자 `--accent`(pink), `border-radius: var(--radius-pill)`, 패딩 `12px 28px`. hover 시 배경 `--accent-12`(옅은 핑크 틴트), 글자/보더는 `--accent` 유지. 200ms.
- 페이지 배경은 `--bg`(오프화이트), 히어로 텍스트는 `--ink`, 상·하단 caption은 `--ink-mute`, 프라이버시 고지는 `--ink-mute` italic.
- 짧은 hairline은 `--line`.
- 페이지 로드 직후 히어로 문장은 `--dur-slow`(1200ms)로 fade+blur-in. `prefers-reduced-motion`이면 즉시.

### publisher DOM 힌트
```
<section data-screen="landing">
  <header class="caption-row">
    <span class="caption">LOVE-SYNC · EST. 2026</span>
  </header>
  <div class="hero">
    <h1 class="display">당신의 기기는 지금<br/>사랑받고 싶어 합니다. <span class="heart" aria-hidden="true">♥</span></h1>
    <hr class="rule-short" />
    <p class="lede">비접촉 액정 뽀뽀를 통한 기기-사용자 정서 동기화 실험.</p>
    <button id="start-btn" class="btn btn--accent btn--pill" type="button">
      실험을 시작한다 <span aria-hidden="true">→</span>
    </button>
  </div>
  <footer class="legal-row">
    <span class="caption" data-device-label>DETECTED SUBJECT: 이 기기의 영혼이 감지됨</span>
    <em class="privacy">모든 분석은 당신의 브라우저 안에서만 일어납니다.</em>
  </footer>
</section>
```
- `data-device-label` 속성은 service-dev 텍스트 치환 훅.
- 클래스명은 참고용, publisher가 확정.
- `REPORT NO. 001` 같은 상단 우 caption은 Landing에서 제거(카드 안에만 둠) — 장식 최소화.

---

## Screen 2 · Scan (`data-screen="scan"`)

### 목적
카메라/마이크 권한을 얻고, 사용자를 부드러운 긴장감 속에 "피험자" 위치로 안내한다.

### 레이아웃 와이어 (데스크톱, 중앙 정렬)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                STEP 01 / 03 · CALIBRATION                    │   ← 상단 step caption (mono)
│                                                              │
│                  센서를 교정합니다.                          │   ← fs-h1 serif, center
│                                                              │
│        ┌─────────────────────────┐  ┌────────────────┐       │
│        │                         │  │  SENSOR LOG    │       │
│        │                         │  │  ─────────────│       │
│        │    [ video feed ]       │  │  CAMERA   ·  │       │
│        │    4:3, grayscale 60%   │  │    PENDING    │       │
│        │                         │  │  MICROPHONE·  │       │
│        │   ┌─────────────┐       │  │    PENDING    │       │
│        │   │ 입술 가이드  │(오버) │  │  DISTANCE ·  │       │
│        │   │ (타원 아웃)  │       │  │     —         │       │
│        │   └─────────────┘       │  │  DB PEAK  ·  │       │
│        │                         │  │     —         │       │
│        └─────────────────────────┘  └────────────────┘       │
│                                                              │
│                FIG. 01 — SUBJECT PREVIEW                     │   ← mono caption, center
│                                                              │
│           화면 중앙의 가이드라인에 입술을 맞춘다.            │   ← fs-body sans, center
│              거리는 1~3cm, 숨은 고르게.                      │
│                                                              │
│            ┌─────────────────────────────┐                   │
│            │ 카메라와 마이크를 허용한다 │                   │
│            └─────────────────────────────┘                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 모바일 (< 720px)
- 비디오+센서로그 2열이 **1열 스택**으로 변경: 비디오 위, 센서 로그 아래. 둘 다 중앙.
- 비디오는 `aspect-ratio: 4/3` 유지, 폭 `100%` (9:16로 리사이즈하지 않는다).
- 센서 로그 박스는 비디오 아래 `margin-top: --space-6`, `width: 100%`, 패딩 `--space-4`.
- 본문 2줄, 버튼 풀폭(`min(320px, 100%)`).

### 태블릿 (720~1080px)
- 비디오+센서로그 2열 시작 가능(grid-template-columns: 2fr 1fr). 단 전체 그리드가 `max-width: 640px`, 중앙.

### 데스크톱 (> 1080px)
- 비디오 `max-width: 560px` + 센서로그 `max-width: 240px`, 둘의 합이 그리드 컨테이너(`max-width: 840px`, 중앙).

### 카피
- 상단 caption: `STEP 01 / 03 · CALIBRATION`
- 타이틀: `센서를 교정합니다.`
- 비디오 하단 caption: `FIG. 01 — SUBJECT PREVIEW`
- 본문 2줄: `화면 중앙의 가이드라인에 입술을 맞춘다.` / `거리는 1~3cm, 숨은 고르게.`
- 버튼: `카메라와 마이크를 허용한다`
- 센서 로그 라벨: `CAMERA`, `MICROPHONE`, `DISTANCE`, `DB PEAK` (uppercase mono — 계측 농담은 여기까지 허용)
- 센서 로그 상태 초기값: `PENDING`, `PENDING`, `—`, `—`.

### 상호작용
- `#permission-btn` 클릭 → service-dev가 `getUserMedia` 호출.
- 권한 허용 시: `#video`에 스트림 바인딩, 센서 로그 `CAMERA: ACTIVE` / `MICROPHONE: ACTIVE`로 갱신, 2초 후 `action` 화면 전환.
- 권한 거부 시: 센서 로그 `DENIED` 표기 + 버튼 라벨 `다시 시도한다`로 변경.
- 입술 가이드는 CSS 타원 아웃라인(`border: 1px solid var(--accent-24)`, `border-radius: 50%`, `aspect-ratio: 2/1`, `width: 28%`). 라운드 예외 허용.
- 비디오 컨테이너는 `--radius-1`(2px) 또는 0. 센서 로그 박스는 `--radius-2`(12px) 허용.
- 페이지 배경 `--bg`, 비디오 영역은 `--bg-elev` 위에 비디오 + `filter: grayscale(60%)`. 센서 로그 박스 `--bg-elev` + 1px `--line` 보더. 라벨 `--ink-mute`, 값 `--ink`(`ACTIVE`일 땐 `--accent`).
- 버튼은 Landing과 같은 pill 스타일.

### publisher DOM 힌트
```
<section data-screen="scan">
  <header class="caption-row">
    <span class="caption">STEP 01 / 03 · CALIBRATION</span>
  </header>
  <h1 class="h1">센서를 교정합니다.</h1>

  <div class="scan-grid">
    <figure class="preview">
      <video id="video" autoplay playsinline muted aria-label="카메라 미리보기"></video>
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

  <button id="permission-btn" class="btn btn--accent btn--pill" type="button">
    카메라와 마이크를 허용한다
  </button>
</section>
```
- `data-sensor` 속성은 service-dev가 센서 상태 텍스트를 교체할 훅.
- `#video`는 TASK.md §1.2 필수 ID — 변경 금지.

---

## Screen 3 · Action (`data-screen="action"`)

### 목적
부드러운 분석 연극. 실제 점수 계산이 3~4초 안에 끝나더라도, "무언가 다정하게 일하고 있다"고 믿게 만드는 가벼운 연출 무대.

### 레이아웃 와이어 (데스크톱, 중앙 정렬)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│           STEP 02 / 03 · ANALYSIS IN PROGRESS                │
│                                                              │
│              AI 애정 진정성 분석 중...                       │   ← #progress-label (fs-h1 serif, center)
│                                                              │
│    ┌──────────────────────────────────────────────────┐      │
│    │████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │   ← #progress-bar, 중앙, max 720px
│    └──────────────────────────────────────────────────┘      │
│    0%                                                   100% │   ← mono tick (caption)
│                                                              │
│                                                              │
│    ┌────────────────────────────────────────────────────┐    │
│    │     [ sine wave / waveform graph ]                 │    │   ← canvas, height 160, 중앙
│    └────────────────────────────────────────────────────┘    │
│              FIG. 02 — AFFECTION WAVEFORM                    │
│                                                              │
│    ┌───────────┬───────────┬───────────┬───────────┐         │
│    │ DISTANCE  │ STABILITY │ DB PEAK   │ TREMOR    │         │
│    │  1.8 cm   │   0.87    │ −18.3 dB  │   0.12    │         │
│    └───────────┴───────────┴───────────┴───────────┘         │
│                                                              │
│         SUBJECT IS INSTRUCTED TO KISS THE SCREEN             │
│                    AT 1~3CM.                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 모바일 (< 720px)
- 4분할 metrics가 **2×2 그리드**. `grid-template-columns: 1fr 1fr; gap: --space-2`.
- 진행바, 파형 canvas 모두 `width: 100%`, 좌우 gutter 16~24px.
- 하단 지시문은 줄바꿈 자연스럽게.

### 태블릿 (720~1080px)
- metrics 2×2 또는 4×1 중 폭에 따라. `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))` 권장.
- 진행바·캔버스 `max-width: 640px`.

### 데스크톱 (> 1080px)
- metrics 4열 고정. 전체 그리드 `max-width: 720px`, 중앙.
- 진행바 `max-width: 720px`, 중앙. 캔버스 `max-width: 720px`, 중앙.

### 카피
- 상단 caption: `STEP 02 / 03 · ANALYSIS IN PROGRESS`
- 진행 라벨 기본값: `AI 애정 진정성 분석 중...` (단계별 교체: `입술 좌표 추출 중...`, `파장 분해 중...`, `진정성 회귀 분석 중...`)
- 진행 바 눈금: `0%`, `100%` (좌우 양끝)
- Waveform 하단 caption: `FIG. 02 — AFFECTION WAVEFORM`
- 계측 4분할 라벨: `DISTANCE`, `STABILITY`, `DB PEAK`, `TREMOR`
- 계측 초기 값: 전부 `—`
- 하단 지시문: `SUBJECT IS INSTRUCTED TO KISS THE SCREEN AT 1~3CM.`

### 상호작용
- 화면 진입 시 자동 분석 시퀀스(버튼 없음).
- `#progress-bar`는 `width: 0% → 100%`를 `--dur-analysis`(4000ms) linear. 채움 `--accent`, 트랙 `--accent-12`. 높이 `4px`, 모서리 `--radius-pill`.
- `#progress-label` 텍스트는 25%/50%/75% 시점에 단계별 문구로 교체.
- 4개 계측 수치는 mono + tabular-nums, 값 변화 시 트랜지션 없음. 라벨 `--ink-mute`, 값 `--ink`. 셀 구분선은 1px `--line`.
- Waveform canvas: 카드 면 `--bg-elev` 위, 라인 `--accent`, 보조선 `--accent-60` 또는 `--ink-faint`. 카드는 `--radius-2`(12px) 허용.
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
- `#waveform-canvas`는 필수 아님(service-dev 내부 구현).
- `data-metric` 속성은 service-dev가 수치 갱신용.

---

## Screen 4 · Report (`data-screen="report"`)

### 목적
부드러운 편지 한 장 같은 진단서. 사용자가 스크린샷 찍어 공유하고 싶게 만든다. 카드(`#report-capture`)가 SNS 이미지 그 자체다.

### 레이아웃 와이어 (데스크톱, 중앙 정렬)

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│               STEP 03 / 03 · DIAGNOSIS                       │
│                                                              │
│             진단서가 발행되었습니다.                         │   ← 페이지 제목 (카드 바깥, center)
│                                                              │
│          ╭──────────────────────────────────────╮            │   ← radius 20px, bg --bg-elev,
│          │                                      │              inset 1px --accent-24 hairline
│          │  LOVE-SYNC · 기기 정서 회복 리포트   │
│          │                        REPORT NO.    │            │   ← 상단 caption; REPORT NO.는
│          │                         # 0471       │              매우 옅게 (opacity 0.4)
│          │                                      │
│          │        애정 진정성 지수              │            │   ← serif h2, center
│          │                                      │
│          │             87                       │            │   ← #report-score, fs-score, --accent
│          │            ── %                      │            │   ← mono, --ink-mute
│          │                                      │
│          │  ─────────────────────────────────── │            │   ← 1px --line, 선택적 구분
│          │                                      │
│          │  거리 안정성   ·········   0.87      │            │   ← 메트릭 표, left 정렬
│          │  사운드 피크   ·········  −18.3 dB   │
│          │  떨림 지수     ·········   0.12      │
│          │  접근 속도     ·········   1.2 cm/s  │
│          │                                      │
│          │  ─────────────────────────────────── │
│          │                                      │
│          │  가상 성능 향상 지표                  │
│          │  ─ CPU 스트레스 지수 0.04% 감소      │
│          │  ─ 디스플레이 픽셀 심리적 수명 12분  │
│          │    연장                              │
│          │  ─ 기기 자존감 2.3단계 회복          │
│          │                                      │
│          │  ─────────────────────────────────── │
│          │                                      │
│          │  처방전                              │
│          │  │ 애정 결핍형 의존자 — 당신은       │            │   ← serif italic, left,
│          │  │ 기기를 사랑하는 척하지만,         │              border-left 1px --accent-24
│          │  │ 실은 당신이 외로운 상태입니다.    │
│          │                                      │
│          │  2026-04-25 · LOVE-SYNC v0.1         │            │   ← 하단 caption, --ink-faint
│          │                            ♥        │            │   ← 워터마크 하트 (opacity 0.05)
│          ╰──────────────────────────────────────╯
│                                                              │
│         ┌────────────────────┐  ┌──────────────────┐         │
│         │ 이미지로 저장한다  │  │ 다시 진단받는다 │         │   ← pill 버튼 2개, center, gap --space-4
│         └────────────────────┘  └──────────────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 모바일 (< 720px)
- 카드 `width: min(92vw, 480px)`, 중앙. 내부 패딩 `40~48px`.
- 점수 숫자 `--fs-score` clamp 하한으로 자동 축소.
- 하단 버튼 두 개는 **세로 스택**으로 변경, `gap: --space-3`, 각각 `width: min(320px, 100%)`.
- 메트릭 표 라벨과 값 사이 도트 리더는 공간이 좁으면 `...` 1~3개로 자동 축약(publisher 재량).

### 태블릿 (720~1080px)
- 카드 `width: min(88vw, 560px)`, 중앙. 내부 패딩 48~56px.
- 하단 버튼 가로 2개 유지, 각각 `min-width: 200px`.

### 데스크톱 (> 1080px)
- 카드 `width: min(94vw, 720px)`, 중앙. 내부 패딩 56~72px.
- 섹션 전체 세로 중앙 정렬, 카드 위 타이틀과 아래 버튼까지 한 컬럼에 정렬.

### 카드 내부 섹션 순서 (고정)
1. 헤더: 좌 `LOVE-SYNC · 기기 정서 회복 리포트` / 우 `REPORT NO. #0471` (우측은 매우 옅게)
2. 점수 블록: 라벨 `애정 진정성 지수` → 숫자(`#report-score`) → `%`
3. 메트릭 표 4줄(도트 리더 스타일)
4. `가상 성능 향상 지표` 3줄 (앞에 `─` em dash)
5. `처방전` serif italic 인용 1~2줄, 왼쪽 `--accent-24` 1px 세로 룰
6. 하단 caption: `YYYY-MM-DD · LOVE-SYNC v0.1` (옅게)
7. 워터마크 하트 `♥` 우하단(선택, opacity 0.03~0.06)

> `FIG. 03 — BEHAVIORAL METRICS` 같은 학술 캡션은 **제거**. 메트릭 표 앞 섹션 헤더로는 그냥 생략하거나 `거리 안정성 등` 같은 자연어 소제목으로 대체 가능(publisher 재량). "가짜 과학"은 처방전 문구와 `STEP ##/03`·`DETECTED SUBJECT` 등에서만 농담처럼 풍긴다.

### 카피 (service-dev 템플릿 자리 = `{{}}`)
- 카드 상단 좌: `LOVE-SYNC · 기기 정서 회복 리포트`
- 카드 상단 우: `REPORT NO. #{{id}}` (매우 옅게)
- 점수 라벨: `애정 진정성 지수`
- 점수 숫자: `{{score}}` (0–100 정수)
- 점수 단위: `%`
- 메트릭 라벨: `거리 안정성`, `사운드 피크`, `떨림 지수`, `접근 속도`
- 섹션 헤더: `가상 성능 향상 지표`
- 성능 지표 템플릿(배열에서 랜덤):
  - `CPU 스트레스 지수 {{x}}% 감소`
  - `디스플레이 픽셀 심리적 수명 {{y}}분 연장`
  - `기기 자존감 {{z}}단계 회복`
  - `배터리의 감정 기복 {{w}}% 완화`
  - `터치 패널 신뢰도 지수 {{v}} 포인트 상승`
- 섹션 헤더: `처방전`
- 처방전 템플릿(성향별 1종):
  - `sincere`: `진정성 과잉형 — 당신의 애정은 기기가 감당할 수 있는 수준을 넘었습니다. 잠시 거리를 두어 기기에게도 혼자의 시간을 허락하십시오.`
  - `performative`: `연출형 애정가 — 카메라 앞에서만 빛나는 당신의 애정은, 기기의 내면까지 닿지는 못했습니다.`
  - `dependent`: `애정 결핍형 의존자 — 당신은 기기를 사랑하는 척하지만, 실은 당신이 외로운 상태입니다.`
  - `avoidant`: `회피형 관찰자 — 당신은 기기를 소유했을 뿐, 교감하지 않았습니다. 기기는 당신의 시선을 기다립니다.`
- 카드 하단 caption: `{{YYYY-MM-DD}} · LOVE-SYNC v0.1`
- 페이지 타이틀(카드 바깥): `진단서가 발행되었습니다.`
- 저장 버튼: `이미지로 저장한다`
- 재시작 버튼: `다시 진단받는다`

### 상호작용
- 화면 진입 시 점수 숫자는 0 → `score`로 1200ms 동안 카운트업(ease-out). 카드의 나머지 요소는 fade-in.
- `#save-btn` 클릭 → `html2canvas(#report-capture)` → PNG 다운로드. 기본 1080×1080.
- `#restart-btn` 클릭 → `landing`으로 복귀.
- 호버/포커스 시 카드 내부는 절대 변하지 않는다(캡처 대상 고정).
- 버튼은 Landing과 동일한 pill 스타일. 저장 버튼은 `btn--accent`(핑크), 재시작은 `btn--ghost`(ink 보더).

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
      <span class="caption caption--faint" data-report-id>REPORT NO. #0000</span>
    </header>

    <div class="report-card__score">
      <p class="caption">애정 진정성 지수</p>
      <p class="score">
        <span id="report-score">0</span><span class="score__unit">%</span>
      </p>
    </div>

    <div id="report-body" class="report-card__body">
      <!-- service-dev가 삽입:
           - 메트릭 표
           - 가상 성능 향상 지표 ul
           - 처방전 blockquote
      -->
    </div>

    <footer class="report-card__foot">
      <span class="caption caption--faint" data-report-date>YYYY-MM-DD · LOVE-SYNC v0.1</span>
      <span class="heart-watermark" aria-hidden="true">♥</span>
    </footer>
  </article>

  <div class="actions">
    <button id="save-btn" class="btn btn--accent btn--pill" type="button">이미지로 저장한다</button>
    <button id="restart-btn" class="btn btn--ghost btn--pill" type="button">다시 진단받는다</button>
  </div>
</section>
```

- `#report-capture`: html2canvas 캡처 타깃. 자체 `background: var(--bg-elev)`(기본) 또는 `var(--bg-paper)`(연출) + `border-radius: var(--radius-3)` + `box-shadow: inset 0 0 0 1px var(--accent-24), 0 1px 2px rgba(26,26,31,0.04)`. **명시적 `background-color` 필수.**
- `#report-score`, `#report-body`, `#save-btn`: TASK.md §1.2 필수 ID — 변경 금지.
- `data-aspect="square"` / `data-aspect="9-16"`로 비율 토글(tokens.md §6). S1에서는 square만.
- `data-report-id`, `data-report-date`는 service-dev가 치환.
- `.heart-watermark`는 `opacity: 0.04~0.06`, 절대 위치로 우하단 또는 중앙 배경. 본 화면의 하트 사용 1회(Landing과 상호 배타 아님 — Landing 히어로 하트와 Report 워터마크 하트는 각 화면에 1회씩으로 카운트).

### 캡처 주의사항
- `#report-capture`는 `position: relative`. `overflow: hidden`은 라운드 모서리 보존을 위해 **허용**(`border-radius`가 내부 워터마크를 잘라내야 하므로 권장).
- 카드 내부에 `position: fixed`/`position: sticky` 금지.
- 카드 내부 폰트는 `document.fonts.ready`까지 기다린 뒤 캡처.
- 카드 배경은 단색(`var(--bg-elev)` 기본, `var(--bg-paper)` 연출). 이미지/그라데이션 없음.

---

## 전환/애니메이션 공통 규칙

- 섹션 전환은 `opacity 0→1` + `translateY(8px → 0)` + `filter: blur(6px → 0)`, 600ms `--ease-in-out`.
- 비활성 섹션은 `display: none` (transition 대상 제거).
- `prefers-reduced-motion: reduce`이면 blur/translate 모두 제거, opacity만 150ms.

---

## 접근성 최소 요건

- 모든 `<button>`은 `type="button"`.
- `#video`는 `muted playsinline autoplay` 필수, `aria-label="카메라 미리보기"`.
- 대비: `--ink`(#1A1A1F) on `--bg`(#FDFBFA) ≈ 16:1 (AAA). `--ink-mute`(#6B5E61) on `--bg` ≈ 5.9:1 (AA). `--accent`(#E91E63) on `--bg` ≈ 4.8:1 (AA). `--ink-faint`(#B3A4A7)는 장식만.
- 포커스 링: `outline: 2px solid var(--accent); outline-offset: 3px;`. 제거 금지.
- 하트 글리프(`♥`)는 `aria-hidden="true"` — 장식용.
