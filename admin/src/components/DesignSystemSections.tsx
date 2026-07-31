import { componentGroups, extensionColorTokens, foundationGroups } from '../data/designSystem';
import type { Language } from '../types/admin';
import { FileList, TokenList } from './FileList';
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
  if (type === 'type') {
    return (
      <div className="foundation-preview foundation-preview--type" aria-hidden="true">
        <strong>Aa</strong>
        <span>Inspector title</span>
        <small>10-14px compact label</small>
      </div>
    );
  }

  if (type === 'spacing') {
    return (
      <div className="foundation-preview foundation-preview--spacing" aria-hidden="true">
        <span style={{ width: 8 }} />
        <span style={{ width: 16 }} />
        <span style={{ width: 32 }} />
        <span style={{ width: 56 }} />
      </div>
    );
  }

  if (type === 'radius') {
    return (
      <div className="foundation-preview foundation-preview--radius" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (type === 'motion') {
    return (
      <div className="foundation-preview foundation-preview--motion" aria-hidden="true">
        <span />
        <span />
        <span />
        <i />
      </div>
    );
  }

  return null;
}

function ColorStory({ language }: DesignSystemProps) {
  const featured = extensionColorTokens.filter((token) =>
    ['toolbarBg', 'brand', 'warning', 'success', 'error'].includes(token.name),
  );

  return (
    <div className="color-story">
      <div className="color-story__preview" aria-hidden="true">
        {featured.map((token) => (
          <span key={token.name} style={{ background: token.value }} />
        ))}
      </div>
      <div className="color-story__legend">
        {featured.map((token) => (
          <div key={token.name}>
            <span style={{ background: token.value }} />
            <strong>{token.name}</strong>
            <small>{language === 'ko' ? token.usageKo ?? token.usage : token.usage}</small>
          </div>
        ))}
      </div>
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
            <code
              aria-label={`Token: ${token.cssVariable}`}
              className="token-code"
              title={`Token: ${token.cssVariable}`}
            >
              {token.cssVariable}
            </code>
            <span className="value-code">{token.value}</span>
            <p>{language === 'ko' ? token.usageKo ?? token.usage : token.usage}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DesignFoundationSection({ language }: DesignSystemProps) {
  const copy = designCopy[language];
  const colorGroup = foundationGroups.find((group) => group.preview === 'color');
  const compactGroups = foundationGroups.filter((group) => group.preview !== 'color');

  return (
    <SectionBlock eyebrow={copy.foundationEyebrow} title={copy.foundationTitle}>
      {colorGroup ? (
        <section className="reference-section">
          <div className="reference-section__heading">
            <h3>{language === 'ko' ? colorGroup.labelKo ?? colorGroup.label : colorGroup.label}</h3>
            <p>{language === 'ko' ? colorGroup.descriptionKo ?? colorGroup.description : colorGroup.description}</p>
          </div>
          <ColorStory language={language} />
          <ColorTokenGrid language={language} />
          <p className="manage-note">{copy.manageNote}</p>
          <h4>{copy.tokens}</h4>
          <TokenList tokens={colorGroup.tokens} />
          <h4>{copy.source}</h4>
          <FileList files={colorGroup.sourceFiles} />
        </section>
      ) : null}

      <div className="record-list foundation-records">
        {compactGroups.map((group) => (
          <article className="record-row foundation-record" key={group.label}>
            <div>
              <FoundationPreview type={group.preview} />
              <h3>{language === 'ko' ? group.labelKo ?? group.label : group.label}</h3>
            </div>
            <div>
              <p>{language === 'ko' ? group.descriptionKo ?? group.description : group.description}</p>
              <div className="record-detail-grid">
                <div>
                  <h4>{copy.tokens}</h4>
                  <TokenList tokens={group.tokens} />
                </div>
                <div>
                  <h4>{copy.source}</h4>
                  <FileList files={group.sourceFiles} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionBlock>
  );
}

export function ComponentLibrarySection({ language }: DesignSystemProps) {
  const copy = designCopy[language];

  return (
    <SectionBlock eyebrow={copy.componentsEyebrow} title={copy.componentsTitle}>
      <div className="record-list component-records">
        {componentGroups.map((group) => (
          <article className="linear-record component-record" key={group.label}>
            <div>
              <h3>{language === 'ko' ? group.labelKo ?? group.label : group.label}</h3>
              <p>{language === 'ko' ? group.roleKo ?? group.role : group.role}</p>
            </div>
            <div className="linear-detail-list">
              <div>
                <h4>{copy.states}</h4>
                <FileList files={language === 'ko' ? group.statesKo ?? group.states : group.states} />
              </div>
              <div>
                <h4>{copy.source}</h4>
                <FileList files={group.sourceFiles} />
              </div>
              <div>
                <h4>{copy.tests}</h4>
                <FileList files={group.testFiles} />
              </div>
              <div>
                <h4>{copy.tokens}</h4>
                <TokenList tokens={language === 'ko' ? group.tokenHooksKo ?? group.tokenHooks : group.tokenHooks} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionBlock>
  );
}
