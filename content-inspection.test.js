const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentInspector } = require('./content-inspection.js');
const { createContentScanUtils } = require('./content-scan-utils.js');

const scanUtils = createContentScanUtils({
  parseViolationItem: () => ({}),
});

function createInspector({ tokenReference = false, getKnownColorTokens = () => [], rgbToHex = (value) => value } = {}) {
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
    hasAuthoredTokenReference: () => tokenReference,
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

  assert.deepEqual(result.issues, ['상단 패딩 13px (비규격)']);
});

test('spacing inspection labels equal four-side padding as padding', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    paddingTop: '14px',
    paddingRight: '14px',
    paddingBottom: '14px',
    paddingLeft: '14px',
  }, {});

  assert.deepEqual(result.issues, ['패딩 14px (비규격)']);
});

test('spacing inspection labels directional padding when sides differ', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    paddingTop: '0px',
    paddingRight: '14px',
    paddingBottom: '0px',
    paddingLeft: '0px',
  }, {});

  assert.deepEqual(result.issues, ['오른쪽 패딩 14px (비규격)']);
});

test('spacing inspection labels equal four-side margin as margin', () => {
  const inspector = createInspector();
  const result = inspector.getInspectionForFilter('spacing', {
    marginTop: '14px',
    marginRight: '14px',
    marginBottom: '14px',
    marginLeft: '14px',
  }, {});

  assert.deepEqual(result.issues, ['마진 14px (비규격)']);
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
