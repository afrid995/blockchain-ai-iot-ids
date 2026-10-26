"""Verification service connecting model artifact hashing with the on-chain ModelRegistry.

Enforces cryptographic integrity checks against the blockchain and distinguishes:
1. Cryptographic integrity (SHA-256 match)
2. Blockchain registration (contract records)
3. Model availability (local file existence)
"""

from __future__ import annotations

import datetime
import time
from pathlib import Path
from typing import Any, Dict, Optional, Union

from core.blockchain import BlockchainRegistryClient
from backend.services.audit_service import AuditService


class VerificationService:
    """Orchestrates model artifact integrity checks against the blockchain registry."""

    def __init__(
        self,
        blockchain_client: Optional[BlockchainRegistryClient] = None,
        audit_service: Optional[AuditService] = None,
    ) -> None:
        self.client = blockchain_client
        self.audit_service = audit_service

    def is_blockchain_connected(self) -> bool:
        """Check if Web3 connection to the underlying EVM node is active."""
        if self.client is None:
            return False
        try:
            return self.client.is_connected()
        except Exception:
            return False

    def verify(
        self,
        model_path: Union[str, Path],
        model_id: str,
        version: str,
    ) -> Dict[str, Any]:
        """Perform full cryptographic and blockchain provenance verification.

        Returns structured verification outcome:
        - VERIFIED: Local SHA-256 matches on-chain registered hash
        - HASH_MISMATCH: Local SHA-256 does NOT match on-chain hash
        - NOT_REGISTERED: Model ID or version not found in contract
        - FILE_NOT_FOUND: Local artifact file does not exist
        - BLOCKCHAIN_UNAVAILABLE: EVM or contract is unreachable
        """
        t_start = time.perf_counter()
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        path = Path(model_path)

        if self.client is None or not self.is_blockchain_connected():
            res = {
                "verified": False,
                "status": "BLOCKCHAIN_UNAVAILABLE",
                "model_id": model_id,
                "version": version,
                "model_path": str(path),
                "local_hash": None,
                "registered_hash": None,
                "contract_address": self.client.contract_address if self.client else None,
                "read_latency_ms": 0.0,
                "verification_latency_ms": round((time.perf_counter() - t_start) * 1000.0, 4),
                "timestamp": timestamp,
                "message": "Blockchain provider is unavailable or not connected. Verification cannot proceed.",
                "details": {
                    "cryptographic_integrity": "UNCHECKED",
                    "blockchain_registration": "UNAVAILABLE",
                    "model_availability": "UNCHECKED" if not path.exists() else "AVAILABLE",
                    "qualification": (
                        "Verification failed closed because the decentralized reference is unreachable."
                    ),
                },
            }
            if self.audit_service:
                self.audit_service.log_event(
                    event_type="MODEL_VERIFICATION_FAILURE",
                    status="ERROR",
                    model_id=model_id,
                    model_version=version,
                    verification_status=res["status"],
                    verification_latency_ms=res["verification_latency_ms"],
                    details=res["details"],
                )
            return res

        # Execute core verification against smart contract
        raw_result = self.client.verify_model_against_blockchain(
            model_path=path,
            model_id=model_id,
            version=version,
        )
        total_latency_ms = (time.perf_counter() - t_start) * 1000.0

        # Construct structured details distinguishing layers
        status = raw_result["status"]
        crypto_state = (
            "MATCH"
            if status == "VERIFIED"
            else ("MISMATCH" if status == "HASH_MISMATCH" else "UNKNOWN")
        )
        reg_state = (
            "REGISTERED"
            if status in ("VERIFIED", "HASH_MISMATCH")
            else ("NOT_FOUND" if status == "NOT_REGISTERED" else "UNAVAILABLE")
        )
        avail_state = "FILE_MISSING" if status == "FILE_NOT_FOUND" else "FILE_PRESENT"

        details = {
            "cryptographic_integrity": crypto_state,
            "blockchain_registration": reg_state,
            "model_availability": avail_state,
            "algorithm": raw_result.get("algorithm"),
            "registered_at": raw_result.get("registered_at"),
            "registrant": raw_result.get("registrant"),
            "artifact_size_bytes": raw_result.get("artifact_size_bytes"),
            "read_latency_ms": raw_result.get("read_latency_ms", 0.0),
            "total_verification_latency_ms": round(total_latency_ms, 4),
            "qualification": (
                "Binary correspondence with registered artifact only; does not establish "
                "model accuracy, adversarial robustness, or training-data safety."
            ),
        }

        outcome = {
            "verified": raw_result["verified"],
            "status": status,
            "model_id": model_id,
            "version": version,
            "model_path": str(path),
            "local_hash": raw_result.get("local_hash"),
            "registered_hash": raw_result.get("registered_hash"),
            "contract_address": raw_result.get("contract_address"),
            "algorithm": raw_result.get("algorithm"),
            "registered_at": raw_result.get("registered_at"),
            "registrant": raw_result.get("registrant"),
            "artifact_size_bytes": raw_result.get("artifact_size_bytes"),
            "read_latency_ms": raw_result.get("read_latency_ms", 0.0),
            "verification_latency_ms": round(total_latency_ms, 4),
            "timestamp": raw_result.get("timestamp", timestamp),
            "message": raw_result.get("message", ""),
            "details": details,
        }

        if self.audit_service:
            event_type = (
                "MODEL_VERIFICATION"
                if outcome["verified"]
                else "MODEL_VERIFICATION_FAILURE"
            )
            event_status = "SUCCESS" if outcome["verified"] else "WARNING"
            self.audit_service.log_event(
                event_type=event_type,
                status=event_status,
                model_id=model_id,
                model_version=version,
                verification_status=status,
                verification_latency_ms=outcome["verification_latency_ms"],
                details=details,
            )

        return outcome
