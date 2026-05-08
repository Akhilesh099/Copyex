// background.js — Service Worker for Stealth Watcher v3
// Keeps the extension alive and handles cross-tab state.

console.log("[Stealth Watcher v3] Service worker started.");

// ── Keep-Alive Ping ──────────────────────────────────────────
// MV3 service workers can be killed by Chrome after ~30s of
// inactivity. This self-ping prevents that during active use.
const KEEPALIVE_INTERVAL_MS = 20_000;

function keepAlive() {
  setTimeout(() => {
    chrome.runtime.getPlatformInfo(() => {
      // Accessing any chrome API reactivates the worker
      keepAlive();
    });
  }, KEEPALIVE_INTERVAL_MS);
}
keepAlive();

// ── Tab Monitor ───────────────────────────────────────────────
// Log whenever a monitored tab becomes active/inactive.
chrome.tabs.onActivated?.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      console.log(`[SW] Tab activated → tabId: ${activeInfo.tabId}, URL: ${tab.url}`);
    }
  });
});

// ── Storage Helper ────────────────────────────────────────────
// Persist violation events from content.js for later review.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG_VIOLATION') {
    const { event, url, timestamp } = message.payload;
    chrome.storage.local.get({ violations: [] }, (data) => {
      const violations = data.violations;
      violations.push({ event, url, timestamp });
      chrome.storage.local.set({ violations }, () => {
        console.log(`[SW] Violation logged: "${event}" at ${url}`);
        sendResponse({ status: 'saved' });
      });
    });
    return true; // keep message channel open for async response
  }

  if (message.type === 'GET_VIOLATIONS') {
    chrome.storage.local.get({ violations: [] }, (data) => {
      sendResponse({ violations: data.violations });
    });
    return true;
  }

  if (message.type === 'CLEAR_VIOLATIONS') {
    chrome.storage.local.set({ violations: [] }, () => {
      console.log('[SW] Violation log cleared.');
      sendResponse({ status: 'cleared' });
    });
    return true;
  }
});

console.log("[Stealth Watcher v3] Service worker ready. Listening for messages.");
