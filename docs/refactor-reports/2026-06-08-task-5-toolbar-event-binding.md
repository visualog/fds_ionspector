# Task 5 Toolbar Event Binding 분리 리포트

작성일: 2026-06-08

## 범위

Task 5의 toolbar button event binding 중 상태 mutation이 적은 DOM wiring 범위를 `content-toolbar-ui.js`로 분리했다.

분리 원칙:

- filter, refresh, close click처럼 앱 상태를 직접 바꾸는 orchestration은 `content.js`에 유지
- toolbar pointer drag handler 연결, toolbar button tooltip hover/blur/pointerdown 연결, move button click neutralization만 helper로 이동
- 기능 변경 없음

## 변경 파일

- `content.js`
- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`

## 분리 내용

`content-toolbar-ui.js`에 다음 helper를 추가했다.

- `bindToolbarPointerEvents`
- `bindToolbarButtonHoverEvents`
- `clearToolbarMoveButtonClick`

`content.js`의 `bindToolbarEvents()`는 위 helper를 호출하고, filter/refresh/close/panel close click handler는 기존 위치에 남겼다.

## 줄 수 변화

작업 후:

```text
2296 content.js
242 content-toolbar-ui.js
398 content-toolbar-ui.test.js
2936 total
```

직전 리포트 기준:

```text
2310 content.js
193 content-toolbar-ui.js
338 content-toolbar-ui.test.js
2841 total
```

변화:

- `content.js`: 14줄 감소
- `content-toolbar-ui.js`: 49줄 증가
- `content-toolbar-ui.test.js`: 60줄 증가

## 검증

Focused 검증:

```bash
node --check content.js
node --check content-toolbar-ui.js
node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js
```

결과:

- 70개 테스트 통과
- 실패 없음

전체 검증:

```bash
npm run check:all
```

결과:

- 186개 테스트 통과
- 실패 없음

## 다음 작업

Task 5에서 아직 남은 권장 범위:

1. filter/refresh/close click handler의 command callback 주입 구조 검토
2. `syncToolbar`의 markup 교체와 event 재바인딩 경계 정리
3. Task 5 완료 리포트 작성
