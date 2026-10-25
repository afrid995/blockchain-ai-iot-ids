# Phase 7B.5 — Research-Integrity Audit Report (Implementation & Evaluation)

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** Phase 7B.5.3 — Final End-to-End Hierarchical Integration  
**Date:** October 2026  
**Starting Checkpoint:** `96e7d8de29930d5384b007e582d4ddaf82690413`  
**Audit Evaluation Result:** PASS (All Academic Invariants and Integrity Boundaries Satisfied)  

---

## 1. Audit Framework and Scope

This research-integrity audit rigorously evaluates the implementation, experiment execution, and formal technical documentation of Phase 7B.5.3 (`experiments/final_end_to_end_integration.py`, `backend/services/hierarchical_service.py`, `tests/test_end_to_end_integration.py`, and `reports/phase7b_5_integration_report.md`).

The audit ensures adherence to scientific reproducibility standards, verifies that empirical claims strictly match measured experimental evidence, and enforces hard research-integrity boundaries prohibiting terminology inflation.

---

## 2. Prohibited Terminology Audit & Term Rejection

The complete codebase and documentation were audited to ensure strict exclusion and rejection of unsubstantiated claims:

| Prohibited Concept / Phrase | Audit Status | Evidence / Enforcement Rationale |
| :--- | :---: | :--- |
| **"tamper-proof"** | **PASS / REJECTED** | Scoped strictly to tamper-evidence; on-chain hash verifies artifact byte match but cannot prevent off-chain modification. |
| **"unhackable"** | **PASS / REJECTED** | Prohibited throughout all technical reports and docstrings. |
| **"guaranteed protection"** | **PASS / REJECTED** | Prohibited; the system provides probabilistic statistical detection. |
| **"prevents all attacks"** | **PASS / REJECTED** | Prohibited; Phase 7B.5 explicitly reports 15,730 false negatives (missed attacks). |
| **"zero latency"** | **PASS / REJECTED** | Prohibited; measured execution timings ($T_{\text{hier}} = 41.16\text{ ms}$) are explicitly reported. |
| **"zero overhead"** | **PASS / REJECTED** | Prohibited; measured computational overheads are documented. |
| **"real-time guarantee"** | **PASS / REJECTED** | Prohibited; execution runs in standard non-real-time user-space Python. |
| **"wire-speed"** | **PASS / REJECTED** | Prohibited; hardware packet-processing speed is not claimed. |
| **"high-throughput"** | **PASS / REJECTED** | Scoped strictly to measured offline batch processing; no broad network claims. |
| **"production-ready"** | **PASS / REJECTED** | Scoped strictly as an experimental prototype on academic benchmark data. |
| **"public-chain performance"** | **PASS / REJECTED** | Explicitly qualified as local in-memory EVM (`EthereumTesterProvider`); no mainnet extrapolation. |
| **"blockchain improves accuracy"** | **PASS / REJECTED** | Disclaimed; blockchain provides model provenance, not classification improvement. |
| **"SHA proves model safety"** | **PASS / REJECTED** | Disclaimed; hash comparison proves byte correspondence with registered artifact, not absence of backdoors or training flaws. |
| **"automatic remediation"** | **PASS / REJECTED** | Prohibited; recommendations are strictly advisory (`automated_remediation_enabled = False`). |
| **"autonomous defense"** | **PASS / REJECTED** | Prohibited; human operator review is strictly mandatory (`requires_human_approval = True`). |
| **"IoT-wide generalization"** | **PASS / REJECTED** | Scoped strictly to UNSW-NB15 dataset; does not claim physical IoT deployment generalization. |
| **"zero-day detection"** | **PASS / REJECTED** | Disclaimed; supervised models detect patterns present in training distribution. |
| **"response effectiveness"** | **PASS / REJECTED** | Disclaimed; no ground-truth mitigation efficacy dataset exists. |
| **"optimal mitigation"** | **PASS / REJECTED** | Disclaimed; recommendations are deterministic heuristic operational guidelines. |

---

## 3. Dataset Benchmark Scope and Physical IoT Limitations

The audit confirms explicit qualification of the evaluation benchmark:
> **UNSW-NB15 Benchmark Scope:** The UNSW-NB15 dataset was generated in 2015 within a synthetic testbed environment utilizing the IXIA PerfectStorm tool. While established as a standard academic network-flow intrusion detection benchmark, **it does not by itself establish generalization to live, physical IoT deployments**. Real-world IoT gateways encounter heterogeneous physical environments, proprietary sensor protocols (e.g. MQTT, CoAP, Zigbee, BLE), and network drift that are not captured within synthetic NetFlow records.

---

## 4. Technical Invariants Audit Matrix

| Audit Criterion | Verification Target | Experimental Evidence & Evaluation | Status |
| :--- | :--- | :--- | :---: |
| **1. Dataset Provenance** | Authentic UNSW-NB15 partitions verified by SHA-256 | Training (`734fe664...a559`) and Testing (`bec7dd5e...48fa`) digests verified on disk in read-only mode. | **PASS** |
| **2. Model Hashes** | Canonical model artifacts verified unaltered | Stage 1 (`dc5e1688...e7c5`) and Stage 2 (`596b98ce...3208`) hashes verified unaltered prior to and following execution. | **PASS** |
| **3. Stage 1 Invariance** | Stage 1 parameters and baseline metrics preserved | Canonical artifact `ids_model.joblib` was not modified or retrained; verified baseline ($90.30\%$ Acc, $98.78\%$ Prec). | **PASS** |
| **4. Stage 2 Invariance** | Stage 2 parameters and historical metrics preserved | Canonical artifact `attack_classifier.joblib` was not modified; verified baseline ($53.06\%$ Macro F1, $53.41\%$ Balanced Acc). | **PASS** |
| **5. Zero Retraining** | No re-fitting, fine-tuning, or hyper-parameter updates | Zero training routines executed; pre-trained serialized pipelines loaded directly into memory after gating. | **PASS** |
| **6. Gating Integrity** | Fail-closed behavior on tampered or unregistered artifacts | Single-byte mutations in Stage 1 and Stage 2 produced `HASH_MISMATCH` and blocked loading (E2, E3); `v9.9.9` returned `NOT_REGISTERED` (E4). | **PASS** |
| **7. Decoupled Architecture** | Runtime per-flow blockchain query count strictly zero | Runtime inference path instrumented via `get_query_count()`; confirmed exactly **0 queries** per flow across all 175,341 flows. | **PASS** |
| **8. Operational Routing** | Stage 2 invoked conditionally based on Stage 1 prediction | Stage 1 Benign ($70,448$ flows) bypassed Stage 2 to output `"Normal"`; Stage 1 Attack ($104,893$ flows) conditionally triggered Stage 2. | **PASS** |
| **9. Target Leakage Prevention** | Ground-truth columns excluded from feature input | Pipelines explicitly drop `["id", "label", "attack_cat"]`; operational routing strictly branches on `s1_code`, not ground truth. | **PASS** |
| **10. Advisory Boundaries** | Strictly non-executable, human-in-the-loop recommendations | All recommendations enforce `is_advisory = True`, `requires_human_approval = True`, `automated_remediation_enabled = False`. Zero system command strings present. | **PASS** |
| **11. Error Propagation Transparency** | Full disclosure of cascade misclassifications | Report transparently details $15,730$ Stage 1 false negatives ($13,520$ Fuzzers) and $26,741$ Stage 2 category confusion errors. | **PASS** |
| **12. Minority-Class Realism** | Severe class imbalance and low recall acknowledged | Report discloses $428.89:1$ training imbalance and resulting low end-to-end recall for Analysis ($2.95\%$) and Worms ($15.38\%$). | **PASS** |
| **13. Audit Privacy** | Raw 42-feature vectors excluded from SQLite logs | SQLite audit store schema and logged records verified; zero raw network payload features persisted. | **PASS** |
| **14. Backward Compatibility** | Legacy endpoints preserved without breaking changes | `POST /predict` and `GET /model/status` tested and confirmed 100% backward compatible; new capability isolated in `POST /predict/hierarchical`. | **PASS** |
| **15. Comprehensive Testing** | All regression and integration test suites pass | 102 backend tests passed in 36.44s; 26 frontend tests passed in 2.04s; Vite production build succeeded in 602ms. | **PASS** |
| **16. Reproducibility** | Full deterministic reproducibility instructions | End-to-end runner `experiments/final_end_to_end_integration.py` executes E1–E7 deterministically from canonical artifacts. | **PASS** |

---

## 5. Audit Sign-Off

All sixteen research-integrity criteria, prohibited terminology checks, and architectural boundary constraints were verified without exceptions.

**OVERALL AUDIT OUTCOME: PASS**
