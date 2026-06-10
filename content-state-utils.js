(function initContentStateUtils(globalScope) {
  function createContentStateUtils({ filterLabels, getActiveFilter = () => null }) {
    function getFilterLabel(filter = getActiveFilter()) {
      return filterLabels[filter] || filter || '페이지';
    }

    function getScanStatusMessage(reason = '') {
      if (reason) return reason;
      const activeFilter = getActiveFilter();
      if (!activeFilter) return '초기 검사 결과를 계산하는 중입니다.';
      return `${getFilterLabel(activeFilter)} 위반 수를 다시 계산하는 중입니다.`;
    }

    function createEmptyScanData() {
      return {
        violations: [],
        issueEntries: [],
        suggestions: [],
        excludedEntries: [],
        counts: {
          color: 0,
          font: 0,
          spacing: 0,
          radius: 0,
        },
        colorBreakdown: {
          missing: 0,
          primitiveRaw: 0,
        },
      };
    }

    return {
      getFilterLabel,
      getScanStatusMessage,
      createEmptyScanData,
    };
  }

  const api = { createContentStateUtils };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentStateUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
