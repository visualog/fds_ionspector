## Drift Log 002 - Toolbar Width And Harness Tightening

Date: 2026-04-14
Area: toolbar width fidelity and harness reliability
Status: fixed

### Summary

이번 라운드에서는 toolbar의 desktop width 정책과 harness drift를 같이 줄였다.
핵심은 두 가지였다.

1. desktop toolbar width가 viewport clamp에 항상 걸려 있어서, 피그마 variant 폭보다 구현 폭 정책이 더 우선하던 문제
2. collapsed 상태와 snapshot 파일명이 추론/문서 불일치에 기대고 있던 문제

### D-004 Desktop Width Clamp Drift

Expected:
- desktop에서는 `pattern/toolbar` variant 폭을 그대로 사용해야 한다.
- `384 / 401 / 310 / 96 / 48`은 viewport clamp가 아니라 variant width가 기준이어야 한다.

Observed:
- toolbar root가 항상 `min(var(--fds-toolbar-width), calc(100vw - 24px))`를 사용했다.
- 작은 viewport 대응 로직이 desktop 기본 정책까지 덮고 있었다.

Fix:
- desktop 기본 width를 `var(--fds-toolbar-width)`로 변경
- viewport clamp는 mobile media query 안에서만 유지

### D-005 Collapsed State Heuristic Drift

Expected:
- collapsed 여부는 렌더 state가 직접 알려줘야 한다.

Observed:
- computed-style check가 `button count <= 1` 또는 `width <= 60` 같은 간접 추론으로 collapsed를 판단했다.

Fix:
- `#fds-root[data-toolbar-collapsed]`
- `#fds-toolbar[data-collapsed]`
를 sync 단계에서 직접 설정
- computed-style check는 이 상태값을 우선 사용

### D-006 Snapshot Naming Drift

Expected:
- snapshot README와 실제 생성 파일명이 같아야 한다.

Observed:
- README는 `.snapshot.json` 네이밍을 설명했지만 실제 파일은 `.json`으로 운영되고 있었다.

Fix:
- README를 실제 운영 파일명 기준으로 정리
- `pattern/check_info_pannel`은 피그마 원문 이름으로 설명하되, 저장 파일명은 `pattern-check-info-panel.component-set.json`으로 명시

### Harness Notes

- 이번 수정은 하네스가 실제로 도움이 된 사례다.
- bridge snapshot과 `TOOLBAR_SPEC` 덕분에 width 정책을 다시 피그마 기준으로 되돌릴 수 있었다.
- computed-style check도 추론형에서 상태 기반으로 조금 더 신뢰 가능한 방향으로 옮겨졌다.

