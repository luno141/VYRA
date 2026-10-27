# VYRA Phishing Guard — Chrome Extension

> Real-time phishing detection powered by the VYRA AI backend, delivered as a zero-build Manifest V3 Chrome extension.

---

## Directory Structure

```
extension/
├── manifest.json          # MV3 manifest
├── icons/
│   ├── icon.svg           # Master SVG
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── background.js      # Service worker — scans URLs, redirects phishing
    ├── content.js         # Injected badge + warning banner
    ├── blocked.html       # Full-page phishing warning
    ├── popup.html         # Extension popup UI
    ├── popup.js           # Popup logic
    └── styles.css         # Shared dark-theme CSS
```

---

## Prerequisites

| Requirement | Details |
|---|---|
| **Chrome / Chromium** | v109+ (Manifest V3 support) |
| **VYRA Backend** | Must be running at `http://localhost:8000` |
| **Backend endpoint** | `POST /api/scan` — accepts `{ url }`, returns `{ prediction, confidence, shap_features }` |

---

## Installation (Load Unpacked)

1. Open Chrome and navigate to **`chrome://extensions`**
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension/` folder (this directory)
5. The **VYRA Phishing Guard** extension will appear in your toolbar

> **Tip:** Pin the extension by clicking the puzzle-piece icon → pin VYRA.

---

## How It Works

```
User navigates to URL
        │
        ▼
background.js intercepts via webNavigation.onBeforeNavigate
        │
        ▼
POST http://localhost:8000/api/scan  { url: "..." }
        │
   ┌────┴────┐
   │         │
SAFE      PHISHING (confidence > 0.7)
   │         │
   │         ▼
   │    Tab redirected → blocked.html?url=...&confidence=...&shap=...
   │         │
   │    User sees: Warning page, SHAP explanation, two buttons
   │
   ▼
content.js injects "VYRA Protected" badge (green)
```

---

## Backend API Contract

The extension expects this JSON response from `/api/scan`:

```json
{
  "prediction":    "phishing",        // or "safe" / "legitimate"
  "confidence":    0.923,             // float 0–1
  "shap_features": {                  // optional — key/value SHAP scores
    "url_length":        0.412,
    "has_at_symbol":     0.389,
    "domain_age_days":  -0.201,
    "uses_https":       -0.155
  }
}
```

---

## Features

### 🔴 Automatic Phishing Blocking
Every HTTP/S navigation is scanned. Pages with `confidence > 0.70` are immediately redirected to the warning page.

### 🛡️ Content-Script Badge
A floating badge appears on every page:
- 🟢 **VYRA Protected** — page is safe
- 🔴 **VYRA ⚠ Flagged** — page was flagged; also injects a top warning banner

### 🔍 SHAP Explanations
The blocked page and popup both display the top SHAP feature contributions so users understand *why* a page was flagged.

### 📊 Popup Dashboard
Click the toolbar icon to:
- See the verdict + confidence for the current tab
- Manually scan any tab
- View today's scan & threat counts
- Open the full VYRA web dashboard

### ⚡ 5-Minute Cache
Results are cached in memory (and `chrome.storage.local`) for 5 minutes to avoid redundant API calls.

---

## Permissions Explained

| Permission | Why |
|---|---|
| `webNavigation` | Intercept navigations before they complete |
| `tabs` | Update tab URL to redirect to blocked page |
| `activeTab` | Read current tab URL in popup |
| `storage` | Cache scan results and persist statistics |
| `declarativeNetRequest` | Reserved for future rule-based blocking |
| `http://localhost:8000/*` | Communicate with VYRA backend |

---

## Development Tips

### Reloading the Extension
After editing any JS/HTML file, go to `chrome://extensions` and click the **refresh** (↻) icon on the VYRA card.

### Viewing Service Worker Logs
On `chrome://extensions` → VYRA card → click **"Service Worker"** to open DevTools for `background.js`.

### Testing the Blocked Page Directly
```
chrome-extension://<YOUR_EXTENSION_ID>/src/blocked.html?url=http%3A%2F%2Fphishing-test.com&confidence=0.95
```

### Clearing Cached Scans
Open the extension's DevTools console and run:
```js
chrome.storage.local.clear(() => console.log('Cache cleared'));
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "API call failed" in popup | Start the VYRA backend: `uvicorn main:app --reload` |
| Extension not blocking pages | Check service worker is active on `chrome://extensions` |
| Icons not showing | Re-run `rsvg-convert` in the `icons/` directory |
| Popup shows "—" stats | Trigger at least one scan first |

---

## License

Part of the VYRA phishing detection research project.
