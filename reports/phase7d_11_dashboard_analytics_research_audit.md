# Phase 7D.11 Research Integrity Audit: Dashboard Analytics & Audit Visualization

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `3bc1dc1d850a03c3b41540fc53be284eae24379b`  
**Audit Date:** October 27, 2026  
**Auditor:** Autonomous Verification Protocol  

---

## 1. Executive Summary

This Research Integrity Audit verifies all scientific, architectural, cryptographic, and operational invariants following the completion of Phase 7D.11 ("Full Dashboard Analytics Data Integrity Audit").

The audit confirms that the corrections applied to `frontend/src/utils/analytics.js`, `frontend/src/api/client.js`, `frontend/src/App.jsx`, `frontend/src/components/AnalyticsSection.jsx`, and `frontend/src/components/Dashboard.jsx`:
1. Reconciled all displayed analytics metrics strictly against structured SQLite audit records without manufacturing or fabricating values.
2. Eliminated double-counting of `ADVISORY_RECOMMENDATION` events in flow prediction totals.
3. Corrected hierarchical prediction schema mapping, properly resolving benign flows (`Normal`) and 9 UNSW-NB15 attack categories.
4. Maintained strict ground-truth quarantine: operational prediction analytics derive exclusively from model outputs, completely independent of UNSW-NB15 dataset ground-truth labels.
5. Preserved the steady-state invariant of zero per-flow blockchain lookups during prediction inference.
6. Did not alter any serialized machine learning models, preprocessors, or feature scalers.
7. Did not modify benchmark dataset CSV files or their authoritative cryptographic digests.
8. Did not alter the `ModelRegistry.sol` smart contract or deployed address `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`.

All research integrity invariants are confirmed **VALID and UNCHANGED**.

---

## 2. Invariant Verification Matrix

| # | Research Invariant | Required Status | Verified Status | Evidence & Audit Method |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Stage 1 Model Hash** | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **CONFIRMED** | Streaming SHA-256 over `ml/artifacts/ids_model.joblib` matches canonical hash. |
| **2** | **Stage 2 Model Hash** | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **CONFIRMED** | Streaming SHA-256 over `ml/artifacts/attack_classifier.joblib` matches canonical hash. |
| **3** | **Training Dataset SHA-256** | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **CONFIRMED** | Streaming SHA-256 over `data/raw/UNSW_NB15_training-set.csv` matches canonical hash. |
| **4** | **Testing Dataset SHA-256** | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **CONFIRMED** | Streaming SHA-256 over `data/raw/UNSW_NB15_testing-set.csv` matches canonical hash. |
| **5** | **Smart Contract Source & Bytecode** | Untouched `ModelRegistry.sol` | **CONFIRMED** | Zero changes to `blockchain/contracts/ModelRegistry.sol` or `blockchain/artifacts/ModelRegistry.json`. |
| **6** | **Deployed Contract Address** | `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec` | **CONFIRMED** | Verified against `blockchain/deployment/deployment.json`. |
| **7** | **Zero Per-Flow Blockchain Queries** | Steady-state queries = 0 | **CONFIRMED** | Cryptographic verification occurs exclusively at startup/load boundary (`/model/verify`). Zero on-chain lookups during `/predict` or `/predict/hierarchical`. |
| **8** | **Explicit Verification Lifecycle** | Unverified on startup/reload | **CONFIRMED** | Engine begins unverified and unloaded. Explicit `VERIFY AUTHORIZED MODEL` required before `LOAD MODEL`. |
| **9** | **Ground-Truth Quarantine** | Operational metrics untainted by ground truth | **CONFIRMED** | `aggregatePredictions` inspects exclusively model output fields (`stage1_prediction`, `stage2_prediction`, `prediction_code`, `prediction`). Benchmark labels (`label`, `attack_cat`) are quarantined. |
| **10** | **Mathematical Invariant: Prediction Total** | `Total = Attack + Benign + Other` | **CONFIRMED** | Verified mathematically in code and asserted across 21 unit tests in `frontend/src/test/analytics.test.js`. |
| **11** | **Mathematical Invariant: Verification Total** | `Total = Success + Failure` | **CONFIRMED** | Verified mathematically in `aggregateVerifications` and asserted in unit tests. |
| **12** | **No Fabricated / Hardcoded Metrics** | All numbers derived from audit store | **CONFIRMED** | Aggregation logic derives all counts, percentages, and latency figures dynamically from the retrieved audit events array. |

---

## 3. Cryptographic Verification Log

```text
[AUDIT VERIFICATION LOG — PHASE 7D.11]
Stage 1 Model:       ml/artifacts/ids_model.joblib
Expected SHA-256:    dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5
Observed SHA-256:    dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5
Verification Result: PASS (Exact Match)

Stage 2 Model:       ml/artifacts/attack_classifier.joblib
Expected SHA-256:    596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208
Observed SHA-256:    596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208
Verification Result: PASS (Exact Match)

Training Dataset:    data/raw/UNSW_NB15_training-set.csv
Expected SHA-256:    734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559
Observed SHA-256:    734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559
Verification Result: PASS (Exact Match)

Testing Dataset:     data/raw/UNSW_NB15_testing-set.csv
Expected SHA-256:    bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa
Observed SHA-256:    bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa
Verification Result: PASS (Exact Match)

Contract Address:    0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec
Registrant Address:  0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
Verification Result: PASS (Verified with deployment record)
```

---

## 4. Test Verification Summary

| Test Suite | Execution Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **Frontend Unit & Integration** | `npm --prefix frontend test -- --run` | **95 / 95 PASS** | All 5 test files passed, including 21 tests in `analytics.test.js`. |
| **Frontend Production Build** | `npm --prefix frontend run build` | **PASS (Code 0)** | Clean build in 761ms, producing `dist/index.html` and bundled assets. |
| **Backend Test Suite** | `.\.venv\Scripts\python.exe -m pytest -q` | **129 / 129 PASS** | Full suite passed in 47.53s. |

---

## 5. Audit Certification

I hereby certify that Phase 7D.11 ("Full Dashboard Analytics Data Integrity Audit") has been executed with complete adherence to scientific rigor, cryptographic verification standards, and research integrity protocols. Every figure displayed on the operations dashboard is demonstrably derived from authenticated security audit events without fabrication, inference, or ground-truth contamination.
