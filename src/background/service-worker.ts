// Toolbar icon click → inject page-world bridge + content script into the active tab.
// We do this on click (not via static content_scripts) to keep activation explicit
// (D5 / direction §4).

chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  try {
    // 1. Inject the page-world bridge first (MAIN world — needs window.ng).
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['dist/page-world/signal-bridge.js'],
      world: 'MAIN',
    });
    // 2. Then the content script (ISOLATED — default world).
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['dist/content/content-script.js'],
    });
  } catch (err) {
    console.error('[bvc] activation failed:', err);
  }
});
