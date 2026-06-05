const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  buildSnapshotTokenSpecs,
  normalizeSnapshotPayloads,
  resolveTokenValue,
} = require('./snapshot-token-source.js');

function readTokenFile(fileName) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens', fileName), 'utf8'));
}

test('normalizeSnapshotPayloads preserves primitives and theme payloads separately', () => {
  const payloads = normalizeSnapshotPayloads({
    mode: { Unit: { 4: { value: '0.25rem', type: 'dimension' } } },
    fasoo: { color: { brand: { 60: { value: '{light.Blue.60}', type: 'color' } } } },
    light: { Color: { text: { primary: { value: '{color.brand.60}', type: 'color' } } } },
    dark: { Color: { text: { primary: { value: '{dark.Gray.100}', type: 'color' } } } },
  });

  assert.equal(payloads.primitives.length, 2);
  assert.deepEqual(Object.keys(payloads.themes), ['light', 'dark']);
});

test('resolveTokenValue follows aliases across primitive and theme token maps', () => {
  const snapshot = normalizeSnapshotPayloads({
    mode: readTokenFile('mode.json'),
    fasoo: readTokenFile('Fasoo.json'),
    light: readTokenFile('Light.json'),
    dark: readTokenFile('Dark.json'),
  });

  assert.equal(resolveTokenValue('Color.text.primary', snapshot, 'light'), '#252d38');
  assert.equal(resolveTokenValue('Color.text.primary', snapshot, 'dark'), '#e2e2e2');
  assert.equal(resolveTokenValue('spacing.16', snapshot, 'light'), '1rem');
});

test('buildSnapshotTokenSpecs creates inspector-compatible colors, spacing, and radius maps', () => {
  const specs = buildSnapshotTokenSpecs({
    mode: readTokenFile('mode.json'),
    fasoo: readTokenFile('Fasoo.json'),
    light: readTokenFile('Light.json'),
    dark: readTokenFile('Dark.json'),
  });

  assert.equal(specs.colors['#252d38'].includes('Color.text.primary'), true);
  assert.equal(specs.colors['#252d38'].includes('light.Blue.100'), true);
  assert.equal(specs.colors['#e2e2e2'].includes('Color.text.primary'), true);
  assert.equal(specs.colors['#e2e2e2'].includes('dark.Gray.100'), true);
  assert.equal(specs.spacing.includes(16), true);
  assert.deepEqual(specs.spacingTokens[16], ['spacing.16']);
  assert.equal(specs.radius.includes('4px'), true);
  assert.deepEqual(specs.radiusTokens['4px'], ['radius.4']);
  assert.deepEqual(specs.radiusTokens['9999px'], ['radius.circle']);
  assert.equal(specs.meta.source, 'snapshot');
  assert.equal(specs.meta.themeCount, 2);
  assert.equal(specs.meta.unresolvedReferenceCount, 0);
});
