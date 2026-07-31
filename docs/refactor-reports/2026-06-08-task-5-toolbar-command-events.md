# Task 5 Toolbar Command Event 분리 리포트

작성일: 2026-06-08

## 범위

Task 5의 toolbar command 버튼과 summary panel close 버튼의 DOM event binding을 `content-toolbar-ui.js`로 분리했다.

분리 원칙:

- refresh scan 실행, toolbar dismiss, summary panel dismiss 같은 상태 mutation은 `content.js`에 유지
- DOM 버튼 조회와 `onclick` wiring만 helper로 이동
- 기능 변경 없음

## 변경 파일

- `content.js`
- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`

## 분리 내용

`content-toolbar-ui.js`에 다음 helper를 추가했다.

- `bindToolbarCommandButtonEvents`
- `bindSummaryPanelCloseButton`

`content.js`의 `bindToolbarEvents()`는 refresh/close 버튼 이벤트를 위 helper로 연결하고, 실제 command 실행은 기존 callback 안에 유지한다.

`updateSummaryUI()`에서 새로 렌더링되는 `.fds-panel-close`도 `bindSummaryPanelCloseButton()`을 통해 재바인딩하도록 정리했다.

## 줄 수 변화

작업 후:

```text
2302 content.js
317 content-toolbar-ui.js
522 content-toolbar-ui.test.js
3141 total
```

직전 Task 5 filter action 리포트 기준:

```text
2306 content.js
283 content-toolbar-ui.js
479 content-toolbar-ui.test.js
3068 total
```

변화:

- `content.js`: 4줄 감소
- `content-toolbar-ui.js`: 34줄 증가
- `content-toolbar-ui.test.js`: 43줄 증가

## 검증

Focused 검증:

```bash
node --check content.js
node --check content-toolbar-ui.js
node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js
```

결과:

- 74개 테스트 통과
- 실패 없음

전체 검증:

```bash
npm run check:all
```

결과:

- 190개 테스트 통과
- 실패 없음

## 다음 작업

Task 5에서 남은 권장 범위:

1. `syncToolbar()`의 markup 교체와 event 재바인딩 경계 정리
2. Task 5 완료 리포트 작성
3. Task 6 Summary panel UI orchestration 분리로 이동
