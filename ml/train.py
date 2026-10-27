"""
Model training pipeline for VYRA phishing URL detection.

Trains Random Forest and XGBoost classifiers with hyperparameter tuning,
evaluates both models across multiple classification metrics,
selects the best performing model, and serializes artifacts.
"""

import json
import os
import sys
import time

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from typing import Any, Dict, List, Tuple
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, train_test_split
from xgboost import XGBClassifier

from ml.dataset import load_or_generate_dataset, DATA_DIR, DEFAULT_DATASET_PATH
from ml.evaluate import (
    cross_validate_model,
    evaluate_predictions,
    generate_classification_report,
    plot_confusion_matrix,
)
from ml.features import FEATURE_NAMES

# Path configurations
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_OUTPUT_PATH = os.path.join(MODELS_DIR, "vyra_model.joblib")
FEATURE_NAMES_PATH = os.path.join(MODELS_DIR, "feature_names.json")
EVAL_REPORT_PATH = os.path.join(MODELS_DIR, "evaluation_report.json")


def tune_and_train_random_forest(
    X_train: np.ndarray,
    y_train: np.ndarray,
    cv_folds: int = 3
) -> Tuple[RandomForestClassifier, Dict[str, Any]]:
    """Tunes hyperparameters for Random Forest via GridSearchCV."""
    print("\n" + "=" * 60)
    print("  TRAINING & TUNING: Random Forest Classifier")
    print("=" * 60)

    param_grid = {
        "n_estimators": [100, 200],
        "max_depth": [15, 25, None],
        "min_samples_split": [2, 5],
        "min_samples_leaf": [1, 2],
    }

    rf_base = RandomForestClassifier(random_state=42, n_jobs=-1)
    grid_search = GridSearchCV(
        estimator=rf_base,
        param_grid=param_grid,
        scoring="f1",
        cv=cv_folds,
        n_jobs=-1,
        verbose=1,
    )

    start_time = time.time()
    grid_search.fit(X_train, y_train)
    elapsed = time.time() - start_time

    best_model: RandomForestClassifier = grid_search.best_estimator_
    print(f"Random Forest tuning completed in {elapsed:.2f}s")
    print(f"Best CV F1-Score: {grid_search.best_score_:.4f}")
    print(f"Best Parameters: {grid_search.best_params_}")

    return best_model, {
        "best_params": grid_search.best_params_,
        "best_cv_f1": float(grid_search.best_score_),
        "training_time_sec": float(elapsed),
    }


def tune_and_train_xgboost(
    X_train: np.ndarray,
    y_train: np.ndarray,
    cv_folds: int = 3
) -> Tuple[XGBClassifier, Dict[str, Any]]:
    """Tunes hyperparameters for XGBoost via GridSearchCV."""
    print("\n" + "=" * 60)
    print("  TRAINING & TUNING: XGBoost Classifier")
    print("=" * 60)

    param_grid = {
        "n_estimators": [100, 200],
        "max_depth": [4, 6],
        "learning_rate": [0.05, 0.1],
        "subsample": [0.8, 1.0],
    }

    xgb_base = XGBClassifier(
        random_state=42,
        eval_metric="logloss",
        n_jobs=-1,
    )

    grid_search = GridSearchCV(
        estimator=xgb_base,
        param_grid=param_grid,
        scoring="f1",
        cv=cv_folds,
        n_jobs=-1,
        verbose=1,
    )

    start_time = time.time()
    grid_search.fit(X_train, y_train)
    elapsed = time.time() - start_time

    best_model: XGBClassifier = grid_search.best_estimator_
    print(f"XGBoost tuning completed in {elapsed:.2f}s")
    print(f"Best CV F1-Score: {grid_search.best_score_:.4f}")
    print(f"Best Parameters: {grid_search.best_params_}")

    return best_model, {
        "best_params": grid_search.best_params_,
        "best_cv_f1": float(grid_search.best_score_),
        "training_time_sec": float(elapsed),
    }


def get_feature_importances(model: Any, feature_names: List[str]) -> List[Dict[str, Any]]:
    """Extracts and sorts feature importances from a fitted tree model."""
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        return [
            {
                "feature": feature_names[i],
                "importance": float(importances[i]),
                "rank": rank + 1,
            }
            for rank, i in enumerate(sorted_indices)
        ]
    return []


def print_comparison_table(rf_metrics: Dict[str, Any], xgb_metrics: Dict[str, Any]) -> None:
    """Prints a comparison table of evaluation metrics."""
    metrics_list = [
        ("Accuracy", "accuracy"),
        ("Precision", "precision"),
        ("Recall", "recall"),
        ("F1-Score", "f1_score"),
        ("ROC-AUC", "roc_auc"),
    ]

    print("\n" + "=" * 65)
    print("           MODEL TEST PERFORMANCE COMPARISON")
    print("=" * 65)
    print(f"{'Metric':<18} | {'Random Forest':<18} | {'XGBoost':<18} | {'Winner':<10}")
    print("-" * 65)

    for label, key in metrics_list:
        rf_val = rf_metrics[key]
        xgb_val = xgb_metrics[key]
        winner = "XGBoost" if xgb_val > rf_val else ("RF" if rf_val > xgb_val else "Tie")
        print(f"{label:<18} | {rf_val:<18.4f} | {xgb_val:<18.4f} | {winner:<10}")
    print("=" * 65)


def train_vyra_pipeline(
    n_samples: int = 5000,
    force_regenerate_data: bool = False
) -> Dict[str, Any]:
    """
    Executes the complete VYRA ML training, tuning, and evaluation pipeline.

    Parameters:
        n_samples (int): Number of synthetic samples if dataset generation is needed.
        force_regenerate_data (bool): Whether to force regeneration of the synthetic dataset.

    Returns:
        Dict: Final summary report of pipeline execution.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    print("=" * 70)
    print("               VYRA PHISHING URL DETECTION TRAINING")
    print("=" * 70)

    # 1. Dataset Loading / Generation
    X, y, feature_names, urls = load_or_generate_dataset(
        data_path=DEFAULT_DATASET_PATH,
        n_samples=n_samples,
        force_regenerate=force_regenerate_data,
        random_seed=42,
    )
    print(f"Total dataset size: {X.shape[0]} samples with {X.shape[1]} features.")
    print(f"Class distribution: Legitimate={np.sum(y == 0)}, Phishing={np.sum(y == 1)}")

    # 2. Stratified Train/Test Split (80/20)
    print("\nSplitting dataset (80% train, 20% test, stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Training samples: {X_train.shape[0]}, Test samples: {X_test.shape[0]}")

    # 3. Train & Tune Random Forest
    rf_best, rf_tune_info = tune_and_train_random_forest(X_train, y_train)

    # 4. Train & Tune XGBoost
    xgb_best, xgb_tune_info = tune_and_train_xgboost(X_train, y_train)

    # 5. Cross-validation on best models
    print("\nRunning 5-fold Stratified Cross-Validation on tuned models...")
    rf_cv_scores = cross_validate_model(rf_best, X_train, y_train, cv=5)
    xgb_cv_scores = cross_validate_model(xgb_best, X_train, y_train, cv=5)

    print(f"  Random Forest 5-Fold CV F1: {rf_cv_scores['f1']['mean']:.4f} +/- {rf_cv_scores['f1']['std']:.4f}")
    print(f"  XGBoost       5-Fold CV F1: {xgb_cv_scores['f1']['mean']:.4f} +/- {xgb_cv_scores['f1']['std']:.4f}")

    # 6. Evaluation on Test Set
    rf_y_pred = rf_best.predict(X_test)
    rf_y_proba = rf_best.predict_proba(X_test)[:, 1]
    rf_test_metrics = evaluate_predictions(y_test, rf_y_pred, rf_y_proba)

    xgb_y_pred = xgb_best.predict(X_test)
    xgb_y_proba = xgb_best.predict_proba(X_test)[:, 1]
    xgb_test_metrics = evaluate_predictions(y_test, xgb_y_pred, xgb_y_proba)

    # Print comparison
    print_comparison_table(rf_test_metrics, xgb_test_metrics)

    # 7. Model Selection (Selecting based on F1-score with ROC-AUC tiebreak)
    if xgb_test_metrics["f1_score"] > rf_test_metrics["f1_score"]:
        best_model_name = "XGBoost"
        best_model = xgb_best
        best_metrics = xgb_test_metrics
        best_y_pred = xgb_y_pred
        best_tune_info = xgb_tune_info
        best_cv_scores = xgb_cv_scores
    elif rf_test_metrics["f1_score"] > xgb_test_metrics["f1_score"]:
        best_model_name = "RandomForest"
        best_model = rf_best
        best_metrics = rf_test_metrics
        best_y_pred = rf_y_pred
        best_tune_info = rf_tune_info
        best_cv_scores = rf_cv_scores
    else:
        # Tie breaker on ROC-AUC
        if xgb_test_metrics["roc_auc"] >= rf_test_metrics["roc_auc"]:
            best_model_name = "XGBoost"
            best_model = xgb_best
            best_metrics = xgb_test_metrics
            best_y_pred = xgb_y_pred
            best_tune_info = xgb_tune_info
            best_cv_scores = xgb_cv_scores
        else:
            best_model_name = "RandomForest"
            best_model = rf_best
            best_metrics = rf_test_metrics
            best_y_pred = rf_y_pred
            best_tune_info = rf_tune_info
            best_cv_scores = rf_cv_scores

    print(f"\n>>> Selected Best Model: {best_model_name} (F1-Score: {best_metrics['f1_score']:.4f}, AUC: {best_metrics['roc_auc']:.4f})")

    # Render Confusion Matrix
    cm_plot = plot_confusion_matrix(best_metrics["confusion_matrix"]["matrix"])
    print(cm_plot)

    # Print Classification Report
    print("Classification Report on Test Data:")
    clf_report = generate_classification_report(y_test, best_y_pred)
    print(clf_report)

    # Top Feature Importances
    importances = get_feature_importances(best_model, feature_names)
    print("Top 10 Most Important Features:")
    print(f"{'Rank':<6} | {'Feature':<35} | {'Importance':<12}")
    print("-" * 57)
    for feat in importances[:10]:
        print(f"{feat['rank']:<6} | {feat['feature']:<35} | {feat['importance']:<12.4f}")

    # 8. Save Artifacts
    print("\nSaving trained model and artifacts...")

    # Save best model to joblib
    joblib.dump(best_model, MODEL_OUTPUT_PATH, compress=3)
    print(f"  [OK] Saved best model to: {MODEL_OUTPUT_PATH}")

    # Save feature names list
    with open(FEATURE_NAMES_PATH, "w", encoding="utf-8") as f:
        json.dump(feature_names, f, indent=2)
    print(f"  [OK] Saved feature names to: {FEATURE_NAMES_PATH}")

    # Save evaluation report
    report_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset_summary": {
            "total_samples": int(X.shape[0]),
            "num_features": int(X.shape[1]),
            "train_samples": int(X_train.shape[0]),
            "test_samples": int(X_test.shape[0]),
            "class_distribution": {
                "legitimate": int(np.sum(y == 0)),
                "phishing": int(np.sum(y == 1)),
            },
        },
        "best_model": {
            "name": best_model_name,
            "type": type(best_model).__name__,
            "tuning": best_tune_info,
            "test_metrics": best_metrics,
            "cv_scores_5fold": best_cv_scores,
            "top_features": importances[:15],
        },
        "all_models_test_comparison": {
            "RandomForest": {
                "metrics": rf_test_metrics,
                "tuning": rf_tune_info,
                "cv_scores_5fold": rf_cv_scores,
            },
            "XGBoost": {
                "metrics": xgb_test_metrics,
                "tuning": xgb_tune_info,
                "cv_scores_5fold": xgb_cv_scores,
            },
        },
        "feature_names": feature_names,
    }

    with open(EVAL_REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    print(f"  [OK] Saved evaluation report to: {EVAL_REPORT_PATH}")

    print("\n" + "=" * 70)
    print("           VYRA TRAINING PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 70 + "\n")

    return report_data


if __name__ == "__main__":
    force_gen = "--regenerate" in sys.argv
    train_vyra_pipeline(n_samples=5000, force_regenerate_data=force_gen)
