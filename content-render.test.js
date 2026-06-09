const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentRenderers } = require('./content-render.js');

const renderers = createContentRenderers({
  iconPaths: {
    close: 'assets/ic_tool_close.svg',
    color: 'assets/ic_tool_color.svg',
    warning: 'assets/ic_tool_exclamationmark.triangle.svg',
  },
  getUrl: (path) => `chrome-extension://id/${path}`,
});

test('renderToolbarMarkup preserves toolbar item order and escapes dynamic text', () => {
  const markup = renderers.renderToolbarMarkup({
    items: [
      { type: 'static', id: 'move<1>', kind: 'color' },
      { type: 'divider', id: 'divider-a' },
      { type: 'status', id: 'status', text: '<connected>', tone: 'connected' },
      { type: 'button', ref: 'close' },
    ],
    buttons: {
      close: {
        id: 'close',
        kind: 'close',
        title: '닫기',
      },
    },
  });

  assert.match(markup, /move&lt;1&gt;/);
  assert.match(markup, /&lt;connected&gt;/);
  assert.match(markup, /fds-divider/);
  assert.match(markup, /ic_tool_close\.svg/);
});

test('renderToolbarMarkup exposes full badge count while rendering numeric badge text', () => {
  const markup = renderers.renderToolbarMarkup({
    items: [{ type: 'button', ref: 'color' }],
    buttons: {
      color: {
        id: 'fds-btn-color',
        kind: 'color',
        title: '컬러 검사',
        filter: 'color',
        active: true,
        badgeMarker: true,
        badgeCount: '2003',
        badge: '2003',
        badgeFullCount: '2,003',
        badgeLabel: '컬러 검사 2,003개 위반 요소',
      },
    },
  });

  assert.match(markup, /data-badge-count="2003"/);
  assert.match(markup, /data-badge-full-count="2,003"/);
  assert.match(markup, /aria-label="컬러 검사 2,003개 위반 요소"/);
  assert.match(markup, /title="컬러 검사 2,003개 위반 요소"/);
});

test('renderToolbarMarkup hides decorative close icon from accessibility tree', () => {
  const markup = renderers.renderToolbarMarkup({
    items: [{ type: 'button', ref: 'close' }],
    buttons: {
      close: {
        id: 'fds-btn-close',
        kind: 'close',
        title: '닫기',
      },
    },
  });

  assert.match(markup, /aria-label="닫기"/);
  assert.match(markup, /<img class="fds-icon-svg"[^>]+alt=""[^>]+aria-hidden="true"/);
  assert.doesNotMatch(markup, /alt="닫기"/);
});

test('renderSummaryListItem parses and escapes violation messages', () => {
  const markup = renderers.renderSummaryListItem({
    key: 'issue<1>',
    message: `배경색 <script> (미등록)`,
    tone: 'danger',
    element: {
      tagName: 'DIV',
      id: 'target',
      className: 'primary other',
    },
  });

  assert.match(markup, /data-issue-key="issue&lt;1&gt;"/);
  assert.match(markup, /data-tooltip="요소로 이동"/);
  assert.doesNotMatch(markup, /title="[^"]*클릭하면 해당 요소로 이동합니다/);
  assert.doesNotMatch(markup, /data-issue-number=/);
  assert.doesNotMatch(markup, /fds-list-index/);
  assert.doesNotMatch(markup, /1번/);
  assert.match(markup, /&lt;script&gt;/);
  assert.doesNotMatch(markup, /<script>/);
  assert.match(markup, /div#target\.primary/);
  assert.doesNotMatch(markup, /<span class="fds-list-element">[^<]*배경색/);
  assert.doesNotMatch(markup, /fds-list-status/);
  assert.doesNotMatch(markup, /fds-list-value/);
});

test('renderSummaryListItem parses all-side padding violations', () => {
  const markup = renderers.renderSummaryListItem({
    key: 'spacing-1',
    message: '패딩 14px (비규격)',
    tone: 'danger',
    element: {
      tagName: 'DIV',
      className: 'card',
    },
  });

  assert.match(markup, /div\.card/);
  assert.doesNotMatch(markup, /<span class="fds-list-element">[^<]*패딩/);
  assert.match(markup, /비규격/);
  assert.match(markup, /14px/);
});

test('renderSummaryGroupItem can summarize all-side padding violations', () => {
  const parsed = renderers.parseViolationItem('패딩 14px (비규격)');

  assert.equal(parsed.chip, '패딩');
  assert.equal(parsed.tag, '비규격');
  assert.equal(parsed.value, '14px');
});

test('renderSummaryGroupItem can summarize directional padding violations', () => {
  const parsed = renderers.parseViolationItem('오른쪽 패딩 14px (비규격)');

  assert.equal(parsed.chip, '오른쪽 패딩');
  assert.equal(parsed.tag, '비규격');
  assert.equal(parsed.value, '14px');
});

test('renderSummaryGroupItem can summarize margin violations', () => {
  const parsed = renderers.parseViolationItem('마진 14px (비규격)');

  assert.equal(parsed.chip, '마진');
  assert.equal(parsed.tag, '비규격');
  assert.equal(parsed.value, '14px');
});

test('renderSummaryGroupItem summarizes and escapes grouped issues', () => {
  const markup = renderers.renderSummaryGroupItem({
    key: 'group<1>',
    tone: 'warning',
    chip: '글자색',
    tag: '원시값 직접 사용',
    value: '#252d38',
    count: 12,
    expanded: true,
  });

  assert.match(markup, /data-group-key="group&lt;1&gt;"/);
  assert.match(markup, /aria-expanded="true"/);
  assert.match(markup, /data-lucide="chevron-down"/);
  assert.doesNotMatch(markup, /fds-group-chip/);
  assert.doesNotMatch(markup, /fds-group-status/);
  assert.match(markup, /12개 요소/);
  assert.match(markup, /data-tooltip="목록 접기"/);
  assert.doesNotMatch(markup, /title="[^"]*클릭하면 상세 목록을 접습니다/);
  assert.match(markup, /<span class="fds-group-count" aria-label="12개 요소">12<\/span>/);
  assert.doesNotMatch(markup, /대표 요소로 이동/);
  assert.match(markup, /클릭하면 상세 목록을 접습니다/);
  assert.match(markup, /#252d38/);
});

test('renderSummaryGroupItem keeps visible group rows focused on value and count', () => {
  const markup = renderers.renderSummaryGroupItem({
    key: 'spacing-right',
    tone: 'warning',
    chip: '오른쪽 패딩',
    tag: '비규격',
    value: '14px',
    count: 1,
  });

  assert.match(markup, /data-tooltip="목록 펼치기"/);
  assert.match(markup, /<span class="fds-group-value">14px<\/span>/);
  assert.match(markup, /<span class="fds-group-count" aria-label="1개 요소">1<\/span>/);
  assert.match(markup, /data-lucide="chevron-right"/);
  assert.doesNotMatch(markup, /data-lucide="chevron-down"/);
  assert.doesNotMatch(markup, /fds-group-chip/);
  assert.doesNotMatch(markup, /fds-group-status/);
});

test('formatTokenContextLabel identifies token counts as token counts', () => {
  const label = renderers.formatTokenContextLabel({
    sourceName: 'tokens/*.json',
    colorCount: 539,
    spacingCount: 18,
    radiusCount: 10,
  });

  assert.equal(label, 'tokens/*.json · 기준 컬러 토큰 539개 · 간격 토큰 18개 · 라운드 토큰 10개');
});

test('createSummaryMetricCards keeps missing and raw labels for non-color summaries', () => {
  const cards = renderers.createSummaryMetricCards({
    hasViolations: true,
    activeFilter: 'spacing',
    missingColorCount: 0,
    primitiveColorCount: 3999,
    missingColorPatternCount: 0,
    primitiveColorPatternCount: 3,
    activeSummaryTone: 'danger',
  });

  assert.equal(cards[0].label, '미등록');
  assert.equal(cards[0].value, 0);
  assert.equal(cards[0].caption, '영향 0개 요소');
  assert.equal(cards[1].label, '원시값');
  assert.equal(cards[1].value, 3);
  assert.equal(cards[1].caption, '영향 3,999개 요소');
  assert.equal(cards.some((card) => card.label === '검토 패턴' || card.label === '영향 요소'), false);
});

test('createSummaryMetricCards shows color tone pattern counts with affected element captions', () => {
  const cards = renderers.createSummaryMetricCards({
    hasViolations: true,
    activeFilter: 'color',
    missingColorCount: 32,
    primitiveColorCount: 2001,
    missingColorPatternCount: 2,
    primitiveColorPatternCount: 1,
    activeSummaryTone: 'warning',
  });

  assert.equal(cards[0].label, '미등록');
  assert.equal(cards[0].value, 2);
  assert.equal(cards[0].caption, '영향 32개 요소');
  assert.equal(cards[1].label, '원시값');
  assert.equal(cards[1].value, 1);
  assert.equal(cards[1].caption, '영향 2,001개 요소');
  assert.equal(cards[1].isActive, true);
});

test('renderSummaryMetricCard keeps zero visible for completed empty states', () => {
  const markup = renderers.renderSummaryMetricCard({
    tone: 'success',
    label: '위반 없음',
    value: 0,
    icon: 'success',
  });

  assert.match(markup, /<div class="fds-stat-num">0<\/div>/);
  assert.match(markup, /aria-label="위반 없음: 0"/);
});

test('renderSummaryMetricCard exposes concise captions in visible and accessible text', () => {
  const markup = renderers.renderSummaryMetricCard({
    tone: 'warning',
    label: '원시값',
    value: 1,
    caption: '영향 2,001개 요소',
    isToggle: true,
    isActive: true,
  });

  assert.match(markup, /<div class="fds-stat-caption">영향 2,001개 요소<\/div>/);
  assert.match(markup, /aria-label="원시값: 1, 영향 2,001개 요소"/);
});

test('renderSummaryEmptyState explains idle and empty active filter states', () => {
  const idleMarkup = renderers.renderSummaryEmptyState({ isIdle: true });
  assert.match(idleMarkup, /툴바에서 컬러, 폰트, 간격, 라운드/);

  const activeMarkup = renderers.renderSummaryEmptyState({
    isIdle: false,
    activeFilterLabel: '폰트',
  });
  assert.match(activeMarkup, /폰트 위반 항목이 없습니다/);
});

test('renderSummaryTabBar renders BG Border Text tabs for color summary only', () => {
  const colorMarkup = renderers.renderSummaryTabBar({
    activeFilter: 'color',
    colorTabs: [
      { key: 'bg', label: 'BG', count: 2 },
      { key: 'border', label: 'Border', count: 1 },
      { key: 'text', label: 'Text', count: 2001 },
    ],
    activeSummarySubtab: 'bg',
  });

  assert.match(colorMarkup, /fds-summary-tabbar/);
  assert.match(colorMarkup, /data-summary-tab="bg"/);
  assert.match(colorMarkup, /data-summary-tab="border"/);
  assert.match(colorMarkup, /data-summary-tab="text"/);
  assert.match(colorMarkup, /aria-label="배경색 2개 요소"/);
  assert.match(colorMarkup, /aria-label="보더색 1개 요소"/);
  assert.match(colorMarkup, /aria-label="글자색 2,001개 요소"/);
  assert.match(colorMarkup, /title="글자색 2,001개 요소"/);
  assert.doesNotMatch(colorMarkup, /<strong>/);

  for (const filter of ['font', 'spacing', 'radius']) {
    const markup = renderers.renderSummaryTabBar({
      activeFilter: filter,
      colorTabs: [
        { key: 'bg', label: 'BG', count: 2 },
      ],
      activeSummarySubtab: 'bg',
    });

    assert.equal(markup, '');
  }
});
