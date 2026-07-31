# Task 1 리팩터링 리포트: Floating inspector 순수 계산 유틸 분리

작성일: 2026-06-05

## 완료 범위

`content.js`에 있던 위반 핀 위치 계산 로직을 `content-floating-inspector.js`로 분리했다.

분리한 책임:
- rect overlap 면적 계산
- pin position 후보 계산
- viewport clamp 계산
- inspector card와 겹치지 않는 best pin position 선택

## 변경 파일

- `content-floating-inspector.js`
- `content-floating-inspector.test.js`
- `content.js`
- `background-logic.js`
- `background-logic.test.js`
- `content-scan-runner.test.js`
- `scripts/run-uiux-fixture-qa.mjs`
- `package.json`
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`

## 라인 수 변화

- `content.js`: 2,535줄에서 2,472줄로 감소
- 신규 `content-floating-inspector.js`: 99줄
- 신규 `content-floating-inspector.test.js`: 46줄

## 동작 변경 여부

동작 변경 없음.

기존 `positionViolationPin()`은 계속 `content.js`에 남아 있고, 내부 계산 함수만 factory 기반 utility로 이동했다. 브라우저 런타임에서는 기존과 동일하게 viewport를 `window.innerWidth`, `window.innerHeight` 기준으로 계산한다.

## Public API

외부 public API 변경 없음.

내부 content script 주입용 전역 namespace만 추가:
- `globalThis.FDSContentFloatingInspector`

## Import/export 및 주입 경로

다음 주입 순서에 `content-floating-inspector.js`를 추가했다.

- `background-logic.js`
- `scripts/run-uiux-fixture-qa.mjs`

`content.js`보다 먼저 로드되도록 `content-summary-model.js` 뒤, `content-scan-runner.js` 앞에 배치했다.

## 검증 결과

통과:

```bash
node --check content.js
node --check content-floating-inspector.js
node --test content-floating-inspector.test.js content-scan-runner.test.js background-logic.test.js
npm run check:all
```

`npm run check:all` 결과:
- 156 tests
- 156 pass
- 0 fail

## 다음 태스크 핸드오프

다음 권장 태스크: Task 2. Floating inspector DOM 표시 유틸 분리

대상 후보:
- `getViolationPinLabel`
- `isViolationPinTargetVisible`
- inspector card clear/delay helper 중 순수 helper

주의:
- `showInspectorCardForEntries()`는 DOM 이벤트와 clipboard side effect가 많으므로 한 번에 옮기지 말 것.
- 먼저 label/visibility처럼 순수에 가까운 helper만 이동할 것.
- 각 단계 후 `npm run check:all`을 실행할 것.

