(() => {
  const EXPECTED_WIDTHS = {
    'connected-default': 384,
    'connected-message': 310,
    'disconnected-message': 401,
    'disconnected-compact': 96,
    'collapsed': 48,
  };

  const expected = {
    padding: 8,
    gap: 16,
    buttonSize: 32,
    dividerHeight: 19,
  };

  const toPx = (value) => {
    if (!value) return NaN;
    const n = Number.parseFloat(String(value));
    return Number.isFinite(n) ? n : NaN;
  };

  const eq = (a, b, tolerance = 0.5) => Number.isFinite(a) && Math.abs(a - b) <= tolerance;

  const root = document.getElementById('fds-toolbar');
  if (!root) {
    console.error('[toolbar-check] #fds-toolbar was not found.');
    return null;
  }

  const rootStyle = getComputedStyle(root);
  const firstButton = root.querySelector('.fds-btn, .fds-btn-static');
  const firstSlot = root.querySelector('.fds-icon-slot');
  const firstBadge = root.querySelector('.fds-btn[data-badge]:not([data-badge=""])');
  const firstDot = root.querySelector('.fds-btn.has-dot');
  const divider = root.querySelector('.fds-divider');
  const rootState = root.closest('#fds-root');
  const toolbarMode =
    rootState?.dataset?.toolbarMode ||
    root.dataset?.variant ||
    'connected-default';
  const collapsed =
    root.dataset?.collapsed === 'true' ||
    rootState?.dataset?.toolbarCollapsed === 'true';
  const visibleButtonCount = root.querySelectorAll('.fds-btn, .fds-btn-static').length;
  const mode = collapsed ? 'collapsed' : toolbarMode;

  const observed = {
    mode,
    collapsed,
    toolbarMode,
    visibleButtonCount,
    width: toPx(rootStyle.width),
    paddingTop: toPx(rootStyle.paddingTop),
    paddingRight: toPx(rootStyle.paddingRight),
    paddingBottom: toPx(rootStyle.paddingBottom),
    paddingLeft: toPx(rootStyle.paddingLeft),
    gap: toPx(rootStyle.gap || rootStyle.columnGap),
    buttonWidth: firstButton ? toPx(getComputedStyle(firstButton).width) : NaN,
    buttonHeight: firstButton ? toPx(getComputedStyle(firstButton).height) : NaN,
    iconSlotWidth: firstSlot ? toPx(getComputedStyle(firstSlot).width) : NaN,
    iconSlotHeight: firstSlot ? toPx(getComputedStyle(firstSlot).height) : NaN,
    dividerHeight: divider ? toPx(getComputedStyle(divider).height) : NaN,
    badgeWidth: firstBadge ? toPx(getComputedStyle(firstBadge, '::after').width) : NaN,
    badgeHeight: firstBadge ? toPx(getComputedStyle(firstBadge, '::after').height) : NaN,
    dotWidth: firstDot ? toPx(getComputedStyle(firstDot, '::before').width) : NaN,
    dotHeight: firstDot ? toPx(getComputedStyle(firstDot, '::before').height) : NaN,
  };

  const expectedWidth = EXPECTED_WIDTHS[mode];
  const report = [
    {
      check: 'padding-top',
      expected: expected.padding,
      observed: observed.paddingTop,
      pass: eq(observed.paddingTop, expected.padding),
    },
    {
      check: 'padding-right',
      expected: expected.padding,
      observed: observed.paddingRight,
      pass: eq(observed.paddingRight, expected.padding),
    },
    {
      check: 'padding-bottom',
      expected: expected.padding,
      observed: observed.paddingBottom,
      pass: eq(observed.paddingBottom, expected.padding),
    },
    {
      check: 'padding-left',
      expected: expected.padding,
      observed: observed.paddingLeft,
      pass: eq(observed.paddingLeft, expected.padding),
    },
    {
      check: 'gap',
      expected: expected.gap,
      observed: observed.gap,
      pass: eq(observed.gap, expected.gap),
    },
    {
      check: 'button width',
      expected: expected.buttonSize,
      observed: observed.buttonWidth,
      pass: eq(observed.buttonWidth, expected.buttonSize),
    },
    {
      check: 'button height',
      expected: expected.buttonSize,
      observed: observed.buttonHeight,
      pass: eq(observed.buttonHeight, expected.buttonSize),
    },
    {
      check: 'icon slot width',
      expected: 24,
      observed: observed.iconSlotWidth,
      pass: eq(observed.iconSlotWidth, 24),
    },
    {
      check: 'icon slot height',
      expected: 24,
      observed: observed.iconSlotHeight,
      pass: eq(observed.iconSlotHeight, 24),
    },
    {
      check: 'divider height',
      expected: expected.dividerHeight,
      observed: observed.dividerHeight,
      pass: eq(observed.dividerHeight, expected.dividerHeight),
    },
    {
      check: 'badge width',
      expected: Number.isFinite(observed.badgeWidth) ? 24 : 'n/a',
      observed: observed.badgeWidth,
      pass: Number.isFinite(observed.badgeWidth) ? eq(observed.badgeWidth, 24) : true,
    },
    {
      check: 'badge height',
      expected: Number.isFinite(observed.badgeHeight) ? 20 : 'n/a',
      observed: observed.badgeHeight,
      pass: Number.isFinite(observed.badgeHeight) ? eq(observed.badgeHeight, 20) : true,
    },
    {
      check: 'dot width',
      expected: Number.isFinite(observed.dotWidth) ? 8 : 'n/a',
      observed: observed.dotWidth,
      pass: Number.isFinite(observed.dotWidth) ? eq(observed.dotWidth, 8) : true,
    },
    {
      check: 'dot height',
      expected: Number.isFinite(observed.dotHeight) ? 8 : 'n/a',
      observed: observed.dotHeight,
      pass: Number.isFinite(observed.dotHeight) ? eq(observed.dotHeight, 8) : true,
    },
    {
      check: 'variant width',
      expected: expectedWidth,
      observed: observed.width,
      pass: Number.isFinite(expectedWidth) ? eq(observed.width, expectedWidth, 1) : false,
    },
  ];

  console.group('[toolbar-check] computed style report');
  console.log('mode:', observed.mode);
  console.log('collapsed:', observed.collapsed);
  console.table(report);
  console.log('root computed style:', {
    width: rootStyle.width,
    padding: [rootStyle.paddingTop, rootStyle.paddingRight, rootStyle.paddingBottom, rootStyle.paddingLeft].join(' '),
    gap: rootStyle.gap || rootStyle.columnGap,
  });
  console.groupEnd();

  return {
    mode: observed.mode,
    collapsed: observed.collapsed,
    toolbarMode,
    visibleButtonCount,
    report,
    observed,
    expected,
    allPass: report.every((row) => row.pass),
  };
})();
