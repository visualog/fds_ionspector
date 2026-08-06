# Storybook Token Registry Validation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permit authored CSS variables only when they map to registered FDS/Storybook token variables, while retaining existing offline compatibility when no registry is available.

**Architecture:** Add a small shared registry utility that turns Figma token paths into Storybook CSS variable names. Bridge and snapshot token sources expose this registry with their existing color/spacing/radius specs. The inspector evaluates the winning authored declaration, accepts a registered `var(--...)`, and reports an unregistered variable distinctly rather than treating it as a raw literal.

**Tech Stack:** Chrome extension JavaScript, Node built-in test runner, Figma bridge/snapshot token JSON, CSS custom properties, Tailwind-generated CSS.

---

### Task 1: Derive canonical Storybook CSS variable names

**Files:**
- Create: `css-token-registry.js`
- Test: `css-token-registry.test.js`

**Step 1: Write the failing test**

```js
assert.deepEqual(
  buildCssVariableRegistry(['Color/text/primary', 'spacing/16', 'radius/circle']),
  {
    variables: {
      '--color-text-primary': ['Color/text/primary'],
      '--spacing-16': ['spacing/16'],
      '--radius-circle': ['radius/circle'],
    },
    meta: { cssVariableCount: 3 },
  },
);
```

Also cover case and separator normalization, duplicate names, and empty input.

**Step 2: Run test to verify it fails**

Run: `node --test css-token-registry.test.js`

Expected: FAIL because the module does not exist.

**Step 3: Write minimal implementation**

Implement `toStorybookCssVariableName(tokenName)` and `buildCssVariableRegistry(tokenNames)`. Normalize slash, dot, underscore, whitespace, and camel-case boundaries to lower kebab-case; preserve the `color`, `spacing`, and `radius` roots.

**Step 4: Run test to verify it passes**

Run: `node --test css-token-registry.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add css-token-registry.js css-token-registry.test.js
git commit -m "feat: derive Storybook CSS variable registry"
```

### Task 2: Publish bridge and snapshot variable registries

**Files:**
- Modify: `bridge-token-source.js`
- Modify: `bridge-token-source.test.js`
- Modify: `snapshot-token-source.js`
- Modify: `snapshot-token-source.test.js`

**Step 1: Write the failing tests**

Add expectations that a Figma bridge variable named `Color/text/primary` yields `--color-text-primary`, and the supplied snapshot files yield `--color-bg-primary`, `--spacing-16`, and `--radius-circle`.

**Step 2: Run tests to verify they fail**

Run: `node --test bridge-token-source.test.js snapshot-token-source.test.js`

Expected: FAIL because the spec payloads contain no CSS variable registry.

**Step 3: Write minimal implementation**

Collect token names while existing color/spacing/radius maps are built, pass them through the registry helper, and include `cssVariables` plus `meta.cssVariableCount` in each spec payload. Preserve all current color and dimensional outputs.

**Step 4: Run tests to verify they pass**

Run: `node --test bridge-token-source.test.js snapshot-token-source.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add bridge-token-source.js bridge-token-source.test.js snapshot-token-source.js snapshot-token-source.test.js css-token-registry.js
git commit -m "feat: expose FDS CSS variable registries"
```

### Task 3: Classify registered and unregistered authored variables

**Files:**
- Modify: `style-token-detection.js`
- Modify: `style-token-detection.test.js`

**Step 1: Write the failing tests**

```js
assert.equal(
  getAuthoredTokenReferenceStatus(element, ['color'], {
    root,
    allowedVariables: { '--color-text-primary': ['Color/text/primary'] },
  }).status,
  'registered',
);

assert.equal(
  getAuthoredTokenReferenceStatus(element, ['color'], {
    root,
    allowedVariables: { '--color-text-primary': ['Color/text/primary'] },
  }).status,
  'unregistered',
);
```

Cover no variable, nested `var(...)` fallback syntax, an empty registry, and inaccessible stylesheets.

**Step 2: Run test to verify it fails**

Run: `node --test style-token-detection.test.js`

Expected: FAIL because the status API is not implemented.

**Step 3: Write minimal implementation**

Add `extractCssVariableReferences` and `getAuthoredTokenReferenceStatus`. Return `registered` only for a matching variable when a non-empty registry is supplied. Return `unregistered` for unknown variables, `legacy` for a variable when no registry exists, and `none` for literal declarations.

**Step 4: Run test to verify it passes**

Run: `node --test style-token-detection.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add style-token-detection.js style-token-detection.test.js
git commit -m "feat: classify authored CSS token variables"
```

### Task 4: Wire the registry into inspector verdicts and evidence

**Files:**
- Modify: `content-bridge-specs.js`
- Modify: `content-bridge-specs.test.js`
- Modify: `content.js`
- Modify: `content-inspection.js`
- Modify: `content-inspection.test.js`

**Step 1: Write the failing tests**

Assert that the active registry is forwarded to the inspector, a registered Storybook variable yields no issue, and an unknown variable creates `등록되지 않은 CSS 변수` rather than `원시값 직접 사용`. Assert that an empty registry keeps the previous variable-acceptance behavior.

**Step 2: Run tests to verify they fail**

Run: `node --test content-bridge-specs.test.js content-inspection.test.js`

Expected: FAIL because the inspector has no registry-aware variable status.

**Step 3: Write minimal implementation**

Normalize `cssVariables` in bridge and snapshot responses, merge bridge/snapshot/source registries in `content.js`, and pass `getAuthoredTokenReferenceStatus` into `createContentInspector`. Use the returned status to allow registered/legacy references and to emit structured evidence for unknown variables.

**Step 4: Run tests to verify they pass**

Run: `node --test content-bridge-specs.test.js content-inspection.test.js`

Expected: PASS.

**Step 5: Commit**

```bash
git add content-bridge-specs.js content-bridge-specs.test.js content.js content-inspection.js content-inspection.test.js
git commit -m "feat: validate CSS variables against FDS registry"
```

### Task 5: Run integration validation and package the extension

**Files:**
- Verify only: modified source and test files

**Step 1: Run focused regression tests**

Run: `node --test css-token-registry.test.js bridge-token-source.test.js snapshot-token-source.test.js style-token-detection.test.js content-bridge-specs.test.js content-inspection.test.js`

Expected: PASS.

**Step 2: Run the complete test suite**

Run: `npm test`

Expected: all tests pass.

**Step 3: Build the extension**

Run: `npm run build:extension`

Expected: unpacked extension and ZIP are created with the new runtime helper included.

**Step 4: Run browser fixture QA**

Run: `npm run qa:uiux`

Expected: all Chrome UI/UX fixture checks pass.

**Step 5: Commit and publish only intended files**

```bash
git status --short
git add -- css-token-registry.js css-token-registry.test.js bridge-token-source.js bridge-token-source.test.js snapshot-token-source.js snapshot-token-source.test.js style-token-detection.js style-token-detection.test.js content-bridge-specs.js content-bridge-specs.test.js content.js content-inspection.js content-inspection.test.js
git commit -m "feat: validate Storybook token variables"
```
