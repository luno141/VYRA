/**
 * VYRA Phishing Guard — Popup Script
 */

(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const statusIcon   = document.getElementById('status-icon');
  const statusText   = document.getElementById('status-text');
  const headerBadge  = document.getElementById('header-badge');
  const urlScheme    = document.getElementById('url-scheme');
  const urlDisplay   = document.getElementById('url-display');
  const confSection  = document.getElementById('conf-section');
  const confPct      = document.getElementById('conf-pct');
  const confFill     = document.getElementById('conf-fill');
  const shapMini     = document.getElementById('shap-mini');
  const shapList     = document.getElementById('shap-mini-list');
  const btnScan      = document.getElementById('btn-scan');
  const btnScanText  = document.getElementById('btn-scan-text');
  const scanSpinner  = document.getElementById('scan-spinner');
  const errorNotice  = document.getElementById('error-notice');
  const statScans    = document.getElementById('stat-scans');
  const statThreats  = document.getElementById('stat-threats');

  let currentTabUrl  = '';

  // ── Helpers ───────────────────────────────────────────────────────────────

  function escHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function setScanning() {
    statusIcon.className  = 'shield-big scanning';
    statusIcon.textContent = '🔄';
    statusText.className  = 'status-label scanning';
    statusText.textContent = 'Scanning…';
    headerBadge.className  = 'badge badge-unknown';
    headerBadge.textContent = 'SCANNING';
    scanSpinner.style.display = 'block';
    btnScanText.textContent   = 'Scanning…';
    btnScan.disabled = true;
    errorNotice.style.display = 'none';
  }

  function setSafe(confidence) {
    statusIcon.className   = 'shield-big safe';
    statusIcon.textContent  = '🛡️';
    statusText.className   = 'status-label safe';
    statusText.textContent  = 'SAFE';
    headerBadge.className   = 'badge badge-safe';
    headerBadge.textContent = '✓ Safe';
    resetScanBtn();
    renderConfidence(confidence, false);
  }

  function setPhishing(confidence) {
    statusIcon.className   = 'shield-big phishing';
    statusIcon.textContent  = '⚠️';
    statusText.className   = 'status-label phishing';
    statusText.textContent  = 'PHISHING DETECTED';
    headerBadge.className   = 'badge badge-phishing';
    headerBadge.textContent = '⚠ Phishing';
    resetScanBtn();
    renderConfidence(confidence, true);
  }

  function setUnknown() {
    statusIcon.className   = 'shield-big unknown';
    statusIcon.textContent  = '🛡️';
    statusText.className   = 'status-label unknown';
    statusText.textContent  = 'Not scanned yet';
    headerBadge.className   = 'badge badge-unknown';
    headerBadge.textContent = '—';
    resetScanBtn();
  }

  function resetScanBtn() {
    scanSpinner.style.display = 'none';
    btnScanText.textContent   = '🔍 Scan Current Tab';
    btnScan.disabled = false;
  }

  function showError(msg) {
    errorNotice.textContent   = '⚠ ' + msg;
    errorNotice.style.display = 'block';
    resetScanBtn();
    setUnknown();
  }

  function renderConfidence(rawConf, isDanger) {
    const pct = Math.round((rawConf || 0) * 100);
    confSection.style.display = 'block';
    confPct.textContent = pct + '%';
    confPct.className   = 'conf-pct ' + (isDanger ? 'danger' : 'safe');
    confFill.style.width = Math.min(pct, 100) + '%';
    confFill.className  = 'progress-fill ' + (isDanger ? 'danger' : 'safe');
  }

  function renderShapMini(features) {
    if (!features || typeof features !== 'object') return;
    const entries = Object.entries(features)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 5);
    if (entries.length === 0) return;

    const maxAbs = Math.max(...entries.map(([,v]) => Math.abs(v)));
    shapList.innerHTML = '';

    entries.forEach(([name, value]) => {
      const pctBar = maxAbs > 0 ? (Math.abs(value) / maxAbs) * 100 : 0;
      const isPos  = value > 0;
      const li = document.createElement('li');
      li.className = 'feature-item';
      li.innerHTML = `
        <div class="feature-bar-wrap">
          <div class="feature-name">${escHtml(name)}</div>
          <div class="feature-bar-bg">
            <div class="feature-bar-fill ${isPos ? 'positive' : 'negative'}"
                 style="width:${pctBar.toFixed(1)}%"></div>
          </div>
        </div>
        <span class="feature-value ${isPos ? 'text-red' : 'text-green'}">
          ${isPos ? '+' : ''}${value.toFixed(3)}
        </span>
      `;
      shapList.appendChild(li);
    });

    shapMini.style.display = 'block';
  }

  function applyResult(result) {
    if (!result) { setUnknown(); return; }

    const { prediction, confidence, shap_features } = result;

    if (prediction === 'phishing') {
      setPhishing(confidence);
    } else {
      setSafe(confidence);
    }

    shapMini.style.display = 'none';
    shapList.innerHTML = '';
    if (shap_features) renderShapMini(shap_features);
  }

  // ── URL display ───────────────────────────────────────────────────────────

  function displayUrl(url) {
    try {
      const parsed  = new URL(url);
      urlScheme.textContent  = parsed.protocol + '//';
      urlDisplay.textContent = parsed.host + parsed.pathname.slice(0, 40) +
        (parsed.pathname.length > 40 ? '…' : '');
    } catch (_) {
      urlScheme.textContent  = '';
      urlDisplay.textContent = url.slice(0, 55) + (url.length > 55 ? '…' : '');
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  function loadStats() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (resp) => {
      if (chrome.runtime.lastError || !resp) return;
      statScans.textContent   = resp.scansToday;
      statThreats.textContent = resp.threatsToday;
    });
  }

  // ── Scan ──────────────────────────────────────────────────────────────────

  function scanCurrentTab() {
    if (!currentTabUrl || !currentTabUrl.startsWith('http')) {
      showError('Cannot scan this page (not an HTTP/S URL).');
      return;
    }

    setScanning();

    chrome.runtime.sendMessage(
      { type: 'SCAN_URL', url: currentTabUrl },
      (response) => {
        if (chrome.runtime.lastError) {
          showError('Extension error: ' + chrome.runtime.lastError.message);
          return;
        }
        if (!response || !response.success) {
          showError(response?.error || 'API call failed. Is the VYRA server running?');
          return;
        }
        applyResult(response.result);
        loadStats();
      }
    );
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  function init() {
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.url) {
        displayUrl('—');
        setUnknown();
        return;
      }

      currentTabUrl = tab.url;
      displayUrl(currentTabUrl);

      // Check storage for cached result
      chrome.runtime.sendMessage(
        { type: 'GET_CACHED_RESULT', url: currentTabUrl },
        (response) => {
          if (chrome.runtime.lastError) { setUnknown(); return; }
          if (response && response.result) {
            applyResult(response.result);
          } else {
            setUnknown();
          }
        }
      );
    });

    loadStats();

    btnScan.addEventListener('click', scanCurrentTab);
  }

  init();
})();
