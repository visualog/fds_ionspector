const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCssVariableRegistry,
  toStorybookCssVariableName,
} = require('./css-token-registry.js');

test('toStorybookCssVariableName converts Figma token paths to Storybook CSS variables', () => {
  assert.equal(toStorybookCssVariableName('Color/text/primary'), '--color-text-primary');
  assert.equal(toStorybookCssVariableName('Color/avatar/cool gray/bg-bold'), '--color-avatar-cool-gray-bg-bold');
  assert.equal(toStorybookCssVariableName('spacing/16'), '--spacing-16');
  assert.equal(toStorybookCssVariableName('radius/circle'), '--radius-circle');
});

test('buildCssVariableRegistry groups duplicate Storybook variables by original token name', () => {
  assert.deepEqual(
    buildCssVariableRegistry([
      'Color/text/primary',
      'color.text.primary',
      'spacing/16',
      'radius/circle',
      'Color/text/primary',
    ]),
    {
      variables: {
        '--color-text-primary': ['color.text.primary', 'Color/text/primary'],
        '--spacing-16': ['spacing/16'],
        '--radius-circle': ['radius/circle'],
      },
      meta: { cssVariableCount: 3 },
    },
  );
});

test('buildCssVariableRegistry ignores empty token names', () => {
  assert.deepEqual(buildCssVariableRegistry([null, '', '  ']), {
    variables: {},
    meta: { cssVariableCount: 0 },
  });
});
