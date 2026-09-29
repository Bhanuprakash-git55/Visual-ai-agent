Visual AI Agent - Chrome Extension

This folder contains the production-ready foundation for the Visual AI Agent Chrome Extension (Manifest V3).

Structure

extension/
  manifest.json        - MV3 manifest
  popup.html           - Popup UI
  options.html         - Options page
  src/
    background.js      - Background service worker (ES module)
    contentScript.js   - Content script injected into pages
    services/
      activityService.js - Activity service placeholders (start/stop/capture)
    utils/
      utils.js         - Shared utilities (timestamp, uuid)
    ui/
      popup.js         - Popup wiring
      options.js       - Options wiring
  assets/              - icons and other static assets

Notes
- This code intentionally does NOT implement screenshot capture, AI, backend communication, or storage beyond chrome.storage.sync for settings.
- All activity capture logic is left as TODOs in services/activityService.js.
- The extension is constructed to load without manifest errors. To test:
  1. Open chrome://extensions
  2. Enable Developer mode
  3. Load unpacked and select this extension folder

Security and privacy
- Before enabling data collection in production, implement explicit user consent, privacy disclosures, and opt-out.
