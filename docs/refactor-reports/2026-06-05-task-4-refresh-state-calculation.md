# Task 4 부분 리포트: Refresh state 계산 분리

작성일: 2026-06-05

## 범위

Bridge/spec refresh 함수에서 response를 다음 전역 상태 조각으로 바꾸는 계산 책임을 `content-bridge-specs.js`로 옮겼다.

- bridge token specs refresh state 계산
- snapshot token specs refresh state 계산
- connected bridge 오류 응답에서 기존 plugin id를 유지하는 규칙 보존
- disconnected/null 응답에서 plugin id를 초기화하는 규칙 보존

`safeRuntimeSendMessage` 호출과 실제 전역 변수 대입은 아직 `content.js`에 남겼다.

## 변경 파일

- `content-bridge-specs.js`
  - `createBridgeInspectorSpecsRefreshState`
  - `createSnapshotInspectorSpecsRefreshState`
- `content-bridge-specs.test.js`
  - bridge refresh state 계산 테스트
  - snapshot refresh state 계산 테스트
- `content.js`
  - `refreshBridgeInspectorSpecs`에서 next state helper 사용
  - `refreshSnapshotInspectorSpecs`에서 next state helper 사용
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`
  - Task 4 두 번째 부분 완료 리포트 기록

## 줄 수 변화

Task 4 두 번째 부분 완료 기준:

- `content.js`: 2,355줄에서 2,347줄
- `content-bridge-specs.js`: 142줄에서 183줄
- `content-bridge-specs.test.js`: 131줄에서 189줄

## 동작 변경 여부

동작 변경 없음.

기존 refresh 함수의 async 흐름, runtime action, 전역 상태 대입, 반환 shape은 유지했다. 계산 결과를 만드는 부분만 helper로 분리했다.

## 검증

- `node --check content.js`: 통과
- `node --check content-bridge-specs.js`: 통과
- `node --test content-bridge-specs.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 60개 테스트
- `npm run check:all`: 통과, 170개 테스트
- `git diff --check`: 통과

## 다음 하위 태스크 제안

Task 4를 완료하려면 refresh wrapper 자체를 더 얇게 만든다.

권장 순서:

1. `refreshBridgeInspectorSpecs`와 `refreshSnapshotInspectorSpecs`의 공통 패턴을 비교한다.
2. runtime action 이름과 state apply callback을 받는 helper를 만들지 검토한다.
3. helper 추상화가 오히려 복잡하면 Task 4는 여기서 완료 처리하고 Task 5로 넘어간다.
4. 추가 분리 시 `npm run check:all`로 다시 전체 검증한다.
