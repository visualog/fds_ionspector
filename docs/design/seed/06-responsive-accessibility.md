# 06. Responsive, Motion, Accessibility

## Desktop

- Use docs shell with sidebar, main content, and optional TOC.
- Keep the main content readable.
- Use top nav with restrained controls.

## Tablet

- Hide the right TOC first.
- Keep sidebar only when width allows.
- Avoid squeezing article text.

## Mobile

- Top nav remains sticky.
- Sidebar becomes horizontal nav, drawer, or collapsible menu.
- Right TOC is hidden or inline.
- Tables scroll horizontally.
- Cards and rows become single-column.

## Motion

Use motion only for:

- hover color transitions
- active nav changes
- drawer open/close
- accordion expand/collapse
- copy feedback

Avoid:

- scroll-jacking
- parallax
- cursor-following effects
- large page transitions
- continuous decorative animation

Recommended transition:

```css
transition-property: color, background-color, border-color, opacity, transform;
transition-duration: 150ms;
transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
```

## Accessibility

- Every interactive element has a visible focus state.
- Icon-only buttons need accessible labels.
- Active state does not rely on color alone.
- Code blocks and tables are keyboard-scrollable when needed.
- Tables use semantic `thead`, `tbody`, `th`, and `td`.
- Mobile drawers trap focus if used.
- Text contrast remains readable on all surfaces.
- Touch targets should be at least 40px where possible.
