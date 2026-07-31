# Task 4 완료 리포트: Bridge/spec loading 유틸 분리

작성일: 2026-06-05

## 완료 범위

Bridge/spec loading 영역에서 동작 변경 없이 분리 가능한 계산/정규화 책임을 `content-bridge-specs.js`로 옮겼다.

- bridge spec state signature 생성
- bridge token context label 생성
- bridge token specs 응답 정규화
- snapshot token specs 응답 정규화
- bridge refresh next state 계산
- snapshot refresh next state 계산

## 의도적으로 남긴 범위

다음 책임은 `content.js`에 남겼다.

- `safeRuntimeSendMessage` 호출
- `BRIDGE_TOKEN_SPECS`, `SNAPSHOT_TOKEN_SPECS` action orchestration
- bridge/snapshot 전역 상태 대입
- refresh 결과를 받은 뒤 summary/connection UI를 갱신하는 호출 흐름

이 부분까지 유틸로 옮기면 runtime messaging과 mutable content-script state가 유틸 모듈로 섞여 들어가므로, 현재 리팩터링 규칙인 기능 변경 금지와 작은 diff 원칙에 맞지 않는다고 판단했다.

## 변경 파일

- `content-bridge-specs.js`
- `content-bridge-specs.test.js`
- `content.js`
- `background-logic.js`
- `background-logic.test.js`
- `scripts/run-uiux-fixture-qa.mjs`
- `docs/plans/2026-06-05-content-js-sequential-refactor-plan.md`

## 줄 수 변화

Task 4 완료 기준:

- `content.js`: 2,407줄에서 2,347줄
- `content-bridge-specs.js`: 183줄
- `content-bridge-specs.test.js`: 189줄

## 동작 변경 여부

동작 변경 없음.

기존 refresh 함수명, 호출 위치, runtime action, 반환 shape은 유지했다. 새 모듈은 response 해석과 next state 계산만 담당한다.

## 검증

- `node --check content.js`: 통과
- `node --check content-bridge-specs.js`: 통과
- `node --test content-bridge-specs.test.js content-scan-runner.test.js background-logic.test.js`: 통과, 60개 테스트
- `npm run check:all`: 통과, 170개 테스트
- `git diff --check`: 통과

## 다음 태스크 제안

Task 5. Toolbar UI orchestration 분리를 시작한다.

권장 순서:

1. toolbar DOM sync와 상태 계산 wrapper를 먼저 읽는다.
2. `syncToolbar`, `updateToolbarIndicators`, toolbar button event binding을 한 번에 옮기지 않는다.
3. toolbar markup 후처리나 버튼 dataset sync처럼 DOM 의존이 작고 검증 가능한 하위 단위부터 분리한다.
4. 각 하위 태스크마다 `npm run check:all`을 실행한다.
