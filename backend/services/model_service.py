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

    def verify(self, verification_service: VerificationService) -> Dict[str, Any]:
        """Execute cryptographic integrity verification against the blockchain registry.

        CRITICAL SECURITY INVARIANT:
        This operation verifies the artifact SHA-256 against ModelRegistry.sol, but
        DOES NOT load or deserialize the model into memory.
        If verification succeeds, the artifact is authorized for a subsequent explicit load.
        If verification fails, any previously loaded pipeline is purged fail-closed.
        """
        v_res = verification_service.verify(
            model_path=self.model_path,
            model_id=self.model_id,
            version=self.model_version,
        )

        self.last_verification_result = v_res
        self.last_verified_at = v_res.get("timestamp")
        self.verification_status = v_res["status"]

        if v_res.get("status") != "VERIFIED":
            # FAIL-CLOSED: strictly prohibit loading and purge memory
            self.model_pipeline = None
            self.is_loaded = False

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
        else:
            # Model is VERIFIED, but remains UNLOADED until an explicit load_model() call
            # Keep is_loaded as current state (typically False prior to explicit load)
            pass

        # Return structured verification outcome with is_loaded flag
        v_res["is_loaded"] = self.is_loaded
        return v_res

    def load_model(self) -> Dict[str, Any]:
        """Explicitly load a verified model artifact into memory for inference execution.

        Enforces strict verification gate:
        - If verification_status != 'VERIFIED' -> reject load fail-closed.
        - If verification_status == 'VERIFIED' -> deserialize artifact into memory.
        """
        if self.verification_status != "VERIFIED":
            self.model_pipeline = None
            self.is_loaded = False
            if self.audit_service:
                self.audit_service.log_event(
                    event_type="MODEL_LOAD_BLOCKED",
                    status="WARNING",
                    model_id=self.model_id,
                    model_version=self.model_version,
                    verification_status=self.verification_status,
                    details={
                        "message": f"Cannot load unverified model (current status: '{self.verification_status}'). Run /model/verify first.",
                    },
                )
            raise RuntimeError(
                f"Cannot load unverified model (current status: '{self.verification_status}'). Run /model/verify first."
            )

        try:
            # Gated deserialization: strictly executed only when verification status is VERIFIED
            self.model_pipeline = joblib.load(self.model_path)
            self.is_loaded = True

            if self.audit_service:
                self.audit_service.log_event(
                    event_type="MODEL_LOAD",
                    status="SUCCESS",
                    model_id=self.model_id,
                    model_version=self.model_version,
                    verification_status="VERIFIED",
                    details={
                        "model_path": str(self.model_path),
                        "local_hash": self.last_verification_result.get("local_hash") if self.last_verification_result else None,
                        "registered_hash": self.last_verification_result.get("registered_hash") if self.last_verification_result else None,
                        "message": "Model passed verification gate and was successfully loaded into memory.",
                    },
                )
            return {
                "status": "LOADED",
                "verification_status": "VERIFIED",
                "is_loaded": True,
                "model_id": self.model_id,
                "model_version": self.model_version,
            }
        except Exception as e:
            self.model_pipeline = None
            self.is_loaded = False
            self.verification_status = "SYSTEM_ERROR"
            if self.audit_service:
                self.audit_service.log_event(
                    event_type="SYSTEM_ERROR",
                    status="ERROR",
                    model_id=self.model_id,
                    model_version=self.model_version,
                    verification_status="SYSTEM_ERROR",
                    details={"error": str(e)},
                )
            raise RuntimeError(f"Failed to load model artifact: {e}")

    def verify_and_load(self, verification_service: VerificationService) -> Dict[str, Any]:
        """Convenience method combining verify() and load_model() for automated testing."""
        v_res = self.verify(verification_service)
        if v_res.get("verified") is True and v_res.get("status") == "VERIFIED":
            try:
                self.load_model()
                v_res["is_loaded"] = True
            except Exception as e:
                v_res["verified"] = False
                v_res["status"] = "SYSTEM_ERROR"
                v_res["is_loaded"] = False
                v_res["message"] = str(e)
        else:
            v_res["is_loaded"] = False
        return v_res

    def unload_model(self) -> None:
        """Purge model pipeline from memory and reset gate state."""
        self.model_pipeline = None
        self.is_loaded = False
        self.verification_status = "UNVERIFIED"

    def get_status(self) -> Dict[str, Any]:
        """Return the current model status and verification record."""
        local_hash = None
        artifact_size = None
        if self.model_path.exists() and self.model_path.is_file():
            try:
                local_hash = calculate_sha256(self.model_path)
                artifact_size = self.model_path.stat().st_size
            except Exception:
                local_hash = None

        registered_hash = None
        read_latency_ms = None
        contract_addr = None
        registered_at = None
        registrant = None
        v_details = {}
        if self.last_verification_result:
            registered_hash = self.last_verification_result.get("registered_hash")
            read_latency_ms = self.last_verification_result.get("read_latency_ms")
            contract_addr = self.last_verification_result.get("contract_address")
            registered_at = self.last_verification_result.get("registered_at")
            registrant = self.last_verification_result.get("registrant")
            v_details = self.last_verification_result.get("details", {})

        if not contract_addr:
            from backend.config import settings
            contract_addr = settings.CONTRACT_ADDRESS

        return {
            "model_id": self.model_id,
            "model_version": self.model_version,
            "algorithm": self.algorithm,
            "model_path": str(self.model_path),
            "artifact_size_bytes": artifact_size,
            "local_sha256": local_hash,
            "registered_sha256": registered_hash,
            "contract_address": contract_addr,
            "registered_at": registered_at,
            "registrant": registrant,
            "verification_status": self.verification_status,
            "is_loaded": self.is_loaded,
            "last_verified_at": self.last_verified_at,
            "read_latency_ms": read_latency_ms,
            "details": v_details,
            "security_qualification": (
                "Cryptographic integrity verification establishes binary correspondence with "
                "the registered artifact on-chain; it does not establish model correctness, "
                "adversarial robustness, or training-data safety."
            ),
        }
