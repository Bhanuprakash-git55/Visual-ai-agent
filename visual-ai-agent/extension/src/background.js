// Background service worker (Manifest V3) - ES Module
// This file is intentionally minimal and production-ready as a foundation.
// It logs a clear startup message and exposes a small surface to control
// the ActivityService. No data capture or backend communication is implemented here.

import { ActivityService } from './services/activityService.js';
import { ScreenshotService } from './services/ScreenshotService.js';

// Centralized activity persistence/monitoring state service.
const activityService = new ActivityService();
const screenshotService = new ScreenshotService();
const WINDOW_FOCUS_DEBOUNCE_MS = 300;
let lastWindowFocusChange = { windowId: null, atMs: 0 };

// Log startup so extension loading can be verified in chrome://extensions
console.info('Visual AI Agent Background Started');

async function ensureStorageDefaults() {
  const data = await chrome.storage.local.get(['monitoring', 'activities', 'screenshots']);
  const patch = {};
  if (typeof data.monitoring !== 'boolean') {
    patch.monitoring = false;
  }
  if (!Array.isArray(data.activities)) {
    patch.activities = [];
  }
  if (!Array.isArray(data.screenshots)) {
    patch.screenshots = [];
  }
  if (Object.keys(patch).length > 0) {
    await chrome.storage.local.set(patch);
  }
}

async function captureTabActivity(eventType, tab) {
  const activity = {
    eventType,
    url: tab && tab.url ? tab.url : null,
    title: tab && tab.title ? tab.title : null,
    tabId: tab && typeof tab.id === 'number' ? tab.id : null,
    windowId: tab && typeof tab.windowId === 'number' ? tab.windowId : null,
  };
  console.debug('Received Activity', activity);
  await activityService.captureActivity(activity);
}

async function captureWindowActivity(eventType, windowId) {
  const activity = {
    eventType,
    url: null,
    title: null,
    tabId: null,
    windowId: typeof windowId === 'number' ? windowId : null,
  };
  console.debug('Received Activity', activity);
  await activityService.captureActivity(activity);
}

async function initializeBackgroundState() {
  await ensureStorageDefaults();
  const monitoring = await activityService.isMonitoringEnabled();
  if (monitoring) {
    screenshotService.startCapture();
  } else {
    screenshotService.stopCapture();
  }
}

void initializeBackgroundState();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.cmd) {
    return;
  }

  (async () => {
    switch (message.cmd) {
      case 'start-monitoring':
        await activityService.startMonitoring();
        screenshotService.startCapture();
        console.info('Background: start-monitoring received');
        sendResponse({ ok: true, monitoring: true });
        break;
      case 'stop-monitoring':
        await activityService.stopMonitoring();
        screenshotService.stopCapture();
        console.info('Background: stop-monitoring received');
        sendResponse({ ok: true, monitoring: false });
        break;
      case 'get-monitoring-state': {
        const monitoring = await activityService.isMonitoringEnabled();
        sendResponse({ ok: true, monitoring });
        break;
      }
      case 'get-activities': {
        const activities = await activityService.getActivities();
        sendResponse({ ok: true, activities });
        break;
      }
      case 'get-screenshots': {
        const screenshots = await screenshotService.getScreenshots();
        sendResponse({ ok: true, screenshots });
        break;
      }
      case 'get-stats': {
        const [activities, screenshots, monitoring] = await Promise.all([
          activityService.getActivities(),
          screenshotService.getScreenshots(),
          activityService.isMonitoringEnabled(),
        ]);
        sendResponse({
          ok: true,
          monitoring,
          activitiesCount: activities.length,
          screenshotsCount: screenshots.length,
        });
        break;
      }
      case 'clear-activities':
        await activityService.clearActivities();
        sendResponse({ ok: true });
        break;
      case 'clear-screenshots':
        await screenshotService.clearScreenshots();
        sendResponse({ ok: true });
        break;
      case 'content-activity': {
        const tab = sender && sender.tab ? sender.tab : null;
        const input = message.activity || {};
        console.debug('Received Activity', input);
        await activityService.captureActivity({
          eventType: input.eventType || 'UNKNOWN',
          url: input.url || (tab ? tab.url : null),
          title: input.title || (tab ? tab.title : null),
          tabId: typeof input.tabId === 'number' ? input.tabId : (tab ? tab.id : null),
          windowId: typeof input.windowId === 'number' ? input.windowId : (tab ? tab.windowId : null),
        });
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ ok: false, error: 'UNKNOWN_COMMAND' });
        break;
    }
  })().catch((error) => {
    console.error('Background command error:', error);
    sendResponse({ ok: false, error: String(error) });
  });

  return true;
});

// Tab activation monitoring
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId).then((tab) => {
    return captureTabActivity('TAB_ACTIVATION', tab);
  }).catch((error) => {
    console.error('tabs.onActivated error:', error);
  });
});

// URL change monitoring (navigations handled by tab updates)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (typeof changeInfo.url === 'string' && changeInfo.url.length > 0) {
    void captureTabActivity('URL_CHANGE', tab).catch((error) => {
      console.error('tabs.onUpdated error:', error);
    });
  }
});

// Browser window focus monitoring
chrome.windows.onFocusChanged.addListener((windowId) => {
  const now = Date.now();
  const isDuplicateWithinDebounce =
    lastWindowFocusChange.windowId === windowId &&
    (now - lastWindowFocusChange.atMs) < WINDOW_FOCUS_DEBOUNCE_MS;

  if (isDuplicateWithinDebounce) {
    return;
  }

  lastWindowFocusChange = { windowId, atMs: now };

  void captureWindowActivity('WINDOW_FOCUS_CHANGE', windowId).catch((error) => {
    console.error('windows.onFocusChanged error:', error);
  });
});
