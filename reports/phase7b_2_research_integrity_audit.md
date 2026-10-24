# Phase 7B.2 — Research Integrity Audit

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.2 — Register and Verify Selected Attack-Type Classifier  
**Auditor:** Research Integrity & Methodology Reviewer  
**Audit Date:** 2026-10-24  
**Starting Baseline Checkpoint:** `353bbad4e18b9f61cecbb4192715fdb89ce58714`

---

## 1. Audit Scope & Methodology

This audit inspects the implementation, execution, artifacts, and documentation produced during Phase 7B.2. The primary objective is to verify that model provenance registration was achieved in strict adherence to data boundary invariants, security claim scoping, and non-overclaiming standards.

All checks were verified against executable repository code (`experiments/stage2_provenance_experiment.py`, `tests/test_stage2_provenance.py`, `ml/artifacts/attack_classifier_provenance_record.json`, and `experiments/results/phase7b_2_provenance_results.json`).

---

## 2. Integrity Checklist & Audit Findings

| Category | Integrity Criterion | Verified State | Audit Finding |
| :--- | :--- | :--- | :--- |
| **Dataset Integrity** | Authentic UNSW-NB15 files preserved | Training: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`. Testing: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`. No files modified or replaced. | **PASS** |
| **Model Invariant (Stage 2)** | Canonical Stage 2 artifact preserved | `ml/artifacts/attack_classifier.joblib` SHA-256 remains exactly `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`. Model B preserved; no retraining performed. | **PASS** |
| **Model Invariant (Stage 1)** | Baseline binary artifact preserved | `ml/artifacts/ids_model.joblib` SHA-256 remains exactly `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`. | **PASS** |
| **Model Identity Distinction** | Collision-free model registration keys | Stage 1: `iot-ids-rf:v1.0.0`; Stage 2: `iot-ids-attack-classifier:v1.0.0`. Keccak256 hash keys are distinct on-chain. | **PASS** |
| **Blockchain Claims** | Registry role properly scoped | Blockchain is used strictly as an immutable provenance registry for artifact digests; not described as an IDS, and does not perform attack classification. | **PASS** |
| **EVM Environment Scoping** | Measurements scoped to local EVM | Gas and latency measurements explicitly identified as `EthereumTesterProvider (py-evm)` local test environment. | **PASS** |
| **Security Claim Scoping** | Integrity check limits documented | Provenance check strictly verifies that local file bytes match the registered digest; does not claim safety, robustness, or absence of training poison. | **PASS** |
| **Experimental Validity** | All 5 scenarios evaluated | E1 (VERIFIED), E2 (HASH_MISMATCH), E3 (NOT_REGISTERED), E4 (FILE_NOT_FOUND), E5 (HASH_MISMATCH) executed and verified. | **PASS** |
| **Tampered Artifact Safety** | Canonical artifact uncorrupted | E2 tampering executed on temporary copy; canonical artifact verified intact after test. | **PASS** |
| **Architecture Isolation** | No FastAPI integration | Stage 2 remains unintegrated with `/api/predict`; no runtime per-flow blockchain lookups introduced. | **PASS** |
| **Data Boundary Compliance** | No raw data stored on-chain | Provenance record and smart contract store zero network flows, zero features, zero PII, and zero model weights. | **PASS** |

---

## 3. Detailed Audit Assessments

### 3.1. Dataset and Artifact Invariant Verification
Direct hashing confirms:
- `data/raw/UNSW_NB15_training-set.csv` SHA-256: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` (Verified invariant).
- `data/raw/UNSW_NB15_testing-set.csv` SHA-256: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` (Verified invariant).
- `ml/artifacts/ids_model.joblib` SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` (Verified invariant).
- `ml/artifacts/attack_classifier.joblib` SHA-256: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` (Verified invariant).

### 3.2. Experimental Scenario Authenticity
All reported execution data was directly produced by the local EVM:
- **Deployment Transaction**: Contract deployed at block 1 consuming $1,244,483$ gas.
- **Registration Transaction**: Hash `5ed5dff5c08ac95378b6c6673d78213bc0870e4e58726bf9b4f65dc885aa12e1` at block 2 consuming $214,206$ gas.
- **Verification Trials**: E1 through E5 yielded expected deterministic statuses (`VERIFIED`, `HASH_MISMATCH`, `NOT_REGISTERED`, `FILE_NOT_FOUND`, `HASH_MISMATCH`).

### 3.3. Architecture & Non-Goals Compliance
- The FastAPI service was not modified; no new endpoints were added to `backend/api.py`.
- Automated remediation and active defense were not introduced.
- The frontend dashboard remains unmodified.
- The Solidity smart contract `blockchain/contracts/ModelRegistry.sol` was reused directly without changes.

---

## 4. Audit Conclusion

The Phase 7B.2 implementation complies with all research-integrity guidelines, reproducibility standards, and security scoping requirements. No data leakage, unauthorized architectural jumps, or unsupported performance claims were identified.
