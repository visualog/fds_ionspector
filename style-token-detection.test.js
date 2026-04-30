const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hasAuthoredTokenReference,
  isCssVariableReference,
} = require('./style-token-detection.js');

function createStyle(declarations = {}) {
  return {
    getPropertyValue(property) {
      return declarations[property] || '';
    },
  };
}

test('isCssVariableReference detects authored CSS variable values', () => {
  assert.equal(isCssVariableReference('var(--chakra-colors-bg-secondary)'), true);
  assert.equal(isCssVariableReference('linear-gradient(var(--fds-a), #fff)'), true);
  assert.equal(isCssVariableReference('#f6f8fa'), false);
});

test('hasAuthoredTokenReference detects matching rule declarations', () => {
  const element = {
    matches(selector) {
      return selector === '.css-w8qnm2';
    },
  };
  const root = {
    styleSheets: [
      {
        cssRules: [
          {
            selectorText: '.css-w8qnm2',
            style: createStyle({
              background: 'var(--chakra-colors-bg-secondary)',
            }),
          },
        ],
      },
    ],
  };

  assert.equal(
    hasAuthoredTokenReference(element, ['background-color', 'background'], root),
    true
  );
});

test('hasAuthoredTokenReference lets later literal declarations override earlier token declarations', () => {
  const element = {
    matches(selector) {
      return selector === '.target';
    },
  };
  const root = {
    styleSheets: [
      {
        cssRules: [
          {
            selectorText: '.target',
            style: createStyle({ background: 'var(--chakra-colors-bg-secondary)' }),
          },
          {
            selectorText: '.target',
            style: createStyle({ background: '#f6f8fa' }),
          },
        ],
      },
    ],
  };

  assert.equal(hasAuthoredTokenReference(element, ['background'], root), false);
});
