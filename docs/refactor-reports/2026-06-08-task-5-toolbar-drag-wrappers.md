# Task 5 Toolbar Drag Wrapper 분리 리포트

작성일: 2026-06-08

## 범위

Task 5의 남은 하위 작업 중 toolbar drag wrapper 일부를 분리했다.

분리 원칙:

- toolbar drag 상태 판단과 summary panel docking orchestration은 `content.js`에 유지
- drag 활성/해제 class 처리, pointer capture, 위치 style 적용, 이동 threshold/next position wrapper는 `content-toolbar-ui.js`로 이동
- 기능 변경 없음

## 변경 파일

- `content.js`
- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`

## 분리 내용

`content-toolbar-ui.js`에 다음 helper를 추가했다.

- `clearToolbarDragActiveState`
- `applyToolbarDragActiveState`
- `getToolbarDragMovement`
- `getToolbarDragNextPosition`
- `applyToolbarDragPosition`

`content.js`의 `stopToolbarDrag`, `beginToolbarDrag`, `moveToolbarDrag`는 기존 전역 상태 mutation과 summary panel docking 판단을 유지하면서 새 helper를 호출하도록 정리했다.

## 줄 수 변화

작업 후:

```text
2301 content.js
155 content-toolbar-ui.js
259 content-toolbar-ui.test.js
2715 total
```

핸드오프 기준:

```text
2318 content.js
79 content-toolbar-ui.js
144 content-toolbar-ui.test.js
2541 total
```

변화:

- `content.js`: 17줄 감소
- `content-toolbar-ui.js`: 76줄 증가
- `content-toolbar-ui.test.js`: 115줄 증가

## 검증

Focused 검증:

```bash
node --check content.js
node --check content-toolbar-ui.js
node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js
```

결과:

- 64개 테스트 통과
- 실패 없음

전체 검증:

```bash
npm run check:all
```

결과:

- 180개 테스트 통과
- 실패 없음

## 다음 작업

Task 5에서 아직 남은 권장 범위:

1. toolbar visibility state 반영 helper 분리
2. toolbar button event binding 분리
3. `syncToolbar`의 markup 교체와 event 재바인딩 경계 정리
4. Task 5 완료 리포트 작성
