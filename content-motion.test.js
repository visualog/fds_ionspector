const test = require('node:test');
const assert = require('node:assert/strict');

const { createFDSMotion } = require('./content-motion.js');

function createGsapRecorder() {
  const calls = [];
  return {
    calls,
    gsap: {
      killTweensOf(target) {
        calls.push(['killTweensOf', target]);
      },
      timeline(config) {
        calls.push(['timeline', config]);
        return {
          set(targets, vars, position) {
            calls.push(['timeline.set', targets, vars, position]);
            return this;
          },
          to(targets, vars, position) {
            calls.push(['timeline.to', targets, vars, position]);
            return this;
          },
          fromTo(targets, fromVars, toVars, position) {
            calls.push(['timeline.fromTo', targets, fromVars, toVars, position]);
            return this;
          },
          add() {
            calls.push(['timeline.add']);
            return this;
          },
        };
      },
      fromTo(targets, fromVars, toVars) {
        calls.push(['fromTo', targets, fromVars, toVars]);
      },
      set(targets, vars) {
        calls.push(['set', targets, vars]);
      },
      to(targets, vars) {
        calls.push(['to', targets, vars]);
      },
    },
  };
}

function createPanel() {
  const stat = { className: 'fds-stat-box' };
  const group = { className: 'fds-list-group' };
  const item = { className: 'fds-list-item' };
  const empty = { className: 'fds-list-empty' };
  return {
    querySelectorAll(selector) {
      if (selector.includes('.fds-stat-box')) return [stat, group, item, empty];
      return [];
    },
  };
}

test('FDSMotion animates panel entry and summary content with a GSAP timeline', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const panel = createPanel();

  assert.equal(motion.animatePanelOpen(panel), true);

  assert.equal(calls[0][0], 'killTweensOf');
  assert.equal(calls[1][0], 'timeline');
  assert.equal(calls[2][0], 'timeline.fromTo');
  assert.equal(calls[3][0], 'timeline.fromTo');
  assert.equal(calls[2][3].duration <= 0.24, true);
  assert.equal(calls[3][3].stagger > 0, true);
});

test('FDSMotion skips movement when the user prefers reduced motion', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: true }),
  });

  assert.equal(motion.animatePanelOpen(createPanel()), false);
  assert.equal(motion.animateInspectorCard({}), false);
  assert.equal(calls.length, 0);
});

test('FDSMotion uses GSAP for inspector card, pin, and copy feedback', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const card = { id: 'card' };
  const pin = { id: 'pin' };
  const button = { id: 'copy' };

  assert.equal(motion.animateInspectorCard(card), true);
  assert.equal(motion.animatePin(pin), true);
  assert.equal(motion.animateCopySuccess(button), true);

  assert.equal(calls.filter(([name]) => name === 'fromTo').length, 3);
});

test('inspector card remains pointer-hittable while its entry animation runs', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const card = { id: 'card' };

  assert.equal(motion.animateInspectorCard(card), true);

  const cardCall = calls.find(([name, target]) => name === 'fromTo' && target === card);
  assert.ok(cardCall);
  assert.equal(cardCall[2].opacity, 0);
  assert.equal(cardCall[2].autoAlpha, undefined);
  assert.equal(cardCall[3].opacity, 1);
  assert.equal(cardCall[3].autoAlpha, undefined);
});

test('FDSMotion animates summary panel movement from the previous position', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const panel = { id: 'summary-panel', style: {} };

  assert.equal(motion.animateSummaryPanelMove(panel, {
    fromRect: { left: 80, top: 320 },
    toRect: { left: 140, top: 260 },
  }), true);

  const moveCall = calls.find(([name, target]) => name === 'fromTo' && target === panel);
  assert.ok(moveCall, 'summary panel move should use a GSAP fromTo tween');
  assert.equal(moveCall[2].x, -60);
  assert.equal(moveCall[2].y, 60);
  assert.equal(moveCall[3].x, 0);
  assert.equal(moveCall[3].y, 0);
  assert.equal(moveCall[3].duration <= 0.36, true);
  assert.equal(moveCall[3].overwrite, 'auto');
});

test('FDSMotion animates summary refresh with panel and list height transitions', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const summaryList = { className: 'fds-summary-list is-scrollable', scrollHeight: 210, children: [{ id: 'row-1' }, { id: 'row-2' }, { id: 'row-3' }] };
  const panel = {
    className: 'fds-summary-card',
    querySelector(selector) {
      if (selector === '.fds-summary-list') return summaryList;
      if (selector === '.fds-summary-tab.active') return {};
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.fds-stat-box, .fds-list-group, .fds-list-item, .fds-list-empty') {
        return [{ id: 'target' }];
      }
      return [];
    },
    getBoundingClientRect() {
      return { height: 140 };
    },
    get scrollHeight() {
      return 170;
    },
    style: {},
  };

  assert.equal(motion.animateSummaryRefresh(panel, {
    listChanged: true,
    fromPanelHeight: 170,
    toPanelHeight: 188,
    fromListHeight: 210,
    toListHeight: 120,
    shouldAnimateListHeight: true,
  }), true);

  assert.equal(calls[0][0], 'killTweensOf');
  assert.equal(Array.isArray(calls[0][1]), true);
  assert.equal(calls[0][1].includes(panel), true);
  assert.equal(calls[0][1].includes(summaryList), true);
  assert.equal(calls[0][1].includes(summaryList.children[0]), true);
  const names = calls.map(([name]) => name);
  assert.equal(names.includes('timeline'), true);
  assert.equal(names.includes('timeline.to'), true);
  const panelHeightTween = calls.find(([name, target, fromVars, toVars]) => (
    name === 'timeline.fromTo'
    && target === panel
    && fromVars.height === '170px'
    && toVars.height === '188px'
  ));
  assert.ok(panelHeightTween, 'panel height should use a single GSAP fromTo tween');
  const listHeightTween = calls.find(([name, target, fromVars, toVars]) => (
    name === 'timeline.fromTo'
    && target === summaryList
    && fromVars.height === '210px'
    && toVars.height === '120px'
  ));
  assert.ok(listHeightTween, 'summary list height should use a single GSAP fromTo tween');
  const listSetCall = calls.find(([name, target]) => name === 'timeline.set' && target === summaryList);
  assert.equal(listSetCall, undefined, 'summary list height should not be split across set/to calls');
  assert.equal(listHeightTween[2].overflowY, 'auto');
  assert.equal(listHeightTween[2].overflowX, 'hidden');
  assert.equal(Object.prototype.hasOwnProperty.call(listHeightTween[2], 'overflow'), false);
  assert.equal(listHeightTween[2].y, 0);
  assert.equal(listHeightTween[3].y, 0);
  assert.equal(Object.prototype.hasOwnProperty.call(listHeightTween[2], 'transform'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(listHeightTween[3], 'transform'), false);
});

test('FDSMotion restores a summary panel left invisible by an interrupted animation', () => {
  const { gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const summaryList = { className: 'fds-summary-list', scrollHeight: 120, children: [] };
  const panelClasses = new Set(['fds-summary-card', 'is-resizing']);
  const panel = {
    className: 'fds-summary-card is-resizing',
    classList: {
      add(...names) {
        names.forEach((name) => panelClasses.add(name));
      },
      remove(...names) {
        names.forEach((name) => panelClasses.delete(name));
      },
      contains(name) {
        return panelClasses.has(name);
      },
    },
    querySelector(selector) {
      if (selector === '.fds-summary-list') return summaryList;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getBoundingClientRect() {
      return { height: 120 };
    },
    scrollHeight: 160,
    style: {
      opacity: '0',
      visibility: 'hidden',
      transform: 'matrix(0.985, 0, 0, 0.985, -92, 0)',
      willChange: 'height,opacity,transform',
    },
  };

  assert.equal(motion.animateSummaryRefresh(panel, {
    listChanged: true,
    fromPanelHeight: 120,
    toPanelHeight: 160,
    fromListHeight: 80,
    toListHeight: 120,
    shouldAnimateListHeight: true,
  }), true);

  assert.equal(panel.style.opacity, '');
  assert.equal(panel.style.visibility, '');
  assert.equal(panel.style.transform, '');
  assert.equal(panel.style.willChange, '');
});

test('FDSMotion stacks growing list items during summary refresh', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const summaryList = { className: 'fds-summary-list', scrollHeight: 120, children: [{ id: 'row-1' }, { id: 'row-2' }, { id: 'row-3' }] };
  const panel = {
    className: 'fds-summary-card',
    querySelector(selector) {
      if (selector === '.fds-summary-list') return summaryList;
      if (selector === '.fds-summary-tab.active') return {};
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.fds-stat-box, .fds-list-group, .fds-list-item, .fds-list-empty') {
        return [{ id: 'target' }];
      }
      return [];
    },
    getBoundingClientRect() {
      return { height: 120 };
    },
    get scrollHeight() {
      return 140;
    },
    style: {},
  };

  assert.equal(motion.animateSummaryRefresh(panel, {
    listChanged: true,
    fromPanelHeight: 140,
    toPanelHeight: 160,
    fromListHeight: 120,
    toListHeight: 180,
    shouldAnimateListHeight: true,
  }), true);

  const timelineNames = calls.map(([name]) => name);
  assert.equal(timelineNames.includes('timeline.fromTo'), true);
  assert.equal(timelineNames.includes('timeline.to'), true);
  const hasListItemsTween = calls.some(([name, targets]) => name === 'timeline.to' && Array.isArray(targets) && targets.length === 3);
  assert.equal(hasListItemsTween, true);
});

test('FDSMotion stacks shrinking list items during summary refresh', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const summaryList = { className: 'fds-summary-list', scrollHeight: 90, children: [{ id: 'row-1' }, { id: 'row-2' }, { id: 'row-3' }] };
  const panel = {
    className: 'fds-summary-card',
    querySelector(selector) {
      if (selector === '.fds-summary-list') return summaryList;
      if (selector === '.fds-summary-tab.active') return {};
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.fds-stat-box, .fds-list-group, .fds-list-item, .fds-list-empty') {
        return [{ id: 'target' }];
      }
      return [];
    },
    getBoundingClientRect() {
      return { height: 160 };
    },
    get scrollHeight() {
      return 170;
    },
    style: {},
  };

  assert.equal(motion.animateSummaryRefresh(panel, {
    listChanged: true,
    fromPanelHeight: 170,
    toPanelHeight: 160,
    fromListHeight: 120,
    toListHeight: 90,
    shouldAnimateListHeight: true,
  }), true);

  const fromToCalls = calls.filter(([name]) => name === 'timeline.fromTo').length;
  assert.equal(fromToCalls >= 1, true);
  const hasListItemsTween = calls.some(([name, targets]) => name === 'timeline.to' && Array.isArray(targets) && targets.length === 3);
  assert.equal(hasListItemsTween, true);
});

test('FDSMotion crossfades previous list snapshot during summary refresh', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const summaryList = { className: 'fds-summary-list', scrollHeight: 90, children: [{ id: 'row-1' }, { id: 'row-2' }] };
  const ghost = { id: 'ghost-list', className: 'fds-summary-list-transition-ghost' };
  const panel = {
    className: 'fds-summary-card',
    querySelector(selector) {
      if (selector === '.fds-summary-list') return summaryList;
      if (selector === '.fds-summary-tab.active') return {};
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.fds-stat-box, .fds-list-group, .fds-list-item, .fds-list-empty') {
        return [{ id: 'target' }];
      }
      return [];
    },
    getBoundingClientRect() {
      return { height: 160 };
    },
    get scrollHeight() {
      return 170;
    },
    style: {},
  };

  assert.equal(motion.animateSummaryRefresh(panel, {
    listChanged: true,
    fromPanelHeight: 170,
    toPanelHeight: 160,
    fromListHeight: 120,
    toListHeight: 90,
    shouldAnimateListHeight: true,
    listTransitionElement: ghost,
  }), true);

  const hasGhostTransition = calls.some(([name, target]) => name === 'timeline.fromTo' && target === ghost);
  assert.equal(hasGhostTransition, true);
});

test('FDSMotion can resize expanded groups without fading list contents', () => {
  const { calls, gsap } = createGsapRecorder();
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });
  const summaryList = { className: 'fds-summary-list', scrollHeight: 180, children: [{ id: 'row-1' }, { id: 'row-2' }, { id: 'row-3' }] };
  const ghost = { id: 'ghost-list', className: 'fds-summary-list-transition-ghost' };
  const panel = {
    className: 'fds-summary-card',
    querySelector(selector) {
      if (selector === '.fds-summary-list') return summaryList;
      if (selector === '.fds-summary-tab.active') return {};
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.fds-stat-box, .fds-list-group, .fds-list-item, .fds-list-empty') {
        return [{ id: 'target' }];
      }
      return [];
    },
    getBoundingClientRect() {
      return { height: 150 };
    },
    get scrollHeight() {
      return 190;
    },
    style: {},
  };

  assert.equal(motion.animateSummaryRefresh(panel, {
    listChanged: true,
    fromPanelHeight: 150,
    toPanelHeight: 190,
    fromListHeight: 90,
    toListHeight: 180,
    shouldAnimateListHeight: true,
    listTransitionElement: ghost,
    revealListItems: false,
  }), true);

  const listHeightTween = calls.find(([name, target]) => name === 'timeline.fromTo' && target === summaryList);
  assert.ok(listHeightTween, 'summary list should still animate its height');
  assert.equal(listHeightTween[2].opacity, 1);
  const hasGhostTransition = calls.some(([name, target]) => name === 'timeline.fromTo' && target === ghost);
  assert.equal(hasGhostTransition, false);
  const hasListItemsTween = calls.some(([name, targets]) => name === 'timeline.to' && Array.isArray(targets) && targets.length === 3);
  assert.equal(hasListItemsTween, false);
});

test('FDSMotion animates detail panel tab movement with GSAP', () => {
  const { calls, gsap } = createGsapRecorder();
  const activeTab = { className: 'fds-summary-tab active' };
  const indicator = { className: 'fds-summary-tab-indicator' };
  const panel = {
    querySelector(selector) {
      if (selector === '.fds-summary-tab.active') return activeTab;
      if (selector === '.fds-summary-tab-indicator') return indicator;
      return null;
    },
  };
  const motion = createFDSMotion({
    gsap,
    matchMedia: () => ({ matches: false }),
  });

  assert.equal(motion.animateTabSwitch(panel), true);

  assert.deepEqual(calls.map(([name]) => name), [
    'killTweensOf',
    'to',
  ]);
});
