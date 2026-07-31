const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentToolbarUI } = require('./content-toolbar-ui.js');

function createElement({ id = '', children = [] } = {}) {
  const childMap = new Map(children.map((child) => [`#${child.id}`, child]));
  return {
    id,
    dataset: {},
    style: {
      properties: {},
      setProperty(name, value) {
        this.properties[name] = value;
      },
    },
    classList: {
      toggles: [],
      added: [],
      removed: [],
      toggle(className, enabled) {
        this.toggles.push([className, enabled]);
      },
      add(className) {
        this.added.push(className);
      },
      remove(className) {
        this.removed.push(className);
      },
    },
    querySelector(selector) {
      return childMap.get(selector) || null;
    },
    getAttribute(name) {
      return this[name] || '';
    },
  };
}

test('toolbar UI reads tooltip copy from dataset before title', () => {
  const toolbarUI = createContentToolbarUI();
  const button = createElement();
  button.title = 'Title tooltip';
  button.dataset.tooltip = 'Dataset tooltip';

  assert.equal(toolbarUI.getToolbarButtonTooltip(button), 'Dataset tooltip');
  delete button.dataset.tooltip;
  assert.equal(toolbarUI.getToolbarButtonTooltip(button), 'Title tooltip');
  assert.equal(toolbarUI.getToolbarButtonTooltip(null), '');
});

test('toolbar UI strips rendering scope metadata from toolbar tooltip text', () => {
  const toolbarUI = createContentToolbarUI();
  const button = createElement();
  button.dataset.tooltip = '컬러 검사 2,003개 위반 요소 · 현재 렌더링 기준 · 검사됨 408개 · 제외됨 336개';

  assert.equal(
    toolbarUI.getToolbarButtonTooltip(button),
    '컬러 검사 2,003개 위반 요소'
  );
});

test('toolbar UI toggles root visibility and body class', () => {
  const root = createElement();
  const body = createElement();
  const toolbarUI = createContentToolbarUI({
    documentRef: {
      body,
      getElementById: () => root,
    },
  });

  toolbarUI.setRootVisibility(false);

  assert.equal(root.dataset.visible, 'false');
  assert.equal(root.style.display, 'none');
  assert.deepEqual(body.classList.toggles, [['fds-hide-all', true]]);
});

test('toolbar UI detects complete inspector shell', () => {
  const shell = createElement({
    children: [
      createElement({ id: 'fds-page-interaction-shield' }),
      createElement({ id: 'fds-issue-pin-layer' }),
      createElement({ id: 'fds-toolbar' }),
      createElement({ id: 'fds-summary-panel' }),
      createElement({ id: 'fds-inspector-card' }),
    ],
  });
  const incompleteShell = createElement({
    children: [
      createElement({ id: 'fds-toolbar' }),
      createElement({ id: 'fds-summary-panel' }),
    ],
  });
  const toolbarUI = createContentToolbarUI();

  assert.equal(toolbarUI.isInspectorUIShellComplete(shell), true);
  assert.equal(toolbarUI.isInspectorUIShellComplete(incompleteShell), false);
});

test('toolbar UI resets floating toolbar and summary panel positioning', () => {
  const toolbar = createElement();
  Object.assign(toolbar.style, {
    left: '10px',
    top: '20px',
    bottom: 'auto',
    transform: 'none',
  });
  const panel = createElement();
  Object.assign(panel.style, {
    left: '10px',
    top: '20px',
    bottom: 'auto',
    right: '12px',
  });
  const toolbarUI = createContentToolbarUI();

  toolbarUI.resetToolbarFloatingPosition(toolbar);
  toolbarUI.resetSummaryPanelFloatingPosition(panel);

  assert.equal(toolbar.style.left, '');
  assert.equal(toolbar.style.top, '');
  assert.equal(toolbar.style.bottom, '');
  assert.equal(toolbar.style.transform, '');
  assert.equal(panel.style.left, '');
  assert.equal(panel.style.top, '');
  assert.equal(panel.style.bottom, '');
  assert.equal(panel.style.right, '');
});

test('toolbar UI applies toolbar sync dataset and sizing state', () => {
  const toolbarUI = createContentToolbarUI();
  const root = createElement();
  const toolbar = createElement();
  let appliedRoot = null;

  toolbarUI.applyToolbarSyncState({
    root,
    toolbar,
    model: {
      mode: 'connected-default',
      width: 336,
      statusWidth: 257,
    },
    isCollapsed: true,
    isScanning: true,
    scanStatusText: '검사 중',
    applyToolbarSpecVariables: (target) => {
      appliedRoot = target;
    },
  });

  assert.equal(root.dataset.toolbarMode, 'connected-default');
  assert.equal(root.dataset.toolbarCollapsed, 'true');
  assert.equal(root.dataset.scanState, 'scanning');
  assert.equal(toolbar.dataset.variant, 'connected-default');
  assert.equal(toolbar.dataset.collapsed, 'true');
  assert.equal(toolbar.dataset.scanState, 'scanning');
  assert.equal(toolbar.dataset.scanStatus, '검사 중');
  assert.equal(toolbar.style.properties['--fds-toolbar-width'], '336px');
  assert.equal(toolbar.style.properties['--fds-toolbar-status-width'], '257px');
  assert.equal(appliedRoot, root);
});

test('toolbar UI replaces markup only when rendered toolbar content changes', () => {
  const toolbarUI = createContentToolbarUI();
  const toolbar = createElement();
  toolbar.innerHTML = '<button>old</button>';
  const calls = [];

  const didReplace = toolbarUI.replaceToolbarMarkupIfChanged({
    toolbar,
    markup: '  <button>new</button>  ',
    onBeforeReplace: () => {
      calls.push('before');
    },
    onAfterReplace: (target) => {
      calls.push(['after', target]);
    },
  });

  assert.equal(didReplace, true);
  assert.equal(toolbar.innerHTML, '<button>new</button>');
  assert.deepEqual(calls, ['before', ['after', toolbar]]);

  calls.length = 0;
  const didSkip = toolbarUI.replaceToolbarMarkupIfChanged({
    toolbar,
    markup: '<button>new</button>',
    onBeforeReplace: () => {
      calls.push('before');
    },
    onAfterReplace: () => {
      calls.push('after');
    },
  });

  assert.equal(didSkip, false);
  assert.deepEqual(calls, []);
});

test('toolbar UI computes collapsed state only when a filter is active', () => {
  const toolbarUI = createContentToolbarUI();

  assert.equal(toolbarUI.getToolbarCollapsedState({
    nextCollapsed: true,
    activeFilter: 'color',
  }), true);
  assert.equal(toolbarUI.getToolbarCollapsedState({
    nextCollapsed: true,
    activeFilter: '',
  }), false);
  assert.equal(toolbarUI.getToolbarCollapsedState({
    nextCollapsed: false,
    activeFilter: 'spacing',
  }), false);
});

test('toolbar UI computes model visibility state for default collapsed toolbars', () => {
  const toolbarUI = createContentToolbarUI();

  assert.deepEqual(toolbarUI.getToolbarModelVisibilityState({
    mode: 'default',
    defaultMode: 'default',
    isCollapsed: true,
    activeFilter: 'color',
  }), {
    shouldCollapseToolbar: true,
    nextIsCollapsed: true,
  });

  assert.deepEqual(toolbarUI.getToolbarModelVisibilityState({
    mode: 'connected-message',
    defaultMode: 'default',
    isCollapsed: true,
    activeFilter: 'color',
  }), {
    shouldCollapseToolbar: false,
    nextIsCollapsed: false,
  });

  assert.deepEqual(toolbarUI.getToolbarModelVisibilityState({
    mode: 'default',
    defaultMode: 'default',
    isCollapsed: true,
    activeFilter: '',
  }), {
    shouldCollapseToolbar: false,
    nextIsCollapsed: false,
  });
});

test('toolbar UI creates a collapsed toolbar model from the active filter', () => {
  const toolbarUI = createContentToolbarUI();
  const baseModel = {
    mode: 'default',
    width: 336,
    items: [
      { type: 'button', ref: 'color' },
      { type: 'button', ref: 'font' },
    ],
  };

  const collapsedModel = toolbarUI.createCollapsedToolbarModel({
    baseModel,
    collapsedWidth: 48,
    activeFilter: 'font',
  });

  assert.deepEqual(collapsedModel, {
    mode: 'default',
    width: 48,
    items: [{ type: 'button', ref: 'font' }],
  });
  assert.deepEqual(baseModel.items, [
    { type: 'button', ref: 'color' },
    { type: 'button', ref: 'font' },
  ]);
});

test('toolbar UI binds toolbar pointer events', () => {
  const toolbarUI = createContentToolbarUI();
  const toolbar = createElement();
  const handlers = {
    onPointerDown() {},
    onPointerMove() {},
    onPointerUp() {},
    onPointerCancel() {},
    onMouseLeave() {},
  };

  toolbarUI.bindToolbarPointerEvents({
    toolbar,
    ...handlers,
  });

  assert.equal(toolbar.onpointerdown, handlers.onPointerDown);
  assert.equal(toolbar.onpointermove, handlers.onPointerMove);
  assert.equal(toolbar.onpointerup, handlers.onPointerUp);
  assert.equal(toolbar.onpointercancel, handlers.onPointerCancel);
  assert.equal(toolbar.onmouseleave, handlers.onMouseLeave);
});

test('toolbar UI binds toolbar button hover and hide events', () => {
  const toolbarUI = createContentToolbarUI();
  const firstButton = createElement({ id: 'first' });
  const secondButton = createElement({ id: 'second' });
  const shownButtons = [];
  let hideCount = 0;

  toolbarUI.bindToolbarButtonHoverEvents({
    buttons: [firstButton, secondButton],
    onShowTooltip: (button) => {
      shownButtons.push(button.id);
    },
    onHideTooltip: () => {
      hideCount += 1;
    },
  });

  firstButton.onmouseenter();
  secondButton.onmouseenter();
  firstButton.onmouseleave();
  firstButton.onblur();
  firstButton.onpointerdown();

  assert.deepEqual(shownButtons, ['first', 'second']);
  assert.equal(hideCount, 3);
});

test('toolbar UI clears the move button click handler', () => {
  const toolbarUI = createContentToolbarUI();
  const moveButton = createElement();
  moveButton.onclick = () => {};

  toolbarUI.clearToolbarMoveButtonClick(moveButton);

  assert.equal(moveButton.onclick, null);
});

test('toolbar UI resolves filter click actions', () => {
  const toolbarUI = createContentToolbarUI();

  assert.deepEqual(toolbarUI.getToolbarFilterClickAction({
    now: 100,
    suppressUntil: 200,
    nextFilter: 'color',
    activeFilter: 'font',
  }), { type: 'ignored' });

  assert.deepEqual(toolbarUI.getToolbarFilterClickAction({
    now: 250,
    suppressUntil: 200,
    nextFilter: '',
    activeFilter: 'font',
  }), { type: 'ignored' });

  assert.deepEqual(toolbarUI.getToolbarFilterClickAction({
    now: 250,
    suppressUntil: 200,
    nextFilter: 'color',
    activeFilter: 'font',
  }), { type: 'activate-filter', filter: 'color' });

  assert.deepEqual(toolbarUI.getToolbarFilterClickAction({
    now: 250,
    suppressUntil: 200,
    nextFilter: 'color',
    activeFilter: 'color',
    isSummaryPanelVisible: false,
    isSummaryPanelDismissed: false,
  }), { type: 'open-active-summary', filter: 'color' });

  assert.deepEqual(toolbarUI.getToolbarFilterClickAction({
    now: 250,
    suppressUntil: 200,
    nextFilter: 'color',
    activeFilter: 'color',
    isSummaryPanelVisible: true,
    isSummaryPanelDismissed: true,
  }), { type: 'open-active-summary', filter: 'color' });

  assert.deepEqual(toolbarUI.getToolbarFilterClickAction({
    now: 250,
    suppressUntil: 200,
    nextFilter: 'color',
    activeFilter: 'color',
    isSummaryPanelVisible: true,
    isSummaryPanelDismissed: false,
  }), { type: 'toggle-active-filter', filter: 'color' });
});

test('toolbar UI binds filter button click actions', () => {
  const toolbarUI = createContentToolbarUI();
  const firstButton = createElement({ id: 'color' });
  const secondButton = createElement({ id: 'font' });
  const actions = [];
  let hideCount = 0;

  toolbarUI.bindToolbarFilterButtonEvents({
    buttons: [firstButton, secondButton],
    onHideTooltip: () => {
      hideCount += 1;
    },
    getAction: (button) => (
      button.id === 'font'
        ? { type: 'ignored' }
        : { type: 'activate-filter', filter: button.id }
    ),
    onAction: (action, button) => {
      actions.push([action, button.id]);
    },
  });

  firstButton.onclick();
  secondButton.onclick();

  assert.equal(hideCount, 2);
  assert.deepEqual(actions, [[{ type: 'activate-filter', filter: 'color' }, 'color']]);
});

test('toolbar UI binds refresh and close command button actions', () => {
  const toolbarUI = createContentToolbarUI();
  const refreshButton = createElement({ id: 'refresh' });
  const closeButton = createElement({ id: 'close' });
  const calls = [];

  toolbarUI.bindToolbarCommandButtonEvents({
    refreshButton,
    closeButton,
    onHideTooltip: () => {
      calls.push('hide');
    },
    onRefresh: () => {
      calls.push('refresh');
    },
    onClose: () => {
      calls.push('close');
    },
  });

  refreshButton.onclick();
  closeButton.onclick();

  assert.deepEqual(calls, ['hide', 'refresh', 'hide', 'close']);
});

test('toolbar UI binds summary panel close button action', () => {
  const toolbarUI = createContentToolbarUI();
  const closeButton = createElement({ id: 'panel-close' });
  let closeCount = 0;

  toolbarUI.bindSummaryPanelCloseButton({
    button: closeButton,
    onClose: () => {
      closeCount += 1;
    },
  });

  closeButton.onclick();

  assert.equal(closeCount, 1);
});

test('toolbar UI applies and clears toolbar drag active state', () => {
  const toolbarUI = createContentToolbarUI();
  const toolbar = createElement();
  const body = createElement();
  const capturedPointers = [];
  toolbar.setPointerCapture = (pointerId) => {
    capturedPointers.push(pointerId);
  };

  toolbarUI.applyToolbarDragActiveState({
    toolbar,
    body,
    rect: { left: 24, top: 40 },
    pointerId: 7,
  });

  assert.equal(toolbar.style.left, '24px');
  assert.equal(toolbar.style.top, '40px');
  assert.equal(toolbar.style.bottom, 'auto');
  assert.equal(toolbar.style.transform, 'none');
  assert.deepEqual(toolbar.classList.added, ['is-dragging']);
  assert.deepEqual(body.classList.added, ['fds-toolbar-dragging']);
  assert.deepEqual(capturedPointers, [7]);

  toolbarUI.clearToolbarDragActiveState({ toolbar, body });

  assert.deepEqual(toolbar.classList.removed, ['is-dragging']);
  assert.deepEqual(body.classList.removed, ['fds-toolbar-dragging']);
});

test('toolbar UI tolerates pointer capture failures during drag activation', () => {
  const toolbarUI = createContentToolbarUI();
  const toolbar = createElement();
  toolbar.setPointerCapture = () => {
    throw new Error('capture unavailable');
  };

  assert.doesNotThrow(() => toolbarUI.applyToolbarDragActiveState({
    toolbar,
    rect: { left: 8, top: 16 },
    pointerId: 3,
  }));
  assert.equal(toolbar.style.left, '8px');
  assert.equal(toolbar.style.top, '16px');
});

test('toolbar UI calculates drag movement threshold', () => {
  const toolbarUI = createContentToolbarUI();

  assert.deepEqual(toolbarUI.getToolbarDragMovement({
    startPointer: { x: 10, y: 20 },
    currentPointer: { x: 13, y: 23 },
  }), {
    deltaX: 3,
    deltaY: 3,
    movedEnough: false,
  });

  assert.deepEqual(toolbarUI.getToolbarDragMovement({
    startPointer: { x: 10, y: 20 },
    currentPointer: { x: 14, y: 23 },
  }), {
    deltaX: 4,
    deltaY: 3,
    movedEnough: true,
  });
});

test('toolbar UI delegates toolbar drag next position calculation', () => {
  const calls = [];
  const toolbarUI = createContentToolbarUI({
    computeToolbarDragPosition: (input) => {
      calls.push(input);
      return { left: 48, top: 64 };
    },
  });

  const result = toolbarUI.getToolbarDragNextPosition({
    dragState: {
      startPointer: { x: 1, y: 2 },
      startRect: { left: 10, top: 20, width: 320, height: 48 },
    },
    currentPointer: { x: 8, y: 9 },
    viewport: { width: 800, height: 600 },
    margin: 12,
  });

  assert.deepEqual(result, { left: 48, top: 64 });
  assert.deepEqual(calls, [{
    startPointer: { x: 1, y: 2 },
    currentPointer: { x: 8, y: 9 },
    startRect: { left: 10, top: 20, width: 320, height: 48 },
    viewport: { width: 800, height: 600 },
    margin: 12,
  }]);
});

test('toolbar UI applies toolbar drag position', () => {
  const toolbarUI = createContentToolbarUI();
  const toolbar = createElement();

  toolbarUI.applyToolbarDragPosition(toolbar, { left: 48, top: 64 });

  assert.equal(toolbar.style.left, '48px');
  assert.equal(toolbar.style.top, '64px');
});
