"""Unit tests for Phase 7B.2 Stage 2 Model Provenance and Blockchain Registry.

Verifies:
1. Stage 2 artifact SHA matches expected value.
2. Stage 1 artifact SHA remains unchanged.
3. Stage 2 model ID is distinct from Stage 1.
4. Legitimate artifact verifies on-chain.
5. Modified artifact produces HASH_MISMATCH.
6. Unregistered version produces NOT_REGISTERED.
7. Canonical artifact is unchanged after experiment.
8. Provenance record contains the expected digest.
9. Registered on-chain hash equals the expected Stage 2 digest.
10. No raw network-flow feature dictionaries are stored in provenance data.
"""

from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path

import pytest

from core.blockchain import BlockchainRegistryClient
from core.hashing import calculate_sha256

REPO_ROOT = Path(__file__).resolve().parent.parent

STAGE2_MODEL_ID = "iot-ids-attack-classifier"
STAGE2_VERSION = "v1.0.0"
STAGE2_ALGORITHM = "RandomForestClassifier"
STAGE2_ARTIFACT_PATH = REPO_ROOT / "ml" / "artifacts" / "attack_classifier.joblib"
STAGE2_PROVENANCE_PATH = REPO_ROOT / "ml" / "artifacts" / "attack_classifier_provenance_record.json"
EXPECTED_STAGE2_SHA256 = "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"

STAGE1_ARTIFACT_PATH = REPO_ROOT / "ml" / "artifacts" / "ids_model.joblib"
STAGE1_PROVENANCE_PATH = REPO_ROOT / "ml" / "artifacts" / "provenance_record.json"
EXPECTED_STAGE1_SHA256 = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"


@pytest.fixture(scope="module")
def deployed_client():
    """Deploy a local ModelRegistry instance and register the Stage 2 model."""
    client = BlockchainRegistryClient()
    client.deploy_contract(deployment_file=None)
    client.register_model(
        model_id=STAGE2_MODEL_ID,
        version=STAGE2_VERSION,
        model_hash_hex=EXPECTED_STAGE2_SHA256,
        algorithm=STAGE2_ALGORITHM,
    )
    return client


def test_1_stage2_artifact_sha_matches_expected():
    """1. Test that the Stage 2 artifact SHA matches the expected canonical digest."""
    assert STAGE2_ARTIFACT_PATH.exists(), f"Missing Stage 2 artifact: {STAGE2_ARTIFACT_PATH}"
    actual_sha = calculate_sha256(STAGE2_ARTIFACT_PATH)
    assert actual_sha == EXPECTED_STAGE2_SHA256


def test_2_stage1_artifact_sha_remains_unchanged():
    """2. Test that the Stage 1 artifact SHA remains unchanged from the baseline."""
    assert STAGE1_ARTIFACT_PATH.exists(), f"Missing Stage 1 artifact: {STAGE1_ARTIFACT_PATH}"
    actual_sha = calculate_sha256(STAGE1_ARTIFACT_PATH)
    assert actual_sha == EXPECTED_STAGE1_SHA256


def test_3_stage2_model_id_is_distinct_from_stage1():
    """3. Test that the Stage 2 model ID is completely distinct from Stage 1."""
    with open(STAGE2_PROVENANCE_PATH, "r", encoding="utf-8") as f:
        stage2_data = json.load(f)
    with open(STAGE1_PROVENANCE_PATH, "r", encoding="utf-8") as f:
        stage1_data = json.load(f)

    assert stage2_data["model_id"] != stage1_data["model_id"]
    assert stage2_data["model_id"] == "iot-ids-attack-classifier"
    assert stage1_data["model_id"] == "iot-ids-rf"


def test_4_legitimate_artifact_verifies(deployed_client):
    """4. Test that the canonical Stage 2 artifact verifies successfully against on-chain registry."""
    res = deployed_client.verify_model_against_blockchain(
        model_path=STAGE2_ARTIFACT_PATH,
        model_id=STAGE2_MODEL_ID,
        version=STAGE2_VERSION,
    )
    assert res["verified"] is True
    assert res["status"] == "VERIFIED"
    assert res["local_hash"] == EXPECTED_STAGE2_SHA256
    assert res["registered_hash"] == EXPECTED_STAGE2_SHA256


def test_5_modified_artifact_produces_hash_mismatch(deployed_client, tmp_path):
    """5. Test that a modified artifact produces HASH_MISMATCH."""
    tampered_file = tmp_path / "tampered_stage2.joblib"
    shutil.copyfile(STAGE2_ARTIFACT_PATH, tampered_file)

    with open(tampered_file, "ab") as f:
        f.write(b"\x00CORRUPT_PAYLOAD\x00")

    tampered_sha = calculate_sha256(tampered_file)
    assert tampered_sha != EXPECTED_STAGE2_SHA256

    res = deployed_client.verify_model_against_blockchain(
        model_path=tampered_file,
        model_id=STAGE2_MODEL_ID,
        version=STAGE2_VERSION,
    )
    assert res["verified"] is False
    assert res["status"] == "HASH_MISMATCH"
    assert res["local_hash"] == tampered_sha
    assert res["registered_hash"] == EXPECTED_STAGE2_SHA256


def test_6_unregistered_version_produces_not_registered(deployed_client):
    """6. Test that querying an unregistered version produces NOT_REGISTERED."""
    res = deployed_client.verify_model_against_blockchain(
        model_path=STAGE2_ARTIFACT_PATH,
        model_id=STAGE2_MODEL_ID,
        version="v9.9.9",
    )
    assert res["verified"] is False
    assert res["status"] == "NOT_REGISTERED"


def test_7_canonical_artifact_is_unchanged():
    """7. Test that the canonical artifact on disk is strictly unchanged after testing."""
    actual_sha = calculate_sha256(STAGE2_ARTIFACT_PATH)
    assert actual_sha == EXPECTED_STAGE2_SHA256


def test_8_provenance_record_contains_expected_digest():
    """8. Test that the Stage 2 provenance record contains the expected cryptographic digest."""
    assert STAGE2_PROVENANCE_PATH.exists()
    with open(STAGE2_PROVENANCE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["artifact"]["sha256"] == EXPECTED_STAGE2_SHA256
    assert data["model_id"] == STAGE2_MODEL_ID
    assert data["version"] == STAGE2_VERSION


def test_9_registered_on_chain_hash_equals_expected_digest(deployed_client):
    """9. Test that the on-chain stored hash equals the expected Stage 2 digest."""
    record = deployed_client.get_model(STAGE2_MODEL_ID, STAGE2_VERSION)
    assert record["model_hash"].lower() == EXPECTED_STAGE2_SHA256.lower()
    assert record["algorithm"] == STAGE2_ALGORITHM
    assert record["model_id"] == STAGE2_MODEL_ID
    assert record["version"] == STAGE2_VERSION


def test_10_no_raw_network_flow_features_stored_in_provenance():
    """10. Test that no raw network-flow feature values or datasets are stored in provenance data."""
    with open(STAGE2_PROVENANCE_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        data = json.loads(content)

    # Provenance record should store schema metadata, not raw flow records or sample vectors
    assert "raw_samples" not in data
    assert "traffic_flows" not in data
    assert "payload" not in data
    assert data["blockchain_provenance"]["raw_flow_storage"] is False
    assert data["blockchain_provenance"]["pii_storage"] is False
    assert data["blockchain_provenance"]["weights_storage"] is False
