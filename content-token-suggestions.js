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
            if (/^Color[./]/.test(text)) value += 80;
            if (/^(spacing|radius)[./]/.test(text)) value += 75;
            if (/\b(text|bg|background|border|surface)\b/i.test(text)) value += 10;
            if (!/^(light|dark|Unit)\./i.test(text)) value += 5;
            if (/^(?:var\()?--(?:color|spacing|radius|typography|shadow)-/i.test(text)) value += 30;
            if (/^-?(?:p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy]|rounded(?:-[trbl]{1,2})?|text|bg|border|shadow)-/i.test(text)) value -= 30;
            return value;
          };
          return score(b) - score(a) || String(a).localeCompare(String(b));
        });
    }

    function getNearestTokenNames(tokenMap = {}, numericValue) {
      if (!Number.isFinite(numericValue)) return [];
      const candidates = Object.entries(tokenMap)
        .map(([value, tokens]) => ({
          value: Number.parseFloat(value),
          tokens: Array.isArray(tokens) ? tokens : [],
        }))
        .filter((candidate) => Number.isFinite(candidate.value) && candidate.tokens.length > 0)
        .sort((a, b) => (
          Math.abs(a.value - numericValue) - Math.abs(b.value - numericValue)
          || a.value - b.value
        ));
      if (!candidates.length) return [];

      const closestDistance = Math.abs(candidates[0].value - numericValue);
      const maxSimilarDistance = Math.max(2, Math.min(16, Math.abs(numericValue) * 0.25));
      if (closestDistance > maxSimilarDistance) return [];
      return candidates
        .filter((candidate) => Math.abs(candidate.value - numericValue) === closestDistance)
        .flatMap((candidate) => candidate.tokens);
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
      const isRawValueIssue = message.includes('원시값 직접 사용');
      const isUnregisteredIssue = message.includes('미등록');
      if (!isRawValueIssue && !isUnregisteredIssue) return [];

      const parsed = parseViolationItem(message);
      const activeSpecs = getActiveInspectorSpecs();
      if (entry?.category === 'color') {
        return filterColorTokensForIssue(getKnownColorTokens(parsed.value), entry, parsed).slice(0, 3);
      }

      if (entry?.category === 'spacing') {
        const numericValue = Number.parseFloat(parsed.value);
        const exactTokens = Number.isFinite(numericValue)
          ? activeSpecs.spacingTokens?.[numericValue] || activeSpecs.spacingTokens?.[String(numericValue)] || []
          : [];
        const mappedTokens = exactTokens.length > 0
          ? exactTokens
          : isUnregisteredIssue
            ? getNearestTokenNames(activeSpecs.spacingTokens, numericValue)
            : [];
        return rankSuggestedTokens([...mappedTokens, ...extractTokenNamesFromTag(parsed.tag)]).slice(0, 3);
      }

      if (entry?.category === 'radius') {
        const numericValue = Number.parseFloat(parsed.value);
        const exactTokens = activeSpecs.radiusTokens?.[parsed.value] || [];
        const mappedTokens = exactTokens.length > 0
          ? exactTokens
          : isUnregisteredIssue
            ? getNearestTokenNames(activeSpecs.radiusTokens, numericValue)
            : [];
        return rankSuggestedTokens([...mappedTokens, ...extractTokenNamesFromTag(parsed.tag)]).slice(0, 3);
      }

      return extractTokenNamesFromTag(parsed.tag).slice(0, 3);
    }

    return {
      rankSuggestedTokens,
      getNearestTokenNames,
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
