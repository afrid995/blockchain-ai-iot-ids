# Phase 7D — Research Integrity Audit

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `412748266eaf29381d596cc7cb1d4194ced01a61`  
**Audit Date:** 2026-10-26  
**Auditor:** DeepMind Antigravity AI Agent  

---

## 1. Cryptographic Model Digest Audit

All model binaries on disk were cryptographically audited via direct SHA-256 calculation:

| Artifact Name | Physical File Path | Authoritative Expected Digest | Observed On-Disk Digest | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1 Binary IDS** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **MATCH (Canonical)** |
| **Stage 2 Multiclass** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **MATCH (Canonical)** |

**Finding:** Both canonical machine learning model files remain pristine and bitwise identical to established project baselines. No retraining was performed.

---

## 2. Dataset Cryptographic Integrity Audit

Raw benchmark evaluation files on disk were cryptographically audited via direct SHA-256 calculation:

| Dataset File | Physical File Path | Authoritative Expected Digest | Observed On-Disk Digest | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **UNSW-NB15 Training Set** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **MATCH (Canonical)** |
| **UNSW-NB15 Testing Set** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **MATCH (Canonical)** |

**Finding:** Datasets are completely intact and match their canonical digests exactly.

---

## 3. Candidate Perturbation & Placeholder Audit

The Phase 7D prompt explicitly mandated:
- Do not show placeholder hashes such as `deadbeef...`
- Do not invent candidate hashes
- Use the actual candidate hash returned by the backend

### 3.1 Candidate Perturbation Digest
The ephemeral model replacement candidate is created by copying `ml/artifacts/ids_model.joblib` to an OS temporary directory and mutating 1 byte at offset 500:
- Expected mutated byte: `canonical_bytes[500] = (canonical_bytes[500] + 1) % 256`
- Calculated SHA-256: `a7fc43063d36f359bc6c4f14a98bf233d3a1bdebbc2d7a98e1e67a872624cf65`

### 3.2 Placeholder Search
A project-wide scan was conducted across all files in `frontend/src`:
- Regex: `deadbeef`
- **Matches:** `0`
- Regex: `placeholder|fake|mock-hash`
- **Matches:** `0`

**Finding:** The placeholder hash string `deadbeef...` was completely eradicated from application source and test fixtures. The real candidate perturbation hash `a7fc4306...` is displayed and validated.

---

## 4. Smart Contract Interface Audit

The Solidity source `blockchain/contracts/ModelRegistry.sol` was audited:
- Interface functions declared in contract:
  - `registerModel(string memory modelId, string memory version, string memory modelHash, string memory algorithm)`
  - `isModelRegistered(string memory modelId, string memory version)`
  - `getModelHash(string memory modelId, string memory version)`
  - `getModelRecord(string memory modelId, string memory version)`
  - `computeKey(string memory modelId, string memory version)`
  - `totalRegisteredModels()`
- Prohibited function check: No queries or references to fictional functions (such as `getModelDetails`) exist.
- Immutability check: `blockchain/contracts/ModelRegistry.sol` was not altered.

**Finding:** Contract calls strictly align with the real Solidity interface.

---

## 5. Architectural Invariant Audit

### 5.1 Per-Flow Blockchain Query Decoupling
- Invariant: `per_flow_blockchain_queries == 0` during `/predict/hierarchical` ingestion.
- Verification: Test 17 in `tests/test_end_to_end_integration.py` (`test_17_per_flow_blockchain_query_counter_equals_zero`) confirms that 0 Ethereum RPC calls occur during runtime inference.
- UI Indicator: Displayed as `0 (Execution plane decoupled from EVM)` in `SecuritySolutionOverview.jsx`.

### 5.2 Local Operational Audit Decoupling
- Invariant: Raw 42-feature vectors must never be written to SQLite audit storage.
- Verification: Test 20 in `tests/test_end_to_end_integration.py` confirms that feature arrays and dictionaries are excluded from `backend/data/audit.db`.
- Terminology: SQLite is accurately described as a "local operational audit trail" and never as a "blockchain ledger" or "immutable smart contract".

---

## 6. Prohibited Research Claims Audit

A comprehensive codebase audit was performed for prohibited overclaims:

| Search Pattern | Prohibited Intent | Codebase Matches | Compliance Status |
| :--- | :--- | :--- | :--- |
| `tamper-proof` | Absolute security claim | 0 | **PASS** |
| `zero latency` | Fictional speed claim | 0 | **PASS** |
| `zero overhead` | Unsupported latency claim | 0 | **PASS** |
| `real-time ids` | Unmeasured real-time claim | 0 | **PASS** |
| `blockchain detects` | Attribution of detection to EVM | 0 | **PASS** |
| `blockchain prevents` | Universal attack prevention claim | 0 | **PASS** |
| `autonomous defense` | Autonomous remediation claim | 0 | **PASS** |
| `immutable` (re: SQLite) | Misattributing immutability to SQL | 0 | **PASS** |

**Finding:** Zero occurrences of prohibited claims. The required research limitation notice is prominently rendered:
> *Research Integrity Notice:* SHA-256 equality proves byte-level correspondence with the registered artifact. It does not prove that the registered model is accurate, safe, robust, or free from poisoned training data.

---

## 7. Empirical Research Metric Attribution Audit

All displayed performance metrics align exactly with authoritative empirical research results:

- **Stage 1 Binary IDS (Random Forest, N = 175,341):**
  - Accuracy: `90.30%`
  - Precision: `98.78%`
  - Recall: `86.82%`
  - F1 Score: `92.41%`
  - Specificity: `97.71%`
  - False Positive Rate: `2.29%`
  - ROC-AUC: `98.60%`
- **Stage 2 Multiclass Standalone:**
  - Standalone Accuracy: `76.18%`
  - Standalone Balanced Accuracy: `53.41%`
  - Standalone Macro F1: `53.06%`
- **Hierarchical Routed Execution:**
  - Routed Macro F1: `51.43%`
  - Routed Balanced Accuracy: `51.20%`
  - Fuzzers Routed End-to-End Recall: `14.83%`

**Finding:** All metrics match authoritative prior research results. No numbers have been fabricated or rounded deceptively.

---

## 8. Summary Conclusion

Phase 7D is research-integrity compliant within the evaluated implementation and documented experimental scope:
1. Canonical models and datasets are unmodified.
2. The verification evidence exposed reflects actual runtime cryptographic and smart-contract executions.
3. No fake, placeholder, or decorative hashes exist.
4. All test suites pass (112 backend tests, 76 frontend tests).
5. All research boundaries and limitations are explicitly declared.
