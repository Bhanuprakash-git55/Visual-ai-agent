// ActivityService - centralizes creation of Activity objects and periodic screenshots
// Responsibilities:
// - Accept normalized events from background and content scripts via recordEvent
// - Maintain minimal state (lastEventType, lastTab info)
// - Every intervalMs milliseconds, capture a screenshot of the visible tab and assemble
//   an Activity object of the shape:
//   { timestamp, url, title, eventType, tabId, windowId, screenshot }

// Implementation notes:
// - Uses chrome.tabs.captureVisibleTab for screenshots
// - Uses chrome.tabs.query to fetch the active tab metadata
// - Uses Promises to wrap callback-based chrome API
// - In MV3 service workers can be suspended; setInterval may not run reliably. Consider
//   alarms or native helpers for strict sampling guarantees.

function chromeApiPromise(fn, ...args) {
  return new Promise((resolve, reject) => {
    try {
      fn(...args, (result) => {
        const err = chrome.runtime.lastError;
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    } catch (e) {
      reject(e);
    }
  });
}

export class ActivityService {
  constructor(options = {}) {
    this.intervalMs = options.intervalMs || 10000;
    this._timer = null;
    this._running = false;
    this._lastEventType = 'init';
    this._lastTab = null; // { tabId, windowId, url, title }
    this._listeners = [];
  }

  isRunning() {
    return this._running;
  }

  start() {
    if (this._running) return;
    // Start capturing interval
    this._timer = setInterval(() => this._captureHeartbeat(), this.intervalMs);
    this._running = true;
    console.debug('ActivityService started, intervalMs=', this.intervalMs);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._running = false;
    console.debug('ActivityService stopped');
  }

  onActivity(callback) {
    if (typeof callback === 'function') this._listeners.push(callback);
  }

  _emit(activity) {
    // Notify in-memory listeners (popup/UI) and log to console. Persisting or sending
    // to the backend is intentionally omitted per requirements.
    for (const l of this._listeners) {
      try { l(activity); } catch (e) { console.warn('Activity listener error', e); }
    }
    console.info('Activity captured', activity.eventType, activity.timestamp, activity.url);
  }

  recordEvent(evt) {
    // evt should contain: timestamp, eventType, tabId, windowId, url, title, payload
    this._lastEventType = evt.eventType || this._lastEventType;
    if (evt.tabId || evt.windowId || evt.url || evt.title) {
      this._lastTab = {
        tabId: evt.tabId || (this._lastTab && this._lastTab.tabId) || null,
        windowId: evt.windowId || (this._lastTab && this._lastTab.windowId) || null,
        url: evt.url || (this._lastTab && this._lastTab.url) || null,
        title: evt.title || (this._lastTab && this._lastTab.title) || null
      };
    }

    // Create a lightweight activity (no screenshot) for the incoming event
    const activity = {
      timestamp: new Date().toISOString(),
      url: this._lastTab ? this._lastTab.url : evt.url || null,
      title: this._lastTab ? this._lastTab.title : evt.title || null,
      eventType: evt.eventType,
      tabId: this._lastTab ? this._lastTab.tabId : evt.tabId || null,
      windowId: this._lastTab ? this._lastTab.windowId : evt.windowId || null,
      screenshot: null,
      payload: evt.payload || null
    };

    // Emit immediate lightweight event (no screenshot)
    this._emit(activity);
  }

  async _captureHeartbeat() {
    try {
      // Get active tab in the last focused window
      const tabs = await chromeApiPromise(chrome.tabs.query, { active: true, lastFocusedWindow: true });
      const active = Array.isArray(tabs) && tabs.length ? tabs[0] : null;

      // Capture visible tab screenshot (current window). Passing windowId is optional.
      // If capture fails (permissions, inactive), handle gracefully.
      let screenshot = null;
      try {
        screenshot = await chromeApiPromise(chrome.tabs.captureVisibleTab, active ? active.windowId : undefined, { format: 'png', quality: 70 });
      } catch (err) {
        // Non-fatal: screenshot may fail if capture not allowed
        console.warn('Screenshot capture failed:', err && err.message);
        screenshot = null;
      }

      const activity = {
        timestamp: new Date().toISOString(),
        url: active ? active.url : (this._lastTab ? this._lastTab.url : null),
        title: active ? active.title : (this._lastTab ? this._lastTab.title : null),
        eventType: this._lastEventType || 'heartbeat',
        tabId: active ? active.id : (this._lastTab ? this._lastTab.tabId : null),
        windowId: active ? active.windowId : (this._lastTab ? this._lastTab.windowId : null),
        screenshot: screenshot,
      };

      // Emit the heartbeat activity (includes screenshot when available)
      this._emit(activity);

    } catch (err) {
      console.error('Error in captureHeartbeat:', err);
    }
  }
}
