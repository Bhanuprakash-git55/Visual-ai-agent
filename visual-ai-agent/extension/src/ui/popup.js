// popup.js - wires popup buttons to background commands (minimal)

function $(id) { return document.getElementById(id); }

function setStatus(text) {
  const el = $('status-label');
  if (el) el.textContent = text;
}

function setStats(activitiesCount, screenshotsCount) {
  const activitiesEl = $('activities-count');
  const screenshotsEl = $('screenshots-count');
  if (activitiesEl) activitiesEl.textContent = String(activitiesCount);
  if (screenshotsEl) screenshotsEl.textContent = String(screenshotsCount);
}

function setButtons(monitoring) {
  const start = $('btn-start');
  const stop = $('btn-stop');
  if (start) start.disabled = monitoring;
  if (stop) stop.disabled = !monitoring;
}

function sendCommand(cmd, callback) {
  chrome.runtime.sendMessage({ cmd }, (resp) => {
    if (chrome.runtime.lastError) {
      console.error('Popup command error:', chrome.runtime.lastError.message);
      return;
    }
    callback(resp);
  });
}

function refreshMonitoringState() {
  sendCommand('get-stats', (resp) => {
    if (!resp || !resp.ok) {
      return;
    }
    const monitoring = Boolean(resp.monitoring);
    setStatus(monitoring ? 'Monitoring' : 'Stopped');
    setButtons(monitoring);
    setStats(resp.activitiesCount || 0, resp.screenshotsCount || 0);
  });
}

function refreshStatsOnly() {
  sendCommand('get-stats', (resp) => {
    if (!resp || !resp.ok) {
      return;
    }
    const monitoring = Boolean(resp && resp.monitoring);
    setStatus(monitoring ? 'Monitoring' : 'Stopped');
    setButtons(monitoring);
    setStats(resp.activitiesCount || 0, resp.screenshotsCount || 0);
  });
}

// Set initial status on load
document.addEventListener('DOMContentLoaded', () => {
  const start = $('btn-start');
  const stop = $('btn-stop');

  start.addEventListener('click', () => {
    sendCommand('start-monitoring', (resp) => {
      console.log('Popup: start-monitoring clicked', resp);
      refreshMonitoringState();
    });
  });

  stop.addEventListener('click', () => {
    sendCommand('stop-monitoring', (resp) => {
      console.log('Popup: stop-monitoring clicked', resp);
      refreshMonitoringState();
    });
  });

  refreshMonitoringState();
  setInterval(refreshStatsOnly, 2000);
});
