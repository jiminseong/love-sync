# 뽀뽀뽀 (P.P.O)

화면에 가볍게 뽀뽀하면 사랑 점수를 알려주는 척하는 웹 장난감입니다.
카메라와 마이크로 입술 거리, 흔들림, "쪽" 소리를 읽고 그럴듯한 결과 카드를 보여준 뒤,
마지막에는 사실 우리가 사람보다 기기에 더 자주 애정을 주고 있다는 메시지로 뒤집습니다.

카메라 영상, 마이크 오디오, 캡처된 얼굴 이미지는 브라우저 안에서만 처리됩니다.
Gemini 보강은 Vercel Function을 통해 점수와 메트릭 텍스트만 보내며, 미디어 데이터는
외부로 전송하지 않습니다.

## 흐름

```text
Landing -> Scan -> Report -> Finale
```

1. **Landing**  
   "지금 뽀뽀하러 가기" 버튼으로 카메라와 마이크 권한을 요청합니다.

2. **Scan**  
   라이브 카메라 미리보기와 마이크 분석이 동시에 돌아갑니다. 사용자가 화면에 가까이 다가가
   "쪽" 소리를 내면, 입술 근접도와 소리 어택을 함께 감지해 자동으로 결과를 만듭니다.

3. **Report**  
   사랑 점수, 짧은 한 줄 평, 가벼운 메트릭을 카드로 보여줍니다. Gemini 응답이 제때 오면
   한 줄 평이 자연스럽게 보강되고, 실패하거나 늦으면 기본 문구를 그대로 씁니다.

4. **Finale**  
   리포트가 사라지고, 직전에 캡처한 얼굴이 흐릿한 배경으로 깔립니다. 본문은 타자기처럼
   출력되며 "사람 대신 기기에 뽀뽀한 우리"라는 의도를 드러냅니다.

## 구조

```text
.
├── index.html
├── styles.css
├── app.js
├── api/
│   └── enhance.js
├── lib/
│   ├── audio.js
│   ├── capture.js
│   ├── finale.js
│   ├── gemini.js
│   ├── report.js
│   ├── score.js
│   └── vision.js
├── package.json
└── vercel.json
```

## 프라이버시

- 카메라 프레임, 오디오 버퍼, 얼굴 캡처 이미지는 외부로 보내지 않습니다.
- Gemini에는 점수, 성향, 거리 안정성, 피크 dB, 기기명 같은 텍스트 숫자만 보냅니다.
- `GOOGLE_API_KEY`는 Vercel 환경변수로만 사용하며 클라이언트에 노출하지 않습니다.
- 결과 카드 PNG는 사용자가 `저장하기`를 눌렀을 때만 로컬로 다운로드됩니다.
- 네트워크가 막히거나 Gemini 응답이 실패해도 정적 문구로 전체 흐름이 계속됩니다.

## 실행

```bash
npm install
python3 -m http.server 8000
```

```text
http://localhost:8000
```

카메라와 마이크는 보안 컨텍스트에서만 동작합니다. 로컬에서는 `localhost`, 배포 환경에서는
HTTPS가 필요합니다.

## 배포

Vercel 프로젝트는 이미 연결되어 있습니다.

```bash
vercel deploy --prod --yes
```

`GOOGLE_API_KEY`는 Vercel의 production/preview 환경변수에 등록되어 있어야 합니다.

## 기술

- HTML, CSS, Vanilla JavaScript
- Vercel Functions (Node.js 22)
- Gemini 2.5 Flash
- MediaPipe Face Mesh
- Web Audio API
- html2canvas
- Web Share API
