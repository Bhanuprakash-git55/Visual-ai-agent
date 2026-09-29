// Content Script monitors page-level user activity and forwards events to background.
// It does not persist data itself; background + ActivityService handle storage.

console.info('Content Script Loaded');

function sendContentActivity(eventType) {
  chrome.runtime.sendMessage({
    cmd: 'content-activity',
    activity: {
      eventType,
      url: window.location.href,
      title: document.title,
    },
  }, () => {
    // Avoid unchecked runtime errors when background is unavailable.
    if (chrome.runtime.lastError) {
      console.debug('content-activity message not delivered:', chrome.runtime.lastError.message);
    }
  });
}

function throttle(fn, waitMs) {
  let lastRunAt = 0;
  return function throttled() {
    const now = Date.now();
    if (now - lastRunAt < waitMs) {
      return;
    }
    lastRunAt = now;
    fn();
  };
}

// 1) Mouse clicks
window.addEventListener('click', () => {
  sendContentActivity('CLICK');
}, { passive: true });

// 2) Scroll events (throttled to avoid noisy writes)
window.addEventListener('scroll', throttle(() => {
  sendContentActivity('SCROLL');
}, 400), { passive: true });

// 3) Keyboard input
// Use capture phase on document so keyboard activity is detected reliably.
document.addEventListener('keydown', () => {
  sendContentActivity('KEYBOARD_INPUT');
}, true);

// 7) Page visibility changes
document.addEventListener('visibilitychange', () => {
  sendContentActivity('PAGE_VISIBILITY_CHANGE');
});

// 4) URL changes for SPA-style navigation
let currentUrl = window.location.href;
function detectUrlChange() {
  const nextUrl = window.location.href;
  if (nextUrl !== currentUrl) {
    currentUrl = nextUrl;
    sendContentActivity('URL_CHANGE');
  }
}

const originalPushState = history.pushState;
history.pushState = function pushStatePatched() {
  const result = originalPushState.apply(this, arguments);
  detectUrlChange();
  return result;
};

const originalReplaceState = history.replaceState;
history.replaceState = function replaceStatePatched() {
  const result = originalReplaceState.apply(this, arguments);
  detectUrlChange();
  return result;
};

window.addEventListener('popstate', detectUrlChange);
window.addEventListener('hashchange', detectUrlChange);
