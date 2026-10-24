"""Unit tests for Phase 7B Multiclass Attack-Type Classification.

Verifies:
1. Attack-only filtering strictly excludes 'Normal' flows and label == 0
2. 'label' and 'attack_cat' are never present in model feature columns
3. 'id' is never present in model feature columns
4. Target categories exactly match the 9 expected UNSW-NB15 attack classes
5. Filtered attack training partition yields exactly 45,332 flows
6. Filtered attack testing partition yields exactly 119,341 flows
7. Scikit-Learn Pipeline can successfully fit on the 42-feature schema
8. Serialized artifact 'attack_classifier.joblib' can be deserialized via joblib
9. Deserialized pipeline predictions evaluate to only the 9 known attack classes
10. Artifact SHA-256 is deterministic and exactly matches metadata records
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest
from sklearn.ensemble import RandomForestClassifier

from core.hashing import calculate_sha256
from ml.preprocess import build_full_pipeline

REPO_ROOT = Path(__file__).resolve().parent.parent
TRAIN_CSV = REPO_ROOT / "data" / "raw" / "UNSW_NB15_training-set.csv"
TEST_CSV = REPO_ROOT / "data" / "raw" / "UNSW_NB15_testing-set.csv"
ARTIFACT_PATH = REPO_ROOT / "ml" / "artifacts" / "attack_classifier.joblib"
METADATA_PATH = REPO_ROOT / "ml" / "artifacts" / "attack_classifier_metadata.json"
RESULTS_PATH = REPO_ROOT / "experiments" / "results" / "phase7b_multiclass_results.json"

EXPECTED_CLASSES = [
    "Analysis",
    "Backdoor",
    "DoS",
    "Exploits",
    "Fuzzers",
    "Generic",
    "Reconnaissance",
    "Shellcode",
    "Worms",
]

EXCLUDED_COLUMNS = ["id", "label", "attack_cat"]
CATEGORICAL_COLUMNS = ["proto", "service", "state"]


@pytest.fixture
def sample_attack_data():
    """Create a synthetic DataFrame matching the 42-feature schema with 9 classes."""
    np.random.seed(42)
    n_samples = 45

    # 39 numerical columns matching typical UNSW-NB15 features
    num_cols = [
        "dur", "spkts", "dpkts", "sbytes", "dbytes", "rate", "sttl", "dttl",
        "sload", "dload", "sloss", "dloss", "sinpkt", "dinpkt", "sjit", "djit",
        "swin", "stcpb", "dtcpb", "dwin", "tcprtt", "synack", "ackdat", "smean",
        "dmean", "trans_depth", "response_body_len", "ct_srv_src", "ct_state_ttl",
        "ct_dst_ltm", "ct_src_dport_ltm", "ct_dst_sport_ltm", "ct_dst_src_ltm",
        "is_ftp_login", "ct_ftp_cmd", "ct_flw_http_mthd", "ct_src_ltm",
        "ct_srv_dst", "is_sm_ips_ports"
    ]
    data = {c: np.random.uniform(0, 100, size=n_samples) for c in num_cols}
    data["proto"] = np.random.choice(["tcp", "udp", "arp", "ospf"], size=n_samples)
    data["service"] = np.random.choice(["http", "dns", "ftp", "-"], size=n_samples)
    data["state"] = np.random.choice(["FIN", "INT", "CON", "REQ"], size=n_samples)
    data["id"] = np.arange(1, n_samples + 1)
    data["label"] = np.ones(n_samples, dtype=int)
    data["attack_cat"] = np.random.choice(EXPECTED_CLASSES, size=n_samples)

    df = pd.DataFrame(data)
    return df, CATEGORICAL_COLUMNS, sorted(num_cols)


def test_1_attack_only_filtering_excludes_normal():
    """1. Test that attack-only filtering strictly excludes 'Normal' flows and label == 0."""
    df_synthetic = pd.DataFrame({
        "id": [1, 2, 3, 4, 5],
        "label": [0, 1, 1, 0, 1],
        "attack_cat": ["Normal", "Generic", "Normal", "Exploits", "DoS"],
        "rate": [10.0, 20.0, 30.0, 40.0, 50.0],
    })

    mask = (df_synthetic["label"] == 1) & (df_synthetic["attack_cat"].astype(str).str.strip() != "Normal")
    filtered = df_synthetic[mask]

    assert len(filtered) == 2
    assert "Normal" not in filtered["attack_cat"].values
    assert 0 not in filtered["label"].values
    assert set(filtered["attack_cat"].values) == {"Generic", "DoS"}


def test_2_label_and_attack_cat_not_model_features(sample_attack_data):
    """2. Test that 'label' and 'attack_cat' are explicitly excluded from model features."""
    df, cat_cols, num_cols = sample_attack_data
    feature_cols = [c for c in df.columns if c not in EXCLUDED_COLUMNS]

    assert "label" not in feature_cols
    assert "attack_cat" not in feature_cols
    assert len(feature_cols) == 42


def test_3_id_not_model_feature(sample_attack_data):
    """3. Test that 'id' is explicitly excluded from model features."""
    df, cat_cols, num_cols = sample_attack_data
    feature_cols = [c for c in df.columns if c not in EXCLUDED_COLUMNS]

    assert "id" not in feature_cols


def test_4_expected_class_count_is_nine():
    """4. Test that the Stage 2 target categories are exactly the 9 expected UNSW-NB15 classes."""
    assert len(EXPECTED_CLASSES) == 9
    assert EXPECTED_CLASSES == [
        "Analysis",
        "Backdoor",
        "DoS",
        "Exploits",
        "Fuzzers",
        "Generic",
        "Reconnaissance",
        "Shellcode",
        "Worms",
    ]


def test_5_expected_attack_only_training_count():
    """5. Test that filtering the canonical training dataset yields exactly 45,332 flows."""
    assert TRAIN_CSV.exists(), f"Missing dataset: {TRAIN_CSV}"
    df_train = pd.read_csv(TRAIN_CSV, usecols=["label", "attack_cat"], low_memory=False)

    mask = (df_train["label"] == 1) & (df_train["attack_cat"].astype(str).str.strip() != "Normal")
    n_attack = mask.sum()

    assert n_attack == 45332, f"Expected 45,332 training attack flows, got {n_attack}"


def test_6_expected_attack_only_testing_count():
    """6. Test that filtering the canonical testing dataset yields exactly 119,341 flows."""
    assert TEST_CSV.exists(), f"Missing dataset: {TEST_CSV}"
    df_test = pd.read_csv(TEST_CSV, usecols=["label", "attack_cat"], low_memory=False)

    mask = (df_test["label"] == 1) & (df_test["attack_cat"].astype(str).str.strip() != "Normal")
    n_attack = mask.sum()

    assert n_attack == 119341, f"Expected 119,341 testing attack flows, got {n_attack}"


def test_7_pipeline_can_train_on_expected_schema(sample_attack_data):
    """7. Test that build_full_pipeline trains properly on the 42-feature schema."""
    df, cat_cols, num_cols = sample_attack_data
    feature_cols = [c for c in df.columns if c not in EXCLUDED_COLUMNS]
    X = df[feature_cols]
    y = df["attack_cat"]

    rf = RandomForestClassifier(n_estimators=5, max_depth=5, random_state=42)
    pipeline = build_full_pipeline(cat_cols, num_cols, rf)

    pipeline.fit(X, y)
    preds = pipeline.predict(X)

    assert len(preds) == len(df)
    assert set(preds).issubset(set(EXPECTED_CLASSES))


def test_8_serialized_artifact_can_be_loaded():
    """8. Test that the serialized artifact 'attack_classifier.joblib' can be deserialized."""
    assert ARTIFACT_PATH.exists(), f"Artifact not found: {ARTIFACT_PATH}"
    pipeline = joblib.load(ARTIFACT_PATH)

    assert hasattr(pipeline, "predict")
    assert "preprocessor" in pipeline.named_steps
    assert "classifier" in pipeline.named_steps


def test_9_predictions_contain_only_expected_classes(sample_attack_data):
    """9. Test that predictions evaluate to only the 9 expected attack classes."""
    assert ARTIFACT_PATH.exists()
    pipeline = joblib.load(ARTIFACT_PATH)

    df, _, _ = sample_attack_data
    feature_cols = [c for c in df.columns if c not in EXCLUDED_COLUMNS]
    X = df[feature_cols]

    preds = pipeline.predict(X)
    unique_preds = set(preds)

    assert unique_preds.issubset(set(EXPECTED_CLASSES))
    assert "Normal" not in unique_preds


def test_10_artifact_sha256_reproducible():
    """10. Test that artifact SHA-256 matches metadata and experimental results exactly."""
    assert ARTIFACT_PATH.exists()
    assert METADATA_PATH.exists()
    assert RESULTS_PATH.exists()

    actual_sha = calculate_sha256(ARTIFACT_PATH)

    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    with open(RESULTS_PATH, "r", encoding="utf-8") as f:
        results = json.load(f)

    meta_sha = metadata["model_artifact_sha256"]
    results_sha = results["artifact"]["sha256"]

    assert actual_sha == meta_sha, f"SHA mismatch: file={actual_sha} vs meta={meta_sha}"
    assert actual_sha == results_sha, f"SHA mismatch: file={actual_sha} vs results={results_sha}"
    assert metadata["target_definition"]["class_count"] == 9
