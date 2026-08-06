const test = require('node:test');
const assert = require('node:assert/strict');

const { createContentRenderers } = require('./content-render.js');
const {
  createViolationReportAiRequestFilename,
  createViolationReportAiRequestMarkdown,
  createViolationReportHtml,
} = require('./content-violation-report.js');

const { parseViolationItem } = createContentRenderers({
  iconPaths: {},
  getUrl: (path) => path,
  escapeHtml: (value) => String(value ?? ''),
});

test('createViolationReportHtml groups every violation into a styled savable report', () => {
  const report = createViolationReportHtml({
    scanData: {
      issueEntries: [
        {
          key: 'color-1',
          category: 'color',
          colorPart: 'bg',
          tone: 'danger',
          message: '배경색 #ffffff (미등록)',
          element: {
            tagName: 'DIV',
            className: 'card primary',
            parentElement: {
              tagName: 'SECTION',
              className: 'hero-section',
              parentElement: {
                tagName: 'MAIN',
                className: 'app-main',
                parentElement: {
                  tagName: 'DIV',
                  id: 'root',
                },
              },
            },
          },
        },
        {
          key: 'color-2',
          category: 'color',
          colorPart: 'bg',
          tone: 'danger',
          message: '배경색 #ffffff (미등록)',
          element: { tagName: 'BUTTON', className: 'cta' },
        },
        {
          key: 'color-bg-raw',
          category: 'color',
          colorPart: 'bg',
          tone: 'warning',
          message: '배경색 #f9fafb (원시값 직접 사용)',
          element: { tagName: 'DIV', className: 'panel' },
        },
        {
          key: 'color-border-1',
          category: 'color',
          colorPart: 'border',
          tone: 'danger',
          message: '보더색 #d0d7e2 (미등록)',
          element: { tagName: 'INPUT', className: 'field' },
        },
        {
          key: 'color-text-1',
          category: 'color',
          colorPart: 'text',
          tone: 'warning',
          message: '글자색 #172033 (원시값 직접 사용)',
          element: { tagName: 'P', className: 'copy' },
        },
        {
          key: 'font-1',
          category: 'font',
          tone: 'danger',
          message: "서체 'Inter' (차단)",
          element: { tagName: 'SPAN', className: 'label' },
        },
        {
          key: 'spacing-1',
          category: 'spacing',
          tone: 'warning',
          message: '오른쪽 패딩 13px (원시값 직접 사용: spacing/13)',
          metadata: {
            cssEvidence: {
              property: 'padding-right',
              computedValue: '13px',
              authoredProperty: 'padding-right',
              authoredValue: '13px',
              declaration: 'padding-right: 13px',
              selector: '.stack',
              source: 'https://example.test/assets/layout.css',
              confidence: 'high',
              confidenceReason: '작성 CSS 선언과 적용 선택자를 확인함',
            },
          },
          element: { tagName: 'SECTION', className: 'stack' },
        },
        {
          key: 'radius-1',
          category: 'radius',
          tone: 'warning',
          message: '라운드 10px (원시값 직접 사용: radius/10)',
          element: { tagName: 'DIV', className: 'surface' },
        },
      ],
      meta: {
        scannedElementCount: 15,
        skippedElementCount: 2,
      },
    },
    pageTitle: 'Billing Dashboard | Example Console',
    pageUrl: 'https://example.test/page',
    inspectedAt: new Date('2026-06-18T09:30:00+09:00'),
    tokenContextLabel: 'FDS v2 · 기준 컬러 토큰 12개',
    parseViolationItem,
    getSuggestedTokensForIssue: (entry) => {
      if (entry.message.includes('#f9fafb')) return ['Color.bg.surface'];
      return [];
    },
    getViolationNoteForEntry: (entry) => {
      if (entry.key === 'color-1') {
        return { text: '공통 카드 컨테이너 스타일에서 수정 필요' };
      }
      return null;
    },
  });

  assert.match(report, /^<!doctype html>/);
  assert.match(report, /<title>FDS 디자인 토큰 위반 요소 리포트<\/title>/);
  assert.match(report, /<p class="eyebrow">https:\/\/example\.test\/page<\/p>/);
  assert.match(report, /<h1>FDS 디자인 토큰 위반 요소 리포트<\/h1>/);
  assert.match(report, /<div class="report-view-tabs" role="tablist" aria-label="리포트 화면 전환">/);
  assert.match(report, /<button class="report-view-tab is-active" type="button" role="tab" aria-selected="true" aria-controls="report-view-report" id="report-view-tab-report" data-report-view-tab="report">리포트<\/button>/);
  assert.match(report, /<button class="report-view-tab" type="button" role="tab" aria-selected="false" aria-controls="report-view-ai-request" id="report-view-tab-ai-request" data-report-view-tab="ai-request">AI 수정 요청서<\/button>/);
  assert.match(report, /<div class="report-view-panel is-active" id="report-view-report" role="tabpanel" aria-labelledby="report-view-tab-report" data-report-view-panel="report">/);
  assert.match(report, /<section class="scan-summary-section" aria-labelledby="summary-title">/);
  assert.match(report, /<div class="section-title-row">[\s\S]*<h2 id="summary-title">검사 정보<\/h2>/);
  assert.match(report, /<div class="summary-title-meta" aria-label="검사 메타 정보">/);
  assert.match(report, /<div class="summary-overview">/);
  assert.match(report, /<article class="summary-panel violation-info">[\s\S]*<div class="summary-grid">/);
  assert.match(report, /\.summary-panel \{\s*padding: 0;\s*background: transparent;\s*border: 0;\s*border-radius: 0;\s*\}/);
  assert.match(report, /tbody th \{\s*background: var\(--surface\);\s*\}/);
  assert.doesNotMatch(report, /<article class="summary-panel scan-info">/);
  assert.doesNotMatch(report, /<article class="summary-panel scan-info">[\s\S]*<h3>검사 정보<\/h3>/);
  assert.doesNotMatch(report, /<article class="summary-panel violation-info">[\s\S]*<h3>위반 정보<\/h3>/);
  assert.doesNotMatch(report, /<span class="meta-label">페이지<\/span>/);
  assert.doesNotMatch(report, /<span class="meta-label">URL<\/span>/);
  assert.match(report, /<span class="meta-label">검사 시각<\/span><span>2026-06-18 09:30<\/span>/);
  assert.match(report, /<span class="meta-label">토큰 기준<\/span><span>FDS v2 · 기준 컬러 토큰 12개<\/span>/);
  assert.doesNotMatch(report, /<span class="meta-label">검사됨<\/span>/);
  assert.doesNotMatch(report, /<span class="meta-label">제외됨<\/span>/);
  assert.match(report, /<article class="summary-card total">[\s\S]*<strong>8<\/strong>/);
  assert.match(report, /<tr><th>컬러<\/th><td>5<\/td><td>3<\/td><td>2<\/td><\/tr>/);
  assert.match(report, /<tr><th>폰트<\/th><td>1<\/td><td>1<\/td><td>0<\/td><\/tr>/);
  assert.match(report, /<tr><th>간격<\/th><td>1<\/td><td>0<\/td><td>1<\/td><\/tr>/);
  assert.match(report, /<tr><th>라운드<\/th><td>1<\/td><td>0<\/td><td>1<\/td><\/tr>/);
  assert.match(report, /<section class="violation-detail-section" aria-labelledby="violation-detail-title">/);
  assert.match(report, /<h2 id="violation-detail-title">검사 결과<\/h2>/);
  assert.match(report, /<p class="location-guidance"><strong>위치 정보 안내<\/strong> DOM 클래스명은 빌드 과정에서 생성된 불안정한 값일 수 있습니다\./);
  assert.match(report, /<div class="report-tabs" role="tablist" aria-label="위반 카테고리">/);
  assert.match(report, /<button class="report-tab is-active" type="button" role="tab" aria-selected="true" aria-controls="report-panel-color-bg" id="report-tab-color-bg" data-report-tab="color-bg">배경색 <span>3<\/span><\/button>/);
  assert.match(report, /<button class="report-tab" type="button" role="tab" aria-selected="false" aria-controls="report-panel-color-border" id="report-tab-color-border" data-report-tab="color-border">보더색 <span>1<\/span><\/button>/);
  assert.match(report, /<button class="report-tab" type="button" role="tab" aria-selected="false" aria-controls="report-panel-color-text" id="report-tab-color-text" data-report-tab="color-text">폰트색 <span>1<\/span><\/button>/);
  assert.match(report, /<button class="report-tab" type="button" role="tab" aria-selected="false" aria-controls="report-panel-font-family" id="report-tab-font-family" data-report-tab="font-family">폰트 패밀리 <span>1<\/span><\/button>/);
  assert.match(report, /<button class="report-tab" type="button" role="tab" aria-selected="false" aria-controls="report-panel-spacing" id="report-tab-spacing" data-report-tab="spacing">스페이싱 <span>1<\/span><\/button>/);
  assert.match(report, /<button class="report-tab" type="button" role="tab" aria-selected="false" aria-controls="report-panel-radius" id="report-tab-radius" data-report-tab="radius">모서리 라운드 <span>1<\/span><\/button>/);
  assert.doesNotMatch(report, /class="category-title"/);
  assert.match(report, /<section class="category-section is-active" id="report-panel-color-bg" role="tabpanel" aria-labelledby="report-tab-color-bg" data-report-panel="color-bg">/);
  assert.match(report, /\.issue-group \{\s*margin-bottom: 0;/);
  assert.match(report, /\.category-section \{\s*display: flex;\s*flex-direction: column;\s*gap: 4px;\s*\}/);
  assert.match(report, /\.issue-table-summary \{[\s\S]*font-size: 12px;\s*line-height: 16px;[\s\S]*\}/);
  assert.match(report, /\.issue-table-summary \.tone \{[\s\S]*font-size: 12px;\s*line-height: 16px;[\s\S]*\}/);
  assert.match(report, /\.issue-table-summary \.tone\.danger \{\s*box-shadow: inset 0 0 0 1px #ffd4cf;\s*\}/);
  assert.match(report, /\.issue-table-summary \.tone\.warning \{\s*box-shadow: inset 0 0 0 1px #f8deb4;\s*\}/);
  assert.match(report, /<details class="issue-group danger">\s*<summary class="issue-table-summary">\s*<span class="issue-accordion-marker" aria-hidden="true"><\/span>[\s\S]*<span class="tone danger">미등록<\/span>[\s\S]*<span class="issue-table-separator">\/<\/span>[\s\S]*<span class="issue-table-title"><code>#ffffff<\/code><\/span>[\s\S]*<span class="issue-table-separator">\/<\/span>[\s\S]*<span class="issue-table-impact">2개 요소에 영향<\/span>[\s\S]*<\/summary>/);
  assert.doesNotMatch(report, /<span class="issue-table-title">배경색 <code>#ffffff<\/code><\/span>/);
  assert.match(report, /<details class="issue-group danger">[\s\S]*<span class="tone danger">미등록<\/span>[\s\S]*<\/details>\s*<details class="issue-group warning">[\s\S]*<span class="tone warning">원시값 직접 사용<\/span>[\s\S]*<span class="issue-table-title"><code>#f9fafb<\/code><\/span>/);
  assert.match(report, /<div class="issue-token-hint"><span>대체 토큰<\/span><code>Color\.bg\.surface<\/code><\/div>/);
  assert.doesNotMatch(report, /<details class="issue-group danger" open>/);
  assert.doesNotMatch(report, /issue-table-summary-row/);
  assert.match(report, /<tr class="path-row" tabindex="0" aria-expanded="false" data-path-row data-compact-path="div#root &gt; … &gt; div\.card" data-full-path="div#root &gt; main\.app-main &gt; section\.hero-section &gt; div\.card"><td><code class="path-compact"><span class="path-view path-view-compact">[\s\S]*<span class="path-segment path-segment-impact danger">div\.card<\/span>[\s\S]*<span class="path-view path-view-full">[\s\S]*<span class="path-segment path-segment-impact danger">div\.card<\/span>[\s\S]*<\/code>[\s\S]*<\/td><\/tr>/);
  assert.match(report, /<div class="path-note"><span>사용자 메모<\/span><p>공통 카드 컨테이너 스타일에서 수정 필요<\/p><\/div>/);
  assert.match(report, /<tr class="path-row" tabindex="0" aria-expanded="false" data-path-row data-compact-path="button\.cta" data-full-path="button\.cta"><td><code class="path-compact"><span class="path-view path-view-compact"><span class="path-segment path-segment-impact danger">button\.cta<\/span><\/span><span class="path-view path-view-full"><span class="path-segment path-segment-impact danger">button\.cta<\/span><\/span><\/code><\/td><\/tr>/);
  assert.match(report, /<tr class="path-row" tabindex="0" aria-expanded="false" data-path-row data-compact-path="div\.panel" data-full-path="div\.panel"><td><code class="path-compact"><span class="path-view path-view-compact"><span class="path-segment path-segment-impact warning">div\.panel<\/span><\/span><span class="path-view path-view-full"><span class="path-segment path-segment-impact warning">div\.panel<\/span><\/span><\/code><\/td><\/tr>/);
  assert.doesNotMatch(report, /<code class="path-compact" title=/);
  assert.doesNotMatch(report, /<th>위반 요소 위치<\/th>/);
  assert.doesNotMatch(report, /<th>영향 요소<\/th>/);
  assert.doesNotMatch(report, /<th>페이지 내 위치<\/th>/);
  assert.doesNotMatch(report, /<th>소스 위치<\/th>/);
  assert.doesNotMatch(report, /source-unavailable/);
  assert.doesNotMatch(report, /확인 불가/);
  assert.doesNotMatch(report, /<th>위반 내용<\/th>/);
  assert.doesNotMatch(report, /<th>키<\/th>/);
  assert.doesNotMatch(report, /<td><code>color-1<\/code><\/td>/);
  assert.match(report, /<section class="category-section" id="report-panel-color-border" role="tabpanel" aria-labelledby="report-tab-color-border" data-report-panel="color-border" hidden>/);
  assert.match(report, /<tr class="path-row" tabindex="0" aria-expanded="false" data-path-row data-compact-path="input\.field" data-full-path="input\.field"><td><code class="path-compact"><span class="path-view path-view-compact"><span class="path-segment path-segment-impact danger">input\.field<\/span><\/span><span class="path-view path-view-full"><span class="path-segment path-segment-impact danger">input\.field<\/span><\/span><\/code><\/td><\/tr>/);
  assert.match(report, /<section class="category-section" id="report-panel-color-text" role="tabpanel" aria-labelledby="report-tab-color-text" data-report-panel="color-text" hidden>/);
  assert.match(report, /<tr class="path-row" tabindex="0" aria-expanded="false" data-path-row data-compact-path="p\.copy" data-full-path="p\.copy"><td><code class="path-compact"><span class="path-view path-view-compact"><span class="path-segment path-segment-impact warning">p\.copy<\/span><\/span><span class="path-view path-view-full"><span class="path-segment path-segment-impact warning">p\.copy<\/span><\/span><\/code><\/td><\/tr>/);
  assert.match(report, /<section class="category-section" id="report-panel-font-family" role="tabpanel" aria-labelledby="report-tab-font-family" data-report-panel="font-family" hidden>/);
  assert.match(report, /<tr class="path-row" tabindex="0" aria-expanded="false" data-path-row data-compact-path="span\.label" data-full-path="span\.label"><td><code class="path-compact"><span class="path-view path-view-compact"><span class="path-segment path-segment-impact danger">span\.label<\/span><\/span><span class="path-view path-view-full"><span class="path-segment path-segment-impact danger">span\.label<\/span><\/span><\/code><\/td><\/tr>/);
  assert.match(report, /<section class="category-section" id="report-panel-spacing" role="tabpanel" aria-labelledby="report-tab-spacing" data-report-panel="spacing" hidden>/);
  assert.match(report, /<span class="tone warning">원시값 직접 사용<\/span>[\s\S]*<span class="issue-table-title"><code>13px<\/code><\/span>[\s\S]*<span class="issue-table-impact">1개 요소에 영향<\/span>[\s\S]*<div class="issue-token-hint"><span>대체 토큰<\/span><code>spacing\/13<\/code><\/div>/);
  assert.match(report, /<tr class="path-row" tabindex="0" aria-expanded="false" data-path-row data-compact-path="section\.stack" data-full-path="section\.stack"><td><code class="path-compact"><span class="path-view path-view-compact"><span class="path-segment path-segment-impact warning">section\.stack<\/span><\/span><span class="path-view path-view-full"><span class="path-segment path-segment-impact warning">section\.stack<\/span><\/span><\/code><\/td><\/tr>/);
  assert.match(report, /<div class="css-evidence" aria-label="CSS 근거">[\s\S]*<dt>속성<\/dt><dd><code>padding-right<\/code><\/dd>[\s\S]*<dt>계산값<\/dt><dd><code>13px<\/code><\/dd>[\s\S]*<dt>작성 선언<\/dt><dd><code>padding-right: 13px<\/code><\/dd>[\s\S]*<dt>선택자<\/dt><dd><code>\.stack<\/code><\/dd>[\s\S]*<dt>출처<\/dt><dd><code>https:\/\/example\.test\/assets\/layout\.css<\/code><\/dd>[\s\S]*<dt>판정 신뢰도<\/dt><dd><code>높음<\/code><\/dd>[\s\S]*<dt>판정 근거<\/dt><dd><code>작성 CSS 선언과 적용 선택자를 확인함<\/code><\/dd>[\s\S]*<\/div>/);
  assert.match(report, /<section class="category-section" id="report-panel-radius" role="tabpanel" aria-labelledby="report-tab-radius" data-report-panel="radius" hidden>/);
  assert.match(report, /<script>\(\(\) => \{/);
  assert.match(report, /document\.querySelectorAll\('\[data-report-view-tab\]'\)/);
  assert.match(report, /panel\.hidden = panel\.dataset\.reportViewPanel !== nextView;/);
  assert.match(report, /document\.querySelectorAll\('\[data-report-tab\]'\)/);
  assert.match(report, /panel\.hidden = panel\.dataset\.reportPanel !== nextCategory;/);
  assert.match(report, /document\.querySelectorAll\('\[data-path-row\]'\)/);
  assert.match(report, /row\.classList\.toggle\('is-expanded', !expanded\);/);
  assert.match(report, /event\.key !== 'Enter' && event\.key !== ' '/);
  assert.match(report, /<section class="report-view-panel ai-request-panel" id="report-view-ai-request" role="tabpanel" aria-labelledby="report-view-tab-ai-request" data-report-view-panel="ai-request" hidden>/);
  assert.match(report, /<pre class="ai-request-doc"># FDS 디자인 토큰 위반 수정 요청서[\s\S]*## 배경색[\s\S]*### 미등록 \/ #ffffff \/ 2개 요소에 영향[\s\S]*<\/pre>/);
});

test('createViolationReportHtml uses the page URL as the report eyebrow', () => {
  const report = createViolationReportHtml({
    scanData: { issueEntries: [], meta: {} },
    pageTitle: 'Settings',
    pageUrl: 'https://admin.example.com/settings',
    inspectedAt: new Date('2026-06-18T00:00:00Z'),
    parseViolationItem,
  });

  assert.match(report, /<title>FDS 디자인 토큰 위반 요소 리포트<\/title>/);
  assert.match(report, /<p class="eyebrow">https:\/\/admin\.example\.com\/settings<\/p>/);
  assert.match(report, /<h1>FDS 디자인 토큰 위반 요소 리포트<\/h1>/);
});

test('createViolationReportAiRequestMarkdown summarizes violations for AI handoff', () => {
  const inspectedAt = new Date('2026-06-18T09:30:00+09:00');
  const markdown = createViolationReportAiRequestMarkdown({
    scanData: {
      issueEntries: [
        {
          key: 'color-1',
          category: 'color',
          colorPart: 'bg',
          tone: 'danger',
          message: '배경색 #ffffff (미등록)',
          element: { tagName: 'DIV', className: 'card' },
        },
        {
          key: 'spacing-1',
          category: 'spacing',
          tone: 'warning',
          message: '오른쪽 패딩 13px (원시값 직접 사용: spacing/13)',
          metadata: {
            cssEvidence: {
              property: 'padding-right',
              computedValue: '13px',
              declaration: 'padding-right: 13px',
              selector: '.stack',
              source: 'https://example.test/assets/layout.css',
              confidence: 'high',
              confidenceReason: '작성 CSS 선언과 적용 선택자를 확인함',
            },
          },
          element: { tagName: 'SECTION', className: 'stack' },
        },
        {
          key: 'color-bg-raw',
          category: 'color',
          colorPart: 'bg',
          tone: 'warning',
          message: '배경색 #f9fafb (원시값 직접 사용)',
          element: { tagName: 'DIV', className: 'surface' },
        },
        {
          key: 'color-border-raw',
          category: 'color',
          colorPart: 'border',
          tone: 'warning',
          message: '보더색 #d0d7e2 (원시값 직접 사용)',
          element: { tagName: 'INPUT', className: 'field' },
        },
      ],
    },
    pageTitle: 'Billing Dashboard',
    pageUrl: 'https://example.test/page',
    inspectedAt,
    tokenContextLabel: 'FDS v2 · 기준 컬러 토큰 12개',
    parseViolationItem,
    getSuggestedTokensForIssue: (entry) => {
      if (entry.message.includes('#f9fafb')) return ['Color.bg.surface'];
      if (entry.message.includes('#d0d7e2')) return ['Color.border.default'];
      return [];
    },
    getViolationNoteForEntry: (entry) => {
      if (entry.key === 'spacing-1') {
        return { text: 'Stack 컴포넌트 gap token으로 정리' };
      }
      return null;
    },
  });

  assert.match(markdown, /^# FDS 디자인 토큰 위반 수정 요청서/);
  assert.match(markdown, /- URL: https:\/\/example\.test\/page/);
  assert.match(markdown, /- 검사 시각: 2026-06-18 09:30/);
  assert.match(markdown, /- 위치 정보 안내: DOM 클래스명은 빌드 과정에서 생성된 불안정한 값일 수 있습니다\./);
  assert.match(markdown, /## 배경색[\s\S]*### 미등록 \/ #ffffff \/ 1개 요소에 영향/);
  assert.match(markdown, /## 배경색[\s\S]*### 원시값 직접 사용 \/ #f9fafb \/ 1개 요소에 영향[\s\S]*대체 토큰: Color\.bg\.surface/);
  assert.match(markdown, /## 보더색[\s\S]*### 원시값 직접 사용 \/ #d0d7e2 \/ 1개 요소에 영향[\s\S]*대체 토큰: Color\.border\.default/);
  assert.match(markdown, /영향 요소 위치:\n1\. div\.card/);
  assert.match(markdown, /## 스페이싱[\s\S]*### 원시값 직접 사용 \/ 13px \/ 1개 요소에 영향[\s\S]*대체 토큰: spacing\/13/);
  assert.match(markdown, /1\. section\.stack[\s\S]*   - CSS 속성: padding-right[\s\S]*   - 계산값: 13px[\s\S]*   - 작성 선언: padding-right: 13px[\s\S]*   - 선택자: \.stack[\s\S]*   - 출처: https:\/\/example\.test\/assets\/layout\.css[\s\S]*   - 판정 신뢰도: 높음[\s\S]*   - 판정 근거: 작성 CSS 선언과 적용 선택자를 확인함[\s\S]*   - 사용자 메모: Stack 컴포넌트 gap token으로 정리/);
  assert.doesNotMatch(markdown, /- 검사 탭:/);
  assert.doesNotMatch(markdown, /- 위반 상태:/);
  assert.doesNotMatch(markdown, /- 위반 값:/);
  assert.doesNotMatch(markdown, /- 영향 요소 수:/);
  assert.equal(createViolationReportAiRequestFilename(inspectedAt), 'fds-violation-ai-request-20260618-0930.md');
});

test('createViolationReportHtml renders an empty-state document when there are no violations', () => {
  const report = createViolationReportHtml({
    scanData: { issueEntries: [], meta: { scannedElementCount: 4 } },
    pageTitle: '',
    pageUrl: '',
    inspectedAt: new Date('2026-06-18T00:00:00Z'),
    parseViolationItem,
  });

  assert.match(report, /<p class="empty-state">검출된 위반 요소가 없습니다\.<\/p>/);
  assert.match(report, /<article class="summary-card total">[\s\S]*<strong>0<\/strong>/);
  assert.match(report, /<button class="report-tab is-active" type="button" role="tab" aria-selected="true" aria-controls="report-panel-color-bg" id="report-tab-color-bg" data-report-tab="color-bg">배경색 <span>0<\/span><\/button>/);
});
