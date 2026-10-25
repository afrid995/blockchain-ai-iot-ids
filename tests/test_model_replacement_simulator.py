"""Unit and integration tests for Model Replacement Attack Simulator (Phase 7B.5.6).

Verifies safe evaluator-facing model replacement simulation and reset:
1. Canonical model artifact remains strictly unmodified before, during, and after simulation.
2. Ephemeral tampered candidate generates a distinct observed SHA-256 hash.
3. Simulation detects HASH_MISMATCH, blocks model loading fail-closed, and locks downstream inference.
4. Simulation response provides the 8-step execution timeline.
5. Downstream inference endpoints (/predict and /predict/hierarchical) fail closed (503) in tampered state.
6. Reset endpoint verifies canonical artifact hash against on-chain digest and restores authorized memory state.
7. Downstream inference succeeds (200) once reset is performed.
8. Audit trail records MODEL_REPLACEMENT_DETECTED and MODEL_RESTORED security events.
9. Unregistered version simulation (/demo/unregistered-version) detects NOT_REGISTERED and blocks loading fail-closed.
10. Ephemeral copies are strictly segregated in OS temporary directories without leaking to repository.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient
from web3 import EthereumTesterProvider

from backend.config import settings
from backend.main import create_app
from core.blockchain import BlockchainRegistryClient
from core.hashing import calculate_sha256

REPO_ROOT = Path(__file__).resolve().parent.parent

CANONICAL_STAGE1_SHA256 = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"
CANONICAL_STAGE2_SHA256 = "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"

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
    """In-memory Ethereum testbed with deployed ModelRegistry."""
    provider = EthereumTesterProvider()
    client = BlockchainRegistryClient(provider=provider)
    client.deploy_contract(deployment_file=None)
    return client


@pytest.fixture
def registered_blockchain(test_blockchain):
    """Blockchain testbed with both Stage 1 and Stage 2 models registered."""
    test_blockchain.register_model(
        model_id=settings.MODEL_ID,
        version=settings.MODEL_VERSION,
        model_hash_hex=CANONICAL_STAGE1_SHA256,
        algorithm=settings.ALGORITHM,
    )
    test_blockchain.register_model(
        model_id=settings.STAGE2_MODEL_ID,
        version=settings.STAGE2_MODEL_VERSION,
        model_hash_hex=CANONICAL_STAGE2_SHA256,
        algorithm=settings.STAGE2_ALGORITHM,
    )
    return test_blockchain


@pytest.fixture
def app_and_client(tmp_path, registered_blockchain):
    """FastAPI app instance with initial verified and loaded models."""
    audit_db = tmp_path / "test_simulator_audit.db"
    app = create_app(
        blockchain_client=registered_blockchain,
        audit_db_path=str(audit_db),
        auto_verify=False,
    )

    # Initial verification and loading
    v_service = app.state.verification_service
    app.state.model_service.verify_and_load(v_service)
    app.state.stage2_model_service.verify_and_load(v_service)

    with TestClient(app) as client:
        yield app, client


def test_1_canonical_model_integrity_preserved(app_and_client):
    """Canonical artifact hash must match authoritative SHA-256 before and after simulation."""
    app, client = app_and_client
    initial_hash = calculate_sha256(settings.MODEL_PATH)
    assert initial_hash == CANONICAL_STAGE1_SHA256

    sim_res = client.post("/demo/model-replacement")
    assert sim_res.status_code == 200

    after_sim_hash = calculate_sha256(settings.MODEL_PATH)
    assert after_sim_hash == CANONICAL_STAGE1_SHA256, "Canonical artifact MUST NOT be modified by simulation"


def test_2_simulation_ephemeral_tampered_hash_differs(app_and_client):
    """Temporary tampered candidate must yield a different observed SHA-256."""
    app, client = app_and_client
    sim_res = client.post("/demo/model-replacement")
    assert sim_res.status_code == 200
    data = sim_res.json()

    assert data["registered_hash"] == CANONICAL_STAGE1_SHA256
    assert data["observed_hash"] != CANONICAL_STAGE1_SHA256
    assert len(data["observed_hash"]) == 64


def test_3_simulation_detects_hash_mismatch_and_blocks_load(app_and_client):
    """Simulation must report HASH_MISMATCH, unverified status, and blocked load action."""
    app, client = app_and_client
    sim_res = client.post("/demo/model-replacement")
    assert sim_res.status_code == 200
    data = sim_res.json()

    assert data["status"] == "HASH_MISMATCH"
    assert data["verified"] is False
    assert data["action_taken"] == "MODEL_LOAD_BLOCKED"
    assert data["downstream_state"] == "LOCKED"

    # Verify model service memory state is unloaded
    assert app.state.model_service.is_loaded is False
    assert app.state.model_service.verification_status == "HASH_MISMATCH"


def test_4_simulation_provides_eight_step_timeline(app_and_client):
    """Simulation returns an 8-step chronological timeline of the verification and lockout process."""
    app, client = app_and_client
    sim_res = client.post("/demo/model-replacement")
    assert sim_res.status_code == 200
    data = sim_res.json()

    timeline = data.get("timeline", [])
    assert len(timeline) == 8
    assert timeline[0]["step"] == 1
    assert timeline[5]["status"] == "HASH_MISMATCH"
    assert timeline[6]["name"] == "Model loading blocked"
    assert timeline[7]["name"] == "Downstream inference locked"


def test_5_downstream_inference_fails_closed_during_attack(app_and_client):
    """When tampered state is active, /predict and /predict/hierarchical must fail closed with 503."""
    app, client = app_and_client

    # Trigger simulation to induce tampered state
    sim_res = client.post("/demo/model-replacement")
    assert sim_res.status_code == 200

    # Test binary /predict fail-closed
    pred_res = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_res.status_code == 503
    assert "fail-closed" in pred_res.json()["detail"].lower()

    # Test hierarchical /predict/hierarchical fail-closed
    hpred_res = client.post("/predict/hierarchical", json={"features": SAMPLE_FLOW_RECORD})
    assert hpred_res.status_code == 503
    assert "fail-closed" in hpred_res.json()["detail"].lower()


def test_6_reset_restores_legitimate_verified_state(app_and_client):
    """Reset endpoint must verify canonical artifact against on-chain digest and restore authorized state."""
    app, client = app_and_client

    # Trigger attack simulation first
    client.post("/demo/model-replacement")
    assert app.state.model_service.is_loaded is False

    # Execute reset
    reset_res = client.post("/demo/model-replacement/reset")
    assert reset_res.status_code == 200
    data = reset_res.json()

    assert data["status"] == "VERIFIED"
    assert data["verified"] is True
    assert data["canonical_hash"] == CANONICAL_STAGE1_SHA256
    assert data["registered_hash"] == CANONICAL_STAGE1_SHA256
    assert data["action_taken"] == "AUTHORIZED_AND_LOADED"
    assert data["downstream_state"] == "UNLOCKED"

    # Verify memory state is restored
    assert app.state.model_service.is_loaded is True
    assert app.state.model_service.verification_status == "VERIFIED"


def test_7_inference_succeeds_after_reset(app_and_client):
    """After reset, downstream inference endpoints operate normally."""
    app, client = app_and_client

    client.post("/demo/model-replacement")
    client.post("/demo/model-replacement/reset")

    pred_res = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_res.status_code == 200
    assert pred_res.json()["verification_status"] == "VERIFIED"

    hpred_res = client.post("/predict/hierarchical", json={"features": SAMPLE_FLOW_RECORD})
    assert hpred_res.status_code == 200
    h_data = hpred_res.json()
    assert h_data["stage1_model_id"] == settings.MODEL_ID
    assert "advisory_recommendation" in h_data
    assert h_data["advisory_recommendation"]["is_advisory"] is True


def test_8_audit_trail_captures_attack_and_restoration(app_and_client):
    """Audit service must record MODEL_REPLACEMENT_DETECTED and MODEL_RESTORED events."""
    app, client = app_and_client
    audit_service = app.state.audit_service

    client.post("/demo/model-replacement")
    client.post("/demo/model-replacement/reset")

    events, total = audit_service.get_events(limit=10)
    event_types = [e["event_type"] for e in events]

    assert "MODEL_REPLACEMENT_DETECTED" in event_types
    assert "MODEL_RESTORED" in event_types

    detect_event = next(e for e in events if e["event_type"] == "MODEL_REPLACEMENT_DETECTED")
    assert detect_event["status"] == "WARNING"
    assert detect_event["verification_status"] == "HASH_MISMATCH"
    assert detect_event["details"]["action_taken"] == "MODEL_LOAD_BLOCKED"

    restore_event = next(e for e in events if e["event_type"] == "MODEL_RESTORED")
    assert restore_event["status"] == "SUCCESS"
    assert restore_event["verification_status"] == "VERIFIED"
    assert restore_event["details"]["action_taken"] == "AUTHORIZED_AND_LOADED"


def test_9_unregistered_version_simulation_fails_closed(app_and_client):
    """Demonstrating unregistered model candidate rejection (NOT_REGISTERED)."""
    app, client = app_and_client

    res = client.post("/demo/unregistered-version")
    assert res.status_code == 200
    data = res.json()

    assert data["scenario"] == "unregistered_version"
    assert data["status"] == "NOT_REGISTERED"
    assert data["verified"] is False
    assert data["version"] == "v9.9.9"
    assert data["action_taken"] == "MODEL_LOAD_BLOCKED"
    assert data["downstream_state"] == "LOCKED"

    # Model service is unloaded fail-closed
    assert app.state.model_service.is_loaded is False

    # Downstream inference is locked
    pred_res = client.post("/predict", json={"features": SAMPLE_FLOW_RECORD})
    assert pred_res.status_code == 503


def test_10_ephemeral_segregation_no_leftovers(app_and_client):
    """Artifacts directory must contain ONLY canonical files, no ephemeral temporary files."""
    app, client = app_and_client

    client.post("/demo/model-replacement")
    client.post("/demo/model-replacement/reset")

    artifacts_dir = settings.MODEL_PATH.parent
    files = [f.name for f in artifacts_dir.iterdir() if f.is_file()]

    for f in files:
        assert not f.startswith("ephemeral_"), f"Ephemeral file leaked into artifacts dir: {f}"
        assert not f.endswith(".tmp"), f"Temp file leaked into artifacts dir: {f}"
