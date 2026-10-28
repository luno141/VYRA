"""VYRA Phishing Detection Model Module.

Provides model loading, feature scoring, and fallback heuristics for URL classification.
"""

import logging
import os
from typing import Any, Dict, Optional, Union

import joblib
import numpy as np

from core.config import settings
from ml.features import FEATURE_NAMES, features_to_array

logger = logging.getLogger("vyra.ml.model")


class PhishingDetector:
    """Detects phishing URLs using a trained machine learning model or heuristic rules."""

    def __init__(self, model_path: Optional[str] = None) -> None:
        self.model_path = model_path or settings.ML_MODEL_PATH
        self.model: Optional[Any] = None
        self.load_model(self.model_path)

    def load_model(self, path: Optional[str] = None) -> Optional[Any]:
        """Load the trained machine learning model from disk.

        Args:
            path: Optional file path to the serialized model.

        Returns:
            The loaded model object, or None if not found or corrupted.
        """
        target_path = path or self.model_path
        if not target_path or not os.path.isfile(target_path):
            logger.info("ML model file not found at '%s'. Using rule-based fallback detector.", target_path)
            self.model = None
            return None

        try:
            loaded = joblib.load(target_path)
            self.model = loaded
            logger.info("Successfully loaded ML model from '%s'", target_path)
            return self.model
        except Exception as exc:
            logger.warning("Failed to load model from '%s': %s. Falling back to rules.", target_path, exc)
            self.model = None
            return None

    def _rule_based_fallback(self, feat_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Compute heuristic risk score and classification when ML model is unavailable.

        Args:
            feat_dict: Dict of extracted URL features.

        Returns:
            Dict containing prediction, confidence, and risk_score.
        """
        score = 0.0

        # High-severity indicators
        if feat_dict.get("has_ip_address", 0):
            score += 26.0
        if feat_dict.get("has_suspicious_tld", 0):
            score += 22.0
        if feat_dict.get("has_at_symbol", 0):
            score += 20.0
        if feat_dict.get("domain_has_numbers_replacing_letters", 0):
            score += 18.0
        if feat_dict.get("tld_in_path", 0):
            score += 16.0
        if feat_dict.get("has_double_slash_redirect", 0):
            score += 15.0
        if feat_dict.get("has_punycode", 0):
            score += 18.0

        # Keywords correlation
        keywords = feat_dict.get("suspicious_keywords", 0)
        if keywords > 0:
            score += min(keywords * 12.0, 36.0)

        # Domain and URL structural heuristics
        if feat_dict.get("is_shortened_url", 0):
            score += 16.0
        if feat_dict.get("domain_age_suspicious", 0):
            score += 14.0
        if feat_dict.get("uses_port", 0):
            score += 12.0
        if feat_dict.get("has_hex_encoding", 0):
            score += 10.0

        if not feat_dict.get("is_https", 0):
            score += 12.0
        else:
            score -= 5.0  # Slight benign factor for HTTPS

        if feat_dict.get("digit_count_in_domain", 0) >= 3:
            score += 12.0

        if feat_dict.get("subdomain_count", 0) >= 3:
            score += 10.0

        if feat_dict.get("special_char_ratio", 0.0) > 0.14:
            score += 10.0

        if feat_dict.get("entropy", 0.0) > 4.2:
            score += 10.0

        if feat_dict.get("redirect_count", 0) > 0:
            score += min(feat_dict.get("redirect_count", 0) * 8.0, 16.0)

        if feat_dict.get("path_depth", 0) >= 4:
            score += 8.0

        # Normalization and bounds
        risk_score = round(float(max(0.0, min(100.0, score))), 2)

        if risk_score >= 50.0:
            prediction = "phishing"
            # Scale confidence between 0.55 and 0.99
            confidence = round(0.55 + ((risk_score - 50.0) / 50.0) * 0.44, 4)
        else:
            prediction = "legitimate"
            # Scale confidence between 0.55 and 0.99
            confidence = round(0.55 + ((50.0 - risk_score) / 50.0) * 0.44, 4)

        return {
            "prediction": prediction,
            "confidence": float(confidence),
            "risk_score": float(risk_score),
        }

    def predict(self, features: Union[Dict[str, Any], np.ndarray]) -> Dict[str, Any]:
        """Perform classification using loaded model or rule-based fallback.

        Args:
            features: Dictionary of features or 2D NumPy array.

        Returns:
            Dict containing prediction ('phishing' or 'legitimate'), confidence, and risk_score.
        """
        # Convert input to both representations
        if isinstance(features, dict):
            feat_dict = features
            arr = features_to_array(features)
        else:
            arr = features
            if arr.ndim == 1:
                arr = np.expand_dims(arr, axis=0)
            feat_dict = {
                name: float(arr[0][i])
                for i, name in enumerate(FEATURE_NAMES)
                if i < arr.shape[1]
            }

        # If machine learning model is loaded, predict using model
        if self.model is not None:
            try:
                if hasattr(self.model, "predict_proba"):
                    probas = self.model.predict_proba(arr)[0]
                    # Check classes order
                    if hasattr(self.model, "classes_") and len(self.model.classes_) == 2:
                        classes_list = list(self.model.classes_)
                        phish_index = classes_list.index(1) if 1 in classes_list else 1
                        phishing_prob = float(probas[phish_index])
                    else:
                        phishing_prob = float(probas[-1])
                else:
                    pred = self.model.predict(arr)[0]
                    phishing_prob = 1.0 if pred in (1, "phishing", True) else 0.0

                # Precision-tuned decision threshold (0.70) to prevent False Positives on benign complex URLs
                OPERATIONAL_THRESHOLD = 0.70
                is_phishing = phishing_prob >= OPERATIONAL_THRESHOLD
                prediction = "phishing" if is_phishing else "legitimate"
                confidence = round(phishing_prob if is_phishing else (1.0 - phishing_prob), 4)
                risk_score = round(phishing_prob * 100.0, 2)

                return {
                    "prediction": prediction,
                    "confidence": float(confidence),
                    "risk_score": float(risk_score),
                }
            except Exception as exc:
                logger.warning("Error running model prediction: %s. Using rule fallback.", exc)

        # Fallback to rules
        return self._rule_based_fallback(feat_dict)


# Global singleton instance
detector = PhishingDetector()
