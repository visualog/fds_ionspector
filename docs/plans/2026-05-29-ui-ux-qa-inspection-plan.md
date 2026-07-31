# FDS Inspector UI/UX QA Inspection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify and improve whether users can understand FDS Inspector violations, navigate from results to page elements, read complete information, and know what to do next.

**Architecture:** Use local verification fixtures as the repeatable QA base, then validate the same scenarios on a real Chrome extension path and a real LUKE page. Keep QA evidence in `docs/verification`, and encode stable expectations in Node tests where possible.

**Tech Stack:** Chrome extension MV3, vanilla JavaScript content scripts, CSS overlay UI, Node `--test`, local HTTP fixtures.

---

## QA Principles

- The user is a designer or frontend engineer checking whether a page follows FDS tokens.
- The user may be rushed and needs to decide quickly: what is wrong, where it is, and what should replace it.
- The interface should feel compact and work-focused, but not cryptic.
- A result is acceptable only if the user can answer four questions within a few seconds:
  - What kind of violation is this?
  - How many elements are affected?
  - Where is the representative element on the page?
  - What should I do next?

## Fixture Coverage Matrix

| Fixture | Primary Risks | Must Verify |
| --- | --- | --- |
| `docs/verification/spacing-direction-fixture.html` | Direction labels, duplicate grouping, list navigation | `패딩`, `오른쪽 패딩`, `마진` are distinct; count labels are understandable; group and detail clicks highlight/scroll to the element |
| `docs/verification/large-dom-scan-fixture.html` | Responsiveness, scan metrics, partial scan clarity | Browser remains responsive; completion says scanned/total/time/partial; color tabs appear only for color; nonzero result category is selected |
| `docs/verification/scan-error-state-fixture.html` | Error recovery clarity | Loading clears; error says what happened and what to do next; no stale violations remain |
| LUKE real page | Real DOM complexity, visual overlap, data volatility | No text clipping that hides meaning; result click finds visible element; counts are plausible; panel does not block critical page controls |

## Detailed Test Checklist

### 1. System Status And Trust

**Files:**
- Verify: `content.js`
- Verify: `content-render.js`
- Verify: `overlay.css`
- Evidence: `docs/verification/fds-uiux-qa-*.md`

**Checks:**
1. During scan, toolbar or panel shows that inspection is in progress.
2. After scan, panel shows `검사 완료`, scanned element count, total element count, duration, and partial-scan state.
3. On partial scans, wording clearly tells users that only part of the page was inspected.
4. On failure, the user sees what failed and the next action.

**Pass Criteria:**
- Completion text includes all required scan metrics.
- Error state includes an actionable recovery hint.
- No loading text remains after error.

### 2. Violation Meaning And Count Clarity

**Files:**
- Verify/Modify: `content-render.js`
- Verify/Modify: `content-render.test.js`

**Checks:**
1. Group count labels use a clear term such as `개 요소`, not ambiguous `곳`.
2. Summary metrics distinguish token counts from violation counts.
3. Color tone cards distinguish `미등록 컬러` and `원시값 직접 사용`.
4. Non-color summaries say `위반 DOM 요소` and use active filter count.

**Pass Criteria:**
- A first-time user can tell whether a count is a token count, issue group count, or DOM element count.
- Tests assert the visible copy for count labels.

### 3. Result-To-Element Navigation

**Files:**
- Verify/Modify: `content.js`
- Verify/Modify: `content-scan-runner.test.js`

**Checks:**
1. Clicking a group identifies a representative connected element.
2. Clicking a group pins/highlights the representative element.
3. Clicking a group scrolls the representative element into view when needed.
4. Expanding a group preserves the active representative state.
5. Clicking a detail item pins/highlights and scrolls that exact element.
6. Switching inspection type clears stale pins/cards.

**Pass Criteria:**
- After group click, `fds-issue-pin` is visible and the representative element is in viewport or scroll is requested.
- After detail click, active pin number matches the clicked list item.
- Keyboard focus on group/list item previews the same representative target.

### 4. Readability And Clipping

**Files:**
- Verify/Modify: `overlay.css`
- Verify/Modify: `content-render.js`

**Checks:**
1. Panel title, token context, scan meta, stat labels, group labels, values, and detail rows do not overlap.
2. Long token names or long CSS values are either fully available via accessible label/title or wrapped in the inspector card.
3. Small viewports keep toolbar and panel inside the viewport.
4. Text truncation never removes the only explanation of the issue.

**Pass Criteria:**
- Every truncated visible string has a `title` or `aria-label` with the full value.
- No row uses clipping for all of chip, status, and value at the same time.
- At `390px` viewport width, panel remains readable and horizontally contained.

### 5. Category And Tab Clarity

**Files:**
- Verify/Modify: `content-render.js`
- Verify/Modify: `content-render.test.js`

**Checks:**
1. BG/Border/Text tabs are rendered only in color mode.
2. Tabs expose full accessible names such as `배경색`, `보더색`, `글자색`.
3. Tabs expose counts, at least through `aria-label` or title.
4. If selected color tone has zero results but another tone has results, the nonzero tone becomes active.

**Pass Criteria:**
- Keyboard and screen reader users can understand what each short tab label means.
- Visual users still get compact labels.

### 6. Actionability And UX Copy

**Files:**
- Verify/Modify: `content.js`
- Verify/Modify: `content-render.js`
- Verify/Modify: tests that assert user-facing copy

**Checks:**
1. Empty states say the active inspection has no violations.
2. Idle state says how to begin.
3. Error state says how to recover.
4. Result rows expose what happens on click.
5. Inspector card shows replacement token candidates when available.

**Pass Criteria:**
- No state ends in a dead-end.
- Button/row labels describe their action, not only their visual label.

### 7. Accessibility And Keyboard

**Files:**
- Verify/Modify: `content-render.js`
- Verify/Modify: `overlay.css`

**Checks:**
1. All interactive elements are real buttons.
2. Buttons have usable accessible names.
3. Focus state is visible and not color-only.
4. `aria-expanded` updates for groups.
5. Status updates use `role="status"` or `role="alert"` where appropriate.

**Pass Criteria:**
- Tab navigation can reach close button, summary cards, tabs, groups, and detail rows.
- Focused group/detail item previews the same target as hover.

### 8. Performance And Stability

**Files:**
- Verify: `content-scan-runner.js`
- Verify: `content-scan-runner.test.js`

**Checks:**
1. Large DOM scan yields between batches.
2. Scan caps at max elements and records truncation.
3. UI is still interactive after scan.
4. Duplicate issue keys do not inflate visible result counts.

**Pass Criteria:**
- Large fixture reports `batchYieldCount > 0`.
- Large fixture reports `truncated: true`.
- No duplicate key appears in visible `issueEntries`.

## Implementation Tasks

### Task 1: Encode Copy And Accessibility Improvements

**Files:**
- Modify: `content-render.js`
- Modify: `content-render.test.js`
- Modify: `content.js`
- Modify: `content-scan-runner.test.js`

**Steps:**
1. Change group count copy from `N곳` to `N개 요소`.
2. Add descriptive `aria-label` and `title` for group rows.
3. Add descriptive `aria-label` and `title` for detail rows.
4. Add full names and counts to color tab `aria-label`/`title`.
5. Update tests for the changed copy.

### Task 2: Make Group Click Navigate To Representative Element

**Files:**
- Modify: `content.js`
- Modify: `content-scan-runner.test.js`

**Steps:**
1. Make `showGroupPin()` return the representative entry.
2. On group click, expand/collapse, lock the representative, update UI, then call `scrollToIssueElement(entry)`.
3. Add a source-level test assertion so the behavior does not regress.

### Task 3: Improve Error Recovery Copy

**Files:**
- Modify: `content.js`
- Modify: `content-scan-runner.test.js`

**Steps:**
1. Change scan error copy to include the next action: retry with refresh.
2. Update tests that assert error copy.
3. Re-run fixture error state.

### Task 4: Add QA Evidence Document

**Files:**
- Create: `docs/verification/fds-uiux-qa-inspection-checklist.md`

**Steps:**
1. Record the detailed checklist from this plan.
2. Add fixture run results and known limitations.
3. Add a release gate summary: pass, fail, needs manual Chrome check.

### Task 5: Verify

**Commands:**
```bash
node --test content-render.test.js content-scan-runner.test.js
npm test
```

**Expected:**
- All tests pass.
- Fixture automation confirms spacing, large DOM, and error states still work.
