# Bridge Snapshot Capture

This folder contains the local helper used to refresh the implementation snapshots under `docs/bridge-snapshots/`.

## Script

- `scripts/capture-bridge-snapshots.mjs`

## What it does

- reads the active bridge plugin id from `GET /health`
- resolves the four implementation-critical targets
- captures node details plus variant/instance detail where available
- writes normalized JSON snapshots into `docs/bridge-snapshots/`
- supports dry-run mode so you can review the planned update before writing files

## Default targets

- `pattern/toolbar` component set
- `Frame 12` toolbar instance
- `pattern/check_info_pannel` component set
- `comp/button/toolbar.menu` component set

## Usage

Dry-run:

```bash
node scripts/capture-bridge-snapshots.mjs
```

Dry-run does not contact the bridge; it only prints the files it would update.

Write files:

```bash
node scripts/capture-bridge-snapshots.mjs --write
```

Write files with an explicit plugin id:

```bash
node scripts/capture-bridge-snapshots.mjs --write --plugin-id page:0:1
```

Limit to a subset of targets:

```bash
node scripts/capture-bridge-snapshots.mjs --write --targets pattern-toolbar,frame-12-toolbar
```

## Output files

- `docs/bridge-snapshots/pattern-toolbar.component-set.json`
- `docs/bridge-snapshots/frame-12-toolbar.instance.json`
- `docs/bridge-snapshots/pattern-check-info-panel.component-set.json`
- `docs/bridge-snapshots/comp-button-toolbar-menu.component-set.json`

## Notes

- The script is intentionally dependency-free.
- It expects Node.js 18+ for the built-in `fetch` API.
- If a node cannot be resolved from search, the script falls back to the known node id and records that in `notes.warnings`.
