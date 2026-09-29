// Utility helpers for extension modules

export function safeJson(obj) {
  try { return JSON.stringify(obj); } catch (e) { return String(obj); }
}

// Lightweight promisify for chrome callback APIs not returning Promises
export function chromePromise(fn, ...args) {
  return new Promise((resolve, reject) => {
    try {
      fn(...args, (res) => {
        const err = chrome.runtime.lastError;
        if (err) return reject(err);
        resolve(res);
      });
    } catch (e) {
      reject(e);
    }
  });
}
