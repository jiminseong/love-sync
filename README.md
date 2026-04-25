# 뽀뽀뽀

화면에 가볍게 뽀뽀하면 사랑 점수를 알려주는 가벼운 웹 장난감.

카메라와 마이크 입력은 전부 브라우저 안에서만 처리하고, 서버로 보내거나 저장하지 않는다.

## 기능

- Landing → Scan → Action → Report 4화면 단일 페이지 플로우
- MediaPipe Face Mesh로 입술 거리/안정성 측정
- Web Audio API로 RMS/피크 dB 측정 + 짧은 뽀뽀 사운드 감지
- 거리/소리/안정성 가중합으로 사랑 점수(0~100) 계산
- html2canvas로 결과 카드 PNG 저장
- 카메라/마이크/MediaPipe 실패 시 데모용 fallback

## 흐름

1. `Landing`: 인사 + 시작 버튼.
2. `Scan`: 카메라/마이크 권한 요청 + 입술 가이드.
3. `Action`: 약 3.2초간 측정 진행 + 파형/지표 표시.
4. `Report`: 점수 카드 + 짧은 코멘트 + 저장/다시 하기.

## 프로젝트 구조

```text
.
├── index.html          # 4개 화면 마크업과 앱 진입점
├── styles.css          # 라이트 핑크 테마, 화면 전환, 리포트 카드 스타일
├── app.js              # 화면 상태머신, 센서 시작/정지, 분석 시퀀스 통합
├── lib/
│   ├── vision.js       # 카메라 스트림, MediaPipe Face Mesh, 거리 안정성 계산
│   ├── audio.js        # 마이크 스트림, Web Audio 분석, 키스 사운드 감지
│   ├── score.js        # 진정성 점수와 성향 분류
│   ├── report.js       # 리포트 데이터 생성 및 HTML 렌더링
│   └── capture.js      # 리포트 카드 PNG 캡처/다운로드
├── design/
│   ├── tokens.md       # 디자인 토큰
│   └── screens.md      # 4개 화면 명세
├── PRD.md              # 제품 기획 문서
└── TASK.md             # 구현 작업 분해 및 진행 상태
```

## 실행 방법

빌드 과정은 없습니다. 정적 파일 서버만 있으면 실행됩니다.

```bash
python3 -m http.server 8000
```

브라우저에서 아래 주소를 엽니다.

```text
http://localhost:8000
```

카메라와 마이크 권한이 필요한 기능은 보안 컨텍스트에서 동작합니다. 로컬 개발에서는 `localhost`가 허용되며, 배포 환경에서는 HTTPS가 필요합니다.

## 기술 구성

- HTML, CSS, Vanilla JavaScript
- ES Modules
- MediaPipe Face Mesh CDN
- Web Audio API
- html2canvas CDN
- 정적 호스팅 지원: GitHub Pages, Vercel, Netlify 등

## 핵심 모듈

### `app.js`

`landing -> scan -> action -> report` 화면 전환을 관리합니다. Vision/Audio 모듈에서 들어온 실시간 값을 상태에 반영하고, 분석 타이머가 끝나면 `score.js`와 `report.js`를 호출해 최종 리포트를 렌더링합니다.

### `lib/vision.js`

`getUserMedia({ video: ... })`로 카메라 스트림을 가져오고 MediaPipe Face Mesh를 동적으로 로드합니다. 입술 랜드마크와 얼굴 박스 비율을 이용해 화면 접근도를 추정하고, 최근 30프레임의 표준편차로 거리 안정성을 계산합니다.

### `lib/audio.js`

`getUserMedia({ audio: ... })`와 `AnalyserNode`로 오디오 파형을 프레임 단위로 분석합니다. RMS/피크 dB를 계산하고, 짧은 어택 구간을 기준으로 키스 사운드를 감지합니다.

### `lib/score.js`

거리 안정성, 정규화된 dB, 키스 감지 보너스를 가중합해 `sincerityScore`를 계산합니다. 결과 점수와 입력 패턴을 바탕으로 `sincere`, `performative`, `dependent`, `avoidant` 중 하나의 성향을 분류합니다.

### `lib/report.js`

점수 구간별 헤드라인, 메트릭 표, 가상 성능 향상 문구, 처방전 템플릿을 조합해 리포트 데이터를 만들고, Report 화면에 삽입할 HTML 문자열을 생성합니다.

### `lib/capture.js`

`html2canvas`를 동적으로 로드해 `#report-capture` 영역을 PNG로 캡처하고, 사용자가 명시적으로 저장 버튼을 눌렀을 때만 다운로드를 실행합니다.

## 프라이버시

- 카메라/마이크 스트림은 브라우저 런타임 안에서만 사용합니다.
- 미디어 프레임과 오디오 버퍼를 `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`으로 전송하지 않습니다.
- `localStorage`나 `IndexedDB`에 미디어 데이터를 저장하지 않습니다.
- 외부 네트워크 사용은 정적 폰트, MediaPipe 모델, html2canvas 모듈 로딩에 한정됩니다.
- 리포트 이미지는 사용자가 저장 버튼을 누를 때 로컬 파일로만 생성됩니다.

## 배포 메모

정적 파일만 업로드하면 됩니다. 단, 실제 카메라/마이크 권한을 사용하려면 HTTPS 환경이어야 합니다.

```bash
# 예: Vercel CLI 인증이 되어 있는 경우
vercel deploy --prod --yes
```

## 문서

- [PRD.md](./PRD.md): 기획 배경, 기능 범위, 발표 전략
- [TASK.md](./TASK.md): 구현 작업 분해와 체크리스트
- [design/tokens.md](./design/tokens.md): 색상, 타이포그래피, 간격, 리포트 카드 규칙
- [design/screens.md](./design/screens.md): 화면별 레이아웃과 DOM 계약
