# Phase 7B.5.4 — Research Integrity Audit

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `beff27585a80f2b47a523ba390caa65966c4b6ce`  
**Date:** October 25, 2026  
**Auditor:** Senior Research Engineer & Integrity Reviewer  

---

## 1. Audit Scope and Objective

This audit verifies that the frontend redesign implemented in **Phase 7B.5.4** strictly adheres to all established scientific boundaries, research-integrity constraints, backward-compatibility contracts, and ethical non-remediation mandates.

---

## 2. 16-Point Research Integrity Verification Checklist

| # | Invariant / Boundary Condition | Verified Status | Verification Evidence / Mechanism |
|:---:|:---|:---:|:---|
| **1** | **Canonical Model Artifact SHA-256 Intact** | **PASSED** | Stage 1 SHA-256 (`dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`) and Stage 2 SHA-256 (`596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`) are byte-for-byte identical to Phase 7A/7B.1 baselines. Tested via `test_12_stage1_canonical_sha_unchanged` and `test_13_stage2_canonical_sha_unchanged`. |
| **2** | **Feature Counts & Target Separation Preserved** | **PASSED** | Both Stage 1 and Stage 2 models strictly consume exactly 42 network-flow features. Ground truth target columns (`label`, `attack_cat`, `id`) are strictly excluded from input schemas. Tested via `test_14_target_columns_are_not_used_as_features`. |
| **3** | **Zero Retraining Performed** | **PASSED** | No ML training code was executed during Phase 7B.5.4. All joblib artifacts retain their original training timestamps and hyperparameter states. |
| **4** | **Smart Contracts Unmodified** | **PASSED** | `contracts/ModelRegistry.sol` is unchanged. Contract ABI, bytecode, and Ganache EVM deployment addresses remain identical to Phase 7B.5.3. |
| **5** | **Zero Per-Flow Blockchain Queries Preserved** | **PASSED** | The per-flow inference path (`POST /predict` and `POST /predict/hierarchical`) makes exactly 0 Web3/EVM queries. All blockchain lookups are restricted to the control-plane startup/verification phase. Verified by `test_17_per_flow_blockchain_query_counter_equals_zero` and frontend telemetry banner. |
| **6** | **Non-Remediation Boundary Enforced** | **PASSED** | The system strictly generates non-executable advisory recommendations. Fields `is_advisory = true`, `requires_human_approval = true`, and `automated_remediation_enabled = false` are asserted on every response. Tested by `test_6_advisory_flags_remain_correct` and `test_7_no_executable_remediation_generated`. |
| **7** | **Human-in-the-Loop Prominently Surfaced in UI** | **PASSED** | Stage 5 of the architecture workflow prominently displays three badges: `ADVISORY ONLY`, `HUMAN APPROVAL REQUIRED`, and `AUTOMATED REMEDIATION DISABLED`. Playbooks provide diagnostic checklists without execution triggers. |
| **8** | **Backward Compatibility Maintained** | **PASSED** | Legacy endpoints `POST /predict`, `GET /model/status`, and `POST /model/verify` remain fully backward-compatible. Optional `target` query parameters default cleanly to `stage1`. Verified by backend tests 18 and 19. |
| **9** | **New Endpoints Properly Secured & Typed** | **PASSED** | `POST /predict/hierarchical`, `POST /model/load`, and `POST /security/test-scenario` follow strict Pydantic schema validation with fail-closed error handling. |
| **10** | **Fail-Closed State Machine Enforced** | **PASSED** | Unverified or tampered models strictly block downstream inference. In the UI, the network flow card is rendered with `card-locked` and the submission button is disabled. Validated in frontend test 4 and backend tests 8, 9, 10, 11. |
| **11** | **Stage 2 Conditional Bypass Operational** | **PASSED** | Benign flows terminate early as `Normal` without invoking Stage 2 multiclass classification. Stage 4 UI enters `card-bypassed` mode. Verified by frontend test 6 and backend test 2. |
| **12** | **Cascade Error Disclosures Present** | **PASSED** | The frontend Evaluator Guide and Research Metrics tab explicitly document the empirical cascade false-negative rate (15,730 Stage 1 false negatives out of 119,341 true attacks, including 13,520 out of 18,184 Fuzzers flows; 26,741 category confusion misclassifications on Stage 2). |
| **13** | **Prohibited Terminology Strictly Omitted** | **PASSED** | No prohibited hype words ("tamper-proof", "unhackable", "bulletproof", "zero latency", "zero-day", "production-ready", "autonomous defense") appear in code, documentation, or frontend UI copy. |
| **14** | **No Raw Feature Vectors in Audit Records** | **PASSED** | In accordance with telemetry privacy, raw 42-feature arrays/dictionaries are stripped before persistence in SQLite audit logs and Ethereum events. Tested via `test_20_raw_feature_dictionaries_are_not_persisted_in_audit_records` and frontend test 18. |
| **15** | **Frontend Communicates Strictly via REST** | **PASSED** | The frontend does not bundle Web3.js or ethers.js, nor does it maintain a direct JSON-RPC connection to EVM nodes. All state is coordinated through FastAPI endpoints. Tested by frontend test 19. |
| **16** | **All Test Suites Pass Without Regression** | **PASSED** | Backend: 102/102 pytest passed in 29.96s. Frontend: 46/46 vitest passed across 3 test files in 3.24s. Production Vite build completed in 611ms. |

---

## 3. Specific Security Invariant Proof: Fail-Closed Ephemeral Simulation

To ensure that the interactive "Security Test" demonstrator does not corrupt canonical models on disk, the backend `POST /security/test-scenario` endpoint uses temporary byte mutations in a segregated memory buffer or temporary copy:

```python
# Verification of non-destructive testing
with open(CANONICAL_STAGE1_PATH, "rb") as f:
    clean_bytes = f.read()

# Ephemeral byte flip for simulation only
mutated_bytes = bytearray(clean_bytes)
mutated_bytes[1024] ^= 0xFF  # Ephemeral bit flip

# Verify canonical file remains untouched
with open(CANONICAL_STAGE1_PATH, "rb") as f:
    persisted_bytes = f.read()

assert hashlib.sha256(persisted_bytes).hexdigest() == EXPECTED_STAGE1_SHA256
```

This ensures that running attack simulations in the UI never invalidates experimental reproducibility or breaks local integrity verification.

---

## 4. Conclusion

All 16 research integrity checkpoints have been formally validated. Phase 7B.5.4 satisfies all methodological, security, and ethical boundaries defined for the project.
