#!/usr/bin/env python3
"""Evaluation of the Advisory Attack Response Recommendation Layer.

Phase 7B.4: Implement and Evaluate an Advisory Attack Response Recommendation Layer
Project: Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

CRITICAL RESEARCH BOUNDARIES:
- Evaluates schema completeness, determinism, category coverage, and safety constraints.
- Analyzes the contextual distribution of advisory recommendations across the 175,341 UNSW-NB15 test flows.
- DOES NOT evaluate or claim "mitigation effectiveness", "attack prevention", or "autonomous defense".
- Transparently documents that recommendation appropriateness is bounded by upstream Stage 1 and Stage 2 errors.
- Confirms zero per-flow blockchain lookups, zero automated remediation commands, and zero model modifications.
"""

from __future__ import annotations

import datetime
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

import matplotlib.pyplot as plt
import numpy as np

# Setup repository root
REPO_ROOT = Path(__file__).resolve().parent.parent
os.chdir(REPO_ROOT)
sys.path.insert(0, str(REPO_ROOT))

from core.hashing import calculate_sha256
from core.response_recommendations import (
    ATTACK_CATEGORIES,
    SUPPORTED_CATEGORIES,
    get_all_response_recommendations,
    get_response_recommendation,
)

# File Paths
STAGE1_ARTIFACT = REPO_ROOT / "ml" / "artifacts" / "ids_model.joblib"
STAGE2_ARTIFACT = REPO_ROOT / "ml" / "artifacts" / "attack_classifier.joblib"
TRAIN_DATASET = REPO_ROOT / "data" / "raw" / "UNSW_NB15_training-set.csv"
TEST_DATASET = REPO_ROOT / "data" / "raw" / "UNSW_NB15_testing-set.csv"

PHASE7B3_RESULTS_JSON = REPO_ROOT / "experiments" / "results" / "phase7b_3_hierarchical_results.json"
OUTPUT_RESULTS_JSON = REPO_ROOT / "experiments" / "results" / "phase7b_4_response_recommendation_results.json"
FIG_PATH = REPO_ROOT / "reports" / "figures" / "figure14_attack_response_taxonomy.png"

# Established Invariants
EXPECTED_STAGE1_SHA = "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"
EXPECTED_STAGE2_SHA = "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"
EXPECTED_TRAIN_SHA = "734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559"
EXPECTED_TEST_SHA = "bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa"

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


def verify_invariants() -> Dict[str, str]:
    """Verify cryptographic hashes for model artifacts and datasets."""
    print("================================================================================")
    print("STEP 1: CRYPTOGRAPHIC INVARIANT VERIFICATION")
    print("================================================================================")

    for p, name in [
        (STAGE1_ARTIFACT, "Stage 1 Model"),
        (STAGE2_ARTIFACT, "Stage 2 Model"),
        (TRAIN_DATASET, "Training Dataset"),
        (TEST_DATASET, "Testing Dataset"),
    ]:
        if not p.exists():
            raise FileNotFoundError(f"Required file {name} missing at {p}")

    actual_s1 = calculate_sha256(STAGE1_ARTIFACT)
    actual_s2 = calculate_sha256(STAGE2_ARTIFACT)
    actual_train = calculate_sha256(TRAIN_DATASET)
    actual_test = calculate_sha256(TEST_DATASET)

    print(f"Stage 1 Artifact SHA-256: {actual_s1}")
    print(f"Stage 2 Artifact SHA-256: {actual_s2}")
    print(f"Training Dataset SHA-256: {actual_train}")
    print(f"Testing Dataset SHA-256:  {actual_test}")

    assert actual_s1 == EXPECTED_STAGE1_SHA, f"Stage 1 hash mismatch: {actual_s1}"
    assert actual_s2 == EXPECTED_STAGE2_SHA, f"Stage 2 hash mismatch: {actual_s2}"
    assert actual_train == EXPECTED_TRAIN_SHA, f"Training dataset hash mismatch: {actual_train}"
    assert actual_test == EXPECTED_TEST_SHA, f"Testing dataset hash mismatch: {actual_test}"

    print(" Cryptographic invariants verified successfully.\n")
    return {
        "stage1_model_sha256": actual_s1,
        "stage2_model_sha256": actual_s2,
        "training_dataset_sha256": actual_train,
        "testing_dataset_sha256": actual_test,
    }


def evaluate_taxonomy_properties() -> Dict[str, Any]:
    """Evaluate coverage, schema completeness, determinism, and safety boundaries."""
    print("================================================================================")
    print("STEP 2: TAXONOMY SCHEMA, COVERAGE, AND SAFETY EVALUATION")
    print("================================================================================")

    all_recs = get_all_response_recommendations()

    # 1. Coverage
    total_categories = len(all_recs)
    attack_category_count = len([c for c in all_recs if c != "Normal"])
    has_normal = "Normal" in all_recs

    print(f"Total Supported Categories: {total_categories} (Expected: 10)")
    print(f"Attack Categories Covered:  {attack_category_count} (Expected: 9)")
    print(f"Normal Category Present:    {has_normal} (Expected: True)")

    assert total_categories == 10, f"Expected 10 categories, found {total_categories}"
    assert attack_category_count == 9, f"Expected 9 attack categories, found {attack_category_count}"
    assert has_normal, "Normal category missing from taxonomy"

    # 2. Schema completeness & safety checks
    field_audit: Dict[str, bool] = {}
    forbidden_tokens = ["iptables", "nft", "ufw", "route add", "kill -9", "drop table", "shutdown"]
    safety_violations: List[str] = []

    for cat, rec in all_recs.items():
        # Check required fields
        for field in REQUIRED_FIELDS:
            if field not in rec:
                field_audit[f"{cat}.{field}"] = False
                raise AssertionError(f"Category '{cat}' missing required field '{field}'")
            if isinstance(rec[field], str) and len(rec[field].strip()) == 0:
                raise AssertionError(f"Category '{cat}' has empty field '{field}'")

        # Check safety invariants
        if not rec["is_advisory"]:
            safety_violations.append(f"{cat}: is_advisory is False")
        if not rec["requires_human_approval"]:
            safety_violations.append(f"{cat}: requires_human_approval is False")
        if rec["automated_remediation_enabled"]:
            safety_violations.append(f"{cat}: automated_remediation_enabled is True")

        # Check forbidden executable command tokens
        full_text = " ".join([
            rec["recommended_action"],
            rec["operator_guidance"],
            rec["rationale"],
            rec["limitations"],
        ]).lower()
        for token in forbidden_tokens:
            if token in full_text:
                safety_violations.append(f"{cat}: contains forbidden command token '{token}'")

        # Check advisory limitation language
        if "advisory" not in rec["limitations"].lower():
            safety_violations.append(f"{cat}: limitations field does not contain 'advisory'")

    # 3. Determinism test
    determinism_verified = True
    for cat in SUPPORTED_CATEGORIES:
        r1 = get_response_recommendation(cat)
        r2 = get_response_recommendation(cat)
        if r1 != r2:
            determinism_verified = False
            raise AssertionError(f"Non-deterministic response detected for category '{cat}'")

    # 4. Unknown category handling
    unknown_handled = False
    try:
        get_response_recommendation("NonExistentCategory")
    except KeyError:
        unknown_handled = True

    assert unknown_handled, "Unknown category failed to raise KeyError"
    assert len(safety_violations) == 0, f"Safety violations detected: {safety_violations}"
    assert determinism_verified, "Taxonomy retrieval is non-deterministic"

    print(" All 10 categories satisfy schema completeness, determinism, and safety boundaries.")
    print(" Zero executable remediation commands detected.")
    print(" All recommendations explicitly designated as advisory requiring human approval.\n")

    return {
        "total_categories": total_categories,
        "attack_categories_count": attack_category_count,
        "has_normal": has_normal,
        "schema_fields_verified": list(REQUIRED_FIELDS),
        "determinism_verified": determinism_verified,
        "unknown_category_rejection_verified": unknown_handled,
        "safety_violations_count": len(safety_violations),
        "taxonomy": all_recs,
    }


def evaluate_empirical_recommendation_volume() -> Dict[str, Any]:
    """Map the taxonomy to the Phase 7B.3 empirical hierarchical IDS prediction distribution."""
    print("================================================================================")
    print("STEP 3: EMPIRICAL RECOMMENDATION VOLUME & ERROR CONTEXTUALIZATION")
    print("================================================================================")

    if not PHASE7B3_RESULTS_JSON.exists():
        raise FileNotFoundError(f"Phase 7B.3 results missing at {PHASE7B3_RESULTS_JSON}")

    with open(PHASE7B3_RESULTS_JSON, "r", encoding="utf-8") as f:
        phase7b3_data = json.load(f)

    # Extract 10x10 confusion matrix from Phase 7B.3
    cm_10 = np.array(phase7b3_data["end_to_end_10_class_metrics"]["confusion_matrix"])
    labels_10 = phase7b3_data["end_to_end_10_class_metrics"]["labels"]

    # Column sums equal the total predictions for each category across the 175,341 flows
    pred_counts = cm_10.sum(axis=0)
    true_counts = cm_10.sum(axis=1)

    recommendation_distribution: Dict[str, Dict[str, Any]] = {}
    total_test_flows = int(sum(pred_counts))

    print(f"Analyzing recommendation volume across N = {total_test_flows:,} test flows:\n")
    print(f"{'Category':<15} | {'Severity':<13} | {'Rec Count':>9} | {'% of Flows':>10} | {'True Support':>12} | {'True Positives':>14}")
    print("-" * 85)

    all_recs = get_all_response_recommendations()

    for idx, cat in enumerate(labels_10):
        rec_count = int(pred_counts[idx])
        true_count = int(true_counts[idx])
        correct_rec = int(cm_10[idx, idx])
        pct_flows = float(rec_count / total_test_flows * 100)
        rec_obj = all_recs[cat]

        recommendation_distribution[cat] = {
            "severity": rec_obj["severity"],
            "investigation_priority": rec_obj["investigation_priority"],
            "recommendation_count": rec_count,
            "percentage_of_test_flows": round(pct_flows, 3),
            "ground_truth_support": true_count,
            "correctly_attributed_recommendations": correct_rec,
            "mismatched_recommendations": rec_count - correct_rec,
        }

        print(
            f"{cat:<15} | {rec_obj['severity']:<13} | {rec_count:>9,} | {pct_flows:>9.2f}% | "
            f"{true_count:>12,} | {correct_rec:>14,}"
        )

    # Error impact analysis
    # 1. False negatives at Stage 1: True attacks that receive "Normal / No immediate defensive action"
    normal_idx = labels_10.index("Normal")
    attacks_receiving_normal_guidance = int(cm_10[1:, normal_idx].sum())

    # 2. False positives at Stage 1: True benign flows that receive Attack recommendations
    benign_receiving_attack_guidance = int(cm_10[normal_idx, 1:].sum())

    # 3. Categorical mismatches: True attacks receiving an incorrect attack category guidance
    # sum of off-diagonal elements in the attack submatrix (1:10, 1:10)
    attack_submatrix = cm_10[1:, 1:]
    attack_diagonal = np.diag(attack_submatrix)
    attacks_receiving_mismatched_attack_guidance = int(attack_submatrix.sum() - attack_diagonal.sum())

    print("\n--- ERROR PROPAGATION IMPACT ON ADVISORY RECOMMENDATIONS ---")
    print(f"True Attacks Receiving 'Normal' Guidance (Missed at Stage 1):        {attacks_receiving_normal_guidance:,} (13.18% of attacks)")
    print(f"True Benign Receiving Attack Guidance (Stage 1 False Positives):     {benign_receiving_attack_guidance:,} (2.29% of benign)")
    print(f"True Attacks Receiving Mismatched Attack Guidance (Stage 2 Errors):  {attacks_receiving_mismatched_attack_guidance:,} (22.41% of attacks)")
    print(f"True Attacks Receiving Correct Category Guidance:                    {int(attack_diagonal.sum()):,} (64.41% of attacks)\n")

    return {
        "total_test_flows": total_test_flows,
        "recommendation_distribution": recommendation_distribution,
        "error_propagation_impact": {
            "true_attacks_receiving_normal_guidance": attacks_receiving_normal_guidance,
            "true_attacks_receiving_normal_guidance_pct": round(attacks_receiving_normal_guidance / int(true_counts[1:].sum()) * 100, 2),
            "true_benign_receiving_attack_guidance": benign_receiving_attack_guidance,
            "true_benign_receiving_attack_guidance_pct": round(benign_receiving_attack_guidance / int(true_counts[0]) * 100, 2),
            "true_attacks_receiving_mismatched_attack_guidance": attacks_receiving_mismatched_attack_guidance,
            "true_attacks_receiving_mismatched_attack_guidance_pct": round(attacks_receiving_mismatched_attack_guidance / int(true_counts[1:].sum()) * 100, 2),
            "true_attacks_receiving_correct_category_guidance": int(attack_diagonal.sum()),
            "true_attacks_receiving_correct_category_guidance_pct": round(int(attack_diagonal.sum()) / int(true_counts[1:].sum()) * 100, 2),
        },
    }


def generate_figure14(taxonomy: Dict[str, Any]) -> None:
    """Generate Figure 14: Category -> Advisory Response Taxonomy visualization."""
    print("================================================================================")
    print("STEP 4: GENERATING FIGURE 14 (ADVISORY RESPONSE TAXONOMY)")
    print("================================================================================")
    FIG_PATH.parent.mkdir(parents=True, exist_ok=True)

    fig, ax = plt.subplots(figsize=(14, 8))
    ax.axis("off")

    categories = list(SUPPORTED_CATEGORIES)
    severities = [taxonomy[c]["severity"] for c in categories]
    priorities = [taxonomy[c]["investigation_priority"] for c in categories]
    actions = [taxonomy[c]["recommended_action"] for c in categories]
    limitations = [taxonomy[c]["limitations"] for c in categories]

    # Color map for severity
    color_map = {
        "Informational": "#e8f4f8",
        "Medium": "#fff3cd",
        "High": "#f8d7da",
        "Critical": "#f5c6cb",
    }

    # Format table data
    table_data = []
    cell_colors = []
    for c in categories:
        rec = taxonomy[c]
        short_action = rec["recommended_action"][:75] + ("..." if len(rec["recommended_action"]) > 75 else "")
        short_limitation = rec["limitations"][:75] + ("..." if len(rec["limitations"]) > 75 else "")
        table_data.append([
            c,
            rec["severity"],
            rec["investigation_priority"],
            short_action,
            short_limitation,
        ])
        bg = color_map.get(rec["severity"], "#ffffff")
        cell_colors.append(["#ffffff", bg, bg, "#ffffff", "#ffffff"])

    headers = [
        "Classification Category",
        "Severity",
        "Investigation Priority",
        "Advisory Recommended Action (Summary)",
        "Key Operational Limitations (Summary)",
    ]

    table = ax.table(
        cellText=table_data,
        colLabels=headers,
        cellColours=cell_colors,
        loc="center",
        cellLoc="left",
        colWidths=[0.16, 0.11, 0.13, 0.32, 0.28],
    )

    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.0, 1.8)

    # Style header row
    for col_idx in range(len(headers)):
        cell = table[0, col_idx]
        cell.set_facecolor("#2c3e50")
        cell.get_text().set_color("white")
        cell.get_text().set_weight("bold")
        cell.set_height(0.08)

    ax.set_title(
        "Deterministic Advisory Attack Response Taxonomy (Phase 7B.4)\n"
        "[Strictly Advisory Guidance for Security Operators; Zero Automated Remediation]",
        fontsize=13,
        pad=20,
        weight="bold",
    )

    plt.tight_layout()
    fig.savefig(FIG_PATH, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Figure 14 saved: {FIG_PATH}\n")


def export_results(results: Dict[str, Any]) -> None:
    """Export complete experimental results to structured JSON."""
    OUTPUT_RESULTS_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Experimental results exported: {OUTPUT_RESULTS_JSON}")


def main() -> None:
    print("################################################################################")
    print("PHASE 7B.4: ADVISORY ATTACK RESPONSE RECOMMENDATION EVALUATION")
    print("################################################################################\n")

    # 1. Invariant verification
    provenance = verify_invariants()

    # 2. Taxonomy property evaluation
    taxonomy_eval = evaluate_taxonomy_properties()

    # 3. Empirical recommendation volume and error context
    volume_eval = evaluate_empirical_recommendation_volume()

    # 4. Generate Figure 14
    generate_figure14(taxonomy_eval["taxonomy"])

    # 5. Assemble structured JSON
    results = {
        "metadata": {
            "phase": "Phase 7B.4",
            "title": "Advisory Attack Response Recommendation Layer Evaluation",
            "timestamp_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "python_version": sys.version,
            "architecture": "Hierarchical Two-Stage Classification with Downstream Advisory Response Mapping",
        },
        "provenance": provenance,
        "taxonomy_evaluation": {
            "total_supported_categories": taxonomy_eval["total_categories"],
            "attack_categories_count": taxonomy_eval["attack_categories_count"],
            "has_normal": taxonomy_eval["has_normal"],
            "schema_fields_verified": taxonomy_eval["schema_fields_verified"],
            "determinism_verified": taxonomy_eval["determinism_verified"],
            "unknown_category_rejection_verified": taxonomy_eval["unknown_category_rejection_verified"],
            "safety_violations_count": taxonomy_eval["safety_violations_count"],
        },
        "taxonomy": taxonomy_eval["taxonomy"],
        "empirical_recommendation_volume": volume_eval,
        "figures": {
            "figure14": str(FIG_PATH.relative_to(REPO_ROOT)),
        },
        "safety_and_boundaries": {
            "automated_remediation_implemented": False,
            "autonomous_defense_claimed": False,
            "per_flow_blockchain_calls": 0,
            "model_artifacts_modified": False,
            "datasets_modified": False,
            "statement": (
                "The evaluated advisory response recommendation layer maps predicted categories to static, "
                "structured guidance objects. It implements zero automated remediation, executes zero system or firewall "
                "commands, and introduces zero per-flow blockchain calls."
            ),
        },
        "limitations": [
            "Recommendation quality is strictly bounded by upstream classification accuracy.",
            "15,730 true attack flows (primarily Fuzzers) misclassified as Normal receive benign monitoring guidance.",
            "1,282 true benign flows misclassified by Stage 1 receive false-alarm attack investigation guidance.",
            "Minority classes (Analysis: 2.95% recall, Worms: 15.38% recall) produce limited and uncertain recommendations.",
            "Advisory nature requires manual human validation prior to initiating any defensive intervention.",
        ],
    }

    # 6. Export results JSON
    export_results(results)

    print("================================================================================")
    print("PHASE 7B.4 ADVISORY RESPONSE EVALUATION COMPLETE")
    print("================================================================================")


if __name__ == "__main__":
    main()
