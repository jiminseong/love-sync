# 러브-싱크 디자인 토큰

> 본 문서는 publisher가 `styles.css`의 `:root` 변수와 유틸리티 클래스를 작성하기 위한 단일 소스다. 모든 값은 그대로 CSS 변수로 옮긴다.
>
> **무드:** 흰 종이 위 분홍 잉크, 다정한 편지 한 장. 라이트하고 부드럽다 — 학술지/가짜 과학 컨셉은 캡션과 문구에서 농담처럼 살짝 풍기는 정도다. 여백은 넓게, 글자는 크지만 친근하게, 장식은 절제. 모서리는 카드·버튼에 한해 부드럽게 둥글려도 좋다. 핑크는 포인트 한 번, 알파 단계로 은은히 번지도록.
>
> **테마 범위:** 라이트 단일 테마. MVP 범위상 다크 모드 대응 없음.

---

## 1. Color

거의 흰색인 오프화이트 베이스 + 단 1색의 핑크 accent. 이 외의 유채색은 금지(차트·배경 틴트·보더 모두 accent의 알파 단계로만 표현).

| Token | HEX | 용도 |
|---|---|---|
| `--bg` | `#FDFBFA` | 페이지 배경. 순백(#FFF) 금지 — 아주 미세하게 따뜻한, 분홍기 도는 오프화이트. |
| `--bg-elev` | `#F8F3F2` | 카드/패널(리포트 카드, 계측 박스, 센서 로그)의 한 단계 위 면. 베이스보다 약간 진한 페일 핑크 틴트. |
| `--bg-paper` | `#FBF3EF` | 리포트 카드 "편지지" 톤 바리에이션(옵션). 베이스보다 살짝 더 따뜻한 크림/페일 핑크. 기본은 `--bg-elev`, 연출 시 `--bg-paper`로 스왑. |
| `--ink` | `#1A1A1F` | 주 텍스트. 순흑(#000) 금지 — 약간 푸른 기 도는 근흑. `--bg` 대비 약 16:1 (AAA 통과). |
| `--ink-mute` | `#6B5E61` | 보조 텍스트, 라벨, 캡션. 핑크-그레이 계열. `--bg` 대비 약 5.9:1 (AA 본문 통과). |
| `--ink-faint` | `#B3A4A7` | 매우 희미한 보조(눈금, 배경 노이즈 텍스트, 도트 리더). `--bg` 대비 약 2.7:1 — 장식용, 본문 금지. |
| `--accent` | `#E91E63` | 단일 강조색. Deep rose pink — 채도는 충분히 높아 점수/CTA에서 또렷하되, 네온처럼 튀지는 않는다. `--bg` 대비 약 4.8:1 (AA 통과). |
| `--line` | `#EADFE0` | 구획선, 표 테두리, 계측 틱. 1px hairline. 매우 옅은 핑크-그레이지만 흰 배경에서 눈에 보일 정도. |
| `--line-strong` | `#D9C5C8` | 강조 구획선(표 상하단 룰, 리포트 카드 하단 룰). 여전히 은은하되 위계가 느껴질 정도. |

### 알파 스케일 (accent 전용, 사용 범위 확장)
`--accent`를 알파 단계로 쓰는 것을 **적극 허용**한다. 카드 배경 틴트, 보더 하이라이트, 버튼 hover, 진행바 빈 트랙, 가짜 그래프 영역 채움까지. 단 **채도 강한 풀톤(`--accent`)은 여전히 점수·CTA·진행바 채움·차트 주선에 한정.** 다른 유채색의 알파는 만들지 않는다.

- `--accent-08`: `rgba(233, 30, 99, 0.08)` — 카드/섹션 배경에 살짝 핑크 기운을 더할 때.
- `--accent-12`: `rgba(233, 30, 99, 0.12)` — 버튼 hover 틴트, 진행바 빈 트랙, 가짜 그래프 영역 채움.
- `--accent-24`: `rgba(233, 30, 99, 0.24)` — 입술 가이드 아웃라인, 포커스 글로우 대체, 카드 보더 하이라이트.
- `--accent-60`: `rgba(233, 30, 99, 0.60)` — 차트 보조선, 페이드 처리된 accent.

### 하트/이모지 사용 정책 (신규)
기본은 여전히 이모지 없음. 단 **한 화면당 최대 1개**의 하트 글리프(`♥` 또는 `♡`, SVG 아님, 유니코드 문자)는 악센트 장식으로 허용. 색은 `--accent`. 크기는 본문과 같거나 1단계 크게. 대표 허용 위치:
- Landing 히어로 헤드라인 끝 또는 라인 브레이크 사이.
- Report 카드 내부 워터마크(단 opacity 아래 §7의 3% 규칙 따름).
동일 화면에 2개 이상 배치 금지. 움직이는 하트·반짝임 효과 금지.

### 참고용 파생(변수 아님, publisher 재량)
- Soft tint reference: `#FCE4EC` — `--accent`의 12% 틴트를 불투명 HEX로 환산한 값.
- Deep accent reference: `#AD1457` — hover 시 일시적으로 더 진해지는 느낌이 필요할 때만. 기본은 `--accent` 유지.

### 금지
- 그라데이션(선형/방사형 모두). 단색 또는 알파 단계만.
- 드롭 섀도우(색이 있는). 카드 부양감은 `box-shadow: 0 1px 2px rgba(26,26,31,0.04)` 정도의 **거의 보이지 않는 hairline 섀도우** 또는 `box-shadow: inset 0 0 0 1px var(--line)` 인셋 룰로 대체 — 이 두 가지만 예외 허용.
- 유채색 2개 이상 동시 사용(핑크 이외의 컬러 금지 — 블루/그린 경고색도 쓰지 않는다).
- 순백(#FFFFFF)/순흑(#000000).
- 네온 핑크, 마젠타 포화색. `--accent`는 한 톤 가라앉은 deep rose가 기준.

---

## 2. Typography

헤드라인은 serif(다정한 편지 감성), 본문·UI는 sans(가볍고 친근), 숫자·계측은 mono(계측기 감성). 셋의 역할을 분명히 나눠 "논문 같기만 한" 무거움을 완화한다.

### Font Stack (Google Fonts CDN 1회 로드)
```
https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap
```

- `--font-serif`: `"Newsreader", "EB Garamond", Georgia, "Times New Roman", serif` — 헤드라인/리포트 인용(처방전)에 한정.
- `--font-sans`: `"Inter", "Pretendard", system-ui, -apple-system, sans-serif` — **기본 본문과 UI 라벨의 디폴트.** 버튼 라벨, 본문 단락, 리스트, 대부분의 설명문이 여기.
- `--font-mono`: `"JetBrains Mono", "IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace` — 숫자(점수/계측값/카운트업), 계측 라벨(`FIG.`, `REPORT NO.`), 도트 리더에만.

> 사용처 우선순위를 거꾸로 외우면 편하다: **숫자는 mono → 헤드라인은 serif → 그 외 전부 sans.** 예전처럼 "본문=serif, 라벨=mono"가 아니다.

### 사이즈 스케일 (clamp 권장값)
헤드라인 상한을 낮춰 무대 같은 위압감을 덜고, 친근한 인사말 정도로 내린다.

| Token | `clamp(min, vw, max)` | 용도 |
|---|---|---|
| `--fs-display` | `clamp(2.75rem, 6vw, 5.5rem)` | Landing 히어로 한 줄. serif 400, italic 선택(강제 아님). |
| `--fs-h1` | `clamp(2rem, 4.5vw, 3.25rem)` | 화면 타이틀(Scan/Action/Report 상단). serif 400. |
| `--fs-h2` | `clamp(1.375rem, 2.5vw, 1.875rem)` | 리포트 섹션 헤더. serif 600 또는 sans 600(택1). |
| `--fs-score` | `clamp(4.5rem, 12vw, 9rem)` | 리포트 점수 숫자. mono 500, tabular-nums. accent color. |
| `--fs-body` | `clamp(1rem, 1.2vw, 1.125rem)` | 본문 단락. **sans 400.** `line-height: 1.6`. |
| `--fs-label` | `clamp(0.875rem, 1vw, 1rem)` | 일반 UI 라벨/버튼 텍스트. **sans 500.** letter-spacing 0. |
| `--fs-mono` | `clamp(0.8125rem, 1vw, 0.9375rem)` | 계측 라벨/수치. mono 400. `letter-spacing: 0.02em`. |
| `--fs-caption` | `0.75rem` | 캡션/푸터 고지문. sans 또는 mono(아래 규칙 참조). |

### 타이포 규칙 (완화)
- **숫자는 항상 mono + `font-variant-numeric: tabular-nums`.** 카운트업/점수 표시 시 폭이 흔들리지 않도록.
- **이탤릭 serif**는 리포트 인용문("처방전")에서만 의무. Landing 히어로는 정자(roman) 기본, italic은 옵션.
- 헤드라인 `font-weight`는 400(Newsreader의 얇고 부드러운 획). 600은 리포트 섹션 라벨에만.
- 본문 `max-width: 60ch`. 리포트 카드 안에서는 `52ch`. **본문은 sans.**
- 헤드라인 `letter-spacing: -0.01em` (기존 -0.02em보다 완화). 본문은 0. mono 라벨은 `+0.02em~+0.04em`.
- **uppercase 강제 캡션은 `FIG. ##`, `REPORT NO.`, `STEP ##/03` 등 "계측 농담" 성격의 mono 캡션에만.** 그 외 일반 캡션(프라이버시 고지, 장치 감지 문구, 하단 설명 등)은 **case 그대로, tracking 0 또는 +0.02em까지만.** uppercase + 0.12em 같은 "근엄한" 캡션은 사용 금지.
- 텍스트 정렬 기본값은 **center**(§Screens 참조). 단 리포트 본문 단락은 가독성을 위해 left 정렬을 유지하되, 단락 블록 자체는 중앙 정렬된 컬럼 안에서.
- 라이트 테마에서 본문 색은 반드시 `--ink`, 라벨/캡션은 `--ink-mute`. `--ink-faint`는 장식용 눈금·도트 리더·배경 표기 외에는 쓰지 않는다.

---

## 3. Spacing

8px 베이스 스케일. 컨테이너 여백은 "이게 너무 넓은가?" 싶을 때까지 과감히 넓힌다. (변경 없음.)

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

### 컨테이너 폭 (모든 사용처에서 `margin-inline: auto` 디폴트)
- `--content-narrow`: `min(640px, 92vw)` — 단락 중심 화면
- `--content-wide`: `min(960px, 94vw)` — Scan/Action 계측 화면
- `--content-report`: `min(720px, 94vw)` — 리포트 페이지 폭(데스크톱 뷰)
- **규칙:** 위 세 컨테이너를 쓰는 모든 요소는 `margin-inline: auto`가 기본. section 내부 자식은 column flex로 쌓이며, `align-items: center`(부모) 또는 `align-self: center`(자식)으로 수평 중앙 배치한다. 리포트 **카드 자체**의 캔버스 크기는 §6 참고.

### 화면 좌우 gutter (반응형)
- `< 480px`: `16px`
- `480~720px`: `24px`
- `720~1080px`: `32px`
- `> 1080px`: `64px`

자세한 브레이크포인트는 screens.md 상단 표 참조.

---

## 4. Radius

편지지·스티커 느낌을 살짝 허용. "거의 0" 원칙은 완화해, 카드와 버튼은 부드럽게 둥글려도 된다. 대신 입력 필드·비디오·표·계측 박스는 여전히 직각 또는 아주 미세한 라운드까지만.

| Token | 값 | 용도 |
|---|---|---|
| `--radius-0` | `0` | 비디오 컨테이너, 표(table), 계측 박스, 구획선 등 "계측" 역할의 요소. |
| `--radius-1` | `2px` | 인풋, 센서 로그 박스 등 "도구" 역할의 요소. |
| `--radius-2` | `12px` | **카드(일반), 버튼(기본).** 편지 한 장 같은 부드러운 모서리. |
| `--radius-3` | `20px` | 리포트 카드 외곽. 16~24px 범위에서 선택, 기본 20px. |
| `--radius-pill` | `999px` | 주요 CTA 버튼(Landing 시작 버튼, Report 저장 버튼) 권장. 러브레터 스티커 느낌. |

### 규칙
- 버튼은 `--radius-2`(12px) 또는 `--radius-pill`(999px) 중 택1. **동일 화면 내에선 하나로 통일.** 기본 권장은 pill — 더 가볍다.
- 리포트 카드는 `--radius-3`(20px) 기본. 필요 시 16~24px 사이 조정 가능.
- 비디오 컨테이너, 계측 표, 진행 바 트랙은 radius-0 유지(계측기 감성).
- 둥근 정도에 그라데이션/섀도우를 더하지 않는다 — 모서리가 부드러워도 면은 단색.

---

## 5. Motion

키노트 무대처럼 **느리고 신중하게**. 통통 튀는 애니메이션 금지. (변경 없음.)

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
| square (default) | `1080 × 1080` | `aspect-ratio: 1 / 1; width: min(560px, 92vw); margin-inline: auto` | 인스타 피드/트위터 |
| 9-16 | `1080 × 1920` | `aspect-ratio: 9 / 16; width: min(360px, 80vw); margin-inline: auto` | 인스타 스토리/릴스 |

### 카드 내부 패딩
- square: 카드 에지로부터 `56~72px` 안쪽 (모바일은 40~48px)
- 9-16: 카드 에지로부터 `48~64px` 안쪽, 상하 여백은 `72~96px`

### 카드 배경·모서리·보더 (완화된 규칙)
- 기본 `background: var(--bg-elev)` — 페이지 배경보다 미세하게 진한 페일 핑크 면. 카드가 페이지에서 한 겹 떠올라 보이도록.
- 대체 프리셋(연출용): `background: var(--bg-paper)` — 살짝 더 따뜻한 크림 톤. "편지지" 느낌.
- **모서리:** `border-radius: var(--radius-3)` (기본 20px, 16~24px 허용). 논문 직각 → 편지지 부드러움으로 이동. 좌우 border는 여전히 없음.
- **상단 보더:** 4px double-rule 제거. 카드 **자체가 라운드 모서리와 1px 인셋 hairline**을 가지므로 상단 강조 룰이 필요 없다. 내부 섹션을 나누고 싶다면 `--line` 1px solid 단일 룰을 카드 폭 안쪽에 한 번만 사용.
- **하단 보더:** 좌우 padding 안쪽에 1px `--line` 단일 룰로 footer caption만 살짝 구분. 이것도 선택.
- 권장 인셋 hairline: `box-shadow: inset 0 0 0 1px var(--accent-24)` — **핑크 기운이 은은히 도는** 1px 보더. 기존 `--line` 대신 `--accent-24`를 써 카드가 "핑크 잉크 편지" 같아 보이게.
- 카드 부양감: `box-shadow: 0 1px 2px rgba(26,26,31,0.04)`까지 허용. 그 이상의 섀도우 금지.

### 카드 폰트 특례와 색 규칙
- 카드 안에서는 본문 폭을 `52ch`로 더 좁힌다.
- 점수 숫자(`#report-score`)에는 **`color: var(--accent)`** — 페이지 전체 중 accent가 가장 크게 드러나는 단 한 곳.
- 점수 단위 `%`는 `color: var(--ink-mute)` 또는 `--accent-60` 중 택1 (기본 `--ink-mute`).
- 우상단 `REPORT NO. ####` 캡션은 **아주 옅게**(`color: var(--ink-faint)` 또는 `opacity: 0.5`의 `--ink-mute`). 기존처럼 또렷한 mono 스탬프가 아니라 편지지 한구석의 일련번호 느낌.
- 도트 리더(메트릭 표의 `··········`)는 `--ink-faint`. 본문 값은 `--ink`.
- 처방전 인용 블록(`blockquote`)은 serif italic, 색은 `--ink`. 왼쪽 1px 세로 룰(`border-left: 1px solid var(--accent-24)`)을 `--space-4` 패딩과 함께. 세로 룰이 아주 은은한 핑크 잉크 기운을 띠도록.
- 하트 워터마크(옵션, 카드 우하단 또는 중앙 배경): `♥` 유니코드, `--accent`, **`opacity: 0.03~0.06`** 범위. 완전히 장식.

### 캡처 안전 규칙 (publisher·service-dev 공용)
- html2canvas는 외부 폰트 로딩 완료 후 실행(`document.fonts.ready`).
- 카드 내부에 `position: fixed` 요소 없음.
- 카드 내부 모든 색은 CSS 변수가 아닌 최종 해석 색이 적용되어야 함 — `getComputedStyle` 기반이라 문제 없지만, `filter`/`mix-blend-mode` 사용은 금지.
- **라이트 테마 특유의 "흰 배경 캡처 시 누락" 방지:** `#report-capture`에 명시적 `background-color`를 반드시 설정한다(상속 금지).
- `border-radius`는 html2canvas에서도 잘 보존되지만, 배경과 보더 모두 명시적 색이어야 한다.

---

## 7. 그리드 / 계측 장식 (가짜 과학용, 선택 사용)

"학술지" 장식은 **옵션**으로 강등한다. 없어도 동작하고, 있다면 농담처럼 아주 은은하게만. 라이트 테마에서는 hairline이 너무 흐려지기 쉬우므로 색 선택에 주의.

- **Hairline grid (선택):** `--line` 1px, `var(--space-16)` 간격. 배경이 아닌 카드 내부 섹션 구분용. publisher 재량으로 생략 가능.
- **Tick marks (선택):** mono 캡션 옆 `|` 또는 `—` 문자만. SVG 눈금자 장식 허용(`--ink-faint`).
- **Figure 라벨 (선택):** 차트/수치 블록 상단 `FIG. 01 — DISTANCE STABILITY` 형식의 uppercase mono caption. 색 `--ink-mute`. **필수에서 선택으로 강등.** 있어도 되고, 없으면 그냥 섹션 제목으로 대체 가능.
- **표(table):** `border-collapse: collapse; border-top/bottom: 1px solid var(--line-strong); tr + tr { border-top: 1px solid var(--line); }`. 좌우 테두리 없음.
- **Progress bar (Action 화면):** 트랙 `background: var(--accent-12)`, 채움 `background: var(--accent)`. 높이 2~4px. 모서리는 `--radius-pill` 허용.
- **Waveform canvas:** 라인 스트로크 `var(--accent)`, 보조선 `var(--accent-60)`, 배경은 투명(카드 `--bg-elev` 위에 얹힌다).
- **워터마크·일련번호 (선택, 매우 옅게):** `REPORT NO. ####`, 하트 워터마크, 모서리 일련번호 등 학술지 장식은 `opacity: 0.03~0.1` 사이에서만 존재. 또렷한 스탬프는 금지.

---

## 8. 외부 의존(허용 목록)

프라이버시 원칙상 외부 호출은 아래로 한정. publisher는 `<head>`에 아래 외 다른 `<link>`/`<script src>` 추가 금지.

1. Google Fonts CSS (`fonts.googleapis.com`) + 폰트 바이너리 (`fonts.gstatic.com`) — Newsreader + Inter + JetBrains Mono 3종 한 번에 로드.
2. MediaPipe Face Mesh CDN (service-dev가 S3에서 추가, designer 영역 아님)
3. html2canvas CDN (service-dev 또는 publisher가 S1에서 추가)

트래커, 아이콘 폰트, 아이콘 SVG 스프라이트 CDN 등 일체 금지.
