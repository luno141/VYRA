"""
VYRA — conftest.py
Shared pytest fixtures available to all tests in the suite.
"""

import os
import sys

import pytest

# Make backend importable from any test
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


# ---------------------------------------------------------------------------
# FastAPI TestClient fixture
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def test_client():
    """
    Synchronous FastAPI TestClient for the VYRA backend.

    Yields None (and emits a warning) when main.py is not yet available so
    that other fixtures and tests can still be collected without error.
    """
    try:
        from fastapi.testclient import TestClient

        try:
            from backend.main import app  # type: ignore[import]
        except ModuleNotFoundError:
            from main import app  # type: ignore[import,no-redef]

        with TestClient(app) as client:
            yield client

    except (ModuleNotFoundError, ImportError):
        import warnings
        warnings.warn(
            "FastAPI app (main.py) not found — test_client fixture yields None.",
            UserWarning,
            stacklevel=2,
        )
        yield None


# ---------------------------------------------------------------------------
# Sample URL dictionary
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def sample_urls() -> dict:
    """
    A collection of labelled URLs used across multiple test modules.

    Structure
    ---------
    {
        "legitimate": [...],   # URLs expected to be classified as safe
        "phishing":   [...],   # URLs expected to be classified as malicious
        "edge_cases": [...],   # Ambiguous or boundary URLs
    }
    """
    return {
        "legitimate": [
            "https://www.google.com/",
            "https://www.github.com/",
            "https://www.bbc.co.uk/news",
            "https://en.wikipedia.org/wiki/Phishing",
            "https://stackoverflow.com/questions",
            "https://www.amazon.com/",
        ],
        "phishing": [
            "http://192.168.1.1/login/verify.php",
            "http://paypal-secure-account-update.xyz/signin",
            "http://www.bankofamerica-verify-login.tk/",
            "http://secure-ebay.ml/account/confirm",
            "http://apple-id-verify.gq/reset",
            "http://google.com@evil.com/login",
        ],
        "edge_cases": [
            "http://localhost:8000/",
            "https://192.0.2.1/",          # documentation IP
            "ftp://files.example.com/",    # non-HTTP scheme
            "https://xn--bcher-kva.example/",  # IDN / punycode
        ],
    }


# ---------------------------------------------------------------------------
# Temporary blockchain chain file fixture
# ---------------------------------------------------------------------------

@pytest.fixture
def isolated_chain(tmp_path):
    """
    Provide a VYRAChain backed by a temporary file, reset between tests.

    Useful for tests that need a clean chain without affecting the real
    chain_data.json on disk.
    """
    from blockchain.chain import VYRAChain, reset_chain_instance

    reset_chain_instance()
    chain_file = str(tmp_path / "isolated_chain.json")
    chain = VYRAChain(chain_file=chain_file)
    yield chain
    reset_chain_instance()
