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
  assert.equal(isCssVariableReference(), false);
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

test('hasAuthoredTokenReference lets inline token declarations override stylesheet literals', () => {
  const element = {
    style: createStyle({ background: 'var(--fds-surface-primary)' }),
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
            style: createStyle({ background: '#f6f8fa' }),
          },
        ],
      },
    ],
  };

  assert.equal(hasAuthoredTokenReference(element, ['background'], root), true);
});

test('hasAuthoredTokenReference skips inaccessible stylesheets and visits nested rules', () => {
  const inaccessibleSheet = {};
  Object.defineProperty(inaccessibleSheet, 'cssRules', {
    get() {
      throw new Error('Blocked by CORS');
    },
  });

  const element = {
    matches(selector) {
      return selector === '.target';
    },
  };
  const root = {
    styleSheets: [
      inaccessibleSheet,
      {
        cssRules: [
          {
            cssRules: [
              {
                selectorText: '.target',
                style: createStyle({ color: 'var(--fds-text-primary)' }),
              },
            ],
          },
        ],
      },
    ],
  };

  assert.equal(hasAuthoredTokenReference(element, ['color'], root), true);
});

test('hasAuthoredTokenReference ignores an invalid selector without hiding later matches', () => {
  const element = {
    matches(selector) {
      if (selector === ':unsupported(') throw new SyntaxError('Invalid selector');
      return selector === '.target';
    },
  };
  const root = {
    styleSheets: [
      {
        cssRules: [
          {
            selectorText: ':unsupported(, .target',
            style: { color: 'var(--fds-text-primary)' },
          },
        ],
      },
    ],
  };

  assert.equal(hasAuthoredTokenReference(element, ['color'], root), true);
});

test('hasAuthoredTokenReference rejects incomplete input safely', () => {
  assert.equal(hasAuthoredTokenReference(null, ['color'], { styleSheets: [] }), false);
  assert.equal(hasAuthoredTokenReference({}, [], { styleSheets: [] }), false);
});

test('hasAuthoredTokenReference supports plain inline style objects without a document root', () => {
  const element = {
    style: { color: 'var(--fds-text-primary)' },
  };

  assert.equal(hasAuthoredTokenReference(element, ['color']), true);
});

test('hasAuthoredTokenReference ignores rules without matching declarations', () => {
  const element = {
    matches(selector) {
      return selector === '.target';
    },
  };
  const root = {
    styleSheets: [
      {
        cssRules: [
          { selectorText: '.target' },
          { selectorText: '.other', style: createStyle({ color: 'var(--fds-text-primary)' }) },
          { selectorText: '.target', style: createStyle({ color: '' }) },
        ],
      },
    ],
  };

  assert.equal(hasAuthoredTokenReference(element, ['color'], root), false);
});
