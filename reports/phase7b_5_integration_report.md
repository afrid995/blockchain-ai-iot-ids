# Phase 7B.5 Integration Report: Final End-to-End Hierarchical Integration

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** Phase 7B.5.3 — Final End-to-End Hierarchical Integration  
**Date:** October 2026  
**Starting Checkpoint:** `96e7d8de29930d5384b007e582d4ddaf82690413`  
**Status:** COMPLETE, VERIFIED & EXPERIMENTALLY VALIDATED (ALL E1–E7 PASS)  

---

## 1. Research Question and Objective

### 1.1 Primary Research Question
> **Can an end-to-end intrusion detection system integrate decentralized cryptographic model provenance, two-stage hierarchical inference (Binary IDS $\to$ Multiclass Attack Classifier), and deterministic advisory mitigation recommendations, while strictly guaranteeing zero blockchain overhead during per-flow runtime inference and maintaining tamper-evident auditability without exposing raw telemetry?**

### 1.2 Core Architectural Thesis
The core thesis of this research is **architectural decoupling**:
1. **Pre-Inference Cryptographic Gate:** Blockchain interaction occurs strictly once during application startup or model initialization. SHA-256 digests of the serialized model artifacts are compared against on-chain immutable commitments in `ModelRegistry.sol`.
2. **Off-Chain Runtime Inference:** Runtime network flow processing is completely decoupled from the blockchain. Stage 1 binary classification routes traffic; benign flows are classified as `"Normal"`, bypassing Stage 2. Attack flows trigger Stage 2 multiclass classification into one of 9 UNSW-NB15 attack categories.
3. **Advisory Non-Remediating Response:** The classified category is deterministically mapped to human-in-the-loop operational guidance (`is_advisory = True`, `requires_human_approval = True`, `automated_remediation_enabled = False`).
4. **Append-Oriented Security Auditing:** Decisions and metadata are logged to a local SQLite database, strictly omitting raw 42-dimensional flow feature vectors.

---

## 2. Integrated System Architecture

```text
[APPLICATION STARTUP / INITIALIZATION GATE]
  Local Artifact: ids_model.joblib ─────────► Compute SHA-256 ──┐
  Local Artifact: attack_classifier.joblib ──► Compute SHA-256 ──┤
                                                                ▼
                                                   Compare against On-Chain Digest
                                                   (ModelRegistry.sol on Local EVM)
                                                                │
                                            ┌───────────────────┴───────────────────┐
                                            ▼                                       ▼
                                       [VERIFIED]                            [HASH_MISMATCH]
                                 Authorize In-Memory Load                 Fail-Closed Abort
                                            │                                       │
                                            ▼                                       ▼
                             [READY FOR RUNTIME INFERENCE]                MODEL_LOAD_BLOCKED
                                            │
────────────────────────────────────────────┼────────────────────────────────────────────────────
[PER-FLOW RUNTIME INFERENCE (OFF-CHAIN)]    │  (Blockchain Lookups == 0)
                                            ▼
                                   Input Network Flow (42 features)
                                            │
                                            ▼
                                  Stage 1: Binary IDS (Random Forest)
                                            │
                             ┌──────────────┴──────────────┐
                             │                             │
                      Benign (0)                      Attack (1)
                             │                             │
                             ▼                             ▼
                         "Normal"                 Stage 2: Multiclass Classifier
                             │                    (Balanced Random Forest)
                             │                             │
                             │                             ▼
                             │                 One of 9 Attack Categories
                             │                             │
                             └──────────────┬──────────────┘
                                            ▼
                               Advisory Response Recommendation
                               (Deterministic Taxonomy Mapping)
                                            │
                                            ▼
                                 Human Security Operator
                                            │
                                            ▼
                               SQLite Append-Oriented Security Log
                               (Event metadata only; NO raw features)
```

---

## 3. Cryptographic and Dataset Invariants

All evaluations were executed on authentic canonical assets with zero modifications, retrainings, or regenerations:

| Asset | Path | Verified SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| **Stage 1 Binary Model** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `VERIFIED` |
| **Stage 2 Multiclass Model** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `VERIFIED` |
| **Training Dataset** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | `VERIFIED` |
| **Testing Dataset** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | `VERIFIED` |

Neither classifier was retrained or altered. Ground-truth benchmark files were processed in read-only mode.

---

## 4. Experimental Matrix (E1–E7) Results

All seven planned experiments were executed by `experiments/final_end_to_end_integration.py` and validated by 102 automated unit and integration tests.

### 4.1 E1: Legitimate End-to-End Pipeline
- **Methodology:** Verified legitimate Stage 1 (`iot-ids-rf:v1.0.0`) and Stage 2 (`iot-ids-attack-classifier:v1.0.0`) artifacts against `ModelRegistry.sol` deployed on the local in-memory EVM testbed (`EthereumTesterProvider`).
- **Results:**
  - Startup Provenance Gate: `VERIFIED` ($T_{\text{gate}} = 580.38\text{ ms}$).
  - Benign Flow Processing: Correctly routed to `"Normal"`; Stage 2 was not invoked.
  - Attack Flow Processing: Correctly triggered Stage 2 multiclass classification (`DoS`).
  - Runtime Blockchain Calls: Exactly 0.
  - **Outcome:** **PASS**.

### 4.2 E2: Stage 1 Artifact Tampering
- **Methodology:** Created a temporary byte-copy of `ids_model.joblib` and mutated byte offset 150 (`0x00` $\to$ `0xFF`).
- **Results:** Local SHA-256 digest (`5931b648...`) diverged from the registered digest (`dc5e1688...`). Verification returned `HASH_MISMATCH`. Memory loading was aborted (`is_loaded = False`). Canonical artifact hash was recomputed and confirmed unaltered.
- **Outcome:** **PASS**.

### 4.3 E3: Stage 2 Artifact Tampering
- **Methodology:** Created a temporary byte-copy of `attack_classifier.joblib` and mutated byte offset 150 (`0x00` $\to$ `0xFF`).
- **Results:** Local SHA-256 digest (`419cd9e3...`) diverged from the registered digest (`596b98ce...`). Verification returned `HASH_MISMATCH`. Multiclass model loading was aborted (`is_loaded = False`). Canonical artifact hash was confirmed unaltered.
- **Outcome:** **PASS**.

### 4.4 E4: Unregistered Model Version
- **Methodology:** Attempted to load `STAGE2_MODEL_ID` with non-existent semantic version `v9.9.9`.
- **Results:** Smart contract returned `NOT_REGISTERED`. The gate failed closed (`is_loaded = False`).
- **Outcome:** **PASS**.

### 4.5 E5: Missing Model Artifact
- **Methodology:** Pointed model loader to non-existent path `non_existent_model.joblib`.
- **Results:** System returned `FILE_NOT_FOUND` gracefully without unhandled exceptions or crash. Loading remained blocked.
- **Outcome:** **PASS**.

### 4.6 E6: Full Hierarchical Test-Set Evaluation ($N = 175,341$)
- **Methodology:** Evaluated all 175,341 authentic UNSW-NB15 test flows through the operational pipeline.
- **Routing Reconciliation:**
  - Stage 1 Predicted Benign: **70,448 flows** (bypassed Stage 2, output `"Normal"`).
  - Stage 1 Predicted Attack: **104,893 flows** (routed to Stage 2).
  - Stage 2 Routed Count: **104,893 flows** ($100\%$ routing match: $\text{Stage2\_routed} \equiv \text{Stage1\_predicted\_attack}$).
- **Binary Stage 1 Metrics ($N = 175,341$):**
  - Accuracy: **90.30%** (158,329 / 175,341)
  - Precision: **98.78%**
  - Recall: **86.82%** (103,611 / 119,341)
  - F1-Score: **92.41%**
  - Specificity: **97.71%** (54,718 / 56,000)
  - False Positive Rate: **2.29%** (1,282 / 56,000)
- **Error Propagation & Cascade Decomposition:**
  - True Attacks Missed at Stage 1 (False Negatives): **15,730 flows** ($13.18\%$ of all attacks).
  - True Attacks Reaching Stage 2: **103,611 flows** ($86.82\%$ of all attacks).
  - Benign Flows Misrouted to Stage 2 (False Positives): **1,282 flows** ($2.29\%$ of benign flows).
  - Correct Category Attribution: **76,870 flows** ($64.41\%$ of all true attacks).
  - Misclassified Category Attribution: **26,741 flows** ($22.41\%$ of all true attacks).
  - Routed Attack Metrics: Macro F1 = **51.43%**, Balanced Accuracy = **51.20%**.
- **Advisory Recommendation Distribution:**
  - Normal: **70,448** (40.18%)
  - Generic: **40,344** (23.01%)
  - Exploits: **21,725** (12.39%)
  - DoS: **24,538** (13.99%)
  - Reconnaissance: **8,698** (4.96%)
  - Fuzzers: **4,242** (2.42%)
  - Backdoor: **2,952** (1.68%)
  - Shellcode: **1,189** (0.68%)
  - Analysis: **1,171** (0.67%)
  - Worms: **34** (0.02%)
  - Total: **175,341 flows** (reconciled exactly with Phase 7B.4).
- **Per-Flow Blockchain Query Counter:** Measured count = **0 queries**.
- **Outcome:** **PASS**.

### 4.7 E7: Lifecycle Audit Traceability & Data Privacy
- **Methodology:** Verified SQLite audit event records emitted during pipeline execution.
- **Results:**
  - Successfully captured all lifecycle event types: `MODEL_VERIFICATION`, `MODEL_LOAD`, `PREDICTION`, `ADVISORY_RECOMMENDATION`.
  - Audited `details_json` records across all events: **0 raw 42-feature vectors were persisted**. Only prediction labels, latency, confidence, and metadata were stored.
  - Events retrievable by unique `event_id` UUID.
- **Outcome:** **PASS**.

---

## 5. Latency Profiling and Decoupling Analysis

Component-level latency profiling was conducted across $N = 100$ deterministic UNSW-NB15 test flows (50 benign, 50 attack) on local CPU execution:

| Pipeline Component | Measurement Target | Mean Latency | Median Latency | Min Latency | Max Latency | Std Dev |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **$T_{\text{gate}}$** | Startup SHA-256 + EVM contract query ($N=30$) | 70.9822 ms | 70.6218 ms | 56.7868 ms | 81.8213 ms | 5.7418 ms |
| **$T_{L1}$** | Stage 1 Binary Inference ($N=100$) | 23.4012 ms | 21.8913 ms | 16.0354 ms | 58.2146 ms | 6.9460 ms |
| **$T_{L2}$** | Stage 2 Multiclass Inference ($N=100$) | 23.1111 ms | 22.5374 ms | 16.2843 ms | 38.3029 ms | 5.1025 ms |
| **$T_{\text{rec}}$** | In-Memory Advisory Taxonomy Mapping ($N=100$) | 0.0193 ms | 0.0178 ms | 0.0119 ms | 0.0838 ms | 0.0097 ms |
| **$T_{\text{hier}}$** | Conditional Hierarchical Pipeline ($N=100$) | 41.1628 ms | 43.3654 ms | 16.1744 ms | 85.9261 ms | 13.8110 ms |
| **$T_{\text{uncond}}$**| Unconditional Two-Stage Execution ($N=100$) | 46.5316 ms | 44.4303 ms | 32.3730 ms | 85.9261 ms | 10.0296 ms |

### Empirical Insights on Latency:
1. **Measured Mean-Latency Reduction:** Conditional execution (bypassing Stage 2 on benign flows) yielded an **11.54% reduction in measured mean runtime inference latency** compared to unconditional two-stage execution ($41.16\text{ ms}$ vs. $46.53\text{ ms}$).
2. **Advisory Overhead:** The deterministic dictionary lookup ($T_{\text{rec}} = 0.019\text{ ms}$) contributes less than $0.05\%$ of total inference time.
3. **Decoupling Verification:** The per-flow blockchain query counter was confirmed at exactly **0**. The pre-load verification latency ($70.98\text{ ms}$) is incurred strictly once at startup and does not contaminate runtime packet processing.

---

## 6. Error Propagation and Operational Realities

The end-to-end integration highlights critical error propagation characteristics across the cascade:

1. **The False-Negative Blind Spot:**
   - 15,730 true attack flows were classified as Benign by Stage 1.
   - These flows were never routed to Stage 2 and received `"Normal"` advisory guidance (Informational / Low priority).
   - Among these missed attacks, **13,520 flows belong to the Fuzzers category** ($74.35\%$ of all Fuzzers in the benchmark).
2. **Benign False Alarms:**
   - 1,282 true benign flows were misclassified as attacks by Stage 1 ($2.29\%$ false positive rate).
   - These flows reached Stage 2 and received attack mitigation guidance (primarily Generic: 761, Exploits: 409), which would prompt unnecessary operator investigation.
3. **Stage 2 Category Confusion:**
   - 26,741 attack flows reached Stage 2 but were assigned an incorrect attack category ($22.41\%$ of all attacks).
   - For example, Exploits misclassified as DoS receive traffic rate-limiting recommendations rather than software patching advice.
4. **Minority Class Suppression:**
   - Worms (34 total predicted flows out of 130 true Worms) achieved $15.38\%$ end-to-end recall.
   - Analysis (1,171 total predicted flows out of 2,000 true Analysis) achieved $2.95\%$ end-to-end recall.

---

## 7. Security Threat Model Boundaries

| Threat Vector | Addressed? | Evaluated Defense Mechanism | Status |
| :--- | :---: | :--- | :--- |
| **Post-Training Model Tampering** | **YES** | Pre-load SHA-256 verification against on-chain hash | **Enforced** (Immediate fail-closed abort) |
| **Unauthorized Model Replacement** | **YES** | On-chain registrant and version verification | **Enforced** (`NOT_REGISTERED` blocks load) |
| **Silent Bit-Rot / Disk Corruption** | **YES** | Startup cryptographic hash recomputation | **Enforced** (`HASH_MISMATCH` blocks load) |
| **Telemetry Snooping / Privacy Leak** | **YES** | Strict exclusion of raw 42 features from SQLite logs | **Enforced** (Only event metadata stored) |
| **Autonomous Defense Failure** | **YES** | Mandatory human approval flags (`is_advisory=True`) | **Enforced** (Zero executable command templates) |
| **Adversarial Flow Perturbation** | **NO** | Out of scope; standard Random Forest evaluated | **Explicit Limitation** |
| **Poisoning of Training Data** | **NO** | Hash verifies artifact match, not data provenance | **Explicit Limitation** |
| **Compromised Registry Owner Key** | **NO** | Smart contract trusts authorized registrant | **Explicit Limitation** |

---

## 8. Reproducibility Instructions

To replicate the complete E1–E7 evaluation:

```bash
# 1. Activate project environment
python -V  # Verified on Python 3.12.4

# 2. Run the final end-to-end integration experiment
python experiments/final_end_to_end_integration.py

# 3. Run all unit and integration test suites
python -m pytest tests -v

# 4. Verify frontend build
cd frontend
npm test -- --run
npm run build
cd ..
```

---

## 9. Explicit Non-Claims

In strict compliance with research-integrity standards:
1. **No Autonomous Remediation:** We do NOT claim that this system blocks attacks, isolates hosts, drops packets, or executes firewall rules.
2. **No Model Correctness Claim:** We do NOT claim that blockchain registration proves model accuracy, fairness, or freedom from backdoors. The registry strictly provides **tamper-evidence against artifact substitution**.
3. **No Zero-Overhead Claim:** We do NOT claim zero computational or runtime overhead. We report exact measured millisecond execution durations on local CPU hardware.
4. **No Real-World IoT Equivalence:** We do NOT claim that UNSW-NB15 results directly generalize to live, heterogeneous physical IoT sensor networks running modern protocols (MQTT, CoAP).
5. **No Public Mainnet Extrapolation:** We do NOT claim that local in-process EVM timings represent public Ethereum mainnet latency or gas economics.
