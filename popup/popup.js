document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const scanBtn = document.getElementById('scan');
  const toggleBtn = document.getElementById('toggle-highlight');
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url || !tab.url.startsWith('http')) {
    statusEl.innerText = 'Not Supported';
    statusEl.style.color = '#717985';
    scanBtn.disabled = true;
    return;
  }

  // Robust connection check
  function checkConnection() {
    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tab.id, { action: "PING" }, (response) => {
          if (chrome.runtime.lastError) {
            resolve(false);
          } else {
            resolve(response && response.status === "alive");
          }
        });
      } catch (e) {
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

  // Handle Toggle with explicit error handling
  toggleBtn.addEventListener('change', async () => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { 
      action: "TOGGLE", 
      state: toggleBtn.checked 
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('FDS: Messaging failed. Please refresh the page.');
        statusEl.innerText = 'Connection lost (F5)';
      }
    });
  });

  // Handle Scan
  scanBtn.addEventListener('click', async () => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, { action: "RESCAN" }, () => {
      if (chrome.runtime.lastError) {
        statusEl.innerText = 'Connection lost (F5)';
      }
    });
  });
});
