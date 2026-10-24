# Phase 7B.1 — Research Integrity Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Branch:** `master`  
**Starting Checkpoint:** `fa822d9531ecfb634ba54a7668c5e07174fadd11` (Phase 7B Closure)  
**Reconciliation Scope:** Documentation and Research-Integrity Correction Pass  
**Self-Reference Rule Notice:** Per project integrity conventions, the final commit SHA for this phase is not embedded within this document and is reported externally upon completion.

---

## 1. Starting Checkpoint

The starting checkpoint for this reconciliation pass is `fa822d9531ecfb634ba54a7668c5e07174fadd11`. This baseline completed Phase 7B training, empirical evaluation, artifact generation, and regression testing.

---

## 2. Direct Dataset SHA-256 Digest Verification

Both authentic raw dataset files residing in the repository were directly hashed from disk using streaming SHA-256 (`calculate_sha256` / `hashlib.sha256`):

1. **Testing Dataset**: `data/raw/UNSW_NB15_testing-set.csv`
   - **Directly Computed SHA-256**:
     ```text
     bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa
     ```
   - **Candidate A Evaluation**:
     `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` $\rightarrow$ **EXACT MATCH (TRUE)**
   - **Candidate B Evaluation**:
     `bec7dd5ec88dc2a000c7a07879d338395ed7421750f675fd0339e07dfe0648fa` $\rightarrow$ **MISMATCH (FALSE)**

2. **Training Dataset**: `data/raw/UNSW_NB15_training-set.csv`
   - **Directly Computed SHA-256**:
     ```text
     734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559
     ```
   - **Canonical Training Digest Evaluation**: $\rightarrow$ **EXACT MATCH (TRUE)**

---

## 3. Investigation of Candidate B Typo String

A full repository search was performed for Candidate B (`bec7dd5ec88dc2a000c...`):
- **Occurrences in Repository**: $0$ matches across all code, tests, manifests, and reports.
- **Repository Digest Status**: The canonical established testing digest in all previous project phases (Phase 5C, Phase 6A, Phase 7A, and Phase 7B) is Candidate A (`...ccc...`). The file on disk matches Candidate A. No file corruption or mismatch exists in the repository.

---

## 4. Files Corrected

The following files were inspected and reconciled during this pass:

1. `experiments/multiclass_attack_classifier.py`
   - Model selection conclusion updated to remove "decisively selected".
   - Rationale updated to replace "superior" with "higher" metric values.
   - Analysis description updated from "complete detection collapse" to "complete detection failure" and "recovery with non-zero recall (2.95%) and F1 (3.72%)".
   - Comparative summary table annotated with factual weighted F1 comparison.
2. `ml/artifacts/attack_classifier_metadata.json`
   - Updated `selection_rationale` strings to eliminate claims of superiority and clarify recovery from failure.
3. `experiments/results/phase7b_multiclass_results.json`
   - Updated `model_selection.rationale` and `model_selection.conclusion`.
4. `reports/phase7b_multiclass_classifier_report.md`
   - Table header changed from "Superior Configuration" to "Higher Metric Configuration".
   - Clarified that weighted F1 is very similar, with Model A higher by $0.13$ pp.
   - Reframed Analysis-category performance as recovery from complete detection failure without claiming category is resolved.
   - Eliminated claims of "prevention of category collapse" and "decisive selection".
5. `reports/phase7b_research_integrity_audit.md`
   - Checklist updated with explicit entries for dataset hash verification and weighted F1 precision.
6. `reports/phase7b_completion_report.md`
   - Executive summary and selection rationale updated to reflect precise metric-driven selection language.

---

## 5. Statistical-Language Corrections

| Previous Phrasing | Corrected Phrasing | Methodological Justification |
| :--- | :--- | :--- |
| "decisively selected" | "Model B was selected according to the predefined primary metric (Macro F1), with supporting improvement in balanced accuracy and minority-class recall." | No hypothesis test or paired difference bootstrap was performed; selection follows the pre-established metric hierarchy. |
| "Statistically comparable" (for weighted F1) | "very similar weighted F1; Model A is higher by 0.13 percentage points." | Factual reporting without introducing unsupported equivalence claims. |
| "prevention of category collapse" | "recovery from complete Analysis-category detection failure observed with Model A" | Model B achieves an Analysis recall of only $2.95\%$ ($5.04\%$ precision). Calling this "prevention of collapse" overclaims detection adequacy. |
| "superior Macro F1 / Balanced Accuracy" | "higher Macro F1 / Balanced Accuracy" | Avoids connotation of general statistical superiority across distributions. |

---

## 6. Preservation of Empirical Model Metrics

All empirical evaluation results were re-verified and remain exact:

- **Model A (Standard Random Forest)**:
  - Accuracy: $77.60\%$ ($0.776003$)
  - Balanced Accuracy: $51.04\%$ ($0.510351$)
  - Macro Precision: $70.31\%$ ($0.703105$)
  - Macro Recall: $51.04\%$ ($0.510351$)
  - Macro F1: $52.27\%$ ($0.522662$)
  - Weighted F1: $77.63\%$ ($0.776321$)
- **Model B (Balanced Random Forest)**:
  - Accuracy: $76.18\%$ ($0.761775$)
  - Balanced Accuracy: $53.41\%$ ($0.534064$)
  - Macro Precision: $57.60\%$ ($0.576026$)
  - Macro Recall: $53.41\%$ ($0.534064$)
  - Macro F1: $53.06\%$ ($0.530577$)
  - Weighted F1: $77.50\%$ ($0.775049$)
  - Bootstrap Macro F1 ($95\%$ Percentile CI, $B=1,000$, seed $42$): $[52.008\%, 54.069\%]$
- **Model B Artifact**: `ml/artifacts/attack_classifier.joblib`
  - SHA-256 Digest: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` (unchanged)

---

## 7. Stage 1 Binary Model Invariant Check

- **Artifact Path**: `ml/artifacts/ids_model.joblib`
- **Computed SHA-256 Digest**:
  ```text
  dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5
  ```
- **Status**: **IDENTICAL / UNMODIFIED**.

---

## 8. Test and Build Verification

- **Backend & ML Test Suite**:
  - Command: `python -m pytest tests -v`
  - Result: **50 passed in 11.83s** (100% pass rate).
- **Frontend Test Suite & Production Build**:
  - Command: `cd frontend && npm test -- --run && npm run build && cd ..`
  - Result: **26/26 tests passed in 2.15s**; Vite v6.4.5 production build succeeded in 604ms.

---

## 9. Scope and Boundary Confirmations

- **Stage 2 Scope**: Evaluated strictly on attack-only flows ($N_{\text{train}} = 45,332$, $N_{\text{test}} = 119,341$).
- **No End-to-End Hierarchical IDS Performance Claim**: Standalone Stage 2 performance does not imply validated end-to-end multi-stage IDS accuracy.
- **No Blockchain Registration**: Provenance registration was NOT performed.
- **No FastAPI Integration**: Production prediction endpoints continue serving Stage 1 only.
- **No Automated Remediation**: Remediation logic was NOT implemented.
- **No Production Security / Real-Time Claims**: Operational throughput and latency constraints remain subject to future evaluation.
- **Rare-Class Limitation**: Worms ($N_{\text{train}} = 44$) and Analysis ($2.95\%$ recall) remain severe statistical limitations.

---

## 10. Final Research-Integrity Verdict

Phase 7B research-integrity documentation was reconciled. No experimental architecture or model-selection result was changed unless directly contradicted by recomputation. All scientific claims are properly scoped to the empirical evidence obtained from the authentic UNSW-NB15 benchmark.
