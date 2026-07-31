# FDS Inspector Handoff: 2026-06-05 GSAP Motion Follow-up

## Current Goal

Comet/LUKE에서 FDS Inspector를 확장 프로그램 관리 페이지에서 reload한 뒤 브라우저 툴바로 다시 켰을 때, 상세 패널이 나타나지 않고 위반 outline만 남는 간헐적 상태를 복구했다. 이어서 툴바/상세 패널 메뉴 클릭 시 높이 변화가 끊겨 보이는 문제를 GSAP 기반 resize motion으로 다듬었다.

## Repo

- Path: `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`
- Working tree: dirty. 여러 tracked/untracked 변경이 섞여 있으므로 관련 없는 변경은 되돌리지 말 것.
- Previous handoff: `docs/2026-06-05-fds-inspector-toolbar-toggle-and-pin-handoff.md`
- This handoff: `docs/2026-06-05-fds-inspector-gsap-motion-followup-handoff.md`

## Completed in This Follow-up

### 1. Toolbar toggle stale UI recovery

Files:

- `content.js`
- `content-scan-runner.test.js`
- `background-logic.test.js`

Problem:

- Extension reload 후 기존 page content script/UI shell이 stale 상태가 되면, 브라우저 툴바 클릭 시 상세 패널/툴바가 복구되지 않고 페이지에 violation outline만 보이는 경우가 있었다.

Change:

- `PING` visible 판정을 단순 alive가 아니라 실제 inspector UI visibility 기준으로 보강했다.
- visible `TOGGLE` 경로에서 stale 또는 incomplete inspector shell을 `ensureVisibleInspectorUI()`로 복구한다.
- toolbar button까지 존재해야 visible로 인정하도록 회귀 테스트를 추가했다.

### 2. Violation pin scroll cleanup

Files:

- `content.js`
- `content-scan-runner.test.js`

Problem:

- LUKE처럼 nested scroll container가 있는 페이지에서 active violation pin이 오래된 좌표에 남거나 스크롤과 같이 움직여 보일 수 있었다.

Change:

- active/locked pin이 있을 때 document capture scroll과 resize에서 위치 재계산을 schedule한다.
- target element가 detached되었거나 viewport 밖으로 나가면 pin/card preview를 정리한다.
- nested app scroll 중 pin이 target을 따라가거나 stale target을 clear하는 source-level 회귀 테스트를 추가했다.

### 3. GSAP detail panel height smoothing

Files:

- `content.js`
- `content-motion.js`
- `content-motion.test.js`
- `content-scan-runner.test.js`

Problem:

- 툴바 상세 패널이 이미 열린 상태에서 메뉴/탭/카드를 클릭하면 높이 변화가 부드럽지 않았다.
- 근본 원인 중 하나는 `showSummaryPanel()`이 이미 visible인 panel에도 `animatePanelOpen()`을 다시 재생해, resize timeline과 entry animation이 같은 target에서 겹치는 것이었다.

Change:

- `showSummaryPanel()`에서 `wasPanelVisible = isSummaryPanelVisible()`를 먼저 기록하고, panel이 처음 열릴 때만 `animatePanelOpen(panel)`을 실행한다.
- tab/menu 전환은 `animateSummaryRefresh()`로 height resize를 처리하도록 유지했다.
- panel/list height animation을 `timeline.set(...) + timeline.to(...)` 분리 방식에서 explicit `timeline.fromTo(...)` 방식으로 바꿨다.
- `immediateRender: false`를 사용해 같은 target/property에 대한 timeline 충돌 가능성을 줄였다.
- fallback path는 GSAP이 없거나 motion이 비활성인 경우 최종 inline style을 정리하도록 유지했다.

Key locations:

- `content.js`: `showSummaryPanel()`
- `content.js`: `animateSummaryRefresh()` 호출부
- `content-motion.js`: `animateSummaryRefresh(panel, options)`

### 4. Official GreenSock GSAP skills installed

Installed from:

- `https://github.com/greensock/gsap-skills`

Installed skills:

- `/Users/im_018/.codex/skills/gsap-core`
- `/Users/im_018/.codex/skills/gsap-timeline`
- `/Users/im_018/.codex/skills/gsap-scrolltrigger`
- `/Users/im_018/.codex/skills/gsap-plugins`
- `/Users/im_018/.codex/skills/gsap-utils`
- `/Users/im_018/.codex/skills/gsap-react`
- `/Users/im_018/.codex/skills/gsap-performance`
- `/Users/im_018/.codex/skills/gsap-frameworks`

Notes:

- A temporary local `gsap` skill was created first, then moved out of the skills directory to avoid trigger/name confusion.
- Backup path: `/Users/im_018/.codex/gsap-local-skill-backup-20260605`
- Official validator could not run because local Python lacks `PyYAML`.
- The 8 installed GreenSock skill frontmatters were manually checked against the validator's core rules and passed.
- Restart Codex to reliably pick up the newly installed skills in future turns.

## Latest Verification

Passed after the GSAP motion fix:

```bash
node --check content.js
node --check content-motion.js
node --test content-scan-runner.test.js
node --test content-motion.test.js
npm test
```

Latest full-suite result:

- `npm test`: 147 tests passed, 0 failed.

Skill install verification:

```bash
find /Users/im_018/.codex/skills -maxdepth 2 -name SKILL.md | rg 'gsap-(core|timeline|scrolltrigger|plugins|utils|react|performance|frameworks)'
```

Manual frontmatter validation:

- 8 GreenSock GSAP skills passed.

## Live Browser Caveat

Comet/LUKE에 이미 주입된 content script는 extension reload만으로 항상 최신 코드가 되는 것이 아니다. 실제 확인 순서:

1. Comet 확장 프로그램 관리 페이지에서 unpacked FDS Inspector reload.
2. `luke.fasoo.com/main` 탭 새로고침.
3. 브라우저 툴바에서 FDS Inspector 실행.
4. Color/Spacing/Radius/Font 패널 전환.
5. 상세 패널이 다시 나타나는지, outline-only 상태가 복구되는지 확인.
6. 메뉴/탭/카드 전환 시 패널 높이 변화가 끊기지 않는지 확인.
7. nested scroll 중 violation pin이 오래된 좌표에 남지 않는지 확인.

## Current Risk / Watch Items

- Code-level and unit verification passed, but Comet/LUKE live visual QA는 이 handoff 작성 시점에 새로 수행하지 않았다.
- Worktree가 매우 dirty하므로 commit/stage 전에는 관련 변경만 선별해야 한다.
- If height motion still feels rough in live QA, inspect these next:
  - whether `updateSummaryUI()` causes multiple synchronous renders per click,
  - whether `activeSummaryTone = 'danger'` resets content unexpectedly on some open paths,
  - whether list ghost and next list overlap during very fast tab clicks,
  - whether `overwrite: 'auto'` or `killTweensOf()` should be applied to panel/list targets on every refresh.

## Startup References for Next Session

Read these first:

```text
docs/2026-06-05-fds-inspector-gsap-motion-followup-handoff.md
content.js
content-motion.js
content-motion.test.js
content-scan-runner.test.js
```

Optional prior context:

```text
docs/2026-06-05-fds-inspector-toolbar-toggle-and-pin-handoff.md
docs/2026-06-04-fds-inspector-detail-panel-followup-handoff.md
```

## Continuation Prompt

Continue in `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector`. The latest follow-up fixed stale toolbar-visible recovery, nested-scroll violation pin cleanup, and GSAP-based detail panel height smoothing. `npm test` passed with 147 tests. Start by reading `docs/2026-06-05-fds-inspector-gsap-motion-followup-handoff.md`, then verify live in Comet/LUKE after extension reload and page refresh. Do not revert unrelated dirty worktree changes. If the panel height still feels rough, inspect `showSummaryPanel()`, `updateSummaryUI()`, and `content-motion.js` `animateSummaryRefresh()` for overlapping tweens or duplicate renders, using the installed GreenSock skills after restarting Codex.
