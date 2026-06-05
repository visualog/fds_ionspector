# content.js 순차 리팩터링 작업계획서

작성일: 2026-06-05
대상 프로젝트: FDS Inspector

## 목표

`content.js`를 기능 변경 없이 작은 단위로 분리한다. 각 태스크는 1개 책임 영역만 옮기고, 완료마다 `npm run check:all`을 통과해야 한다.

## 기준선

- 현재 `content.js`: 2,472줄
- 현재 이미 분리된 파일:
  - `content-render.js`
  - `content-scan-utils.js`
  - `content-theme.js`
  - `content-state-utils.js`
  - `content-inspection.js`
  - `content-summary-model.js`
  - `content-scan-runner.js`
  - `content-motion.js`
  - `content-floating-inspector.js`

## 리팩터링 규칙

- 기능 변경 금지
- public API 변경 금지
- import/export 및 스크립트 주입 경로 정리
- 분리 단위는 components, hooks, utils, constants 성격만 허용
- 스타일 변경 최소화
- 한 번에 대규모 수정 금지
- 1개 파일 또는 1개 책임 단위씩 작은 diff로 진행
- 각 태스크 후 `npm run check:all` 실행
- 실패 시 원인 분석 후 최소 수정
- 각 태스크 완료마다 리포트와 핸드오프 저장

## 예상 최종 라인 수

순차 분리 완료 후 `content.js` 예상 라인 수: 약 900-1,100줄.

남겨야 하는 책임:
- content script 초기화
- 전역 상태 wiring
- 런타임 메시지 라우팅
- 주요 모듈 orchestration
- 브라우저 DOM 진입점 연결

## 순차 태스크

### Task 1. Floating inspector 순수 계산 유틸 분리

- 상태: 완료
- 대상:
  - `content-floating-inspector.js`
  - `content-floating-inspector.test.js`
  - `content.js`
  - script injection 목록
- 분리 내용:
  - pin 후보 위치 계산
  - viewport clamp 계산
  - overlap 계산
  - best pin position 계산
- 동작 변경 없이 분리 가능: 예
- 예상 감소: 약 60-80줄
- 검증:
  - `node --check content.js`
  - `node --check content-floating-inspector.js`
  - `npm run check:all`
- 완료 리포트:
  - `docs/refactor-reports/2026-06-05-task-1-floating-inspector-utils.md`

### Task 2. Floating inspector DOM 표시 유틸 분리

- 상태: 완료
- 대상:
  - `content-floating-inspector.js`
  - `content.js`
- 분리 내용:
  - violation pin label 생성: 완료
  - pin visibility 판정: 완료
  - inspector card delay/clear helper: 완료
- 동작 변경 없이 분리 가능: 예
- 예상 감소: 약 120-180줄
- 부분 완료 리포트:
  - `docs/refactor-reports/2026-06-05-task-2-floating-inspector-label-visibility.md`
- 완료 리포트:
  - `docs/refactor-reports/2026-06-05-task-2-floating-inspector-dom-helpers.md`

### Task 3. Token suggestion 유틸 분리

- 상태: 완료
- 대상:
  - `content-token-suggestions.js`
  - `content.js`
- 분리 내용:
  - suggested token ranking
  - parsed tag token extraction
  - issue별 suggested token 계산
- 동작 변경 없이 분리 가능: 예
- 예상 감소: 약 70-100줄
- 완료 리포트:
  - `docs/refactor-reports/2026-06-05-task-3-token-suggestions.md`

### Task 4. Bridge/spec loading 유틸 분리

- 상태: 완료
- 대상:
  - `content-bridge-specs.js`
  - `content.js`
- 분리 내용:
  - bridge inspector specs refresh: 완료, runtime 요청과 전역 상태 대입은 `content.js`에 유지
  - snapshot specs refresh: 완료, runtime 요청과 전역 상태 대입은 `content.js`에 유지
  - bridge token context label: 완료
  - bridge spec signature 생성: 완료
  - bridge/snapshot specs 응답 정규화: 완료
- 동작 변경 없이 분리 가능: 예
- 예상 감소: 약 250-350줄
- 부분 완료 리포트:
  - `docs/refactor-reports/2026-06-05-task-4-bridge-specs-normalization.md`
  - `docs/refactor-reports/2026-06-05-task-4-refresh-state-calculation.md`
- 완료 리포트:
  - `docs/refactor-reports/2026-06-05-task-4-bridge-specs-completion.md`

### Task 5. Toolbar UI orchestration 분리

- 상태: 진행 중
- 대상:
  - `content-toolbar-ui.js`
  - `content.js`
- 분리 내용:
  - toolbar shell DOM helper: 완료
  - toolbar DOM sync: 진행 중, dataset/CSS variable 적용 완료
  - toolbar button event binding
  - toolbar drag wrappers
  - toolbar visibility state 반영
- 동작 변경 없이 분리 가능: 예, 단 상태 주입이 많으므로 작은 하위 단계 필요
- 예상 감소: 약 300-450줄
- 부분 완료 리포트:
  - `docs/refactor-reports/2026-06-05-task-5-toolbar-shell-helpers.md`
  - `docs/refactor-reports/2026-06-05-task-5-toolbar-sync-state.md`

### Task 6. Summary panel UI orchestration 분리

- 상태: 대기
- 대상:
  - `content-summary-panel.js`
  - `content.js`
- 분리 내용:
  - `updateSummaryUI`
  - summary tab/card/list event binding
  - summary height measurement wrappers
- 동작 변경 없이 분리 가능: 예, 가장 큰 diff 위험이 있어 마지막에 진행
- 예상 감소: 약 400-600줄

### Task 7. 테스트 파일 분리

- 상태: 대기
- 대상:
  - `content-scan-runner.test.js`
  - 신규 regression test 파일
- 분리 내용:
  - overlay regression
  - summary panel regression
  - floating inspector regression
  - scan runner unit test
- 동작 변경 없이 분리 가능: 예
- 예상 감소: 프로덕션 라인 수 영향 없음

## 핸드오프 규칙

각 태스크 완료 후 다음 문서를 저장한다.

- `docs/refactor-reports/YYYY-MM-DD-task-N-*.md`
- 포함 내용:
  - 변경 파일 목록
  - 줄 수 변화
  - 동작 변경 여부
  - 검증 명령과 결과
  - 다음 태스크 제안
