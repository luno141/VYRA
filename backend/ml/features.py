"""VYRA URL Feature Extraction Engine.

Extracts over 35 lexical, structural, host-based, and heuristic features
from raw URLs to support machine learning classification and explainability.
"""

from collections import Counter
import ipaddress
import math
import re
from typing import Any, Dict, List, Union
from urllib.parse import parse_qs, urlparse

import numpy as np
import tldextract


# Canonical ordered list of features matching trained ML models
FEATURE_NAMES: List[str] = [
    "url_length",
    "domain_length",
    "path_length",
    "query_length",
    "num_dots",
    "num_hyphens",
    "num_underscores",
    "num_slashes",
    "num_at",
    "num_question_marks",
    "num_equals",
    "num_percent",
    "has_ip_address",
    "has_suspicious_tld",
    "is_https",
    "uses_port",
    "subdomain_count",
    "digit_count_in_domain",
    "special_char_ratio",
    "has_double_slash_redirect",
    "has_at_symbol",
    "has_hex_encoding",
    "entropy",
    "is_shortened_url",
    "suspicious_keywords_count",
    "tld_in_path",
    "domain_has_number_replacing_letter",
    "path_has_sensitive_word",
    "domain_entropy",
    "num_digits",
    "digit_ratio",
    "domain_hyphen_count",
    "has_punycode",
    "path_depth",
    "query_param_count",
]

# High-risk TLDs commonly exploited in phishing operations
SUSPICIOUS_TLDS = {
    "tk", "ml", "cf", "gq", "top", "xyz", "work", "click", "buzz", "fit",
    "icu", "cam", "rest", "stream", "support", "bid", "loan", "racing",
    "date", "faith", "party", "review", "trade", "win", "accountant",
    "download", "science", "gdn", "cricket", "country", "kim", "mom", "link",
    "men", "live", "vip", "club", "site", "online", "shop"
}

# Known URL shortening services
SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "cutt.ly", "rb.gy", "shorturl.at", "tiny.cc", "v.gd", "tr.im", "bit.do",
    "shorte.st", "adf.ly", "bc.vc", "s.id", "vo.sx", "rebrand.ly"
}

# Suspicious keywords indicative of social engineering and deception
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "account", "banking", "secure", "update", "signin",
    "wallet", "confirm", "security", "service", "auth", "support", "password",
    "recover", "billing", "checkpoint", "free", "bonus", "claim", "ebayisapi",
    "webscr", "pay", "paypal", "appleid", "irs", "gov", "refund", "suspend", "ebay"
]

# Sensitive keywords checked in URL path
SENSITIVE_PATH_WORDS = [
    "login", "signin", "admin", "wp-login", "verify", "secure", "account",
    "password", "credential", "banking", "wallet", "confirm", "update",
    "checkpoint", "authenticate", "authorize", "validation"
]

# Common legitimate TLDs to check for deceptive presence in URL path
COMMON_TLDS = [
    "com", "org", "net", "edu", "gov", "io", "co", "xyz", "info", "tk", "top",
    "ru", "cn", "uk", "de", "jp", "br", "nl"
]


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy for a given string."""
    if not text:
        return 0.0
    length = len(text)
    counts = Counter(text)
    return round(float(-sum((count / length) * math.log2(count / length) for count in counts.values())), 4)


def extract_features(url: str) -> Dict[str, Any]:
    """Extract over 35 lexical, structural, and heuristic features from a given URL.

    Args:
        url: The raw URL string to analyze.

    Returns:
        Dict mapping feature names to extracted numeric and boolean values.
    """
    raw_url = url.strip()
    if not re.match(r"^[a-zA-Z]+://", raw_url):
        parseable_url = "http://" + raw_url
    else:
        parseable_url = raw_url

    parsed = urlparse(parseable_url)
    if not parsed.path:
        parseable_url = parseable_url + "/"
        parsed = urlparse(parseable_url)
    raw_url = parseable_url

    hostname = (parsed.hostname or "").lower()
    netloc = (parsed.netloc or "").lower()
    path = parsed.path or "/"
    query = parsed.query or ""

    # tldextract domain parsing
    try:
        ext = tldextract.extract(parseable_url)
        domain_name = ext.domain.lower() if ext.domain else ""
        tld_name = ext.suffix.lower() if ext.suffix else ""
        subdomain_str = ext.subdomain.lower() if ext.subdomain else ""
    except Exception:
        parts = hostname.split(".")
        if len(parts) >= 2:
            domain_name = parts[-2]
            tld_name = parts[-1]
            subdomain_str = ".".join(parts[:-2])
        else:
            domain_name = hostname
            tld_name = ""
            subdomain_str = ""

    # Feature 1-4: Length metrics
    url_length = len(raw_url)
    domain_length = len(hostname)
    path_length = len(path)
    query_length = len(query)

    # Feature 5-12: Character counts
    num_dots = raw_url.count(".")
    num_hyphens = raw_url.count("-")
    num_underscores = raw_url.count("_")
    num_slashes = raw_url.count("/")
    num_at = raw_url.count("@")
    num_question_marks = raw_url.count("?")
    num_equals = raw_url.count("=")
    num_percent = raw_url.count("%")

    # Feature 13: IP Address Host
    has_ip = 0
    clean_host = hostname.split(":")[0].strip("[]")
    try:
        ipaddress.ip_address(clean_host)
        has_ip = 1
    except ValueError:
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", clean_host):
            has_ip = 1

    # Feature 14: Suspicious TLD
    primary_tld = tld_name.split(".")[-1] if tld_name else ""
    has_suspicious_tld = 1 if primary_tld in SUSPICIOUS_TLDS else 0

    # Feature 15: HTTPS Protocol
    is_https = 1 if parsed.scheme.lower() == "https" else 0

    # Feature 16: Non-standard / Explicit Port Abuse
    uses_port = 1 if parsed.port is not None and parsed.port not in (80, 443) else 0

    # Feature 17: Subdomain Count
    subdomain_count = len([s for s in subdomain_str.split(".") if s]) if subdomain_str else 0

    # Feature 18: Digit count in domain
    digit_count_in_domain = sum(1 for c in domain_name if c.isdigit())

    # Feature 19: Special character ratio
    special_chars = sum(1 for c in raw_url if not c.isalnum())
    special_char_ratio = round(special_chars / max(url_length, 1), 4)

    # Feature 20: Double slash redirect in path/query
    after_scheme = raw_url.split("://", 1)[-1] if "://" in raw_url else raw_url
    has_double_slash_redirect = 1 if "//" in after_scheme else 0

    # Feature 21: Has @ symbol
    has_at_symbol = 1 if num_at > 0 else 0

    # Feature 22: Hex encoding (%xx)
    has_hex = 1 if bool(re.search(r"%[0-9a-fA-F]{2}", raw_url)) else 0

    # Feature 23: URL Entropy
    url_entropy = calculate_entropy(raw_url)

    # Feature 24: Shortened URL
    is_shortened = 1 if any(hostname == s or hostname.endswith("." + s) for s in SHORTENER_DOMAINS) else 0

    # Feature 25: Suspicious keywords count
    lower_url = raw_url.lower()
    suspicious_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in lower_url)

    # Feature 26: Misleading TLD in path
    lower_path = path.lower()
    tld_in_path = 1 if any(f".{tld}" in lower_path for tld in COMMON_TLDS) else 0

    # Feature 27: Leetspeak / Numbers replacing letters
    leet_patterns = [
        r"[a-z]0[a-z]",
        r"[a-z]1[a-z]",
        r"[a-z]3[a-z]",
        r"[a-z]5[a-z]",
        r"[a-z]4[a-z]",
        r"p[a4]yp[a4]l",
        r"g00gle|micr0s0ft|app1e|amaz0n|netf1ix",
    ]
    has_leet = 1 if any(re.search(p, domain_name) for p in leet_patterns) else 0

    # Feature 28: Path has sensitive keyword
    path_has_sensitive = 1 if any(w in lower_path for w in SENSITIVE_PATH_WORDS) else 0

    # Feature 29: Domain Entropy
    dom_entropy = calculate_entropy(domain_name)

    # Feature 30: Total digits in URL
    num_digits = sum(1 for c in raw_url if c.isdigit())

    # Feature 31: Digit ratio
    digit_ratio = round(num_digits / max(url_length, 1), 4)

    # Feature 32: Hyphens in domain name
    domain_hyphens = domain_name.count("-")

    # Feature 33: Punycode
    has_punycode = 1 if "xn--" in netloc else 0

    # Feature 34: Path depth
    path_depth = len([s for s in path.split("/") if s])

    # Feature 35: Query parameter count
    try:
        parsed_params = parse_qs(query)
        query_param_count = len(parsed_params)
    except Exception:
        query_param_count = query.count("&") + (1 if query else 0)

    # Additional heuristics
    has_dga_patterns = bool(re.search(r"[bcdfghjklmnpqrstvwxyz]{6,}", domain_name))
    domain_age_suspicious = 1 if (dom_entropy > 3.4 and len(domain_name) > 12) or has_dga_patterns else 0

    redirect_indicators = ["redirect", "goto=", "url=", "link=", "dest=", "return=", "target=", "r="]
    redirect_count = sum(1 for ind in redirect_indicators if ind in lower_url)
    if "http" in lower_url[7:]:
        redirect_count += 1

    features: Dict[str, Any] = {
        # Core 35 model features
        "url_length": int(url_length),
        "domain_length": int(domain_length),
        "path_length": int(path_length),
        "query_length": int(query_length),
        "num_dots": int(num_dots),
        "num_hyphens": int(num_hyphens),
        "num_underscores": int(num_underscores),
        "num_slashes": int(num_slashes),
        "num_at": int(num_at),
        "num_question_marks": int(num_question_marks),
        "num_equals": int(num_equals),
        "num_percent": int(num_percent),
        "has_ip_address": int(has_ip),
        "has_suspicious_tld": int(has_suspicious_tld),
        "is_https": int(is_https),
        "uses_port": int(uses_port),
        "subdomain_count": int(subdomain_count),
        "digit_count_in_domain": int(digit_count_in_domain),
        "special_char_ratio": float(special_char_ratio),
        "has_double_slash_redirect": int(has_double_slash_redirect),
        "has_at_symbol": int(has_at_symbol),
        "has_hex_encoding": int(has_hex),
        "entropy": float(url_entropy),
        "is_shortened_url": int(is_shortened),
        "suspicious_keywords_count": int(suspicious_count),
        "tld_in_path": int(tld_in_path),
        "domain_has_number_replacing_letter": int(has_leet),
        "path_has_sensitive_word": int(path_has_sensitive),
        "domain_entropy": float(dom_entropy),
        "num_digits": int(num_digits),
        "digit_ratio": float(digit_ratio),
        "domain_hyphen_count": int(domain_hyphens),
        "has_punycode": int(has_punycode),
        "path_depth": int(path_depth),
        "query_param_count": int(query_param_count),

        # Synonyms and additional indicators requested by prompt
        "suspicious_keywords": int(suspicious_count),
        "domain_has_numbers_replacing_letters": int(has_leet),
        "domain_age_suspicious": int(domain_age_suspicious),
        "redirect_count": int(redirect_count),
    }

    return features


def features_to_array(features_dict: Dict[str, Any]) -> np.ndarray:
    """Convert extracted feature dictionary into a 2D NumPy array in canonical model order.

    Args:
        features_dict: Dict of feature values.

    Returns:
        NumPy array of shape (1, 35) with dtype float32.
    """
    values = [float(features_dict.get(name, 0.0)) for name in FEATURE_NAMES]
    return np.array([values], dtype=np.float32)
