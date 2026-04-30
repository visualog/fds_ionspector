const test = require('node:test');
const assert = require('node:assert/strict');

const {
  deriveBridgeHealth,
  isBridgeHealthy,
  getBadgeText,
  shouldIgnoreToggleError,
} = require('./background-logic.js');

test('deriveBridgeHealth prefers activePlugins over stale reported plugin ids', () => {
  const result = deriveBridgeHealth({
    ok: true,
    server: 'writable-mcp-bridge',
    activePlugins: ['page:0:1'],
    activePluginId: 'page:9:9',
  });

  assert.equal(result.bridgeOnline, true);
  assert.equal(result.connected, true);
  assert.deepEqual(result.activePluginIds, ['page:0:1']);
  assert.equal(result.primaryActivePluginId, 'page:0:1');
  assert.equal(result.reportedPluginId, 'page:9:9');
  assert.equal(result.staleReportedPluginId, true);
});

test('deriveBridgeHealth accepts an explicit active session state even when activePlugins is empty', () => {
  const result = deriveBridgeHealth({
    ok: true,
    server: 'writable-mcp-bridge',
    activePlugins: [],
    sessionState: 'connected',
    observability: {
      sessions: {
        trackedTotal: 1,
      },
    },
  });

  assert.equal(result.bridgeOnline, true);
  assert.equal(result.connected, true);
  assert.equal(result.sessionState, 'connected');
  assert.equal(result.sessionStateIsActive, true);
  assert.deepEqual(result.activePluginIds, []);
});

test('deriveBridgeHealth marks legacy when bridge is connected without modern transport metadata', () => {
  const result = deriveBridgeHealth({
    ok: true,
    server: 'writable-mcp-bridge',
    activePlugins: ['page:0:1'],
  });

  assert.equal(result.connected, true);
  assert.equal(result.modernTransportMetadata, false);
  assert.equal(result.connectionTier, 'legacy');
  assert.equal(result.connectionSummary, '레거시 브리지 연결됨');
});

test('deriveBridgeHealth marks modern when transport metadata is present', () => {
  const result = deriveBridgeHealth({
    ok: true,
    server: 'writable-mcp-bridge',
    activePlugins: ['page:0:1'],
    transportCapabilities: { polling: true },
  });

  assert.equal(result.connected, true);
  assert.equal(result.modernTransportMetadata, true);
  assert.equal(result.connectionTier, 'modern');
  assert.equal(result.connectionSummary, '최신 브리지 연결됨');
});

test('isBridgeHealthy returns true only for a live writable bridge with a healthy session signal', () => {
  assert.equal(isBridgeHealthy({ ok: true, server: 'writable-mcp-bridge', activePlugins: ['page:0:1'] }), true);
  assert.equal(isBridgeHealthy({ ok: true, server: 'writable-mcp-bridge', activePlugins: [], sessionState: 'connected' }), true);
  assert.equal(isBridgeHealthy({ ok: true, server: 'writable-mcp-bridge', activePlugins: [] }), false);
  assert.equal(isBridgeHealthy({ ok: true, server: 'other', activePlugins: ['page:0:1'] }), false);
  assert.equal(isBridgeHealthy({ ok: false, server: 'writable-mcp-bridge', activePlugins: ['page:0:1'] }), false);
});

test('getBadgeText reflects active state only when enabled', () => {
  assert.equal(getBadgeText(true), 'ON');
  assert.equal(getBadgeText(false), '');
});

test('shouldIgnoreToggleError ignores missing receiver errors from unsupported tabs', () => {
  assert.equal(
    shouldIgnoreToggleError(new Error('Could not establish connection. Receiving end does not exist.')),
    true
  );
  assert.equal(
    shouldIgnoreToggleError(new Error('The message port closed before a response was received.')),
    true
  );
});

test('shouldIgnoreToggleError keeps unexpected toggle failures visible', () => {
  assert.equal(shouldIgnoreToggleError(new Error('Permission denied')), false);
  assert.equal(shouldIgnoreToggleError(null), false);
});
