# SEED-Inspired Admin Design Guide

This is the working guide for applying the SEED Design docs direction to the FDS Inspector admin app.

The full imported source is preserved at:

- `docs/design/seed/original-seed-design-site-direction-guide.md`

Use the split documents below as the day-to-day reference for implementation.

## Working References

- `docs/design/seed/01-principles.md`
- `docs/design/seed/02-layout-system.md`
- `docs/design/seed/03-visual-system.md`
- `docs/design/seed/04-components.md`
- `docs/design/seed/05-page-recipes.md`
- `docs/design/seed/06-responsive-accessibility.md`
- `docs/design/seed/07-agent-guardrails.md`

## FDS Inspector Admin Interpretation

The admin app should feel like a compact design-system documentation surface, not a marketing page or a heavy analytics dashboard.

Prioritize:

- documentation-first clarity
- focused main content width
- left hierarchical navigation
- neutral white/gray surfaces
- subtle borders and minimal shadows
- compact typography
- token/file/value display consistency
- tables, lists, callouts, and article sections over decorative card grids

Avoid:

- oversized hero areas
- dark immersive dashboard styling
- excessive cards
- decorative gradients
- icon-heavy information labels
- stretching prose across the full browser width

## Current Admin Target

The first renewal should establish the docs shell:

- sticky top navigation
- left sidebar navigation
- centered readable main column
- optional right table of contents on wide screens
- page content presented as documentation sections

After the shell is stable, page content can be progressively refit into foundation pages, component catalog pages, rule/reference pages, release/status pages, and resources pages.
