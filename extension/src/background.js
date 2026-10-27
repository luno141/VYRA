/**
 * VYRA Phishing Guard — Background Service Worker
 * Intercepts navigations, calls /api/scan, redirects phishing pages.
 */

const API_URL      = 'http://localhost:8000/api/scan';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CONFIDENCE_THRESHOLD = 0.7;

// In-memory scan cache: url -> { result, timestamp }
const scanCache = new Map();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns true if url looks like a real http/https page (not an extension/NTP page). */
function isNavigableUrl(url) {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/** Increments a numeric counter in chrome.storage.local. */
async function bumpStat(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (data) => {
      const next = ((data[key] || 0) + 1);
      chrome.storage.local.set({ [key]: next }, resolve);
    });
  });
}

/** Returns today's date string "YYYY-MM-DD" used to scope daily stats. */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Bumps today's scan counter. */
async function bumpDailyScan() {
  const key = `scans_${todayKey()}`;
  await bumpStat(key);
  await bumpStat('scans_total');
}

/** Bumps today's threat counter. */
async function bumpDailyThreat() {
  const key = `threats_${todayKey()}`;
  await bumpStat(key);
  await bumpStat('threats_total');
}

// ─── Core scan logic ─────────────────────────────────────────────────────────

/**
 * Scans a URL via the VYRA backend.
 * Returns { prediction, confidence, shap_features } or null on error.
 */
async function scanUrl(url) {
  // Check in-memory cache first
  const cached = scanCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log('[VYRA] Cache hit:', url);
    return cached.result;
  }

  try {
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.warn('[VYRA] API returned', response.status, 'for', url);
      return null;
    }

    const result = await response.json();

    // Persist in memory cache
    scanCache.set(url, { result, timestamp: Date.now() });

    // Persist in chrome.storage so popup/content can read it
    const storageKey = `scan_${url}`;
    await chrome.storage.local.set({
      [storageKey]: { ...result, scannedAt: Date.now() },
    });

    await bumpDailyScan();
    return result;

  } catch (err) {
    console.error('[VYRA] API error for', url, err);
    return null; // Don't block on error
  }
}

// ─── Navigation interception ─────────────────────────────────────────────────

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle main-frame navigations of real HTTP pages
  if (details.frameId !== 0) return;
  if (!isNavigableUrl(details.url)) return;

  // Prevent scanning the blocked page itself
  if (details.url.includes(chrome.runtime.id)) return;
  if (details.url.includes('blocked.html')) return;

  const url    = details.url;
  const tabId  = details.tabId;

  console.log('[VYRA] Scanning:', url);

  const result = await scanUrl(url);
  if (!result) return; // API failure — allow navigation

  const { prediction, confidence, shap_features } = result;

  if (prediction === 'phishing' && confidence > CONFIDENCE_THRESHOLD) {
    await bumpDailyThreat();

    // Build redirect URL
    const blockedPage = chrome.runtime.getURL('src/blocked.html');
    const shapParam   = shap_features
      ? encodeURIComponent(JSON.stringify(shap_features))
      : '';

    const redirectUrl =
      `${blockedPage}` +
      `?url=${encodeURIComponent(url)}` +
      `&confidence=${encodeURIComponent(confidence.toFixed(4))}` +
      `&shap=${shapParam}`;

    try {
      await chrome.tabs.update(tabId, { url: redirectUrl });
    } catch (e) {
      console.warn('[VYRA] Could not redirect tab', tabId, e);
    }
  }
});

// ─── Message bus ─────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SCAN_URL') {
    const urlToScan = msg.url;
    scanUrl(urlToScan).then((result) => {
      sendResponse({ success: true, result });
    }).catch((err) => {
      sendResponse({ success: false, error: String(err) });
    });
    return true; // keep channel open for async response
  }

  if (msg.type === 'GET_STATS') {
    const today = todayKey();
    chrome.storage.local.get(
      [`scans_${today}`, `threats_${today}`, 'scans_total', 'threats_total'],
      (data) => {
        sendResponse({
          scansToday:    data[`scans_${today}`]    || 0,
          threatsToday:  data[`threats_${today}`]  || 0,
          scansTotal:    data['scans_total']        || 0,
          threatsTotal:  data['threats_total']      || 0,
        });
      }
    );
    return true;
  }

  if (msg.type === 'GET_CACHED_RESULT') {
    const key = `scan_${msg.url}`;
    chrome.storage.local.get([key], (data) => {
      sendResponse({ result: data[key] || null });
    });
    return true;
  }
});

console.log('[VYRA] Background service worker started.');
