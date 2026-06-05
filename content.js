const {
  BUTTON_META,
  DEFAULT_FILTER,
  FILTER_KEYS,
  TOOLBAR_SPEC,
  TOOLBAR_MODES,
  countViolationsByFilter,
  createToolbarModel,
  getPresentationMode,
  getNextToolbarMode,
  getNextActiveFilter,
  normalizeActiveFilter,
} = globalThis.FDSToolbarState;

const {
  computeElementScrollTarget,
  computeToolbarDragPosition,
  shouldStartToolbarDrag: shouldStartToolbarDragByState,
} = globalThis.FDSToolbarDrag;
const { hasAuthoredTokenReference } = globalThis.FDSStyleTokenDetection;
const { buildTokenRegistry } = globalThis.FDSTokenSource;
const { escapeHtml } = globalThis.FDSHtmlUtils;
const { createContentRenderers } = globalThis.FDSContentRender;
const { createContentScanUtils } = globalThis.FDSContentScanUtils;
const { createContentTheme } = globalThis.FDSContentTheme;
const { createContentStateUtils } = globalThis.FDSContentStateUtils;
const { createContentInspector } = globalThis.FDSContentInspection;
const { createContentSummaryModel } = globalThis.FDSContentSummaryModel;
const { createContentToolbarUI } = globalThis.FDSContentToolbarUI;
const { createContentBridgeSpecs } = globalThis.FDSContentBridgeSpecs;
const { createContentTokenSuggestions } = globalThis.FDSContentTokenSuggestions;
const { createContentFloatingInspector } = globalThis.FDSContentFloatingInspector;
const { createContentScanRunner } = globalThis.FDSContentScanRunner;
const FDS_DESIGN_VARIABLES = globalThis.FDSDesignVariables;

const FDS_BUILD = '2026-04-13-dev3';
const BRIDGE_POLL_INTERVAL_MS = 3000;
const BRIDGE_DISCONNECT_GRACE_SAMPLES = 3;
const SUMMARY_LIST_MAX_HEIGHT = 168;
const FDS_CSS_VARIABLES = FDS_DESIGN_VARIABLES?.cssVariables || {};
const FDS_SPECS = FDS_DESIGN_VARIABLES?.inspectorSpecs || {
  colors: {},
  fonts: ['Pretendard', 'Noto Sans KR', 'Noto Sans'],
  spacing: [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 80, 144],
  radius: ['4px', '6px', '8px', '10px', '12px', '16px', '9999px'],
};

const ICON_PATHS = {
  move: 'assets/ic_tool_move.svg',
  color: 'assets/ic_tool_color.svg',
  font: 'assets/ic_tool_font.svg',
  spacing: 'assets/ic_tool_spacing.svg',
  warning: 'assets/ic_tool_exclamationmark.triangle.svg',
  success: 'assets/ic_tool_success.svg',
  radius: 'assets/ic_tool_round 2.svg',
  refresh: 'assets/ic_tool_rescan.svg',
  close: 'assets/ic_tool_close.svg',
};
const {
  renderAssetIcon,
  renderToolbarMarkup,
  parseViolationItem,
  formatTokenContextLabel,
  createSummaryMetricCards,
  renderSummaryEmptyState,
  renderSummaryTabBar,
  renderSummaryMetricCard,
  renderSummaryGroupItem,
  renderSummaryListItem,
} = createContentRenderers({
  iconPaths: ICON_PATHS,
  getUrl: safeRuntimeGetUrl,
  escapeHtml,
});
const {
  getToolbarButtonTooltip,
  setRootVisibility,
  isInspectorUIShellComplete,
  resetToolbarFloatingPosition,
  resetSummaryPanelFloatingPosition,
  applyToolbarSyncState,
} = createContentToolbarUI({
  documentRef: document,
});
const {
  recordIssue,
  getElementIssueSignature,
  getDirectTextContent,
  hasDirectTextContent,
  getIssueTone,
  getIssueColorPart,
  getIssueCategoryFromMessage,
  rgbToHex,
} = createContentScanUtils({ parseViolationItem });
const {
  applyThemeVariables,
  applyToolbarSpecVariables,
} = createContentTheme({
  designVariables: FDS_DESIGN_VARIABLES,
  cssVariables: FDS_CSS_VARIABLES,
  toolbarSpec: TOOLBAR_SPEC,
  toolbarModes: TOOLBAR_MODES,
});
const { getInspectionForFilter } = createContentInspector({
  getActiveInspectorSpecs,
  getKnownColorTokens,
  hasAuthoredTokenReference,
  hasDirectTextContent,
  rgbToHex,
});
const TOKEN_SOURCE_STORAGE_KEY = 'fdsTokenSource';
const SCAN_BATCH_BUDGET_MS = 12;
const MAX_SCAN_ELEMENTS = 6000;
const INSPECTOR_CARD_HIDE_DELAY_MS = 700;
const IGNORED_SCAN_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'META',
  'LINK',
  'SVG',
  'PATH',
  'DEFS',
  'CLIPPATH',
  'MASK',
  'LINEARGRADIENT',
  'RADIALGRADIENT',
  'STOP',
]);
let activeFilter = DEFAULT_FILTER;
let isFigmaConnected = false;
let scanData;
let toolbarMode = TOOLBAR_MODES.DEFAULT;
let previousConnectionState = null;
let connectedMessageTimer = null;
let bridgePollIntervalId = null;
let bridgeCheckInFlight = false;
let isExtensionVisible = false;
let isDismissedByUser = false;
let hasBoundViewportEvents = false;
let dragState = null;
let panelDragState = null;
let customSummaryPanelPosition = null;
let isToolbarCollapsed = false;
let suppressToolbarClickUntil = 0;
let isSummaryPanelDismissed = false;
let isSummaryPanelDockedToToolbar = false;
let activeSummarySubtab = 'bg';
let activeSummaryTone = 'danger';
let activePinnedIssueKey = null;
let lockedPinnedIssueKey = null;
let expandedIssueGroupKeys = new Set();
let bridgeConnectionTier = 'offline';
let bridgeConnectionSummary = '브리지 연결 안 됨';
let bridgeConnectionDetail = '브리지 연결이 끊겼거나 세션이 없습니다.';
let bridgeDisconnectStreak = 0;
let activeTokenSource = null;
let activeTokenRegistry = buildTokenRegistry({});
let activeBridgePluginId = null;
let bridgeInspectorSpecOverrides = null;
let bridgeColorTokenRegistry = { colors: {}, meta: { colorTokenCount: 0, colorVariableCount: 0 } };
let bridgeTokenFileName = null;
let bridgeTokenPageName = null;
let snapshotInspectorSpecOverrides = null;
let snapshotColorTokenRegistry = { colors: {}, meta: { colorTokenCount: 0 } };
let snapshotTokenFileName = null;
let hasSnapshotTokenSource = false;
let isScanning = false;
let scanStatusText = '';
let scanErrorText = '';
let activeScanPromise = null;
let queuedScanReason = '';
let lastScanMetrics = null;
let pendingSummaryMotion = null;
let violationPinPositionFrame = null;

const FILTER_LABELS = Object.freeze({
  color: '컬러',
  font: '폰트',
  spacing: '스페이싱',
  radius: '모서리 라운드',
});
const {
  createEmptyScanData,
  getFilterLabel,
  getScanStatusMessage,
} = createContentStateUtils({
  filterLabels: FILTER_LABELS,
  getActiveFilter: () => activeFilter,
});
scanData = createEmptyScanData();
const {
  normalizeActiveSummaryToneForCounts,
  getVisibleIssueEntries,
  getColorEntriesForActiveSubtab,
  getColorToneCountsForActiveSubtab,
  getToneCountsForEntries,
  getTonePatternCountsForGroups,
  getColorTonePatternCountsForActiveSubtab,
  getColorSummaryTabs,
  getSummaryListRenderKey,
  getIssueGroupKey,
  groupIssueEntries,
} = createContentSummaryModel({
  getScanData: () => scanData,
  getActiveFilter: () => activeFilter,
  getActiveSummarySubtab: () => activeSummarySubtab,
  setActiveSummarySubtab: (nextSubtab) => {
    activeSummarySubtab = nextSubtab;
  },
  getActiveSummaryTone: () => activeSummaryTone,
  setActiveSummaryTone: (nextTone) => {
    activeSummaryTone = nextTone;
  },
  getExpandedIssueGroupKeys: () => expandedIssueGroupKeys,
  parseViolationItem,
});

function getFDSMotion() {
  return globalThis.FDSMotion || null;
}

function requestSummaryMotion(kind, details = null) {
  pendingSummaryMotion = typeof kind === 'object' && kind !== null ? kind : { kind, details };
}

function formatScanCompletionText(metrics = lastScanMetrics) {
  if (!metrics || !Number(metrics.scannedElementCount)) return '';
  const seconds = Math.max(0.1, Number(metrics.durationMs || 0) / 1000);
  const scanned = Number(metrics.scannedElementCount || 0).toLocaleString('ko-KR');
  const total = Number(metrics.totalElementCount || metrics.scannedElementCount || 0).toLocaleString('ko-KR');
  const truncatedLabel = metrics.truncated ? ' · 일부만 검사' : '';
  return `검사 완료 · ${scanned}/${total}개 요소 · ${seconds.toFixed(1)}초${truncatedLabel}`;
}

const SCAN_BATCH_SIZE = 80;

function shouldForceScanErrorForVerification() {
  const hostname = window.location?.hostname || '';
  const isLocalVerificationHost = hostname === 'localhost' || hostname === '127.0.0.1';
  return isLocalVerificationHost
    && document.documentElement?.dataset?.fdsInspectorForceScanError === 'true';
}

function handleExtensionContextInvalid(error) {
  const message = error instanceof Error ? error.message : String(error || '');
  if (!message.includes('Extension context invalidated')) {
    return false;
  }

  isExtensionVisible = false;
  isDismissedByUser = true;
  clearConnectedMessageTimer();
  stopBridgePolling();
  hideTooltip();
  hideSummaryPanel();
  hideInspectorCard();

  const root = document.getElementById('fds-root');
  if (root) {
    root.remove();
  }

  return true;
}

async function safeRuntimeSendMessage(payload) {
  try {
    return await chrome.runtime.sendMessage(payload);
  } catch (error) {
    if (handleExtensionContextInvalid(error)) {
      return null;
    }
    throw error;
  }
}

function safeRuntimeGetUrl(path) {
  try {
    return chrome.runtime.getURL(path);
  } catch (error) {
    handleExtensionContextInvalid(error);
    return null;
  }
}

async function loadTokenSourceFromStorage() {
  if (!chrome.storage?.local) return null;
  try {
    const result = await chrome.storage.local.get(TOKEN_SOURCE_STORAGE_KEY);
    activeTokenSource = result?.[TOKEN_SOURCE_STORAGE_KEY] || null;
    activeTokenRegistry = activeTokenSource?.registry || buildTokenRegistry({});
    return activeTokenSource;
  } catch {
    activeTokenSource = null;
    activeTokenRegistry = buildTokenRegistry({});
    return null;
  }
}

function getKnownColorTokens(hex) {
  if (!hex) return [];
  const bridgeTokens = Array.isArray(bridgeColorTokenRegistry?.colors?.[hex])
    ? bridgeColorTokenRegistry.colors[hex]
    : [];
  const sourceTokens = Array.isArray(activeTokenRegistry?.colors?.[hex])
    ? activeTokenRegistry.colors[hex]
    : [];
  const snapshotTokens = Array.isArray(snapshotColorTokenRegistry?.colors?.[hex])
    ? snapshotColorTokenRegistry.colors[hex]
    : [];
  const builtInToken = FDS_SPECS.colors[hex] ? [FDS_SPECS.colors[hex]] : [];
  return [...new Set([...bridgeTokens, ...snapshotTokens, ...sourceTokens, ...builtInToken])];
}

function getActiveInspectorSpecs() {
  const activeOverrides = bridgeInspectorSpecOverrides || snapshotInspectorSpecOverrides;
  return {
    ...FDS_SPECS,
    spacing: Array.isArray(activeOverrides?.spacing) && activeOverrides.spacing.length > 0
      ? activeOverrides.spacing
      : FDS_SPECS.spacing,
    radius: Array.isArray(activeOverrides?.radius) && activeOverrides.radius.length > 0
      ? activeOverrides.radius
      : FDS_SPECS.radius,
    spacingTokens: activeOverrides?.spacingTokens || {},
    radiusTokens: activeOverrides?.radiusTokens || {},
  };
}
const { getSuggestedTokensForIssue } = createContentTokenSuggestions({
  getActiveInspectorSpecs,
  getKnownColorTokens,
  parseViolationItem,
});
const {
  createBridgeInspectorSpecsRefreshState,
  createSnapshotInspectorSpecsRefreshState,
  getBridgeSpecStateSignature: getBridgeSpecStateSignatureBase,
  getBridgeTokenContextLabel: getBridgeTokenContextLabelBase,
} = createContentBridgeSpecs({
  formatTokenContextLabel,
});

function getBridgeSpecStateSignature(overrides = {}) {
  return getBridgeSpecStateSignatureBase({
    pluginId: activeBridgePluginId,
    fileName: bridgeTokenFileName,
    pageName: bridgeTokenPageName,
    overrides: bridgeInspectorSpecOverrides,
    colorRegistry: bridgeColorTokenRegistry,
    ...overrides,
  });
}

async function refreshBridgeInspectorSpecs() {
  const previousSignature = getBridgeSpecStateSignature();
  const response = await safeRuntimeSendMessage({ action: 'BRIDGE_TOKEN_SPECS' });
  const nextState = createBridgeInspectorSpecsRefreshState(response, {
    activePluginId: activeBridgePluginId,
    emptyColorRegistry: buildTokenRegistry({}),
  });

  activeBridgePluginId = nextState.activePluginId;
  bridgeTokenFileName = nextState.fileName;
  bridgeTokenPageName = nextState.pageName;
  bridgeColorTokenRegistry = nextState.colorRegistry;
  bridgeInspectorSpecOverrides = nextState.overrides;

  if (!nextState.connected) {
    return {
      changed: previousSignature !== getBridgeSpecStateSignature(),
      connected: false,
    };
  }

  return {
    changed: previousSignature !== getBridgeSpecStateSignature(),
    connected: true,
    overrides: bridgeInspectorSpecOverrides,
  };
}

async function refreshSnapshotInspectorSpecs() {
  const response = await safeRuntimeSendMessage({ action: 'SNAPSHOT_TOKEN_SPECS' });
  const nextState = createSnapshotInspectorSpecsRefreshState(response);
  snapshotTokenFileName = nextState.fileName;
  hasSnapshotTokenSource = nextState.hasSnapshotTokenSource;
  snapshotInspectorSpecOverrides = nextState.overrides;
  snapshotColorTokenRegistry = nextState.colorRegistry;

  if (!nextState.hasSpecs) {
    return { changed: false, source: 'snapshot' };
  }

  return { changed: true, source: 'snapshot', overrides: snapshotInspectorSpecOverrides };
}

function getBridgeTokenContextLabel() {
  return getBridgeTokenContextLabelBase({
    isFigmaConnected,
    snapshotOverrides: snapshotInspectorSpecOverrides,
    snapshotColorRegistry: snapshotColorTokenRegistry,
    snapshotFileName: snapshotTokenFileName,
    bridgeOverrides: bridgeInspectorSpecOverrides,
    bridgeColorRegistry: bridgeColorTokenRegistry,
    bridgeFileName: bridgeTokenFileName,
    bridgePageName: bridgeTokenPageName,
  });
}

function setScanningState(nextScanning, reason = '') {
  isScanning = Boolean(nextScanning);
  scanStatusText = isScanning ? getScanStatusMessage(reason) : '';
  const root = document.getElementById('fds-root');
  const toolbar = document.getElementById('fds-toolbar');
  if (root) {
    root.dataset.scanState = isScanning ? 'scanning' : 'idle';
  }
  if (toolbar) {
    toolbar.dataset.scanState = isScanning ? 'scanning' : 'idle';
    toolbar.dataset.scanStatus = scanStatusText;
  }
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    if (typeof window.requestAnimationFrame !== 'function') {
      window.setTimeout(resolve, 16);
      return;
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

function waitForDelay(delayMs) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function yieldToBrowser() {
  await waitForNextPaint();
  await waitForDelay(0);
}

function ensureValidActiveFilter() {
  activeFilter = normalizeActiveFilter(activeFilter);
}

function setActiveFilter(nextFilter) {
  activeFilter = normalizeActiveFilter(nextFilter);
  clearActiveViolationPin();
  if (activeFilter !== 'color') {
    activeSummarySubtab = 'bg';
    activeSummaryTone = 'danger';
  }
}

function setToolbarCollapsed(nextCollapsed) {
  isToolbarCollapsed = Boolean(nextCollapsed) && Boolean(activeFilter);
  hideTooltip();
}

function clearConnectedMessageTimer() {
  if (connectedMessageTimer) {
    clearTimeout(connectedMessageTimer);
    connectedMessageTimer = null;
  }
}

function addIssueEntry({ category, message, element }) {
  if (!message) return null;
  const normalizedCategory = getIssueCategoryFromMessage(message, category);
  const colorPart = getIssueColorPart(message);
  const tone = getIssueTone(message);
  const signature = getElementIssueSignature(element);
  const key = `${normalizedCategory}|${colorPart || 'all'}|${message}|${signature}`;
  const existingEntry = scanData.issueEntries.find((entry) => entry.key === key);
  if (existingEntry) return existingEntry;

  const entry = {
    id: scanData.issueEntries.length + 1,
    key,
    category: normalizedCategory,
    colorPart,
    tone,
    message,
    element,
  };
  return entry;
}

function hideTooltip() {
  const tooltip = document.getElementById('fds-inline-tooltip');
  if (tooltip) tooltip.style.display = 'none';
}

function ensureTooltip() {
  let tooltip = document.getElementById('fds-inline-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'fds-inline-tooltip';
    tooltip.className = 'fds-inline-tooltip';
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function clampPosition(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const {
  createInspectorCardHideTimer,
  getViolationPinLabel,
  isViolationPinTargetVisible,
  getRectOverlapArea,
  getPinPositionCandidate,
  getClampedPinCandidate,
  getBestPinPosition,
} = createContentFloatingInspector({
  clampPosition,
});
const inspectorCardHideTimer = createInspectorCardHideTimer({
  hideDelayMs: INSPECTOR_CARD_HIDE_DELAY_MS,
  onClear: () => clearTransientInspectorPreview(),
});

function placeFloatingElement(element, preferredLeft, preferredTop, { margin = 12 } = {}) {
  const width = element.offsetWidth || 0;
  const height = element.offsetHeight || 0;
  const viewportLeft = window.scrollX + margin;
  const viewportTop = window.scrollY + margin;
  const viewportRight = window.scrollX + window.innerWidth - margin - width;
  const viewportBottom = window.scrollY + window.innerHeight - margin - height;

  const clampedLeft = clampPosition(preferredLeft, viewportLeft, Math.max(viewportLeft, viewportRight));
  const clampedTop = clampPosition(preferredTop, viewportTop, Math.max(viewportTop, viewportBottom));

  element.style.left = `${clampedLeft}px`;
  element.style.top = `${clampedTop}px`;
}

function showToolbarButtonTooltip(button) {
  const tooltipText = getToolbarButtonTooltip(button);
  if (!tooltipText) {
    hideTooltip();
    return;
  }

  const tooltip = ensureTooltip();
  tooltip.textContent = tooltipText;
  const rect = button.getBoundingClientRect();
  tooltip.style.display = 'block';
  const tooltipHeight = tooltip.offsetHeight || 36;
  placeFloatingElement(
    tooltip,
    window.scrollX + rect.left + rect.width / 2,
    window.scrollY + rect.top - tooltipHeight - 18
  );
}

function isInspectorUIVisible() {
  const root = document.getElementById('fds-root');
  return Boolean(isExtensionVisible && !isDismissedByUser)
    && isInspectorUIShellComplete(root)
    && Boolean(root.querySelector('#fds-toolbar button'))
    && root.style.display !== 'none'
    && root.dataset.visible === 'true';
}

function ensureVisibleInspectorUI() {
  let root = document.getElementById('fds-root');

  if (root && root.getAttribute('data-fds-build') !== FDS_BUILD) {
    clearConnectedMessageTimer();
    stopBridgePolling();
    hideTooltip();
    root.remove();
    root = null;
  }

  if (root && !isInspectorUIShellComplete(root)) {
    root.remove();
    root = null;
  }

  if (!root) {
    createUI();
    root = document.getElementById('fds-root');
  }

  if (root) {
    setRootVisibility(true);
    syncToolbar();
  }

  return root;
}

function stopBridgePolling() {
  if (bridgePollIntervalId !== null) {
    clearInterval(bridgePollIntervalId);
    bridgePollIntervalId = null;
  }
}

function startBridgePolling() {
  if (bridgePollIntervalId !== null) return;
  bridgePollIntervalId = window.setInterval(() => {
    if (!isExtensionVisible || isDismissedByUser) return;
    checkBridgeConnection();
  }, BRIDGE_POLL_INTERVAL_MS);
}

function showSummaryPanel() {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel || !isExtensionVisible || isDismissedByUser || isSummaryPanelDismissed) return;
  const wasPanelVisible = isSummaryPanelVisible();
  activeSummaryTone = 'danger';
  panel.style.display = 'block';
  panel.style.visibility = 'visible';
  updateSummaryUI();
  if (!wasPanelVisible) {
    getFDSMotion()?.animatePanelOpen?.(panel);
  }
  if (isSummaryPanelDockedToToolbar && isToolbarCollapsed) {
    dockCollapsedToolbarAndPanel();
  }
}

function openSummaryPanelForActiveFilter({ forceExpanded = true } = {}) {
  if (forceExpanded) {
    setToolbarCollapsed(false);
    restoreExpandedToolbarAndPanelPosition({ preserveSummaryPanelPosition: Boolean(customSummaryPanelPosition) });
  }
  isSummaryPanelDismissed = false;
  updateToolbarIndicators();
  showSummaryPanel();
}

function hideSummaryPanel() {
  const panel = document.getElementById('fds-summary-panel');
  if (panel) panel.style.display = 'none';
  clearViolationPins();
}

function dismissSummaryPanel() {
  isSummaryPanelDismissed = true;
  isSummaryPanelDockedToToolbar = false;
  hideSummaryPanel();
}

function isSummaryPanelVisible() {
  const panel = document.getElementById('fds-summary-panel');
  return panel?.style.display === 'block';
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
  const style = globalThis.getComputedStyle?.(panel);
  const paddingTop = toPixelNumber(style?.paddingTop, 16);
  const paddingBottom = toPixelNumber(style?.paddingBottom, 16);
  const head = panel.querySelector?.('.fds-panel-head');
  const section = panel.querySelector?.('.fds-summary-section');
  const sectionStyle = section ? globalThis.getComputedStyle?.(section) : null;
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

function getViolationPinLayer() {
  return document.getElementById('fds-issue-pin-layer');
}

function clearViolationPins() {
  const layer = getViolationPinLayer();
  if (layer) layer.innerHTML = '';
}

function clearHoveredInspectionTarget() {
  document.querySelectorAll('.fds-hover-target').forEach((el) => {
    el.classList.remove('fds-hover-target');
  });
}

function clearActiveViolationPin() {
  activePinnedIssueKey = null;
  lockedPinnedIssueKey = null;
  clearHoveredInspectionTarget();
  hideInspectorCard();
  clearViolationPins();
}

function clearInspectorCardHideTimer() {
  inspectorCardHideTimer.clear();
}

function clearExpandedIssueGroups() {
  expandedIssueGroupKeys = new Set();
}

function applyVisibleIssueHighlights(entries = getVisibleIssueEntries()) {
  document.querySelectorAll('.fds-inspected, .fds-violation, .fds-hover-target').forEach((el) => {
    el.classList.remove('fds-inspected', 'fds-violation', 'fds-violation-danger', 'fds-violation-warning', 'fds-hover-target');
    el.removeAttribute('data-fds-msg');
    el.removeAttribute('data-fds-type');
    el.removeAttribute('data-fds-issue-keys');
  });

  const entriesByElement = new Map();
  entries.forEach((entry) => {
    if (!entry?.element?.isConnected) return;
    const current = entriesByElement.get(entry.element) || [];
    current.push(entry);
    entriesByElement.set(entry.element, current);
  });

  entriesByElement.forEach((elementEntries, element) => {
    const hasDanger = elementEntries.some((entry) => entry.tone === 'danger');
    const hasWarning = elementEntries.some((entry) => entry.tone === 'warning');
    element.classList.add('fds-inspected');
    element.classList.add('fds-violation');
    element.classList.toggle('fds-violation-danger', hasDanger);
    element.classList.toggle('fds-violation-warning', !hasDanger && hasWarning);
    element.setAttribute('data-fds-msg', JSON.stringify(elementEntries.map((entry) => entry.message)));
    element.setAttribute('data-fds-type', hasDanger ? 'danger' : hasWarning ? 'warning' : 'success');
    element.setAttribute('data-fds-issue-keys', JSON.stringify(elementEntries.map((entry) => entry.key)));
  });
}

function getVisibleIssueEntriesForElement(element) {
  if (!element) return [];
  return getVisibleIssueEntries().filter((entry) => entry.element === element && entry.element?.isConnected);
}

function getHoveredInspectionTarget(event) {
  if (!event || typeof document.elementsFromPoint !== 'function') {
    return event?.target?.closest?.('.fds-inspected') || null;
  }

  const visibleElements = new Set(
    getVisibleIssueEntries()
      .map((entry) => entry.element)
      .filter((element) => element?.isConnected)
  );

  return document.elementsFromPoint(event.clientX, event.clientY)
    .find((element) => visibleElements.has(element) && element.classList.contains('fds-inspected')) || null;
}

function showInspectorCardForEntries(target, issueEntries, anchorElement = target) {
  const card = document.getElementById('fds-inspector-card');
  if (!target?.isConnected || !card || !issueEntries?.length) {
    clearHoveredInspectionTarget();
    hideInspectorCard();
    return;
  }

  clearInspectorCardHideTimer();
  clearHoveredInspectionTarget();
  target.classList.add('fds-hover-target');

  const hasDanger = issueEntries.some((entry) => entry.tone === 'danger');
  const hasWarning = issueEntries.some((entry) => entry.tone === 'warning');
  const toneClass = hasDanger ? 'danger' : hasWarning ? 'warning' : 'success';
  const toneLabel = hasDanger ? '위험 감지' : hasWarning ? '경고 감지' : '정상';
  const previewEntries = issueEntries.slice(0, 4);
  card.className = `fds-card ${toneClass}`;
  card.innerHTML = `
    <div class="fds-card-head">
      <div class="fds-card-title-wrap">
        <div class="fds-card-title">INSPECTOR</div>
        <div class="fds-card-subtitle">${target.tagName.toLowerCase()}</div>
      </div>
      <div class="fds-card-tone ${toneClass}">${toneLabel}</div>
    </div>
    <div class="fds-card-body">
      ${previewEntries.map((entry) => {
        const suggestedTokens = getSuggestedTokensForIssue(entry);
        return `
          <div class="fds-issue-item">
            <div class="fds-issue-message">${escapeHtml(entry.message)}</div>
            ${suggestedTokens.length
              ? `<div class="fds-issue-replacement">
                  <span>대체 토큰</span>
                  <strong title="${escapeHtml(suggestedTokens.join(', '))}">${escapeHtml(suggestedTokens.join(', '))}</strong>
                  <button class="fds-token-copy" type="button" data-copy-token="${escapeHtml(suggestedTokens[0])}" title="${escapeHtml(`토큰명 복사: ${suggestedTokens[0]}`)}">토큰명 복사</button>
                </div>`
              : ''}
          </div>
        `;
      }).join('')}
      ${issueEntries.length > 4 ? `<div class="fds-card-more">외 ${issueEntries.length - 4}건</div>` : ''}
    </div>
  `;
  card.querySelectorAll('.fds-token-copy').forEach((button) => {
    button.onclick = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const tokenName = button.dataset.copyToken || '';
      if (!tokenName) return;
      try {
        await navigator.clipboard?.writeText?.(tokenName);
        button.textContent = '복사됨';
        getFDSMotion()?.animateCopySuccess?.(button);
      } catch (error) {
        button.textContent = '복사 실패';
      }
    };
  });
  card.onmouseenter = clearInspectorCardHideTimer;
  card.onpointerenter = clearInspectorCardHideTimer;
  card.onfocusin = clearInspectorCardHideTimer;
  card.onmouseleave = () => scheduleTransientInspectorPreviewClear();
  card.onfocusout = (event) => {
    if (event.relatedTarget?.closest?.('#fds-inspector-card')) return;
    scheduleTransientInspectorPreviewClear();
  };
  const anchorRect = (anchorElement || target).getBoundingClientRect();
  card.style.display = 'block';
  placeFloatingElement(card, window.scrollX + anchorRect.left, window.scrollY + anchorRect.bottom + 8);
  positionViolationPin(issueEntries.find((entry) => entry.key === activePinnedIssueKey) || issueEntries[0], { avoidElement: card });
  getFDSMotion()?.animateInspectorCard?.(card);
}

function renderViolationPin(entry) {
  const layer = getViolationPinLayer();
  if (!layer || !isSummaryPanelVisible() || !entry?.element?.isConnected) {
    clearViolationPins();
    return;
  }

  const tone = entry.tone === 'warning' ? 'warning' : 'danger';
  const label = getViolationPinLabel(entry);
  layer.innerHTML = `<span class="fds-issue-pin ${tone}" data-issue-key="${escapeHtml(entry.key)}" title="${escapeHtml(label)}">${escapeHtml(label)}</span>`;
  positionViolationPin(entry);
  const pin = layer.querySelector('.fds-issue-pin');
  getFDSMotion()?.animatePin?.(pin);
}

function positionViolationPin(
  entry = getVisibleIssueEntries().find((item) => item.key === activePinnedIssueKey),
  { avoidElement = null } = {}
) {
  const layer = getViolationPinLayer();
  if (!layer) return;
  if (!isSummaryPanelVisible()) {
    clearViolationPins();
    return;
  }
  const pin = layer.querySelector('.fds-issue-pin');
  if (!pin || !entry?.element?.isConnected) {
    clearActiveViolationPin();
    return;
  }

  const rect = entry.element.getBoundingClientRect();
  if (!isViolationPinTargetVisible(rect)) {
    clearActiveViolationPin();
    return;
  }

  pin.style.display = 'inline-flex';
  const pinWidth = pin.offsetWidth || 28;
  const pinHeight = pin.offsetHeight || 24;
  const avoidRect = avoidElement?.style?.display !== 'none' ? avoidElement?.getBoundingClientRect?.() : null;
  const pinPosition = getBestPinPosition(rect, pinWidth, pinHeight, avoidRect);
  pin.dataset.position = pinPosition;
  const candidate = getClampedPinCandidate(
    getPinPositionCandidate(rect, pinWidth, pinHeight, pinPosition),
    pinWidth,
    pinHeight
  );
  pin.style.left = `${Math.round(candidate.left)}px`;
  pin.style.top = `${Math.round(candidate.top)}px`;
}

function scheduleViolationPinPositionUpdate() {
  if (violationPinPositionFrame !== null) return;

  const updatePinPosition = () => {
    violationPinPositionFrame = null;
    if (!isExtensionVisible || isDismissedByUser) return;
    positionViolationPin();
  };

  if (typeof window.requestAnimationFrame === 'function') {
    violationPinPositionFrame = window.requestAnimationFrame(updatePinPosition);
    return;
  }

  violationPinPositionFrame = window.setTimeout(updatePinPosition, 16);
}

function setActiveViolationPin(entry, { locked = false } = {}) {
  if (!entry) {
    clearActiveViolationPin();
    return;
  }
  activePinnedIssueKey = entry.key;
  if (locked) {
    lockedPinnedIssueKey = entry.key;
  }
  renderViolationPin(entry);
}

function scheduleIssuePreviewAfterScroll(entry) {
  const updateIssuePreview = () => {
    if (!entry?.element?.isConnected) return;
    positionViolationPin(entry);
    showInspectorCardForEntries(entry.element, [entry]);
  };

  window.requestAnimationFrame?.(updateIssuePreview);
  window.setTimeout?.(updateIssuePreview, 240);
}

function scrollToIssueElement(entry) {
  if (!entry?.element?.isConnected) return;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const behavior = prefersReducedMotion ? 'auto' : 'smooth';

  if (typeof entry.element.scrollIntoView === 'function') {
    try {
      entry.element.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior,
      });
      scheduleIssuePreviewAfterScroll(entry);
      return;
    } catch (error) {
      // Fall back to the document scroll path for older scrollIntoView implementations.
    }
  }

  if (typeof window.scrollTo !== 'function') return;
  const rect = entry.element.getBoundingClientRect();
  const target = computeElementScrollTarget({
    rect,
    scroll: { x: window.scrollX, y: window.scrollY },
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });

  window.scrollTo({
    left: target.left,
    top: target.top,
    behavior,
  });

  scheduleIssuePreviewAfterScroll(entry);
}

function restoreLockedViolationPin(visibleEntries) {
  if (!lockedPinnedIssueKey) {
    clearViolationPins();
    activePinnedIssueKey = null;
    return;
  }
  const lockedEntry = visibleEntries.find((entry) => entry.key === lockedPinnedIssueKey);
  if (!lockedEntry) {
    clearActiveViolationPin();
    return;
  }
  setActiveViolationPin(lockedEntry, { locked: true });
}

function hideInspectorCard() {
  clearInspectorCardHideTimer();
  const card = document.getElementById('fds-inspector-card');
  if (card) card.style.display = 'none';
}

function isInspectorCardVisible() {
  const card = document.getElementById('fds-inspector-card');
  return card?.style.display === 'block';
}

function deferInspectorCardClear() {
  if (isInspectorCardVisible()) {
    scheduleTransientInspectorPreviewClear();
    return;
  }
  clearHoveredInspectionTarget();
  hideInspectorCard();
}

function clearTransientInspectorPreview() {
  if (lockedPinnedIssueKey) {
    restoreLockedViolationPin(getVisibleIssueEntries());
    return;
  }

  clearViolationPins();
  activePinnedIssueKey = null;
  clearHoveredInspectionTarget();
  hideInspectorCard();
  document.querySelectorAll('.fds-list-item.is-pin-active').forEach((activeItem) => {
    activeItem.classList.remove('is-pin-active');
  });
}

function scheduleTransientInspectorPreviewClear() {
  inspectorCardHideTimer.schedule();
}

function isMovingIntoInspectorCard(event) {
  return Boolean(event?.relatedTarget?.closest?.('#fds-inspector-card'));
}

function stopSummaryPanelDrag() {
  const didMovePanel = Boolean(panelDragState?.hasMoved);
  panelDragState = null;
  const panel = document.getElementById('fds-summary-panel');
  if (panel) {
    panel.classList.remove('is-dragging');
  }
  document.body.classList.remove('fds-panel-dragging');
  if (didMovePanel) {
    saveCustomSummaryPanelPosition();
  }
}

function beginSummaryPanelDrag(event) {
  if (event.target?.closest?.('.fds-panel-close')) return;
  const panelHead = event.target?.closest?.('#fds-summary-panel .fds-panel-head');
  if (!panelHead) return;

  const panel = document.getElementById('fds-summary-panel');
  if (!panel) return;

  const rect = panel.getBoundingClientRect();
  panelDragState = {
    pointerId: event.pointerId,
    startPointer: { x: event.clientX, y: event.clientY },
    startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    hasMoved: false,
  };

  panel.style.left = `${rect.left}px`;
  panel.style.top = `${rect.top}px`;
  panel.style.bottom = 'auto';
  isSummaryPanelDockedToToolbar = false;
  panel.classList.add('is-dragging');
  document.body.classList.add('fds-panel-dragging');

  if (typeof panel.setPointerCapture === 'function') {
    try {
      panel.setPointerCapture(event.pointerId);
    } catch {}
  }

  event.preventDefault();
}

function moveSummaryPanelDrag(event) {
  if (!panelDragState || panelDragState.pointerId !== event.pointerId) return;
  const panel = document.getElementById('fds-summary-panel');
  if (!panel) return;

  const nextPosition = computeToolbarDragPosition({
    startPointer: panelDragState.startPointer,
    currentPointer: { x: event.clientX, y: event.clientY },
    startRect: panelDragState.startRect,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    margin: 12,
  });

  panelDragState.hasMoved = true;
  panel.style.left = `${nextPosition.left}px`;
  panel.style.top = `${nextPosition.top}px`;
}

function saveCustomSummaryPanelPosition() {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel) return;
  const rect = panel.getBoundingClientRect();
  customSummaryPanelPosition = {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
  };
}

function applyCustomSummaryPanelPosition() {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel || !customSummaryPanelPosition) return false;
  panel.style.left = `${customSummaryPanelPosition.left}px`;
  panel.style.top = `${customSummaryPanelPosition.top}px`;
  panel.style.bottom = 'auto';
  panel.style.right = '';
  return true;
}

function restoreExpandedToolbarAndPanelPosition({ preserveSummaryPanelPosition = false } = {}) {
  isSummaryPanelDockedToToolbar = false;
  resetToolbarFloatingPosition();
  if (preserveSummaryPanelPosition && applyCustomSummaryPanelPosition()) return;
  resetSummaryPanelFloatingPosition();
}

function positionDockedSummaryPanel(toolbarRect) {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel || panel.style.display !== 'block') return;

  const gap = 16;
  const margin = 12;
  const panelRect = panel.getBoundingClientRect();
  const left = clampPosition(
    toolbarRect.right - panelRect.width,
    margin,
    Math.max(margin, window.innerWidth - panelRect.width - margin)
  );
  const top = clampPosition(
    toolbarRect.top - panelRect.height - gap,
    margin,
    Math.max(margin, window.innerHeight - panelRect.height - margin)
  );

  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
  panel.style.bottom = 'auto';
}

function dockCollapsedToolbarAndPanel() {
  const toolbar = document.getElementById('fds-toolbar');
  if (!toolbar) return;

  const margin = 12;
  const rect = toolbar.getBoundingClientRect();
  const left = Math.max(margin, window.innerWidth - rect.width - margin);
  const top = Math.max(margin, window.innerHeight - rect.height - margin);

  toolbar.style.left = `${left}px`;
  toolbar.style.top = `${top}px`;
  toolbar.style.bottom = 'auto';
  toolbar.style.transform = 'none';

  if (isSummaryPanelVisible()) {
    positionDockedSummaryPanel({
      left,
      top,
      width: rect.width,
      height: rect.height,
      right: left + rect.width,
      bottom: top + rect.height,
    });
  }
}

function stopToolbarDrag() {
  const dragged = Boolean(dragState?.hasMoved);
  dragState = null;
  const toolbar = document.getElementById('fds-toolbar');
  if (toolbar) {
    toolbar.classList.remove('is-dragging');
  }
  document.body.classList.remove('fds-toolbar-dragging');
  if (dragged) {
    suppressToolbarClickUntil = Date.now() + 250;
  }
}

function shouldStartToolbarDrag(target) {
  if (!target) return false;
  const toolbar = document.getElementById('fds-toolbar');
  return shouldStartToolbarDragByState({
    isCollapsed: toolbar?.dataset.collapsed === 'true',
    isMoveHandleTarget: Boolean(target.closest('#fds-btn-move')),
    isInsideToolbar: Boolean(target.closest('#fds-toolbar')),
  });
}

function beginToolbarDrag(event) {
  const toolbar = document.getElementById('fds-toolbar');
  if (!toolbar || !shouldStartToolbarDrag(event.target)) return;

  const rect = toolbar.getBoundingClientRect();
  const isCollapsedDrag = toolbar.dataset.collapsed === 'true';
  dragState = {
    pointerId: event.pointerId,
    startPointer: { x: event.clientX, y: event.clientY },
    startRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    hasMoved: false,
    isActive: !isCollapsedDrag,
  };

  if (!isCollapsedDrag) {
    toolbar.style.left = `${rect.left}px`;
    toolbar.style.top = `${rect.top}px`;
    toolbar.style.bottom = 'auto';
    toolbar.style.transform = 'none';
    toolbar.classList.add('is-dragging');
    document.body.classList.add('fds-toolbar-dragging');

    if (typeof toolbar.setPointerCapture === 'function') {
      try {
        toolbar.setPointerCapture(event.pointerId);
      } catch {}
    }

    event.preventDefault();
  }
}

function moveToolbarDrag(event) {
  if (!dragState || dragState.pointerId !== event.pointerId) return;
  const toolbar = document.getElementById('fds-toolbar');
  if (!toolbar) return;

  const deltaX = Math.abs(event.clientX - dragState.startPointer.x);
  const deltaY = Math.abs(event.clientY - dragState.startPointer.y);
  const movedEnough = deltaX > 3 || deltaY > 3;

  if (!dragState.isActive) {
    if (!movedEnough) return;

    dragState.isActive = true;
    dragState.hasMoved = true;
    toolbar.style.left = `${dragState.startRect.left}px`;
    toolbar.style.top = `${dragState.startRect.top}px`;
    toolbar.style.bottom = 'auto';
    toolbar.style.transform = 'none';
    toolbar.classList.add('is-dragging');
    document.body.classList.add('fds-toolbar-dragging');

    if (typeof toolbar.setPointerCapture === 'function') {
      try {
        toolbar.setPointerCapture(event.pointerId);
      } catch {}
    }

    event.preventDefault();
  }

  const nextPosition = computeToolbarDragPosition({
    startPointer: dragState.startPointer,
    currentPointer: { x: event.clientX, y: event.clientY },
    startRect: dragState.startRect,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    margin: 12,
  });

  if (movedEnough) {
    dragState.hasMoved = true;
  }

  toolbar.style.left = `${nextPosition.left}px`;
  toolbar.style.top = `${nextPosition.top}px`;

  if (isSummaryPanelDockedToToolbar && isSummaryPanelVisible()) {
    positionDockedSummaryPanel({
      left: nextPosition.left,
      top: nextPosition.top,
      width: dragState.startRect.width,
      height: dragState.startRect.height,
      right: nextPosition.left + dragState.startRect.width,
      bottom: nextPosition.top + dragState.startRect.height,
    });
  }
}

function dismissToolbar() {
  isDismissedByUser = true;
  isExtensionVisible = false;
  clearConnectedMessageTimer();
  stopBridgePolling();
  setRootVisibility(false);
  hideTooltip();
  hideSummaryPanel();
  hideInspectorCard();
  clearScan();
  safeRuntimeSendMessage({ action: 'SET_ACTIVE', state: false }).catch(() => {
    setTimeout(() => {
      safeRuntimeSendMessage({ action: 'SET_ACTIVE', state: false }).catch(() => {});
    }, 150);
  });
}

function getToolbarModel() {
  const mode = getPresentationMode(
    toolbarMode,
    typeof window !== 'undefined' ? window.innerWidth : Number.POSITIVE_INFINITY
  );

  const baseModel = createToolbarModel({
    mode,
    activeFilter,
    isFigmaConnected,
    scanData,
    options: {
      collapsed: false,
    },
  });

  const shouldCollapseToolbar = mode === TOOLBAR_MODES.DEFAULT && isToolbarCollapsed && Boolean(activeFilter);
  if (!shouldCollapseToolbar && isToolbarCollapsed) {
    isToolbarCollapsed = false;
  }

  if (!shouldCollapseToolbar) {
    return baseModel;
  }

  return {
    ...baseModel,
    width: TOOLBAR_SPEC.geometry.collapsedWidth,
    items: [{ type: 'button', ref: activeFilter }],
  };
}

function syncToolbar() {
  const root = document.getElementById('fds-root');
  const toolbar = document.getElementById('fds-toolbar');
  if (!root || !toolbar) return;

  const model = getToolbarModel();
  const markup = renderToolbarMarkup(model).trim();
  applyToolbarSyncState({
    root,
    toolbar,
    model,
    isCollapsed: isToolbarCollapsed,
    isScanning,
    scanStatusText,
    applyToolbarSpecVariables,
  });

  if (toolbar.innerHTML.trim() !== markup) {
    hideTooltip();
    toolbar.innerHTML = markup;
    bindToolbarEvents();
  }
}

function getViolationCountByFilter(filter) {
  return countViolationsByFilter(scanData, filter);
}

function updateToolbarIndicators() {
  const root = document.getElementById('fds-root');
  if (!root) return;
  if (toolbarMode === TOOLBAR_MODES.DEFAULT) {
    syncToolbar();
  } else {
    root.dataset.toolbarMode = toolbarMode;
    syncToolbar();
  }
}

function clearScan() {
  clearInspectionMarks();
  scanData = createEmptyScanData();
  setScanningState(false);
  updateToolbarIndicators();
}

async function checkBridgeConnection() {
  if (!isExtensionVisible || isDismissedByUser) return;
  if (bridgeCheckInFlight) return;
  bridgeCheckInFlight = true;
  try {
    const response = await safeRuntimeSendMessage({ action: 'BRIDGE_HEALTH' });
    const nextConnected = Boolean(response?.connected);
    const nextPluginId = response?.primaryActivePluginId || response?.reportedPluginId || null;
    if (nextConnected) {
      bridgeDisconnectStreak = 0;
      isFigmaConnected = true;
      const pluginChanged = nextPluginId && nextPluginId !== activeBridgePluginId;
      activeBridgePluginId = nextPluginId || activeBridgePluginId;
      bridgeConnectionTier = response?.connectionTier || 'legacy';
      bridgeConnectionSummary = response?.connectionSummary || '브리지 연결됨';
      bridgeConnectionDetail =
        response?.connectionDetail ||
        '브리지 연결은 확인됐지만 최신 transport 상태 정보는 제한될 수 있습니다.';
      if (pluginChanged || !bridgeInspectorSpecOverrides) {
        void refreshBridgeInspectorSpecs().then(() => {
          if (isSummaryPanelVisible()) {
            updateSummaryUI();
          }
        });
      }
    } else {
      bridgeDisconnectStreak += 1;
      const shouldHoldPreviousConnection =
        isFigmaConnected && bridgeDisconnectStreak < BRIDGE_DISCONNECT_GRACE_SAMPLES;

      if (shouldHoldPreviousConnection) {
        bridgeConnectionTier = response?.bridgeOnline ? 'modern' : bridgeConnectionTier;
        bridgeConnectionSummary = '브리지 연결 확인 중';
        bridgeConnectionDetail = '브리지 세션 신호가 일시적으로 흔들려 이전 연결 상태를 잠시 유지합니다.';
      } else {
        isFigmaConnected = false;
        activeBridgePluginId = null;
        bridgeInspectorSpecOverrides = null;
        bridgeColorTokenRegistry = { colors: {}, meta: { colorTokenCount: 0, colorVariableCount: 0 } };
        bridgeTokenFileName = null;
        bridgeTokenPageName = null;
        bridgeConnectionTier = 'offline';
        bridgeConnectionSummary = response?.connectionSummary || '브리지 연결 안 됨';
        bridgeConnectionDetail = response?.connectionDetail || '브리지 연결이 끊겼거나 세션이 없습니다.';
      }
    }
  } catch (error) {
    bridgeDisconnectStreak += 1;
    if (isFigmaConnected && bridgeDisconnectStreak < BRIDGE_DISCONNECT_GRACE_SAMPLES) {
      bridgeConnectionSummary = '브리지 연결 확인 중';
      bridgeConnectionDetail = '브리지 health 요청이 일시적으로 실패해 이전 연결 상태를 잠시 유지합니다.';
    } else {
      isFigmaConnected = false;
      activeBridgePluginId = null;
      bridgeInspectorSpecOverrides = null;
      bridgeColorTokenRegistry = { colors: {}, meta: { colorTokenCount: 0, colorVariableCount: 0 } };
      bridgeTokenFileName = null;
      bridgeTokenPageName = null;
      bridgeConnectionTier = 'offline';
      bridgeConnectionSummary = '브리지 연결 안 됨';
      bridgeConnectionDetail = '브리지 연결이 끊겼거나 세션이 없습니다.';
    }
  } finally {
    bridgeCheckInFlight = false;
  }
  updateConnectionUI();
}

function updateConnectionUI() {
  const root = document.getElementById('fds-root');
  if (!root || !isExtensionVisible || isDismissedByUser) return;

  clearConnectedMessageTimer();
  toolbarMode = getNextToolbarMode({
    isFigmaConnected,
    previousConnectionState,
    hasTokenSource: hasSnapshotTokenSource || Boolean(activeTokenSource?.registry?.meta?.colorTokenCount),
  });

  if (toolbarMode === TOOLBAR_MODES.CONNECTED_MESSAGE) {
    connectedMessageTimer = setTimeout(() => {
      const currentRoot = document.getElementById('fds-root');
      if (!currentRoot || !isFigmaConnected || !isExtensionVisible || isDismissedByUser) return;
      toolbarMode = TOOLBAR_MODES.DEFAULT;
      syncToolbar();
    }, 1800);
  }

  previousConnectionState = isFigmaConnected;
  root.classList.toggle('fds-disconnected', !isFigmaConnected);
  syncToolbar();
  if (isSummaryPanelVisible()) {
    updateSummaryUI();
  }
}

function bindToolbarEvents() {
  const toolbar = document.getElementById('fds-toolbar');
  if (toolbar) {
    toolbar.onpointerdown = beginToolbarDrag;
    toolbar.onpointermove = moveToolbarDrag;
    toolbar.onpointerup = stopToolbarDrag;
    toolbar.onpointercancel = stopToolbarDrag;
    toolbar.onmouseleave = hideTooltip;
  }

  document.querySelectorAll('#fds-toolbar button').forEach((btn) => {
    btn.onmouseenter = () => {
      showToolbarButtonTooltip(btn);
    };

    btn.onmouseleave = () => {
      hideTooltip();
    };

    btn.onblur = () => {
      hideTooltip();
    };

    btn.onpointerdown = () => {
      hideTooltip();
    };
  });

  const moveButton = document.getElementById('fds-btn-move');
  if (moveButton) {
    moveButton.onclick = null;
  }

  document.querySelectorAll('#fds-root [data-filter]').forEach((btn) => {
    btn.onclick = () => {
      hideTooltip();
      if (Date.now() < suppressToolbarClickUntil) return;
      const nextFilter = normalizeActiveFilter(btn.dataset.filter);
      if (!nextFilter) return;

      if (activeFilter === nextFilter) {
        if (!isSummaryPanelVisible() || isSummaryPanelDismissed) {
          openSummaryPanelForActiveFilter();
          hideTooltip();
          return;
        }

        setToolbarCollapsed(!isToolbarCollapsed);
        syncToolbar();
        isSummaryPanelDockedToToolbar = isToolbarCollapsed;
        if (isSummaryPanelVisible()) {
          updateSummaryUI();
        } else if (!isSummaryPanelDismissed) {
          isSummaryPanelDismissed = false;
          showSummaryPanel();
        }
        if (isToolbarCollapsed) {
          dockCollapsedToolbarAndPanel();
        } else {
          restoreExpandedToolbarAndPanelPosition({ preserveSummaryPanelPosition: Boolean(customSummaryPanelPosition) });
        }
        hideTooltip();
        return;
      }

      setActiveFilter(nextFilter);
      openSummaryPanelForActiveFilter();
      hideTooltip();
    };
  });

  const refreshBtn = document.getElementById('fds-btn-refresh');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      hideTooltip();
      if (isScanning) return;
      if (!isExtensionVisible || isDismissedByUser) return;
      void scan('페이지 위반 수를 다시 계산하는 중입니다.');
      if (!isSummaryPanelDismissed) {
        showSummaryPanel();
      }
    };
  }

  const closeBtn = document.getElementById('fds-btn-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      hideTooltip();
      dismissToolbar();
    };
  }

  const panelCloseBtn = document.querySelector('#fds-summary-panel .fds-panel-close');
  if (panelCloseBtn) {
    panelCloseBtn.onclick = () => {
      dismissSummaryPanel();
    };
  }
}

function createUI() {
  if (document.getElementById('fds-root')) return;

  applyThemeVariables();
  ensureValidActiveFilter();
  const root = document.createElement('div');
  root.id = 'fds-root';
  root.setAttribute('data-fds-build', FDS_BUILD);
  root.dataset.toolbarMode = toolbarMode;
  root.dataset.visible = 'true';
  console.info('[FDS Inspector] build:', FDS_BUILD);
  applyToolbarSpecVariables(root);
  root.innerHTML = `
    <div id="fds-issue-pin-layer" class="fds-issue-pin-layer" aria-hidden="true"></div>
    <div id="fds-toolbar" class="fds-toolbar" role="toolbar" aria-label="FDS Inspector toolbar"></div>
    <div id="fds-summary-panel" class="fds-summary-card" style="display:none;"></div>
    <div id="fds-inspector-card" class="fds-card" style="display:none;"></div>
  `;
  const mountPoint = document.body || document.documentElement;
  if (!mountPoint) return;
  mountPoint.appendChild(root);

  bindViewportEvents();
  void loadTokenSourceFromStorage();
  void refreshSnapshotInspectorSpecs().then(() => {
    updateConnectionUI();
    if (isSummaryPanelVisible()) updateSummaryUI();
  });
  syncToolbar();
  resetToolbarFloatingPosition();
}

function bindViewportEvents() {
  if (hasBoundViewportEvents) return;
  hasBoundViewportEvents = true;

  window.addEventListener('resize', () => {
    if (!isExtensionVisible || isDismissedByUser) return;
    stopToolbarDrag();
    stopSummaryPanelDrag();
    syncToolbar();
    hideTooltip();
    hideInspectorCard();
    if (isToolbarCollapsed && isSummaryPanelDockedToToolbar) {
      dockCollapsedToolbarAndPanel();
    }
    if (isSummaryPanelVisible()) {
      updateSummaryUI();
    }
    scheduleViolationPinPositionUpdate();
  });

  window.addEventListener('scroll', () => {
    if (!isExtensionVisible || isDismissedByUser) return;
    hideTooltip();
    hideInspectorCard();
    scheduleViolationPinPositionUpdate();
  }, { passive: true });

  document.addEventListener('scroll', () => {
    if (!isExtensionVisible || isDismissedByUser) return;
    hideTooltip();
    hideInspectorCard();
    scheduleViolationPinPositionUpdate();
  }, { passive: true, capture: true });

  document.addEventListener('keydown', (event) => {
    if (!isExtensionVisible || isDismissedByUser) return;
    if (event.key !== 'Escape') return;
    hideTooltip();
    hideInspectorCard();
    if (isSummaryPanelVisible()) {
      dismissSummaryPanel();
      event.stopPropagation();
    }
  });

  window.addEventListener('pointerup', stopToolbarDrag);
  window.addEventListener('pointercancel', stopToolbarDrag);
  window.addEventListener('pointerup', stopSummaryPanelDrag);
  window.addEventListener('pointercancel', stopSummaryPanelDrag);
}

function getPageScanElements() {
  return Array.from(document.body.querySelectorAll('*')).filter((element) => !element.closest('#fds-root'));
}

function isScannableElement(element) {
  if (!element || IGNORED_SCAN_TAGS.has(element.tagName)) return false;
  if (typeof HTMLElement !== 'undefined' && !(element instanceof HTMLElement)) return false;
  const rect = element.getBoundingClientRect();
  return rect.width >= 1 && rect.height >= 1;
}

function markElementScanResult({ element, issues, suggestions, entries }) {
  const elementEntries = entries.filter((entry) => entry.element === element);
  if (elementEntries.length > 0) {
    const issueKeys = elementEntries.map((entry) => entry.key);
    element.setAttribute('data-fds-issue-keys', JSON.stringify(issueKeys));
  } else {
    element.removeAttribute('data-fds-issue-keys');
  }

  if (issues.length > 0 || suggestions.length > 0) {
    const hasDanger = elementEntries.some((entry) => entry.tone === 'danger');
    const hasWarning = elementEntries.some((entry) => entry.tone === 'warning');
    element.classList.add('fds-inspected');
    if (issues.length > 0) {
      element.classList.add('fds-violation');
      element.classList.toggle('fds-violation-danger', hasDanger);
      element.classList.toggle('fds-violation-warning', !hasDanger && hasWarning);
    }
    element.setAttribute('data-fds-msg', JSON.stringify([...issues, ...suggestions]));
    element.setAttribute('data-fds-type', hasDanger ? 'danger' : issues.length > 0 ? 'warning' : 'success');
  } else {
    element.classList.remove('fds-inspected', 'fds-violation', 'fds-violation-danger', 'fds-violation-warning');
    element.removeAttribute('data-fds-msg');
    element.removeAttribute('data-fds-type');
  }
}

function markScannedElementsFromEntries() {
  const groupedEntries = new Map();
  scanData.issueEntries.forEach((entry) => {
    if (!entry.element) return;
    if (!groupedEntries.has(entry.element)) groupedEntries.set(entry.element, []);
    groupedEntries.get(entry.element).push(entry);
  });

  groupedEntries.forEach((entries, element) => {
    markElementScanResult({
      element,
      issues: entries.map((entry) => entry.message),
      suggestions: [],
      entries,
    });
  });
}

async function runSingleScanPass() {
  ensureValidActiveFilter();
  scanData = createEmptyScanData();
  clearInspectionMarks();

  if (shouldForceScanErrorForVerification()) {
    throw new Error('Forced scan error for local verification');
  }

  const runner = createContentScanRunner({
    batchSize: SCAN_BATCH_SIZE,
    batchBudgetMs: SCAN_BATCH_BUDGET_MS,
    maxElements: MAX_SCAN_ELEMENTS,
    now: () => performance.now(),
    getElements: getPageScanElements,
    isElementVisible: isScannableElement,
    getStyles: (element) => window.getComputedStyle(element),
    inspectElement: ({ filterKey, styles, element }) => getInspectionForFilter(filterKey, styles, element),
    addIssueEntry,
    markElement: () => {},
    yieldToBrowser,
  });
  scanData = await runner.run({ filters: FILTER_KEYS, activeFilter, collectAllEntries: !activeFilter });
  if (!isExtensionVisible || isDismissedByUser) {
    clearInspectionMarks();
    return scanData;
  }

  const nextActiveFilter = activeFilter || getPreferredViolationFilter(scanData.counts);
  if (nextActiveFilter && nextActiveFilter !== activeFilter) {
    setActiveFilter(nextActiveFilter);
  }

  refreshActiveScanBreakdown();
  markScannedElementsFromEntries();
  updateToolbarIndicators();
  if (isSummaryPanelVisible()) {
    updateSummaryUI();
  }
  return scanData;
}

async function scan(reason = '') {
  queuedScanReason = reason || queuedScanReason;
  if (activeScanPromise) {
    return activeScanPromise;
  }

  activeScanPromise = (async () => {
    const scanStartedAt = performance.now();
    const nextReason = queuedScanReason;
    queuedScanReason = '';
    scanErrorText = '';
    setScanningState(true, nextReason);
    updateToolbarIndicators();
    if (isSummaryPanelVisible()) {
      updateSummaryUI();
    }

    try {
      await runSingleScanPass();
      const scanDurationMs = Math.round(performance.now() - scanStartedAt);
      lastScanMetrics = {
        durationMs: scanDurationMs,
        scannedElementCount: Number(scanData?.meta?.scannedElementCount || 0),
        skippedElementCount: Number(scanData?.meta?.skippedElementCount || 0),
        batchYieldCount: Number(scanData?.meta?.batchYieldCount || 0),
        totalElementCount: Number(scanData?.meta?.totalElementCount || 0),
        truncated: Boolean(scanData?.meta?.truncated),
        issueCount: Number(scanData?.issueEntries?.length || 0),
        activeFilter: activeFilter || null,
      };
      console.info('[FDS Inspector] scan metrics', lastScanMetrics);
      return scanData;
    } catch (error) {
      scanErrorText = '검사 중 오류가 발생했습니다. 새로고침 버튼으로 다시 검사해 주세요.';
      console.error('[FDS Inspector] scan failed', error);
      return scanData;
    } finally {
      setScanningState(false);
      updateToolbarIndicators();
      if (isSummaryPanelVisible()) {
        updateSummaryUI();
      }

      activeScanPromise = null;

      if (queuedScanReason && isExtensionVisible && !isDismissedByUser) {
        const rerunReason = queuedScanReason;
        queuedScanReason = '';
        void scan(rerunReason);
      }
    }
  })();

  return activeScanPromise;
}

function refreshActiveScanBreakdown() {
  scanData.violations = scanData.issueEntries.map((entry) => entry.message);
  scanData.colorBreakdown = scanData.issueEntries.reduce((acc, entry) => {
    if (entry.category !== 'color') return acc;
    if (entry.tone === 'danger') acc.missing += 1;
    if (entry.tone === 'warning') acc.primitiveRaw += 1;
    return acc;
  }, { missing: 0, primitiveRaw: 0 });
  if (activeFilter && scanData.counts && typeof scanData.counts[activeFilter] === 'number') {
    scanData.counts[activeFilter] = scanData.issueEntries.filter((entry) => entry.category === activeFilter).length;
  }
}

function clearInspectionMarks() {
  document.querySelectorAll('.fds-inspected, .fds-violation, .fds-hover-target').forEach((el) => {
    el.classList.remove('fds-inspected', 'fds-violation', 'fds-violation-danger', 'fds-violation-warning', 'fds-hover-target');
    el.removeAttribute('data-fds-msg');
    el.removeAttribute('data-fds-type');
    el.removeAttribute('data-fds-issue-keys');
  });
  clearViolationPins();
}

function getPreferredViolationFilter(counts = {}) {
  return FILTER_KEYS.find((filterKey) => Number(counts[filterKey] || 0) > 0) || DEFAULT_FILTER;
}

  function updateSummaryUI() {
    const panel = document.getElementById('fds-summary-panel');
    if (!panel) return;
    const summaryMotion = pendingSummaryMotion;
    pendingSummaryMotion = null;
    const shouldRevealListItems = !['group-toggle', 'tab'].includes(summaryMotion?.kind);

  const sCount = scanData.suggestions.length;
  const colorTabs = activeFilter === 'color' ? getColorSummaryTabs() : [];
  const filterLabelMap = {
    color: '컬러',
    font: '폰트',
    spacing: '스페이싱',
    radius: '모서리 라운드',
  };
  const activeFilterLabel = activeFilter ? (filterLabelMap[activeFilter] || activeFilter) : '대기';
  const activeIssueEntries = activeFilter
    ? scanData.issueEntries.filter((entry) => entry.category === activeFilter)
    : scanData.issueEntries;
  if (activeFilter && activeFilter !== 'color') {
    normalizeActiveSummaryToneForCounts(getToneCountsForEntries(activeIssueEntries));
  }
  const isIdle = !activeFilter;
  const hasViolations = activeIssueEntries.length > 0;
  const summaryTitle = isIdle ? '검사 정보' : `${activeFilterLabel} 위반 정보`;
  const scanStatusMarkup = isScanning
    ? `<div class="fds-summary-loading" role="status" aria-live="polite">${escapeHtml(scanStatusText || getScanStatusMessage())}</div>`
    : scanErrorText
    ? `<div class="fds-summary-loading danger" role="alert">${escapeHtml(scanErrorText)}</div>`
    : '';
  const visibleViolations = getVisibleIssueEntries();
  const visibleIssueGroups = groupIssueEntries(visibleViolations);
  const visibleListItems = visibleViolations;
  const activeToneCounts = activeFilter === 'color'
    ? getColorToneCountsForActiveSubtab()
    : getToneCountsForEntries(activeIssueEntries);
  const activeTonePatternCounts = activeFilter === 'color'
    ? getColorTonePatternCountsForActiveSubtab()
    : getTonePatternCountsForGroups(groupIssueEntries(activeIssueEntries));
  const missingColorCount = activeToneCounts.danger;
  const primitiveColorCount = activeToneCounts.warning;
  const missingColorPatternCount = activeTonePatternCounts.danger;
  const primitiveColorPatternCount = activeTonePatternCounts.warning;
  const activeIssueCount = getViolationCountByFilter(activeFilter);
  const renderedListItemCount = visibleIssueGroups.reduce(
    (sum, group) => sum + 1 + (group.expanded ? group.entries.length : 0),
    0
  );
  const hasScrollableList = renderedListItemCount > 10;
  const previousList = panel.querySelector('.fds-summary-list');
  const previousListSnapshot = previousList ? previousList.innerHTML : '';
  const previousListKey = panel.dataset.summaryListKey || '';
  const previousScrollTop = previousList ? previousList.scrollTop : 0;
  const previousListRenderedHeight = previousList
    ? previousList.getBoundingClientRect?.().height
      || previousList.clientHeight
      || previousList.scrollHeight
      || 0
    : 0;
  const previousListHeight = previousList ? Math.min(previousListRenderedHeight, SUMMARY_LIST_MAX_HEIGHT) : 0;
  const previousPanelHeight = panel.offsetHeight || 0;
  const shouldAnimateListHeight = previousList !== null;
  const nextListKey = getSummaryListRenderKey(visibleListItems);
  const isListContentChanged = previousListKey !== nextListKey;
  const hasScanError = Boolean(scanErrorText);
  const listMarkup = hasScanError
    ? '<div class="fds-list-empty danger" role="note">오류로 인해 결과를 표시할 수 없습니다. 새로고침 버튼으로 다시 검사해 주세요.</div>'
    : isIdle
    ? renderSummaryEmptyState({ isIdle: true })
    : visibleViolations.length > 0
      ? visibleIssueGroups.map((group) => `
          ${renderSummaryGroupItem(group)}
          ${group.expanded
            ? `<div class="fds-list-group-details" role="group" aria-label="${escapeHtml(`${group.chip} ${group.value} 상세 항목`)}">
                ${group.entries.map((item) => renderSummaryListItem(item)).join('')}
              </div>`
            : ''}
        `).join('')
      : renderSummaryEmptyState({ activeFilterLabel });
  const summaryCards = hasScanError
    ? [{
      tone: 'danger',
      label: '검사 실패',
      value: '!',
      caption: '다시 검사 필요',
      icon: 'warning',
    }]
    : createSummaryMetricCards({
      hasViolations,
      activeFilter,
      activePatternCount: visibleIssueGroups.length,
      activeIssueCount,
      suggestionCount: sCount,
      missingColorCount,
      primitiveColorCount,
      missingColorPatternCount,
      primitiveColorPatternCount,
      activeSummaryTone,
    });
  const cardRowMarkup = summaryCards.map((card) => renderSummaryMetricCard(card)).join('');
  const tabBarMarkup = renderSummaryTabBar({
    activeFilter,
    colorTabs,
    activeSummarySubtab,
  });

  if (previousPanelHeight > 0) {
    panel.style.height = `${previousPanelHeight}px`;
    panel.style.overflow = 'hidden';
  }

  panel.innerHTML = `
    <div class="fds-panel-head">
      <div class="fds-panel-title-wrap">
        <span class="fds-panel-title">${escapeHtml(summaryTitle)}</span>
      </div>
      <button class="fds-panel-close" type="button" aria-label="패널 닫기" title="패널 닫기">${renderAssetIcon('close', 'close')}</button>
    </div>
    <section class="fds-summary-section" aria-label="요약 및 탐색">
      ${scanStatusMarkup}
      ${tabBarMarkup}
      <div class="fds-summary-card-row${!hasViolations || hasScanError ? ' is-single' : ''}">
        ${cardRowMarkup}
      </div>
      <div class="fds-summary-list${hasScrollableList ? ' is-scrollable' : ''}" role="list" aria-label="위반 목록">
        ${listMarkup}
      </div>
    </section>
  `;
  panel.dataset.summaryListKey = nextListKey;
  const nextList = panel.querySelector('.fds-summary-list');
  const nextListHeight = nextList ? Math.min(nextList.scrollHeight, SUMMARY_LIST_MAX_HEIGHT) : 0;
  const isListGrowing = nextListHeight > previousListHeight;
  const directContentPanelHeight = measureSummaryPanelTargetHeight(panel, { listHeight: nextListHeight });
  const naturalPanelHeight = measureNaturalSummaryPanelHeight(panel);
  const listDerivedPanelHeight = Math.max(
    0,
    previousPanelHeight - previousListHeight + nextListHeight,
  );
  const nextPanelHeight = directContentPanelHeight || naturalPanelHeight || listDerivedPanelHeight || previousPanelHeight;
  panel.querySelectorAll?.('.fds-summary-list-transition-ghost')?.forEach((ghostNode) => {
    ghostNode.remove();
  });
  let listTransitionGhost = null;
  const hasListTransitionGhost = shouldRevealListItems && isListContentChanged && previousList !== null && previousListSnapshot;
  if (nextList && hasListTransitionGhost) {
    listTransitionGhost = previousList.cloneNode(true);
    listTransitionGhost.classList.add('fds-summary-list-transition-ghost');
    listTransitionGhost.removeAttribute('aria-label');
    listTransitionGhost.setAttribute('aria-hidden', 'true');
    listTransitionGhost.style.position = 'absolute';
    listTransitionGhost.style.top = `${Math.max(0, nextList.offsetTop || 0)}px`;
    listTransitionGhost.style.left = '0';
    listTransitionGhost.style.right = '0';
    listTransitionGhost.style.bottom = 'auto';
    listTransitionGhost.style.height = `${previousListHeight}px`;
    listTransitionGhost.style.pointerEvents = 'none';
    listTransitionGhost.style.width = '100%';
    listTransitionGhost.style.maxWidth = '100%';
    listTransitionGhost.style.opacity = '1';
    listTransitionGhost.style.zIndex = '1';
    listTransitionGhost.style.willChange = 'transform,opacity';

    const listParent = nextList.parentElement;
    if (listParent) {
      listParent.style.position = listParent.style.position || 'relative';
      listParent.appendChild(listTransitionGhost);
    }

    nextList.style.position = 'relative';
    nextList.style.zIndex = '2';
  }
  if (shouldAnimateListHeight && nextList && previousListHeight >= 0) {
    nextList.style.height = `${previousListHeight}px`;
    nextList.style.opacity = shouldRevealListItems && isListContentChanged ? (isListGrowing ? '0.16' : '0.92') : '';
    nextList.style.transform = shouldRevealListItems && isListContentChanged ? (isListGrowing ? 'translateY(2px)' : 'translateY(-1px)') : '';
  }
  if (!isListContentChanged) {
    nextList.style.opacity = '';
    nextList.style.transform = '';
  }
  if (nextList && previousListKey === nextListKey) {
    nextList.scrollTop = Math.min(previousScrollTop, Math.max(0, nextList.scrollHeight - nextList.clientHeight));
  }
  applyVisibleIssueHighlights(visibleViolations);
  restoreLockedViolationPin(visibleListItems);

  const panelCloseBtn = panel.querySelector('.fds-panel-close');
  if (panelCloseBtn) {
    panelCloseBtn.onclick = () => {
      dismissSummaryPanel();
    };
  }

  panel.querySelectorAll('.fds-summary-tab[data-filter]').forEach((tab) => {
      tab.onclick = () => {
        const nextFilter = normalizeActiveFilter(tab.dataset.filter);
        if (!nextFilter) return;
        setActiveFilter(nextFilter);
      clearExpandedIssueGroups();
      requestSummaryMotion('tab');
      openSummaryPanelForActiveFilter();
    };
  });

  panel.querySelectorAll('.fds-summary-tab[data-summary-tab]').forEach((tab) => {
      tab.onclick = () => {
        if (isScanning) return;
        const nextSummarySubtab = tab.dataset.summaryTab || 'bg';
        if (nextSummarySubtab === activeSummarySubtab) return;
        const previousSummarySubtab = activeSummarySubtab;
        activeSummarySubtab = nextSummarySubtab;
        requestSummaryMotion('tab', {
          fromSummaryTab: previousSummarySubtab,
          toSummaryTab: nextSummarySubtab,
        });
        clearActiveViolationPin();
        clearExpandedIssueGroups();
        updateSummaryUI();
      };
    });

  panel.querySelectorAll('.fds-stat-box[data-summary-tone]').forEach((card) => {
    card.onclick = () => {
      if (isScanning) return;
      activeSummaryTone = card.dataset.summaryTone === 'warning' ? 'warning' : 'danger';
      clearActiveViolationPin();
      clearExpandedIssueGroups();
      requestSummaryMotion('tab');
      updateSummaryUI();
    };
  });

  panel.querySelectorAll('.fds-list-group[data-group-key]').forEach((item) => {
    item.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const groupKey = item.dataset.groupKey;
      if (!groupKey) return;
      const nextExpandedKeys = new Set(expandedIssueGroupKeys);
      if (nextExpandedKeys.has(groupKey)) {
        nextExpandedKeys.delete(groupKey);
      } else {
        nextExpandedKeys.add(groupKey);
      }
      expandedIssueGroupKeys = nextExpandedKeys;
      clearActiveViolationPin();
      requestSummaryMotion('group-toggle');
      updateSummaryUI();
    };
  });

  panel.querySelectorAll('.fds-list-item[data-issue-key]').forEach((item) => {
    if (item.dataset.issueKey === activePinnedIssueKey) {
      item.classList.add('is-pin-active');
    }

    const showPin = ({ locked = false } = {}) => {
      const issueKey = item.dataset.issueKey;
      const entry = visibleListItems.find((candidate) => candidate.key === issueKey);
      if (!entry) return null;
      setActiveViolationPin(entry, { locked });
      showInspectorCardForEntries(entry.element, [entry]);
      panel.querySelectorAll('.fds-list-item.is-pin-active').forEach((activeItem) => {
        activeItem.classList.remove('is-pin-active');
      });
      item.classList.add('is-pin-active');
      return entry;
    };

    item.onmouseenter = () => showPin();
    item.onfocus = () => showPin();
    item.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const entry = showPin({ locked: true });
      scrollToIssueElement(entry);
    };
    item.onmouseleave = (event) => {
      if (isMovingIntoInspectorCard(event)) return;
      if (lockedPinnedIssueKey) {
        restoreLockedViolationPin(visibleListItems);
        panel.querySelectorAll('.fds-list-item.is-pin-active').forEach((activeItem) => {
          activeItem.classList.toggle('is-pin-active', activeItem.dataset.issueKey === activePinnedIssueKey);
        });
      } else {
        scheduleTransientInspectorPreviewClear();
      }
    };
  });

  const panelHead = panel.querySelector('.fds-panel-head');
  if (panelHead) {
    panelHead.onpointerdown = beginSummaryPanelDrag;
  }
  panel.onpointermove = moveSummaryPanelDrag;
  panel.onpointerup = stopSummaryPanelDrag;
  panel.onpointercancel = stopSummaryPanelDrag;
  if (summaryMotion?.kind === 'tab') {
    const motionKind = summaryMotion.kind || summaryMotion;
    if (motionKind === 'tab') {
      const tabSwitchMotionOptions = summaryMotion?.details || {};
      getFDSMotion()?.animateTabSwitch?.(panel, tabSwitchMotionOptions);
    }
  }
  const didAnimateSummaryRefresh = Boolean(getFDSMotion()?.animateSummaryRefresh?.(panel, {
    listChanged: isListContentChanged,
    fromPanelHeight: previousPanelHeight,
    toPanelHeight: nextPanelHeight,
    fromListHeight: previousListHeight,
    toListHeight: nextListHeight,
    shouldAnimateListHeight,
    force: false,
    listTransitionElement: listTransitionGhost,
    revealListItems: shouldRevealListItems,
  }));
  if (!didAnimateSummaryRefresh) {
    panel.style.height = '';
    panel.style.overflow = '';
    if (nextList) {
      nextList.style.height = '';
      nextList.style.opacity = '';
      nextList.style.overflow = '';
      nextList.style.transform = '';
      nextList.style.willChange = '';
    }
  }
  if (!didAnimateSummaryRefresh && listTransitionGhost) {
    listTransitionGhost.remove();
    listTransitionGhost = null;
  }
}

document.addEventListener('mouseover', (event) => {
  if (event.target?.closest?.('#fds-root')) return;
  const target = getHoveredInspectionTarget(event);
  if (!target) {
    deferInspectorCardClear();
    return;
  }

  const issueEntries = getVisibleIssueEntriesForElement(target);
  if (!issueEntries.length) {
    deferInspectorCardClear();
    return;
  }

  showInspectorCardForEntries(target, issueEntries);
});

document.addEventListener('mouseout', (event) => {
  const relatedTarget = event.relatedTarget;
  if (event.target?.closest?.('#fds-root') || relatedTarget?.closest?.('#fds-root')) return;
  if (relatedTarget?.closest?.('.fds-inspected')) return;
  if (event.target?.closest?.('.fds-inspected')) {
    scheduleTransientInspectorPreviewClear();
    return;
  }
  clearHoveredInspectionTarget();
  hideInspectorCard();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({
      status: 'alive',
      visible: isInspectorUIVisible(),
      dismissed: isDismissedByUser,
      scanMetrics: lastScanMetrics,
    });
    return false;
  }

  if (request.action === 'GET_SCAN_METRICS') {
    sendResponse({ status: 'success', scanMetrics: lastScanMetrics });
    return false;
  }

  if (request.action === 'RESCAN') {
    void loadTokenSourceFromStorage().then(() => {
      void refreshSnapshotInspectorSpecs().catch(() => {
        snapshotInspectorSpecOverrides = null;
      }).finally(() => {
        void scan('페이지 위반 수를 다시 계산하는 중입니다.');
        if (isSummaryPanelVisible()) updateSummaryUI();
      });
      sendResponse({ status: 'success' });
    });
    return true;
  }

  if (request.action === 'TOKEN_SOURCE_UPDATED') {
    void loadTokenSourceFromStorage().then(() => {
      void refreshSnapshotInspectorSpecs().catch(() => {
        snapshotInspectorSpecOverrides = null;
      }).finally(() => {
        if (isExtensionVisible && !isDismissedByUser) {
          void scan('토큰 정보를 반영해 위반 수를 다시 계산하는 중입니다.');
          if (isSummaryPanelVisible()) {
            updateSummaryUI();
          }
        }
      });
      sendResponse({ status: 'success' });
    });
    return true;
  }

  if (request.action === 'TOGGLE') {
    let root = document.getElementById('fds-root');
    const isVisible = Boolean(request.state);
    isExtensionVisible = isVisible;
    if (isVisible) isDismissedByUser = false;

    if (root && root.getAttribute('data-fds-build') !== FDS_BUILD) {
      clearConnectedMessageTimer();
      stopBridgePolling();
      hideTooltip();
      root.remove();
      root = null;
    }

    if (isVisible) root = ensureVisibleInspectorUI();

    if (root && !isVisible) {
      setRootVisibility(isVisible && !isDismissedByUser);
    }

    if (!isVisible) {
      clearConnectedMessageTimer();
      stopBridgePolling();
      hideTooltip();
      hideInspectorCard();
      clearScan();
      isToolbarCollapsed = false;
      isSummaryPanelDismissed = false;
    } else {
      void loadTokenSourceFromStorage().then(() => {
        if (!isExtensionVisible || isDismissedByUser) return;
        void refreshSnapshotInspectorSpecs().catch(() => {
          snapshotInspectorSpecOverrides = null;
        }).finally(() => {
          updateConnectionUI();
          void scan('초기 검사 결과를 계산하는 중입니다.');
          if (isSummaryPanelVisible()) {
            updateSummaryUI();
          }
        });
      });
    }

    sendResponse({
      status: 'success',
      visible: isInspectorUIVisible(),
      dismissed: isDismissedByUser,
    });
  }
  return true;
});
