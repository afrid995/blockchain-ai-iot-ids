# Phase 7B.5 — Final End-to-End Integration Design Review

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.5 — Final End-to-End Integration Design Review  
**Date:** October 2026  
**Starting Checkpoint:** `384ad9266e3f7545e6570334c13041a5540b5da2`  
**Phase Type:** DESIGN-REVIEW ONLY (Zero Implementation, Zero Code Modification)  

---

## 1. Executive Summary

This document presents the comprehensive architectural and experimental design review for the final end-to-end integration of the research project: **“Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection”**.

Over Phases 1 through 7B.4, the project established and empirically validated:
1. An immutable, on-chain model provenance registry contract (`ModelRegistry.sol`) on a local Ethereum-compatible environment.
2. A binary Random Forest IDS model (`ids_model.joblib`) achieving 90.30% accuracy and 98.78% precision on UNSW-NB15.
3. A multiclass attack classifier (`attack_classifier.joblib`) categorizing intrusion flows into 9 attack categories with 53.06% Macro F1 under oracle conditions and 51.43% Macro F1 under operational hierarchical routing.
4. An operational hierarchical routing mechanism confirming that Stage 2 is conditionally invoked strictly on Stage 1 predicted attacks (104,893 test flows routed with $\Delta = 0$).
5. A deterministic advisory response recommendation layer (`core/response_recommendations.py`) mapping predictions to structured operator guidance with zero automated remediation.

This design review synthesizes these isolated components into a unified, reproducible end-to-end evaluation plan, establishes an explicit 7-part experiment matrix (E1–E7), formulates an expanded 10-risk integrity register, compares integration strategies, and delivers a definitive Go/No-Go recommendation.

---

## 2. Current System State

The current repository reflects a completed modular architecture where each subsystem has been independently implemented, verified, and audited:

| Subsystem Component | Canonical Implementation Path | Verified Cryptographic / Hash Digest | Validation Status |
| :--- | :--- | :--- | :--- |
| **Stage 1 Binary IDS** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | Verified Invariant |
| **Stage 2 Attack Classifier** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | Verified Invariant |
| **Training Dataset** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | Verified Invariant ($N=82,332$) |
| **Testing Dataset** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | Verified Invariant ($N=175,341$) |
| **Blockchain Smart Contract** | `blockchain/contracts/ModelRegistry.sol` | Bytecode deployed via Web3.py on `EthereumTesterProvider` (py-evm) | Deployed & Audited |
| **Advisory Response Layer** | `core/response_recommendations.py` | Pure deterministic module (10 categories, 10-field schema) | Implemented & Audited |
| **Local Audit Store** | `backend/services/audit_service.py` | Local SQLite append-oriented database (`backend/data/audit.db`) | Implemented & Audited |
| **Backend REST API** | `backend/main.py` | FastAPI application exposing `/health`, `/model/status`, `/model/verify`, `/predict`, `/audit/events` | Implemented (Phase 5) |
| **Operator Dashboard** | `frontend/src/` | React 18 + Vite dashboard displaying analytics, audits, and predictions | Implemented (Phase 6) |

---

## 3. Existing Experimental Evidence

The design of Phase 7B.5 builds upon verified empirical evidence compiled across previous phases:

### Phase 1–6: Binary Baseline & Provenance
- **Stage 1 Binary Performance ($N = 175,341$):** Accuracy: 90.30%, Precision: 98.78%, Recall: 86.82%, F1-Score: 92.41%, Specificity: 97.71%, False Positive Rate: 2.29%, ROC-AUC: 98.60%.
- **Architectural Decoupling:** Pre-load blockchain-backed verification is performed in the local EthereumTesterProvider/py-evm evaluation environment. Its latency is environment- and operation-specific and will be freshly measured as part of the Phase 7B.5 implementation evaluation. The evaluated architecture places blockchain registry verification outside the per-flow inference path; Phase 7B.5 will instrument the runtime path to confirm zero per-flow blockchain registry lookups.

### Phase 7B & 7B.1: Multiclass Stage 2 Classifier Selection
- Evaluated on $N = 119,341$ true attack flows.
- Balanced Random Forest selected over Standard Random Forest based on Macro F1:
  - Model A (Standard RF): Accuracy = 77.60%, Balanced Accuracy = 51.04%, Macro Precision = 70.31%, Macro Recall = 51.04%, Macro F1 = 52.27%, Weighted F1 = 77.63%.
  - Model B (Balanced RF, Selected): Accuracy = 76.18%, Balanced Accuracy = 53.41%, Macro Precision = 57.60%, Macro Recall = 53.41%, Macro F1 = 53.06%, Weighted F1 = 77.50%.

### Phase 7B.2: Stage 2 Blockchain Provenance Registration
- Model identity `iot-ids-attack-classifier` v1.0.0 registered on `ModelRegistry.sol`.
- Confirmed five verification states: `VERIFIED`, `HASH_MISMATCH` (tampering detected), `NOT_REGISTERED`, `FILE_NOT_FOUND`, `INVALID_EXPECTED_HASH`.

### Phase 7B.3 & 7B.3.1: Hierarchical Integration & Error Propagation
- Test set breakdown ($N = 175,341$): True Benign = 56,000, True Attack = 119,341.
- Stage 1 predicted Benign = 70,448 (bypassed Stage 2; output `"Normal"`).
- Stage 1 predicted Attack = 104,893 (routed to Stage 2). Exact programmatic equality verified: $\text{Stage 2 Routed} \equiv 104,893$.
- Error propagation:
  - 15,730 true attacks lost at Stage 1 (13.18% of attacks); **13,520 are Fuzzers (85.95% of all Stage 1 false negatives)**.
  - 1,282 true benign misrouted to Stage 2 as false positives (761 classified as Fuzzers, 409 Exploits).
  - 103,611 true attacks reached Stage 2: 76,870 correctly categorized (64.41% of all attacks), 26,741 miscategorized (22.41% of all attacks).
- Minority class end-to-end recall: Analysis (2.95%), Backdoor (11.57%), Shellcode (63.46%), Worms (15.38%), Fuzzers (14.83%).
- Latency ($N=100$ CPU): Stage 1 alone = 21.04 ms, Stage 2 alone = 23.09 ms, Hierarchical conditional = 32.06 ms (26.0% measured mean-latency reduction vs. unconditional double-execution 43.31 ms).

### Phase 7B.4 & 7B.4.1: Advisory Response Recommendation Layer
- Deterministic 10-category taxonomy implemented in `core/response_recommendations.py`.
- 100% schema completeness, 100% determinism, zero executable system commands, strictly advisory constraints (`is_advisory = True`, `requires_human_approval = True`, `automated_remediation_enabled = False`).
- Contextual volume across 175,341 flows: Normal 70,448, Generic 40,344, DoS 24,538, Exploits 21,725, Reconnaissance 8,698, Fuzzers 4,242, Backdoor 2,952, Shellcode 1,189, Analysis 1,171, Worms 34.
- Documented that 15,730 missed attacks receive Normal guidance, and 1,282 benign flows receive attack guidance.

---

## 4. Proposed Final Architecture

The final integrated architecture unifies model provenance gating, two-stage hierarchical inference, advisory response recommendation, and local security audit logging:

```text
Network-Flow Record (42 Features)
        │
        ▼
[SYSTEM STARTUP / PRE-INFERENCE GATE]
   ├── Compute SHA-256 (ids_model.joblib) ────────────► Match Contract? ──► Fail-Closed if Mismatch
   └── Compute SHA-256 (attack_classifier.joblib) ────► Match Contract? ──► Fail-Closed if Mismatch
        │
        ▼ (Models Authorized & Loaded Off-Chain)
[PER-FLOW RUNTIME INFERENCE PATH] (0 Blockchain Lookups)
        │
        ▼
Stage 1: Binary IDS (Random Forest)
        │
        ├── Benign (0) ──────────────► Output: "Normal"
        │                               │
        │                               ▼
        │                       Advisory Benign Guidance
        │                       [Routine continuous baseline monitoring]
        │
        └── Attack (1)
                │
                ▼
        Stage 2: Attack Classifier (Balanced RF)
                │
                ▼
        Attack Category (1 of 9 classes)
                │
                ▼
        Advisory Response Recommendation Layer (Deterministic Mapping)
        [Severity, Investigation Priority, Recommended Action, Operator Guidance, Limitations]
                │
                ▼
        Human Operator / SOC Analyst (Manual Review & Action)
                │
                ▼
[LOCAL SECURITY AUDIT LOGGING STORE] (SQLite audit.db)
   ├── Log Provenance Gating Events (MODEL_VERIFICATION, MODEL_LOAD_BLOCKED)
   └── Log Operational Events (PREDICTION, ADVISORY_RECOMMENDATION)
       * Raw network flow payloads are strictly excluded from audit records *
```

*(Refer to `reports/figures/figure15_final_architecture.png` for the detailed formal architectural schematic).*

---

## 5. Phase 7B.5 Research Question

> **Can the complete end-to-end architecture—comprising blockchain-backed model provenance gating, two-stage hierarchical intrusion detection, deterministic advisory response recommendations, and local security audit logging—operate cohesively to deliver verifiable model integrity, predictable flow routing, and transparent threat attribution without incurring per-flow blockchain lookups or introducing autonomous remediation?**

### Hypotheses to Test:
- **$H_1$ (Provenance Gating):** Pre-inference cryptographic verification reliably detects modified, tampered, or unregistered artifacts for both Stage 1 and Stage 2, preventing unauthorized model loading in a fail-closed manner.
- **$H_2$ (Hierarchical Routing Fidelity):** In the fully integrated pipeline, Stage 2 is conditionally invoked strictly for flows predicted as Attack by Stage 1, replicating the established Stage 1 $\rightarrow$ Stage 2 admission boundary without true-label leakage.
- **$H_3$ (Advisory Guidance Determinism):** Every classified flow receives a complete, schema-compliant advisory recommendation that transparently reflects classification uncertainty and error propagation.
- **$H_4$ (Architectural Decoupling):** Per-flow runtime inference incurs strictly zero blockchain lookups, maintaining operational separation between decentralized integrity verification and local flow inference.

---

## 6. Experiment Matrix

To empirically validate the integrated system, Phase 7B.5 must execute an explicit 7-part experiment matrix:

| Experiment ID | Scenario Name | Target Evaluated Mechanism | Input Conditions / Manipulation | Expected Experimental Outcome | Success Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E1** | Legitimate End-to-End Pipeline | Complete authorized pipeline flow | Legitimate Stage 1 & Stage 2 models; sample UNSW-NB15 test flows | Provenance: `VERIFIED`; Stage 1 executes; Stage 2 conditionally executes; Advisory guidance emitted; Audit events logged | 100% digest match; 0 per-flow blockchain lookups; valid audit trace |
| **E2** | Stage 1 Artifact Tampering | Fail-closed integrity gate (Stage 1) | Single-byte alteration of temporary copy of `ids_model.joblib` | Provenance: `HASH_MISMATCH`; Model loading blocked; Downstream inference aborted | `MODEL_LOAD_BLOCKED` logged; zero predictions emitted; canonical artifact untouched |
| **E3** | Stage 2 Artifact Tampering | Fail-closed integrity gate (Stage 2) | Single-byte alteration of temporary copy of `attack_classifier.joblib` | Provenance: `HASH_MISMATCH`; Stage 2 loading blocked; Downstream multiclass inference aborted | Controlled failure; canonical artifact untouched; explicit fail-closed state |
| **E4** | Unregistered Model Version | Registration enforcement | Unregistered model identity (`iot-ids-unknown`) or version (`v9.9.9`) | Provenance: `NOT_REGISTERED`; Model loading rejected | Loading aborted; `MODEL_LOAD_BLOCKED` logged |
| **E5** | Missing Model Artifact | File system integrity check | Target artifact path pointed to non-existent file | Provenance: `FILE_NOT_FOUND`; Error handled gracefully | Clean exception; zero crashes; audit event logged |
| **E6** | Batch Hierarchical Inference & Advisory Coverage | Full test set routing & guidance generation | Authentic UNSW-NB15 test set ($N=175,341$ flows) | Stage 1 predicted benign = 70,448; Stage 2 routed = 104,893; 175,341 advisory recommendations emitted | Exact numerical reconciliation with Phase 7B.3; 0 per-flow blockchain queries |
| **E7** | Lifecycle Audit Traceability | SQLite append-oriented audit logging | Execution of E1 through E5 | Audit store records complete event sequence (`MODEL_VERIFICATION`, `PREDICTION`, `RECOMMENDATION`, `MODEL_LOAD_BLOCKED`) | Zero raw flow features in DB; audit records retrievable by `event_id` |

---

## 7. Provenance Evaluation Design (Layer A)

The provenance evaluation verifies model integrity prior to loading:
- **On-Chain Reference:** Queries the `ModelRegistry.sol` smart contract on the local `EthereumTesterProvider` (backed by `py-evm`) via `getModelRecord(model_id, version)` (or `isModelRegistered(model_id, version)`).
- **Integrity Check:** Recomputes the local SHA-256 digest and performs binary equality check:
  $$\text{Verified} \iff \text{SHA256}(\text{local\_artifact}) == \text{bytes32\_to\_hex}(\text{on\_chain\_hash})$$
- **Metrics to Measure:**
  - Verification outcome (`VERIFIED`, `HASH_MISMATCH`, `NOT_REGISTERED`, `FILE_NOT_FOUND`).
  - Gating decision (Authorized Load vs. Abort).
  - Pre-load verification latency (mean, median, std dev across $N=30$ runs).
- **Integrity Rule:** Scoped strictly as a digest agreement verification. Zero claims of artifact safety, non-maliciousness, or training-data integrity.

---

## 8. Hierarchical IDS Evaluation Design (Layer B & C)

Evaluates the two-stage classifier execution:
- **Layer B (Binary Stage 1):**
  - Confirms baseline metrics ($N=175,341$): Accuracy 90.30%, Precision 98.78%, Recall 86.82%, F1 92.41%, Specificity 97.71%, FPR 2.29%.
  - Distinguishes mathematical identity of the hierarchical binary outcome from an independent evaluation.
- **Layer C (Multiclass Stage 2):**
  - Evaluates operational Stage 2 performance on routed flows ($N=104,893$).
  - Evaluates Macro F1 (51.43% on routed true attacks, 50.64% across all routed flows), Balanced Accuracy (51.20%), and per-class end-to-end recall.
  - Formally distinguishes **Oracle-Routed Stage 2 (H2)** from **Operational Hierarchical Stage 2 (H1)**.

---

## 9. Advisory Response Evaluation Design (Layer D)

Evaluates downstream mitigation guidance:
- **Taxonomy Mapping:** Every flow predicted by the hierarchy is mapped via `core/response_recommendations.py`.
- **Metrics to Evaluate:**
  - Coverage: 10/10 categories mapped.
  - Schema Completeness: 10/10 fields present.
  - Determinism: 100% identical outputs for identical category inputs.
  - Safety Boundary Compliance: Zero executable command templates, `is_advisory = True`, `requires_human_approval = True`, `automated_remediation_enabled = False`.
  - Distribution breakdown across $N=175,341$ test flows.
- **Strict Constraint:** No claims of "response accuracy", "mitigation efficacy", or "attack prevention" will be reported, as no ground-truth response action dataset exists.

---

## 10. Auditability Evaluation Design

Evaluates operational traceability within `backend/services/audit_service.py`:
- **Database Engine:** Local SQLite database (`backend/data/audit.db`) using WAL journal mode.
- **Event Schema:**
  - `event_id`: Unique UUID4 string.
  - `timestamp`: ISO 8601 UTC string.
  - `event_type`: Categorical lifecycle tag (`MODEL_VERIFICATION`, `MODEL_VERIFICATION_FAILURE`, `MODEL_LOAD_BLOCKED`, `PREDICTION`, `ADVISORY_RECOMMENDATION`).
  - `model_id` & `model_version`: Associated model identity.
  - `verification_status`: Status returned by cryptographic gate.
  - `prediction`: Output classification string.
  - `inference_latency_ms`: Duration of local CPU model inference.
  - `status`: Outcome tag (`SUCCESS`, `BLOCKED`, `ERROR`).
  - `details_json`: JSON-serialized dictionary containing advisory recommendation fields (`severity`, `investigation_priority`, `recommended_action`, `rationale`, `limitations`).
- **Privacy & Integrity Invariant:** Raw network-flow feature vectors (42 features) must remain strictly excluded from persistent audit records to prevent telemetry bloat and sensitive data exposure.
- **Storage Scope:** SQLite is explicitly documented as local append-oriented operational logging, **not** blockchain-backed immutable decentralized storage.

---

## 11. Latency Evaluation Design

The latency evaluation isolates computational durations across five discrete execution points:

$$\begin{aligned}
T_{\text{gate}} &= \text{Duration of pre-load model verification (SHA-256 + contract query)} \\
T_{L1} &= \text{Duration of Stage 1 binary inference per flow} \\
T_{L2} &= \text{Duration of Stage 2 multiclass inference per flow (conditional)} \\
T_{\text{rec}} &= \text{Duration of in-memory advisory recommendation mapping per flow} \\
T_{\text{hier}} &= \begin{cases} 
T_{L1} + T_{\text{rec}} & \text{if } \hat{y}_1 = 0 \text{ (Benign flow)} \\
T_{L1} + T_{L2} + T_{\text{rec}} & \text{if } \hat{y}_1 = 1 \text{ (Attack flow)}
\end{cases}
\end{aligned}$$

### Experimental Protocol:
- Benchmark on $N = 100$ deterministic test flows.
- Report mean, median, min, max, and standard deviation.
- Instrument and confirm that:
  $$\text{Per-Flow Blockchain Queries} \equiv 0$$
- **Language Scoping:** Avoid terms such as "zero runtime overhead", "zero latency", "wire-speed", or "real-time guarantees". Report actual measured millisecond quantities on local CPU.

---

## 12. Blockchain Boundary and Decentralization Scope

The role of the blockchain in the final architecture is rigorously bounded:
1. **What is On-Chain:**
   - Model identity (`bytes32` string key).
   - Semantic version (`bytes32` string key).
   - Authorized SHA-256 digest (`bytes32` hash).
   - Algorithm metadata string.
   - Registration timestamp (`uint256`).
   - Authorized deployer/registrant address (`address`).
2. **What is Off-Chain:**
   - Raw model binary artifacts (`.joblib` files stored locally on disk).
   - Raw network traffic flows and dataset partitions.
   - Stage 1 and Stage 2 model inference execution.
   - Advisory response recommendation mapping.
   - SQLite security audit event logs.
3. **Rationale for Decoupling:**
   - The evaluated architecture intentionally places blockchain registry verification outside the per-flow inference path. Phase 7B.5 will instrument the runtime inference path and verify that no blockchain registry lookups occur per flow. Blockchain performance measurements are restricted to the evaluated local EthereumTesterProvider/py-evm environment and are not extrapolated to public blockchain networks.
   - Storing high-velocity flow data on-chain creates irreversible public exposure of private network topology.
   - Decoupled pre-inference gating provides tamper-evidence before execution while avoiding per-flow on-chain registry lookups.

---

## 13. Security Threat Model

The final evaluation explicitly defines which security threats are within scope and which are out of scope:

| Threat Category | In Scope? | Evaluated Mechanism | System Response / Protection Level |
| :--- | :---: | :--- | :--- |
| **Unauthorized Artifact Substitution** | **YES** | Pre-load SHA-256 verification against on-chain digest | **Detected:** Digest mismatch causes immediate fail-closed abort (`MODEL_LOAD_BLOCKED`). |
| **Silent Artifact Bit-Rot / Corruption** | **YES** | Cryptographic hash recomputation on disk | **Detected:** Corrupted file digest differs from registered value; load rejected. |
| **Unregistered Version Deployment** | **YES** | Smart contract registry lookup | **Detected:** Contract returns `NOT_REGISTERED`; system refuses to initialize. |
| **Missing Model File** | **YES** | Filesystem pre-check | **Detected:** System flags `FILE_NOT_FOUND` without crashing. |
| **Adversarial Flow Evasion** | **NO** | Offline ML training optimization | **Out of Scope:** Provenance does not detect adversarial perturbation of feature values. |
| **Training Data Poisoning** | **NO** | N/A (Digest computed post-training) | **Out of Scope:** If a poisoned model is registered by an authorized key, digest match succeeds. |
| **Private Key Compromise** | **NO** | Ethereum ECDSA authentication | **Out of Scope:** An attacker possessing the contract owner key can register malicious digests. |
| **Zero-Day Network Exploits** | **NO** | ML statistical pattern recognition | **Out of Scope:** Novel exploits absent from UNSW-NB15 training distribution may be misclassified. |

---

## 14. Error Propagation Analysis

The final report must prominently feature the propagation of classification errors into the advisory response domain:

```text
                              119,341 True Attack Flows
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
         15,730 Attack Flows                             103,611 Attack Flows
          Lost at Stage 1                                 Reached Stage 2
          (Predicted Normal)                                     │
                 │                               ┌───────────────┴───────────────┐
                 ▼                               ▼                               ▼
       Receive "Normal" Guidance         76,870 Flows                    26,741 Flows
       [Routine monitoring only;       Correct Category               Incorrect Category
        Failed threat detection]      Attribution Guidance           Attribution Guidance
                                     (64.41% of all attacks)        (22.41% of all attacks)
```

- **Stage 1 False-Negative Impact:** 15,730 true attack flows receive non-actionable benign guidance. **85.95% of these are Fuzzers (13,520 flows)**, demonstrating that Stage 1 serves as a severe category-specific filtering bottleneck.
- **Stage 1 False-Positive Impact:** 1,282 benign flows receive attack guidance (primarily Fuzzers: 761, Exploits: 409), inducing false operator alarms.
- **Stage 2 Category Confusion:** 26,741 attack flows receive inappropriate category guidance (e.g., Exploits misclassified as DoS receive traffic rate-limiting guidance rather than vulnerability patching advice).
- **Minority Class Scarcity:** Analysis (2.95% end-to-end recall) and Worms (15.38% end-to-end recall) produce minimal true-positive recommendations.

---

## 15. Dataset and Generalization Limitations

The design acknowledges explicit dataset constraints:
1. **UNSW-NB15 Benchmark Scope:** Created in 2015 using the IXIA PerfectStorm tool in a synthetic testbed environment. Flow features reflect historical attack configurations; modern IoT protocol behaviors (MQTT, CoAP, BLE, Zigbee) are not natively captured.
2. **Class Imbalance:** Extreme attack-only training imbalance exists between Generic ($N=18,871$) and Worms ($N=44$), corresponding to a 428.89:1 ratio. This severely limits the empirical representation of the rare Worms category despite the use of balanced class weighting.
3. **Synthetic Ground Truth:** Ground-truth category labels in UNSW-NB15 contain documented labelling anomalies and duplicate records that bound achievable generalization.

---

## 16. Integration Options (FastAPI Backend)

Two technical options exist for exposing the end-to-end integrated architecture:

### Option A: Extend Existing `/predict` Endpoint
- **Mechanism:** Modify `backend/services/prediction_service.py` and `backend/schemas.py` so `/predict` invokes Stage 1, conditionally invokes Stage 2 on attack flows, appends advisory response recommendations, and returns an extended `NetworkFlowPredictionResponse`.
- **Advantages:** Single unified endpoint for all predictions.
- **Disadvantages:** Alters the established Phase 5/6 API contract; risks breaking the 10 existing backend integration tests in `tests/test_backend.py` and frontend test suites in `frontend/src/test/` that expect binary `prediction` and `prediction_code`.

### Option B: Dedicated Endpoint / Standalone Hierarchical Workflow
- **Mechanism:** Maintain `/predict` strictly as the validated Phase 5 binary baseline. Introduce a dedicated endpoint (e.g., `/predict/hierarchical`) or a dedicated end-to-end evaluation runner (`experiments/final_end_to_end_integration.py`).
- **Advantages:** 
  - 100% backward compatibility; zero regression risk to existing 82 backend and 26 frontend tests.
  - Clear architectural separation between the Phase 1–6 binary baseline and the Phase 7 multi-stage hierarchical extension.
  - Enables clean comparative benchmarking between Stage 1 standalone inference and full hierarchical + advisory inference.
- **Disadvantages:** Introduces a parallel endpoint path in the API schema.

---

## 17. Recommended Integration Strategy

> **Design Recommendation: ADOPT OPTION B (Dedicated Hierarchical Workflow and Endpoint).**

### Rationale:
1. **Academic Reproducibility:** Preserves the exact, audited Phase 5 baseline API contract (`/predict`) while providing a dedicated, clean interface for the Phase 7 multi-stage pipeline.
2. **Zero Regression Risk:** Guarantees that all 82 existing backend tests and 26 frontend tests continue passing without modification.
3. **Explicit Comparative Analysis:** Allows research benchmarks to directly query both endpoints side-by-side to measure operational differences in latency, output structure, and audit logging.
4. **Implementation Scope:** In Phase 7B.5 implementation, this will be realized via:
   - A dedicated evaluation runner: `experiments/final_end_to_end_integration.py`.
   - A dedicated non-breaking service/endpoint: `POST /predict/hierarchical` in `backend/main.py` utilizing `HierarchicalPredictionService`.

---

## 18. Reproducibility Plan

A researcher checking out the repository at the conclusion of Phase 7B.5 will be able to reproduce all findings using deterministic commands:

```bash
# 1. Environment Verification
python --version  # Python 3.12.x
git rev-parse HEAD

# 2. Cryptographic Digest Verification
python -c "
from core.hashing import calculate_sha256
assert calculate_sha256('ml/artifacts/ids_model.joblib') == 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5'
assert calculate_sha256('ml/artifacts/attack_classifier.joblib') == '596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208'
print('Model hashes verified.')
"

# 3. Execute End-to-End Integration Evaluation (When implemented in Phase 7B.5)
python experiments/final_end_to_end_integration.py

# 4. Execute Full Test Suites
python -m pytest tests -v
cd frontend && npm test -- --run && npm run build && cd ..
```

---

## 19. Research-Integrity Risk Register

The following expanded risk register identifies critical threats to scientific validity and defines mandatory controls:

| Risk ID | Risk Description | Why It Matters | Severity | Required Experimental Control |
| :---: | :--- | :--- | :---: | :--- |
| **R1** | **Stage 1 Error Cascading** | Missed attacks (15,730 flows) never reach Stage 2; causes false sense of security. | **HIGH** | Explicitly report end-to-end recall alongside Stage 2 routed recall; do not hide Stage 1 losses. |
| **R2** | **Minority Class Ineffectiveness** | Analysis (2.95%) and Worms (15.38%) have near-zero empirical detection. | **HIGH** | Present per-class support and recall tables; disclaim reliable detection of rare threats. |
| **R3** | **Response Guidance Mismatch** | Misclassified flows receive inappropriate operator advice. | **HIGH** | Mark all guidance as advisory; mandate human verification; include explicit limitation warnings. |
| **R4** | **Cryptographic Over-Claiming** | Mistaking hash verification for artifact safety or absence of backdoors. | **HIGH** | Explicitly state: SHA-256 confirms byte identity with registered digest; does NOT prove model safety. |
| **R5** | **Local EVM Misrepresentation** | Extrapolating py-evm / tester latency to public Ethereum networks. | **MEDIUM** | Explicitly qualify benchmark environment as local in-process `EthereumTesterProvider`. |
| **R6** | **Latency Overhead Conflation** | Conflating wall-clock latency with theoretical hardware instruction reductions. | **MEDIUM** | Use precise wording: "measured mean-latency reduction"; avoid claims of FLOP or power reductions. |
| **R7** | **Audit Store Tamper-Resistance** | Confusing SQLite local logging with immutable blockchain storage. | **MEDIUM** | Formally document SQLite as local append-oriented operational logging, not decentralized consensus. |
| **R8** | **UNSW-NB15 Generalization** | Over-generalizing synthetic 2015 benchmark flows to modern live IoT systems. | **MEDIUM** | State dataset limitations clearly; avoid universal claims of IoT network protection. |
| **R9** | **Per-Flow Blockchain Infiltration** | Accidental invocation of blockchain calls inside the per-flow prediction loop. | **HIGH** | Instrument per-flow blockchain call counter; assert `per_flow_blockchain_calls == 0`. |
| **R10**| **Autonomous Remediation Creep** | Adding automated firewall or IP blocking logic without operator consent. | **HIGH** | Hard boundary: zero executable defensive actions; maintain passive advisory intelligence only. |

---

## 20. Expected Deliverables for Phase 7B.5 Implementation

When Phase 7B.5 implementation proceeds, the following deliverables will be produced:
1. `experiments/final_end_to_end_integration.py`: Automated runner executing scenarios E1–E7.
2. `experiments/results/phase7b_5_integration_results.json`: Complete machine-readable experimental data.
3. `tests/test_end_to_end_integration.py`: Dedicated integration test suite verifying E1–E7 invariants.
4. `backend/services/hierarchical_service.py` (or Option B equivalent endpoint in `backend/main.py`).
5. `reports/phase7b_5_integration_report.md`: Comprehensive empirical report detailing all 7 scenarios.
6. `reports/phase7b_5_research_integrity_audit.md`: Post-implementation integrity audit.

---

## 21. Explicit Non-Claims

The project formally affirms that the final integrated architecture does **NOT**:
1. Implement autonomous remediation, automated packet filtering, or active defense.
2. Claim that cryptographic provenance registration prevents adversarial attacks or proves model safety.
3. Claim that blockchain provenance improves machine learning classification accuracy.
4. Incur per-flow blockchain lookups during network flow inference.
5. Possess literally zero runtime, computational, or memory overhead.
6. Claim real-time, wire-speed, or production-ready throughput guarantees.
7. Claim that advisory recommendations are optimal, guaranteed mitigations, or attack-preventative.
8. Claim immunity against training-time data poisoning or zero-day network threats.

---

## 22. Go/No-Go Recommendation for Implementation

### Assessment Summary:
- **Baseline Invariants:** Verified (Stage 1 hash, Stage 2 hash, training hash, testing hash all intact).
- **Component Readiness:** All subsystems (Stage 1, Stage 2, ModelRegistry contract, Advisory Response Taxonomy, SQLite Audit Service) are fully implemented and unit-tested.
- **Architectural Clarity:** Integration Option B cleanly resolves backward-compatibility and regression concerns.
- **Integrity Risk Mitigation:** All 10 identified risks have defined experimental and documentation controls.

### Formal Recommendation:
> **STATUS: GO FOR IMPLEMENTATION.**  
> The research design is sound, comprehensive, mathematically consistent, and strictly aligned with academic integrity standards. Phase 7B.5 implementation may proceed upon user authorization.
