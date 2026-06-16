# 07. Agent Guardrails

When applying this direction:

1. Do not create one giant file.
2. Keep files under 300 lines when possible.
3. Split layout, navigation, content data, and UI primitives.
4. Put sidebar data and catalog data in separate files.
5. Use semantic HTML for article content.
6. Use CSS variables or design tokens instead of random values.
7. Avoid page-specific one-off styling unless required.
8. Reuse primitives such as:
   - `DocsShell`
   - `TopNav`
   - `SidebarNav`
   - `TableOfContents`
   - `PageHeader`
   - `DocCard`
   - `StatusBadge`
   - `CodeBlock`
   - `TokenTable`
   - `Callout`
9. All generated pages should share the same layout grammar.
10. Do not copy SEED brand assets, logos, or proprietary visuals.

## FDS Admin Implementation Order

1. Establish docs shell.
2. Normalize navigation IA.
3. Convert overview/dashboard into docs overview.
4. Convert token and foundation pages into foundation/reference pages.
5. Convert component and rule pages into catalog/reference pages.
6. Convert build, QA, and module pages into release/resources pages.
7. Verify responsive behavior and identifier styling.

## Quality Checklist

- Does it feel like documentation, not a marketing page?
- Is the sidebar hierarchy clear?
- Is the main content width readable?
- Are headings, paragraphs, tables, and cards visually consistent?
- Are borders subtle and surfaces minimal?
- Are cards functional rather than decorative?
- Is the right TOC used only when useful?
- Does mobile avoid horizontal layout breakage?
- Are code blocks and tables readable?
- Are focus states defined?
- Can the same components support multiple page types?
