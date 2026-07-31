# FDS Inspector Harness Improvement Plan

Date: 2026-04-14

## Goal

Improve the working harness around `FDS_inspector` so design-to-code work becomes faster, more accurate, and less dependent on manual correction.

This plan focuses on three tracks:

1. Bridge
2. Implementation
3. Verification

The point is not just to make the model "smarter".
The point is to make the surrounding system give the model better inputs, stronger constraints, and faster feedback.

## Current Diagnosis

### What is already helping

- The Figma bridge can now read implementation-useful values for `pattern/toolbar`.
- We can inspect real auto-layout values such as:
  - `layoutMode`
  - `itemSpacing`
  - `padding`
  - variant axes
- The extension already has focused unit tests:
  - `toolbar-state.test.js`
  - `toolbar-drag.test.js`
  - `background-logic.test.js`
- We can verify the result in a real browser quickly.

### What is still slowing us down

- Figma values are still not enforced tightly enough at render time.
- Bridge calls can still be unstable between runs.
- Visual validation is too manual.
- We still discover some fidelity problems from the user after the fact instead of from the harness itself.
- Toolbar and panel behavior are getting more stateful, but the current verification loop is still too shallow.

## Success Criteria

The harness is "good enough" when all of the following are true:

1. A toolbar spec can be read once from Figma and reused deterministically in code.
2. Layout-critical values are asserted in tests.
3. Visual drift is caught before the user has to point it out.
4. Bridge instability no longer blocks implementation progress.
5. Toolbar and panel states are implemented as explicit variants, not CSS guesswork.

## Track 1. Bridge

### Objective

Make bridge data reliable enough that implementation uses real Figma values, not manual re-interpretation.

### Task B1. Persist bridge snapshots for implementation-critical nodes

Problem:
- We currently depend on live bridge calls during implementation.
- When the bridge is unstable, progress slows down or values get re-read inconsistently.

Do:
- Save normalized JSON snapshots for implementation-critical nodes under `docs/bridge-snapshots/`.
- Start with:
  - `pattern/toolbar`
  - actual toolbar instance in `Frame 12`
  - `pattern/check_info_pannel`
  - `comp/button/toolbar.menu`

Snapshot should include:
- name
- node type
- width / height
- auto-layout fields
- ordered children
- variant properties
- component properties when present

Done when:
- implementation work can continue from the saved snapshot even if live bridge calls fail temporarily.

### Task B2. Define a bridge read contract for this project

Problem:
- The project now depends on a small set of fields repeatedly, but they are not written down as a required contract.

Do:
- Create a short bridge read contract for `FDS_inspector`.
- Required fields:
  - `layoutMode`
  - `itemSpacing`
  - `paddingTop`
  - `paddingRight`
  - `paddingBottom`
  - `paddingLeft`
  - `primaryAxisSizingMode`
  - `counterAxisSizingMode`
  - `variantProperties`
  - `componentPropertyDefinitions`
  - ordered child list

Done when:
- bridge regressions can be described as contract failures instead of vague "it feels worse".

### Task B3. Track bridge stability separately from bridge payload quality

Problem:
- We have seen cases where the bridge returns excellent data when it works, but call stability is still uneven.

Do:
- Record two separate observations in future notes:
  - payload quality
  - request stability

Done when:
- we stop mixing "bad data" and "unstable request path" into one problem statement.

## Track 2. Implementation

### Objective

Turn Figma-derived values into explicit code structure so the UI cannot drift casually.

### Task I1. Move toolbar layout constants into one spec object

Problem:
- Even after reading the correct Figma values, layout can drift when those values live in multiple places.

Do:
- Introduce one project-local toolbar spec source.
- Include:
  - toolbar padding
  - toolbar gap
  - divider height
  - button size
  - badge size
  - dot size
  - variant widths

Suggested target:
- `toolbar-spec.js` or folded into `toolbar-state.js`

Done when:
- toolbar layout numbers are not duplicated across CSS, render logic, and tests.

### Task I2. Separate render structure by variant

Problem:
- Variant fidelity drops when one render tree is heavily patched by conditionals.

Do:
- Keep explicit render structures for:
  - disconnected message
  - connected message
  - connected default
  - compact
  - collapsed

Done when:
- each variant can be reasoned about directly from one structure.

### Task I3. Reduce visual compensation hacks

Problem:
- Some spacing and icon issues came from optical tweaks compensating for structural mismatches.

Do:
- After spec constants are centralized, review:
  - icon transforms
  - badge offsets
  - divider margins
  - root padding
- Keep only the adjustments that are truly optical, not structural fixes in disguise.

Done when:
- the CSS reads like an intentional layout system rather than a chain of exceptions.

### Task I4. Treat toolbar and summary panel as separate fidelity tracks

Problem:
- Toolbar and panel work have been competing for attention.

Do:
- Prioritize toolbar parity first.
- Keep summary panel on a separate checklist so toolbar progress is not diluted.

Done when:
- toolbar can reach high fidelity before the panel consumes more effort.

## Track 3. Verification

### Objective

Catch layout and state drift before the user has to report it manually.

### Task V1. Add layout assertions to tests

Problem:
- Current tests validate state logic well, but not enough geometry.

Do:
- Add assertions for:
  - default variant item order
  - collapsed variant item count
  - variant widths
  - status widths
  - toolbar gap
  - button size

Done when:
- accidental geometry drift breaks tests early.

### Task V2. Add a manual visual checklist file

Problem:
- We keep re-checking the same visual details from memory.

Do:
- Create a small checklist for browser verification.
- First version should include:
  - toolbar root padding 8
  - button size 32
  - gap 16
  - divider height 19
  - default width 384
  - disconnected message width 401
  - connected message width 310
  - collapsed width 48
  - drag behavior for toolbar
  - drag behavior for summary panel

Done when:
- each visual pass follows the same checklist.

### Task V3. Capture implementation screenshots during fidelity passes

Problem:
- We compare visually, but not consistently enough.

Do:
- During fidelity work, save screenshots to a predictable folder such as `docs/verification/`.
- Use stable names for states:
  - `toolbar-default.png`
  - `toolbar-color-active.png`
  - `toolbar-disconnected-message.png`
  - `toolbar-collapsed.png`

Done when:
- before/after comparisons become concrete instead of memory-based.

### Task V4. Maintain a drift log

Problem:
- Repeated mistakes are easy to forget if they are only discussed in chat.

Do:
- Log each significant mismatch with:
  - symptom
  - root cause
  - fix
  - missing harness layer

Example:
- symptom: toolbar padding looked missing
- root cause: global reset overrode local padding
- fix: remove `padding: 0` from reset
- missing harness layer: no computed-style verification step

Done when:
- we can see patterns in failure modes and improve the harness systematically.

## Priority Order

### Priority 0

1. B1. Persist bridge snapshots
2. I1. Centralize toolbar spec constants
3. V1. Add geometry assertions

### Priority 1

1. I2. Separate render structure by variant
2. V2. Add manual visual checklist
3. V3. Capture verification screenshots

### Priority 2

1. B2. Bridge read contract
2. B3. Stability vs payload tracking
3. I3. Reduce visual compensation hacks
4. V4. Drift log

## Immediate Next Actions

If we continue this project now, the best next sequence is:

1. Save bridge snapshots for the toolbar-related nodes.
2. Centralize toolbar layout values into one spec object.
3. Add geometry assertions for the toolbar.
4. Re-run a focused toolbar fidelity pass.
5. Only after that, resume deeper summary panel polish.

## Expected Payoff

If this plan is followed, the expected gains are:

- fewer repeated layout mistakes
- less dependency on manual correction
- faster Figma-to-code iteration
- clearer separation between bridge problems and implementation problems
- better reuse of verified design data across turns
