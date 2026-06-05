const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentFloatingInspector } = require('./content-floating-inspector.js');

function createInspector(viewport = { width: 320, height: 240 }) {
  return createContentFloatingInspector({
    clampPosition: (value, min, max) => Math.min(Math.max(value, min), max),
    getViewport: () => viewport,
  });
}

test('floating inspector computes overlap area for candidate rects', () => {
  const inspector = createInspector();

  assert.equal(
    inspector.getRectOverlapArea(
      { left: 0, top: 0, right: 20, bottom: 20 },
      { left: 10, top: 10, right: 30, bottom: 30 },
    ),
    100,
  );
  assert.equal(inspector.getRectOverlapArea(null, { left: 0, top: 0, right: 1, bottom: 1 }), 0);
});

test('floating inspector formats violation pin labels from the target element', () => {
  const inspector = createInspector();

  assert.equal(
    inspector.getViolationPinLabel({
      element: {
        tagName: 'BUTTON',
        id: 'save-action',
        className: 'primary large',
      },
    }),
    'button#save-action.primary',
  );
  assert.equal(inspector.getViolationPinLabel({}), 'element');
});

test('floating inspector card hide timer clears and schedules preview cleanup', () => {
  const inspector = createInspector();
  let nextTimerId = 0;
  const pendingTimers = new Map();
  const clearedTimers = [];
  let clearCount = 0;
  const timer = inspector.createInspectorCardHideTimer({
    hideDelayMs: 700,
    onClear: () => {
      clearCount += 1;
    },
    setTimeoutFn: (callback, delay) => {
      const id = `timer-${nextTimerId += 1}`;
      pendingTimers.set(id, { callback, delay });
      return id;
    },
    clearTimeoutFn: (id) => {
      clearedTimers.push(id);
      pendingTimers.delete(id);
    },
  });

  timer.schedule();
  assert.equal(timer.isScheduled(), true);
  assert.equal(pendingTimers.get('timer-1').delay, 700);

  timer.schedule();
  assert.deepEqual(clearedTimers, ['timer-1']);
  assert.equal(timer.isScheduled(), true);

  pendingTimers.get('timer-2').callback();
  assert.equal(clearCount, 1);
  assert.equal(timer.isScheduled(), false);
});

test('floating inspector detects whether a violation pin target is visible', () => {
  const inspector = createInspector({ width: 100, height: 80 });

  assert.equal(
    inspector.isViolationPinTargetVisible({
      width: 12,
      height: 8,
      left: 10,
      top: 10,
      right: 22,
      bottom: 18,
    }),
    true,
  );
  assert.equal(
    inspector.isViolationPinTargetVisible({
      width: 0,
      height: 8,
      left: 10,
      top: 10,
      right: 10,
      bottom: 18,
    }),
    false,
  );
  assert.equal(
    inspector.isViolationPinTargetVisible({
      width: 12,
      height: 8,
      left: 101,
      top: 10,
      right: 113,
      bottom: 18,
    }),
    false,
  );
});

test('floating inspector clamps pin candidates into the viewport', () => {
  const inspector = createInspector({ width: 100, height: 80 });

  const candidate = inspector.getClampedPinCandidate(
    { position: 'pin_RB', left: 90, top: 75 },
    20,
    16,
  );

  assert.equal(candidate.left, 76);
  assert.equal(candidate.top, 60);
  assert.deepEqual(candidate.rect, { left: 76, top: 60, right: 96, bottom: 76 });
});

test('floating inspector chooses a pin position that avoids inspector card overlap', () => {
  const inspector = createInspector({ width: 220, height: 180 });
  const targetRect = { left: 90, top: 70, right: 120, bottom: 100 };
  const avoidRect = { left: 118, top: 98, right: 170, bottom: 130 };

  assert.equal(inspector.getBestPinPosition(targetRect, 28, 24, avoidRect), 'pin_LT');
});
