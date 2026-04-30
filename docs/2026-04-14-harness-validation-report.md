# FDS Inspector Harness Validation Report

Date: 2026-04-14

## Purpose

Track whether the current harness around `FDS_inspector` is actually improving:

1. implementation speed
2. implementation accuracy
3. repeatability
4. failure diagnosis

This report is not a theory note.
It records what happened in real implementation work.

## Scope

Current harness under evaluation:

- Figma bridge (`xbridge`)
- saved bridge snapshots
- toolbar spec source of truth
- layout/state tests
- visual verification checklist
- drift log

## What Was Validated In This Round

### 1. Bridge payload quality

Validated:
- `search-nodes`
- `get-component-variant-details`
- `get-instance-details`

Confirmed useful outputs:
- `pattern/toolbar` component-set variants
- real toolbar instance state in `Frame 12`
- `pattern/check_info_pannel` layout
- `comp/button/toolbar.menu` layout and variant structure

Assessment:
- Payload quality is now strong enough to drive implementation decisions directly.

Evidence:
- `pattern/toolbar`:
  - `layoutMode: HORIZONTAL`
  - `itemSpacing: 16`
  - `padding: 8`
  - widths `401 / 310 / 384 / 96 / 48`
- actual toolbar instance:
  - `status=color`
  - `active=True`
  - `width: 384`
  - `height: 48`
- `comp/button/toolbar.menu`:
  - `32x32`
  - `padding: 4`
  - `itemSpacing: 8`
  - icon slot `24x24`

### 2. Bridge request stability

Validated:
- repeated local bridge calls during active implementation

Observed:
- health succeeded while some immediate follow-up calls still failed intermittently
- active plugin id changed across sessions
- stale/offline session errors appeared during reconnection transitions
- some local HTTP failures were environment-related, not payload-related

Assessment:
- Request stability is still weaker than payload quality.
- This is one of the biggest remaining harness bottlenecks.

### 3. Snapshot usefulness

Validated:
- snapshot placeholders were created first
- real bridge data was later written into them

Assessment:
- This is a meaningful harness improvement.
- Snapshot files now let us keep implementation work anchored to captured design facts even if the live bridge becomes unstable later.

Files now functioning as bridge memory:
- `docs/bridge-snapshots/pattern-toolbar.component-set.json`
- `docs/bridge-snapshots/frame-12-toolbar.instance.json`
- `docs/bridge-snapshots/pattern-check-info-panel.component-set.json`
- `docs/bridge-snapshots/comp-button-toolbar-menu.component-set.json`

### 4. Spec-driven implementation

Validated:
- toolbar geometry was centralized into `TOOLBAR_SPEC`
- tests now assert core toolbar layout values directly

Assessment:
- This clearly improves repeatability.
- It reduces drift caused by retyping numbers in multiple places.

Evidence:
- `padding: 8`
- `itemSpacing: 16`
- `buttonSize: 32`
- `dividerHeight: 19`
- variant widths are asserted in tests

### 5. Visual verification structure

Validated:
- visual checklist exists
- drift template exists
- first drift log exists with real mismatch history

Assessment:
- The harness now has a place to record repeated failure modes instead of rediscovering them in chat.
- This helps, but it is still mostly manual.

## Impact On Work Efficiency

### Positive impact already visible

1. Less re-discovery
- We no longer need to repeatedly remember toolbar numbers from chat history.

2. Faster implementation decisions
- Bridge detail responses now give enough authority to stop guessing padding/gap/layout.

3. Better debugging
- Drift causes can now be recorded as harness failures, not just "the UI still looks off".

4. Better separation of failure types
- We can now distinguish:
  - bad bridge payload
  - unstable bridge request path
  - wrong Figma context
  - code drift from spec

### Limits that still reduce efficiency

1. Bridge session instability
- Correct file context and active plugin id still need active checking.
- Even within the same local session, `health` can succeed while immediate follow-up detail reads fail to connect.
- This keeps the bridge useful, but still interrupts fast implementation loops.

2. Visual checks are still manual
- We still rely too much on screenshots and human noticing.

3. CSS consumption is not fully spec-locked yet
- Some toolbar values still exist in CSS as fallback numbers.

## Impact On Result Quality

### Improved

- Layout fidelity confidence is higher after live snapshot capture.
- Toolbar state modeling is less guess-based.
- Instance state can now be read directly instead of inferred.

### Still vulnerable

- Final visual polish can still drift from the spec even when the numbers are correct.
- Browser rendering differences are still not automatically compared against snapshot expectations.

## Current Harness Score

This is a practical project-specific score, not a universal benchmark.

1. Bridge payload quality: 8/10
2. Bridge request stability: 5/10
3. Captured design memory: 8/10
4. Spec-driven implementation: 7/10
5. Visual verification automation: 4/10
6. Drift detection before user feedback: 5/10

Overall:
- `current harness effectiveness: 6.2/10`

Interpretation:
- The harness is now materially helping.
- It is no longer "barely there".
- But it still does not catch enough problems before human review.

## What The Harness Is Proving Right Now

The current evidence supports this claim:

> Harness quality is already improving the model's working effectiveness on this project.

Why:
- bridge snapshots reduced context loss
- spec constants reduced repeated geometry drift
- tests catch logic/state regressions faster
- drift logs capture recurring failure patterns

## What The Harness Still Fails To Do

1. Automatically confirm visual fidelity
2. Keep bridge sessions stable without manual attention
3. Guarantee that rendered CSS fully derives from captured design spec

## Improvements Still Needed

### Priority 0

1. Add a direct bridge snapshot capture script
- Take a `pluginId` and node ids
- write normalized JSON snapshots automatically

2. Add computed-style verification for toolbar root
- Confirm:
  - padding
  - gap
  - button size
  - divider height
  - width by variant

3. Add a single current-plugin resolver
- Avoid hardcoding or reusing stale plugin ids

## Additional Validation Note From This Round

Observed during a later implementation pass:

- `GET /health` returned success with an active plugin
- immediate `get-node-details` POST calls still failed at the transport layer

Assessment update:

- bridge payload quality remains strong when requests land
- request stability is still the highest-friction harness issue
- because of that, computed-style and snapshot-based verification become even more valuable as fallback guardrails

### Priority 1

1. Add browser verification screenshots per toolbar state
2. Record bridge stability observations each round
3. Reduce remaining toolbar layout fallback numbers in CSS

### Priority 2

1. Automate drift log generation from failed checks
2. Expand validation from toolbar to summary panel

## Working Rule Going Forward

From this point on, each implementation round should include:

1. one implementation step
2. one harness check
3. one note on whether the harness helped or failed

That way the harness improves alongside the UI, not afterward.
