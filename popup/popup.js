const TOKEN_SOURCE_STORAGE_KEY = 'fdsTokenSource';

const { buildTokenRegistry } = globalThis.FDSTokenSource;

function setMessage(element, text, tone = 'neutral') {
  element.textContent = text;
  element.style.color = tone === 'error'
    ? '#ff4d4f'
    : tone === 'success'
      ? '#3182f6'
      : '#717985';
}

function summarizeTokenSource(source) {
  if (!source?.registry?.meta?.colorTokenCount) return 'Not configured';
  if (source.type === 'url') return `URL · ${source.registry.meta.colorTokenCount} colors`;
  if (source.type === 'file') return `File · ${source.registry.meta.colorTokenCount} colors`;
  return `${source.registry.meta.colorTokenCount} colors`;
}

async function getStoredTokenSource() {
  const result = await chrome.storage.local.get(TOKEN_SOURCE_STORAGE_KEY);
  return result[TOKEN_SOURCE_STORAGE_KEY] || null;
}

async function setStoredTokenSource(source) {
  await chrome.storage.local.set({ [TOKEN_SOURCE_STORAGE_KEY]: source });
}

async function clearStoredTokenSource() {
  await chrome.storage.local.remove(TOKEN_SOURCE_STORAGE_KEY);
}

async function notifyActiveTab(tabId) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { action: 'TOKEN_SOURCE_UPDATED' }, () => {
    void chrome.runtime.lastError;
  });
}

async function parseJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const scanBtn = document.getElementById('scan');
  const toggleBtn = document.getElementById('toggle-highlight');
  const tokenFileInput = document.getElementById('token-file');
  const tokenUrlInput = document.getElementById('token-url');
  const tokenStatusEl = document.getElementById('token-source-status');
  const tokenMessageEl = document.getElementById('token-message');
  const saveFileBtn = document.getElementById('save-file');
  const saveUrlBtn = document.getElementById('save-url');
  const clearTokenSourceBtn = document.getElementById('clear-token-source');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const refreshTokenSourceStatus = async () => {
    const source = await getStoredTokenSource();
    tokenStatusEl.textContent = summarizeTokenSource(source);
    if (source?.type === 'url' && source.url) {
      tokenUrlInput.value = source.url;
    }
  };

  if (!tab || !tab.url || !tab.url.startsWith('http')) {
    statusEl.innerText = 'Not Supported';
    statusEl.style.color = '#717985';
    scanBtn.disabled = true;
    await refreshTokenSourceStatus();
    return;
  }

  function checkConnection() {
    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'PING' }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(false);
          } else {
            resolve(response && response.status === 'alive');
          }
        });
      } catch {
        resolve(false);
      }
    });
  }

  const isConnected = await checkConnection();
  if (isConnected) {
    statusEl.innerText = 'Connected';
    statusEl.style.color = '#3182f6';
    scanBtn.disabled = false;
  } else {
    statusEl.innerText = 'Refresh required (F5)';
    statusEl.style.color = '#ff4d4f';
    scanBtn.disabled = true;
  }

  await refreshTokenSourceStatus();

  toggleBtn.addEventListener('change', async () => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, {
      action: 'TOGGLE',
      state: toggleBtn.checked,
    }, () => {
      if (chrome.runtime.lastError) {
        statusEl.innerText = 'Connection lost (F5)';
      }
    });
  });

  scanBtn.addEventListener('click', async () => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { action: 'RESCAN' }, () => {
      if (chrome.runtime.lastError) {
        statusEl.innerText = 'Connection lost (F5)';
      }
    });
  });

  saveFileBtn.addEventListener('click', async () => {
    const file = tokenFileInput.files?.[0];
    if (!file) {
      setMessage(tokenMessageEl, 'JSON 파일을 선택해주세요.', 'error');
      return;
    }

    try {
      const payload = await parseJsonFile(file);
      const registry = buildTokenRegistry(payload);
      await setStoredTokenSource({
        type: 'file',
        name: file.name,
        registry,
        payload,
        savedAt: new Date().toISOString(),
      });
      await refreshTokenSourceStatus();
      await notifyActiveTab(tab.id);
      setMessage(tokenMessageEl, `${file.name} 저장 완료`, 'success');
    } catch (error) {
      setMessage(tokenMessageEl, `파일 처리 실패: ${error.message}`, 'error');
    }
  });

  saveUrlBtn.addEventListener('click', async () => {
    const url = tokenUrlInput.value.trim();
    if (!url) {
      setMessage(tokenMessageEl, 'JSON URL을 입력해주세요.', 'error');
      return;
    }

    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const registry = buildTokenRegistry(payload);
      await setStoredTokenSource({
        type: 'url',
        url,
        registry,
        payload,
        savedAt: new Date().toISOString(),
      });
      await refreshTokenSourceStatus();
      await notifyActiveTab(tab.id);
      setMessage(tokenMessageEl, '토큰 URL 저장 완료', 'success');
    } catch (error) {
      setMessage(tokenMessageEl, `URL 처리 실패: ${error.message}`, 'error');
    }
  });

  clearTokenSourceBtn.addEventListener('click', async () => {
    await clearStoredTokenSource();
    tokenFileInput.value = '';
    tokenUrlInput.value = '';
    await refreshTokenSourceStatus();
    await notifyActiveTab(tab.id);
    setMessage(tokenMessageEl, '토큰 소스를 초기화했습니다.', 'success');
  });
});
