(function initSnapshotTokenSource(globalScope) {
  const TOKEN_KEYS = new Set(['value', '$value', 'type', '$type']);
  const ROOT_FILE_KEYS = {
    mode: 'mode',
    'mode.json': 'mode',
    fasoo: 'fasoo',
    'fasoo.json': 'fasoo',
    light: 'light',
    'light.json': 'light',
    dark: 'dark',
    'dark.json': 'dark',
  };

  function normalizeHexColor(value) {
    const text = String(value || '').trim();
    if (!text.startsWith('#')) return null;
    if (text.length === 4) {
      const [, r, g, b] = text;
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (text.length === 7) return text.toLowerCase();
    return null;
  }

  function normalizeColorObject(value) {
    if (!value || typeof value !== 'object') return null;

    const hex = normalizeHexColor(value.hex);
    if (hex) return hex;

    if (Number.isFinite(value.red) && Number.isFinite(value.green) && Number.isFinite(value.blue)) {
      return normalizeHexColor(
        `#${[value.red, value.green, value.blue]
          .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
          .join('')}`
      );
    }

    return null;
  }

  function appendToken(map, key, tokenName) {
    if (key == null || !tokenName) return;
    const normalizedKey = String(key);
    if (!map[normalizedKey]) map[normalizedKey] = [];
    if (!map[normalizedKey].includes(tokenName)) {
      map[normalizedKey].push(tokenName);
      map[normalizedKey].sort((a, b) => a.localeCompare(b));
    }
  }

  function readTokenValue(token) {
    return token?.$value ?? token?.value;
  }

  function readTokenType(token) {
    return token?.$type ?? token?.type ?? null;
  }

  function isTokenLeaf(node) {
    return Boolean(
      node &&
      typeof node === 'object' &&
      !Array.isArray(node) &&
      (Object.prototype.hasOwnProperty.call(node, 'value') ||
        Object.prototype.hasOwnProperty.call(node, '$value')) &&
      (Object.prototype.hasOwnProperty.call(node, 'type') ||
        Object.prototype.hasOwnProperty.call(node, '$type'))
    );
  }

  function flattenTokenTree(payload) {
    const tokens = {};

    function visit(node, path = []) {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return;

      if (isTokenLeaf(node)) {
        tokens[path.join('.')] = {
          value: readTokenValue(node),
          type: readTokenType(node),
        };
        return;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (TOKEN_KEYS.has(key)) return;
        visit(value, path.concat(key));
      });
    }

    visit(payload);
    return tokens;
  }

  function normalizeSnapshotPayloads(payloads = {}) {
    const source = payloads && typeof payloads === 'object' ? payloads : {};
    const normalized = {
      primitives: [],
      themes: {},
      collections: [],
    };

    Object.entries(source).forEach(([rawKey, payload]) => {
      if (Array.isArray(payload?.variables) && payload?.collection) {
        normalized.collections.push(payload);
        return;
      }

      const key = ROOT_FILE_KEYS[String(rawKey).toLowerCase()] || String(rawKey).toLowerCase();
      if (key === 'light' || key === 'dark') {
        normalized.themes[key] = payload || {};
        return;
      }
      normalized.primitives.push(payload || {});
    });

    return normalized;
  }

  function createSnapshotMaps(snapshot) {
    const normalized = snapshot?.primitives && snapshot?.themes
      ? snapshot
      : normalizeSnapshotPayloads(snapshot);
    const primitiveTokens = Object.assign(
      {},
      ...normalized.primitives.map((payload) => flattenTokenTree(payload))
    );
    const themeTokens = Object.fromEntries(
      Object.entries(normalized.themes).map(([themeName, payload]) => [
        themeName,
        flattenTokenTree(payload),
      ])
    );

    return { primitiveTokens, themeTokens };
  }

  function resolveTokenValue(tokenPath, snapshot, themeName = null, seen = new Set()) {
    const { primitiveTokens, themeTokens } = createSnapshotMaps(snapshot);
    const themeMap = themeName ? themeTokens[themeName] || {} : {};

    function resolve(path) {
      if (seen.has(path)) return undefined;
      seen.add(path);

      const token = themeMap[path] || primitiveTokens[path];
      if (!token) return undefined;

      const value = readTokenValue(token);
      if (typeof value !== 'string') return value;

      const ref = value.trim().match(/^\{(.+)\}$/);
      if (!ref) return value;
      return resolve(ref[1]);
    }

    return resolve(tokenPath);
  }

  function dimensionToPx(value, tokenName = '') {
    if (tokenName === 'radius.circle') return '9999px';
    const text = String(value ?? '').trim().toLowerCase();
    if (!text) return null;

    if (text.endsWith('px')) {
      const px = Number.parseFloat(text);
      return Number.isFinite(px) ? `${px}px` : null;
    }

    if (text.endsWith('rem')) {
      const rem = Number.parseFloat(text);
      return Number.isFinite(rem) ? `${Math.round(rem * 16 * 1000) / 1000}px` : null;
    }

    const numeric = Number.parseFloat(text);
    return Number.isFinite(numeric) ? `${numeric}px` : null;
  }

  function pxTextToNumber(value) {
    const text = String(value || '').trim();
    if (!text.endsWith('px')) return null;
    const numeric = Number.parseFloat(text);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function buildSnapshotTokenSpecs(payloads = {}) {
    const snapshot = normalizeSnapshotPayloads(payloads);
    const { primitiveTokens, themeTokens } = createSnapshotMaps(snapshot);
    const colors = {};
    const spacingTokens = {};
    const radiusTokens = {};
    const unresolvedReferences = [];

    function collectToken(path, token, themeName = null) {
      const type = String(readTokenType(token) || '').toLowerCase();
      const resolvedValue = resolveTokenValue(path, snapshot, themeName);

      if (resolvedValue === undefined && typeof readTokenValue(token) === 'string') {
        unresolvedReferences.push({ path, theme: themeName });
        return;
      }

      if (type === 'color') {
        appendToken(colors, normalizeHexColor(resolvedValue), path);
        return;
      }

      if (type === 'dimension') {
        const px = dimensionToPx(resolvedValue, path);
        if (!px) return;
        if (path.startsWith('spacing.')) {
          const numericPx = pxTextToNumber(px);
          if (Number.isFinite(numericPx)) appendToken(spacingTokens, numericPx, path);
        } else if (path.startsWith('radius.')) {
          appendToken(radiusTokens, px, path);
        }
      }
    }

    function collectResolvedVariableValue(variable, value) {
      const type = String(variable?.resolvedType || '').toUpperCase();
      const tokenName = typeof variable?.name === 'string' ? variable.name : null;
      if (!tokenName) return;

      if (type === 'COLOR') {
        appendToken(colors, normalizeColorObject(value) || normalizeHexColor(value), tokenName);
        return;
      }

      if (type === 'FLOAT') {
        const px = dimensionToPx(value, tokenName.replace(/\//g, '.'));
        if (!px) return;
        if (tokenName.startsWith('spacing/')) {
          const numericPx = pxTextToNumber(px);
          if (Number.isFinite(numericPx)) appendToken(spacingTokens, numericPx, tokenName);
        } else if (tokenName.startsWith('radius/')) {
          appendToken(radiusTokens, px, tokenName);
        }
      }
    }

    function collectVariable(variable) {
      if (!variable || typeof variable !== 'object') return;
      const resolvedValues = variable.resolvedValuesByMode && typeof variable.resolvedValuesByMode === 'object'
        ? variable.resolvedValuesByMode
        : variable.valuesByMode;

      if (resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)) {
        Object.values(resolvedValues).forEach((value) => collectResolvedVariableValue(variable, value));
      }
    }

    snapshot.collections.forEach((collection) => {
      if (!Array.isArray(collection?.variables)) return;
      collection.variables.forEach(collectVariable);
    });

    Object.entries(primitiveTokens).forEach(([path, token]) => collectToken(path, token, null));
    Object.entries(themeTokens).forEach(([themeName, tokens]) => {
      Object.entries(tokens).forEach(([path, token]) => collectToken(path, token, themeName));
    });

    const spacing = Object.keys(spacingTokens)
      .map((value) => Number.parseFloat(value))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    const radius = Object.keys(radiusTokens).sort((a, b) => {
      const rank = (value) => value === '9999px' ? Number.MAX_SAFE_INTEGER : Number.parseFloat(value);
      return rank(a) - rank(b);
    });

    return {
      colors,
      spacing,
      radius,
      spacingTokens,
      radiusTokens,
      meta: {
        source: 'snapshot',
        themeCount: Object.keys(themeTokens).length,
        collectionCount: snapshot.collections.length,
        colorTokenCount: Object.values(colors).reduce((sum, items) => sum + items.length, 0),
        spacingTokenCount: Object.values(spacingTokens).reduce((sum, items) => sum + items.length, 0),
        radiusTokenCount: Object.values(radiusTokens).reduce((sum, items) => sum + items.length, 0),
        unresolvedReferenceCount: unresolvedReferences.length,
      },
    };
  }

  const api = {
    buildSnapshotTokenSpecs,
    dimensionToPx,
    flattenTokenTree,
    normalizeSnapshotPayloads,
    resolveTokenValue,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSSnapshotTokenSource = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
