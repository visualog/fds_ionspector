# Violation Personal Notes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local personal notes to FDS Inspector violation elements so a reviewer can leave, edit, delete, and revisit notes on the same page.

**Architecture:** Store notes in `chrome.storage.local` keyed by normalized page URL and a stable issue fingerprint. Keep the first implementation inside the existing `content.js` orchestration because that file owns issue entries, pins, summary list binding, and inspector card rendering. Extend `content-render.js` only enough to mark summary rows with note state.

**Tech Stack:** Chrome extension content script, `chrome.storage.local`, vanilla DOM events, existing Node `node --test` suite.

---

### Task 1: Add Note Storage Helpers

**Files:**
- Modify: `content.js`
- Test: `content-scan-runner.test.js`

**Step 1: Write the failing test**

Add source-level assertions near the storage-related tests in `content-scan-runner.test.js`:

```js
test('content stores personal violation notes in chrome storage by page and issue key', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /const VIOLATION_NOTES_STORAGE_KEY = 'fdsViolationNotes'/);
  assert.match(contentSource, /function\s+getViolationNotesPageKey\(\)/);
  assert.match(contentSource, /function\s+getViolationNoteKey\(entry\)/);
  assert.match(contentSource, /async function\s+loadViolationNotesForPage\(\)/);
  assert.match(contentSource, /async function\s+saveViolationNote\(entry,\s*text\)/);
  assert.match(contentSource, /async function\s+deleteViolationNote\(entry\)/);
  assert.match(contentSource, /chrome\.storage\?\.local\.get\(VIOLATION_NOTES_STORAGE_KEY\)/);
  assert.match(contentSource, /chrome\.storage\?\.local\.set\(\{ \[VIOLATION_NOTES_STORAGE_KEY\]:/);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: FAIL because the note storage helpers do not exist.

**Step 3: Write minimal implementation**

In `content.js`, add constants and state near the token source storage state:

```js
const VIOLATION_NOTES_STORAGE_KEY = 'fdsViolationNotes';
let violationNotesByKey = new Map();
let hasLoadedViolationNotes = false;
```

Add helpers:

```js
function getViolationNotesPageKey() {
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

function getViolationNoteKey(entry) {
  if (!entry) return '';
  return [
    getViolationNotesPageKey(),
    entry.category || '',
    entry.colorPart || '',
    entry.message || '',
    getIssueElementLabel(entry),
    entry.key || '',
  ].join('::');
}

async function loadViolationNotesForPage() {
  if (!chrome.storage?.local || hasLoadedViolationNotes) return violationNotesByKey;
  try {
    const result = await chrome.storage.local.get(VIOLATION_NOTES_STORAGE_KEY);
    const allNotes = result?.[VIOLATION_NOTES_STORAGE_KEY] && typeof result[VIOLATION_NOTES_STORAGE_KEY] === 'object'
      ? result[VIOLATION_NOTES_STORAGE_KEY]
      : {};
    const pageKey = getViolationNotesPageKey();
    violationNotesByKey = new Map(Object.entries(allNotes[pageKey] || {}));
    hasLoadedViolationNotes = true;
  } catch (error) {
    console.warn('[FDS Inspector] Failed to load violation notes', error);
    violationNotesByKey = new Map();
  }
  return violationNotesByKey;
}

async function writeViolationNotesForPage(nextNotesByKey) {
  if (!chrome.storage?.local) return false;
  const result = await chrome.storage.local.get(VIOLATION_NOTES_STORAGE_KEY);
  const allNotes = result?.[VIOLATION_NOTES_STORAGE_KEY] && typeof result[VIOLATION_NOTES_STORAGE_KEY] === 'object'
    ? result[VIOLATION_NOTES_STORAGE_KEY]
    : {};
  allNotes[getViolationNotesPageKey()] = Object.fromEntries(nextNotesByKey.entries());
  await chrome.storage.local.set({ [VIOLATION_NOTES_STORAGE_KEY]: allNotes });
  return true;
}

async function saveViolationNote(entry, text) {
  const noteKey = getViolationNoteKey(entry);
  const trimmedText = String(text || '').trim();
  if (!noteKey || !trimmedText) return false;
  await loadViolationNotesForPage();
  const existing = violationNotesByKey.get(noteKey);
  const now = new Date().toISOString();
  violationNotesByKey.set(noteKey, {
    category: entry.category || '',
    message: entry.message || '',
    elementLabel: getIssueElementLabel(entry),
    text: trimmedText,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
  return writeViolationNotesForPage(violationNotesByKey);
}

async function deleteViolationNote(entry) {
  const noteKey = getViolationNoteKey(entry);
  if (!noteKey) return false;
  await loadViolationNotesForPage();
  violationNotesByKey.delete(noteKey);
  return writeViolationNotesForPage(violationNotesByKey);
}
```

Use the existing `getIssueElementLabel` renderer helper from `content-render.js`; it is already imported in `content.js` if needed, or add it to the destructuring.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: PASS for the new storage assertions.

**Step 5: Commit**

```bash
git add content.js content-scan-runner.test.js
git commit -m "feat: add violation note storage helpers"
```

---

### Task 2: Render Note Controls In The Inspector Card

**Files:**
- Modify: `content.js`
- Test: `content-scan-runner.test.js`

**Step 1: Write the failing test**

Add:

```js
test('inspector card renders personal note controls for selected violations', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /function\s+renderViolationNoteControls\(entry\)/);
  assert.match(contentSource, /class="fds-card-note"/);
  assert.match(contentSource, /data-note-action="edit"/);
  assert.match(contentSource, /data-note-action="save"/);
  assert.match(contentSource, /data-note-action="delete"/);
  assert.match(contentSource, /bindViolationNoteControls\(card,\s*displayEntries\[0\]\)/);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: FAIL because note controls do not exist.

**Step 3: Write minimal implementation**

Add helpers in `content.js` near the inspector card rendering functions:

```js
function getViolationNoteForEntry(entry) {
  return violationNotesByKey.get(getViolationNoteKey(entry)) || null;
}

function renderViolationNoteControls(entry) {
  const note = getViolationNoteForEntry(entry);
  if (!note) {
    return `
      <div class="fds-card-note" data-note-mode="empty">
        <button class="fds-card-note-action" type="button" data-note-action="edit">메모 추가</button>
      </div>
    `;
  }

  return `
    <div class="fds-card-note" data-note-mode="saved">
      <div class="fds-card-note-text">${escapeHtml(note.text)}</div>
      <div class="fds-card-note-actions">
        <button class="fds-card-note-action" type="button" data-note-action="edit">수정</button>
        <button class="fds-card-note-action danger" type="button" data-note-action="delete">삭제</button>
      </div>
    </div>
  `;
}
```

Append `${renderViolationNoteControls(displayEntries[0])}` inside `showInspectorCardForEntries()` after the issue list.

Add `bindViolationNoteControls(card, displayEntries[0]);` after the card HTML is assigned.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add content.js content-scan-runner.test.js
git commit -m "feat: render violation note controls"
```

---

### Task 3: Wire Add, Save, Edit, And Delete Actions

**Files:**
- Modify: `content.js`
- Modify: `overlay.css`
- Test: `content-scan-runner.test.js`

**Step 1: Write the failing test**

Add:

```js
test('inspector card binds personal note edit save and delete actions', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /function\s+bindViolationNoteControls\(card,\s*entry\)/);
  assert.match(contentSource, /card\.querySelector\('\[data-note-action="edit"\]'\)/);
  assert.match(contentSource, /saveViolationNote\(entry,\s*textarea\.value\)/);
  assert.match(contentSource, /deleteViolationNote\(entry\)/);
  assert.match(contentSource, /showInspectorCardForEntries\(entry\.element,\s*getVisibleIssueEntriesForElement\(entry\.element\)/);
  assert.match(styleSource, /\.fds-card-note\s*\{/);
  assert.match(styleSource, /\.fds-card-note-text\s*\{/);
  assert.match(styleSource, /\.fds-card-note-action\s*\{/);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: FAIL.

**Step 3: Write minimal implementation**

Add `bindViolationNoteControls(card, entry)`:

```js
function renderViolationNoteEditor(card, entry) {
  const note = getViolationNoteForEntry(entry);
  const noteRoot = card.querySelector('.fds-card-note');
  if (!noteRoot) return;
  noteRoot.innerHTML = `
    <textarea class="fds-card-note-input" rows="3" maxlength="300" placeholder="이 위반 요소에 남길 메모">${escapeHtml(note?.text || '')}</textarea>
    <div class="fds-card-note-actions">
      <button class="fds-card-note-action primary" type="button" data-note-action="save">저장</button>
      <button class="fds-card-note-action" type="button" data-note-action="cancel">취소</button>
    </div>
  `;
  bindViolationNoteControls(card, entry);
}

function refreshInspectorCardForEntry(entry) {
  if (!entry?.element?.isConnected) return;
  showInspectorCardForEntries(entry.element, getVisibleIssueEntriesForElement(entry.element), entry.element, { ignoreCustomPosition: true });
}

function bindViolationNoteControls(card, entry) {
  if (!card || !entry) return;
  card.querySelector('[data-note-action="edit"]')?.addEventListener('click', () => {
    renderViolationNoteEditor(card, entry);
  });
  card.querySelector('[data-note-action="cancel"]')?.addEventListener('click', () => {
    refreshInspectorCardForEntry(entry);
  });
  card.querySelector('[data-note-action="save"]')?.addEventListener('click', async () => {
    const textarea = card.querySelector('.fds-card-note-input');
    const ok = await saveViolationNote(entry, textarea?.value || '');
    if (ok) refreshInspectorCardForEntry(entry);
  });
  card.querySelector('[data-note-action="delete"]')?.addEventListener('click', async () => {
    const ok = await deleteViolationNote(entry);
    if (ok) refreshInspectorCardForEntry(entry);
  });
}
```

Add compact styles to `overlay.css`:

```css
.fds-card-note {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.fds-card-note-text {
  color: var(--fds-text-primary);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fds-card-note-input {
  width: 100%;
  min-height: 64px;
  resize: vertical;
}

.fds-card-note-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.fds-card-note-action {
  border: 0;
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 11px;
  cursor: pointer;
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add content.js overlay.css content-scan-runner.test.js
git commit -m "feat: edit violation notes from inspector card"
```

---

### Task 4: Show Note State In Summary Rows And Pins

**Files:**
- Modify: `content.js`
- Modify: `content-render.js`
- Modify: `overlay.css`
- Test: `content-render.test.js`
- Test: `content-scan-runner.test.js`

**Step 1: Write the failing tests**

In `content-render.test.js`, add a render test that passes `hasNote: true` to `renderSummaryListItem()` and expects `has-note` plus visible `메모` text.

In `content-scan-runner.test.js`, add:

```js
test('summary rows and violation pins expose note state', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
  const styleSource = fs.readFileSync(path.join(__dirname, 'overlay.css'), 'utf8');

  assert.match(contentSource, /function\s+withViolationNoteState\(entry\)/);
  assert.match(contentSource, /renderSummaryListItem\(withViolationNoteState\(item\)\)/);
  assert.match(contentSource, /pin\.classList\.toggle\('has-note'/);
  assert.match(styleSource, /\.fds-list-item\.has-note/);
  assert.match(styleSource, /\.fds-issue-pin\.has-note/);
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
node --test content-render.test.js content-scan-runner.test.js
```

Expected: FAIL.

**Step 3: Write minimal implementation**

In `content.js`:

```js
function withViolationNoteState(entry) {
  return {
    ...entry,
    hasNote: Boolean(getViolationNoteForEntry(entry)),
  };
}
```

Wrap summary list item rendering:

```js
(group.detailEntries || group.entries).map((item) => renderSummaryListItem(withViolationNoteState(item))).join('')
```

In `positionViolationPin()`, toggle note state:

```js
pin.classList.toggle('has-note', Boolean(getViolationNoteForEntry(targetEntry)));
```

In `content-render.js`, update `renderSummaryListItem(item)`:

```js
const hasNote = Boolean(item?.hasNote);
...
<button class="fds-list-item ${tone}${hasNote ? ' has-note' : ''}" ...>
...
${hasNote ? '<span class="fds-list-note-badge">메모</span>' : ''}
```

Add small CSS markers in `overlay.css`.

**Step 4: Run tests to verify they pass**

Run:

```bash
node --test content-render.test.js content-scan-runner.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add content.js content-render.js overlay.css content-render.test.js content-scan-runner.test.js
git commit -m "feat: mark violations with personal notes"
```

---

### Task 5: Load Notes Before Summary Refresh

**Files:**
- Modify: `content.js`
- Test: `content-scan-runner.test.js`

**Step 1: Write the failing test**

Add:

```js
test('content loads violation notes before refreshing visible scan results', () => {
  const contentSource = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');

  assert.match(contentSource, /await loadViolationNotesForPage\(\)/);
  assert.match(contentSource, /loadViolationNotesForPage\(\)\.then\(\(\) => updateSummaryUI\(\)\)/);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: FAIL.

**Step 3: Write minimal implementation**

Call `await loadViolationNotesForPage()` during the scan completion path before `updateSummaryUI()`.

Also call:

```js
loadViolationNotesForPage().then(() => updateSummaryUI()).catch(() => updateSummaryUI());
```

when opening the summary panel if notes have not loaded yet.

**Step 4: Run test to verify it passes**

Run:

```bash
node --test content-scan-runner.test.js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add content.js content-scan-runner.test.js
git commit -m "feat: restore violation notes on scan"
```

---

### Task 6: Final Verification

**Files:**
- Verify only

**Step 1: Run focused tests**

Run:

```bash
node --test content-render.test.js content-scan-runner.test.js
```

Expected: PASS.

**Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

**Step 3: Build extension**

Run:

```bash
npm run build:extension
```

Expected:

```text
Built extension directory: /Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector/dist/fds-inspector
Built extension zip: /Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector/dist/fds-inspector.zip
```

**Step 4: Manual QA**

Load `/Users/im_018/Documents/GitHub/Project/chrome-extensions/FDS_inspector/dist/fds-inspector` as the unpacked extension.

Manual scenario:

1. Open `https://luke.fasoo.com/main`.
2. Run color inspection.
3. Expand a color violation group.
4. Click a child violation row.
5. Confirm the page scrolls to the target and shows pin/card.
6. Click `메모 추가`.
7. Save a short note.
8. Confirm the card, summary row, and pin show note state.
9. Close/reopen the summary panel or rescan.
10. Confirm the note state is restored.
11. Edit the note and confirm updated text appears.
12. Delete the note and confirm note markers disappear.

**Step 5: Commit final verification docs only if needed**

If manual QA notes are written, save them under `docs/verification/` and commit separately:

```bash
git add docs/verification/<qa-note>.md
git commit -m "docs: record violation notes qa"
```
