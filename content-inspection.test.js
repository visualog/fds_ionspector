const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentInspector } = require('./content-inspection.js');
const { createContentScanUtils } = require('./content-scan-utils.js');
const { getAuthoredStyleEvidence: getRealAuthoredStyleEvidence } = require('./style-token-detection.js');

const scanUtils = createContentScanUtils({
  parseViolationItem: () => ({}),
});

function createInspector({
  tokenReference = false,
  tokenReferenceStatus = null,
  getAuthoredTokenReferenceStatus = null,
  getKnownColorTokens = () => [],
  rgbToHex = (value) => value,
  getAuthoredStyleEvidence = (_element, properties, computedValue) => ({
    property: properties[0],
    computedValue,
    authoredProperty: properties[0],
    authoredValue: computedValue,
    declaration: `${properties[0]}: ${computedValue}`,
    selector: '.target',
    source: 'https://example.test/app.css',
  }),
} = {}) {
  return createContentInspector({
    getActiveInspectorSpecs: () => ({
      colors: {},
      fonts: ['Pretendard'],
      spacing: [4, 8, 16],
      radius: ['4px', '8px', '9999px'],
      spacingTokens: {
        8: ['spacing/8'],
      },
      radiusTokens: {
        '4px': ['radius/4'],
        '9999px': ['radius/full'],
      },
    }),
    getKnownColorTokens,
    getAuthoredStyleEvidence,
    hasAuthoredTokenReference: () => tokenReference,
    getAuthoredTokenReferenceStatus: getAuthoredTokenReferenceStatus || (() => tokenReferenceStatus || {
      status: tokenReference ? 'legacy' : 'none',
      variables: [],
      unregisteredVariables: [],
    }),
    hasDirectTextContent: () => true,
    rgbToHex,
  });
}

test('spacing inspection treats authored token references as valid', () => {
  const inspector = createInspector({ tokenReference: true });
  const result = inspector.getInspectionForFilter('spacing', { paddingTop: '13px' }, {});

  assert.deepEqual(result.issues, []);
});

test('spacing inspection warns when a token value is used as a raw value', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', { paddingTop: '8px' }, {});

  assert.deepEqual(result.issues, ['상단 패딩 8px (원시값 직접 사용: spacing/8)']);
});

test('spacing inspection flags values outside the token scale', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', { paddingTop: '13px' }, {});

  assert.deepEqual(result.issues, ['상단 패딩 13px (미등록)']);
});

test('spacing inspection labels equal four-side padding as padding', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    paddingTop: '14px',
    paddingRight: '14px',
    paddingBottom: '14px',
    paddingLeft: '14px',
  }, {});

  assert.deepEqual(result.issues, ['패딩 14px (미등록)']);
});

test('spacing inspection labels directional padding when sides differ', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    paddingTop: '0px',
    paddingRight: '14px',
    paddingBottom: '0px',
    paddingLeft: '0px',
  }, {});

  assert.deepEqual(result.issues, ['오른쪽 패딩 14px (미등록)']);
  assert.deepEqual(result.issueDetails, [
    {
      spacing: { kind: 'padding', sides: ['right'], value: 14 },
      cssEvidence: {
        property: 'padding-right',
        computedValue: '14px',
        authoredProperty: 'padding-right',
        authoredValue: '14px',
        declaration: 'padding-right: 14px',
        selector: '.target',
        source: 'https://example.test/app.css',
      },
    },
  ]);
});

test('color, font, and radius violations include CSS evidence metadata', () => {
  const inspector = createInspector();
  const element = {};

  const color = inspector.getInspectionForFilter('color', {
    backgroundColor: '#ffffff',
    color: 'rgba(0, 0, 0, 0)',
    borderTopWidth: '0px',
    borderTopColor: 'rgba(0, 0, 0, 0)',
  }, element);
  const font = inspector.getInspectionForFilter('font', { fontFamily: 'Inter, sans-serif' }, element);
  const radius = inspector.getInspectionForFilter('radius', { borderRadius: '10px' }, element);

  assert.equal(color.issueDetails[0].cssEvidence.property, 'background-color');
  assert.equal(color.issueDetails[0].cssEvidence.computedValue, '#ffffff');
  assert.equal(font.issueDetails[0].cssEvidence.property, 'font-family');
  assert.equal(font.issueDetails[0].cssEvidence.computedValue, 'Inter, sans-serif');
  assert.equal(radius.issueDetails[0].cssEvidence.property, 'border-radius');
  assert.equal(radius.issueDetails[0].cssEvidence.computedValue, '10px');
});

test('font violations capture an authored font shorthand declaration', () => {
  const inspector = createInspector({ getAuthoredStyleEvidence: getRealAuthoredStyleEvidence });
  const element = {
    style: {
      length: 1,
      item: () => 'font',
      getPropertyValue: (property) => (
        property === 'font' ? 'italic 600 16px/1.5 Inter, sans-serif' : ''
      ),
      getPropertyPriority: () => '',
    },
  };

  const result = inspector.getInspectionForFilter('font', { fontFamily: 'Inter, sans-serif' }, element);

  assert.equal(result.issueDetails[0].cssEvidence.property, 'font-family');
  assert.equal(result.issueDetails[0].cssEvidence.authoredProperty, 'font');
  assert.equal(result.issueDetails[0].cssEvidence.declaration, 'font: italic 600 16px/1.5 Inter, sans-serif');
});

test('spacing inspection labels equal four-side margin as margin', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    marginTop: '14px',
    marginRight: '14px',
    marginBottom: '14px',
    marginLeft: '14px',
  }, {});

  assert.deepEqual(result.issues, ['마진 14px (미등록)']);
});

test('spacing inspection includes gap values outside the token scale', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    rowGap: '11px',
    columnGap: '11px',
  }, {});

  assert.deepEqual(result.issues, ['갭 11px (미등록)']);
  assert.deepEqual(result.issueDetails.map((detail) => detail.spacing), [
    { kind: 'gap', sides: ['row', 'column'], value: 11 },
  ]);
});

test('spacing inspection labels directional gap values when row and column differ', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    rowGap: '12px',
    columnGap: '8px',
  }, {});

  assert.deepEqual(result.issues, [
    '행 갭 12px (미등록)',
    '열 갭 8px (원시값 직접 사용: spacing/8)',
  ]);
  assert.deepEqual(result.issueDetails.map((detail) => detail.spacing), [
    { kind: 'gap', sides: ['row'], value: 12 },
    { kind: 'gap', sides: ['column'], value: 8 },
  ]);
});

test('radius inspection warns when a token value is used as a raw value', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('radius', { borderRadius: '4px' }, {});

  assert.deepEqual(result.issues, ['라운드 4px (원시값 직접 사용: radius/4)']);
});

test('radius inspection suggests full radius token for large pill values', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('radius', { borderRadius: '999px' }, {});

  assert.deepEqual(result.issues, ['라운드 999px (원시값 직접 사용: radius/full)']);
});

test('color inspection does not collapse translucent rgba to opaque token suggestions', () => {
  const inspector = createInspector({
    getKnownColorTokens: (value) => (value === '#000000' ? ['Black'] : []),
    rgbToHex: scanUtils.rgbToHex,
  });
  const result = inspector.getInspectionForFilter('color', {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: 'rgba(0, 0, 0, 0)',
    borderTopWidth: '0px',
    borderTopColor: 'rgba(0, 0, 0, 0)',
  }, {});

  assert.deepEqual(result.issues, ['배경색 rgba(0, 0, 0, 0.04) (미등록)']);
});

test('color inspection treats wrong color token part as unregistered for the element context', () => {
  const inspector = createInspector({
    getKnownColorTokens: () => ['Color.text.primary'],
  });
  const result = inspector.getInspectionForFilter('color', {
    backgroundColor: '#1a202c',
    color: '#1a202c',
    borderTopWidth: '1px',
    borderTopColor: '#1a202c',
  }, {});

  assert.deepEqual(result.issues, [
    '배경색 #1a202c (미등록)',
    '글자색 #1a202c (원시값 직접 사용)',
    '보더색 #1a202c (미등록)',
  ]);
});

test('color inspection accepts a registered Storybook CSS variable', () => {
  const inspector = createInspector({
    tokenReferenceStatus: {
      status: 'registered',
      variables: ['--color-bg-primary'],
      unregisteredVariables: [],
    },
  });

  const result = inspector.getInspectionForFilter('color', {
    backgroundColor: '#ffffff',
    color: '',
    borderTopWidth: '0px',
    borderTopColor: 'rgba(0, 0, 0, 0)',
  }, {});

  assert.deepEqual(result.issues, []);
});

test('color inspection reports an unknown CSS variable with structured evidence', () => {
  const inspector = createInspector({
    tokenReferenceStatus: {
      status: 'unregistered',
      variables: ['--custom-brand'],
      unregisteredVariables: ['--custom-brand'],
    },
  });

  const result = inspector.getInspectionForFilter('color', {
    backgroundColor: '#ffffff',
    color: '',
    borderTopWidth: '0px',
    borderTopColor: 'rgba(0, 0, 0, 0)',
  }, {});

  assert.deepEqual(result.issues, ['배경색 #ffffff (등록되지 않은 CSS 변수: --custom-brand)']);
  assert.deepEqual(result.issueDetails[0].cssVariable, {
    status: 'unregistered',
    variables: ['--custom-brand'],
    unregisteredVariables: ['--custom-brand'],
  });
});

test('color inspection keeps legacy CSS variable acceptance while no registry is available', () => {
  const inspector = createInspector({
    tokenReferenceStatus: {
      status: 'legacy',
      variables: ['--custom-brand'],
      unregisteredVariables: [],
    },
  });

  const result = inspector.getInspectionForFilter('color', {
    backgroundColor: '#ffffff',
    color: '',
    borderTopWidth: '0px',
    borderTopColor: 'rgba(0, 0, 0, 0)',
  }, {});

  assert.deepEqual(result.issues, []);
});

test('color inspection requests inherited variable detection for text colors', () => {
  const requests = [];
  const inspector = createInspector({
    getAuthoredTokenReferenceStatus: (_element, properties, options) => {
      requests.push({ properties, options });
      return {
        status: properties.includes('color') ? 'registered' : 'none',
        variables: [],
        unregisteredVariables: [],
      };
    },
  });

  const result = inspector.getInspectionForFilter('color', {
    backgroundColor: '',
    color: '#717985',
    borderTopWidth: '0px',
    borderTopColor: '',
  }, {});

  assert.deepEqual(result.issues, []);
  assert.deepEqual(
    requests.find(({ properties }) => properties.length === 1 && properties[0] === 'color').options,
    { includeInherited: true }
  );
});
