(function initContentSummaryModel(globalScope) {
  const EMPTY_TONE_COUNTS = Object.freeze({ danger: 0, warning: 0 });

  function createToneCounts() {
    return { danger: 0, warning: 0 };
  }

  function createContentSummaryModel({
    getScanData,
    getActiveFilter,
    getActiveSummarySubtab,
    setActiveSummarySubtab,
    getActiveSummaryTone,
    setActiveSummaryTone,
    getExpandedIssueGroupKeys,
    parseViolationItem,
  }) {
    function normalizeActiveSummaryToneForCounts(toneCounts = EMPTY_TONE_COUNTS) {
      const activeSummaryTone = getActiveSummaryTone();
      if (activeSummaryTone === 'danger' && toneCounts.danger === 0 && toneCounts.warning > 0) {
        setActiveSummaryTone('warning');
      } else if (activeSummaryTone === 'warning' && toneCounts.warning === 0 && toneCounts.danger > 0) {
        setActiveSummaryTone('danger');
      }
    }

    function getColorEntriesForActiveSubtab() {
      const activeSummarySubtab = getActiveSummarySubtab();
      return (getScanData()?.issueEntries || []).filter((entry) => {
        if (entry.category !== 'color') return false;
        if (activeSummarySubtab === 'bg') return entry.colorPart === 'bg';
        if (activeSummarySubtab === 'text') return entry.colorPart === 'text';
        return entry.colorPart === 'border';
      });
    }

    function getToneCountsForEntries(entries = []) {
      return entries.reduce((acc, entry) => {
        if (entry.tone === 'danger') acc.danger += 1;
        if (entry.tone === 'warning') acc.warning += 1;
        return acc;
      }, createToneCounts());
    }

    function getColorToneCountsForActiveSubtab() {
      return getToneCountsForEntries(getColorEntriesForActiveSubtab());
    }

    function getTonePatternCountsForGroups(groups = []) {
      return groups.reduce((acc, group) => {
        if (group.tone === 'danger') acc.danger += 1;
        if (group.tone === 'warning') acc.warning += 1;
        return acc;
      }, createToneCounts());
    }

    function getVisibleIssueEntries() {
      const activeFilter = getActiveFilter();
      const activeSummaryTone = getActiveSummaryTone();
      if (!activeFilter) return [];
      const entries = (getScanData()?.issueEntries || []).filter((entry) => entry.category === activeFilter);
      if (activeFilter !== 'color') {
        return entries.filter((entry) => entry.tone === activeSummaryTone);
      }

      return getColorEntriesForActiveSubtab().filter((entry) => entry.tone === activeSummaryTone);
    }

    function getIssueGroupKey(entry, parsed = parseViolationItem(entry?.message)) {
      return [
        entry?.category || 'unknown',
        entry?.tone || parsed.tone || 'danger',
        entry?.colorPart || 'all',
        parsed.chip || '',
        parsed.value || '',
        parsed.tag || '',
      ].join('::');
    }

    function groupIssueEntries(entries = []) {
      const groupsByKey = new Map();

      entries.forEach((entry) => {
        const parsed = parseViolationItem(entry?.message);
        const key = getIssueGroupKey(entry, parsed);
        if (!groupsByKey.has(key)) {
          groupsByKey.set(key, {
            key,
            tone: entry?.tone || parsed.tone || 'danger',
            chip: parsed.chip,
            tag: parsed.tag,
            value: parsed.value,
            entries: [],
          });
        }
        groupsByKey.get(key).entries.push(entry);
      });

      const expandedIssueGroupKeys = getExpandedIssueGroupKeys();
      return [...groupsByKey.values()]
        .map((group) => ({
          ...group,
          count: group.entries.length,
          expanded: expandedIssueGroupKeys.has(group.key),
        }))
        .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
    }

    function getColorTonePatternCountsForActiveSubtab() {
      return getTonePatternCountsForGroups(groupIssueEntries(getColorEntriesForActiveSubtab()));
    }

    function getColorSummaryTabs() {
      const issueEntries = getScanData()?.issueEntries || [];
      const counts = {
        bg: issueEntries.filter((item) => item.category === 'color' && item.colorPart === 'bg').length,
        border: issueEntries.filter((item) => item.category === 'color' && item.colorPart === 'border').length,
        text: issueEntries.filter((item) => item.category === 'color' && item.colorPart === 'text').length,
      };

      const tabs = [
        { key: 'bg', label: 'BG', count: counts.bg },
        { key: 'border', label: 'Border', count: counts.border },
        { key: 'text', label: 'Text', count: counts.text },
      ];

      const activeSummarySubtab = getActiveSummarySubtab();
      const currentTabExists = tabs.some((tab) => tab.key === activeSummarySubtab);
      const preferredTab = tabs.find((tab) => tab.count > 0)?.key || 'bg';

      if (!currentTabExists || !tabs.find((tab) => tab.key === activeSummarySubtab)?.count) {
        setActiveSummarySubtab(preferredTab);
      }

      normalizeActiveSummaryToneForCounts(getColorToneCountsForActiveSubtab());

      return tabs;
    }

    function getSummaryListRenderKey(visibleItems) {
      const activeFilter = getActiveFilter();
      return [
        activeFilter || 'idle',
        activeFilter === 'color' ? getActiveSummarySubtab() : 'all',
        activeFilter ? getActiveSummaryTone() : 'all',
        visibleItems.map((item) => item.key).join('|'),
        [...getExpandedIssueGroupKeys()].sort().join('|'),
      ].join('::');
    }

    return {
      normalizeActiveSummaryToneForCounts,
      getVisibleIssueEntries,
      getColorEntriesForActiveSubtab,
      getColorToneCountsForActiveSubtab,
      getToneCountsForEntries,
      getTonePatternCountsForGroups,
      getColorTonePatternCountsForActiveSubtab,
      getColorSummaryTabs,
      getSummaryListRenderKey,
      getIssueGroupKey,
      groupIssueEntries,
    };
  }

  const api = { createContentSummaryModel };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.FDSContentSummaryModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
