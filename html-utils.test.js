const test = require('node:test');
const assert = require('node:assert/strict');

const { escapeHtml } = require('./html-utils.js');

test('escapeHtml escapes text for HTML element and attribute contexts', () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('x')">&`),
    '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;'
  );
});

test('escapeHtml treats nullish values as empty text', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});
