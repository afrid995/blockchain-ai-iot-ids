# Phase 7B.2 Completion Report: Stage 2 Attack-Type Classifier Provenance Registration

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Branch:** `master`  
**Baseline Starting Checkpoint:** `353bbad4e18b9f61cecbb4192715fdb89ce58714` (Phase 7B.1 Closed)  
**Self-Reference Rule Notice:** Per project integrity conventions, the final commit SHA for this phase is not embedded within this document and is reported externally upon completion.

---

## 1. Executive Summary

Phase 7B.2 successfully registered the Stage 2 attack-type classifier (`iot-ids-attack-classifier:v1.0.0`) in the local EVM `ModelRegistry` smart contract and verified its cryptographic integrity under five controlled scenarios (E1–E5). 

All invariants established in previous phases were strictly preserved:
- Stage 1 binary IDS model hash remains `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`.
- Stage 2 selected classifier hash remains `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`.
- Model IDs are distinct and collision-free (`iot-ids-rf:v1.0.0` vs `iot-ids-attack-classifier:v1.0.0`).
- No smart contract modifications were required.
- No FastAPI integration, frontend changes, or automated remediation were introduced.

---

## 2. Experimental Execution Summary

### 2.1. Blockchain Environment
- **Backend**: `EthereumTesterProvider (py-evm)` (process-local EVM).
- **Contract Name**: `ModelRegistry` (Solidity `^0.8.20`).
- **Contract Address**: `0xF2E246BB76DF876Cef8b38ae84130F4F55De395b`
- **Deployer Address**: `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`
- **Deployment Block**: 1
- **Deployment Gas Consumed**: $1,244,483$
- **Deployment Latency**: $0.031236$ s

### 2.2. Registration Transaction
- **Model ID**: `iot-ids-attack-classifier`
- **Version**: `v1.0.0`
- **Algorithm**: `RandomForestClassifier`
- **Registered SHA-256 Digest**: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **Transaction Hash**: `5ed5dff5c08ac95378b6c6673d78213bc0870e4e58726bf9b4f65dc885aa12e1`
- **Registration Block**: 2
- **Registration Gas Consumed**: $214,206$
- **Registration Transaction Latency**: $0.069538$ s
- **Status**: `SUCCESS`

### 2.3. Experimental Trial Outcomes (E1–E5)

| Scenario | Description | Target | Expected Status | Observed Status | Verified | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **E1** | Legitimate registered artifact | `iot-ids-attack-classifier:v1.0.0` | `VERIFIED` | `VERIFIED` | True | **PASS** |
| **E2** | Temporary byte-tampered artifact | `iot-ids-attack-classifier:v1.0.0` | `HASH_MISMATCH` | `HASH_MISMATCH` | False | **PASS** |
| **E3** | Unregistered version query | `iot-ids-attack-classifier:v9.9.9` | `NOT_REGISTERED` | `NOT_REGISTERED` | False | **PASS** |
| **E4** | Nonexistent artifact path | `nonexistent_attack_classifier.joblib` | `FILE_NOT_FOUND` | `FILE_NOT_FOUND` | False | **PASS** |
| **E5** | Deliberately wrong expected hash | Expected hash `"a"*64` | `HASH_MISMATCH` | `HASH_MISMATCH` | False | **PASS** |

### 2.4. Performance Benchmarking (N = 30 Samples)
- **Overall Verification Latency (SHA-256 Calculation + RPC Call)**:
  - Mean: $37.19$ ms
  - Median: $37.51$ ms
  - Min: $30.53$ ms
  - Max: $39.88$ ms
  - Std Dev: $1.79$ ms
- **On-Chain Registry Read Latency (Smart Contract Query Only)**:
  - Mean: $21.28$ ms
  - Median: $21.53$ ms
  - Std Dev: $1.33$ ms

---

## 3. Artifact & Provenance Records

| Asset | Path | Digest / Status |
| :--- | :--- | :--- |
| **Stage 2 Model Artifact** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` (**UNTOUCHED**) |
| **Stage 2 Provenance Record** | `ml/artifacts/attack_classifier_provenance_record.json` | Generated & validated |
| **Stage 2 Metadata** | `ml/artifacts/attack_classifier_metadata.json` | Aligned with distinct model ID |
| **Experiment Results** | `experiments/results/phase7b_2_provenance_results.json` | Generated & validated |
| **Baseline Binary Model** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` (**UNTOUCHED**) |

---

## 4. Verification and Regression Testing

### 4.1. Backend & Machine Learning Tests
- Command: `python -m pytest tests -v`
- Result: **60 passed in 13.40s** (50 existing regression tests + 10 focused Phase 7B.2 provenance tests).
- Status: **100% PASS**

### 4.2. Frontend Tests & Production Build
- Command: `cd frontend && npm test -- --run && npm run build && cd ..`
- Test Result: **2 passed test suites, 26 passed tests** in 1.98s.
- Build Result: Vite v6.4.5 production build succeeded in 646ms (`dist/index.html`, `dist/assets/`).
- Status: **100% PASS**

### 4.3. Baseline Binary Model Invariant Check
- Command: `core.hashing.calculate_sha256("ml/artifacts/ids_model.joblib")`
- Result: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- Status: **IDENTICAL / UNMODIFIED**

---

## 5. Scope & Boundary Confirmations

1. **FastAPI Production Integration**: **NOT PERFORMED**. Production endpoints continue serving Stage 1 only.
2. **Automated Remediation**: **NOT IMPLEMENTED**. Remediation logic is excluded from this phase.
3. **Frontend Modifications**: **NOT PERFORMED**. React UI remains identical.
4. **Hierarchical System Claims**: **NO END-TO-END CLAIMS**. This phase strictly evaluates Stage 2 provenance and integrity verification in the local EVM environment.

---

## 6. Deliverable Inventory

- `ml/artifacts/attack_classifier_provenance_record.json`
- `experiments/stage2_provenance_experiment.py`
- `experiments/results/phase7b_2_provenance_results.json`
- `tests/test_stage2_provenance.py`
- `reports/phase7b_2_provenance_registration_report.md`
- `reports/phase7b_2_research_integrity_audit.md`
- `reports/phase7b_2_completion_report.md`
