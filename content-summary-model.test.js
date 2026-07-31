const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentSummaryModel } = require('./content-summary-model.js');
const { createContentRenderers } = require('./content-render.js');

const { parseViolationItem } = createContentRenderers({
  iconPaths: {},
  getUrl: (path) => path,
  escapeHtml: (value) => String(value ?? ''),
});

function createModelState(overrides = {}) {
  const state = {
    scanData: {
      issueEntries: [
        { key: 'bg-danger-1', category: 'color', colorPart: 'bg', tone: 'danger', message: '배경색 #111111 (미등록)|div.card' },
        { key: 'text-warning-1', category: 'color', colorPart: 'text', tone: 'warning', message: '글자색 #222222 (원시값 직접 사용)|p.copy' },
        { key: 'spacing-danger-1', category: 'spacing', tone: 'danger', message: '상단 패딩 13px (미등록)|div.stack' },
      ],
    },
    activeFilter: 'color',
    activeSummarySubtab: 'bg',
    activeSummaryTone: 'danger',
    expandedIssueGroupKeys: new Set(),
    ...overrides,
  };
  const model = createContentSummaryModel({
    getScanData: () => state.scanData,
    getActiveFilter: () => state.activeFilter,
    getActiveSummarySubtab: () => state.activeSummarySubtab,
    setActiveSummarySubtab: (value) => {
      state.activeSummarySubtab = value;
    },
    getActiveSummaryTone: () => state.activeSummaryTone,
    setActiveSummaryTone: (value) => {
      state.activeSummaryTone = value;
    },
    getExpandedIssueGroupKeys: () => state.expandedIssueGroupKeys,
    parseViolationItem,
  });
  return { state, model };
}

test('summary model selects warning color results when danger count is empty', () => {
  const { state, model } = createModelState({
    activeSummarySubtab: 'text',
    activeSummaryTone: 'danger',
  });

  model.getColorSummaryTabs();

  assert.equal(state.activeSummaryTone, 'warning');
  assert.deepEqual(model.getVisibleIssueEntries().map((entry) => entry.key), ['text-warning-1']);
});

test('summary model filters non-color issue lists by active tone', () => {
  const { model } = createModelState({
    activeFilter: 'spacing',
    activeSummaryTone: 'danger',
  });

  assert.deepEqual(model.getVisibleIssueEntries().map((entry) => entry.key), ['spacing-danger-1']);
});

test('summary model groups issue entries and preserves expanded group state in render key', () => {
  const { state, model } = createModelState();
  const groups = model.groupIssueEntries(model.getVisibleIssueEntries());
  state.expandedIssueGroupKeys = new Set([groups[0].key]);

  const expandedGroups = model.groupIssueEntries(model.getVisibleIssueEntries());
  const renderKey = model.getSummaryListRenderKey(model.getVisibleIssueEntries());

  assert.equal(expandedGroups[0].expanded, true);
  assert.match(renderKey, /bg-danger-1/);
  assert.match(renderKey, /color::bg::danger/);
});

test('summary model aggregates expanded details by class while preserving affected element count', () => {
  const repeatedElement = (index) => ({
    tagName: 'DIV',
    className: 'css-1jpkuk3 chakra-box',
    textContent: `menu-${index}`,
  });
  const { model } = createModelState({
    activeFilter: 'spacing',
    activeSummaryTone: 'warning',
    scanData: {
      issueEntries: [
        {
          key: 'spacing-1',
          category: 'spacing',
          tone: 'warning',
          message: '오른쪽 패딩 16px (원시값 직접 사용: spacing/16)',
          element: repeatedElement(1),
        },
        {
          key: 'spacing-2',
          category: 'spacing',
          tone: 'warning',
          message: '오른쪽 패딩 16px (원시값 직접 사용: spacing/16)',
          element: repeatedElement(2),
        },
        {
          key: 'spacing-3',
          category: 'spacing',
          tone: 'warning',
          message: '오른쪽 패딩 16px (원시값 직접 사용: spacing/16)',
          element: { tagName: 'INPUT', className: 'chakra-input' },
        },
      ],
    },
  });

  const [group] = model.groupIssueEntries(model.getVisibleIssueEntries());

  assert.equal(group.count, 3);
  assert.deepEqual(
    group.detailEntries.map((entry) => [entry.elementLabel, entry.elementCount, entry.key, entry.issueKeys]),
    [
      ['div.css-1jpkuk3', 2, 'spacing-1', ['spacing-1', 'spacing-2']],
      ['input.chakra-input', 1, 'spacing-3', ['spacing-3']],
    ]
  );
});
