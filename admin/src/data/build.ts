import type { RuntimeGroup } from '../types/admin';

export const buildMetadata = {
  command: 'npm run build:extension',
  outputDirectory: 'dist/fds-inspector',
  outputZip: 'dist/fds-inspector.zip',
  runtimeFileCount: 40,
};

export const runtimeGroups: RuntimeGroup[] = [
  {
    label: 'Background',
    labelKo: '백그라운드',
    note: 'MV3 service worker and bridge/token orchestration helpers.',
    noteKo: 'MV3 서비스 워커와 브리지/토큰 오케스트레이션 helper입니다.',
    files: ['background.js', 'background-logic.js', 'bridge-token-source.js', 'snapshot-token-source.js'],
  },
  {
    label: 'Content injection',
    labelKo: '콘텐츠 주입',
    note: 'Ordered helpers injected before the content orchestrator.',
    noteKo: 'content orchestrator 전에 순서대로 주입되는 helper입니다.',
    files: ['vendor/gsap.min.js', 'toolbar-state.js', 'content-render.js', 'content-motion.js', 'content.js'],
  },
  {
    label: 'Popup',
    labelKo: '팝업',
    note: 'Extension popup controls for connection status, rescans, and token source changes.',
    noteKo: '연결 상태, 재스캔, 토큰 소스 변경을 다루는 익스텐션 팝업 컨트롤입니다.',
    files: ['popup/popup.html', 'popup/popup.js'],
  },
  {
    label: 'Assets and tokens',
    labelKo: '에셋과 토큰',
    note: 'Toolbar icons, overlay styles, and snapshot token JSON bundled with the extension.',
    noteKo: '익스텐션에 함께 포함되는 툴바 아이콘, 오버레이 스타일, 스냅샷 토큰 JSON입니다.',
    files: ['overlay.css', 'assets/*.svg', 'tokens/*.json'],
  },
];
