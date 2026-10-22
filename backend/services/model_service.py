"""Model lifecycle and fail-closed verification gatekeeper service.

CRITICAL SECURITY REQUIREMENT:
The system must NOT load the serialized model artifact before its cryptographic
integrity and blockchain provenance verification succeeds.
If verification fails (HASH_MISMATCH, NOT_REGISTERED, BLOCKCHAIN_UNAVAILABLE,
or FILE_NOT_FOUND), the model remains UNLOADED and inference remains BLOCKED.
"""

from __future__ import annotations

import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Union

import joblib

from core.hashing import calculate_sha256
from backend.services.audit_service import AuditService
from backend.services.verification_service import VerificationService


class ModelService:
    """Manages model artifact lifecycle protected by a strict pre-load verification gate."""

    def __init__(
        self,
        model_path: Union[str, Path],
        model_id: str = "iot-ids-rf",
        model_version: str = "v1.0.0",
        algorithm: str = "RandomForestClassifier",
        audit_service: Optional[AuditService] = None,
    ) -> None:
        self.model_path = Path(model_path)
        self.model_id = model_id
        self.model_version = model_version
        self.algorithm = algorithm
        self.audit_service = audit_service

        # Lifecycle gate state
        self.is_loaded: bool = False
        self.model_pipeline: Any = None
        self.verification_status: str = "UNVERIFIED"
        self.last_verification_result: Optional[Dict[str, Any]] = None
        self.last_verified_at: Optional[str] = None

    def verify_and_load(self, verification_service: VerificationService) -> Dict[str, Any]:
        """Execute the verification gate and conditionally load the model artifact.

        Lifecycle:
        1. Calculate SHA-256 of local file.
        2. Query smart contract on blockchain for registered digest.
        3. Strict byte comparison.
        4. If VERIFIED -> load into memory via joblib.load() and enable inference.
        5. If ANY FAILURE -> abort loading, purge pipeline from memory, and log security alert.
        """
        v_res = verification_service.verify(
            model_path=self.model_path,
            model_id=self.model_id,
            version=self.model_version,
        )

        self.last_verification_result = v_res
        self.last_verified_at = v_res.get("timestamp")

        if v_res["verified"] is True and v_res["status"] == "VERIFIED":
            try:
                # Gated deserialization: strictly executed only after hash verification passes
                self.model_pipeline = joblib.load(self.model_path)
                self.is_loaded = True
                self.verification_status = "VERIFIED"

                if self.audit_service:
                    self.audit_service.log_event(
                        event_type="MODEL_LOAD",
                        status="SUCCESS",
                        model_id=self.model_id,
                        model_version=self.model_version,
                        verification_status="VERIFIED",
                        details={
                            "model_path": str(self.model_path),
                            "local_hash": v_res.get("local_hash"),
                            "registered_hash": v_res.get("registered_hash"),
                            "message": "Model passed verification gate and was successfully loaded into memory.",
                        },
                    )
            except Exception as e:
                # If deserialization fails despite hash matching (e.g. corrupt pickle structure)
                self.model_pipeline = None
                self.is_loaded = False
                self.verification_status = "SYSTEM_ERROR"
                v_res["verified"] = False
                v_res["status"] = "SYSTEM_ERROR"
                v_res["message"] = f"Deserialization error after verification: {e}"

                if self.audit_service:
                    self.audit_service.log_event(
                        event_type="SYSTEM_ERROR",
                        status="ERROR",
                        model_id=self.model_id,
                        model_version=self.model_version,
                        verification_status="SYSTEM_ERROR",
                        details={"error": str(e)},
                    )
        else:
            # FAIL-CLOSED: strictly prohibit loading
            self.model_pipeline = None
            self.is_loaded = False
            self.verification_status = v_res["status"]

            if self.audit_service:
                self.audit_service.log_event(
                    event_type="MODEL_LOAD_BLOCKED",
                    status="WARNING" if v_res["status"] != "BLOCKCHAIN_UNAVAILABLE" else "ERROR",
                    model_id=self.model_id,
                    model_version=self.model_version,
                    verification_status=v_res["status"],
                    details={
                        "reason": v_res.get("message"),
                        "status": v_res["status"],
                        "local_hash": v_res.get("local_hash"),
                        "registered_hash": v_res.get("registered_hash"),
                    },
                )

        return v_res

    def unload_model(self) -> None:
        """Purge model pipeline from memory and reset gate state."""
        self.model_pipeline = None
        self.is_loaded = False
        self.verification_status = "UNVERIFIED"

    def get_status(self) -> Dict[str, Any]:
        """Return the current model status and verification record."""
        local_hash = None
        if self.model_path.exists() and self.model_path.is_file():
            try:
                local_hash = calculate_sha256(self.model_path)
            except Exception:
                local_hash = None

        registered_hash = None
        read_latency_ms = None
        if self.last_verification_result:
            registered_hash = self.last_verification_result.get("registered_hash")
            read_latency_ms = self.last_verification_result.get("read_latency_ms")

        return {
            "model_id": self.model_id,
            "model_version": self.model_version,
            "algorithm": self.algorithm,
            "local_sha256": local_hash,
            "registered_sha256": registered_hash,
            "verification_status": self.verification_status,
            "is_loaded": self.is_loaded,
            "last_verified_at": self.last_verified_at,
            "read_latency_ms": read_latency_ms,
            "security_qualification": (
                "Cryptographic integrity verification establishes binary correspondence with "
                "the registered artifact on-chain; it does not establish model correctness, "
                "adversarial robustness, or training-data safety."
            ),
        }
