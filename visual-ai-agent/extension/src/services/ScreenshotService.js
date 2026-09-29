import { generateUUID, getCurrentTimestamp } from '../utils/utils.js';

export class ScreenshotService {
  constructor(options = {}) {
    this.options = Object.assign({
      screenshotsKey: 'screenshots',
      monitoringKey: 'monitoring',
      intervalMs: 2000,
      maxScreenshots: 20,
    }, options);
    this._timer = null;
    this._writeQueue = Promise.resolve();
    // Keep raw image data in memory only.
    // This avoids chrome.storage.local quota pressure from large Base64 payloads.
    this.memoryScreenshots = new Map();
  }

  startCapture() {
    if (this._timer !== null) {
      return;
    }

    this._timer = setInterval(() => {
      void this.capture();
    }, this.options.intervalMs);
  }

  stopCapture() {
    if (this._timer !== null) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  async capture() {
    const monitoring = await this._isMonitoringEnabled();
    if (!monitoring) {
      return null;
    }

    const appendScreenshot = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        const tab = Array.isArray(tabs) && tabs.length > 0 ? tabs[0] : null;
        if (!tab || typeof tab.windowId !== 'number') {
          return null;
        }

        const image = await new Promise((resolve, reject) => {
          chrome.tabs.captureVisibleTab(
            tab.windowId,
            { format: 'png' },
            (dataUrl) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
              }
              resolve(dataUrl);
            }
          );
        });

        const metadata = {
          id: generateUUID(),
          timestamp: getCurrentTimestamp(),
          tabId: typeof tab.id === 'number' ? tab.id : null,
          windowId: tab.windowId,
          url: tab.url || null,
          title: tab.title || null,
          uploaded: false,
        };

        this.memoryScreenshots.set(metadata.id, image);

        const data = await chrome.storage.local.get([this.options.screenshotsKey]);
        const existing = Array.isArray(data[this.options.screenshotsKey]) ? data[this.options.screenshotsKey] : [];
        const sanitizedExisting = existing.map((item) => this._toMetadata(item));
        const next = sanitizedExisting.concat(metadata).slice(-this.options.maxScreenshots);

        // Persist only lightweight metadata in chrome.storage.local.
        // Image bytes remain in memory to prevent quota exceeded errors.
        // Keep in-memory buffer aligned with retained metadata (latest N only).
        const validIds = new Set(next.map((item) => item.id));
        for (const id of this.memoryScreenshots.keys()) {
          if (!validIds.has(id)) {
            this.memoryScreenshots.delete(id);
          }
        }

        console.log('METADATA', metadata);
        console.log('NEXT', next[next.length - 1]);
        await chrome.storage.local.set({ [this.options.screenshotsKey]: next });
        const verify = await chrome.storage.local.get(this.options.screenshotsKey);
        const stored = Array.isArray(verify[this.options.screenshotsKey]) ? verify[this.options.screenshotsKey] : [];
        console.log('STORED', stored.at(-1));

        console.info(
          '[Capture] Success',
          'Image Size',
          image.length,
          'Metadata Stored',
          metadata
        );
        return metadata;
      } catch (error) {
        // Restricted pages, missing permissions, or browser states may block capture.
        console.warn('Screenshot capture skipped:', error);
        return null;
      }
    };

    this._writeQueue = this._writeQueue.then(appendScreenshot, appendScreenshot);
    return this._writeQueue;
  }

  async getScreenshots() {
    const data = await chrome.storage.local.get([this.options.screenshotsKey]);
    const stored = Array.isArray(data[this.options.screenshotsKey]) ? data[this.options.screenshotsKey] : [];
    const sanitized = stored.map((item) => this._toMetadata(item));
    if (JSON.stringify(stored) !== JSON.stringify(sanitized)) {
      await chrome.storage.local.set({ [this.options.screenshotsKey]: sanitized });
    }
    return sanitized;
  }

  getImage(id) {
    if (!id) {
      return null;
    }
    return this.memoryScreenshots.get(id) || null;
  }

  removeImage(id) {
    if (!id) {
      return false;
    }
    return this.memoryScreenshots.delete(id);
  }

  clearMemory() {
    this.memoryScreenshots.clear();
  }

  async clearScreenshots() {
    await chrome.storage.local.set({ [this.options.screenshotsKey]: [] });
    this.clearMemory();
  }

  _toMetadata(item) {
    return {
      id: item && item.id ? item.id : generateUUID(),
      timestamp: item && item.timestamp ? item.timestamp : getCurrentTimestamp(),
      tabId: item && typeof item.tabId === 'number' ? item.tabId : null,
      windowId: item && typeof item.windowId === 'number' ? item.windowId : null,
      url: item && item.url ? item.url : null,
      title: item && item.title ? item.title : null,
      uploaded: item && item.uploaded === true,
    };
  }

  async _isMonitoringEnabled() {
    const data = await chrome.storage.local.get([this.options.monitoringKey]);
    return data[this.options.monitoringKey] === true;
  }
}
