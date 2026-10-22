"""Pydantic schemas for request and response serialization.

Enforces strict input validation, feature structure compatibility with UNSW-NB15,
and structured security event representation.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    """Health status distinguishing application, blockchain, and model state."""
    status: str = Field(..., description="Overall service status ('healthy' or 'degraded')")
    application_status: str = Field(..., description="FastAPI web application state")
    blockchain_status: str = Field(..., description="EVM connectivity state")
    model_status: str = Field(..., description="Model loading and verification state")
    timestamp: str = Field(..., description="UTC ISO-8601 timestamp")


class ModelStatusResponse(BaseModel):
    """Detailed model provenance, integrity, and loading status."""
    model_id: str
    model_version: str
    algorithm: str
    local_sha256: Optional[str] = None
    registered_sha256: Optional[str] = None
    verification_status: str = Field(
        ...,
        description="One of: VERIFIED, HASH_MISMATCH, NOT_REGISTERED, BLOCKCHAIN_UNAVAILABLE, FILE_NOT_FOUND, UNVERIFIED",
    )
    is_loaded: bool
    last_verified_at: Optional[str] = None
    read_latency_ms: Optional[float] = None
    security_qualification: str = Field(
        default=(
            "Cryptographic integrity verification establishes binary correspondence with "
            "the registered artifact on-chain; it does not establish model correctness, "
            "adversarial robustness, or training-data safety."
        )
    )


class ModelVerifyResponse(BaseModel):
    """Result of an explicit model integrity and blockchain provenance verification."""
    verified: bool
    status: str
    model_id: str
    version: str
    model_path: str
    local_hash: Optional[str] = None
    registered_hash: Optional[str] = None
    contract_address: Optional[str] = None
    read_latency_ms: float = 0.0
    timestamp: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class NetworkFlowPredictionRequest(BaseModel):
    """Network-flow feature record for IoT intrusion detection inference.

    Accepts features either as a nested 'features' dictionary or as direct
    top-level key-value pairs matching the UNSW-NB15 feature specification.
    """
    model_config = ConfigDict(extra="allow")

    features: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Dictionary of UNSW-NB15 network flow features",
    )

    def extract_features(self) -> Dict[str, Any]:
        """Extract flat feature dictionary from either nested 'features' or root attributes."""
        if self.features is not None and isinstance(self.features, dict) and len(self.features) > 0:
            return dict(self.features)
        
        # Otherwise, take all extra fields
        extra = self.model_extra or {}
        return dict(extra)


class NetworkFlowPredictionResponse(BaseModel):
    """Off-chain ML inference result gated by model cryptographic verification."""
    prediction: str = Field(..., description="'Attack' or 'Benign'")
    prediction_code: int = Field(..., description="1 for Attack/Malicious, 0 for Benign")
    confidence: float = Field(..., description="Class probability confidence [0.0 - 1.0]")
    model_id: str
    model_version: str
    verification_status: str
    event_id: str
    inference_latency_ms: float = Field(..., description="Off-chain model inference duration in milliseconds")
    timestamp: str


class SecurityEventSchema(BaseModel):
    """Record of an audited security or operational event."""
    event_id: str
    timestamp: str
    event_type: str
    model_id: Optional[str] = None
    model_version: Optional[str] = None
    verification_status: Optional[str] = None
    prediction: Optional[str] = None
    inference_latency_ms: Optional[float] = None
    verification_latency_ms: Optional[float] = None
    status: str
    details: Dict[str, Any] = Field(default_factory=dict)


class SecurityEventsListResponse(BaseModel):
    """Paginated list of security audit events."""
    total: int
    limit: int
    offset: int
    events: List[SecurityEventSchema]
