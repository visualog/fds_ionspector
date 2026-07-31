# Toolbar Computed Style Check

This checklist verifies the computed style of the toolbar root in the browser.
Use it when the toolbar still looks different from Figma even after the spec values were updated.

## What this covers

- Root padding: `8px`
- Root gap: `16px`
- Button size: `32px`
- Divider height: `19px`
- Variant width:
  - default: `384px`
  - disconnected message: `401px`
  - connected message: `310px`
  - compact disconnected: `96px`
  - collapsed: `48px`

## Files

- Console snippet: [toolbar-computed-style-check.js](/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector/docs/verification/toolbar-computed-style-check.js)
- Drift log template: [drift-log-template.md](/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector/docs/drift-log-template.md)

## Fast path

1. Open the page where `FDS Inspector` is visible.
2. Open DevTools.
3. Paste the contents of `toolbar-computed-style-check.js` into the Console.
4. Run the checker while the toolbar is in the state you want to validate.
5. Save the output table and compare it against the expected values below.

## Expected checks

### Root

- `#fds-toolbar`
- `padding-top` = `8px`
- `padding-right` = `8px`
- `padding-bottom` = `8px`
- `padding-left` = `8px`
- `gap` or `column-gap` = `16px`
- `width` matches the active variant

### Button

- `#fds-toolbar .fds-btn`
- `width` = `32px`
- `height` = `32px`

### Divider

- `#fds-toolbar .fds-divider`
- `height` = `19px`

### Variant widths

- `connected-default` = `384px`
- `connected-message` = `310px`
- `disconnected-message` = `401px`
- `disconnected-compact` = `96px`
- `collapsed` = `48px`

## Semi-automatic workflow

Use the snippet first. If it fails or the toolbar is not visible, fall back to manual inspection.

### Console snippet result

The snippet prints:

- active mode
- root computed styles
- first button size
- divider size
- expected vs observed width
- pass/fail flags for each check

### Manual fallback

If the snippet cannot run:

1. Right-click the toolbar and inspect it.
2. Check the `Computed` pane for `padding`, `gap`, `width`, and `height`.
3. Inspect one button and one divider.
4. Compare the values against the checklist above.
5. Record any mismatch in `docs/drift-log/`.

## Pass criteria

The toolbar passes when all of these are true:

- root padding is `8px` on all sides
- root gap is `16px`
- button size is `32px x 32px`
- divider height is `19px`
- width matches the active variant

## What to log

If something is off, record:

- active toolbar mode
- observed computed values
- expected values
- screenshot if available
- whether the toolbar was collapsed
- whether the bridge was connected

