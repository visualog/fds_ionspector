const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentBridgeSpecs } = require('./content-bridge-specs.js');

function createBridgeSpecs() {
  return createContentBridgeSpecs({
    formatTokenContextLabel: ({
      sourceName,
      pageName = '',
      colorCount,
      spacingCount,
      radiusCount,
      fallbackLabel,
    }) => `${fallbackLabel}:${sourceName}:${pageName}:${colorCount}/${spacingCount}/${radiusCount}`,
  });
}

test('bridge specs signature sorts token maps and color registries', () => {
  const bridgeSpecs = createBridgeSpecs();

  assert.equal(
    bridgeSpecs.getBridgeSpecStateSignature({
      pluginId: 'plugin-1',
      fileName: 'tokens.json',
      pageName: 'Page A',
      overrides: {
        spacing: [8, 4],
        radius: ['12px'],
        spacingTokens: {
          8: ['spacing.2'],
          4: ['spacing.1'],
        },
        radiusTokens: {
          '12px': ['radius.12'],
        },
      },
      colorRegistry: {
        colors: {
          '#fff': ['Color.bg', 'Color.bg'],
          '#000': ['Color.text'],
        },
      },
    }),
    JSON.stringify({
      pluginId: 'plugin-1',
      fileName: 'tokens.json',
      pageName: 'Page A',
      spacing: [8, 4],
      radius: ['12px'],
      spacingTokens: [['4', ['spacing.1']], ['8', ['spacing.2']]],
      radiusTokens: [['12px', ['radius.12']]],
      colors: [['#000', ['Color.text']], ['#fff', ['Color.bg']]],
    }),
  );
});

test('bridge specs normalize connected bridge token payloads', () => {
  const bridgeSpecs = createBridgeSpecs();

  assert.deepEqual(
    bridgeSpecs.normalizeBridgeInspectorSpecsResponse({
      connected: true,
      pluginId: 'plugin-2',
      fileName: 'tokens.json',
      pageName: 'Design Tokens',
      specs: {
        spacing: [4, 8],
        radius: [],
        colors: { '#1a202c': ['Color.text.primary'] },
        meta: { colorTokenCount: 1, colorVariableCount: 2 },
      },
    }),
    {
      connected: true,
      pluginId: 'plugin-2',
      fileName: 'tokens.json',
      pageName: 'Design Tokens',
      overrides: {
        spacing: [4, 8],
        radius: [],
        spacingTokens: {},
        radiusTokens: {},
        meta: { colorTokenCount: 1, colorVariableCount: 2 },
      },
      colorRegistry: {
        colors: { '#1a202c': ['Color.text.primary'] },
        meta: { colorTokenCount: 1, colorVariableCount: 2 },
      },
    },
  );
});

test('bridge specs normalize missing snapshot specs to an empty state', () => {
  const bridgeSpecs = createBridgeSpecs();

  assert.deepEqual(
    bridgeSpecs.normalizeSnapshotInspectorSpecsResponse({ status: 'error' }),
    {
      hasSpecs: false,
      fileName: null,
      overrides: null,
      colorRegistry: { colors: {}, meta: { colorTokenCount: 0 } },
    },
  );
});

test('bridge specs create next bridge refresh state without mutating runtime state', () => {
  const bridgeSpecs = createBridgeSpecs();

  assert.deepEqual(
    bridgeSpecs.createBridgeInspectorSpecsRefreshState(
      { status: 'error', connected: true },
      {
        activePluginId: 'existing-plugin',
        emptyColorRegistry: { colors: {}, meta: { colorTokenCount: 0, colorVariableCount: 0 } },
      },
    ),
    {
      connected: false,
      activePluginId: 'existing-plugin',
      fileName: null,
      pageName: null,
      overrides: null,
      colorRegistry: { colors: {}, meta: { colorTokenCount: 0, colorVariableCount: 0 } },
    },
  );

  assert.equal(
    bridgeSpecs.createBridgeInspectorSpecsRefreshState(null, { activePluginId: 'existing-plugin' }).activePluginId,
    null,
  );
});

test('bridge specs create next snapshot refresh state', () => {
  const bridgeSpecs = createBridgeSpecs();

  assert.deepEqual(
    bridgeSpecs.createSnapshotInspectorSpecsRefreshState({
      specs: {
        spacing: [4],
        radius: ['12px'],
        colors: { '#fff': ['Color.bg'] },
        meta: { colorTokenCount: 1 },
      },
    }),
    {
      hasSpecs: true,
      fileName: 'tokens/*.json',
      overrides: {
        spacing: [4],
        radius: ['12px'],
        spacingTokens: {},
        radiusTokens: {},
        meta: { colorTokenCount: 1 },
      },
      colorRegistry: {
        colors: { '#fff': ['Color.bg'] },
        meta: { colorTokenCount: 1 },
      },
      hasSnapshotTokenSource: true,
    },
  );
});

test('bridge specs render bridge or snapshot token context labels', () => {
  const bridgeSpecs = createBridgeSpecs();

  assert.equal(
    bridgeSpecs.getBridgeTokenContextLabel({
      isFigmaConnected: false,
      snapshotOverrides: { spacing: [4, 8], radius: ['12px'] },
      snapshotColorRegistry: { meta: { colorTokenCount: 3 } },
      snapshotFileName: 'snapshot.json',
    }),
    '저장된 토큰 기준:snapshot.json::3/2/1',
  );

  assert.equal(
    bridgeSpecs.getBridgeTokenContextLabel({
      isFigmaConnected: true,
      bridgeOverrides: { spacing: [4], radius: [] },
      bridgeColorRegistry: { meta: { colorTokenCount: 7 } },
      bridgeFileName: 'tokens.json',
      bridgePageName: 'Page A',
    }),
    '브리지 토큰 기준:tokens.json:Page A:7/1/0',
  );
});
