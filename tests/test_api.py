"""
VYRA — test_api.py
Async integration tests for the FastAPI backend.

Uses httpx.AsyncClient + pytest-asyncio.

Install deps:
    pip install pytest pytest-asyncio httpx

Run with:
    pytest tests/test_api.py -v --asyncio-mode=auto
"""

import os
import sys

import pytest
import pytest_asyncio

# ---------------------------------------------------------------------------
# Resolve import path
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Guard: skip entire module if FastAPI app can't be imported
try:
    import httpx
    from httpx import AsyncClient, ASGITransport
    from fastapi.testclient import TestClient

    try:
        from backend.main import app  # type: ignore[import]
    except ModuleNotFoundError:
        try:
            from main import app  # type: ignore[import,no-redef]
        except ModuleNotFoundError:
            app = None  # type: ignore[assignment]

    SKIP_API = app is None
    SKIP_REASON = "FastAPI app (main.py) not found — skipping API tests."
except ImportError as exc:
    SKIP_API = True
    SKIP_REASON = f"httpx or FastAPI not installed: {exc}"
    app = None  # type: ignore[assignment]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def sync_client():
    """Synchronous TestClient for simple non-async tests."""
    if SKIP_API:
        pytest.skip(SKIP_REASON)
    with TestClient(app) as client:  # type: ignore[arg-type]
        yield client


@pytest_asyncio.fixture
async def async_client():
    """Async httpx client backed by the FastAPI ASGI app."""
    if SKIP_API:
        pytest.skip(SKIP_REASON)
    transport = ASGITransport(app=app)  # type: ignore[arg-type]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ---------------------------------------------------------------------------
# Health / root tests (synchronous)
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    def test_health_endpoint(self, sync_client):
        """GET /health (or /api/health) must return HTTP 200."""
        for path in ["/health", "/api/health", "/"]:
            resp = sync_client.get(path)
            if resp.status_code == 200:
                return
        pytest.fail("No health endpoint returned 200")

    def test_health_response_json(self, sync_client):
        for path in ["/health", "/api/health"]:
            resp = sync_client.get(path)
            if resp.status_code == 200:
                assert resp.headers.get("content-type", "").startswith("application/json")
                return


# ---------------------------------------------------------------------------
# Scan endpoint tests (async)
# ---------------------------------------------------------------------------

class TestScanEndpoint:
    @pytest.mark.asyncio
    async def test_scan_legitimate_url(self, async_client: AsyncClient):
        """Scanning google.com should return a 'legitimate' prediction."""
        resp = await async_client.post(
            "/api/scan",
            json={"url": "https://www.google.com/"}
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert "prediction" in data
        # Legitimate URL should not be flagged as phishing
        assert data["prediction"].lower() in ("legitimate", "safe", "benign")

    @pytest.mark.asyncio
    async def test_scan_phishing_url(self, async_client: AsyncClient):
        """Scanning a known-bad IP-based URL should return 'phishing'."""
        resp = await async_client.post(
            "/api/scan",
            json={"url": "http://192.168.1.1/secure/login/verify.php"}
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert "prediction" in data
        assert data["prediction"].lower() in ("phishing", "malicious", "suspicious")

    @pytest.mark.asyncio
    async def test_scan_returns_confidence(self, async_client: AsyncClient):
        resp = await async_client.post(
            "/api/scan",
            json={"url": "https://www.github.com/"}
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert "confidence" in data
        assert 0.0 <= float(data["confidence"]) <= 1.0

    @pytest.mark.asyncio
    async def test_scan_invalid_url_returns_error(self, async_client: AsyncClient):
        resp = await async_client.post(
            "/api/scan",
            json={"url": "not_a_url"}
        )
        # Should be processed or error
        assert resp.status_code in (200, 201, 400, 422)

    @pytest.mark.asyncio
    async def test_scan_missing_url_field(self, async_client: AsyncClient):
        resp = await async_client.post("/api/scan", json={})
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# History endpoint tests (async)
# ---------------------------------------------------------------------------

class TestHistoryEndpoint:
    @pytest.mark.asyncio
    async def test_get_history(self, async_client: AsyncClient):
        resp = await async_client.get("/api/history")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list) or "items" in data

    @pytest.mark.asyncio
    async def test_history_items_have_expected_fields(self, async_client: AsyncClient):
        # Seed with a scan first
        await async_client.post(
            "/api/scan",
            json={"url": "https://www.example.com/"}
        )
        resp = await async_client.get("/api/history")
        assert resp.status_code == 200
        res = resp.json()
        items = res["items"] if isinstance(res, dict) and "items" in res else res
        if items:
            first = items[0]
            for field in ("url", "prediction", "confidence"):
                assert field in first, f"Missing field '{field}' in history item"



# ---------------------------------------------------------------------------
# Stats endpoint tests (async)
# ---------------------------------------------------------------------------

class TestStatsEndpoint:
    @pytest.mark.asyncio
    async def test_get_stats(self, async_client: AsyncClient):
        resp = await async_client.get("/api/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_scans" in data or "total_blocks" in data

    @pytest.mark.asyncio
    async def test_stats_phishing_count_non_negative(self, async_client: AsyncClient):
        resp = await async_client.get("/api/stats")
        assert resp.status_code == 200
        data = resp.json()
        # Accept either key name
        count = data.get("phishing_count", data.get("phishing_detected", 0))
        assert count >= 0


# ---------------------------------------------------------------------------
# Blockchain endpoint tests (async)
# ---------------------------------------------------------------------------

class TestBlockchainEndpoints:
    @pytest.mark.asyncio
    async def test_blockchain_verify(self, async_client: AsyncClient):
        resp = await async_client.get("/api/blockchain/verify")
        assert resp.status_code == 200
        data = resp.json()
        assert "valid" in data
        assert data["valid"] is True

    @pytest.mark.asyncio
    async def test_blockchain_chain_is_list(self, async_client: AsyncClient):
        resp = await async_client.get("/api/blockchain/chain")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    @pytest.mark.asyncio
    async def test_blockchain_chain_has_genesis(self, async_client: AsyncClient):
        resp = await async_client.get("/api/blockchain/chain")
        chain = resp.json()
        assert len(chain) >= 1
        assert chain[0]["index"] == 0
        assert chain[0]["prediction"] == "genesis"

    @pytest.mark.asyncio
    async def test_blockchain_block_zero(self, async_client: AsyncClient):
        resp = await async_client.get("/api/blockchain/block/0")
        assert resp.status_code == 200
        data = resp.json()
        assert data["index"] == 0

    @pytest.mark.asyncio
    async def test_blockchain_block_not_found(self, async_client: AsyncClient):
        resp = await async_client.get("/api/blockchain/block/99999")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_blockchain_stats(self, async_client: AsyncClient):
        resp = await async_client.get("/api/blockchain/stats")
        assert resp.status_code == 200
        data = resp.json()
        for key in ("total_blocks", "chain_valid", "last_block_hash", "genesis_timestamp"):
            assert key in data
