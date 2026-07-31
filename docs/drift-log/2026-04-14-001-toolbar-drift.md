# Drift Log 001 - Toolbar Fidelity Drift

Date: 2026-04-14
Area: FDS Inspector toolbar and bridge-adjacent rendering
Status: fixed

## Summary

이번 기록은 툴바 구현이 피그마 `pattern/toolbar` 기준과 어긋났던 실제 사례를 정리한 첫 drift log다.
아래 항목들은 대화 중 실제로 확인되었고, 이후 수정 대상으로 이어졌다.

| ID | Mismatch | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| D-001 | Toolbar padding reset | Root padding 8px on the toolbar container | Toolbar internal padding was overridden to 0 by the global reset | fixed |
| D-002 | Divider width inflation | Divider should not consume layout width beyond spacing | Divider used a 1px box and expanded the total toolbar width | fixed |
| D-003 | Extension icon rendering crash | Toolbar icons should render safely after extension reload | `chrome.runtime.getURL(...)` in a stale content script triggered `Extension context invalidated` | fixed |

## D-001 Toolbar Padding Reset

Observed mismatch:
- 툴바 루트에 넣어둔 내부 패딩이 실제 렌더에서는 0으로 보였다.
- DevTools 계산값 기준으로 toolbar container padding이 피그마의 `8px`가 아니라 reset에 의해 덮여 있었다.

Expected:
- `pattern/toolbar` root padding: `8px` on all sides.
- The toolbar should feel like a padded capsule, not a fixed-height bar.

Observed:
- Global reset `#fds-root * { padding: 0; }`가 toolbar padding을 덮었다.
- 결과적으로 padding이 화면에서 읽히지 않았고, 툴바가 피그마보다 더 꽉 찬 느낌으로 보였다.

Impact:
- 툴바의 첫/끝단 여백이 사라져 시각적 밀도가 달라졌다.
- padding이 hug 레이아웃의 핵심인데 그 효과가 무너졌다.

Bridge notes:
- Bridge metadata already confirmed the toolbar root should be `HORIZONTAL` with `padding 8` and `itemSpacing 16`.
- The mismatch was therefore not in the bridge read, but in the CSS reset and selector precedence.

Follow-up:
- Keep toolbar-specific styles out of global padding resets.
- Use the toolbar spec as the single source of truth for padding values.

## D-002 Divider Width Inflation

Observed mismatch:
- Divider was implemented as a `1px` box and the total toolbar width became larger than the Figma reference.
- The toolbar looked slightly wider than the reference even when all item spacing was correct.

Expected:
- Divider should visually separate groups without adding extra layout width beyond the intended spacing.
- Figma behavior should be treated as spacing plus a visual rule, not a visible 1px content box that changes overall measurement.

Observed:
- The divider consumed layout width.
- This pushed the right-side items and made the toolbar exceed the target width by a small but visible amount.

Impact:
- The toolbar did not match the Figma reference width precisely.
- Small width drift made the whole capsule feel “off” even when each individual control looked close.

Bridge notes:
- Bridge data for `pattern/toolbar` showed the container width and child positions clearly enough to catch this mismatch.
- The issue was a DOM/CSS implementation detail, not a bridge read issue.

Follow-up:
- Keep divider geometry zero-width and let margins or borders express the separator visually.
- Recheck total width against the toolbar spec after every layout change.

## D-003 Extension Context Invalidated

Observed mismatch:
- Toolbar icons rendered through `chrome.runtime.getURL(...)` from a stale content script after extension reload.
- This produced `Extension context invalidated` and broke the toolbar icon rendering path.

Expected:
- Toolbar icons should continue to render safely across extension reloads.
- A stale script should fail gracefully instead of crashing the visible UI.

Observed:
- The extension context was invalidated, then the old script still tried to resolve runtime URLs.
- That made the toolbar icon path fragile and caused visible icon breakage.

Impact:
- The first bridge-status icon and other toolbar icons could disappear or fail to render after reload.
- This interrupted the main inspector workflow and made the toolbar feel unstable.

Bridge notes:
- This was not a bridge-read problem.
- It was a renderer robustness problem that surfaced while working against the bridge-driven toolbar.

Follow-up:
- Prefer inline-safe icon rendering for critical toolbar chrome.
- Keep extension reload and stale-script safety in the interaction layer.

## Next Round Reference

For the next implementation pass, use these checkpoints first:

1. Compare toolbar container padding directly against `TOOLBAR_SPEC.geometry.padding`.
2. Verify divider geometry does not change total width.
3. Keep icon rendering independent from stale runtime URL lookups.
4. Revalidate with the bridge snapshot for `pattern/toolbar` before making another visual tweak.

## Notes

- This log intentionally records real mismatches, not a template.
- Keep future entries short, numeric where possible, and tied to a bridge snapshot or screenshot.
