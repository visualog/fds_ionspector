## Drift Log 003 - Bridge Runtime And Toolbar Verification Tightening

Date: 2026-04-14
Area: bridge runtime stability and toolbar verification loop
Status: fixed

### Summary

이번 라운드에서는 툴바 geometry 자체보다, 그 geometry를 계속 믿고 작업할 수 있는 검증 루프를 더 단단하게 만들었다.
특히 실제 운영 중 아래 두 가지가 다시 확인됐다.

1. bridge `health`는 살아 있지만 detail read는 간헐적으로 바로 실패할 수 있다.
2. snapshot capture는 detail read 실패 때문에 target 전체가 무너지지 않게 만들어야 한다.

### D-007 Bridge Detail Read Runtime Drift

Expected:
- bridge `health`가 살아 있고 active plugin이 있으면 snapshot capture가 가능한 한 계속 진행돼야 한다.

Observed:
- 실제 운영에서 `health`는 성공했지만 follow-up detail read는 다시 transport 레벨에서 실패했다.
- 이때 기존 capture 흐름은 target 전체를 실패로 올릴 여지가 있었다.

Fix:
- `capture-bridge-snapshots.mjs`에서 `nodeDetails` 이후의 `instanceDetails / variantDetails` 실패를 soft-fail로 전환
- degraded snapshot을 계속 생성하고, 실패 사유는 `notes.warnings`에 기록

### D-008 Snapshot Capture Environment Drift

Expected:
- bridge snapshot capture 검증은 bridge 상태만 보면 된다.

Observed:
- 같은 로컬 환경에서도
  - `curl`은 localhost bridge에 접근 가능
  - sandbox 안 Node `fetch`는 `EPERM`으로 실패
했다.

Impact:
- 스크립트 실패가 bridge 문제인지 sandbox 문제인지 혼동될 수 있었다.

Fix:
- 실운영 검증은 sandbox 밖에서 한 번 확인
- harness 보고서에 이 환경 차이를 명시

### D-009 Verification Coverage Drift

Expected:
- toolbar verification은 padding/gap뿐 아니라 내부 slot/badge/dot도 체크해야 한다.

Observed:
- 초기 computed-style check는 root geometry 위주라, icon slot과 badge/dot drift를 충분히 못 잡았다.

Fix:
- `toolbar-computed-style-check.js`에
  - icon slot `24x24`
  - badge `24x20`
  - dot `8x8`
검증 항목 추가
- visual checklist에도 computed-style 실행 단계를 명시

### Harness Notes

- 이번 수정은 하네스가 실제로 “작업 중단을 줄이는 방향”으로 개선된 사례다.
- bridge가 흔들려도 snapshot, `TOOLBAR_SPEC`, computed-style check로 작업을 계속 이어갈 수 있게 됐다.
- 아직 request stability 자체는 남아 있지만, 실패했을 때 덜 무너지게 만드는 장치는 더 강해졌다.

