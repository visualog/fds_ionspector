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

    function getColorPartFromIssue(entry, parsed = {}) {
      if (entry?.colorPart) return entry.colorPart;
      if (parsed.chip === '배경색') return 'bg';
      if (parsed.chip === '글자색') return 'text';
      if (parsed.chip === '보더색' || parsed.chip === '외곽선') return 'border';
      return null;
    }

    function getColorPartFromTokenName(token) {
      const parts = String(token || '')
        .toLowerCase()
        .split(/[./_\-\s]+/)
        .filter(Boolean);
      if (parts.includes('text') || parts.includes('foreground') || parts.includes('content')) return 'text';
      if (parts.includes('border') || parts.includes('stroke') || parts.includes('outline')) return 'border';
      if (parts.includes('bg') || parts.includes('background') || parts.includes('surface')) return 'bg';
      return null;
    }

    function filterColorTokensForIssue(tokens = [], entry, parsed = {}) {
      const colorPart = getColorPartFromIssue(entry, parsed);
      if (!colorPart) return tokens;
      const rankedTokens = rankSuggestedTokens(tokens);
      const matchingTokens = rankedTokens.filter((token) => getColorPartFromTokenName(token) === colorPart);
      if (matchingTokens.length > 0) return matchingTokens;
      return rankedTokens.filter((token) => getColorPartFromTokenName(token) === null);
    }

    function getSuggestedTokensForIssue(entry) {
      const message = String(entry?.message || '');
      if (!message.includes('원시값 직접 사용')) return [];

      const parsed = parseViolationItem(message);
      const activeSpecs = getActiveInspectorSpecs();
      if (entry?.category === 'color') {
        return filterColorTokensForIssue(getKnownColorTokens(parsed.value), entry, parsed).slice(0, 3);
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
      filterColorTokensForIssue,
      getSuggestedTokensForIssue,
    };
  }

  const api = { createContentTokenSuggestions };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentTokenSuggestions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
