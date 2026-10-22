"""Model training, artifact serialization, and metadata generation pipeline.

Trains a Random Forest baseline on UNSW-NB15 network intrusion traffic,
evaluates on unseen test traffic, computes dataset and artifact SHA-256 digests,
and saves the full pipeline and structured metadata.
"""

from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from core.hashing import calculate_sha256
from core.provenance import (
    DEFAULT_MODEL_ID,
    DEFAULT_MODEL_VERSION,
    ArtifactMetadata,
    DatasetMetadata,
    EvaluationMetrics,
    ProvenanceRecord,
    TrainingConfig,
    save_provenance_record,
)
from ml.dataset import (
    acquire_unsw_nb15,
    inspect_dataset,
    load_raw_dataset,
)
from ml.evaluate import evaluate_predictions, print_evaluation_summary
from ml.preprocess import build_full_pipeline, extract_features_and_target


def train_intrusion_detector(
    raw_dir: str | Path = "data/raw",
    artifacts_dir: str | Path = "ml/artifacts",
    n_estimators: int = 100,
    max_depth: Optional[int] = 20,
    n_jobs: int = -1,
    random_state: int = 42,
    sample_size: Optional[int] = None,
) -> Dict[str, Any]:
    """Train the Random Forest baseline model and generate reproducible artifacts."""
    raw_path = Path(raw_dir)
    art_path = Path(artifacts_dir)
    art_path.mkdir(parents=True, exist_ok=True)

    # 1. Acquire / verify raw dataset files
    dataset_files = acquire_unsw_nb15(raw_path)
    train_file = dataset_files.get("UNSW_NB15_training-set.csv")
    test_file = dataset_files.get("UNSW_NB15_testing-set.csv")

    if not train_file or not train_file.exists():
        raise FileNotFoundError(f"Training dataset not found in {raw_path}")

    # Calculate SHA-256 of raw training dataset for scientific provenance
    train_sha256 = calculate_sha256(train_file)
    print(f"\n[Provenance] Raw training dataset SHA-256: {train_sha256}")

    # 2. Load dataset(s)
    df_train_raw = load_raw_dataset(train_file, sample_size=sample_size, random_state=random_state)
    
    if test_file and test_file.exists():
        print(f"[Dataset] Loading separate official test partition: {test_file.name}")
        df_test_raw = load_raw_dataset(test_file, sample_size=sample_size, random_state=random_state)
        X_train, y_train, cat_cols, num_cols = extract_features_and_target(df_train_raw)
        X_test, y_test, _, _ = extract_features_and_target(df_test_raw)
    else:
        print("[Dataset] Partitioning single dataset with stratified 80/20 split.")
        X_all, y_all, cat_cols, num_cols = extract_features_and_target(df_train_raw)
        X_train, X_test, y_train, y_test = train_test_split(
            X_all, y_all, test_size=0.2, stratify=y_all, random_state=random_state
        )

    # Inspect training dataset
    inspection_report = inspect_dataset(df_train_raw, dataset_name="UNSW-NB15")
    print(f"[Inspection] Total training instances: {len(X_train):,}, Features: {X_train.shape[1]}")
    print(f"[Inspection] Categorical features ({len(cat_cols)}): {cat_cols}")
    print(f"[Inspection] Numerical features ({len(num_cols)}): {num_cols[:5]} ... (+{len(num_cols)-5} more)")
    print(f"[Inspection] Training class distribution: {dict(y_train.value_counts())}")

    # 3. Construct unified leak-free pipeline
    rf_classifier = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        n_jobs=n_jobs,
        random_state=random_state,
    )
    full_pipeline = build_full_pipeline(
        categorical_cols=cat_cols,
        numerical_cols=num_cols,
        classifier=rf_classifier,
    )

    # 4. Train pipeline (preprocessing strictly fitted on training data only)
    print("\n[Training] Fitting Random Forest baseline pipeline on training data...")
    full_pipeline.fit(X_train, y_train)
    print("[Training] Model training completed successfully.")

    # 5. Evaluate on untouched test data
    print("\n[Evaluation] Evaluating on untouched test set...")
    y_pred = full_pipeline.predict(X_test)
    y_prob = full_pipeline.predict_proba(X_test)[:, 1] if hasattr(full_pipeline, "predict_proba") else None
    metrics = evaluate_predictions(y_true=y_test.values, y_pred=y_pred, y_prob=y_prob)
    print_evaluation_summary(metrics)

    # 6. Save model artifact
    model_artifact_path = art_path / "ids_model.joblib"
    joblib.dump(full_pipeline, model_artifact_path, compress=3)
    model_artifact_sha256 = calculate_sha256(model_artifact_path)
    model_artifact_size = model_artifact_path.stat().st_size
    print(f"\n[Artifact] Model artifact saved to: {model_artifact_path} ({model_artifact_size:,} bytes)")
    print(f"[Artifact] Model artifact SHA-256: {model_artifact_sha256}")

    # 7. Generate structured metadata & canonical provenance record
    model_id = DEFAULT_MODEL_ID
    model_version = DEFAULT_MODEL_VERSION

    provenance = ProvenanceRecord(
        model_id=model_id,
        version=model_version,
        algorithm="RandomForestClassifier",
        artifact=ArtifactMetadata(
            filename=model_artifact_path.name,
            sha256=model_artifact_sha256,
            size_bytes=model_artifact_size,
        ),
        dataset=DatasetMetadata(
            name="UNSW-NB15",
            training_file=train_file.name,
            sha256=train_sha256,
        ),
        training=TrainingConfig(
            random_state=random_state,
            n_estimators=n_estimators,
            max_depth=max_depth,
            n_jobs=n_jobs,
        ),
        metrics=EvaluationMetrics(
            accuracy=metrics["accuracy"],
            precision=metrics["precision"],
            recall=metrics["recall"],
            f1=metrics["f1_score"],
            fpr=metrics["false_positive_rate"],
            specificity=metrics.get("specificity"),
            roc_auc=metrics.get("roc_auc"),
        ),
    )

    provenance_path = art_path / "provenance_record.json"
    save_provenance_record(provenance, provenance_path)
    print(f"[Provenance] Provenance record saved to: {provenance_path}")

    metadata = {
        "model_id": model_id,
        "model_version": model_version,
        "algorithm": "RandomForestClassifier",
        "random_seed": random_state,
        "dataset_name": "UNSW-NB15",
        "dataset_filename": train_file.name,
        "dataset_sha256": train_sha256,
        "model_artifact_filename": model_artifact_path.name,
        "model_artifact_sha256": model_artifact_sha256,
        "model_artifact_size_bytes": model_artifact_size,
        "target_definition": {
            "name": "label",
            "mapping": {"0": "Benign/Normal", "1": "Malicious/Attack"}
        },
        "features": {
            "categorical": cat_cols,
            "numerical": num_cols,
            "total_count": len(cat_cols) + len(num_cols)
        },
        "training_hyperparameters": {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "random_state": random_state,
            "n_jobs": n_jobs
        },
        "evaluation_metrics": metrics,
        "dataset_inspection": {
            "total_training_rows": len(X_train),
            "total_test_rows": len(X_test),
            "training_class_balance": {str(k): int(v) for k, v in y_train.value_counts().items()},
            "test_class_balance": {str(k): int(v) for k, v in y_test.value_counts().items()},
        },
        "created_at": provenance.created_at,
    }

    metadata_path = art_path / "model_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[Metadata] Model metadata saved to: {metadata_path}")

    return metadata

    return metadata


if __name__ == "__main__":
    train_intrusion_detector()
