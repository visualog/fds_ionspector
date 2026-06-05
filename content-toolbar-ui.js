(function initContentToolbarUI(globalScope) {
  function createContentToolbarUI({ documentRef = globalScope.document } = {}) {
    function getToolbarButtonTooltip(button) {
      if (!button) return '';
      return button.dataset.tooltip || button.getAttribute('title') || '';
    }

    function setRootVisibility(visible, root = documentRef?.getElementById?.('fds-root')) {
      if (!root) return;
      root.dataset.visible = visible ? 'true' : 'false';
      root.style.display = visible ? 'block' : 'none';
      documentRef?.body?.classList?.toggle?.('fds-hide-all', !visible);
    }

    function isInspectorUIShellComplete(root = documentRef?.getElementById?.('fds-root')) {
      return Boolean(root)
        && Boolean(root.querySelector('#fds-issue-pin-layer'))
        && Boolean(root.querySelector('#fds-toolbar'))
        && Boolean(root.querySelector('#fds-summary-panel'))
        && Boolean(root.querySelector('#fds-inspector-card'));
    }

    function resetToolbarFloatingPosition(toolbar = documentRef?.getElementById?.('fds-toolbar')) {
      if (!toolbar) return;
      toolbar.style.left = '';
      toolbar.style.top = '';
      toolbar.style.bottom = '';
      toolbar.style.transform = '';
    }

    function resetSummaryPanelFloatingPosition(panel = documentRef?.getElementById?.('fds-summary-panel')) {
      if (!panel) return;
      panel.style.left = '';
      panel.style.top = '';
      panel.style.bottom = '';
      panel.style.right = '';
    }

    function applyToolbarSyncState({
      root,
      toolbar,
      model,
      isCollapsed,
      isScanning,
      scanStatusText = '',
      applyToolbarSpecVariables,
    }) {
      if (!root || !toolbar || !model) return;

      root.dataset.toolbarMode = model.mode;
      root.dataset.toolbarCollapsed = isCollapsed ? 'true' : 'false';
      root.dataset.scanState = isScanning ? 'scanning' : 'idle';
      toolbar.dataset.variant = model.mode;
      toolbar.dataset.collapsed = isCollapsed ? 'true' : 'false';
      toolbar.dataset.scanState = isScanning ? 'scanning' : 'idle';
      toolbar.dataset.scanStatus = scanStatusText;
      applyToolbarSpecVariables?.(root);
      toolbar.style.setProperty('--fds-toolbar-width', `${model.width}px`);
      toolbar.style.setProperty('--fds-toolbar-status-width', model.statusWidth ? `${model.statusWidth}px` : 'auto');
    }

    return {
      getToolbarButtonTooltip,
      setRootVisibility,
      isInspectorUIShellComplete,
      resetToolbarFloatingPosition,
      resetSummaryPanelFloatingPosition,
      applyToolbarSyncState,
    };
  }

  const api = { createContentToolbarUI };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentToolbarUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
