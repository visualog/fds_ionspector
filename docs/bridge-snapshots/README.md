# Bridge Snapshots

This directory defines the snapshot format used by Task B1 in `docs/2026-04-14-fds-inspector-harness-improvement-plan.md`.

Goal:
- keep implementation-critical Figma data available even when live bridge calls are unstable
- make toolbar and panel fidelity work from a saved, reviewable JSON source
- separate bridge payload quality from bridge call stability

## What to snapshot

Start with these nodes, because they are the ones we have already identified as implementation-critical:

- `pattern/toolbar`
- the actual toolbar instance inside `Frame 12`
- `pattern/check_info_pannel` (stored as `pattern-check-info-panel.component-set.json`)
- `comp/button/toolbar.menu`

## Suggested file layout

Keep one JSON snapshot per node or node class. Use a stable, human-readable name that tells you what the snapshot represents.

Current filenames:

- `pattern-toolbar.component-set.json`
- `frame-12-toolbar.instance.json`
- `pattern-check-info-panel.component-set.json`
- `comp-button-toolbar-menu.component-set.json`

If you later need revisioned snapshots, add a timestamp suffix instead of changing the base name:

- `pattern-toolbar.component-set.2026-04-14.json`
- `frame-12-toolbar.instance.2026-04-14.json`

## Snapshot schema

Every snapshot should be normalized to the same top-level shape so it can be diffed and reused across turns.

Recommended fields:

```json
{
  "source": {
    "nodeName": "pattern/toolbar",
    "nodeType": "COMPONENT_SET",
    "nodeRole": "component-set",
    "sourceContext": "Section 1"
  },
  "identity": {
    "figmaNodeId": "redacted-or-optional",
    "variantProperties": {
      "status": "color",
      "active": "True"
    },
    "componentProperties": {
      "title": "..."
    }
  },
  "layout": {
    "layoutMode": "HORIZONTAL",
    "itemSpacing": 16,
    "paddingTop": 8,
    "paddingRight": 8,
    "paddingBottom": 8,
    "paddingLeft": 8,
    "primaryAxisSizingMode": "AUTO",
    "counterAxisSizingMode": "AUTO",
    "width": 384,
    "height": 48
  },
  "children": [
    {
      "name": "plug",
      "type": "INSTANCE",
      "x": 8,
      "y": 8,
      "width": 32,
      "height": 32,
      "visible": true
    }
  ],
  "notes": {
    "comments": [],
    "warnings": []
  }
}
```

## Field rules

### Required fields

These are the minimum fields the B1 snapshot should keep for all implementation-critical nodes:

- `source.nodeName`
- `source.nodeType`
- `layout.layoutMode`
- `layout.itemSpacing`
- `layout.paddingTop`
- `layout.paddingRight`
- `layout.paddingBottom`
- `layout.paddingLeft`
- `layout.primaryAxisSizingMode`
- `layout.counterAxisSizingMode`
- `layout.width`
- `layout.height`
- `children[]` in document order
- `identity.variantProperties` when the node is a variant or instance
- `identity.componentProperties` when present

### Strongly recommended fields

These help with fidelity work and debugging:

- `source.sourceContext`
- `identity.figmaNodeId`
- `children[].x`
- `children[].y`
- `children[].width`
- `children[].height`
- `children[].visible`
- `notes.warnings`
- `notes.comments`

### Optional fields

Only add these if the bridge returns them reliably or they help a specific review:

- fills
- strokes
- corner radius
- font styles
- text content
- constraints
- effects

## Normalization rules

Use the same normalization rules for every snapshot:

- keep child order as Figma renders it
- convert booleans and enum-like values to the bridge's canonical string values when needed
- keep the snapshot focused on implementation-critical fields, not every raw bridge field
- prefer stable names over raw node IDs in the filename
- if a field is missing, omit it rather than invent a default
- do not store transient UI state unless it affects implementation

## Recommended snapshot groups

### Toolbar group

Files:

- `pattern-toolbar.component-set.json`
- `frame-12-toolbar.instance.json`
- `comp-button-toolbar-menu.component-set.json`

Use this group to drive:

- toolbar spacing
- icon order
- collapse behavior
- badge and dot placement
- toolbar drag behavior

### Info panel group

Files:

- `pattern-check-info-panel.component-set.json`

Use this group to drive:

- panel dimensions
- panel padding
- header layout
- list density
- collapse and drag affordances

## Storage rules

- Store snapshots under `docs/bridge-snapshots/`
- Keep one README in the same folder as the contract for the folder
- Do not mix generated snapshots with implementation code
- If you refresh a snapshot, keep the previous version only when the diff is useful for review
- If a snapshot is based on a temporary bridge state, mark it in `notes.warnings`

## Placeholder snapshot files

The project can start with these placeholder JSON files once snapshot capture is implemented:

- `docs/bridge-snapshots/pattern-toolbar.component-set.json`
- `docs/bridge-snapshots/frame-12-toolbar.instance.json`
- `docs/bridge-snapshots/pattern-check-info-panel.component-set.json`
- `docs/bridge-snapshots/comp-button-toolbar-menu.component-set.json`

These names are intentionally descriptive so that bridge regressions can be discussed by node name, not by raw node ID.
