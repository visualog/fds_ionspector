# FDS Inspector Handoff: 2026-06-04 Detail Panel Follow-up Fixes

## Current Goal
Stabilize the FDS Inspector detail panel behavior in Comet/LUKE after the initial layout and tab-motion fixes.

This follow-up covers the issues reported after the first handoff:

- Radius collapsed violation groups did not scroll while Spacing did.
- Collapsed group hover opened the violation information card.
- Expanded child-row click did not move to the target element.
- Short Color collapsed lists looked clipped near the toolbar/DevTools area.
- The summary metric cards were not consistently labeled `미등록` / `원시값` outside Color.

## Repo
- Path: `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`
- Main files touched in this follow-up:
  - `content.js`
  - `content-render.js`
  - `content-motion.js`
  - `overlay.css`
  - `content-scan-runner.test.js`
  - `content-render.test.js`
  - `content-motion.test.js`
- Working tree is intentionally dirty and contains many pre-existing tracked/untracked files. Do not revert unrelated changes.

## User-Visible Fixes

### 1. Collapsed Radius list now scrolls like Spacing
Root cause: the summary list cap was too tall (`356px`), so Radius with fewer collapsed groups did not become an internal scroll area even when the visible panel space was smaller.

Fix:
- Introduced/used `SUMMARY_LIST_MAX_HEIGHT = 168`.
- Applied the same list height cap in:
  - `content.js`
  - `content-motion.js`
  - `overlay.css`
- Added regression coverage that collapsed Radius groups can scroll like Spacing groups.

### 2. Collapsed group rows no longer open the violation info card
Root cause: `.fds-list-group` rows used a representative entry hover/click handler, so collapsed groups behaved like concrete violation rows.

Fix:
- Group rows now only toggle expanded/collapsed state.
- Group row hover/focus does not call `showInspectorCardForEntries()`.
- Group row click does not call `scrollToIssueElement()`.
- The group accessible label was changed from "대표 요소로 이동" to "상세 목록을 펼칩니다/접습니다".

### 3. Expanded child rows now own preview and navigation
Fix:
- `.fds-list-item[data-issue-key]` rows now:
  - show the issue card on hover/focus,
  - lock the pin/card on click,
  - call `scrollToIssueElement(entry)` using the entry returned from `showPin({ locked: true })`.

### 4. Child-row navigation handles nested app scroll containers
Root cause: `scrollToIssueElement()` only used `window.scrollTo(...)`. LUKE scrolls inside an app container, so moving the document window was not enough.

Fix:
- `scrollToIssueElement()` now uses `entry.element.scrollIntoView({ block: 'center', inline: 'center' })` first.
- Falls back to the previous `window.scrollTo(...)` path only if `scrollIntoView` is unavailable/fails.
- Schedules a second pin/card position update after scroll to catch smooth-scroll movement.

### 5. Short Color collapsed lists no longer look clipped by the toolbar
Root cause: the panel was moved up to avoid the toolbar, but `max-height` was also reduced against the larger bottom offset. With DevTools docked, this preserved the visual clipping.

Fix:
- Toolbar and panel bottom spacing are now CSS variables:
  - `--fds-toolbar-bottom: 24px`
  - `--fds-summary-toolbar-gap: 16px`
  - `--fds-summary-panel-bottom`
- The summary panel uses `bottom: var(--fds-summary-panel-bottom, 88px)`.
- The panel `max-height` is recalculated with the same `88px` fallback.
- The panel itself now supports rounded/floating scrollbar styling via `overflow-y: auto` for truly constrained viewports.

### 6. Metric cards are consistently `미등록` / `원시값`
Root cause: `createSummaryMetricCards()` still had a Color-only branch. Color used `미등록` / `원시값`, but non-color filters still rendered `검토 패턴` / `영향 요소`.

Fix:
- Removed the Color-only metric-card branch.
- Any filter with violations now renders:
  - danger: `미등록`
  - warning: `원시값`
- `위반 없음` remains a single success card.
- Non-color lists are now filtered by selected tone as well:
  - `미등록` card -> danger entries
  - `원시값` card -> warning entries
- If the selected tone has zero entries and the other tone has entries, active tone is normalized automatically.

## Verification Completed

Latest commands run:

```bash
node --check content.js
node --check content-render.js
node --check content-motion.js
node --test content-render.test.js content-scan-runner.test.js
node --test content-scan-runner.test.js
node --test content-scan-runner.test.js toolbar-drag.test.js
npm test
```

Latest full-suite result:

- `npm test`: `141` tests passed, `0` failed.

Key targeted coverage added/updated:

- Summary list height cap for collapsed Radius/Spacing behavior.
- Group rows only toggle details.
- Child rows preview and navigate.
- Nested app scroll container support via `scrollIntoView`.
- Summary panel toolbar clearance and panel-level fallback scrolling.
- Non-color summary metric cards use `미등록` / `원시값`.
- Non-color issue lists filter by selected missing/raw card.

## Live Browser State / Caveat
The user screenshots were from Comet on `luke.fasoo.com/main` with DevTools docked to the bottom. The current code fixes were validated by tests in this turn, but the latest post-card-label changes were not live-verified in Comet after reinjection.

Important reload sequence before judging the browser result:

1. Reload the unpacked FDS Inspector extension in Comet.
2. Refresh `luke.fasoo.com/main`.
3. Re-run FDS Inspector from the extension icon.
4. Open the target toolbar menu.
5. Verify Color, Spacing, Radius panels.

Reloading the extension alone does not replace a content script already injected into an existing LUKE page.

## Current Expected Behavior
- Collapsed groups:
  - hover: no violation info card,
  - click: expand/collapse only.
- Expanded child rows:
  - hover/focus: show violation info card,
  - click: scroll target element into view, lock pin/card.
- Short lists:
  - should fit naturally when space allows,
  - should not look clipped by the toolbar,
  - panel-level scroll appears only when viewport height is truly constrained.
- Metric cards:
  - violation state always uses `미등록` / `원시값`,
  - empty state uses `위반 없음`.

## Remaining Manual QA
Run this in Comet after extension reload + LUKE refresh + reinjection:

1. Color > BG:
   - confirm cards are `미등록` / `원시값`,
   - confirm two collapsed groups fit without clipping,
   - expand a group,
   - hover child row and confirm issue card appears,
   - click child row and confirm target scrolls into view.
2. Spacing:
   - confirm cards are `미등록` / `원시값`,
   - confirm collapsed list scrolls when needed,
   - expand a group and verify child-row scroll/navigation.
3. Radius:
   - confirm cards are `미등록` / `원시값`,
   - confirm collapsed list scrolls when needed,
   - expand a group and verify child-row scroll/navigation.
4. Font:
   - confirm labels also stay `미등록` / `원시값` if violations exist.

## Continuation Prompt
Continue in `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`. The active work is FDS Inspector detail panel follow-up QA/fixes for Comet/LUKE. The latest changes separate collapsed group toggle behavior from child-row preview/navigation, use `scrollIntoView()` for nested app containers, improve panel/toolbar clearance and fallback panel scrolling, cap summary list height at `168px`, and unify metric cards to `미등록` / `원시값` for all violation filters. Full `npm test` currently passes with `141` tests. Before live judging, reload the unpacked extension, refresh LUKE, and reinject the inspector because old content scripts persist on existing pages.
