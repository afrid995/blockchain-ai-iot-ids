#!/usr/bin/env python3
"""Hierarchical Two-Stage Intrusion Detection System Evaluation.

Phase 7B.3: Controlled Hierarchical Stage 1 -> Stage 2 IDS Integration
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

EVALUATED ARCHITECTURE:
    Network-Flow Features (42 features: 39 numerical, 3 categorical)
            │
            ▼
    Stage 1: Binary IDS (ids_model.joblib, Random Forest)
            │
            ├── Benign (0) ──────────────► "Normal" (Final Output)
            │
            └── Attack (1)
                    │
                    ▼
            Stage 2: Attack Category (attack_classifier.joblib, Balanced RF)
                    │
                    ▼
            Attack Category (1 of 9 classes)

CRITICAL RESEARCH BOUNDARIES & INVARIANTS:
1. Operational routing (H1) is determined STRICTLY by Stage 1 prediction (y_pred1), NOT by ground-truth labels.
2. Ground-truth label and attack_cat are retained strictly for post-hoc empirical evaluation.
3. Target columns ('id', 'label', 'attack_cat') are strictly excluded from feature inputs.
4. Both model artifacts must match verified cryptographic digests before inference.
5. Per-flow blockchain calls must be strictly 0; blockchain operates as a pre-inference provenance gate.
6. Diagnostic reference (H2: Oracle-routed) is provided solely for error diagnosis, not operational claims.
7. No automated remediation, host isolation, or active defensive actions are implemented.
"""

from __future__ import annotations

import datetime
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

# Setup repository root
REPO_ROOT = Path(__file__).resolve().parent.parent
os.chdir(REPO_ROOT)
sys.path.insert(0, str(REPO_ROOT))

from core.hashing import calculate_sha256

# Paths
DATA_TRAIN = REPO_ROOT / "data" / "raw" / "UNSW_NB15_training-set.csv"
DATA_TEST = REPO_ROOT / "data" / "raw" / "UNSW_NB15_testing-set.csv"
STAGE1_ARTIFACT = REPO_ROOT / "ml" / "artifacts" / "ids_model.joblib"
STAGE2_ARTIFACT = REPO_ROOT / "ml" / "artifacts" / "attack_classifier.joblib"

RESULTS_JSON = REPO_ROOT / "experiments" / "results" / "phase7b_3_hierarchical_results.json"
FIG_DIR = REPO_ROOT / "reports" / "figures"
FIGURE11_PATH = FIG_DIR / "figure11_hierarchical_confusion_matrix.png"
FIGURE12_PATH = FIG_DIR / "figure12_category_routing_analysis.png"
FIGURE13_PATH = FIG_DIR / "figure13_hierarchical_category_performance.png"

# Established Invariants
EXPECTED_TRAIN_SHA = "734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559"
EXPECTED_TEST_SHA = "bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa"
EXPECTED_STAGE1_SHA = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"
EXPECTED_STAGE2_SHA = "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"

STAGE1_MODEL_ID = "iot-ids-rf"
STAGE1_MODEL_VERSION = "v1.0.0"
STAGE2_MODEL_ID = "iot-ids-attack-classifier"
STAGE2_MODEL_VERSION = "v1.0.0"

EXCLUDED_COLUMNS = ["id", "label", "attack_cat"]
ATTACK_CATEGORIES = [
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
ALL_CATEGORIES_10 = ["Normal"] + ATTACK_CATEGORIES


class HierarchicalIDS:
    """Pure hierarchical inference layer evaluating Stage 1 binary gating to Stage 2 multiclass classification.

    Performs off-chain inference with verified model pipelines.
    Zero blockchain calls occur on the per-flow inference path.
    """

    def __init__(self, stage1_pipeline: Any, stage2_pipeline: Any):
        self.stage1_pipeline = stage1_pipeline
        self.stage2_pipeline = stage2_pipeline
        self.per_flow_blockchain_calls = 0

    def predict_flow(self, flow: Union[Dict[str, Any], pd.Series, pd.DataFrame]) -> Dict[str, Any]:
        """Perform hierarchical prediction on a single network flow.

        Routing is governed strictly by the Stage 1 binary prediction.
        """
        # Ensure zero blockchain calls in per-flow inference
        # (self.per_flow_blockchain_calls remains 0)

        if isinstance(flow, dict):
            df = pd.DataFrame([flow])
        elif isinstance(flow, pd.Series):
            df = pd.DataFrame([flow.to_dict()])
        elif isinstance(flow, pd.DataFrame):
            df = flow.copy()
        else:
            raise TypeError("Flow input must be dict, Series, or single-row DataFrame.")

        # Drop target columns if passed
        cols_to_drop = [c for c in EXCLUDED_COLUMNS if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        # Stage 1 binary inference
        s1_pred = int(self.stage1_pipeline.predict(df)[0])

        if s1_pred == 0:
            return {
                "stage1_pred": 0,
                "stage1_label": "Benign",
                "stage2_invoked": False,
                "stage2_category": None,
                "final_prediction": "Normal",
                "final_binary": 0,
            }
        else:
            s2_cat = str(self.stage2_pipeline.predict(df)[0])
            return {
                "stage1_pred": 1,
                "stage1_label": "Attack",
                "stage2_invoked": True,
                "stage2_category": s2_cat,
                "final_prediction": s2_cat,
                "final_binary": 1,
            }

    def predict_batch(self, df_features: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Perform vectorized hierarchical prediction across a batch of flows.

        Returns:
            stage1_preds: (N,) binary predictions (0=Benign, 1=Attack)
            stage2_mask: (N,) boolean mask indicating which flows were routed to Stage 2
            stage2_preds_routed: (K,) Stage 2 category predictions for routed flows
            final_predictions: (N,) string predictions ('Normal' or one of 9 attack categories)
        """
        df = df_features.copy()
        cols_to_drop = [c for c in EXCLUDED_COLUMNS if c in df.columns]
        if cols_to_drop:
            df = df.drop(columns=cols_to_drop)

        n_samples = len(df)
        stage1_preds = self.stage1_pipeline.predict(df).astype(int)

        stage2_mask = (stage1_preds == 1)
        routed_indices = np.where(stage2_mask)[0]

        final_predictions = np.array(["Normal"] * n_samples, dtype=object)

        if len(routed_indices) > 0:
            df_routed = df.iloc[routed_indices]
            stage2_preds_routed = self.stage2_pipeline.predict(df_routed)
            final_predictions[routed_indices] = stage2_preds_routed
        else:
            stage2_preds_routed = np.array([], dtype=object)

        return stage1_preds, stage2_mask, stage2_preds_routed, final_predictions


def verify_invariants() -> Dict[str, Any]:
    """Verify cryptographic hashes of training data, testing data, and both model artifacts."""
    print("================================================================================")
    print("STEP 1: CRYPTOGRAPHIC INVARIANT VERIFICATION")
    print("================================================================================")

    for path, name in [
        (DATA_TRAIN, "Training Dataset"),
        (DATA_TEST, "Testing Dataset"),
        (STAGE1_ARTIFACT, "Stage 1 Model"),
        (STAGE2_ARTIFACT, "Stage 2 Model"),
    ]:
        if not path.exists():
            raise FileNotFoundError(f"Required file {name} not found at {path}")

    actual_train_sha = calculate_sha256(DATA_TRAIN)
    actual_test_sha = calculate_sha256(DATA_TEST)
    actual_stage1_sha = calculate_sha256(STAGE1_ARTIFACT)
    actual_stage2_sha = calculate_sha256(STAGE2_ARTIFACT)

    print(f"Training Dataset SHA-256: {actual_train_sha}")
    print(f"Testing Dataset SHA-256:  {actual_test_sha}")
    print(f"Stage 1 Model SHA-256:    {actual_stage1_sha}")
    print(f"Stage 2 Model SHA-256:    {actual_stage2_sha}")

    if actual_train_sha != EXPECTED_TRAIN_SHA:
        raise ValueError(f"Training dataset hash mismatch! Expected {EXPECTED_TRAIN_SHA}, got {actual_train_sha}")
    if actual_test_sha != EXPECTED_TEST_SHA:
        raise ValueError(f"Testing dataset hash mismatch! Expected {EXPECTED_TEST_SHA}, got {actual_test_sha}")
    if actual_stage1_sha != EXPECTED_STAGE1_SHA:
        raise ValueError(f"Stage 1 model hash mismatch! Expected {EXPECTED_STAGE1_SHA}, got {actual_stage1_sha}")
    if actual_stage2_sha != EXPECTED_STAGE2_SHA:
        raise ValueError(f"Stage 2 model hash mismatch! Expected {EXPECTED_STAGE2_SHA}, got {actual_stage2_sha}")

    print(" Cryptographic invariants successfully verified. Zero tampering detected.\n")

    return {
        "training_dataset_sha256": actual_train_sha,
        "testing_dataset_sha256": actual_test_sha,
        "stage1_model_sha256": actual_stage1_sha,
        "stage2_model_sha256": actual_stage2_sha,
        "verified_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }


def compute_binary_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
    """Compute binary classification metrics."""
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    accuracy = float(accuracy_score(y_true, y_pred))
    precision = float(precision_score(y_true, y_pred, zero_division=0))
    recall = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0

    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "specificity": specificity,
        "false_positive_rate": fpr,
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
    }


def compute_multiclass_metrics(
    y_true: pd.Series | np.ndarray,
    y_pred: np.ndarray,
    labels: List[str],
) -> Dict[str, Any]:
    """Compute multiclass metrics for specified target labels."""
    y_true_arr = np.asarray(y_true)
    y_pred_arr = np.asarray(y_pred)

    macro_prec = float(precision_score(y_true_arr, y_pred_arr, labels=labels, average="macro", zero_division=0))
    macro_rec = float(recall_score(y_true_arr, y_pred_arr, labels=labels, average="macro", zero_division=0))
    macro_f1 = float(f1_score(y_true_arr, y_pred_arr, labels=labels, average="macro", zero_division=0))

    weighted_prec = float(precision_score(y_true_arr, y_pred_arr, labels=labels, average="weighted", zero_division=0))
    weighted_rec = float(recall_score(y_true_arr, y_pred_arr, labels=labels, average="weighted", zero_division=0))
    weighted_f1 = float(f1_score(y_true_arr, y_pred_arr, labels=labels, average="weighted", zero_division=0))

    # Balanced accuracy (for true attack labels only)
    try:
        bal_acc = float(balanced_accuracy_score(y_true_arr, y_pred_arr))
    except Exception:
        bal_acc = None

    cm = confusion_matrix(y_true_arr, y_pred_arr, labels=labels)

    # Per-class metrics
    per_class: Dict[str, Dict[str, Any]] = {}
    precisions = precision_score(y_true_arr, y_pred_arr, labels=labels, average=None, zero_division=0)
    recalls = recall_score(y_true_arr, y_pred_arr, labels=labels, average=None, zero_division=0)
    f1s = f1_score(y_true_arr, y_pred_arr, labels=labels, average=None, zero_division=0)

    for i, label in enumerate(labels):
        support = int((y_true_arr == label).sum())
        per_class[label] = {
            "precision": float(precisions[i]),
            "recall": float(recalls[i]),
            "f1": float(f1s[i]),
            "support": support,
        }

    return {
        "macro_precision": macro_prec,
        "macro_recall": macro_rec,
        "macro_f1": macro_f1,
        "weighted_precision": weighted_prec,
        "weighted_recall": weighted_rec,
        "weighted_f1": weighted_f1,
        "balanced_accuracy": bal_acc,
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
        "labels": labels,
    }


def evaluate_hierarchical_ids(
    test_df: pd.DataFrame,
    hierarchical_ids: HierarchicalIDS,
) -> Dict[str, Any]:
    """Execute the full hierarchical evaluation protocol."""
    print("================================================================================")
    print("STEP 2: FULL HIERARCHICAL EVALUATION EXECUTION")
    print("================================================================================")

    # Pre-condition: Clean whitespace
    test_df["attack_cat"] = test_df["attack_cat"].astype(str).str.strip()
    y_true_binary = test_df["label"].values
    y_true_category = test_df["attack_cat"].values
    X_test = test_df.drop(columns=EXCLUDED_COLUMNS)

    # Stage 1 vectorized prediction
    print("Executing Stage 1 binary inference on N = 175,341 flows...")
    t0 = time.time()
    s1_preds, stage2_mask, s2_preds_routed, final_predictions = hierarchical_ids.predict_batch(X_test)
    elapsed_total_inference = time.time() - t0
    print(f"Hierarchical batch inference completed in {elapsed_total_inference:.2f} seconds.")

    # 1. Sample and Routing Counts
    total_test_flows = len(test_df)
    true_benign = int((y_true_binary == 0).sum())
    true_attack = int((y_true_binary == 1).sum())
    s1_pred_benign = int((s1_preds == 0).sum())
    s1_pred_attack = int((s1_preds == 1).sum())
    stage2_routed = int(stage2_mask.sum())

    # Critical Programmatic Check
    assert stage2_routed == s1_pred_attack, (
        f"Critical routing invariant violated: stage2_routed ({stage2_routed}) != s1_pred_attack ({s1_pred_attack})"
    )

    true_attacks_reaching_stage2 = int(((y_true_binary == 1) & stage2_mask).sum())
    true_attacks_missed_by_stage1 = int(((y_true_binary == 1) & (~stage2_mask)).sum())
    false_positives_reaching_stage2 = int(((y_true_binary == 0) & stage2_mask).sum())

    print("\n--- SAMPLE AND ROUTING COUNTS ---")
    print(f"Total Test Flows:                       {total_test_flows:,}")
    print(f"True Benign Flows:                      {true_benign:,} ({true_benign/total_test_flows*100:.2f}%)")
    print(f"True Attack Flows:                      {true_attack:,} ({true_attack/total_test_flows*100:.2f}%)")
    print(f"Stage 1 Predicted Benign Flows:         {s1_pred_benign:,} ({s1_pred_benign/total_test_flows*100:.2f}%)")
    print(f"Stage 1 Predicted Attack Flows:         {s1_pred_attack:,} ({s1_pred_attack/total_test_flows*100:.2f}%)")
    print(f"Stage 2 Routed Flows:                   {stage2_routed:,} (Matches Stage 1 Pred Attack: True)")
    print(f"True Attacks Reaching Stage 2:          {true_attacks_reaching_stage2:,} ({true_attacks_reaching_stage2/true_attack*100:.2f}% of true attacks)")
    print(f"True Attacks Missed by Stage 1 (FN):    {true_attacks_missed_by_stage1:,} ({true_attacks_missed_by_stage1/true_attack*100:.2f}% of true attacks)")
    print(f"False Positive Benign Reaching Stage 2: {false_positives_reaching_stage2:,} ({false_positives_reaching_stage2/true_benign*100:.2f}% of true benign)")

    # 2. H1 Hierarchical Binary Metrics
    final_binary_preds = (final_predictions != "Normal").astype(int)
    # Verify mathematical identity to Stage 1 predictions
    assert np.array_equal(final_binary_preds, s1_preds), (
        "Internal inconsistency: Hierarchical binary decision differs from Stage 1 prediction!"
    )
    h1_binary = compute_binary_metrics(y_true_binary, final_binary_preds)
    h1_binary["architectural_note"] = (
        "By construction, the operational hierarchical binary classification boundary (Normal vs Attack) "
        "is mathematically determined by Stage 1 binary routing. Stage 2 refines attack classifications "
        "into granular categories without modifying binary admission."
    )

    print("\n--- CONFIGURATION H1: HIERARCHICAL BINARY OUTCOME ---")
    print(f"Accuracy:            {h1_binary['accuracy']*100:.2f}%")
    print(f"Precision:           {h1_binary['precision']*100:.2f}%")
    print(f"Recall:              {h1_binary['recall']*100:.2f}%")
    print(f"F1-Score:            {h1_binary['f1']*100:.2f}%")
    print(f"Specificity:         {h1_binary['specificity']*100:.2f}%")
    print(f"False Positive Rate: {h1_binary['false_positive_rate']*100:.2f}%")
    print(f"Confusion Matrix:    TN={h1_binary['confusion_matrix']['true_negatives']:,}, "
          f"FP={h1_binary['confusion_matrix']['false_positives']:,}, "
          f"FN={h1_binary['confusion_matrix']['false_negatives']:,}, "
          f"TP={h1_binary['confusion_matrix']['true_positives']:,}")

    # 3. H2 Oracle-Routed Diagnostic Reference (View A)
    print("\n--- CONFIGURATION H2: ORACLE-ROUTED STAGE 2 REFERENCE (VIEW A) ---")
    oracle_attack_mask = (y_true_binary == 1)
    X_oracle_attack = X_test[oracle_attack_mask]
    y_oracle_true = y_true_category[oracle_attack_mask]
    s2_oracle_preds = hierarchical_ids.stage2_pipeline.predict(X_oracle_attack)

    h2_oracle_metrics = compute_multiclass_metrics(y_oracle_true, s2_oracle_preds, ATTACK_CATEGORIES)
    h2_oracle_metrics["accuracy"] = float(accuracy_score(y_oracle_true, s2_oracle_preds))
    h2_oracle_metrics["status_label"] = "Oracle-routed diagnostic reference; not deployable inference behavior."
    print(f"Accuracy:          {h2_oracle_metrics['accuracy']*100:.2f}%")
    print(f"Macro F1:          {h2_oracle_metrics['macro_f1']*100:.2f}%")
    print(f"Balanced Accuracy: {h2_oracle_metrics['balanced_accuracy']*100:.2f}%")
    print(f"Weighted F1:       {h2_oracle_metrics['weighted_f1']*100:.2f}%")

    # 4. H1 Operational Hierarchical Stage 2 (View B)
    print("\n--- CONFIGURATION H1: OPERATIONAL HIERARCHICAL STAGE 2 (VIEW B) ---")
    # View B has two perspectives:
    # B1: Evaluated on routed true attacks (N = 103,611)
    routed_true_attack_mask = (y_true_category[stage2_mask] != "Normal")
    y_routed_true_attacks = y_true_category[stage2_mask][routed_true_attack_mask]
    s2_preds_routed_true_attacks = s2_preds_routed[routed_true_attack_mask]

    view_b_true_attacks = compute_multiclass_metrics(
        y_routed_true_attacks,
        s2_preds_routed_true_attacks,
        ATTACK_CATEGORIES,
    )
    view_b_true_attacks["accuracy"] = float(accuracy_score(y_routed_true_attacks, s2_preds_routed_true_attacks))

    # B2: Evaluated across all routed flows (N = 104,893) with labels=ATTACK_CATEGORIES
    # The 1,282 Normal samples generate false positives across attack categories
    y_routed_all_true = y_true_category[stage2_mask]
    view_b_all_routed = compute_multiclass_metrics(
        y_routed_all_true,
        s2_preds_routed,
        ATTACK_CATEGORIES,
    )

    print("View B1 (Routed True Attacks, N=103,611):")
    print(f"  Accuracy:          {view_b_true_attacks['accuracy']*100:.2f}%")
    print(f"  Macro F1:          {view_b_true_attacks['macro_f1']*100:.2f}%")
    print(f"  Balanced Accuracy: {view_b_true_attacks['balanced_accuracy']*100:.2f}%")
    print(f"  Weighted F1:       {view_b_true_attacks['weighted_f1']*100:.2f}%")
    print("View B2 (All Routed Flows including Stage 1 FP, N=104,893):")
    print(f"  Macro F1:          {view_b_all_routed['macro_f1']*100:.2f}%")
    print(f"  Macro Precision:   {view_b_all_routed['macro_precision']*100:.2f}%")
    print(f"  Macro Recall:      {view_b_all_routed['macro_recall']*100:.2f}%")
    print(f"  Weighted F1:       {view_b_all_routed['weighted_f1']*100:.2f}%")

    # 5. Complete End-to-End Hierarchical 10-Class Metrics (N = 175,341)
    e2e_10_cm = confusion_matrix(y_true_category, final_predictions, labels=ALL_CATEGORIES_10)
    e2e_10_acc = float(accuracy_score(y_true_category, final_predictions))
    e2e_10_bal_acc = float(balanced_accuracy_score(y_true_category, final_predictions))
    e2e_10_macro_f1 = float(f1_score(y_true_category, final_predictions, labels=ALL_CATEGORIES_10, average="macro"))
    e2e_10_weighted_f1 = float(f1_score(y_true_category, final_predictions, labels=ALL_CATEGORIES_10, average="weighted"))

    e2e_10_metrics = {
        "accuracy": e2e_10_acc,
        "balanced_accuracy": e2e_10_bal_acc,
        "macro_f1": e2e_10_macro_f1,
        "weighted_f1": e2e_10_weighted_f1,
        "confusion_matrix": e2e_10_cm.tolist(),
        "labels": ALL_CATEGORIES_10,
    }

    # 6. Category-Level Routing & End-to-End Recall Analysis
    print("\n--- CATEGORY-LEVEL ROUTING AND RECALL ANALYSIS ---")
    category_routing: Dict[str, Dict[str, Any]] = {}
    for cat in ATTACK_CATEGORIES:
        total_true_cat = int((y_true_category == cat).sum())
        routed_cat = int(((y_true_category == cat) & stage2_mask).sum())
        not_routed_cat = total_true_cat - routed_cat
        routing_rate = float(routed_cat / total_true_cat) if total_true_cat > 0 else 0.0

        # Stage 2 correct predictions among routed samples
        cat_routed_mask = (y_routed_all_true == cat)
        correct_cat = int((s2_preds_routed[cat_routed_mask] == cat).sum())

        stage2_recall_routed = float(correct_cat / routed_cat) if routed_cat > 0 else 0.0
        end_to_end_recall = float(correct_cat / total_true_cat) if total_true_cat > 0 else 0.0

        category_routing[cat] = {
            "total_true": total_true_cat,
            "routed": routed_cat,
            "not_routed": not_routed_cat,
            "routing_rate": routing_rate,
            "correct_stage2": correct_cat,
            "stage2_recall_among_routed": stage2_recall_routed,
            "end_to_end_recall": end_to_end_recall,
        }
        print(f"  {cat:<15}: True={total_true_cat:>5} | Routed={routed_cat:>5} ({routing_rate*100:>5.1f}%) | "
              f"Missed={not_routed_cat:>5} | Correct={correct_cat:>5} | "
              f"S2 Recall={stage2_recall_routed*100:>5.1f}% | E2E Recall={end_to_end_recall*100:>5.1f}%")

    # 7. Error Propagation Analysis
    total_correct_stage2 = sum(c["correct_stage2"] for c in category_routing.values())
    total_incorrect_stage2 = true_attacks_reaching_stage2 - total_correct_stage2

    error_propagation = {
        "total_true_attacks": true_attack,
        "lost_at_stage1_false_negatives": true_attacks_missed_by_stage1,
        "lost_at_stage1_percentage": float(true_attacks_missed_by_stage1 / true_attack),
        "reached_stage2": true_attacks_reaching_stage2,
        "reached_stage2_percentage": float(true_attacks_reaching_stage2 / true_attack),
        "correct_stage2_category": total_correct_stage2,
        "correct_stage2_percentage_of_attacks": float(total_correct_stage2 / true_attack),
        "incorrect_stage2_category": total_incorrect_stage2,
        "incorrect_stage2_percentage_of_attacks": float(total_incorrect_stage2 / true_attack),
        "stage1_false_positives_routed_to_stage2": false_positives_reaching_stage2,
        "stage1_fp_distribution_across_categories": {
            cat: int((s2_preds_routed[y_routed_all_true == "Normal"] == cat).sum())
            for cat in ATTACK_CATEGORIES
        },
    }

    print("\n--- ERROR PROPAGATION SUMMARY ---")
    print(f"Total True Attacks:                       {error_propagation['total_true_attacks']:,} (100.0%)")
    print(f"Lost at Stage 1 (FN):                     {error_propagation['lost_at_stage1_false_negatives']:,} ({error_propagation['lost_at_stage1_percentage']*100:.2f}%)")
    print(f"Reached Stage 2:                          {error_propagation['reached_stage2']:,} ({error_propagation['reached_stage2_percentage']*100:.2f}%)")
    print(f"  - Correct Stage 2 Category:             {error_propagation['correct_stage2_category']:,} ({error_propagation['correct_stage2_percentage_of_attacks']*100:.2f}%)")
    print(f"  - Incorrect Stage 2 Category:           {error_propagation['incorrect_stage2_category']:,} ({error_propagation['incorrect_stage2_percentage_of_attacks']*100:.2f}%)")
    print(f"Stage 1 False Positives (Normal in S2):   {error_propagation['stage1_false_positives_routed_to_stage2']:,}")

    # 8. Baseline Reference H3
    h3_baseline = {
        "model_id": STAGE1_MODEL_ID,
        "version": STAGE1_MODEL_VERSION,
        "dataset_rows": 175341,
        "accuracy": 0.9030,
        "precision": 0.9878,
        "recall": 0.8682,
        "f1": 0.9241,
        "specificity": 0.9771,
        "false_positive_rate": 0.0229,
        "roc_auc": 0.9860,
        "status": "Established Stage 1 standalone baseline from Phase 1-6.",
    }

    return {
        "sample_counts": {
            "total_test_flows": total_test_flows,
            "true_benign": true_benign,
            "true_attack": true_attack,
            "stage1_predicted_benign": s1_pred_benign,
            "stage1_predicted_attack": s1_pred_attack,
            "stage2_routed": stage2_routed,
            "routing_equality_verified": (stage2_routed == s1_pred_attack),
            "true_attacks_reaching_stage2": true_attacks_reaching_stage2,
            "true_attacks_missed_by_stage1": true_attacks_missed_by_stage1,
            "false_positives_reaching_stage2": false_positives_reaching_stage2,
        },
        "h1_binary_metrics": h1_binary,
        "h2_oracle_stage2_metrics": h2_oracle_metrics,
        "h1_operational_stage2_metrics": {
            "evaluated_on_routed_true_attacks_n103611": view_b_true_attacks,
            "evaluated_on_all_routed_flows_n104893": view_b_all_routed,
        },
        "end_to_end_10_class_metrics": e2e_10_metrics,
        "category_routing_analysis": category_routing,
        "error_propagation": error_propagation,
        "h3_stage1_standalone_baseline": h3_baseline,
    }


def run_latency_benchmark(
    test_df: pd.DataFrame,
    hierarchical_ids: HierarchicalIDS,
    n_samples: int = 100,
) -> Dict[str, Any]:
    """Measure inference latency across L1, L2, L3, and L4 on deterministic samples."""
    print("================================================================================")
    print(f"STEP 3: LATENCY BENCHMARKING (N = {n_samples} SAMPLES)")
    print("================================================================================")

    # Take deterministic sample of 100 flows (first 100 rows)
    sample_df = test_df.iloc[:n_samples].copy()
    X_sample = sample_df.drop(columns=EXCLUDED_COLUMNS)

    # L1: Stage 1 alone
    l1_times_ms: List[float] = []
    for i in range(n_samples):
        row = X_sample.iloc[[i]]
        t0 = time.perf_counter()
        _ = hierarchical_ids.stage1_pipeline.predict(row)
        l1_times_ms.append((time.perf_counter() - t0) * 1000)

    # L2: Stage 2 inference on attack flows (simulated per-flow)
    l2_times_ms: List[float] = []
    for i in range(n_samples):
        row = X_sample.iloc[[i]]
        t0 = time.perf_counter()
        _ = hierarchical_ids.stage2_pipeline.predict(row)
        l2_times_ms.append((time.perf_counter() - t0) * 1000)

    # L3: Hierarchical inference (Stage 1 + conditional Stage 2)
    l3_times_ms: List[float] = []
    stage2_invoked_count = 0
    for i in range(n_samples):
        row = X_sample.iloc[[i]]
        t0 = time.perf_counter()
        pred1 = hierarchical_ids.stage1_pipeline.predict(row)[0]
        if pred1 == 1:
            stage2_invoked_count += 1
            _ = hierarchical_ids.stage2_pipeline.predict(row)[0]
        l3_times_ms.append((time.perf_counter() - t0) * 1000)

    # L4: Reference: Stage 1 + Stage 2 unconditionally on every flow
    l4_times_ms: List[float] = []
    for i in range(n_samples):
        row = X_sample.iloc[[i]]
        t0 = time.perf_counter()
        _ = hierarchical_ids.stage1_pipeline.predict(row)[0]
        _ = hierarchical_ids.stage2_pipeline.predict(row)[0]
        l4_times_ms.append((time.perf_counter() - t0) * 1000)

    def summarize(times: List[float]) -> Dict[str, float]:
        arr = np.array(times)
        return {
            "mean_ms": float(np.mean(arr)),
            "median_ms": float(np.median(arr)),
            "min_ms": float(np.min(arr)),
            "max_ms": float(np.max(arr)),
            "std_ms": float(np.std(arr)),
        }

    stats = {
        "sample_size": n_samples,
        "stage2_invocations_in_l3": stage2_invoked_count,
        "l1_stage1_alone": summarize(l1_times_ms),
        "l2_stage2_alone": summarize(l2_times_ms),
        "l3_hierarchical_conditional": summarize(l3_times_ms),
        "l4_unconditional_both": summarize(l4_times_ms),
        "per_flow_blockchain_calls": hierarchical_ids.per_flow_blockchain_calls,
        "architectural_statement": "The evaluated per-flow hierarchical inference path performed no blockchain registry lookup.",
    }

    print(f"L1 (Stage 1 alone):            Mean = {stats['l1_stage1_alone']['mean_ms']:.2f} ms | Median = {stats['l1_stage1_alone']['median_ms']:.2f} ms")
    print(f"L2 (Stage 2 alone):            Mean = {stats['l2_stage2_alone']['mean_ms']:.2f} ms | Median = {stats['l2_stage2_alone']['median_ms']:.2f} ms")
    print(f"L3 (Hierarchical conditional): Mean = {stats['l3_hierarchical_conditional']['mean_ms']:.2f} ms | Median = {stats['l3_hierarchical_conditional']['median_ms']:.2f} ms")
    print(f"L4 (Unconditional reference):  Mean = {stats['l4_unconditional_both']['mean_ms']:.2f} ms | Median = {stats['l4_unconditional_both']['median_ms']:.2f} ms")
    print(f"Per-flow blockchain calls:     {stats['per_flow_blockchain_calls']}\n")

    return stats


def generate_figures(results: Dict[str, Any]) -> None:
    """Generate publication-quality figures."""
    print("================================================================================")
    print("STEP 4: GENERATING FIGURES")
    print("================================================================================")
    FIG_DIR.mkdir(parents=True, exist_ok=True)

    # ---------------------------------------------------------
    # FIGURE 11: Hierarchical Confusion Matrix (Dual-Panel)
    # ---------------------------------------------------------
    fig, axes = plt.subplots(1, 2, figsize=(18, 8))

    # Panel A: Complete 10x10 Hierarchical Confusion Matrix
    cm_10 = np.array(results["end_to_end_10_class_metrics"]["confusion_matrix"])
    labels_10 = ALL_CATEGORIES_10

    im0 = axes[0].imshow(cm_10, interpolation="nearest", cmap=plt.cm.Blues)
    axes[0].set_title("(a) End-to-End Hierarchical Classification (N = 175,341)\n[Stage 1 Binary Admission + Stage 2 Multiclass]", fontsize=12, pad=12)
    tick_marks_10 = np.arange(len(labels_10))
    axes[0].set_xticks(tick_marks_10)
    axes[0].set_xticklabels(labels_10, rotation=45, ha="right", fontsize=9)
    axes[0].set_yticks(tick_marks_10)
    axes[0].set_yticklabels(labels_10, fontsize=9)
    axes[0].set_xlabel("Hierarchical Predicted Label", fontsize=10)
    axes[0].set_ylabel("Ground-Truth Label", fontsize=10)

    # Annotate values
    thresh_10 = cm_10.max() / 2.0
    for i in range(len(labels_10)):
        for j in range(len(labels_10)):
            val = cm_10[i, j]
            text = f"{val:,}" if val < 10000 else f"{val//1000}k"
            axes[0].text(
                j, i, text,
                ha="center", va="center",
                color="white" if val > thresh_10 else "black",
                fontsize=7.5,
            )

    # Panel B: Operational Stage 2 Confusion Matrix (9x9) on Routed Attacks
    cm_9 = np.array(results["h1_operational_stage2_metrics"]["evaluated_on_routed_true_attacks_n103611"]["confusion_matrix"])
    labels_9 = ATTACK_CATEGORIES

    im1 = axes[1].imshow(cm_9, interpolation="nearest", cmap=plt.cm.Greens)
    axes[1].set_title("(b) Operational Stage 2 Attack Category Classification\n[Routed True Attacks, N = 103,611]", fontsize=12, pad=12)
    tick_marks_9 = np.arange(len(labels_9))
    axes[1].set_xticks(tick_marks_9)
    axes[1].set_xticklabels(labels_9, rotation=45, ha="right", fontsize=9)
    axes[1].set_yticks(tick_marks_9)
    axes[1].set_yticklabels(labels_9, fontsize=9)
    axes[1].set_xlabel("Stage 2 Predicted Category", fontsize=10)
    axes[1].set_ylabel("Ground-Truth Attack Category", fontsize=10)

    thresh_9 = cm_9.max() / 2.0
    for i in range(len(labels_9)):
        for j in range(len(labels_9)):
            val = cm_9[i, j]
            text = f"{val:,}" if val < 10000 else f"{val//1000}k"
            axes[1].text(
                j, i, text,
                ha="center", va="center",
                color="white" if val > thresh_9 else "black",
                fontsize=7.5,
            )

    plt.tight_layout()
    fig.savefig(FIGURE11_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Figure 11 saved: {FIGURE11_PATH}")

    # ---------------------------------------------------------
    # FIGURE 12: Category Routing and Recall Analysis
    # ---------------------------------------------------------
    fig, ax = plt.subplots(figsize=(12, 6))

    routing_data = results["category_routing_analysis"]
    categories = ATTACK_CATEGORIES
    routing_rates = [routing_data[c]["routing_rate"] * 100 for c in categories]
    s2_recalls = [routing_data[c]["stage2_recall_among_routed"] * 100 for c in categories]
    e2e_recalls = [routing_data[c]["end_to_end_recall"] * 100 for c in categories]

    x = np.arange(len(categories))
    width = 0.26

    rects1 = ax.bar(x - width, routing_rates, width, label="Stage 1 Routing Rate (%)", color="#1f77b4", alpha=0.9)
    rects2 = ax.bar(x, s2_recalls, width, label="Stage 2 Recall among Routed (%)", color="#2ca02c", alpha=0.9)
    rects3 = ax.bar(x + width, e2e_recalls, width, label="End-to-End Recall (%)", color="#d62728", alpha=0.9)

    ax.set_ylabel("Percentage (%)", fontsize=11)
    ax.set_title("Empirical Category Routing Rate, Stage 2 Recall, and End-to-End Recall Across 9 Attack Categories", fontsize=12, pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, rotation=30, ha="right", fontsize=10)
    ax.set_ylim(0, 115)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", fontsize=10)

    # Annotate values above bars
    for rects, offset in [(rects1, -width), (rects2, 0), (rects3, width)]:
        for rect in rects:
            height = rect.get_height()
            ax.annotate(
                f"{height:.1f}%",
                xy=(rect.get_x() + rect.get_width() / 2, height),
                xytext=(0, 3),
                textcoords="offset points",
                ha="center", va="bottom",
                fontsize=7.5,
                rotation=90,
            )

    plt.tight_layout()
    fig.savefig(FIGURE12_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Figure 12 saved: {FIGURE12_PATH}")

    # ---------------------------------------------------------
    # FIGURE 13: Oracle vs Operational Category Performance
    # ---------------------------------------------------------
    fig, ax = plt.subplots(figsize=(12, 6))

    h2_per_class = results["h2_oracle_stage2_metrics"]["per_class"]
    h1_per_class = results["h1_operational_stage2_metrics"]["evaluated_on_routed_true_attacks_n103611"]["per_class"]

    h2_f1s = [h2_per_class[c]["f1"] * 100 for c in categories]
    h1_f1s = [h1_per_class[c]["f1"] * 100 for c in categories]

    x = np.arange(len(categories))
    width = 0.35

    rects1 = ax.bar(x - width/2, h2_f1s, width, label="H2: Oracle-Routed Stage 2 (Diagnostic Ref)", color="#7f7f7f", alpha=0.85)
    rects2 = ax.bar(x + width/2, h1_f1s, width, label="H1: Operational Hierarchical Stage 2", color="#1f77b4", alpha=0.9)

    ax.set_ylabel("F1-Score (%)", fontsize=11)
    ax.set_title("Per-Category F1-Score Comparison: Oracle-Routed (H2) vs Operational Hierarchical (H1)", fontsize=12, pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(categories, rotation=30, ha="right", fontsize=10)
    ax.set_ylim(0, 110)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.legend(loc="upper right", fontsize=10)

    for rect in rects1:
        h = rect.get_height()
        ax.annotate(f"{h:.1f}%", xy=(rect.get_x() + rect.get_width() / 2, h), xytext=(0, 3),
                    textcoords="offset points", ha="center", va="bottom", fontsize=8)
    for rect in rects2:
        h = rect.get_height()
        ax.annotate(f"{h:.1f}%", xy=(rect.get_x() + rect.get_width() / 2, h), xytext=(0, 3),
                    textcoords="offset points", ha="center", va="bottom", fontsize=8)

    plt.tight_layout()
    fig.savefig(FIGURE13_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Figure 13 saved: {FIGURE13_PATH}\n")


def export_results(all_results: Dict[str, Any]) -> None:
    """Export complete experimental results to structured JSON."""
    RESULTS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)
    print(f"Experimental results exported: {RESULTS_JSON}")


def main() -> None:
    print("################################################################################")
    print("PHASE 7B.3: CONTROLLED HIERARCHICAL STAGE 1 -> STAGE 2 IDS EVALUATION")
    print("################################################################################\n")

    # 1. Invariant verification
    provenance_info = verify_invariants()

    # 2. Model loading
    print("Loading Stage 1 binary pipeline...")
    stage1_pipe = joblib.load(STAGE1_ARTIFACT)
    print("Loading Stage 2 attack classifier pipeline...")
    stage2_pipe = joblib.load(STAGE2_ARTIFACT)

    hierarchical_ids = HierarchicalIDS(stage1_pipe, stage2_pipe)

    # 3. Load authentic test dataset
    print(f"Loading authentic test dataset: {DATA_TEST} ...")
    test_df = pd.read_csv(DATA_TEST)
    print(f"Loaded {len(test_df):,} rows and {len(test_df.columns)} columns.\n")

    # 4. Hierarchical evaluation
    eval_results = evaluate_hierarchical_ids(test_df, hierarchical_ids)

    # 5. Latency benchmark
    latency_results = run_latency_benchmark(test_df, hierarchical_ids, n_samples=100)

    # 6. Assemble complete results
    full_results: Dict[str, Any] = {
        "metadata": {
            "phase": "Phase 7B.3",
            "title": "Controlled Hierarchical Stage 1 -> Stage 2 IDS Integration",
            "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "python_version": sys.version,
            "architecture": "Hierarchical Two-Stage Pipeline (Stage 1 Binary Gate -> Stage 2 Multiclass Attack Classifier)",
        },
        "provenance": provenance_info,
        "sample_counts": eval_results["sample_counts"],
        "h1_binary_metrics": eval_results["h1_binary_metrics"],
        "h2_oracle_stage2_metrics": eval_results["h2_oracle_stage2_metrics"],
        "h1_operational_stage2_metrics": eval_results["h1_operational_stage2_metrics"],
        "end_to_end_10_class_metrics": eval_results["end_to_end_10_class_metrics"],
        "category_routing_analysis": eval_results["category_routing_analysis"],
        "error_propagation": eval_results["error_propagation"],
        "h3_stage1_standalone_baseline": eval_results["h3_stage1_standalone_baseline"],
        "latency_benchmark": latency_results,
        "blockchain_interaction": {
            "per_flow_blockchain_calls": hierarchical_ids.per_flow_blockchain_calls,
            "provenance_check_type": "pre_inference_initialization_gate",
            "runtime_inference_decoupling": True,
            "security_statement": "The evaluated per-flow hierarchical inference path performed no blockchain registry lookup.",
        },
        "figures": {
            "figure11": str(FIGURE11_PATH.relative_to(REPO_ROOT)),
            "figure12": str(FIGURE12_PATH.relative_to(REPO_ROOT)),
            "figure13": str(FIGURE13_PATH.relative_to(REPO_ROOT)),
        },
        "minority_class_findings": {
            "Analysis": {
                "support": eval_results["category_routing_analysis"]["Analysis"]["total_true"],
                "routing_rate": eval_results["category_routing_analysis"]["Analysis"]["routing_rate"],
                "stage2_recall_routed": eval_results["category_routing_analysis"]["Analysis"]["stage2_recall_among_routed"],
                "end_to_end_recall": eval_results["category_routing_analysis"]["Analysis"]["end_to_end_recall"],
                "conclusion": "Severe minority class limitation; only 59 of 2,000 true instances correctly classified end-to-end (2.95% recall).",
            },
            "Backdoor": {
                "support": eval_results["category_routing_analysis"]["Backdoor"]["total_true"],
                "routing_rate": eval_results["category_routing_analysis"]["Backdoor"]["routing_rate"],
                "stage2_recall_routed": eval_results["category_routing_analysis"]["Backdoor"]["stage2_recall_among_routed"],
                "end_to_end_recall": eval_results["category_routing_analysis"]["Backdoor"]["end_to_end_recall"],
                "conclusion": "High Stage 1 admission (99.43%), but weak Stage 2 category recall (11.64%); 202 of 1,746 instances detected.",
            },
            "Shellcode": {
                "support": eval_results["category_routing_analysis"]["Shellcode"]["total_true"],
                "routing_rate": eval_results["category_routing_analysis"]["Shellcode"]["routing_rate"],
                "stage2_recall_routed": eval_results["category_routing_analysis"]["Shellcode"]["stage2_recall_among_routed"],
                "end_to_end_recall": eval_results["category_routing_analysis"]["Shellcode"]["end_to_end_recall"],
                "conclusion": "Shellcode achieves 63.46% end-to-end recall in this evaluation. The experiment does not isolate the contribution of class weighting or individual feature groups to this result.",
            },
            "Worms": {
                "support": eval_results["category_routing_analysis"]["Worms"]["total_true"],
                "routing_rate": eval_results["category_routing_analysis"]["Worms"]["routing_rate"],
                "stage2_recall_routed": eval_results["category_routing_analysis"]["Worms"]["stage2_recall_among_routed"],
                "end_to_end_recall": eval_results["category_routing_analysis"]["Worms"]["end_to_end_recall"],
                "conclusion": "Extremely small support (N=130); 127 routed (97.69%), but only 20 correctly classified (15.38% end-to-end recall).",
            },
            "Fuzzers_bottleneck": {
                "support": eval_results["category_routing_analysis"]["Fuzzers"]["total_true"],
                "routing_rate": eval_results["category_routing_analysis"]["Fuzzers"]["routing_rate"],
                "stage2_recall_routed": eval_results["category_routing_analysis"]["Fuzzers"]["stage2_recall_among_routed"],
                "end_to_end_recall": eval_results["category_routing_analysis"]["Fuzzers"]["end_to_end_recall"],
                "conclusion": "Stage 1 false-negative bottleneck: 13,520 of 18,184 Fuzzers (74.35%) are misclassified as Benign by Stage 1, constraining end-to-end recall to 14.83% despite 57.80% recall among routed samples.",
            },
        },
        "limitations": [
            "Hierarchical error propagation: Stage 1 false negatives (15,730 flows, primarily Fuzzers) never reach Stage 2.",
            "Minority attack category vulnerability: Analysis (2.95%) and Worms (15.38%) exhibit severe end-to-end detection deficits.",
            "Stage 1 false positive contamination: 1,282 Benign flows are admitted to Stage 2 and assigned attack categories.",
            "Scope restriction: Evaluated solely on authentic UNSW-NB15 flow features; no live packet capture or multi-sensor fusion.",
            "Absence of active defense: Evaluates predictive classification only; no automated packet filtering, IP blocking, or firewall intervention.",
        ],
    }

    # 7. Generate figures
    generate_figures(full_results)

    # 8. Export JSON
    export_results(full_results)

    print("================================================================================")
    print("PHASE 7B.3 HIERARCHICAL IDS EVALUATION COMPLETE")
    print("================================================================================")


if __name__ == "__main__":
    main()
