"""Inference interface for the trained IoT intrusion detection model artifact.

Loads the self-contained pipeline (preprocessing + Random Forest), validates
input feature structures, and generates predictions with associated confidence scores.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import joblib
import pandas as pd

from core.provenance import verify_model_integrity


class IntrusionDetector:
    """Wrapper around the serialized intrusion detection pipeline with optional integrity gating."""

    def __init__(
        self,
        artifact_path: str | Path = "ml/artifacts/ids_model.joblib",
        expected_hash: Optional[str] = None,
    ):
        self.artifact_path = Path(artifact_path)
        if not self.artifact_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {self.artifact_path}. "
                "Please run 'python -m ml.train' first."
            )

        # Optional integrity verification gate
        self.expected_hash = expected_hash
        self.verification_result = None
        if expected_hash is not None:
            self.verification_result = verify_model_integrity(
                model_path=self.artifact_path,
                expected_hash=expected_hash,
            )
            if not self.verification_result["verified"]:
                raise PermissionError(
                    f"Cryptographic Integrity Verification Failure: Model artifact verification failed with status "
                    f"'{self.verification_result['status']}'. Expected {expected_hash}, got "
                    f"{self.verification_result['actual_hash']}. Model loading aborted."
                )

        self.pipeline = joblib.load(self.artifact_path)

        # Attempt to load metadata if present
        metadata_path = self.artifact_path.parent / "model_metadata.json"
        self.metadata = {}
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)

    def predict(self, data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]) -> List[Dict[str, Any]]:
        """Perform intrusion detection inference on input records.

        Accepts:
            A single dict of feature:value pairs, a list of dicts, or a pandas DataFrame.
        Returns:
            List of dictionaries with prediction, label, and confidence score.
        """
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, pd.DataFrame):
            df = data.copy()
        else:
            raise TypeError("Input data must be a dict, list of dicts, or pandas DataFrame.")

        # Exclude non-predictive columns if passed accidentally
        cols_to_drop = [c for c in ["id", "label", "attack_cat"] if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        # Predict binary classifications and probability confidences
        raw_preds = self.pipeline.predict(df)
        has_proba = hasattr(self.pipeline, "predict_proba")
        raw_probs = self.pipeline.predict_proba(df) if has_proba else None

        results = []
        for i, pred in enumerate(raw_preds):
            pred_int = int(pred)
            human_label = "Malicious" if pred_int == 1 else "Benign"
            confidence = float(raw_probs[i][pred_int]) if raw_probs is not None else 1.0
            prob_dict = {
                "Benign": float(raw_probs[i][0]),
                "Malicious": float(raw_probs[i][1]),
            } if raw_probs is not None else {}

            results.append({
                "prediction": pred_int,
                "label": human_label,
                "confidence": round(confidence, 4),
                "probabilities": prob_dict,
            })

        return results


def run_sample_prediction() -> None:
    """Run a quick demonstration using sample test records."""
    detector = IntrusionDetector()
    test_csv = Path("data/raw/UNSW_NB15_testing-set.csv")
    if not test_csv.exists():
        print(f"Test dataset {test_csv} not found for sample prediction demo.")
        return

    sample_df = pd.read_csv(test_csv, nrows=5)
    print("\n--- SAMPLE INFERENCE ON UNSEEN TRAFFIC RECORDS ---")
    predictions = detector.predict(sample_df)
    for i, res in enumerate(predictions):
        ground_truth = int(sample_df.iloc[i].get("label", -1))
        gt_label = "Malicious" if ground_truth == 1 else "Benign"
        print(f"Packet #{i+1} | Ground Truth: {gt_label:<9} | Model: {res['label']:<9} (Confidence: {res['confidence']*100:.1f}%)")


if __name__ == "__main__":
    run_sample_prediction()
