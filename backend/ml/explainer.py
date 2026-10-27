"""VYRA SHAP Explainability Engine.

Computes feature importance and individual prediction attributions using SHAP
(SHapley Additive exPlanations) or heuristic permutation approximation.
"""

import logging
from typing import Any, Dict, List, Optional
import numpy as np

try:
    import shap
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

logger = logging.getLogger("vyra.ml.explainer")


class SHAPExplainer:
    """Explains machine learning predictions using TreeExplainer, KernelExplainer, or heuristic permutation."""

    # Heuristic impact weights and benign baseline values for fallback explanation
    FEATURE_IMPACT_WEIGHTS: Dict[str, Dict[str, float]] = {
        "has_ip_address": {"weight": 0.35, "baseline": 0.0},
        "has_suspicious_tld": {"weight": 0.28, "baseline": 0.0},
        "has_at_symbol": {"weight": 0.25, "baseline": 0.0},
        "domain_has_numbers_replacing_letters": {"weight": 0.22, "baseline": 0.0},
        "tld_in_path": {"weight": 0.20, "baseline": 0.0},
        "has_double_slash_redirect": {"weight": 0.18, "baseline": 0.0},
        "has_punycode": {"weight": 0.22, "baseline": 0.0},
        "suspicious_keywords": {"weight": 0.18, "baseline": 0.0},
        "is_shortened_url": {"weight": 0.18, "baseline": 0.0},
        "domain_age_suspicious": {"weight": 0.16, "baseline": 0.0},
        "uses_port": {"weight": 0.14, "baseline": 0.0},
        "is_https": {"weight": -0.15, "baseline": 1.0},
        "special_char_ratio": {"weight": 0.40, "baseline": 0.08},
        "entropy": {"weight": 0.08, "baseline": 3.6},
        "domain_entropy": {"weight": 0.08, "baseline": 2.8},
        "digit_count_in_domain": {"weight": 0.08, "baseline": 0.0},
        "subdomain_count": {"weight": 0.06, "baseline": 1.0},
        "redirect_count": {"weight": 0.12, "baseline": 0.0},
        "path_depth": {"weight": 0.05, "baseline": 1.0},
        "digit_ratio": {"weight": 0.20, "baseline": 0.05},
        "has_hex_encoding": {"weight": 0.14, "baseline": 0.0},
        "num_dots": {"weight": 0.04, "baseline": 2.0},
        "num_hyphens": {"weight": 0.04, "baseline": 0.0},
        "num_slashes": {"weight": 0.03, "baseline": 3.0},
        "url_length": {"weight": 0.002, "baseline": 35.0},
        "domain_length": {"weight": 0.005, "baseline": 14.0},
        "path_length": {"weight": 0.002, "baseline": 12.0},
        "query_length": {"weight": 0.003, "baseline": 0.0},
    }

    def __init__(self) -> None:
        self.cached_explainer: Optional[Any] = None
        self.cached_model: Optional[Any] = None

    def _approximate_feature_contributions(
        self,
        features_array: np.ndarray,
        feature_names: List[str],
    ) -> List[Dict[str, Any]]:
        """Approximate SHAP values using feature deviation from benign baselines and domain weights.

        Args:
            features_array: 1D or 2D NumPy array of feature values.
            feature_names: List of feature names.

        Returns:
            List of feature contribution dictionaries.
        """
        arr_1d = features_array[0] if features_array.ndim > 1 else features_array
        explanations = []

        for idx, name in enumerate(feature_names):
            if idx >= len(arr_1d):
                continue
            val = float(arr_1d[idx])
            spec = self.FEATURE_IMPACT_WEIGHTS.get(name, {"weight": 0.05, "baseline": 0.0})
            weight = spec["weight"]
            baseline = spec["baseline"]

            # Calculate contribution relative to benign baseline
            delta = val - baseline

            if name == "is_https":
                # HTTPS is protective; absent HTTPS increases risk
                shap_val = -0.12 if val >= 0.5 else 0.18
            elif name in ("has_ip_address", "has_suspicious_tld", "has_at_symbol",
                          "domain_has_numbers_replacing_letters", "tld_in_path",
                          "has_double_slash_redirect", "has_punycode", "is_shortened_url",
                          "domain_age_suspicious", "uses_port", "has_hex_encoding"):
                shap_val = weight if val >= 0.5 else 0.0
            else:
                shap_val = delta * weight

            shap_val = float(np.clip(shap_val, -1.0, 1.0))

            impact = "increases_risk" if shap_val > 0 else "decreases_risk"
            explanations.append({
                "feature": name,
                "value": round(val, 4),
                "shap_value": round(shap_val, 4),
                "impact": impact,
            })

        # Sort by absolute impact descending and return top 10
        explanations.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        return explanations[:10]

    def explain(
        self,
        model: Optional[Any],
        features_array: np.ndarray,
        feature_names: List[str],
    ) -> List[Dict[str, Any]]:
        """Compute SHAP explanations for the input features using model or approximation.

        Args:
            model: Optional trained model object.
            features_array: NumPy array of shape (1, num_features) or (num_features,).
            feature_names: List of feature names in canonical order.

        Returns:
            List of dicts: [{"feature": str, "value": float, "shap_value": float, "impact": str}]
        """
        if features_array.ndim == 1:
            arr = np.expand_dims(features_array, axis=0)
        else:
            arr = features_array

        if model is None or not HAS_SHAP:
            return self._approximate_feature_contributions(arr, feature_names)

        try:
            # Re-use or initialize TreeExplainer
            if self.cached_model is not model or self.cached_explainer is None:
                try:
                    self.cached_explainer = shap.TreeExplainer(model)
                    self.cached_model = model
                except Exception as tree_err:
                    logger.debug("TreeExplainer not compatible (%s); attempting standard Explainer", tree_err)
                    # Attempt general explainer with synthetic zero-background
                    background = np.zeros((1, arr.shape[1]), dtype=np.float32)
                    self.cached_explainer = shap.KernelExplainer(model.predict_proba, background)
                    self.cached_model = model

            raw_shap = self.cached_explainer.shap_values(arr)

            # Unify SHAP output structure across formats
            if hasattr(raw_shap, "values"):
                vals_matrix = raw_shap.values
                if vals_matrix.ndim == 3:
                    phish_col = 1 if vals_matrix.shape[2] > 1 else 0
                    shap_vals = vals_matrix[0, :, phish_col]
                elif vals_matrix.ndim == 2:
                    shap_vals = vals_matrix[0]
                else:
                    shap_vals = vals_matrix
            elif isinstance(raw_shap, list) and len(raw_shap) >= 2:
                # Class 1 (phishing)
                shap_vals = raw_shap[1][0]
            elif isinstance(raw_shap, np.ndarray):
                if raw_shap.ndim == 3:
                    phish_col = 1 if raw_shap.shape[2] > 1 else 0
                    shap_vals = raw_shap[0, :, phish_col]
                elif raw_shap.ndim == 2:
                    shap_vals = raw_shap[0]
                else:
                    shap_vals = raw_shap
            else:
                shap_vals = np.array(raw_shap).flatten()

            results = []
            for i, name in enumerate(feature_names):
                if i < len(shap_vals) and i < arr.shape[1]:
                    s_val = float(shap_vals[i])
                    val = float(arr[0][i])
                    results.append({
                        "feature": name,
                        "value": round(val, 4),
                        "shap_value": round(s_val, 4),
                        "impact": "increases_risk" if s_val > 0 else "decreases_risk",
                    })

            # Sort by absolute SHAP value descending and return top 10
            results.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
            return results[:10]

        except Exception as exc:
            logger.warning("SHAP calculation encountered error (%s); using approximation fallback.", exc)
            return self._approximate_feature_contributions(arr, feature_names)


# Global singleton instance
explainer = SHAPExplainer()
