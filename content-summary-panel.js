(function initContentSummaryPanel(globalScope) {
  function createContentSummaryPanel({
    documentRef = globalScope.document,
    getComputedStyleRef = globalScope.getComputedStyle,
  } = {}) {
    function getSummaryPanel(panel = documentRef?.getElementById?.('fds-summary-panel')) {
      return panel || null;
    }

    function setSummaryPanelVisible(panel = getSummaryPanel()) {
      if (!panel) return false;
      panel.style.display = 'block';
      panel.style.visibility = 'visible';
      return true;
    }

    function hideSummaryPanelElement(panel = getSummaryPanel()) {
      if (!panel) return false;
      panel.style.display = 'none';
      return true;
    }

    function isSummaryPanelElementVisible(panel = getSummaryPanel()) {
      return panel?.style.display === 'block';
    }

    function clearSummaryPanelDragActiveState({
      panel = getSummaryPanel(),
      body = documentRef?.body,
    } = {}) {
      panel?.classList?.remove?.('is-dragging');
      body?.classList?.remove?.('fds-panel-dragging');
    }

    function applySummaryPanelDragActiveState({
      panel = getSummaryPanel(),
      body = documentRef?.body,
      rect,
      pointerId,
    } = {}) {
      if (!panel || !rect) return false;

      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      panel.style.bottom = 'auto';
      panel.classList.add('is-dragging');
      body?.classList?.add?.('fds-panel-dragging');

      if (typeof panel.setPointerCapture === 'function') {
        try {
          panel.setPointerCapture(pointerId);
        } catch {}
      }

      return true;
    }

    function applySummaryPanelPosition(panel = getSummaryPanel(), position) {
      if (!panel || !position) return false;
      panel.style.left = `${position.left}px`;
      panel.style.top = `${position.top}px`;
      return true;
    }

    function applyCustomSummaryPanelPosition({
      panel = getSummaryPanel(),
      position,
    } = {}) {
      if (!panel || !position) return false;
      panel.style.left = `${position.left}px`;
      panel.style.top = `${position.top}px`;
      panel.style.bottom = 'auto';
      panel.style.right = '';
      return true;
    }

    function measureNaturalSummaryPanelHeight(panel) {
      if (!panel) return 0;
      return Math.ceil(
        panel.scrollHeight
        || panel.getBoundingClientRect?.().height
        || panel.offsetHeight
        || 0
      );
    }

    function toPixelNumber(value, fallback = 0) {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getRenderedHeight(element) {
      if (!element) return 0;
      return Math.ceil(
        element.getBoundingClientRect?.().height
        || element.offsetHeight
        || element.scrollHeight
        || 0
      );
    }

    function measureSummaryPanelTargetHeight(panel, { listHeight = 0 } = {}) {
      if (!panel) return 0;
      const style = getComputedStyleRef?.(panel);
      const paddingTop = toPixelNumber(style?.paddingTop, 16);
      const paddingBottom = toPixelNumber(style?.paddingBottom, 16);
      const head = panel.querySelector?.('.fds-panel-head');
      const section = panel.querySelector?.('.fds-summary-section');
      const sectionStyle = section ? getComputedStyleRef?.(section) : null;
      const sectionMarginTop = toPixelNumber(sectionStyle?.marginTop, 16);
      const sectionGap = toPixelNumber(sectionStyle?.rowGap || sectionStyle?.gap, 8);
      const sectionChildren = Array.from(section?.children || []);
      const sectionHeight = sectionChildren.reduce((sum, child, index) => {
        const childHeight = child.classList?.contains('fds-summary-list')
          ? listHeight
          : getRenderedHeight(child);
        return sum + childHeight + (index > 0 ? sectionGap : 0);
      }, 0);

      return Math.ceil(
        paddingTop
        + getRenderedHeight(head)
        + sectionMarginTop
        + sectionHeight
        + paddingBottom
      );
    }

    return {
      getSummaryPanel,
      setSummaryPanelVisible,
      hideSummaryPanelElement,
      isSummaryPanelElementVisible,
      clearSummaryPanelDragActiveState,
      applySummaryPanelDragActiveState,
      applySummaryPanelPosition,
      applyCustomSummaryPanelPosition,
      measureNaturalSummaryPanelHeight,
      measureSummaryPanelTargetHeight,
    };
  }

  globalScope.FDSContentSummaryPanel = {
    createContentSummaryPanel,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = globalScope.FDSContentSummaryPanel;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
