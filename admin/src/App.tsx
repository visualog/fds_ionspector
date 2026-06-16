import {
  Boxes,
  ClipboardCheck,
  Component,
  FileText,
  Gauge,
  Layers3,
  PackageCheck,
  SwatchBook,
  Radar,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { buildMetadata } from './data/build';
import { appCopy, navLabels } from './data/copy';
import type { DisplayMode, Language, NavId, NavItem } from './types/admin';
import { AdminControls } from './components/AdminControls';
import { DashboardOverview } from './components/DashboardOverview';
import { ComponentLibrarySection, DesignFoundationSection } from './components/DesignSystemSections';
import {
  BuildReleaseSection,
  DocumentsSection,
  InspectionRulesSection,
  ModuleMapSection,
  OverlaySection,
  TokenRegistrySection,
} from './components/ManagementSections';
import { StatusPanel } from './components/StatusPanel';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Gauge },
  { id: 'tokens', label: 'Token Registry', icon: Layers3 },
  { id: 'foundation', label: 'Design Foundation', icon: SwatchBook },
  { id: 'components', label: 'Component Library', icon: Component },
  { id: 'rules', label: 'Inspection Rules', icon: Radar },
  { id: 'overlay', label: 'Overlay & Interaction', icon: Boxes },
  { id: 'build', label: 'Build & Release', icon: PackageCheck },
  { id: 'docs', label: 'QA Documents', icon: FileText },
  { id: 'modules', label: 'Module Map', icon: ClipboardCheck },
];

const navGroups: Array<{ label: string; labelKo: string; items: NavItem[] }> = [
  { label: 'Overview', labelKo: '개요', items: [navItems[0]] },
  { label: 'Foundation', labelKo: '파운데이션', items: [navItems[1], navItems[2]] },
  { label: 'System', labelKo: '시스템', items: [navItems[3], navItems[4], navItems[5]] },
  { label: 'Operations', labelKo: '운영', items: [navItems[6], navItems[7], navItems[8]] },
];

const sectionEyebrows: Record<Language, Record<NavId, string>> = {
  en: {
    dashboard: 'Overview',
    tokens: 'Foundation',
    foundation: 'Foundation',
    components: 'System',
    rules: 'Guidelines',
    overlay: 'System',
    build: 'Release',
    docs: 'Resources',
    modules: 'Architecture',
  },
  ko: {
    dashboard: 'Overview',
    tokens: 'Foundation',
    foundation: 'Foundation',
    components: 'System',
    rules: 'Guidelines',
    overlay: 'System',
    build: 'Release',
    docs: 'Resources',
    modules: 'Architecture',
  },
};

function App() {
  const [activeSection, setActiveSection] = useState<NavId>('dashboard');
  const [mode, setMode] = useState<DisplayMode>('light');
  const [language, setLanguage] = useState<Language>('ko');
  const copy = appCopy[language];
  const activeLabel = useMemo(
    () => navLabels[language][activeSection] ?? navLabels[language].dashboard,
    [activeSection, language],
  );
  const tocItems = useMemo(
    () => [
      activeLabel,
      language === 'ko' ? '주요 상태' : 'Status',
      language === 'ko' ? '참조 항목' : 'References',
    ],
    [activeLabel, language],
  );

  return (
    <div className="app-shell" data-theme={mode} lang={language}>
      <header className="top-nav">
        <div className="top-nav__inner">
          <div className="brand-mark">
            <span>FDS</span>
            <div>
              <strong>{copy.brandTitle}</strong>
            </div>
          </div>
          <div className="top-nav__actions">
            <div className="build-pill">
              <PackageCheck size={16} aria-hidden="true" />
              <span>{buildMetadata.outputDirectory}</span>
            </div>
            <AdminControls
              mode={mode}
              language={language}
              modeLabel={copy.modeLabel}
              languageLabel={copy.languageLabel}
              onModeChange={setMode}
              onLanguageChange={setLanguage}
            />
          </div>
        </div>
      </header>

      <div className="docs-layout">
        <aside className="sidebar" aria-label="Admin navigation">
          <nav className="nav-list">
            {navGroups.map((group) => (
              <section className="nav-group" key={group.label}>
                <p>{language === 'ko' ? group.labelKo : group.label}</p>
                {group.items.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    className={activeSection === id ? 'nav-item nav-item--active' : 'nav-item'}
                    type="button"
                    onClick={() => setActiveSection(id)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span>{navLabels[language][id]}</span>
                  </button>
                ))}
              </section>
            ))}
          </nav>
        </aside>

        <main className="workspace" id="top">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">{sectionEyebrows[language][activeSection]}</p>
              <h1>{activeLabel}</h1>
            </div>
          </header>

          {activeSection === 'dashboard' ? (
            <section className="status-grid" aria-label={copy.statusLabel}>
              <StatusPanel icon={Layers3} title={copy.tokens} value={copy.tokenValue} detail={copy.tokenDetail} />
              <StatusPanel icon={Radar} title={copy.rules} value={copy.ruleValue} detail={copy.ruleDetail} />
              <StatusPanel icon={PackageCheck} title={copy.build} value={buildMetadata.outputZip} detail={copy.buildDetail} />
              <StatusPanel icon={FileText} title={copy.docs} value={copy.docsValue} detail={copy.docsDetail} />
            </section>
          ) : null}

          {activeSection === 'dashboard' && <DashboardOverview language={language} onSelectSection={setActiveSection} />}
          {activeSection === 'tokens' && <TokenRegistrySection language={language} />}
          {activeSection === 'foundation' && <DesignFoundationSection language={language} />}
          {activeSection === 'components' && <ComponentLibrarySection language={language} />}
          {activeSection === 'rules' && <InspectionRulesSection language={language} />}
          {activeSection === 'overlay' && <OverlaySection language={language} />}
          {activeSection === 'build' && <BuildReleaseSection language={language} />}
          {activeSection === 'docs' && <DocumentsSection language={language} />}
          {activeSection === 'modules' && <ModuleMapSection language={language} />}
        </main>

        <aside className="toc-rail" aria-label="On this page">
          <p>{language === 'ko' ? '이 페이지' : 'On this page'}</p>
          <nav>
            {tocItems.map((item) => (
              <a href="#top" key={item}>{item}</a>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

export default App;
