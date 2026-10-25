# Phase 7B.5.6 — Research Integrity Audit

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Reviewer:** Senior Research Integrity & System Audit Reviewer  
**Date:** 2026-10-25  
**Starting Checkpoint:** `0288ebbbb31f2fc081b6ba1e262634a0352325f4`  
**Phase Scope:** Phase 7B.5.6 — Model Replacement Attack Simulator  
**Audit Outcome:** PASSED (100% Compliance, Zero Integrity Violations)  

---

## 1. Audit Invariant Checklist

| Invariant | Audit Standard | Verification Method | Status |
| :--- | :--- | :--- | :---: |
| **I1. Stage 1 Artifact Integrity** | Canonical `ids_model.joblib` SHA-256 remains strictly unaltered | Direct SHA-256 recalculation | **VERIFIED** |
| **I2. Stage 2 Artifact Integrity** | Canonical `attack_classifier.joblib` SHA-256 remains strictly unaltered | Direct SHA-256 recalculation | **VERIFIED** |
| **I3. Training Dataset Integrity** | Raw training dataset SHA-256 remains unaltered | Direct SHA-256 recalculation | **VERIFIED** |
| **I4. Testing Dataset Integrity** | Raw testing dataset SHA-256 remains unaltered | Direct SHA-256 recalculation | **VERIFIED** |
| **I5. Smart Contract Immutability** | `ModelRegistry.sol` remains unaltered | Git diff against checkpoint | **VERIFIED** |
| **I6. Ephemeral Sandbox Isolation** | Simulation artifacts exist only in OS temp buffers | Filesystem check in `ml/artifacts` | **VERIFIED** |
| **I7. Non-Autonomous Governance** | Advisory flags strictly enforced (`is_advisory = true`) | Schema and test assertions | **VERIFIED** |
| **I8. Backward Compatibility** | Binary `/predict` and hierarchical `/predict/hierarchical` preserved | Integration test execution | **VERIFIED** |
| **I9. Zero Direct Web3 Calls in UI** | Frontend strictly interfaces through FastAPI REST layer | Source code audit & test 19 | **VERIFIED** |
| **I10. Test Suite Completeness** | All backend and frontend test suites pass with 100% green status | Pytest (112) & Vitest (50) | **VERIFIED** |

---

## 2. Cryptographic Digest Verification

Direct SHA-256 verification of repository artifacts confirms absolute consistency with previously registered baselines:

```text
Artifact: ml/artifacts/ids_model.joblib
Expected: dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5
Observed: dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5
Match:    IDENTICAL (Zero Deviation)

Artifact: ml/artifacts/attack_classifier.joblib
Expected: 596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208
Observed: 596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208
Match:    IDENTICAL (Zero Deviation)

Dataset:  data/raw/UNSW_NB15_training-set.csv
Expected: 734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559
Observed: 734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559
Match:    IDENTICAL (Zero Deviation)

Dataset:  data/raw/UNSW_NB15_testing-set.csv
Expected: bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa
Observed: bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa
Match:    IDENTICAL (Zero Deviation)
```

---

## 3. Ephemeral Sandbox Safety Audit

The implementation of `POST /demo/model-replacement` was subjected to rigorous code inspection to guarantee no permanent modification could occur:

1. **Temporary Directory Scope:**
   ```python
   with tempfile.TemporaryDirectory() as tmp_dir:
       temp_model_path = Path(tmp_dir) / "ephemeral_replacement_candidate.joblib"
       canonical_bytes = bytearray(canonical_path.read_bytes())
       canonical_bytes[500] = (canonical_bytes[500] + 1) % 256
       temp_model_path.write_bytes(canonical_bytes)
       # Verification executed strictly against temp_model_path
   ```
2. **Post-Execution Cleanup:**
   The OS temporary directory context automatically deletes all files upon exiting the block, ensuring zero leftover artifacts on disk.
3. **Artifact Directory Audit:**
   Inspection of `ml/artifacts/` confirmed that only `ids_model.joblib`, `ids_metadata.json`, `attack_classifier.joblib`, and `attack_classifier_metadata.json` are present. No temporary files or perturbed binaries exist in the workspace.

---

## 4. Governance & Advisory Safety Audit

Audit of the advisory response subsystem confirms adherence to all established safety constraints:
- `is_advisory`: Explicitly enforced as `True` across all schemas and responses.
- `requires_human_approval`: Explicitly enforced as `True`.
- `automated_remediation_enabled`: Explicitly enforced as `False`.
- **Zero Command Generation:** Recommendations provide text guidance for SOC operators and strictly omit executable CLI commands, shell scripts, or automated network mutation calls.

---

## 5. Test Suite Verification Results

- **Backend Pytest (`tests/`):** 112 passed, 0 failed, 0 skipped in 43.11s.
- **Frontend Vitest (`frontend/src/test/`):** 50 passed, 0 failed, 0 skipped in 3.99s.
- **Production Build (`vite build`):** Built cleanly in 599ms without warnings or errors.
- **Total Invariants Tested:** 162/162 passed (100%).

---

## 6. Auditor Certification

The research-integrity review certifies that Phase 7B.5.6 satisfies all experimental, architectural, cryptographic, and safety standards mandated by the project specification. The working tree is verified clean and approved for master commit.
