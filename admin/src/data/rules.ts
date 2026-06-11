import type { RuleGroup } from '../types/admin';

export const ruleGroups: RuleGroup[] = [
  {
    category: 'Color',
    categoryKo: '컬러',
    check: 'Detects raw color usage, missing color tokens, and token-backed author styles.',
    checkKo: 'raw color 사용, 누락된 컬러 토큰, 토큰 기반 작성자 스타일을 감지합니다.',
    runtimeFiles: ['style-token-detection.js', 'token-source.js', 'content-inspection.js'],
    testFiles: ['style-token-detection.test.js', 'token-source.test.js', 'content-inspection.test.js'],
  },
  {
    category: 'Text',
    categoryKo: '텍스트',
    check: 'Checks text-related DOM metadata and feeds visible text issues into the scan model.',
    checkKo: '텍스트 관련 DOM 메타데이터를 확인하고 보이는 텍스트 이슈를 스캔 모델에 전달합니다.',
    runtimeFiles: ['content-inspection.js', 'content-scan-utils.js'],
    testFiles: ['content-inspection.test.js', 'content-scan-utils.test.js'],
  },
  {
    category: 'Spacing',
    categoryKo: '스페이싱',
    check: 'Reviews padding, margin, and gap values against allowed spacing specs.',
    checkKo: 'padding, margin, gap 값을 허용된 spacing 기준과 비교합니다.',
    runtimeFiles: ['content-inspection.js', 'content.js', 'overlay.css'],
    testFiles: ['content-inspection.test.js', 'content-scan-runner.test.js'],
  },
  {
    category: 'Radius',
    categoryKo: '라운드',
    check: 'Flags raw radius values and links them to ranked replacement token suggestions.',
    checkKo: 'raw radius 값을 표시하고 우선순위가 매겨진 대체 토큰 추천과 연결합니다.',
    runtimeFiles: ['content-inspection.js', 'content-token-suggestions.js'],
    testFiles: ['content-inspection.test.js', 'content-token-suggestions.test.js'],
  },
];
