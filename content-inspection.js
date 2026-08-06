(function initContentInspection(globalScope) {
  function createContentInspector({
    getActiveInspectorSpecs,
    getKnownColorTokens,
    getAuthoredStyleEvidence,
    hasAuthoredTokenReference,
    getAuthoredTokenReferenceStatus,
    hasDirectTextContent,
    rgbToHex,
  }) {
    function withCssEvidence(metadata, element, properties, computedValue, tokenReferenceStatus = null) {
      const evidence = typeof getAuthoredStyleEvidence === 'function'
        ? getAuthoredStyleEvidence(element, properties, computedValue)
        : null;
      const detail = { ...(metadata || {}) };
      if (tokenReferenceStatus?.status === 'unregistered') {
        detail.cssVariable = {
          status: tokenReferenceStatus.status,
          variables: tokenReferenceStatus.variables || [],
          unregisteredVariables: tokenReferenceStatus.unregisteredVariables || [],
        };
      }
      return evidence ? { ...detail, cssEvidence: evidence } : Object.keys(detail).length ? detail : null;
    }

    function getTokenReferenceStatus(element, properties, options = {}) {
      if (typeof getAuthoredTokenReferenceStatus === 'function') {
        const status = getAuthoredTokenReferenceStatus(element, properties, options);
        if (status && typeof status.status === 'string') return status;
      }
      return {
        status: hasAuthoredTokenReference(element, properties) ? 'legacy' : 'none',
        variables: [],
        unregisteredVariables: [],
      };
    }

    function allowsTokenReference(status) {
      return status?.status === 'registered' || status?.status === 'legacy';
    }

    function addUnregisteredCssVariableIssue({
      issues,
      issueDetails,
      label,
      value,
      metadata,
      element,
      properties,
      computedValue,
      tokenReferenceStatus,
    }) {
      const variableNames = tokenReferenceStatus?.unregisteredVariables || [];
      issues.push(`${label} ${value} (등록되지 않은 CSS 변수: ${variableNames.join(', ')})`);
      issueDetails.push(withCssEvidence(metadata, element, properties, computedValue, tokenReferenceStatus));
    }

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

    function getKnownColorTokensForPart(value, colorPart) {
      return getKnownColorTokens(value).filter((token) => {
        const tokenPart = getColorPartFromTokenName(token);
        return tokenPart === null || tokenPart === colorPart;
      });
    }

    function getPxValue(value) {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function addSpacingIssue({ issues, issueDetails, activeSpecs, label, value, metadata }) {
      if (value <= 0) return;
      const tokens = getSpacingTokens(activeSpecs, value);
      if (tokens.length) {
        issues.push(`${label} ${value}px (원시값 직접 사용${formatKnownTokenList(tokens)})`);
        issueDetails.push(metadata);
      } else if (!activeSpecs.spacing.includes(value)) {
        issues.push(`${label} ${value}px (미등록)`);
        issueDetails.push(metadata);
      }
    }

    function inspectBoxSpacing({ issues, issueDetails, activeSpecs, styles, element, kind, sides }) {
      const values = sides.map((side) => ({
        ...side,
        value: getPxValue(styles[side.styleKey]),
      }));
      const positiveValues = values.filter((item) => item.value > 0);
      if (!positiveValues.length) return;

      const allSidesEqual = values.every((item) => item.value === values[0].value);
      if (allSidesEqual) {
        const tokenProps = [kind, ...sides.map((side) => side.cssProp)];
        const tokenReferenceStatus = getTokenReferenceStatus(element, tokenProps);
        if (tokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: kind === 'padding' ? '패딩' : '마진',
            value: `${values[0].value}px`,
            metadata: { spacing: { kind, sides: ['top', 'right', 'bottom', 'left'], value: values[0].value } },
            element,
            properties: tokenProps,
            computedValue: `${values[0].value}px`,
            tokenReferenceStatus,
          });
        } else if (!allowsTokenReference(tokenReferenceStatus)) {
          addSpacingIssue({
            issues,
            issueDetails,
            activeSpecs,
            label: kind === 'padding' ? '패딩' : '마진',
            value: values[0].value,
            metadata: withCssEvidence(
              { spacing: { kind, sides: ['top', 'right', 'bottom', 'left'], value: values[0].value } },
              element,
              tokenProps,
              `${values[0].value}px`
            ),
          });
        }
        return;
      }

      values.forEach((item) => {
        if (item.value <= 0) return;
        const tokenProps = [item.cssProp, kind];
        const tokenReferenceStatus = getTokenReferenceStatus(element, tokenProps);
        if (allowsTokenReference(tokenReferenceStatus)) return;
        if (tokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: `${item.label} ${kind === 'padding' ? '패딩' : '마진'}`,
            value: `${item.value}px`,
            metadata: { spacing: { kind, sides: [item.side], value: item.value } },
            element,
            properties: tokenProps,
            computedValue: `${item.value}px`,
            tokenReferenceStatus,
          });
          return;
        }
        addSpacingIssue({
          issues,
          issueDetails,
          activeSpecs,
          label: `${item.label} ${kind === 'padding' ? '패딩' : '마진'}`,
          value: item.value,
          metadata: withCssEvidence(
            { spacing: { kind, sides: [item.side], value: item.value } },
            element,
            tokenProps,
            `${item.value}px`
          ),
        });
      });
    }

    function inspectGapSpacing({ issues, issueDetails, activeSpecs, styles, element }) {
      const gaps = [
        { label: '행 갭', cssProp: 'row-gap', styleKey: 'rowGap', axis: 'row' },
        { label: '열 갭', cssProp: 'column-gap', styleKey: 'columnGap', axis: 'column' },
      ].map((item) => ({
        ...item,
        value: getPxValue(styles[item.styleKey]),
      }));
      const positiveGaps = gaps.filter((item) => item.value > 0);
      if (!positiveGaps.length) return;

      const allGapsEqual = gaps.every((item) => item.value === gaps[0].value);
      if (allGapsEqual) {
        const tokenProps = ['gap', 'row-gap', 'column-gap'];
        const tokenReferenceStatus = getTokenReferenceStatus(element, tokenProps);
        if (tokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: '갭',
            value: `${gaps[0].value}px`,
            metadata: { spacing: { kind: 'gap', sides: ['row', 'column'], value: gaps[0].value } },
            element,
            properties: tokenProps,
            computedValue: `${gaps[0].value}px`,
            tokenReferenceStatus,
          });
        } else if (!allowsTokenReference(tokenReferenceStatus)) {
          addSpacingIssue({
            issues,
            issueDetails,
            activeSpecs,
            label: '갭',
            value: gaps[0].value,
            metadata: withCssEvidence(
              { spacing: { kind: 'gap', sides: ['row', 'column'], value: gaps[0].value } },
              element,
              tokenProps,
              `${gaps[0].value}px`
            ),
          });
        }
        return;
      }

      positiveGaps.forEach((item) => {
        const tokenProps = [item.cssProp, 'gap'];
        const tokenReferenceStatus = getTokenReferenceStatus(element, tokenProps);
        if (allowsTokenReference(tokenReferenceStatus)) return;
        if (tokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: item.label,
            value: `${item.value}px`,
            metadata: { spacing: { kind: 'gap', sides: [item.axis], value: item.value } },
            element,
            properties: tokenProps,
            computedValue: `${item.value}px`,
            tokenReferenceStatus,
          });
          return;
        }
        addSpacingIssue({
          issues,
          issueDetails,
          activeSpecs,
          label: item.label,
          value: item.value,
          metadata: withCssEvidence(
            { spacing: { kind: 'gap', sides: [item.axis], value: item.value } },
            element,
            tokenProps,
            `${item.value}px`
          ),
        });
      });
    }

    function getInspectionForFilter(filter, styles, element = null) {
      const issues = [];
      const issueDetails = [];
      const suggestions = [];
      const activeSpecs = getActiveInspectorSpecs();

      if (filter === 'color') {
        const bg = rgbToHex(styles.backgroundColor);
        const text = hasDirectTextContent(element) ? rgbToHex(styles.color) : null;
        const borderWidth = Number.parseFloat(styles.borderTopWidth || '0');
        const borderColor = rgbToHex(styles.borderTopColor);
        const bgProperties = ['background-color', 'background'];
        const textProperties = ['color'];
        const borderProperties = [
          'border-color',
          'border-top-color',
          'border',
          'border-top',
        ];
        const bgTokenReferenceStatus = getTokenReferenceStatus(element, bgProperties);
        const textTokenReferenceStatus = getTokenReferenceStatus(element, textProperties, { includeInherited: true });
        const borderTokenReferenceStatus = getTokenReferenceStatus(element, borderProperties);

        if (bg && bgTokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: '배경색',
            value: bg,
            element,
            properties: bgProperties,
            computedValue: styles.backgroundColor,
            tokenReferenceStatus: bgTokenReferenceStatus,
          });
        } else if (bg && !allowsTokenReference(bgTokenReferenceStatus)) {
          const tokens = getKnownColorTokensForPart(bg, 'bg');
          issues.push(tokens.length ? `배경색 ${bg} (원시값 직접 사용)` : `배경색 ${bg} (미등록)`);
          issueDetails.push(withCssEvidence(null, element, bgProperties, styles.backgroundColor));
        }

        if (text && textTokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: '글자색',
            value: text,
            element,
            properties: textProperties,
            computedValue: styles.color,
            tokenReferenceStatus: textTokenReferenceStatus,
          });
        } else if (text && !allowsTokenReference(textTokenReferenceStatus)) {
          const tokens = getKnownColorTokensForPart(text, 'text');
          issues.push(tokens.length ? `글자색 ${text} (원시값 직접 사용)` : `글자색 ${text} (미등록)`);
          issueDetails.push(withCssEvidence(null, element, textProperties, styles.color));
        }

        if (borderWidth > 0 && borderColor && borderTokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: '보더색',
            value: borderColor,
            element,
            properties: borderProperties,
            computedValue: styles.borderTopColor,
            tokenReferenceStatus: borderTokenReferenceStatus,
          });
        } else if (borderWidth > 0 && borderColor && !allowsTokenReference(borderTokenReferenceStatus)) {
          const tokens = getKnownColorTokensForPart(borderColor, 'border');
          issues.push(tokens.length ? `보더색 ${borderColor} (원시값 직접 사용)` : `보더색 ${borderColor} (미등록)`);
          issueDetails.push(withCssEvidence(null, element, borderProperties, styles.borderTopColor));
        }
      } else if (filter === 'font') {
        if (!hasDirectTextContent(element)) return { issues, issueDetails, suggestions };
        const font = styles.fontFamily.split(',')[0].replace(/"/g, '');
        if (!activeSpecs.fonts.some((item) => font.includes(item))) {
          issues.push(`서체 '${font}' (차단)`);
          issueDetails.push(withCssEvidence(null, element, ['font-family', 'font'], styles.fontFamily));
        }
      } else if (filter === 'spacing') {
        const boxSides = [
          { label: '상단', side: 'top', cssProp: 'padding-top', styleKey: 'paddingTop' },
          { label: '오른쪽', side: 'right', cssProp: 'padding-right', styleKey: 'paddingRight' },
          { label: '하단', side: 'bottom', cssProp: 'padding-bottom', styleKey: 'paddingBottom' },
          { label: '왼쪽', side: 'left', cssProp: 'padding-left', styleKey: 'paddingLeft' },
        ];
        inspectBoxSpacing({ issues, issueDetails, activeSpecs, styles, element, kind: 'padding', sides: boxSides });
        inspectBoxSpacing({
          issues,
          issueDetails,
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
        inspectGapSpacing({ issues, issueDetails, activeSpecs, styles, element });
      } else if (filter === 'radius') {
        const radius = styles.borderRadius;
        const radiusProperties = ['border-radius'];
        const radiusTokenReferenceStatus = getTokenReferenceStatus(element, radiusProperties);
        if (radius !== '0px' && radiusTokenReferenceStatus.status === 'unregistered') {
          addUnregisteredCssVariableIssue({
            issues,
            issueDetails,
            label: '라운드',
            value: radius,
            element,
            properties: radiusProperties,
            computedValue: radius,
            tokenReferenceStatus: radiusTokenReferenceStatus,
          });
        } else if (radius !== '0px' && !allowsTokenReference(radiusTokenReferenceStatus)) {
          const tokens = getRadiusTokens(activeSpecs, radius);
          if (tokens.length) {
            issues.push(`라운드 ${radius} (원시값 직접 사용${formatKnownTokenList(tokens)})`);
            issueDetails.push(withCssEvidence(null, element, radiusProperties, radius));
          } else if (!activeSpecs.radius.includes(radius)) {
            issues.push(`라운드 ${radius} (미준수)`);
            issueDetails.push(withCssEvidence(null, element, radiusProperties, radius));
          }
        }
      }

      return { issues, issueDetails, suggestions };
    }

    return { getInspectionForFilter };
  }

  const api = { createContentInspector };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentInspection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
