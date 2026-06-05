# Task 4 부분 리포트: Bridge/spec 응답 정규화 분리

작성일: 2026-06-05

## 범위

Task 4 전체 중 상태 mutation 없이 분리 가능한 계산/정규화 helper를 `content-bridge-specs.js`로 옮겼다.

- bridge spec state signature 생성
- bridge token context label 생성
- bridge token specs 응답 정규화
- snapshot token specs 응답 정규화
- inspector spec override/color registry shape 정규화

`refreshBridgeInspectorSpecs`와 `refreshSnapshotInspectorSpecs` 함수 자체는 아직 `content.js`에 남겼다. 두 함수는 runtime messaging, 전역 상태 갱신, connection UI 갱신 흐름과 연결되어 있어 다음 하위 태스크에서 더 작게 분리하는 것이 안전하다.

## 변경 파일

- `content-bridge-specs.js`
  - `createContentBridgeSpecs`
  - `normalizeInspectorSpecOverrides`
  - `normalizeColorRegistry`
  - `normalizeBridgeInspectorSpecsResponse`
  - `normalizeSnapshotInspectorSpecsResponse`
  - `getBridgeSpecStateSignature`
  - `getBridgeTokenContextLabel`
- `content-bridge-specs.test.js`
  - signature 정렬/중복 제거 테스트
  - bridge payload 정규화 테스트
  - snapshot empty state 정규화 테스트
  - bridge/snapshot context label 테스트
- `content.js`
  - bridge/snapshot 응답 해석 로직을 새 helper로 위임
  - signature/context label wrapper만 유지
- `background-logic.js`
  - content script injection 목록에 `content-bridge-specs.js` 추가
- `background-logic.test.js`
  - injection order 기대값 갱신
- `scripts/run-uiux-fixture-qa.mjs`
  - fixture QA injection 목록에 `content-bridge-specs.js` 추가
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`
  - Task 4 진행 중 및 부분 완료 상태 기록

## 줄 수 변화

Task 4 부분 완료 기준:

- `content.js`: 2,407줄에서 2,355줄
- `content-bridge-specs.js`: 142줄
- `content-bridge-specs.test.js`: 131줄

## 동작 변경 여부

동작 변경 없음.

기존 bridge/snapshot refresh 호출부와 전역 상태 갱신 흐름은 유지했고, 응답 payload를 동일한 shape으로 만드는 부분만 새 helper로 옮겼다.

## 검증

- `node --check content.js`: 통과
- `node --check content-bridge-specs.js`: 통과
- `node --test content-bridge-specs.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 58개 테스트
- `npm run check:all`: 통과, 168개 테스트
- `git diff --check`: 통과

## 다음 하위 태스크 제안

Task 4의 남은 범위인 refresh orchestration을 더 작게 분리한다.

권장 순서:

1. `refreshBridgeInspectorSpecs`에서 상태 갱신 결과 객체를 만드는 부분과 실제 전역 변수 대입 부분을 분리한다.
2. `refreshSnapshotInspectorSpecs`도 같은 패턴으로 맞춘다.
3. runtime messaging은 `content.js`에 남기고, 상태 계산 helper만 먼저 옮긴다.
4. 상태 mutation까지 옮길지는 다음 검증 후 판단한다.
