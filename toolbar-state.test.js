const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getToolbarVariantState,
  getNextToolbarMode,
  countViolationsByFilter,
  getNextActiveFilter,
  createToolbarModel,
  getPresentationMode,
  getFigmaToolbarAxes,
  TOOLBAR_MODES,
} = require('./toolbar-state.js');

test('countViolationsByFilter deduplicates matching violations', () => {
  const scanData = {
    violations: ['배경색 #fff (미등록)', '배경색 #fff (미등록)', '라운드 10px (미준수)'],
    suggestions: [],
  };

  assert.equal(countViolationsByFilter(scanData, 'color'), 1);
  assert.equal(countViolationsByFilter(scanData, 'radius'), 1);
  assert.equal(countViolationsByFilter(scanData, 'font'), 0);
});

test('countViolationsByFilter prefers structured counts when present', () => {
  const scanData = {
    violations: ['배경색 #fff (미등록)'],
    suggestions: [],
    counts: {
      color: 3,
      font: 1,
      spacing: 0,
      radius: 2,
    },
  };

  assert.equal(countViolationsByFilter(scanData, 'color'), 3);
  assert.equal(countViolationsByFilter(scanData, 'font'), 1);
  assert.equal(countViolationsByFilter(scanData, 'radius'), 2);
});

test('getToolbarVariantState keeps base variant idle when no filter is selected', () => {
  const state = getToolbarVariantState({
    activeFilter: null,
    isFigmaConnected: true,
    scanData: { violations: [], suggestions: [] },
  });

  assert.equal(state.color.active, false);
  assert.equal(state.font.active, false);
  assert.equal(state.spacing.active, false);
  assert.equal(state.radius.active, false);
  assert.equal(state.refresh.dot, false);
});

test('getToolbarVariantState exposes badge and dot from violations', () => {
  const state = getToolbarVariantState({
    activeFilter: 'radius',
    isFigmaConnected: true,
    scanData: {
      violations: ['배경색 #fff (미등록)', '라운드 10px (미준수)', '라운드 10px (미준수)'],
      suggestions: [],
    },
  });

  assert.equal(state.color.badge, '1');
  assert.equal(state.radius.active, true);
  assert.equal(state.radius.dot, true);
  assert.equal(state.refresh.dot, true);
});

test('getToolbarVariantState marks refresh when disconnected even without violations', () => {
  const state = getToolbarVariantState({
    activeFilter: null,
    isFigmaConnected: false,
    scanData: { violations: [], suggestions: [] },
  });

  assert.equal(state.refresh.dot, true);
});

test('getNextToolbarMode resolves disconnected and stable connected states', () => {
  assert.equal(getNextToolbarMode({ isFigmaConnected: false, previousConnectionState: true }), 'disconnected-message');
  assert.equal(getNextToolbarMode({ isFigmaConnected: true, previousConnectionState: true }), 'connected-default');
});

test('getNextToolbarMode emits connected-message on reconnect from disconnected', () => {
  assert.equal(getNextToolbarMode({ isFigmaConnected: true, previousConnectionState: false }), 'connected-message');
});

test('getNextActiveFilter toggles selected filter back to idle', () => {
  assert.equal(getNextActiveFilter(null, 'color'), 'color');
  assert.equal(getNextActiveFilter('color', 'color'), null);
  assert.equal(getNextActiveFilter('font', 'radius'), 'radius');
  assert.equal(getNextActiveFilter('spacing', 'unknown'), null);
});

test('createToolbarModel uses figma compact disconnected structure', () => {
  const model = createToolbarModel({ mode: TOOLBAR_MODES.COMPACT });
  assert.equal(model.width, 96);
  assert.deepEqual(model.items.map((item) => item.type === 'button' ? item.ref : item.kind || item.type), ['plug', 'close']);
});

test('createToolbarModel uses figma single-button structure with font default', () => {
  const model = createToolbarModel({ mode: TOOLBAR_MODES.SINGLE_BUTTON });
  assert.equal(model.width, 48);
  assert.equal(model.items.length, 1);
  assert.equal(model.items[0].ref, 'font');
});

test('createToolbarModel supports overriding single-button ref', () => {
  const model = createToolbarModel({ mode: TOOLBAR_MODES.SINGLE_BUTTON, options: { singleButtonRef: 'close' } });
  assert.equal(model.items[0].ref, 'close');
});

test('createToolbarModel exposes status widths for message variants', () => {
  assert.equal(createToolbarModel({ mode: TOOLBAR_MODES.DISCONNECTED_MESSAGE }).statusWidth, 257);
  assert.equal(createToolbarModel({ mode: TOOLBAR_MODES.CONNECTED_MESSAGE }).statusWidth, 166);
  assert.equal(createToolbarModel({ mode: TOOLBAR_MODES.DEFAULT }).statusWidth, null);
});

test('getPresentationMode switches disconnected message to compact on narrow viewport only', () => {
  assert.equal(getPresentationMode(TOOLBAR_MODES.DISCONNECTED_MESSAGE, 439), TOOLBAR_MODES.COMPACT);
  assert.equal(getPresentationMode(TOOLBAR_MODES.DISCONNECTED_MESSAGE, 440), TOOLBAR_MODES.DISCONNECTED_MESSAGE);
  assert.equal(getPresentationMode(TOOLBAR_MODES.DEFAULT, 320), TOOLBAR_MODES.DEFAULT);
});


test('getFigmaToolbarAxes maps disconnected and connected states to figma-style axes', () => {
  assert.deepEqual(
    getFigmaToolbarAxes({
      mode: TOOLBAR_MODES.DISCONNECTED_MESSAGE,
      activeFilter: null,
      isFigmaConnected: false,
      scanData: { violations: [], suggestions: [] },
    }),
    {
      status: 'message',
      error: 'False',
      success: 'False',
      active: 'False',
      hovered: 'False',
    }
  );

  assert.deepEqual(
    getFigmaToolbarAxes({
      mode: TOOLBAR_MODES.DEFAULT,
      activeFilter: 'color',
      isFigmaConnected: true,
      scanData: { violations: [], suggestions: [] },
    }),
    {
      status: 'color',
      error: 'False',
      success: 'True',
      active: 'True',
      hovered: 'False',
    }
  );
});

test('getFigmaToolbarAxes maps spacing and radius checks to contract status and perfect when clean', () => {
  assert.equal(
    getFigmaToolbarAxes({
      mode: TOOLBAR_MODES.DEFAULT,
      activeFilter: 'spacing',
      isFigmaConnected: true,
      scanData: { violations: ['상단 패딩 14px (비규격)'], suggestions: [] },
    }).status,
    'contract'
  );

  assert.deepEqual(
    getFigmaToolbarAxes({
      mode: TOOLBAR_MODES.DEFAULT,
      activeFilter: null,
      isFigmaConnected: true,
      scanData: { violations: [], suggestions: [] },
    }),
    {
      status: 'perfect',
      error: 'False',
      success: 'True',
      active: 'False',
      hovered: 'False',
    }
  );
});
