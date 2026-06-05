(function initContentFloatingInspector(globalScope) {
  function createContentFloatingInspector({
    clampPosition,
    getViewport = () => ({
      width: globalScope.innerWidth || 0,
      height: globalScope.innerHeight || 0,
    }),
  }) {
    function createInspectorCardHideTimer({
      hideDelayMs,
      onClear,
      setTimeoutFn = globalScope.setTimeout?.bind?.(globalScope),
      clearTimeoutFn = globalScope.clearTimeout?.bind?.(globalScope),
    }) {
      let timer = null;

      function clear() {
        if (!timer) return;
        clearTimeoutFn(timer);
        timer = null;
      }

      function schedule() {
        clear();
        timer = setTimeoutFn(() => {
          timer = null;
          onClear?.();
        }, hideDelayMs);
      }

      function isScheduled() {
        return Boolean(timer);
      }

      return {
        clear,
        schedule,
        isScheduled,
      };
    }

    function getViolationPinLabel(entry) {
      const element = entry?.element;
      const tagName = element?.tagName?.toLowerCase?.() || 'element';
      const idPart = element?.id ? `#${element.id}` : '';
      const classPart = typeof element?.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 1).join('.')}`
        : '';
      return `${tagName}${idPart}${classPart}`;
    }

    function isViolationPinTargetVisible(rect) {
      const viewport = getViewport();
      return Boolean(rect)
        && rect.width >= 1
        && rect.height >= 1
        && rect.bottom >= 0
        && rect.right >= 0
        && rect.top <= viewport.height
        && rect.left <= viewport.width;
    }

    function getRectOverlapArea(rectA, rectB) {
      if (!rectA || !rectB) return 0;
      const width = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
      const height = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));
      return width * height;
    }

    function getPinPositionCandidate(rect, pinWidth, pinHeight, pinPosition) {
      if (pinPosition === 'pin_LT') {
        return {
          position: pinPosition,
          left: rect.left - pinWidth + 2,
          top: rect.top - pinHeight + 2,
        };
      }
      if (pinPosition === 'pin_RT') {
        return {
          position: pinPosition,
          left: rect.right - 2,
          top: rect.top - pinHeight + 2,
        };
      }
      if (pinPosition === 'pin_LB') {
        return {
          position: pinPosition,
          left: rect.left - pinWidth + 2,
          top: rect.bottom - 2,
        };
      }
      return {
        position: 'pin_RB',
        left: rect.right - 2,
        top: rect.bottom - 2,
      };
    }

    function getClampedPinCandidate(candidate, pinWidth, pinHeight) {
      const viewport = getViewport();
      const left = clampPosition(candidate.left, 4, Math.max(4, viewport.width - pinWidth - 4));
      const top = clampPosition(candidate.top, 4, Math.max(4, viewport.height - pinHeight - 4));
      return {
        ...candidate,
        left,
        top,
        rect: {
          left,
          top,
          right: left + pinWidth,
          bottom: top + pinHeight,
        },
      };
    }

    function getBestPinPosition(rect, pinWidth, pinHeight, avoidRect = null) {
      const viewport = getViewport();
      const margin = 4;
      const hasTopSpace = rect.top >= pinHeight + margin;
      const hasBottomSpace = viewport.height - rect.bottom >= pinHeight + margin;
      const hasLeftSpace = rect.left >= pinWidth + margin;
      const hasRightSpace = viewport.width - rect.right >= pinWidth + margin;
      const vertical = hasTopSpace || !hasBottomSpace ? 'T' : 'B';
      const horizontal = hasLeftSpace || !hasRightSpace ? 'L' : 'R';
      const preferredPosition = `pin_${horizontal}${vertical}`;
      const candidates = ['pin_LT', 'pin_RT', 'pin_LB', 'pin_RB']
        .map((position) => getClampedPinCandidate(getPinPositionCandidate(rect, pinWidth, pinHeight, position), pinWidth, pinHeight))
        .map((candidate, index) => ({
          ...candidate,
          order: candidate.position === preferredPosition ? -1 : index,
          overlapArea: getRectOverlapArea(candidate.rect, avoidRect),
        }))
        .sort((a, b) => a.overlapArea - b.overlapArea || a.order - b.order);

      return candidates[0]?.position || preferredPosition;
    }

    return {
      createInspectorCardHideTimer,
      getViolationPinLabel,
      isViolationPinTargetVisible,
      getRectOverlapArea,
      getPinPositionCandidate,
      getClampedPinCandidate,
      getBestPinPosition,
    };
  }

  const api = { createContentFloatingInspector };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentFloatingInspector = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
