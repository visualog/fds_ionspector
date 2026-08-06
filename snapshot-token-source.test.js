const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

require('./css-token-registry.js');

const {
  buildSnapshotTokenSpecs,
  normalizeSnapshotPayloads,
  resolveTokenValue,
} = require('./snapshot-token-source.js');

function readTokenFile(fileName) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'tokens', fileName), 'utf8'));
}

function readCollectionTokenFiles() {
  return {
    primitives: readTokenFile('0.1.primitives.json'),
    theme: readTokenFile('0.2.theme.json'),
    semantic: readTokenFile('1.0.semantic.json'),
  };
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

test('normalizeSnapshotPayloads preserves original Figma collection payloads', () => {
  const payloads = normalizeSnapshotPayloads(readCollectionTokenFiles());

  assert.equal(payloads.collections.length, 3);
  assert.deepEqual(
    payloads.collections.map((payload) => payload.collection.name),
    ['0.1. primitives', '0.2.theme*', '1.0.semantic']
  );
  assert.deepEqual(payloads.collections[1].modeNames, ['Fasoo', 'Wrapsody']);
  assert.deepEqual(payloads.collections[2].modeNames, ['Light', 'Dark']);
});

test('resolveTokenValue follows aliases across primitive and theme token maps', () => {
  const snapshot = normalizeSnapshotPayloads({
    mode: { light: { Blue: { 100: { value: '#252d38', type: 'color' } } } },
    fasoo: { color: { brand: { 100: { value: '{light.Blue.100}', type: 'color' } } } },
    light: {
      Color: {
        text: { primary: { value: '{color.brand.100}', type: 'color' } },
      },
      spacing: { 16: { value: '1rem', type: 'dimension' } },
    },
    dark: { Color: { text: { primary: { value: '#e2e2e2', type: 'color' } } } },
  });

  assert.equal(resolveTokenValue('Color.text.primary', snapshot, 'light'), '#252d38');
  assert.equal(resolveTokenValue('Color.text.primary', snapshot, 'dark'), '#e2e2e2');
  assert.equal(resolveTokenValue('spacing.16', snapshot, 'light'), '1rem');
});

test('buildSnapshotTokenSpecs creates inspector-compatible colors, spacing, and radius maps', () => {
  const specs = buildSnapshotTokenSpecs(readCollectionTokenFiles());

  assert.equal(specs.colors['#252d38'].includes('Color/text/primary'), true);
  assert.equal(specs.colors['#252d38'].includes('light/Blue/100'), true);
  assert.equal(specs.colors['#053e20'].includes('color/brand/100'), true);
  assert.equal(specs.colors['#053e20'].includes('light/Green/100'), true);
  assert.equal(specs.spacing.includes(0), true);
  assert.equal(specs.spacing.includes(16), true);
  assert.deepEqual(specs.spacingTokens[16], ['spacing/16']);
  assert.equal(specs.radius.includes('0px'), true);
  assert.equal(specs.radius.includes('4px'), true);
  assert.deepEqual(specs.radiusTokens['4px'], ['radius/4']);
  assert.deepEqual(specs.radiusTokens['9999px'], ['radius/circle']);
  assert.equal(specs.meta.source, 'snapshot');
  assert.equal(specs.meta.collectionCount, 3);
  assert.equal(specs.meta.spacingTokenCount, 18);
  assert.equal(specs.meta.radiusTokenCount, 10);
  assert.equal(specs.meta.unresolvedReferenceCount, 0);
  assert.equal(specs.cssVariables.variables['--color-bg-primary'].includes('Color/bg/primary'), true);
  assert.deepEqual(specs.cssVariables.variables['--spacing-16'], ['spacing/16']);
  assert.deepEqual(specs.cssVariables.variables['--radius-circle'], ['radius/circle']);
});
