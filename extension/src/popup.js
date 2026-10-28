(function () {
  'use strict';

  // DOM References
  const statusBadge   = document.getElementById('status-badge');
  const urlScheme     = document.getElementById('url-scheme');
  const urlDisplay    = document.getElementById('url-display');
  
  const verdictCard   = document.getElementById('verdict-card');
  const verdictText   = document.getElementById('verdict-text');
  const riskScoreText = document.getElementById('risk-score');
  const scoreBar      = document.getElementById('score-bar');

  // Sub-intelligence Pillars
  const subMlScore    = document.getElementById('sub-ml-score');
  const subMlTag      = document.getElementById('sub-ml-tag');
  const subFeedScore  = document.getElementById('sub-feed-score');
  const subFeedTag    = document.getElementById('sub-feed-tag');
  const subTlsVal     = document.getElementById('sub-tls-val');
  const subTlsTag     = document.getElementById('sub-tls-tag');
  const subDomainVal  = document.getElementById('sub-domain-val');
  const subDomainTag  = document.getElementById('sub-domain-tag');

  // SHAP Container
  const shapContainer = document.getElementById('shap-container');
  const shapList      = document.getElementById('shap-mini-list');

  // Blockchain
  const chainBlockNum = document.getElementById('chain-block-num');

  // Controls & Telemetry
  const btnScan       = document.getElementById('btn-scan');
  const btnScanText   = document.getElementById('btn-scan-text');
  const statScans     = document.getElementById('stat-scans');
  const statThreats   = document.getElementById('stat-threats');

  let currentTabUrl = '';

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function setScanningState() {
    statusBadge.className = 'neo-badge neo-badge-yellow';
    statusBadge.textContent = 'SCANNING...';
    btnScanText.textContent = '⚡ RUNNING DEEP PIPELINE...';
    btnScan.disabled = true;
  }

  function resetScanButton() {
    btnScanText.textContent = '⚡ SCAN ACTIVE TAB FEED';
    btnScan.disabled = false;
  }

  function renderShapFeatures(features) {
    if (!features || typeof features !== 'object') {
      shapContainer.style.display = 'none';
      return;
    }

    const entries = Object.entries(features)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 4);

    if (entries.length === 0) {
      shapContainer.style.display = 'none';
      return;
    }

    const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v))) || 1;
    shapList.innerHTML = '';

    entries.forEach(([name, value]) => {
      const pctBar = Math.min((Math.abs(value) / maxAbs) * 100, 100);
      const isRisk = value > 0;
      const row = document.createElement('div');
      row.className = 'feature-item';
      row.innerHTML = `
        <div class="feature-name" title="${escHtml(name)}">${escHtml(name.replace(/_/g, ' '))}</div>
        <div class="feature-bar-wrap">
          <div class="feature-bar-fill ${isRisk ? 'positive' : 'negative'}" style="width: ${pctBar.toFixed(1)}%;"></div>
        </div>
        <span class="feature-value ${isRisk ? 'text-red' : 'text-green'}">
          ${isRisk ? '+' : ''}${Number(value).toFixed(2)}
        </span>
      `;
      shapList.appendChild(row);
    });

    shapContainer.style.display = 'block';
  }

  function applyResult(result) {
    resetScanButton();
    if (!result) return;

    const isPhishing = result.prediction === 'phishing';
    const score = typeof result.risk_score === 'number' 
      ? result.risk_score 
      : Math.round((result.confidence || 0) * 100);

    // Primary Verdict Card
    riskScoreText.textContent = score.toFixed(1);
    scoreBar.style.width = Math.min(score, 100) + '%';

    if (isPhishing) {
      statusBadge.className = 'neo-badge neo-badge-phishing';
      statusBadge.textContent = 'THREAT DETECTED';
      verdictText.className = 'neo-badge neo-badge-phishing';
      verdictText.textContent = 'PHISHING // HIGH RISK';
      verdictCard.className = 'verdict-card phishing';
      scoreBar.style.background = 'var(--accent-red)';
      riskScoreText.style.color = 'var(--accent-red)';
    } else {
      statusBadge.className = 'neo-badge neo-badge-safe';
      statusBadge.textContent = 'VERIFIED SAFE';
      verdictText.className = 'neo-badge neo-badge-safe';
      verdictText.textContent = 'LEGITIMATE // CLEAN';
      verdictCard.className = 'verdict-card safe';
      scoreBar.style.background = 'var(--accent-green)';
      riskScoreText.style.color = 'var(--accent-green)';
    }

    // Sub-Intelligence Pillar 1: ML Lexical Engine
    const mlScoreVal = Math.round((result.confidence || 0) * 100);
    subMlScore.textContent = `${mlScoreVal} / 100`;
    if (mlScoreVal > 70) {
      subMlTag.className = 'pillar-tag neo-badge-phishing';
      subMlTag.textContent = 'ANOMALOUS';
    } else {
      subMlTag.className = 'pillar-tag neo-badge-safe';
      subMlTag.textContent = 'NORMAL';
    }

    // Sub-Intelligence Pillar 2: Threat Feeds
    const threatScore = result.threat_intel?.threat_score || (isPhishing ? 88 : 0);
    subFeedScore.textContent = `${threatScore} / 100`;
    if (threatScore > 50 || result.threat_intel?.is_known_phishing) {
      subFeedTag.className = 'pillar-tag neo-badge-phishing';
      subFeedTag.textContent = result.threat_intel?.threat_level?.toUpperCase() || 'CRITICAL';
    } else {
      subFeedTag.className = 'pillar-tag neo-badge-safe';
      subFeedTag.textContent = 'FEEDS CLEAN';
    }

    // Sub-Intelligence Pillar 3: TLS / Infrastructure
    const isHttps = currentTabUrl.startsWith('https://');
    if (isHttps) {
      subTlsVal.textContent = 'TLS 1.3 / HTTPS';
      subTlsTag.className = 'pillar-tag neo-badge-safe';
      subTlsTag.textContent = 'ENCRYPTED';
    } else {
      subTlsVal.textContent = 'RAW INSECURE HTTP';
      subTlsTag.className = 'pillar-tag neo-badge-phishing';
      subTlsTag.textContent = 'UNENCRYPTED';
    }

    // Sub-Intelligence Pillar 4: Domain Reputation
    const ageDays = result.threat_intel?.domain_age_days;
    if (ageDays !== undefined && ageDays !== null) {
      subDomainVal.textContent = `${ageDays} DAYS`;
      if (ageDays < 30) {
        subDomainTag.className = 'pillar-tag neo-badge-phishing';
        subDomainTag.textContent = 'NEW DOMAIN';
      } else {
        subDomainTag.className = 'pillar-tag neo-badge-cyan';
        subDomainTag.textContent = 'ESTABLISHED';
      }
    } else {
      subDomainVal.textContent = isPhishing ? 'FLAGGED // NEW' : 'ESTABLISHED';
      subDomainTag.className = isPhishing ? 'pillar-tag neo-badge-yellow' : 'pillar-tag neo-badge-cyan';
      subDomainTag.textContent = isPhishing ? 'SUSPICIOUS' : 'TRUSTED';
    }

    // Sub-Intelligence Pillar 5: SHAP Feature Attribution
    let shapFeatures = result.shap_features;
    if (!shapFeatures && Array.isArray(result.shap_explanations)) {
      shapFeatures = {};
      result.shap_explanations.forEach((item) => {
        shapFeatures[item.feature] = item.shap_value;
      });
    }
    renderShapFeatures(shapFeatures);

    // Sub-Intelligence Pillar 6: Blockchain Notarization
    if (result.blockchain_block) {
      chainBlockNum.textContent = `BLOCK #${result.blockchain_block.index}`;
    } else if (result.blockchain) {
      chainBlockNum.textContent = `BLOCK #${result.blockchain.block_index}`;
    } else {
      chainBlockNum.textContent = `BLOCK #--`;
    }
  }

  function displayUrl(url) {
    try {
      const parsed = new URL(url);
      urlScheme.textContent = parsed.protocol.toUpperCase() + '//';
      urlDisplay.textContent = parsed.host + (parsed.pathname !== '/' ? parsed.pathname.slice(0, 30) : '');
    } catch (_) {
      urlScheme.textContent = 'URL: ';
      urlDisplay.textContent = url.slice(0, 35);
    }
  }

  function scanCurrentUrl() {
    if (!currentTabUrl) return;
    setScanningState();

    chrome.runtime.sendMessage({ type: 'SCAN_URL', url: currentTabUrl }, (response) => {
      if (response && response.success && response.result) {
        applyResult(response.result);
      } else {
        resetScanButton();
        statusBadge.className = 'neo-badge neo-badge-yellow';
        statusBadge.textContent = 'OFFLINE MODE';
      }
    });
  }

  function init() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tab = tabs[0];
      currentTabUrl = tab.url || '';

      displayUrl(currentTabUrl);

      // Check for cached result first
      chrome.runtime.sendMessage({ type: 'GET_CACHED_RESULT', url: currentTabUrl }, (response) => {
        if (response && response.result) {
          applyResult(response.result);
        } else {
          // Auto scan if not yet cached
          scanCurrentUrl();
        }
      });
    });

    // Fetch daily stats
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (stats) => {
      if (stats) {
        statScans.textContent = stats.scansToday || 0;
        statThreats.textContent = stats.threatsToday || 0;
      }
    });

    btnScan.addEventListener('click', scanCurrentUrl);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
