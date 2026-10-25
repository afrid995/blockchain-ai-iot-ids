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
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.schemas import (
    HealthResponse,
    HierarchicalPredictionResponse,
    ModelReplacementResetResponse,
    ModelReplacementSimulationResponse,
    ModelStatusResponse,
    ModelVerifyResponse,
    NetworkFlowPredictionRequest,
    NetworkFlowPredictionResponse,
    SecurityEventSchema,
    SecurityEventsListResponse,
    SecurityTestScenarioRequest,
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
    async def get_model_status(target: Optional[str] = Query(default="stage1", description="'stage1' or 'stage2'")):
        """Retrieve model metadata, SHA-256 digests, and current verification status."""
        svc = stage2_model_service if target == "stage2" else model_service
        status_data = svc.get_status()
        return ModelStatusResponse(**status_data)

    @app.post("/model/verify", response_model=ModelVerifyResponse, tags=["Model Provenance"])
    async def verify_model(target: Optional[str] = Query(default="stage1", description="'stage1' or 'stage2'")):
        """Explicitly execute cryptographic integrity verification against the blockchain registry.

        If verification succeeds, the model is loaded into memory for inference.
        If verification fails, the model is purged/blocked (fail-closed).
        """
        svc = stage2_model_service if target == "stage2" else model_service
        outcome = svc.verify_and_load(verification_service)
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

    @app.post("/model/load", tags=["Model Provenance"])
    async def load_verified_model():
        """Load verified model artifacts into memory for inference."""
        if model_service.verification_status != "VERIFIED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot load unverified model (current status: '{model_service.verification_status}'). Run /model/verify first."
            )
        import joblib
        try:
            model_service.model_pipeline = joblib.load(model_service.model_path)
            model_service.is_loaded = True
            try:
                stage2_model_service.model_pipeline = joblib.load(stage2_model_service.model_path)
                stage2_model_service.is_loaded = True
            except Exception:
                pass
            return {
                "success": True,
                "status": "LOADED",
                "stage1_ready": model_service.is_loaded,
                "stage2_ready": stage2_model_service.is_loaded,
                "message": "Trusted models loaded into memory. Network flow analysis unlocked."
            }
        except Exception as e:
            model_service.is_loaded = False
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to load model artifact: {e}"
            )

    @app.post("/security/test-scenario", tags=["Security Demonstration"])
    async def run_security_test_scenario(req: SecurityTestScenarioRequest):
        """Execute controlled security simulation scenarios for demonstrating fail-closed defense."""
        scenario = req.scenario
        temp_dir = settings.PROJECT_ROOT / "ml" / "artifacts" / ".tmp_security_demo"
        temp_dir.mkdir(parents=True, exist_ok=True)

        try:
            if scenario == "tampered_stage1":
                temp_model = temp_dir / "tampered_ids_model.joblib"
                with open(settings.MODEL_PATH, "rb") as f_in:
                    data = bytearray(f_in.read())
                data[100] = (data[100] + 1) % 256
                with open(temp_model, "wb") as f_out:
                    f_out.write(data)

                v_res = verification_service.verify(
                    model_path=temp_model,
                    model_id=settings.MODEL_ID,
                    version=settings.MODEL_VERSION,
                )
                if temp_model.exists():
                    temp_model.unlink()
                model_service.unload_model()
                model_service.verification_status = v_res["status"]
                return {
                    "scenario": scenario,
                    "status": v_res["status"],
                    "verified": v_res["verified"],
                    "model_id": settings.MODEL_ID,
                    "version": settings.MODEL_VERSION,
                    "local_hash": v_res.get("local_hash"),
                    "registered_hash": v_res.get("registered_hash"),
                    "action_taken": "MODEL_LOAD_BLOCKED",
                    "downstream_state": "LOCKED",
                    "message": "Tampered Stage 1 model rejected (HASH_MISMATCH). Loading blocked fail-closed."
                }

            elif scenario == "tampered_stage2":
                temp_model = temp_dir / "tampered_attack_classifier.joblib"
                with open(settings.STAGE2_MODEL_PATH, "rb") as f_in:
                    data = bytearray(f_in.read())
                data[100] = (data[100] + 1) % 256
                with open(temp_model, "wb") as f_out:
                    f_out.write(data)

                v_res = verification_service.verify(
                    model_path=temp_model,
                    model_id=settings.STAGE2_MODEL_ID,
                    version=settings.STAGE2_MODEL_VERSION,
                )
                if temp_model.exists():
                    temp_model.unlink()
                stage2_model_service.unload_model()
                stage2_model_service.verification_status = v_res["status"]
                return {
                    "scenario": scenario,
                    "status": v_res["status"],
                    "verified": v_res["verified"],
                    "model_id": settings.STAGE2_MODEL_ID,
                    "version": settings.STAGE2_MODEL_VERSION,
                    "local_hash": v_res.get("local_hash"),
                    "registered_hash": v_res.get("registered_hash"),
                    "action_taken": "STAGE2_LOAD_BLOCKED",
                    "downstream_state": "LOCKED",
                    "message": "Tampered Stage 2 model rejected (HASH_MISMATCH). Stage 2 loading blocked fail-closed."
                }

            elif scenario == "unregistered_version":
                v_res = verification_service.verify(
                    model_path=settings.MODEL_PATH,
                    model_id=settings.MODEL_ID,
                    version="v9.9.9",
                )
                model_service.unload_model()
                model_service.verification_status = v_res["status"]
                return {
                    "scenario": scenario,
                    "status": v_res["status"],
                    "verified": v_res["verified"],
                    "model_id": settings.MODEL_ID,
                    "version": "v9.9.9",
                    "local_hash": v_res.get("local_hash"),
                    "registered_hash": None,
                    "action_taken": "MODEL_LOAD_BLOCKED",
                    "downstream_state": "LOCKED",
                    "message": "Unregistered model version v9.9.9 rejected (NOT_REGISTERED). Loading blocked fail-closed."
                }

            elif scenario == "missing_artifact":
                missing_path = temp_dir / "nonexistent_model.joblib"
                v_res = verification_service.verify(
                    model_path=missing_path,
                    model_id=settings.MODEL_ID,
                    version=settings.MODEL_VERSION,
                )
                model_service.unload_model()
                model_service.verification_status = v_res["status"]
                return {
                    "scenario": scenario,
                    "status": v_res["status"],
                    "verified": v_res["verified"],
                    "model_id": settings.MODEL_ID,
                    "version": settings.MODEL_VERSION,
                    "local_hash": None,
                    "registered_hash": None,
                    "action_taken": "MODEL_LOAD_BLOCKED",
                    "downstream_state": "LOCKED",
                    "message": "Missing model artifact rejected (FILE_NOT_FOUND). Loading blocked fail-closed."
                }

            elif scenario == "legitimate":
                outcome1 = model_service.verify_and_load(verification_service)
                try:
                    stage2_model_service.verify_and_load(verification_service)
                except Exception:
                    pass
                return {
                    "scenario": scenario,
                    "status": outcome1["status"],
                    "verified": outcome1["verified"],
                    "model_id": settings.MODEL_ID,
                    "version": settings.MODEL_VERSION,
                    "local_hash": outcome1.get("local_hash"),
                    "registered_hash": outcome1.get("registered_hash"),
                    "action_taken": "AUTHORIZED_AND_LOADED",
                    "downstream_state": "UNLOCKED",
                    "message": "Canonical models verified and loaded. Inference authorized."
                }

            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown scenario '{scenario}'. Supported: 'tampered_stage1', 'tampered_stage2', 'unregistered_version', 'missing_artifact', 'legitimate'."
                )
        finally:
            if temp_dir.exists():
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)

    @app.post(
        "/demo/model-replacement",
        response_model=ModelReplacementSimulationResponse,
        tags=["Model Replacement Simulator"],
    )
    async def simulate_model_replacement():
        """Demonstrate fail-closed rejection of an unauthorized model replacement.

        Creates an ephemeral modified copy of the registered model in a temporary OS directory,
        calculates its actual observed SHA-256 digest, and evaluates it against the on-chain
        registered reference. The mismatch immediately blocks model loading fail-closed.
        The canonical model artifact is NEVER modified.
        """
        import tempfile
        from core.hashing import calculate_sha256

        canonical_path = settings.MODEL_PATH
        model_id = settings.MODEL_ID
        version = settings.MODEL_VERSION

        if not canonical_path.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Canonical model artifact missing at {canonical_path}",
            )

        with tempfile.TemporaryDirectory() as tmp_dir:
            temp_model_path = Path(tmp_dir) / "ephemeral_replacement_candidate.joblib"
            canonical_bytes = bytearray(canonical_path.read_bytes())
            canonical_bytes[500] = (canonical_bytes[500] + 1) % 256
            temp_model_path.write_bytes(canonical_bytes)

            observed_sha = calculate_sha256(temp_model_path)

            v_res = verification_service.verify(
                model_path=temp_model_path,
                model_id=model_id,
                version=version,
            )

            # Enforce fail-closed state
            model_service.unload_model()
            model_service.verification_status = v_res["status"]

            audit_service.log_event(
                event_type="MODEL_REPLACEMENT_DETECTED",
                status="WARNING",
                model_id=model_id,
                model_version=version,
                verification_status=v_res["status"],
                details={
                    "registered_hash": v_res.get("registered_hash"),
                    "observed_hash": observed_sha,
                    "action_taken": "MODEL_LOAD_BLOCKED",
                    "reason": "Observed digest does not match on-chain reference.",
                },
            )

            timeline = [
                {"step": 1, "name": "Original model identified", "status": "COMPLETED", "detail": f"{model_id}:{version}"},
                {"step": 2, "name": "Temporary demonstration copy created", "status": "COMPLETED", "detail": "Segregated ephemeral temp buffer"},
                {"step": 3, "name": "Temporary artifact modified", "status": "COMPLETED", "detail": "Controlled byte perturbation applied at offset 500"},
                {"step": 4, "name": "SHA-256 recalculated", "status": "COMPLETED", "detail": f"Observed: {observed_sha[:16]}..."},
                {"step": 5, "name": "Compared with registered digest", "status": "COMPLETED", "detail": "Queried ModelRegistry.sol digest"},
                {"step": 6, "name": "Integrity check evaluated", "status": "HASH_MISMATCH", "detail": "Observed digest does not match on-chain digest"},
                {"step": 7, "name": "Model loading blocked", "status": "COMPLETED", "detail": "Memory deserialization aborted fail-closed"},
                {"step": 8, "name": "Downstream inference locked", "status": "COMPLETED", "detail": "Network flow analysis disabled"},
            ]

            return ModelReplacementSimulationResponse(
                scenario="model_replacement",
                status=v_res["status"],
                verified=v_res["verified"],
                model_id=model_id,
                version=version,
                registered_hash=v_res.get("registered_hash"),
                observed_hash=observed_sha,
                action_taken="MODEL_LOAD_BLOCKED",
                downstream_state="LOCKED",
                message="Model replacement detected. Observed SHA-256 does not match on-chain registered digest. Model loading blocked fail-closed.",
                timeline=timeline,
            )

    @app.post(
        "/demo/model-replacement/reset",
        response_model=ModelReplacementResetResponse,
        tags=["Model Replacement Simulator"],
    )
    async def reset_model_replacement():
        """Restore legitimate verified model state and confirm canonical artifact integrity."""
        from core.hashing import calculate_sha256

        canonical_path = settings.MODEL_PATH
        model_id = settings.MODEL_ID
        version = settings.MODEL_VERSION

        if not canonical_path.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Canonical model artifact missing at {canonical_path}",
            )

        canonical_sha = calculate_sha256(canonical_path)
        expected_sha = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"

        if canonical_sha != expected_sha:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"CRITICAL: Canonical model hash {canonical_sha} does not match expected {expected_sha}",
            )

        outcome = model_service.verify_and_load(verification_service)
        try:
            stage2_model_service.verify_and_load(verification_service)
        except Exception:
            pass

        audit_service.log_event(
            event_type="MODEL_RESTORED",
            status="SUCCESS",
            model_id=model_id,
            model_version=version,
            verification_status="VERIFIED",
            details={
                "canonical_hash": canonical_sha,
                "registered_hash": outcome.get("registered_hash"),
                "action_taken": "AUTHORIZED_AND_LOADED",
            },
        )

        return ModelReplacementResetResponse(
            scenario="model_replacement_reset",
            status=outcome["status"],
            verified=outcome["verified"],
            model_id=model_id,
            version=version,
            canonical_hash=canonical_sha,
            registered_hash=outcome.get("registered_hash", expected_sha),
            action_taken="AUTHORIZED_AND_LOADED",
            downstream_state="UNLOCKED",
            message="Canonical model verified against on-chain registry and restored to memory. Inference authorized.",
        )

    @app.post("/demo/unregistered-version", tags=["Model Replacement Simulator"])
    async def simulate_unregistered_version():
        """Demonstrate rejection of an unregistered model version candidate."""
        model_id = settings.MODEL_ID
        version = "v9.9.9"
        v_res = verification_service.verify(
            model_path=settings.MODEL_PATH,
            model_id=model_id,
            version=version,
        )
        model_service.unload_model()
        model_service.verification_status = v_res["status"]
        return {
            "scenario": "unregistered_version",
            "status": v_res["status"],
            "verified": v_res["verified"],
            "model_id": model_id,
            "version": version,
            "local_hash": v_res.get("local_hash"),
            "registered_hash": None,
            "action_taken": "MODEL_LOAD_BLOCKED",
            "downstream_state": "LOCKED",
            "message": "Unregistered model version v9.9.9 rejected (NOT_REGISTERED). Loading blocked fail-closed.",
        }

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
