const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyCSSVariables,
  color,
  cssVariables,
  inspectorSpecs,
  radius,
  spacing,
  toolbar,
  typography,
} = require('./design-variables.js');

test('design variables expose the inspector runtime theme as CSS custom properties', () => {
  assert.equal(cssVariables['--fds-brand'], color.brand);
  assert.equal(cssVariables['--fds-radius-full'], radius.radiusFull);
  assert.equal(cssVariables['--fds-toolbar-button-size'], toolbar.buttonSize);
  assert.equal(cssVariables['--fds-font-family-base'], typography.fontFamilyBase);
});

test('inspector specs stay aligned with generated design scales', () => {
  assert.ok(inspectorSpecs.colors[color.brand]);
  assert.deepEqual(inspectorSpecs.spacing, [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 80, 144]);
  assert.ok(inspectorSpecs.radius.includes(radius.radius12));
  assert.equal(spacing.spacing16, 16);
  assert.equal(spacing.spacing2, 2);
  assert.equal(spacing.spacing6, 6);
  assert.equal(spacing.spacing144, 144);
});

test('applyCSSVariables writes custom properties to a style target', () => {
  const writes = [];
  const target = {
    style: {
      setProperty(name, value) {
        writes.push([name, value]);
      },
    },
  };

  applyCSSVariables(target, {
    '--fds-test-color': '#ffffff',
    '--fds-test-size': 12,
  });

  assert.deepEqual(writes, [
    ['--fds-test-color', '#ffffff'],
    ['--fds-test-size', '12'],
  ]);
});
