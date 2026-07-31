import type { DocGroup } from '../types/admin';

export const docGroups: DocGroup[] = [
  {
    label: 'Build handoff',
    paths: [
      'docs/2026-06-11-dist-js-file-summary.md',
      'docs/2026-06-11-fds-inspector-deployment-build-handoff.md',
    ],
  },
  {
    label: 'Verification',
    paths: [
      'docs/verification/fds-accuracy-inspection-verification.md',
      'docs/verification/fds-2week-performance-and-real-use-verification.md',
      'docs/verification/large-dom-scan-check.md',
      'docs/verification/visual-checklist.md',
    ],
  },
  {
    label: 'Plans',
    paths: [
      'docs/plans/2026-06-11-extension-design-admin-design.md',
      'docs/plans/2026-06-11-extension-design-admin-implementation-plan.md',
      'docs/plans/2026-06-05-content-js-sequential-refactor-plan.md',
    ],
  },
  {
    label: 'Refactor reports',
    paths: [
      'docs/refactor-reports/2026-06-05-task-3-token-suggestions.md',
      'docs/refactor-reports/2026-06-05-task-4-bridge-specs-completion.md',
      'docs/refactor-reports/2026-06-08-task-5-toolbar-extraction-complete.md',
    ],
  },
];
