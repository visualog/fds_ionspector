(function initTokenSource(globalScope) {
  function normalizeHexColor(value) {
    const text = String(value || '').trim();
    if (!text.startsWith('#')) return null;
    if (text.length === 4) {
      const [, r, g, b] = text;
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (text.length === 7) {
      return text.toLowerCase();
    }
    return null;
  }

  function appendToken(map, hex, tokenName) {
    if (!hex || !tokenName) return;
    if (!map[hex]) map[hex] = [];
    if (!map[hex].includes(tokenName)) {
      map[hex].push(tokenName);
      map[hex].sort((a, b) => a.localeCompare(b));
    }
  }

  function visitTokenTree(node, path, map) {
    if (!node || typeof node !== 'object') return;

    const directColor = normalizeHexColor(node.$value || node.value || node.hex);
    if (directColor && path.length > 0) {
      appendToken(map, directColor, path.join('.'));
    }

    Object.entries(node).forEach(([key, value]) => {
      if (['$value', 'value', 'hex', '$type', 'type', 'description'].includes(key)) return;
      if (!value || typeof value !== 'object') return;
      visitTokenTree(value, [...path, key], map);
    });
  }

  function extractColorTokenMap(payload) {
    const map = {};
    if (!payload || typeof payload !== 'object') return map;

    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'colors' && value && typeof value === 'object') {
        Object.entries(value).forEach(([tokenName, tokenValue]) => {
          const hex = normalizeHexColor(tokenValue?.hex || tokenValue?.value || tokenValue?.$value || tokenValue);
          appendToken(map, hex, tokenName);
        });
        return;
      }

      if (!value || typeof value !== 'object') return;
      visitTokenTree(value, [key], map);
    });

    return map;
  }

  function buildTokenRegistry(payload) {
    const colors = extractColorTokenMap(payload);
    return {
      colors,
      meta: {
        colorTokenCount: Object.values(colors).reduce((sum, items) => sum + items.length, 0),
      },
    };
  }

  const api = {
    buildTokenRegistry,
    extractColorTokenMap,
    normalizeHexColor,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSTokenSource = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
