"""Configuration management for the Backend Integration Layer.

Supports configurable model paths, blockchain endpoints, smart contract addresses,
and local audit storage parameters via environment variables with safe defaults.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional


class Settings:
    """Application configuration with environment-variable fallback."""

    def __init__(self) -> None:
        # File and directory roots
        self.PROJECT_ROOT = Path(__file__).resolve().parent.parent

        # Dataset configuration (Authentic UNSW-NB15 Testing Set)
        self.TESTING_DATASET_PATH = Path(
            os.getenv(
                "TESTING_DATASET_PATH",
                self.PROJECT_ROOT / "data" / "raw" / "UNSW_NB15_testing-set.csv",
            )
        )
        self.EXPECTED_TEST_DATASET_SHA256 = "bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa"

        # Model configuration
        self.MODEL_PATH = Path(
            os.getenv("MODEL_PATH", self.PROJECT_ROOT / "ml" / "artifacts" / "ids_model.joblib")
        )
        self.METADATA_PATH = Path(
            os.getenv("METADATA_PATH", self.PROJECT_ROOT / "ml" / "artifacts" / "model_metadata.json")
        )
        self.PROVENANCE_PATH = Path(
            os.getenv("PROVENANCE_PATH", self.PROJECT_ROOT / "ml" / "artifacts" / "provenance_record.json")
        )
        self.MODEL_ID = os.getenv("MODEL_ID", "iot-ids-rf")
        self.MODEL_VERSION = os.getenv("MODEL_VERSION", "v1.0.0")
        self.ALGORITHM = os.getenv("MODEL_ALGORITHM", "RandomForestClassifier")

        # Stage 2 Model configuration (Attack-Category Multiclass Classifier)
        self.STAGE2_MODEL_PATH = Path(
            os.getenv("STAGE2_MODEL_PATH", self.PROJECT_ROOT / "ml" / "artifacts" / "attack_classifier.joblib")
        )
        self.STAGE2_PROVENANCE_PATH = Path(
            os.getenv("STAGE2_PROVENANCE_PATH", self.PROJECT_ROOT / "ml" / "artifacts" / "attack_classifier_provenance_record.json")
        )
        self.STAGE2_MODEL_ID = os.getenv("STAGE2_MODEL_ID", "iot-ids-attack-classifier")
        self.STAGE2_MODEL_VERSION = os.getenv("STAGE2_MODEL_VERSION", "v1.0.0")
        self.STAGE2_ALGORITHM = os.getenv("STAGE2_ALGORITHM", "RandomForestClassifier")

        # Blockchain configuration
        self.RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
        self.CONTRACT_ARTIFACT_PATH = Path(
            os.getenv(
                "CONTRACT_ARTIFACT_PATH",
                self.PROJECT_ROOT / "blockchain" / "artifacts" / "ModelRegistry.json",
            )
        )
        self.DEPLOYMENT_INFO_PATH = Path(
            os.getenv(
                "DEPLOYMENT_INFO_PATH",
                self.PROJECT_ROOT / "blockchain" / "deployment" / "deployment.json",
            )
        )

        # Resolve contract address: environment variable takes precedence over deployment.json
        env_contract_addr = os.getenv("MODEL_REGISTRY_ADDRESS")
        if env_contract_addr:
            self.CONTRACT_ADDRESS = env_contract_addr
        elif self.DEPLOYMENT_INFO_PATH.exists():
            try:
                with open(self.DEPLOYMENT_INFO_PATH, "r", encoding="utf-8") as f:
                    dep = json.load(f)
                    self.CONTRACT_ADDRESS = dep.get("contract_address")
            except Exception:
                self.CONTRACT_ADDRESS = None
        else:
            self.CONTRACT_ADDRESS = None

        # Audit storage configuration
        self.AUDIT_DB_PATH = Path(
            os.getenv("AUDIT_DB_PATH", self.PROJECT_ROOT / "backend" / "data" / "audit.db")
        )

        # Server network configuration
        self.HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
        self.PORT = int(os.getenv("BACKEND_PORT", "8000"))

        # Model gate lifecycle
        self.AUTO_VERIFY_ON_STARTUP = os.getenv("AUTO_VERIFY_ON_STARTUP", "false").lower() in ("true", "1", "yes")


settings = Settings()
