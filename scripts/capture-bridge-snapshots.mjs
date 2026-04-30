#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:3846';
const DEFAULT_OUTPUT_DIR = path.join(REPO_ROOT, 'docs', 'bridge-snapshots');
const PENDING_NODE_DETAIL = '__pending_node_detail__';

const SNAPSHOT_TARGETS = [
  {
    key: 'pattern-toolbar',
    outputFile: 'pattern-toolbar.component-set.json',
    query: 'pattern/toolbar',
    nodeTypes: ['COMPONENT_SET'],
    fallbackNodeId: '1:43',
    kind: 'component-set',
    source: {
      nodeName: 'pattern/toolbar',
      nodeType: 'COMPONENT_SET',
      nodeRole: 'component-set',
      sourceContext: 'FDS_Inspector > Page 1'
    }
  },
  {
    key: 'frame-12-toolbar',
    outputFile: 'frame-12-toolbar.instance.json',
    query: 'pattern/toolbar',
    nodeTypes: ['INSTANCE'],
    fallbackNodeId: '2:203',
    kind: 'instance',
    source: {
      nodeName: 'pattern/toolbar',
      nodeType: 'INSTANCE',
      nodeRole: 'instance',
      sourceContext: 'Frame 12'
    }
  },
  {
    key: 'pattern-check-info-panel',
    outputFile: 'pattern-check-info-panel.component-set.json',
    query: 'pattern/check_info_pannel',
    nodeTypes: ['COMPONENT_SET'],
    fallbackNodeId: '2:1097',
    kind: 'component-set',
    source: {
      nodeName: 'pattern/check_info_pannel',
      nodeType: 'COMPONENT_SET',
      nodeRole: 'component-set',
      sourceContext: 'FDS_Inspector > Page 1'
    }
  },
  {
    key: 'comp-button-toolbar-menu',
    outputFile: 'comp-button-toolbar-menu.component-set.json',
    query: 'comp/button/toolbar.menu',
    nodeTypes: ['COMPONENT_SET'],
    fallbackNodeId: '1:30',
    kind: 'component-set',
    source: {
      nodeName: 'comp/button/toolbar.menu',
      nodeType: 'COMPONENT_SET',
      nodeRole: 'component-set',
      sourceContext: 'FDS_Inspector > Page 1'
    }
  }
];

function printUsage() {
  console.log(`
Usage:
  node scripts/capture-bridge-snapshots.mjs [--dry-run|--write] [--plugin-id page:0:1] [--bridge-url http://127.0.0.1:3846] [--output-dir docs/bridge-snapshots] [--targets pattern-toolbar,frame-12-toolbar]

Defaults:
  - dry-run mode unless --write is passed
  - active plugin id is inferred from /health
  - snapshot output goes to docs/bridge-snapshots/

Examples:
  node scripts/capture-bridge-snapshots.mjs --dry-run
  node scripts/capture-bridge-snapshots.mjs --write
  node scripts/capture-bridge-snapshots.mjs --write --plugin-id page:0:1
  node scripts/capture-bridge-snapshots.mjs --write --targets pattern-toolbar,frame-12-toolbar
`.trim());
}

function parseArgs(argv) {
  const args = {
    bridgeUrl: DEFAULT_BRIDGE_URL,
    outputDir: DEFAULT_OUTPUT_DIR,
    write: false,
    targets: null,
    pluginId: null,
    help: false
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (token === '--write') {
      args.write = true;
      continue;
    }

    if (token === '--dry-run') {
      args.write = false;
      continue;
    }

    if (token === '--bridge-url') {
      args.bridgeUrl = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === '--output-dir') {
      args.outputDir = path.isAbsolute(argv[i + 1])
        ? argv[i + 1]
        : path.join(REPO_ROOT, argv[i + 1]);
      i += 1;
      continue;
    }

    if (token === '--plugin-id') {
      args.pluginId = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === '--targets') {
      args.targets = (argv[i + 1] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function toPrettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asValueOrPlaceholder(value) {
  return value === undefined || value === null ? PENDING_NODE_DETAIL : value;
}

function normalizeChildren(children) {
  if (!Array.isArray(children)) {
    return [];
  }

  return children.map((child) => ({
    name: child?.name ?? '',
    type: child?.type ?? 'UNKNOWN',
    x: asValueOrPlaceholder(child?.x),
    y: asValueOrPlaceholder(child?.y),
    width: asValueOrPlaceholder(child?.width),
    height: asValueOrPlaceholder(child?.height),
    visible: child?.visible ?? true
  }));
}

function normalizeVariantList(variants) {
  if (!Array.isArray(variants)) {
    return [];
  }

  return variants.map((variant) => {
    const entry = {
      id: variant?.id ?? '',
      name: variant?.name ?? ''
    };

    if (typeof variant?.width === 'number') {
      entry.width = variant.width;
    }
    if (typeof variant?.height === 'number') {
      entry.height = variant.height;
    }
    if (typeof variant?.opacity === 'number') {
      entry.opacity = variant.opacity;
    }

    return entry;
  });
}

function normalizeDefinitionMap(value) {
  if (!value) {
    return {};
  }

  if (isPlainObject(value)) {
    return value;
  }

  if (!Array.isArray(value)) {
    return {};
  }

  return value.reduce((acc, item, index) => {
    const key =
      typeof item?.name === 'string' && item.name.trim()
        ? item.name.trim()
        : typeof item?.key === 'string' && item.key.trim()
          ? item.key.trim()
          : `item-${index}`;
    acc[key] = item;
    return acc;
  }, {});
}

function pickFirstObject(...values) {
  for (const value of values) {
    if (isPlainObject(value)) {
      return value;
    }
  }
  return null;
}

function normalizeLayout(layoutLike, fallback = {}) {
  const layout = isPlainObject(layoutLike) ? layoutLike : {};
  const result = { ...fallback };

  for (const key of [
    'layoutMode',
    'itemSpacing',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'primaryAxisSizingMode',
    'counterAxisSizingMode',
    'width',
    'height',
    'x',
    'y',
    'layoutAlign'
  ]) {
    if (layout[key] !== undefined) {
      result[key] = layout[key];
    }
  }

  return result;
}

function normalizeNodeRecord(record, fallback = {}) {
  const node = isPlainObject(record) ? record : {};
  const normalized = {
    ...fallback,
    name: node.name ?? fallback.name,
    type: node.type ?? fallback.type
  };

  if (node.id !== undefined) {
    normalized.id = node.id;
  }
  if (node.visible !== undefined) {
    normalized.visible = node.visible;
  }
  if (node.layout) {
    normalized.layout = normalizeLayout(node.layout, normalized.layout || {});
  }
  if (Array.isArray(node.children)) {
    normalized.children = normalizeChildren(node.children);
  }

  return normalized;
}

async function fetchJson(bridgeUrl, pathname, body = undefined, method = 'POST') {
  const url = new URL(pathname, bridgeUrl);
  const response = await fetch(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${pathname}: ${text.slice(0, 200)}`);
  }

  if (!response.ok || parsed.ok === false) {
    const message = parsed?.error || parsed?.message || response.statusText || 'Bridge request failed';
    const error = new Error(`${pathname} -> ${response.status}: ${message}`);
    error.status = response.status;
    error.payload = parsed;
    throw error;
  }

  return parsed;
}

async function getActivePluginId(bridgeUrl, explicitPluginId) {
  if (explicitPluginId && explicitPluginId.trim()) {
    return explicitPluginId.trim();
  }

  const health = await fetchJson(bridgeUrl, '/health', undefined, 'GET');
  const activePlugins = Array.isArray(health?.activePlugins) ? health.activePlugins : [];
  if (!activePlugins.length) {
    throw new Error('No active bridge plugin was reported by /health');
  }

  return activePlugins[0];
}

function extractMatches(searchResult) {
  const result = searchResult?.result ?? searchResult;
  if (Array.isArray(result?.matches)) {
    return result.matches;
  }
  if (Array.isArray(result?.search?.matches)) {
    return result.search.matches;
  }
  if (Array.isArray(result?.items)) {
    return result.items;
  }
  return [];
}

function scoreMatch(match, target) {
  const exactName = typeof match?.name === 'string' && match.name.trim() === target.source.nodeName;
  const exactId = target.fallbackNodeId && match?.id === target.fallbackNodeId;
  const typeMatch = !target.nodeTypes || target.nodeTypes.includes(match?.type);
  return (exactName ? 4 : 0) + (exactId ? 2 : 0) + (typeMatch ? 1 : 0);
}

async function resolveTargetNodeId(bridgeUrl, pluginId, target) {
  const fallback = target.fallbackNodeId;
  const query = target.query || target.source.nodeName;

  try {
    const searchResponse = await fetchJson(bridgeUrl, '/api/search-nodes', {
      pluginId,
      query,
      maxResults: 25,
      maxDepth: 3,
      scope: 'current-page',
      nodeTypes: target.nodeTypes || undefined
    });
    const matches = extractMatches(searchResponse);
    if (matches.length > 0) {
      const ranked = [...matches].sort((a, b) => scoreMatch(b, target) - scoreMatch(a, target));
      const best = ranked[0];
      if (best?.id) {
        return {
          nodeId: best.id,
          searchHit: best,
          searchMatches: matches,
          usedFallback: false
        };
      }
    }
  } catch (error) {
    return {
      nodeId: fallback,
      searchError: error.message,
      usedFallback: true
    };
  }

  return {
    nodeId: fallback,
    usedFallback: true
  };
}

async function readNodeDetails(bridgeUrl, pluginId, nodeId) {
  const response = await fetchJson(bridgeUrl, '/api/get-node-details', {
    pluginId,
    targetNodeId: nodeId,
    includeChildren: true,
    detailLevel: 'full',
    maxDepth: 4,
    maxNodes: 250
  });
  return response.result ?? response;
}

async function readComponentVariantDetails(bridgeUrl, pluginId, nodeId) {
  const response = await fetchJson(bridgeUrl, '/api/get-component-variant-details', {
    pluginId,
    targetNodeId: nodeId,
    includeChildren: true,
    detailLevel: 'full',
    maxDepth: 4,
    maxNodes: 250
  });
  return response.result ?? response;
}

async function readInstanceDetails(bridgeUrl, pluginId, nodeId) {
  const response = await fetchJson(bridgeUrl, '/api/get-instance-details', {
    pluginId,
    targetNodeId: nodeId,
    includeResolvedChildren: true,
    includeChildren: true,
    detailLevel: 'full',
    maxDepth: 4,
    maxNodes: 250
  });
  return response.result ?? response;
}

function buildBaseSnapshot(target, resolvedNodeId) {
  return {
    _note: `live bridge snapshot captured on ${new Date().toISOString().slice(0, 10)} from local xbridge`,
    source: { ...target.source },
    identity: {
      figmaNodeId: resolvedNodeId,
      variantProperties: {},
      componentProperties: {}
    },
    layout: {},
    children: [],
    notes: {
      comments: [],
      warnings: []
    }
  };
}

function buildComponentSetSnapshot(target, resolvedNodeId, nodeDetails, variantDetails, searchInfo = {}) {
  const snapshot = buildBaseSnapshot(target, resolvedNodeId);
  const componentSet = pickFirstObject(
    variantDetails?.componentSet,
    nodeDetails?.componentSet,
    nodeDetails?.node,
    variantDetails?.targetNode
  );
  const node = pickFirstObject(nodeDetails?.node, variantDetails?.node, componentSet);
  const variants = Array.isArray(variantDetails?.variants) ? variantDetails.variants : [];

  snapshot.identity.variantProperties = normalizeDefinitionMap(
    componentSet?.variantPropertyDefinitions || componentSet?.variantProperties || variantDetails?.variantPropertyDefinitions
  );
  snapshot.identity.componentProperties = normalizeDefinitionMap(
    componentSet?.componentPropertyDefinitions || variantDetails?.componentPropertyDefinitions || {}
  );
  if (componentSet?.id) {
    snapshot.identity.figmaNodeId = componentSet.id;
  }

  snapshot.layout = normalizeLayout(node?.layout || componentSet?.layout, {
    variantCount: variants.length
  });
  snapshot.children = normalizeChildren(node?.children || componentSet?.children || []);
  snapshot.notes.variants = normalizeVariantList(variants);
  snapshot.notes.warnings = [
    ...(searchInfo.usedFallback ? ['resolved via fallback node id'] : []),
    ...(searchInfo.searchError ? [`search fallback error: ${searchInfo.searchError}`] : []),
    ...(snapshot.children.some((child) => child.x === PENDING_NODE_DETAIL) ? ['child geometry still needs a follow-up get-node-details pass if pixel coordinates are required'] : [])
  ];

  return snapshot;
}

function buildInstanceSnapshot(target, resolvedNodeId, nodeDetails, instanceDetails, searchInfo = {}) {
  const snapshot = buildBaseSnapshot(target, resolvedNodeId);
  const instance = pickFirstObject(
    instanceDetails?.instance,
    nodeDetails?.node,
    instanceDetails?.node,
    instanceDetails?.targetNode
  );

  snapshot.identity.variantProperties = normalizeDefinitionMap(
    instanceDetails?.variantProperties || instance?.variantProperties || {}
  );
  snapshot.identity.componentProperties = normalizeDefinitionMap(
    instanceDetails?.componentProperties || instance?.componentProperties || {}
  );

  const sourceComponent = pickFirstObject(instanceDetails?.sourceComponent, instance?.sourceComponent);
  const sourceComponentSet = pickFirstObject(
    instanceDetails?.sourceComponentSet,
    instance?.sourceComponentSet
  );
  if (sourceComponent) {
    snapshot.identity.sourceComponent = sourceComponent;
  }
  if (sourceComponentSet) {
    snapshot.identity.sourceComponentSet = sourceComponentSet;
  }
  if (instance?.id) {
    snapshot.identity.figmaNodeId = instance.id;
  }

  snapshot.layout = normalizeLayout(instance?.layout || nodeDetails?.node?.layout, {});
  snapshot.children = normalizeChildren(instance?.children || nodeDetails?.node?.children || []);
  snapshot.notes.warnings = [
    ...(searchInfo.usedFallback ? ['resolved via fallback node id'] : []),
    ...(searchInfo.searchError ? [`search fallback error: ${searchInfo.searchError}`] : []),
    ...(snapshot.children.some((child) => child.x === PENDING_NODE_DETAIL) ? ['child geometry still needs a follow-up get-node-details pass if pixel coordinates are required'] : [])
  ];

  return snapshot;
}

function appendSnapshotWarning(snapshot, warning) {
  if (!snapshot?.notes || !warning) return snapshot;
  const nextWarnings = Array.isArray(snapshot.notes.warnings) ? snapshot.notes.warnings : [];
  snapshot.notes.warnings = [...nextWarnings, warning];
  return snapshot;
}

async function captureTarget(bridgeUrl, pluginId, target) {
  const resolved = await resolveTargetNodeId(bridgeUrl, pluginId, target);
  const nodeDetails = await readNodeDetails(bridgeUrl, pluginId, resolved.nodeId);

  if (target.kind === 'instance') {
    try {
      const instanceDetails = await readInstanceDetails(bridgeUrl, pluginId, resolved.nodeId);
      return buildInstanceSnapshot(target, resolved.nodeId, nodeDetails, instanceDetails, resolved);
    } catch (error) {
      return appendSnapshotWarning(
        buildInstanceSnapshot(target, resolved.nodeId, nodeDetails, {}, resolved),
        `detail read fallback used: ${error.message}`
      );
    }
  }

  try {
    const variantDetails = await readComponentVariantDetails(bridgeUrl, pluginId, resolved.nodeId);
    return buildComponentSetSnapshot(target, resolved.nodeId, nodeDetails, variantDetails, resolved);
  } catch (error) {
    return appendSnapshotWarning(
      buildComponentSetSnapshot(target, resolved.nodeId, nodeDetails, {}, resolved),
      `detail read fallback used: ${error.message}`
    );
  }
}

function selectTargets(requested) {
  if (!requested || requested.length === 0) {
    return SNAPSHOT_TARGETS;
  }

  const wanted = new Set(requested);
  return SNAPSHOT_TARGETS.filter((target) => wanted.has(target.key));
}

async function ensureParentDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function maybeWriteSnapshot(filePath, snapshot, writeMode) {
  const next = toPrettyJson(snapshot);
  if (!writeMode) {
    return {
      changed: null,
      existing: false,
      content: next
    };
  }

  let previous = null;
  try {
    previous = await readFile(filePath, 'utf8');
  } catch {
    previous = null;
  }

  await ensureParentDir(filePath);
  await writeFile(filePath, next, 'utf8');

  return {
    changed: previous !== next,
    existing: previous !== null,
    content: next
  };
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printUsage();
    return;
  }

  const writeMode = args.write === true;
  const bridgeUrl = args.bridgeUrl;
  const targets = selectTargets(args.targets);

  if (!writeMode) {
    console.log('\n[bridge-snapshots] dry-run summary');
    const plannedPluginId = args.pluginId?.trim() || '(inferred from /health at write time)';
    console.log(`[bridge-snapshots] pluginId=${plannedPluginId} bridge=${bridgeUrl} mode=dry-run`);
    for (const target of targets) {
      console.log(`- ${target.key}: would update ${path.basename(path.join(args.outputDir, target.outputFile))} from ${target.source.nodeName}`);
    }
    console.log('\nRun with --write to persist the JSON files.');
    return;
  }

  const pluginId = await getActivePluginId(bridgeUrl, args.pluginId);
  console.log(`[bridge-snapshots] pluginId=${pluginId} bridge=${bridgeUrl} mode=write`);

  const results = [];
  for (const target of targets) {
    try {
      const snapshot = await captureTarget(bridgeUrl, pluginId, target);
      const filePath = path.join(args.outputDir, target.outputFile);
      const outcome = await maybeWriteSnapshot(filePath, snapshot, true);

      results.push({
        target: target.key,
        outputFile: filePath,
        nodeId: snapshot.identity?.figmaNodeId || target.fallbackNodeId,
        changed: outcome.changed
      });
      console.log(`[bridge-snapshots] updated ${target.outputFile} <- ${snapshot.identity?.figmaNodeId || target.fallbackNodeId}`);
    } catch (error) {
      results.push({
        target: target.key,
        error: error.message
      });
      console.error(`[bridge-snapshots] failed ${target.outputFile}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(`[bridge-snapshots] fatal: ${error.message}`);
  process.exitCode = 1;
});
