# FDS Inspector Handoff: 2026-06-04 Detail Panel Layout And Tab Motion Fix

## Current Goal
Resolve the user-reported Comet/LUKE issue where the FDS Inspector detail panel:

- Opened with an incorrect short height after toolbar menu clicks.
- Showed the violation list overlapping the BG / Border / Text tab area.
- Twitched when clicking detail panel tabs because scrollbars and height animation changed the panel layout.

## Repo
- Path: `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`
- Branch context from previous handoff: `codex/token-source-20260416`
- Working tree is intentionally dirty with many pre-existing tracked and untracked changes. Do not revert unrelated files.

## User-Visible Symptom
- In Comet on `luke.fasoo.com/main`, the toolbar rendered and the Color inspection panel opened.
- The detail panel sometimes appeared too short, so only the tab area and part of the content were visible.
- When clicking `BG`, `Border`, or `Text`, the violation list could appear over the tab controls.
- Tab clicks made the panel twitch when the scrollbar appeared or disappeared.

## Root Causes

### 1. Transition ghost covered the tab/content area
When the summary list changed, the old list was cloned as a transition ghost. The ghost was positioned with full-panel coverage semantics, so it could visually start above the real list area and overlap the tab bar or metric cards.

### 2. Previous list height used scroll height, not rendered height
The transition code used the previous list's scroll height, capped at `356px`. If the list had a large scroll height but only a smaller rendered height, the panel animation could calculate from a larger old height than what was actually visible.

### 3. Tab transitions reused summary height refresh animation
Tab clicks already have their own tab motion. Running the full summary refresh height animation during tab clicks created unnecessary panel/list height changes and made the panel feel like it was jumping.

### 4. Scrollbar width changed on hover/focus
The panel body and summary list hid scrollbars by default, then gave them width on hover/focus. On tab click this could introduce a new scrollbar gutter and nudge the panel content.

## Changed Files

- `content.js`
  - Calculates previous list height from actual rendered height first:
    - `getBoundingClientRect().height`
    - `clientHeight`
    - `scrollHeight` fallback
  - Anchors the transition ghost at `nextList.offsetTop` instead of letting it cover the entire summary section.
  - Skips `animateSummaryRefresh()` for tab transitions and only runs tab switch motion.

- `overlay.css`
  - Keeps scrollbars at a stable thin width for `.fds-panel-body` and `.fds-summary-list`.
  - Uses transparent scrollbar thumbs by default, then only changes thumb color on hover/focus.
  - Adds `scrollbar-gutter: stable` to prevent layout shifts when scrollbars become visible.

- `content-scan-runner.test.js`
  - Added regression coverage for stable scrollbar gutters.
  - Added regression coverage that tab clicks do not animate summary panel height.
  - Added regression coverage that summary-list transition ghosts are anchored to the list area.
  - Added regression coverage that summary panel height derives from rendered list height instead of full scroll height.

## Live Comet Verification
Tested directly in the user's Comet browser on `luke.fasoo.com/main`.

Important reload sequence:

1. Opened the unpacked extension page for FDS Inspector in Comet.
2. Reloaded the extension.
3. Returned to the LUKE tab.
4. Refreshed the LUKE page.
5. Clicked the FDS Inspector extension icon to inject the latest content script.
6. Opened Color inspection and clicked `BG`, `Border`, and `Text`.

This sequence matters because reloading the extension alone does not replace a content script already injected into the existing LUKE page. The page must be refreshed and the inspector must be run again.

Observed result after the reload/page-refresh/reinject sequence:

- `BG` tab: panel kept usable height; list stayed below tabs and metric cards.
- `Border` tab: panel kept usable height; no tab/list overlap.
- `Text` tab: panel kept usable height; no tab/list overlap.
- No obvious panel collapse or half-height clipping was visible during tab switching.

The Comet translation popup was visible at the top of the page during verification, but it did not affect the inspector panel behavior.

## Verification Completed

```bash
node --check content.js
node --check content-motion.js
node --test content-motion.test.js content-scan-runner.test.js
npm test
```

Results:

- Syntax checks passed.
- Targeted motion/content runner tests passed.
- Full test suite passed: `136` tests, `0` failures.

## Current Risk / Notes

- If the user still sees the old behavior, first confirm that the LUKE page was refreshed after reloading the unpacked extension. Existing pages can continue running stale injected content scripts.
- The panel currently appears low on the page because it is anchored near the toolbar. That is a placement/design behavior, not the height/overlap regression addressed here.
- The repo has many unrelated tracked and untracked changes from prior work. Keep future fixes scoped and avoid reverting files that are not part of the current issue.

## Next Suggested Step
If the issue is reported again, reproduce with the exact reload sequence:

1. Reload unpacked extension in Comet.
2. Refresh `luke.fasoo.com/main`.
3. Re-run FDS Inspector.
4. Click Color inspection.
5. Switch `BG -> Border -> Text`.

If the overlap still reproduces after that sequence, capture a screenshot immediately after each tab click and inspect whether `.fds-summary-list-transition-ghost` remains in the DOM or whether the active page is still running an older injected script.

## Continuation Prompt
Continue in `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`. The latest issue was the detail panel layout and tab motion regression in Comet/LUKE. Fixes are in `content.js` and `overlay.css`, with regression tests in `content-scan-runner.test.js`. Root causes were transition ghost positioning, previous list height based on scroll height, summary height animation during tab clicks, and scrollbar width changes on focus/hover. Direct Comet verification after extension reload + LUKE page refresh + inspector reinjection showed `BG`, `Border`, and `Text` tab switching without list/tab overlap or half-height clipping. Full `npm test` passed with 136 tests.
