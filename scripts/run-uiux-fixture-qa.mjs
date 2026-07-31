import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const chromePath = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const contentScripts = [
  'vendor/gsap.min.js',
  'toolbar-state.js',
  'toolbar-drag.js',
  'style-token-detection.js',
  'token-source.js',
  'bridge-token-source.js',
  'snapshot-token-source.js',
  'design-variables.js',
  'html-utils.js',
  'content-render.js',
  'content-scan-utils.js',
  'content-theme.js',
  'content-state-utils.js',
  'content-inspection.js',
  'content-summary-model.js',
  'content-violation-report.js',
  'content-summary-panel.js',
  'content-toolbar-ui.js',
  'content-bridge-specs.js',
  'content-token-suggestions.js',
  'content-floating-inspector.js',
  'content-scan-runner.js',
  'content-motion.js',
  'content.js',
];

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function pass(message, details = {}) {
  return { ok: true, message, details };
}

function fail(message, details = {}) {
  return { ok: false, message, details };
}

function assertCheck(condition, message, details = {}) {
  return condition ? pass(message, details) : fail(message, details);
}

function wait(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function startStaticServer() {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    const relativePath = decodeURIComponent(requestUrl.pathname.replace(/^\/+/, '')) || 'index.html';
    const filePath = normalize(join(rootDir, relativePath));
    if (!filePath.startsWith(rootDir) || relative(rootDir, filePath).startsWith('..')) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    stat(filePath)
      .then((fileStat) => {
        if (!fileStat.isFile()) {
          response.writeHead(404);
          response.end('Not found');
          return;
        }
        response.writeHead(200, {
          'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
        });
        createReadStream(filePath).pipe(response);
      })
      .catch(() => {
        if (response.headersSent) return;
      response.writeHead(404);
      response.end('Not found');
      });
  });

  return new Promise((resolvePromise, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolvePromise({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose) => server.close(resolveClose)),
      });
    });
  });
}

function getAvailablePort() {
  const server = createServer();
  return new Promise((resolvePromise, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address.port;
      server.close(() => resolvePromise(port));
    });
  });
}

async function waitForJson(url, timeoutMs = 10000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`${response.status} ${url}`);
    } catch (error) {
      lastError = error;
    }
    await wait(150);
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.pending.has(message.id)) return;
      const { resolve: resolvePromise, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        reject(new Error(`${message.error.message}: ${message.error.data || ''}`));
        return;
      }
      resolvePromise(message.result);
    });
  }

  ready() {
    return new Promise((resolvePromise, reject) => {
      if (this.ws.readyState === WebSocket.OPEN) {
        resolvePromise();
        return;
      }
      this.ws.addEventListener('open', resolvePromise, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
    });
  }

  close() {
    this.ws.close();
  }
}

async function evaluate(cdp, expression, timeout = 30000) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
      result.exceptionDetails.text ||
      JSON.stringify(result.exceptionDetails)
    );
  }
  return result.result?.value;
}

async function launchChrome() {
  const remoteDebuggingPort = await getAvailablePort();
  const profileDir = `/tmp/fds-inspector-uiux-qa-${Date.now()}`;
  const args = [
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${remoteDebuggingPort}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    'about:blank',
  ];
  const child = spawn(chromePath, args, {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  child.on('error', (error) => {
    throw error;
  });

  await waitForJson(`http://127.0.0.1:${remoteDebuggingPort}/json/version`);
  return {
    endpoint: `http://127.0.0.1:${remoteDebuggingPort}`,
    close: async () => {
      child.kill();
      await wait(250);
    },
  };
}

async function openPage(chrome, url) {
  const targets = await waitForJson(`${chrome.endpoint}/json/list`);
  const pageTarget = targets.find((target) => target.type === 'page');
  if (!pageTarget?.webSocketDebuggerUrl) {
    throw new Error('No debuggable Chrome page target found.');
  }
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate', { url });
  await wait(700);
  return cdp;
}

async function injectInspector(cdp, baseUrl) {
  await evaluate(cdp, `
    window.__fdsConsole = [];
    window.__fdsScrolls = [];
    const originalInfo = console.info.bind(console);
    const originalError = console.error.bind(console);
    const originalScrollTo = window.scrollTo.bind(window);
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    console.info = (...args) => {
      window.__fdsConsole.push({ level: 'info', args });
      originalInfo(...args);
    };
    console.error = (...args) => {
      window.__fdsConsole.push({ level: 'error', args: args.map(String) });
      originalError(...args);
    };
    window.scrollTo = (options) => {
      window.__fdsScrolls.push(options);
      originalScrollTo(options);
    };
    Element.prototype.scrollIntoView = function scrollIntoView(options) {
      window.__fdsScrolls.push({ type: 'element', options });
      return originalScrollIntoView?.call(this, options);
    };
    window.chrome = {
      runtime: {
        getURL: (assetPath) => {
          const normalizedPath = String(assetPath || '');
          return '${baseUrl}/' + (normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath);
        },
        sendMessage: async (payload) => {
          if (payload?.action === 'BRIDGE_HEALTH') {
            return { connected: false, connectionSummary: '브리지 연결 안 됨' };
          }
          if (payload?.action === 'SET_ACTIVE') {
            return { status: 'success', state: payload.state };
          }
          if (payload?.action === 'SNAPSHOT_TOKEN_SPECS') {
            const [primitives, theme, semantic] = await Promise.all([
              fetch('${baseUrl}/tokens/0.1.primitives.json').then((response) => response.json()),
              fetch('${baseUrl}/tokens/0.2.theme.json').then((response) => response.json()),
              fetch('${baseUrl}/tokens/1.0.semantic.json').then((response) => response.json()),
            ]);
            return {
              status: 'success',
              connected: false,
              source: 'snapshot',
              fileName: 'tokens/*.json',
              pageName: null,
              specs: window.FDSSnapshotTokenSource.buildSnapshotTokenSpecs({ primitives, theme, semantic }),
            };
          }
          return null;
        },
        onMessage: {
          addListener: (handler) => {
            if (!window.__fdsMessageHandlers) window.__fdsMessageHandlers = [];
            window.__fdsMessageHandlers.push(handler);
          },
        },
      },
      storage: {
        local: {
          get: async () => ({}),
          set: async () => ({}),
        },
      },
    };
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '${baseUrl}/overlay.css';
    document.head.appendChild(link);
  `);

  for (const file of contentScripts) {
    const source = await readFile(join(rootDir, file), 'utf8');
    try {
      await evaluate(cdp, `${source}\n//# sourceURL=${baseUrl}/${file}`, 30000);
    } catch (error) {
      throw new Error(`Failed to inject ${file}: ${error.message}`);
    }
  }

  await evaluate(cdp, `
    (async () => new Promise((resolve) => {
      const handler = window.__fdsMessageHandlers?.[0];
      const result = handler({ action: 'TOGGLE', state: true }, {}, resolve);
      if (result !== true) resolve({ status: 'sync' });
    }))()
  `);
}

async function readState(cdp) {
  return evaluate(cdp, `(() => {
    const panel = document.querySelector('#fds-summary-panel');
    const normalizeText = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
    const readText = (element, { excludeTransitionGhosts = false } = {}) => {
      if (!element) return '';
      const source = excludeTransitionGhosts ? element.cloneNode(true) : element;
      if (excludeTransitionGhosts) {
        source.querySelectorAll?.('.fds-summary-list-transition-ghost').forEach((node) => node.remove());
      }
      const innerText = normalizeText(source.innerText);
      return innerText || normalizeText(source.textContent);
    };
    const metricsLog = [...(window.__fdsConsole || [])]
      .reverse()
      .find((item) => item.args?.[0] === '[FDS Inspector] scan metrics');
    const panelRect = panel?.getBoundingClientRect?.();
    return {
      panelDisplay: panel?.style.display || '',
      panelText: readText(panel, { excludeTransitionGhosts: true }),
      panelMetaText: readText(panel?.querySelector('.fds-panel-meta')),
      scanMetaText: readText(panel?.querySelector('.fds-summary-scan-meta')),
      panelInfoCount: panel?.querySelectorAll('.fds-panel-info')?.length || 0,
      panelRect: panelRect ? {
        left: panelRect.left,
        right: panelRect.right,
        width: panelRect.width,
        top: panelRect.top,
        bottom: panelRect.bottom,
      } : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      metrics: metricsLog?.args?.[1] || null,
      motion: {
        hasGsap: Boolean(window.gsap?.timeline),
        hasFDSMotion: Boolean(window.FDSMotion?.animatePanelOpen),
        reducedMotion: Boolean(window.FDSMotion?.prefersReducedMotion?.()),
        events: window.__fdsMotionEvents || [],
      },
      toolbarButtons: [...document.querySelectorAll('#fds-toolbar .fds-btn[data-filter]')].map((element) => ({
        filter: element.getAttribute('data-filter'),
        badgeCount: element.getAttribute('data-badge-count'),
        badgeFullCount: element.getAttribute('data-badge-full-count'),
        text: element.textContent.trim(),
        aria: element.getAttribute('aria-label'),
      })),
      errorText: readText(document.querySelector('.fds-summary-loading.danger')),
      groups: [...document.querySelectorAll('.fds-list-group')].map((element) => ({
        text: readText(element),
        aria: element.getAttribute('aria-label'),
        title: element.getAttribute('title'),
        expanded: element.getAttribute('aria-expanded'),
      })),
      items: [...document.querySelectorAll('.fds-list-item')].map((element) => ({
        text: readText(element),
        aria: element.getAttribute('aria-label'),
        title: element.getAttribute('title'),
      })),
      tabs: [...document.querySelectorAll('.fds-summary-tab')].map((element) => ({
        text: element.textContent.trim(),
        aria: element.getAttribute('aria-label'),
        title: element.getAttribute('title'),
      })),
      statLabels: [...document.querySelectorAll('.fds-stat-box')].map((element) => ({
        text: readText(element),
        aria: element.getAttribute('aria-label'),
      })),
      inspectorCardText: readText(document.querySelector('#fds-inspector-card')),
      inspectorCopy: (() => {
        const button = document.querySelector('#fds-inspector-card .fds-token-copy');
        return button ? {
          aria: button.getAttribute('aria-label'),
          title: button.getAttribute('title'),
          state: button.getAttribute('data-state'),
        } : null;
      })(),
      scrolls: window.__fdsScrolls?.length || 0,
      pinVisible: (() => {
        const displays = [...document.querySelectorAll('#fds-issue-pin-layer .fds-issue-pin')]
          .map((pin) => getComputedStyle(pin).display);
        return displays.find((display) => display !== 'none') || 'none';
      })(),
      focusSelectors: {
        tab: Boolean(document.querySelector('.fds-summary-tab')),
        group: Boolean(document.querySelector('.fds-list-group')),
        item: Boolean(document.querySelector('.fds-list-item')),
        close: Boolean(document.querySelector('.fds-panel-close')),
      },
    };
  })()`);
}

async function pollComplete(cdp, { timeoutMs = 120000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await readState(cdp);
    if (state.metrics || state.errorText) return state;
    await wait(150);
  }
  return readState(cdp);
}

async function activateFilter(cdp, filter) {
  await evaluate(cdp, `document.querySelector('[data-filter="${filter}"]')?.click()`);
  await wait(800);
  return pollComplete(cdp);
}

async function expandFirstGroup(cdp) {
  await evaluate(cdp, `document.querySelector('.fds-list-group[data-group-key]')?.click()`);
  await wait(500);
  return readState(cdp);
}

async function clickFirstDetailItem(cdp) {
  await evaluate(cdp, `document.querySelector('.fds-list-item[data-issue-key]')?.click()`);
  await wait(1000);
  return readState(cdp);
}

async function moveMouse(cdp, x, y) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: Math.round(x),
    y: Math.round(y),
    button: 'none',
  });
}

async function clickMouse(cdp, x, y) {
  const point = { x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 };
  await cdp.send('Input.dispatchMouseEvent', { ...point, type: 'mousePressed', buttons: 1 });
  await cdp.send('Input.dispatchMouseEvent', { ...point, type: 'mouseReleased', buttons: 0 });
}

async function exerciseInteractionStability(cdp) {
  for (const filter of ['radius', 'color', 'spacing']) {
    await evaluate(cdp, `document.querySelector('[data-filter="${filter}"]')?.click()`);
    await wait(35);
  }

  const dragStart = await evaluate(cdp, `(() => {
    const panel = document.querySelector('#fds-summary-panel');
    const head = panel?.querySelector('.fds-panel-head');
    const panelRect = panel?.getBoundingClientRect?.();
    const headRect = head?.getBoundingClientRect?.();
    if (!panelRect || !headRect) return null;
    return {
      panel: { left: panelRect.left, top: panelRect.top },
      pointer: {
        x: headRect.left + Math.min(96, Math.max(32, headRect.width / 3)),
        y: headRect.top + headRect.height / 2,
      },
    };
  })()`);
  if (!dragStart) return { reason: 'summary panel drag target was not available' };

  const endPoint = {
    x: Math.max(24, dragStart.pointer.x - 120),
    y: Math.max(24, dragStart.pointer.y - 80),
  };
  const startPoint = {
    x: Math.round(dragStart.pointer.x),
    y: Math.round(dragStart.pointer.y),
    button: 'left',
  };

  await cdp.send('Input.dispatchMouseEvent', {
    ...startPoint,
    type: 'mousePressed',
    buttons: 1,
    clickCount: 1,
  });
  await cdp.send('Input.dispatchMouseEvent', {
    x: Math.round((startPoint.x + endPoint.x) / 2),
    y: Math.round((startPoint.y + endPoint.y) / 2),
    type: 'mouseMoved',
    button: 'left',
    buttons: 1,
  });
  await wait(24);
  await cdp.send('Input.dispatchMouseEvent', {
    x: Math.round(endPoint.x),
    y: Math.round(endPoint.y),
    type: 'mouseMoved',
    button: 'left',
    buttons: 1,
  });
  await cdp.send('Input.dispatchMouseEvent', {
    x: Math.round(endPoint.x),
    y: Math.round(endPoint.y),
    type: 'mouseReleased',
    button: 'left',
    buttons: 0,
    clickCount: 1,
  });

  await wait(900);
  return evaluate(cdp, `(() => {
    const panel = document.querySelector('#fds-summary-panel');
    const list = panel?.querySelector('.fds-summary-list');
    const panelRect = panel?.getBoundingClientRect?.();
    const panelStyle = panel ? getComputedStyle(panel) : null;
    const errorEntries = (window.__fdsConsole || []).filter((entry) => entry.level === 'error');
    return {
      activeFilter: document.querySelector('#fds-toolbar .fds-btn[data-filter].active')?.dataset?.filter || '',
      panelTitle: panel?.querySelector('.fds-panel-title')?.textContent?.trim() || '',
      panelClasses: [...(panel?.classList || [])],
      bodyClasses: [...(document.body?.classList || [])],
      panelRect: panelRect ? {
        left: panelRect.left,
        right: panelRect.right,
        top: panelRect.top,
        bottom: panelRect.bottom,
      } : null,
      dragDelta: panelRect ? {
        x: panelRect.left - ${dragStart.panel.left},
        y: panelRect.top - ${dragStart.panel.top},
      } : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      computedDisplay: panelStyle?.display || '',
      computedVisibility: panelStyle?.visibility || '',
      computedOpacity: Number.parseFloat(panelStyle?.opacity || '0'),
      panelStyles: {
        opacity: panel?.style?.opacity || '',
        visibility: panel?.style?.visibility || '',
        transform: panel?.style?.transform || '',
        willChange: panel?.style?.willChange || '',
      },
      listStyles: {
        opacity: list?.style?.opacity || '',
        transform: list?.style?.transform || '',
        willChange: list?.style?.willChange || '',
      },
      transitionGhostCount: panel?.querySelectorAll('.fds-summary-list-transition-ghost')?.length || 0,
      motionEvents: window.__fdsMotionEvents || [],
      errorEntries,
    };
  })()`);
}

async function moveMouseInSteps(cdp, from, to, steps = 8, delayMs = 35) {
  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    await moveMouse(
      cdp,
      from.x + (to.x - from.x) * progress,
      from.y + (to.y - from.y) * progress
    );
    await wait(delayMs);
  }
}

async function readInspectorCopyHitState(cdp) {
  return evaluate(cdp, `(() => {
    const card = document.querySelector('#fds-inspector-card');
    const button = document.querySelector('#fds-inspector-card .fds-token-copy');
    const rect = button?.getBoundingClientRect?.();
    const center = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    const elementAtCenter = center ? document.elementFromPoint(center.x, center.y) : null;
    const cardStyle = card ? getComputedStyle(card) : null;
    return {
      buttonCenter: center,
      isCopyButton: Boolean(elementAtCenter?.closest?.('.fds-token-copy')),
      cardDisplay: cardStyle?.display || '',
      cardVisibility: cardStyle?.visibility || '',
      cardOpacity: cardStyle?.opacity || '',
      cardTransform: cardStyle?.transform || '',
      cardPointerEvents: cardStyle?.pointerEvents || '',
      elementAtCenterClass: elementAtCenter?.className || '',
      elementAtCenterText: elementAtCenter?.textContent || '',
      elementsAtCenter: center
        ? document.elementsFromPoint(center.x, center.y).slice(0, 6).map((element) => ({
            tag: element.tagName,
            id: element.id,
            className: element.className || '',
            zIndex: getComputedStyle(element).zIndex,
            pointerEvents: getComputedStyle(element).pointerEvents,
          }))
        : [],
      cardZIndex: cardStyle?.zIndex || '',
      shieldZIndex: getComputedStyle(document.querySelector('#fds-page-interaction-shield')).zIndex,
    };
  })()`);
}

async function exerciseInspectorCardCopyFromSelectedDetail(cdp) {
  await evaluate(cdp, `(async () => {
    const card = document.querySelector('#fds-inspector-card');
    if (!card) return;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__fdsCopiedToken = value;
        },
      },
    });
    const copyButton = card.querySelector('.fds-token-copy');
    window.__fdsInspectorHoverCopyState = {
      visibleAfterSelection: card.style.display,
      pointerEvents: getComputedStyle(card).pointerEvents,
      hasCopyButton: Boolean(copyButton),
      copiedTokenBeforeClick: window.__fdsCopiedToken || '',
      buttonTextBeforeClick: copyButton?.textContent || '',
      buttonAriaBeforeClick: copyButton?.getAttribute('aria-label') || '',
      buttonStateBeforeClick: copyButton?.getAttribute('data-state') || '',
    };
    copyButton?.click();
    await Promise.resolve();
    window.__fdsInspectorHoverCopyState = {
      ...window.__fdsInspectorHoverCopyState,
      visibleAfterCopy: card.style.display,
      copiedTokenAfterClick: window.__fdsCopiedToken || '',
      buttonTextAfterClick: copyButton?.textContent || '',
      buttonAriaAfterClick: copyButton?.getAttribute('aria-label') || '',
      buttonStateAfterClick: copyButton?.getAttribute('data-state') || '',
    };
  })()`);
  await wait(250);
  return evaluate(cdp, `window.__fdsInspectorHoverCopyState || {}`);
}

async function exerciseInspectorCardCopyFromTargetHover(cdp) {
  await evaluate(cdp, `(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__fdsCopiedTokenFromTarget = value;
        },
      },
    });
  })()`);
  const targetPoint = await evaluate(cdp, `(() => {
    const target = document.querySelector('.fds-inspected');
    const rect = target?.getBoundingClientRect?.();
    if (!rect) return null;
    return {
      x: rect.left + Math.min(rect.width - 8, Math.max(8, rect.width / 2)),
      y: rect.top + Math.min(rect.height - 8, Math.max(8, rect.height / 2)),
    };
  })()`);
  if (!targetPoint) return { hasTarget: false };

  await moveMouse(cdp, targetPoint.x, targetPoint.y);
  await wait(250);
  const beforeMove = await evaluate(cdp, `(() => {
    const card = document.querySelector('#fds-inspector-card');
    const button = card?.querySelector('.fds-token-copy');
    const cardRect = card?.getBoundingClientRect?.();
    const buttonRect = button?.getBoundingClientRect?.();
    const pinRect = document.querySelector('#fds-issue-pin-layer .fds-issue-pin')?.getBoundingClientRect?.();
    const overlapWidth = cardRect && pinRect ? Math.max(0, Math.min(cardRect.right, pinRect.right) - Math.max(cardRect.left, pinRect.left)) : 0;
    const overlapHeight = cardRect && pinRect ? Math.max(0, Math.min(cardRect.bottom, pinRect.bottom) - Math.max(cardRect.top, pinRect.top)) : 0;
    return {
      hasTarget: true,
      cardDisplay: card?.style.display || '',
      hasCopyButton: Boolean(buttonRect),
      cardRect: cardRect ? { left: cardRect.left, top: cardRect.top, right: cardRect.right, bottom: cardRect.bottom } : null,
      buttonCenter: buttonRect ? { x: buttonRect.left + buttonRect.width / 2, y: buttonRect.top + buttonRect.height / 2 } : null,
      pinCardOverlapArea: overlapWidth * overlapHeight,
    };
  })()`);
  if (!beforeMove.buttonCenter) return beforeMove;

  await moveMouseInSteps(cdp, targetPoint, beforeMove.buttonCenter, 10, 30);
  await wait(120);
  let clickState = await readInspectorCopyHitState(cdp);
  for (let attempt = 0; attempt < 5 && clickState.buttonCenter && !clickState.isCopyButton; attempt += 1) {
    await moveMouse(cdp, clickState.buttonCenter.x, clickState.buttonCenter.y);
    await wait(100);
    clickState = await readInspectorCopyHitState(cdp);
  }
  if (clickState.buttonCenter && clickState.isCopyButton) {
    await moveMouse(cdp, clickState.buttonCenter.x, clickState.buttonCenter.y);
    await wait(50);
    await clickMouse(cdp, clickState.buttonCenter.x, clickState.buttonCenter.y);
  }
  await wait(250);

  return evaluate(cdp, `(() => {
    const card = document.querySelector('#fds-inspector-card');
    const button = card?.querySelector('.fds-token-copy');
    return {
      ...${JSON.stringify(beforeMove)},
      clickState: ${JSON.stringify(clickState)},
      cardDisplayAfterMove: card?.style.display || '',
      copiedTokenAfterClick: window.__fdsCopiedTokenFromTarget || '',
      buttonTextAfterClick: button?.textContent || '',
    };
  })()`);
}

async function clickColorSummaryTab(cdp, tabKey) {
  await evaluate(cdp, `document.querySelector('.fds-summary-tab[data-summary-tab="${tabKey}"]')?.click()`);
  await wait(350);
  return readState(cdp);
}

async function sampleSummaryTransitionHeights(cdp, tabSelector) {
  return evaluate(cdp, `
    (async () => {
      const selector = ${JSON.stringify(tabSelector)};
      const panel = document.querySelector('#fds-summary-panel');
      const tab = document.querySelector(selector);
      const firstList = panel ? panel.querySelector('.fds-summary-list') : null;
      if (!panel || !firstList || !tab) {
        return { frames: [], ok: false, reason: 'missing elements' };
      }
      const startPanelHeight = panel.getBoundingClientRect().height;
      const startListHeight = firstList.getBoundingClientRect().height;
      const endTime = performance.now() + 700;
      const frames = [];
      tab.click();
      while (performance.now() < endTime) {
        const framePanel = panel.getBoundingClientRect();
        const frameList = panel.querySelector('.fds-summary-list')?.getBoundingClientRect?.();
        frames.push({
          t: Math.round(performance.now() * 100) / 100,
          panelHeight: Math.round(framePanel.height * 100) / 100,
          panelHeightStyle: panel.style.height || 'auto',
          listHeight: frameList ? Math.round(frameList.height * 100) / 100 : 0,
        });
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
      const endPanel = panel.getBoundingClientRect();
      const endList = panel.querySelector('.fds-summary-list')?.getBoundingClientRect?.();
      const endPanelHeight = endPanel.height;
      const endListHeight = endList ? endList.height : 0;
      const uniquePanelHeights = new Set(frames.map((entry) => Math.round(entry.panelHeight)));
      const uniqueListHeights = new Set(frames.map((entry) => Math.round(entry.listHeight)));
      const panelDeltas = frames.map((entry, index) => (
        index === 0 ? 0 : Math.abs(entry.panelHeight - frames[index - 1].panelHeight)
      ));
      const maxPanelDelta = panelDeltas.reduce((acc, value) => Math.max(acc, value), 0);
      return {
        ok: frames.length > 12,
        frames,
        startPanelHeight,
        startListHeight,
        endPanelHeight,
        endListHeight,
        uniquePanelCount: uniquePanelHeights.size,
        uniqueListCount: uniqueListHeights.size,
        maxPanelDelta,
      };
    })()
  `);
}

async function sampleSummaryTransitionRows(cdp, tabSelector) {
  return evaluate(cdp, `
    (async () => {
      const selector = ${JSON.stringify(tabSelector)};
      const panel = document.querySelector('#fds-summary-panel');
      const tab = document.querySelector(selector);
      if (!panel || !tab) return { frames: [], ok: false, reason: 'missing elements' };
      const snapshotRows = () => {
        return [...panel.querySelectorAll('.fds-summary-list > *')].slice(0, 4).map((row) => {
          const style = getComputedStyle(row);
          return {
            tag: row.className || row.tagName,
            opacity: Number.parseFloat(style.opacity || '1'),
            translateY: Number.parseFloat(style.transform === 'none' ? '0' : style.transform.replace(/[^-\\d\\.e]+/g, ' ').trim().split(' ')[5] || 0),
          };
        });
      };

      const frames = [];
      tab.click();
      const endTime = performance.now() + 700;
      const firstSample = snapshotRows();
      while (performance.now() < endTime) {
        frames.push({
          t: Math.round(performance.now() * 100) / 100,
          rows: snapshotRows(),
        });
        await new Promise((resolve) => setTimeout(resolve, 16));
      }
      const frameRows = frames.filter((entry) => entry.rows.length > 0);
      const opacityBuckets = new Set();
      const translateBuckets = new Set();
      const finalRows = frames.length ? frames[frames.length - 1].rows : [];
      frameRows.forEach((entry) => {
        entry.rows.forEach((row) => {
          opacityBuckets.add(Math.round((Number.isFinite(row.opacity) ? row.opacity : 1) * 100) / 100);
          translateBuckets.add(Math.round((Number.isFinite(row.translateY) ? row.translateY : 0) * 100) / 100);
        });
      });
      return {
        ok: frameRows.length > 8,
        frames,
        uniqueRowOpacityCount: opacityBuckets.size,
        uniqueRowTranslateCount: translateBuckets.size,
        initialRowCount: firstSample.length,
        finalRowCount: finalRows.length,
      };
    })()
  `);
}

function hasText(text, value) {
  return String(text || '').includes(value);
}

function commonPanelChecks(state, fixtureName) {
  const rect = state.panelRect;
  return [
    assertCheck(state.panelDisplay === 'block', `${fixtureName}: summary panel is visible`, { display: state.panelDisplay }),
    assertCheck(rect && rect.left >= 0 && rect.right <= state.viewport.width + 1, `${fixtureName}: summary panel stays inside viewport`, { rect, viewport: state.viewport }),
    assertCheck(state.statLabels.every((stat) => stat.aria), `${fixtureName}: metric cards expose accessible labels`, state.statLabels),
    assertCheck(state.motion?.hasGsap && state.motion?.hasFDSMotion, `${fixtureName}: bundled GSAP motion layer is available`, state.motion),
  ];
}

async function runSpacingFixture(chrome, baseUrl) {
  const cdp = await openPage(chrome, `${baseUrl}/docs/verification/spacing-direction-fixture.html`);
  try {
    await injectInspector(cdp, baseUrl);
    await pollComplete(cdp);
    const state = await activateFilter(cdp, 'spacing');
    const interactionState = await exerciseInteractionStability(cdp);
    const afterExpand = await expandFirstGroup(cdp);
    const afterNavigate = await clickFirstDetailItem(cdp);
    const checks = [
      ...commonPanelChecks(state, 'spacing'),
      assertCheck(
        interactionState.activeFilter === 'spacing' && hasText(interactionState.panelTitle, '스페이싱'),
        'spacing: the last rapid filter selection remains active',
        interactionState,
      ),
      assertCheck(
        interactionState.motionEvents?.filter((event) => event === 'summary-refresh').length >= 3
          && interactionState.motionEvents?.filter((event) => event === 'summary-panel-move').length >= 2,
        'spacing: rapid filter changes interrupt active summary animations',
        interactionState.motionEvents,
      ),
      assertCheck(
        Math.abs(interactionState.dragDelta?.x || 0) >= 40 || Math.abs(interactionState.dragDelta?.y || 0) >= 40,
        'spacing: summary panel remains movable while filter motion is interrupted',
        interactionState,
      ),
      assertCheck(
        interactionState.computedDisplay === 'block'
          && interactionState.computedVisibility === 'visible'
          && interactionState.computedOpacity >= 0.99,
        'spacing: interrupted panel motion recovers to a visible state',
        interactionState,
      ),
      assertCheck(
        !interactionState.panelClasses.includes('is-resizing')
          && !interactionState.panelClasses.includes('is-dragging')
          && !interactionState.bodyClasses.includes('fds-panel-dragging')
          && Object.values(interactionState.panelStyles || {}).every((value) => value === '')
          && Object.values(interactionState.listStyles || {}).every((value) => value === '')
          && interactionState.transitionGhostCount === 0,
        'spacing: interrupted animations and panel drag leave no transient styles or classes',
        interactionState,
      ),
      assertCheck(
        interactionState.panelRect?.left >= 0
          && interactionState.panelRect?.right <= interactionState.viewport?.width + 1
          && interactionState.panelRect?.top >= 0
          && interactionState.panelRect?.bottom <= interactionState.viewport?.height + 1,
        'spacing: moved summary panel stays inside the viewport',
        interactionState,
      ),
      assertCheck(
        interactionState.errorEntries?.length === 0,
        'spacing: rapid interaction sequence produces no runtime errors',
        interactionState.errorEntries,
      ),
      assertCheck(state.tabs.length === 0, 'spacing: color-only tabs are hidden', state.tabs),
      assertCheck(state.statLabels.some((stat) => /미등록:\s*5/.test(stat.aria || '')), 'spacing: summary prioritizes pattern count before raw element totals', state.statLabels),
      assertCheck(state.statLabels.some((stat) => /영향 7개 요소/.test(stat.aria || '')), 'spacing: summary keeps affected element total as supporting context', state.statLabels),
      assertCheck(
        ['패딩', '오른쪽 패딩', '마진'].every((label) => state.groups.some((group) => hasText(group.aria, label))),
        'spacing: directional and all-side spacing groups are exposed accessibly',
        state.groups,
      ),
      assertCheck(state.groups.some((group) => hasText(group.aria, '3개 요소')) && !state.groups.some((group) => hasText(group.aria, '3곳')), 'spacing: group counts use DOM element wording', state.groups),
      assertCheck(state.groups[0]?.aria?.includes('클릭하면 상세 목록을 펼칩니다'), 'spacing: group explains detail expansion', state.groups[0]),
      assertCheck(afterExpand.groups[0]?.expanded === 'true', 'spacing: group click expands details', afterExpand.groups[0]),
      assertCheck(afterExpand.items.length >= 1, 'spacing: expanded group exposes detail rows', { count: afterExpand.items.length }),
      assertCheck(afterExpand.items[0]?.aria?.includes('클릭하면 대표 요소로 이동합니다'), 'spacing: detail row explains representative navigation', afterExpand.items[0]),
      assertCheck(afterNavigate.pinVisible !== 'none', 'spacing: detail click shows representative pin', { pinVisible: afterNavigate.pinVisible }),
      assertCheck(afterNavigate.scrolls >= 1, 'spacing: detail click requests scroll to representative element', { scrolls: afterNavigate.scrolls }),
    ];
    return { fixture: 'spacing-direction', checks };
  } finally {
    cdp.close();
  }
}

async function runLargeDomFixture(chrome, baseUrl) {
  const cdp = await openPage(chrome, `${baseUrl}/docs/verification/large-dom-scan-fixture.html`);
  try {
    await injectInspector(cdp, baseUrl);
    await pollComplete(cdp);
    const state = await activateFilter(cdp, 'color');
    const afterTextTab = await clickColorSummaryTab(cdp, 'text');
    const transitionSample = await sampleSummaryTransitionHeights(cdp, '.fds-summary-tab[data-summary-tab="bg"]');
    const transitionRowSample = await sampleSummaryTransitionRows(cdp, '.fds-summary-tab[data-summary-tab="bg"]');
    const afterExpand = await expandFirstGroup(cdp);
    const afterNavigate = await clickFirstDetailItem(cdp);
    const selectedCopyState = await exerciseInspectorCardCopyFromSelectedDetail(cdp);
    const targetHoverCopyState = await exerciseInspectorCardCopyFromTargetHover(cdp);
    const checks = [
      ...commonPanelChecks(state, 'large-dom'),
      assertCheck(state.metrics?.scannedElementCount === 6000, 'large-dom: scan caps at 6000 elements', state.metrics),
      assertCheck(state.metrics?.totalElementCount === 7502, 'large-dom: total element count is reported', state.metrics),
      assertCheck(state.metrics?.truncated === true, 'large-dom: partial scan is reported', state.metrics),
      assertCheck(Number(state.metrics?.batchYieldCount || 0) > 0, 'large-dom: scan yields between batches', state.metrics),
      assertCheck(!hasText(state.panelText, '일부만 검사'), 'large-dom: completion metadata is not shown in the persistent panel content', { panelText: state.panelText }),
      assertCheck(!state.panelMetaText, 'large-dom: token metadata is removed from the panel title area', { panelMetaText: state.panelMetaText }),
      assertCheck(!state.scanMetaText, 'large-dom: completed token and scan metadata are not shown as a persistent panel bar', { scanMetaText: state.scanMetaText }),
      assertCheck(state.panelInfoCount === 0, 'large-dom: completed token and scan metadata are not exposed through a title info tooltip', { panelInfoCount: state.panelInfoCount }),
      assertCheck(state.tabs.length === 3, 'large-dom: color tabs are visible only in color mode', state.tabs),
      assertCheck(state.tabs.some((tab) => tab.aria === '배경색 2,000개 요소'), 'large-dom: BG tab has full accessible count label', state.tabs),
      assertCheck(state.tabs.some((tab) => tab.aria?.startsWith('글자색 ')), 'large-dom: Text tab has full accessible count label', state.tabs),
      assertCheck(state.toolbarButtons.some((button) => button.filter === 'color' && button.badgeCount === '7999' && button.badgeFullCount === '7,999'), 'large-dom: toolbar badge keeps numeric count while full count remains available', state.toolbarButtons),
      assertCheck(afterTextTab.motion?.events?.includes('tab-switch'), 'large-dom: summary tab movement uses the GSAP motion layer', afterTextTab.motion),
      assertCheck(
        Math.abs((transitionSample?.startPanelHeight || 0) - (transitionSample?.endPanelHeight || 0)) <= 1
          || (transitionSample?.ok && transitionSample.uniquePanelCount >= 3),
        'large-dom: panel height transitions continuously when tab switch changes list length',
        transitionSample,
      ),
      assertCheck(
        transitionRowSample?.initialRowCount > 0 && transitionRowSample?.initialRowCount === transitionRowSample?.finalRowCount
          ? true
          : (
            transitionRowSample?.initialRowCount !== transitionRowSample?.finalRowCount
              ? (transitionRowSample?.ok && transitionRowSample?.uniqueRowOpacityCount > 1 && transitionRowSample?.uniqueRowTranslateCount > 1)
              : true
          ),
        'large-dom: list rows animate when list shape changes during tab transition',
        transitionRowSample,
      ),
      assertCheck(state.statLabels.some((stat) => stat.text.includes('원시값') && stat.text.includes('영향 2,000개 요소')), 'large-dom: primitive color summary is framed as raw-value pattern with impact caption', state.statLabels),
      assertCheck(state.groups.some((group) => hasText(group.aria, '배경색') && hasText(group.aria, '#f6f8fa')), 'large-dom: underlying primitive color issue remains visible in the grouped list', state.groups),
      assertCheck(afterExpand.groups[0]?.expanded === 'true', 'large-dom: group click expands details', afterExpand.groups[0]),
      assertCheck(afterNavigate.pinVisible !== 'none', 'large-dom: detail click shows representative pin', { pinVisible: afterNavigate.pinVisible }),
      assertCheck(afterNavigate.scrolls >= 1, 'large-dom: detail click requests scroll to representative element', { scrolls: afterNavigate.scrolls }),
      assertCheck(
        hasText(afterNavigate.inspectorCardText, 'Color/bg/') && hasText(afterNavigate.inspectorCopy?.aria, '복사'),
        'large-dom: representative card gives an immediate token-copy action',
        { inspectorCardText: afterNavigate.inspectorCardText, inspectorCopy: afterNavigate.inspectorCopy },
      ),
      assertCheck(selectedCopyState.visibleAfterSelection === 'block', 'large-dom: selected-detail inspector card stays open for copy action', selectedCopyState),
      assertCheck(selectedCopyState.pointerEvents === 'auto', 'large-dom: inspector card accepts pointer interaction for token copy', selectedCopyState),
      assertCheck(selectedCopyState.hasCopyButton === true && Boolean(selectedCopyState.copiedTokenAfterClick), 'large-dom: token copy action is clickable from the selected-detail inspector card', selectedCopyState),
      assertCheck(selectedCopyState.buttonStateAfterClick === 'copied' && hasText(selectedCopyState.buttonAriaAfterClick, '복사되었습니다'), 'large-dom: token copy action gives success feedback', selectedCopyState),
      assertCheck(targetHoverCopyState.cardDisplay === 'block' && targetHoverCopyState.cardDisplayAfterMove === 'block', 'large-dom: target hover inspector survives real mouse movement to copy button', targetHoverCopyState),
      assertCheck(targetHoverCopyState.hasCopyButton === true && Boolean(targetHoverCopyState.copiedTokenAfterClick), 'large-dom: target hover token copy works with real mouse click', targetHoverCopyState),
      assertCheck(targetHoverCopyState.pinCardOverlapArea === 0, 'large-dom: violation pin does not overlap the inspector card', targetHoverCopyState),
    ];
    return { fixture: 'large-dom', checks };
  } finally {
    cdp.close();
  }
}

async function runErrorFixture(chrome, baseUrl) {
  const cdp = await openPage(chrome, `${baseUrl}/docs/verification/scan-error-state-fixture.html`);
  try {
    await injectInspector(cdp, baseUrl);
    const state = await activateFilter(cdp, 'color');
    const checks = [
      ...commonPanelChecks(state, 'error-state'),
      assertCheck(hasText(state.errorText, '새로고침 버튼으로 다시 검사'), 'error-state: error copy explains recovery action', { errorText: state.errorText }),
      assertCheck(state.groups.length === 0, 'error-state: no stale violation groups remain', state.groups),
      assertCheck(state.tabs.length === 3 && state.tabs.every((tab) => tab.aria?.endsWith('0개 요소')), 'error-state: color tabs expose zero-count accessible labels', state.tabs),
      assertCheck(hasText(state.panelText, '검사 실패') && hasText(state.panelText, '다시 검사 필요'), 'error-state: error summary replaces success/empty completion cards', { panelText: state.panelText }),
      assertCheck(!hasText(state.panelText, '위반 없음') && !hasText(state.panelText, '검사 완료'), 'error-state: error panel does not look like a successful empty result', { panelText: state.panelText }),
      assertCheck(hasText(state.panelText, '오류로 인해 결과를 표시할 수 없습니다'), 'error-state: list copy explains that results are unavailable because scanning failed', { panelText: state.panelText }),
    ];
    return { fixture: 'error-state', checks };
  } finally {
    cdp.close();
  }
}

async function main() {
  const server = await startStaticServer();
  let chrome = null;
  try {
    chrome = await launchChrome();
    const results = [
      await runSpacingFixture(chrome, server.baseUrl),
      await runLargeDomFixture(chrome, server.baseUrl),
      await runErrorFixture(chrome, server.baseUrl),
    ];
    const failed = results.flatMap((result) => result.checks.filter((check) => !check.ok));

    results.forEach((result) => {
      console.log(`\n${result.fixture}`);
      result.checks.forEach((check) => {
        console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.message}`);
        if (!check.ok) {
          console.log(JSON.stringify(check.details, null, 2));
        }
      });
    });

    if (failed.length > 0) {
      console.error(`\nUI/UX fixture QA failed: ${failed.length} check(s) failed.`);
      process.exitCode = 1;
      return;
    }
    console.log('\nUI/UX fixture QA passed.');
  } finally {
    if (chrome) await chrome.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
