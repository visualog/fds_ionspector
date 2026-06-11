import { buildMetadata, runtimeGroups } from '../data/build';
import { docGroups } from '../data/docs';
import { moduleGroups } from '../data/modules';
import { ruleGroups } from '../data/rules';
import { tokenFiles } from '../data/tokens';
import { DataCard } from './DataCard';
import { FileList } from './FileList';
import { SectionBlock } from './SectionBlock';
import type { Language } from '../types/admin';

const sectionCopy = {
  en: {
    tokensEyebrow: 'Token Registry',
    tokensTitle: 'Snapshot token files',
    rulesEyebrow: 'Inspection Rules',
    rulesTitle: 'Violation categories mapped to code',
    overlayEyebrow: 'Overlay & Interaction',
    overlayTitle: 'Toolbar, summary, card, and motion surface',
    buildEyebrow: 'Build & Release',
    buildTitle: 'Extension build boundary',
    docsEyebrow: 'QA Documents',
    docsTitle: 'Verification and handoff hub',
    modulesEyebrow: 'Module Map',
    modulesTitle: 'Runtime ownership summary',
    path: 'Path',
    scope: 'Scope',
    runtime: 'Runtime',
    tests: 'Tests',
    buildCommand: 'Build command',
    outputs: 'Outputs',
    directory: 'Directory',
    zip: 'Zip',
  },
  ko: {
    tokensEyebrow: '토큰 레지스트리',
    tokensTitle: '스냅샷 토큰 파일',
    rulesEyebrow: '검사 규칙',
    rulesTitle: '위반 유형과 코드 위치',
    overlayEyebrow: '오버레이와 상호작용',
    overlayTitle: '툴바, 요약, 카드, 모션 표면',
    buildEyebrow: '빌드와 릴리스',
    buildTitle: '익스텐션 빌드 경계',
    docsEyebrow: 'QA 문서',
    docsTitle: '검증과 핸드오프 허브',
    modulesEyebrow: '모듈 맵',
    modulesTitle: '런타임 소유권 요약',
    path: '경로',
    scope: '범위',
    runtime: '런타임',
    tests: '테스트',
    buildCommand: '빌드 명령',
    outputs: '산출물',
    directory: '디렉토리',
    zip: 'Zip',
  },
};

interface SectionProps {
  language: Language;
}

export function TokenRegistrySection({ language }: SectionProps) {
  const copy = sectionCopy[language];

  return (
    <SectionBlock eyebrow={copy.tokensEyebrow} title={copy.tokensTitle}>
      <div className="card-grid">
        {tokenFiles.map((token) => (
          <DataCard key={token.path} title={language === 'ko' ? token.labelKo ?? token.label : token.label} meta={token.status}>
            <p>{language === 'ko' ? token.purposeKo ?? token.purpose : token.purpose}</p>
            <dl className="fact-list">
              <div>
                <dt>{copy.path}</dt>
                <dd><code>{token.path}</code></dd>
              </div>
              <div>
                <dt>{copy.scope}</dt>
                <dd>{language === 'ko' ? token.groupCountKo ?? token.groupCount : token.groupCount}</dd>
              </div>
            </dl>
          </DataCard>
        ))}
      </div>
    </SectionBlock>
  );
}

export function InspectionRulesSection({ language }: SectionProps) {
  const copy = sectionCopy[language];

  return (
    <SectionBlock eyebrow={copy.rulesEyebrow} title={copy.rulesTitle}>
      <div className="card-grid">
        {ruleGroups.map((rule) => (
          <DataCard key={rule.category} title={language === 'ko' ? rule.categoryKo ?? rule.category : rule.category}>
            <p>{language === 'ko' ? rule.checkKo ?? rule.check : rule.check}</p>
            <h4>{copy.runtime}</h4>
            <FileList files={rule.runtimeFiles} />
            <h4>{copy.tests}</h4>
            <FileList files={rule.testFiles} />
          </DataCard>
        ))}
      </div>
    </SectionBlock>
  );
}

export function OverlaySection({ language }: SectionProps) {
  const copy = sectionCopy[language];

  return (
    <SectionBlock eyebrow={copy.overlayEyebrow} title={copy.overlayTitle}>
      <div className="wide-card">
        {language === 'ko' ? (
          <p>
            오버레이 레이어는 <code>content.js</code>가 툴바 상태, 렌더링, 플로팅 이슈 카드,
            패널 측정, 스캔 요약, GSAP 기반 모션 helper를 조립해 구성합니다.
          </p>
        ) : (
          <p>
            The overlay layer is assembled by <code>content.js</code> from smaller helpers for toolbar state,
            rendering, floating issue cards, panel measurement, scan summaries, and GSAP-backed motion.
          </p>
        )}
        <FileList
          files={[
            'toolbar-state.js',
            'content-toolbar-ui.js',
            'content-summary-panel.js',
            'content-floating-inspector.js',
            'content-motion.js',
            'overlay.css',
          ]}
        />
      </div>
    </SectionBlock>
  );
}

export function BuildReleaseSection({ language }: SectionProps) {
  const copy = sectionCopy[language];

  return (
    <SectionBlock eyebrow={copy.buildEyebrow} title={copy.buildTitle}>
      <div className="release-grid">
        <DataCard title={copy.buildCommand} meta="manual">
          <p><code>{buildMetadata.command}</code></p>
          <p>
            {language === 'ko'
              ? '1단계에서는 UI에서 빌드를 실행하지 않고 명령어와 현재 산출물 경로만 표시합니다.'
              : 'Phase 1 shows the command and current output paths without executing builds from the UI.'}
          </p>
        </DataCard>
        <DataCard title={copy.outputs} meta={`${buildMetadata.runtimeFileCount} files`}>
          <dl className="fact-list">
            <div>
              <dt>{copy.directory}</dt>
              <dd><code>{buildMetadata.outputDirectory}</code></dd>
            </div>
            <div>
              <dt>{copy.zip}</dt>
              <dd><code>{buildMetadata.outputZip}</code></dd>
            </div>
          </dl>
        </DataCard>
      </div>
      <div className="card-grid">
        {runtimeGroups.map((group) => (
          <DataCard
            key={group.label}
            title={language === 'ko' ? group.labelKo ?? group.label : group.label}
            meta={language === 'ko' ? group.noteKo ?? group.note : group.note}
          >
            <FileList files={group.files} />
          </DataCard>
        ))}
      </div>
    </SectionBlock>
  );
}

export function DocumentsSection({ language }: SectionProps) {
  const copy = sectionCopy[language];

  return (
    <SectionBlock eyebrow={copy.docsEyebrow} title={copy.docsTitle}>
      <div className="card-grid">
        {docGroups.map((group) => (
          <DataCard key={group.label} title={group.label}>
            <FileList files={group.paths} />
          </DataCard>
        ))}
      </div>
    </SectionBlock>
  );
}

export function ModuleMapSection({ language }: SectionProps) {
  const copy = sectionCopy[language];

  return (
    <SectionBlock eyebrow={copy.modulesEyebrow} title={copy.modulesTitle}>
      <div className="card-grid">
        {moduleGroups.map((group) => (
          <DataCard key={group.label} title={language === 'ko' ? group.labelKo ?? group.label : group.label}>
            <p>{language === 'ko' ? group.descriptionKo ?? group.description : group.description}</p>
            <FileList files={group.files} />
          </DataCard>
        ))}
      </div>
    </SectionBlock>
  );
}
