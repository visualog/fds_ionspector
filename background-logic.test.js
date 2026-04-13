const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isBridgeHealthy,
  getBadgeText,
} = require('./background-logic.js');

test('isBridgeHealthy returns true only for a live writable bridge with active plugins', () => {
  assert.equal(isBridgeHealthy({ ok: true, server: 'writable-mcp-bridge', activePlugins: ['page:0:1'] }), true);
  assert.equal(isBridgeHealthy({ ok: true, server: 'writable-mcp-bridge', activePlugins: [] }), false);
  assert.equal(isBridgeHealthy({ ok: true, server: 'other', activePlugins: ['page:0:1'] }), false);
  assert.equal(isBridgeHealthy({ ok: false, server: 'writable-mcp-bridge', activePlugins: ['page:0:1'] }), false);
});

test('getBadgeText reflects active state only when enabled', () => {
  assert.equal(getBadgeText(true), 'ON');
  assert.equal(getBadgeText(false), '');
});
