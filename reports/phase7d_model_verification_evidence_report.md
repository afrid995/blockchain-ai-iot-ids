# Phase 7D — Model Verification Evidence Technical Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `412748266eaf29381d596cc7cb1d4194ced01a61`  
**Phase:** 7D — Model Verification Evidence Demonstrator  
**Date:** 2026-10-26  

---

## 1. Executive Summary & Objective

In previous frontend phases, the interface displayed the *outcome* of model verification as a status badge (`VERIFIED` or `UNVERIFIED`) and whether memory loading was unlocked or locked. However, it did not expose sufficient technical evidence for an evaluator to directly observe the cryptographic hash calculation, the smart contract state retrieval, the digest equality evaluation, and the resulting causal enforcement chain.

**Phase 7D Objective:**
Expose the actual backend cryptographic verification pipeline as observable, verifiable technical evidence rather than relying on decorative UI badges or simulated animations.

The evaluator can directly trace:
```text
Model Artifact on Disk
        ↓
Local SHA-256 Calculation
        ↓
Observed Artifact Digest
        ↓
Blockchain ModelRegistry Lookup (getModelRecord)
        ↓
Registered Model / Version / Reference Digest
        ↓
Cryptographic Digest Comparison (MATCH / MISMATCH)
        ↓
VERIFIED / HASH_MISMATCH / NOT_REGISTERED Decision
        ↓
Authorized Model Load into Memory OR Fail-Closed Block
```

---

## 2. Verification Architecture & Implementation

### 2.1 Backend Cryptographic & Provenance Exposure
The verification service (`backend/services/verification_service.py`) and blockchain integration (`core/blockchain.py`) execute genuine cryptographic hashing and web3 calls against `ModelRegistry.sol`.

Phase 7D made minimal, factual backend enhancements to expose metadata already generated during the real verification process:
1. `core/blockchain.py::verify_model_against_blockchain`: Captures and returns `algorithm`, `registered_at`, `registrant`, and calculates `artifact_size_bytes = path.stat().st_size`.
2. `backend/services/verification_service.py`: Passes through `algorithm`, `registered_at`, `registrant`, and `artifact_size_bytes` in the verification outcome dictionary.
3. `backend/services/model_service.py::get_status`: Exposes `model_path`, `artifact_size_bytes`, `contract_address`, `registered_at`, `registrant`, and `algorithm`.
4. `backend/schemas.py`: Updates `ModelVerifyResponse`, `ModelStatusResponse`, and `ModelReplacementResetResponse` to validate these metadata attributes without rigid failure modes.

### 2.2 Smart Contract Interface Fidelity
The Ethereum smart contract `blockchain/contracts/ModelRegistry.sol` was **not modified**. Only the actual Solidity functions implemented in the contract are queried:
- `getModelRecord(string memory modelId, string memory version)`: Returns `(id, version, modelHash, algorithm, registeredAt, registrant)`
- `getModelHash(string memory modelId, string memory version)`: Returns bytes32 model hash
- `isModelRegistered(string memory modelId, string memory version)`: Returns boolean registration status
- `computeKey(string memory modelId, string memory version)`: Internal key computation
- `totalRegisteredModels()`: Counter of registered models

*Note:* No non-existent contract functions (such as `getModelDetails`) are queried or claimed.

---

## 3. Cryptographic & Dataset Digests

All canonical model artifacts and datasets remain strictly unmodified throughout this phase:

| Component | Path / Location | SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| **Stage 1 Binary Model** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | Canonical Reference |
| **Stage 2 Multiclass Model** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | Canonical Reference |
| **Ephemeral Candidate (Perturbed)** | Temporary OS Buffer (Offset 500) | `a7fc43063d36f359bc6c4f14a98bf233d3a1bdebbc2d7a98e1e67a872624cf65` | Ephemeral Test Only |
| **Training Dataset** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | Canonical Dataset |
| **Testing Dataset** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | Canonical Dataset |

---

## 4. Evaluator Evidence Demonstrator Panels

The React frontend (`frontend/src/components/SecuritySolutionOverview.jsx`) incorporates dedicated evidence panels:

### 4.1 Dedicated Workspace: MODEL INTEGRITY VERIFICATION
- Stage selector allowing the evaluator to inspect either Stage 1 (`iot-ids-rf:v1.0.0`) or Stage 2 (`iot-ids-attack-classifier:v1.0.0`).
- Prominent action button: `🛡️ VERIFY AUTHORIZED MODEL` (`data-testid="solution-verify-btn"`).
- Direct access to `📥 AUTHORIZE & LOAD MODEL` (`data-testid="solution-load-btn"`), enabled only after successful verification.
- Model identity metrics: Model ID, Version, Algorithm, Physical binary path, Artifact size in bytes and KB.

### 4.2 Cryptographic Evidence Panel: SHA-256 INTEGRITY CHECK
- Panel ID: `data-testid="solution-crypto-panel"`
- Calculation status: `✓ COMPLETED (Calculated on Disk Artifact)`
- Dual digest comparison display:
  - Observed Artifact Digest (`data-testid="crypto-observed-hash"`)
  - Registered Reference Digest (`data-testid="crypto-registered-hash"`)
  - Equality indicator: `=` for MATCH, `≠` for MISMATCH
  - Full 64-hex vs short-form toggle button (`data-testid="crypto-toggle-hash-btn"`)
  - Comparison result: `MATCH` vs `MISMATCH` (`data-testid="crypto-comparison-result"`)
  - Verification result: `VERIFIED` vs `HASH_MISMATCH` (`data-testid="crypto-verification-status"`)

### 4.3 Blockchain Evidence Panel: BLOCKCHAIN PROVENANCE LOOKUP
- Panel ID: `data-testid="solution-blockchain-panel"`
- Registry contract address: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (`ModelRegistry.sol`)
- Queried model ID and version: `iot-ids-rf:v1.0.0`
- Registration status: `✓ REGISTERED (isModelRegistered = true)` (`data-testid="blockchain-reg-status"`)
- Registered algorithm: `RandomForestClassifier` (`data-testid="blockchain-algorithm"`)
- Registrant wallet address (`data-testid="blockchain-registrant"`)
- Registered timestamp formatted to UTC (`data-testid="blockchain-timestamp"`)
- Explicit contract interface notice:
  > *Contract Interface:* Backend verification service queried the registered model record via web3 contract call (`getModelRecord`, `getModelHash`, `isModelRegistered`). Registered digest retrieved from the evaluated ModelRegistry.

### 4.4 Verification Decision Panel
- Panel ID: `data-testid="solution-decision-panel"`
- Decision banner: `VERIFIED — MODEL LOAD AUTHORIZED` or `HASH_MISMATCH — MODEL LOAD BLOCKED` or `NOT_REGISTERED — MODEL LOAD BLOCKED`
- Causal chain explanation clearly formatted:
  ```text
  Registered model found (iot-ids-rf:v1.0.0)
          +
  Observed SHA-256 matches registered digest (dc5e16889ea247a4...)
          ↓
  VERIFIED
          ↓
  Model loading authorized for inference execution plane
  ```

### 4.5 7-Stage Lifecycle Gate Tracker
- Panel ID: `data-testid="solution-lifecycle-tracker"`
- Tracks each of the 7 stages with dedicated status pills (`Passed`, `Running`, `Blocked`, `Failed`, `Pending`):
  1. `1. ARTIFACT`: Selected on disk
  2. `2. SHA-256`: Digest calculated
  3. `3. REGISTRY`: Record queried via `ModelRegistry.sol`
  4. `4. COMPARISON`: Digests match / differ
  5. `5. DECISION`: VERIFIED / HASH_MISMATCH
  6. `6. LOAD GATE`: Load authorized / Load blocked
  7. `7. IDS STATUS`: Inference ready / Inference locked

### 4.6 Technical Architecture Flow Diagram
- Panel ID: `data-testid="solution-architecture-diagram"`
- Monospace ASCII architecture diagram:
  ```text
  MODEL ARTIFACT
        │
        ▼
     SHA-256
        │
        ▼
  OBSERVED DIGEST
        │
        ├──────────────┐
        │              │
        ▼              ▼
  LOCAL ARTIFACT    MODEL REGISTRY
        │              │
        └──────┬───────┘
               ▼
           COMPARISON
               │
        ┌──────┴──────┐
        ▼             ▼
      MATCH        MISMATCH
        │             │
        ▼             ▼
     LOAD          BLOCK
  ```

### 4.7 "WHAT THIS PROVES" Technical Explanation Panel
- Panel ID: `data-testid="solution-what-this-proves"`
- 7 technical proof points:
  1. **Artifact Hashing:** Model binary on disk is hashed using SHA-256.
  2. **Reference Retrieval:** Backend queries `ModelRegistry.sol` for canonical digest.
  3. **Cryptographic Comparison:** Observed and registered digests are evaluated for exact equality.
  4. **Gated Memory Loading:** Matching digests permit deserialization into memory.
  5. **Fail-Closed Enforcement:** Any mismatch terminates deserialization and disables inference.
  6. **Provenance Anchor:** Blockchain serves solely as consensus reference, never per-flow classifier.
  7. **Zero Ingestion Overhead:** Per-flow inference path (`/predict/hierarchical`) makes zero blockchain queries.
- Mandatory research limitation notice:
  > **Research Integrity Notice:** SHA-256 equality proves byte-level correspondence with the registered artifact. It does not prove that the registered model is accurate, safe, robust, or free from poisoned training data.

### 4.8 Evaluator Demonstration Guide
- Panel ID: `data-testid="solution-evaluator-guide"`
- Detailed 4-step sequence covering:
  - **TEST A (Authorized Model):** Verification of legitimate artifact, MATCH, loading authorized, successful inference.
  - **TEST B (Model Replacement):** Ephemeral candidate perturbation, candidate SHA `a7fc4306...`, inequality `≠`, `HASH_MISMATCH`, fail-closed lock.
  - **TEST C (Recovery):** Ephemeral cleanup, canonical SHA `dc5e1688...` verified, authorized loading restored.
  - **TEST D (Unregistered Version):** Submitting candidate `v9.9.9`, `NOT_REGISTERED`, fail-closed lock.

---

## 5. Test & Validation Results

### 5.1 Backend Pytest Suite
Ran full test suite:
```bash
python -m pytest -q
```
**Result:** `112 passed in 45.55s (100% PASS)`  
Zero regressions across all unit, blockchain, and hierarchical integration tests.

### 5.2 Frontend Vitest Suite
Ran full test suite:
```bash
npm --prefix frontend test -- --run
```
**Result:** `76 passed in 5.42s (100% PASS across 4 test suites)`  
- `src/test/analytics.test.js`: 16 passed
- `src/test/App.test.jsx`: 10 passed
- `src/test/architecture_workflow.test.jsx`: 20 passed
- `src/test/solution_workflow.test.jsx`: 30 passed

### 5.3 Frontend Production Build
Ran production build:
```bash
npm --prefix frontend run build
```
**Result:** Successful Vite build in 619ms:
- `dist/index.html`: 0.63 kB
- `dist/assets/index-K-ZasE_x.css`: 41.08 kB (gzip: 6.96 kB)
- `dist/assets/index-Bb1kiUm_.js`: 289.74 kB (gzip: 77.73 kB)

---

## 6. Scope & Integrity Confirmation

- No models were retrained.
- Model hyperparameters and joblib files are untouched.
- Smart contract source and bytecodes are untouched.
- No fake hashes, placeholder hashes (e.g. `deadbeef`), or simulated transactions are present.
- Architectural invariant verified: `per_flow_blockchain_queries = 0`.
- All displayed evidence originates from genuine backend and web3 contract call executions.
