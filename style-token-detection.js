(function initStyleTokenDetection(globalScope) {
  function isCssVariableReference(value) {
    return /\bvar\(\s*--[^)]+\)/.test(String(value || ''));
  }

  function readDeclarationValue(style, property) {
    if (!style || !property) return '';
    if (typeof style.getPropertyValue === 'function') {
      return style.getPropertyValue(property) || '';
    }
    return style[property] || '';
  }

  function canMatchSelector(element, selectorText) {
    if (!element || typeof element.matches !== 'function' || !selectorText) return false;
    return selectorText.split(',').some((selector) => {
      try {
        return element.matches(selector.trim());
      } catch {
        return false;
      }
    });
  }

  function visitCssRules(rules, visitor) {
    Array.from(rules || []).forEach((rule) => {
      if (rule?.cssRules) {
        visitCssRules(rule.cssRules, visitor);
      }
      visitor(rule);
    });
  }

  function hasAuthoredTokenReference(element, properties, root = globalScope.document) {
    if (!element || !properties?.length) return false;
    let latestValue = '';

    Array.from(root?.styleSheets || []).forEach((sheet) => {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        return;
      }

      visitCssRules(rules, (rule) => {
        if (!rule?.style || !canMatchSelector(element, rule.selectorText)) return;
        properties.forEach((property) => {
          const value = readDeclarationValue(rule.style, property).trim();
          if (value) latestValue = value;
        });
      });
    });

    const inlineStyle = element.style;
    properties.forEach((property) => {
      const value = readDeclarationValue(inlineStyle, property).trim();
      if (value) latestValue = value;
    });

    return isCssVariableReference(latestValue);
  }

  const api = { hasAuthoredTokenReference, isCssVariableReference };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSStyleTokenDetection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
