# 02. Layout System

## Default Shell

Use a documentation shell as the default app shape.

```tsx
<DocsShell>
  <TopNav />
  <SidebarNav />
  <MainContent />
  <TableOfContents />
</DocsShell>
```

## Desktop Grid

Recommended structure:

```css
.docs-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 760px) 220px;
  column-gap: 40px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
}
```

Principles:

- sidebar = navigation memory
- center = focused reading
- right rail = local orientation

## Top Navigation

Use a sticky top nav with:

- brand/title
- primary documentation sections
- search affordance or command hint when useful
- minimal controls
- bottom border

Avoid making the top nav visually louder than the content.

## Left Sidebar

The sidebar is a hierarchy, not decoration.

Use grouped sections:

- Overview
- Foundation
- Components
- Guidelines
- Release
- Resources

Active state should be visible but quiet.

## Main Content

Main content should behave like a readable technical article.

Recommended max widths:

- article/reference page: 720-800px
- index/catalog page: 840-960px
- overview page: 960-1120px

Do not stretch prose across the full screen.

## Right TOC

Use the right rail only for long content pages.

Good for:

- foundation pages
- component detail pages
- guidelines pages
- migration/release pages

Hide for:

- short overview pages
- mobile
- simple index pages
