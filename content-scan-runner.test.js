const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  createContentScanRunner,
} = require('./content-scan-runner.js');

test('content initial scan asks the runner to collect entries before a filter is active', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(
    contentSource,
    /runner\.run\(\{\s*filters:\s*FILTER_KEYS,\s*activeFilter,\s*collectAllEntries:\s*!activeFilter\s*\}\)/
  );
});

test('content scan clears loading state and exposes an error message when scan fails', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /catch\s*\(\s*error\s*\)/);
  assert.match(contentSource, /scanErrorText\s*=\s*'검사 중 오류가 발생했습니다\. 새로고침 버튼으로 다시 검사해 주세요\.'/);
  assert.match(contentSource, /finally\s*\{/);
  assert.match(contentSource, /activeScanPromise\s*=\s*null/);
});

test('content exposes a localhost-only scan error fixture trigger', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+shouldForceScanErrorForVerification\(\)/);
  assert.match(contentSource, /hostname === 'localhost' \|\| hostname === '127\.0\.0\.1'/);
  assert.match(contentSource, /fdsInspectorForceScanError === 'true'/);
  assert.match(contentSource, /Forced scan error for local verification/);
});

test('content summary hides completed scan metrics from the persistent panel UI', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /function\s+formatScanCompletionText/);
  assert.match(contentSource, /검사 완료 · \$\{scanned\}\/\$\{total\}개 요소/);
  assert.doesNotMatch(contentSource, /class="fds-panel-info"/);
  assert.doesNotMatch(contentSource, /completedInfoText/);
  assert.doesNotMatch(styleSource, /\.fds-panel-info/);
});

test('content summary explains scan scope without changing badge counts', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');
  const toolbarStateSource = fs.readFileSync(path.join(__dirname, 'toolbar-state.js'), 'utf8');

  assert.match(contentSource, /function\s+formatScanScopeText\(meta = scanData\?\.meta\)/);
  assert.match(contentSource, /렌더링 기준 · 검사됨 \$\{scanned\.toLocaleString\('ko-KR'\)\}개 · 제외됨 \$\{skipped\.toLocaleString\('ko-KR'\)\}개/);
  assert.match(contentSource, /class="fds-panel-meta"[\s\S]*scanScopeText/);
  assert.match(styleSource, /\.fds-panel-meta\s*\{[\s\S]*color:\s*rgba\(120,\s*166,\s*255,\s*0\.92\)/);
  assert.match(styleSource, /\.fds-panel-close\s*\{[\s\S]*transform:\s*translateY\(-2px\)/);
  assert.match(toolbarStateSource, /function\s+formatScanScopeText\(scanData = \{\}\)/);
  assert.match(toolbarStateSource, /badgeFullCount[\s\S]*scanScopeText[\s\S]*filter\(Boolean\)\.join\(' · '\)/);
});

test('content summary selects warning color results when danger count is empty', () => {
  const summaryModelSource = fs.readFileSync(path.join(__dirname, 'content-summary-model.js'), 'utf8');

  assert.match(summaryModelSource, /function\s+normalizeActiveSummaryToneForCounts\(toneCounts = EMPTY_TONE_COUNTS\)/);
  assert.match(summaryModelSource, /activeSummaryTone === 'danger' && toneCounts\.danger === 0 && toneCounts\.warning > 0/);
  assert.match(summaryModelSource, /setActiveSummaryTone\('warning'\)/);
});

test('content summary filters non-color issue lists by selected missing or raw card', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const summaryModelSource = fs.readFileSync(path.join(__dirname, 'content-summary-model.js'), 'utf8');

  assert.match(summaryModelSource, /if \(activeFilter !== 'color'\) \{[\s\S]*return entries\.filter\(\(entry\) => entry\.tone === activeSummaryTone\);[\s\S]*\}/);
  assert.match(contentSource, /if \(activeFilter && activeFilter !== 'color'\) \{[\s\S]*normalizeActiveSummaryToneForCounts\(getToneCountsForEntries\(activeIssueEntries\)\);[\s\S]*\}/);
  assert.match(summaryModelSource, /activeFilter \? getActiveSummaryTone\(\) : 'all'/);
});

test('content summary groups toggle details while child rows navigate issues on click', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /querySelectorAll\('\.fds-list-group\[data-group-key\]'\)/);
  assert.match(contentSource, /const offsetY = button\.closest\?\.\('\.fds-summary-list'\) \? 6 : 18;/);
  assert.match(contentSource, /window\.scrollY \+ rect\.top - tooltipHeight - offsetY/);
  assert.doesNotMatch(contentSource, /const showGroupPin/);
  assert.doesNotMatch(contentSource, /\.fds-list-group\[data-group-key\]'[\s\S]*?showInspectorCardForEntries\(entry\.element, \[entry\]\)[\s\S]*?panel\.querySelectorAll\('\.fds-list-item\[data-issue-key\]'\)/);
  assert.match(contentSource, /item\.onclick = \(event\) => \{[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*expandedIssueGroupKeys = nextExpandedKeys;[\s\S]*updateSummaryUI\(\);/);
  assert.match(contentSource, /querySelectorAll\('\.fds-list-item\[data-issue-key\]'\)/);
  assert.match(contentSource, /const showPin = \(\{ locked = false \} = \{\}\) =>/);
  assert.match(contentSource, /item\.onmouseenter = \(\) => showToolbarButtonTooltip\(item\);/);
  assert.match(contentSource, /item\.onfocus = \(\) => showToolbarButtonTooltip\(item\);/);
  assert.match(contentSource, /item\.onmouseleave = hideTooltip;/);
  assert.doesNotMatch(contentSource, /item\.onmouseenter = \(\) => \{[\s\S]*showPin\(\)/);
  assert.doesNotMatch(contentSource, /const showPin = \(\{ locked = false \} = \{\}\) => \{[\s\S]*?showInspectorCardForEntries\(entry\.element, \[entry\]\)[\s\S]*?return entry;/);
  assert.match(contentSource, /const entry = showPin\(\{ locked: true \}\);/);
  assert.match(contentSource, /scrollToIssueElement\(entry\)/);
});

test('content scrolls issue elements through nested app containers before window fallback', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+scheduleIssuePreviewAfterScroll\(entry\)/);
  assert.match(contentSource, /entry\.element\.scrollIntoView\(\{[\s\S]*block:\s*'center'[\s\S]*inline:\s*'center'[\s\S]*behavior/);
  assert.match(contentSource, /scheduleIssuePreviewAfterScroll\(entry\);[\s\S]*return;[\s\S]*catch \(error\)/);
  assert.match(contentSource, /function\s+scheduleIssuePreviewAfterScroll\(entry\)[\s\S]*showInspectorCardForEntries\(entry\.element, \[entry\]\)/);
  assert.match(contentSource, /if \(typeof window\.scrollTo !== 'function'\) return;[\s\S]*window\.scrollTo\(\{/);
  assert.match(contentSource, /window\.setTimeout\?\.?\(updateIssuePreview,\s*240\)/);
});

test('overlay exposes visible keyboard focus states for summary controls', () => {
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(styleSource, /\.fds-summary-tab:focus-visible/);
  assert.match(styleSource, /\.fds-stat-box\.is-toggle:focus-visible/);
  assert.match(styleSource, /\.fds-panel-close:focus-visible/);
  assert.match(styleSource, /outline: 2px solid/);
});

test('overlay shields the page from hover and click interactions while inspecting results', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const toolbarUiSource = fs.readFileSync(path.join(__dirname, 'content-toolbar-ui.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /<div id="fds-page-interaction-shield" class="fds-page-interaction-shield" aria-hidden="true"><\/div>/);
  assert.match(contentSource, /function\s+bindPageInteractionShieldEvents\(root = document\.getElementById\('fds-root'\)\)/);
  assert.match(contentSource, /'pointerover'[\s\S]*'pointermove'[\s\S]*'mouseover'[\s\S]*'mousemove'[\s\S]*'click'[\s\S]*'contextmenu'/);
  assert.match(contentSource, /event\.stopPropagation\(\);[\s\S]*eventName === 'click'[\s\S]*event\.preventDefault\(\)/);
  assert.match(contentSource, /mountPoint\.appendChild\(root\);[\s\S]*bindPageInteractionShieldEvents\(root\);/);
  assert.match(contentSource, /root\.dataset\.pageInteractionShield = activeFilter \|\| isScanning \? 'active' : 'idle';/);
  assert.match(toolbarUiSource, /root\.querySelector\('#fds-page-interaction-shield'\)/);
  assert.match(styleSource, /\.fds-page-interaction-shield\s*\{[\s\S]*position:\s*fixed/);
  assert.match(styleSource, /\.fds-page-interaction-shield\s*\{[\s\S]*inset:\s*0/);
  assert.match(styleSource, /\.fds-page-interaction-shield\s*\{[\s\S]*z-index:\s*2147483643/);
  assert.match(styleSource, /\.fds-page-interaction-shield\s*\{[\s\S]*pointer-events:\s*none/);
  assert.match(styleSource, /#fds-root\[data-page-interaction-shield="active"\]\s+\.fds-page-interaction-shield\s*\{[\s\S]*pointer-events:\s*auto/);
  assert.match(styleSource, /\.fds-issue-pin-layer\s*\{[\s\S]*z-index:\s*2147483644/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*z-index:\s*2147483645/);
  assert.match(styleSource, /\.fds-card\s*\{[\s\S]*z-index:\s*2147483646/);
  assert.match(styleSource, /#fds-root \.fds-toolbar\s*\{[\s\S]*z-index:\s*2147483647/);
});

test('overlay keeps group rows focused on value and count', () => {
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(styleSource, /\.fds-list-group\s*\{[\s\S]*grid-template-columns:\s*14px minmax\(0, 1fr\) max-content/);
  assert.match(styleSource, /\.fds-list-group\s*\{[\s\S]*padding:\s*0 8px/);
  assert.match(styleSource, /\.fds-list-group\s*\{[\s\S]*column-gap:\s*4px/);
  assert.doesNotMatch(styleSource, /\.fds-list-group\s*\{[\s\S]*column-gap:\s*7px/);
  assert.match(styleSource, /\.fds-group-caret\s*\{[\s\S]*align-self:\s*center/);
  assert.match(styleSource, /\.fds-group-caret\s*\{[\s\S]*line-height:\s*0/);
  assert.match(styleSource, /\.fds-group-caret-icon\s*\{[\s\S]*display:\s*block/);
  assert.match(styleSource, /\.fds-group-caret-icon\s*\{[\s\S]*width:\s*14px/);
  assert.match(styleSource, /\.fds-group-caret-icon\s*\{[\s\S]*height:\s*14px/);
  assert.doesNotMatch(styleSource, /\.fds-group-caret::before\s*\{/);
  assert.match(styleSource, /\.fds-group-count\s*\{[\s\S]*display:\s*inline-flex/);
  assert.match(styleSource, /\.fds-group-count\s*\{[\s\S]*align-items:\s*center/);
  assert.match(styleSource, /\.fds-group-count\s*\{[\s\S]*min-width:\s*12px/);
  assert.match(styleSource, /\.fds-group-value\s*\{[\s\S]*text-overflow:\s*ellipsis/);
  assert.match(styleSource, /\.fds-group-value\s*\{[\s\S]*display:\s*inline-flex/);
  assert.match(styleSource, /\.fds-group-value\s*\{[\s\S]*align-items:\s*center/);
  assert.doesNotMatch(styleSource, /\.fds-group-status\s*\{/);
  assert.doesNotMatch(styleSource, /\.fds-group-chip\s*\{/);
});

test('overlay keeps scrollbar gutters stable during panel focus changes', () => {
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(styleSource, /\.fds-panel-body\s*\{[\s\S]*scrollbar-width:\s*thin/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*overflow-y:\s*hidden/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(styleSource, /\.fds-summary-list\s*\{[\s\S]*overflow-y:\s*hidden/);
  assert.match(styleSource, /\.fds-summary-list\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(styleSource, /\.fds-summary-list\.is-scrollable\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(styleSource, /\.fds-summary-list\.is-scrollable\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(styleSource, /\.fds-panel-body\s*\{[\s\S]*scrollbar-gutter:\s*stable/);
  assert.doesNotMatch(styleSource, /\.fds-summary-list\.is-scrollable\s*\{[\s\S]*scrollbar-gutter:/);
  assert.match(styleSource, /\.fds-summary-card::-webkit-scrollbar\s*\{[\s\S]*width:\s*0/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing\s+\.fds-panel-body\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing\s+\.fds-summary-list\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing\s+\.fds-summary-list\.is-scrollable\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing::-webkit-scrollbar\s*\{[\s\S]*width:\s*0/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing\s+\.fds-panel-body::-webkit-scrollbar\s*\{[\s\S]*width:\s*0/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing\s+\.fds-summary-list::-webkit-scrollbar\s*\{[\s\S]*width:\s*0/);
  assert.match(styleSource, /\.fds-summary-card\.is-resizing\s+\.fds-summary-list\.is-scrollable::-webkit-scrollbar\s*\{[\s\S]*width:\s*0/);
  assert.match(styleSource, /\.fds-summary-list\.is-scrollable:hover,\s*\.fds-summary-list\.is-scrollable:focus-within\s*\{[\s\S]*scrollbar-color:\s*transparent transparent/);
  assert.match(styleSource, /\.fds-summary-list\.is-scrollable:hover::-webkit-scrollbar-thumb,\s*\.fds-summary-list\.is-scrollable:focus-within::-webkit-scrollbar-thumb\s*\{[\s\S]*background:\s*transparent/);
  assert.match(styleSource, /\.fds-summary-list::-webkit-scrollbar-thumb\s*\{[\s\S]*background-clip:\s*content-box/);
  assert.match(styleSource, /\.fds-summary-list::-webkit-scrollbar-thumb\s*\{[\s\S]*border:\s*2px solid transparent/);
  assert.doesNotMatch(
    styleSource,
    /\.fds-panel-body:hover,\s*\.fds-panel-body:focus-within\s*\{[^}]*scrollbar-width/
  );
  assert.doesNotMatch(
    styleSource,
    /\.fds-summary-list(?:\.is-scrollable)?:hover,\s*\.fds-summary-list(?:\.is-scrollable)?:focus-within\s*\{[^}]*scrollbar-width/
  );
  assert.doesNotMatch(
    styleSource,
    /\.fds-summary-card:hover,\s*\.fds-summary-card:focus-within\s*\{[^}]*scrollbar-color/
  );
});

test('content clears previous issue preview when switching inspection filters', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+clearActiveViolationPin\(\)\s*\{/);
  assert.match(contentSource, /clearHoveredInspectionTarget\(\)/);
  assert.match(contentSource, /hideInspectorCard\(\)/);
  assert.match(contentSource, /function\s+setActiveFilter\(nextFilter\)[\s\S]*clearActiveViolationPin\(\)/);
});

test('content wires motion feedback into panel, inspector, pin, and copy interactions', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /requestSummaryMotion\('tab'\)/);
  assert.match(contentSource, /getFDSMotion\(\)\?\.animateTabSwitch\?\.?\(panel,\s*tabSwitchMotionOptions\)/);
  assert.match(contentSource, /getFDSMotion\(\)\?\.animatePanelOpen\?\.?\(panel\)/);
  assert.match(contentSource, /getFDSMotion\(\)\?\.animateSummaryRefresh\?\.?\(panel/);
  assert.match(contentSource, /getFDSMotion\(\)\?\.animateInspectorCard\?\.?\(card\)/);
  assert.match(contentSource, /getFDSMotion\(\)\?\.animatePin\?\.?\(pin\)/);
  assert.match(contentSource, /getFDSMotion\(\)\?\.animateCopySuccess\?\.?\(button\)/);
});

test('tab clicks keep list content stable while allowing real height changes to animate', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /const shouldRevealListItems = !\['group-toggle', 'tab'\]\.includes\(summaryMotion\?\.kind\)/);
  assert.match(contentSource, /const didAnimateSummaryRefresh = !customSummaryPanelHeight && Boolean\(getFDSMotion\(\)\?\.animateSummaryRefresh\?\.?\(panel/);
  assert.match(contentSource, /force:\s*false/);
  assert.match(contentSource, /revealListItems:\s*shouldRevealListItems/);
});

test('summary panel height can be resized by dragging the bottom handle', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /let panelResizeState = null;/);
  assert.match(contentSource, /let customSummaryPanelHeight = null;/);
  assert.match(contentSource, /function\s+beginSummaryPanelResize\(event\)/);
  assert.match(contentSource, /function\s+moveSummaryPanelResize\(event\)/);
  assert.match(contentSource, /function\s+stopSummaryPanelResize\(\)/);
  assert.match(contentSource, /customSummaryPanelHeight = clampSummaryPanelHeight\(panelResizeState\.startHeight \+ deltaY,\s*panelResizeState\.top\)/);
  assert.match(contentSource, /panel\.style\.setProperty\('--fds-summary-custom-height', `\$\{height\}px`\)/);
  assert.match(contentSource, /<div class="fds-panel-resize-handle" role="separator" aria-label="패널 높이 조절"/);
  assert.match(contentSource, /panelResizeHandle\.onpointerdown = beginSummaryPanelResize/);
  assert.match(contentSource, /window\.addEventListener\('pointermove', moveSummaryPanelResize\)/);
  assert.match(contentSource, /window\.addEventListener\('pointerup', stopSummaryPanelResize\)/);
  assert.match(styleSource, /\.fds-panel-resize-handle\s*\{[\s\S]*cursor:\s*ns-resize/);
  assert.match(styleSource, /\.fds-summary-card\.has-custom-height\s+\.fds-summary-section\s*\{[\s\S]*flex:\s*1 1 auto/);
  assert.match(styleSource, /\.fds-summary-card\.has-custom-height\s+\.fds-summary-list\s*\{[\s\S]*max-height:\s*none/);
  assert.match(styleSource, /body\.fds-panel-resizing\s*\{[\s\S]*cursor:\s*ns-resize !important/);
});

test('filter clicks do not immediately refresh over the panel open animation', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.doesNotMatch(
    contentSource,
    /openSummaryPanelForActiveFilter\(\);\s*updateSummaryUI\(\);\s*hideTooltip\(\);/
  );
});

test('already-open summary panel uses resize motion instead of replaying panel open', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+showSummaryPanel\(\)[\s\S]*const wasPanelVisible = isSummaryPanelVisible\(\)/);
  assert.match(contentSource, /if \(!wasPanelVisible\) \{[\s\S]*getFDSMotion\(\)\?\.animatePanelOpen\?\.?\(panel\)/);
  assert.doesNotMatch(contentSource, /updateSummaryUI\(\);\s*getFDSMotion\(\)\?\.animatePanelOpen\?\.?\(panel\);/);
});

test('tab switch motion runs once per summary refresh', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /const tabSwitchMotionOptions = summaryMotion\?\.details \|\| \{\}/);
  assert.match(contentSource, /getFDSMotion\(\)\?\.animateTabSwitch\?\.?\(panel,\s*tabSwitchMotionOptions\)/);
  assert.doesNotMatch(
    contentSource,
    /getFDSMotion\(\)\?\.animateTabSwitch\?\.?\(panel\);\s*if \(summaryMotion\?\.details\) \{[\s\S]*getFDSMotion\(\)\?\.animateTabSwitch\?\.?\(panel,\s*summaryMotion\.details\)/
  );
});

test('summary list transition ghost stays anchored to the list area', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.doesNotMatch(contentSource, /listTransitionGhost\.style\.inset\s*=\s*['"]0['"]/);
  assert.match(
    contentSource,
    /listTransitionGhost\.style\.top\s*=\s*`\$\{Math\.max\(0,\s*nextList\.offsetTop\s*\|\|\s*0\)\}px`/
  );
  assert.match(contentSource, /listTransitionGhost\.style\.height\s*=\s*`\$\{previousListHeight\}px`/);
});

test('summary panel height derives from the rendered list height instead of full scroll height', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const summaryPanelSource = fs.readFileSync(path.join(__dirname, 'content-summary-panel.js'), 'utf8');

  assert.match(contentSource, /const SUMMARY_LIST_MAX_HEIGHT = 168;/);
  assert.match(contentSource, /const previousListRenderedHeight = previousList/);
  assert.match(contentSource, /previousList\.getBoundingClientRect\?\.\(\)\.height/);
  assert.match(contentSource, /previousList\.clientHeight/);
  assert.match(summaryPanelSource, /function measureNaturalSummaryPanelHeight\(panel\)/);
  assert.match(summaryPanelSource, /function measureSummaryPanelTargetHeight\(panel,\s*\{ listHeight = 0 \} = \{\}\)/);
  assert.match(summaryPanelSource, /child\.classList\?\.contains\('fds-summary-list'\)[\s\S]*\? listHeight/);
  assert.match(contentSource, /const directContentPanelHeight = measureSummaryPanelTargetHeight\(panel,\s*\{ listHeight: nextListHeight \}\)/);
  assert.match(contentSource, /const naturalPanelHeight = measureNaturalSummaryPanelHeight\(panel\)/);
  assert.match(contentSource, /const nextPanelHeight = directContentPanelHeight \|\| naturalPanelHeight \|\| listDerivedPanelHeight \|\| previousPanelHeight/);
  assert.ok(
    contentSource.indexOf('const nextPanelHeight = directContentPanelHeight')
      < contentSource.indexOf("listTransitionGhost.classList.add('fds-summary-list-transition-ghost')"),
    'summary target height should be measured before inserting the transition ghost'
  );
  assert.match(contentSource, /const previousListHeight = previousList \? Math\.min\(previousListRenderedHeight, SUMMARY_LIST_MAX_HEIGHT\) : 0/);
  assert.match(contentSource, /const nextListHeight = nextList \? Math\.min\(nextList\.scrollHeight, SUMMARY_LIST_MAX_HEIGHT\) : 0/);
  assert.doesNotMatch(contentSource, /const previousListHeight = previousList \? Math\.min\(previousList\.scrollHeight, SUMMARY_LIST_MAX_HEIGHT\) : 0/);
});

test('summary list height cap lets collapsed radius groups scroll like spacing groups', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');
  const motionSource = fs.readFileSync(path.join(__dirname, 'content-motion.js'), 'utf8');

  assert.match(contentSource, /const SUMMARY_LIST_SCROLL_ITEM_THRESHOLD = 4;/);
  assert.match(contentSource, /const hasScrollableList = renderedListItemCount > SUMMARY_LIST_SCROLL_ITEM_THRESHOLD;/);
  assert.match(styleSource, /\.fds-summary-list\s*\{[\s\S]*max-height:\s*168px/);
  assert.match(motionSource, /const SUMMARY_LIST_MAX_HEIGHT = 168;/);
});

test('summary panel reserves toolbar clearance so short collapsed lists are not visually clipped', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*padding:\s*16px 12px 12px/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*border-radius:\s*16px/);
  assert.match(styleSource, /\.fds-panel-head\s*\{[\s\S]*height:\s*auto/);
  assert.match(styleSource, /\.fds-panel-head\s*\{[\s\S]*min-height:\s*28px/);
  assert.match(styleSource, /\.fds-panel-title-wrap\s*\{[\s\S]*gap:\s*0/);
  assert.match(styleSource, /\.fds-panel-title\s*\{[\s\S]*line-height:\s*16px/);
  assert.match(styleSource, /#fds-root \.fds-panel-head \+ \.fds-summary-section\s*\{[\s\S]*margin-top:\s*8px/);
  assert.match(styleSource, /\.fds-summary-section\s*\{[\s\S]*gap:\s*4px/);
  assert.match(styleSource, /\.fds-summary-tabbar\s*\{[\s\S]*height:\s*28px/);
  assert.match(styleSource, /\.fds-summary-tab-indicator\s*\{[\s\S]*height:\s*24px/);
  assert.match(styleSource, /\.fds-summary-tab\s*\{[\s\S]*height:\s*24px/);
  assert.match(styleSource, /\.fds-summary-card-row\s*\{[\s\S]*height:\s*64px/);
  assert.match(styleSource, /\.fds-summary-card-row\s*\{[\s\S]*gap:\s*4px/);
  assert.match(styleSource, /\.fds-stat-box\s*\{[\s\S]*height:\s*64px/);
  assert.match(styleSource, /\.fds-stat-box\s*\{[\s\S]*flex:\s*0 0 calc\(\(100% - 4px\) \/ 2\)/);
  assert.match(styleSource, /\.fds-summary-list\s*\{[\s\S]*gap:\s*2px/);
  assert.match(styleSource, /\.fds-list-group\s*\{[\s\S]*min-height:\s*32px/);
  assert.match(styleSource, /\.fds-list-group-details\s*\{[\s\S]*gap:\s*2px/);
  assert.match(styleSource, /--fds-toolbar-bottom:\s*24px/);
  assert.match(styleSource, /--fds-summary-toolbar-gap:\s*16px/);
  assert.match(styleSource, /--fds-summary-panel-bottom:\s*calc\(/);
  assert.match(styleSource, /#fds-root \.fds-toolbar\s*\{[\s\S]*bottom:\s*var\(--fds-toolbar-bottom,\s*24px\)/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*bottom:\s*var\(--fds-summary-panel-bottom,\s*88px\)/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*max-height:\s*calc\(100vh - var\(--fds-summary-panel-bottom,\s*88px\) - 12px\)/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*overflow-y:\s*hidden/);
  assert.match(styleSource, /\.fds-summary-list\.is-scrollable\s*\{[\s\S]*overflow-y:\s*auto/);
  assert.match(contentSource, /function positionDockedSummaryPanel\(toolbarRect\)[\s\S]*const gap = 16;/);
});

test('summary panel uses a readable blurred surface over page content', () => {
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(styleSource, /--fds-summary-panel-surface-opacity:\s*0\.94/);
  assert.match(styleSource, /--fds-summary-panel-bg:\s*rgba\(0,\s*0,\s*0,\s*var\(--fds-summary-panel-surface-opacity,\s*0\.94\)\)/);
  assert.match(styleSource, /--fds-summary-panel-backdrop-blur:\s*16px/);
  assert.match(styleSource, /--fds-summary-panel-backdrop-brightness:\s*0\.76/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*background:\s*transparent/);
  assert.match(styleSource, /\.fds-summary-card\s*\{[\s\S]*box-shadow:\s*0 12px 28px rgba\(0,\s*0,\s*0,\s*0\.18\)/);
  assert.match(styleSource, /\.fds-summary-card::before\s*\{[\s\S]*background-color:\s*var\(--fds-summary-panel-bg,\s*rgba\(0,\s*0,\s*0,\s*0\.94\)\)/);
  assert.match(styleSource, /\.fds-summary-card::before\s*\{[\s\S]*-webkit-backdrop-filter:[\s\S]*blur\(var\(--fds-summary-panel-backdrop-blur,\s*16px\)\)[\s\S]*brightness\(var\(--fds-summary-panel-backdrop-brightness,\s*0\.76\)\)[\s\S]*saturate\(1\.05\)/);
  assert.match(styleSource, /\.fds-summary-card::before\s*\{[\s\S]*backdrop-filter:[\s\S]*blur\(var\(--fds-summary-panel-backdrop-blur,\s*16px\)\)[\s\S]*brightness\(var\(--fds-summary-panel-backdrop-brightness,\s*0\.76\)\)[\s\S]*saturate\(1\.05\)/);
  assert.match(styleSource, /\.fds-summary-card > \*\s*\{[\s\S]*z-index:\s*1/);
  assert.match(styleSource, /\.fds-stat-box\.success\s*\{[\s\S]*background:\s*rgba\(26,\s*49,\s*40,\s*0\.42\)/);
  assert.match(styleSource, /\.fds-stat-box\.danger\.is-active\s*\{[\s\S]*background:\s*rgba\(68,\s*35,\s*28,\s*0\.48\)/);
});

test('toolbar menu clicks preserve a user-moved summary panel position', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const summaryPanelSource = fs.readFileSync(path.join(__dirname, 'content-summary-panel.js'), 'utf8');

  assert.match(contentSource, /let customSummaryPanelPosition = null;/);
  assert.match(contentSource, /function\s+saveCustomSummaryPanelPosition\(\)[\s\S]*customSummaryPanelPosition = \{/);
  assert.match(contentSource, /function\s+applyCustomSummaryPanelPosition\(\)[\s\S]*applyCustomSummaryPanelPositionStyle\(\{/);
  assert.match(summaryPanelSource, /function\s+applyCustomSummaryPanelPosition\(\{[\s\S]*panel\.style\.left = `\$\{position\.left\}px`/);
  assert.match(contentSource, /function\s+restoreExpandedToolbarAndPanelPosition\(\{ preserveSummaryPanelPosition = false \} = \{\}\)/);
  assert.match(contentSource, /if \(preserveSummaryPanelPosition && applyCustomSummaryPanelPosition\(\)\) return;/);
  assert.match(contentSource, /restoreExpandedToolbarAndPanelPosition\(\{ preserveSummaryPanelPosition: Boolean\(customSummaryPanelPosition\) \}\)/);
  assert.match(contentSource, /const didMovePanel = Boolean\(panelDragState\?\.hasMoved\)/);
  assert.match(contentSource, /if \(didMovePanel\) \{[\s\S]*saveCustomSummaryPanelPosition\(\)/);
});

test('summary refresh releases fixed panel height after animation completes', () => {
  const motionSource = fs.readFileSync(path.join(__dirname, 'content-motion.js'), 'utf8');

  assert.match(motionSource, /panel\.classList\?\.add\?\.\('is-resizing'\)/);
  assert.match(motionSource, /timeline\.add\(\(\) => \{[\s\S]*panel\.classList\?\.remove\?\.\('is-resizing'\)[\s\S]*panel\.style\.height = ''/);
  assert.match(motionSource, /onComplete:\s*\(\) => \{[\s\S]*panel\.classList\?\.remove\?\.\('is-resizing'\)[\s\S]*panel\.style\.height = ''/);
  assert.doesNotMatch(motionSource, /panel\.style\.height = `\$\{resolvedToPanelHeight\}px`/);
});

test('inspector card gives users enough time to move from target to copy action', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /const INSPECTOR_CARD_HIDE_DELAY_MS = 700;/);
  assert.match(contentSource, /card\.onpointerenter = clearInspectorCardHideTimer/);
  assert.match(contentSource, /document\.addEventListener\('mouseout'[\s\S]*scheduleTransientInspectorPreviewClear\(\)/);
  assert.match(styleSource, /\.fds-card\s*\{[\s\S]*pointer-events:\s*auto/);
});

test('inspector hover card uses the violation type as its title', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /function\s+getInspectorCardTitle\(issueEntries = \[\]\)/);
  assert.match(contentSource, /return `\$\{parsedIssue\.chip \|\| '속성'\} 위반`/);
  assert.match(contentSource, /return `\$\{categoryLabel\} 위반 \$\{issueEntries\.length\}건`/);
  assert.match(contentSource, /const cardTitle = getInspectorCardTitle\(issueEntries\)/);
  assert.match(contentSource, /<div class="fds-card-title" title="\$\{escapeHtml\(cardTitle\)\}">\$\{escapeHtml\(cardTitle\)\}<\/div>/);
  assert.doesNotMatch(contentSource, /<div class="fds-card-title">INSPECTOR<\/div>/);
  assert.doesNotMatch(contentSource, /fds-card-tone/);
  assert.doesNotMatch(contentSource, /위험 감지/);
  assert.doesNotMatch(contentSource, /경고 감지/);
  assert.doesNotMatch(contentSource, /const targetLabel = getViolationPinLabel\(\{ element: target \}\)/);
  assert.doesNotMatch(contentSource, /<div class="fds-card-subtitle">\$\{target\.tagName\.toLowerCase\(\)\}<\/div>/);
  assert.match(styleSource, /\.fds-card\s*\{[\s\S]*padding:\s*10px/);
  assert.match(styleSource, /\.fds-card\s*\{[\s\S]*display:\s*flex/);
  assert.match(styleSource, /\.fds-card\s*\{[\s\S]*flex-direction:\s*column/);
  assert.match(styleSource, /\.fds-card\s*\{[\s\S]*gap:\s*8px/);
  assert.match(styleSource, /\.fds-card-head\s*\{[\s\S]*margin-bottom:\s*0/);
  assert.match(styleSource, /\.fds-card-body\s*\{[\s\S]*gap:\s*6px/);
  assert.doesNotMatch(styleSource, /\.fds-card-tone/);
  assert.match(styleSource, /\.fds-card-title\s*\{[\s\S]*text-overflow:\s*ellipsis/);
});

test('inspector hover card separates issue value from repeated violation type copy', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /function\s+getInspectorIssueDisplay\(entry\)/);
  assert.match(contentSource, /description:\s*'투명도가 포함된 미등록 컬러'/);
  assert.match(contentSource, /tip:\s*'반투명 컬러 토큰 등록을 검토하세요\.'/);
  assert.match(contentSource, /return \{ value,\s*description:\s*'미등록 컬러가 사용되었습니다\.' \}/);
  assert.match(contentSource, /return \{ value,\s*description:\s*'원시값 컬러가 사용되었습니다\.' \}/);
  assert.match(contentSource, /<strong class="fds-issue-value">\$\{escapeHtml\(issueDisplay\.value\)\}<\/strong>/);
  assert.match(contentSource, /<span class="fds-issue-description">\$\{escapeHtml\(issueDisplay\.description\)\}<\/span>/);
  assert.match(contentSource, /<span class="fds-issue-tip"><svg class="fds-issue-tip-icon" data-lucide="info"[\s\S]*<span>\$\{escapeHtml\(issueDisplay\.tip\)\}<\/span><\/span>/);
  assert.doesNotMatch(contentSource, /<div class="fds-issue-message">\$\{escapeHtml\(entry\.message\)\}<\/div>/);
  assert.match(styleSource, /\.fds-issue-message\s*\{[\s\S]*flex-direction:\s*column/);
  assert.match(styleSource, /\.fds-issue-value\s*\{[\s\S]*font-weight:\s*800/);
  assert.match(styleSource, /\.fds-issue-description\s*\{[\s\S]*font-size:\s*10px/);
  assert.match(styleSource, /\.fds-issue-tip\s*\{[\s\S]*border-top:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.08\)/);
  assert.match(styleSource, /\.fds-issue-tip\s*\{[\s\S]*align-items:\s*center/);
  assert.match(styleSource, /\.fds-issue-tip\s*\{[\s\S]*color:\s*#75bef8/);
  assert.match(styleSource, /\.fds-issue-tip-icon\s*\{[\s\S]*width:\s*12px/);
  assert.doesNotMatch(styleSource, /\.fds-issue-tip-icon\s*\{[^}]*margin-top/);
});

test('inspector hover card anchors to violation elements instead of summary list rows', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+showInspectorCardForEntries\(target,\s*issueEntries,\s*anchorElement\s*=\s*target\)/);
  assert.match(contentSource, /const\s+anchorRect\s*=\s*\(anchorElement\s*\|\|\s*target\)\.getBoundingClientRect\(\)/);
  assert.doesNotMatch(contentSource, /showInspectorCardForEntries\(entry\.element,\s*\[entry\],\s*item\)/);
  assert.match(contentSource, /showInspectorCardForEntries\(entry\.element,\s*\[entry\]\)/);
});

test('inspector card moves the summary panel away when they overlap', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+avoidSummaryPanelOverlapWithInspectorCard\(card\)/);
  assert.match(contentSource, /getRectOverlapArea\(cardRect,\s*panelRect\) <= 0/);
  assert.match(contentSource, /customSummaryPanelPosition = \{[\s\S]*left:\s*Math\.round\(nextPosition\.left\),[\s\S]*top:\s*Math\.round\(nextPosition\.top\)/);
  assert.match(contentSource, /applyCustomSummaryPanelPosition\(\);/);
  assert.match(contentSource, /placeFloatingElement\(card,[\s\S]*\);[\s\S]*avoidSummaryPanelOverlapWithInspectorCard\(card\);[\s\S]*positionViolationPin/);
});

test('inspected element mouseout gives users time to move into the inspector card', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /document\.addEventListener\('mouseout'[\s\S]*event\.target\?\.closest\?\.\('\.fds-inspected'\)[\s\S]*scheduleTransientInspectorPreviewClear\(\)/);
});

test('page mouseover gaps do not immediately close a visible inspector card', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+deferInspectorCardClear\(\)/);
  assert.match(contentSource, /document\.addEventListener\('mouseover'[\s\S]*deferInspectorCardClear\(\)/);
});

test('violation pin placement avoids overlapping the inspector card', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const floatingInspectorSource = fs.readFileSync(path.join(__dirname, 'content-floating-inspector.js'), 'utf8');

  assert.match(floatingInspectorSource, /function\s+getBestPinPosition\(rect,\s*pinWidth,\s*pinHeight,\s*avoidRect\s*=\s*null\)/);
  assert.match(floatingInspectorSource, /getRectOverlapArea\(candidate\.rect,\s*avoidRect\)/);
  assert.match(contentSource, /positionViolationPin\([\s\S]*\{\s*avoidElement:\s*card\s*\}\)/);
});

test('active violation pin follows nested app scroll and clears stale targets', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /let\s+violationPinPositionFrame\s*=\s*null/);
  assert.match(contentSource, /function\s+scheduleViolationPinPositionUpdate\(\)/);
  assert.match(contentSource, /document\.addEventListener\('scroll'[\s\S]*scheduleViolationPinPositionUpdate\(\)[\s\S]*\{\s*passive:\s*true,\s*capture:\s*true\s*\}/);
  assert.match(contentSource, /if \(!pin \|\| !entry\?\.element\?\.isConnected\) \{[\s\S]*clearActiveViolationPin\(\);[\s\S]*return;[\s\S]*\}/);
  assert.match(contentSource, /if \(!isViolationPinTargetVisible\(rect\)\) \{[\s\S]*clearActiveViolationPin\(\);[\s\S]*return;[\s\S]*\}/);
});

test('inspector token text can wrap instead of hiding long token candidates', () => {
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(styleSource, /\.fds-issue-replacement strong\s*\{[\s\S]*overflow-wrap:\s*anywhere/);
  assert.match(styleSource, /\.fds-issue-replacement strong\s*\{[\s\S]*white-space:\s*normal/);
});

test('fixture QA injects the bundled GSAP motion layer before the content script', () => {
  const qaSource = fs.readFileSync(path.join(__dirname, 'scripts/run-uiux-fixture-qa.mjs'), 'utf8');

  assert.match(qaSource, /'vendor\/gsap\.min\.js'[\s\S]*'content-motion\.js'[\s\S]*'content\.js'/);
});

test('overlay respects reduced motion preferences for CSS transitions and animations', () => {
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(styleSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styleSource, /#fds-root \*[\s\S]*animation-duration:\s*0\.01ms !important/);
  assert.match(styleSource, /#fds-root \*[\s\S]*transition-duration:\s*0\.01ms !important/);
});

test('scan runner processes elements in batches and yields between batches', async () => {
  const yielded = [];
  const elements = Array.from({ length: 5 }, (_, index) => ({ index, visible: true }));
  const runner = createContentScanRunner({
    batchSize: 2,
    getElements: () => elements,
    isElementVisible: (element) => element.visible,
    getStyles: (element) => ({ index: element.index }),
    inspectElement: ({ filterKey, element }) => ({
      issues: filterKey === 'color' && element.index % 2 === 0 ? [`color-${element.index}`] : [],
      suggestions: [],
    }),
    addIssueEntry: ({ category, message, element }) => ({
      key: `${category}-${element.index}`,
      category,
      message,
      element,
    }),
    markElement: () => {},
    yieldToBrowser: async () => {
      yielded.push('yield');
    },
  });

  const result = await runner.run({ filters: ['color', 'font'], activeFilter: 'color' });

  assert.deepEqual(result.counts, { color: 3, font: 0 });
  assert.deepEqual(result.violations, ['color-0', 'color-2', 'color-4']);
  assert.equal(yielded.length, 2);
});

test('scan runner does not add visible entries for inactive filters', async () => {
  const runner = createContentScanRunner({
    batchSize: 10,
    getElements: () => [{ visible: true }],
    isElementVisible: () => true,
    getStyles: () => ({}),
    inspectElement: ({ filterKey }) => ({
      issues: [`${filterKey}-issue`],
      suggestions: [],
    }),
    addIssueEntry: ({ category, message }) => ({ key: `${category}-${message}`, category, message }),
    markElement: () => {},
    yieldToBrowser: async () => {},
  });

  const result = await runner.run({ filters: ['color', 'font'], activeFilter: 'font' });

  assert.deepEqual(result.counts, { color: 1, font: 1 });
  assert.deepEqual(result.violations, ['font-issue']);
  assert.equal(result.issueEntries.length, 1);
});

test('scan runner can collect entries for all filters in one pass', async () => {
  const runner = createContentScanRunner({
    batchSize: 10,
    getElements: () => [{ visible: true }],
    isElementVisible: () => true,
    getStyles: () => ({}),
    inspectElement: ({ filterKey }) => ({
      issues: [`${filterKey}-issue`],
      suggestions: [],
    }),
    addIssueEntry: ({ category, message }) => ({ key: `${category}-${message}`, category, message }),
    markElement: () => {},
    yieldToBrowser: async () => {},
  });

  const result = await runner.run({ filters: ['color', 'font'], activeFilter: 'font', collectAllEntries: true });

  assert.deepEqual(result.counts, { color: 1, font: 1 });
  assert.deepEqual(result.violations, ['color-issue', 'font-issue']);
  assert.deepEqual(result.issueEntries.map((entry) => entry.category), ['color', 'font']);
});

test('scan runner can collect initial entries before an active filter is selected', async () => {
  const runner = createContentScanRunner({
    batchSize: 10,
    getElements: () => [{ visible: true }],
    isElementVisible: () => true,
    getStyles: () => ({}),
    inspectElement: ({ filterKey }) => ({
      issues: [`${filterKey}-issue`],
      suggestions: [],
    }),
    addIssueEntry: ({ category, message }) => ({ key: `${category}-${message}`, category, message }),
    markElement: () => {},
    yieldToBrowser: async () => {},
  });

  const result = await runner.run({ filters: ['color', 'font'], activeFilter: null, collectAllEntries: true });

  assert.deepEqual(result.counts, { color: 1, font: 1 });
  assert.deepEqual(result.violations, ['color-issue', 'font-issue']);
  assert.deepEqual(result.issueEntries.map((entry) => entry.category), ['color', 'font']);
});

test('scan runner counts all filters while collecting entries only for the active filter by default', async () => {
  const runner = createContentScanRunner({
    batchSize: 10,
    getElements: () => [{ visible: true }],
    isElementVisible: () => true,
    getStyles: () => ({}),
    inspectElement: ({ filterKey }) => ({
      issues: [`${filterKey}-issue`],
      suggestions: [],
    }),
    addIssueEntry: ({ category, message }) => ({ key: `${category}-${message}`, category, message }),
    markElement: () => {},
    yieldToBrowser: async () => {},
  });

  const result = await runner.run({ filters: ['color', 'font'], activeFilter: 'font' });

  assert.deepEqual(result.counts, { color: 1, font: 1 });
  assert.deepEqual(result.violations, ['font-issue']);
  assert.deepEqual(result.meta, {
    totalElementCount: 1,
    scannedElementCount: 1,
    skippedElementCount: 0,
    batchYieldCount: 0,
    truncated: false,
  });
});

test('scan runner deduplicates issue entries by key before counting visible results', async () => {
  const runner = createContentScanRunner({
    batchSize: 10,
    getElements: () => [{ index: 0 }, { index: 1 }, { index: 2 }],
    isElementVisible: () => true,
    getStyles: () => ({}),
    inspectElement: () => ({
      issues: ['패딩 14px (비규격)'],
      suggestions: [],
    }),
    addIssueEntry: ({ category, message }) => ({
      key: `${category}|same-box|${message}`,
      category,
      message,
      tone: 'danger',
    }),
    markElement: () => {},
    yieldToBrowser: async () => {},
  });

  const result = await runner.run({ filters: ['spacing'], activeFilter: 'spacing' });

  assert.equal(result.counts.spacing, 1);
  assert.equal(result.issueEntries.length, 1);
  assert.deepEqual(result.violations, ['패딩 14px (비규격)']);
});

test('scan runner yields when the batch time budget is exceeded', async () => {
  let now = 0;
  const yielded = [];
  const runner = createContentScanRunner({
    batchSize: 100,
    batchBudgetMs: 5,
    now: () => now,
    getElements: () => Array.from({ length: 4 }, (_, index) => ({ index })),
    isElementVisible: () => true,
    getStyles: () => {
      now += 3;
      return {};
    },
    inspectElement: () => ({ issues: [], suggestions: [] }),
    addIssueEntry: ({ category, message }) => ({ key: `${category}-${message}`, category, message }),
    markElement: () => {},
    yieldToBrowser: async () => {
      yielded.push(now);
    },
  });

  const result = await runner.run({ filters: ['color'], activeFilter: 'color' });

  assert.equal(result.meta.batchYieldCount >= 1, true);
  assert.equal(yielded.length >= 1, true);
});

test('scan runner can limit scanned elements and report truncation', async () => {
  const runner = createContentScanRunner({
    batchSize: 10,
    maxElements: 2,
    getElements: () => Array.from({ length: 4 }, (_, index) => ({ index })),
    isElementVisible: () => true,
    getStyles: () => ({}),
    inspectElement: () => ({ issues: ['issue'], suggestions: [] }),
    addIssueEntry: ({ category, message, element }) => ({
      key: `${category}-${element.index}`,
      category,
      message,
      element,
    }),
    markElement: () => {},
    yieldToBrowser: async () => {},
  });

  const result = await runner.run({ filters: ['color'], activeFilter: 'color' });

  assert.equal(result.meta.totalElementCount, 4);
  assert.equal(result.meta.scannedElementCount, 2);
  assert.equal(result.meta.truncated, true);
  assert.deepEqual(result.violations, ['issue', 'issue']);
});

test('content does not repaint inspection marks after being toggled off mid-scan', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /scanData\s*=\s*await runner\.run\([\s\S]*if \(!isExtensionVisible \|\| isDismissedByUser\) \{[\s\S]*clearInspectionMarks\(\);[\s\S]*return scanData;[\s\S]*\}[\s\S]*markScannedElementsFromEntries\(\)/);
  assert.match(contentSource, /function\s+clearScan\(\)\s*\{[\s\S]*clearInspectionMarks\(\)/);
});

test('content repairs stale inspector shell before visible toggle scans', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const toolbarUiSource = fs.readFileSync(path.join(__dirname, 'content-toolbar-ui.js'), 'utf8');

  assert.match(toolbarUiSource, /function\s+isInspectorUIShellComplete\(/);
  assert.match(contentSource, /function\s+ensureVisibleInspectorUI\(\)/);
  assert.match(contentSource, /if \(root && !isInspectorUIShellComplete\(root\)\) \{[\s\S]*root\.remove\(\);[\s\S]*root = null;[\s\S]*\}/);
  assert.match(contentSource, /if \(!root\) \{[\s\S]*createUI\(\);[\s\S]*root = document\.getElementById\('fds-root'\);[\s\S]*\}/);
  assert.match(contentSource, /setRootVisibility\(true\);[\s\S]*syncToolbar\(\);/);
  assert.match(contentSource, /if \(isVisible\) root = ensureVisibleInspectorUI\(\);/);
  assert.match(contentSource, /visible:\s*isInspectorUIVisible\(\)/);
  assert.match(contentSource, /Boolean\(root\.querySelector\('#fds-toolbar button'\)\)/);
});
