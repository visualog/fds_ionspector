import './background-logic.js';
import './css-token-registry.js';
import './bridge-token-source.js';
import './snapshot-token-source.js';

// background.js for FDS Inspector
let lastBridgeHealth = null;
const {
  CONTENT_SCRIPT_FILES,
  CONTENT_CSS_FILES,
  deriveBridgeHealth,
  isBridgeHealthy,
  getBadgeText,
  shouldIgnoreToggleError,
  canInjectIntoUrl,
} = globalThis.FDSBackgroundLogic;
const { buildBridgeColorRegistry, buildInspectorSpecOverrides } = globalThis.FDSBridgeTokenSource;
const { buildSnapshotTokenSpecs } = globalThis.FDSSnapshotTokenSource;
const BRIDGE_BASE_URL = 'http://127.0.0.1:3846';
const SNAPSHOT_TOKEN_FILES = Object.freeze({
  primitives: 'tokens/0.1.primitives.json',
  theme: 'tokens/0.2.theme.json',
  semantic: 'tokens/1.0.semantic.json',
});
const activeTabStates = new Map();
let snapshotTokenSpecsCache = null;

function mergeCssVariableRegistries(...registries) {
  const variables = {};
  registries.forEach((registry) => {
    const entries = registry?.variables && typeof registry.variables === 'object'
      ? Object.entries(registry.variables)
      : [];
    entries.forEach(([variableName, tokenNames]) => {
      if (!variables[variableName]) variables[variableName] = [];
      (Array.isArray(tokenNames) ? tokenNames : []).forEach((tokenName) => {
        if (!variables[variableName].includes(tokenName)) variables[variableName].push(tokenName);
      });
      variables[variableName].sort((left, right) => left.localeCompare(right));
    });
  });
  return {
    variables,
    meta: { cssVariableCount: Object.keys(variables).length },
  };
}

function getActiveState(tabId) {
  return activeTabStates.get(tabId) === true;
}

function setActiveState(tabId, state) {
  if (!tabId) return;
  if (state) {
    activeTabStates.set(tabId, true);
  } else {
    activeTabStates.delete(tabId);
  }
}

function setBadgeText(tabId, state = getActiveState(tabId)) {
  return chrome.action.setBadgeText({
    text: getBadgeText(state),
    tabId
  });
}

async function getContentScriptState(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    if (response?.status !== 'alive') {
      return { ready: false, visible: false, dismissed: false };
    }
    return {
      ready: true,
      visible: Boolean(response.visible),
      dismissed: Boolean(response.dismissed),
    };
  } catch (error) {
    if (shouldIgnoreToggleError(error)) {
      return { ready: false, visible: false, dismissed: false };
    }
    throw error;
  }
}

async function isContentScriptReady(tabId) {
  return (await getContentScriptState(tabId)).ready;
}

async function injectContentScript(tab) {
  if (!tab?.id || !canInjectIntoUrl(tab.url)) {
    throw new Error('This page does not allow FDS Inspector injection.');
  }

  if (await isContentScriptReady(tab.id)) {
    return;
  }

  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: CONTENT_CSS_FILES,
  });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: CONTENT_SCRIPT_FILES,
  });
}

async function fetchBridgeHealth() {
  try {
    const response = await fetch(`${BRIDGE_BASE_URL}/health`, { method: 'GET' });
    const payload = await response.json().catch(() => null);
    const bridgeHealth = deriveBridgeHealth(payload);
    lastBridgeHealth = bridgeHealth;
    return {
      ...bridgeHealth,
      connected: isBridgeHealthy(payload),
      payload
    };
  } catch (error) {
    return {
      connected: false,
      bridgeOnline: false,
      modernTransportMetadata: false,
      connectionTier: 'offline',
      connectionSummary: '브리지 연결 안 됨',
      connectionDetail: '브리지 연결이 끊겼거나 세션이 없습니다.',
      activePluginIds: [],
      activePluginCount: 0,
      primaryActivePluginId: null,
      reportedPluginId: null,
      staleReportedPluginId: false,
      sessionState: null,
      sessionStateIsActive: false,
      sessionStateIsInactive: false,
      trackedSessionCount: null,
      pendingCommands: null,
      pendingResults: null,
      error: error instanceof Error ? error.message : String(error),
      lastBridgeHealth
    };
  }
}

async function postBridgeJson(path, payload) {
  const response = await fetch(`${BRIDGE_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Bridge request failed: ${response.status}`);
  }

  return response.json();
}

async function readExtensionJson(path) {
  const response = await fetch(chrome.runtime.getURL(path), { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Snapshot token file request failed: ${path} (${response.status})`);
  }
  return response.json();
}

async function fetchSnapshotTokenSpecs() {
  if (snapshotTokenSpecsCache) {
    return snapshotTokenSpecsCache;
  }

  const entries = await Promise.all(
    Object.entries(SNAPSHOT_TOKEN_FILES).map(async ([key, path]) => [
      key,
      await readExtensionJson(path),
    ])
  );
  const payloads = Object.fromEntries(entries);
  const specs = buildSnapshotTokenSpecs(payloads);

  snapshotTokenSpecsCache = {
    connected: false,
    source: 'snapshot',
    fileName: 'tokens/*.json',
    pageName: null,
    specs,
  };

  return snapshotTokenSpecsCache;
}

async function fetchBridgeTokenSpecs() {
  const health = await fetchBridgeHealth();
  const pluginId = health.primaryActivePluginId || health.reportedPluginId;

  if (!health.connected || !pluginId) {
    return {
      connected: Boolean(health.connected),
      pluginId: pluginId || null,
      fileName: health?.payload?.session?.fileName || null,
      pageName: health?.payload?.session?.pageName || null,
      specs: null,
    };
  }

  const [spacingResult, radiusResult, variableDefsResult] = await Promise.all([
    postBridgeJson('/api/search-design-system', {
      pluginId,
      query: 'spacing/',
      maxResults: 200,
      kinds: ['variables'],
      sources: ['local-file'],
    }),
    postBridgeJson('/api/search-design-system', {
      pluginId,
      query: 'radius/',
      maxResults: 200,
      kinds: ['variables'],
      sources: ['local-file'],
    }),
    postBridgeJson('/api/get-variable-defs', {
      pluginId,
      maxDepth: 8,
      maxNodes: 500,
    }),
  ]);

  const inspectorSpecs = buildInspectorSpecOverrides({ spacingResult, radiusResult });
  const colorRegistry = buildBridgeColorRegistry(variableDefsResult);
  const cssVariables = mergeCssVariableRegistries(
    inspectorSpecs.cssVariables,
    colorRegistry.cssVariables
  );

  return {
    connected: true,
    pluginId,
    fileName: health?.payload?.session?.fileName || null,
    pageName: health?.payload?.session?.pageName || null,
    specs: {
      ...inspectorSpecs,
      colors: colorRegistry.colors,
      cssVariables,
      meta: {
        ...(inspectorSpecs.meta || {}),
        ...(colorRegistry.meta || {}),
        cssVariableCount: cssVariables.meta.cssVariableCount,
      },
    },
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SET_ACTIVE") {
    if (sender.tab?.id) {
      setActiveState(sender.tab.id, Boolean(request.state));
      setBadgeText(sender.tab.id).catch(() => {});
    }
    sendResponse({ status: "success", state: sender.tab?.id ? getActiveState(sender.tab.id) : false });
    return false;
  }

  if (request.action === "BRIDGE_HEALTH") {
    fetchBridgeHealth().then((result) => sendResponse({ ...result, lastBridgeHealth }));
    return true;
  }

  if (request.action === "BRIDGE_TOKEN_SPECS") {
    fetchBridgeTokenSpecs()
      .then((result) => sendResponse({ status: 'success', ...result }))
      .catch((error) => {
        sendResponse({
          status: 'error',
          connected: false,
          specs: null,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return true;
  }

  if (request.action === "SNAPSHOT_TOKEN_SPECS") {
    fetchSnapshotTokenSpecs()
      .then((result) => sendResponse({ status: 'success', ...result }))
      .catch((error) => {
        sendResponse({
          status: 'error',
          connected: false,
          source: 'snapshot',
          specs: null,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return true;
  }

  return false;
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) {
    return;
  }

  let nextState = true;

  getContentScriptState(tab.id)
    .then((contentState) => {
      nextState = contentState.ready ? !contentState.visible : true;
      return injectContentScript(tab);
    })
    .then(() => chrome.tabs.sendMessage(tab.id, {
      action: "TOGGLE",
      state: nextState
    }))
    .then((response) => {
      setActiveState(tab.id, response?.visible ?? nextState);
      setBadgeText(tab.id).catch(() => {});
    })
    .catch(err => {
      if (shouldIgnoreToggleError(err)) {
        return;
      }
      console.error("Error toggling FDS Inspector:", err);
    });
});
