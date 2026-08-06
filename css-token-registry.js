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

  function buildCssVariableRegistry(tokenNames = []) {
    const variables = {};
    (Array.isArray(tokenNames) ? tokenNames : [tokenNames]).forEach((tokenName) => {
      const originalName = typeof tokenName === 'string' ? tokenName.trim() : '';
      appendTokenName(variables, toStorybookCssVariableName(originalName), originalName);
    });
    return {
      variables,
      meta: { cssVariableCount: Object.keys(variables).length },
    };
  }

  const api = { buildCssVariableRegistry, toStorybookCssVariableName };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSCssTokenRegistry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
