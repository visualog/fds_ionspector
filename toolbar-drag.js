(function initToolbarDrag(globalScope) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function computeToolbarDragPosition({
    startPointer,
    currentPointer,
    startRect,
    viewport,
    margin = 12,
  }) {
    const deltaX = currentPointer.x - startPointer.x;
    const deltaY = currentPointer.y - startPointer.y;
    const nextLeft = startRect.left + deltaX;
    const nextTop = startRect.top + deltaY;
    const maxLeft = viewport.width - startRect.width - margin;
    const maxTop = viewport.height - startRect.height - margin;

    return {
      left: clamp(nextLeft, margin, Math.max(margin, maxLeft)),
      top: clamp(nextTop, margin, Math.max(margin, maxTop)),
    };
  }

  function shouldStartToolbarDrag({
    isCollapsed = false,
    isMoveHandleTarget = false,
    isInsideToolbar = false,
  } = {}) {
    if (!isInsideToolbar) return false;
    if (isMoveHandleTarget) return true;
    return Boolean(isCollapsed);
  }

  function computeElementScrollTarget({
    rect,
    scroll = { x: 0, y: 0 },
    viewport,
  }) {
    const targetLeft = scroll.x + rect.left + rect.width / 2 - viewport.width / 2;
    const targetTop = scroll.y + rect.top + rect.height / 2 - viewport.height / 2;

    return {
      left: Math.max(0, Math.round(targetLeft)),
      top: Math.max(0, Math.round(targetTop)),
    };
  }

  const api = { computeElementScrollTarget, computeToolbarDragPosition, shouldStartToolbarDrag };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSToolbarDrag = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
