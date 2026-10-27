"""
Dataset generation and loading module for VYRA phishing URL detection.

Generates realistic synthetic datasets containing both legitimate and phishing URLs
with multi-vector phishing patterns, extracts features, and outputs to CSV.
"""

import os
import random
import string
import sys
from typing import List, Tuple

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import pandas as pd

from ml.features import extract_features, FEATURE_NAMES

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DEFAULT_DATASET_PATH = os.path.join(DATA_DIR, "dataset.csv")


# Legitimate domains and components
LEGIT_DOMAINS = [
    "google.com", "github.com", "amazon.com", "microsoft.com", "apple.com",
    "cloudflare.com", "gitlab.com", "stackoverflow.com", "docker.com",
    "digitalocean.com", "medium.com", "reddit.com", "linkedin.com", "twitter.com",
    "youtube.com", "wikipedia.org", "python.org", "numpy.org", "mozilla.org",
    "nytimes.com", "bbc.com", "cnn.com", "reuters.com", "nature.com",
    "mit.edu", "stanford.edu", "harvard.edu", "nih.gov", "nasa.gov",
    "dropbox.com", "slack.com", "zoom.us", "salesforce.com", "adobe.com",
    "chase.com", "bankofamerica.com", "wellsfargo.com", "stripe.com",
    "paypal.com", "spotify.com", "netflix.com", "ebay.com", "walmart.com",
    "imdb.com", "quora.com", "pinterest.com", "yahoo.com", "huggingface.co"
]

LEGIT_SUBDOMAINS = [
    "www", "docs", "api", "blog", "developer", "support", "en", "help",
    "status", "portal", "community", "cloud", "code", "download", "news"
]

LEGIT_PATHS = [
    "search", "explore", "about", "contact", "products", "docs/guides",
    "articles/2026", "repository/master", "questions/tagged", "r/technology",
    "in/network", "playlist", "wiki/Overview", "api/v2/items", "pricing",
    "help/faq", "features", "solutions/enterprise", "category/books", "watch"
]

# Phishing components
SUSPICIOUS_TLDS_LIST = ["tk", "ml", "cf", "gq", "top", "xyz", "work", "click", "buzz", "fit", "icu"]
SHORTENERS = ["bit.ly", "tinyurl.com", "is.gd", "t.co", "cutt.ly", "rb.gy", "shorturl.at"]
TARGET_BRANDS = ["paypal", "apple", "chase", "bankofamerica", "netflix", "microsoft", "amazon", "google", "binance", "wells-fargo"]
PHISH_KEYWORDS = ["login", "verify", "account", "secure", "banking", "update", "signin", "wallet", "confirm", "security", "recover", "checkpoint"]
TYPOSQUAT_DOMAINS = [
    "paypa1.com", "g00gle.com", "micros0ft.com", "amaz0n-security.com",
    "b1ance.com", "netf1ix-verify.com", "app1e-id.com", "faceb00k-login.com",
    "walmart-log1n.com", "ch4se-bank.com", "wellsfarg0.com", "strip3-billing.com"
]


def _random_string(length: int, chars: str = string.ascii_lowercase + string.digits) -> str:
    """Generates a random string of specified length."""
    return "".join(random.choices(chars, k=length))


def generate_legitimate_url() -> str:
    """Generates a realistic legitimate URL."""
    proto = "https://" if random.random() > 0.1 else "http://"
    domain = random.choice(LEGIT_DOMAINS)

    # 35% chance of legitimate subdomain
    if random.random() < 0.35:
        sub = random.choice(LEGIT_SUBDOMAINS)
        domain = f"{sub}.{domain}"

    # Path variation
    path_type = random.choice(["simple", "deep", "query", "doc", "none"])
    if path_type == "none":
        path = ""
    elif path_type == "simple":
        path = f"/{random.choice(LEGIT_PATHS)}"
    elif path_type == "deep":
        base_path = random.choice(LEGIT_PATHS)
        path = f"/{base_path}/{_random_string(6)}/{random.randint(100, 9999)}"
    elif path_type == "doc":
        path = f"/docs/{random.choice(['api', 'tutorial', 'reference'])}/{_random_string(5)}.html"
    else:  # query
        base_path = random.choice(["search", "items", "view", "results"])
        q_keys = ["q", "id", "ref", "page", "category", "hl", "session_id"]
        k1 = random.choice(q_keys)
        v1 = _random_string(random.randint(4, 10))
        if random.random() < 0.5:
            k2 = random.choice([k for k in q_keys if k != k1])
            v2 = random.randint(1, 100)
            path = f"/{base_path}?{k1}={v1}&{k2}={v2}"
        else:
            path = f"/{base_path}?{k1}={v1}"

    return f"{proto}{domain}{path}"


def generate_phishing_url() -> str:
    """
    Generates a realistic phishing URL utilizing one or multiple attack vectors:
    - IP addresses as domains
    - Extremely long URLs (>100 chars)
    - Brand names in subdomains
    - Hex-encoded paths
    - Suspicious TLDs (.tk, .ml, .cf, .gq, .top, .xyz, etc.)
    - Keyword stuffing
    - URL shorteners with redirects
    - Typosquatting
    - Port abuse / @ symbol / double slashes
    """
    proto = random.choice(["http://", "https://"])
    vector = random.choice([
        "ip_address",
        "long_url",
        "brand_subdomain",
        "hex_encoded",
        "suspicious_tld",
        "keyword_stuffing",
        "shortener",
        "typosquatting",
        "at_symbol",
        "port_abuse"
    ])

    if vector == "ip_address":
        ip = f"{random.randint(20, 220)}.{random.randint(1, 250)}.{random.randint(1, 250)}.{random.randint(1, 250)}"
        port = f":{random.choice([8080, 8443, 8888, 3000, 5000])}" if random.random() < 0.4 else ""
        path = random.choice([
            f"/login.php?client_id={random.randint(1000, 9999)}",
            f"/secure/{random.choice(TARGET_BRANDS)}/verify.html",
            f"/account/signin/{_random_string(12)}",
            "/webscr?cmd=_login-run"
        ])
        return f"{proto}{ip}{port}{path}"

    elif vector == "long_url":
        brand = random.choice(TARGET_BRANDS)
        token = _random_string(60, string.ascii_letters + string.digits)
        evil_domain = f"{brand}-verification-service-{_random_string(8)}.{random.choice(['com', 'net', 'org', 'xyz'])}"
        path = f"/auth/v2/secure-login/checkpoint?token={token}&redirect_uri=https%3A%2F%2F{brand}.com%2Fportal&session={_random_string(30)}"
        return f"{proto}{evil_domain}{path}"

    elif vector == "brand_subdomain":
        brand = random.choice(TARGET_BRANDS)
        chain = random.choice([
            f"{brand}.secure.login.service",
            f"{brand}-account.security.verification",
            f"auth.{brand}.com.verify-user",
            f"signin.{brand}.portal.webscr"
        ])
        attacker_domain = f"server-{_random_string(6)}.{random.choice(['top', 'xyz', 'info', 'com', 'biz', 'tk'])}"
        path = f"/{random.choice(PHISH_KEYWORDS)}/{_random_string(8)}.php"
        return f"{proto}{chain}.{attacker_domain}{path}"

    elif vector == "hex_encoded":
        brand = random.choice(TARGET_BRANDS)
        domain = f"login-{brand}-notice.{random.choice(['com', 'xyz', 'net', 'info', 'top'])}"
        # Hex encode strings like /admin or /login or /verify
        encoded_words = [
            "%2f%6c%6f%67%69%6e%2e%70%68%70",  # /login.php
            "%2f%73%65%63%75%72%65%2f%76%65%72%69%66%79",  # /secure/verify
            "%2f%61%64%6d%69%6e%2f%61%75%74%68",  # /admin/auth
            "%2f%77%65%62%73%63%72%2f%61%63%63%6f%75%6e%74",  # /webscr/account
        ]
        path = random.choice(encoded_words) + f"?user={_random_string(6)}%40mail.com"
        return f"{proto}{domain}{path}"

    elif vector == "suspicious_tld":
        tld = random.choice(SUSPICIOUS_TLDS_LIST)
        brand = random.choice(TARGET_BRANDS)
        kw = random.choice(PHISH_KEYWORDS)
        domain = f"{brand}-{kw}-{_random_string(4)}.{tld}"
        path = f"/{random.choice(PHISH_KEYWORDS)}.php?ref={_random_string(8)}"
        return f"{proto}{domain}{path}"

    elif vector == "keyword_stuffing":
        kws = random.sample(PHISH_KEYWORDS, 4)
        domain = f"{kws[0]}-{kws[1]}-{kws[2]}.{random.choice(['com', 'net', 'xyz', 'online', 'site'])}"
        path = f"/{kws[3]}/auth-checkpoint?action=confirm&session={_random_string(16)}"
        return f"{proto}{domain}{path}"

    elif vector == "shortener":
        shortener = random.choice(SHORTENERS)
        slug = _random_string(random.randint(6, 9))
        brand = random.choice(TARGET_BRANDS)
        # Shorteners often append bait queries
        query = random.choice([
            f"?verify={brand}-account",
            f"?login_redirect=https%3A%2F%2F{brand}.com",
            f"?claim={_random_string(8)}",
            ""
        ])
        return f"{proto}{shortener}/{slug}{query}"

    elif vector == "typosquatting":
        typo_domain = random.choice(TYPOSQUAT_DOMAINS)
        path = f"/{random.choice(PHISH_KEYWORDS)}/{_random_string(6)}.html"
        return f"{proto}{typo_domain}{path}"

    elif vector == "at_symbol":
        brand = random.choice(TARGET_BRANDS)
        evil_host = f"secure-gate-{_random_string(6)}.{random.choice(['tk', 'xyz', 'top', 'com'])}"
        path = f"/{random.choice(PHISH_KEYWORDS)}?id={_random_string(8)}"
        return f"http://{brand}.com@{evil_host}{path}"

    else:  # port_abuse
        host = f"auth-verify-{_random_string(6)}.{random.choice(['com', 'top', 'net', 'xyz'])}"
        port = random.choice([8080, 8443, 8888, 9090, 4443])
        path = f"/{random.choice(PHISH_KEYWORDS)}.php"
        return f"{proto}{host}:{port}{path}"


def generate_dataset(n_samples: int = 5000, random_seed: int = 42) -> Tuple[np.ndarray, np.ndarray, List[str], List[str]]:
    """
    Generates a balanced synthetic dataset of legitimate and phishing URLs,
    extracts features for all URLs, saves to CSV, and returns dataset arrays.

    Parameters:
        n_samples (int): Total number of samples to generate (default: 5000).
        random_seed (int): Seed for reproducibility.

    Returns:
        Tuple: (X, y, feature_names, urls)
            X (np.ndarray): 2D feature matrix of shape (n_samples, n_features).
            y (np.ndarray): 1D binary labels (0 = legitimate, 1 = phishing).
            feature_names (List[str]): List of extracted feature names.
            urls (List[str]): List of generated URL strings.
    """
    random.seed(random_seed)
    np.random.seed(random_seed)

    n_phish = n_samples // 2
    n_legit = n_samples - n_phish

    print(f"Generating synthetic dataset: {n_legit} legitimate URLs and {n_phish} phishing URLs...")

    urls: List[str] = []
    labels: List[int] = []

    # Generate legitimate URLs
    for _ in range(n_legit):
        urls.append(generate_legitimate_url())
        labels.append(0)

    # Generate phishing URLs
    for _ in range(n_phish):
        urls.append(generate_phishing_url())
        labels.append(1)

    # Shuffle the combined dataset
    combined = list(zip(urls, labels))
    random.shuffle(combined)
    urls, labels = zip(*combined)
    urls = list(urls)
    y = np.array(labels, dtype=np.int32)

    print("Extracting features for all generated URLs...")
    feature_rows = []
    for idx, u in enumerate(urls):
        feat_dict = extract_features(u)
        feature_rows.append(feat_dict)
        if (idx + 1) % 1000 == 0 or (idx + 1) == n_samples:
            print(f"  Processed {idx + 1}/{n_samples} URLs")

    # Build DataFrame
    df = pd.DataFrame(feature_rows)
    # Ensure columns match FEATURE_NAMES order
    df = df[FEATURE_NAMES]

    # Prepend url and label columns
    df.insert(0, "url", urls)
    df.insert(1, "label", y)

    # Ensure output directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(DEFAULT_DATASET_PATH, index=False)
    print(f"Dataset successfully saved to: {DEFAULT_DATASET_PATH}")
    print(f"Dataset dimensions: {df.shape[0]} rows, {df.shape[1]} columns")

    X = df[FEATURE_NAMES].to_numpy(dtype=np.float32)

    return X, y, FEATURE_NAMES, urls


def load_or_generate_dataset(data_path: str = DEFAULT_DATASET_PATH,
                             n_samples: int = 5000,
                             force_regenerate: bool = False,
                             random_seed: int = 42) -> Tuple[np.ndarray, np.ndarray, List[str], List[str]]:
    """
    Loads dataset from CSV if available, or generates it if missing or requested.

    Parameters:
        data_path (str): Path to CSV file.
        n_samples (int): Number of samples if generation is required.
        force_regenerate (bool): Force re-generation even if CSV exists.
        random_seed (int): Random seed for generation.

    Returns:
        Tuple: (X, y, feature_names, urls)
    """
    if os.path.exists(data_path) and not force_regenerate:
        print(f"Checking existing dataset at {data_path}...")
        df = pd.read_csv(data_path)
        if len(df) >= n_samples and "label" in df.columns and "url" in df.columns:
            urls = df["url"].astype(str).tolist()
            y = df["label"].to_numpy(dtype=np.int32)
            # Verify feature columns
            missing_cols = [col for col in FEATURE_NAMES if col not in df.columns]
            if not missing_cols:
                print(f"Loaded existing dataset with {len(df)} samples.")
                X = df[FEATURE_NAMES].to_numpy(dtype=np.float32)
                return X, y, FEATURE_NAMES, urls
            else:
                print(f"Existing dataset missing features: {missing_cols}. Regenerating...")
        else:
            print(f"Existing dataset has {len(df)} samples (requested {n_samples}). Regenerating...")

    return generate_dataset(n_samples=n_samples, random_seed=random_seed)


if __name__ == "__main__":
    X, y, feats, urls = generate_dataset(n_samples=5000)
    print(f"Generated dataset shape: X={X.shape}, y={y.shape}")
    print(f"Legitimate samples (y=0): {np.sum(y == 0)}")
    print(f"Phishing samples (y=1): {np.sum(y == 1)}")
    print("Sample legitimate URL:", urls[list(y).index(0)])
    print("Sample phishing URL:  ", urls[list(y).index(1)])
