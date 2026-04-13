(function initBackgroundLogic(globalScope) {
  function isBridgeHealthy(payload) {
    return Boolean(
      payload &&
      payload.ok === true &&
      payload.server === 'writable-mcp-bridge' &&
      Array.isArray(payload.activePlugins) &&
      payload.activePlugins.length > 0
    );
  }

  function getBadgeText(isActive) {
    return isActive ? 'ON' : '';
  }

  const api = {
    isBridgeHealthy,
    getBadgeText,
  };

  globalScope.FDSBackgroundLogic = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
