// options.js - save settings using chrome.storage.sync

const KEY_INTERVAL = 'autoCaptureIntervalSec';
const KEY_ENABLED = 'enableMonitoring';

function $(id) { return document.getElementById(id); }

async function loadSettings() {
  const data = await chrome.storage.sync.get([KEY_INTERVAL, KEY_ENABLED]);
  const interval = data[KEY_INTERVAL] !== undefined ? data[KEY_INTERVAL] : 10;
  const enabled = data[KEY_ENABLED] !== undefined ? data[KEY_ENABLED] : false;

  $('interval').value = interval;
  $('enable-monitoring').checked = enabled;
}

async function saveSettings() {
  const interval = Number($('interval').value) || 10;
  const enabled = $('enable-monitoring').checked;

  await chrome.storage.sync.set({ [KEY_INTERVAL]: interval, [KEY_ENABLED]: enabled });

  // Inform the user
  const msg = $('message');
  msg.textContent = 'Settings saved';
  setTimeout(() => { msg.textContent = ''; }, 1500);

  // Notify background if monitoring should start/stop
  if (enabled) {
    chrome.runtime.sendMessage({ cmd: 'start-monitoring' });
  } else {
    chrome.runtime.sendMessage({ cmd: 'stop-monitoring' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  $('btn-save').addEventListener('click', saveSettings);
});
