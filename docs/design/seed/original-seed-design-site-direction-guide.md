# SEED Design Docs Style Direction Guide

> Purpose: This document translates the design direction of `seed-design.io/docs` into a reusable, agent-readable design guide.  
> It is **not** a one-page clone prompt. It is a flexible direction document for generating many page types that feel consistent with the SEED Design documentation website.

---

## 1. What this document is for

Use this document when asking an AI coding agent to create pages inspired by the design direction of the SEED Design documentation site.

The goal is to preserve the site's **documentation-first clarity, compact information density, calm visual hierarchy, and design-system rigor** across many page types:

- Documentation landing pages
- Foundation overview pages
- Component listing pages
- Component detail pages
- Guidelines pages
- Migration pages
- Resources pages
- AI integration / developer utility pages
- Changelog or status pages
- Internal design-system docs

Do **not** use this as a pixel-perfect clone instruction. Use it as a reusable style system and layout grammar.

---

## 2. Source characteristics observed from SEED Design docs

SEED Design describes itself as a unified design language for Daangn products. The docs site is structured around shared tokens, components, and platform-specific libraries such as Web, Android, and iOS.

The public docs expose LLM-readable entry points and full-document references. The site also includes top-level sections such as Docs, React, Lynx, AI Integration, and Breeze, and document sections such as Foundation, Components, Guidelines, Migration, and Resources.

Key observed patterns:

- Global documentation shell with top navigation
- Search affordance with keyboard shortcut hint
- Left-side hierarchical navigation
- Main content column with article-like documentation
- Optional right-side “On this page” table of contents
- Compact typography and spacing
- Minimal surfaces, light borders, and mostly white backgrounds
- Design-token-driven language
- Component pages with anatomy, properties, guidelines, platform support, and examples
- Foundation pages explaining design principles before token tables
- Component index grouped by functional categories

---

## 3. Design personality

### Keywords

- clear
- systematic
- compact
- calm
- practical
- documentation-first
- product-design oriented
- platform-aware
- token-driven
- neutral but friendly

### Visual mood

The design should feel like a serious internal/external design-system documentation site, not a marketing landing page. Avoid excessive gradients, oversized hero effects, heavy shadows, glassmorphism, or decorative motion.

Prefer:

- white or near-white canvas
- black/gray text hierarchy
- subtle borders
- precise spacing
- compact cards
- restrained accent color
- high readability
- clear grouping
- predictable navigation

Avoid:

- dark immersive hero sections
- giant display typography as the default
- large marketing illustrations on every page
- overly rounded SaaS dashboard style
- dense enterprise admin tables unless page type requires it
- aggressive animations
- decorative background blobs

---

## 4. Layout system

### 4.1 Global page shell

Use a documentation shell as the default layout.

```tsx
<AppShell>
  <TopNavigation />
  <div className="docs-grid">
    <SidebarNavigation />
    <MainContent />
    <TableOfContents />
  </div>
</AppShell>
```

Recommended desktop grid:

```css
.docs-grid {
  display: grid;
  grid-template-columns: 260px minmax(0, 760px) 220px;
  column-gap: 40px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
}
```

Use this as a guideline, not a hard rule. The important principle is:

- sidebar = navigation memory
- center = focused reading
- right rail = local orientation

### 4.2 Top navigation

Top navigation should be fixed or sticky at the top, with a clean white background and bottom border.

Recommended elements:

- left: brand mark + `SEED Design` wordmark
- center or right: primary documentation sections
  - Docs
  - React
  - Lynx
  - AI Integration
  - Breeze
- search button
- optional GitHub / external link icon

Behavior:

- Sticky top on documentation pages
- Bottom border separates nav from content
- Search button should show shortcut hint like `⌘ K`
- On mobile, collapse section links into a menu button

Suggested Tailwind:

```tsx
<header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
  <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 md:px-8">
    ...
  </div>
</header>
```

### 4.3 Left sidebar

The sidebar is a hierarchical navigation system, not a decorative menu.

Use grouped sections:

- Overview
- Foundation
- Color
- Typography
- Iconography
- Components
- Guidelines
- Migration
- Resources

Each group can contain nested links. Active link should be visible but not loud.

Recommended style:

- small text
- muted group labels
- active item with light gray background or darker text
- subtle radius
- vertical scroll when content is long

Suggested Tailwind:

```tsx
<aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto py-8 pr-2 lg:block">
  <nav className="space-y-8 text-sm">
    ...
  </nav>
</aside>
```

### 4.4 Main content

Main content should behave like a readable technical article.

Recommended structure:

```tsx
<main className="min-w-0 py-10 md:py-14">
  <Breadcrumb />
  <PageHeader />
  <PageActions />
  <ArticleBody />
  <PaginationLinks />
</main>
```

Content width should stay readable. Do not stretch prose across the full screen.

Recommended max width:

- docs article: `720px–800px`
- component index: `840px–960px`
- landing page: `960px–1120px`

### 4.5 Right table of contents

The right rail should be used for long documentation pages.

Use it for:

- component detail pages
- foundation pages
- guidelines pages
- migration pages

Hide it for:

- simple landing pages
- mobile pages
- very short articles

Suggested Tailwind:

```tsx
<aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto py-10 xl:block">
  <p className="mb-3 text-xs font-medium text-gray-500">On this page</p>
  <nav className="space-y-2 text-sm text-gray-500">
    ...
  </nav>
</aside>
```

---

## 5. Typography direction

### 5.1 Font personality

Use a clean Korean/Latin-friendly sans-serif. The SEED docs themselves emphasize practical documentation rather than expressive display typography.

Recommended fonts:

- Korean-first: `Pretendard`, `Noto Sans KR`, `system-ui`
- Product docs: `Inter`, `Pretendard`, `system-ui`
- Code: `ui-monospace`, `SFMono-Regular`, `Menlo`, `monospace`

Suggested CSS:

```css
:root {
  font-family: Pretendard, Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

code, pre, kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
```

### 5.2 Type scale

Documentation pages should use a compact but readable scale.

Recommended hierarchy:

```txt
Page title:       36–44px / 1.15 / 700
Section h2:       24–28px / 1.25 / 650
Subsection h3:    18–20px / 1.35 / 650
Body:             15–16px / 1.7 / 400
Small text:       13–14px / 1.5 / 400–500
Sidebar text:     13–14px / 1.4 / 400–500
Code:             13px / 1.6
Caption:          12–13px / 1.4
```

### 5.3 Writing tone

Use direct, instructional writing.

Good:

- “Use this pattern when...”
- “Avoid this when...”
- “This component is used for...”
- “The title is required; description is optional.”

Avoid:

- vague marketing copy
- overly emotional statements
- long metaphorical introductions
- “beautiful, stunning, magical” style language

---

## 6. Color direction

### 6.1 Base palette

Use a neutral documentation palette.

```txt
Background:       #FFFFFF
Subtle surface:   #F8F9FA / #F9FAFB
Elevated surface: #FFFFFF
Border:           #E5E7EB / #E6E8EB
Text strong:      #111827 / #171717
Text default:     #374151 / #3F3F46
Text muted:       #6B7280 / #71717A
Text faint:       #9CA3AF / #A1A1AA
Code bg:          #F6F8FA / #F7F7F8
Accent:           restrained brand orange or neutral black
```

### 6.2 Accent color usage

Use accent color sparingly.

Good uses:

- active nav indicator
- selected tab
- primary CTA
- status badge
- focused input outline
- small icon highlight

Bad uses:

- large orange backgrounds everywhere
- gradient hero sections
- heavy brand-colored cards
- decorative blobs

---

## 7. Spacing and density

The site should feel compact, but not cramped. SEED’s spacing documentation emphasizes consistency, modularity, readability, and shared spacing scales.

Use a 4px-based spacing rhythm.

Recommended spacing tokens:

```txt
x0.5 = 2px
x1   = 4px
x1.5 = 6px
x2   = 8px
x2.5 = 10px
x3   = 12px
x4   = 16px
x5   = 20px
x6   = 24px
x8   = 32px
x10  = 40px
x12  = 48px
x16  = 64px
```

### Layout spacing

```txt
Top nav height:       56px
Page top padding:     40–56px
Section gap:          40–64px
Heading to body:      12–20px
Paragraph gap:        16px
Card padding:         16–24px
Sidebar group gap:    24–32px
Sidebar item gap:     4–6px
Table cell padding:   10–14px vertical / 12–16px horizontal
```

---

## 8. Radius, borders, and surfaces

Use subtle rounding. The design direction is practical and systematic, not overly soft.

Recommended radius:

```txt
Small control:  6px
Card:           10–12px
Pill / badge:   999px
Code block:     10–12px
Dialog/sheet:   16–24px depending on platform pattern
```

Recommended surface treatment:

- Cards: white background + 1px border
- Code blocks: light gray background + subtle border
- Tables: border-collapse or separated rows with light dividers
- Navigation active item: light gray fill, no heavy shadow
- Avoid deep shadows on docs pages

---

## 9. Component language

### 9.1 Buttons

Button hierarchy:

1. Primary: strong filled background, used sparingly
2. Secondary: border or subtle surface
3. Ghost: text/icon only for navigation and toolbar actions
4. Icon button: compact, accessible target size

Suggested style:

```tsx
<button className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900">
  Button
</button>
```

### 9.2 Search button

Search is an important global affordance.

```tsx
<button className="inline-flex h-9 min-w-[180px] items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:bg-gray-50">
  <span>Search</span>
  <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs">⌘ K</kbd>
</button>
```

### 9.3 Cards

Use cards to summarize documents or components, not as decorative blocks.

Card anatomy:

- title
- short description
- optional category badge
- optional platform status
- optional arrow icon

```tsx
<a className="group block rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h3 className="text-sm font-semibold text-gray-950">Action Button</h3>
      <p className="mt-1 text-sm leading-6 text-gray-600">명확한 액션을 쉽게 수행할 수 있도록 돕는 기본 인터랙션 컴포넌트입니다.</p>
    </div>
    <ArrowUpRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
  </div>
</a>
```

### 9.4 Badges

Use badges for platform support, status, category, or version.

Examples:

- `React Done`
- `iOS Done`
- `Android Done`
- `Foundation`
- `Deprecated`
- `Beta`

Badge style:

```tsx
<span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
  React Done
</span>
```

### 9.5 Tables

Use tables for tokens, API props, statuses, and migration references.

Style:

- small text
- clear header row
- dividers instead of heavy grid lines
- monospace for token names, prop names, and values

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
      <th className="py-2 pr-4">Name</th>
      <th className="py-2 pr-4">Value</th>
      <th className="py-2">Description</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    ...
  </tbody>
</table>
```

### 9.6 Code blocks

Use code blocks for implementation examples, install commands, token usage, and API snippets.

```tsx
<pre className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-[13px] leading-6 text-gray-800">
  <code>{code}</code>
</pre>
```

Add a small copy button only when useful. Do not overdecorate.

### 9.7 Callouts

Use callouts for warnings, tips, and platform notes.

```tsx
<div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
  <p className="font-medium text-gray-950">Figma tip</p>
  <p className="mt-1">Slot을 활용해 콘텐츠 영역을 표현할 수 있어요.</p>
</div>
```

---

## 10. Page type recipes

### 10.1 Documentation home / overview page

Use this for `/docs` or a design-system landing page.

Structure:

```txt
Top nav
Main shell
  Hero intro
    eyebrow: product/design language
    h1: concise statement
    paragraph: what the system is for
    primary/secondary actions
  Section: Getting started cards
  Section: Foundation cards
  Section: Components preview
  Section: Platform links
```

Tone:

- more welcoming than detail pages
- still restrained and documentation-oriented
- avoid large marketing art unless it directly explains the system

Layout:

- no mandatory right TOC
- content max width can be wider
- use card grid

### 10.2 Foundation page

Use this for color, typography, spacing, radius, motion, design tokens.

Structure:

```txt
Breadcrumb/category
Page title
One-sentence definition
Action links: LLMs.txt / Open in other tool
Intro paragraph
Purpose / Principles
Usage guidance
Examples or diagrams
Token table / reference table
Related pages
Right TOC
```

Required sections:

- What it is
- Why it matters
- Usage principles
- Tokens or examples
- Do / Don’t when applicable

### 10.3 Component index page

Use this for a component catalog page.

Structure:

```txt
Page title: Components
Intro: “Browse all components in the design system.”
Category groups:
  Buttons
  Controls
  Display
  Feedback
  Layout
  Navigation
Each category:
  title
  optional description
  responsive card grid
```

Card content:

- component name
- short functional description
- optional platform support badges

Recommended grid:

```tsx
<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
  ...cards
</div>
```

### 10.4 Component detail page

Use this for pages like Bottom Sheet, Button, Tabs, Field, Snackbar.

Structure:

```txt
Breadcrumb/category
Page title
Short definition
Quick links: LLMs.txt / Figma / React / iOS / Android
Platform support row
Section: Anatomy
Section: Properties
Section: Variants
Section: Guidelines
Section: Behavior
Section: Accessibility
Section: Examples
Section: Related components
Right TOC
```

For component anatomy, describe compositional parts:

```txt
Component = Container + Header + Content + Footer + Optional actions
```

For properties, use a consistent table:

```txt
Property | Description | Values | Default | Notes
```

### 10.5 Guidelines page

Use this for writing, voice and tone, inclusive design, international design, accessibility.

Structure:

```txt
Page title
Definition / purpose
Principles
Do / Don’t sections
Examples
Checklist
Related foundations/components
```

Visual approach:

- more text-heavy
- use callouts and comparison tables
- avoid excessive cards

### 10.6 Migration page

Use this for v2-to-v3 migration, package updates, API changes.

Structure:

```txt
Page title
Migration overview
Before you start checklist
Step-by-step guide
Breaking changes
Mapping table
Code examples
Validation checklist
```

Use strong information hierarchy and tables.

### 10.7 AI integration page

Use this for LLM, MCP, Figma MCP, agent instructions, prompt integration pages.

Structure:

```txt
Page title
What this integration does
Quick access links
Setup steps
Usage examples
Agent rules
Troubleshooting
Reference links
```

Tone:

- highly practical
- copy-paste friendly
- include command/code blocks

---

## 11. Navigation information architecture

Recommended site navigation:

```txt
Global nav
- Docs
- React
- Lynx
- AI Integration
- Breeze

Docs sidebar
- Overview
- Progress Board
- Foundation
  - Design Token
  - Design Token Reference
  - Color
  - Typography
  - Iconography
  - Elevation
  - Gradient
  - Inclusive Design
  - International Design
  - Logo
  - Motion
  - Radius
  - Spacing
  - State
  - Voice and Tone
  - Writing
- Components
  - Buttons
  - Controls
  - Display
  - Feedback
  - Layout
  - Navigation
- Guidelines
- Migration
  - Deprecations
  - Migration Reference
- Resources
```

Component categories:

```txt
Buttons
- Action Button
- Contextual Floating Button
- Floating Action Button
- Reaction Button

Controls
- Checkbox
- Chip
- Field
- Input Button
- Radio
- Segmented Control
- Select Box
- Slider
- Switch
- Text Input & Textarea

Display
- Avatar
- Badge
- Content Placeholder
- Divider
- Identity Placeholder
- Image Frame
- Manner Temp & Manner Temp Badge
- Notification Badge
- Scroll Fog
- Tag Group

Feedback
- Callout
- Help Bubble
- Page Banner
- Progress Circle
- Result Section
- Skeleton
- Snackbar

Layout
- Alert Dialog
- Bottom Sheet
- List
- Menu Sheet

Navigation
- Bottom Navigation
- Tabs
- Top Navigation
```

---

## 12. Responsive behavior

### Desktop

- Use 3-column docs layout when content is long.
- Left sidebar and right TOC are visible.
- Top nav includes section links and search.

### Tablet

- Sidebar can remain visible if width allows.
- Right TOC can be hidden first.
- Main content width remains readable.

### Mobile

- Top nav remains sticky.
- Sidebar becomes drawer or collapsible menu.
- Right TOC is hidden or converted into an inline dropdown.
- Search becomes icon button or full-width command button below nav.
- Tables must scroll horizontally.
- Cards become single-column.

Suggested mobile rules:

```tsx
<aside className="hidden lg:block">...</aside>
<aside className="hidden xl:block">...</aside>
<main className="px-4 py-8 md:px-8">...</main>
```

---

## 13. Interaction and motion

Motion should be subtle and functional.

Use motion for:

- hover color transitions
- active nav change
- drawer open/close
- accordion expand/collapse
- command palette open/close
- copy button feedback

Avoid:

- scroll-jacking
- large page transitions
- parallax hero sections
- cursor-following effects
- continuous decorative animation

Recommended transition:

```css
transition-property: color, background-color, border-color, opacity, transform;
transition-duration: 150ms;
transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
```

Reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 14. Accessibility rules

- Every interactive element must have a visible focus state.
- Icon-only buttons need accessible labels.
- Sidebar active state must not rely on color alone.
- Code blocks should be keyboard-scrollable if horizontally overflowing.
- Tables should include semantic `thead`, `tbody`, `th`, and `td`.
- Mobile drawers should trap focus while open.
- Command palette should support keyboard navigation.
- Text contrast should remain readable on all surfaces.
- Touch targets should be at least 40px where possible.

---

## 15. Implementation guardrails for AI coding agents

When generating pages with this direction:

1. Do not create one giant file.
2. Keep files under 300 lines when possible.
3. Split layout, navigation, content data, and UI primitives.
4. Put sidebar data and component catalog data in separate files.
5. Use semantic HTML for article content.
6. Use design tokens or CSS variables instead of random values.
7. Avoid page-specific one-off styling unless required.
8. Prefer reusable components:
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
10. Do not copy SEED brand assets, logos, or proprietary visuals unless explicitly permitted.

---

## 16. Suggested project structure

```txt
src/
  app/
    App.tsx
    routes.tsx
  components/
    docs/
      DocsShell.tsx
      TopNav.tsx
      SidebarNav.tsx
      TableOfContents.tsx
      PageHeader.tsx
      PaginationLinks.tsx
    ui/
      Badge.tsx
      Button.tsx
      Card.tsx
      Callout.tsx
      CodeBlock.tsx
      TokenTable.tsx
  data/
    nav.ts
    componentCatalog.ts
    foundations.ts
    toc.ts
  pages/
    DocsOverviewPage.tsx
    FoundationPage.tsx
    ComponentsIndexPage.tsx
    ComponentDetailPage.tsx
    GuidelinesPage.tsx
    MigrationPage.tsx
    AiIntegrationPage.tsx
  styles/
    tokens.css
    globals.css
```

---

## 17. Reusable agent prompt

Use the following prompt when asking an AI coding agent to build a page or page set in this direction.

```md
Build a documentation website UI inspired by the design direction of SEED Design docs.

This is not a pixel-perfect clone. Preserve the overall design language:
- clean white documentation shell
- sticky top navigation
- searchable docs structure
- left hierarchical sidebar
- focused main article content
- optional right-side table of contents
- compact typography
- subtle borders
- token-driven spacing
- reusable cards, badges, tables, callouts, and code blocks

Use React 18 + TypeScript + Vite + Tailwind CSS.
Use lucide-react for generic icons only.
Do not copy proprietary logos, brand assets, or protected visual illustrations.

Create reusable components:
- DocsShell
- TopNav
- SidebarNav
- TableOfContents
- PageHeader
- DocCard
- StatusBadge
- CodeBlock
- TokenTable
- Callout

Support these page types:
1. Docs overview page
2. Foundation page
3. Component index page
4. Component detail page
5. Guidelines page
6. Migration page
7. AI integration page

Design rules:
- Background: white
- Text: neutral black/gray hierarchy
- Border: subtle gray 1px
- Accent: sparse, used only for active states and primary actions
- Cards: white surface, light border, small radius
- Code blocks: light gray surface, monospace text
- Tables: compact, readable, divider-based
- Sidebar: grouped hierarchy with active state
- Right TOC: visible only on large screens
- Mobile: sidebar becomes drawer, cards become single column, tables scroll horizontally

Implementation rules:
- Keep components small and reusable.
- Keep files under 300 lines where possible.
- Separate navigation data and component catalog data from UI components.
- Use semantic HTML for documentation content.
- Add accessible focus states and aria labels for icon buttons.
- Respect prefers-reduced-motion.

Generate the requested page(s) using this design direction.
```

---

## 18. Page-specific mini prompts

### Docs overview page

```md
Create a docs overview page using the SEED-inspired documentation direction.
Include a concise intro, quick-start cards, foundation cards, component category preview, and platform links.
Do not use a right-side TOC on this page.
```

### Foundation page

```md
Create a foundation documentation page using the SEED-inspired documentation direction.
Include breadcrumb, page title, short definition, purpose section, usage principles, examples, token table, related links, and right-side TOC.
```

### Component index page

```md
Create a component catalog page using the SEED-inspired documentation direction.
Group components into Buttons, Controls, Display, Feedback, Layout, and Navigation.
Use compact cards with title, description, and optional platform support badges.
```

### Component detail page

```md
Create a component detail documentation page using the SEED-inspired documentation direction.
Include breadcrumb, title, one-sentence component definition, platform support row, Anatomy, Properties, Variants, Guidelines, Accessibility, Examples, and Related components.
Use a right-side TOC.
```

### Migration page

```md
Create a migration guide page using the SEED-inspired documentation direction.
Include migration overview, before-you-start checklist, step-by-step sections, breaking changes, mapping table, code examples, and validation checklist.
```

### AI integration page

```md
Create an AI integration guide page using the SEED-inspired documentation direction.
Include overview, quick access links, setup steps, usage examples, agent rules, troubleshooting, and references.
Make the page copy-paste friendly with code blocks and callouts.
```

---

## 19. Quality checklist

Before finalizing any generated page, verify:

- [ ] Does it feel like documentation, not a marketing landing page?
- [ ] Is the top navigation present and restrained?
- [ ] Is the sidebar hierarchy clear?
- [ ] Is the main content width readable?
- [ ] Are headings, paragraphs, tables, and cards visually consistent?
- [ ] Are borders subtle and surfaces minimal?
- [ ] Are cards functional rather than decorative?
- [ ] Is the right TOC used only when useful?
- [ ] Does mobile behavior avoid horizontal layout breakage?
- [ ] Are code blocks and tables readable?
- [ ] Are active, hover, and focus states defined?
- [ ] Are brand assets avoided unless permission is explicit?
- [ ] Can the same components support multiple page types?

---

## 20. Final interpretation

The key to this design direction is not any single page. It is the combination of:

1. documentation shell
2. hierarchical navigation
3. compact reading experience
4. token/component language
5. platform-aware status and references
6. restrained visual styling
7. reusable page recipes

Use this guide to generate a family of pages that share the same design DNA rather than copying one exact screen.

