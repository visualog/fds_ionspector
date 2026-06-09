# FDS Inspector UI/Interaction Handoff

작성일: 2026-06-09

## 현재 상태

- Repo: `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`
- Branch: `codex/token-source-20260416`
- HEAD: `1e20a1e Refactor content script helper modules`
- Working tree: dirty. 이번 UI/interaction 작업과 이전 리팩터링 산출물이 섞여 있으므로 관련 없는 변경을 되돌리지 말 것.
- 최신 검증: `npm run check:all` 통과, 208개 테스트 pass.

## 이번 작업 목표

LUKE 실사용 화면에서 FDS Inspector의 위반 목록, 상세 카드, 페이지 hover 간섭, 상세 패널 크기 조절 문제를 정리했다.

핵심 방향:

- 목록 hover는 가벼운 안내 tooltip만 보여준다.
- 위반 요소 카드와 화면 이동은 클릭으로만 발생한다.
- 검사 중 페이지 자체 hover UI가 끼어들지 않게 차단한다.
- 상세 패널이 위반 요소 카드와 겹치면 자동으로 비켜난다.
- 상세 패널 높이는 사용자가 직접 드래그해서 조절할 수 있다.

## 완료된 작업

### 1. 위반 카드 표시 문구와 token 판정 정리

주요 파일:

- `content.js`
- `content-inspection.js`
- `content-inspection.test.js`
- `content-token-suggestions.test.js`

완료 내용:

- 위반 요소 카드 타이틀을 검사 카테고리 중심으로 정리했다.
- 카드 내부에서 값, 설명, tip 문구가 반복되지 않게 분리했다.
- tip 라인 앞에 Lucide `info` 아이콘을 붙이고, 아이콘과 텍스트를 수평 중앙 정렬했다.
- tip 텍스트 컬러를 파란색 계열로 조정했다.
- `999px` 같은 pill radius 값은 `9999px`/full radius token 계열로 fallback 매칭하여, 토큰이 있는데도 "미준수 값"으로 표시되는 문제를 줄였다.

### 2. 반투명 컬러 처리 개선

주요 파일:

- `content-scan-utils.js`
- `content-scan-utils.test.js`
- `content-inspection.js`
- `content-inspection.test.js`

완료 내용:

- `rgba(...)`를 무조건 불투명 hex로 접지 않고 alpha가 있는 값은 그대로 보존한다.
- 투명도 포함 미등록 컬러는 일반 미등록 컬러와 다른 설명/tip을 보여준다.
- 완전 투명 alpha 0 값은 검사 노이즈가 되지 않도록 처리한다.

### 3. 위반 목록 hover/click 동작 정리

주요 파일:

- `content-render.js`
- `content-render.test.js`
- `content.js`
- `content-scan-runner.test.js`
- `overlay.css`

완료 내용:

- 목록 행의 native `title` tooltip을 제거해 긴 정보가 기본 브라우저 tooltip으로 뜨지 않게 했다.
- 상위 그룹 hover/focus tooltip은 `목록 펼치기` 또는 `목록 접기`만 표시한다.
- 하위 요소 행 hover/focus tooltip은 `요소로 이동`만 표시한다.
- 목록 hover만으로 위반 요소 카드가 뜨지 않게 변경했다.
- 하위 요소 행 클릭 시에만:
  - 대상 요소로 scroll 이동
  - 위반 요소 card 표시
  - pin/outline 표시
- 목록 tooltip 위치를 행 가까이에 붙도록 조정했다.

### 4. 위반 요소 카드와 상세 패널 겹침 회피

주요 파일:

- `content.js`
- `content-scan-runner.test.js`

완료 내용:

- 위반 요소 card가 표시될 때 summary/detail panel과 겹치는지 검사한다.
- 겹치면 현재 viewport 안에서 card와 덜 겹치는 후보 위치를 계산해 panel을 이동한다.
- 사용자 이동 위치가 있는 경우에는 그 상태를 최대한 보존하면서 필요한 순간에만 조정한다.

### 5. 페이지 hover 상호작용 차단 shield

주요 파일:

- `content.js`
- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`
- `content-scan-runner.test.js`
- `overlay.css`

완료 내용:

- `#fds-page-interaction-shield` 레이어를 추가했다.
- 검사 결과 panel이 활성화되었거나 scan 중일 때 shield가 page content의 pointer/mouse/click/contextmenu 이벤트를 막는다.
- Inspector toolbar, summary panel, card는 shield보다 높은 z-index라 계속 조작 가능하다.
- 목적은 검사 대상 페이지의 hover background, native tooltip, calendar tooltip 같은 변화를 막아 검사 확인을 편하게 만드는 것이다.

주의:

- 이 동작은 검사 결과 확인 중 페이지 content 클릭도 막는 것이 의도다.
- wheel/scroll은 별도 preventDefault를 걸지 않았으므로 실제 브라우저에서 스크롤 감각을 추가 확인하면 좋다.

### 6. 상세 패널 높이 사용자 조절

주요 파일:

- `content.js`
- `content-scan-runner.test.js`
- `overlay.css`
- `content-summary-panel.js`
- `content-summary-panel.test.js`

완료 내용:

- summary/detail panel 하단에 resize handle을 추가했다.
- 사용자가 handle을 잡고 세로로 드래그하면 panel height가 변경된다.
- resize 시작 시 현재 panel 좌표를 fixed top/left로 고정하고, bottom 자동 배치를 해제한다.
- custom height가 있는 동안 list 영역은 panel 안에서 scroll된다.
- summary refresh animation이 사용자 지정 높이를 덮어쓰지 않도록 분기했다.
- 최소 높이와 viewport 하단 여백을 기준으로 clamp한다.

현재 한계:

- 사용자 조절 높이는 content script 런타임 상태에만 저장된다.
- extension reload 또는 page refresh 후 영구 복원되지는 않는다.

### 7. Summary panel helper 분리 진행

주요 파일:

- `content-summary-panel.js`
- `content-summary-panel.test.js`
- `content-toolbar-ui.js`
- `content-toolbar-ui.test.js`

완료 내용:

- summary panel 표시/숨김, drag active state, 위치 적용, 높이 측정 helper를 별도 모듈로 분리했다.
- content script injection 순서가 필요한 파일에 helper를 추가했다.
- 관련 테스트를 추가했다.

## 현재 변경 파일

Tracked 변경:

```text
background-logic.js
background-logic.test.js
content-inspection.js
content-inspection.test.js
content-motion.js
content-motion.test.js
content-render.js
content-render.test.js
content-scan-runner.test.js
content-scan-utils.js
content-scan-utils.test.js
content-token-suggestions.test.js
content-toolbar-ui.js
content-toolbar-ui.test.js
content.js
overlay.css
scripts/run-uiux-fixture-qa.mjs
toolbar-state.js
toolbar-state.test.js
```

Untracked 변경:

```text
content-summary-panel.js
content-summary-panel.test.js
docs/2026-06-05-content-js-refactor-handoff.md
docs/refactor-reports/2026-06-08-task-5-toolbar-command-events.md
docs/refactor-reports/2026-06-08-task-5-toolbar-drag-wrappers.md
docs/refactor-reports/2026-06-08-task-5-toolbar-event-binding.md
docs/refactor-reports/2026-06-08-task-5-toolbar-extraction-complete.md
docs/refactor-reports/2026-06-08-task-5-toolbar-filter-actions.md
docs/refactor-reports/2026-06-08-task-5-toolbar-markup-rebind.md
docs/refactor-reports/2026-06-08-task-5-toolbar-visibility-state.md
docs/refactor-reports/2026-06-08-task-6-summary-panel-drag-wrappers.md
docs/refactor-reports/2026-06-08-task-6-summary-panel-measurement-wrappers.md
```

## 검증

현재 기준 전체 검증:

```bash
npm run check:all
```

결과:

- 208 tests
- 208 pass
- 0 fail

검증에서 확인된 주요 회귀 항목:

- overlay가 검사 결과 확인 중 page hover/click interaction을 shield한다.
- summary group row는 value/count 중심으로 보인다.
- child row click은 issue element로 이동한다.
- issue card와 summary panel이 겹치면 panel이 이동한다.
- summary panel height는 bottom handle drag로 조절된다.
- 999px radius는 full radius token fallback을 제안한다.
- rgba alpha 컬러는 불투명 hex로 잘못 접히지 않는다.

## 브라우저 수동 확인 절차

Comet/LUKE에서 현재 변경을 확인하려면 아래 순서가 필요하다.

1. Chrome/Comet 확장 프로그램 관리 화면에서 unpacked FDS Inspector를 reload한다.
2. `luke.fasoo.com/main` 탭을 새로고침한다.
3. FDS Inspector를 다시 켠다.
4. Color 검사:
   - 목록 hover 시 `요소로 이동` tooltip만 뜨는지 확인한다.
   - 페이지 공지/회의실 행 hover 배경이나 native tooltip이 뜨지 않는지 확인한다.
   - child row click 시 target 위치로 이동하고 위반 card가 뜨는지 확인한다.
   - card와 panel이 겹칠 때 panel이 비켜나는지 확인한다.
5. Radius 검사:
   - `999px` 항목이 token 정보 기반으로 표시되는지 확인한다.
6. Summary/detail panel:
   - 하단 resize handle을 드래그해 높이를 줄이고 늘려본다.
   - custom height 상태에서 list scroll이 panel 내부에서 동작하는지 확인한다.

## 남은 리스크와 후속 작업

1. 실제 LUKE에서 page interaction shield의 스크롤 체감 확인
   - 현재 click/mouse 계열은 막고 wheel preventDefault는 하지 않는다.
   - nested scroll container에서 wheel이 기대대로 page에 전달되는지 확인이 필요하다.

2. panel auto-move 위치 튜닝
   - card와 panel 겹침은 테스트로 보강했지만, 실제 LUKE 화면에서 후보 위치 우선순위가 어색하면 gap/candidate 순서를 조정한다.

3. 사용자 panel height 영구 저장 여부 결정
   - 현재는 런타임 상태만 유지한다.
   - 필요하면 `chrome.storage.local` 또는 tab state에 panel height를 저장하는 후속 작업으로 분리한다.

4. 리팩터링 산출물 staging 범위 결정
   - `content-summary-panel.js`와 여러 `docs/refactor-reports/*`가 untracked다.
   - 커밋 전에는 이번 UI 변경, 이전 리팩터링 문서, helper 분리 산출물을 어떻게 묶을지 먼저 정해야 한다.

## 다음 세션 시작 순서

먼저 읽을 파일:

```text
docs/2026-06-09-fds-inspector-ui-interaction-handoff.md
content.js
overlay.css
content-render.js
content-inspection.js
content-scan-utils.js
content-toolbar-ui.js
content-summary-panel.js
content-scan-runner.test.js
```

권장 순서:

1. `git status --short`로 dirty/untracked 범위를 다시 확인한다.
2. `npm run check:all`을 한 번 실행해 현재 green 상태를 재확인한다.
3. extension reload + LUKE refresh로 실제 동작을 확인한다.
4. 문제가 없으면 변경 묶음 기준을 정해 staging한다.
5. 문제가 있으면 먼저 page interaction shield scroll, panel auto-move, resize persistence 순으로 좁혀서 수정한다.

## 재개 프롬프트

Continue in `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`. Read `docs/2026-06-09-fds-inspector-ui-interaction-handoff.md` first. The current UI work changes FDS Inspector so list hover only shows short custom tooltips, child rows show issue cards only on click, the page is shielded from hover/click interactions while inspecting results, issue cards move the summary panel away when overlapping, `999px` radius values fallback to full radius tokens, translucent rgba colors are preserved, and the summary/detail panel height is user-resizable by dragging the bottom handle. `npm run check:all` passed with 208 tests. Do not revert unrelated dirty or untracked work. Start by rechecking `git status --short`, then reload the unpacked extension and refresh LUKE for manual QA.
