# Task 5 Toolbar Filter Action 분리 리포트

작성일: 2026-06-08

## 범위

Task 5의 toolbar filter click handler에서 action 결정 로직과 DOM event binding 일부를 `content-toolbar-ui.js`로 분리했다.

분리 원칙:

- filter 변경, summary panel 열기, toolbar collapse, panel docking 같은 상태 mutation은 `content.js`에 유지
- suppress click guard, invalid filter guard, active filter 재클릭 분기, 다른 filter 활성화 분기만 helper로 이동
- 기능 변경 없음

## 변경 파일

- `content.js`
- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`

## 분리 내용

`content-toolbar-ui.js`에 다음 helper를 추가했다.

- `getToolbarFilterClickAction`
- `bindToolbarFilterButtonEvents`

`content.js`에는 `handleToolbarFilterAction()`을 추가해 helper가 만든 action을 기존 orchestration으로 실행하게 했다.

Action 종류:

- `ignored`
- `activate-filter`
- `open-active-summary`
- `toggle-active-filter`

## 줄 수 변화

작업 후:

```text
2306 content.js
283 content-toolbar-ui.js
479 content-toolbar-ui.test.js
3068 total
```

직전 리포트 기준:

```text
2296 content.js
242 content-toolbar-ui.js
398 content-toolbar-ui.test.js
2936 total
```

변화:

- `content.js`: 10줄 증가
- `content-toolbar-ui.js`: 41줄 증가
- `content-toolbar-ui.test.js`: 81줄 증가

`content.js`는 action 실행 함수가 생기며 줄 수가 증가했다. 대신 filter click 분기 조건이 `content-toolbar-ui.test.js`에서 독립적으로 검증된다.

## 검증

Focused 검증:

```bash
node --check content.js
node --check content-toolbar-ui.js
node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js
```

결과:

- 72개 테스트 통과
- 실패 없음

전체 검증:

```bash
npm run check:all
```

결과:

- 188개 테스트 통과
- 실패 없음

## 다음 작업

Task 5에서 아직 남은 권장 범위:

1. refresh/close/panel close click handler의 command callback 주입 구조 검토
2. `syncToolbar`의 markup 교체와 event 재바인딩 경계 정리
3. Task 5 완료 리포트 작성
