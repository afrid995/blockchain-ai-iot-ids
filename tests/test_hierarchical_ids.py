"""Tests for Hierarchical Two-Stage Intrusion Detection System.

Phase 7B.3: Controlled Hierarchical Stage 1 -> Stage 2 IDS Integration
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

Verifies the 10 required invariants:
1. Both model artifact hashes match expected values.
2. Exactly 9 Stage 2 attack categories.
3. Stage 2 never receives true-label routing information.
4. Stage 2 routed count equals Stage 1 predicted-attack count.
5. Operational routing differs correctly from oracle routing where Stage 1 has false negatives.
6. Benign Stage 1 predictions do not receive Stage 2 category predictions.
7. Final hierarchical outputs contain either Normal or one of the 9 attack categories.
8. No blockchain call occurs inside per-flow inference function.
9. Test-set target columns are excluded from feature input.
10. Existing Stage 1 model artifact remains unchanged.
"""

from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import joblib
import numpy as np
import pandas as pd

from core.hashing import calculate_sha256
from experiments.hierarchical_ids_evaluation import (
    ALL_CATEGORIES_10,
    ATTACK_CATEGORIES,
    EXPECTED_STAGE1_SHA,
    EXPECTED_STAGE2_SHA,
    EXCLUDED_COLUMNS,
    HierarchicalIDS,
    STAGE1_ARTIFACT,
    STAGE2_ARTIFACT,
)


class TestHierarchicalIDS(unittest.TestCase):
    """Test suite for hierarchical two-stage IDS evaluation and routing invariants."""

    @classmethod
    def setUpClass(cls):
        """Load pipelines and create a sample synthetic flow for routing tests."""
        cls.stage1_pipe = joblib.load(STAGE1_ARTIFACT)
        cls.stage2_pipe = joblib.load(STAGE2_ARTIFACT)
        cls.hierarchical_ids = HierarchicalIDS(cls.stage1_pipe, cls.stage2_pipe)

        # Load a small slice of real test data (10 rows) for realistic feature structure
        test_csv = Path("data/raw/UNSW_NB15_testing-set.csv")
        cls.sample_df = pd.read_csv(test_csv, nrows=10)

    def test_1_model_artifact_hashes_match_expected(self):
        """Invariant 1: Both model artifact hashes match expected cryptographic digests."""
        actual_s1 = calculate_sha256(STAGE1_ARTIFACT)
        actual_s2 = calculate_sha256(STAGE2_ARTIFACT)
        self.assertEqual(actual_s1, EXPECTED_STAGE1_SHA, "Stage 1 model SHA-256 mismatch")
        self.assertEqual(actual_s2, EXPECTED_STAGE2_SHA, "Stage 2 model SHA-256 mismatch")

    def test_2_stage2_has_exactly_nine_attack_categories(self):
        """Invariant 2: Exactly 9 Stage 2 attack categories; 'Normal' is not an attack category."""
        classifier = self.stage2_pipe.named_steps["classifier"]
        classes = list(classifier.classes_)
        self.assertEqual(len(classes), 9, "Stage 2 must have exactly 9 attack categories")
        self.assertListEqual(sorted(classes), sorted(ATTACK_CATEGORIES))
        self.assertNotIn("Normal", classes, "'Normal' must never be a Stage 2 attack category")

    def test_3_stage2_never_receives_true_label_routing_information(self):
        """Invariant 3: Stage 2 routing never depends on ground-truth label or attack_cat."""
        # Create a mock Stage 1 that predicts 0 (Benign) even if flow has label=1 and attack_cat='Exploits'
        mock_s1 = MagicMock()
        mock_s1.predict.return_value = np.array([0])

        mock_s2 = MagicMock()
        mock_s2.predict.return_value = np.array(["Exploits"])

        h_ids = HierarchicalIDS(mock_s1, mock_s2)

        # Flow with ground-truth attack label=1
        attack_flow = {
            "label": 1,
            "attack_cat": "Exploits",
            "dur": 0.1,
            "proto": "tcp",
            "service": "http",
            "state": "FIN",
        }

        res = h_ids.predict_flow(attack_flow)
        # Because Stage 1 predicted 0, Stage 2 must NOT be invoked, and result must be Normal
        self.assertEqual(res["final_prediction"], "Normal")
        self.assertFalse(res["stage2_invoked"])
        mock_s2.predict.assert_not_called()

    def test_4_stage2_routed_count_equals_stage1_predicted_attack_count(self):
        """Invariant 4: Stage 2 routed count equals Stage 1 predicted-attack count exactly."""
        X = self.sample_df.drop(columns=[c for c in EXCLUDED_COLUMNS if c in self.sample_df.columns])
        s1_preds, stage2_mask, s2_preds_routed, final_preds = self.hierarchical_ids.predict_batch(X)

        s1_pred_attack_count = int((s1_preds == 1).sum())
        s2_routed_count = int(stage2_mask.sum())
        self.assertEqual(s1_pred_attack_count, s2_routed_count)
        self.assertEqual(len(s2_preds_routed), s2_routed_count)

    def test_5_operational_routing_differs_from_oracle_routing_on_false_negatives(self):
        """Invariant 5: Operational routing produces Normal on Stage 1 false negatives, unlike Oracle routing."""
        # Simulate a false negative flow: ground truth is Attack (label=1), but Stage 1 predicts 0 (Benign)
        mock_s1 = MagicMock()
        mock_s1.predict.return_value = np.array([0])

        mock_s2 = MagicMock()
        mock_s2.predict.return_value = np.array(["Generic"])

        h_ids = HierarchicalIDS(mock_s1, mock_s2)

        flow = {"proto": "tcp", "service": "http", "state": "FIN", "label": 1, "attack_cat": "Generic"}
        operational_res = h_ids.predict_flow(flow)

        # Operational router outputs Normal
        self.assertEqual(operational_res["final_prediction"], "Normal")
        self.assertFalse(operational_res["stage2_invoked"])

        # Oracle router by definition routes flows with label=1 to Stage 2
        oracle_routed = (flow["label"] == 1)
        self.assertTrue(oracle_routed)
        self.assertNotEqual(operational_res["stage2_invoked"], oracle_routed)

    def test_6_benign_stage1_predictions_do_not_receive_stage2_predictions(self):
        """Invariant 6: Benign Stage 1 predictions do not receive Stage 2 category predictions."""
        # Mock Stage 1 to predict 0 for all samples
        mock_s1 = MagicMock()
        mock_s1.predict.return_value = np.zeros(5, dtype=int)
        mock_s2 = MagicMock()

        h_ids = HierarchicalIDS(mock_s1, mock_s2)
        X_slice = self.sample_df.iloc[:5]
        s1_preds, stage2_mask, s2_preds_routed, final_preds = h_ids.predict_batch(X_slice)

        self.assertEqual(int(stage2_mask.sum()), 0)
        self.assertEqual(len(s2_preds_routed), 0)
        for pred in final_preds:
            self.assertEqual(pred, "Normal")
        mock_s2.predict.assert_not_called()

    def test_7_final_hierarchical_outputs_valid_domain(self):
        """Invariant 7: Final hierarchical outputs belong strictly to {'Normal'} U ATTACK_CATEGORIES."""
        X = self.sample_df.drop(columns=[c for c in EXCLUDED_COLUMNS if c in self.sample_df.columns])
        _, _, _, final_preds = self.hierarchical_ids.predict_batch(X)

        valid_domain = set(ALL_CATEGORIES_10)
        for pred in final_preds:
            self.assertIn(pred, valid_domain, f"Prediction '{pred}' outside valid domain")

    def test_8_no_blockchain_call_inside_per_flow_inference(self):
        """Invariant 8: No blockchain call occurs inside the per-flow inference function."""
        # Check initial call counter
        self.assertEqual(self.hierarchical_ids.per_flow_blockchain_calls, 0)

        # Predict single flow
        row = self.sample_df.iloc[0]
        _ = self.hierarchical_ids.predict_flow(row)

        # Call counter remains strictly 0
        self.assertEqual(
            self.hierarchical_ids.per_flow_blockchain_calls,
            0,
            "Per-flow inference must not invoke blockchain lookups",
        )

    def test_9_target_columns_excluded_from_feature_input(self):
        """Invariant 9: Target columns ('id', 'label', 'attack_cat') are excluded from feature input."""
        df_with_targets = self.sample_df.copy()
        self.assertIn("label", df_with_targets.columns)
        self.assertIn("attack_cat", df_with_targets.columns)

        # Mock pipelines to verify that passed DataFrame does not contain target columns
        mock_s1 = MagicMock()
        mock_s1.predict.return_value = np.array([0] * len(df_with_targets))
        mock_s2 = MagicMock()

        h_ids = HierarchicalIDS(mock_s1, mock_s2)
        h_ids.predict_batch(df_with_targets)

        passed_df = mock_s1.predict.call_args[0][0]
        for col in EXCLUDED_COLUMNS:
            self.assertNotIn(col, passed_df.columns, f"Target column '{col}' leaked into model input!")

    def test_10_existing_stage1_model_artifact_remains_unchanged(self):
        """Invariant 10: Existing Stage 1 binary model artifact remains strictly unaltered."""
        current_hash = calculate_sha256(STAGE1_ARTIFACT)
        self.assertEqual(
            current_hash,
            EXPECTED_STAGE1_SHA,
            f"Stage 1 model altered! Expected {EXPECTED_STAGE1_SHA}, got {current_hash}",
        )


if __name__ == "__main__":
    unittest.main()
