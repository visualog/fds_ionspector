# FDS Inspector Handoff: 2026-06-05 Toolbar Toggle and Pin Follow-up

## Current Goal
Comet/LUKE에서 FDS Inspector 상세 패널과 브라우저 툴바 토글 동작을 안정화했다. 다음 세션의 첫 번째 미해결 과제는 위반 요소 핀이 스크롤 중 오래 남거나 페이지와 같이 움직여 보이는 문제를 고치는 것이다.

## Repo
- Path: `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`
- Working tree: dirty. 여러 tracked/untracked 변경이 섞여 있으므로 관련 없는 변경은 되돌리지 말 것.
- Handoff file: `docs/2026-06-05-fds-inspector-toolbar-toggle-and-pin-handoff.md`

## Completed in This Session

### 1. Detail panel stat card alignment
- `overlay.css`
- `.fds-stat-heading`을 우측 정렬해 카드 안의 숫자/라벨 정렬을 맞췄다.

### 2. Collapsed group expand flicker reduction
- `content.js`
- `content-motion.js`
- `content-motion.test.js`
- 그룹 펼침/접힘에서는 리스트 아이템 fade/reveal을 생략하도록 `requestSummaryMotion('group-toggle')`와 `revealListItems` 옵션을 추가했다.
- 접힌 그룹을 펼칠 때 내부 항목이 희미하게 깜빡이는 현상을 줄였다.

### 3. Global numbering removal and pin label simplification
- `content-render.js`
- `content.js`
- `overlay.css`
- `content-render.test.js`
- 부모/자식 행의 전역 번호 표시를 제거했다.
- 위반 핀은 번호 대신 `div.css-...` 같은 요소 라벨을 표시한다.
- `.fds-issue-pin`에 최대 폭과 말줄임을 적용했다.

### 4. Parent/child list display simplification
- `content-render.js`
- `overlay.css`
- `content-render.test.js`
- `content-scan-runner.test.js`
- 부모 그룹은 값과 요소 수 중심으로, 자식 행은 요소 라벨 중심으로 보이게 단순화했다.
- 접근성 라벨과 `title`에는 위반 유형/값 정보를 유지했다.

### 5. Browser toolbar extension toggle one-click fix
- `background.js`
- `content.js`
- `background-logic.test.js`
- `content-scan-runner.test.js`
- 기존 문제:
  - background가 탭별 content script의 실제 visible 상태가 아니라 stale `activeTabStates`만 보고 토글했다.
  - 토글 off 중 진행 중이던 scan이 outline/inspection mark를 다시 칠할 수 있었다.
- 변경:
  - `getContentScriptState(tabId)`가 `PING` 응답의 `{ visible, dismissed }`를 읽는다.
  - 브라우저 action click은 content script가 준비되어 있으면 `!contentState.visible`로 다음 상태를 결정한다.
  - `PING`과 `TOGGLE` 응답에 현재 visible/dismissed 상태를 포함했다.
  - `clearScan()`에서 `clearInspectionMarks()`도 호출한다.
  - scan 완료 직후 extension이 off/dismissed 상태면 inspection mark를 다시 칠하지 않고 정리한다.

## Latest Verification

Passed during this work:

```bash
node --check background.js
node --check content.js
node --check content-render.js
node --check content-motion.js
node --test background-logic.test.js content-scan-runner.test.js
node --test content-render.test.js content-scan-runner.test.js
node --test content-motion.test.js content-scan-runner.test.js
npm test
```

Latest full-suite result:

- `npm test`: 144 tests passed, 0 failed.

## Live Browser Caveat
Comet/LUKE의 기존 페이지에 이미 주입된 content script는 extension reload만으로 교체되지 않는다. 브라우저에서 결과를 판단하기 전 순서:

1. Comet 확장 프로그램 페이지에서 unpacked FDS Inspector reload.
2. `luke.fasoo.com/main` 새로고침.
3. FDS Inspector를 다시 실행.
4. Color/Spacing/Radius 패널에서 목록, 핀, 토글 off를 재확인.

## Remaining Known Bug: Pin Scroll/Stale Position

User report:
- 위반 요소 핀(`div.css-1xny3ma` 같은 빨간 라벨)이 남아서 스크롤과 같이 움직여 보이는 경우가 있다.
- 스크린샷 기준으로 상세 패널은 열려 있고, LUKE 페이지가 내부 스크롤되면서 핀 위치가 오래된 좌표에 남거나 target과 동기화되지 않는 증상이다.

Likely code area:
- `content.js`
  - `renderViolationPin(entry)`
  - `positionViolationPin(entry, { avoidElement })`
  - `scheduleIssuePreviewAfterScroll(entry)`
  - `bindViewportEvents()`
  - `clearActiveViolationPin()`
  - `clearInspectionMarks()`
- `overlay.css`
  - `.fds-issue-pin`
  - pin layer 관련 스타일

Likely cause:
- `positionViolationPin()`은 호출 시점의 `getBoundingClientRect()`로 fixed 좌표를 계산하지만, LUKE의 nested scroll container가 움직일 때 active/locked pin을 계속 재배치하지 못하는 경로가 있다.
- window scroll/resize만 듣고 있거나, scroll capture가 내부 app container 스크롤을 놓칠 가능성이 있다.
- target이 viewport 밖으로 나갔을 때 pin hide/clear가 늦거나 빠져 있을 수 있다.

## Next Implementation Plan

1. `getViolationPinLayer`, `renderViolationPin`, `positionViolationPin`, `scheduleIssuePreviewAfterScroll`, `bindViewportEvents` 흐름을 먼저 읽는다.
2. active 또는 locked pin이 있을 때 document-level capture scroll과 resize에서 pin/card 재배치를 schedule한다.
3. LUKE처럼 내부 스크롤 컨테이너가 움직여도 잡히도록 `document.addEventListener('scroll', handler, true)` 또는 scrollable ancestor listener 전략을 검토한다.
4. target rect가 viewport 밖이거나 요소가 detached되면 pin을 숨기거나 active pin을 정리한다.
5. panel hidden/off/dismiss/clear scan 경로에서 pin layer와 card가 확실히 정리되는지 확인한다.
6. `content-scan-runner.test.js` 또는 source-level test에 scroll listener/cleanup 회귀 테스트를 추가한다.
7. extension reload + LUKE refresh + reinjection 후 Comet에서 실제 스크롤 재현으로 확인한다.

## Startup References for Next Session

Read only these first:

```text
docs/2026-06-05-fds-inspector-toolbar-toggle-and-pin-handoff.md
content.js
overlay.css
content-scan-runner.test.js
```

Optional previous context:

```text
docs/2026-06-04-fds-inspector-detail-panel-followup-handoff.md
docs/2026-06-04-fds-inspector-detail-panel-layout-handoff.md
```

## Continuation Prompt

Continue in `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`. The toolbar toggle and detail-panel list simplification work is already implemented and `npm test` passed with 144 tests. The active remaining bug is that the violation element pin can remain stale or appear to scroll with the LUKE page. Start by reading `content.js` pin functions (`renderViolationPin`, `positionViolationPin`, `scheduleIssuePreviewAfterScroll`, `bindViewportEvents`) and add scroll/resize synchronization plus cleanup so the pin either follows the target correctly or hides/clears when the target is no longer visible. Do not revert unrelated dirty worktree changes.
