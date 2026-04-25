# 러브-싱크 디자인 토큰

> 본 문서는 publisher가 `styles.css`의 `:root` 변수와 유틸리티 클래스를 작성하기 위한 단일 소스다. 모든 값은 그대로 CSS 변수로 옮긴다.
>
> **무드:** 스티브 잡스 키노트 무대 × 1970년대 학술 논문. 넓은 여백, 큰 타이포, 장식 최소. 컨셉이 "가짜 과학"이므로 숫자·표·그리드가 근엄하게 보여야 한다.

---

## 1. Color

다크 베이스 + 단 1색의 accent. 이 외의 유채색은 금지(차트에서도 accent의 알파 단계로만 표현).

| Token | HEX | 용도 |
|---|---|---|
| `--bg` | `#0B0B0C` | 페이지 배경. 순흑이 아닌 미세하게 따뜻한 암부. |
| `--bg-elev` | `#141416` | 카드/패널(리포트 카드, 계측 박스)의 한 단계 위 면. |
| `--bg-paper` | `#F2EFE7` | 리포트 카드 "종이" 톤 바리에이션(옵션 1). 논문 느낌 강조용. 기본은 `--bg-elev` 사용. |
| `--ink` | `#ECEAE3` | 주 텍스트. 순백(#FFF) 금지 — 종이톤 오프화이트. |
| `--ink-mute` | `#8A8880` | 보조 텍스트, 라벨, 캡션. |
| `--ink-faint` | `#4A4944` | 매우 희미한 보조(눈금, 배경 노이즈 텍스트). |
| `--accent` | `#E8C547` | 단일 강조색. 머스타드 옐로우(논문지 하이라이터 + 키노트 스팟라이트). 점수, 시작 버튼, 진행률에만 사용. |
| `--line` | `#2A2A2C` | 구획선, 표 테두리, 계측 틱. 1px hairline. |
| `--line-strong` | `#3D3D40` | 강조 구획선(리포트 카드 상단/하단 더블 룰). |

### 알파 스케일 (accent 전용)
차트/그래프/글로우 표현 시에만 `--accent`를 알파로 사용. 다른 색의 알파는 만들지 않는다.
- `--accent-12`: `rgba(232, 197, 71, 0.12)`
- `--accent-24`: `rgba(232, 197, 71, 0.24)`
- `--accent-60`: `rgba(232, 197, 71, 0.60)`

### 금지
- 그라데이션(선형/방사형 모두). 단색 또는 hairline만.
- 드롭 섀도우. 허용되는 유일한 예외는 리포트 카드의 **아주 얕은** `0 1px 0 var(--line)` 인셋 룰.
- 유채색 2개 이상 동시 사용.

---

## 2. Typography

헤드라인은 serif(논문지 감성), 본문/숫자/계측은 mono(계측기 감성). 산세리프는 쓰지 않는다.

### Font Stack (Google Fonts CDN 1회 로드)
```
https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=JetBrains+Mono:wght@400;500;700&display=swap
```

- `--font-serif`: `"Newsreader", "EB Garamond", Georgia, "Times New Roman", serif`
- `--font-mono`: `"JetBrains Mono", "IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace`

### 사이즈 스케일 (clamp 권장값)
키노트 무대처럼 **헤드라인은 과감하게 크게**. 본문은 읽히는 선에서 절제.

| Token | `clamp(min, vw, max)` | 용도 |
|---|---|---|
| `--fs-display` | `clamp(3.5rem, 8vw, 7.5rem)` | Landing 히어로 한 줄. serif 400, italic 허용. |
| `--fs-h1` | `clamp(2.25rem, 5vw, 4rem)` | 화면 타이틀(Scan/Action/Report 상단). serif 400. |
| `--fs-h2` | `clamp(1.5rem, 3vw, 2.25rem)` | 리포트 섹션 헤더. serif 600. |
| `--fs-score` | `clamp(5rem, 14vw, 11rem)` | 리포트 점수 숫자. mono 500, tabular-nums. |
| `--fs-body` | `clamp(1rem, 1.2vw, 1.125rem)` | 본문 단락. serif 400. `line-height: 1.6`. |
| `--fs-mono` | `clamp(0.875rem, 1vw, 1rem)` | 계측 라벨/수치. mono 400. `letter-spacing: 0.02em`. |
| `--fs-caption` | `0.75rem` | 캡션/푸터 고지문. mono 400, uppercase, `letter-spacing: 0.12em`. |

### 타이포 규칙
- **숫자는 항상 mono + `font-variant-numeric: tabular-nums`.** 카운트업/점수 표시 시 폭이 흔들리지 않도록.
- **이탤릭 serif**는 Landing 히어로, 리포트 인용문("처방전")에만. 남발 금지.
- 헤드라인 `font-weight`는 400(Newsreader 고유의 얇은 획을 살린다). 600은 리포트 섹션 라벨에만.
- 본문 `max-width: 60ch`. 리포트 카드 안에서는 `52ch`.
- 헤드라인 `letter-spacing: -0.02em`. 본문은 0. mono 라벨은 `+0.08em` 또는 `+0.12em`.
- **uppercase**는 mono 라벨/캡션에만 (예: `FIG. 01`, `SUBJECT`, `REPORT NO.`).
- 텍스트 정렬은 기본 left. 리포트 카드 내부의 숫자 점수만 center.

---

## 3. Spacing

8px 베이스 스케일. 컨테이너 여백은 "이게 너무 넓은가?" 싶을 때까지 과감히 넓힌다.

| Token | 값 | 용도 |
|---|---|---|
| `--space-0` | `0` | |
| `--space-1` | `4px` | 아이콘/텍스트 미세 조정 |
| `--space-2` | `8px` | 인라인 요소 간격 |
| `--space-3` | `12px` | 라벨-값 간격 |
| `--space-4` | `16px` | 작은 블록 간격 |
| `--space-6` | `24px` | 섹션 내부 블록 간격 |
| `--space-8` | `32px` | 섹션 간 기본 간격 |
| `--space-12` | `48px` | 카드 내부 패딩 |
| `--space-16` | `64px` | 카드 외부/화면 상하 여백 |
| `--space-24` | `96px` | 히어로 상하 여백 |
| `--space-32` | `128px` | Landing 여백(매우 크게) |

### 컨테이너 폭
- `--content-narrow`: `min(640px, 92vw)` — 단락 중심 화면
- `--content-wide`: `min(960px, 94vw)` — Scan/Action 계측 화면
- `--content-report`: `min(720px, 94vw)` — 리포트 페이지 폭(데스크톱 뷰)
- 리포트 **카드 자체**의 캔버스 크기는 §6 참고.

### 화면 좌우 gutter
- 모바일: `--space-6` (24px)
- 데스크톱: `--space-16` (64px) 이상

---

## 4. Radius

논문 분위기를 위해 **거의 0**. 둥근 모서리는 허용하지 않는다.

| Token | 값 | 용도 |
|---|---|---|
| `--radius-0` | `0` | 기본. 카드, 버튼, 인풋, 비디오 컨테이너 전부. |
| `--radius-1` | `2px` | 예외: 리포트 카드 모서리(아주 미세). 쓰지 않아도 무방. |

둥근 버튼/알약 모양 금지. 모든 박스는 직각.

---

## 5. Motion

키노트 무대처럼 **느리고 신중하게**. 통통 튀는 애니메이션 금지.

### Duration
- `--dur-fast`: `200ms` — 버튼 hover, 포커스 링
- `--dur-base`: `600ms` — 화면 전환(fade + subtle blur)
- `--dur-slow`: `1200ms` — 히어로 입장, 점수 카운트업 기반 타이밍
- `--dur-analysis`: `4000ms` — Action 화면 "분석 중" 연출 최소 시간 (service-dev가 더미 타이머로 사용)

### Easing
- `--ease-out`: `cubic-bezier(0.2, 0.8, 0.2, 1)` — 기본 감속
- `--ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)` — 화면 전환
- `--ease-linear`: `linear` — 진행률 바, sine wave 그래프

### 모션 규칙
- 바운스/오버슈트 `cubic-bezier(*, >1, *, *)` 금지.
- 화면 전환은 **opacity + translateY(8px) + filter: blur(6px→0)** 조합만 허용.
- `prefers-reduced-motion: reduce` 대응: duration 0, blur 없음(필수).
- 진행률 바는 선형, 지터 없음.

---

## 6. Report Card 캔버스 (html2canvas 타깃)

리포트 카드는 페이지 레이아웃과 **분리된 격리 컨테이너**다. publisher는 이 카드를 `#report-capture`로 감싸고, 아래 두 비율 중 **정사각**을 기본으로, `data-aspect="9-16"` 속성으로 9:16 토글을 지원한다.

| 프리셋 | 픽셀(캡처 시) | CSS 크기 | 용도 |
|---|---|---|---|
| square (default) | `1080 × 1080` | `aspect-ratio: 1 / 1; width: min(560px, 92vw)` | 인스타 피드/트위터 |
| 9-16 | `1080 × 1920` | `aspect-ratio: 9 / 16; width: min(360px, 80vw)` | 인스타 스토리/릴스 |

### 카드 내부 패딩 (캡처 해상도 기준 동일 비율로 유지)
- square: 카드 에지로부터 `72px` 안쪽
- 9-16: 카드 에지로부터 `64px` 안쪽, 상하 여백은 `96px`

### 카드 배경
- 기본 `background: var(--bg-elev)`. 논문톤 강조하고 싶다면 `--bg-paper` + `--ink`의 반전 버전(흑자 텍스트)도 가능 — S5 연출에서 결정.
- 상단 double-rule: `border-top: 4px double var(--line-strong)`
- 하단 single rule: `border-bottom: 1px solid var(--line)`
- **좌우 border 없음.** 논문 페이지처럼 상하만 긋는다.

### 카드 폰트 특례
- 카드 안에서는 본문 폭을 `52ch`로 더 좁힌다.
- 점수 숫자에는 accent color를 허용(페이지 전체 중 accent가 가장 크게 드러나는 곳).
- 카드 우상단에 `REPORT NO. ####` 형식의 mono caption을 삽입(PRD "가짜 과학 논문" 컨셉).

### 캡처 안전 규칙 (publisher·service-dev 공용)
- html2canvas는 외부 폰트 로딩 완료 후 실행(`document.fonts.ready`).
- 카드 내부에 `position: fixed` 요소 없음.
- 카드 내부 모든 색은 CSS 변수가 아닌 최종 해석 색이 적용되어야 함 — `getComputedStyle` 기반이라 문제 없지만, `filter`/`mix-blend-mode` 사용은 금지.

---

## 7. 그리드 / 계측 장식 (가짜 과학용)

리포트와 Action 화면에는 "학술적으로 보이는" 최소한의 장식만 허용.

- **Hairline grid:** `--line` 1px, `var(--space-16)` 간격. 배경이 아닌 카드 내부 섹션 구분용.
- **Tick marks:** mono 캡션 옆 `|` 또는 `—` 문자만 사용. SVG 눈금자 장식도 허용(accent 아님, `--ink-faint`).
- **Figure 라벨:** 모든 차트/수치 블록 상단에 `FIG. 01 — DISTANCE STABILITY` 형식의 uppercase mono caption. 필수.
- **표(table):** `border-collapse: collapse; border-top/bottom: 1px solid var(--line-strong); tr + tr { border-top: 1px solid var(--line); }`. 좌우 테두리 없음.

---

## 8. 외부 의존(허용 목록)

프라이버시 원칙상 외부 호출은 아래로 한정. publisher는 `<head>`에 아래 외 다른 `<link>`/`<script src>` 추가 금지.

1. Google Fonts CSS (`fonts.googleapis.com`) + 폰트 바이너리 (`fonts.gstatic.com`)
2. MediaPipe Face Mesh CDN (service-dev가 S3에서 추가, designer 영역 아님)
3. html2canvas CDN (service-dev 또는 publisher가 S1에서 추가)

트래커, 아이콘 폰트, 아이콘 SVG 스프라이트 CDN 등 일체 금지.
