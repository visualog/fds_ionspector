# FDS Inspector UX/UI/Functional QA V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish a repeatable UX/UI/functional QA gate for FDS Inspector so test fixtures must prove that users can understand violations, inspect details, and navigate to affected elements.

**Architecture:** Keep lightweight unit tests for pure render/scan logic, add a Chrome DevTools Protocol fixture runner for end-to-end overlay checks, and record the release gate in verification docs. The QA runner starts a static server, opens Chrome with a temporary profile, injects content scripts in extension order, activates the inspector, and asserts user-facing UI state.

**Tech Stack:** Chrome extension MV3, vanilla JavaScript, Node `--test`, Node HTTP server, Chrome DevTools Protocol over WebSocket.

---

## QA Design Context

### Users

- FDS designers and frontend engineers validating whether a real page follows Fasoo Design System tokens.
- They are usually looking at a live or nearly-live page, with limited time and high need for trust.
- They need both a compact overview and a direct path from result list to actual DOM element.

### Primary Jobs

1. Know whether inspection completed reliably.
2. See which category has violations.
3. Understand the violation type and value.
4. Know how many DOM elements are affected.
5. Click a result and land on the affected element.
6. Use the inspector card to understand replacement token candidates when available.
7. Recover when scanning fails.

### Tone

- Work-focused, calm, precise, and non-marketing.
- Compact is good; cryptic is not.
- Error copy should be plain and actionable.

## Release Gate Summary

The QA gate passes only when all three layers pass:

1. **Unit and source tests**
   - `npm test`
   - Guards pure render logic, scan runner behavior, copy expectations, and source-level integration contracts.

2. **UX/UI fixture automation**
   - `npm run qa:uiux`
   - Guards actual overlay behavior in Chrome-like runtime: panel visibility, scan metrics, result grouping, accessibility labels, click-to-scroll, and error recovery.

3. **Manual Chrome extension smoke**
   - Reload unpacked extension.
   - Open each fixture page.
   - Click extension action.
   - Confirm the same visible behavior as the automated gate.

## Detailed Acceptance Criteria

### A. UX Comprehension

| Check | Pass Criteria | Automated |
| --- | --- | --- |
| Current inspection category is clear | Panel title says `컬러/스페이싱/폰트/모서리 라운드 위반 정보` | Partially |
| Completion state is trustworthy | Completion copy includes scanned/total elements, duration, and partial status when capped | Yes |
| Count language is unambiguous | Violation groups use `N개 요소`, token metadata uses `토큰 N개` | Yes |
| Violation meaning is visible | Group row shows chip, status, count, and CSS value | Yes |
| Empty state is not a dead-end | Empty copy says which category has no violations | Yes |
| Error state gives recovery | Error copy says to use refresh/rescan | Yes |

### B. UI Readability

| Check | Pass Criteria | Automated |
| --- | --- | --- |
| Panel stays onscreen | Panel rect remains inside viewport | Yes |
| Metric cards are understandable | Every metric card has accessible label | Yes |
| Color tabs are compact but decipherable | BG/Border/Text tabs have full `aria-label` and count | Yes |
| Truncated rows preserve meaning | Groups/details expose full title or aria-label | Yes |
| Focus is visible | Key controls have focus-visible styling | Unit/source guarded |

### C. Functional Navigation

| Check | Pass Criteria | Automated |
| --- | --- | --- |
| Group click expands details | First group `aria-expanded` becomes `true` and detail rows appear | Yes |
| Group click highlights target | Representative pin is visible | Yes |
| Group click moves viewport | Scroll call is recorded | Yes |
| Detail rows explain action | Detail row aria says click moves to the exact element | Yes |
| Filter switching clears stale state | Source-level test guards active pin/card clearing | Unit/source guarded |

### D. Category-Specific Behavior

| Category | Pass Criteria | Automated |
| --- | --- | --- |
| Color | BG/Border/Text tabs appear only for color and expose full labels/counts | Yes |
| Spacing | All-side and directional spacing are separate groups | Yes |
| Large DOM | Scan caps at 6000, reports 7502 total, yields between batches, marks partial | Yes |
| Error | No stale groups, no loading residue, zero-count tabs stay understandable | Yes |

## Implemented QA Automation

### Files

- Create: `scripts/run-uiux-fixture-qa.mjs`
- Modify: `package.json`
- Update: `docs/verification/fds-uiux-qa-inspection-checklist.md`

### Command

```bash
npm run qa:uiux
```

### What It Does

1. Starts a local static server from the repository root.
2. Starts Chrome with a temporary profile and DevTools Protocol enabled.
3. Opens each fixture page.
4. Injects the same content script dependency order used by the extension.
5. Mocks minimal Chrome extension APIs needed by the content script.
6. Enables the inspector via the `TOGGLE` message.
7. Runs assertions against visible text, ARIA labels, metrics, scroll calls, and pin state.
8. Exits nonzero if any UX/UI/functional expectation fails.

## V2 Fixture Assertions

### Spacing Direction

- Summary panel visible and inside viewport.
- Metric cards expose accessible labels.
- No color-only tabs.
- `패딩`, `오른쪽 패딩`, and `마진` groups visible.
- Count copy uses `개 요소`, not `곳`.
- Group aria explains representative navigation.
- Group click expands details.
- Detail rows appear and explain exact element navigation.
- Pin appears.
- Scroll is requested.

### Large DOM

- Summary panel visible and inside viewport.
- Scan caps at 6000 elements.
- Total count is 7502.
- `truncated` is true.
- `batchYieldCount > 0`.
- Completion copy says `일부만 검사`.
- Color tabs exist in color mode.
- BG and Text tabs expose full accessible labels.
- Nonzero primitive issue is visible.
- Group click shows pin and scrolls.

### Error State

- Summary panel visible and inside viewport.
- Error copy explains recovery.
- No stale violation groups.
- Color tabs expose zero-count labels.
- Empty state remains understandable.

## Commands To Run Before Release

```bash
node --check content.js
node --check content-render.js
node --check content-scan-runner.js
npm test
npm run qa:uiux
```

## Known Limitations

- `npm run qa:uiux` verifies content UI behavior and Chrome-like runtime behavior, but it does not click the browser toolbar extension action. Manual Chrome extension smoke still covers that permission path.
- Real LUKE result counts vary by login/session/page data, so LUKE should be checked for behavior, not exact counts.
- The QA runner assumes Google Chrome is available at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; set `CHROME_BIN` if needed.
