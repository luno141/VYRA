# VYRA — Verified Yet Reliable Authentication
> *An Explainable AI System for Real-Time Phishing URL Detection with Blockchain Audit Trail*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black?logo=next.js)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Installation](#3-installation)
4. [Usage Guide](#4-usage-guide)
5. [API Reference](#5-api-reference)
6. [Research Methodology](#6-research-methodology)
7. [Limitations](#7-limitations)
8. [Contributing](#8-contributing)
9. [License](#9-license)

---

## 1. Project Overview

**VYRA** (*Verified Yet Reliable Authentication*) is a final-year B.Tech academic project that combines:

| Component | Technology | Role |
|---|---|---|
| ML Detection Engine | scikit-learn / XGBoost | Classifies URLs as *phishing* or *legitimate* |
| Explainability Layer | SHAP | Highlights which features drove the prediction |
| Audit Trail | SHA-256 Blockchain | Tamper-evident log of every detection event |
| REST API | FastAPI | Bridges extension ↔ ML model ↔ dashboard |
| Browser Extension | JavaScript / Manifest V3 | Real-time in-browser scanning |
| Analytics Dashboard | Next.js 14 | Visual history, chain explorer, statistics |

### Key Differentiators

- **No web3 dependency** — the blockchain is pure Python using `hashlib.sha256`, making it lightweight enough to run on any machine without Ethereum or Solidity tooling.
- **Explainable predictions** — every block stores a SHAP hash so analysts can reproduce _why_ a URL was flagged.
- **Proof-of-Work difficulty** — configurable `DIFFICULTY` constant prevents trivial block forgery.

---

## 2. Architecture Overview

```
Browser Extension (JS)
        │  POST /api/scan
        ▼
┌───────────────────┐
│   FastAPI Backend  │
│  ┌─────────────┐  │
│  │ ML Model    │  │ ← XGBoost / Random Forest
│  │ (predict)   │  │
│  └──────┬──────┘  │
│         │ result  │
│  ┌──────▼──────┐  │
│  │ SHAP Engine │  │ ← feature attribution
│  └──────┬──────┘  │
│         │         │
│  ┌──────▼──────┐  │
│  │ VYRAChain   │  │ ← SHA-256 block append + PoW
│  │ (audit log) │  │
│  └─────────────┘  │
└───────────────────┘
        │
        │  GET /api/blockchain/*
        ▼
┌───────────────────┐
│  Next.js Dashboard │
│  Chain Explorer    │
│  Scan History      │
└───────────────────┘
```

### Directory Layout

```
vyra/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── blockchain/
│   │   ├── __init__.py
│   │   ├── chain.py               # VYRAChain implementation
│   │   └── chain_data.json        # Persisted blockchain (auto-generated)
│   ├── features/
│   │   └── extractor.py           # URL feature extraction (15 features)
│   ├── model/
│   │   ├── trainer.py             # Training script
│   │   └── vyra_model.pkl         # Serialised model (generated)
│   └── api/
│       └── routes/
│           ├── scan.py
│           ├── history.py
│           └── blockchain.py      # Blockchain REST routes
├── dashboard/                     # Next.js 14 app
├── extension/                     # Chrome/Edge MV3 extension
├── tests/
│   ├── conftest.py
│   ├── test_features.py
│   ├── test_blockchain.py
│   └── test_api.py
├── start.sh                       # One-command startup
├── .gitignore
└── README.md
```

---

## 3. Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Python | ≥ 3.10 |
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| pip | latest |

---

### 3.1 Backend Setup

```bash
# Clone the repository
git clone https://github.com/<your-username>/vyra.git
cd vyra

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Train the model (first run only)
python backend/model/trainer.py
```

**`backend/requirements.txt` (minimum)**

```
fastapi>=0.110
uvicorn[standard]>=0.29
scikit-learn>=1.4
xgboost>=2.0
shap>=0.45
pandas>=2.0
numpy>=1.26
httpx>=0.27
pytest>=8.0
pytest-asyncio>=0.23
```

---

### 3.2 Dashboard Setup

```bash
cd dashboard
npm install
npm run build    # production build
# or
npm run dev      # development mode (hot-reload on :3000)
```

---

### 3.3 Browser Extension Setup

1. Open **Chrome** → `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked** and select the `extension/` folder
4. The VYRA shield icon will appear in the toolbar

> **Note:** The extension reads `VITE_API_URL` (or hardcoded `http://localhost:8000`) to reach the backend. Ensure the backend is running first.

---

### 3.4 Quick Start (All-in-one)

```bash
chmod +x start.sh
./start.sh
```

This starts:
- Backend API on **http://localhost:8000**
- Dashboard on **http://localhost:3000**
- Interactive API docs on **http://localhost:8000/docs**

---

## 4. Usage Guide

### Scanning a URL via the Extension

1. Navigate to any website in Chrome/Edge.
2. Click the **VYRA shield** icon.
3. The extension POSTs the current tab URL to `/api/scan`.
4. A verdict card shows: **Phishing / Legitimate**, confidence %, and top SHAP features.

### Scanning via the Dashboard

1. Open `http://localhost:3000`.
2. Paste a URL into the **Scan** input box and press Enter.
3. View the prediction, confidence gauge, and SHAP bar chart.
4. Navigate to **Audit Chain** to inspect every committed block.

### Running the Test Suite

```bash
# From project root with venv activated
pytest tests/ -v

# Run only blockchain tests
pytest tests/test_blockchain.py -v

# Run only feature tests
pytest tests/test_features.py -v

# Run async API tests
pytest tests/test_api.py -v --asyncio-mode=auto
```

---

## 5. API Reference

Base URL: `http://localhost:8000`

### Scan

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/scan` | `{"url": "..."}` | Classify a URL; commits result to chain |

**Response:**
```json
{
  "url": "https://...",
  "prediction": "phishing",
  "confidence": 0.97,
  "shap_values": { "url_length": 0.32, "num_dots": 0.21 },
  "block_index": 14
}
```

---

### History

| Method | Path | Query | Description |
|---|---|---|---|
| `GET` | `/api/history` | `?limit=50&page=1` | Paginated scan history |

---

### Stats

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stats` | Aggregated counts: total scans, phishing detected, accuracy |

---

### Blockchain

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/blockchain/chain` | Full chain as JSON array |
| `GET` | `/api/blockchain/verify` | Integrity verification report |
| `GET` | `/api/blockchain/block/{index}` | Single block by index |
| `GET` | `/api/blockchain/stats` | Chain summary (length, validity, genesis timestamp) |

**`/api/blockchain/verify` response:**
```json
{
  "valid": true,
  "length": 42,
  "errors": [],
  "checked_at": 1761580800.0
}
```

**`/api/blockchain/stats` response:**
```json
{
  "total_blocks": 42,
  "chain_valid": true,
  "last_block_hash": "0034af...",
  "genesis_timestamp": 1761494400.0
}
```

---

## 6. Research Methodology

### 6.1 Dataset

- **PhishTank** — crowd-sourced phishing URLs (verified positives)
- **Alexa Top 1M / Majestic Million** — legitimate URL baseline
- Combined dataset: ~88,000 URLs (balanced, 50:50 split)

### 6.2 Feature Engineering

15 URL-structural features extracted without visiting the page:

| # | Feature | Type |
|---|---|---|
| 1 | `url_length` | int |
| 2 | `hostname_length` | int |
| 3 | `path_length` | int |
| 4 | `num_dots` | int |
| 5 | `num_hyphens` | int |
| 6 | `is_https` | bool |
| 7 | `has_ip_address` | bool |
| 8 | `has_at_symbol` | bool |
| 9 | `has_double_slash` | bool |
| 10 | `has_subdomain` | bool |
| 11 | `has_suspicious_tld` | bool |
| 12 | `has_suspicious_keyword` | bool |
| 13 | `hostname_entropy` | float |
| 14 | `special_chars_count` | int |
| 15 | `tld` | str (encoded) |

### 6.3 Model Training

- Algorithm: **XGBoost** (primary), Random Forest (baseline)
- Validation: 5-fold stratified cross-validation
- Metrics: Accuracy, Precision, Recall, F1, ROC-AUC
- Target performance: F1 ≥ 0.97 on held-out test set

### 6.4 Explainability (SHAP)

- `shap.TreeExplainer` applied per-prediction
- Top-3 contributing features surfaced in the extension UI
- SHAP dict hash committed to the blockchain for reproducibility

### 6.5 Blockchain Audit Trail

- **SHA-256** chaining — no external library
- **Proof-of-Work** (difficulty = 2 leading zeros) deters block forgery
- `verify_chain()` checks hash consistency + PoW + prev_hash linkage
- Chain persisted to `chain_data.json` (can be replaced with SQLite/PostgreSQL)

---

## 7. Limitations

| Limitation | Impact | Mitigation |
|---|---|---|
| URL-only features (no DOM/JS execution) | May miss JavaScript-based phishing | Add Playwright-based page rendering as an optional async step |
| Model trained on English-language URLs | Reduced accuracy on IDN / multilingual phishing | Fine-tune on multilingual PhishTank subset |
| PoW difficulty = 2 | Trivially forgeable on modern hardware if chain file is accessed directly | Increase `DIFFICULTY`; add HMAC signing for production |
| `chain_data.json` stored on local disk | Single point of failure; no replication | Replace with PostgreSQL + distributed backup |
| No rate limiting on `/api/scan` | DoS risk | Add `slowapi` rate limiter |
| SHAP values computed synchronously | High latency on large models | Move to background task with WebSocket push |
| Extension requires manual installation | UX friction | Publish to Chrome Web Store post-evaluation |

---

## 8. Contributing

This is an academic project. Pull requests are welcome for:
- Bug fixes in the blockchain or feature extractor
- Additional test cases
- Dashboard UI improvements

Please open an issue first for major changes.

---

## 9. License

MIT © 2026 VYRA Project Authors
