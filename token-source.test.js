const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildTokenRegistry,
  extractColorTokenMap,
  normalizeHexColor,
} = require('./token-source.js');

test('normalizeHexColor converts rgb-like hex values to lowercase 6-digit hex', () => {
  assert.equal(normalizeHexColor('#FFF'), '#ffffff');
  assert.equal(normalizeHexColor('#F6F8FA'), '#f6f8fa');
  assert.equal(normalizeHexColor('rgb(0,0,0)'), null);
});

test('extractColorTokenMap reads FDS_TOKENS-like color objects', () => {
  const result = extractColorTokenMap({
    colors: {
      'Color/bg/secondary': { hex: '#F6F8FA' },
      'Color/text/primary': { value: '#252d38' },
    },
  });

  assert.deepEqual(result, {
    '#f6f8fa': ['Color/bg/secondary'],
    '#252d38': ['Color/text/primary'],
  });
});

test('extractColorTokenMap reads W3C style token objects recursively', () => {
  const result = extractColorTokenMap({
    Color: {
      bg: {
        secondary: { $value: '#f6f8fa' },
      },
      text: {
        primary: { value: '#252d38' },
      },
    },
  });

  assert.deepEqual(result, {
    '#f6f8fa': ['Color.bg.secondary'],
    '#252d38': ['Color.text.primary'],
  });
});

test('buildTokenRegistry deduplicates token names per resolved hex', () => {
  const registry = buildTokenRegistry({
    colors: {
      'Color/bg/secondary': { hex: '#f6f8fa' },
      'Alias/bg/table': { hex: '#f6f8fa' },
    },
  });

  assert.deepEqual(registry.colors['#f6f8fa'], [
    'Alias/bg/table',
    'Color/bg/secondary',
  ]);
});

test('buildTokenRegistry reads the token tree once', () => {
  let colorsReadCount = 0;
  const payload = {
    get colors() {
      colorsReadCount += 1;
      return {
        'Color/bg/secondary': { hex: '#f6f8fa' },
      };
    },
  };

  const registry = buildTokenRegistry(payload);

  assert.equal(colorsReadCount, 1);
  assert.equal(registry.meta.colorTokenCount, 1);
});
