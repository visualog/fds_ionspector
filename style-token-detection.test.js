const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getAuthoredStyleEvidence,
  hasAuthoredTokenReference,
  isCssVariableReference,
} = require('./style-token-detection.js');

function createStyle(declarations = {}, priorities = {}) {
  return {
    length: Object.keys(declarations).length,
    item(index) {
      return Object.keys(declarations)[index] || '';
    },
    getPropertyValue(property) {
      return declarations[property] || '';
    },
    getPropertyPriority(property) {
      return priorities[property] || '';
    },
  };
}

test('getAuthoredStyleEvidence captures property, values, selector, and stylesheet source', () => {
  const element = {
    matches(selector) {
      return selector === '.card';
    },
  };
  const root = {
    styleSheets: [
      {
        href: 'https://example.test/assets/layout.css',
        cssRules: [
          {
            selectorText: '.card',
            style: createStyle({ 'padding-right': '14px' }),
          },
        ],
      },
    ],
  };

  assert.deepEqual(
    getAuthoredStyleEvidence(element, ['padding-right', 'padding'], '14px', root),
    {
      property: 'padding-right',
      computedValue: '14px',
      authoredProperty: 'padding-right',
      authoredValue: '14px',
      declaration: 'padding-right: 14px',
      selector: '.card',
      source: 'https://example.test/assets/layout.css',
      confidence: 'high',
      confidenceReason: '작성 CSS 선언과 적용 선택자를 확인함',
    }
  );
});

test('getAuthoredStyleEvidence marks a fully inspectable winning declaration as high confidence', () => {
  const element = {
    matches(selector) {
      return selector === '.card';
    },
    style: createStyle(),
  };
  const root = {
    styleSheets: [
      {
        href: 'https://example.test/assets/layout.css',
        cssRules: [
          { selectorText: '.card', style: createStyle({ 'padding-right': '14px' }) },
        ],
      },
    ],
  };

  const evidence = getAuthoredStyleEvidence(element, ['padding-right'], '14px', root);

  assert.equal(evidence.confidence, 'high');
  assert.match(evidence.confidenceReason, /작성 CSS 선언과 적용 선택자/);
});

test('getAuthoredStyleEvidence marks evidence as medium confidence when a stylesheet is inaccessible', () => {
  const element = {
    matches(selector) {
      return selector === '.card';
    },
    style: createStyle(),
  };
  const inaccessibleSheet = {};
  Object.defineProperty(inaccessibleSheet, 'cssRules', {
    get() {
      throw new Error('SecurityError');
    },
  });
  const root = {
    styleSheets: [
      inaccessibleSheet,
      {
        href: 'https://example.test/assets/layout.css',
        cssRules: [
          { selectorText: '.card', style: createStyle({ 'padding-right': '14px' }) },
        ],
      },
    ],
  };

  const evidence = getAuthoredStyleEvidence(element, ['padding-right'], '14px', root);

  assert.equal(evidence.confidence, 'medium');
  assert.match(evidence.confidenceReason, /일부 스타일시트/);
});

test('getAuthoredStyleEvidence marks computed-only evidence as low confidence', () => {
  const evidence = getAuthoredStyleEvidence(
    { style: createStyle() },
    ['border-radius'],
    '10px',
    { styleSheets: [] }
  );

  assert.equal(evidence.confidence, 'low');
  assert.match(evidence.confidenceReason, /작성 CSS 선언을 확인할 수 없음/);
});

test('getAuthoredStyleEvidence prefers a more specific matching selector over a later rule', () => {
  const element = {
    matches(selector) {
      return selector === '#checkout' || selector === '.card';
    },
  };
  const root = {
    styleSheets: [
      {
        ownerNode: { tagName: 'STYLE', id: 'checkout-styles' },
        cssRules: [
          { selectorText: '#checkout', style: createStyle({ color: '#172033' }) },
          { selectorText: '.card', style: createStyle({ color: '#ffffff' }) },
        ],
      },
    ],
  };

  assert.deepEqual(
    getAuthoredStyleEvidence(element, ['color'], 'rgb(23, 32, 51)', root),
    {
      property: 'color',
      computedValue: 'rgb(23, 32, 51)',
      authoredProperty: 'color',
      authoredValue: '#172033',
      declaration: 'color: #172033',
      selector: '#checkout',
      source: '<style id="checkout-styles">',
      confidence: 'high',
      confidenceReason: '작성 CSS 선언과 적용 선택자를 확인함',
    }
  );
});

test('getAuthoredStyleEvidence reports inline declarations as the source', () => {
  const element = {
    style: createStyle({ 'border-radius': '10px' }),
  };

  assert.deepEqual(
    getAuthoredStyleEvidence(element, ['border-radius'], '10px', { styleSheets: [] }),
    {
      property: 'border-radius',
      computedValue: '10px',
      authoredProperty: 'border-radius',
      authoredValue: '10px',
      declaration: 'border-radius: 10px',
      selector: 'style attribute',
      source: 'inline style',
      confidence: 'high',
      confidenceReason: '작성 CSS 선언과 적용 선택자를 확인함',
    }
  );
});

test('getAuthoredStyleEvidence prefers an important longhand over a later shorthand in one rule', () => {
  const element = {
    matches(selector) {
      return selector === '.card';
    },
  };
  const root = {
    styleSheets: [
      {
        cssRules: [
          {
            selectorText: '.card',
            style: createStyle(
              {
                'padding-right': 'var(--fds-spacing-md)',
                padding: '14px',
              },
              { 'padding-right': 'important' }
            ),
          },
        ],
      },
    ],
  };

  const evidence = getAuthoredStyleEvidence(element, ['padding-right', 'padding'], '16px', root);

  assert.equal(evidence.authoredProperty, 'padding-right');
  assert.equal(evidence.authoredValue, 'var(--fds-spacing-md)');
  assert.equal(evidence.declaration, 'padding-right: var(--fds-spacing-md) !important');
});

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
