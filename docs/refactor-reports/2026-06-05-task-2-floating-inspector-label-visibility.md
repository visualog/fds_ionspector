# Task 2 부분 리포트: Floating inspector label/visibility helper 분리

작성일: 2026-06-05

## 범위

Task 2 전체 중 동작 변경 없이 안전하게 분리 가능한 작은 하위 범위만 진행했다.

- violation pin label 생성 helper
- violation pin target visibility 판정 helper

`inspector card delay/clear helper` 분리는 다음 하위 태스크로 남겼다.

## 변경 파일

- `content-floating-inspector.js`
  - `getViolationPinLabel`
  - `isViolationPinTargetVisible`
- `content-floating-inspector.test.js`
  - label formatting 테스트 추가
  - viewport visibility 테스트 추가
- `content.js`
  - 새 floating inspector 모듈에서 두 helper를 받아 사용
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`
  - Task 2 부분 완료 상태 기록

## 줄 수 변화

- `content.js`: 2,472줄에서 2,454줄
- `content-floating-inspector.js`: 99줄에서 122줄
- `content-floating-inspector.test.js`: 46줄에서 100줄

## 동작 변경 여부

동작 변경 없음.

기존 `content.js` 내부 helper의 로직을 같은 조건과 반환값으로 `content-floating-inspector.js`에 옮겼고, 호출부는 같은 이름의 helper를 계속 사용한다.

## 검증

- `node --check content.js`: 통과
- `node --check content-floating-inspector.js`: 통과
- `node --test content-floating-inspector.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 59개 테스트
- `npm run check:all`: 통과, 158개 테스트
- `git diff --check`: 통과

## 다음 하위 태스크 제안

Task 2의 남은 범위인 inspector card delay/clear helper를 계속 분리한다.

권장 순서:

1. `scheduleTransientInspectorPreviewClear`, `clearInspectorCardHideTimer` 등 timer helper의 의존 상태를 확인한다.
2. 순수 timer 계산 또는 timer 제어 wrapper만 먼저 분리한다.
3. DOM event binding이나 card rendering은 이번 Task 2에서 억지로 옮기지 않고 다음 UI orchestration 태스크로 미룬다.
