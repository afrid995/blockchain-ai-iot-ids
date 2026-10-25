"""Unit and validation tests for the advisory response recommendation layer.

Phase 7B.4: Implement and Evaluate an Advisory Attack Response Recommendation Layer
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

Verifies all 12 required test conditions:
1. Normal returns a valid benign recommendation.
2. All 9 attack categories return recommendations.
3. Exactly 10 supported output categories exist including Normal.
4. Every recommendation contains required fields.
5. All recommendations are deterministic.
6. Unknown category raises a controlled error.
7. Recommendations contain no executable defensive commands.
8. Recommendations explicitly remain advisory.
9. Mapping does not invoke blockchain.
10. Mapping does not invoke model inference.
11. Stage 1 artifact SHA remains unchanged.
12. Stage 2 artifact SHA remains unchanged.
"""

from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import patch

from core.hashing import calculate_sha256
from core.response_recommendations import (
    ATTACK_CATEGORIES,
    SUPPORTED_CATEGORIES,
    get_all_response_recommendations,
    get_response_recommendation,
)

STAGE1_ARTIFACT = Path("ml/artifacts/ids_model.joblib")
STAGE2_ARTIFACT = Path("ml/artifacts/attack_classifier.joblib")

EXPECTED_STAGE1_SHA = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"
EXPECTED_STAGE2_SHA = "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"

REQUIRED_FIELDS = (
    "category",
    "severity",
    "recommended_action",
    "investigation_priority",
    "operator_guidance",
    "rationale",
    "limitations",
    "is_advisory",
    "requires_human_approval",
    "automated_remediation_enabled",
)


class TestResponseRecommendations(unittest.TestCase):
    """Test suite verifying coverage, determinism, schema completeness, and safety boundaries."""

    def test_1_normal_returns_valid_benign_recommendation(self):
        """Test 1: Normal returns a valid benign recommendation with informational severity."""
        rec = get_response_recommendation("Normal")
        self.assertEqual(rec["category"], "Normal")
        self.assertEqual(rec["severity"], "Informational")
        self.assertEqual(rec["investigation_priority"], "Low")
        self.assertTrue(rec["is_advisory"])
        self.assertFalse(rec["automated_remediation_enabled"])
        self.assertIn("baseline", rec["recommended_action"].lower())

    def test_2_all_nine_attack_categories_return_recommendations(self):
        """Test 2: All 9 attack categories return structured recommendations."""
        for cat in ATTACK_CATEGORIES:
            rec = get_response_recommendation(cat)
            self.assertEqual(rec["category"], cat)
            self.assertIn(rec["severity"], ("Low", "Medium", "High", "Critical"))
            self.assertIn(rec["investigation_priority"], ("Low", "Medium", "High", "Critical"))
            self.assertTrue(rec["is_advisory"])

    def test_3_exactly_ten_supported_categories(self):
        """Test 3: Exactly 10 supported output categories exist including Normal."""
        all_recs = get_all_response_recommendations()
        self.assertEqual(len(all_recs), 10)
        self.assertEqual(len(SUPPORTED_CATEGORIES), 10)
        self.assertEqual(len(ATTACK_CATEGORIES), 9)
        self.assertIn("Normal", all_recs)
        for cat in ATTACK_CATEGORIES:
            self.assertIn(cat, all_recs)

    def test_4_every_recommendation_contains_required_fields(self):
        """Test 4: Every recommendation contains all required schema fields."""
        for cat in SUPPORTED_CATEGORIES:
            rec = get_response_recommendation(cat)
            for field in REQUIRED_FIELDS:
                self.assertIn(field, rec, f"Missing field '{field}' in recommendation for '{cat}'")
                if isinstance(rec[field], str):
                    self.assertTrue(len(rec[field].strip()) > 0, f"Field '{field}' empty for '{cat}'")

    def test_5_recommendations_are_deterministic(self):
        """Test 5: Repeated calls return identical recommendation contents."""
        for cat in SUPPORTED_CATEGORIES:
            rec1 = get_response_recommendation(cat)
            rec2 = get_response_recommendation(cat)
            self.assertDictEqual(rec1, rec2)

    def test_6_unknown_category_raises_controlled_error(self):
        """Test 6: Unknown or invalid category strings raise controlled KeyError or ValueError."""
        invalid_inputs = ["Malware", "Trojan", "Ransomware", "SQLi", "UnknownCategory"]
        for invalid in invalid_inputs:
            with self.assertRaises(KeyError, msg=f"Did not raise KeyError for {invalid}"):
                get_response_recommendation(invalid)

        with self.assertRaises(ValueError):
            get_response_recommendation("")

        with self.assertRaises(ValueError):
            get_response_recommendation("   ")

        with self.assertRaises(ValueError):
            get_response_recommendation(None)  # type: ignore

    def test_7_no_executable_defensive_commands(self):
        """Test 7: Recommendations contain no executable defensive system commands."""
        forbidden_tokens = [
            "iptables -",
            "nft add",
            "ufw deny",
            "firewall-cmd",
            "ip route add blackhole",
            "kill -9",
            "systemctl stop",
            "shutdown",
            "drop table",
        ]
        all_recs = get_all_response_recommendations()
        for cat, rec in all_recs.items():
            text_blob = " ".join([
                rec["recommended_action"],
                rec["operator_guidance"],
                rec["rationale"],
                rec["limitations"],
            ]).lower()
            for token in forbidden_tokens:
                self.assertNotIn(
                    token,
                    text_blob,
                    f"Forbidden execution token '{token}' discovered in recommendation for '{cat}'",
                )

    def test_8_recommendations_explicitly_remain_advisory(self):
        """Test 8: Recommendations explicitly remain advisory and state limitations."""
        all_recs = get_all_response_recommendations()
        for cat, rec in all_recs.items():
            self.assertTrue(rec["is_advisory"])
            self.assertTrue(rec["requires_human_approval"])
            self.assertFalse(rec["automated_remediation_enabled"])
            self.assertIn("advisory", rec["limitations"].lower())

    def test_9_mapping_does_not_invoke_blockchain(self):
        """Test 9: Response recommendation retrieval does not invoke blockchain functions."""
        with patch("core.blockchain.BlockchainRegistryClient") as mock_blockchain:
            for cat in SUPPORTED_CATEGORIES:
                _ = get_response_recommendation(cat)
            mock_blockchain.assert_not_called()

    def test_10_mapping_does_not_invoke_model_inference(self):
        """Test 10: Response recommendation retrieval does not invoke ML model inference."""
        with patch("joblib.load") as mock_load:
            for cat in SUPPORTED_CATEGORIES:
                _ = get_response_recommendation(cat)
            mock_load.assert_not_called()

    def test_11_stage1_artifact_sha_remains_unchanged(self):
        """Test 11: Stage 1 binary model artifact SHA-256 remains strictly unaltered."""
        current_hash = calculate_sha256(STAGE1_ARTIFACT)
        self.assertEqual(
            current_hash,
            EXPECTED_STAGE1_SHA,
            f"Stage 1 model altered! Expected {EXPECTED_STAGE1_SHA}, got {current_hash}",
        )

    def test_12_stage2_artifact_sha_remains_unchanged(self):
        """Test 12: Stage 2 multiclass model artifact SHA-256 remains strictly unaltered."""
        current_hash = calculate_sha256(STAGE2_ARTIFACT)
        self.assertEqual(
            current_hash,
            EXPECTED_STAGE2_SHA,
            f"Stage 2 model altered! Expected {EXPECTED_STAGE2_SHA}, got {current_hash}",
        )


if __name__ == "__main__":
    unittest.main()
