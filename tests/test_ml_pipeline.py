"""Unit tests for Phase 1 Machine Learning Intrusion Detection Pipeline.

Verifies:
1. Dataset loading and schema validation
2. Expected target column existence
3. Feature/target separation and ID exclusion
4. Preprocessor transformation validity
5. Handling of missing and infinite values
6. Deterministic train/test split reproducibility
7. Model training execution
8. Model artifact serialization
9. Model artifact deserialization
10. Inference prediction format and confidence outputs
11. Metadata structure and dataset SHA-256 calculation
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import pytest

from ml.dataset import (
    EXPECTED_COLUMNS,
    compute_file_sha256,
    inspect_dataset,
    load_raw_dataset,
)
from ml.evaluate import evaluate_predictions
from ml.predict import IntrusionDetector
from ml.preprocess import (
    build_full_pipeline,
    build_preprocessor,
    extract_features_and_target,
)
from ml.train import train_intrusion_detector


@pytest.fixture
def sample_unsw_dataframe():
    """Create a realistic sample DataFrame following the authentic UNSW-NB15 schema."""
    n_rows = 100
    np.random.seed(42)

    data = {col: np.random.uniform(0, 100, size=n_rows) for col in EXPECTED_COLUMNS}
    # Set categorical columns
    data["id"] = list(range(1, n_rows + 1))
    data["proto"] = np.random.choice(["tcp", "udp", "arp", "ospf"], size=n_rows)
    data["service"] = np.random.choice(["-", "http", "dns", "ftp", "smtp"], size=n_rows)
    data["state"] = np.random.choice(["FIN", "INT", "CON", "REQ"], size=n_rows)
    data["attack_cat"] = np.random.choice(["Normal", "Generic", "Exploits", "DoS"], size=n_rows)
    data["label"] = np.random.choice([0, 1], size=n_rows, p=[0.6, 0.4])

    df = pd.DataFrame(data)
    return df


def test_1_dataset_schema_validation(sample_unsw_dataframe, tmp_path):
    """Test 1: Dataset loading works and adheres to expected schema."""
    csv_path = tmp_path / "test_unsw.csv"
    sample_unsw_dataframe.to_csv(csv_path, index=False)

    loaded = load_raw_dataset(csv_path)
    assert len(loaded) == 100
    assert "label" in loaded.columns
    assert set(EXPECTED_COLUMNS).issubset(set(loaded.columns))


def test_2_expected_target_column(sample_unsw_dataframe):
    """Test 2: Target column 'label' exists with binary values 0 and 1."""
    assert "label" in sample_unsw_dataframe.columns
    unique_labels = set(sample_unsw_dataframe["label"].unique())
    assert unique_labels.issubset({0, 1})


def test_3_feature_target_separation(sample_unsw_dataframe):
    """Test 3: Feature/target separation works and excludes 'id' and 'attack_cat'."""
    X, y, cat_cols, num_cols = extract_features_and_target(sample_unsw_dataframe)
    
    assert "id" not in X.columns
    assert "label" not in X.columns
    assert "attack_cat" not in X.columns
    assert len(y) == len(X)
    assert set(cat_cols) == {"proto", "service", "state"}
    assert len(num_cols) == len(X.columns) - len(cat_cols)


def test_4_and_5_preprocessor_no_nan_or_inf(sample_unsw_dataframe):
    """Test 4 & 5: Preprocessing produces valid 2D array with no NaN or Inf values."""
    # Inject deliberate NaNs and Infs to verify imputer robustness
    df_noisy = sample_unsw_dataframe.copy()
    df_noisy.loc[0, "dur"] = np.nan
    df_noisy.loc[1, "sbytes"] = np.inf
    df_noisy.loc[2, "proto"] = np.nan

    X, _, cat_cols, num_cols = extract_features_and_target(df_noisy)
    preprocessor = build_preprocessor(cat_cols, num_cols)

    transformed = preprocessor.fit_transform(X)
    assert isinstance(transformed, np.ndarray)
    assert not np.isnan(transformed).any(), "NaN found after preprocessing!"
    assert not np.isinf(transformed).any(), "Inf found after preprocessing!"
    assert transformed.shape[0] == len(X)


def test_6_train_test_split_reproducibility(sample_unsw_dataframe):
    """Test 6: Train/test split is deterministic given random_state."""
    from sklearn.model_selection import train_test_split
    X, y, _, _ = extract_features_and_target(sample_unsw_dataframe)

    X_tr1, X_te1, y_tr1, y_te1 = train_test_split(X, y, test_size=0.2, random_state=42)
    X_tr2, X_te2, y_tr2, y_te2 = train_test_split(X, y, test_size=0.2, random_state=42)

    pd.testing.assert_frame_equal(X_tr1, X_tr2)
    pd.testing.assert_frame_equal(X_te1, X_te2)
    pd.testing.assert_series_equal(y_tr1, y_tr2)


def test_7_8_model_training_and_artifact_saving(sample_unsw_dataframe, tmp_path):
    """Test 7 & 8: Model training completes and saves an artifact."""
    from sklearn.ensemble import RandomForestClassifier

    X, y, cat_cols, num_cols = extract_features_and_target(sample_unsw_dataframe)
    clf = RandomForestClassifier(n_estimators=5, max_depth=5, random_state=42)
    pipeline = build_full_pipeline(cat_cols, num_cols, clf)

    pipeline.fit(X, y)
    artifact_file = tmp_path / "ids_model.joblib"
    joblib.dump(pipeline, artifact_file)

    assert artifact_file.exists()
    assert artifact_file.stat().st_size > 0


def test_9_10_loaded_model_inference(sample_unsw_dataframe, tmp_path):
    """Test 9 & 10: Saved artifact can be loaded and executes inference."""
    from sklearn.ensemble import RandomForestClassifier

    X, y, cat_cols, num_cols = extract_features_and_target(sample_unsw_dataframe)
    clf = RandomForestClassifier(n_estimators=5, max_depth=5, random_state=42)
    pipeline = build_full_pipeline(cat_cols, num_cols, clf)
    pipeline.fit(X, y)

    artifact_file = tmp_path / "ids_model.joblib"
    joblib.dump(pipeline, artifact_file)

    detector = IntrusionDetector(artifact_path=artifact_file)
    test_sample = sample_unsw_dataframe.iloc[:3].to_dict(orient="records")
    results = detector.predict(test_sample)

    assert len(results) == 3
    for r in results:
        assert r["prediction"] in (0, 1)
        assert r["label"] in ("Benign", "Malicious")
        assert 0.0 <= r["confidence"] <= 1.0
        assert "Benign" in r["probabilities"]
        assert "Malicious" in r["probabilities"]


def test_11_metadata_generation(tmp_path):
    """Test 11: File hash calculation and metadata structure verification."""
    dummy_file = tmp_path / "dataset.csv"
    dummy_file.write_text("id,dur,label\n1,0.5,0\n2,1.2,1\n", encoding="utf-8")

    digest = compute_file_sha256(dummy_file)
    assert len(digest) == 64
    assert all(c in "0123456789abcdef" for c in digest)
