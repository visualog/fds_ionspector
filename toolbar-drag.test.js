const test = require('node:test');
const assert = require('node:assert/strict');

const {
  computeElementScrollTarget,
  computeToolbarDragPosition,
  shouldStartToolbarDrag,
} = require('./toolbar-drag.js');

test('computeToolbarDragPosition applies pointer delta', () => {
  const result = computeToolbarDragPosition({
    startPointer: { x: 100, y: 200 },
    currentPointer: { x: 140, y: 260 },
    startRect: { left: 20, top: 30, width: 384, height: 48 },
    viewport: { width: 1000, height: 800 },
  });

  assert.deepEqual(result, { left: 60, top: 90 });
});

test('computeToolbarDragPosition clamps inside viewport with margin', () => {
  const result = computeToolbarDragPosition({
    startPointer: { x: 100, y: 100 },
    currentPointer: { x: -200, y: 2000 },
    startRect: { left: 24, top: 40, width: 384, height: 48 },
    viewport: { width: 500, height: 300 },
    margin: 12,
  });

  assert.deepEqual(result, { left: 12, top: 240 });
});

test('computeToolbarDragPosition preserves room for toolbar width and height', () => {
  const result = computeToolbarDragPosition({
    startPointer: { x: 50, y: 50 },
    currentPointer: { x: 900, y: 900 },
    startRect: { left: 16, top: 16, width: 320, height: 48 },
    viewport: { width: 360, height: 220 },
    margin: 16,
  });

  assert.deepEqual(result, { left: 24, top: 156 });
});

test('computeToolbarDragPosition works for summary panel geometry too', () => {
  const result = computeToolbarDragPosition({
    startPointer: { x: 260, y: 180 },
    currentPointer: { x: 320, y: 240 },
    startRect: { left: 120, top: 100, width: 240, height: 320 },
    viewport: { width: 800, height: 700 },
    margin: 12,
  });

  assert.deepEqual(result, { left: 180, top: 160 });
});

test('shouldStartToolbarDrag allows the move handle in expanded mode', () => {
  assert.equal(
    shouldStartToolbarDrag({
      isCollapsed: false,
      isMoveHandleTarget: true,
      isInsideToolbar: true,
    }),
    true
  );
});

test('shouldStartToolbarDrag blocks non-handle targets in expanded mode', () => {
  assert.equal(
    shouldStartToolbarDrag({
      isCollapsed: false,
      isMoveHandleTarget: false,
      isInsideToolbar: true,
    }),
    false
  );
});

test('shouldStartToolbarDrag allows dragging anywhere on the collapsed toolbar', () => {
  assert.equal(
    shouldStartToolbarDrag({
      isCollapsed: true,
      isMoveHandleTarget: false,
      isInsideToolbar: true,
    }),
    true
  );
});

test('computeElementScrollTarget centers an issue element in the viewport', () => {
  const result = computeElementScrollTarget({
    rect: { left: 400, top: 800, width: 120, height: 40 },
    scroll: { x: 0, y: 200 },
    viewport: { width: 1000, height: 700 },
  });

  assert.deepEqual(result, { left: 0, top: 670 });
});

test('computeElementScrollTarget clamps negative scroll positions to the page origin', () => {
  const result = computeElementScrollTarget({
    rect: { left: 20, top: 40, width: 80, height: 40 },
    scroll: { x: 0, y: 0 },
    viewport: { width: 1000, height: 700 },
  });

  assert.deepEqual(result, { left: 0, top: 0 });
});
