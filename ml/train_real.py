"""
VYRA Real-World Training Pipeline
Trains on PhishTank (55,512 verified phishing) + Tranco Top Domains (55,512 legitimate)
Total: 111,024 authentic URLs with 35 lexical/structural features
"""
import json
import os
import sys
import time
import warnings
from concurrent.futures import ProcessPoolExecutor, as_completed

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report,
                             confusion_matrix, f1_score, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE, "backend"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from features import FEATURE_NAMES, extract_features, features_dict_to_array as features_to_array

DATA_DIR   = os.path.join(os.path.dirname(__file__), "data")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

URLS_CSV   = os.path.join(DATA_DIR, "real_dataset_urls.csv")
FEATS_CSV  = os.path.join(DATA_DIR, "real_features.csv")
MODEL_OUT  = os.path.join(MODELS_DIR, "vyra_model.joblib")
FEAT_NAMES = os.path.join(MODELS_DIR, "feature_names.json")
REPORT_OUT = os.path.join(MODELS_DIR, "evaluation_report.json")

# ── Feature extraction worker ───────────────────────────────────────────────────
def _extract_row(args):
    url, label = args
    try:
        feats = extract_features(url)
        arr   = features_to_array(feats)
        return list(arr) + [label]
    except Exception:
        return None


def extract_all_features(urls_csv: str, feats_csv: str) -> pd.DataFrame:
    """Extract features for all URLs, cache to CSV so we don't redo work."""
    if os.path.exists(feats_csv):
        print(f"[cache] Loading pre-extracted features from {feats_csv}")
        return pd.read_csv(feats_csv)

    df_urls = pd.read_csv(urls_csv)
    total   = len(df_urls)
    print(f"Extracting {len(FEATURE_NAMES)} features for {total:,} URLs …")

    rows   = []
    errors = 0
    t0     = time.time()
    args   = [(row.url, row.label) for row in df_urls.itertuples(index=False)]

    with ProcessPoolExecutor() as ex:
        futs = {ex.submit(_extract_row, a): i for i, a in enumerate(args)}
        done = 0
        for fut in as_completed(futs):
            result = fut.result()
            done  += 1
            if result is None:
                errors += 1
            else:
                rows.append(result)
            if done % 5000 == 0:
                elapsed = time.time() - t0
                pct     = done / total * 100
                eta     = (elapsed / done) * (total - done)
                print(f"  {done:,}/{total:,}  ({pct:.1f}%)  ETA {eta:.0f}s", end="\r", flush=True)

    print(f"\nDone in {time.time()-t0:.1f}s  |  {errors} extraction errors skipped")
    cols = FEATURE_NAMES + ["label"]
    df   = pd.DataFrame(rows, columns=cols)
    df.to_csv(feats_csv, index=False)
    print(f"Saved features → {feats_csv}")
    return df


# ── Training & evaluation ───────────────────────────────────────────────────────
def evaluate_model(name, model, X_test, y_test):
    preds = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    cm    = confusion_matrix(y_test, preds)
    tn, fp, fn, tp = cm.ravel()
    return {
        "accuracy":         round(accuracy_score(y_test, preds),  4),
        "precision":        round(precision_score(y_test, preds),  4),
        "recall":           round(recall_score(y_test, preds),     4),
        "f1_score":         round(f1_score(y_test, preds),         4),
        "roc_auc":          round(roc_auc_score(y_test, proba),    4),
        "confusion_matrix": {
            "matrix": cm.tolist(),
            "tn": int(tn), "fp": int(fp),
            "fn": int(fn), "tp": int(tp),
        },
    }


def main():
    print("=" * 60)
    print(" VYRA Real-World Training Pipeline")
    print(" PhishTank (verified) + Tranco Top Domains")
    print("=" * 60)

    # 1. Feature extraction
    df   = extract_all_features(URLS_CSV, FEATS_CSV)
    X    = df[FEATURE_NAMES].values.astype(np.float32)
    y    = df["label"].values.astype(int)

    n_phish = int(y.sum())
    n_legit = int(len(y) - n_phish)
    print(f"\nDataset: {len(y):,} total  |  phishing={n_phish:,}  legitimate={n_legit:,}")

    # 2. Train / test split 80 / 20 stratified
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train: {len(X_tr):,}   Test: {len(X_te):,}")

    # 3. Models
    models = {
        "XGBoost": XGBClassifier(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=1,
            tree_method="hist",
            eval_metric="logloss",
            random_state=42,
            verbosity=0,
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200,
            max_depth=None,
            min_samples_leaf=2,
            n_jobs=-1,
            random_state=42,
        ),
    }

    results    = {}
    best_model = None
    best_name  = None
    best_f1    = -1

    for name, model in models.items():
        print(f"\n{'─'*40}")
        print(f"Training {name} …")
        t0 = time.time()
        model.fit(X_tr, y_tr)
        elapsed = time.time() - t0
        print(f"  Trained in {elapsed:.1f}s")

        # 5-fold CV
        cv = cross_validate(
            model, X_tr, y_tr,
            cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
            scoring=["accuracy", "precision", "recall", "f1", "roc_auc"],
            n_jobs=-1,
        )
        cv_summary = {m.replace("test_", ""): {
            "mean": round(float(cv[m].mean()), 4),
            "std":  round(float(cv[m].std()),  4),
        } for m in cv if m.startswith("test_")}

        # Test set
        metrics = evaluate_model(name, model, X_te, y_te)
        results[name] = {
            "metrics":     metrics,
            "cv_5fold":    cv_summary,
            "train_time_sec": round(elapsed, 2),
        }

        print(f"  Accuracy={metrics['accuracy']:.4f}  "
              f"Precision={metrics['precision']:.4f}  "
              f"Recall={metrics['recall']:.4f}  "
              f"F1={metrics['f1_score']:.4f}  "
              f"AUC={metrics['roc_auc']:.4f}")

        if metrics["f1_score"] > best_f1:
            best_f1    = metrics["f1_score"]
            best_model = model
            best_name  = name

    # 4. Feature importances for best model
    if hasattr(best_model, "feature_importances_"):
        imps  = best_model.feature_importances_
        order = np.argsort(imps)[::-1]
        top10 = [{"feature": FEATURE_NAMES[i], "importance": round(float(imps[i]), 6), "rank": r+1}
                 for r, i in enumerate(order[:15])]
    else:
        top10 = []

    # 5. Save model + artefacts
    joblib.dump(best_model, MODEL_OUT)
    with open(FEAT_NAMES, "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)

    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_summary": {
            "total_samples": int(len(y)),
            "num_features":  len(FEATURE_NAMES),
            "train_samples": int(len(X_tr)),
            "test_samples":  int(len(X_te)),
            "sources":       ["PhishTank (verified active phishing)", "Tranco Top Domains (legitimate)"],
            "class_distribution": {"legitimate": n_legit, "phishing": n_phish},
        },
        "best_model": {
            "name":        best_name,
            "test_metrics": results[best_name]["metrics"],
            "cv_scores_5fold": results[best_name]["cv_5fold"],
            "top_features": top10,
        },
        "all_models_comparison": results,
    }

    with open(REPORT_OUT, "w") as f:
        json.dump(report, f, indent=2)

    # 6. Summary
    m = results[best_name]["metrics"]
    cm = m["confusion_matrix"]
    print(f"\n{'='*60}")
    print(f" ✅ Best Model: {best_name}")
    print(f" Accuracy  : {m['accuracy']:.4f}")
    print(f" Precision : {m['precision']:.4f}")
    print(f" Recall    : {m['recall']:.4f}")
    print(f" F1-Score  : {m['f1_score']:.4f}")
    print(f" ROC-AUC   : {m['roc_auc']:.4f}")
    print(f" TN={cm['tn']}  FP={cm['fp']}  FN={cm['fn']}  TP={cm['tp']}")
    print(f"\n Top Features:")
    for feat in top10[:5]:
        print(f"   #{feat['rank']}  {feat['feature']:35s}  {feat['importance']*100:.2f}%")
    print(f"\n Model saved → {MODEL_OUT}")
    print(f" Report saved → {REPORT_OUT}")
    print("="*60)


if __name__ == "__main__":
    main()
