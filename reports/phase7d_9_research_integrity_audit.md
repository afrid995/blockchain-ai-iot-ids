# Phase 7D.9 Research Integrity Audit: Security Solution Deduplication

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `c6cfdb16f2afe2cc1c6e5cb346fd30908fd575cc`  
**Audit Date:** October 27, 2026  
**Auditor:** Autonomous Verification Protocol  

---

## 1. Executive Summary

This Research Integrity Audit verifies all scientific, architectural, and cryptographic invariants following the completion of Phase 7D.9 ("Remove Duplicate Blockchain Ledger and Detection Summary from Security Solution").

The audit confirms that the deduplication of the frontend UI:
1. Did not alter any backend code or REST endpoints (`/predict`, `/predict/hierarchical`, `/model/verify`, `/dataset/records`).
2. Did not modify any serialized machine learning models or feature preprocessors.
3. Did not modify raw or processed UNSW-NB15 dataset files or their cryptographic digests.
4. Did not modify the `ModelRegistry.sol` smart contract, its compiled bytecode, or deployed contract address.
5. Preserved the explicit model verification and load lifecycle (`UNVERIFIED` $\rightarrow$ `VERIFIED` $\rightarrow$ `LOADED`).
6. Preserved the zero per-flow blockchain queries invariant.

All required research integrity invariants are confirmed **VALID and UNCHANGED**.

---

## 2. Invariant Verification Matrix

| # | Research Invariant | Required Status | Verified Status | Evidence & Audit Method |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Stage 1 Model Hash** | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **CONFIRMED** | Streaming SHA-256 over `ml/artifacts/ids_model.joblib` yields exact canonical digest. |
| **2** | **Stage 2 Model Hash** | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **CONFIRMED** | Streaming SHA-256 over `ml/artifacts/attack_classifier.joblib` yields exact canonical digest. |
| **3** | **Training Dataset SHA-256** | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **CONFIRMED** | Streaming SHA-256 over `data/raw/UNSW_NB15_training-set.csv` yields exact canonical digest. |
| **4** | **Testing Dataset SHA-256** | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **CONFIRMED** | Streaming SHA-256 over `data/raw/UNSW_NB15_testing-set.csv` yields exact canonical digest. |
| **5** | **Smart Contract Source & Bytecode** | Untouched `ModelRegistry.sol` | **CONFIRMED** | Zero changes to `blockchain/contracts/ModelRegistry.sol` or `blockchain/artifacts/ModelRegistry.json`. |
| **6** | **Deployed Contract Address** | `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec` | **CONFIRMED** | Verified against `blockchain/deployment/deployment.json`. |
| **7** | **Zero Per-Flow Blockchain Queries** | Steady-state queries = 0 | **CONFIRMED** | Cryptographic verification occurs exclusively at lifecycle boundary (`/model/verify`). Zero on-chain lookups during `/predict` or `/predict/hierarchical`. |
| **8** | **Explicit Verification Lifecycle** | Unverified on startup/reload | **CONFIRMED** | Engine begins unverified and unloaded. Explicit `VERIFY AUTHORIZED MODEL` required before `LOAD MODEL`. |
| **9** | **Fail-Closed Security Gating** | Unloaded on mismatch | **CONFIRMED** | Unverified, mismatched, or unregistered models are rejected; inference engine remains unloaded. |
| **10** | **Hierarchical Prediction Engine** | 2-Stage pipeline | **CONFIRMED** | Stage 1 (Binary RF) filters benign traffic; Stage 2 (Multi-class RF) classifies malicious flows into 9 attack categories. |
| **11** | **Ground-Truth Quarantine** | Untainted feature vectors | **CONFIRMED** | Ground-truth labels remain strictly separated from predictive inference payloads. |
| **12** | **Single Authoritative UI Mapping** | 1 UI location per capability | **CONFIRMED** | Blockchain provenance ledger located exclusively in `ModelSecurity.jsx`; Detection workbench located exclusively in `IntrusionDetection.jsx`. |

---

## 3. Cryptographic Verification Log

```text
[AUDIT VERIFICATION LOG — PHASE 7D.9]
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

1. **Frontend Tests:**
   - Command: `npm --prefix frontend test -- --run`
   - Results: **5 test files passed, 89 total tests passed**.
2. **Frontend Production Build:**
   - Command: `npm --prefix frontend run build`
   - Results: **Vite v6.4.5 built successfully in 657ms**.
3. **Backend Integration Tests:**
   - Command: `.\.venv\Scripts\python.exe -m pytest -q`
   - Results: **129 passed in 49.18s**.

---

## 5. Conclusion

Phase 7D.9 successfully eliminated duplicate UI panels from `SecuritySolutionOverview.jsx` without impacting any backend systems, cryptographic assurances, or research data integrity. Every capability in the application now adheres strictly to single-responsibility operational boundaries.
