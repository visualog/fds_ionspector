import './background-logic.js';
import './bridge-token-source.js';

// background.js for FDS Inspector
let isActive = false;
let lastBridgeHealth = null;
const { deriveBridgeHealth, isBridgeHealthy, getBadgeText, shouldIgnoreToggleError } = globalThis.FDSBackgroundLogic;
const { buildBridgeColorRegistry, buildInspectorSpecOverrides } = globalThis.FDSBridgeTokenSource;
const BRIDGE_BASE_URL = 'http://127.0.0.1:3846';

function setBadgeText(tabId) {
  return chrome.action.setBadgeText({
    text: getBadgeText(isActive),
    tabId
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

  return {
    connected: true,
    pluginId,
    fileName: health?.payload?.session?.fileName || null,
    pageName: health?.payload?.session?.pageName || null,
    specs: {
      ...inspectorSpecs,
      colors: colorRegistry.colors,
      meta: {
        ...(inspectorSpecs.meta || {}),
        ...(colorRegistry.meta || {}),
      },
    },
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SET_ACTIVE") {
    isActive = Boolean(request.state);
    if (sender.tab?.id) {
      setBadgeText(sender.tab.id).catch(() => {});
    }
    sendResponse({ status: "success", state: isActive });
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

  return false;
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab?.id) {
    return;
  }

  const nextState = !isActive;

  // Send message to content script to toggle UI
  chrome.tabs.sendMessage(tab.id, { 
    action: "TOGGLE", 
    state: nextState
  }).then(() => {
    isActive = nextState;
    setBadgeText(tab.id).catch(() => {});
  }).catch(err => {
    if (shouldIgnoreToggleError(err)) {
      return;
    }
    console.error("Error sending toggle message:", err);
  });
});
