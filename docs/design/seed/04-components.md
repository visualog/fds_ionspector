# 04. Components

## Buttons

Use a quiet hierarchy:

1. Primary: strong filled action, rare
2. Secondary: border or subtle surface
3. Ghost: navigation and low-emphasis actions
4. Icon button: only with accessible labels

## Cards

Use cards to summarize documents or components, not as decoration.

Card anatomy:

- title
- short description
- optional badge/status
- optional arrow/action

Avoid using cards for every row of reference data.

## Badges And Pills

Use badges for:

- platform support
- status
- category
- version

Use file pills for file references. Keep token chips visually distinct from file pills through color/tone rather than icons.

## Tables

Use tables for:

- token references
- API props
- statuses
- migration mappings
- rule references

Style:

- small readable text
- clear header row
- light dividers
- monospace for names, props, tokens, file paths, and values

## Code Blocks

Use code blocks for:

- commands
- implementation examples
- token usage
- API snippets

Keep surfaces light gray with subtle border. Add copy buttons only when useful.

## Callouts

Use callouts for:

- warnings
- tips
- platform notes
- implementation constraints

Callouts should support the reading flow, not interrupt it.

## Identifier Styling

For FDS Admin:

- file paths: neutral pill, monospace
- tokens: tinted chip, monospace
- values: muted value pill
- avoid repeated visible “file” or “token” labels
- preserve `aria-label` or `title` when type needs assistive context
