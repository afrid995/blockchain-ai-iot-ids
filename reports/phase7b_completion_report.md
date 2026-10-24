# Phase 7B Completion Report: Attack-Type Multiclass Classifier

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Branch:** `master`  
**Baseline Starting Checkpoint:** `6ad7f415d1721d24a8a4711218cd70b085494ba7` (Phase 7A.1 Closed)  
**Self-Reference Rule Notice:** Per project integrity conventions, the final commit SHA for this phase is not embedded within this document and is reported externally upon completion.

---

## 1. Executive Summary

Phase 7B implemented, trained, and empirically evaluated a Stage 2 attack-type multiclass classifier for the UNSW-NB15 dataset. Operating strictly on attack flows ($45,332$ training, $119,341$ testing across 9 categories), two model configurations were benchmarked: Standard Random Forest (Model A) and Balanced Random Forest (Model B).

Model B was selected according to the predefined primary metric (Macro F1: $53.06\%$ vs $52.27\%$), with supporting improvement in balanced accuracy ($53.41\%$ vs $51.04\%$) and recovery from complete Analysis-category detection failure observed with Model A (recovering from $0.00\%$ to $3.72\%$ F1). Both models exhibit very similar weighted F1 (Model A is higher by 0.13 percentage points: $77.63\%$ vs $77.50\%$).

The complete pipeline (preprocessing + classifier) was serialized to `ml/artifacts/attack_classifier.joblib` with cryptographic digest `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`.

---

## 2. Experimental Execution Summary

### 2.1. Dataset Verification
- **Training CSV**: `data/raw/UNSW_NB15_training-set.csv` — SHA-256 `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` (**VERIFIED**)
- **Testing CSV**: `data/raw/UNSW_NB15_testing-set.csv` — SHA-256 `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` (**VERIFIED**)

### 2.2. Models Trained and Evaluated
- **Total Models Trained**: 2
  1. **Model A (Standard RF)**: `RandomForestClassifier(n_estimators=100, max_depth=20, class_weight=None, random_state=42)`
  2. **Model B (Balanced RF)**: `RandomForestClassifier(n_estimators=100, max_depth=20, class_weight="balanced", random_state=42)`

### 2.3. Measured Comparative Results

| Metric | Model A (Standard RF) | Model B (Balanced RF) | Delta (B - A) | Selected |
| :--- | :--- | :--- | :--- | :--- |
| **Accuracy** | 77.60% | 76.18% | -1.42 pp | Model A |
| **Balanced Accuracy** | 51.04% | 53.41% | **+2.37 pp** | **Model B** |
| **Macro Precision** | 70.31% | 57.60% | -12.71 pp | Model A |
| **Macro Recall** | 51.04% | 53.41% | **+2.37 pp** | **Model B** |
| **Macro F1 (Primary)** | 52.27% | 53.06% | **+0.79 pp** | **Model B** |
| **Weighted F1** | 77.63% | 77.50% | -0.13 pp | Model A |
| **Bootstrap Macro F1 95% CI**| N/A | [52.008%, 54.069%] | N/A | **Model B** |

*Note on Weighted F1: Both models exhibit very similar weighted F1; Model A is higher by 0.13 percentage points ($77.63\%$ vs $77.50\%$).*

### 2.4. Selected Model
- **Selected Model ID**: `model_b_balanced_rf`
- **Algorithm**: `RandomForestClassifier` with `class_weight="balanced"`
- **Selection Rationale**: Model B was selected according to the predefined primary metric (Macro F1: $53.06\%$ vs $52.27\%$), with supporting improvement in balanced accuracy ($53.41\%$ vs $51.04\%$) and recovery from complete Analysis-category detection failure observed with Model A (`Analysis` F1 recovered to $3.72\%$, `Worms` F1 increased from $21.48\%$ to $24.24\%$, `DoS` recall increased from $59.84\%$ to $67.68\%$). No claims of statistical superiority are asserted.

---

## 3. Artifact & Provenance Records

| Asset | Path | Digest / Status |
| :--- | :--- | :--- |
| **Stage 2 Model Artifact** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` |
| **Stage 2 Metadata** | `ml/artifacts/attack_classifier_metadata.json` | Generated & validated |
| **Experiment Results** | `experiments/results/phase7b_multiclass_results.json` | Generated & validated |
| **Confusion Matrix Figure** | `reports/figures/figure9_multiclass_confusion_matrix.png`| Generated (300 DPI) |
| **Per-Class F1 Figure** | `reports/figures/figure10_per_class_f1.png` | Generated (300 DPI) |
| **Baseline Binary Model** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` (**UNTOUCHED**) |

---

## 4. Verification and Regression Testing

### 4.1. Backend & Pipeline Tests
- Command: `python -m pytest tests -v`
- Result: **50 passed in 11.79s** (40 existing regression tests + 10 focused Phase 7B tests).
- Status: **100% PASS**

### 4.2. Frontend Tests & Build
- Command: `cd frontend && npm test -- --run && npm run build && cd ..`
- Test Result: **2 passed test suites, 26 passed tests** in 2.15s.
- Build Result: Vite v6.4.5 production build succeeded in 604ms (`dist/index.html`, `dist/assets/`).
- Status: **100% PASS**

### 4.3. Baseline Binary Model Invariant Check
- Command: `core.hashing.calculate_sha256("ml/artifacts/ids_model.joblib")`
- Result: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- Status: **IDENTICAL / UNMODIFIED**

---

## 5. Scope & Boundary Confirmations

1. **Blockchain Provenance Registration**: **NOT PERFORMED**. No transaction was submitted to the smart contract; registration is explicitly reserved for Phase 7B.1.
2. **FastAPI Production Integration**: **NOT PERFORMED**. The production `/api/predict` endpoint continues serving the Stage 1 binary IDS model.
3. **Automated Remediation**: **NOT IMPLEMENTED**. Remediation logic is excluded from this phase.
4. **Hierarchical System Claims**: **NO END-TO-END CLAIMS**. This phase validates the Stage 2 attack-type classifier in isolation.

---

## 6. Deliverable Inventory

- `experiments/multiclass_attack_classifier.py`
- `ml/artifacts/attack_classifier.joblib`
- `ml/artifacts/attack_classifier_metadata.json`
- `experiments/results/phase7b_multiclass_results.json`
- `reports/figures/figure9_multiclass_confusion_matrix.png`
- `reports/figures/figure10_per_class_f1.png`
- `tests/test_multiclass_classifier.py`
- `reports/phase7b_multiclass_classifier_report.md`
- `reports/phase7b_research_integrity_audit.md`
- `reports/phase7b_completion_report.md`
