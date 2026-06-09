(function initContentToolbarUI(globalScope) {
  function createContentToolbarUI({
    documentRef = globalScope.document,
    computeToolbarDragPosition = globalScope.FDSToolbarDrag?.computeToolbarDragPosition,
  } = {}) {
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
        && Boolean(root.querySelector('#fds-page-interaction-shield'))
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

    function replaceToolbarMarkupIfChanged({
      toolbar,
      markup = '',
      onBeforeReplace,
      onAfterReplace,
    } = {}) {
      if (!toolbar) return false;

      const nextMarkup = String(markup || '').trim();
      if (String(toolbar.innerHTML || '').trim() === nextMarkup) return false;

      onBeforeReplace?.();
      toolbar.innerHTML = nextMarkup;
      onAfterReplace?.(toolbar);
      return true;
    }

    function getToolbarCollapsedState({
      nextCollapsed,
      activeFilter,
    } = {}) {
      return Boolean(nextCollapsed) && Boolean(activeFilter);
    }

    function getToolbarModelVisibilityState({
      mode,
      defaultMode,
      isCollapsed,
      activeFilter,
    } = {}) {
      const shouldCollapseToolbar = mode === defaultMode && Boolean(isCollapsed) && Boolean(activeFilter);

      return {
        shouldCollapseToolbar,
        nextIsCollapsed: shouldCollapseToolbar ? Boolean(isCollapsed) : false,
      };
    }

    function createCollapsedToolbarModel({
      baseModel,
      collapsedWidth,
      activeFilter,
    } = {}) {
      if (!baseModel || !activeFilter) return baseModel;

      return {
        ...baseModel,
        width: collapsedWidth,
        items: [{ type: 'button', ref: activeFilter }],
      };
    }

    function bindToolbarPointerEvents({
      toolbar = documentRef?.getElementById?.('fds-toolbar'),
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onMouseLeave,
    } = {}) {
      if (!toolbar) return;

      toolbar.onpointerdown = onPointerDown;
      toolbar.onpointermove = onPointerMove;
      toolbar.onpointerup = onPointerUp;
      toolbar.onpointercancel = onPointerCancel;
      toolbar.onmouseleave = onMouseLeave;
    }

    function bindToolbarButtonHoverEvents({
      buttons = documentRef?.querySelectorAll?.('#fds-toolbar button') || [],
      onShowTooltip,
      onHideTooltip,
    } = {}) {
      buttons.forEach((button) => {
        button.onmouseenter = () => {
          onShowTooltip?.(button);
        };

        button.onmouseleave = () => {
          onHideTooltip?.();
        };

        button.onblur = () => {
          onHideTooltip?.();
        };

        button.onpointerdown = () => {
          onHideTooltip?.();
        };
      });
    }

    function clearToolbarMoveButtonClick(button = documentRef?.getElementById?.('fds-btn-move')) {
      if (!button) return;
      button.onclick = null;
    }

    function getToolbarFilterClickAction({
      now = Date.now(),
      suppressUntil = 0,
      nextFilter,
      activeFilter,
      isSummaryPanelVisible = false,
      isSummaryPanelDismissed = false,
    } = {}) {
      if (now < suppressUntil || !nextFilter) {
        return { type: 'ignored' };
      }

      if (activeFilter !== nextFilter) {
        return { type: 'activate-filter', filter: nextFilter };
      }

      if (!isSummaryPanelVisible || isSummaryPanelDismissed) {
        return { type: 'open-active-summary', filter: nextFilter };
      }

      return { type: 'toggle-active-filter', filter: nextFilter };
    }

    function bindToolbarFilterButtonEvents({
      buttons = documentRef?.querySelectorAll?.('#fds-root [data-filter]') || [],
      getAction,
      onAction,
      onHideTooltip,
    } = {}) {
      buttons.forEach((button) => {
        button.onclick = () => {
          onHideTooltip?.();
          const action = getAction?.(button) || { type: 'ignored' };
          if (action.type === 'ignored') return;
          onAction?.(action, button);
        };
      });
    }

    function bindToolbarCommandButtonEvents({
      refreshButton = documentRef?.getElementById?.('fds-btn-refresh'),
      closeButton = documentRef?.getElementById?.('fds-btn-close'),
      onRefresh,
      onClose,
      onHideTooltip,
    } = {}) {
      if (refreshButton) {
        refreshButton.onclick = () => {
          onHideTooltip?.();
          onRefresh?.();
        };
      }

      if (closeButton) {
        closeButton.onclick = () => {
          onHideTooltip?.();
          onClose?.();
        };
      }
    }

    function bindSummaryPanelCloseButton({
      button = documentRef?.querySelector?.('#fds-summary-panel .fds-panel-close'),
      onClose,
    } = {}) {
      if (!button) return;
      button.onclick = () => {
        onClose?.();
      };
    }

    function clearToolbarDragActiveState({
      toolbar = documentRef?.getElementById?.('fds-toolbar'),
      body = documentRef?.body,
    } = {}) {
      toolbar?.classList?.remove?.('is-dragging');
      body?.classList?.remove?.('fds-toolbar-dragging');
    }

    function applyToolbarDragActiveState({
      toolbar = documentRef?.getElementById?.('fds-toolbar'),
      body = documentRef?.body,
      rect,
      pointerId,
    } = {}) {
      if (!toolbar || !rect) return;

      toolbar.style.left = `${rect.left}px`;
      toolbar.style.top = `${rect.top}px`;
      toolbar.style.bottom = 'auto';
      toolbar.style.transform = 'none';
      toolbar.classList.add('is-dragging');
      body?.classList?.add?.('fds-toolbar-dragging');

      if (typeof toolbar.setPointerCapture === 'function') {
        try {
          toolbar.setPointerCapture(pointerId);
        } catch {}
      }
    }

    function getToolbarDragMovement({
      startPointer,
      currentPointer,
      threshold = 3,
    } = {}) {
      const deltaX = Math.abs((currentPointer?.x || 0) - (startPointer?.x || 0));
      const deltaY = Math.abs((currentPointer?.y || 0) - (startPointer?.y || 0));

      return {
        deltaX,
        deltaY,
        movedEnough: deltaX > threshold || deltaY > threshold,
      };
    }

    function getToolbarDragNextPosition({
      dragState,
      currentPointer,
      viewport,
      margin = 12,
    } = {}) {
      if (!dragState || typeof computeToolbarDragPosition !== 'function') return null;

      return computeToolbarDragPosition({
        startPointer: dragState.startPointer,
        currentPointer,
        startRect: dragState.startRect,
        viewport,
        margin,
      });
    }

    function applyToolbarDragPosition(toolbar, position) {
      if (!toolbar || !position) return;
      toolbar.style.left = `${position.left}px`;
      toolbar.style.top = `${position.top}px`;
    }

    return {
      getToolbarButtonTooltip,
      setRootVisibility,
      isInspectorUIShellComplete,
      resetToolbarFloatingPosition,
      resetSummaryPanelFloatingPosition,
      applyToolbarSyncState,
      replaceToolbarMarkupIfChanged,
      getToolbarCollapsedState,
      getToolbarModelVisibilityState,
      createCollapsedToolbarModel,
      bindToolbarPointerEvents,
      bindToolbarButtonHoverEvents,
      clearToolbarMoveButtonClick,
      getToolbarFilterClickAction,
      bindToolbarFilterButtonEvents,
      bindToolbarCommandButtonEvents,
      bindSummaryPanelCloseButton,
      clearToolbarDragActiveState,
      applyToolbarDragActiveState,
      getToolbarDragMovement,
      getToolbarDragNextPosition,
      applyToolbarDragPosition,
    };
  }

  const api = { createContentToolbarUI };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentToolbarUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
