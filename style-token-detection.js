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

  function readDeclarationPriority(style, property) {
    if (!style || !property || typeof style.getPropertyPriority !== 'function') return '';
    return style.getPropertyPriority(property) || '';
  }

  function splitSelectorList(selectorText) {
    const selectors = [];
    let current = '';
    let depth = 0;
    String(selectorText || '').split('').forEach((character) => {
      if (character === '(' || character === '[') depth += 1;
      if (character === ')' || character === ']') depth = Math.max(0, depth - 1);
      if (character === ',' && depth === 0) {
        if (current.trim()) selectors.push(current.trim());
        current = '';
        return;
      }
      current += character;
    });
    if (current.trim()) selectors.push(current.trim());
    return selectors;
  }

  function getMatchingSelectors(element, selectorText) {
    if (!element || typeof element.matches !== 'function') return [];
    const findMatches = (selectors) => selectors.filter((selector) => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
    const structuredMatches = findMatches(splitSelectorList(selectorText));
    if (structuredMatches.length || !String(selectorText || '').includes(',')) return structuredMatches;
    return findMatches(String(selectorText).split(',').map((selector) => selector.trim()).filter(Boolean));
  }

  function getSelectorSpecificity(selector) {
    const normalized = String(selector || '')
      .replace(/:where\([^)]*\)/g, '')
      .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '');
    const ids = (normalized.match(/#[\w-]+/g) || []).length;
    const classes = (normalized.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g) || []).length;
    const elements = (normalized
      .replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?/g, ' ')
      .match(/(^|[\s>+~])(?:[a-zA-Z][\w-]*|\*)/g) || [])
      .filter((item) => !item.trim().endsWith('*')).length;
    const pseudoElements = (normalized.match(/::[\w-]+/g) || []).length;
    return [ids, classes, elements + pseudoElements];
  }

  function compareSpecificity(left = [0, 0, 0], right = [0, 0, 0]) {
    for (let index = 0; index < 3; index += 1) {
      if (left[index] !== right[index]) return left[index] - right[index];
    }
    return 0;
  }

  function getStrongestMatchingSelector(element, selectorText) {
    return getMatchingSelectors(element, selectorText).reduce((strongest, selector) => {
      if (!strongest) return selector;
      return compareSpecificity(getSelectorSpecificity(selector), getSelectorSpecificity(strongest)) > 0
        ? selector
        : strongest;
    }, '');
  }

  function getAuthoredDeclaration(style, properties) {
    if (!style || !properties?.length) return null;
    const propertySet = new Set(properties);
    const explicitProperties = [];
    if (Number.isFinite(Number(style.length)) && typeof style.item === 'function') {
      for (let index = 0; index < Number(style.length); index += 1) {
        const property = String(style.item(index) || '').trim();
        if (propertySet.has(property)) explicitProperties.push(property);
      }
    }
    const candidateProperties = explicitProperties.length ? explicitProperties : properties;
    let declaration = null;
    candidateProperties.forEach((property) => {
      const value = readDeclarationValue(style, property).trim();
      if (!value) return;
      const candidate = {
        property,
        value,
        important: readDeclarationPriority(style, property).toLowerCase() === 'important',
      };
      if (!declaration || candidate.important || !declaration.important) {
        declaration = candidate;
      }
    });
    return declaration;
  }

  function getStyleSheetSource(sheet) {
    if (sheet?.href) return String(sheet.href);
    const ownerNode = sheet?.ownerNode;
    const ownerHref = ownerNode?.href || ownerNode?.getAttribute?.('href');
    if (ownerHref) return String(ownerHref);
    const tagName = String(ownerNode?.tagName || '').toLowerCase();
    if (tagName === 'style') {
      return ownerNode.id ? `<style id="${ownerNode.id}">` : '<style>';
    }
    return 'embedded stylesheet';
  }

  function isCandidateStronger(candidate, current) {
    if (!current) return true;
    if (candidate.important !== current.important) return candidate.important;
    const specificityComparison = compareSpecificity(candidate.specificity, current.specificity);
    if (specificityComparison !== 0) return specificityComparison > 0;
    return candidate.order >= current.order;
  }

  function canMatchSelector(element, selectorText) {
    return Boolean(selectorText && getMatchingSelectors(element, selectorText).length);
  }

  function getEvidenceConfidence(winner, hasInaccessibleStyleSheet) {
    if (!winner) {
      return {
        confidence: 'low',
        confidenceReason: '작성 CSS 선언을 확인할 수 없음',
      };
    }
    if (hasInaccessibleStyleSheet) {
      return {
        confidence: 'medium',
        confidenceReason: '일부 스타일시트에 접근할 수 없어 우선순위가 달라질 수 있음',
      };
    }
    return {
      confidence: 'high',
      confidenceReason: '작성 CSS 선언과 적용 선택자를 확인함',
    };
  }

  function visitCssRules(rules, visitor) {
    Array.from(rules || []).forEach((rule) => {
      if (rule?.cssRules) {
        visitCssRules(rule.cssRules, visitor);
      }
      visitor(rule);
    });
  }

  function getAuthoredStyleEvidence(element, properties, computedValue = '', root = globalScope.document) {
    if (!element || !properties?.length) return null;
    let winner = null;
    let order = 0;
    let hasInaccessibleStyleSheet = false;

    Array.from(root?.styleSheets || []).forEach((sheet) => {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        hasInaccessibleStyleSheet = true;
        return;
      }

      visitCssRules(rules, (rule) => {
        order += 1;
        if (!rule?.style || !canMatchSelector(element, rule.selectorText)) return;
        const declaration = getAuthoredDeclaration(rule.style, properties);
        if (!declaration) return;
        const selector = getStrongestMatchingSelector(element, rule.selectorText);
        const candidate = {
          ...declaration,
          selector,
          source: getStyleSheetSource(sheet),
          specificity: getSelectorSpecificity(selector),
          order,
        };
        if (isCandidateStronger(candidate, winner)) winner = candidate;
      });
    });

    const inlineDeclaration = getAuthoredDeclaration(element.style, properties);
    if (inlineDeclaration) {
      const inlineCandidate = {
        ...inlineDeclaration,
        selector: 'style attribute',
        source: 'inline style',
        specificity: [Number.MAX_SAFE_INTEGER, 0, 0],
        order: Number.MAX_SAFE_INTEGER,
      };
      if (isCandidateStronger(inlineCandidate, winner)) winner = inlineCandidate;
    }

    const targetProperty = properties[0];
    const confidence = getEvidenceConfidence(winner, hasInaccessibleStyleSheet);
    if (!winner) {
      return {
        property: targetProperty,
        computedValue: String(computedValue || ''),
        authoredProperty: '',
        authoredValue: '',
        declaration: '',
        selector: '',
        source: '작성 CSS 확인 불가',
        ...confidence,
      };
    }

    return {
      property: targetProperty,
      computedValue: String(computedValue || ''),
      authoredProperty: winner.property,
      authoredValue: winner.value,
      declaration: `${winner.property}: ${winner.value}${winner.important ? ' !important' : ''}`,
      selector: winner.selector,
      source: winner.source,
      ...confidence,
    };
  }

  function hasAuthoredTokenReference(element, properties, root = globalScope.document) {
    if (!element || !properties?.length) return false;
    const evidence = getAuthoredStyleEvidence(element, properties, '', root);
    return isCssVariableReference(evidence?.authoredValue);
  }

  const api = { getAuthoredStyleEvidence, hasAuthoredTokenReference, isCssVariableReference };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSStyleTokenDetection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
