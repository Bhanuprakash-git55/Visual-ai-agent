// ActivityService persists browser activity to chrome.storage.local.
// Architectural decision:
// - Keep all activity write/read logic centralized here so background/content/UI
//   modules stay small and only forward events or consume state.
// - Monitoring state is stored in chrome.storage.local so behavior survives page
//   refreshes and service worker restarts.

import { generateUUID, getCurrentTimestamp } from '../utils/utils.js';

export class ActivityService {
  constructor(options = {}) {
    this.options = Object.assign({
      activitiesKey: 'activities',
      monitoringKey: 'monitoring',
    }, options);
    // Serialize activity writes to avoid read-modify-write races in storage.
    this._activityWriteQueue = Promise.resolve();
  }

  async startMonitoring() {
    await chrome.storage.local.set({ [this.options.monitoringKey]: true });
  }

  async stopMonitoring() {
    await chrome.storage.local.set({ [this.options.monitoringKey]: false });
  }

  async captureActivity(activity) {
    const appendActivity = async () => {
      const monitoring = await this.isMonitoringEnabled();
      if (!monitoring) {
        return null;
      }

      const record = {
        id: generateUUID(),
        timestamp: getCurrentTimestamp(),
        url: activity && activity.url ? activity.url : null,
        title: activity && activity.title ? activity.title : null,
        eventType: activity && activity.eventType ? activity.eventType : 'UNKNOWN',
        tabId: activity && typeof activity.tabId === 'number' ? activity.tabId : null,
        windowId: activity && typeof activity.windowId === 'number' ? activity.windowId : null,
      };

      const data = await chrome.storage.local.get([this.options.activitiesKey]);
      const existingActivities = Array.isArray(data[this.options.activitiesKey]) ? data[this.options.activitiesKey] : [];
      const nextActivities = existingActivities.concat(record);

      console.debug('Writing Activity', record);
      await chrome.storage.local.set({ [this.options.activitiesKey]: nextActivities });
      const afterWrite = await chrome.storage.local.get([this.options.activitiesKey]);
      const storedActivities = Array.isArray(afterWrite[this.options.activitiesKey]) ? afterWrite[this.options.activitiesKey] : [];
      console.debug('Storage After Write', storedActivities);

      const wasPersisted = storedActivities.some((item) => item && item.id === record.id);
      if (!wasPersisted) {
        throw new Error('Activity persistence verification failed');
      }

      console.info('[Activity]', record.eventType, record.url, record.timestamp);
      return record;
    };

    this._activityWriteQueue = this._activityWriteQueue.then(appendActivity, appendActivity);
    return this._activityWriteQueue;
  }

  async getActivities() {
    const data = await chrome.storage.local.get([this.options.activitiesKey]);
    return Array.isArray(data[this.options.activitiesKey]) ? data[this.options.activitiesKey] : [];
  }

  async clearActivities() {
    await chrome.storage.local.set({ [this.options.activitiesKey]: [] });
  }

  async isMonitoringEnabled() {
    const data = await chrome.storage.local.get([this.options.monitoringKey]);
    return data[this.options.monitoringKey] === true;
  }
}
