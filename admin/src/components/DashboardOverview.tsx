import {
  ClipboardCheck,
  Component,
  FileText,
  Layers3,
  PackageCheck,
  Radar,
  SwatchBook,
} from 'lucide-react';
import { buildMetadata } from '../data/build';
import { componentGroups, foundationGroups } from '../data/designSystem';
import { docGroups } from '../data/docs';
import { moduleGroups } from '../data/modules';
import { ruleGroups } from '../data/rules';
import { tokenFiles } from '../data/tokens';
import { navLabels } from '../data/copy';
import type { Language, NavId } from '../types/admin';
import { SectionBlock } from './SectionBlock';

interface DashboardOverviewProps {
  language: Language;
  onSelectSection: (section: NavId) => void;
}

const dashboardCopy = {
  en: {
    eyebrow: 'Overview',
    title: 'Operational summary',
    intro: 'Use this view to spot the current surface area quickly. Open a section when you need file-level detail.',
    open: 'Open',
    tokens: 'Snapshot token files',
    foundation: 'Design variables grouped by color, type, spacing, radius, and motion',
    components: 'Reusable inspector surfaces and their states',
    rules: 'Violation categories with runtime and test ownership',
    build: 'Manual extension build target',
    docs: 'Verification, plans, reports, and handoff references',
    modules: 'Runtime ownership groups from the distribution summary',
  },
  ko: {
    eyebrow: 'Overview',
    title: '운영 요약',
    intro: '이 화면에서는 현재 관리 범위만 빠르게 확인합니다. 파일 단위 상세가 필요할 때 각 섹션으로 들어가세요.',
    open: '열기',
    tokens: '스냅샷 토큰 파일',
    foundation: 'color, type, spacing, radius, motion으로 묶은 디자인 변수',
    components: '재사용되는 인스펙터 표면과 상태',
    rules: '런타임과 테스트 소유권이 연결된 위반 유형',
    build: '수동 익스텐션 빌드 대상',
    docs: '검증, 계획, 리포트, 핸드오프 참조',
    modules: '배포 요약 기준 런타임 소유권 그룹',
  },
};

export function DashboardOverview({ language, onSelectSection }: DashboardOverviewProps) {
  const copy = dashboardCopy[language];
  const entries: Array<{
    id: NavId;
    icon: typeof Layers3;
    summary: string;
    metric: string;
  }> = [
    { id: 'tokens', icon: Layers3, summary: copy.tokens, metric: `${tokenFiles.length}` },
    { id: 'foundation', icon: SwatchBook, summary: copy.foundation, metric: `${foundationGroups.length}` },
    { id: 'components', icon: Component, summary: copy.components, metric: `${componentGroups.length}` },
    { id: 'rules', icon: Radar, summary: copy.rules, metric: `${ruleGroups.length}` },
    { id: 'build', icon: PackageCheck, summary: `${copy.build}: ${buildMetadata.outputZip}`, metric: `${buildMetadata.runtimeFileCount}` },
    { id: 'docs', icon: FileText, summary: copy.docs, metric: `${docGroups.length}` },
    { id: 'modules', icon: ClipboardCheck, summary: copy.modules, metric: `${moduleGroups.length}` },
  ];

  return (
    <SectionBlock eyebrow={copy.eyebrow} title={copy.title}>
      <div className="dashboard-overview">
        <p>{copy.intro}</p>
        <div className="overview-list">
          {entries.map(({ id, icon: Icon, summary, metric }) => (
            <button
              aria-label={`${navLabels[language][id]} ${copy.open}`}
              className="overview-row"
              key={id}
              type="button"
              onClick={() => onSelectSection(id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{navLabels[language][id]}</strong>
                <small>{summary}</small>
              </span>
              <em>{metric}</em>
              <b>{copy.open}</b>
            </button>
          ))}
        </div>
      </div>
    </SectionBlock>
  );
}
