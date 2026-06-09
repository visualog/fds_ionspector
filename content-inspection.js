(function initContentInspection(globalScope) {
  function createContentInspector({
    getActiveInspectorSpecs,
    getKnownColorTokens,
    hasAuthoredTokenReference,
    hasDirectTextContent,
    rgbToHex,
  }) {
    function formatKnownTokenList(tokens) {
      return Array.isArray(tokens) && tokens.length ? `: ${tokens.slice(0, 3).join(', ')}` : '';
    }

    function getSpacingTokens(specs, pxValue) {
      const tokenMap = specs?.spacingTokens || {};
      return tokenMap[pxValue] || tokenMap[String(pxValue)] || [];
    }

    function getRadiusTokens(specs, radius) {
      const tokenMap = specs?.radiusTokens || {};
      const directTokens = tokenMap[radius] || [];
      if (directTokens.length) return directTokens;

      const numericRadius = Number.parseFloat(radius);
      if (Number.isFinite(numericRadius) && numericRadius >= 999) {
        return tokenMap['9999px'] || [];
      }

      return [];
    }

    function getPxValue(value) {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function addSpacingIssue({ issues, activeSpecs, label, value }) {
      if (value <= 0) return;
      const tokens = getSpacingTokens(activeSpecs, value);
      if (tokens.length) {
        issues.push(`${label} ${value}px (원시값 직접 사용${formatKnownTokenList(tokens)})`);
      } else if (!activeSpecs.spacing.includes(value)) {
        issues.push(`${label} ${value}px (비규격)`);
      }
    }

    function inspectBoxSpacing({ issues, activeSpecs, styles, element, kind, sides }) {
      const values = sides.map((side) => ({
        ...side,
        value: getPxValue(styles[side.styleKey]),
      }));
      const positiveValues = values.filter((item) => item.value > 0);
      if (!positiveValues.length) return;

      const allSidesEqual = values.every((item) => item.value === values[0].value);
      if (allSidesEqual) {
        const tokenProps = [kind, ...sides.map((side) => side.cssProp)];
        if (!hasAuthoredTokenReference(element, tokenProps)) {
          addSpacingIssue({ issues, activeSpecs, label: kind === 'padding' ? '패딩' : '마진', value: values[0].value });
        }
        return;
      }

      values.forEach((item) => {
        if (item.value <= 0) return;
        if (hasAuthoredTokenReference(element, [item.cssProp, kind])) return;
        addSpacingIssue({ issues, activeSpecs, label: `${item.label} ${kind === 'padding' ? '패딩' : '마진'}`, value: item.value });
      });
    }

    function getInspectionForFilter(filter, styles, element = null) {
      const issues = [];
      const suggestions = [];
      const activeSpecs = getActiveInspectorSpecs();

      if (filter === 'color') {
        const bg = rgbToHex(styles.backgroundColor);
        const text = hasDirectTextContent(element) ? rgbToHex(styles.color) : null;
        const borderWidth = Number.parseFloat(styles.borderTopWidth || '0');
        const borderColor = rgbToHex(styles.borderTopColor);
        const bgUsesToken = hasAuthoredTokenReference(element, ['background-color', 'background']);
        const textUsesToken = hasAuthoredTokenReference(element, ['color']);
        const borderUsesToken = hasAuthoredTokenReference(element, [
          'border-color',
          'border-top-color',
          'border',
          'border-top',
        ]);

        if (bg && !bgUsesToken) {
          const tokens = getKnownColorTokens(bg);
          issues.push(tokens.length ? `배경색 ${bg} (원시값 직접 사용)` : `배경색 ${bg} (미등록)`);
        }

        if (text && !textUsesToken) {
          const tokens = getKnownColorTokens(text);
          issues.push(tokens.length ? `글자색 ${text} (원시값 직접 사용)` : `글자색 ${text} (미등록)`);
        }

        if (borderWidth > 0 && borderColor && !borderUsesToken) {
          const tokens = getKnownColorTokens(borderColor);
          issues.push(tokens.length ? `보더색 ${borderColor} (원시값 직접 사용)` : `보더색 ${borderColor} (미등록)`);
        }
      } else if (filter === 'font') {
        if (!hasDirectTextContent(element)) return { issues, suggestions };
        const font = styles.fontFamily.split(',')[0].replace(/"/g, '');
        if (!activeSpecs.fonts.some((item) => font.includes(item))) {
          issues.push(`서체 '${font}' (차단)`);
        }
      } else if (filter === 'spacing') {
        const boxSides = [
          { label: '상단', cssProp: 'padding-top', styleKey: 'paddingTop' },
          { label: '오른쪽', cssProp: 'padding-right', styleKey: 'paddingRight' },
          { label: '하단', cssProp: 'padding-bottom', styleKey: 'paddingBottom' },
          { label: '왼쪽', cssProp: 'padding-left', styleKey: 'paddingLeft' },
        ];
        inspectBoxSpacing({ issues, activeSpecs, styles, element, kind: 'padding', sides: boxSides });
        inspectBoxSpacing({
          issues,
          activeSpecs,
          styles,
          element,
          kind: 'margin',
          sides: boxSides.map((side) => ({
            ...side,
            cssProp: side.cssProp.replace('padding', 'margin'),
            styleKey: side.styleKey.replace('padding', 'margin'),
          })),
        });
      } else if (filter === 'radius') {
        const radius = styles.borderRadius;
        const radiusUsesToken = hasAuthoredTokenReference(element, ['border-radius']);
        if (radius !== '0px' && !radiusUsesToken) {
          const tokens = getRadiusTokens(activeSpecs, radius);
          if (tokens.length) {
            issues.push(`라운드 ${radius} (원시값 직접 사용${formatKnownTokenList(tokens)})`);
          } else if (!activeSpecs.radius.includes(radius)) {
            issues.push(`라운드 ${radius} (미준수)`);
          }
        }
      }

      return { issues, suggestions };
    }

    return { getInspectionForFilter };
  }

  const api = { createContentInspector };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentInspection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
