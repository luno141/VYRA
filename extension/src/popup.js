(function () {
  'use strict';

  const statusBadge   = document.getElementById('status-badge');
  const urlScheme     = document.getElementById('url-scheme');
  const urlDisplay    = document.getElementById('url-display');

  const verdictCard   = document.getElementById('verdict-card');
  const verdictBadge  = document.getElementById('verdict-badge');
  const riskScoreEl   = document.getElementById('risk-score');
  const scoreBar      = document.getElementById('score-bar');

  const subMlScore    = document.getElementById('sub-ml-score');
  const subMlTag      = document.getElementById('sub-ml-tag');
  const subFeedScore  = document.getElementById('sub-feed-score');
  const subFeedTag    = document.getElementById('sub-feed-tag');
  const subTlsVal     = document.getElementById('sub-tls-val');
  const subTlsTag     = document.getElementById('sub-tls-tag');
  const subDomainVal  = document.getElementById('sub-domain-val');
  const subDomainTag  = document.getElementById('sub-domain-tag');

  const shapContainer = document.getElementById('shap-container');
  const shapList      = document.getElementById('shap-mini-list');
  const chainBlockNum = document.getElementById('chain-block-num');

  const btnScan       = document.getElementById('btn-scan');
  const btnScanText   = document.getElementById('btn-scan-text');
  const statScans     = document.getElementById('stat-scans');
  const statThreats   = document.getElementById('stat-threats');

  let currentTabUrl = '';

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function setBadge(el, cls, text) {
    el.className = 'badge ' + cls;
    el.textContent = text;
  }

  function setScanning() {
    setBadge(statusBadge, 'badge-warn', 'Scanning…');
    btnScanText.textContent = '⚡ Scanning…';
    btnScan.disabled = true;
  }

  function resetBtn() {
    btnScanText.textContent = '⚡ Scan This Page';
    btnScan.disabled = false;
  }

  function renderShap(features) {
    if (!features || typeof features !== 'object') {
      shapContainer.style.display = 'none';
      return;
    }
    const entries = Object.entries(features)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 4);

    if (!entries.length) { shapContainer.style.display = 'none'; return; }

    const maxVal = Math.max(...entries.map(([, v]) => Math.abs(v))) || 1;
    shapList.innerHTML = '';
    entries.forEach(([name, value]) => {
      const pct = Math.min((Math.abs(value) / maxVal) * 100, 100);
      const isRisk = value > 0;
      const row = document.createElement('div');
      row.className = 'feat-row';
      row.innerHTML = `
        <span class="feat-name" title="${esc(name)}">${esc(name.replace(/_/g,' '))}</span>
        <div class="feat-bar-bg">
          <div class="feat-bar-fill ${isRisk ? 'fill-risk' : 'fill-safe'}" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <span class="feat-val ${isRisk ? 'text-red' : 'text-green'}">${isRisk ? '+' : ''}${value.toFixed(2)}</span>
      `;
      shapList.appendChild(row);
    });
    shapContainer.style.display = 'block';
  }

  function applyResult(result) {
    resetBtn();
    if (!result) return;

    const isPhishing = result.prediction === 'phishing';

    // ── Compute clean, sensible numbers ──────────────────────────────────────

    // Risk score: use risk_score from API (0-100), fall back to confidence*100
    let riskScore = typeof result.risk_score === 'number'
      ? Math.round(result.risk_score * 10) / 10   // one decimal
      : Math.round((result.confidence || 0) * 100);
    riskScore = Math.min(Math.max(riskScore, 0), 100);

    // ML confidence as % (0-100)
    const mlPct = Math.round((result.confidence || 0) * 100);

    // Threat intelligence score (0-100 integer from API or 0 fallback)
    const threatScore = typeof result.threat_intel?.threat_score === 'number'
      ? result.threat_intel.threat_score
      : (isPhishing ? 70 : 0);

    // ── Primary verdict display ───────────────────────────────────────────────
    riskScoreEl.textContent = riskScore.toFixed(0);
    scoreBar.style.width = riskScore + '%';

    if (isPhishing) {
      setBadge(statusBadge, 'badge-threat', 'Threat Detected');
      setBadge(verdictBadge, 'badge-threat', 'Phishing');
      scoreBar.style.background = 'var(--red)';
      riskScoreEl.style.color   = 'var(--red)';
      verdictCard.style.borderColor = 'rgba(240,64,96,0.4)';
    } else {
      setBadge(statusBadge, 'badge-safe', 'Safe');
      setBadge(verdictBadge, 'badge-safe', 'Legitimate');
      scoreBar.style.background = 'var(--green)';
      riskScoreEl.style.color   = 'var(--green)';
      verdictCard.style.borderColor = 'rgba(62,207,122,0.35)';
    }

    // ── Pillar 1: ML Confidence ───────────────────────────────────────────────
    subMlScore.textContent = mlPct + '%';
    if (mlPct >= 70 && isPhishing) {
      setBadge(subMlTag, 'badge-threat', 'Anomalous');
    } else if (mlPct >= 70) {
      setBadge(subMlTag, 'badge-warn', 'Borderline');
    } else {
      setBadge(subMlTag, 'badge-safe', 'Normal');
    }

    // ── Pillar 2: Threat Intelligence Feeds ──────────────────────────────────
    subFeedScore.textContent = threatScore + ' / 100';
    const isKnownPhish = result.threat_intel?.is_known_phishing === true;
    if (isKnownPhish || threatScore >= 70) {
      const level = result.threat_intel?.threat_level || 'critical';
      setBadge(subFeedTag, 'badge-threat', level.charAt(0).toUpperCase() + level.slice(1));
    } else if (threatScore >= 30) {
      setBadge(subFeedTag, 'badge-warn', 'Suspicious');
    } else {
      setBadge(subFeedTag, 'badge-safe', 'Clean');
    }

    // ── Pillar 3: TLS / Protocol ──────────────────────────────────────────────
    const isHttps = currentTabUrl.startsWith('https://');
    subTlsVal.textContent = isHttps ? 'HTTPS / TLS' : 'HTTP (Unencrypted)';
    setBadge(subTlsTag, isHttps ? 'badge-safe' : 'badge-threat', isHttps ? 'Encrypted' : 'Insecure');

    // ── Pillar 4: Domain Age ──────────────────────────────────────────────────
    const ageDays = result.threat_intel?.domain_age_days;
    if (typeof ageDays === 'number' && ageDays >= 0) {
      subDomainVal.textContent = ageDays >= 365
        ? Math.floor(ageDays / 365) + ' yr' + (Math.floor(ageDays / 365) > 1 ? 's' : '')
        : ageDays + ' days';
      if (ageDays < 14)       setBadge(subDomainTag, 'badge-threat', 'Brand New');
      else if (ageDays < 60)  setBadge(subDomainTag, 'badge-warn',   'Recent');
      else                    setBadge(subDomainTag, 'badge-safe',   'Established');
    } else {
      subDomainVal.textContent = isPhishing ? 'Unknown' : 'Established';
      setBadge(subDomainTag, isPhishing ? 'badge-warn' : 'badge-safe', isPhishing ? 'Unknown' : 'Trusted');
    }

    // ── SHAP feature attribution ──────────────────────────────────────────────
    let shapFeatures = result.shap_features;
    if (!shapFeatures && Array.isArray(result.shap_explanations)) {
      shapFeatures = {};
      result.shap_explanations.forEach(item => {
        shapFeatures[item.feature] = item.shap_value;
      });
    }
    renderShap(shapFeatures);

    // ── Blockchain block ──────────────────────────────────────────────────────
    const blockIdx = result.blockchain_block?.index ?? result.blockchain?.block_index;
    chainBlockNum.textContent = typeof blockIdx === 'number' ? `Block #${blockIdx}` : 'Block #—';
  }

  function displayUrl(url) {
    try {
      const p = new URL(url);
      urlScheme.textContent = p.protocol + '//';
      urlDisplay.textContent = p.host + (p.pathname !== '/' ? p.pathname.slice(0, 28) : '');
    } catch (_) {
      urlScheme.textContent = '';
      urlDisplay.textContent = url.slice(0, 38);
    }
  }

  function scanCurrent() {
    if (!currentTabUrl) return;
    setScanning();
    chrome.runtime.sendMessage({ type: 'SCAN_URL', url: currentTabUrl }, (resp) => {
      if (resp && resp.success && resp.result) {
        applyResult(resp.result);
      } else {
        resetBtn();
        setBadge(statusBadge, 'badge-dim', 'Backend Offline');
      }
    });
  }

  function init() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length) return;
      currentTabUrl = tabs[0].url || '';
      displayUrl(currentTabUrl);

      chrome.runtime.sendMessage({ type: 'GET_CACHED_RESULT', url: currentTabUrl }, (resp) => {
        if (resp && resp.result) {
          applyResult(resp.result);
        } else {
          scanCurrent();
        }
      });
    });

    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (stats) => {
      if (!stats) return;
      statScans.textContent   = stats.scansToday   || 0;
      statThreats.textContent = stats.threatsToday || 0;
    });

    btnScan.addEventListener('click', scanCurrent);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
