# FDS Inspector Visual Checklist

Use this checklist during every browser verification pass.
Keep one screenshot for the toolbar and one for the summary panel whenever a layout change is made.

## Scope

- Toolbar: `pattern/toolbar`
- Summary panel: `pattern/check_info_pannel`
- Bridge/status indicator states
- Drag behavior for toolbar and summary panel

## Toolbar Checklist

### Root shell

- Toolbar uses a horizontal layout.
- Toolbar padding is `8px` on all sides.
- Toolbar gap is `16px`.
- Toolbar height resolves to `48px` from content plus padding, not from a fixed-height box.
- Toolbar width hugs content in the default state.
- Toolbar width is `384px` in the default connected variant.
- Toolbar width is `310px` in the connected message variant.
- Toolbar width is `401px` in the disconnected message variant.
- Toolbar width is `96px` in the compact disconnected variant.
- Toolbar width is `48px` in the collapsed single-button state.

### Child order

- The toolbar child order matches the Figma structure:
  - bridge status icon
  - divider
  - color
  - font
  - spacing
  - radius
  - divider
  - refresh
  - divider
  - close
- No grouped wrapper should change the visible order.

### Button sizing

- Each toolbar button is `32px x 32px`.
- Icon slot inside a button is `24px x 24px`.
- Icon slot inside a button is visually centered.
- Large badge size is `24px x 20px`.
- Small dot size is `8px x 8px`.

### Divider rules

- Divider visual height is `19px`.
- Divider should not inflate the toolbar width.
- Divider spacing should read as `16px` on both sides.

### State variants

- Connected default state shows the full toolbar.
- Connected message state shows the message bar variant.
- Disconnected message state shows the disconnected message bar variant.
- Compact disconnected state shows the compact disconnected variant.
- Collapsed state keeps only the first bridge status icon visible.
- Collapsed state is explicitly reflected in `data-toolbar-collapsed="true"` and `data-collapsed="true"`.

### Bridge status icon

- The first toolbar icon shows bridge connection state.
- Clicking it collapses the toolbar to the single-icon state.
- Clicking again restores the full toolbar.

### Interaction

- Toolbar can be dragged by empty space or divider areas.
- Clicking a button should still trigger its action.
- Text selection should not happen while dragging.
- Toolbar should stay inside the viewport when dragged.

### Visual sanity checks

- Left padding should be visibly present.
- Right close icon should not feel clipped.
- Divider gaps should not feel wider than button-to-button gaps.
- Badge should sit in the top-right region of its button without covering the icon center.

## Summary Panel Checklist

### Root shell

- Summary panel width is `240px`.
- Summary panel height hugs content.
- Summary panel uses `16px` internal padding.
- Summary panel body uses `16px` spacing between major sections.

### Layout

- Panel title and controls stay in a compact header row.
- Panel content does not overflow the frame.
- Panel should remain readable without feeling like a debug dump.

### Visible states

- Panel can show bridge status.
- Panel can show active filter state.
- Panel can show mode state.
- Panel can show violation counts.
- Idle state should still feel intentional, not empty.

### Interaction

- Panel can be dragged by its header.
- Panel stays inside the viewport while dragged.
- Closing the panel does not break the toolbar.

### Visual sanity checks

- Header feels distinct from body content.
- Count chips wrap cleanly instead of overlapping.
- The panel should feel lighter than the toolbar, not heavier.

## Verification Routine

1. Refresh the extension.
2. Refresh the page.
3. Run `docs/verification/toolbar-computed-style-check.js` in DevTools Console.
4. Check toolbar default state.
5. Click the first bridge icon and verify collapse/restore.
6. Drag the toolbar.
7. Open the summary panel and drag it.
8. Check bridge connection state and filter state.
9. Capture a screenshot if any mismatch is visible.

## Evidence To Save

- Toolbar screenshot for the current state
- Summary panel screenshot for the current state
- `toolbar-computed-style-check.js` output for the current state
- Bridge health output if the bridge state changes
- Any mismatch notes in `docs/drift-log-template.md`
