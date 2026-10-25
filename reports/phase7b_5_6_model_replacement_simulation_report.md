# Phase 7B.5.6 — Model Replacement Attack Simulator Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Author:** Research Implementation Team  
**Date:** 2026-10-25  
**Starting Checkpoint:** `0288ebbbb31f2fc081b6ba1e262634a0352325f4`  
**Status:** Completed & Validated  

---

## 1. Executive Summary

Phase 7B.5.6 implements an evaluator-facing, safe **Model Replacement Attack Simulator** within the architecture-first React demonstration frontend and FastAPI backend. The simulator provides empirical and visual proof of the system's core research premise:

$$\text{Local Model Artifact} \xrightarrow{\text{SHA-256}} H_{\text{candidate}} \quad \text{vs} \quad H_{\text{on-chain}} \in \text{ModelRegistry.sol}$$

When an adversary alters or substitutes a local model file, the cryptographic provenance gate detects the digest discrepancy, immediately aborts model deserialization into memory, locks downstream inference fail-closed, and records an immutable audit log event.

Crucially, this phase adheres to strict safety and research-integrity boundaries:
1. **Zero Permanent Corruption:** The canonical model artifact `ml/artifacts/ids_model.joblib` and multiclass artifact `ml/artifacts/attack_classifier.joblib` remain 100% unaltered.
2. **Ephemeral Sandboxing:** Attack simulations operate exclusively inside isolated OS temporary directories (`tempfile.TemporaryDirectory()`), which are purged automatically.
3. **Fail-Closed Downstream Locking:** Both `/predict` and `/predict/hierarchical` reject traffic with HTTP 503 while in the tampered state.
4. **Deterministic Recovery:** A reset control validates the canonical artifact hash against the smart contract digest before re-authorizing memory loading.

---

## 2. Threat Model & Architectural Sequence

### 2.1 Threat Scenario: Local Model Replacement Attack
In decentralized IoT edge environments, an attacker who achieves unauthorized filesystem access or root privilege on an inference node may attempt to replace the legitimate machine learning model artifact with an adversarial or Trojaned model (e.g., to create backdoors or bypass detection of critical attack classes).

Without blockchain-backed cryptographic provenance, the host application would blindly deserialize and execute the untrusted artifact.

### 2.2 End-to-End Mitigation Workflow

```
[Legitimate Model State]
         ↓
1. Candidate Artifact Identified (ml/artifacts/ids_model.joblib)
         ↓
2. Ephemeral Demonstration Copy Created in Temp Sandbox
         ↓
3. Controlled Byte Perturbation Injected (Offset 500)
         ↓
4. Observed SHA-256 Recalculated (H_observed ≠ H_registered)
         ↓
5. Queried Smart Contract Reference Hash (ModelRegistry.sol)
         ↓
6. Integrity Check Evaluated → HASH_MISMATCH Detected
         ↓
7. Model Deserialization Blocked (Memory Unloaded Fail-Closed)
         ↓
8. Downstream IDS Pipeline Locked (Network Flow Analysis Blocked)
```

---

## 3. Implementation Details

### 3.1 Backend Endpoints (`backend/main.py` & `backend/schemas.py`)

Three purpose-built endpoints were implemented to govern simulator execution:

1. **`POST /demo/model-replacement`**:
   - Copies the canonical model into a temporary directory.
   - Modifies a single byte at offset 500 to simulate artifact replacement.
   - Computes the real SHA-256 of the ephemeral candidate file.
   - Invokes `VerificationService.verify()`, which queries `ModelRegistry.sol`.
   - Confirms `HASH_MISMATCH` ($H_{\text{candidate}} \neq H_{\text{on-chain}}$).
   - Unloads the model service fail-closed (`is_loaded = False`, `verification_status = 'HASH_MISMATCH'`).
   - Dispatches a `MODEL_REPLACEMENT_DETECTED` warning audit event.
   - Returns the complete 8-step chronological execution timeline.

2. **`POST /demo/model-replacement/reset`**:
   - Re-verifies that the canonical artifact `ml/artifacts/ids_model.joblib` SHA-256 strictly equals `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`.
   - Re-executes `verify_and_load()` against `ModelRegistry.sol`.
   - Restores the verified model state in memory (`is_loaded = True`, `verification_status = 'VERIFIED'`).
   - Dispatches a `MODEL_RESTORED` success audit event.
   - Unlocks downstream inference endpoints.

3. **`POST /demo/unregistered-version`**:
   - Evaluates a candidate model registered under version `v9.9.9`.
   - Queries `ModelRegistry.sol` and confirms `NOT_REGISTERED`.
   - Demonstrates that even an uncorrupted artifact is rejected if unregistered on-chain.

### 3.2 Frontend Architecture Demonstration (`ArchitectureDemo.jsx`)

The React demonstration interface was enhanced with dedicated evaluator controls:
- **State Machine:** Governed across four distinct phases: `NORMAL`, `SIMULATING_REPLACEMENT`, `TAMPERED_DETECTED`, and `RESTORED`.
- **Side-by-Side Dual Hash Display:** Renders the smart contract reference hash (`dc5e1688...`) alongside the observed candidate hash (`≠ HASH MISMATCH`) with an optional toggle for full 64-character hexadecimal digests.
- **Visual Status Breakdown:** Clear status indicators displaying `Result: HASH_MISMATCH`, `Integrity Check: FAILED`, `Model Load: BLOCKED`, and `Inference: DISABLED`.
- **8-Step Chronological Timeline:** Explains each step of the verification process and marks the exact step where verification failed.
- **Stage 2 Network Flow Lockout:** Dynamically disables flow classification and presents a prominent warning banner explaining that traffic analysis is locked due to model unloading.
- **Evaluator Explanation Box:** Transparently articulates what is demonstrated, affirming that the canonical file was untouched and that fail-closed gating prevented unauthorized execution.

---

## 4. Verification & Testing

### 4.1 Backend Automated Test Suite (`tests/test_model_replacement_simulator.py`)

A dedicated suite of 10 comprehensive unit and integration tests was added:

| Test Case | Description | Result |
| :--- | :--- | :---: |
| `test_1_canonical_model_integrity_preserved` | Verifies canonical file hash remains `dc5e1688...` | PASSED |
| `test_2_simulation_ephemeral_tampered_hash_differs` | Confirms candidate hash is distinct and valid SHA-256 | PASSED |
| `test_3_simulation_detects_hash_mismatch_and_blocks_load` | Validates `HASH_MISMATCH` and fail-closed unloading | PASSED |
| `test_4_simulation_provides_eight_step_timeline` | Confirms 8-step chronological execution timeline | PASSED |
| `test_5_downstream_inference_fails_closed_during_attack` | Confirms `/predict` and `/predict/hierarchical` return 503 | PASSED |
| `test_6_reset_restores_legitimate_verified_state` | Validates on-chain re-verification and reloading | PASSED |
| `test_7_inference_succeeds_after_reset` | Confirms downstream inference returns 200 OK after reset | PASSED |
| `test_8_audit_trail_captures_attack_and_restoration` | Verifies `MODEL_REPLACEMENT_DETECTED` and `MODEL_RESTORED` events | PASSED |
| `test_9_unregistered_version_simulation_fails_closed` | Confirms `NOT_REGISTERED` rejection for version `v9.9.9` | PASSED |
| `test_10_ephemeral_segregation_no_leftovers` | Verifies no scratch files leak into `ml/artifacts/` | PASSED |

### 4.2 Frontend Automated Test Suite (`frontend/src/test/architecture_workflow.test.jsx`)

Four focused tests were integrated into the frontend test suite:
- **Test 21:** Renders simulator controls and evaluator explanation box.
- **Test 22:** Triggers simulation, asserting hash inequality badge, mismatch banner, and 8-step timeline.
- **Test 23:** Restores canonical model, confirming reset to `VERIFIED` and removal of mismatch alerts.
- **Test 24:** Tests unregistered version candidate, confirming fail-closed rejection.

### 4.3 Full Repository Test Summary

- **Backend Pytest:** 112 passed in 43.11s (100% green).
- **Frontend Vitest:** 50 passed in 3.99s (100% green).
- **Vite Production Build:** Compiled successfully in 599ms (zero errors).
- **Total Repository Tests:** 162 passed across all layers.

---

## 5. Conclusion

Phase 7B.5.6 successfully delivers a research-grade, interactive Model Replacement Attack Simulator. It proves that the blockchain provenance layer prevents unauthorized model substitution at runtime without exposing the production environment to permanent file corruption.
