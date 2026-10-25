# Phase 7B.5.5 — Final Research-Integrity and Architecture-UI Reconciliation Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `5806a9699c5a5c4c602858ffd385f61ed9d0cede`  
**Completion Date:** October 25, 2026  
**Auditor:** Senior Research Engineer & Research-Integrity Reviewer  

---

## 1. Starting Checkpoint and Verification

Prior to performing any modifications, the local repository state was verified against the remote tracking branch:
- Verified commit: `5806a9699c5a5c4c602858ffd385f61ed9d0cede`
- Remote alignment: `refs/heads/master` matches `5806a9699c5a5c4c602858ffd385f61ed9d0cede`
- Working tree: Cleaned and verified zero untracked or unstaged diffs.

---

## 2. Canonical Model Artifact SHA-256 Verification

The canonical SHA-256 digests of all serialized model artifacts were directly recalculated from disk using SHA-256 over raw binary bytes:

```python
import hashlib
from pathlib import Path

stage1_bytes = Path("ml/artifacts/ids_model.joblib").read_bytes()
assert hashlib.sha256(stage1_bytes).hexdigest() == "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5"

stage2_bytes = Path("ml/artifacts/attack_classifier.joblib").read_bytes()
assert hashlib.sha256(stage2_bytes).hexdigest() == "596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208"
```

| Artifact | File Path | Model ID | Version | Authoritative SHA-256 Digest | Status |
|:---|:---|:---|:---:|:---:|:---:|
| **Stage 1 Binary IDS** | `ml/artifacts/ids_model.joblib` | `iot-ids-rf` | `v1.0.0` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **VERIFIED** |
| **Stage 2 Multiclass Classifier** | `ml/artifacts/attack_classifier.joblib` | `iot-ids-attack-classifier` | `v1.0.0` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **VERIFIED** |

### Elimination of Discrepant Hash References
An erroneous hash string (`80e55ae639d67566cf2c2c069bc92ff15ea4ef0d9f48512dd441b997c11f7cbe`) originating from a draft test artifact in Phase 7B.5.4 was discovered in `reports/phase7b_5_4_research_integrity_audit.md`. This reference was completely purged and replaced with the authoritative Stage 1 canonical hash (`dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`). Zero occurrences of `80e55ae...` remain in the repository.

---

## 3. Canonical Dataset SHA-256 Verification

The benchmark dataset partitions were verified directly against their authoritative ground-truth digests:

| Dataset Partition | File Path | Authoritative SHA-256 Digest | Status |
|:---|:---|:---:|:---:|
| **UNSW-NB15 Training Set** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **VERIFIED** |
| **UNSW-NB15 Testing Set** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **VERIFIED** |

Both datasets remain byte-for-byte identical to the original Phase 1 baselines.

---

## 4. Corrected Stage 1 Algorithm Terminology

The established Stage 1 classifier is **`RandomForestClassifier`**. All references to `LightGBM`, `gradient boosting`, `neural network`, or `deep learning` were searched and reconciled across the codebase, UI components, and reports:
- [`frontend/src/components/ArchitectureDemo.jsx`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/frontend/src/components/ArchitectureDemo.jsx): Updated model title and subtitle from LightGBM to `Random Forest`.
- [`frontend/src/components/ArchitectureWorkflow.jsx`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/frontend/src/components/ArchitectureWorkflow.jsx): Updated workflow node description to `Random Forest Gatekeeper`.
- [`frontend/src/components/ResearchMetrics.jsx`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/frontend/src/components/ResearchMetrics.jsx): Replaced `(LightGBM)` with `(Random Forest)`.
- [`frontend/src/test/architecture_workflow.test.jsx`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/frontend/src/test/architecture_workflow.test.jsx): Updated mock algorithm from `LightGBMClassifier` to `RandomForestClassifier`.
- [`reports/phase7b_5_4_frontend_architecture_redesign_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase7b_5_4_frontend_architecture_redesign_report.md): Replaced all occurrences of LightGBM with Random Forest.

A full repository scan confirms **0 occurrences of LightGBM** remain in the codebase.

---

## 5. Corrected Historical Experimental Metrics

All performance claims and metrics presented in the UI, test suites, and documentation were strictly reconciled with the authoritative empirical evaluations conducted in Phase 7A and Phase 7B:

### 5.1 Authoritative Stage 1 Binary Baseline (N = 175,341 flows)
- **Accuracy:** 90.30%
- **Precision:** 98.78%
- **Recall:** 86.82%
- **F1 Score:** 92.41%
- **Specificity:** 97.71%
- **False Positive Rate (FPR):** 2.29%
- **ROC-AUC:** 98.60%

### 5.2 Authoritative Stage 2 Oracle-Routed Results
- **Macro F1 Score:** 53.06%
- **Balanced Accuracy:** 53.41%

### 5.3 Authoritative Operational Hierarchical Evaluation (End-to-End Cascaded)
- **Total Test Flows Evaluated:** 175,341
- **Stage 1 Predicted Benign (Normal, Bypassed):** 70,448
- **Stage 1 Predicted Attack (Routed to Stage 2):** 104,893
- **Total Stage 2 Invocations:** 104,893
- **True Attacks in Test Set:** 119,341
- **Stage 1 False Negatives (Missed Attacks exiting early):** 15,730 (including 13,520 out of 18,184 Fuzzers flows, 74.35%)
- **True Attacks Reaching Stage 2:** 103,611
- **Correct Attack Categories Attributed by Stage 2:** 76,870
- **Incorrect Attack Categories Assigned (Category Confusion):** 26,741
- **Benign False Positives Reaching Stage 2:** 1,282
- **Operational Stage 2 Macro F1 on Routed True Attacks:** 51.43%
- **Operational Stage 2 Balanced Accuracy:** 51.20%

### 5.4 Elimination of Ungrounded Claims
All unsupported figures (`98.67%`, `67.66%`, `3 missed attacks out of 10,000`, `0.03% leakage`) were identified and purged from reports and UI copy.

---

## 6. Blockchain Terminology Reconciliation

The evaluated system strictly decouples the blockchain control plane from off-chain data plane inference:
- **Correct Standard Formulation:**
  > *“The evaluated architecture places blockchain registry verification in the startup/model-initialization control path rather than the per-flow inference path. Runtime instrumentation measured zero blockchain registry lookups during per-flow inference.”*
- **Purged Terminology:** All occurrences of `zero runtime overhead`, `zero latency`, `guaranteed latency protection`, `tamper-proof`, `blockchain proves the alert`, and `blockchain proves the model is safe` were eliminated.

---

## 7. Audit-Store Terminology Reconciliation

The distinction between the local logging mechanism and on-chain provenance was enforced:
- **Local SQLite Store:** Described strictly as a *“local operational audit trail recording operational lifecycle events while excluding raw 42-feature network-flow vectors.”* It is never described as a blockchain ledger or cryptographically tamper-proof.
- **On-Chain Registry:** Described strictly as the *“on-chain model provenance registry (`ModelRegistry.sol`).”*

---

## 8. Verification and Loading Behavior Reconciliation

Inspection of `backend/services/model_service.py`, `backend/services/verification_service.py`, and `backend/main.py` confirms:
1. `POST /model/verify` executes `model_service.verify_and_load(verification_service)`:
   - Computes local artifact SHA-256.
   - Queries `ModelRegistry.sol` for registered hash.
   - If verified, executes `joblib.load(self.model_path)` and sets `self.is_loaded = True`.
   - If verification fails, purges memory and sets `self.is_loaded = False` (fail-closed).
2. `POST /model/load` provides an explicit loading endpoint for pre-verified models.
3. `GET /model/status` inspects current in-memory status and cached verification metadata without issuing blockchain transactions.
4. `POST /predict` executes legacy single-stage binary inference with fail-closed gating.
5. `POST /predict/hierarchical` executes two-stage hierarchical inference (Stage 1 Binary $\to$ conditional Stage 2 Multiclass $\to$ deterministic advisory response mapping) with exactly 0 per-flow blockchain lookups.

The documentation and UI explicitly reflect that `/model/verify` combines verification with authorized loading in the backend, while presenting the conceptual verification-to-load transition clearly for evaluators.

---

## 9. Non-Remediation and Human-in-the-Loop Boundaries

The advisory attack response layer strictly enforces non-remediation invariants:
- Every recommendation response includes:
  - `is_advisory = true`
  - `requires_human_approval = true`
  - `automated_remediation_enabled = false`
- The system generates structured diagnostic checklists and tactical guidance for human operators.
- No automated firewall adjustments, IP blocks, TCP resets, connection drops, or host quarantines are generated or executed.

---

## 10. Evaluator Q&A Reference Guide Reconciliation

The embedded Evaluator Q&A Reference Guide in `frontend/src/components/ArchitectureDemo.jsx` was reconciled to answer the nine core evaluation questions:
1. **Why blockchain?** Model provenance and integrity verification via on-chain smart contract registry.
2. **Is blockchain queried for every flow?** No. Exactly 0 per-flow registry lookups measured.
3. **What does Stage 1 do?** Binary classification (Benign vs Attack) via Random Forest gatekeeper.
4. **What happens after verification?** The verified artifact is authorized for loading and inference.
5. **What happens for Benign flows?** Stage 2 is completely bypassed (saving 11.54% latency); flow marked as Normal.
6. **What happens for Attack flows?** Conditionally routed to Stage 2 for multiclass category attribution.
7. **What happens after Stage 2?** Maps to deterministic, human-in-the-loop advisory guidance.
8. **Does the system block the attacker?** No. Autonomous remediation is strictly disabled.
9. **What are the limitations?** Severe class imbalance (up to 428.89:1), Stage 1 false negatives (15,730 missed attacks, notably Fuzzers), Stage 2 category confusion (26,741 misclassified attack flows), and dependence on human operator validation.

---

## 11. Test and Build Verification

### 11.1 Backend Test Execution (`pytest`)
```text
============================ 102 passed in 29.85s =============================
- tests/test_backend.py: 10 passed
- tests/test_blockchain.py: 12 passed
- tests/test_end_to_end_integration.py: 20 passed
- tests/test_hierarchical_ids.py: 10 passed
- tests/test_ml_pipeline.py: 8 passed
- tests/test_multiclass_classifier.py: 10 passed
- tests/test_provenance.py: 10 passed
- tests/test_response_recommendations.py: 12 passed
- tests/test_stage2_provenance.py: 10 passed
```

### 11.2 Frontend Test Execution (`vitest`)
```text
Test Files  3 passed (3)
     Tests  46 passed (46)
- src/test/analytics.test.js: 16 passed
- src/test/App.test.jsx: 10 passed
- src/test/architecture_workflow.test.jsx: 20 passed
Duration: 3.35s
```

### 11.3 Frontend Production Build (`vite build`)
```text
vite v6.4.5 building for production...
✓ 40 modules transformed.
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-C3mdwBZo.css   30.87 kB │ gzip:  5.55 kB
dist/assets/index-GZMlkWVG.js   230.23 kB │ gzip: 67.20 kB
✓ built in 620ms
```

---

## 12. Remaining Research Limitations

1. **Cascade False-Negative Bottleneck:** Stage 1 exhibits significant weakness on Fuzzers attacks (13,520 false negatives out of 18,184 test flows, 74.35% miss rate), terminating them early as Normal.
2. **Multiclass Class Imbalance:** Extreme class disparity in UNSW-NB15 (up to 428.89:1 ratio between Generic and Worms) leads to minority class sensitivity collapse (Analysis: 2.95%, Worms: 15.38%).
3. **Local EVM Evaluation Boundary:** Blockchain timings were gathered against a local Ganache EVM testbed. Public Ethereum mainnet execution would entail substantial transaction gas fees and block confirmation delays for registration.
4. **Advisory Heuristic Scope:** Recommendations are deterministic expert rules based on category signatures. They do not adaptively respond to novel zero-day techniques or multi-stage coordinated campaigns.

---

## 13. Audit Conclusion

Phase 7B.5.5 successfully reconciles all architectural, empirical, terminological, and integrity invariants across code, UI, and documentation. No substantive discrepancies remain.
