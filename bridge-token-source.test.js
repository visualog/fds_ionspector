const test = require('node:test');
const assert = require('node:assert/strict');

require('./css-token-registry.js');

const {
  buildBridgeColorRegistry,
  buildInspectorSpecOverrides,
} = require('./bridge-token-source.js');

test('buildInspectorSpecOverrides extracts spacing and radius specs from bridge search results', () => {
  const overrides = buildInspectorSpecOverrides({
    spacingResult: {
      result: {
        matches: [
          { name: 'spacing/0' },
          { name: 'spacing/2' },
          { name: 'spacing/6' },
          { name: 'spacing/144' },
        ],
      },
    },
    radiusResult: {
      result: {
        matches: [
          { name: 'radius/0' },
          { name: 'radius/6' },
          { name: 'radius/12' },
          { name: 'radius/circle' },
        ],
      },
    },
  });

  assert.deepEqual(overrides.spacing, [0, 2, 6, 144]);
  assert.deepEqual(overrides.radius, ['0px', '6px', '12px', '9999px']);
  assert.deepEqual(overrides.spacingTokens[6], ['spacing/6']);
  assert.deepEqual(overrides.radiusTokens['12px'], ['radius/12']);
  assert.deepEqual(overrides.radiusTokens['9999px'], ['radius/circle']);
  assert.deepEqual(overrides.cssVariables.variables, {
    '--spacing-0': ['spacing/0'],
    '--spacing-2': ['spacing/2'],
    '--spacing-6': ['spacing/6'],
    '--spacing-144': ['spacing/144'],
    '--radius-0': ['radius/0'],
    '--radius-6': ['radius/6'],
    '--radius-12': ['radius/12'],
    '--radius-circle': ['radius/circle'],
  });
});

test('buildInspectorSpecOverrides tolerates direct match payloads and invalid names', () => {
  const overrides = buildInspectorSpecOverrides({
    spacingResult: {
      matches: [
        { name: 'spacing/4' },
        { name: 'spacing/not-a-number' },
        { name: 'other/10' },
      ],
    },
    radiusResult: {
      matches: [
        { name: 'radius/2' },
        { name: 'radius/10' },
      ],
    },
  });

  assert.deepEqual(overrides.spacing, [4]);
  assert.deepEqual(overrides.radius, ['2px', '10px']);
});

test('buildBridgeColorRegistry builds hex registry from direct color values and aliases', () => {
  const registry = buildBridgeColorRegistry({
    result: {
      variables: [
        {
          id: 'raw-green',
          name: 'color/avatar/green/50',
          resolvedType: 'COLOR',
          valuesByMode: {
            Light: { red: 65, green: 198, blue: 160, alpha: 1, hex: '#41C6A0' },
          },
        },
        {
          id: 'semantic-green',
          name: 'Color/avatar/green/bg',
          resolvedType: 'COLOR',
          valuesByMode: {
            Light: { type: 'VARIABLE_ALIAS', id: 'raw-green' },
          },
        },
        {
          id: 'semantic-primary',
          name: 'Color/text/primary',
          resolvedType: 'COLOR',
          valuesByMode: {
            Light: { red: 15, green: 19, blue: 26, alpha: 1, hex: '#0F131A' },
            Dark: { type: 'VARIABLE_ALIAS', id: 'raw-green' },
          },
        },
      ],
    },
  });

  assert.deepEqual(registry.colors['#41c6a0'], [
    'color/avatar/green/50',
    'Color/avatar/green/bg',
    'Color/text/primary',
  ]);
  assert.deepEqual(registry.colors['#0f131a'], ['Color/text/primary']);
  assert.equal(registry.meta.colorVariableCount, 3);
  assert.deepEqual(registry.cssVariables.variables, {
    '--color-avatar-green-50': ['color/avatar/green/50'],
    '--color-avatar-green-bg': ['Color/avatar/green/bg'],
    '--color-text-primary': ['Color/text/primary'],
  });
});
