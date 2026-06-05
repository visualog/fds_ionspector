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
      return `${tagName}${idPart}${classPart}:${text}`;
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
      if (text.startsWith('상단 패딩 ')) return 'spacing';
      if (text.startsWith('라운드 ')) return 'radius';
      return fallback || null;
    }

    function rgbToHex(rgb) {
      if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
      if (rgb.startsWith('#')) return rgb.toLowerCase();
      const result = rgb.match(/\d+/g);
      if (!result || result.length < 3) return rgb;
      return `#${result.slice(0, 3).map((x) => Number.parseInt(x, 10).toString(16).padStart(2, '0')).join('')}`;
    }

    return {
      recordIssue,
      getElementIssueSignature,
      getDirectTextContent,
      hasDirectTextContent,
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
