# Task 3 리포트: Token suggestion 유틸 분리

작성일: 2026-06-05

## 범위

Inspector hover card에서 사용하는 대체 토큰 추천 계산을 `content-token-suggestions.js`로 분리했다.

- suggested token ranking
- violation tag에서 token name 추출
- issue category별 suggested token 계산

색상 registry 조회, active inspector spec 조회, violation message parsing은 기존 모듈/상태의 책임으로 남기고 함수 주입 방식으로 연결했다.

## 변경 파일

- `content-token-suggestions.js`
  - `createContentTokenSuggestions`
  - `rankSuggestedTokens`
  - `extractTokenNamesFromTag`
  - `getSuggestedTokensForIssue`
- `content-token-suggestions.test.js`
  - token ranking 테스트
  - tag token extraction 테스트
  - color/spacing raw-value suggestion 테스트
  - non raw-value guard 테스트
- `content.js`
  - token suggestion helper 구현 제거
  - `createContentTokenSuggestions` 연결
- `background-logic.js`
  - content script injection 목록에 `content-token-suggestions.js` 추가
- `background-logic.test.js`
  - injection order 기대값 갱신
- `scripts/run-uiux-fixture-qa.mjs`
  - fixture QA injection 목록에 `content-token-suggestions.js` 추가
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`
  - Task 3 완료 상태 기록

## 줄 수 변화

Task 3 완료 기준:

- `content.js`: 2,452줄에서 2,407줄
- `content-token-suggestions.js`: 72줄
- `content-token-suggestions.test.js`: 91줄

## 동작 변경 여부

동작 변경 없음.

기존 `getSuggestedTokensForIssue` 호출부는 그대로 유지했고, 내부 계산만 새 factory로 옮겼다. 최신 bridge/snapshot spec과 color registry는 함수 주입으로 계속 현재 상태를 읽는다.

## 검증

- `node --check content.js`: 통과
- `node --check content-token-suggestions.js`: 통과
- `node --test content-token-suggestions.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 59개 테스트
- `npm run check:all`: 통과, 164개 테스트
- `git diff --check`: 통과

## 다음 태스크 제안

Task 4. Bridge/spec loading 유틸 분리를 진행한다.

권장 순서:

1. `getBridgeSpecStateSignature`, `refreshBridgeInspectorSpecs`, `refreshSnapshotInspectorSpecs` 주변 의존성을 먼저 수집한다.
2. signature 생성처럼 순수한 계산부터 `content-bridge-specs.js`로 분리한다.
3. runtime messaging과 전역 상태 mutation은 한 번에 옮기지 말고 두 번째 하위 태스크로 나눈다.
4. 각 하위 태스크마다 `npm run check:all`을 실행한다.
