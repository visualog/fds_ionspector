import type { ModuleGroup } from '../types/admin';

export const moduleGroups: ModuleGroup[] = [
  {
    label: 'Background service worker',
    labelKo: '백그라운드 서비스 워커',
    description: 'Controls tab injection, extension toggles, bridge health, and token payload delivery.',
    descriptionKo: '탭 주입, 익스텐션 토글, 브리지 health, 토큰 payload 전달을 제어합니다.',
    files: ['background.js', 'background-logic.js'],
  },
  {
    label: 'Token sources',
    labelKo: '토큰 소스',
    description: 'Normalizes live bridge payloads and bundled snapshot JSON into inspector-ready specs.',
    descriptionKo: 'live bridge payload와 번들 snapshot JSON을 인스펙터용 spec으로 정규화합니다.',
    files: ['bridge-token-source.js', 'snapshot-token-source.js', 'token-source.js', 'design-variables.js'],
  },
  {
    label: 'Content scan pipeline',
    labelKo: '콘텐츠 스캔 파이프라인',
    description: 'Runs DOM inspection, scan batching, issue signatures, and visible result modeling.',
    descriptionKo: 'DOM 검사, 배치 스캔, 이슈 signature, 표시 결과 모델링을 실행합니다.',
    files: ['content-inspection.js', 'content-scan-runner.js', 'content-scan-utils.js', 'content-summary-model.js'],
  },
  {
    label: 'Overlay and interaction',
    labelKo: '오버레이와 상호작용',
    description: 'Renders the toolbar, summary panel, floating issue card, drag behavior, and motion layer.',
    descriptionKo: '툴바, 요약 패널, 플로팅 이슈 카드, 드래그 동작, 모션 레이어를 렌더링합니다.',
    files: ['content-render.js', 'content-toolbar-ui.js', 'content-summary-panel.js', 'content-floating-inspector.js', 'content-motion.js'],
  },
  {
    label: 'Content orchestrator',
    labelKo: '콘텐츠 오케스트레이터',
    description: 'Assembles helper APIs, page state, runtime messages, scan refreshes, and overlay lifecycle.',
    descriptionKo: 'helper API, 페이지 상태, runtime message, 스캔 갱신, 오버레이 lifecycle을 조립합니다.',
    files: ['content.js'],
  },
  {
    label: 'Popup',
    labelKo: '팝업',
    description: 'Provides extension popup controls for status checks, rescans, and token source updates.',
    descriptionKo: '상태 확인, 재스캔, 토큰 소스 업데이트를 위한 익스텐션 팝업 컨트롤을 제공합니다.',
    files: ['popup/popup.js'],
  },
];
