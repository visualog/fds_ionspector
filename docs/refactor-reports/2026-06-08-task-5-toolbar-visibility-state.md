# Task 5 Toolbar Visibility State 분리 리포트

작성일: 2026-06-08

## 범위

Task 5의 toolbar visibility/collapse state 계산 일부를 `content-toolbar-ui.js`로 분리했다.

분리 원칙:

- `content.js`의 전역 상태 대입과 toolbar rendering orchestration은 유지
- collapse 가능 여부, collapse 상태 정규화, collapsed toolbar model 구성만 helper로 이동
- 기능 변경 없음

## 변경 파일

- `content.js`
- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`

## 분리 내용

`content-toolbar-ui.js`에 다음 helper를 추가했다.

- `getToolbarCollapsedState`
- `getToolbarModelVisibilityState`
- `createCollapsedToolbarModel`

`content.js`에서는 다음 흐름만 helper 호출로 대체했다.

- `setToolbarCollapsed()`의 active filter 기반 collapse guard
- `getToolbarModel()`의 default mode collapse 가능 여부 계산
- collapsed toolbar model 생성

## 줄 수 변화

작업 후:

```text
2310 content.js
193 content-toolbar-ui.js
338 content-toolbar-ui.test.js
2841 total
```

직전 리포트 기준:

```text
2301 content.js
155 content-toolbar-ui.js
259 content-toolbar-ui.test.js
2715 total
```

변화:

- `content.js`: 9줄 증가
- `content-toolbar-ui.js`: 38줄 증가
- `content-toolbar-ui.test.js`: 79줄 증가

`content.js`는 destructuring과 explicit helper 호출 때문에 이번 하위 단계에서는 줄 수가 늘었다. 대신 collapse 규칙이 `content-toolbar-ui.js` 단위 테스트로 고정되었다.

## 검증

Focused 검증:

```bash
node --check content.js
node --check content-toolbar-ui.js
node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js
```

결과:

- 67개 테스트 통과
- 실패 없음

전체 검증:

```bash
npm run check:all
```

결과:

- 183개 테스트 통과
- 실패 없음

## 다음 작업

Task 5에서 아직 남은 권장 범위:

1. toolbar button event binding 분리
2. `syncToolbar`의 markup 교체와 event 재바인딩 경계 정리
3. Task 5 완료 리포트 작성
