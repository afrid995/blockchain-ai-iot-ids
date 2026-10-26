# Phase 7C End-to-End Security Solution Demonstrator Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `b741bec72923eaa02de4296b79ccfe8934fe9cdd`  
**Author:** AI Research Assistant & Senior React UX Engineer  
**Date:** October 25, 2026  

---

## 1. Executive Summary

Phase 7C unifies the research project's separate technical components into a coherent, comprehensive **End-to-End Security Solution Demonstrator** (`Security Solution Overview`), while preserving all existing operational console views (`Dashboard`, `Intrusion Detection`, `Model Security`, `Security Testing`, `Audit Log`, and `Research Results`) for backwards compatibility and specialized inspection.

Rather than requiring an evaluator to navigate across disconnected tabs to understand how blockchain provenance, cryptographic hashing, machine learning inference, advisory recommendations, and audit trails fit together, the new primary interface demonstrates the complete lifecycle of AI-driven IoT intrusion detection from beginning to end:
1. **Model Trust Verification:** Cryptographic SHA-256 calculation of local model artifacts evaluated against the SHA-256 digest registered for the model identity/version in the evaluated on-chain ModelRegistry prior to memory loading.
2. **Network Flow Ingestion:** Evaluation of authentic UNSW-NB15 traffic flows across diverse scenario presets (`DoS`, `Normal`, `Fuzzers`, `Exploits`, `Reconnaissance`, `Generic`) or operator-supplied 42-feature JSON vectors.
3. **Stage 1 Binary Detection:** Gated binary classification determining whether incoming traffic is `Benign` or `Attack`.
4. **Conditional Stage 2 Multiclass Categorization:** If `Attack`, traffic is routed to the 9-class attack classifier; if `Benign`, Stage 2 is explicitly bypassed to conserve computational overhead.
5. **Deterministic Security Advisory:** Standardized incident response guidance categorized by severity, priority, and operator instructions, with strict human approval required and autonomous remediation disabled.
6. **Local Operational Audit Store:** The local SQLite operational audit trail records prediction and security-event metadata while excluding raw 42-feature network-flow vectors. It is separate from the on-chain model provenance registry and is not itself a blockchain-backed immutable log. Zero blockchain queries are performed during per-flow inference.

The demonstrator also provides an interactive **Model Replacement Attack Simulator** demonstrating fail-closed enforcement (blocking model load and locking inference upon SHA-256 mismatch or un-anchored model version candidate) and a **Problem-to-Solution Traceability** matrix linking every empirical finding to real architecture capabilities and explicit research boundaries.

---

## 2. Architecture & Design Principles

The end-to-end demonstrator is organized around three primary user journeys:

```
+----------------------------------------------------------------------------------------------------+
|                                 END-TO-END SECURITY SOLUTION                                       |
+----------------------------------------------------------------------------------------------------+
|  [MODE 1: DETECT]           |  [MODE 2: PROTECT]                     |  [MODE 3: EVIDENCE]          |
|  Legitimate Pipeline Flow   |  Attack Simulation & Fail-Closed Gate  |  Problem Mapping & Metrics   |
+-----------------------------+----------------------------------------+------------------------------+
```

### 2.1 Mode 1 — Detect (Legitimate End-to-End IDS Workflow)
The evaluator experiences the complete sequential pipeline:
- **Gate 1 (Model Trust):** Evaluates Stage 1 (`iot-ids-rf:v1.0.0`) and Stage 2 (`iot-ids-attack-classifier:v1.0.0`) against on-chain registrations. If either model is unverified or unloaded, downstream inference is locked with an explicit fail-closed alert.
- **Gate 2 (Network Flow):** Selects an authentic UNSW-NB15 flow preset with real protocol, duration, packet count, byte volume, and rate metrics, or submits a custom 42-feature JSON vector.
- **Stage 1 Execution:** Calls `POST /predict/hierarchical`. Stage 1 yields binary verdict and confidence.
- **Conditional Stage 2 Routing:**
  - If `Attack`: Stage 2 executes multiclass classification, returning the specific attack category (e.g., `DoS`, `Exploits`, `Fuzzers`) and category confidence.
  - If `Benign`: Stage 2 displays a clear "Bypassed" badge, illustrating architectural efficiency.
- **Advisory Generation:** Deterministic security advice with clear incident severity, investigation priority, action recommendations, and explicit human-in-the-loop requirement.
- **Audit Logging:** Audit record display confirming `event_id`, model identity, verified hash, execution latency, and zero blockchain calls.

### 2.2 Mode 2 — Protect (Model Replacement & Fail-Closed Gate)
The evaluator safely tests the cryptographic defense mechanism against adversarial model substitution:
- **Scenario A (Model Replacement Attack):** Calls `POST /demo/model-replacement`. Backend creates an ephemeral candidate artifact with byte perturbation in a temporary OS buffer, calculates observed candidate digest (`deadbeef...` / `a7fc43...`), and checks against on-chain `ModelRegistry.sol`. The result is an immediate `HASH_MISMATCH`.
- **Scenario B (Unregistered Candidate Model):** Calls `POST /demo/unregistered-version` with candidate version `v9.9.9`. Evaluates against the contract; returns `NOT_REGISTERED`.
- **Fail-Closed Enforcement:** Both scenarios immediately unload the model from memory, lock downstream inference (`POST /predict/hierarchical` responds with HTTP 503), and record a security incident in the local SQLite operational audit store.
- **Restoration:** Calls `POST /demo/model-replacement/reset`. Purges temporary candidates, re-evaluates the pristine canonical model artifact (`ml/artifacts/ids_model.joblib`), re-authorizes memory loading, and restores inference.

### 2.3 Mode 3 — Evidence (Problem Mapping & Limitations)
Connects the operational demonstrator to empirical research evidence:
- **Problem-to-Solution Traceability Table:** 7-row matrix linking core security problems to implemented properties, demonstration mechanisms, empirical metrics, and research boundaries.
- **Authoritative Benchmark Metrics:** Displays verified experimental results across Stage 1, Stage 2 standalone, hierarchical pipeline, Fuzzers analysis, and latency benchmarks.
- **Research Limitations:** Explicit disclosure of the UNSW-NB15 dataset context, offline SHA-256 verification scope, lack of live packet capture, class imbalance, and human-in-the-loop operational constraints.

---

## 3. Visual Pipeline Flow Implementation

A 6-stage visual pipeline tracker displays workflow state above the mode panels:

```
[1] MODEL TRUST ➔ [2] NETWORK FLOW ➔ [3] STAGE 1 IDS ➔ [4] STAGE 2 MULTICLASS ➔ [5] ADVISORY ➔ [6] AUDIT EVIDENCE
```

Each stage box reflects operational status:
- When models are verified and loaded, `[1] MODEL TRUST` shows `✓ VERIFIED`.
- When an attack simulation triggers a hash mismatch, `[1] MODEL TRUST` immediately shifts to `FAIL-CLOSED (HASH_MISMATCH)` with a red highlight, and downstream stages show `LOCKED`.
- In Mode 1, selecting presets and executing hierarchical inference progressively highlights each completed stage.

---

## 4. Architectural Invariants Preserved

During Phase 7C, the following architectural invariants were strictly preserved:
1. **Canonical Model Artifacts Pristine:**
   - Stage 1 (`ml/artifacts/ids_model.joblib`): `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
   - Stage 2 (`ml/artifacts/attack_classifier.joblib`): `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
2. **Smart Contract Source and Deployment Integrity:** `blockchain/contracts/ModelRegistry.sol` source and contract implementation were not modified during this frontend phase.
3. **Zero Blockchain Queries per Flow:** Pre-load model verification queries the EVM once; per-flow network inference executes strictly on the local CPU runtime with `per_flow_blockchain_queries = 0`.
4. **Decoupled Audit Persistence:** Local SQLite operational audit database (`backend/data/audit.db`) persists event metadata without recording sensitive 42-feature vectors or calling the blockchain. It is separate from the on-chain model provenance registry and is not itself a blockchain-backed immutable log.
5. **Strict Human-in-the-Loop:** Advisories enforce `is_advisory: true`, `requires_human_approval: true`, and `automated_remediation_enabled: false`.

---

## 5. Verification & Test Summary

| Test Suite | Total Tests | Passed | Failed | Execution Time |
|---|---|---|---|---|
| Vitest (Frontend Suite) | 66 | 66 (100%) | 0 | 4.39 s |
| Vite Production Build | 41 modules | Built | 0 | 613 ms |
| Pytest (Backend Suite) | 112 | 112 (100%) | 0 | 38.87 s |
| **Combined** | **178** | **178 (100%)** | **0** | **43.87 s** |

All 4 live workflows (Workflow A: Legitimate Detection, Workflow B: Model Replacement Attack, Workflow C: Restoration, Workflow D: Unregistered Model) were executed directly against the live backend with verified results matching all scientific requirements.
