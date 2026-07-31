const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentStateUtils } = require('./content-state-utils.js');

const utils = createContentStateUtils({
  filterLabels: { color: '컬러' },
});

test('createEmptyScanData returns the default scan shape', () => {
  assert.deepEqual(utils.createEmptyScanData(), {
    violations: [],
    issueEntries: [],
    suggestions: [],
    excludedEntries: [],
    counts: {
      color: 0,
      font: 0,
      spacing: 0,
      radius: 0,
    },
    colorBreakdown: {
      missing: 0,
      primitiveRaw: 0,
    },
  });
});

test('getFilterLabel and getScanStatusMessage provide UI copy', () => {
  assert.equal(utils.getFilterLabel('color'), '컬러');
  assert.equal(utils.getFilterLabel(null), '페이지');
  assert.equal(utils.getScanStatusMessage('다시 검사 중'), '다시 검사 중');
  assert.equal(utils.getScanStatusMessage(), '초기 검사 결과를 계산하는 중입니다.');
});

test('getScanStatusMessage includes the active filter when provided', () => {
  const activeUtils = createContentStateUtils({
    filterLabels: { color: '컬러' },
    getActiveFilter: () => 'color',
  });

  assert.equal(activeUtils.getFilterLabel(), '컬러');
  assert.equal(activeUtils.getScanStatusMessage(), '컬러 위반 수를 다시 계산하는 중입니다.');
});
