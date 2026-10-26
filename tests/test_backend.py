"""Unit and integration tests for FastAPI Backend Integration and Security Audit Layer (Phase 4).

Covers:
1. System health check (/health) distinguishing components
2. Model status (/model/status) reporting provenance and verification status
3. Scenario A: Valid registered model (VERIFIED, loaded, predict succeeds, audit logged)
4. Scenario B: Tampered model (HASH_MISMATCH, loading blocked, predict fails closed)
5. Scenario C: Unregistered model/version (NOT_REGISTERED, loading blocked, predict fails closed)
6. Scenario D: Blockchain unavailable (BLOCKCHAIN_UNAVAILABLE, loading blocked, no fallback)
7. Scenario E: Missing artifact (FILE_NOT_FOUND, loading blocked)
8. Scenario F: Network-flow feature ingestion (nested and flat formats, non-predictive column stripping)
9. Scenario G: Security audit event retrieval (pagination, filtering, single-event lookup, 404 handling)
10. API validation and fail-closed behavior (empty payload 422, unverified inference 503)
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from web3 import EthereumTesterProvider

from backend.main import create_app
from core.blockchain import BlockchainRegistryClient
from core.hashing import calculate_sha256

# Authentic sample record from UNSW-NB15 test set
SAMPLE_FLOW_RECORD = {
    "dur": 0.121478,
    "proto": "tcp",
    "service": "-",
    "state": "FIN",
    "spkts": 6,
    "dpkts": 4,
    "sbytes": 258,
    "dbytes": 172,
    "rate": 74.08749,
    "sttl": 252,
    "dttl": 254,
    "sload": 14158.94238,
    "dload": 8495.365234,
    "sloss": 0,
    "dloss": 0,
    "sinpkt": 24.2956,
    "dinpkt": 8.375,
    "sjit": 30.177547,
    "djit": 11.830604,
    "swin": 255,
    "stcpb": 621772692,
    "dtcpb": 2202533631,
    "dwin": 255,
    "tcprtt": 0,
    "synack": 0,
    "ackdat": 0,
    "smean": 43,
    "dmean": 43,
    "trans_depth": 0,
    "response_body_len": 0,
    "ct_srv_src": 1,
    "ct_state_ttl": 0,
    "ct_dst_ltm": 1,
    "ct_src_dport_ltm": 1,
    "ct_dst_sport_ltm": 1,
    "ct_dst_src_ltm": 1,
    "is_ftp_login": 0,
    "ct_ftp_cmd": 0,
    "ct_flw_http_mthd": 0,
    "ct_src_ltm": 1,
    "ct_srv_dst": 1,
    "is_sm_ips_ports": 0,
}


@pytest.fixture
def test_blockchain():
    """Create fresh EVM provider and deploy ModelRegistry contract."""
    provider = EthereumTesterProvider()
    client = BlockchainRegistryClient(provider=provider)
    client.deploy_contract(deployment_file=None)
    return client


@pytest.fixture
def test_app_and_client(tmp_path, test_blockchain):
    """Create a test application instance with temporary SQLite audit storage."""
    audit_db = tmp_path / "test_audit.db"
    app = create_app(
        blockchain_client=test_blockchain,
        audit_db_path=str(audit_db),
        auto_verify=False,
    )
    with TestClient(app) as client:
        yield app, client


def test_1_health_check_endpoint(test_app_and_client):
    """Test 1: GET /health returns application, blockchain, and model component statuses."""
    app, client = test_app_and_client
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()

    assert data["application_status"] == "running"
    assert data["blockchain_status"] == "connected"
    assert "unloaded" in data["model_status"]
    assert data["status"] == "degraded"  # Degraded because model is not yet verified/loaded
    assert "timestamp" in data


def test_2_model_status_before_verification(test_app_and_client):
    """Test 2: GET /model/status reports UNVERIFIED and unloaded state initially."""
    app, client = test_app_and_client
    response = client.get("/model/status")
    assert response.status_code == 200
    data = response.json()

    assert data["model_id"] == "iot-ids-rf"
    assert data["model_version"] == "v1.0.0"
    assert data["algorithm"] == "RandomForestClassifier"
    assert data["verification_status"] == "UNVERIFIED"
    assert data["is_loaded"] is False
    assert "security_qualification" in data


def test_3_scenario_a_valid_registered_model(test_app_and_client, test_blockchain):
    """Scenario A: Model hash registered on-chain -> verification succeeds, model loads, prediction works."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    # Calculate actual hash of local artifact and register on-chain
    assert model_service.model_path.exists(), "Local model artifact must exist for Scenario A"
    real_hash = calculate_sha256(model_service.model_path)
    test_blockchain.register_model(
        model_id=model_service.model_id,
        version=model_service.model_version,
        model_hash_hex=real_hash,
        algorithm=model_service.algorithm,
    )

    # 1. Trigger verification via API (authenticates artifact, but does NOT load into memory)
    v_res = client.post("/model/verify")
    assert v_res.status_code == 200
    v_data = v_res.json()

    assert v_data["verified"] is True
    assert v_data["status"] == "VERIFIED"
    assert v_data["is_loaded"] is False
    assert v_data["local_hash"] == real_hash
    assert v_data["registered_hash"] == real_hash
    assert v_data["details"]["cryptographic_integrity"] == "MATCH"
    assert v_data["details"]["blockchain_registration"] == "REGISTERED"

    # Confirm model remains UNLOADED immediately after verification
    assert model_service.is_loaded is False
    assert model_service.verification_status == "VERIFIED"

    # 2. Explicitly authorize and load verified model into execution plane
    load_res = client.post("/model/load")
    assert load_res.status_code == 200
    load_data = load_res.json()
    assert load_data["status"] == "LOADED"
    assert load_data["is_loaded"] is True
    assert model_service.is_loaded is True

    # 3. Confirm /health reports healthy
    h_res = client.get("/health")
    assert h_res.json()["status"] == "healthy"
    assert h_res.json()["model_status"] == "loaded"

    # 4. Perform off-chain prediction
    pred_res = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_res.status_code == 200
    pred_data = pred_res.json()

    assert pred_data["prediction"] in ("Attack", "Benign")
    assert pred_data["prediction_code"] in (0, 1)
    assert 0.0 <= pred_data["confidence"] <= 1.0
    assert pred_data["model_id"] == "iot-ids-rf"
    assert pred_data["model_version"] == "v1.0.0"
    assert pred_data["verification_status"] == "VERIFIED"
    assert pred_data["inference_latency_ms"] > 0.0
    assert pred_data["event_id"] != "unrecorded"


def test_4_scenario_b_tampered_model(tmp_path, test_blockchain):
    """Scenario B: Tampered model artifact causes HASH_MISMATCH; loading is blocked, predict fails closed."""
    # Create a corrupted artifact
    tampered_artifact = tmp_path / "tampered_ids_model.joblib"
    tampered_artifact.write_bytes(b"CORRUPTED_TAMPERED_MODEL_PAYLOAD_MALICIOUS_BYTES")
    tampered_hash = calculate_sha256(tampered_artifact)

    # Register a DIFFERENT trusted hash on-chain
    legitimate_hash = "1111111111111111111111111111111111111111111111111111111111111111"
    test_blockchain.register_model(
        model_id="iot-ids-rf",
        version="v1.0.0",
        model_hash_hex=legitimate_hash,
        algorithm="RandomForestClassifier",
    )

    audit_db = tmp_path / "audit_tampered.db"
    app = create_app(
        blockchain_client=test_blockchain,
        audit_db_path=str(audit_db),
        auto_verify=False,
    )
    # Point model_service to the tampered file
    app.state.model_service.model_path = tampered_artifact

    with TestClient(app) as client:
        # 1. Verification must fail
        v_res = client.post("/model/verify")
        assert v_res.status_code == 200
        v_data = v_res.json()

        assert v_data["verified"] is False
        assert v_data["status"] == "HASH_MISMATCH"
        assert v_data["local_hash"] == tampered_hash
        assert v_data["registered_hash"] == legitimate_hash

        # 2. Gate check: Model must NOT be loaded
        assert app.state.model_service.is_loaded is False
        assert app.state.model_service.verification_status == "HASH_MISMATCH"

        # 3. Prediction must fail closed with HTTP 503
        pred_res = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
        assert pred_res.status_code == 503
        assert "Fail-closed verification gate is active" in pred_res.json()["detail"]


def test_5_scenario_c_unregistered_model(test_app_and_client):
    """Scenario C: Unregistered model ID/version fails verification (NOT_REGISTERED) and blocks loading."""
    app, client = test_app_and_client

    # Model is not registered in this fresh client
    v_res = client.post("/model/verify")
    assert v_res.status_code == 200
    v_data = v_res.json()

    assert v_data["verified"] is False
    assert v_data["status"] == "NOT_REGISTERED"

    # Loading blocked and predict fails closed
    assert app.state.model_service.is_loaded is False
    pred_res = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_res.status_code == 503


def test_6_scenario_d_blockchain_unavailable(tmp_path):
    """Scenario D: Disconnected blockchain client yields BLOCKCHAIN_UNAVAILABLE and fails closed."""
    audit_db = tmp_path / "audit_no_bc.db"
    # App with None blockchain client (simulates node failure)
    app = create_app(
        blockchain_client=None,
        audit_db_path=str(audit_db),
        auto_verify=False,
    )

    with TestClient(app) as client:
        h_res = client.get("/health")
        assert h_res.json()["blockchain_status"] == "disconnected"

        v_res = client.post("/model/verify")
        assert v_res.status_code == 200
        v_data = v_res.json()

        assert v_data["verified"] is False
        assert v_data["status"] == "BLOCKCHAIN_UNAVAILABLE"
        assert app.state.model_service.is_loaded is False

        pred_res = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
        assert pred_res.status_code == 503


def test_7_scenario_e_missing_artifact(test_app_and_client, test_blockchain):
    """Scenario E: Non-existent model artifact path returns FILE_NOT_FOUND and fails closed."""
    app, client = test_app_and_client
    app.state.model_service.model_path = Path("ml/artifacts/non_existent_model_file.joblib")

    v_res = client.post("/model/verify")
    assert v_res.status_code == 200
    v_data = v_res.json()

    assert v_data["verified"] is False
    assert v_data["status"] == "FILE_NOT_FOUND"
    assert app.state.model_service.is_loaded is False


def test_8_scenario_f_feature_formats_and_stripping(test_app_and_client, test_blockchain):
    """Scenario F: Supports flat and nested feature structures; strips non-predictive columns."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    # Setup valid verified model
    real_hash = calculate_sha256(model_service.model_path)
    test_blockchain.register_model(
        model_id=model_service.model_id,
        version=model_service.model_version,
        model_hash_hex=real_hash,
        algorithm=model_service.algorithm,
    )
    client.post("/model/verify")
    client.post("/model/load")
    assert model_service.is_loaded is True

    # Flat request with extraneous ground-truth columns included (e.g. id, label, attack_cat)
    flat_record_with_leakage_cols = dict(SAMPLE_FLOW_RECORD)
    flat_record_with_leakage_cols["id"] = 99999
    flat_record_with_leakage_cols["label"] = 0
    flat_record_with_leakage_cols["attack_cat"] = "Normal"

    pred_res = client.post("/predict", json=flat_record_with_leakage_cols)
    assert pred_res.status_code == 200
    assert pred_res.json()["prediction"] in ("Attack", "Benign")


def test_9_scenario_g_audit_retrieval_and_pagination(test_app_and_client, test_blockchain):
    """Scenario G: Audit events are persisted, paginated, filterable, and individually queryable."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    # Register and verify model
    real_hash = calculate_sha256(model_service.model_path)
    test_blockchain.register_model(
        model_id=model_service.model_id,
        version=model_service.model_version,
        model_hash_hex=real_hash,
        algorithm=model_service.algorithm,
    )
    client.post("/model/verify")
    client.post("/model/load")

    # Perform 3 predictions to generate multiple events
    for _ in range(3):
        client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})

    # 1. Query events list
    list_res = client.get("/audit/events?limit=10&offset=0")
    assert list_res.status_code == 200
    data = list_res.json()

    assert data["total"] >= 4  # At least verification + load + 3 predictions
    assert len(data["events"]) >= 4

    # 2. Filter by event_type
    pred_events_res = client.get("/audit/events?event_type=PREDICTION")
    assert pred_events_res.status_code == 200
    pred_events = pred_events_res.json()["events"]
    assert len(pred_events) >= 3
    assert all(e["event_type"] == "PREDICTION" for e in pred_events)

    # 3. Retrieve individual event by event_id
    sample_id = pred_events[0]["event_id"]
    single_res = client.get(f"/audit/events/{sample_id}")
    assert single_res.status_code == 200
    assert single_res.json()["event_id"] == sample_id
    assert single_res.json()["event_type"] == "PREDICTION"

    # 4. Unknown event_id returns 404
    missing_res = client.get("/audit/events/00000000-0000-0000-0000-000000000000")
    assert missing_res.status_code == 404


def test_10_api_validation_error_handling(test_app_and_client):
    """Test 10: Malformed or empty payloads yield HTTP 422 without server error."""
    app, client = test_app_and_client

    # Empty body
    res1 = client.post("/predict", json={})
    assert res1.status_code == 422

    # Empty features dictionary
    res2 = client.post("/predict", json={"features": {}})
    assert res2.status_code == 422


def test_11_explicit_lifecycle_verify_without_load(test_app_and_client, test_blockchain):
    """Test A: /model/verify authenticates artifact against on-chain registry but does NOT load into memory."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    real_hash = calculate_sha256(model_service.model_path)
    test_blockchain.register_model(
        model_id=model_service.model_id,
        version=model_service.model_version,
        model_hash_hex=real_hash,
        algorithm=model_service.algorithm,
    )

    # Initial state
    assert model_service.verification_status == "UNVERIFIED"
    assert model_service.is_loaded is False
    assert model_service.model_pipeline is None

    # Verify
    v_res = client.post("/model/verify")
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["verified"] is True
    assert v_data["status"] == "VERIFIED"
    assert v_data["is_loaded"] is False

    # Still unloaded in memory
    assert model_service.verification_status == "VERIFIED"
    assert model_service.is_loaded is False
    assert model_service.model_pipeline is None


def test_12_explicit_lifecycle_load_unverified_fails(test_app_and_client):
    """Test C: /model/load without prior verification returns HTTP 400 and model remains unloaded."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    assert model_service.verification_status == "UNVERIFIED"
    assert model_service.is_loaded is False

    # Calling /model/load when unverified
    load_res = client.post("/model/load")
    assert load_res.status_code == 400
    assert "Cannot load unverified model" in load_res.json()["detail"]

    # Model remains unloaded
    assert model_service.is_loaded is False
    assert model_service.model_pipeline is None


def test_13_explicit_lifecycle_load_after_verify_succeeds(test_app_and_client, test_blockchain):
    """Test B: /model/load succeeds only after verification, setting is_loaded: True."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    real_hash = calculate_sha256(model_service.model_path)
    test_blockchain.register_model(
        model_id=model_service.model_id,
        version=model_service.model_version,
        model_hash_hex=real_hash,
        algorithm=model_service.algorithm,
    )

    client.post("/model/verify")
    assert model_service.verification_status == "VERIFIED"
    assert model_service.is_loaded is False

    load_res = client.post("/model/load")
    assert load_res.status_code == 200
    load_data = load_res.json()
    assert load_data["status"] == "LOADED"
    assert load_data["is_loaded"] is True
    assert model_service.is_loaded is True
    assert model_service.model_pipeline is not None


def test_14_complete_explicit_lifecycle_gate(test_app_and_client, test_blockchain):
    """Test G: Complete explicit lifecycle gate from START -> UNVERIFIED -> VERIFY -> LOAD -> PREDICT."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    real_hash = calculate_sha256(model_service.model_path)
    test_blockchain.register_model(
        model_id=model_service.model_id,
        version=model_service.model_version,
        model_hash_hex=real_hash,
        algorithm=model_service.algorithm,
    )

    # 1. APPLICATION START: UNVERIFIED + UNLOADED
    status_res = client.get("/model/status")
    assert status_res.status_code == 200
    assert status_res.json()["verification_status"] == "UNVERIFIED"
    assert status_res.json()["is_loaded"] is False

    # Inference blocked
    pred_blocked = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_blocked.status_code == 503

    # 2. VERIFY AUTHORIZED MODEL
    v_res = client.post("/model/verify")
    assert v_res.status_code == 200
    assert v_res.json()["status"] == "VERIFIED"
    assert v_res.json()["is_loaded"] is False

    # Inference still blocked before explicit load
    pred_still_blocked = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_still_blocked.status_code == 503

    # 3. AUTHORIZE & LOAD MODEL
    load_res = client.post("/model/load")
    assert load_res.status_code == 200
    assert load_res.json()["status"] == "LOADED"
    assert load_res.json()["is_loaded"] is True

    # 4. IDS AVAILABLE
    pred_ok = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_ok.status_code == 200
    assert pred_ok.json()["verification_status"] == "VERIFIED"
    assert pred_ok.json()["prediction"] in ("Attack", "Benign")


def test_15_model_session_reset_lifecycle(test_app_and_client, test_blockchain):
    """Phase 7D.6: POST /model/session/reset unloads memory and resets gate to UNVERIFIED/UNLOADED."""
    app, client = test_app_and_client
    model_service = app.state.model_service

    real_hash = calculate_sha256(model_service.model_path)
    test_blockchain.register_model(
        model_id=model_service.model_id,
        version=model_service.model_version,
        model_hash_hex=real_hash,
        algorithm=model_service.algorithm,
    )

    # 1. Establish loaded state
    client.post("/model/verify")
    client.post("/model/load")
    assert model_service.is_loaded is True
    assert model_service.verification_status == "VERIFIED"

    pred_res1 = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_res1.status_code == 200

    # 2. Trigger session reset (simulates application reload / fresh session)
    reset_res = client.post("/model/session/reset")
    assert reset_res.status_code == 200
    reset_data = reset_res.json()

    assert reset_data["success"] is True
    assert reset_data["action_taken"] == "SESSION_RESET"
    assert reset_data["verification_status"] == "UNVERIFIED"
    assert reset_data["is_loaded"] is False
    assert reset_data["downstream_state"] == "LOCKED"

    # 3. Backend internal state is UNVERIFIED and UNLOADED
    assert model_service.is_loaded is False
    assert model_service.verification_status == "UNVERIFIED"
    assert model_service.model_pipeline is None

    # 4. Status endpoint reflects reset state
    status_res = client.get("/model/status")
    assert status_res.status_code == 200
    assert status_res.json()["verification_status"] == "UNVERIFIED"
    assert status_res.json()["is_loaded"] is False

    # 5. Prediction is blocked fail-closed (503)
    pred_blocked = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_blocked.status_code == 503

    # 6. Verification works after reset, setting VERIFIED but keeping model UNLOADED
    v_res = client.post("/model/verify")
    assert v_res.status_code == 200
    assert v_res.json()["status"] == "VERIFIED"
    assert v_res.json()["is_loaded"] is False
    assert model_service.is_loaded is False

    # 7. Explicit load works after verification
    load_res = client.post("/model/load")
    assert load_res.status_code == 200
    assert load_res.json()["is_loaded"] is True
    assert model_service.is_loaded is True

    # 8. Prediction succeeds after explicit load
    pred_ok = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_ok.status_code == 200
    assert pred_ok.json()["prediction"] in ("Attack", "Benign")
