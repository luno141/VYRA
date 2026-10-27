"""
Feature extraction module for VYRA phishing URL detection.

Extracts lexical, structural, statistical, and security features from URLs.
"""

import ipaddress
import math
import re
from collections import Counter
from typing import Dict, List, Union
import urllib.parse
import numpy as np

# Suspicious TLDs commonly abused in phishing campaigns
SUSPICIOUS_TLDS = {
    "tk", "ml", "cf", "gq", "top", "xyz", "work", "click", "buzz", "fit",
    "icu", "cam", "rest", "stream", "support", "bid", "loan", "racing",
    "date", "faith", "party", "review", "trade", "win", "accountant",
    "download", "science", "gdn", "cricket", "country", "kim", "mom", "link"
}

# Known URL shortener services
SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "cutt.ly", "rb.gy", "shorturl.at", "tiny.cc", "v.gd", "tr.im", "bit.do",
    "shorte.st", "adf.ly", "bc.vc", "s.id", "vo.sx"
}

# Suspicious keywords indicative of social engineering / phishing
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "account", "banking", "secure", "update", "signin",
    "wallet", "confirm", "security", "service", "auth", "support", "password",
    "recover", "billing", "checkpoint", "free", "bonus", "claim", "ebayisapi",
    "webscr", "pay", "paypal", "appleid", "irs", "gov", "refund", "suspend"
]

# Sensitive words specifically checked in path components
SENSITIVE_PATH_WORDS = [
    "login", "signin", "admin", "wp-login", "verify", "secure", "account",
    "password", "credential", "banking", "wallet", "confirm", "update",
    "checkpoint", "authenticate", "authorize", "validation"
]

# Common TLDs to check for misleading presence in URL path
COMMON_TLDS = [
    "com", "org", "net", "edu", "gov", "io", "co", "xyz", "info", "tk", "top",
    "ru", "cn", "uk", "de", "jp", "br", "nl"
]

# Ordered list of all feature names extracted by this module
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


def calculate_entropy(text: str) -> float:
    """Calculates Shannon entropy for a given string."""
    if not text:
        return 0.0
    length = len(text)
    counts = Counter(text)
    return -sum((count / length) * math.log2(count / length) for count in counts.values())


def is_ip_address(domain: str) -> int:
    """Returns 1 if domain is an IPv4 or IPv6 address, else 0."""
    clean_domain = domain.split(":")[0].strip("[]")
    try:
        ipaddress.ip_address(clean_domain)
        return 1
    except ValueError:
        return 1 if bool(re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", clean_domain)) else 0


def has_leet_replacement(domain: str) -> int:
    """
    Checks if domain has l33tspeak substitution (numbers replacing letters).
    e.g., paypa1, g00gle, micros0ft, amaz0n, app1e, b1ance.
    """
    domain_lower = domain.lower()
    # Check for number sandwiched between alphabets (e.g., 'pa1' or 'g00g')
    if re.search(r"[a-z][01345][a-z]", domain_lower):
        return 1
    # Check known brand typosquatting targets
    known_replacements = [
        "paypa1", "g00gle", "micros0ft", "amaz0n", "app1e", "faceb00k",
        "netf1ix", "b1ance", "walmart-log1n", "c0m", "secur1ty"
    ]
    for pattern in known_replacements:
        if pattern in domain_lower:
            return 1
    return 0


def extract_features(url: str) -> Dict[str, Union[int, float]]:
    """
    Extracts 35 features from a URL for machine learning classification.

    Parameters:
        url (str): The URL string to analyze.

    Returns:
        dict: Mapping of feature names to numerical values (int or float).
    """
    if not isinstance(url, str):
        url = str(url) if url is not None else ""
    url = url.strip()

    # Prepend scheme if missing for accurate urlparse parsing
    parse_target = url
    if not (url.startswith("http://") or url.startswith("https://") or url.startswith("ftp://")):
        parse_target = "http://" + url

    try:
        parsed = urllib.parse.urlparse(parse_target)
        if not parsed.path:
            parse_target = parse_target + "/"
            parsed = urllib.parse.urlparse(parse_target)
        url = parse_target
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        path = parsed.path or "/"
        query = parsed.query
    except Exception:
        scheme, netloc, path, query = "", "", "", ""

    # Split domain and port
    if ":" in netloc and not netloc.endswith("]"):
        domain_parts = netloc.split(":")
        domain = domain_parts[0]
        port_str = domain_parts[1]
    else:
        domain = netloc
        port_str = ""

    # Length features
    url_length = len(url)
    domain_length = len(domain)
    path_length = len(path)
    query_length = len(query)

    # Character count features
    num_dots = url.count(".")
    num_hyphens = url.count("-")
    num_underscores = url.count("_")
    num_slashes = url.count("/")
    num_at = url.count("@")
    num_question_marks = url.count("?")
    num_equals = url.count("=")
    num_percent = url.count("%")

    # Host & protocol features
    has_ip = is_ip_address(domain)
    tld = domain.split(".")[-1] if "." in domain else ""
    has_suspicious_tld = 1 if tld in SUSPICIOUS_TLDS else 0
    is_https = 1 if scheme == "https" or url.startswith("https://") else 0

    # Explicit port
    uses_port = 0
    if port_str and port_str.isdigit():
        port_num = int(port_str)
        if port_num not in (80, 443):
            uses_port = 1
    elif ":" in netloc and bool(re.search(r":\d+", netloc)):
        uses_port = 1

    # Subdomain count
    domain_labels = [p for p in domain.split(".") if p]
    if len(domain_labels) <= 2:
        subdomain_count = 0
    else:
        # Check for multi-part TLDs like co.uk
        if len(domain_labels) >= 3 and domain_labels[-2] in ("co", "com", "org", "gov", "net", "edu"):
            subdomain_count = max(0, len(domain_labels) - 3)
        else:
            subdomain_count = max(0, len(domain_labels) - 2)

    digit_count_in_domain = sum(c.isdigit() for c in domain)
    special_char_count = sum(not c.isalnum() for c in url)
    special_char_ratio = special_char_count / max(url_length, 1)

    # Redirect / double slash in path or query
    url_without_scheme = re.sub(r"^https?://", "", url, flags=re.IGNORECASE)
    has_double_slash_redirect = 1 if "//" in url_without_scheme else 0

    has_at_symbol = 1 if "@" in url else 0
    has_hex = 1 if bool(re.search(r"%[0-9a-fA-F]{2}", url)) else 0

    # Entropies
    url_entropy = calculate_entropy(url)
    dom_entropy = calculate_entropy(domain)

    # URL Shorteners
    is_shortened = 1 if (domain in SHORTENER_DOMAINS or any(domain.endswith("." + s) for s in SHORTENER_DOMAINS)) else 0

    # Suspicious keywords in URL
    url_lower = url.lower()
    suspicious_count = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower)

    # TLD inside path
    tld_pattern = r"\.(" + "|".join(COMMON_TLDS) + r")(/|$|\?)"
    tld_in_path = 1 if bool(re.search(tld_pattern, path.lower())) else 0

    # Leetspeak / number replacing letters in domain
    has_leet = has_leet_replacement(domain)

    # Sensitive path words
    path_lower = path.lower()
    path_has_sensitive = 1 if any(word in path_lower for word in SENSITIVE_PATH_WORDS) else 0

    # Additional features
    num_digits = sum(c.isdigit() for c in url)
    digit_ratio = num_digits / max(url_length, 1)
    domain_hyphens = domain.count("-")
    has_punycode = 1 if ("xn--" in domain.lower()) else 0
    path_depth = len([seg for seg in path.split("/") if seg])

    # Query param count
    try:
        query_params = urllib.parse.parse_qs(query)
        query_param_count = len(query_params)
    except Exception:
        query_param_count = query.count("&") + 1 if query else 0

    features = {
        "url_length": float(url_length),
        "domain_length": float(domain_length),
        "path_length": float(path_length),
        "query_length": float(query_length),
        "num_dots": float(num_dots),
        "num_hyphens": float(num_hyphens),
        "num_underscores": float(num_underscores),
        "num_slashes": float(num_slashes),
        "num_at": float(num_at),
        "num_question_marks": float(num_question_marks),
        "num_equals": float(num_equals),
        "num_percent": float(num_percent),
        "has_ip_address": float(has_ip),
        "has_suspicious_tld": float(has_suspicious_tld),
        "is_https": float(is_https),
        "uses_port": float(uses_port),
        "subdomain_count": float(subdomain_count),
        "digit_count_in_domain": float(digit_count_in_domain),
        "special_char_ratio": float(special_char_ratio),
        "has_double_slash_redirect": float(has_double_slash_redirect),
        "has_at_symbol": float(has_at_symbol),
        "has_hex_encoding": float(has_hex),
        "entropy": float(url_entropy),
        "is_shortened_url": float(is_shortened),
        "suspicious_keywords_count": float(suspicious_count),
        "tld_in_path": float(tld_in_path),
        "domain_has_number_replacing_letter": float(has_leet),
        "path_has_sensitive_word": float(path_has_sensitive),
        "domain_entropy": float(dom_entropy),
        "num_digits": float(num_digits),
        "digit_ratio": float(digit_ratio),
        "domain_hyphen_count": float(domain_hyphens),
        "has_punycode": float(has_punycode),
        "path_depth": float(path_depth),
        "query_param_count": float(query_param_count),
    }

    return features


def extract_feature_vector(url: str) -> np.ndarray:
    """
    Extracts features from a URL and returns them as a 1D numpy array in FEATURE_NAMES order.

    Parameters:
        url (str): The URL string to analyze.

    Returns:
        np.ndarray: 1D array of extracted numerical features.
    """
    feats = extract_features(url)
    return np.array([feats[name] for name in FEATURE_NAMES], dtype=np.float32)


def features_dict_to_array(features_dict: Dict[str, Union[int, float]]) -> np.ndarray:
    """Converts a feature dictionary to a numpy array according to FEATURE_NAMES."""
    return np.array([features_dict.get(name, 0.0) for name in FEATURE_NAMES], dtype=np.float32)
