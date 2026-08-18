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

    function createVisualUpdateScheduler({
      onUpdate,
      requestAnimationFrameFn = globalScope.requestAnimationFrame?.bind?.(globalScope),
      cancelAnimationFrameFn = globalScope.cancelAnimationFrame?.bind?.(globalScope),
      setTimeoutFn = globalScope.setTimeout?.bind?.(globalScope),
      clearTimeoutFn = globalScope.clearTimeout?.bind?.(globalScope),
    }) {
      let pendingTask = null;

      function run(task) {
        if (pendingTask !== task) return;
        pendingTask = null;
        onUpdate?.();
      }

      function schedule() {
        if (pendingTask) return false;

        const task = { kind: null, id: null };
        pendingTask = task;
        const callback = () => run(task);

        if (typeof requestAnimationFrameFn === 'function') {
          task.kind = 'frame';
          task.id = requestAnimationFrameFn(callback);
          return true;
        }

        if (typeof setTimeoutFn === 'function') {
          task.kind = 'timeout';
          task.id = setTimeoutFn(callback, 16);
          return true;
        }

        run(task);
        return true;
      }

      function cancel() {
        if (!pendingTask) return false;
        const task = pendingTask;
        pendingTask = null;
        if (task.kind === 'frame') {
          cancelAnimationFrameFn?.(task.id);
        } else if (task.kind === 'timeout') {
          clearTimeoutFn?.(task.id);
        }
        return true;
      }

      function isScheduled() {
        return Boolean(pendingTask);
      }

      return {
        schedule,
        cancel,
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

    function getFloatingCardPosition(anchorRect, cardWidth, cardHeight, { gap = 12, margin = 12 } = {}) {
      const viewport = getViewport();
      if (!anchorRect || !cardWidth || !cardHeight) {
        return {
          left: clampPosition(anchorRect?.left || margin, margin, Math.max(margin, viewport.width - cardWidth - margin)),
          top: clampPosition((anchorRect?.bottom || margin) + gap, margin, Math.max(margin, viewport.height - cardHeight - margin)),
        };
      }

      const clampLeft = (left) => clampPosition(left, margin, Math.max(margin, viewport.width - cardWidth - margin));
      const clampTop = (top) => clampPosition(top, margin, Math.max(margin, viewport.height - cardHeight - margin));
      const targetCenterY = anchorRect.top + anchorRect.height / 2;
      const targetCenterX = anchorRect.left + anchorRect.width / 2;
      const preferred = [
        { placement: 'right', left: anchorRect.right + gap, top: targetCenterY - cardHeight / 2 },
        { placement: 'top', left: targetCenterX - cardWidth / 2, top: anchorRect.top - cardHeight - gap },
        { placement: 'left', left: anchorRect.left - cardWidth - gap, top: targetCenterY - cardHeight / 2 },
        { placement: 'bottom', left: targetCenterX - cardWidth / 2, top: anchorRect.bottom + gap },
      ];

      const candidates = preferred.map((candidate, index) => {
        const left = clampLeft(candidate.left);
        const top = clampTop(candidate.top);
        const rect = {
          left,
          top,
          right: left + cardWidth,
          bottom: top + cardHeight,
        };
        return {
          ...candidate,
          left,
          top,
          order: index,
          overlapArea: getRectOverlapArea(rect, anchorRect),
          distance: Math.abs(left - candidate.left) + Math.abs(top - candidate.top),
        };
      }).sort((a, b) => a.overlapArea - b.overlapArea || a.order - b.order || a.distance - b.distance);

      return {
        left: candidates[0]?.left ?? clampLeft(anchorRect.right + gap),
        top: candidates[0]?.top ?? clampTop(anchorRect.top),
      };
    }

    return {
      createInspectorCardHideTimer,
      createVisualUpdateScheduler,
      getViolationPinLabel,
      isViolationPinTargetVisible,
      getRectOverlapArea,
      getPinPositionCandidate,
      getClampedPinCandidate,
      getBestPinPosition,
      getFloatingCardPosition,
    };
  }

  const api = { createContentFloatingInspector };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentFloatingInspector = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
