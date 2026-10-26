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
    model_path: Optional[str] = None
    artifact_size_bytes: Optional[int] = None
    local_sha256: Optional[str] = None
    registered_sha256: Optional[str] = None
    contract_address: Optional[str] = None
    registered_at: Optional[int] = None
    registrant: Optional[str] = None
    verification_status: str = Field(
        ...,
        description="One of: VERIFIED, HASH_MISMATCH, NOT_REGISTERED, BLOCKCHAIN_UNAVAILABLE, FILE_NOT_FOUND, UNVERIFIED",
    )
    is_loaded: bool
    last_verified_at: Optional[str] = None
    read_latency_ms: Optional[float] = None
    details: Dict[str, Any] = Field(default_factory=dict)
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
    is_loaded: bool = False
    model_id: str
    version: str
    model_path: str
    local_hash: Optional[str] = None
    registered_hash: Optional[str] = None
    contract_address: Optional[str] = None
    algorithm: Optional[str] = None
    registered_at: Optional[int] = None
    registrant: Optional[str] = None
    artifact_size_bytes: Optional[int] = None
    read_latency_ms: float = 0.0
    timestamp: str
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class SecurityTestScenarioRequest(BaseModel):
    """Request schema for executing security demonstration scenarios."""
    scenario: str = Field(
        ...,
        description="Scenario to execute: 'tampered_stage1', 'tampered_stage2', 'unregistered_version', 'missing_artifact', 'legitimate'"
    )


class ModelReplacementSimulationResponse(BaseModel):
    """Response payload for the model replacement attack simulation."""
    scenario: str
    status: str
    verified: bool
    model_id: str
    version: str
    registered_hash: Optional[str] = None
    observed_hash: Optional[str] = None
    action_taken: str
    downstream_state: str
    message: str
    timeline: List[Dict[str, Any]] = Field(default_factory=list)


class ModelReplacementResetResponse(BaseModel):
    """Response payload for restoring verified canonical model state."""
    scenario: str
    status: str
    verified: bool
    model_id: str
    version: str
    canonical_hash: str
    registered_hash: Optional[str] = None
    action_taken: str
    downstream_state: str
    message: str


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


class HierarchicalPredictionResponse(BaseModel):
    """Hierarchical two-stage ML inference result with advisory response recommendations."""
    final_prediction: str = Field(..., description="Final output category: 'Normal' or one of 9 attack categories")
    stage1_prediction: str = Field(..., description="Stage 1 binary outcome: 'Attack' or 'Benign'")
    stage1_code: int = Field(..., description="1 for Attack, 0 for Benign")
    stage1_confidence: float = Field(..., description="Stage 1 classification confidence [0.0 - 1.0]")
    stage2_invoked: bool = Field(..., description="True if Stage 1 predicted Attack, invoking Stage 2; False if Benign")
    stage2_prediction: Optional[str] = Field(None, description="Stage 2 predicted attack category if invoked; None if Benign")
    stage2_confidence: Optional[float] = Field(None, description="Stage 2 classification confidence [0.0 - 1.0] if invoked; None if Benign")
    advisory_recommendation: Dict[str, Any] = Field(..., description="Structured deterministic advisory guidance for human operators")
    stage1_model_id: str
    stage1_model_version: str
    stage2_model_id: str
    stage2_model_version: str
    verification_status: str
    event_id: str
    inference_latency_ms: float = Field(..., description="Total isolated inference duration in milliseconds")
    per_flow_blockchain_queries: int = Field(default=0, description="Instrumented count of blockchain queries during per-flow inference (must be 0)")
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
