const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('extension build copies only runtime files into a clean dist directory', async () => {
  const {
    BUILD_FILES,
    createExtensionBuild,
    getDefaultBuildOptions,
  } = await import('./build-extension.mjs');

  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fds-build-src-'));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fds-build-out-'));

  try {
    BUILD_FILES.forEach((filePath) => {
      const fullPath = path.join(repoRoot, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, `${filePath}\n`);
    });
    fs.mkdirSync(path.join(repoRoot, 'docs'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'content-render.test.js'), 'test file\n');
    fs.writeFileSync(path.join(repoRoot, 'docs', 'handoff.md'), 'doc file\n');
    fs.writeFileSync(path.join(outDir, 'stale.txt'), 'stale\n');

    const result = await createExtensionBuild({
      ...getDefaultBuildOptions(repoRoot),
      distDir: outDir,
      zip: false,
    });

    assert.equal(result.fileCount, BUILD_FILES.length);
    assert.equal(fs.existsSync(path.join(outDir, 'stale.txt')), false);
    assert.equal(fs.existsSync(path.join(outDir, 'content.js')), true);
    assert.equal(fs.existsSync(path.join(outDir, 'vendor', 'gsap.min.js')), true);
    assert.equal(fs.existsSync(path.join(outDir, 'tokens', '0.1.primitives.json')), true);
    assert.equal(fs.existsSync(path.join(outDir, 'content-render.test.js')), false);
    assert.equal(fs.existsSync(path.join(outDir, 'docs', 'handoff.md')), false);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('extension build does not include admin app files', async () => {
  const { BUILD_FILES } = await import('./build-extension.mjs');

  assert.equal(BUILD_FILES.some((filePath) => filePath.startsWith('admin/')), false);
});
