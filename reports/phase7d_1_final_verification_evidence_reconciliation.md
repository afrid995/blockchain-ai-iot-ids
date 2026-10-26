# Phase 7D.1 — Final Model Verification Evidence Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `5fec9e86421ac318e323cd54f89d0af17aabcbba`  
**Date:** 2026-10-26  
**Auditor / Engineer:** DeepMind Antigravity AI Agent  

---

## 1. Objective & Scope

The purpose of Phase 7D.1 is to perform a strict research-integrity reconciliation of the model-verification evidence demonstrator implemented in Phase 7D. 

This is not a feature-development phase. No architectural changes, model retraining, or contract modifications were introduced. The reconciliation guarantees:
1. Complete factual consistency between frontend displayed evidence, backend configuration, and the actual evaluated blockchain environment.
2. Reconciliation of the authoritative `ModelRegistry.sol` contract address.
3. Removal of any overclaiming terminology (such as "Zero Ingestion Overhead").
4. Strict preservation of the technical distinction between SHA-256 artifact hashing, on-chain digest reference lookup, and the pre-load verification gate.

---

## 2. Authoritative Contract Address Reconciliation

### 2.1 Investigation & Discovery
In Phase 7D documentation and initial component templates, the address `0x5FbDB2315678afecb367f032d93F642f64180aa3` was inadvertently referenced from a Hardhat default deployment template.

However, inspection of the actual project runtime and deployment files established:
- **Deployment Record:** [`blockchain/deployment/deployment.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/blockchain/deployment/deployment.json) contains:
  ```json
  {
    "network": "local-evm",
    "contract_name": "ModelRegistry",
    "contract_address": "0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec",
    "deployer_address": "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "transaction_hash": "d704a5f77e4eeb491d478da10ef8411205f9594c514c29b47ca7bb55208e3e9c",
    "block_number": 15,
    "timestamp": "2026-10-25T11:52:12.096645+00:00"
  }
  ```
- **Backend Configuration:** [`backend/config.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/backend/config.py) lines 62–74 dynamically resolves `settings.CONTRACT_ADDRESS` from `deployment.json`, producing:
  `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`
- **Runtime Verification Service:** [`core/blockchain.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/core/blockchain.py) connects to Ganache on `http://127.0.0.1:8545` and targets `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`.

### 2.2 Reconciled State
The authoritative contract address across all layers is:
```text
0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec
```
- Updated [`frontend/src/components/SecuritySolutionOverview.jsx`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/frontend/src/components/SecuritySolutionOverview.jsx) to source from `activeVerify.contract_address` or `activeStatus.contract_address` with fallback `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`.
- Updated [`frontend/src/components/ModelSecurity.jsx`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/frontend/src/components/ModelSecurity.jsx) to source from `verifyResult.contract_address` or `activeStatus.contract_address` with fallback `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`.
- Updated [`backend/services/model_service.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/backend/services/model_service.py) `get_status()` to populate `contract_address` from `settings.CONTRACT_ADDRESS` if pre-verification status is queried.
- Updated Phase 7D reports to state `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`.

---

## 3. Cryptographic Hashes & Models Status

All model files and datasets remain strictly unmodified and match their canonical digests:

| Entity | Canonical SHA-256 Digest | Status |
| :--- | :--- | :--- |
| **Stage 1 Model (`ids_model.joblib`)** | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | Unchanged (Canonical) |
| **Stage 2 Model (`attack_classifier.joblib`)** | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | Unchanged (Canonical) |
| **Candidate Replacement (Perturbed)** | `a7fc43063d36f359bc6c4f14a98bf233d3a1bdebbc2d7a98e1e67a872624cf65` | Ephemeral Test Copy |
| **Training Dataset (`training-set.csv`)** | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | Unchanged (Canonical) |
| **Testing Dataset (`testing-set.csv`)** | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | Unchanged (Canonical) |

---

## 4. Language & Terminology Reconciliations

### 4.1 Removal of "Zero Ingestion Overhead"
- **Previous Wording:** `Zero Ingestion Overhead: Blockchain queries occur at control-plane registration/verification...`
- **Corrected Wording:** `No Per-Flow Blockchain Lookup: The evaluated /predict/hierarchical inference path performed zero observed blockchain queries per network flow. Blockchain interaction occurs strictly during control-plane pre-load verification.`
- **Defensible Scope:** Eliminates any misinterpretation that the application has zero computational cost, zero latency, or zero total overhead. Clearly specifies that the architectural benefit is decoupling the inference execution plane from per-flow blockchain transactions (`per_flow_blockchain_queries = 0`).

### 4.2 Softened Research-Audit Conclusion
- **Previous Wording:** `Phase 7D adheres to the highest standards of research integrity`
- **Corrected Wording:** `Phase 7D is research-integrity compliant within the evaluated implementation and documented experimental scope.`
- **Rationale:** Avoids subjective superlative claims while accurately confirming adherence to empirical and reproducibility standards.

### 4.3 Technical Verification Mechanism Precision
- Explicitly maintained the three-way technical separation:
  1. **SHA-256 Engine:** Computes physical file digest on disk.
  2. **Smart Contract Registry (`ModelRegistry.sol`):** Acts as consensus reference ledger storing authorized identity, version, and digest.
  3. **Backend Verification Gate:** Compares digests and enforces the load or fail-closed abort decision.
- Confirmed that the system does NOT claim: "blockchain detects malicious models" or "blockchain guarantees model correctness".
- Preserved the mandatory research limitation:
  > *Research Integrity Notice:* SHA-256 equality proves byte-level correspondence with the registered artifact. It does not prove that the registered model is accurate, safe, robust, or free from poisoned training data.

---

## 5. Verification & Test Execution Results

### 5.1 Backend Pytest Suite
```bash
python -m pytest -q
```
**Result:** `112 passed in 37.32s (100% PASS)`  
All unit tests, blockchain registry queries, hierarchical inference tests, and security tests continue to pass with zero errors.

### 5.2 Frontend Vitest Suite
```bash
npm --prefix frontend test -- --run
```
**Result:** `76 passed in 5.06s (100% PASS)`  
- `src/test/analytics.test.js`: 16 passed
- `src/test/App.test.jsx`: 10 passed
- `src/test/architecture_workflow.test.jsx`: 20 passed
- `src/test/solution_workflow.test.jsx`: 30 passed

### 5.3 Frontend Production Build
```bash
npm --prefix frontend run build
```
**Result:** `Vite v6.4.5 built in 689ms (dist/assets/index-ivXA5-sV.js 289.86 kB)`

---

## 6. Pre-Commit Verification Summary

- Starting Checkpoint: `5fec9e86421ac318e323cd54f89d0af17aabcbba`
- Authoritative Contract Address: `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`
- Deployer / Registrant Address: `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
- Wording Reconciled: Yes ("No Per-Flow Blockchain Lookup", softened conclusions)
- Working Tree: Prepared for commit `docs: reconcile phase 7d verification evidence`
