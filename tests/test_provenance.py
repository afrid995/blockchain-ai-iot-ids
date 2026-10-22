"""Unit and security tests for Model Provenance and Cryptographic Integrity (Phase 2).

Verifies:
1. Hash calculation accuracy
2. Hash determinism across multiple invocations
3. Known test-vector hash verification
4. Missing file error handling
5. Correct hash verification (VERIFIED)
6. Incorrect hash verification (HASH_MISMATCH)
7. Byte-level modified model artifact detection
8. Provenance metadata schema validation, serialization, and deserialization
9. Model version handling (decoupling logical version from hash)
10. Model ID stability handling
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from core.hashing import calculate_bytes_sha256, calculate_sha256, is_valid_sha256
from core.provenance import (
    DEFAULT_MODEL_ID,
    DEFAULT_MODEL_VERSION,
    ArtifactMetadata,
    DatasetMetadata,
    EvaluationMetrics,
    IntegrityStatus,
    ProvenanceRecord,
    TrainingConfig,
    load_provenance_record,
    save_provenance_record,
    verify_model_integrity,
)


@pytest.fixture
def temp_sample_file(tmp_path):
    """Create a temporary text file with deterministic content."""
    fpath = tmp_path / "sample_test_artifact.bin"
    content = b"TEST_ARTIFACT_CONTENT_DATA_FOR_PROVENANCE_TESTING_12345"
    fpath.write_bytes(content)
    expected_sha = hashlib.sha256(content).hexdigest()
    return fpath, expected_sha


def test_1_hash_calculation(temp_sample_file):
    """Test 1: calculate_sha256 computes correct 64-char lowercase hex digest."""
    fpath, expected_sha = temp_sample_file
    computed = calculate_sha256(fpath)
    assert isinstance(computed, str)
    assert len(computed) == 64
    assert computed == expected_sha
    assert computed == computed.lower()


def test_2_hash_determinism(temp_sample_file):
    """Test 2: Hash calculation produces identical output across multiple runs and chunk sizes."""
    fpath, _ = temp_sample_file
    hash_run_1 = calculate_sha256(fpath, chunk_size=16)
    hash_run_2 = calculate_sha256(fpath, chunk_size=65536)
    hash_run_3 = calculate_sha256(fpath, chunk_size=1024)
    assert hash_run_1 == hash_run_2 == hash_run_3


def test_3_known_file_hash(tmp_path):
    """Test 3: Verification against NIST / RFC standard known SHA-256 test vectors."""
    # SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    empty_file = tmp_path / "empty.bin"
    empty_file.write_bytes(b"")
    assert calculate_sha256(empty_file) == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

    # SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    abc_file = tmp_path / "abc.bin"
    abc_file.write_bytes(b"abc")
    assert calculate_sha256(abc_file) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"


def test_4_missing_file_handling(tmp_path):
    """Test 4: Appropriate exceptions and FILE_NOT_FOUND status for non-existent files."""
    missing_path = tmp_path / "non_existent_model.joblib"

    with pytest.raises(FileNotFoundError):
        calculate_sha256(missing_path)

    dummy_hash = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    result = verify_model_integrity(missing_path, expected_hash=dummy_hash)
    assert result["verified"] is False
    assert result["status"] == IntegrityStatus.FILE_NOT_FOUND.value


def test_5_correct_hash_verification(temp_sample_file):
    """Test 5: Matching expected hash yields verified=True and status=VERIFIED."""
    fpath, expected_sha = temp_sample_file
    result = verify_model_integrity(fpath, expected_hash=expected_sha, model_id="iot-ids-rf", version="v1.0.0")

    assert result["verified"] is True
    assert result["status"] == IntegrityStatus.VERIFIED.value
    assert result["expected_hash"] == expected_sha
    assert result["actual_hash"] == expected_sha
    assert result["model_id"] == "iot-ids-rf"
    assert result["version"] == "v1.0.0"


def test_6_incorrect_hash_verification(temp_sample_file):
    """Test 6: Mismatched hash yields verified=False and status=HASH_MISMATCH."""
    fpath, actual_sha = temp_sample_file
    wrong_hash = "0000000000000000000000000000000000000000000000000000000000000000"

    result = verify_model_integrity(fpath, expected_hash=wrong_hash)
    assert result["verified"] is False
    assert result["status"] == IntegrityStatus.HASH_MISMATCH.value
    assert result["expected_hash"] == wrong_hash
    assert result["actual_hash"] == actual_sha


def test_7_modified_model_artifact_detection(tmp_path):
    """Test 7: Any byte alteration in a model artifact is strictly caught as HASH_MISMATCH."""
    artifact = tmp_path / "simulated_model.joblib"
    initial_bytes = b"BINARY_SERIALIZED_MODEL_BYTES_WEIGHTS_42"
    artifact.write_bytes(initial_bytes)
    trusted_hash = calculate_sha256(artifact)

    # 1. Verification of pristine artifact
    ver_clean = verify_model_integrity(artifact, expected_hash=trusted_hash)
    assert ver_clean["verified"] is True
    assert ver_clean["status"] == IntegrityStatus.VERIFIED.value

    # 2. Mutate a single byte in the artifact
    mutated_bytes = b"BINARY_SERIALIZED_MODEL_BYTES_WEIGHTS_43"  # 42 -> 43
    artifact.write_bytes(mutated_bytes)
    mutated_hash = calculate_sha256(artifact)
    assert mutated_hash != trusted_hash

    # 3. Verification of tampered artifact
    ver_tampered = verify_model_integrity(artifact, expected_hash=trusted_hash)
    assert ver_tampered["verified"] is False
    assert ver_tampered["status"] == IntegrityStatus.HASH_MISMATCH.value
    assert ver_tampered["actual_hash"] == mutated_hash


def test_8_provenance_metadata_validation(tmp_path):
    """Test 8: ProvenanceRecord correctly validates schemas, serializes, and deserializes."""
    record = ProvenanceRecord(
        model_id="iot-ids-rf",
        version="v1.0.0",
        algorithm="RandomForestClassifier",
        artifact=ArtifactMetadata(
            filename="ids_model.joblib",
            sha256="dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5",
            size_bytes=6319677,
        ),
        dataset=DatasetMetadata(
            name="UNSW-NB15",
            training_file="UNSW_NB15_training-set.csv",
            sha256="734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559",
        ),
        training=TrainingConfig(
            random_state=42,
            n_estimators=100,
            max_depth=20,
        ),
        metrics=EvaluationMetrics(
            accuracy=0.902978,
            precision=0.987778,
            recall=0.868193,
            f1=0.924133,
            fpr=0.022893,
            roc_auc=0.985992,
        ),
    )

    json_path = tmp_path / "provenance.json"
    save_provenance_record(record, json_path)
    assert json_path.exists()

    loaded = load_provenance_record(json_path)
    assert loaded.model_id == "iot-ids-rf"
    assert loaded.version == "v1.0.0"
    assert loaded.artifact.sha256 == "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"
    assert loaded.metrics.accuracy == 0.902978


def test_9_model_version_handling():
    """Test 9: Logical model version is independent from artifact SHA-256."""
    record_v1 = ProvenanceRecord(
        model_id="iot-ids-rf",
        version="v1.0.0",
        algorithm="RandomForestClassifier",
        artifact=ArtifactMetadata(filename="ids_model.joblib", sha256="a" * 64, size_bytes=100),
        dataset=DatasetMetadata(name="UNSW-NB15", training_file="train.csv", sha256="b" * 64),
        training=TrainingConfig(random_state=42, n_estimators=100, max_depth=20),
        metrics=EvaluationMetrics(accuracy=0.90, precision=0.98, recall=0.86, f1=0.92, fpr=0.02),
    )

    record_v2 = ProvenanceRecord(
        model_id="iot-ids-rf",
        version="v1.1.0",
        algorithm="RandomForestClassifier",
        artifact=ArtifactMetadata(filename="ids_model.joblib", sha256="c" * 64, size_bytes=105),
        dataset=DatasetMetadata(name="UNSW-NB15", training_file="train.csv", sha256="b" * 64),
        training=TrainingConfig(random_state=42, n_estimators=150, max_depth=25),
        metrics=EvaluationMetrics(accuracy=0.92, precision=0.99, recall=0.88, f1=0.93, fpr=0.015),
    )

    assert record_v1.model_id == record_v2.model_id == "iot-ids-rf"
    assert record_v1.version != record_v2.version
    assert record_v1.artifact.sha256 != record_v2.artifact.sha256


def test_10_model_id_handling():
    """Test 10: Model ID stability across deployment configurations."""
    assert DEFAULT_MODEL_ID == "iot-ids-rf"
    assert is_valid_sha256("0" * 64) is True
    assert is_valid_sha256("invalid_hash") is False
    assert is_valid_sha256("0" * 63) is False
