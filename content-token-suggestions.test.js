const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentTokenSuggestions } = require('./content-token-suggestions.js');

function createSuggestions(overrides = {}) {
  return createContentTokenSuggestions({
    getActiveInspectorSpecs: () => ({
      spacingTokens: {
        8: ['spacing.2', 'Unit.Spacing.8'],
      },
      radiusTokens: {
        '12px': ['radius.12', 'Unit.Radius.12'],
      },
    }),
    getKnownColorTokens: (hex) => (hex === '#1a202c'
      ? [
        'dark.neutral.900',
        'Color.text.primary',
        'Color.bg.surface',
        'Color.border.primary',
        'Color/avatar/cool gray/text',
      ]
      : []),
    parseViolationItem: (message) => {
      const [, tag = '', value = ''] = String(message).match(/^(.*)\s+([^\s]+)\s+\(원시값 직접 사용/) || [];
      return { tag, value };
    },
    ...overrides,
  });
}

test('token suggestions rank design token names ahead of generic aliases', () => {
  const suggestions = createSuggestions();

  assert.deepEqual(
    suggestions.rankSuggestedTokens([
      'dark.neutral.900',
      'Color.text.primary',
      'Color.text.primary',
      'Unit.Spacing.8',
      'spacing.2',
    ]),
    ['Color.text.primary', 'spacing.2', 'dark.neutral.900', 'Unit.Spacing.8'],
  );
});

test('token suggestions extract token names from violation tags', () => {
  const suggestions = createSuggestions();

  assert.deepEqual(
    suggestions.extractTokenNamesFromTag('상단 패딩: spacing.2, Unit.Spacing.8'),
    ['spacing.2', 'Unit.Spacing.8'],
  );
  assert.deepEqual(suggestions.extractTokenNamesFromTag('상단 패딩'), []);
});

test('token suggestions resolve color raw-value issues from known token registries', () => {
  const suggestions = createSuggestions();

  assert.deepEqual(
    suggestions.getSuggestedTokensForIssue({
      category: 'color',
      colorPart: 'text',
      message: '글자색 #1a202c (원시값 직접 사용)',
    }),
    ['Color.text.primary', 'Color/avatar/cool gray/text'],
  );
});

test('token suggestions keep color replacements scoped to the issue part', () => {
  const suggestions = createSuggestions();

  assert.deepEqual(
    suggestions.getSuggestedTokensForIssue({
      category: 'color',
      colorPart: 'bg',
      message: '배경색 #1a202c (원시값 직접 사용)',
    }),
    ['Color.bg.surface'],
  );
  assert.deepEqual(
    suggestions.getSuggestedTokensForIssue({
      category: 'color',
      colorPart: 'border',
      message: '보더색 #1a202c (원시값 직접 사용)',
    }),
    ['Color.border.primary'],
  );
});

test('token suggestions combine spacing specs and parsed tag tokens', () => {
  const suggestions = createSuggestions({
    parseViolationItem: () => ({
      tag: '상단 패딩: spacing.3',
      value: '8px',
    }),
  });

  assert.deepEqual(
    suggestions.getSuggestedTokensForIssue({
      category: 'spacing',
      message: '상단 패딩 8px (원시값 직접 사용)',
    }),
    ['spacing.2', 'spacing.3', 'Unit.Spacing.8'],
  );
});

test('token suggestions extract radius replacement tokens from raw-value tags', () => {
  const suggestions = createSuggestions({
    parseViolationItem: () => ({
      tag: '원시값 직접 사용: radius.full',
      value: '999px',
    }),
  });

  assert.deepEqual(
    suggestions.getSuggestedTokensForIssue({
      category: 'radius',
      message: '라운드 999px (원시값 직접 사용: radius.full)',
    }),
    ['radius.full'],
  );
});

test('token suggestions ignore non raw-value issues', () => {
  const suggestions = createSuggestions();

  assert.deepEqual(
    suggestions.getSuggestedTokensForIssue({
      category: 'color',
      message: '글자색 #1a202c (미등록)',
    }),
    [],
  );
});
