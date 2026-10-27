"""
VYRA Full Real-World Balanced Training Pipeline
Combines 55,512 verified phishing URLs (PhishTank) with 55,512 legitimate URLs (Tranco Top Domains)
augmented with realistic web distributions (subdomains, paths, query parameters) to eliminate
path-length bias while preserving true adversarial phishing indicators.
"""
import json
import os
import random
import sys
import time
import warnings
from concurrent.futures import ProcessPoolExecutor, as_completed

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE, "backend"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from features import FEATURE_NAMES, extract_features, features_dict_to_array

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

URLS_CSV = os.path.join(DATA_DIR, "real_balanced_urls.csv")
FEATS_CSV = os.path.join(DATA_DIR, "real_balanced_features.csv")
MODEL_OUT = os.path.join(MODELS_DIR, "vyra_model.joblib")
FEAT_NAMES = os.path.join(MODELS_DIR, "feature_names.json")
REPORT_OUT = os.path.join(MODELS_DIR, "evaluation_report.json")

LEGIT_SUBDOMAINS = [
    "", "", "", "", "", "www", "www", "en", "docs", "api", "app", "blog", "support", "help", "m", "dev"
]
LEGIT_PATHS = [
    "", "", "", "", "",
    "about", "contact", "contact-us", "terms", "privacy", "privacy-policy",
    "blog", "blog/news", "blog/2024/05/update", "news/latest-updates",
    "docs", "docs/api/v1/endpoints", "docs/getting-started",
    "wiki/Computer_science", "wiki/Machine_learning", "wiki/Main_Page",
    "help", "help/article/10492", "support/home", "careers/jobs",
    "pricing", "features", "products/laptops-and-devices",
    "search?q=open+source+software", "search?q=cybersecurity&page=2",
    "watch?v=dQw4w9WgXcQ", "user/profile_settings", "category/electronics/smartphones",
    "en/us/products/overview", "articles/data-science-guide", "downloads/v2.1.0/release_notes",
    "item?id=849204&category=tech&ref=home"
]

def build_dataset():
    print("Loading PhishTank phishing URLs...")
    pt = pd.read_csv(os.path.join(DATA_DIR, "phishtank_raw.csv"))
    pt_urls = pt["url"].dropna().str.strip().tolist()
    random.seed(42)
    random.shuffle(pt_urls)
    n = min(len(pt_urls), 55512)
    pt_urls = pt_urls[:n]
    print(f"  Loaded {len(pt_urls):,} phishing URLs")

    print("Loading Tranco legitimate domains...")
    tr = pd.read_csv(os.path.join(DATA_DIR, "tranco.csv"), header=None, names=["rank", "domain"])
    tr_domains = tr["domain"].str.strip().head(100000).sample(n, random_state=42).tolist()

    tr_urls = []
    for d in tr_domains:
        sub = random.choice(LEGIT_SUBDOMAINS)
        path = random.choice(LEGIT_PATHS)
        proto = "https" if random.random() > 0.10 else "http"
        host = f"{sub}.{d}" if sub else d
        if path:
            url = f"{proto}://{host}/{path}"
        else:
            url = f"{proto}://{host}/"
        tr_urls.append(url)
    print(f"  Generated {len(tr_urls):,} realistic legitimate URLs")

    df_phish = pd.DataFrame({"url": pt_urls, "label": 1})
    df_legit = pd.DataFrame({"url": tr_urls, "label": 0})
    df_all = pd.concat([df_phish, df_legit], ignore_index=True).sample(frac=1, random_state=42)
    df_all.to_csv(URLS_CSV, index=False)
    print(f"Saved {len(df_all):,} balanced samples to {URLS_CSV}")
    return df_all

def _extract_row(args):
    url, label = args
    try:
        feats = extract_features(url)
        arr = features_dict_to_array(feats)
        return list(arr) + [label]
    except Exception:
        return None

def extract_features_parallel(df_urls):
    total = len(df_urls)
    print(f"Extracting 35 features across {total:,} URLs using parallel processes...")
    rows = []
    errors = 0
    t0 = time.time()
    args = [(row.url, row.label) for row in df_urls.itertuples(index=False)]

    with ProcessPoolExecutor() as ex:
        futs = {ex.submit(_extract_row, a): i for i, a in enumerate(args)}
        done = 0
        for fut in as_completed(futs):
            res = fut.result()
            done += 1
            if res is not None:
                rows.append(res)
            else:
                errors += 1
            if done % 10000 == 0:
                elapsed = time.time() - t0
                pct = done / total * 100
                eta = (elapsed / done) * (total - done)
                print(f"  {done:,}/{total:,} ({pct:.1f}%) | ETA {eta:.0f}s", flush=True)

    print(f"Completed in {time.time()-t0:.1f}s | {errors} errors")
    cols = FEATURE_NAMES + ["label"]
    df = pd.DataFrame(rows, columns=cols)
    df.to_csv(FEATS_CSV, index=False)
    return df

def main():
    t_start = time.time()
    df_urls = build_dataset()
    df_feats = extract_features_parallel(df_urls)

    X = df_feats[FEATURE_NAMES].values.astype(np.float32)
    y = df_feats["label"].values.astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\nTrain samples: {len(X_train):,} | Test samples: {len(X_test):,}")

    models = {
        "XGBoost": XGBClassifier(
            n_estimators=300,
            learning_rate=0.06,
            max_depth=7,
            subsample=0.85,
            colsample_bytree=0.85,
            tree_method="hist",
            eval_metric="logloss",
            random_state=42,
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200,
            min_samples_leaf=2,
            n_jobs=-1,
            random_state=42,
        ),
    }

    results = {}
    best_model = None
    best_name = None
    best_f1 = -1

    for name, model in models.items():
        print(f"\nTraining {name}...")
        t0 = time.time()
        model.fit(X_train, y_train)
        elapsed = time.time() - t0
        print(f"  Trained in {elapsed:.1f}s")

        preds = model.predict(X_test)
        proba = model.predict_proba(X_test)[:, 1]
        cm = confusion_matrix(y_test, preds)
        tn, fp, fn, tp = cm.ravel()

        acc = round(accuracy_score(y_test, preds), 4)
        prec = round(precision_score(y_test, preds), 4)
        rec = round(recall_score(y_test, preds), 4)
        f1 = round(f1_score(y_test, preds), 4)
        auc = round(roc_auc_score(y_test, proba), 4)

        metrics = {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "roc_auc": auc,
            "confusion_matrix": {"matrix": cm.tolist(), "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}
        }
        results[name] = {"metrics": metrics, "train_time_sec": round(elapsed, 2)}
        print(f"  Acc: {acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f} | AUC: {auc:.4f}")
        print(f"  TN={tn} FP={fp} FN={fn} TP={tp}")

        if f1 > best_f1:
            best_f1 = f1
            best_model = model
            best_name = name

    # Feature importances
    imps = best_model.feature_importances_
    order = np.argsort(imps)[::-1]
    top_features = [
        {"feature": FEATURE_NAMES[i], "importance": round(float(imps[i]), 6), "rank": r+1}
        for r, i in enumerate(order[:15])
    ]

    joblib.dump(best_model, MODEL_OUT)
    with open(FEAT_NAMES, "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)

    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_summary": {
            "total_samples": int(len(y)),
            "num_features": len(FEATURE_NAMES),
            "train_samples": int(len(X_train)),
            "test_samples": int(len(X_test)),
            "sources": ["PhishTank (verified active phishing)", "Tranco Top Domains (with realistic paths)"],
            "class_distribution": {"legitimate": int((y==0).sum()), "phishing": int((y==1).sum())},
        },
        "best_model": {
            "name": best_name,
            "test_metrics": results[best_name]["metrics"],
            "top_features": top_features,
        },
        "all_models_comparison": results,
    }
    with open(REPORT_OUT, "w") as f:
        json.dump(report, f, indent=2)

    print("\nTop 5 Features:")
    for feat in top_features[:5]:
        print(f"  #{feat['rank']} {feat['feature']:30s} {feat['importance']*100:.2f}%")

    print(f"\nPipeline finished in {time.time()-t_start:.1f}s. Model saved to {MODEL_OUT}")

if __name__ == "__main__":
    main()
