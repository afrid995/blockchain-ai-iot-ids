"""Off-chain ML inference service gated by model cryptographic verification.

Ensures that prediction requests can ONLY be served by a model artifact that has
passed the pre-load blockchain verification gate.
"""

from __future__ import annotations

import datetime
import time
from typing import Any, Dict, List, Optional, Union

import pandas as pd

from backend.services.audit_service import AuditService
from backend.services.model_service import ModelService


class ModelNotReadyError(Exception):
    """Raised when inference is requested but the model is not verified or loaded."""
    def __init__(self, message: str, status: str) -> None:
        super().__init__(message)
        self.status = status


class PredictionService:
    """Performs off-chain ML inference gated by the model verification status."""

    def __init__(
        self,
        model_service: ModelService,
        audit_service: Optional[AuditService] = None,
    ) -> None:
        self.model_service = model_service
        self.audit_service = audit_service

    def predict(self, feature_data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]) -> Dict[str, Any]:
        """Perform off-chain classification on an input network flow record.

        Enforces:
        1. Model must be loaded in memory.
        2. Model verification status must be VERIFIED.
        3. Inference is strictly off-chain (no blockchain calls per flow).
        4. Privacy-preserving audit event is emitted.
        """
        # 1. Gate check: Fail-closed if model is not loaded or not verified
        if not self.model_service.is_loaded or self.model_service.verification_status != "VERIFIED":
            status = self.model_service.verification_status
            err_msg = (
                f"Inference rejected: Model is not verified or loaded (status: '{status}'). "
                "Fail-closed verification gate is active."
            )
            if self.audit_service:
                self.audit_service.log_event(
                    event_type="MODEL_LOAD_BLOCKED",
                    status="WARNING",
                    model_id=self.model_service.model_id,
                    model_version=self.model_service.model_version,
                    verification_status=status,
                    details={"rejection_reason": err_msg},
                )
            raise ModelNotReadyError(err_msg, status=status)

        pipeline = self.model_service.model_pipeline
        if pipeline is None:
            raise ModelNotReadyError("Model pipeline reference is null.", status="SYSTEM_ERROR")

        # 2. Prepare DataFrame
        if isinstance(feature_data, dict):
            df = pd.DataFrame([feature_data])
        elif isinstance(feature_data, list):
            df = pd.DataFrame(feature_data)
        elif isinstance(feature_data, pd.DataFrame):
            df = feature_data.copy()
        else:
            raise TypeError("Feature data must be a dictionary, list of dictionaries, or pandas DataFrame.")

        # Drop non-feature target columns if passed accidentally
        cols_to_drop = [c for c in ["id", "label", "attack_cat"] if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        # 3. Time isolated ML inference (strictly excluding blockchain overhead)
        t_start = time.perf_counter()
        raw_pred = pipeline.predict(df)[0]
        has_proba = hasattr(pipeline, "predict_proba")
        raw_proba = pipeline.predict_proba(df)[0] if has_proba else None
        inference_latency_ms = (time.perf_counter() - t_start) * 1000.0

        pred_int = int(raw_pred)
        prediction_label = "Attack" if pred_int == 1 else "Benign"
        confidence = float(raw_proba[pred_int]) if raw_proba is not None else 1.0

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 4. Record privacy-conscious security audit event
        event_id = "unrecorded"
        if self.audit_service:
            event = self.audit_service.log_event(
                event_type="PREDICTION",
                status="SUCCESS",
                model_id=self.model_service.model_id,
                model_version=self.model_service.model_version,
                verification_status=self.model_service.verification_status,
                prediction=prediction_label,
                inference_latency_ms=round(inference_latency_ms, 4),
                details={
                    "feature_count": int(df.shape[1]),
                    "confidence": round(confidence, 4),
                    "prediction_code": pred_int,
                },
            )
            event_id = event["event_id"]

        return {
            "prediction": prediction_label,
            "prediction_code": pred_int,
            "confidence": round(confidence, 4),
            "model_id": self.model_service.model_id,
            "model_version": self.model_service.model_version,
            "verification_status": self.model_service.verification_status,
            "event_id": event_id,
            "inference_latency_ms": round(inference_latency_ms, 4),
            "timestamp": timestamp,
        }
