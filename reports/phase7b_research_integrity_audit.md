# Phase 7B — Research Integrity Audit

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B — Attack-Type Multiclass Classifier Training and Evaluation  
**Auditor:** Research Integrity & Methodology Reviewer  
**Audit Date:** 2026-10-24  
**Starting Baseline Checkpoint:** `6ad7f415d1721d24a8a4711218cd70b085494ba7`

---

## 1. Audit Scope & Methodology

This audit inspects the code, experimental execution, artifacts, and documentation produced during Phase 7B to ensure strict compliance with scientific rigor, data-leakage boundaries, and non-overclaiming standards.

Every verification item was checked against actual repository code (`experiments/multiclass_attack_classifier.py`, `tests/test_multiclass_classifier.py`, `ml/artifacts/attack_classifier_metadata.json`, and `experiments/results/phase7b_multiclass_results.json`).

---

## 2. Integrity Checklist & Audit Findings

| Category | Integrity Criterion | Verified State | Audit Finding |
| :--- | :--- | :--- | :--- |
| **Data Leakage** | Target columns excluded from inputs | `label`, `attack_cat`, and `id` dropped prior to model fitting. | **PASS** |
| **Test Contamination** | Preprocessing fit strictly on training set | `ColumnTransformer` is fit exclusively on the training partition ($N = 45,332$). Test partition ($N = 119,341$) is only transformed. | **PASS** |
| **Pre-split Merging** | No train/test concatenation | Data partitions loaded and filtered separately; no combined `.fit()` step. | **PASS** |
| **Synthetic Tuning** | No synthetic test-set oversampling | SMOTE and synthetic oversampling were explicitly not used on test data. | **PASS** |
| **Hyperparameter Tuning**| No test-set optimization | Hyperparameters ($n\_estimators=100$, $max\_depth=20$) set a priori. | **PASS** |
| **Performance Claims** | No claims of "real-time", "guaranteed", or "zero-latency" | Reports explicitly scoped to empirical offline evaluation. | **PASS** |
| **Security Claims** | No claims of "production security" or "invulnerability" | Reports maintain academic scope; state attack-space limits. | **PASS** |
| **Remediation Claims** | No claims of automated remediation | Explicitly noted that remediation is not implemented or evaluated. | **PASS** |
| **IoT Generalization** | Scope restricted to UNSW-NB15 benchmark | Explicitly states findings are bounded by UNSW-NB15 distributions. | **PASS** |
| **Blockchain Claims** | No blockchain claims for ML accuracy | Confirmed: Blockchain is NOT used in Stage 2 training or per-sample inference. | **PASS** |
| **Rare-Class Scrutiny**| Rare-class performance not overclaimed | Worms ($N_{\text{train}} = 44$) explicitly noted as statistically unstable. | **PASS** |
| **Model Selection** | Selection not based solely on accuracy | Selection driven by Macro F1 ($53.06\%$ vs $52.27\%$) and Balanced Accuracy. | **PASS** |
| **Result Authenticity** | Numerical metrics match actual evaluation | Metrics in reports exactly match JSON output down to decimal places. | **PASS** |
| **Artifact Integrity** | Artifact hash verified against disk | SHA-256 (`596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`) verified. | **PASS** |

---

## 3. Specific Invariant Verifications

### 3.1. Blockchain Role Verification
- **Invariant:** Blockchain is NOT used in Stage 2 training or per-sample inference.
- **Verification:**
  - `experiments/multiclass_attack_classifier.py` contains zero Web3 calls, zero contract invocations, and zero blockchain dependencies.
  - The classifier evaluates pure machine learning discrimination on network-flow features.
  - Blockchain registration was deliberately omitted in Phase 7B and deferred to Phase 7B.1.

### 3.2. Baseline Binary IDS Isolation
- **Invariant:** The existing Stage 1 binary IDS model and metadata remain unaltered.
- **Verification:**
  - `ml/artifacts/ids_model.joblib` SHA-256 remains exactly `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`.
  - `ml/artifacts/model_metadata.json` was not modified.
  - All 40 existing backend, blockchain, and ML tests continue to pass (50/50 total with 10 new tests).

### 3.3. FastAPI Prediction Path Isolation
- **Invariant:** Stage 2 is NOT integrated into the production FastAPI prediction path yet.
- **Verification:**
  - `backend/api.py` and `backend/models.py` were not modified.
  - Production prediction endpoints continue to serve the baseline binary model.

### 3.4. Rare-Class Discussion Scrutiny
- **Analysis:**
  - Standard RF (Model A) suffered complete failure on `Analysis` (F1 = $0.00\%$, recall = $0.00\%$).
  - Balanced RF (Model B) achieved $3.72\%$ F1 on `Analysis` and $24.24\%$ F1 on `Worms`.
  - Documentation explicitly identifies that Worms has only 44 training flows ($0.10\%$) and Analysis has poor precision ($5.04\%$), preventing unsupported generalization claims.

---

## 4. Audit Conclusion

The Phase 7B implementation conforms strictly to all established research integrity requirements. No data leakage, test contamination, or unsupported claims were identified. The findings are defensible, empirically verified, and reproducible.
