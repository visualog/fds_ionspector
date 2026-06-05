# Task 5 부분 리포트: Toolbar shell helper 분리

작성일: 2026-06-05

## 범위

Toolbar UI orchestration 중 상태 의존이 작고 재사용 가능한 DOM helper를 `content-toolbar-ui.js`로 분리했다.

- toolbar button tooltip text 조회
- root visibility 표시/숨김 반영
- inspector UI shell completeness 검사
- toolbar floating position reset
- summary panel floating position reset

`syncToolbar`, toolbar button click binding, drag state mutation은 아직 `content.js`에 남겼다.

## 변경 파일

- `content-toolbar-ui.js`
  - `createContentToolbarUI`
  - `getToolbarButtonTooltip`
  - `setRootVisibility`
  - `isInspectorUIShellComplete`
  - `resetToolbarFloatingPosition`
  - `resetSummaryPanelFloatingPosition`
- `content-toolbar-ui.test.js`
  - tooltip 우선순위 테스트
  - root visibility/body class toggle 테스트
  - shell completeness 테스트
  - toolbar/panel position reset 테스트
- `content.js`
  - toolbar shell helper 구현 제거
  - `createContentToolbarUI` 연결
- `background-logic.js`
  - content script injection 목록에 `content-toolbar-ui.js` 추가
- `background-logic.test.js`
  - injection order 기대값 갱신
- `scripts/run-uiux-fixture-qa.mjs`
  - fixture QA injection 목록에 `content-toolbar-ui.js` 추가
- `content-scan-runner.test.js`
  - shell repair regression이 새 helper 파일을 확인하도록 갱신
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`
  - Task 5 진행 중 및 부분 완료 상태 기록

## 줄 수 변화

Task 5 첫 부분 완료 기준:

- `content.js`: 2,347줄에서 2,318줄
- `content-toolbar-ui.js`: 55줄
- `content-toolbar-ui.test.js`: 109줄

## 동작 변경 여부

동작 변경 없음.

기존 함수명과 호출부는 유지했고, 구현 위치만 `content-toolbar-ui.js`로 이동했다.

## 검증

- `node --check content.js`: 통과
- `node --check content-toolbar-ui.js`: 통과
- `node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 58개 테스트
- `npm run check:all`: 통과, 174개 테스트
- `git diff --check`: 통과

## 다음 하위 태스크 제안

Task 5의 다음 단계는 둘 중 하나로 진행한다.

1. toolbar DOM sync helper 분리: `syncToolbar` 내부에서 root/toolbar dataset과 CSS variable 적용만 `content-toolbar-ui.js`로 이동한다.
2. toolbar drag wrapper 분리: `stopToolbarDrag`, `beginToolbarDrag`, `moveToolbarDrag`의 DOM style 적용 helper만 이동한다.

권장 시작점은 toolbar DOM sync helper다. 클릭 이벤트와 상태 mutation보다 의존성이 작고 검증하기 쉽다.
