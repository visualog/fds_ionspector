const {
  BUTTON_META,
  DEFAULT_FILTER,
  FILTER_KEYS,
  TOOLBAR_MODES,
  countViolationsByFilter,
  createToolbarModel,
  getPresentationMode,
  getNextToolbarMode,
  getNextActiveFilter,
  getFigmaToolbarAxes,
  normalizeActiveFilter,
} = globalThis.FDSToolbarState;

const FDS_BUILD = '2026-04-13-dev3';
const BRIDGE_POLL_INTERVAL_MS = 3000;
const FDS_THEME = {
  bgPrimary: '#0f131a',
  bgSecondary: '#10141b',
  textPrimary: 'rgba(255,255,255,0.96)',
  textSecondary: 'rgba(255,255,255,0.58)',
  textMain: '#ffffff',
  brand: '#2f6ff3',
  toolbarBg: '#080a0e',
  toolbarBorder: 'rgba(255,255,255,0.08)',
  toolbarDivider: 'rgba(255,255,255,0.16)',
  toolbarIconMuted: 'rgba(255,255,255,0.75)',
  toolbarIconStrong: 'rgba(255,255,255,0.95)',
  plugConnected: '#19d3aa',
  plugDisconnected: '#ff5e5e',
  badge: '#f35b4f',
  radiusFull: '9999px',
  radiusCard: '12px',
};

const FDS_SPECS = {
  colors: {
    '#ffffff': 'White',
    '#000000': 'Black',
    '#2f6ff3': 'Brand/Blue',
    '#f35b4f': 'Feedback/Error',
    '#19d3aa': 'Feedback/Connected',
  },
  fonts: ['Pretendard', 'Noto Sans KR', 'Noto Sans'],
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48],
  radius: ['4px', '6px', '8px', '10px', '12px', '16px', '9999px'],
};

const ICON_PATHS = {
  color: 'assets/ic_tool_color.svg',
  font: 'assets/ic_tool_font.svg',
  spacing: 'assets/ic_tool_spacing.svg',
  radius: 'assets/ic_tool_round.svg',
  refresh: 'assets/ic_tool_rescan.svg',
  close: 'assets/ic_tool_close.svg',
  plug: 'assets/ic_tool_unplug.svg',
  plugConnected: 'assets/ic_tool_plug_connected.svg',
};

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

function ensureValidActiveFilter() {
  activeFilter = normalizeActiveFilter(activeFilter);
}

function setActiveFilter(nextFilter) {
  activeFilter = normalizeActiveFilter(nextFilter);
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
    suggestions: [],
    counts: {
      color: 0,
      font: 0,
      spacing: 0,
      radius: 0,
    },
  };
}

function recordIssue(category, message, issues) {
  issues.push(message);
  if (scanData.counts && typeof scanData.counts[category] === 'number') {
    scanData.counts[category] += 1;
  }
}

function applyThemeVariables() {
  const root = document.documentElement;
  root.style.setProperty('--fds-bg-primary', FDS_THEME.bgPrimary);
  root.style.setProperty('--fds-bg-secondary', FDS_THEME.bgSecondary);
  root.style.setProperty('--fds-text-primary', FDS_THEME.textPrimary);
  root.style.setProperty('--fds-text-secondary', FDS_THEME.textSecondary);
  root.style.setProperty('--fds-text-main', FDS_THEME.textMain);
  root.style.setProperty('--fds-brand', FDS_THEME.brand);
  root.style.setProperty('--fds-toolbar-bg', FDS_THEME.toolbarBg);
  root.style.setProperty('--fds-toolbar-border', FDS_THEME.toolbarBorder);
  root.style.setProperty('--fds-toolbar-divider', FDS_THEME.toolbarDivider);
  root.style.setProperty('--fds-toolbar-icon-muted', FDS_THEME.toolbarIconMuted);
  root.style.setProperty('--fds-toolbar-icon-strong', FDS_THEME.toolbarIconStrong);
  root.style.setProperty('--fds-plug-connected', FDS_THEME.plugConnected);
  root.style.setProperty('--fds-plug-disconnected', FDS_THEME.plugDisconnected);
  root.style.setProperty('--fds-badge', FDS_THEME.badge);
  root.style.setProperty('--fds-radius-full', FDS_THEME.radiusFull);
  root.style.setProperty('--fds-radius-card', FDS_THEME.radiusCard);
}

function renderAssetIcon(kind, alt) {
  const src = chrome.runtime.getURL(ICON_PATHS[kind] || ICON_PATHS.close);
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
  const attrs = [
    `id="${button.id}"`,
    'class="fds-btn' + (button.extraClass ? ` ${button.extraClass}` : '') + (button.active ? ' active' : '') + (button.dot ? ' has-dot' : '') + '"',
    `type="button"`,
    `title="${button.title || ''}"`,
    `data-kind="${button.kind}"`,
  ];

  if (button.filter) attrs.push(`data-filter="${button.filter}"`);
  if (button.active) attrs.push('data-state="active"');
  if (button.badge) attrs.push(`data-badge="${button.badge}"`);

  return `<button ${attrs.join(' ')}>${renderAssetIcon(button.kind, button.title || button.kind)}</button>`;
}

function renderToolbarModelItem(item, model) {
  if (item.type === 'static') {
    return `<div id="${item.id}" class="fds-btn-static">${renderAssetIcon(item.kind, item.kind)}</div>`;
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
  if (!panel || !isExtensionVisible || isDismissedByUser) return;
  updateSummaryUI();
  panel.style.display = 'block';
}

function hideSummaryPanel() {
  const panel = document.getElementById('fds-summary-panel');
  if (panel) panel.style.display = 'none';
}

function isSummaryPanelVisible() {
  const panel = document.getElementById('fds-summary-panel');
  return panel?.style.display === 'block';
}

function hideInspectorCard() {
  const card = document.getElementById('fds-inspector-card');
  if (card) card.style.display = 'none';
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
  chrome.runtime.sendMessage({ action: 'SET_ACTIVE', state: false }).catch(() => {
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'SET_ACTIVE', state: false }).catch(() => {});
    }, 150);
  });
}

function getToolbarModel() {
  const mode = getPresentationMode(
    toolbarMode,
    typeof window !== 'undefined' ? window.innerWidth : Number.POSITIVE_INFINITY
  );

  return createToolbarModel({
    mode,
    activeFilter,
    isFigmaConnected,
    scanData,
  });
}

function syncToolbar() {
  const root = document.getElementById('fds-root');
  const toolbar = document.getElementById('fds-toolbar');
  if (!root || !toolbar) return;

  const model = getToolbarModel();
  const markup = renderToolbarMarkup(model).trim();
  root.dataset.toolbarMode = model.mode;
  toolbar.dataset.variant = model.mode;
  toolbar.style.setProperty('--fds-toolbar-width', `${model.width}px`);
  toolbar.style.setProperty('--fds-toolbar-status-width', model.statusWidth ? `${model.statusWidth}px` : 'auto');

  if (toolbar.innerHTML.trim() !== markup) {
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
    el.classList.remove('fds-inspected', 'fds-violation');
    el.removeAttribute('data-fds-msg');
    el.removeAttribute('data-fds-type');
  });
  scanData = createEmptyScanData();
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
    const response = await chrome.runtime.sendMessage({ action: 'BRIDGE_HEALTH' });
    isFigmaConnected = Boolean(response?.connected);
  } catch (error) {
    isFigmaConnected = false;
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
  document.querySelectorAll('#fds-root [data-filter]').forEach((btn) => {
    btn.onclick = () => {
      setActiveFilter(getNextActiveFilter(activeFilter, btn.dataset.filter));
      scan();
      updateToolbarIndicators();
      showSummaryPanel();
    };

    btn.onmouseenter = () => {
      const root = document.getElementById('fds-root');
      if (root?.dataset.toolbarMode !== TOOLBAR_MODES.DEFAULT) {
        hideTooltip();
        return;
      }

      const labelMap = {
        color: '컬러',
        font: '폰트',
        spacing: '간격',
        radius: '라운드',
      };

      const tooltip = ensureTooltip();
      tooltip.textContent = labelMap[btn.dataset.filter] || '';
      const rect = btn.getBoundingClientRect();
      tooltip.style.display = 'block';
      const tooltipHeight = tooltip.offsetHeight || 36;
      placeFloatingElement(
        tooltip,
        window.scrollX + rect.left + rect.width / 2,
        window.scrollY + rect.top - tooltipHeight - 18
      );
    };

    btn.onmouseleave = () => {
      hideTooltip();
    };
  });

  const refreshBtn = document.getElementById('fds-btn-refresh');
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      if (!isExtensionVisible || isDismissedByUser) return;
      scan();
      checkBridgeConnection();
      showSummaryPanel();
    };
  }

  const closeBtn = document.getElementById('fds-btn-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      dismissToolbar();
    };
  }

  const panelCloseBtn = document.querySelector('#fds-summary-panel .fds-panel-close');
  if (panelCloseBtn) {
    panelCloseBtn.onclick = () => {
      hideSummaryPanel();
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
  root.innerHTML = `
    <div id="fds-toolbar" class="fds-toolbar" role="toolbar" aria-label="FDS Inspector toolbar"></div>
    <div id="fds-summary-panel" class="fds-summary-card" style="display:none;"></div>
    <div id="fds-inspector-card" class="fds-card" style="display:none;"></div>
  `;
  document.body.appendChild(root);

  bindViewportEvents();
  syncToolbar();
}

function bindViewportEvents() {
  if (hasBoundViewportEvents) return;
  hasBoundViewportEvents = true;

  window.addEventListener('resize', () => {
    if (!isExtensionVisible || isDismissedByUser) return;
    syncToolbar();
    hideTooltip();
    hideInspectorCard();
    if (isSummaryPanelVisible()) {
      updateSummaryUI();
    }
  });

  window.addEventListener('scroll', () => {
    if (!isExtensionVisible || isDismissedByUser) return;
    hideTooltip();
    hideInspectorCard();
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (!isExtensionVisible || isDismissedByUser) return;
    if (event.key !== 'Escape') return;
    hideTooltip();
    hideInspectorCard();
    if (isSummaryPanelVisible()) {
      hideSummaryPanel();
      event.stopPropagation();
    }
  });
}

function scan() {
  ensureValidActiveFilter();
  scanData = createEmptyScanData();
  clearInspectionMarks();
  if (!activeFilter) {
    updateToolbarIndicators();
    if (isSummaryPanelVisible()) {
      updateSummaryUI();
    }
    return;
  }

  document.querySelectorAll('body *:not(#fds-root *)').forEach(validate);
  updateToolbarIndicators();
  if (isSummaryPanelVisible()) {
    updateSummaryUI();
  }
}

function clearInspectionMarks() {
  document.querySelectorAll('.fds-inspected, .fds-violation').forEach((el) => {
    el.classList.remove('fds-inspected', 'fds-violation');
    el.removeAttribute('data-fds-msg');
    el.removeAttribute('data-fds-type');
  });
}

function validate(el) {
  const styles = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;

  const issues = [];
  const suggestions = [];

  if (activeFilter === 'color') {
    const bg = rgbToHex(styles.backgroundColor);
    const text = rgbToHex(styles.color);
    if (bg && !FDS_SPECS.colors[bg]) recordIssue('color', `배경색 ${bg} (미등록)`, issues);
    else if (bg) suggestions.push(`배경 '${FDS_SPECS.colors[bg]}'`);
    if (text && !FDS_SPECS.colors[text]) recordIssue('color', `글자색 ${text} (미등록)`, issues);
    else if (text) suggestions.push(`글자 '${FDS_SPECS.colors[text]}'`);
  } else if (activeFilter === 'font') {
    const font = styles.fontFamily.split(',')[0].replace(/"/g, '');
    if (!FDS_SPECS.fonts.some((item) => font.includes(item))) {
      recordIssue('font', `서체 '${font}' (차단)`, issues);
    }
  } else if (activeFilter === 'spacing') {
    const pt = Number.parseInt(styles.paddingTop, 10);
    if (pt > 0 && !FDS_SPECS.spacing.includes(pt)) {
      recordIssue('spacing', `상단 패딩 ${pt}px (비규격)`, issues);
    }
  } else if (activeFilter === 'radius') {
    const radius = styles.borderRadius;
    if (radius !== '0px' && !FDS_SPECS.radius.includes(radius)) {
      recordIssue('radius', `라운드 ${radius} (미준수)`, issues);
    }
  }

  issues.forEach((issue) => scanData.violations.push(issue));
  suggestions.forEach((suggestion) => scanData.suggestions.push(suggestion));

  if (issues.length > 0 || suggestions.length > 0) {
    el.classList.add('fds-inspected');
    if (issues.length > 0) el.classList.add('fds-violation');
    el.setAttribute('data-fds-msg', JSON.stringify([...issues, ...suggestions]));
    el.setAttribute('data-fds-type', issues.length > 0 ? 'error' : 'success');
  } else {
    el.classList.remove('fds-inspected', 'fds-violation');
  }
}

function updateSummaryUI() {
  const panel = document.getElementById('fds-summary-panel');
  if (!panel) return;

  const vCount = scanData.violations.length;
  const sCount = scanData.suggestions.length;
  const filterStats = [
    ['컬러', getViolationCountByFilter('color')],
    ['폰트', getViolationCountByFilter('font')],
    ['간격', getViolationCountByFilter('spacing')],
    ['라운드', getViolationCountByFilter('radius')],
  ];
  const connectionLabel = isFigmaConnected ? '연결됨' : '연결 안 됨';
  const connectionClass = isFigmaConnected ? 'ok' : 'warn';
  const bridgeFeedback = isFigmaConnected
    ? 'health/metadata 정상, detail fallback 여부는 별도 확인 필요'
    : 'health 연결 안 됨 또는 브리지 미실행';
  const filterLabelMap = {
    color: '컬러',
    font: '폰트',
    spacing: '간격',
    radius: '라운드',
  };
  const activeFilterLabel = activeFilter ? (filterLabelMap[activeFilter] || activeFilter) : '대기';
  const modeLabelMap = {
    [TOOLBAR_MODES.DEFAULT]: '기본',
    [TOOLBAR_MODES.CONNECTED_MESSAGE]: '연결 메시지',
    [TOOLBAR_MODES.DISCONNECTED_MESSAGE]: '미연결 메시지',
    [TOOLBAR_MODES.COMPACT]: '컴팩트',
    [TOOLBAR_MODES.SINGLE_BUTTON]: '싱글 버튼',
  };
  const presentedMode = getPresentationMode(
    toolbarMode,
    typeof window !== 'undefined' ? window.innerWidth : Number.POSITIVE_INFINITY
  );
  const modeLabel = modeLabelMap[presentedMode] || '기본';
  const figmaAxes = getFigmaToolbarAxes({
    mode: presentedMode,
    activeFilter,
    isFigmaConnected,
    scanData,
  });
  const topViolations = [...new Set(scanData.violations)].slice(0, 8);
  const isIdle = !activeFilter;
  const listMarkup = isIdle
    ? `<div class="fds-list-empty">툴바에서 컬러, 폰트, 간격, 라운드 중 하나를 선택하면 검사 결과가 여기에 표시됩니다.</div>`
    : topViolations.length > 0
      ? topViolations.map((item) => `<div class="fds-list-item">• ${item}</div>`).join('')
      : `<div class="fds-list-empty">현재 위반 항목이 없습니다.</div>`;

  panel.innerHTML = `
    <div class="fds-panel-head">
      <div class="fds-panel-title-wrap">
        <span class="fds-panel-title">FDS Inspector</span>
        <span class="fds-panel-subtitle">${activeFilter ? `${activeFilter.toUpperCase()} 검사` : '검사 대기'}</span>
      </div>
      <button class="fds-panel-close" type="button">${renderAssetIcon('close', 'close')}</button>
    </div>
    <div class="fds-panel-body">
      <div class="fds-state-row">
        <span class="fds-state-chip ${connectionClass}">브리지 ${connectionLabel}</span>
        <span class="fds-state-chip neutral">필터 ${activeFilterLabel}</span>
        <span class="fds-state-chip neutral">모드 ${modeLabel}</span>
      </div>
      <div class="fds-bridge-feedback">${bridgeFeedback}</div>
      <div class="fds-figma-axes">
        ${Object.entries(figmaAxes).map(([key, value]) => `<div class="fds-axis-chip"><span>${key}</span><strong>${value}</strong></div>`).join('')}
      </div>
      <div class="fds-summary-stat">
        <div class="fds-stat-box danger">
          <div class="fds-stat-num">${vCount}</div>
          <div class="fds-stat-label">Violation</div>
        </div>
        <div class="fds-stat-box success">
          <div class="fds-stat-num">${sCount}</div>
          <div class="fds-stat-label">Token OK</div>
        </div>
      </div>
      <div class="fds-filter-breakdown">
        ${filterStats.map(([label, count]) => `<div class="fds-filter-chip${count > 0 ? ' has-value' : ''}"><span>${label}</span><strong>${count}</strong></div>`).join('')}
      </div>
      <div class="fds-summary-list">
        ${listMarkup}
        ${!isIdle && vCount > 8 ? `<div class="fds-list-more">외 ${vCount - 8}건</div>` : ''}
      </div>
    </div>
  `;

  const panelCloseBtn = panel.querySelector('.fds-panel-close');
  if (panelCloseBtn) {
    panelCloseBtn.onclick = () => {
      hideSummaryPanel();
    };
  }
}

document.addEventListener('mouseover', (event) => {
  const target = event.target.closest('.fds-inspected');
  const card = document.getElementById('fds-inspector-card');
  if (!target || !card) {
    hideInspectorCard();
    return;
  }

  const issues = JSON.parse(target.getAttribute('data-fds-msg') || '[]');
  const type = target.getAttribute('data-fds-type');
  const toneClass = type === 'error' ? 'danger' : 'success';
  const toneLabel = type === 'error' ? '위반 감지' : '정상';
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
});

document.addEventListener('mouseout', (event) => {
  const relatedTarget = event.relatedTarget;
  if (relatedTarget?.closest?.('.fds-inspected')) return;
  hideInspectorCard();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    } else {
      startBridgePolling();
      checkBridgeConnection();
      scan();
    }

    sendResponse({ status: 'success' });
  }
  return true;
});
