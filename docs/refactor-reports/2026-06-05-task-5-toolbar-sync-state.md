# Task 5 부분 리포트: Toolbar sync state helper 분리

작성일: 2026-06-05

## 범위

`syncToolbar` 내부에서 toolbar model을 root/toolbar DOM 상태로 반영하는 부분을 `content-toolbar-ui.js`로 분리했다.

- root dataset 반영
- toolbar dataset 반영
- toolbar width/status width CSS custom property 반영
- toolbar spec CSS variable 적용 callback 호출

markup 생성, innerHTML 교체, tooltip 숨김, toolbar event 재바인딩은 아직 `content.js`에 남겼다.

## 변경 파일

- `content-toolbar-ui.js`
  - `applyToolbarSyncState`
- `content-toolbar-ui.test.js`
  - dataset/CSS custom property 반영 테스트
- `content.js`
  - `syncToolbar`에서 `applyToolbarSyncState` 호출
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`
  - Task 5 두 번째 부분 완료 상태 기록

## 줄 수 변화

Task 5 두 번째 부분 완료 기준:

- `content.js`: 2,318줄 유지
- `content-toolbar-ui.js`: 55줄에서 79줄
- `content-toolbar-ui.test.js`: 109줄에서 144줄

이번 하위 단계는 줄 수를 줄이기보다 `syncToolbar`의 DOM 반영 책임을 분리해 다음 event binding/drag 분리의 경계를 만들기 위한 작업이다.

## 동작 변경 여부

동작 변경 없음.

기존 `syncToolbar`의 model 생성, markup 비교, innerHTML 교체, `bindToolbarEvents` 호출 순서는 유지했다.

## 검증

- `node --check content.js`: 통과
- `node --check content-toolbar-ui.js`: 통과
- `node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 59개 테스트
- `npm run check:all`: 통과, 175개 테스트
- `git diff --check`: 통과

## 다음 하위 태스크 제안

다음은 실제 줄 수 감소 효과가 큰 영역을 고른다.

1. toolbar drag wrapper 분리: `stopToolbarDrag`, `beginToolbarDrag`, `moveToolbarDrag`의 style 적용과 docked summary panel reposition helper를 분리한다.
2. toolbar event binding 분리: `bindToolbarEvents`는 상태 mutation과 scan 호출이 많으므로 마지막에 진행한다.

권장 시작점은 toolbar drag wrapper다.
