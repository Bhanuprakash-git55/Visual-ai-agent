// Utility helpers for the extension

// Returns an ISO timestamp string suitable for Activity objects
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Generate a UUID for activity/event identifiers.
// Prefer crypto.randomUUID when available; fall back for older environments.
export function generateUUID() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// TODO: Add other shared utilities (size-limited storage, safe JSON parse/stringify, etc.)
