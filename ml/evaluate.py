"""
Evaluation module for VYRA phishing URL detection models.

Provides utilities for performance evaluation, cross-validation,
terminal-based confusion matrix rendering, and detailed metric reporting.
"""

from typing import Any, Dict, List, Optional, Tuple, Union
import joblib
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
from sklearn.model_selection import StratifiedKFold, cross_validate


def plot_confusion_matrix(
    cm: Union[np.ndarray, List[List[int]]],
    labels: Optional[List[str]] = None
) -> str:
    """
    Renders a text-based ASCII confusion matrix formatted for terminal display.

    Parameters:
        cm: 2x2 confusion matrix array or list of lists [[TN, FP], [FN, TP]].
        labels: Optional custom class labels (default: ['Legitimate', 'Phishing']).

    Returns:
        str: Formatted ASCII string representation of the confusion matrix.
    """
    if labels is None:
        labels = ["Legitimate (0)", "Phishing (1)"]

    cm_arr = np.array(cm)
    tn, fp = cm_arr[0, 0], cm_arr[0, 1]
    fn, tp = cm_arr[1, 0], cm_arr[1, 1]
    total = tn + fp + fn + tp
    total = max(total, 1)

    lines = [
        "",
        "+---------------------------------------------------------------+",
        "|                     CONFUSION MATRIX                          |",
        "+---------------------------------------------------------------+",
        f"| Actual \\ Predicted       | {labels[0]:<17} | {labels[1]:<17} |",
        "+--------------------------+-------------------+-------------------+",
        f"| {labels[0]:<24} | TN: {tn:<7} ({tn/total*100:5.1f}%) | FP: {fp:<7} ({fp/total*100:5.1f}%) |",
        f"| {labels[1]:<24} | FN: {fn:<7} ({fn/total*100:5.1f}%) | TP: {tp:<7} ({tp/total*100:5.1f}%) |",
        "+--------------------------+-------------------+-------------------+",
        f"| Total Samples: {total:<47} |",
        "+---------------------------------------------------------------+",
        ""
    ]
    return "\n".join(lines)


def generate_classification_report(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    target_names: Optional[List[str]] = None
) -> str:
    """
    Generates a formatted classification report.

    Parameters:
        y_true: True binary labels.
        y_pred: Predicted binary labels.
        target_names: Optional class names (default: ['Legitimate', 'Phishing']).

    Returns:
        str: Text classification report.
    """
    if target_names is None:
        target_names = ["Legitimate (0)", "Phishing (1)"]
    return classification_report(y_true, y_pred, target_names=target_names, digits=4)


def cross_validate_model(
    model: Any,
    X: np.ndarray,
    y: np.ndarray,
    cv: int = 5
) -> Dict[str, Dict[str, float]]:
    """
    Performs stratified K-fold cross-validation on the model and computes
    mean and std for accuracy, precision, recall, F1, and ROC-AUC.

    Parameters:
        model: Scikit-learn or XGBoost estimator.
        X: Feature matrix.
        y: Target label vector.
        cv: Number of cross-validation folds (default: 5).

    Returns:
        Dict: Mapping of metric names to dicts containing 'mean' and 'std'.
    """
    scoring = {
        "accuracy": "accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc"
    }

    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    scores = cross_validate(model, X, y, cv=skf, scoring=scoring, n_jobs=-1)

    results: Dict[str, Dict[str, float]] = {}
    for metric in scoring:
        key = f"test_{metric}"
        if key in scores:
            results[metric] = {
                "mean": float(np.mean(scores[key])),
                "std": float(np.std(scores[key]))
            }

    return results


def evaluate_predictions(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Computes standard evaluation metrics from predictions.

    Parameters:
        y_true: Ground truth labels.
        y_pred: Model predictions.
        y_proba: Optional prediction probabilities for class 1.

    Returns:
        Dict containing accuracy, precision, recall, f1, roc_auc, and confusion matrix.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    roc_auc = 0.0
    if y_proba is not None:
        try:
            roc_auc = float(roc_auc_score(y_true, y_proba))
        except Exception:
            roc_auc = float(roc_auc_score(y_true, y_pred))
    else:
        roc_auc = float(roc_auc_score(y_true, y_pred))

    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "confusion_matrix": {
            "matrix": cm.tolist(),
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "tp": tp
        }
    }


def load_model_and_evaluate(
    model_path: str,
    test_data: Union[Tuple[np.ndarray, np.ndarray], Any]
) -> Dict[str, Any]:
    """
    Loads a serialized joblib model and evaluates its performance on the test set.

    Parameters:
        model_path: Path to the .joblib model file.
        test_data: Tuple of (X_test, y_test).

    Returns:
        Dict: Performance metrics dictionary.
    """
    model = joblib.load(model_path)
    X_test, y_test = test_data

    y_pred = model.predict(X_test)
    y_proba = None
    if hasattr(model, "predict_proba"):
        try:
            y_proba = model.predict_proba(X_test)[:, 1]
        except Exception:
            pass
    elif hasattr(model, "decision_function"):
        try:
            y_proba = model.decision_function(X_test)
        except Exception:
            pass

    metrics = evaluate_predictions(y_test, y_pred, y_proba)
    metrics["model_path"] = model_path
    metrics["classification_report"] = generate_classification_report(y_test, y_pred)
    return metrics
