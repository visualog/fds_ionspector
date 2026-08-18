(function initContentScanUtils(globalScope) {
  function createContentScanUtils({ parseViolationItem }) {
    function recordIssue(category, message, issues) {
      issues.push(message);
      return {
        category,
        message,
      };
    }

    function getElementIssueSignature(element) {
      if (!element) return 'unknown';
      const tagName = element.tagName?.toLowerCase?.() || 'node';
      const idPart = element.id ? `#${element.id}` : '';
      const classPart = typeof element.className === 'string' && element.className.trim()
        ? `.${element.className.trim().split(/\s+/).slice(0, 3).join('.')}`
        : '';
      const text = getDirectTextContent(element).slice(0, 24);
      const pathPart = getElementDomPath(element);
      return `${tagName}${idPart}${classPart}:${text}:${pathPart}`;
    }

    function getElementDomPath(element) {
      const path = [];
      let current = element;
      let depth = 0;

      while (current && current.tagName && depth < 8) {
        const tagName = current.tagName.toLowerCase();
        const parent = current.parentElement;
        const siblings = Array.from(parent?.children || []).filter((sibling) => sibling.tagName === current.tagName);
        const siblingIndex = Math.max(0, siblings.indexOf(current));
        path.push(`${tagName}[${siblingIndex}]`);
        current = parent;
        depth += 1;
      }

      return path.reverse().join('>');
    }

    function getDirectTextContent(element) {
      return Array.from(element?.childNodes || [])
        .filter((node) => node.nodeType === 3)
        .map((node) => node.textContent || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function hasDirectTextContent(element) {
      return getDirectTextContent(element).length > 0;
    }

    function getElementRebindSelector(element) {
      const tagName = element?.tagName?.toLowerCase?.();
      if (!tagName) return null;
      const escapeIdentifier = (value) => {
        if (typeof globalScope.CSS?.escape === 'function') return globalScope.CSS.escape(value);
        return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(value) ? value : null;
      };
      const id = element.id ? escapeIdentifier(String(element.id)) : null;
      if (id) return `${tagName}#${id}`;
      const firstClass = typeof element.className === 'string'
        ? element.className.trim().split(/\s+/).find(Boolean)
        : null;
      const className = firstClass ? escapeIdentifier(firstClass) : null;
      return className ? `${tagName}.${className}` : tagName;
    }

    function rebindUnrenderedIssueEntries({
      entries = [],
      root,
      isElementVisible,
      getStyles,
      inspectElement,
    }) {
      if (!root?.querySelectorAll || typeof inspectElement !== 'function') return 0;
      const isRendered = (element) => Boolean(element?.isConnected) && Boolean(isElementVisible?.(element));
      const usedElements = new Set(entries.filter((entry) => isRendered(entry?.element)).map((entry) => entry.element));
      const replacementByOriginal = new Map();
      let reboundCount = 0;

      entries.forEach((entry) => {
        const originalElement = entry?.element;
        if (!entry?.message || !entry?.category || isRendered(originalElement)) return;
        const selector = getElementRebindSelector(originalElement);
        if (!selector) return;

        let candidates;
        try {
          candidates = Array.from(root.querySelectorAll(selector));
        } catch (_error) {
          return;
        }

        const preferredCandidate = replacementByOriginal.get(originalElement);
        if (preferredCandidate) {
          candidates = [preferredCandidate, ...candidates.filter((candidate) => candidate !== preferredCandidate)];
        }

        for (const candidate of candidates) {
          if (!isRendered(candidate) || candidate.closest?.('#fds-root')) continue;
          if (usedElements.has(candidate) && candidate !== preferredCandidate) continue;
          const inspection = inspectElement({
            filterKey: entry.category,
            styles: getStyles?.(candidate),
            element: candidate,
          });
          const issues = Array.isArray(inspection?.issues) ? inspection.issues : [];
          const issueIndex = issues.indexOf(entry.message);
          if (issueIndex < 0) continue;

          entry.element = candidate;
          entry.metadata = inspection?.issueDetails?.[issueIndex] || entry.metadata || null;
          replacementByOriginal.set(originalElement, candidate);
          usedElements.add(candidate);
          reboundCount += 1;
          break;
        }
      });

      return reboundCount;
    }

    function getIssueTone(message) {
      if (String(message || '').includes('(미등록)')) return 'danger';
      if (String(message || '').includes('(원시값 직접 사용)')) return 'warning';
      return parseViolationItem(message).tone || 'danger';
    }

    function getIssueColorPart(message) {
      const text = String(message || '');
      if (text.startsWith('배경색 ')) return 'bg';
      if (text.startsWith('보더색 ') || text.startsWith('외곽선 ')) return 'border';
      if (text.startsWith('글자색 ')) return 'text';
      return null;
    }

    function getIssueCategoryFromMessage(message, fallback) {
      const text = String(message || '');
      if (/^(배경색|글자색|보더색|외곽선)\s+/.test(text)) return 'color';
      if (text.startsWith('서체 ')) return 'font';
      if (/^(패딩|마진|갭|상단 패딩|오른쪽 패딩|하단 패딩|왼쪽 패딩|상단 마진|오른쪽 마진|하단 마진|왼쪽 마진|행 갭|열 갭)\s+/.test(text)) return 'spacing';
      if (text.startsWith('라운드 ')) return 'radius';
      return fallback || null;
    }

    function rgbToHex(rgb) {
      const text = String(rgb || '').trim();
      if (!text || text === 'transparent') return null;
      if (text.startsWith('#')) return text.toLowerCase();

      const result = text.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+)\s*)?\)$/i);
      if (!result) return text;

      const channels = result.slice(1, 4).map((value) => Number.parseInt(value, 10));
      if (channels.some((value) => !Number.isFinite(value))) return text;

      const alpha = result[4] === undefined ? 1 : Number.parseFloat(result[4]);
      if (Number.isFinite(alpha) && alpha <= 0) return null;
      if (Number.isFinite(alpha) && alpha < 1) {
        return `rgba(${channels[0]}, ${channels[1]}, ${channels[2]}, ${alpha})`;
      }

      return `#${channels.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
    }

    return {
      recordIssue,
      getElementIssueSignature,
      getElementDomPath,
      getDirectTextContent,
      hasDirectTextContent,
      getElementRebindSelector,
      rebindUnrenderedIssueEntries,
      getIssueTone,
      getIssueColorPart,
      getIssueCategoryFromMessage,
      rgbToHex,
    };
  }

  const api = { createContentScanUtils };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentScanUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
