# FDS Inspector content.js 리팩터링 핸드오프

작성일: 2026-06-05

## 현재 상태

- 브랜치: `codex/token-source-20260416`
- 최신 커밋: `1e20a1e Refactor content script helper modules`
- 원격 푸시: 완료, `origin/codex/token-source-20260416`
- 리팩터링 커밋 직후 워크트리: clean
- 현재 워크트리: 이 핸드오프 문서가 새로 추가되어 untracked 상태
- 기준 검증: `npm run check:all` 통과, 175개 테스트

## 목표

`content.js`를 기능 변경 없이 작은 단위로 분리한다.

원칙:

- 기능 변경 금지
- public API 변경 금지
- import/export 및 script injection 순서 정리
- 컴포넌트, hooks, utils, constants 성격으로만 분리
- 수정 후 `npm run check:all` 실행
- 실패 시 원인 분석 후 최소 수정
- 태스크 완료마다 리포트 저장

## 현재 라인 수

- `content.js`: 2,318줄
- `content-floating-inspector.js`: 156줄
- `content-token-suggestions.js`: 72줄
- `content-bridge-specs.js`: 183줄
- `content-toolbar-ui.js`: 79줄

초기 기준선은 `content.js` 2,472줄이었다. 현재까지 약 154줄 감소했고, 순수 helper와 일부 toolbar/bridge 경계가 분리되었다.

## 완료된 작업

### Task 1. Floating inspector 순수 계산 유틸 분리

완료 리포트:

- `docs/refactor-reports/2026-06-05-task-1-floating-inspector-utils.md`

분리 파일:

- `content-floating-inspector.js`
- `content-floating-inspector.test.js`

분리 내용:

- pin 위치 후보 계산
- viewport clamp 계산
- overlap 계산
- best pin position 계산

### Task 2. Floating inspector DOM helper 분리

완료 리포트:

- `docs/refactor-reports/2026-06-05-task-2-floating-inspector-label-visibility.md`
- `docs/refactor-reports/2026-06-05-task-2-floating-inspector-dom-helpers.md`

분리 내용:

- violation pin label 생성
- pin target visibility 판정
- inspector card hide timer controller

### Task 3. Token suggestion 유틸 분리

완료 리포트:

- `docs/refactor-reports/2026-06-05-task-3-token-suggestions.md`

분리 파일:

- `content-token-suggestions.js`
- `content-token-suggestions.test.js`

분리 내용:

- suggested token ranking
- violation tag token extraction
- issue category별 suggested token 계산

### Task 4. Bridge/spec loading 유틸 분리

완료 리포트:

- `docs/refactor-reports/2026-06-05-task-4-bridge-specs-normalization.md`
- `docs/refactor-reports/2026-06-05-task-4-refresh-state-calculation.md`
- `docs/refactor-reports/2026-06-05-task-4-bridge-specs-completion.md`

분리 파일:

- `content-bridge-specs.js`
- `content-bridge-specs.test.js`

분리 내용:

- bridge spec state signature 생성
- bridge token context label 생성
- bridge/snapshot specs 응답 정규화
- bridge/snapshot refresh next state 계산

의도적으로 남긴 것:

- `safeRuntimeSendMessage` 호출
- runtime action orchestration
- bridge/snapshot 전역 상태 대입

이 부분은 content script runtime state와 직접 연결되어 있어 `content.js`에 남기는 것이 안전하다.

### Task 5. Toolbar UI orchestration 분리

진행 중.

부분 완료 리포트:

- `docs/refactor-reports/2026-06-05-task-5-toolbar-shell-helpers.md`
- `docs/refactor-reports/2026-06-05-task-5-toolbar-sync-state.md`

분리 파일:

- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`

완료된 하위 범위:

- toolbar button tooltip text 조회
- root visibility 표시/숨김 반영
- inspector UI shell completeness 검사
- toolbar/summary panel floating position reset
- `syncToolbar` 내부 dataset/CSS custom property 반영

아직 남은 Task 5 범위:

- toolbar button event binding
- toolbar drag wrappers
- toolbar visibility state 반영
- `syncToolbar`의 markup 교체와 event 재바인딩 경계 정리

## 중요 검증 이력

마지막 green 검증:

```bash
npm run check:all
```

결과:

- 175개 테스트 통과
- 실패 없음

마지막 관련 focused 검증:

```bash
node --check content.js
node --check content-toolbar-ui.js
node --test content-toolbar-ui.test.js content-scan-runner.test.js background-logic.test.js
```

결과:

- 59개 테스트 통과
- 실패 없음

## 현재 주요 파일 관계

`content.js`는 아직 content script orchestration 역할을 한다.

현재 남은 큰 책임:

- 전역 상태 wiring
- runtime message handler
- scan orchestration
- toolbar event/drag orchestration
- summary panel UI orchestration
- inspector card/pin DOM rendering 일부
- bridge health polling

새로 분리된 helper 모듈:

- `content-floating-inspector.js`
- `content-token-suggestions.js`
- `content-bridge-specs.js`
- `content-toolbar-ui.js`

script injection 순서는 다음 파일에 반영되어 있다.

- `background-logic.js`
- `background-logic.test.js`
- `scripts/run-uiux-fixture-qa.mjs`

새 content helper를 추가할 때는 세 곳을 같이 갱신해야 한다.

## 다음 권장 작업

다음은 Task 5의 남은 하위 단계다.

권장 순서:

1. toolbar drag wrapper 분리
   - `stopToolbarDrag`
   - `beginToolbarDrag`
   - `moveToolbarDrag`
   - style apply helper와 pointer capture helper부터 분리
2. toolbar event binding 분리
   - `bindToolbarEvents`는 상태 mutation, scan 호출, summary panel 제어가 섞여 있으므로 마지막에 진행
3. Task 5 완료 리포트 작성
4. Task 6 Summary panel UI orchestration 분리로 이동

## 주의할 점

- `content-scan-runner.test.js`에는 문자열 기반 회귀 테스트가 많다. helper를 새 파일로 옮기면 테스트가 `content.js` 내부 함수 정의를 직접 찾고 있을 수 있다.
- 이전에 `isInspectorUIShellComplete` 이동 시 해당 테스트를 새 helper 파일 확인 방식으로 갱신했다.
- detail panel 관련 회귀는 GSAP open/refresh 순서에 민감하다. `openSummaryPanelForActiveFilter()` 직후 중복 `updateSummaryUI()`를 추가하지 않는다.
- toolbar filter click path에서 summary panel visibility와 animation 순서를 바꾸지 않는다.
- runtime messaging과 전역 state mutation은 무리해서 util로 옮기지 않는다.

## 이어서 작업할 때 시작 명령

```bash
git status --short
wc -l content.js content-toolbar-ui.js content-toolbar-ui.test.js
npm run check:all
```

## 다음 세션용 프롬프트

FDS Inspector repo `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`에서 `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`와 이 handoff 문서를 읽고 이어서 진행해줘. 현재 브랜치는 `codex/token-source-20260416`, 최신 푸시 커밋은 `1e20a1e Refactor content script helper modules`야. Task 5는 진행 중이고, 다음 하위 작업은 toolbar drag wrapper 분리야. 기능 변경 없이 작은 diff로 진행하고, 완료 후 `npm run check:all`을 실행한 뒤 리포트를 `docs/refactor-reports/`에 저장해줘.
