# Extension Design Admin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local admin dashboard for managing FDS Inspector design tokens, inspection rules, build outputs, QA documents, and module ownership.

**Architecture:** Add a separate Vite + React + TypeScript app under `admin/`. Keep it independent from the Chrome extension runtime and existing root Node test/build scripts. Start with curated metadata in `admin/src/data/*.ts`; do not read or mutate repo files from the browser in phase 1.

**Tech Stack:** Vite, React, TypeScript, CSS, lucide-react, Node/npm.

---

### Task 1: Scaffold Admin App

**Files:**
- Create: `admin/package.json`
- Create: `admin/index.html`
- Create: `admin/vite.config.ts`
- Create: `admin/tsconfig.json`
- Create: `admin/src/main.tsx`
- Create: `admin/src/App.tsx`
- Create: `admin/src/styles.css`

**Step 1: Create the app package**

Create `admin/package.json`:

```json
{
  "name": "fds-inspector-design-admin",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {}
}
```

**Step 2: Install dependencies**

Run:

```bash
cd admin
npm install
```

Expected: `admin/package-lock.json` is created.

**Step 3: Add minimal Vite files**

Create `admin/index.html`, `admin/vite.config.ts`, `admin/tsconfig.json`, `admin/src/main.tsx`, `admin/src/App.tsx`, and `admin/src/styles.css`.

**Step 4: Verify dev build**

Run:

```bash
cd admin
npm run build
```

Expected: TypeScript and Vite build pass.

**Step 5: Commit**

```bash
git add admin
git commit -m "feat: scaffold design admin app"
```

---

### Task 2: Add Curated Admin Data

**Files:**
- Create: `admin/src/data/tokens.ts`
- Create: `admin/src/data/rules.ts`
- Create: `admin/src/data/build.ts`
- Create: `admin/src/data/docs.ts`
- Create: `admin/src/data/modules.ts`

**Step 1: Add token metadata**

Create `admin/src/data/tokens.ts` with entries for:

```ts
export const tokenFiles = [
  {
    path: 'tokens/0.1.primitives.json',
    label: 'Primitives',
    purpose: 'Base color, spacing, radius, and primitive token values.',
  },
  {
    path: 'tokens/0.2.theme.json',
    label: 'Theme',
    purpose: 'Theme-level token mappings built from primitive tokens.',
  },
  {
    path: 'tokens/1.0.semantic.json',
    label: 'Semantic',
    purpose: 'Product-facing semantic design token definitions.',
  },
];
```

**Step 2: Add inspection rule metadata**

Create `admin/src/data/rules.ts` with rule groups for color, text, spacing, and radius. Each rule group must include related runtime files and test files.

**Step 3: Add build metadata**

Create `admin/src/data/build.ts` with:

- `npm run build:extension`
- `dist/fds-inspector`
- `dist/fds-inspector.zip`
- runtime JS file groups

**Step 4: Add document metadata**

Create `admin/src/data/docs.ts` with links to:

- `docs/2026-06-11-dist-js-file-summary.md`
- `docs/2026-06-11-fds-inspector-deployment-build-handoff.md`
- `docs/verification`
- `docs/refactor-reports`
- `docs/plans`

**Step 5: Add module metadata**

Create `admin/src/data/modules.ts` using the module groups from `docs/2026-06-11-dist-js-file-summary.md`.

**Step 6: Verify imports compile**

Run:

```bash
cd admin
npm run build
```

Expected: build passes.

**Step 7: Commit**

```bash
git add admin/src/data
git commit -m "feat: add design admin metadata"
```

---

### Task 3: Build Dashboard Layout

**Files:**
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/styles.css`

**Step 1: Implement app shell**

Add a two-column app shell:

- left sidebar navigation
- main content area
- compact top status row

Navigation items:

- Dashboard
- Token Registry
- Inspection Rules
- Overlay & Interaction
- Build & Release
- QA Documents
- Module Map

**Step 2: Implement Dashboard section**

Show status panels for:

- Token Registry
- Inspection Rules
- Build Output
- QA Documents

Use restrained operational UI styling. Avoid marketing hero sections.

**Step 3: Verify responsive layout**

Run:

```bash
cd admin
npm run dev
```

Open the displayed localhost URL and verify desktop and narrow viewport do not overlap.

**Step 4: Run build**

```bash
cd admin
npm run build
```

Expected: build passes.

**Step 5: Commit**

```bash
git add admin/src/App.tsx admin/src/styles.css
git commit -m "feat: add design admin dashboard"
```

---

### Task 4: Add Management Sections

**Files:**
- Modify: `admin/src/App.tsx`
- Modify: `admin/src/styles.css`

**Step 1: Token Registry page**

Render token file cards from `tokenFiles`.

Each card shows:

- label
- path
- purpose
- status: configured

**Step 2: Inspection Rules page**

Render rule groups from `rules.ts`.

Each group shows:

- category
- what it checks
- runtime files
- test files

**Step 3: Build & Release page**

Render build command, output directory, zip path, and runtime groups.

**Step 4: QA Documents page**

Render docs grouped by type.

**Step 5: Module Map page**

Render module groups with file names and role descriptions.

**Step 6: Run build**

```bash
cd admin
npm run build
```

Expected: build passes.

**Step 7: Commit**

```bash
git add admin/src/App.tsx admin/src/styles.css
git commit -m "feat: add design admin management sections"
```

---

### Task 5: Protect Extension Build Boundary

**Files:**
- Modify: `scripts/build-extension.test.js`
- Optional modify: `.gitignore`

**Step 1: Add build boundary test**

Add a test that asserts `BUILD_FILES` does not include `admin/` paths.

Expected test shape:

```js
test('extension build does not include admin app files', () => {
  assert.equal(BUILD_FILES.some((filePath) => filePath.startsWith('admin/')), false);
});
```

**Step 2: Run root tests**

```bash
npm test
```

Expected: all root tests pass.

**Step 3: Run extension build**

```bash
npm run build:extension
```

Expected:

- `dist/fds-inspector` is created
- `dist/fds-inspector.zip` is created
- no `admin/` files are copied into `dist/fds-inspector`

**Step 4: Commit**

```bash
git add scripts/build-extension.test.js .gitignore
git commit -m "test: keep admin app out of extension build"
```

---

### Task 6: Add Admin Handoff Doc

**Files:**
- Create: `docs/2026-06-11-extension-design-admin-handoff.md`

**Step 1: Document what was built**

Include:

- admin app location
- run commands
- build commands
- data source limitations
- next phase candidates

**Step 2: Verify all checks**

Run:

```bash
cd admin && npm run build
cd ..
npm test
npm run build:extension
```

Expected: all pass.

**Step 3: Commit**

```bash
git add docs/2026-06-11-extension-design-admin-handoff.md
git commit -m "docs: add design admin handoff"
```

---

## Phase 2 Candidates

- Generate `admin/public/generated/*.json` from repo files with a Node script.
- Add token diff view between snapshot token files and bridge token data.
- Add editable token proposals that export patch files instead of mutating source JSON directly.
- Add QA checklist state and screenshot evidence registry.
- Add build command runner through a local Node server.
