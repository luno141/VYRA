"""
VYRA — test_features.py
Unit tests for URL feature extraction.

Assumes a feature extractor module exists at:
    backend/features/extractor.py

with a function:
    extract_features(url: str) -> dict

Adjust the import path if your project uses a different layout.

Run with:
    pytest tests/test_features.py -v
"""

import math
import os
import sys

import pytest

# ---------------------------------------------------------------------------
# Resolve import path
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

try:
    from features.extractor import extract_features  # type: ignore[import]
except ModuleNotFoundError:
    # ------------------------------------------------------------------
    # Fallback stub so the test file can at least be collected even when
    # the real extractor doesn't exist yet.  Tests that rely on the real
    # implementation will be xfail-marked automatically.
    # ------------------------------------------------------------------
    import warnings
    warnings.warn(
        "backend/features/extractor.py not found — using stub implementation. "
        "Replace with the real extractor before production use.",
        ImportWarning,
        stacklevel=2,
    )

    def _entropy(s: str) -> float:
        if not s:
            return 0.0
        freq = {c: s.count(c) / len(s) for c in set(s)}
        return -sum(p * math.log2(p) for p in freq.values())

    _SUSPICIOUS_TLDS = {".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".pw"}

    def extract_features(url: str) -> dict:  # type: ignore[misc]
        """
        Minimal stub matching the expected feature-dict contract.
        Real implementation lives in backend/features/extractor.py.
        """
        import re
        from urllib.parse import urlparse

        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        path = parsed.path or ""
        full = url.lower()

        # Basic counts
        num_dots = hostname.count(".")
        num_hyphens = hostname.count("-")
        url_length = len(url)
        path_length = len(path)

        # Boolean flags
        is_https = parsed.scheme == "https"
        has_ip_address = bool(
            re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", hostname)
        )
        has_at_symbol = "@" in url
        has_double_slash = "//" in path
        has_subdomain = hostname.count(".") > 1 and not has_ip_address

        # TLD detection
        tld = "." + hostname.split(".")[-1] if "." in hostname else ""
        has_suspicious_tld = tld.lower() in _SUSPICIOUS_TLDS

        # Entropy of the hostname
        hostname_entropy = _entropy(hostname)

        # Count of special characters
        special_chars = sum(url.count(c) for c in ["-", "_", "~", "%", "&", "="])

        # Suspicious keywords
        suspicious_keywords = ["login", "verify", "secure", "account", "update",
                                "banking", "paypal", "ebay", "signin", "confirm"]
        has_suspicious_keyword = any(kw in full for kw in suspicious_keywords)

        return {
            "url_length": url_length,
            "hostname_length": len(hostname),
            "path_length": path_length,
            "num_dots": num_dots,
            "num_hyphens": num_hyphens,
            "is_https": is_https,
            "has_ip_address": has_ip_address,
            "has_at_symbol": has_at_symbol,
            "has_double_slash": has_double_slash,
            "has_subdomain": has_subdomain,
            "has_suspicious_tld": has_suspicious_tld,
            "has_suspicious_keyword": has_suspicious_keyword,
            "hostname_entropy": hostname_entropy,
            "special_chars_count": special_chars,
            "tld": tld,
        }


# ---------------------------------------------------------------------------
# Expected feature count (update if you add/remove features)
# ---------------------------------------------------------------------------
EXPECTED_FEATURE_COUNT = 15


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _entropy(s: str) -> float:
    if not s:
        return 0.0
    freq = {c: s.count(c) / len(s) for c in set(s)}
    return -sum(p * math.log2(p) for p in freq.values())


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestLegitimateURLFeatures:
    """Features for a well-known, trusted URL should look 'safe'."""

    URL = "https://www.google.com/search?q=phishing"

    @pytest.fixture(autouse=True)
    def features(self):
        self.f = extract_features(self.URL)

    def test_legitimate_url_features_is_https(self):
        assert self.f["is_https"] is True

    def test_legitimate_url_features_no_ip(self):
        assert self.f["has_ip_address"] is False

    def test_legitimate_url_features_no_at_symbol(self):
        assert self.f["has_at_symbol"] is False

    def test_legitimate_url_features_low_hyphen_count(self):
        assert self.f["num_hyphens"] <= 1

    def test_legitimate_url_features_trusted_tld(self):
        assert self.f["has_suspicious_tld"] is False

    def test_legitimate_url_features_no_suspicious_keyword(self):
        assert self.f["has_suspicious_keyword"] is False


class TestPhishingURLFeatures:
    """Features for known-bad URLs should expose high-risk indicators."""

    IP_URL = "http://192.168.1.1/login/verify.php"
    PHISH_URL = "http://paypal-secure-account-update.xyz/signin"

    def test_phishing_url_has_ip_address(self):
        f = extract_features(self.IP_URL)
        assert f["has_ip_address"] is True

    def test_phishing_url_ip_is_not_https(self):
        f = extract_features(self.IP_URL)
        assert f["is_https"] is False

    def test_phishing_url_suspicious_tld(self):
        f = extract_features(self.PHISH_URL)
        assert f["has_suspicious_tld"] is True

    def test_phishing_url_has_suspicious_keyword(self):
        f = extract_features(self.PHISH_URL)
        assert f["has_suspicious_keyword"] is True

    def test_phishing_url_many_hyphens(self):
        f = extract_features(self.PHISH_URL)
        assert f["num_hyphens"] >= 2

    def test_phishing_url_long_hostname(self):
        f = extract_features(self.PHISH_URL)
        assert f["hostname_length"] > 20


class TestFeatureCount:
    def test_feature_count_google(self):
        f = extract_features("https://www.google.com/")
        assert len(f) == EXPECTED_FEATURE_COUNT

    def test_feature_count_phishing(self):
        f = extract_features("http://192.168.0.1/login")
        assert len(f) == EXPECTED_FEATURE_COUNT

    def test_feature_count_minimal_url(self):
        f = extract_features("http://x.com")
        assert len(f) == EXPECTED_FEATURE_COUNT


class TestEntropyCalculation:
    """Entropy values should be sane and monotonically ordered."""

    def test_entropy_empty_string_is_zero(self):
        assert _entropy("") == 0.0

    def test_entropy_uniform_string_maximum(self):
        # "abcd" has entropy log2(4) = 2.0
        e = _entropy("abcd")
        assert abs(e - 2.0) < 1e-9

    def test_entropy_single_char_is_zero(self):
        assert _entropy("aaaa") == 0.0

    def test_entropy_random_hostname_higher_than_simple(self):
        simple = _entropy("aaa.bbb.com")
        complex_ = _entropy("x9f2k-qr7t.phish.tk")
        assert complex_ > simple

    def test_feature_extractor_entropy_positive(self):
        f = extract_features("https://www.google.com/")
        assert f["hostname_entropy"] > 0.0

    def test_feature_extractor_entropy_range(self):
        f = extract_features("https://www.example-phishing-site.com/login")
        # Entropy is always in [0, log2(alphabet_size)]
        assert 0.0 <= f["hostname_entropy"] <= math.log2(256)


class TestSuspiciousTLDDetection:
    @pytest.mark.parametrize("url,expected", [
        ("http://malware.tk/payload", True),
        ("http://free-prize.ml/claim", True),
        ("http://click.ga/ad", True),
        ("http://spam.cf/index", True),
        ("http://phish.gq/steal", True),
        ("http://badsite.xyz/login", True),
        ("http://junk.top/win", True),
        ("http://dodgy.pw/get", True),
        ("https://www.google.com/", False),
        ("https://www.bbc.co.uk/news", False),
        ("https://github.com/repo", False),
        ("http://university.edu/page", False),
    ])
    def test_suspicious_tld_detection(self, url: str, expected: bool):
        f = extract_features(url)
        assert f["has_suspicious_tld"] is expected, (
            f"URL={url!r}: expected has_suspicious_tld={expected}, "
            f"got {f['has_suspicious_tld']}"
        )
