# 🛠 TASK.md — 러브-싱크 (Love-Sync)

> **남은 시간:** 2시간 30분
> **원칙:** 30분 시점에 더미 데이터로라도 Landing → Report 풀 플로우가 작동해야 한다. 이후 시간은 전부 "정확도 향상"이 아니라 "연출 강화"에 쓴다.
> **참고:** 본 문서는 [PRD.md](./PRD.md)의 구현 분해본이다. 모든 Task는 3개 에이전트(`designer`, `publisher`, `service-dev`) 중 하나에 owner가 지정된다.

---

## 0. 에이전트 역할 분담 한 줄 요약

| Agent | 역할 | 산출물 |
|---|---|---|
| **`designer`** | 시각 언어 정의 (톤·컬러·타이포·레이아웃 스펙) | `design/tokens.md`, `design/screens.md` |
| **`publisher`** | HTML 마크업 + CSS 구현 (정적, 로직 X) | `index.html`, `styles.css` |
| **`service-dev`** | JS 로직 (카메라/오디오/상태머신/리포트 생성기) | `app.js`, `lib/*.js` |

**병렬 실행 규칙:** designer가 먼저 산출물을 내야 publisher가 시작 가능. publisher와 service-dev는 인터페이스(아래 §1)만 합의되면 병렬 가능.

---

## 1. 인터페이스 계약 (에이전트 간 합의 사항)

### 1.1. DOM 계약 (publisher ↔ service-dev)
4개 화면은 **동일한 `index.html`에 공존**하며, `data-active-screen` 속성으로 표시/숨김 전환한다.

```html
<main data-active-screen="landing">
  <section data-screen="landing">…</section>
  <section data-screen="scan">…</section>
  <section data-screen="action">…</section>
  <section data-screen="report">…</section>
</main>
```

`service-dev`는 `document.querySelector('main').dataset.activeScreen = 'action'` 형태로만 화면을 전환한다.

### 1.2. 필수 DOM ID (service-dev가 querySelector로 잡을 것)
- `#video` — 카메라 미리보기 `<video>`
- `#start-btn` — Landing의 시작 버튼
- `#permission-btn` — Scan의 권한 허용 버튼
- `#progress-bar` — Action 진행률
- `#progress-label` — "AI 애정 진정성 분석 중..." 텍스트
- `#report-score` — 리포트 점수 숫자
- `#report-body` — 리포트 본문 영역
- `#save-btn` — 이미지 저장 버튼

### 1.3. 데이터 계약 (service-dev 내부)
```ts
type AnalysisResult = {
  sincerityScore: number;        // 0~100
  distanceStability: number;     // 0~1
  audioPeakDb: number;           // dB
  personality: 'dependent' | 'performative' | 'avoidant' | 'sincere';
};
```

---

## 2. 시간 배분 (2h 30m)

| 슬롯 | 시간 | 작업 | Owner |
|---|---|---|---|
| **S0** | 0:00–0:15 | 디자인 토큰 + 화면 와이어 정의 | `designer` |
| **S1** | 0:15–0:35 | HTML 4화면 골격 + CSS 기본 | `publisher` |
| **S1'** | 0:15–0:35 | 상태머신 + 더미 리포트 생성기 | `service-dev` (병렬) |
| **S2** | 0:35–0:50 | 통합: 더미값으로 Landing→Report 풀 플로우 동작 | `service-dev` |
| **S3** | 0:50–1:30 | MediaPipe Face Mesh 입술 거리 감지 | `service-dev` |
| **S4** | 1:30–2:00 | Web Audio dB/피크 감지 + 점수 산출 통합 | `service-dev` |
| **S5** | 2:00–2:20 | 연출 강화 (로딩 그래프, 트랜지션, 사운드) | `publisher` + `designer` |
| **S6** | 2:20–2:30 | 배포 + 발표 리허설 | 전원 |

**Hard checkpoint @ 0:50:** S2까지 미완이면 S3(MediaPipe) 스킵하고 마우스 클릭으로 트리거하는 mock으로 대체.

---

## 3. Task 상세

### S0. 디자인 시스템 — `designer`
- [ ] `design/tokens.md`: 컬러(다크 베이스 + 1 accent), 폰트(serif 헤드라인 + mono 본문 권장), 간격 스케일
- [ ] `design/screens.md`: 4화면(Landing/Scan/Action/Report) 와이어프레임 텍스트 기술
- [ ] 톤 가이드: "스티브 잡스 키노트 + 가짜 과학 논문" — 여백 많이, 글자 크게, 장식 최소
- [ ] 리포트 카드 레이아웃 (이미지 저장 시 정사각/9:16 SNS 친화적)

### S1. 퍼블리싱 — `publisher`
- [ ] `index.html`: 4 `<section data-screen>` 구조
- [ ] `styles.css`: 디자인 토큰 CSS 변수화, 화면 전환은 `[data-active-screen]` 속성 셀렉터로
- [ ] 권한 고지문, 프라이버시 1줄 카피 (Landing 하단 고정)
- [ ] 리포트 카드는 `html2canvas`로 캡처 가능한 격리된 컨테이너로 마크업

### S1'. 코어 로직 골격 — `service-dev` (병렬)
- [ ] `app.js`: 화면 전환 상태머신 (landing → scan → action → report)
- [ ] `lib/report.js`: 템플릿 배열 기반 리포트 생성기 (`generateReport(result)`)
- [ ] `lib/score.js`: 더미 점수 생성기 (현 단계는 `Math.random()`)
- [ ] 통합 테스트: Landing 버튼 → 2초 후 Report 표시 (mock)

### S2. 1차 통합 — `service-dev`
- [ ] 더미값으로 풀 플로우 작동 확인
- [ ] **이 시점에 데모 가능한 상태가 보장되어야 함**

### S3. Vision — `service-dev`
- [ ] `lib/vision.js`: MediaPipe Face Mesh CDN 로드, `getUserMedia({video:true})`
- [ ] 입술 랜드마크(13, 14, 78, 308) 추출 → 화면 대비 얼굴 박스 비율로 거리 역산
- [ ] 안정성: 최근 30프레임 거리값 표준편차 → `distanceStability`
- [ ] **프라이버시 검증:** `fetch`/`XHR`로 프레임 데이터 송신하는 코드가 0줄인지 코드 리뷰

### S4. Audio — `service-dev`
- [ ] `lib/audio.js`: `getUserMedia({audio:true})` + `AnalyserNode`
- [ ] 매 프레임 RMS/피크 dB 계산, 짧은 어택(< 200ms) 감지로 "쪽" 검출
- [ ] `score.js`: `(distanceStability * 0.6 + audioPeak * 0.4) * 100` 같은 가중합으로 진정성 점수 산출

### S5. 연출 — `publisher` + `designer`
- [ ] 분석 중 가짜 그래프 (Canvas 또는 CSS 애니메이션 sine wave)
- [ ] 화면 전환 트랜지션 (fade, blur)
- [ ] 시간 남으면: 미세한 효과음 (분석 시작/완료 비프)

### S6. 배포 — 전원 (완전 자동화)
- [ ] `.gitignore` 작성 (`.claude/settings.local.json`, `node_modules`, `.vercel`, `.DS_Store` 포함)
- [ ] `git init && git add . && git commit -m "init: love-sync MVP"`
- [ ] `gh repo create love-sync --public --source=. --remote=origin --push` (계정: jiminseong)
- [ ] `vercel link` → `vercel deploy --prod --yes` (정적 배포)
- [ ] HTTPS 확인 (`getUserMedia` 동작 필수 조건)
- [ ] 모바일 Safari/Chrome 1회 실기 점검 (배포 URL 직접)
- [ ] 발표 리허설 1회

> **자동화 전제:** GitHub CLI(`gh`)와 Vercel CLI(`vercel`) 모두 `jiminseong` 계정으로 사전 인증됨. 오케스트레이터가 위 명령들을 사용자 컨펌 없이 순차 실행 가능.

---

## 4. 프라이버시 체크리스트 (배포 전 필수)
- [ ] 코드 전체에서 카메라/오디오 버퍼를 `fetch`/`XHR`/`WebSocket`/`sendBeacon`으로 전송하는 코드 없음
- [ ] 외부 호출은 (1) MediaPipe 모델 가중치 (2) 폰트/CSS만
- [ ] localStorage/IndexedDB에 미디어 데이터 저장 없음
- [ ] Landing 화면에 "모든 분석은 브라우저 안에서만" 고지문 표시

---

## 5. Out of Scope (4시간 → 2.5시간 단축으로 잘라낸 것)
- LLM API 연동 (외부 호출 = 컨셉 충돌)
- 입술 떨림 미세 분석 (점수는 dB + 거리 표준편차로 단순화)
- 위생 경고 분기 ("너무 가까움" 메시지) — 시간 남으면 추가
- 다국어
- 결과 공유 링크 (이미지 다운로드만)
