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
      toggle(className, enabled) {
        this.toggles.push([className, enabled]);
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
