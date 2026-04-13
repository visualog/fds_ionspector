(function initToolbarState(globalScope) {
  const TOOLBAR_MODES = Object.freeze({
    DEFAULT: 'connected-default',
    CONNECTED_MESSAGE: 'connected-message',
    DISCONNECTED_MESSAGE: 'disconnected-message',
    COMPACT: 'disconnected-compact',
    SINGLE_BUTTON: 'single-button',
  });

  const FILTER_KEYS = Object.freeze(['color', 'font', 'spacing', 'radius']);
  const DEFAULT_FILTER = null;

  const BUTTON_META = Object.freeze({
    color: { id: 'fds-btn-color', kind: 'color', title: '컬러 검사', filter: 'color' },
    font: { id: 'fds-btn-font', kind: 'font', title: '폰트 검사', filter: 'font' },
    spacing: { id: 'fds-btn-spacing', kind: 'spacing', title: '간격 검사', filter: 'spacing' },
    radius: { id: 'fds-btn-radius', kind: 'radius', title: '라운드 검사', filter: 'radius' },
    refresh: { id: 'fds-btn-refresh', kind: 'refresh', title: '새로고침' },
    close: { id: 'fds-btn-close', kind: 'close', title: '닫기', extraClass: 'fds-btn-close' },
  });

  const FILTER_MATCHERS = Object.freeze({
    color: (item) => item.includes('색'),
    font: (item) => item.includes('서체'),
    spacing: (item) => item.includes('패딩'),
    radius: (item) => item.includes('라운드'),
  });

  const BUTTON_STATE_FACTORIES = Object.freeze({
    color: ({ activeFilter, counts }) => ({
      active: activeFilter === 'color',
      badge: counts.color > 0 ? String(counts.color) : '',
      dot: false,
    }),
    font: ({ activeFilter }) => ({
      active: activeFilter === 'font',
      badge: '',
      dot: false,
    }),
    spacing: ({ activeFilter }) => ({
      active: activeFilter === 'spacing',
      badge: '',
      dot: false,
    }),
    radius: ({ activeFilter, counts }) => ({
      active: activeFilter === 'radius',
      badge: '',
      dot: counts.radius > 0,
    }),
    refresh: ({ isFigmaConnected, hasViolations }) => ({
      active: false,
      badge: '',
      dot: !isFigmaConnected || hasViolations,
    }),
    close: () => ({
      active: false,
      badge: '',
      dot: false,
    }),
  });

  const VARIANT_LAYOUTS = Object.freeze({
    [TOOLBAR_MODES.DISCONNECTED_MESSAGE]: Object.freeze({
      width: 401,
      items: Object.freeze([
        { type: 'static', id: 'fds-btn-plug', kind: 'plug' },
        { type: 'divider', id: 'fds-divider-a' },
        { type: 'status', id: 'fds-toolbar-status', text: '피그마 FDS v2.0에서 FDS xbridge를 실행하세요.', tone: 'default' },
        { type: 'divider', id: 'fds-divider-d' },
        { type: 'button', ref: 'close' },
      ]),
    }),
    [TOOLBAR_MODES.CONNECTED_MESSAGE]: Object.freeze({
      width: 310,
      items: Object.freeze([
        { type: 'static', id: 'fds-btn-plug', kind: 'plugConnected' },
        { type: 'divider', id: 'fds-divider-a' },
        { type: 'status', id: 'fds-toolbar-status', text: 'FDS xbridge와 연결되었습니다.', tone: 'connected' },
        { type: 'divider', id: 'fds-divider-d' },
        { type: 'button', ref: 'close' },
      ]),
    }),
    [TOOLBAR_MODES.DEFAULT]: Object.freeze({
      width: 384,
      items: Object.freeze([
        { type: 'static', id: 'fds-btn-plug', kind: 'plugConnected' },
        { type: 'divider', id: 'fds-divider-a' },
        { type: 'group', id: 'fds-group-filters', refs: Object.freeze(['color', 'font', 'spacing', 'radius']) },
        { type: 'divider', id: 'fds-divider-b' },
        { type: 'button', ref: 'refresh' },
        { type: 'divider', id: 'fds-divider-d' },
        { type: 'button', ref: 'close' },
      ]),
    }),
    [TOOLBAR_MODES.COMPACT]: Object.freeze({
      width: 96,
      items: Object.freeze([
        { type: 'static', id: 'fds-btn-plug', kind: 'plug' },
        { type: 'button', ref: 'close' },
      ]),
    }),
    [TOOLBAR_MODES.SINGLE_BUTTON]: Object.freeze({
      width: 48,
      items: Object.freeze([
        { type: 'button', ref: 'font' },
      ]),
    }),
  });

  const VARIANT_STATUS_WIDTHS = Object.freeze({
    [TOOLBAR_MODES.DISCONNECTED_MESSAGE]: 257,
    [TOOLBAR_MODES.CONNECTED_MESSAGE]: 166,
  });

  const FIGMA_STATUS_BY_FILTER = Object.freeze({
    color: 'color',
    font: 'font',
    spacing: 'contract',
    radius: 'contract',
  });

  function countViolationsByFilter(scanData, filter) {
    if (scanData?.counts && typeof scanData.counts[filter] === 'number') {
      return scanData.counts[filter];
    }
    const match = FILTER_MATCHERS[filter];
    if (!match) return 0;
    return new Set((scanData?.violations || []).filter(match)).size;
  }

  function normalizeActiveFilter(activeFilter) {
    if (activeFilter == null) return DEFAULT_FILTER;
    return FILTER_KEYS.includes(activeFilter) ? activeFilter : DEFAULT_FILTER;
  }

  function getNextActiveFilter(currentFilter, clickedFilter) {
    const normalizedClicked = normalizeActiveFilter(clickedFilter);
    if (normalizedClicked === DEFAULT_FILTER) return DEFAULT_FILTER;
    return normalizeActiveFilter(currentFilter) === normalizedClicked ? DEFAULT_FILTER : normalizedClicked;
  }

  function getViolationCounts(scanData) {
    return {
      color: countViolationsByFilter(scanData, 'color'),
      font: countViolationsByFilter(scanData, 'font'),
      spacing: countViolationsByFilter(scanData, 'spacing'),
      radius: countViolationsByFilter(scanData, 'radius'),
    };
  }

  function createButtonStateMap({ activeFilter = DEFAULT_FILTER, isFigmaConnected = false, scanData = { violations: [], suggestions: [] } }) {
    const normalizedFilter = normalizeActiveFilter(activeFilter);
    const counts = getViolationCounts(scanData);
    const hasViolations = (scanData?.violations || []).length > 0;
    const ctx = { activeFilter: normalizedFilter, counts, hasViolations, isFigmaConnected, scanData };

    return Object.keys(BUTTON_META).reduce((acc, key) => {
      const base = BUTTON_META[key];
      const deriveState = BUTTON_STATE_FACTORIES[key];
      acc[key] = {
        ...base,
        ...deriveState(ctx),
      };
      return acc;
    }, {});
  }

  function getToolbarVariantState({ activeFilter = DEFAULT_FILTER, isFigmaConnected = false, scanData = { violations: [], suggestions: [] } }) {
    return createButtonStateMap({ activeFilter, isFigmaConnected, scanData });
  }

  function getToolbarLayout(mode = TOOLBAR_MODES.DEFAULT) {
    return VARIANT_LAYOUTS[mode] || VARIANT_LAYOUTS[TOOLBAR_MODES.DEFAULT];
  }

  function getToolbarStatusWidth(mode = TOOLBAR_MODES.DEFAULT) {
    return VARIANT_STATUS_WIDTHS[mode] || null;
  }

  function getPresentationMode(mode = TOOLBAR_MODES.DEFAULT, viewportWidth = Number.POSITIVE_INFINITY) {
    if (
      mode === TOOLBAR_MODES.DISCONNECTED_MESSAGE &&
      Number.isFinite(viewportWidth) &&
      viewportWidth < 440
    ) {
      return TOOLBAR_MODES.COMPACT;
    }

    return VARIANT_LAYOUTS[mode] ? mode : TOOLBAR_MODES.DEFAULT;
  }

  function getFigmaToolbarAxes({
    mode = TOOLBAR_MODES.DEFAULT,
    activeFilter = DEFAULT_FILTER,
    isFigmaConnected = false,
    scanData = { violations: [], suggestions: [] },
    hovered = false,
  } = {}) {
    const normalizedMode = VARIANT_LAYOUTS[mode] ? mode : TOOLBAR_MODES.DEFAULT;
    const normalizedFilter = normalizeActiveFilter(activeFilter);
    const counts = getViolationCounts(scanData);
    const totalViolations = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const hasViolations = totalViolations > 0;

    let status = 'default';
    if (!isFigmaConnected || normalizedMode === TOOLBAR_MODES.DISCONNECTED_MESSAGE || normalizedMode === TOOLBAR_MODES.CONNECTED_MESSAGE || normalizedMode === TOOLBAR_MODES.COMPACT) {
      status = 'message';
    } else if (normalizedFilter) {
      status = FIGMA_STATUS_BY_FILTER[normalizedFilter] || 'default';
    } else if (!hasViolations) {
      status = 'perfect';
    }

    return {
      status,
      error: hasViolations ? 'True' : 'False',
      success: isFigmaConnected ? 'True' : 'False',
      active: normalizedFilter ? 'True' : 'False',
      hovered: hovered ? 'True' : 'False',
    };
  }

  function createToolbarModel({
    mode = TOOLBAR_MODES.DEFAULT,
    activeFilter = DEFAULT_FILTER,
    isFigmaConnected = false,
    scanData = { violations: [], suggestions: [] },
    options = {},
  }) {
    const normalizedMode = VARIANT_LAYOUTS[mode] ? mode : TOOLBAR_MODES.DEFAULT;
    const buttons = createButtonStateMap({ activeFilter, isFigmaConnected, scanData });
    const baseLayout = getToolbarLayout(normalizedMode);
    const items = baseLayout.items.map((item) => {
      if (item.type !== 'button' || normalizedMode !== TOOLBAR_MODES.SINGLE_BUTTON) return item;
      return { ...item, ref: options.singleButtonRef || item.ref };
    });

    return {
      mode: normalizedMode,
      width: baseLayout.width,
      statusWidth: getToolbarStatusWidth(normalizedMode),
      buttons,
      items,
    };
  }

  function getNextToolbarMode({ isFigmaConnected, previousConnectionState }) {
    if (!isFigmaConnected) return TOOLBAR_MODES.DISCONNECTED_MESSAGE;
    if (previousConnectionState === false) return TOOLBAR_MODES.CONNECTED_MESSAGE;
    return TOOLBAR_MODES.DEFAULT;
  }

  const api = {
    BUTTON_META,
    DEFAULT_FILTER,
    FILTER_KEYS,
    TOOLBAR_MODES,
    countViolationsByFilter,
    createButtonStateMap,
    createToolbarModel,
    getPresentationMode,
    getToolbarLayout,
    getToolbarStatusWidth,
    getToolbarVariantState,
    getNextToolbarMode,
    getNextActiveFilter,
    getFigmaToolbarAxes,
    normalizeActiveFilter,
  };

  globalScope.FDSToolbarState = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
