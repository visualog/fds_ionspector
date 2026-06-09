# 2026-06-09 FDS Inspector Token Snapshot Handoff

## Current Task

FDS Inspector의 bundled token snapshot을 Figma 원본 variable collection 구조에 맞춰 재생성했다.

기존 extension snapshot은 `mode/Fasoo/Light/Dark` 4개 파일로 분리되어 있었지만, 현재 Figma/Xbridge 원본 구조는 아래 3개 컬렉션이다.

- `0.1. primitives` / mode: `mode`
- `0.2.theme*` / mode: `Fasoo`, `Wrapsody`
- `1.0.semantic` / mode: `Light`, `Dark`

## Completed

- 기존 bundled snapshot 파일 제거
  - `tokens/mode.json`
  - `tokens/Fasoo.json`
  - `tokens/Light.json`
  - `tokens/Dark.json`
- Xbridge complete artifact에서 원본 컬렉션별 JSON을 가져와 `tokens/`에 배치
  - `tokens/0.1.primitives.json`: `0.1. primitives`, 222 variables
  - `tokens/0.2.theme.json`: `0.2.theme*`, 114 variables
  - `tokens/1.0.semantic.json`: `1.0.semantic`, 200 variables
- `background.js`의 `SNAPSHOT_TOKEN_FILES`를 새 3파일 구조로 변경
- `snapshot-token-source.js`가 collection export payload를 직접 읽도록 확장
  - `variables`
  - `collection`
  - `modeNames`
  - `resolvedValuesByMode`
  - `valuesByMode`
- 기존 legacy tree payload도 테스트 fixture 기준으로 계속 지원
- `scripts/run-uiux-fixture-qa.mjs`의 하드코딩된 예전 token file fetch 경로 갱신
- `docs/2026-05-27-fds-inspector-work-summary.md`의 오래된 token 파일 목록 갱신
- 숫자 `0`이 `dimensionToPx()`에서 누락되던 문제 수정
  - 이제 `spacing/0`, `radius/0`도 snapshot spec에 포함된다.

## Verified Facts

- Xbridge 연결 파일: `FDS v2.0 -테스트용`
- 확인된 complete artifact:
  - `/private/tmp/xbridge-token-exports/FDS-v2.0-2026-06-09T01-02-58-019Z.json`
- 원본 컬렉션별 export source:
  - `/Users/im_018/Documents/GitHub/Project/figma_skills/xbridge/docs/exports/FDS-v2.0-variables-by-collection-2026-06-09T01-02-58-019Z/`
- 새 snapshot에서 생성되는 inspector spec summary:
  - `collectionCount`: 3
  - `colorTokenCount`: 683
  - `spacingTokenCount`: 18
  - `radiusTokenCount`: 10
  - `unresolvedReferenceCount`: 0
- 현재 spacing scale:
  - `0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 64, 80, 144`
- `29px`는 spacing token에 없다.
  - LUKE 화면에서 `왼쪽 마진 29px`이 `비규격`으로 표시되는 것은 정상이다.

## Verification

```bash
npm run check:all
```

Result:

- 212 tests passed
- 0 failed

Additional checks run:

```bash
rg -n "tokens/(mode|Fasoo|Light|Dark)\\.json|readTokenFile\\('(mode|Fasoo|Light|Dark)\\.json'" .
```

Result:

- No remaining old runtime/script references.

## Files Changed

- `background.js`
- `snapshot-token-source.js`
- `snapshot-token-source.test.js`
- `scripts/run-uiux-fixture-qa.mjs`
- `docs/2026-05-27-fds-inspector-work-summary.md`
- `tokens/0.1.primitives.json`
- `tokens/0.2.theme.json`
- `tokens/1.0.semantic.json`
- Removed old token files:
  - `tokens/mode.json`
  - `tokens/Fasoo.json`
  - `tokens/Light.json`
  - `tokens/Dark.json`

## Remaining Work

- Reload the unpacked extension in Comet/Chrome before relying on the new bundled token files in the live browser.
- Re-run a live LUKE scan after reload and confirm the panel token context reflects the new snapshot counts.
- Consider adding visible token-source metadata to the summary panel:
  - source file set: `0.1.primitives / 0.2.theme / 1.0.semantic`
  - modes included: `mode`, `Fasoo`, `Wrapsody`, `Light`, `Dark`
- If product logic needs brand/theme selection, decide whether `Fasoo` and `Wrapsody` should both be active in one registry or selectable by mode.

## Resume Prompt

Continue in `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`.

Read this handoff first:

```text
docs/2026-06-09-fds-inspector-token-snapshot-handoff.md
```

Then check:

```bash
git status --short
npm run check:all
```

Focus next on live extension reload and browser verification against LUKE. The code-side token snapshot conversion is already implemented and test-verified.
