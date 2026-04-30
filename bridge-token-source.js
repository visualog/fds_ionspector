(function initBridgeTokenSource(globalScope) {
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

  function normalizeMatches(payload) {
    const directMatches = Array.isArray(payload?.matches)
      ? payload.matches
      : Array.isArray(payload?.result?.matches)
        ? payload.result.matches
        : [];
    return directMatches.filter((item) => item && typeof item === 'object');
  }

  function extractSlashNumber(name, prefix) {
    if (typeof name !== 'string') return null;
    const normalizedPrefix = `${prefix}/`;
    if (!name.startsWith(normalizedPrefix)) return null;
    const rawValue = name.slice(normalizedPrefix.length).trim();
    if (!/^\d+$/.test(rawValue)) return null;
    return Number.parseInt(rawValue, 10);
  }

  function extractNumericScale(matches, prefix) {
    return [...new Set(
      matches
        .map((match) => extractSlashNumber(match.name, prefix))
        .filter((value) => Number.isFinite(value))
    )].sort((a, b) => a - b);
  }

  function extractRadiusScale(matches) {
    const numericRadius = matches
      .map((match) => {
        if (match?.name === 'radius/circle') return '9999px';
        const value = extractSlashNumber(match?.name, 'radius');
        return Number.isFinite(value) ? `${value}px` : null;
      })
      .filter(Boolean);

    return [...new Set(numericRadius)].sort((a, b) => {
      const rank = (value) => {
        if (value === '9999px') return Number.MAX_SAFE_INTEGER;
        return Number.parseInt(value, 10);
      };
      return rank(a) - rank(b);
    });
  }

  function normalizeVariableDefs(payload) {
    const variables = Array.isArray(payload?.variables)
      ? payload.variables
      : Array.isArray(payload?.result?.variables)
        ? payload.result.variables
        : [];
    return variables.filter((item) => item && typeof item === 'object');
  }

  function normalizeColorObject(value) {
    if (!value || typeof value !== 'object') return null;

    if (typeof value.hex === 'string') {
      return normalizeHexColor(value.hex);
    }

    if (Number.isFinite(value.red) && Number.isFinite(value.green) && Number.isFinite(value.blue)) {
      return normalizeHexColor(
        `#${[value.red, value.green, value.blue]
          .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
          .join('')}`
      );
    }

    return null;
  }

  function collectColorHexes(value, variablesById, seenVariableIds = new Set()) {
    const directHex = normalizeHexColor(value);
    if (directHex) return [directHex];

    const objectHex = normalizeColorObject(value);
    if (objectHex) return [objectHex];

    if (!value || typeof value !== 'object') return [];

    if (value.type === 'VARIABLE_ALIAS' && typeof value.id === 'string') {
      if (seenVariableIds.has(value.id)) return [];
      const aliasedVariable = variablesById.get(value.id);
      if (!aliasedVariable) return [];
      const nextSeen = new Set(seenVariableIds);
      nextSeen.add(value.id);
      return collectVariableHexes(aliasedVariable, variablesById, nextSeen);
    }

    if (Array.isArray(value)) {
      return [...new Set(value.flatMap((item) => collectColorHexes(item, variablesById, seenVariableIds)))];
    }

    return [...new Set(
      Object.values(value).flatMap((nested) => collectColorHexes(nested, variablesById, seenVariableIds))
    )];
  }

  function collectVariableHexes(variableDef, variablesById, seenVariableIds = new Set()) {
    const valuesByMode =
      variableDef && typeof variableDef === 'object' && variableDef.valuesByMode && typeof variableDef.valuesByMode === 'object'
        ? variableDef.valuesByMode
        : {};

    return [...new Set(
      Object.values(valuesByMode).flatMap((value) => collectColorHexes(value, variablesById, seenVariableIds))
    )];
  }

  function buildBridgeColorRegistry(payload) {
    const variables = normalizeVariableDefs(payload);
    const variablesById = new Map(
      variables
        .filter((variableDef) => typeof variableDef.id === 'string' && variableDef.id)
        .map((variableDef) => [variableDef.id, variableDef])
    );
    const colors = {};
    let colorVariableCount = 0;

    variables.forEach((variableDef) => {
      if (String(variableDef?.resolvedType || '').toUpperCase() !== 'COLOR') {
        return;
      }
      const tokenName = typeof variableDef?.name === 'string' ? variableDef.name : null;
      if (!tokenName) return;

      const hexes = collectVariableHexes(variableDef, variablesById, new Set([variableDef.id]));
      if (!hexes.length) return;

      colorVariableCount += 1;
      hexes.forEach((hex) => appendToken(colors, hex, tokenName));
    });

    return {
      colors,
      meta: {
        colorTokenCount: Object.values(colors).reduce((sum, items) => sum + items.length, 0),
        colorVariableCount,
      },
    };
  }

  function buildInspectorSpecOverrides({ spacingResult = null, radiusResult = null } = {}) {
    const spacingMatches = normalizeMatches(spacingResult);
    const radiusMatches = normalizeMatches(radiusResult);

    const spacing = extractNumericScale(spacingMatches, 'spacing');
    const radius = extractRadiusScale(radiusMatches);

    return {
      spacing,
      radius,
      meta: {
        spacingTokenCount: spacingMatches.length,
        radiusTokenCount: radiusMatches.length,
      },
    };
  }

  const api = {
    buildBridgeColorRegistry,
    buildInspectorSpecOverrides,
    extractNumericScale,
    extractRadiusScale,
    normalizeMatches,
    normalizeVariableDefs,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSBridgeTokenSource = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
