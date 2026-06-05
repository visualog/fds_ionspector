const test = require('node:test');
const assert = require('node:assert/strict');

const manifest = require('./manifest.json');

test('manifest does not automatically inject inspector code into every page', () => {
  assert.equal(manifest.content_scripts, undefined);
});

test('manifest keeps host permissions limited to the local bridge', () => {
  assert.deepEqual(manifest.host_permissions, [
    'http://localhost:3846/*',
    'http://127.0.0.1:3846/*',
  ]);
});
