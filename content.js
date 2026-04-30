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
const FDS_DESIGN_VARIABLES = globalThis.FDSDesignVariables;

const FDS_BUILD = '2026-04-13-dev3';
const BRIDGE_POLL_INTERVAL_MS = 3000;
const BRIDGE_DISCONNECT_GRACE_SAMPLES = 3;
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
const TOKEN_SOURCE_STORAGE_KEY = 'fdsTokenSource';

let activeFilter = DEFAULT_FILTER;
let isFigmaConnected = false;
let scanData = createEmptyScanData();
let toolbarMode = TOOLBAR_MODES.DISCONNECTED_MESSAGE;
let previousConnectionState = null;
let connectedMessageTimer = null;
let bridgePollIntervalId = null;
let bridgeCheckInFlight = false;
let isExtensionVisible = false;
let isDismissedByUser = false;
let hasBoundViewportEvents = false;
let dragState = null;
let panelDragState = null;
let isToolbarCollapsed = false;
let suppressToolbarClickUntil = 0;
let isSummaryPanelDismissed = false;
let isSummaryPanelDockedToToolbar = false;
let activeSummarySubtab = 'bg';
let activeSummaryTone = 'danger';
let activePinnedIssueKey = null;
let activePinnedIssueNumber = null;
let lockedPinnedIssueKey = null;
let lockedPinnedIssueNumber = null;
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
let isScanning = false;
let scanStatusText = '';
let activeScanPromise = null;
let queuedScanReason = '';

const FILTER_LABELS = Object.freeze({
  color: '컬러',
  font: '폰트',
  spacing: '스페이싱',
  radius: '모서리 라운드',
});

const SCAN_SETTLE_DELAYS_MS = Object.freeze([80, 180, 320, 480]);

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
  const builtInToken = FDS_SPECS.colors[hex] ? [FDS_SPECS.colors[hex]] : [];
  return [...new Set([...bridgeTokens, ...sourceTokens, ...builtInToken])];
}

function getActiveInspectorSpecs() {
  return {
    ...FDS_SPECS,
    spacing: Array.isArray(bridgeInspectorSpecOverrides?.spacing) && bridgeInspectorSpecOverrides.spacing.length > 0
      ? bridgeInspectorSpecOverrides.spacing
      : FDS_SPECS.spacing,
    radius: Array.isArray(bridgeInspectorSpecOverrides?.radius) && bridgeInspectorSpecOverrides.radius.length > 0
      ? bridgeInspectorSpecOverrides.radius
      : FDS_SPECS.radius,
  };
}

function getBridgeSpecStateSignature({
  pluginId = activeBridgePluginId,
  fileName = bridgeTokenFileName,
  pageName = bridgeTokenPageName,
  overrides = bridgeInspectorSpecOverrides,
  colorRegistry = bridgeColorTokenRegistry,
} = {}) {
  const spacing = Array.isArray(overrides?.spacing) ? [...overrides.spacing] : [];
  const radius = Array.isArray(overrides?.radius) ? [...overrides.radius] : [];
  const colors = colorRegistry?.colors && typeof colorRegistry.colors === 'object'
    ? Object.keys(colorRegistry.colors)
      .sort()
      .map((hex) => [hex, [...new Set(colorRegistry.colors[hex] || [])].sort()])
    : [];

  return JSON.stringify({
    pluginId: pluginId || null,
    fileName: fileName || null,
    pageName: pageName || null,
    spacing,
    radius,
    colors,
  });
}

async function refreshBridgeInspectorSpecs() {
  const previousSignature = getBridgeSpecStateSignature();
  const response = await safeRuntimeSendMessage({ action: 'BRIDGE_TOKEN_SPECS' });
  if (!response || response.status === 'error' || !response.connected) {
    bridgeInspectorSpecOverrides = null;
    bridgeColorTokenRegistry = buildTokenRegistry({});
    bridgeTokenFileName = null;
    bridgeTokenPageName = null;
    if (!response?.connected) {
      activeBridgePluginId = null;
    }
    return {
      changed: previousSignature !== getBridgeSpecStateSignature(),
      connected: false,
    };
  }

  activeBridgePluginId = response.pluginId || activeBridgePluginId;
  bridgeTokenFileName = typeof response.fileName === 'string' ? response.fileName : null;
  bridgeTokenPageName = typeof response.pageName === 'string' ? response.pageName : null;
  const nextOverrides = {
    spacing: Array.isArray(response?.specs?.spacing) ? response.specs.spacing : [],
    radius: Array.isArray(response?.specs?.radius) ? response.specs.radius : [],
    meta: response?.specs?.meta || null,
  };
  bridgeColorTokenRegistry = {
    colors: response?.specs?.colors && typeof response.specs.colors === 'object' ? response.specs.colors : {},
    meta: {
      colorTokenCount: Number(response?.specs?.meta?.colorTokenCount || 0),
      colorVariableCount: Number(response?.specs?.meta?.colorVariableCount || 0),
    },
  };
  bridgeInspectorSpecOverrides =
    (nextOverrides.spacing?.length || nextOverrides.radius?.length)
      ? nextOverrides
      : null;
  return {
    changed: previousSignature !== getBridgeSpecStateSignature(),
    connected: true,
    overrides: bridgeInspectorSpecOverrides,
  };
}

function getBridgeTokenContextLabel() {
  if (!isFigmaConnected) return '';
  const sourceName = bridgeTokenFileName || '현재 연결 파일';
  const pageName = bridgeTokenPageName ? ` · ${bridgeTokenPageName}` : '';
  const spacingCount = Number(bridgeInspectorSpecOverrides?.spacing?.length || 0);
  const radiusCount = Number(bridgeInspectorSpecOverrides?.radius?.length || 0);
  const colorCount = Number(bridgeColorTokenRegistry?.meta?.colorTokenCount || 0);
  const tokenSummary = (spacingCount || radiusCount || colorCount)
    ? `컬러 ${colorCount} · 간격 ${spacingCount} · 라운드 ${radiusCount}`
    : '브리지 토큰 기준';
  return `${sourceName}${pageName} · ${tokenSummary}`;
}

function getFilterLabel(filter = activeFilter) {
  return FILTER_LABELS[filter] || filter || '페이지';
}

function getScanStatusMessage(reason = '') {
  if (reason) return reason;
  if (!activeFilter) return '초기 검사 결과를 계산하는 중입니다.';
  return `${getFilterLabel(activeFilter)} 위반 수를 다시 계산하는 중입니다.`;
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

async function waitForScanSettle(delayMs) {
  await waitForNextPaint();
  if (delayMs > 0) {
    await waitForDelay(delayMs);
  }
}

function getScanSignature() {
  return JSON.stringify({
    counts: scanData.counts,
    issueKeys: scanData.issueEntries.map((entry) => entry.key).sort(),
  });
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

function createEmptyScanData() {
  return {
    violations: [],
    issueEntries: [],
    suggestions: [],
    counts: {
      color: 0,
      font: 0,
      spacing: 0,
      radius: 0,
    },
    colorBreakdown: {
      missing: 0,
      primitiveRaw: 0,
    },
  };
}

function recordIssue(category, message, issues) {
  issues.push(message);
  if (scanData.counts && typeof scanData.counts[category] === 'number') {
    scanData.counts[category] += 1;
  }
}

function getElementIssueSignature(element) {
  if (!element) return 'unknown';
  const tag = element.tagName?.toLowerCase?.() || 'node';
  const id = element.id ? `#${element.id}` : '';
  const classes = typeof element.className === 'string' && element.className.trim()
    ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
    : '';
  const text = getDirectTextContent(element).slice(0, 24);
  return `${tag}${id}${classes}:${text}`;
}

function getDirectTextContent(element) {
  if (!element) return '';
  return Array.from(element.childNodes || [])
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasDirectTextContent(element) {
  return getDirectTextContent(element).length > 0;
}

function getIssueTone(message) {
  if (String(message || '').includes('(미등록)')) return 'danger';
  if (String(message || '').includes('(원시값 직접 사용)')) return 'warning';
  return parseViolationItem(message).tone || 'danger';
}

function getIssueColorPart(message) {
  const text = String(message || '');
  if (text.startsWith('배경색 ')) return 'bg';
  if (text.startsWith('글자색 ')) return 'text';
  if (text.startsWith('보더색 ') || text.startsWith('외곽선 ')) return 'border';
  return null;
}

function getIssueCategoryFromMessage(message, fallback = activeFilter) {
  const text = String(message || '');
  if (/^(배경색|글자색|보더색|외곽선)\s+/.test(text)) return 'color';
  if (text.startsWith('서체 ')) return 'font';
  if (text.startsWith('상단 패딩 ')) return 'spacing';
  if (text.startsWith('라운드 ')) return 'radius';
  return fallback || DEFAULT_FILTER;
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
  scanData.issueEntries.push(entry);
  return entry;
}

function applyThemeVariables() {
  const root = document.documentElement;
  if (typeof FDS_DESIGN_VARIABLES?.applyCSSVariables === 'function') {
    FDS_DESIGN_VARIABLES.applyCSSVariables(root);
    return;
  }

  Object.entries(FDS_CSS_VARIABLES).forEach(([name, value]) => {
    root.style.setProperty(name, String(value));
  });
}

function applyToolbarSpecVariables(target = document.documentElement) {
  if (!target || !TOOLBAR_SPEC?.geometry || !TOOLBAR_SPEC?.variants) return;

  const { geometry, variants } = TOOLBAR_SPEC;
  const defaultVariant = variants[TOOLBAR_MODES.DEFAULT] || {};
  const connectedMessageVariant = variants[TOOLBAR_MODES.CONNECTED_MESSAGE] || {};
  const disconnectedMessageVariant = variants[TOOLBAR_MODES.DISCONNECTED_MESSAGE] || {};

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

function renderAssetIcon(kind, alt) {
  const path = ICON_PATHS[kind] || ICON_PATHS.close;
  const src = path ? safeRuntimeGetUrl(path) : null;
  if (!src) {
    return `<span class="fds-icon-svg fds-icon-svg-fallback" aria-hidden="true"></span>`;
  }

  return `<img class="fds-icon-svg" src="${src}" alt="${alt || kind}" />`;
}

function renderDivider(id) {
  return `<div id="${id}" class="fds-divider" aria-hidden="true"></div>`;
}

function renderToolbarStatus({ id, text, tone }) {
  const extraClass = tone === 'connected' ? ' fds-toolbar-status-connected' : '';
  return `<div id="${id}" class="fds-toolbar-status${extraClass}">${text}</div>`;
}

function renderToolbarButton(button) {
  if (!button) return '';
  const tooltip = button.tooltip || button.title || '';
  const attrs = [
    `id="${button.id}"`,
    'class="fds-btn' + (button.extraClass ? ` ${button.extraClass}` : '') + (button.active ? ' active' : '') + (button.dot ? ' has-dot' : '') + '"',
    `type="button"`,
    `title="${button.title || ''}"`,
    `data-tooltip="${tooltip}"`,
    `data-kind="${button.kind}"`,
  ];

  if (button.filter) attrs.push(`data-filter="${button.filter}"`);
  if (button.active) attrs.push('data-state="active"');
  if (button.badgeMarker) attrs.push('data-badge="•"');
  if (button.badgeCount) attrs.push(`data-badge-count="${button.badgeCount}"`);
  if (button.badgeCountVisible) attrs.push('data-badge-visible="true"');
  if (button.refreshNeeded) attrs.push('data-refresh-needed="true"');

  return `<button ${attrs.join(' ')}><span class="fds-icon-slot">${renderAssetIcon(button.kind, button.title || button.kind)}</span></button>`;
}

function renderToolbarModelItem(item, model) {
  if (item.type === 'static') {
    const moveTooltip = '툴바 이동';
    return `<button id="${item.id}" class="fds-btn-static fds-btn-move" type="button" title="${moveTooltip}" data-tooltip="${moveTooltip}" data-kind="${item.kind}"><span class="fds-icon-slot">${renderAssetIcon(item.kind, item.kind)}</span></button>`;
  }

  if (item.type === 'divider') return renderDivider(item.id);
  if (item.type === 'status') return renderToolbarStatus(item);

  if (item.type === 'group') {
    return `<div id="${item.id}" class="fds-btn-group">${item.refs.map((ref) => renderToolbarButton(model.buttons[ref])).join('')}</div>`;
  }

  if (item.type === 'button') {
    return renderToolbarButton(model.buttons[item.ref]);
  }

  return '';
}

function renderToolbarMarkup(model) {
  return model.items.map((item) => renderToolbarModelItem(item, model)).join('');
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

function getToolbarButtonTooltip(button) {
  if (!button) return '';
  return button.dataset.tooltip || button.getAttribute('title') || '';
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

function setRootVisibility(visible) {
  const root = document.getElementById('fds-root');
  if (!root) return;
  root.dataset.visible = visible ? 'true' : 'false';
  root.style.display = visible ? 'block' : 'none';
  document.body.classList.toggle('fds-hide-all', !visible);
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
  activeSummaryTone = 'danger';
  panel.style.display = 'block';
  updateSummaryUI();
  if (isSummaryPanelDockedToToolbar && isToolbarCollapsed) {
    dockCollapsedToolbarAndPanel();
  }
}

function openSummaryPanelForActiveFilter({ forceExpanded = true } = {}) {
  if (forceExpanded) {
    setToolbarCollapsed(false);
    restoreExpandedToolbarAndPanelPosition();
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
  activePinnedIssueNumber = null;
  lockedPinnedIssueKey = null;
  lockedPinnedIssueNumber = null;
  clearViolationPins();
}

function getVisibleIssueEntries() {
  if (!activeFilter) return [];
  const entries = scanData.issueEntries.filter((entry) => entry.category === activeFilter);
  if (activeFilter !== 'color') return entries;

  return getColorEntriesForActiveSubtab().filter((entry) => entry.tone === activeSummaryTone);
}

function getColorEntriesForActiveSubtab() {
  return scanData.issueEntries.filter((entry) => {
    if (entry.category !== 'color') return false;
    if (activeSummarySubtab === 'bg') return entry.colorPart === 'bg';
    if (activeSummarySubtab === 'text') return entry.colorPart === 'text';
    return entry.colorPart === 'border';
  });
}

function getColorToneCountsForActiveSubtab() {
  return getColorEntriesForActiveSubtab().reduce((acc, entry) => {
    if (entry.tone === 'danger') acc.danger += 1;
    if (entry.tone === 'warning') acc.warning += 1;
    return acc;
  }, { danger: 0, warning: 0 });
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

function showInspectorCardForEntries(target, issueEntries) {
  const card = document.getElementById('fds-inspector-card');
  if (!target?.isConnected || !card || !issueEntries?.length) {
    clearHoveredInspectionTarget();
    hideInspectorCard();
    return;
  }

  clearHoveredInspectionTarget();
  target.classList.add('fds-hover-target');

  const issues = issueEntries.map((entry) => entry.message);
  const hasDanger = issueEntries.some((entry) => entry.tone === 'danger');
  const hasWarning = issueEntries.some((entry) => entry.tone === 'warning');
  const toneClass = hasDanger ? 'danger' : hasWarning ? 'warning' : 'success';
  const toneLabel = hasDanger ? '위험 감지' : hasWarning ? '경고 감지' : '정상';
  const previewItems = issues.slice(0, 4);
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
      ${previewItems.map((item) => `<div class="fds-issue-item">${item}</div>`).join('')}
      ${issues.length > 4 ? `<div class="fds-card-more">외 ${issues.length - 4}건</div>` : ''}
    </div>
  `;
  const rect = target.getBoundingClientRect();
  card.style.display = 'block';
  placeFloatingElement(card, window.scrollX + rect.left, window.scrollY + rect.bottom + 8);
}

function renderViolationPin(entry, number) {
  const layer = getViolationPinLayer();
  if (!layer || !isSummaryPanelVisible() || !entry?.element?.isConnected || !number) {
    clearViolationPins();
    return;
  }

  const tone = entry.tone === 'warning' ? 'warning' : 'danger';
  layer.innerHTML = `<span class="fds-issue-pin ${tone}" data-issue-key="${escapeHtml(entry.key)}">${number}</span>`;
  positionViolationPin(entry);
}

function getBestPinPosition(rect, pinWidth, pinHeight) {
  const margin = 4;
  const hasTopSpace = rect.top >= pinHeight + margin;
  const hasBottomSpace = window.innerHeight - rect.bottom >= pinHeight + margin;
  const hasLeftSpace = rect.left >= pinWidth + margin;
  const hasRightSpace = window.innerWidth - rect.right >= pinWidth + margin;
  const vertical = hasTopSpace || !hasBottomSpace ? 'T' : 'B';
  const horizontal = hasLeftSpace || !hasRightSpace ? 'L' : 'R';
  return `pin_${horizontal}${vertical}`;
}

function positionViolationPin(entry = getVisibleIssueEntries().find((item) => item.key === activePinnedIssueKey)) {
  const layer = getViolationPinLayer();
  if (!layer || !isSummaryPanelVisible()) return;
  const pin = layer.querySelector('.fds-issue-pin');
  if (!pin || !entry?.element?.isConnected) return;

  const rect = entry.element.getBoundingClientRect();
  const isVisible =
    rect.width >= 1 &&
    rect.height >= 1 &&
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= window.innerHeight &&
    rect.left <= window.innerWidth;

  pin.style.display = isVisible ? 'inline-flex' : 'none';
  const pinWidth = pin.offsetWidth || 28;
  const pinHeight = pin.offsetHeight || 24;
  const pinPosition = getBestPinPosition(rect, pinWidth, pinHeight);
  pin.dataset.position = pinPosition;

  let preferredLeft = rect.left + 4;
  let preferredTop = rect.top + 4;
  if (pinPosition === 'pin_LT') {
    preferredLeft = rect.left - pinWidth + 2;
    preferredTop = rect.top - pinHeight + 2;
  } else if (pinPosition === 'pin_RT') {
    preferredLeft = rect.right - 2;
    preferredTop = rect.top - pinHeight + 2;
  } else if (pinPosition === 'pin_LB') {
    preferredLeft = rect.left - pinWidth + 2;
    preferredTop = rect.bottom - 2;
  } else if (pinPosition === 'pin_RB') {
    preferredLeft = rect.right - 2;
    preferredTop = rect.bottom - 2;
  }

  const pinLeft = clampPosition(preferredLeft, 4, Math.max(4, window.innerWidth - pinWidth - 4));
  const pinTop = clampPosition(preferredTop, 4, Math.max(4, window.innerHeight - pinHeight - 4));
  pin.style.left = `${Math.round(pinLeft)}px`;
  pin.style.top = `${Math.round(pinTop)}px`;
}

function setActiveViolationPin(entry, number, { locked = false } = {}) {
  if (!entry) {
    clearActiveViolationPin();
    return;
  }
  activePinnedIssueKey = entry.key;
  activePinnedIssueNumber = number;
  if (locked) {
    lockedPinnedIssueKey = entry.key;
    lockedPinnedIssueNumber = number;
  }
  renderViolationPin(entry, number);
}

function scrollToIssueElement(entry) {
  if (!entry?.element?.isConnected || typeof window.scrollTo !== 'function') return;
  const rect = entry.element.getBoundingClientRect();
  const target = computeElementScrollTarget({
    rect,
    scroll: { x: window.scrollX, y: window.scrollY },
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  window.scrollTo({
    left: target.left,
    top: target.top,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  });

  window.requestAnimationFrame?.(() => {
    positionViolationPin(entry);
    showInspectorCardForEntries(entry.element, [entry]);
  });
}

function restoreLockedViolationPin(visibleEntries) {
  if (!lockedPinnedIssueKey) {
    clearViolationPins();
    activePinnedIssueKey = null;
    activePinnedIssueNumber = null;
    return;
  }
  const lockedEntry = visibleEntries.find((entry) => entry.key === lockedPinnedIssueKey);
  if (!lockedEntry) {
    clearActiveViolationPin();
    return;
  }
  setActiveViolationPin(lockedEntry, lockedPinnedIssueNumber || visibleEntries.indexOf(lockedEntry) + 1, { locked: true });
}

function hideInspectorCard() {
  const card = document.getElementById('fds-inspector-card');
  if (card) card.style.display = 'none';
}

function stopSummaryPanelDrag() {
  panelDragState = null;
  const panel = document.getElementById('fds-summary-panel');
  if (panel) {
    panel.classList.remove('is-dragging');
  }
  document.body.classList.remove('fds-panel-dragging');
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

  panel.style.left = `${nextPosition.left}px`;
  panel.style.top = `${nextPosition.top}px`;
}

function resetToolbarFloatingPosition() {
  const toolbar = document.getElementById('fds-toolbar');
  if (!toolbar) return;
  toolbar.style.left = '';
  toolbar.style.top = '';
  toolbar.style.bottom = '';
  toolbar.style.transform = '';
}

function resetSummaryPanelFloatingPosition() {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel) return;
  panel.style.left = '';
  panel.style.top = '';
  panel.style.bottom = '';
  panel.style.right = '';
}

function restoreExpandedToolbarAndPanelPosition() {
  isSummaryPanelDockedToToolbar = false;
  resetToolbarFloatingPosition();
  resetSummaryPanelFloatingPosition();
}

function positionDockedSummaryPanel(toolbarRect) {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel || panel.style.display !== 'block') return;

  const gap = 12;
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
  root.dataset.toolbarMode = model.mode;
  root.dataset.toolbarCollapsed = isToolbarCollapsed ? 'true' : 'false';
  root.dataset.scanState = isScanning ? 'scanning' : 'idle';
  toolbar.dataset.variant = model.mode;
  toolbar.dataset.collapsed = isToolbarCollapsed ? 'true' : 'false';
  toolbar.dataset.scanState = isScanning ? 'scanning' : 'idle';
  toolbar.dataset.scanStatus = scanStatusText;
  applyToolbarSpecVariables(root);
  toolbar.style.setProperty('--fds-toolbar-width', `${model.width}px`);
  toolbar.style.setProperty('--fds-toolbar-status-width', model.statusWidth ? `${model.statusWidth}px` : 'auto');

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
  document.querySelectorAll('.fds-inspected, .fds-violation').forEach((el) => {
    el.classList.remove('fds-inspected', 'fds-violation', 'fds-violation-danger', 'fds-violation-warning');
    el.removeAttribute('data-fds-msg');
    el.removeAttribute('data-fds-type');
  });
  clearViolationPins();
  scanData = createEmptyScanData();
  setScanningState(false);
  updateToolbarIndicators();
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb.includes('rgba(0, 0, 0, 0)')) return null;
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!match) return null;
  const r = Number.parseInt(match[1], 10);
  const g = Number.parseInt(match[2], 10);
  const b = Number.parseInt(match[3], 10);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toLowerCase()}`;
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
  toolbarMode = getNextToolbarMode({ isFigmaConnected, previousConnectionState });

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
          updateSummaryUI();
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
          restoreExpandedToolbarAndPanelPosition();
        }
        hideTooltip();
        return;
      }

      setActiveFilter(nextFilter);
      openSummaryPanelForActiveFilter();
      updateSummaryUI();
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
      checkBridgeConnection();
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
  document.body.appendChild(root);

  bindViewportEvents();
  void loadTokenSourceFromStorage();
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
    positionViolationPin();
  });

  window.addEventListener('scroll', () => {
    if (!isExtensionVisible || isDismissedByUser) return;
    hideTooltip();
    hideInspectorCard();
    positionViolationPin();
  }, { passive: true });

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

function runSingleScanPass() {
  ensureValidActiveFilter();
  scanData = createEmptyScanData();
  clearInspectionMarks();
  scanData.counts = collectViolationCounts();

  if (!activeFilter) {
    const nextAutoFilter = getPreferredViolationFilter(scanData.counts);
    if (nextAutoFilter) {
      setActiveFilter(nextAutoFilter);
    }
  }

  if (!activeFilter) {
    updateToolbarIndicators();
    if (isSummaryPanelVisible()) {
      updateSummaryUI();
    }
    return scanData;
  }

  document.querySelectorAll('body *:not(#fds-root *)').forEach((element) => validate(element, { incrementCounts: false }));
  refreshActiveScanBreakdown();
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
    const nextReason = queuedScanReason;
    queuedScanReason = '';
    setScanningState(true, nextReason);
    updateToolbarIndicators();
    if (isSummaryPanelVisible()) {
      updateSummaryUI();
    }

    runSingleScanPass();
    let previousSignature = getScanSignature();

    for (const delayMs of SCAN_SETTLE_DELAYS_MS) {
      if (!isExtensionVisible || isDismissedByUser) break;
      await waitForScanSettle(delayMs);
      runSingleScanPass();
      const signature = getScanSignature();
      if (signature && signature === previousSignature) {
        break;
      }
      previousSignature = signature;
    }

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

    return scanData;
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

function getInspectionForFilter(filter, styles, element = null) {
  const issues = [];
  const suggestions = [];
  const activeSpecs = getActiveInspectorSpecs();

  if (filter === 'color') {
    const bg = rgbToHex(styles.backgroundColor);
    const text = hasDirectTextContent(element) ? rgbToHex(styles.color) : null;
    const borderWidth = Number.parseFloat(styles.borderTopWidth || '0');
    const borderColor = rgbToHex(styles.borderTopColor);
    const bgUsesToken = hasAuthoredTokenReference(element, ['background-color', 'background']);
    const textUsesToken = hasAuthoredTokenReference(element, ['color']);
    const borderUsesToken = hasAuthoredTokenReference(element, [
      'border-color',
      'border-top-color',
      'border',
      'border-top',
    ]);

    if (bg && !bgUsesToken) {
      if (!getKnownColorTokens(bg).length) {
        issues.push(`배경색 ${bg} (미등록)`);
      } else {
        issues.push(`배경색 ${bg} (원시값 직접 사용)`);
      }
    }

    if (text && !textUsesToken) {
      if (!getKnownColorTokens(text).length) {
        issues.push(`글자색 ${text} (미등록)`);
      } else {
        issues.push(`글자색 ${text} (원시값 직접 사용)`);
      }
    }

    if (borderWidth > 0 && borderColor && !borderUsesToken) {
      if (!getKnownColorTokens(borderColor).length) {
        issues.push(`보더색 ${borderColor} (미등록)`);
      } else {
        issues.push(`보더색 ${borderColor} (원시값 직접 사용)`);
      }
    }
  } else if (filter === 'font') {
    if (!hasDirectTextContent(element)) return { issues, suggestions };
    const font = styles.fontFamily.split(',')[0].replace(/"/g, '');
    if (!activeSpecs.fonts.some((item) => font.includes(item))) {
      issues.push(`서체 '${font}' (차단)`);
    }
  } else if (filter === 'spacing') {
    const pt = Number.parseInt(styles.paddingTop, 10);
    if (pt > 0 && !activeSpecs.spacing.includes(pt)) {
      issues.push(`상단 패딩 ${pt}px (비규격)`);
    }
  } else if (filter === 'radius') {
    const radius = styles.borderRadius;
    if (radius !== '0px' && !activeSpecs.radius.includes(radius)) {
      issues.push(`라운드 ${radius} (미준수)`);
    }
  }

  return { issues, suggestions };
}

function collectViolationCounts() {
  const counts = createEmptyScanData().counts;

  document.querySelectorAll('body *:not(#fds-root *)').forEach((el) => {
    const styles = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    FILTER_KEYS.forEach((filterKey) => {
      const inspection = getInspectionForFilter(filterKey, styles, el);
      if (inspection.issues.length > 0) {
        counts[filterKey] += inspection.issues.length;
      }
    });
  });

  return counts;
}

function validate(el, { incrementCounts = true } = {}) {
  const styles = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;

  const inspection = getInspectionForFilter(activeFilter, styles, el);
  const issues = inspection.issues;
  const suggestions = inspection.suggestions;

  if (incrementCounts && issues.length > 0 && activeFilter) {
    scanData.counts[activeFilter] += issues.length;
    if (activeFilter === 'color') {
      issues.forEach((issue) => {
        if (issue.includes('(미등록)')) {
          scanData.colorBreakdown.missing += 1;
        } else if (issue.includes('(원시값 직접 사용)')) {
          scanData.colorBreakdown.primitiveRaw += 1;
        }
      });
    }
  }

  const issueEntries = issues
    .map((issue) => addIssueEntry({ category: activeFilter, message: issue, element: el }))
    .filter(Boolean);
  issueEntries.forEach((entry) => scanData.violations.push(entry.message));
  suggestions.forEach((suggestion) => scanData.suggestions.push(suggestion));

  if (issues.length > 0 || suggestions.length > 0) {
    const hasDanger = issueEntries.some((entry) => entry.tone === 'danger');
    const hasWarning = issueEntries.some((entry) => entry.tone === 'warning');
    el.classList.add('fds-inspected');
    if (issues.length > 0) {
      el.classList.add('fds-violation');
      el.classList.toggle('fds-violation-danger', hasDanger);
      el.classList.toggle('fds-violation-warning', !hasDanger && hasWarning);
    }
    el.setAttribute('data-fds-msg', JSON.stringify([...issues, ...suggestions]));
    el.setAttribute('data-fds-type', hasDanger ? 'danger' : issues.length > 0 ? 'warning' : 'success');
  } else {
    el.classList.remove('fds-inspected', 'fds-violation', 'fds-violation-danger', 'fds-violation-warning');
  }
}

function getColorSummaryTabs() {
  const counts = {
    bg: scanData.issueEntries.filter((item) => item.category === 'color' && item.colorPart === 'bg').length,
    border: scanData.issueEntries.filter((item) => item.category === 'color' && item.colorPart === 'border').length,
    text: scanData.issueEntries.filter((item) => item.category === 'color' && item.colorPart === 'text').length,
  };

  const tabs = [
    { key: 'bg', label: 'BG', count: counts.bg },
    { key: 'border', label: 'Border', count: counts.border },
    { key: 'text', label: 'Text', count: counts.text },
  ];

  const currentTabExists = tabs.some((tab) => tab.key === activeSummarySubtab);
  const preferredTab = tabs.find((tab) => tab.count > 0)?.key || 'bg';

  if (!currentTabExists || !tabs.find((tab) => tab.key === activeSummarySubtab)?.count) {
    activeSummarySubtab = preferredTab;
  }

  return tabs;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseViolationItem(item) {
  const text = String(item || '');
  const patterns = [
    {
      regex: /^배경색\s+(.+?)\s+\((미등록)\)$/,
      chip: '배경색',
      tone: 'danger',
      valueLabel: '값',
    },
    {
      regex: /^배경색\s+(.+?)\s+\((원시값 직접 사용)\)$/,
      chip: '배경색',
      tone: 'warning',
      valueLabel: '값',
    },
    {
      regex: /^글자색\s+(.+?)\s+\((미등록)\)$/,
      chip: '글자색',
      tone: 'danger',
      valueLabel: '값',
    },
    {
      regex: /^글자색\s+(.+?)\s+\((원시값 직접 사용)\)$/,
      chip: '글자색',
      tone: 'warning',
      valueLabel: '값',
    },
    {
      regex: /^보더색\s+(.+?)\s+\((미등록)\)$/,
      chip: '보더색',
      tone: 'danger',
      valueLabel: '값',
    },
    {
      regex: /^보더색\s+(.+?)\s+\((원시값 직접 사용)\)$/,
      chip: '보더색',
      tone: 'warning',
      valueLabel: '값',
    },
    {
      regex: /^서체\s+'(.+?)'\s+\((.+?)\)$/,
      chip: '서체',
      tone: 'success',
      valueLabel: '글꼴',
    },
    {
      regex: /^상단 패딩\s+(.+?)\s+\((.+?)\)$/,
      chip: '상단 패딩',
      tone: 'warning',
      valueLabel: '크기',
    },
    {
      regex: /^라운드\s+(.+?)\s+\((.+?)\)$/,
      chip: '라운드',
      tone: 'warning',
      valueLabel: '크기',
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (match) {
      return {
        chip: pattern.chip,
        tone: pattern.tone,
        value: match[1],
        suffix: match[2],
        tag: match[2],
        valueLabel: pattern.valueLabel,
      };
    }
  }

  return {
    chip: '위반',
    tone: 'danger',
    value: text,
    suffix: '',
    tag: '위반',
    valueLabel: '내용',
  };
}

function getIssueElementLabel(item, parsed) {
  const element = typeof item === 'object' ? item?.element : null;
  const tagName = element?.tagName?.toLowerCase?.() || 'element';
  const idPart = element?.id ? `#${element.id}` : '';
  const classPart = typeof element?.className === 'string' && element.className.trim()
    ? `.${element.className.trim().split(/\s+/).slice(0, 1).join('.')}`
    : '';
  return `${tagName}${idPart}${classPart} · ${parsed.chip}`;
}

function renderSummaryMetricCard({ tone, label, value, caption, icon = 'warning', isToggle = false, isActive = false }) {
  const tagName = isToggle ? 'button' : 'article';
  const typeAttr = isToggle ? ' type="button"' : '';
  const dataAttr = isToggle ? ` data-summary-tone="${escapeHtml(tone)}"` : '';
  const pressedAttr = isToggle ? ` aria-pressed="${isActive ? 'true' : 'false'}"` : '';
  const displayValue = Number(value) > 0 ? String(value) : '';
  return `
    <${tagName}${typeAttr}${dataAttr}${pressedAttr} class="fds-stat-box ${tone}${isToggle ? ' is-toggle' : ''}${isActive ? ' is-active' : ''}" aria-label="${escapeHtml(label)}: ${escapeHtml(value)}">
      <div class="fds-stat-topline" aria-hidden="true">
        <span class="fds-stat-icon">${renderAssetIcon(icon, icon)}</span>
        <span class="fds-stat-heading">${escapeHtml(label)}</span>
      </div>
      <div class="fds-stat-num">${escapeHtml(displayValue)}</div>
    </${tagName}>
  `;
}

function renderSummaryListItem(item, index) {
  const message = typeof item === 'string' ? item : item?.message;
  const parsed = parseViolationItem(message);
  const tone = typeof item === 'object' && item?.tone ? item.tone : parsed.tone;
  const issueKey = typeof item === 'object' && item?.key ? item.key : '';
  const badgeLabel = parsed.tag || parsed.chip;
  const elementLabel = getIssueElementLabel(item, parsed);
  return `
    <button class="fds-list-item ${tone}" type="button" role="listitem" data-issue-key="${escapeHtml(issueKey)}" data-issue-number="${index + 1}" title="${escapeHtml(message)}">
      <span class="fds-list-index">${index + 1}</span>
      <span class="fds-list-label">
        <span class="fds-list-label-icon" aria-hidden="true">${renderAssetIcon('warning', 'warning')}</span>
        <span class="fds-list-label-text">
          <span class="fds-list-element">${escapeHtml(elementLabel)}</span>
          <span class="fds-list-status">${escapeHtml(badgeLabel)}</span>
        </span>
      </span>
      <span class="fds-list-value">${escapeHtml(parsed.value)}</span>
    </button>
  `;
}

function getSummaryListRenderKey(visibleItems) {
  return [
    activeFilter || 'idle',
    activeFilter === 'color' ? activeSummarySubtab : 'all',
    activeFilter === 'color' ? activeSummaryTone : 'all',
    visibleItems.map((item) => item.key).join('|'),
  ].join('::');
}

function updateSummaryUI() {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel) return;

  const vCount = scanData.violations.length;
  const sCount = scanData.suggestions.length;
  const activeColorToneCounts = activeFilter === 'color'
    ? getColorToneCountsForActiveSubtab()
    : { danger: scanData.colorBreakdown.missing, warning: scanData.colorBreakdown.primitiveRaw };
  const missingColorCount = activeColorToneCounts.danger;
  const primitiveColorCount = activeColorToneCounts.warning;
  const filterStats = [
    ['컬러', getViolationCountByFilter('color')],
    ['폰트', getViolationCountByFilter('font')],
    ['간격', getViolationCountByFilter('spacing')],
    ['라운드', getViolationCountByFilter('radius')],
  ];
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
  const isIdle = !activeFilter;
  const hasViolations = activeIssueEntries.length > 0;
  const summaryTitle = isIdle ? '검사 정보' : `${activeFilterLabel} 위반 정보`;
  const bridgeTokenContext = getBridgeTokenContextLabel();
  const loadingNoticeMarkup = isScanning
    ? `<div class="fds-summary-loading" role="status" aria-live="polite">${escapeHtml(scanStatusText || getScanStatusMessage())}</div>`
    : '';
  const colorTabs = activeFilter === 'color' ? getColorSummaryTabs() : [];
  const activeTabCount = activeFilter === 'color' ? colorTabs.length : filterStats.length;
  const activeTabIndex = activeFilter === 'color'
    ? Math.max(0, colorTabs.findIndex((tab) => tab.key === activeSummarySubtab))
    : Math.max(0, FILTER_KEYS.findIndex((key) => key === activeFilter));
  const hasActiveTab = activeFilter === 'color'
    ? colorTabs.some((tab) => tab.key === activeSummarySubtab)
    : FILTER_KEYS.includes(activeFilter);
  const visibleViolations = getVisibleIssueEntries();
  const visibleListItems = visibleViolations;
  const hasScrollableList = visibleViolations.length > 10;
  const previousList = panel.querySelector('.fds-summary-list');
  const previousListKey = panel.dataset.summaryListKey || '';
  const previousScrollTop = previousList ? previousList.scrollTop : 0;
  const nextListKey = getSummaryListRenderKey(visibleListItems);
  const listMarkup = !hasViolations
    ? ''
    : isIdle
    ? `<div class="fds-list-empty" role="note">툴바에서 컬러, 폰트, 간격, 라운드 중 하나를 선택하면 검사 결과가 여기에 표시됩니다.</div>`
    : visibleViolations.length > 0
      ? visibleListItems.map((item, index) => renderSummaryListItem(item, index)).join('')
      : `<div class="fds-list-empty" role="note">현재 위반 항목이 없습니다.</div>`;
  const cardRowMarkup = !hasViolations
    ? renderSummaryMetricCard({
        tone: 'success',
        label: '위반 없음',
        value: '0',
        caption: '검사 완료',
        icon: 'success',
      })
    : `
        ${activeFilter === 'color'
          ? renderSummaryMetricCard({
              tone: 'danger',
              label: '미등록 컬러',
              value: missingColorCount,
              caption: 'primitive 없음',
              isToggle: true,
              isActive: activeSummaryTone === 'danger',
            })
          : renderSummaryMetricCard({
              tone: 'danger',
              label: '위반 요소',
              value: vCount,
              caption: '현재 페이지',
            })}
        ${activeFilter === 'color'
          ? renderSummaryMetricCard({
              tone: 'warning',
              label: '원시값 직접 사용',
              value: primitiveColorCount,
              caption: 'primitive 동일값',
              isToggle: true,
              isActive: activeSummaryTone === 'warning',
            })
          : renderSummaryMetricCard({
              tone: 'success',
              label: '토큰 적용',
              value: sCount,
              caption: '토큰 기준',
              icon: 'success',
            })}
      `;
  const tabBarMarkup = activeFilter === 'color'
    ? colorTabs.map((tab) => `
        <button
          class="fds-summary-tab${activeSummarySubtab === tab.key ? ' active' : ''}${tab.count > 0 ? ' has-value' : ''}"
          type="button"
          data-summary-tab="${tab.key}"
        >
          <span>${tab.label}</span>
        </button>
      `).join('')
    : filterStats.map(([label, count], index) => {
        const filterKey = FILTER_KEYS[index];
        const isCurrent = activeFilter === filterKey;
        return `
          <button
            class="fds-summary-tab${isCurrent ? ' active' : ''}${count > 0 ? ' has-value' : ''}"
            type="button"
            data-filter="${filterKey}"
          >
            <span>${label}</span>
          </button>
        `;
      }).join('');

  panel.innerHTML = `
    <div class="fds-panel-head">
      <div class="fds-panel-title-wrap">
        <span class="fds-panel-title">${summaryTitle}</span>
        ${bridgeTokenContext ? `<span class="fds-panel-meta">${escapeHtml(bridgeTokenContext)}</span>` : ''}
      </div>
      <button class="fds-panel-close" type="button">${renderAssetIcon('close', 'close')}</button>
    </div>
    <section class="fds-summary-section" aria-label="요약 및 탐색">
      ${loadingNoticeMarkup}
      <div
        class="fds-summary-tabbar"
        style="--fds-summary-tab-count:${activeTabCount};--fds-summary-tab-index:${activeTabIndex};--fds-summary-tab-indicator-opacity:${hasActiveTab ? 1 : 0};"
      >
        <span class="fds-summary-tab-indicator" aria-hidden="true"></span>
        ${tabBarMarkup}
      </div>
      <div class="fds-summary-card-row${!hasViolations ? ' is-single' : ''}">
        ${cardRowMarkup}
      </div>
      ${hasViolations ? `
        <div class="fds-summary-list${hasScrollableList ? ' is-scrollable' : ''}" role="list" aria-label="위반 목록">
          ${listMarkup}
        </div>
      ` : ''}
    </section>
  `;
  panel.dataset.summaryListKey = nextListKey;
  const nextList = panel.querySelector('.fds-summary-list');
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
      openSummaryPanelForActiveFilter();
      updateSummaryUI();
    };
  });

  panel.querySelectorAll('.fds-summary-tab[data-summary-tab]').forEach((tab) => {
    tab.onclick = () => {
      if (isScanning) return;
      activeSummarySubtab = tab.dataset.summaryTab || 'bg';
      clearActiveViolationPin();
      updateSummaryUI();
    };
  });

  panel.querySelectorAll('.fds-stat-box[data-summary-tone]').forEach((card) => {
    card.onclick = () => {
      if (isScanning) return;
      activeSummaryTone = card.dataset.summaryTone === 'warning' ? 'warning' : 'danger';
      clearActiveViolationPin();
      updateSummaryUI();
    };
  });

  panel.querySelectorAll('.fds-list-item[data-issue-key]').forEach((item) => {
    if (item.dataset.issueKey === activePinnedIssueKey) {
      item.classList.add('is-pin-active');
    }

    const showPin = ({ locked = false } = {}) => {
      const issueKey = item.dataset.issueKey;
      const issueNumber = Number.parseInt(item.dataset.issueNumber || '0', 10);
      const entry = visibleListItems.find((candidate) => candidate.key === issueKey);
      if (!entry) return;
      setActiveViolationPin(entry, issueNumber, { locked });
      showInspectorCardForEntries(entry.element, [entry]);
      panel.querySelectorAll('.fds-list-item.is-pin-active').forEach((activeItem) => {
        activeItem.classList.remove('is-pin-active');
      });
      item.classList.add('is-pin-active');
    };

    item.onmouseenter = () => showPin();
    item.onfocus = () => showPin();
    item.onclick = () => {
      showPin({ locked: true });
      const entry = visibleListItems.find((candidate) => candidate.key === item.dataset.issueKey);
      scrollToIssueElement(entry);
    };
    item.onmouseleave = () => {
      if (lockedPinnedIssueKey) {
        restoreLockedViolationPin(visibleListItems);
        panel.querySelectorAll('.fds-list-item.is-pin-active').forEach((activeItem) => {
          activeItem.classList.toggle('is-pin-active', activeItem.dataset.issueKey === activePinnedIssueKey);
        });
      } else {
        clearViolationPins();
        activePinnedIssueKey = null;
        activePinnedIssueNumber = null;
        clearHoveredInspectionTarget();
        hideInspectorCard();
        item.classList.remove('is-pin-active');
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
}

document.addEventListener('mouseover', (event) => {
  if (event.target?.closest?.('#fds-root')) return;
  const target = getHoveredInspectionTarget(event);
  if (!target) {
    clearHoveredInspectionTarget();
    hideInspectorCard();
    return;
  }

  const issueEntries = getVisibleIssueEntriesForElement(target);
  if (!issueEntries.length) {
    clearHoveredInspectionTarget();
    hideInspectorCard();
    return;
  }

  showInspectorCardForEntries(target, issueEntries);
});

document.addEventListener('mouseout', (event) => {
  const relatedTarget = event.relatedTarget;
  if (event.target?.closest?.('#fds-root') || relatedTarget?.closest?.('#fds-root')) return;
  if (relatedTarget?.closest?.('.fds-inspected')) return;
  clearHoveredInspectionTarget();
  hideInspectorCard();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'alive' });
    return false;
  }

  if (request.action === 'RESCAN') {
    void loadTokenSourceFromStorage().then(() => {
      void refreshBridgeInspectorSpecs().catch(() => {
        bridgeInspectorSpecOverrides = null;
      }).finally(() => {
        void scan('페이지 위반 수를 다시 계산하는 중입니다.');
      });
      sendResponse({ status: 'success' });
    });
    return true;
  }

  if (request.action === 'TOKEN_SOURCE_UPDATED') {
    void loadTokenSourceFromStorage().then(() => {
      if (isExtensionVisible && !isDismissedByUser) {
        void scan('토큰 정보를 반영해 위반 수를 다시 계산하는 중입니다.');
        if (isSummaryPanelVisible()) {
          updateSummaryUI();
        }
      }
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

    if (!root && isVisible) {
      createUI();
      root = document.getElementById('fds-root');
    }

    if (root) {
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
      startBridgePolling();
      void scan('초기 검사 결과를 계산하는 중입니다.');
      void loadTokenSourceFromStorage().then(() => {
        if (!isExtensionVisible || isDismissedByUser) return;
        void checkBridgeConnection().catch(() => {});
        void refreshBridgeInspectorSpecs()
          .catch(() => {
            bridgeInspectorSpecOverrides = null;
            return { changed: false, connected: false };
          })
          .then(() => {
            if (isSummaryPanelVisible()) {
              updateSummaryUI();
            }
          });
      });
    }

    sendResponse({ status: 'success' });
  }
  return true;
});
