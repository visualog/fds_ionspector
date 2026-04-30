(function initFDSDesignVariables(globalScope) {
  const color = {
    bgPrimary: '#0f131a',
    bgSecondary: '#10141b',
    surfaceRaised: 'rgba(18, 22, 30, 0.96)',
    surfaceMuted: 'rgba(255, 255, 255, 0.06)',
    textPrimary: 'rgba(255,255,255,0.96)',
    textSecondary: 'rgba(255,255,255,0.58)',
    textMain: '#ffffff',
    brand: '#2f6ff3',
    brandHover: '#3d7cff',
    toolbarBg: '#080a0e',
    toolbarBorder: 'rgba(255,255,255,0.08)',
    toolbarDivider: 'rgba(255,255,255,0.16)',
    toolbarIconMuted: 'rgba(255,255,255,0.75)',
    toolbarIconStrong: 'rgba(255,255,255,0.95)',
    plugConnected: '#19d3aa',
    plugDisconnected: '#ff5e5e',
    badge: '#f35b4f',
    warning: '#ffbb3d',
    success: '#43c971',
    error: '#ff5b5b',
  };

  const radius = {
    radius4: '4px',
    radius6: '6px',
    radius8: '8px',
    radius10: '10px',
    radius12: '12px',
    radius16: '16px',
    radiusCard: '12px',
    radiusFull: '9999px',
  };

  const spacing = {
    spacing0: 0,
    spacing2: 2,
    spacing4: 4,
    spacing6: 6,
    spacing8: 8,
    spacing10: 10,
    spacing12: 12,
    spacing16: 16,
    spacing20: 20,
    spacing24: 24,
    spacing28: 28,
    spacing32: 32,
    spacing36: 36,
    spacing40: 40,
    spacing48: 48,
    spacing64: 64,
    spacing80: 80,
    spacing144: 144,
  };

  const typography = {
    fontFamilyBase: 'Pretendard, "Noto Sans KR", "Noto Sans", sans-serif',
    fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize10: '10px',
    fontSize11: '11px',
    fontSize12: '12px',
    fontSize13: '13px',
    fontSize14: '14px',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    fontWeightHeavy: 800,
    lineHeightTight: 1,
    lineHeightCompact: 1.2,
    lineHeightDefault: 1.4,
  };

  const motion = {
    durationFast: '160ms',
    durationNormal: '180ms',
    durationSlow: '220ms',
    easingStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const toolbar = {
    padding: '8px',
    gap: '16px',
    buttonSize: '32px',
    iconSize: '24px',
    dividerHeight: '19px',
    statusWidth: '257px',
  };

  const cssVariables = {
    '--fds-bg-primary': color.bgPrimary,
    '--fds-bg-secondary': color.bgSecondary,
    '--fds-surface-raised': color.surfaceRaised,
    '--fds-surface-muted': color.surfaceMuted,
    '--fds-text-primary': color.textPrimary,
    '--fds-text-secondary': color.textSecondary,
    '--fds-text-main': color.textMain,
    '--fds-brand': color.brand,
    '--fds-brand-hover': color.brandHover,
    '--fds-toolbar-bg': color.toolbarBg,
    '--fds-toolbar-border': color.toolbarBorder,
    '--fds-toolbar-divider': color.toolbarDivider,
    '--fds-toolbar-icon-muted': color.toolbarIconMuted,
    '--fds-toolbar-icon-strong': color.toolbarIconStrong,
    '--fds-plug-connected': color.plugConnected,
    '--fds-plug-disconnected': color.plugDisconnected,
    '--fds-badge': color.badge,
    '--fds-warning': color.warning,
    '--fds-success': color.success,
    '--fds-error': color.error,
    '--fds-radius-4': radius.radius4,
    '--fds-radius-6': radius.radius6,
    '--fds-radius-8': radius.radius8,
    '--fds-radius-10': radius.radius10,
    '--fds-radius-12': radius.radius12,
    '--fds-radius-16': radius.radius16,
    '--fds-radius-card': radius.radiusCard,
    '--fds-radius-full': radius.radiusFull,
    '--fds-font-family-base': typography.fontFamilyBase,
    '--fds-font-family-mono': typography.fontFamilyMono,
    '--fds-font-size-10': typography.fontSize10,
    '--fds-font-size-11': typography.fontSize11,
    '--fds-font-size-12': typography.fontSize12,
    '--fds-font-size-13': typography.fontSize13,
    '--fds-font-size-14': typography.fontSize14,
    '--fds-motion-fast': motion.durationFast,
    '--fds-motion-normal': motion.durationNormal,
    '--fds-motion-slow': motion.durationSlow,
    '--fds-motion-easing': motion.easingStandard,
    '--fds-toolbar-padding': toolbar.padding,
    '--fds-toolbar-gap': toolbar.gap,
    '--fds-toolbar-button-size': toolbar.buttonSize,
    '--fds-toolbar-icon-size': toolbar.iconSize,
    '--fds-toolbar-divider-height': toolbar.dividerHeight,
    '--fds-toolbar-status-width': toolbar.statusWidth,
  };

  const inspectorSpecs = {
    colors: {
      '#ffffff': 'White',
      '#000000': 'Black',
      [color.brand]: 'Brand/Blue',
      [color.badge]: 'Feedback/Error',
      [color.plugConnected]: 'Feedback/Connected',
      [color.error]: 'Feedback/Error',
      [color.warning]: 'Feedback/Warning',
      [color.success]: 'Feedback/Success',
    },
    fonts: ['Pretendard', 'Noto Sans KR', 'Noto Sans'],
    spacing: [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 80, 144],
    radius: ['4px', '6px', '8px', '10px', '12px', '16px', '9999px'],
  };

  function applyCSSVariables(target, variables = cssVariables) {
    if (!target?.style) return;
    Object.entries(variables).forEach(([name, value]) => {
      target.style.setProperty(name, String(value));
    });
  }

  const api = {
    color,
    cssVariables,
    inspectorSpecs,
    motion,
    radius,
    spacing,
    toolbar,
    typography,
    applyCSSVariables,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSDesignVariables = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
