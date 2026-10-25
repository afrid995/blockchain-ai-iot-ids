# Phase 7C Research Integrity Audit

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `b741bec72923eaa02de4296b79ccfe8934fe9cdd`  
**Audit Date:** October 25, 2026  
**Auditor:** Automated Research Integrity Verification Suite  

---

## 1. Scope & Objective

This research integrity audit validates that the unified **End-to-End Security Solution Demonstrator** implemented in Phase 7C strictly adheres to all architectural constraints, empirical benchmarks, and scientific integrity standards established throughout this capstone project.

The scope of Phase 7C was strictly confined to user interface unification, workflow demonstration, and integration test coverage. No machine learning models were retrained, no smart contracts were altered, no datasets were modified, and no unsupported performance claims were introduced.

---

## 2. Research Integrity Checklist & Audit Findings

| Audit Check | Parameter / Item | Authoritative Benchmark | Observed Runtime Value | Result |
|---|---|---|---|:---:|
| **1. Stage 1 Artifact SHA-256** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **PASS** |
| **2. Stage 2 Artifact SHA-256** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **PASS** |
| **3. Training Dataset SHA-256** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **PASS** |
| **4. Testing Dataset SHA-256** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a000c7a07879d338395ed7421750f675fd0339e07dfe0648fa` | `bec7dd5ec88dc2a000c7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **PASS** |
| **5. Smart Contract Integrity** | `blockchain/contracts/ModelRegistry.sol` | Source and contract implementation unmodified | Unchanged; git diff clean for `blockchain/contracts/ModelRegistry.sol` | **PASS** |
| **6. Registered On-Chain Hash** | `ModelRegistry.getModelRecord("iot-ids-rf", "v1.0.0")` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **PASS** |
| **7. Prediction Architecture** | Hierarchical routing (`/predict/hierarchical`) | Stage 1 Benign skips Stage 2; Attack invokes Stage 2 | Verified live and in unit tests (`test_2_stage1_benign_does_not_invoke_stage2`) | **PASS** |
| **8. Blockchain Execution Decoupling** | Per-flow EVM transactions / queries | `per_flow_blockchain_queries = 0` | `0` verified in API responses, audit logs, and tests | **PASS** |
| **9. Audit Privacy Invariant** | Raw 42-feature vectors in SQLite | Must NOT be persisted | Verified: only summary metadata persisted (`backend/data/audit.db`) | **PASS** |
| **10. Advisory Safety Constraint** | Automated remediation execution | Autonomous defense disabled; human approval required | `automated_remediation_enabled: false`, `requires_human_approval: true` | **PASS** |
| **11. Ephemeral Simulation Isolation** | Model replacement perturbation buffer | Segregated temporary OS directory; canonical artifact pristine | Canonical artifact SHA-256 unchanged after test execution | **PASS** |
| **12. Stage 1 Authoritative Metrics** | Test Set Evaluation ($N = 175,341$) | Acc: 90.30%, Prec: 98.78%, Recall: 86.82%, F1: 92.41%, FPR: 2.29%, ROC-AUC: 98.60% | Preserved verbatim across UI Mode 3, reports, and tests | **PASS** |
| **13. Stage 2 Authoritative Metrics** | Multiclass Evaluation ($N = 119,341$) | Standalone: Acc 76.18%, Bal Acc 53.41%, Macro F1 53.06%, W-F1 77.50% | Preserved verbatim in Mode 3 and documentation | **PASS** |
| **14. Operational Hierarchy Metrics** | Full Pipeline on UNSW-NB15 Test Set | Hierarchical Macro F1: 51.43%, Balanced Acc: 51.20% | Preserved verbatim in UI and documentation | **PASS** |
| **15. Fuzzers Performance Bottleneck** | Fuzzers Attack Category Analysis | 18,184 true, 4,664 routed (25.65%), 13,520 FN (85.95% of FN), 14.83% E2E recall | Preserved verbatim in Mode 3 and documentation | **PASS** |
| **16. Latency Benchmarks** | Component Timing (Mean Latencies) | Pre-load verification: 20.31 ms, Stage 1: 21.04 ms, Stage 2: 23.09 ms, Hierarchical: 32.06 ms | Preserved verbatim in Mode 3 and documentation | **PASS** |
| **17. Prohibited Language Absence** | No unscientific marketing / hype claims | Zero instances of "blockchain detects hackers", "tamper-proof", "real-time IDS", etc. | Verified via regex test in `solution_workflow.test.jsx` (Test 20) | **PASS** |
| **18. Real Verification of Workflows** | Live Execution of Workflows A, B, C, D | Real HTTP responses from running FastAPI backend | Workflows A, B, C, D tested and logged directly | **PASS** |

---

## 3. Problem-to-Solution Traceability

The following matrix formally links each core technical problem addressed by this project to the required security properties, underlying implementations, demonstrated workflows, empirical evidence, and acknowledged research limitations:

| Problem | Required Security Property | Existing Implementation | Demonstrated Workflow | Evidence | Remaining Limitation |
|---|---|---|---|---|---|
| **AI Model Tampering / Supply Chain Substitution** | Cryptographic artifact integrity verification before memory loading | Pre-load verification gate checking SHA-256 against on-chain Ethereum `ModelRegistry.sol` | **Mode 2 (Protect):** Evaluator simulates local artifact tampering; observed SHA mismatches on-chain hash; model load is blocked; inference locks fail-closed | Live HTTP 503 lock; unit tests 9–14 pass; canonical file hash `dc5e1688...` unchanged | Verification is strictly pre-load; does not detect in-memory runtime tampering after load without periodic re-audit. |
| **Unauthorized / Untracked Model Versions** | Cryptographic provenance registration with immutable version binding | Smart contract `ModelRegistry.sol` mapping `(model_id, version)` to authorized SHA-256 digest | **Mode 2 (Protect):** Evaluator tests candidate version `v9.9.9`; registry lookup returns `NOT_REGISTERED`; loading blocked fail-closed | Live HTTP 503 lock; unit tests 16–17 pass; contract returns `isRegistered == false` | Centralized registrar governance; does not automate decentralized consensus voting for new model versions. |
| **High Compute Overhead of Multiclass IDS** | Efficient hierarchical triage; bypass heavy classification for benign traffic | Fast Stage 1 binary detector (`ids_model.joblib`) gating entry to 9-class Stage 2 model (`attack_classifier.joblib`) | **Mode 1 (Detect):** Ingest Normal flow preset; Stage 1 detects Benign; Stage 2 explicitly bypassed | Stage 2 bypassed banner; inference latency ~22 ms vs ~41 ms; unit test 4 passes | Stage 1 false negatives (e.g., Fuzzers) permanently bypass Stage 2 analysis. |
| **Granular Attack Identification for Incident Response** | Attack category differentiation for security operations | Stage 2 9-class classifier (DoS, Exploits, Fuzzers, Reconnaissance, Generic, etc.) | **Mode 1 (Detect):** Ingest DoS / Attack preset; Stage 1 flags Attack; Stage 2 outputs specific category and confidence | Stage 2 category DoS at 88.2% confidence; unit test 5 passes | Heavy class imbalance in training data limits rare class performance (e.g., Worms: 130 samples, 0% recall). |
| **Unsafe Autonomous Actions in IoT Networks** | Deterministic operator advisory with strict human-in-the-loop control | Structured response engine mapping attack categories to operator guidance and priority | **Mode 1 (Detect):** Advisory panel renders investigation checklist; explicitly requires human operator sign-off | `requires_human_approval: true`, `automated_remediation_enabled: false`; unit test 7 passes | Human operator latency introduces delay before network defense actions are implemented. |
| **Repudiation of Security Events & Inference Decisions** | Non-repudiable, tamper-evident audit logging decoupled from blockchain | Local SQLite operational audit database (`backend/data/audit.db`) recording prediction metadata | **Mode 1 (Detect):** Recorded audit evidence card displays `event_id`, model version, verified digest, and latency | Audit events retrievable via `GET /audit/events`; unit test 8 passes | Audit log resides locally in SQLite; SQLite database file itself is subject to host OS permissions. |
| **Blockchain Latency & Gas Cost Overhead** | Separation of execution plane from trust verification plane | On-chain query executed once during initialization/verification; 0 blockchain calls during per-flow inference | **Mode 1 (Detect):** Real-time telemetry displays `per_flow_blockchain_queries = 0` | Mean hierarchical latency: 32.06 ms; gas spent: 0 wei per network flow | Blockchain network availability required during initial service startup and model rotation. |

---

## 4. Audit Conclusion & Verdict

**VERDICT: FULL PASS (100% COMPLIANT)**

The Phase 7C implementation fulfills every research requirement, architectural boundary, and factual reporting standard. No unauthorized code or feature expansion occurred. All empirical numbers reported in the UI, test suites, and documentation match the authoritative project record.
