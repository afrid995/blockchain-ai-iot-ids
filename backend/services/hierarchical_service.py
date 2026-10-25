"""Hierarchical Two-Stage Inference Service with Advisory Response Recommendations.

Phase 7B.5.3: Final End-to-End Hierarchical Integration
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

CRITICAL RESEARCH BOUNDARIES:
1. Blockchain provenance verification occurs strictly once at application/model startup.
2. Zero blockchain queries are performed per network flow (per_flow_blockchain_queries == 0).
3. If Stage 1 predicts Benign (0), Stage 2 is bypassed and final prediction is 'Normal'.
4. If Stage 1 predicts Attack (1), Stage 2 is conditionally invoked exactly once to determine
   one of nine UNSW-NB15 attack categories.
5. Deterministic advisory mitigation guidance is attached for human operator review.
6. Zero automated remediation (no iptables, no socket drops, no firewall modifications).
7. Raw 42-feature flow vectors are strictly excluded from persistent audit logs.
"""

from __future__ import annotations

import datetime
import time
from typing import Any, Dict, List, Optional, Union

import pandas as pd

from backend.services.audit_service import AuditService
from backend.services.model_service import ModelService
from backend.services.prediction_service import ModelNotReadyError
from backend.services.verification_service import VerificationService
from core.blockchain import BlockchainRegistryClient
from core.response_recommendations import get_response_recommendation


class HierarchicalService:
    """Manages two-stage hierarchical inference (Binary IDS -> Multiclass Attack Classifier)

    coupled with deterministic advisory response recommendations and tamper-evident audit logging.
    """

    def __init__(
        self,
        stage1_model_service: ModelService,
        stage2_model_service: ModelService,
        audit_service: Optional[AuditService] = None,
        blockchain_client: Optional[BlockchainRegistryClient] = None,
    ) -> None:
        self.stage1_model_service = stage1_model_service
        self.stage2_model_service = stage2_model_service
        self.audit_service = audit_service
        self.blockchain_client = blockchain_client

    @property
    def is_loaded(self) -> bool:
        """Both Stage 1 and Stage 2 models must be successfully loaded."""
        return self.stage1_model_service.is_loaded and self.stage2_model_service.is_loaded

    @property
    def verification_status(self) -> str:
        """Composite verification status of the two models."""
        s1 = self.stage1_model_service.verification_status
        s2 = self.stage2_model_service.verification_status
        if s1 == "VERIFIED" and s2 == "VERIFIED":
            return "VERIFIED"
        if s1 != "VERIFIED":
            return s1
        return s2

    def verify_and_load(self, verification_service: VerificationService) -> Dict[str, Any]:
        """Execute fail-closed provenance verification for both models.

        Startup gate only — not executed per flow.
        """
        r1 = self.stage1_model_service.verify_and_load(verification_service)
        r2 = self.stage2_model_service.verify_and_load(verification_service)

        both_verified = bool(r1.get("verified", False) and r2.get("verified", False))
        overall_status = "VERIFIED" if both_verified else (
            r1.get("status") if not r1.get("verified") else r2.get("status")
        )

        return {
            "verified": both_verified,
            "status": overall_status,
            "stage1": r1,
            "stage2": r2,
            "stage1_model_id": self.stage1_model_service.model_id,
            "stage2_model_id": self.stage2_model_service.model_id,
        }

    def unload_models(self) -> None:
        """Unload both model artifacts from memory on shutdown."""
        self.stage1_model_service.unload_model()
        self.stage2_model_service.unload_model()

    def predict(
        self, feature_data: Union[Dict[str, Any], List[Dict[str, Any]], pd.DataFrame]
    ) -> Dict[str, Any]:
        """Execute off-chain hierarchical inference on a network flow record.

        Enforces:
        1. Both Stage 1 and Stage 2 models must be verified and loaded.
        2. Per-flow blockchain query count must remain exactly zero.
        3. Stage 1 routes Benign -> 'Normal' without calling Stage 2.
        4. Stage 1 routes Attack -> Stage 2 multiclass category.
        5. Deterministic advisory recommendation is attached.
        6. Privacy-preserving audit events are emitted (no raw features in DB).
        """
        # 1. Verification gate check (fail-closed)
        if not self.is_loaded or self.verification_status != "VERIFIED":
            status_desc = self.verification_status
            err_msg = (
                f"Hierarchical inference rejected: Models are not verified or loaded (status: '{status_desc}'). "
                "Fail-closed verification gate is active."
            )
            if self.audit_service:
                self.audit_service.log_event(
                    event_type="MODEL_LOAD_BLOCKED",
                    status="WARNING",
                    model_id=f"{self.stage1_model_service.model_id}+{self.stage2_model_service.model_id}",
                    model_version=f"{self.stage1_model_service.model_version}+{self.stage2_model_service.model_version}",
                    verification_status=status_desc,
                    details={"rejection_reason": err_msg},
                )
            raise ModelNotReadyError(err_msg, status=status_desc)

        stage1_pipeline = self.stage1_model_service.model_pipeline
        stage2_pipeline = self.stage2_model_service.model_pipeline
        if stage1_pipeline is None or stage2_pipeline is None:
            raise ModelNotReadyError(
                "Model pipeline references are null.", status="SYSTEM_ERROR"
            )

        # 2. Prepare DataFrame
        if isinstance(feature_data, dict):
            df = pd.DataFrame([feature_data])
        elif isinstance(feature_data, list):
            df = pd.DataFrame(feature_data)
        elif isinstance(feature_data, pd.DataFrame):
            df = feature_data.copy()
        else:
            raise TypeError(
                "Feature data must be a dictionary, list of dictionaries, or pandas DataFrame."
            )

        # Strip non-feature target columns if passed accidentally
        cols_to_drop = [c for c in ["id", "label", "attack_cat"] if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        # 3. Instrument blockchain queries: capture pre-inference query counter
        initial_queries = (
            self.blockchain_client.get_query_count() if self.blockchain_client else 0
        )

        # 4. Isolated hierarchical inference execution
        t_start = time.perf_counter()

        # Stage 1: Binary classification
        raw_s1 = stage1_pipeline.predict(df)[0]
        s1_code = int(raw_s1)
        s1_label = "Attack" if s1_code == 1 else "Benign"

        has_s1_proba = hasattr(stage1_pipeline, "predict_proba")
        s1_proba = stage1_pipeline.predict_proba(df)[0] if has_s1_proba else None
        s1_conf = float(s1_proba[s1_code]) if s1_proba is not None else 1.0

        # Stage 2: Conditional multiclass classification
        if s1_code == 0:
            # Benign flow: bypass Stage 2
            stage2_invoked = False
            s2_pred = None
            s2_conf = None
            final_category = "Normal"
        else:
            # Attack flow: invoke Stage 2
            stage2_invoked = True
            raw_s2 = str(stage2_pipeline.predict(df)[0])
            s2_pred = raw_s2
            final_category = raw_s2

            has_s2_proba = hasattr(stage2_pipeline, "predict_proba")
            if has_s2_proba:
                s2_proba = stage2_pipeline.predict_proba(df)[0]
                classes = list(stage2_pipeline.classes_)
                if raw_s2 in classes:
                    s2_conf = float(s2_proba[classes.index(raw_s2)])
                else:
                    s2_conf = 1.0
            else:
                s2_conf = 1.0

        # Advisory Recommendation Layer (deterministic taxonomy mapping)
        rec = get_response_recommendation(final_category)

        inference_latency_ms = (time.perf_counter() - t_start) * 1000.0

        # 5. Measure per-flow blockchain query count
        final_queries = (
            self.blockchain_client.get_query_count() if self.blockchain_client else 0
        )
        per_flow_blockchain_queries = final_queries - initial_queries
        assert (
            per_flow_blockchain_queries == 0
        ), f"Per-flow blockchain queries must be 0, observed: {per_flow_blockchain_queries}"

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 6. Record privacy-conscious security audit events (strictly NO raw features)
        event_id = "unrecorded"
        if self.audit_service:
            event = self.audit_service.log_event(
                event_type="PREDICTION",
                status="SUCCESS",
                model_id=self.stage1_model_service.model_id,
                model_version=self.stage1_model_service.model_version,
                verification_status=self.verification_status,
                prediction=final_category,
                inference_latency_ms=inference_latency_ms,
                details={
                    "pipeline": "hierarchical",
                    "stage1_prediction": s1_label,
                    "stage1_code": s1_code,
                    "stage1_confidence": round(s1_conf, 4),
                    "stage2_invoked": stage2_invoked,
                    "stage2_model_id": self.stage2_model_service.model_id,
                    "stage2_model_version": self.stage2_model_service.model_version,
                    "stage2_prediction": s2_pred,
                    "stage2_confidence": round(s2_conf, 4) if s2_conf is not None else None,
                    "final_prediction": final_category,
                    "advisory_category": rec["category"],
                    "advisory_severity": rec["severity"],
                    "advisory_priority": rec["investigation_priority"],
                    "is_advisory": rec["is_advisory"],
                    "requires_human_approval": rec["requires_human_approval"],
                    "automated_remediation_enabled": rec["automated_remediation_enabled"],
                    "per_flow_blockchain_queries": per_flow_blockchain_queries,
                },
            )
            event_id = event["event_id"]

            # Emit advisory recommendation audit log
            self.audit_service.log_event(
                event_type="ADVISORY_RECOMMENDATION",
                status="SUCCESS",
                model_id=self.stage2_model_service.model_id if stage2_invoked else self.stage1_model_service.model_id,
                model_version=self.stage2_model_service.model_version if stage2_invoked else self.stage1_model_service.model_version,
                verification_status=self.verification_status,
                prediction=final_category,
                details={
                    "prediction_event_id": event_id,
                    "category": rec["category"],
                    "severity": rec["severity"],
                    "investigation_priority": rec["investigation_priority"],
                    "recommended_action": rec["recommended_action"],
                    "operator_guidance": rec["operator_guidance"],
                    "rationale": rec["rationale"],
                    "limitations": rec["limitations"],
                    "is_advisory": rec["is_advisory"],
                    "requires_human_approval": rec["requires_human_approval"],
                    "automated_remediation_enabled": rec["automated_remediation_enabled"],
                },
            )

        # 7. Construct structured API response
        return {
            "final_prediction": final_category,
            "stage1_prediction": s1_label,
            "stage1_code": s1_code,
            "stage1_confidence": round(s1_conf, 4),
            "stage2_invoked": stage2_invoked,
            "stage2_prediction": s2_pred,
            "stage2_confidence": round(s2_conf, 4) if s2_conf is not None else None,
            "advisory_recommendation": rec,
            "stage1_model_id": self.stage1_model_service.model_id,
            "stage1_model_version": self.stage1_model_service.model_version,
            "stage2_model_id": self.stage2_model_service.model_id,
            "stage2_model_version": self.stage2_model_service.model_version,
            "verification_status": self.verification_status,
            "event_id": event_id,
            "inference_latency_ms": round(inference_latency_ms, 4),
            "per_flow_blockchain_queries": per_flow_blockchain_queries,
            "timestamp": timestamp,
        }
