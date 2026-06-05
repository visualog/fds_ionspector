const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentScanUtils } = require('./content-scan-utils.js');
const { createContentRenderers } = require('./content-render.js');

const { parseViolationItem } = createContentRenderers({
  iconPaths: { close: 'close.svg', warning: 'warning.svg' },
  getUrl: (path) => path,
});
const utils = createContentScanUtils({ parseViolationItem });

test('rgbToHex normalizes browser rgb strings', () => {
  assert.equal(utils.rgbToHex('rgb(255, 255, 255)'), '#ffffff');
  assert.equal(utils.rgbToHex('rgba(37, 45, 56, 0.5)'), '#252d38');
  assert.equal(utils.rgbToHex('#fff'), '#fff');
});

test('issue helpers classify color violations', () => {
  const message = '보더색 #f00 (원시값 직접 사용)';

  assert.equal(utils.getIssueTone(message), 'warning');
  assert.equal(utils.getIssueColorPart(message), 'border');
  assert.equal(utils.getIssueCategoryFromMessage(message, 'font'), 'color');
});

test('getDirectTextContent reads only direct text nodes', () => {
  const element = {
    childNodes: [
      { nodeType: 3, textContent: ' Hello ' },
      { nodeType: 1, textContent: 'ignored' },
      { nodeType: 3, textContent: 'World' },
    ],
  };

  assert.equal(utils.getDirectTextContent(element), 'Hello World');
  assert.equal(utils.hasDirectTextContent(element), true);
});
