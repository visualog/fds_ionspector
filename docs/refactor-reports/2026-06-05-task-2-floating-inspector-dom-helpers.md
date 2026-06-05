# Task 2 리포트: Floating inspector DOM helper 분리

작성일: 2026-06-05

## 범위

Floating inspector 관련 DOM 표시 helper 중 동작 변경 없이 분리 가능한 항목을 `content-floating-inspector.js`로 옮겼다.

- violation pin label 생성
- violation pin target visibility 판정
- inspector card hide timer controller

DOM 렌더링, 이벤트 바인딩, inspector card markup 생성은 아직 `content.js`에 남겼다. 해당 영역은 상태와 DOM 의존성이 커서 이후 UI orchestration 태스크에서 다루는 것이 안전하다.

## 변경 파일

- `content-floating-inspector.js`
  - `getViolationPinLabel`
  - `isViolationPinTargetVisible`
  - `createInspectorCardHideTimer`
- `content-floating-inspector.test.js`
  - label formatting 테스트
  - target visibility 테스트
  - hide timer schedule/clear 테스트
- `content.js`
  - floating inspector helper destructuring 추가
  - inspector card timer 상태/구현을 controller로 위임
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`
  - Task 2 완료 상태 기록

## 줄 수 변화

Task 2 완료 기준:

- `content.js`: 2,472줄에서 2,452줄
- `content-floating-inspector.js`: 99줄에서 156줄
- `content-floating-inspector.test.js`: 46줄에서 135줄

## 동작 변경 여부

동작 변경 없음.

기존 호출부 함수명인 `clearInspectorCardHideTimer`와 `scheduleTransientInspectorPreviewClear`는 유지했고, 내부 timer 저장/해제/예약 책임만 `createInspectorCardHideTimer`로 위임했다.

## 검증

- `node --check content.js`: 통과
- `node --check content-floating-inspector.js`: 통과
- `node --test content-floating-inspector.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 60개 테스트
- `npm run check:all`: 통과, 159개 테스트
- `git diff --check`: 통과

## 다음 태스크 제안

Task 3. Token suggestion 유틸 분리를 진행한다.

권장 순서:

1. `content.js`에서 suggested token 관련 함수 목록을 먼저 수집한다.
2. DOM 접근이 없는 ranking/parsing 함수만 `content-token-suggestions.js`로 분리한다.
3. `content-token-suggestions.test.js`를 추가해 기존 추천 결과를 고정한다.
4. `npm run check:all`로 전체 검증한다.
