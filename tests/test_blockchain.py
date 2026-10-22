"""Unit and integration tests for Blockchain Model Registry and Provenance Verification (Phase 3).

Verifies:
1. Blockchain connection to EVM
2. Contract compilation and deployment
3. Model registration and on-chain retrieval
4. bytes32 and SHA-256 conversion roundtrips
5. Duplicate registration rejection (tamper prevention)
6. Unauthorized registrant rejection (access control)
7. Event emission on registration
8. Legitimate model verification (VERIFIED)
9. Tampered model verification (HASH_MISMATCH)
10. Unregistered model verification (NOT_REGISTERED)
11. Blockchain failure safe handling (BLOCKCHAIN_UNAVAILABLE)
12. Missing local file handling (FILE_NOT_FOUND)
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import pytest
from web3 import EthereumTesterProvider, Web3

from core.blockchain import (
    BlockchainRegistryClient,
    bytes32_to_hex,
    hex_to_bytes32,
)


@pytest.fixture
def fresh_client():
    """Create a dedicated, fresh in-process EthereumTesterProvider client and deploy ModelRegistry."""
    provider = EthereumTesterProvider()
    client = BlockchainRegistryClient(provider=provider)
    client.deploy_contract(deployment_file=None)
    return client


@pytest.fixture
def dummy_artifact(tmp_path):
    """Create a temporary model artifact file and calculate its hash."""
    from core.hashing import calculate_sha256
    art = tmp_path / "test_ids_model.joblib"
    art.write_bytes(b"AUTHENTIC_JOB_LIB_BYTES_CLASSIFIER_V1")
    sha = calculate_sha256(art)
    return art, sha


def test_1_blockchain_connection(fresh_client):
    """Test 1: Web3 connection to local EVM is active."""
    assert fresh_client.is_connected() is True
    assert len(fresh_client.w3.eth.accounts) >= 2


def test_2_contract_deployment(fresh_client):
    """Test 2: Contract deployment returns valid address, tx hash, block, and gas."""
    assert fresh_client.contract_address is not None
    assert Web3.is_address(fresh_client.contract_address)
    assert fresh_client.contract is not None


def test_3_model_registration_and_retrieval(fresh_client):
    """Test 3: Model registration commits data and get_model retrieves exact record."""
    model_id = "test-ids-rf"
    version = "v1.0.0"
    test_hash = "a" * 64
    algo = "RandomForest"

    receipt = fresh_client.register_model(
        model_id=model_id,
        version=version,
        model_hash_hex=test_hash,
        algorithm=algo,
    )
    assert receipt["status"] == "SUCCESS"
    assert receipt["block_number"] >= 1
    assert receipt["gas_used"] > 0

    assert fresh_client.is_registered(model_id, version) is True

    record = fresh_client.get_model(model_id, version)
    assert record["model_id"] == model_id
    assert record["version"] == version
    assert record["model_hash"] == test_hash
    assert record["algorithm"] == algo
    assert record["registrant"] == fresh_client.w3.eth.accounts[0]


def test_4_bytes32_conversion_roundtrip():
    """Test 4: Hex string to bytes32 conversion is deterministic and invertible."""
    original_hex = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"
    b32 = hex_to_bytes32(original_hex)
    assert len(b32) == 32
    roundtrip = bytes32_to_hex(b32)
    assert roundtrip == original_hex


def test_5_duplicate_registration_rejected(fresh_client):
    """Test 5: Re-registering the same model ID and version fails (reverts)."""
    model_id = "unique-rf"
    version = "v1.0.0"
    test_hash = "b" * 64

    fresh_client.register_model(model_id, version, test_hash, "RF")

    with pytest.raises(ValueError) as excinfo:
        fresh_client.register_model(model_id, version, test_hash, "RF")
    assert "already registered" in str(excinfo.value)


def test_6_unauthorized_registration_rejected(fresh_client):
    """Test 6: Non-owner account cannot register a model."""
    non_owner = fresh_client.w3.eth.accounts[1]
    model_id = "auth-rf"
    version = "v1.0.0"
    test_hash = "c" * 64

    with pytest.raises(ValueError) as excinfo:
        fresh_client.register_model(
            model_id=model_id,
            version=version,
            model_hash_hex=test_hash,
            algorithm="RF",
            sender=non_owner,
        )
    assert "Caller is not the authorized owner" in str(excinfo.value)


def test_7_registration_event_emitted(fresh_client):
    """Test 7: ModelRegistered event is emitted upon successful registration."""
    model_id = "event-rf"
    version = "v1.0.0"
    test_hash = "d" * 64

    receipt = fresh_client.register_model(model_id, version, test_hash, "RF")
    tx_hash = receipt["transaction_hash"]
    tx_receipt = fresh_client.w3.eth.get_transaction_receipt(tx_hash)

    # Process logs using contract event
    events = fresh_client.contract.events.ModelRegistered().process_receipt(tx_receipt)
    assert len(events) == 1
    event_args = events[0]["args"]
    assert event_args["version"] == version
    assert bytes32_to_hex(event_args["modelHash"]) == test_hash


def test_8_legitimate_model_verification(fresh_client, dummy_artifact):
    """Test 8: Pristine local model matches blockchain registered hash -> VERIFIED."""
    art_path, sha = dummy_artifact
    model_id = "rf-legit"
    version = "v1.0.0"

    fresh_client.register_model(model_id, version, sha, "RandomForest")

    res = fresh_client.verify_model_against_blockchain(art_path, model_id, version)
    assert res["verified"] is True
    assert res["status"] == "VERIFIED"
    assert res["local_hash"] == sha
    assert res["registered_hash"] == sha


def test_9_tampered_model_verification(fresh_client, dummy_artifact):
    """Test 9: Mutated local artifact produces HASH_MISMATCH against on-chain hash."""
    art_path, sha = dummy_artifact
    model_id = "rf-tamper"
    version = "v1.0.0"

    fresh_client.register_model(model_id, version, sha, "RandomForest")

    # Tamper the file
    with open(art_path, "ab") as f:
        f.write(b"MUTATED_BACKDOOR_BYTE_INJECTION")

    res = fresh_client.verify_model_against_blockchain(art_path, model_id, version)
    assert res["verified"] is False
    assert res["status"] == "HASH_MISMATCH"
    assert res["local_hash"] != res["registered_hash"]


def test_10_unregistered_model_verification(fresh_client, dummy_artifact):
    """Test 10: Querying an unregistered model returns NOT_REGISTERED."""
    art_path, _ = dummy_artifact
    res = fresh_client.verify_model_against_blockchain(art_path, "unknown-model", "v9.9.9")
    assert res["verified"] is False
    assert res["status"] == "NOT_REGISTERED"


def test_11_blockchain_unavailable_handling(dummy_artifact):
    """Test 11: When blockchain is unreachable, status is BLOCKCHAIN_UNAVAILABLE and verified=False."""
    art_path, _ = dummy_artifact
    # Instantiate client with non-existent RPC and no deployed contract
    dead_client = BlockchainRegistryClient(provider=None, rpc_url="http://127.0.0.1:9999")
    dead_client.contract = None  # simulate broken contract reference

    res = dead_client.verify_model_against_blockchain(art_path, "test-id", "v1.0.0")
    assert res["verified"] is False
    assert res["status"] == "BLOCKCHAIN_UNAVAILABLE"


def test_12_missing_file_handling(fresh_client, tmp_path):
    """Test 12: Missing file returns FILE_NOT_FOUND."""
    missing = tmp_path / "does_not_exist.joblib"
    res = fresh_client.verify_model_against_blockchain(missing, "test-id", "v1.0.0")
    assert res["verified"] is False
    assert res["status"] == "FILE_NOT_FOUND"
