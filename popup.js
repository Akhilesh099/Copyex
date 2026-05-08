// popup.js – Handles the Master Toggle for the Stealth Architect

const toggleBtn = document.getElementById('toggle');
const modeBadge = document.getElementById('mode-badge');

// Initialise UI from storage
chrome.storage.local.get(['stealthActive'], (res) => {
  const active = !!res.stealthActive;
  updateUI(active);
});

// Click handler – toggle state, persist, reload current tab
toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['stealthActive'], (res) => {
    const newState = !res.stealthActive;
    chrome.storage.local.set({ stealthActive: newState }, () => {
      updateUI(newState);
      // Refresh the active tab to apply the new logic instantly
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) chrome.tabs.reload(tabs[0].id);
      });
    });
  });
});

function updateUI(active) {
  if (active) {
    modeBadge.textContent = 'ON';
    modeBadge.classList.remove('off');
    modeBadge.classList.add('on');
    toggleBtn.textContent = 'Disable Final Boss';
    toggleBtn.classList.remove('btn-off');
    toggleBtn.classList.add('btn-on');
  } else {
    modeBadge.textContent = 'OFF';
    modeBadge.classList.remove('on');
    modeBadge.classList.add('off');
    toggleBtn.textContent = 'Enable Final Boss';
    toggleBtn.classList.remove('btn-on');
    toggleBtn.classList.add('btn-off');
  }
}
