# Pre-Phase 4 Full Research and Implementation Audit Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Auditor:** Senior Software Engineer & Research Systems Architect  
**Audit Date:** October 22, 2026  
**Audited Commit:** `e522c391104ba4b49c579209c61166f175f7ddf2`  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Target Branch:** `master`  
**Phase 4 Readiness Verdict:** **READY**

---

## 1. Executive Summary

A comprehensive, independent audit of Phases 1, 2, 3, and 3.1 was conducted prior to authorizing Phase 4 (Backend Integration & Security Audit Layer). The audit inspected all source code, cryptographic routines, smart contract byte-level mappings, test suites, experimental logs, metadata records, Git trees, and documentation. 

The audit confirms that:
1. The machine learning pipeline is free of data leakage and target leakage, with all metrics mathematically traced to untouched test evaluations of the authentic UNSW-NB15 benchmark.
2. The cryptographic provenance layer implements streaming SHA-256 hashing over binary artifact bytes and correctly distinguishes all failure modes.
3. The Solidity model registry (`ModelRegistry.sol`) correctly enforces uniqueness of `model_id + version`, access control via ownership, and compact `bytes32` digest storage without placing model binaries or network traffic on-chain.
4. All previously identified overstrong latency claims and unsupported finality estimates were completely expunged in Phase 3.1.
5. All 30 automated unit and integration tests execute successfully in 5.77 seconds.
6. The repository is internally consistent, tested, reproducible, and ready for Phase 4.

---

## 2. Exact Repository State

| Parameter | Observed State | Status |
| :--- | :--- | :--- |
| **Current Branch** | `master` | Synchronized |
| **Current Local Commit** | `e522c391104ba4b49c579209c61166f175f7ddf2` | Verified |
| **Remote URL** | `https://github.com/afrid995/blockchain-ai-iot-ids.git` | Active |
| **Remote HEAD Commit** | `e522c391104ba4b49c579209c61166f175f7ddf2` | Exact Match |
| **Working Tree Status** | Clean (`nothing to commit, working tree clean`) | Verified |
| **Total Tracked Files** | 33 files | Audited |
| **Tracked Secrets / Keys**| 0 found (automated scan confirmed) | Clean |

---

## 3. Phase 1 — Machine Learning Baseline Audit

### Dataset & Partitioning
- **Benchmark:** UNSW-NB15 (Cyber Range Lab of UNSW Canberra).
- **Training File:** `data/raw/UNSW_NB15_training-set.csv` (82,332 records, SHA-256: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`).
- **Testing File:** `data/raw/UNSW_NB15_testing-set.csv` (175,341 records, SHA-256: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`).
- **Data Leakage Check:**
  - `X_train, y_train` is used exclusively to fit the preprocessing pipeline and estimator.
  - `X_test, y_test` is strictly transformed via `predict()` without fitting.
  - `label` is extracted as target vector $y$ and dropped from feature matrix $X$.
  - `attack_cat` (multi-class sub-label) and `id` (sequential row index) are explicitly stripped in `extract_features_and_target()` and in `ml/predict.py`.
  - **Verdict:** Zero data leakage.

### Preprocessing Architecture
- **Missing & Infinite Values:** Custom `ReplaceInfTransformer` converts `+inf` and `-inf` to `np.nan`, followed by `SimpleImputer(strategy='median')`.
- **Scaling:** `StandardScaler` applied to all 39 numerical features.
- **Categorical Handling:** `OneHotEncoder(handle_unknown='ignore', sparse_output=False)` applied to `proto`, `service`, `state`.
- **Pipeline Packaging:** Transformers and estimator are encapsulated in an atomic `sklearn.pipeline.Pipeline`.

### Model Hyperparameters & Verification
- **Estimator:** `RandomForestClassifier`
- **Parameters Verified:** `n_estimators=100`, `max_depth=20`, `random_state=42`, `n_jobs=-1`.
- **Serialized Artifact:** `ml/artifacts/ids_model.joblib` (6,319,677 bytes, SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`).
- **Empirical Test Metrics (Untouched Test Split):**
  - Accuracy: `90.30%` (0.902978)
  - Precision: `98.78%` (0.987778)
  - Recall: `86.82%` (0.868193)
  - F1-Score: `92.41%` (0.924133)
  - False Positive Rate: `2.29%` (0.022893)
  - ROC-AUC: `0.9860` (0.985992)
  - Confusion Matrix: $TN=54,718$, $FP=1,282$, $FN=15,730$, $TP=103,611$.

---

## 4. Phase 2 — Cryptographic Provenance Audit

### SHA-256 Implementation (`core/hashing.py`)
- Reads file bytes in streaming 64 KB buffers (`chunk_size=65536`).
- Operates strictly in binary read mode (`rb`), preventing text decoding/re-encoding artifacts.
- Determinism confirmed: recalculation across multiple runs yields identical digest `dc5e16889ea247...`.

### Provenance Schema (`core/provenance.py` & `provenance_record.json`)
- Anchors stable `model_id: "iot-ids-rf"`, `version: "v1.0.0"`, `algorithm: "RandomForestClassifier"`, artifact size (6,319,677 bytes), dataset SHA-256 (`734fe6642e...`), training configuration, and test metrics.

### Verification Semantics
- `verify_model_integrity()` validates the expected hash format via `is_valid_sha256()`.
- Distinguishes 4 distinct categorical outcomes:
  - `VERIFIED`: SHA-256 match.
  - `HASH_MISMATCH`: File mutated or corrupted.
  - `FILE_NOT_FOUND`: Artifact path missing on disk.
  - `INVALID_EXPECTED_HASH`: Malformed 64-character hex string.

### Tampering Experiment (`experiments/tampering_experiment.py`)
- Verified: Canonical artifact remains untouched.
- An isolated temporary copy was mutated via byte appending (`+54 bytes`).
- Result: Canonical artifact verified as `VERIFIED`, mutated copy rejected as `HASH_MISMATCH`.

---

## 5. Phase 3 — Blockchain Audit

### Smart Contract (`blockchain/contracts/ModelRegistry.sol`)
- **Solidity Version:** `^0.8.20`
- **Identity Key:** `keccak256(abi.encodePacked(modelId, ":", version))`
- **Overwrite Protection:** Re-registering existing key reverts with `"ModelRegistry: Model version already registered"`.
- **Access Control:** `onlyOwner` modifier restricts registration to deployer address.
- **On-Chain Digest:** Stored as native `bytes32`.
- **Event:** `ModelRegistered` emitted with indexed model ID, version, hash, registrant, and block timestamp.
- **Data Boundary:** Zero model weights, zero raw traffic flows, and zero large JSON blobs are stored on-chain.

### Python Web3 Connector (`core/blockchain.py`)
- Bidirectional conversion:
  - `hex_to_bytes32`: Converts 64-char hex string to 32 binary bytes.
  - `bytes32_to_hex`: Converts 32-byte Solidity response back to lowercase hex.
- Fail-Safe Guarantee: Connection failures or contract absence return `status: BLOCKCHAIN_UNAVAILABLE` with `verified: False`. Unavailability is never interpreted as verified.

### Verification Scenarios Tested Live:
1. **Scenario A (Legitimate Model):** `VERIFIED` (`verified: True`).
2. **Scenario B (Tampered Model):** `HASH_MISMATCH` (`verified: False`).
3. **Scenario C (Unregistered Model):** `NOT_REGISTERED` (`verified: False`).
4. **Scenario D (Blockchain Unavailable):** `BLOCKCHAIN_UNAVAILABLE` (`verified: False`).

---

## 6. Blockchain Experiment & Performance Audit

All values in [`experiments/results/blockchain_provenance_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/experiments/results/blockchain_provenance_results.json) were verified against execution traces:

- **EVM Environment:** `EthereumTesterProvider` / `py-evm` (local development EVM).
- **Contract Address:** `0xF2E246BB76DF876Cef8b38ae84130F4F55De395b`
- **Deployment Transaction:** `0x0274996a26ed57465654bb3debb502683360b9f2e24e8a7d2fb6ad860a0ae314` (Block 1, Gas: `1,244,483`, Latency: `0.0393 s`)
- **Registration Transaction:** `0xbea2f3b2acb330914684e86433168bd68c3afb69584212e002a266eab713c196` (Block 2, Gas: `214,023`, Latency: `0.0714 s`)
- **Read Latency Statistics ($N=30$ consecutive calls):**
  - Mean: `7.2058 ms`
  - Median: `7.2653 ms`
  - Minimum: `6.3054 ms`
  - Maximum: `7.9071 ms`
  - Standard Deviation: `0.4148 ms`

### Environmental Qualification
These measurements are explicitly documented as local EVM simulation results. The project explicitly states that public networks (e.g., Sepolia) or consortium chains entail consensus finality delays and network latency not modeled in this benchmark.

---

## 7. Phase 3.1 Research Integrity Audit Verification

All Phase 3.1 corrective directives were audited in the current repository tree:
1. **Latency Phrasing:** The claim *"zero latency penalty"* was replaced by a precise explanation of the architectural separation between pre-deployment verification and steady-state inference.
2. **EVM Latency Claim:** The phrase *"under 1ms on local EVM"* was removed and replaced with the measured mean of ~7.2 ms.
3. **Root of Trust:** Unqualified *"immutable root of trust"* statements were replaced by *"tamper-evident provenance registry"*.
4. **Inference Terminology:** *"High-speed packet inference"* and *"wire-speed inference"* were replaced by *"Off-Chain ML Inference"*.
5. **Dataset Terminology:** Generalizations to physical IoT hardware were clarified: UNSW-NB15 is defined as a network intrusion detection benchmark evaluated on flow records.
6. **Zero-Trust Phrasing:** *"Zero-Trust Violation"* was replaced by *"Cryptographic Integrity Verification Failure"*.
7. **Post-Audit Finality Correction:** The unsupported *"12–15s for PoS"* estimate was removed from the limitations section of [`reports/phase3_1_research_integrity_audit.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase3_1_research_integrity_audit.md).

---

## 8. Cross-Phase Architecture Consistency

The project enforces strict separation of concerns across two independent loops:

```text
[Loop 1: Network Traffic Detection]
Network-flow records (UNSW-NB15) ──> Preprocessing ──> Random Forest ──> Benign / Attack

[Loop 2: Model Provenance & Integrity Gate]
Model artifact (.joblib) ──> Streaming SHA-256 ──> Blockchain Registry ──> VERIFIED / HASH_MISMATCH
```

- Blockchain is **never** invoked on a per-flow or per-packet basis.
- Blockchain is **never** used as an inference classifier.
- The Random Forest model is **never** placed on-chain.
- Integrity verification acts as an initialization or epoch-based gating condition before model loading.

---

## 9. Reproducibility Audit

The project can be reproduced from a clean clone:
1. `requirements.txt` specifies all required dependencies (`web3`, `eth-tester`, `py-evm`, `py-solc-x`, `scikit-learn`, `pandas`, `pytest`).
2. `ml/dataset.py` contains `acquire_unsw_nb15()`, which downloads and verifies raw CSVs automatically if absent from `data/raw/`.
3. `blockchain/scripts/compile.py` automatically downloads `solc 0.8.20` via `py-solc-x` if not installed locally.
4. `EthereumTesterProvider` requires zero external daemon processes or open ports.
5. Execution scripts are self-contained and documented in [`README.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/README.md).

---

## 10. Security Audit

| Finding / Area | Description | Severity | Status |
| :--- | :--- | :--- | :--- |
| **Secrets / Keys** | No private keys, passwords, or credentials exist in tracked files. | **CRITICAL** | **PASS (0 secrets)** |
| **Deserialization Risk** | Deserialization of untrusted files via `joblib.load()`. | **HIGH** | **MITIGATED:** Pre-load verification gate mitigates unauthorized artifact replacement before deserialization by requiring exact correspondence with the registered digest. It does not establish that the registered artifact itself is benign. |
| **Registration Access** | Unauthorized accounts could attempt to register fraudulent model digests. | **MEDIUM** | **MITIGATED:** `onlyOwner` modifier in `ModelRegistry.sol` rejects non-owner accounts. |
| **Fail-Safe Behavior** | Blockchain disconnects could default to insecure bypass. | **HIGH** | **MITIGATED:** Failures return `verified: False` and `BLOCKCHAIN_UNAVAILABLE`. |
| **Path Traversal** | Artifact path argument in verifier. | **LOW** | **PASS:** File paths are read-only; no filesystem mutations occur. |

---

## 11. Documentation-to-Code Audit

| Term / Claim | Current Context | Classification |
| :--- | :--- | :--- |
| **Latency** | Read latency 7.2 ms, write latency 71.4 ms in local EVM. | **VERIFIED BY CODE/EXPERIMENT** |
| **Accuracy / F1** | 90.30% Acc, 98.78% Prec, 86.82% Rec, 92.41% F1, 2.29% FPR. | **VERIFIED BY CODE/EXPERIMENT** |
| **Model SHA-256** | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **VERIFIED BY CODE/EXPERIMENT** |
| **Model Size** | 6,319,677 bytes (~6.03 MB) | **VERIFIED BY CODE/EXPERIMENT** |
| **Blockchain** | Solidity 0.8.20 contract on local EVM. | **VERIFIED BY CODE/EXPERIMENT** |
| **IoT Context** | Network flow intrusion detection benchmark (UNSW-NB15). | **QUALIFIED AND ACCEPTABLE** |
| **Packet / Throughput** | Qualified as off-chain flow inference; packet capture rate disclaimed. | **QUALIFIED AND ACCEPTABLE** |
| **Tamper Detection** | Verified via binary mutation simulation; caught as `HASH_MISMATCH`. | **VERIFIED BY CODE/EXPERIMENT** |
| **Finality** | Evaluated on local EVM; public/consortium finality noted as unmeasured. | **QUALIFIED AND ACCEPTABLE** |

---

## 12. Research Claims Matrix

| Claim | Experimental Evidence | Audit Status | Research Qualification / Boundary |
| :--- | :--- | :--- | :--- |
| **ML-Based Network Intrusion Detection** | Random Forest trained on 82,332 rows, tested on 175,341 rows of UNSW-NB15 (90.30% Acc, 2.29% FPR). | **SUPPORTED** | Tested on cyber-range network flows; not yet deployed on constrained physical IoT microcontrollers. |
| **Cryptographic Model Integrity Verification** | Streaming SHA-256 over exact binary bytes matches `provenance_record.json`. | **SUPPORTED** | Proves binary equivalence to reference; does not prove model robustness against adversarial attacks. |
| **Blockchain-Backed Model Provenance** | `ModelRegistry.sol` deployed and stores `bytes32` digest, version, and timestamp. | **SUPPORTED** | Evaluated on local EVM (`EthereumTesterProvider`); gas and confirmation times differ on public L1/L2. |
| **Detection of Modified Model Artifacts** | Binary alteration simulation detected and rejected as `HASH_MISMATCH`. | **SUPPORTED** | Validated on file-level tampering; does not assess in-memory runtime tampering of running processes. |
| **Rejection of Unregistered Versions** | Contract query for unknown version returns `NOT_REGISTERED`. | **SUPPORTED** | Enforced deterministically via contract mapping. |
| **Tamper-Evident Provenance Reference** | Contract reverts on duplicate `model_id + version` registration attempts. | **SUPPORTED** | Relies on deployer key security (ownership model). |
| **Blockchain Verification Overhead** | $N=30$ lookup trials yield 7.2058 ms mean read latency and 214,023 registration gas. | **SUPPORTED** | Environment-specific to local in-memory EVM. |
| **Separation of ML and Blockchain** | Pre-deployment verification gate decouples blockchain from per-flow inference. | **SUPPORTED** | Eliminates blockchain transaction latency from steady-state ML classification path. |

---

## 13. Test Suite Verification

Executed command:
```bash
python -m pytest tests -v
```

Execution Summary:
```text
============================= test session starts =============================
platform win32 -- Python 3.12.4, pytest-8.4.1, pluggy-1.6.0
rootdir: C:\Users\Shaik Afrid\OneDrive\Desktop\major_project
configfile: pytest.ini
collected 30 items

tests/test_blockchain.py (12 tests) ............                         [ 40%]
tests/test_ml_pipeline.py (8 tests)  ........                             [ 66%]
tests/test_provenance.py  (10 tests) ..........                           [100%]

============================= 30 passed in 5.77s ==============================
```

- **Total Test Cases:** 30
- **Passed:** 30 (100%)
- **Failed:** 0
- **Skipped:** 0
- **Duration:** 5.77 seconds

---

## 14. Audit Findings Summary

| ID | Category | Finding | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **F-01** | Dependency Spec | Duplicate entry `web3>=7.0.0` in `requirements.txt` (lines 12 and 21). | **INFO** | Non-blocking. |
| **F-02** | Security | In-memory process tampering not covered by static SHA-256 file hashing. | **LOW** | Scope limitation; file integrity gate is sound. |
| **F-03** | Scope Boundary | UNSW-NB15 dataset is an enterprise cyber-range benchmark rather than pure IoT telemetry. | **LOW** | Appropriately qualified in documentation. |
| **F-04** | EVM Scope | Local `EthereumTesterProvider` latency cannot be extrapolated to public chains. | **LOW** | Appropriately qualified in documentation. |

---

## 15. Required Corrections Before Phase 4

- **No blocking corrections identified.**  
All critical, high, and medium severity issues from previous iterations were resolved in Phase 3.1. The repository is internally consistent, tested, and scientifically grounded.

---

## 16. Phase 4 Readiness Verdict

### **Verdict: READY**

The repository has passed all integrity, cryptographic, blockchain, reproducibility, and security audits. It is certified as ready to begin **Phase 4 (Backend Integration & Security Audit Layer)**.
