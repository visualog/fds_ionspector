const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentTheme } = require('./content-theme.js');

function createStyleTarget() {
  const values = {};
  return {
    values,
    style: {
      setProperty(name, value) {
        values[name] = value;
      },
    },
  };
}

test('applyThemeVariables delegates to generated design variables when available', () => {
  const target = createStyleTarget();
  let calledWith = null;
  const theme = createContentTheme({
    designVariables: {
      applyCSSVariables(root) {
        calledWith = root;
      },
    },
    cssVariables: { '--fallback': 'unused' },
  });

  theme.applyThemeVariables(target);

  assert.equal(calledWith, target);
  assert.deepEqual(target.values, {});
});

test('applyToolbarSpecVariables writes toolbar geometry and variant CSS variables', () => {
  const target = createStyleTarget();
  const theme = createContentTheme({
    designVariables: null,
    cssVariables: {},
    toolbarModes: {
      DEFAULT: 'default',
      CONNECTED_MESSAGE: 'connected',
      DISCONNECTED_MESSAGE: 'disconnected',
    },
    toolbarSpec: {
      geometry: {
        padding: 8,
        itemSpacing: 16,
        buttonSize: 32,
        dividerHeight: 19,
        collapsedWidth: 48,
      },
      variants: {
        default: { width: 336 },
        connected: { width: 310 },
        disconnected: { width: 401, statusWidth: 257 },
      },
    },
  });

  theme.applyToolbarSpecVariables(target);

  assert.equal(target.values['--fds-toolbar-padding'], '8px');
  assert.equal(target.values['--fds-toolbar-default-width'], '336px');
  assert.equal(target.values['--fds-toolbar-disconnected-status-width'], '257px');
});
