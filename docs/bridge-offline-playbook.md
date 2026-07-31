# Bridge Offline Playbook

Use this guide when the Figma bridge is offline, stale, or not trustworthy enough for live design reads.

## 1. Check Order

When the bridge looks broken, check in this order:

1. `GET /health`
2. Confirm the active plugin/session id in the health response
3. Check whether the bridge reports `connected`, `active`, `online`, or `ready`
4. Look for `staleReportedPluginId` or any mismatch between reported and active plugin ids
5. If health is good but live reads fail, treat the bridge as partially stale rather than fully unavailable

Rules:

- `health = ok` does not always mean live detail reads are safe
- if the active plugin id is missing or mismatched, trust the snapshot fallback
- if the bridge session flips during a task, stop live snapshot refresh and continue from saved docs

## 2. What Can Continue

Keep working when the bridge is offline or stale if the task only needs saved references.

You can continue:

- updating `TOOLBAR_SPEC`
- editing `content.js`, `overlay.css`, or tests using saved spec values
- comparing code against `docs/bridge-snapshots/*.json`
- running computed-style checks in DevTools
- updating `docs/verification/visual-checklist.md`
- recording mismatches in `docs/drift-log-template.md`
- refining fallback behavior, collapse behavior, drag behavior, and panel behavior

## 3. What Must Stop

Pause live bridge-dependent work when the bridge is stale or disconnected.

Stop these tasks:

- refreshing live bridge snapshots
- trusting variant or instance detail from a stale session
- claiming the current Figma file state is confirmed
- rewriting layout assumptions without a saved snapshot or computed-style check

If live reads are failing, do not keep retrying in a loop. Switch to fallback sources and log the gap.

For snapshot capture:

- prefer saving a degraded snapshot with `nodeDetails` plus a warning over failing the entire capture
- only treat `nodeDetails` failure as fatal
- if `instanceDetails` or `variantDetails` fails, keep the snapshot and record the failure reason in `notes.warnings`

## 4. Fallback Sources

Use these sources in this order when the bridge is not trustworthy:

### `TOOLBAR_SPEC`

Use `TOOLBAR_SPEC` as the source of truth for toolbar geometry:

- padding
- item spacing
- button size
- divider height
- collapsed width
- variant widths

If code and spec disagree, update code to match `TOOLBAR_SPEC` first.

### `docs/bridge-snapshots/`

Use the saved snapshots for implementation-critical structure:

- child order
- variant properties
- instance properties
- panel dimensions
- button metadata

If a live bridge read is unavailable, the snapshot is the next best source.

### `docs/verification/visual-checklist.md`

Use the checklist as the browser fallback when live bridge data is missing:

- verify root padding and gap
- verify collapsed state
- verify panel width and drag behavior
- capture screenshots when the visual result is unclear

### `docs/drift-log-template.md`

Use the drift log whenever the implementation still does not match the saved spec or screenshot.

Record:

- expected value
- observed value
- bridge note
- suspected cause
- fix plan
- verification result

## 5. Minimum Handoff Checklist

Before another person or agent takes over, make sure these are true:

- `TOOLBAR_SPEC` is still the current geometry source
- snapshots exist for `pattern/toolbar`, `Frame 12` toolbar instance, `pattern/check_info_pannel`, and `comp/button/toolbar.menu`
- `visual-checklist.md` reflects the current toolbar and panel expectations
- any mismatch is recorded in a drift log entry
- the last known bridge status is written down
- it is clear whether the next step is live bridge capture or offline implementation

## 6. Short Operating Rule

If the bridge is offline or stale:

1. stop live capture
2. keep implementing from `TOOLBAR_SPEC` and snapshots
3. verify with computed-style and visual checklist
4. log the drift
5. resume live bridge work only when health and session state are trustworthy again
