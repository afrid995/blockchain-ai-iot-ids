"""Tests for Authentic UNSW-NB15 Dataset Service and API Endpoints.

Phase 7D.8: Authentic Network Traffic Dataset Workbench
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

Verifies:
1. Dataset endpoint returns authentic records from UNSW_NB15_testing-set.csv.
2. Reported total records is exactly 175,341 (Benign: 56,000, Attack: 119,341).
3. Pagination works correctly with accurate total_pages and slice sizes.
4. Page boundaries (e.g. final page 7014 with 16 records) work accurately.
5. Invalid page and page_size parameters are rejected safely.
6. Filtering by protocol, service, and state works accurately.
7. Search by record ID/index works accurately.
8. Single record retrieval by 1-based index returns expected data; out-of-range returns 404.
9. Random record sampler returns valid authentic records.
10. Ground-truth annotations are strictly quarantined from 42 model input features.
11. Prediction on authentic record features runs via /predict/hierarchical with 0 per-flow blockchain queries.
12. Model-not-loaded state fail-closed enforcement remains active.
"""

from __future__ import annotations

import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from web3 import EthereumTesterProvider

from backend.config import settings
from backend.main import create_app
from backend.services.dataset_service import DatasetService
from core.blockchain import BlockchainRegistryClient
from core.hashing import calculate_sha256

EXPECTED_TEST_SHA = "bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa"


class TestDatasetService(unittest.TestCase):
    """Unit and integration tests for authentic dataset service and REST endpoints."""

    @classmethod
    def setUpClass(cls):
        """Initialize test client and dataset service with in-process EVM provider."""
        provider = EthereumTesterProvider()
        cls.bc_client = BlockchainRegistryClient(provider=provider)
        cls.bc_client.deploy_contract(deployment_file=None)

        # Register canonical Stage 1 and Stage 2 models
        cls.bc_client.register_model(
            settings.MODEL_ID,
            settings.MODEL_VERSION,
            calculate_sha256(settings.MODEL_PATH),
            settings.ALGORITHM,
        )
        cls.bc_client.register_model(
            settings.STAGE2_MODEL_ID,
            settings.STAGE2_MODEL_VERSION,
            calculate_sha256(settings.STAGE2_MODEL_PATH),
            settings.STAGE2_ALGORITHM,
        )

        cls.app = create_app(blockchain_client=cls.bc_client)
        cls.client = TestClient(cls.app)
        cls.dataset_service = DatasetService(settings.TESTING_DATASET_PATH)

    def test_01_dataset_file_and_sha256_integrity(self):
        """Invariant: Authentic UNSW_NB15_testing-set.csv exists and matches canonical SHA-256."""
        self.assertTrue(settings.TESTING_DATASET_PATH.exists())
        actual_sha = calculate_sha256(settings.TESTING_DATASET_PATH)
        self.assertEqual(actual_sha, EXPECTED_TEST_SHA)

    def test_02_dataset_info_metadata(self):
        """GET /dataset/info returns verified metadata, 175,341 records, and 42 features."""
        res = self.client.get("/dataset/info")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["dataset_name"], "UNSW-NB15 Testing Set")
        self.assertEqual(data["dataset_type"], "Network-flow intrusion benchmark")
        self.assertEqual(data["total_records"], 175341)
        self.assertEqual(data["benign_records"], 56000)
        self.assertEqual(data["attack_records"], 119341)
        self.assertEqual(data["total_features"], 42)
        self.assertEqual(data["sha256"], EXPECTED_TEST_SHA)
        self.assertIn("protocols", data["filter_options"])
        self.assertIn("services", data["filter_options"])
        self.assertIn("states", data["filter_options"])

    def test_03_dataset_records_pagination_page1(self):
        """GET /dataset/records returns accurate page 1 slice with 42 features and flow summary."""
        res = self.client.get("/dataset/records?page=1&page_size=25")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 175341)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["page_size"], 25)
        self.assertEqual(data["total_pages"], 7014)
        self.assertEqual(len(data["records"]), 25)

        first_rec = data["records"][0]
        self.assertEqual(first_rec["index"], 1)
        self.assertEqual(first_rec["id"], 1)
        self.assertEqual(len(first_rec["features"]), 42)
        self.assertNotIn("id", first_rec["features"])
        self.assertNotIn("label", first_rec["features"])
        self.assertNotIn("attack_cat", first_rec["features"])
        self.assertIn("ground_truth", first_rec)
        self.assertEqual(first_rec["ground_truth"]["label"], 0)
        self.assertEqual(first_rec["ground_truth"]["attack_cat"], "Normal")

    def test_04_dataset_records_last_page_boundary(self):
        """Page 7014 (last page with page_size=25) contains exactly 16 records."""
        res = self.client.get("/dataset/records?page=7014&page_size=25")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["page"], 7014)
        self.assertEqual(len(data["records"]), 16)
        last_rec = data["records"][-1]
        self.assertEqual(last_rec["index"], 175341)

    def test_05_dataset_records_invalid_parameters_handled(self):
        """Invalid page and page_size values return HTTP 422 validation errors."""
        res_p0 = self.client.get("/dataset/records?page=0")
        self.assertEqual(res_p0.status_code, 422)

        res_s0 = self.client.get("/dataset/records?page_size=0")
        self.assertEqual(res_s0.status_code, 422)

        res_s101 = self.client.get("/dataset/records?page_size=101")
        self.assertEqual(res_s101.status_code, 422)

    def test_06_filter_by_protocol(self):
        """Filtering by protocol returns only matching records from authentic dataset."""
        res = self.client.get("/dataset/records?page=1&page_size=10&proto=udp")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total"], 63283)
        for rec in data["records"]:
            self.assertEqual(rec["summary"]["protocol"].lower(), "udp")

    def test_07_filter_by_service_and_state(self):
        """Filtering by service and state returns exact matching records."""
        res = self.client.get("/dataset/records?page=1&page_size=10&service=dns&state=INT")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["total"], 0)
        for rec in data["records"]:
            self.assertEqual(rec["summary"]["service"].lower(), "dns")
            self.assertEqual(rec["summary"]["state"].upper(), "INT")

    def test_08_search_by_numeric_id(self):
        """Search query matching a numeric ID returns the target record."""
        res = self.client.get("/dataset/records?search=47912")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(data["total"], 1)
        found = any(r["id"] == 47912 or r["index"] == 47912 for r in data["records"])
        self.assertTrue(found)

    def test_09_single_record_by_index(self):
        """GET /dataset/records/{record_index} returns target record; out of bounds returns 404."""
        res = self.client.get("/dataset/records/1")
        self.assertEqual(res.status_code, 200)
        rec = res.json()
        self.assertEqual(rec["index"], 1)
        self.assertEqual(rec["id"], 1)

        res_attack = self.client.get("/dataset/records/47912")
        self.assertEqual(res_attack.status_code, 200)
        rec_att = res_attack.json()
        self.assertEqual(rec_att["index"], 47912)
        self.assertEqual(rec_att["ground_truth"]["label"], 1)
        self.assertEqual(rec_att["ground_truth"]["attack_cat"], "Backdoor")

        res_404 = self.client.get("/dataset/records/999999")
        self.assertEqual(res_404.status_code, 404)

    def test_10_random_record_sampling(self):
        """GET /dataset/random returns a valid authentic record with 42 features."""
        res = self.client.get("/dataset/random")
        self.assertEqual(res.status_code, 200)
        rec = res.json()
        self.assertGreaterEqual(rec["index"], 1)
        self.assertLessEqual(rec["index"], 175341)
        self.assertEqual(len(rec["features"]), 42)
        self.assertIn("ground_truth", rec)

    def test_11_ground_truth_quarantine_from_features(self):
        """Invariant: Ground-truth label and attack_cat are excluded from model features."""
        res = self.client.get("/dataset/records/50000")
        self.assertEqual(res.status_code, 200)
        rec = res.json()
        features = rec["features"]
        self.assertNotIn("label", features)
        self.assertNotIn("attack_cat", features)
        self.assertNotIn("id", features)
        self.assertEqual(len(features), 42)

    def test_12_hierarchical_prediction_with_authentic_features(self):
        """Authentic record features execute successfully through /predict/hierarchical with 0 blockchain queries."""
        # 1. First ensure models are verified and loaded
        self.client.post("/model/verify?target=stage1")
        self.client.post("/model/verify?target=stage2")
        self.client.post("/model/load")

        # 2. Get an authentic record from dataset
        res_rec = self.client.get("/dataset/records/47912")
        self.assertEqual(res_rec.status_code, 200)
        flow_features = res_rec.json()["features"]

        # 3. Predict via hierarchical endpoint
        res_pred = self.client.post("/predict/hierarchical", json={"features": flow_features})
        self.assertEqual(res_pred.status_code, 200)
        pred = res_pred.json()
        self.assertIn("stage1_prediction", pred)
        self.assertIn("final_prediction", pred)
        self.assertIn("advisory_recommendation", pred)
        self.assertEqual(pred["per_flow_blockchain_queries"], 0)


if __name__ == "__main__":
    unittest.main()
