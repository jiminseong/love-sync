# 🤝 Agent Teams 운영 가이드 — 러브-싱크

## 등록된 에이전트
| 이름 | 파일 | 역할 |
|---|---|---|
| `designer` | `.claude/agents/designer.md` | 시각 언어 명세 (마크다운만) |
| `publisher` | `.claude/agents/publisher.md` | HTML/CSS 구현 |
| `service-dev` | `.claude/agents/service-dev.md` | JS 로직 전체 |

## 오케스트레이션 룰

### 의존성
```
designer → publisher
        ↘
          service-dev  (publisher와 병렬 가능, DOM 계약만 준수)
```

### 호출 순서 (TASK.md 슬롯과 일치)
1. **S0 (0:00–0:15)** — `designer` 단독 실행. 산출물: `design/tokens.md`, `design/screens.md`.
2. **S1 + S1' (0:15–0:35)** — `publisher`와 `service-dev`를 **한 메시지에 두 Agent 호출로 병렬 실행**. 둘 다 TASK.md §1 인터페이스 계약을 사전 합의로 가짐.
3. **S2 (0:35–0:50)** — `service-dev` 단독. 통합 + 더미 풀 플로우 보장.
4. **S3 (0:50–1:30)** — `service-dev` 단독. Vision.
5. **S4 (1:30–2:00)** — `service-dev` 단독. Audio.
6. **S5 (2:00–2:20)** — `publisher` + `designer` 병렬. 연출 강화.
7. **S6 (2:20–2:30)** — 메인 컨텍스트(오케스트레이터)가 직접 배포.

### 병렬 호출 예시 (S1 + S1')
오케스트레이터(메인 Claude)가 한 메시지에 두 개의 Agent 도구 호출을 동시에 발사한다:
- Agent(subagent_type=`publisher`, prompt="S1 작업: TASK.md §3 S1 항목 완수. design/*.md 읽고 구현.")
- Agent(subagent_type=`service-dev`, prompt="S1' 작업: TASK.md §3 S1' 항목 완수. publisher와 병렬, DOM 계약 준수.")

### 충돌 방지
- `index.html`/`styles.css`는 `publisher`만 쓴다.
- `*.js`는 `service-dev`만 쓴다.
- `design/*.md`는 `designer`만 쓴다.
- 어떤 에이전트라도 TASK.md §1 인터페이스 변경이 필요하면 코드 수정 전에 TASK.md를 먼저 갱신하고 보고한다.

## 호출할 때 줄 컨텍스트 (프롬프트 템플릿)
> 본 프로젝트의 PRD는 `PRD.md`, 작업 분해는 `TASK.md`다. 너는 `<agent>` 역할이며 `.claude/agents/<agent>.md`의 규칙을 절대 어기지 마라. 이번 호출의 목표는 TASK.md §<슬롯>의 모든 체크박스를 완료하는 것. 끝나면 다음을 보고: (1) 생성/수정 파일 목록 (2) 인터페이스 계약 위반 여부 (3) 다음 에이전트가 알아야 할 변경사항.
