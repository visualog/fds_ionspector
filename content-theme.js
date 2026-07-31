(function initContentTheme(globalScope) {
  function createContentTheme({
    designVariables,
    cssVariables = {},
    toolbarSpec,
    toolbarModes,
  }) {
    function applyThemeVariables(target = globalScope.document?.documentElement) {
      if (!target) return;
      if (typeof designVariables?.applyCSSVariables === 'function') {
        designVariables.applyCSSVariables(target);
        return;
      }

      Object.entries(cssVariables).forEach(([name, value]) => {
        target.style.setProperty(name, String(value));
      });
    }

    function applyToolbarSpecVariables(target = globalScope.document?.documentElement) {
      if (!target || !toolbarSpec?.geometry || !toolbarSpec?.variants) return;

      const { geometry, variants } = toolbarSpec;
      const defaultVariant = variants[toolbarModes.DEFAULT] || {};
      const connectedMessageVariant = variants[toolbarModes.CONNECTED_MESSAGE] || {};
      const disconnectedMessageVariant = variants[toolbarModes.DISCONNECTED_MESSAGE] || {};

      target.style.setProperty('--fds-toolbar-padding', `${geometry.padding}px`);
      target.style.setProperty('--fds-toolbar-gap', `${geometry.itemSpacing}px`);
      target.style.setProperty('--fds-toolbar-item-spacing', `${geometry.itemSpacing}px`);
      target.style.setProperty('--fds-toolbar-button-size', `${geometry.buttonSize}px`);
      target.style.setProperty('--fds-toolbar-divider-height', `${geometry.dividerHeight}px`);
      target.style.setProperty('--fds-toolbar-collapsed-width', `${geometry.collapsedWidth}px`);
      target.style.setProperty('--fds-toolbar-default-width', `${defaultVariant.width ?? 384}px`);
      target.style.setProperty('--fds-toolbar-connected-message-width', `${connectedMessageVariant.width ?? 310}px`);
      target.style.setProperty('--fds-toolbar-disconnected-message-width', `${disconnectedMessageVariant.width ?? 401}px`);
      target.style.setProperty('--fds-toolbar-disconnected-status-width', `${disconnectedMessageVariant.statusWidth ?? 257}px`);
    }

    return {
      applyThemeVariables,
      applyToolbarSpecVariables,
    };
  }

  const api = { createContentTheme };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentTheme = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
