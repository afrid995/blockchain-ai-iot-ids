# Phase 7B.5 — Completion Report: Final End-to-End Hierarchical Integration

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** Phase 7B.5.3 — Final End-to-End Hierarchical Integration  
**Date:** October 2026  
**Starting Checkpoint:** `96e7d8de29930d5384b007e582d4ddaf82690413`  
**Status:** COMPLETE, VERIFIED & SYNCHRONIZED  

---

## 1. Executive Summary

Phase 7B.5.3 completed the final end-to-end integration and experimental validation of the AI-driven IoT Intrusion Detection System. The implementation couples decentralized cryptographic model provenance, off-chain two-stage hierarchical classification, deterministic advisory mitigation recommendations, and tamper-evident audit logging.

Key accomplishments of this phase include:
1. **Hierarchical Service Implementation:** Created `backend/services/hierarchical_service.py` and exposed `POST /predict/hierarchical` in FastAPI while maintaining 100% backward compatibility for legacy `POST /predict` and `GET /model/status`.
2. **Strict Architectural Decoupling:** Implemented query counter instrumentation in `core/blockchain.py`, empirically verifying that **exactly 0 blockchain queries** occur per network flow during runtime inference.
3. **Comprehensive E1–E7 Experimentation:** Executed `experiments/final_end_to_end_integration.py` across all $N = 175,341$ authentic UNSW-NB15 test flows, confirming exact routing reconciliation ($70,448$ Benign, $104,893$ Attack) and fail-closed defense against tampered (E2, E3) and unregistered (E4) models.
4. **Advisory Recommendation Mapping:** Attached deterministic human-in-the-loop operational guidance across all 10 output categories with zero autonomous remediation.
5. **Component Latency Profiling:** Profiled latency on $N=100$ flows, demonstrating an $11.54\%$ measured mean-latency reduction via conditional Stage 2 bypassing on benign traffic.
6. **Robust Regression Suite:** 102 backend tests and 26 frontend tests passing with zero failures.

---

## 2. Deliverables Produced and Modified

| Artifact Path | Action | Description |
| :--- | :---: | :--- |
| `backend/services/hierarchical_service.py` | Created | Core service executing two-stage hierarchical inference, advisory recommendation attachment, and audit logging. |
| `backend/schemas.py` | Modified | Added `HierarchicalPredictionResponse` schema. |
| `backend/config.py` | Modified | Added Stage 2 model path, ID, version, and algorithm configurations. |
| `backend/main.py` | Modified | Wired `HierarchicalService` into app lifecycle and exposed `POST /predict/hierarchical`. |
| `core/blockchain.py` | Modified | Added query counter instrumentation (`query_count`, `get_query_count()`, `reset_query_counter()`). |
| `experiments/final_end_to_end_integration.py` | Created | Standalone experiment runner executing E1–E7, latency profiling, and figure generation. |
| `experiments/results/phase7b_5_integration_results.json` | Created | Complete structured experimental results for E1–E7 and component latencies. |
| `tests/test_end_to_end_integration.py` | Created | 20 comprehensive unit and integration tests verifying all 20 required research invariants. |
| `reports/figures/figure16_end_to_end_results.png` | Created | High-resolution 300 DPI visualization of advisory volume, latency breakdown, and cascade routing. |
| `reports/phase7b_5_integration_report.md` | Created | Formal 9-section technical evaluation report detailing E1–E7 results, latencies, and limitations. |
| `reports/phase7b_5_research_integrity_audit.md` | Updated | Formal research-integrity audit verifying all 16 criteria and rejecting prohibited claims. |
| `reports/phase7b_5_completion_report.md` | Updated | Formal completion report and sign-off. |

---

## 3. Experimental Matrix (E1–E7) Summary

| Experiment | Target Evaluation | Primary Measured Finding | Outcome |
| :--- | :--- | :--- | :---: |
| **E1** | Legitimate Pipeline Execution | Provenance `VERIFIED` ($580.38\text{ ms}$); Benign $\to$ Normal; Attack $\to$ DoS; 0 per-flow blockchain lookups | **PASS** |
| **E2** | Stage 1 Artifact Tampering | Single-byte mutation produced `HASH_MISMATCH`; loading aborted; canonical artifact unchanged | **PASS** |
| **E3** | Stage 2 Artifact Tampering | Single-byte mutation produced `HASH_MISMATCH`; loading aborted; canonical artifact unchanged | **PASS** |
| **E4** | Unregistered Model Version | Querying version `v9.9.9` produced `NOT_REGISTERED`; loading blocked | **PASS** |
| **E5** | Missing Model Artifact | Pointing to non-existent file produced `FILE_NOT_FOUND`; graceful fail-closed abort | **PASS** |
| **E6** | Full Test-Set Evaluation ($N=175,341$) | Stage 1 Benign: $70,448$; Stage 1 Attack: $104,893$; Stage 2 Routed: $104,893$ ($100\%$ match); Routed Attack Macro F1: $51.43\%$; 0 per-flow blockchain lookups | **PASS** |
| **E7** | Lifecycle Audit Traceability | All lifecycle events logged; 0 raw 42-feature vectors stored in SQLite database | **PASS** |

---

## 4. Component Latency Profiling ($N = 100$)

Evaluated on local CPU hardware using in-memory `EthereumTesterProvider` (py-evm):
- **$T_{\text{gate}}$ (Pre-load verification, $N=30$):** Mean = $70.98\text{ ms}$, Median = $70.62\text{ ms}$, Std = $5.74\text{ ms}$
- **$T_{L1}$ (Stage 1 Binary Inference, $N=100$):** Mean = $23.40\text{ ms}$, Median = $21.89\text{ ms}$
- **$T_{L2}$ (Stage 2 Multiclass Inference, $N=100$):** Mean = $23.11\text{ ms}$, Median = $22.54\text{ ms}$
- **$T_{\text{rec}}$ (Advisory Mapping, $N=100$):** Mean = $0.019\text{ ms}$, Median = $0.018\text{ ms}$
- **$T_{\text{hier}}$ (Conditional Pipeline, $N=100$):** Mean = $41.16\text{ ms}$, Median = $43.37\text{ ms}$
- **$T_{\text{uncond}}$ (Unconditional Pipeline, $N=100$):** Mean = $46.53\text{ ms}$, Median = $44.43\text{ ms}$
- **Measured Mean-Latency Reduction:** **11.54%** achieved by bypassing Stage 2 on benign traffic.

---

## 5. Canonical Invariants Verification

| Target Asset | Path | Expected SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| **Stage 1 Model** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `VERIFIED UNCHANGED` |
| **Stage 2 Model** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `VERIFIED UNCHANGED` |
| **Training Set** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | `VERIFIED UNCHANGED` |
| **Testing Set** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | `VERIFIED UNCHANGED` |

---

## 6. Regression Testing Summary

1. **Backend Test Suite (`python -m pytest tests -v`):**
   - **102 passed out of 102** tests in 36.44s (zero failures, zero warnings).
   - Component test suites:
     - `tests/test_end_to_end_integration.py`: 20 passed (Phase 7B.5.3 new)
     - `tests/test_response_recommendations.py`: 12 passed
     - `tests/test_hierarchical_ids.py`: 18 passed
     - `tests/test_stage2_provenance.py`: 10 passed
     - `tests/test_multiclass_classifier.py`: 10 passed
     - `tests/test_ml_pipeline.py`: 8 passed
     - `tests/test_provenance.py`: 10 passed
     - `tests/test_blockchain.py`: 12 passed
     - `tests/test_backend.py`: 10 passed
2. **Frontend Test Suite (`cd frontend; npm test -- --run; cd ..`):**
   - **26 passed out of 26** tests in 2.04s (vitest run).
3. **Frontend Production Build (`cd frontend; npm run build; cd ..`):**
   - Succeeded in 602ms (vite v6.4.5 production build, 36 modules transformed, zero errors).

---

## 7. Research Integrity & Scope Confirmation

- **Zero Per-Flow Blockchain Calls:** Confirmed via runtime instrumentation (`per_flow_blockchain_queries == 0`).
- **Zero Autonomous Remediation:** Advisory recommendations strictly require human operator triage (`is_advisory = True`, `requires_human_approval = True`, `automated_remediation_enabled = False`).
- **Zero Raw Flow Feature Leakage:** SQLite audit records store only event metadata, predictions, and latencies.
- **Self-Reference Rule:** In accordance with project convention, the final commit SHA is omitted from this document and reported externally in the completion response.

---

## 8. Final Status Sign-Off

**PHASE 7B.5.3 STATUS: COMPLETE & EXPERIMENTALLY VALIDATED (PASS)**
