(function initContentBridgeSpecs(globalScope) {
  function createContentBridgeSpecs({ formatTokenContextLabel }) {
    function normalizeInspectorSpecOverrides(specs = {}) {
      return {
        spacing: Array.isArray(specs?.spacing) ? specs.spacing : [],
        radius: Array.isArray(specs?.radius) ? specs.radius : [],
        spacingTokens: specs?.spacingTokens && typeof specs.spacingTokens === 'object' ? specs.spacingTokens : {},
        radiusTokens: specs?.radiusTokens && typeof specs.radiusTokens === 'object' ? specs.radiusTokens : {},
        meta: specs?.meta || null,
      };
    }

    function normalizeColorRegistry(specs = {}, { includeVariables = false } = {}) {
      const meta = {
        colorTokenCount: Number(specs?.meta?.colorTokenCount || 0),
      };
      if (includeVariables) {
        meta.colorVariableCount = Number(specs?.meta?.colorVariableCount || 0);
      }
      return {
        colors: specs?.colors && typeof specs.colors === 'object' ? specs.colors : {},
        meta,
      };
    }

    function hasInspectorOverrides(overrides) {
      return Boolean(overrides?.spacing?.length || overrides?.radius?.length);
    }

    function normalizeBridgeInspectorSpecsResponse(response, { fallbackPluginId = null } = {}) {
      if (!response || response.status === 'error' || !response.connected) {
        return { connected: false };
      }
      const overrides = normalizeInspectorSpecOverrides(response?.specs);
      return {
        connected: true,
        pluginId: response.pluginId || fallbackPluginId || null,
        fileName: typeof response.fileName === 'string' ? response.fileName : null,
        pageName: typeof response.pageName === 'string' ? response.pageName : null,
        overrides: hasInspectorOverrides(overrides) ? overrides : null,
        colorRegistry: normalizeColorRegistry(response?.specs, { includeVariables: true }),
      };
    }

    function normalizeSnapshotInspectorSpecsResponse(response) {
      if (!response || response.status === 'error' || !response.specs) {
        return {
          hasSpecs: false,
          fileName: null,
          overrides: null,
          colorRegistry: { colors: {}, meta: { colorTokenCount: 0 } },
        };
      }
      return {
        hasSpecs: true,
        fileName: typeof response.fileName === 'string' ? response.fileName : 'tokens/*.json',
        overrides: normalizeInspectorSpecOverrides(response.specs),
        colorRegistry: normalizeColorRegistry(response.specs),
      };
    }

    function createBridgeInspectorSpecsRefreshState(response, {
      activePluginId = null,
      emptyColorRegistry = { colors: {}, meta: { colorTokenCount: 0, colorVariableCount: 0 } },
    } = {}) {
      const normalized = normalizeBridgeInspectorSpecsResponse(response, {
        fallbackPluginId: activePluginId,
      });
      if (!normalized.connected) {
        return {
          connected: false,
          activePluginId: response?.connected ? activePluginId : null,
          fileName: null,
          pageName: null,
          overrides: null,
          colorRegistry: emptyColorRegistry,
        };
      }

      return {
        connected: true,
        activePluginId: normalized.pluginId || activePluginId,
        fileName: normalized.fileName,
        pageName: normalized.pageName,
        overrides: normalized.overrides,
        colorRegistry: normalized.colorRegistry,
      };
    }

    function createSnapshotInspectorSpecsRefreshState(response) {
      const normalized = normalizeSnapshotInspectorSpecsResponse(response);
      return {
        hasSpecs: normalized.hasSpecs,
        fileName: normalized.fileName,
        overrides: normalized.hasSpecs ? normalized.overrides : null,
        colorRegistry: normalized.colorRegistry,
        hasSnapshotTokenSource: Boolean(normalized.hasSpecs),
      };
    }

    function getBridgeSpecStateSignature({
      pluginId = null,
      fileName = null,
      pageName = null,
      overrides = null,
      colorRegistry = null,
    } = {}) {
      const spacing = Array.isArray(overrides?.spacing) ? [...overrides.spacing] : [];
      const radius = Array.isArray(overrides?.radius) ? [...overrides.radius] : [];
      const spacingTokens = overrides?.spacingTokens && typeof overrides.spacingTokens === 'object'
        ? Object.entries(overrides.spacingTokens).sort()
        : [];
      const radiusTokens = overrides?.radiusTokens && typeof overrides.radiusTokens === 'object'
        ? Object.entries(overrides.radiusTokens).sort()
        : [];
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
        spacingTokens,
        radiusTokens,
        colors,
      });
    }

    function getBridgeTokenContextLabel({
      isFigmaConnected,
      snapshotOverrides,
      snapshotColorRegistry,
      snapshotFileName,
      bridgeOverrides,
      bridgeColorRegistry,
      bridgeFileName,
      bridgePageName,
    }) {
      if (!isFigmaConnected && snapshotOverrides) {
        return formatTokenContextLabel({
          sourceName: snapshotFileName || '저장된 토큰 스냅샷',
          colorCount: Number(snapshotColorRegistry?.meta?.colorTokenCount || 0),
          spacingCount: Number(snapshotOverrides?.spacing?.length || 0),
          radiusCount: Number(snapshotOverrides?.radius?.length || 0),
          fallbackLabel: '저장된 토큰 기준',
        });
      }
      if (!isFigmaConnected) return '';
      return formatTokenContextLabel({
        sourceName: bridgeFileName || '현재 연결 파일',
        pageName: bridgePageName || '',
        colorCount: Number(bridgeColorRegistry?.meta?.colorTokenCount || 0),
        spacingCount: Number(bridgeOverrides?.spacing?.length || 0),
        radiusCount: Number(bridgeOverrides?.radius?.length || 0),
        fallbackLabel: '브리지 토큰 기준',
      });
    }

    return {
      normalizeInspectorSpecOverrides,
      normalizeColorRegistry,
      normalizeBridgeInspectorSpecsResponse,
      normalizeSnapshotInspectorSpecsResponse,
      createBridgeInspectorSpecsRefreshState,
      createSnapshotInspectorSpecsRefreshState,
      getBridgeSpecStateSignature,
      getBridgeTokenContextLabel,
    };
  }

  const api = { createContentBridgeSpecs };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentBridgeSpecs = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
