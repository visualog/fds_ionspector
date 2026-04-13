import './background-logic.js';

// background.js for FDS Inspector
let isActive = false;
const { isBridgeHealthy, getBadgeText } = globalThis.FDSBackgroundLogic;

function setBadgeText(tabId) {
  return chrome.action.setBadgeText({
    text: getBadgeText(isActive),
    tabId
  });
}

async function fetchBridgeHealth() {
  try {
    const response = await fetch('http://127.0.0.1:3846/health', { method: 'GET' });
    const payload = await response.json().catch(() => null);
    return {
      connected: isBridgeHealthy(payload),
      payload
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
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
    fetchBridgeHealth().then((result) => sendResponse(result));
    return true;
  }

  return false;
});

chrome.action.onClicked.addListener((tab) => {
  const nextState = !isActive;

  // Send message to content script to toggle UI
  chrome.tabs.sendMessage(tab.id, { 
    action: "TOGGLE", 
    state: nextState
  }).then(() => {
    isActive = nextState;
    setBadgeText(tab.id).catch(() => {});
  }).catch(err => {
    console.error("Error sending toggle message:", err);
  });
});
