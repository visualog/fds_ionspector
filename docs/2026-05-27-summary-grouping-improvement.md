# 2026-05-27 Summary Grouping Improvement

## Goal

FDS Inspector summary panel currently lists every issue entry one by one. On real pages, repeated raw values such as `글자색 #252d38 (원시값 직접 사용)` can produce a very long list and make the highest-impact fixes harder to see.

## Design

- Group visible issues by issue type, status, and inspected value.
  - Example: `글자색 #252d38 · 원시값 직접 사용 · 96곳`
  - Example: `배경색 #ffffff · 원시값 직접 사용 · 9곳`
- Render grouped rows by default.
- Let each group expand to show the existing per-element detail rows.
- Keep detail row behavior unchanged:
  - Hover/focus previews the target element.
  - Click pins and scrolls to the target element.
- Keep grouping scoped to the current summary view.
  - Color subtab and tone filters still decide which entries are visible.
  - Font, spacing, and radius use the same grouping behavior.

## Implementation Notes

- Group keys should be stable across rerenders and based on category, tone, color part, parsed chip, parsed value, and parsed status.
- Group row click should only expand/collapse the group.
- Detail rows should keep their existing `data-issue-key` and `data-issue-number` behavior.
- Expanded state can live in content script memory and does not need persistence across reloads.

## Verification

- The summary list should show far fewer rows when many entries share the same value.
- Expanding a group should reveal the individual element rows.
- Detail row hover/click should still preview, pin, and scroll to elements.
- Existing automated tests should continue passing.
