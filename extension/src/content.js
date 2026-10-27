/**
 * VYRA Phishing Guard — Content Script
 * Injects a "VYRA Protected" badge and an optional phishing-warning banner.
 */

(function () {
  'use strict';

  const BADGE_ID   = '__vyra_badge__';
  const BANNER_ID  = '__vyra_banner__';

  // ── Badge ────────────────────────────────────────────────────────────────

  function injectBadge(state) {
    if (document.getElementById(BADGE_ID)) return;

    const badge = document.createElement('div');
    badge.id = BADGE_ID;

    const isPhishing = state === 'phishing';
    const color      = isPhishing ? '#c0392b' : '#27ae60';
    const label      = isPhishing ? 'VYRA ⚠ Flagged' : 'VYRA Protected';

    badge.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(15,15,25,0.92);
      border: 1px solid ${color};
      border-radius: 20px;
      padding: 5px 12px 5px 8px;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: ${color};
      cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      backdrop-filter: blur(6px);
      transition: opacity 0.3s;
      user-select: none;
    `;

    const dot = document.createElement('span');
    dot.style.cssText = `
      width: 8px; height: 8px;
      border-radius: 50%;
      background: ${color};
      display: inline-block;
      box-shadow: 0 0 6px ${color};
    `;

    const text = document.createElement('span');
    text.textContent = label;

    badge.appendChild(dot);
    badge.appendChild(text);

    // Clicking badge minimises it
    badge.addEventListener('click', () => {
      badge.style.opacity = badge.style.opacity === '0.2' ? '1' : '0.2';
    });

    document.body.appendChild(badge);
  }

  // ── Warning Banner ────────────────────────────────────────────────────────

  function injectWarningBanner(url, confidence) {
    if (document.getElementById(BANNER_ID)) return;

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 2147483646;
      background: linear-gradient(90deg, #7b0000, #c0392b);
      color: #fff;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 16px rgba(192,57,43,0.7);
    `;

    const left = document.createElement('span');
    left.innerHTML =
      `⚠️ &nbsp;<strong>VYRA PHISHING ALERT</strong> — ` +
      `This page was flagged as phishing with <strong>${(confidence * 100).toFixed(1)}%</strong> confidence. ` +
      `Proceed with extreme caution.`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Dismiss';
    closeBtn.style.cssText = `
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.4);
      color: #fff;
      border-radius: 6px;
      padding: 4px 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
    `;
    closeBtn.addEventListener('click', () => banner.remove());

    banner.appendChild(left);
    banner.appendChild(closeBtn);
    document.body.prepend(banner);
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    const currentUrl = window.location.href;

    // Ask background for cached scan result
    try {
      chrome.runtime.sendMessage(
        { type: 'GET_CACHED_RESULT', url: currentUrl },
        (response) => {
          if (chrome.runtime.lastError) return; // extension context gone
          const result = response && response.result;

          if (result && result.prediction === 'phishing' && result.confidence > 0.7) {
            injectBadge('phishing');
            injectWarningBanner(currentUrl, result.confidence);
          } else {
            injectBadge('safe');
          }
        }
      );
    } catch (_) {
      // Extension not available (e.g., content script loaded standalone)
    }
  }

  // ── Message listener (from background) ────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'VYRA_FLAG') {
      injectBadge('phishing');
      injectWarningBanner(msg.url, msg.confidence);
    }
    if (msg.type === 'VYRA_SAFE') {
      injectBadge('safe');
    }
  });

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
