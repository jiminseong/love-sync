# 뽀뽀뽀 (P.P.O)

화면에 가볍게 뽀뽀하면 사랑 점수를 알려준다고 시치미 떼는 가짜 'AI 애정도 분석' 웹 장난감.
점수 카드를 보고 끝났다 싶을 때, **"서비스 의도 확인하기"** 버튼을 누르면 분위기가 180도
반전되며 사실은 "기기에게 뽀뽀하는 우리"를 비추는 짓궂은 거울이었다는 진짜 메시지를
전한다.

카메라, 마이크, 캡처된 얼굴 이미지는 전부 브라우저 안에서만 처리된다. 별도의 서버가
없어서 어떤 데이터도 저장하거나 전송하지 않는다.

---

## 화면 흐름

```
Landing  →  Scan  →  Action  →  Report  →  Finale
 (인사)    (권한)    (3.2초     (점수      (의도 노출 +
                     측정)     카드)        타자기 + BGM)
```

1. **Landing** — 인사 + 시작 버튼.
2. **Scan** — 카메라/마이크 권한 요청 + 입술 가이드. 권한 버튼 아래에 _서버를 두지 않는다_
   는 안내가 함께 노출된다.
3. **Action** — 약 3.2초간 측정 진행. 진행률 바, 가짜 파형, 거리/소리/안정성/떨림 4개
   메트릭이 동시에 갱신된다.
4. **Report** — 사랑 점수 카드 + 짧은 처방전 + `저장하기` / `다시 하기`. 그 아래에 작게
   _결과는 어디에도 저장되지 않는다_ 는 안내, 그리고 더 작게 **서비스 의도 확인하기**
   링크를 둔다.
5. **Finale** — 본 작품의 클라이맥스. 다음 시퀀스가 차례로 일어난다.
   1. 리포트 카드가 1.5초에 걸쳐 페이드아웃 + 살짝 블러.
   2. 배경이 베이지(`#FDFBF7`)로 부드럽게 전환되고, 직전에 캡처해 둔 사용자 얼굴이
      `grayscale(100%)` + `blur(10px)` + `opacity: 0.10`으로 깔린다.
   3. `ppoppoppo.mp3`가 0 → 0.55 볼륨으로 4초간 페이드인되며 자동 재생된다 (반드시
      클릭 핸들러 안에서 호출돼야 autoplay 정책을 통과한다).
   4. 명조체로 짜인 본문이 글자당 약 65ms로 타자기처럼 출력된다. 문단 사이에는 1초
      간격을 둔다.
   5. 모든 타이핑이 끝나면 _배경의 얼굴은 본인만 본다_ 는 프라이버시 안내가 페이드인된다.
   6. 1.5초 뒤 `Web Share API` 버튼이 슬며시 등장한다 — _나만 당할 수 없지, 친구에게
      '뽀뽀뽀' 링크 보내기._ 미지원 브라우저는 클립보드 복사로 폴백한다.

---

## 프로젝트 구조

```text
.
├── index.html              # 5개 화면(landing/scan/action/report/finale) 마크업
├── styles.css              # 디자인 토큰, 화면 전환, 리포트 카드, 타자기·페이드 연출
├── app.js                  # 화면 상태머신, 센서 시작/정지, 분석 시퀀스, 캡처/공유 트리거
├── lib/
│   ├── vision.js           # 카메라 스트림, MediaPipe Face Mesh, 거리·안정성 추정
│   ├── audio.js            # 마이크 스트림, Web Audio 분석, 키스 사운드 감지
│   ├── score.js            # 진정성 점수 + 성향 분류
│   ├── report.js           # 리포트 데이터 생성 + HTML 렌더링
│   ├── capture.js          # html2canvas 동적 로드 + #report-capture PNG 캡처
│   └── finale.js           # 의도 노출 페이지: 페이드, BGM, 타자기, 공유 버튼
├── design/
│   ├── tokens.md           # 디자인 토큰
│   └── screens.md          # 화면별 레이아웃 명세
├── ppoppoppo.mp3           # finale BGM (별도 추가 필요)
├── PRD.md                  # 제품 기획 문서
├── TASK.md                 # 구현 작업 분해 / 진행 상태
└── README.md
```

---

## 아키텍처

### 진입점: `app.js`

- 5개 화면을 `data-active-screen` 속성으로 전환하는 단순 상태머신.
- `lib/vision.js`, `lib/audio.js`로부터 들어온 실시간 갱신을 `state.vision`,
  `state.audio`에 모은다.
- Action 화면에서 약 3.2초 동안 `runAnalysisSequence`를 돌리면서 `requestAnimationFrame`
  루프로 표본을 누적하고, 끝날 때 `score.js` → `report.js`로 넘긴다.
- **카메라 트랙을 끊기 직전에 `captureLastVideoFrame()`이 `#video`의 마지막 프레임을
  좌우 반전해서 JPEG dataURL로 잡아 둔다.** 이 dataURL은 `state.shameImageUrl`에만
  머무르고 finale 페이지의 배경으로만 쓰인다.
- `#reveal-intent-btn` 클릭 시 `runFinale({ shameImageUrl, onSwitchScreen })`을 호출.
  반드시 클릭 이벤트 동기 체인 안에서 호출해야 finale 모듈이 만드는
  `new Audio(...).play()`가 브라우저 autoplay 정책을 통과한다.

### `lib/vision.js`

- `getUserMedia({ video })`로 전면 카메라를 가져와 `<video id="video">`에 부착.
- `@mediapipe/face_mesh`를 ESM CDN으로 동적 로드. 입술 4점(13, 14, 78, 308)과
  얼굴 박스 비율을 가지고 화면 접근도(`proximity`)를 추정한다.
- 최근 30프레임의 `proximity` 표준편차 → `distanceStability`.
- `getUserMedia` 또는 MediaPipe 로드가 실패하면 sin 함수 기반 fallback 신호로
  데모를 이어 간다. UI에 `데모` 라벨이 뜬다.

### `lib/audio.js`

- `getUserMedia({ audio })` + `AnalyserNode`로 RMS, 피크 dB 계산.
- 짧은 어택 + 빠른 디케이 패턴을 키스 사운드로 본다.
- 권한 거부/실패 시 노이즈 fallback.

### `lib/score.js`

- 거리 안정성, 정규화된 dB, 키스 보너스를 가중합해 0~100점.
- 점수와 패턴을 가지고 `sincere | performative | dependent | avoidant` 중 하나로 분류.

### `lib/report.js`

- 점수 구간별 헤드라인, 메트릭 4행 표, 가상 성능 향상 문구, 명조체 처방전을 조합해
  Report 화면에 삽입할 HTML 문자열을 만든다.

### `lib/capture.js`

- 사용자가 명시적으로 `저장하기`를 눌렀을 때만 `html2canvas`를 동적 로드해서
  `#report-capture` 영역을 PNG로 다운로드한다.

### `lib/finale.js` — 의도 노출 페이지

전체 시퀀스를 비동기 함수 하나(`runFinale`)로 묶어 두었다.

```text
runFinale()
 ├─ applyShameBackground(dataURL)   ─ .finale-shame 레이어에 배경 이미지 셋업
 ├─ startBgm()                      ─ Audio 객체 생성 + 4초 볼륨 페이드인
 ├─ data-finale-fading="out" 토글   ─ 리포트 1.5s 페이드아웃
 ├─ await sleep(1500)
 ├─ onSwitchScreen()                ─ app.js가 setScreen('finale') 실행
 ├─ data-finale-fading="in"
 ├─ await sleep(700)                ─ 화면 페이드인 살짝 기다리기
 ├─ runTypewriter()                 ─ FINALE_SEGMENTS를 글자 단위로 출력
 ├─ revealPrivacyNote()             ─ 프라이버시 안내 페이드인
 └─ revealShareButton()             ─ 1.5s 뒤 공유 버튼 슬라이드인
```

본문은 모듈 상단의 `FINALE_SEGMENTS` 상수에서 정의되며, 단락마다 태그(`h2`/`p`)와
줄바꿈(`<br>`) 위치를 명시한다. 타이핑 속도는 글자당 65ms 기본, 구두점 뒤에는
180ms 추가 휴지를 둔다 — 자연스럽게 호흡이 맺히도록.

공유 버튼은 `navigator.share`가 있으면 그것을 쓰고, 없으면 `navigator.clipboard`로
링크를 복사한 뒤 잠깐 토스트 라벨로 알린다.

---

## 프라이버시 자세

뽀뽀뽀의 콘셉트가 "자신이 기기에 뽀뽀하는 모습을 직시하기"이기 때문에, 사용자에게
**자기 얼굴을 카메라에 붙여 달라고 부탁한다.** 이 자체가 의심을 사기 쉬운 요청이라
다음 원칙을 코드 레벨에서 지킨다.

- **서버 없음.** 정적 파일 호스팅(Vercel)만 쓰고 백엔드/DB가 없다.
- **외부 송신 없음.** 미디어 프레임/오디오 버퍼/캡처 이미지를 `fetch`,
  `XMLHttpRequest`, `WebSocket`, `sendBeacon` 어디로도 보내지 않는다.
- **영속화 없음.** `localStorage`, `IndexedDB`, `cookie`에 미디어 데이터를 쓰지
  않는다. `state.shameImageUrl`은 메모리상의 dataURL일 뿐이고 탭이 닫히면 사라진다.
- **외부 네트워크는 정적 자원 로딩만.** Pretendard 폰트, Nanum Myeongjo 폰트,
  MediaPipe Face Mesh 모델, html2canvas 모듈을 CDN에서 받는다. 미디어는 이쪽으로도
  나가지 않는다.
- **이미지 다운로드는 명시적 클릭 시에만.** 결과 카드 PNG는 사용자가 `저장하기`를
  눌렀을 때만 로컬 파일로 떨어진다.

이 원칙을 사용자가 의심할 만한 세 곳(scan/report/finale)에서 격식체 한국어로
명시한다 — 본문 톤은 의도적으로 반말이지만 프라이버시 고지는 신뢰감을 위해
존댓말로 분리했다.

---

## 실행 방법

빌드 과정이 없다. 정적 파일 서버만 있으면 된다.

```bash
python3 -m http.server 8000
# 또는
npx serve
```

```text
http://localhost:8000
```

카메라/마이크는 보안 컨텍스트에서만 동작한다. 로컬은 `localhost`가 허용되고
배포 환경에서는 HTTPS가 필요하다.

### finale BGM 추가

`ppoppoppo.mp3` 파일을 프로젝트 루트에 두면 자동으로 로드된다. 없으면 finale 페이지의
모든 시각 연출은 정상 동작하고 음성만 빠진다 — `lib/finale.js`가 autoplay 실패를
조용히 삼킨다.

---

## 기술 스택

- HTML, CSS, Vanilla JavaScript (ES Modules)
- MediaPipe Face Mesh (CDN)
- Web Audio API
- Web Share API (+ Clipboard API fallback)
- html2canvas (CDN, 동적 로드)
- Pretendard, Nanum Myeongjo (CDN)
- 정적 호스팅: Vercel

---

## 배포

`vercel link`로 한 번 연결돼 있다.

```bash
vercel deploy --prod --yes
```

---

## 문서

- [PRD.md](./PRD.md) — 기획 배경, 기능 범위, 발표 전략
- [TASK.md](./TASK.md) — 구현 작업 분해와 체크리스트
- [design/tokens.md](./design/tokens.md) — 색상, 타이포그래피, 간격, 리포트 카드 규칙
- [design/screens.md](./design/screens.md) — 화면별 레이아웃과 DOM 계약
