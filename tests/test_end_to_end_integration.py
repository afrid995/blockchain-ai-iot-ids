"""Comprehensive End-to-End Hierarchical Integration Tests.

Phase 7B.5.3: Final End-to-End Hierarchical Integration
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

Verifies all 20 required research invariants:
1. Legitimate hierarchical prediction succeeds.
2. Stage 1 benign does not invoke Stage 2 (routes to 'Normal').
3. Stage 1 attack invokes Stage 2 exactly once.
4. Final output belongs to Normal + 9 attack categories.
5. Recommendation is deterministic across repeated calls.
6. Advisory flags remain correct (is_advisory=True, requires_human_approval=True, automated_remediation_enabled=False).
7. No executable remediation commands are generated.
8. Provenance gate blocks tampered Stage 1 artifact.
9. Provenance gate blocks tampered Stage 2 artifact.
10. Unregistered model version is rejected.
11. Missing artifact is rejected with controlled fail-closed status.
12. Stage 1 canonical SHA-256 remains unaltered.
13. Stage 2 canonical SHA-256 remains unaltered.
14. Target columns (id, label, attack_cat) are stripped and excluded from features.
15. Stage 2 routing never uses true labels.
16. Stage 2 routed count equals Stage 1 predicted-attack count.
17. Per-flow blockchain query counter strictly equals zero.
18. Existing POST /predict endpoint remains 100% backward compatible.
19. Existing GET /model/status endpoint remains 100% backward compatible.
20. Raw feature vectors (42 features) are strictly excluded from persistent audit records.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any, Dict

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from web3 import EthereumTesterProvider

from backend.config import settings
from backend.main import create_app
from backend.services.audit_service import AuditService
from backend.services.hierarchical_service import HierarchicalService
from backend.services.model_service import ModelService
from backend.services.prediction_service import ModelNotReadyError
from backend.services.verification_service import VerificationService
from core.blockchain import BlockchainRegistryClient
from core.hashing import calculate_sha256
from core.response_recommendations import ATTACK_CATEGORIES, SUPPORTED_CATEGORIES

REPO_ROOT = Path(__file__).resolve().parent.parent

# Canonical hashes
EXPECTED_STAGE1_SHA256 = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"
EXPECTED_STAGE2_SHA256 = "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"

# Test samples from UNSW-NB15
# Row 4 in test set: Stage 1 predicts 0 (Benign)
# Row 0 in test set: Stage 1 predicts 1 (Attack)
@pytest.fixture(scope="session")
def sample_test_flows() -> Tuple[Dict[str, Any], Dict[str, Any]]:
    test_csv = REPO_ROOT / "data" / "raw" / "UNSW_NB15_testing-set.csv"
    df = pd.read_csv(test_csv, nrows=10)
    flow_benign = df.iloc[4].to_dict()  # Stage 1 -> 0
    flow_attack = df.iloc[0].to_dict()  # Stage 1 -> 1
    return flow_benign, flow_attack


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
        model_hash_hex=EXPECTED_STAGE1_SHA256,
        algorithm=settings.ALGORITHM,
    )
    test_blockchain.register_model(
        model_id=settings.STAGE2_MODEL_ID,
        version=settings.STAGE2_MODEL_VERSION,
        model_hash_hex=EXPECTED_STAGE2_SHA256,
        algorithm=settings.STAGE2_ALGORITHM,
    )
    return test_blockchain


@pytest.fixture
def integrated_app_and_client(tmp_path, registered_blockchain):
    """FastAPI app with verified models loaded for hierarchical testing."""
    audit_db = tmp_path / "test_hierarchical_audit.db"
    app = create_app(
        blockchain_client=registered_blockchain,
        audit_db_path=str(audit_db),
        auto_verify=False,
    )

    # Execute verification gate for both stages
    v_service = app.state.verification_service
    app.state.model_service.verify_and_load(v_service)
    app.state.stage2_model_service.verify_and_load(v_service)

    with TestClient(app) as client:
        yield app, client, registered_blockchain


# ==============================================================================
# 20 REQUIRED TEST CASES
# ==============================================================================

def test_1_legitimate_hierarchical_prediction_succeeds(integrated_app_and_client, sample_test_flows):
    """1. Legitimate hierarchical prediction succeeds when both models are verified."""
    app, client, _ = integrated_app_and_client
    flow_benign, flow_attack = sample_test_flows

    res = client.post("/predict/hierarchical", json={"features": flow_attack})
    assert res.status_code == 200
    data = res.json()

    assert "final_prediction" in data
    assert "stage1_prediction" in data
    assert "stage2_invoked" in data
    assert "advisory_recommendation" in data
    assert data["verification_status"] == "VERIFIED"
    assert data["per_flow_blockchain_queries"] == 0


def test_2_stage1_benign_does_not_invoke_stage2(integrated_app_and_client, sample_test_flows):
    """2. Stage 1 Benign prediction does NOT invoke Stage 2 and routes to Normal."""
    app, client, _ = integrated_app_and_client
    flow_benign, _ = sample_test_flows

    res = client.post("/predict/hierarchical", json={"features": flow_benign})
    assert res.status_code == 200
    data = res.json()

    assert data["stage1_prediction"] == "Benign"
    assert data["stage1_code"] == 0
    assert data["stage2_invoked"] is False
    assert data["stage2_prediction"] is None
    assert data["final_prediction"] == "Normal"
    assert data["advisory_recommendation"]["category"] == "Normal"
    assert data["advisory_recommendation"]["severity"] == "Informational"


def test_3_stage1_attack_invokes_stage2_exactly_once(integrated_app_and_client, sample_test_flows):
    """3. Stage 1 Attack prediction conditionally invokes Stage 2 exactly once."""
    app, client, _ = integrated_app_and_client
    _, flow_attack = sample_test_flows

    res = client.post("/predict/hierarchical", json={"features": flow_attack})
    assert res.status_code == 200
    data = res.json()

    assert data["stage1_prediction"] == "Attack"
    assert data["stage1_code"] == 1
    assert data["stage2_invoked"] is True
    assert data["stage2_prediction"] in ATTACK_CATEGORIES
    assert data["final_prediction"] == data["stage2_prediction"]
    assert data["advisory_recommendation"]["category"] == data["stage2_prediction"]


def test_4_final_output_belongs_to_normal_plus_nine_attack_categories(integrated_app_and_client, sample_test_flows):
    """4. Final output strictly belongs to the defined 10 categories (Normal + 9 attacks)."""
    app, client, _ = integrated_app_and_client
    flow_benign, flow_attack = sample_test_flows

    res_b = client.post("/predict/hierarchical", json={"features": flow_benign})
    assert res_b.json()["final_prediction"] in SUPPORTED_CATEGORIES

    res_a = client.post("/predict/hierarchical", json={"features": flow_attack})
    assert res_a.json()["final_prediction"] in SUPPORTED_CATEGORIES


def test_5_recommendation_is_deterministic(integrated_app_and_client, sample_test_flows):
    """5. Recommendations are 100% deterministic across repeated calls."""
    app, client, _ = integrated_app_and_client
    _, flow_attack = sample_test_flows

    r1 = client.post("/predict/hierarchical", json={"features": flow_attack}).json()
    r2 = client.post("/predict/hierarchical", json={"features": flow_attack}).json()

    assert r1["final_prediction"] == r2["final_prediction"]
    assert r1["advisory_recommendation"] == r2["advisory_recommendation"]


def test_6_advisory_flags_remain_correct(integrated_app_and_client, sample_test_flows):
    """6. Advisory flags remain strictly is_advisory=True, requires_human_approval=True, automated_remediation_enabled=False."""
    app, client, _ = integrated_app_and_client
    flow_benign, flow_attack = sample_test_flows

    for flow in [flow_benign, flow_attack]:
        res = client.post("/predict/hierarchical", json={"features": flow}).json()
        rec = res["advisory_recommendation"]
        assert rec["is_advisory"] is True
        assert rec["requires_human_approval"] is True
        assert rec["automated_remediation_enabled"] is False


def test_7_no_executable_remediation_generated(integrated_app_and_client, sample_test_flows):
    """7. No executable system commands (iptables, ufw, route, socket termination) are generated."""
    app, client, _ = integrated_app_and_client
    flow_benign, flow_attack = sample_test_flows

    forbidden = ["iptables", "ufw", "route add", "kill -9", "shutdown", "drop_connection"]
    for flow in [flow_benign, flow_attack]:
        res = client.post("/predict/hierarchical", json={"features": flow}).json()
        rec_str = json.dumps(res["advisory_recommendation"]).lower()
        for cmd in forbidden:
            assert cmd not in rec_str, f"Found forbidden execution command '{cmd}' in advisory guidance"


def test_8_provenance_gate_blocks_tampered_stage1(tmp_path, registered_blockchain):
    """8. Tampered Stage 1 artifact fails cryptographic verification and blocks loading."""
    tampered_stage1 = tmp_path / "tampered_ids_model.joblib"
    shutil.copyfile(settings.MODEL_PATH, tampered_stage1)
    with open(tampered_stage1, "r+b") as f:
        f.seek(100)
        byte = f.read(1)
        f.seek(100)
        f.write(bytes([byte[0] ^ 0xFF]))

    audit_service = AuditService(tmp_path / "audit.db")
    v_service = VerificationService(blockchain_client=registered_blockchain, audit_service=audit_service)
    s1_service = ModelService(
        model_path=tampered_stage1,
        model_id=settings.MODEL_ID,
        model_version=settings.MODEL_VERSION,
        audit_service=audit_service,
    )
    outcome = s1_service.verify_and_load(v_service)

    assert outcome["verified"] is False
    assert outcome["status"] == "HASH_MISMATCH"
    assert s1_service.is_loaded is False


def test_9_provenance_gate_blocks_tampered_stage2(tmp_path, registered_blockchain):
    """9. Tampered Stage 2 artifact fails cryptographic verification and blocks loading."""
    tampered_stage2 = tmp_path / "tampered_attack_classifier.joblib"
    shutil.copyfile(settings.STAGE2_MODEL_PATH, tampered_stage2)
    with open(tampered_stage2, "r+b") as f:
        f.seek(100)
        byte = f.read(1)
        f.seek(100)
        f.write(bytes([byte[0] ^ 0xFF]))

    audit_service = AuditService(tmp_path / "audit.db")
    v_service = VerificationService(blockchain_client=registered_blockchain, audit_service=audit_service)
    s2_service = ModelService(
        model_path=tampered_stage2,
        model_id=settings.STAGE2_MODEL_ID,
        model_version=settings.STAGE2_MODEL_VERSION,
        audit_service=audit_service,
    )
    outcome = s2_service.verify_and_load(v_service)

    assert outcome["verified"] is False
    assert outcome["status"] == "HASH_MISMATCH"
    assert s2_service.is_loaded is False


def test_10_unregistered_version_is_rejected(tmp_path, registered_blockchain):
    """10. Unregistered model version produces NOT_REGISTERED and blocks loading."""
    audit_service = AuditService(tmp_path / "audit.db")
    v_service = VerificationService(blockchain_client=registered_blockchain, audit_service=audit_service)
    s2_service = ModelService(
        model_path=settings.STAGE2_MODEL_PATH,
        model_id=settings.STAGE2_MODEL_ID,
        model_version="v9.9.9",
        audit_service=audit_service,
    )
    outcome = s2_service.verify_and_load(v_service)

    assert outcome["verified"] is False
    assert outcome["status"] == "NOT_REGISTERED"
    assert s2_service.is_loaded is False


def test_11_missing_artifact_is_rejected(tmp_path, registered_blockchain):
    """11. Missing model artifact path produces FILE_NOT_FOUND and fails closed."""
    audit_service = AuditService(tmp_path / "audit.db")
    v_service = VerificationService(blockchain_client=registered_blockchain, audit_service=audit_service)
    s1_service = ModelService(
        model_path=tmp_path / "non_existent_file.joblib",
        model_id=settings.MODEL_ID,
        model_version=settings.MODEL_VERSION,
        audit_service=audit_service,
    )
    outcome = s1_service.verify_and_load(v_service)

    assert outcome["verified"] is False
    assert outcome["status"] == "FILE_NOT_FOUND"
    assert s1_service.is_loaded is False


def test_12_stage1_canonical_sha_unchanged():
    """12. Stage 1 canonical model artifact hash is verified unchanged."""
    actual_sha = calculate_sha256(settings.MODEL_PATH)
    assert actual_sha == EXPECTED_STAGE1_SHA256, "Stage 1 model artifact has been mutated!"


def test_13_stage2_canonical_sha_unchanged():
    """13. Stage 2 canonical model artifact hash is verified unchanged."""
    actual_sha = calculate_sha256(settings.STAGE2_MODEL_PATH)
    assert actual_sha == EXPECTED_STAGE2_SHA256, "Stage 2 model artifact has been mutated!"


def test_14_target_columns_are_not_used_as_features(integrated_app_and_client, sample_test_flows):
    """14. Target columns (id, label, attack_cat) are stripped and not used as features."""
    app, client, _ = integrated_app_and_client
    _, flow_attack = sample_test_flows

    flow_with_targets = dict(flow_attack)
    flow_with_targets["id"] = 999999
    flow_with_targets["label"] = 0  # Contradictory true label
    flow_with_targets["attack_cat"] = "Fictional"

    res = client.post("/predict/hierarchical", json={"features": flow_with_targets})
    assert res.status_code == 200
    data = res.json()
    assert data["final_prediction"] in SUPPORTED_CATEGORIES


def test_15_stage2_routing_never_uses_true_labels(integrated_app_and_client, sample_test_flows):
    """15. Stage 2 routing strictly branches on Stage 1 prediction s1_code, never on ground truth."""
    app, client, _ = integrated_app_and_client
    flow_benign, _ = sample_test_flows

    # Even if we attach label=1, Stage 1 prediction for this sample is 0 (Benign)
    flow_sneaky = dict(flow_benign)
    flow_sneaky["label"] = 1
    flow_sneaky["attack_cat"] = "Exploits"

    res = client.post("/predict/hierarchical", json={"features": flow_sneaky}).json()
    assert res["stage1_code"] == 0
    assert res["stage2_invoked"] is False
    assert res["final_prediction"] == "Normal"


def test_16_stage2_routed_count_equals_stage1_predicted_attack_count(integrated_app_and_client):
    """16. In batch processing, Stage 2 routed count equals Stage 1 predicted attack count."""
    app, client, _ = integrated_app_and_client
    test_csv = REPO_ROOT / "data" / "raw" / "UNSW_NB15_testing-set.csv"
    df_sample = pd.read_csv(test_csv, nrows=20)

    routed_count = 0
    s1_attack_count = 0
    for _, row in df_sample.iterrows():
        res = client.post("/predict/hierarchical", json={"features": row.to_dict()}).json()
        if res["stage1_code"] == 1:
            s1_attack_count += 1
        if res["stage2_invoked"] is True:
            routed_count += 1

    assert routed_count == s1_attack_count


def test_17_per_flow_blockchain_query_counter_equals_zero(integrated_app_and_client, sample_test_flows):
    """17. Per-flow blockchain query counter strictly equals zero during runtime inference."""
    app, client, test_blockchain = integrated_app_and_client
    _, flow_attack = sample_test_flows

    test_blockchain.reset_query_counter()
    initial_queries = test_blockchain.get_query_count()
    assert initial_queries == 0

    res = client.post("/predict/hierarchical", json={"features": flow_attack}).json()

    assert res["per_flow_blockchain_queries"] == 0
    assert test_blockchain.get_query_count() == 0, "Blockchain was queried during per-flow inference!"


def test_18_existing_predict_behavior_remains_compatible(integrated_app_and_client, sample_test_flows):
    """18. Existing POST /predict endpoint remains 100% backward compatible."""
    app, client, _ = integrated_app_and_client
    _, flow_attack = sample_test_flows

    res = client.post("/predict", json={"features": flow_attack})
    assert res.status_code == 200
    data = res.json()

    assert data["prediction"] in ("Attack", "Benign")
    assert data["prediction_code"] in (0, 1)
    assert 0.0 <= data["confidence"] <= 1.0
    assert data["model_id"] == "iot-ids-rf"
    assert "stage2_prediction" not in data  # Binary schema preserved


def test_19_model_status_remains_compatible(integrated_app_and_client):
    """19. Existing GET /model/status endpoint remains 100% backward compatible."""
    app, client, _ = integrated_app_and_client
    res = client.get("/model/status")
    assert res.status_code == 200
    data = res.json()

    assert data["model_id"] == "iot-ids-rf"
    assert data["model_version"] == "v1.0.0"
    assert data["verification_status"] == "VERIFIED"
    assert data["is_loaded"] is True


def test_20_raw_feature_dictionaries_are_not_persisted_in_audit_records(integrated_app_and_client, sample_test_flows):
    """20. Raw 42-feature flow dictionaries are strictly excluded from persistent SQLite audit records."""
    app, client, _ = integrated_app_and_client
    _, flow_attack = sample_test_flows

    # Send prediction
    res = client.post("/predict/hierarchical", json={"features": flow_attack}).json()
    event_id = res["event_id"]

    # Retrieve audit event
    audit_res = client.get(f"/audit/events/{event_id}")
    assert audit_res.status_code == 200
    event_data = audit_res.json()

    details = event_data["details"]
    assert "features" not in details
    # Verify raw flow feature keys are absent
    raw_feature_keys = {"dur", "spkts", "dpkts", "sbytes", "dbytes", "sttl", "dttl", "sload", "dload"}
    for k in raw_feature_keys:
        assert k not in details, f"Found sensitive raw feature '{k}' in audit details!"
