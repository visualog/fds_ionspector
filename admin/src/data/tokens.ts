import type { TokenFile } from '../types/admin';

export const tokenFiles: TokenFile[] = [
  {
    path: 'tokens/0.1.primitives.json',
    label: 'Primitives',
    labelKo: '프리미티브',
    purpose: 'Base color, spacing, radius, and primitive token values.',
    purposeKo: '기본 color, spacing, radius와 원시 토큰 값입니다.',
    groupCount: 'foundation collection',
    groupCountKo: '파운데이션 컬렉션',
    status: 'managed',
  },
  {
    path: 'tokens/0.2.theme.json',
    label: 'Theme',
    labelKo: '테마',
    purpose: 'Theme-level token mappings built from primitive tokens.',
    purposeKo: '프리미티브 토큰을 기반으로 한 테마 레벨 매핑입니다.',
    groupCount: 'theme collection',
    groupCountKo: '테마 컬렉션',
    status: 'managed',
  },
  {
    path: 'tokens/1.0.semantic.json',
    label: 'Semantic',
    labelKo: '시맨틱',
    purpose: 'Product-facing semantic design token definitions.',
    purposeKo: '제품 화면에서 사용하는 시맨틱 디자인 토큰 정의입니다.',
    groupCount: 'semantic collection',
    groupCountKo: '시맨틱 컬렉션',
    status: 'managed',
  },
];
