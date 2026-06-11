import { componentGroups, extensionColorTokens, foundationGroups } from '../data/designSystem';
import type { Language } from '../types/admin';
import { DataCard } from './DataCard';
import { FileList } from './FileList';
import { SectionBlock } from './SectionBlock';

const designCopy = {
  en: {
    foundationEyebrow: 'Design Foundation',
    foundationTitle: 'Extension design primitives',
    componentsEyebrow: 'Component Library',
    componentsTitle: 'Reusable inspector surfaces',
    source: 'Source',
    tests: 'Tests',
    states: 'States',
    tokens: 'Token hooks',
    manageNote: 'Source of truth today: design-variables.js. Next step: local write API that updates this source and rebuilds the extension.',
  },
  ko: {
    foundationEyebrow: '디자인 파운데이션',
    foundationTitle: '익스텐션 디자인 기초값',
    componentsEyebrow: '컴포넌트 라이브러리',
    componentsTitle: '재사용되는 인스펙터 표면',
    source: '소스',
    tests: '테스트',
    states: '상태',
    tokens: '토큰 연결',
    manageNote: '현재 원본은 design-variables.js입니다. 다음 단계에서 local write API로 이 값을 수정하고 익스텐션 빌드에 반영합니다.',
  },
};

interface DesignSystemProps {
  language: Language;
}

function FoundationPreview({ type }: { type: string }) {
  return (
    <div className={`foundation-preview foundation-preview--${type}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

function ColorTokenGrid({ language }: DesignSystemProps) {
  return (
    <div className="color-token-grid">
      {extensionColorTokens.map((token) => (
        <article className="color-token" key={token.name}>
          <span className="color-token__swatch" style={{ background: token.value }} />
          <div>
            <strong>{token.name}</strong>
            <code>{token.cssVariable}</code>
            <span>{token.value}</span>
            <p>{language === 'ko' ? token.usageKo ?? token.usage : token.usage}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DesignFoundationSection({ language }: DesignSystemProps) {
  const copy = designCopy[language];

  return (
    <SectionBlock eyebrow={copy.foundationEyebrow} title={copy.foundationTitle}>
      <div className="card-grid">
        {foundationGroups.map((group) => (
          <DataCard key={group.label} title={language === 'ko' ? group.labelKo ?? group.label : group.label}>
            {group.preview === 'color' ? <ColorTokenGrid language={language} /> : <FoundationPreview type={group.preview} />}
            <p>{language === 'ko' ? group.descriptionKo ?? group.description : group.description}</p>
            {group.preview === 'color' ? <p className="manage-note">{copy.manageNote}</p> : null}
            <h4>{copy.tokens}</h4>
            <FileList files={group.tokens} />
            <h4>{copy.source}</h4>
            <FileList files={group.sourceFiles} />
          </DataCard>
        ))}
      </div>
    </SectionBlock>
  );
}

export function ComponentLibrarySection({ language }: DesignSystemProps) {
  const copy = designCopy[language];

  return (
    <SectionBlock eyebrow={copy.componentsEyebrow} title={copy.componentsTitle}>
      <div className="card-grid">
        {componentGroups.map((group) => (
          <DataCard key={group.label} title={language === 'ko' ? group.labelKo ?? group.label : group.label}>
            <p>{language === 'ko' ? group.roleKo ?? group.role : group.role}</p>
            <h4>{copy.states}</h4>
            <FileList files={language === 'ko' ? group.statesKo ?? group.states : group.states} />
            <h4>{copy.source}</h4>
            <FileList files={group.sourceFiles} />
            <h4>{copy.tests}</h4>
            <FileList files={group.testFiles} />
            <h4>{copy.tokens}</h4>
            <FileList files={language === 'ko' ? group.tokenHooksKo ?? group.tokenHooks : group.tokenHooks} />
          </DataCard>
        ))}
      </div>
    </SectionBlock>
  );
}
