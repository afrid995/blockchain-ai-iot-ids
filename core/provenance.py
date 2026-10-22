"""Model provenance schema management and cryptographic integrity verification.

Defines structured provenance records and provides the security gatekeeper
that validates model artifacts against authorized cryptographic digests.
"""

from __future__ import annotations

import datetime
import json
from dataclasses import asdict, dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Optional, Union

from core.hashing import calculate_sha256, is_valid_sha256

DEFAULT_MODEL_ID = "iot-ids-rf"
DEFAULT_MODEL_VERSION = "v1.0.0"


class IntegrityStatus(str, Enum):
    """Categorical outcomes of a model integrity verification check."""
    VERIFIED = "VERIFIED"
    HASH_MISMATCH = "HASH_MISMATCH"
    FILE_NOT_FOUND = "FILE_NOT_FOUND"
    INVALID_EXPECTED_HASH = "INVALID_EXPECTED_HASH"


@dataclass
class ArtifactMetadata:
    filename: str
    sha256: str
    size_bytes: int


@dataclass
class DatasetMetadata:
    name: str
    training_file: str
    sha256: str


@dataclass
class TrainingConfig:
    random_state: int
    n_estimators: int
    max_depth: Optional[int]
    n_jobs: int = -1


@dataclass
class EvaluationMetrics:
    accuracy: float
    precision: float
    recall: float
    f1: float
    fpr: float
    roc_auc: Optional[float] = None
    specificity: Optional[float] = None


@dataclass
class ProvenanceRecord:
    """Structured cryptographic provenance record for an authorized ML model."""
    model_id: str
    version: str
    algorithm: str
    artifact: ArtifactMetadata
    dataset: DatasetMetadata
    training: TrainingConfig
    metrics: EvaluationMetrics
    created_at: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    schema_version: str = "1.0.0"

    def to_dict(self) -> Dict[str, Any]:
        """Convert provenance record to serializable dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> ProvenanceRecord:
        """Construct a ProvenanceRecord instance from a dictionary."""
        # Validate critical top-level keys
        for key in ["model_id", "version", "algorithm", "artifact", "dataset", "training", "metrics"]:
            if key not in data:
                raise ValueError(f"Missing required provenance field: '{key}'")

        artifact = ArtifactMetadata(**data["artifact"])
        dataset = DatasetMetadata(**data["dataset"])
        training = TrainingConfig(**data["training"])
        metrics = EvaluationMetrics(**data["metrics"])

        return cls(
            model_id=data["model_id"],
            version=data["version"],
            algorithm=data["algorithm"],
            artifact=artifact,
            dataset=dataset,
            training=training,
            metrics=metrics,
            created_at=data.get("created_at", datetime.datetime.now(datetime.timezone.utc).isoformat()),
            schema_version=data.get("schema_version", "1.0.0"),
        )


def verify_model_integrity(
    model_path: Union[str, Path],
    expected_hash: str,
    model_id: Optional[str] = None,
    version: Optional[str] = None,
) -> Dict[str, Any]:
    """Verify that a local model artifact matches its authorized cryptographic digest.

    This function enforces the zero-trust security gate:
    A model must NEVER be trusted simply due to a matching filename or metadata.
    Verification succeeds strictly when LOCAL_HASH == EXPECTED_HASH.

    Args:
        model_path: Path to the model artifact file.
        expected_hash: The authorized 64-character SHA-256 digest.
        model_id: Optional model identifier for tracking.
        version: Optional model version for tracking.

    Returns:
        Structured verification result dictionary.
    """
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    path = Path(model_path)

    # Validate the expected hash format
    clean_expected = str(expected_hash).strip().lower() if expected_hash else ""
    if not is_valid_sha256(clean_expected):
        return {
            "verified": False,
            "status": IntegrityStatus.INVALID_EXPECTED_HASH.value,
            "model_id": model_id,
            "version": version,
            "model_path": str(path),
            "expected_hash": expected_hash,
            "actual_hash": None,
            "timestamp": timestamp,
            "message": "The provided expected hash is not a valid 64-character hexadecimal SHA-256 string.",
        }

    # Check file existence
    if not path.exists() or path.is_dir():
        return {
            "verified": False,
            "status": IntegrityStatus.FILE_NOT_FOUND.value,
            "model_id": model_id,
            "version": version,
            "model_path": str(path),
            "expected_hash": clean_expected,
            "actual_hash": None,
            "timestamp": timestamp,
            "message": f"Model artifact file not found at: {path.resolve()}",
        }

    # Compute actual cryptographic hash of local file bytes
    actual_hash = calculate_sha256(path)

    # Strict constant-time-equivalent byte comparison
    if actual_hash == clean_expected:
        return {
            "verified": True,
            "status": IntegrityStatus.VERIFIED.value,
            "model_id": model_id,
            "version": version,
            "model_path": str(path),
            "expected_hash": clean_expected,
            "actual_hash": actual_hash,
            "timestamp": timestamp,
            "message": "Model integrity successfully verified against trusted digest.",
        }
    else:
        return {
            "verified": False,
            "status": IntegrityStatus.HASH_MISMATCH.value,
            "model_id": model_id,
            "version": version,
            "model_path": str(path),
            "expected_hash": clean_expected,
            "actual_hash": actual_hash,
            "timestamp": timestamp,
            "message": "CRITICAL: Model hash mismatch detected! Local artifact has been modified or corrupted.",
        }


def save_provenance_record(record: ProvenanceRecord, output_path: Union[str, Path]) -> Path:
    """Save a ProvenanceRecord to a formatted JSON file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(record.to_dict(), f, indent=2)
    return path


def load_provenance_record(input_path: Union[str, Path]) -> ProvenanceRecord:
    """Load and validate a ProvenanceRecord from a JSON file."""
    path = Path(input_path)
    if not path.exists():
        raise FileNotFoundError(f"Provenance record file does not exist: {path.resolve()}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return ProvenanceRecord.from_dict(data)
