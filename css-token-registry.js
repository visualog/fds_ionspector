(function initCssTokenRegistry(globalScope) {
  function toStorybookCssVariableName(tokenName) {
    const normalized = String(tokenName || '')
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/[./_\s]+/g, '-')
      .replace(/[^a-zA-Z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return normalized ? `--${normalized}` : null;
  }

  function appendTokenName(variables, variableName, tokenName) {
    if (!variableName || !tokenName) return;
    if (!variables[variableName]) variables[variableName] = [];
    if (!variables[variableName].includes(tokenName)) {
      variables[variableName].push(tokenName);
      variables[variableName].sort((left, right) => left.localeCompare(right));
    }
  }

  function buildTailwindSpacingAliases(spacingTokens = {}, spacingUnit = 4) {
    return Object.entries(spacingTokens || {}).reduce((aliases, [rawValue, tokenNames]) => {
      const value = Number.parseFloat(rawValue);
      const step = value / spacingUnit;
      if (!Number.isFinite(value) || !Number.isInteger(step) || step < 0) return aliases;

      const names = Array.isArray(tokenNames) ? tokenNames.filter(Boolean) : [];
      if (!names.length) return aliases;

      aliases[`--spacing-${step}`] = {
        tokenNames: [...new Set(names)].sort((left, right) => left.localeCompare(right)),
        expectedValue: `${value}px`,
        source: 'tailwind-spacing',
      };
      return aliases;
    }, {});
  }

  function buildCssVariableRegistry(tokenNames = [], { aliases = {} } = {}) {
    const variables = {};
    (Array.isArray(tokenNames) ? tokenNames : [tokenNames]).forEach((tokenName) => {
      const originalName = typeof tokenName === 'string' ? tokenName.trim() : '';
      appendTokenName(variables, toStorybookCssVariableName(originalName), originalName);
    });

    const normalizedAliases = Object.entries(aliases || {}).reduce((result, [variableName, alias]) => {
      const names = Array.isArray(alias?.tokenNames) ? alias.tokenNames.filter(Boolean) : [];
      const expectedValue = String(alias?.expectedValue || '').trim();
      if (!variableName || !names.length || !expectedValue) return result;
      result[variableName] = {
        tokenNames: [...new Set(names)].sort((left, right) => left.localeCompare(right)),
        expectedValue,
        source: String(alias?.source || 'alias'),
      };
      return result;
    }, {});

    return {
      variables,
      ...(Object.keys(normalizedAliases).length ? { aliases: normalizedAliases } : {}),
      meta: { cssVariableCount: new Set([...Object.keys(variables), ...Object.keys(normalizedAliases)]).size },
    };
  }

  const api = {
    buildCssVariableRegistry,
    buildTailwindSpacingAliases,
    toStorybookCssVariableName,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSCssTokenRegistry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
