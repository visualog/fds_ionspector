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
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildMetadata } from './data/build';
import { appCopy, navLabels } from './data/copy';
import type { DisplayMode, Language, NavId, NavItem } from './types/admin';
import { AdminControls } from './components/AdminControls';
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

function App() {
  const [activeSection, setActiveSection] = useState<NavId>('dashboard');
  const [mode, setMode] = useState<DisplayMode>('light');
  const [language, setLanguage] = useState<Language>('ko');
  const navRef = useRef<HTMLElement | null>(null);
  const [navFade, setNavFade] = useState({ left: false, right: false });
  const copy = appCopy[language];
  const activeLabel = useMemo(
    () => navLabels[language][activeSection] ?? navLabels[language].dashboard,
    [activeSection, language],
  );

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return undefined;
    }

    const updateFade = () => {
      const maxScroll = nav.scrollWidth - nav.clientWidth;
      setNavFade({
        left: nav.scrollLeft > 4,
        right: maxScroll > 4 && nav.scrollLeft < maxScroll - 4,
      });
    };

    updateFade();
    nav.addEventListener('scroll', updateFade, { passive: true });
    window.addEventListener('resize', updateFade);

    return () => {
      nav.removeEventListener('scroll', updateFade);
      window.removeEventListener('resize', updateFade);
    };
  }, [language]);

  return (
    <div className="app-shell" data-theme={mode} lang={language}>
      <aside
        className={[
          'sidebar',
          navFade.left ? 'sidebar--fade-left' : '',
          navFade.right ? 'sidebar--fade-right' : '',
        ].filter(Boolean).join(' ')}
        aria-label="Admin navigation"
      >
        <div className="sidebar-top">
          <div className="brand-mark">
            <span>FDS</span>
            <div>
              <strong>{copy.brandTitle}</strong>
            </div>
          </div>
          <div className="sidebar-mobile-controls">
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
        <nav className="nav-list" ref={navRef}>
          {navItems.map(({ id, icon: Icon }) => (
            <button
              key={id}
              className={activeSection === id ? 'nav-item nav-item--active' : 'nav-item'}
              type="button"
              onClick={() => setActiveSection(id)}
            >
              <Icon size={17} aria-hidden="true" />
              <span>{navLabels[language][id]}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{activeLabel}</h1>
          </div>
          <div className="header-actions">
            <div className="header-display-controls">
              <AdminControls
                mode={mode}
                language={language}
                modeLabel={copy.modeLabel}
                languageLabel={copy.languageLabel}
                onModeChange={setMode}
                onLanguageChange={setLanguage}
              />
            </div>
            <div className="build-pill">
              <PackageCheck size={16} aria-hidden="true" />
              <span>{buildMetadata.outputDirectory}</span>
            </div>
          </div>
        </header>

        <section className="status-grid" aria-label={copy.statusLabel}>
          <StatusPanel icon={Layers3} title={copy.tokens} value={copy.tokenValue} detail={copy.tokenDetail} />
          <StatusPanel icon={Radar} title={copy.rules} value={copy.ruleValue} detail={copy.ruleDetail} />
          <StatusPanel icon={PackageCheck} title={copy.build} value={buildMetadata.outputZip} detail={copy.buildDetail} />
          <StatusPanel icon={FileText} title={copy.docs} value={copy.docsValue} detail={copy.docsDetail} />
        </section>

        {(activeSection === 'dashboard' || activeSection === 'tokens') && <TokenRegistrySection language={language} />}
        {(activeSection === 'dashboard' || activeSection === 'foundation') && <DesignFoundationSection language={language} />}
        {(activeSection === 'dashboard' || activeSection === 'components') && <ComponentLibrarySection language={language} />}
        {(activeSection === 'dashboard' || activeSection === 'rules') && <InspectionRulesSection language={language} />}
        {(activeSection === 'dashboard' || activeSection === 'overlay') && <OverlaySection language={language} />}
        {(activeSection === 'dashboard' || activeSection === 'build') && <BuildReleaseSection language={language} />}
        {(activeSection === 'dashboard' || activeSection === 'docs') && <DocumentsSection language={language} />}
        {(activeSection === 'dashboard' || activeSection === 'modules') && <ModuleMapSection language={language} />}
      </main>
    </div>
  );
}

export default App;
