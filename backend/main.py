"""FastAPI application for Blockchain-Backed AI IoT Intrusion Detection.

Exposes REST APIs for:
- System and component health monitoring (`/health`)
- Model provenance and integrity status (`/model/status`)
- On-chain model cryptographic verification (`/model/verify`)
- Off-chain verified ML inference (`/predict`)
- Local security audit event inspection (`/audit/events`)
"""

from __future__ import annotations

import datetime
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.schemas import (
    HealthResponse,
    HierarchicalPredictionResponse,
    ModelStatusResponse,
    ModelVerifyResponse,
    NetworkFlowPredictionRequest,
    NetworkFlowPredictionResponse,
    SecurityEventSchema,
    SecurityEventsListResponse,
)
from backend.services.audit_service import AuditService
from backend.services.hierarchical_service import HierarchicalService
from backend.services.model_service import ModelService
from backend.services.prediction_service import ModelNotReadyError, PredictionService
from backend.services.verification_service import VerificationService
from core.blockchain import BlockchainRegistryClient


def create_app(
    blockchain_client: Any = "AUTO",
    audit_db_path: Optional[str] = None,
    auto_verify: Optional[bool] = None,
) -> FastAPI:
    """Application factory facilitating dependency injection for production and testing."""

    # 1. Initialize services
    effective_db_path = audit_db_path or settings.AUDIT_DB_PATH
    audit_service = AuditService(db_path=effective_db_path)

    if blockchain_client == "AUTO":
        try:
            effective_client = BlockchainRegistryClient(
                rpc_url=settings.RPC_URL,
                contract_address=settings.CONTRACT_ADDRESS,
                artifact_path=settings.CONTRACT_ARTIFACT_PATH,
            )
        except Exception:
            effective_client = None
    else:
        effective_client = blockchain_client

    verification_service = VerificationService(
        blockchain_client=effective_client,
        audit_service=audit_service,
    )

    model_service = ModelService(
        model_path=settings.MODEL_PATH,
        model_id=settings.MODEL_ID,
        model_version=settings.MODEL_VERSION,
        algorithm=settings.ALGORITHM,
        audit_service=audit_service,
    )

    stage2_model_service = ModelService(
        model_path=settings.STAGE2_MODEL_PATH,
        model_id=settings.STAGE2_MODEL_ID,
        model_version=settings.STAGE2_MODEL_VERSION,
        algorithm=settings.STAGE2_ALGORITHM,
        audit_service=audit_service,
    )

    prediction_service = PredictionService(
        model_service=model_service,
        audit_service=audit_service,
    )

    hierarchical_service = HierarchicalService(
        stage1_model_service=model_service,
        stage2_model_service=stage2_model_service,
        audit_service=audit_service,
        blockchain_client=effective_client,
    )

    should_auto_verify = (
        auto_verify if auto_verify is not None else settings.AUTO_VERIFY_ON_STARTUP
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup phase: Fail-closed initialization
        if should_auto_verify:
            try:
                model_service.verify_and_load(verification_service)
                try:
                    stage2_model_service.verify_and_load(verification_service)
                except Exception:
                    pass
            except Exception as e:
                # App still starts so operator can inspect status via /health and /model/status
                audit_service.log_event(
                    event_type="SYSTEM_ERROR",
                    status="ERROR",
                    model_id=settings.MODEL_ID,
                    model_version=settings.MODEL_VERSION,
                    details={"startup_verification_error": str(e)},
                )
        yield
        # Shutdown phase
        model_service.unload_model()
        stage2_model_service.unload_model()

    app = FastAPI(
        title="IoT Intrusion Detection — Blockchain Provenance & Audit API",
        description=(
            "REST API providing verification-gated off-chain machine learning inference "
            "for IoT network intrusion detection, anchored to an on-chain model provenance registry."
        ),
        version="1.0.0",
        lifespan=lifespan,
    )

    # State attachment for route access & testing inspection
    app.state.audit_service = audit_service
    app.state.verification_service = verification_service
    app.state.model_service = model_service
    app.state.stage2_model_service = stage2_model_service
    app.state.prediction_service = prediction_service
    app.state.hierarchical_service = hierarchical_service
    app.state.blockchain_client = effective_client

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handler to prevent stack-trace leakage
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        if isinstance(exc, HTTPException):
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
            )
        # Log system error in audit service
        audit_service.log_event(
            event_type="SYSTEM_ERROR",
            status="ERROR",
            details={"path": request.url.path, "error": str(exc)},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred. Transaction aborted."},
        )

    # --- ENDPOINTS ---

    @app.get("/health", response_model=HealthResponse, tags=["System Health"])
    async def health_check():
        """Report component health, distinguishing application, blockchain, and model state."""
        b_connected = verification_service.is_blockchain_connected()
        m_loaded = model_service.is_loaded
        m_status = "loaded" if m_loaded else f"unloaded ({model_service.verification_status})"

        overall = "healthy" if (m_loaded and b_connected) else "degraded"
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return HealthResponse(
            status=overall,
            application_status="running",
            blockchain_status="connected" if b_connected else "disconnected",
            model_status=m_status,
            timestamp=timestamp,
        )

    @app.get("/model/status", response_model=ModelStatusResponse, tags=["Model Provenance"])
    async def get_model_status():
        """Retrieve model metadata, SHA-256 digests, and current verification status."""
        status_data = model_service.get_status()
        return ModelStatusResponse(**status_data)

    @app.post("/model/verify", response_model=ModelVerifyResponse, tags=["Model Provenance"])
    async def verify_model():
        """Explicitly execute cryptographic integrity verification against the blockchain registry.

        If verification succeeds, the model is loaded into memory for inference.
        If verification fails, the model is purged/blocked (fail-closed).
        """
        outcome = model_service.verify_and_load(verification_service)
        return ModelVerifyResponse(
            verified=outcome["verified"],
            status=outcome["status"],
            model_id=outcome["model_id"],
            version=outcome["version"],
            model_path=outcome["model_path"],
            local_hash=outcome.get("local_hash"),
            registered_hash=outcome.get("registered_hash"),
            contract_address=outcome.get("contract_address"),
            read_latency_ms=outcome.get("read_latency_ms", 0.0),
            timestamp=outcome.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat()),
            message=outcome.get("message", ""),
            details=outcome.get("details", {}),
        )

    @app.post("/predict", response_model=NetworkFlowPredictionResponse, tags=["Intrusion Detection"])
    async def predict_intrusion(request: NetworkFlowPredictionRequest):
        """Execute off-chain ML inference on a single network flow record.

        Gated by the verification status: fails closed if model is unverified or unloaded.
        """
        features = request.extract_features()
        if not features:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Request body does not contain valid network flow features.",
            )

        try:
            prediction_result = prediction_service.predict(features)
            return NetworkFlowPredictionResponse(**prediction_result)
        except ModelNotReadyError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Feature value or structure error: {e}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Inference pipeline execution error: {e}",
            )

    @app.post(
        "/predict/hierarchical",
        response_model=HierarchicalPredictionResponse,
        tags=["Intrusion Detection"],
    )
    async def predict_hierarchical_intrusion(request: NetworkFlowPredictionRequest):
        """Execute two-stage hierarchical inference (Binary -> Multiclass) with advisory mitigation recommendations.

        Stage 1 classifies traffic as Benign or Attack.
        If Benign, returns category 'Normal' with zero Stage 2 invocation.
        If Attack, conditionally invokes Stage 2 to classify into one of 9 UNSW-NB15 attack categories.
        Attaches deterministic human-in-the-loop advisory guidance.
        Off-chain execution: exactly 0 per-flow blockchain lookups.
        """
        features = request.extract_features()
        if not features:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Request body does not contain valid network flow features.",
            )

        try:
            prediction_result = hierarchical_service.predict(features)
            return HierarchicalPredictionResponse(**prediction_result)
        except ModelNotReadyError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=str(e),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Feature value or structure error: {e}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Hierarchical inference execution error: {e}",
            )

    @app.get("/audit/events", response_model=SecurityEventsListResponse, tags=["Security Audit"])
    async def list_audit_events(
        limit: int = Query(default=50, ge=1, le=500, description="Maximum events to return"),
        offset: int = Query(default=0, ge=0, description="Offset for pagination"),
        event_type: Optional[str] = Query(default=None, description="Optional filter by event_type"),
    ):
        """Retrieve recent security audit events from the local append store."""
        events, total = audit_service.get_events(limit=limit, offset=offset, event_type=event_type)
        return SecurityEventsListResponse(
            total=total,
            limit=limit,
            offset=offset,
            events=[SecurityEventSchema(**e) for e in events],
        )

    @app.get("/audit/events/{event_id}", response_model=SecurityEventSchema, tags=["Security Audit"])
    async def get_audit_event(event_id: str):
        """Retrieve a specific security event by UUID."""
        event = audit_service.get_event(event_id)
        if event is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Security event with ID '{event_id}' not found.",
            )
        return SecurityEventSchema(**event)

    return app


app = create_app()
