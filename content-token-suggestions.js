(function initContentTokenSuggestions(globalScope) {
  function createContentTokenSuggestions({
    getActiveInspectorSpecs,
    getKnownColorTokens,
    parseViolationItem,
  }) {
    function rankSuggestedTokens(tokens = []) {
      return [...new Set(tokens.filter(Boolean))]
        .sort((a, b) => {
          const score = (token) => {
            const text = String(token);
            let value = 0;
            if (/^Color\./.test(text)) value += 40;
            if (/^(spacing|radius)\./.test(text)) value += 35;
            if (/\b(text|bg|background|border|surface)\b/i.test(text)) value += 10;
            if (!/^(light|dark|Unit)\./i.test(text)) value += 5;
            return value;
          };
          return score(b) - score(a) || String(a).localeCompare(String(b));
        });
    }

    function extractTokenNamesFromTag(tag) {
      const match = String(tag || '').match(/:\s*(.+)$/);
      if (!match) return [];
      return match[1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    function getSuggestedTokensForIssue(entry) {
      const message = String(entry?.message || '');
      if (!message.includes('원시값 직접 사용')) return [];

      const parsed = parseViolationItem(message);
      const activeSpecs = getActiveInspectorSpecs();
      if (entry?.category === 'color') {
        return rankSuggestedTokens(getKnownColorTokens(parsed.value)).slice(0, 3);
      }

      if (entry?.category === 'spacing') {
        const numericValue = Number.parseFloat(parsed.value);
        const mappedTokens = Number.isFinite(numericValue)
          ? activeSpecs.spacingTokens?.[numericValue] || activeSpecs.spacingTokens?.[String(numericValue)] || []
          : [];
        return rankSuggestedTokens([...mappedTokens, ...extractTokenNamesFromTag(parsed.tag)]).slice(0, 3);
      }

      if (entry?.category === 'radius') {
        const mappedTokens = activeSpecs.radiusTokens?.[parsed.value] || [];
        return rankSuggestedTokens([...mappedTokens, ...extractTokenNamesFromTag(parsed.tag)]).slice(0, 3);
      }

      return extractTokenNamesFromTag(parsed.tag).slice(0, 3);
    }

    return {
      rankSuggestedTokens,
      extractTokenNamesFromTag,
      getSuggestedTokensForIssue,
    };
  }

  const api = { createContentTokenSuggestions };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentTokenSuggestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
