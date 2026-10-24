# Phase 6B: Comparative Evaluation & Security Evidence Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Phase:** 6B (Comparative Evaluation & Security Evidence)
**Date:** October 24, 2026
**Status:** COMPLETE & EMPIRICALLY VERIFIED

---

## 1. Title & Executive Summary

This report establishes the formal comparative evaluation for the B.Tech final-year research project:
> **“Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection”**

The objective of Phase 6B is to conduct a rigorous, fair, and academically structured comparative evaluation across three progressively stronger model-integrity and provenance architectures:
1. **Configuration A (ML-Only Baseline):** Standard machine learning inference deployment without cryptographic artifact verification.
2. **Configuration B (SHA-256-Only Integrity Verification):** Pre-load artifact integrity verification using local SHA-256 computation compared against an off-chain expected digest.
3. **Configuration C (SHA-256 + Blockchain-Backed Provenance Verification):** The evaluated full architecture combining local SHA-256 hashing, smart-contract registry queries, and fail-closed gate enforcement.

Through ten targeted experiments (**B1–B10**), this evaluation empirically measures intrusion detection capabilities, cryptographic tamper detection, provenance authorization, pre-load verification overheads, operational decoupling during runtime inference, and local forensic audit logging fidelity.

---

## 2. Phase & Date

- **Evaluation Phase:** Phase 6B (Comparative Evaluation & Security Evidence)
- **Baseline Checkpoint:** `4c11e071c8fda45f2c2383bdefbe82b18306fc0c` (Phase 6A.2 closed)
- **Execution Date:** October 24, 2026
- **Target Branch:** `master`

---

## 3. Research Question

The comparative evaluation addresses the core research question:

> **Does blockchain-backed model provenance provide measurable security and provenance benefits beyond local SHA-256 integrity verification alone, while keeping verification overhead completely decoupled from the evaluated per-flow inference path?**

### Core Research Demarcation Boundaries
To ensure absolute scientific rigor, the experimental framework strictly separates functional layers:
- **Intrusion Classification (ML):** Evaluates tabular network-flow feature vectors to detect malicious flows. Does not inspect artifact authenticity or enforce provenance.
- **Artifact Integrity (SHA-256):** Provides deterministic, byte-for-byte binary verification against a reference digest. Does not verify version registration, model correctness, or semantic safety.
- **Provenance Registry (Smart Contract):** Authorizes model release identity, version, algorithm, digest, and deployer address via on-chain state. Does not inspect network flows or retrain models.
- **Runtime Inference (Off-Chain Memory):** Executes flow predictions completely in local RAM. **No blockchain queries are performed during runtime network-flow classification.**

---

## 4. Comparative Architecture

The evaluation systematically compares three distinct system configurations:

```
[Configuration A: ML-Only Baseline]
Network Flows ----> [ Model Loaded in Memory ] ----> Intrusion Predictions
                     (No integrity gate)

[Configuration B: SHA-256-Only Integrity Verification]
Model on Disk ----> [ Local SHA-256 Compute ] == [ Expected Digest (Off-Chain) ]
                           | (Match: Load to Memory)
Network Flows -----------> [ Model in Memory ] ----> Intrusion Predictions (Off-Chain)

[Configuration C: SHA-256 + Blockchain-Backed Provenance Verification]
Model on Disk ----> [ Local SHA-256 Compute ]
                           |
                      [ EVM ModelRegistry Query ] == [ Registered State (On-Chain) ]
                           | (Match & Registered: Load to Memory)
Network Flows -----------> [ Model in Memory ] ----> Intrusion Predictions (Off-Chain)
                                 |
                           [ SQLite Local Audit Log (Off-Chain) ]
```

### Architectural Distinctions

| Feature / Responsibility | Configuration A (ML-Only) | Configuration B (SHA-Only) | Configuration C (SHA + Blockchain) |
| :--- | :---: | :---: | :---: |
| **Model Classification Engine** | Random Forest (100 trees) | Random Forest (100 trees) | Random Forest (100 trees) |
| **Pre-Load Integrity Check** | None | Local SHA-256 Digest | Local SHA-256 Digest |
| **Digest Reference Source** | None | Off-Chain Trusted String | On-Chain Smart Contract |
| **Model Version Authorization** | None | None (Digest match only) | Enforced (`ModelRegistry.sol`) |
| **Fail-Closed Loading Gate** | Absent | Application-level check | Enforced Gate (`/predict` 503) |
| **Forensic Audit Logging** | None | None | SQLite WAL Structured Log |
| **Runtime Inference Path** | Pure off-chain compute | Pure off-chain compute | Off-chain (zero chain queries) |

---

## 5. Experimental Methodology

All benchmark trials were executed within a controlled evaluation environment:
- **Operating System:** Windows 11 Pro (10.0.26300)
- **Python Runtime:** Python 3.12.4 (64-bit)
- **Processor Architecture:** Intel64 Family 6 Model 154 Stepping 3 (GenuineIntel)
- **EVM Execution Provider:** `EthereumTesterProvider` (`py-evm` in-process virtual machine)
- **Web3 Interface:** `web3.py` v7.8.0
- **Smart Contract:** `ModelRegistry.sol` (Solidity `^0.8.20`, deployed at `0xF2E246BB76DF876Cef8b38ae84130F4F55De395b`)
- **Canonical Model Artifact:** `ml/artifacts/ids_model.joblib` (6,319,677 bytes; SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`)
- **Benchmark Traffic:** UNSW-NB15 testing partition (`UNSW_NB15_testing-set.csv`, 175,341 records)
- **Statistical Discipline:**
  - $N = 30$ repeated trials for all pre-load verification measurements.
  - $N = 100$ repeated trials for runtime inference measurements.
  - 5 warm-up iterations executed and discarded prior to recording inference latencies.
  - Percentile bootstrap 95% confidence intervals (1,000 resamples, fixed seed).

---

## 6. Configuration A — ML-Only Baseline (Experiment B1)

Experiment B1 characterizes the baseline intrusion detection capability of the Random Forest model and measures pure compute latency in local memory without integrity gates.

### A. Detection Capabilities (Full UNSW-NB15 Test Partition, $N=175,341$)
- **Accuracy:** 90.30% (0.902978)
- **Precision:** 98.78% (0.987778)
- **Recall (Detection Rate):** 86.82% (0.868193)
- **F1 Score:** 92.41% (0.924133)
- **Specificity:** 97.71% (0.977107)
- **False Positive Rate (FPR):** 2.29% (0.022893)
- **ROC-AUC Score:** 98.60% (0.985992)
- **Confusion Matrix:**
  - True Positives (TP): 103,611
  - True Negatives (TN): 54,718
  - False Positives (FP): 1,282
  - False Negatives (FN): 15,730

### B. Pure Off-Chain Model Inference Latency ($N=100$ flow records)
- **Mean Latency:** 42.40 ms (95% Bootstrap CI: [41.25, 43.61] ms)
- **Median Latency:** 42.45 ms
- **Standard Deviation ($\sigma$):** 5.99 ms
- **Minimum Latency:** 34.12 ms
- **Maximum Latency:** 70.54 ms
- **Pre-Load Verification Cost:** 0.00 ms (no verification gate present)

### C. Scientific Boundary Assertion
These metrics characterize the Random Forest network-flow classifier alone. They do **not** demonstrate that blockchain improves ML accuracy, precision, or detection efficacy. In this baseline, an unauthorized or modified model binary is loaded without detection.

---

## 7. Configuration B — SHA-Only Pre-Load Integrity Verification (Experiment B2)

Experiment B2 evaluates pre-load cryptographic verification using local SHA-256 computation against a trusted off-chain digest.

### A. Verification Latency Distribution ($N=30$ repeated trials)
- **Evaluated File:** `ids_model.joblib` (6,319,677 bytes)
- **Expected SHA-256:** `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- **Mean Latency:** 5.65 ms (95% Bootstrap CI: [5.60, 5.70] ms)
- **Median Latency:** 5.62 ms
- **Standard Deviation ($\sigma$):** 0.14 ms
- **Minimum Latency:** 5.41 ms
- **Maximum Latency:** 6.06 ms
- **Canonical Verification Status:** `VERIFIED` (100% of trials, 30/30)

### B. Tampered Artifact Detection
- An isolated temporary copy of the artifact was created and mutated by appending 37 sentinel bytes (`b"\x00\xffUNAUTHORIZED_WEIGHT_MUTATION_TEST\xff\x00"`).
- **Tampered SHA-256:** `9950cf966e4b2699393eda86feca43fd2020a4f0a82b8e070f11b63ba086ae30`
- **Outcome:** Deterministically rejected as `HASH_MISMATCH` in 13.66 ms.
- **Canonical Model Preservation:** Confirmed unaltered byte-for-byte on disk.

### C. Architectural Assessment
Configuration B successfully detects local artifact modifications. However, it relies entirely on a caller-provided or statically configured expected digest. It provides no independent version registry, release lifecycle management, or on-chain governance authorization.

---

## 8. Configuration C — SHA-256 + Blockchain-Backed Provenance Verification (Experiment B3)

Experiment B3 measures the complete blockchain-backed verification gate and isolates its constituent latency components across $N=30$ trials.

### Component Latency Decomposition ($N=30$ trials)

| Verification Component | Sample Size ($N$) | Mean (ms) | Median (ms) | Std Dev (ms) | Min (ms) | Max (ms) | 95% Bootstrap CI (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Local SHA-256 Hashing** | 30 | 5.40 | 5.13 | 0.74 | 4.60 | 7.76 | [5.16, 5.67] |
| **On-Chain Registry Read** | 30 | 8.90 | 7.91 | 2.07 | 6.99 | 13.70 | [8.21, 9.68] |
| **Total Pre-Load Gate** | 30 | 20.31 | 19.44 | 2.74 | 16.78 | 28.91 | [19.37, 21.30] |

### Analysis
- Local disk hashing of the 6.3 MB model binary accounts for $\approx 26.6\%$ of the total gate time.
- The in-process EVM smart contract state read (`getModel`) accounts for $\approx 43.8\%$.
- Model deserialization preparation, bytes32 conversion, and status checks account for the remaining $\approx 29.6\%$.
- All legitimate trials evaluated deterministically as `VERIFIED`.

---

## 9. Tampered Artifact Comparative Evaluation (Experiment B4)

Experiment B4 evaluates all three configurations against an isolated, tampered model binary.

| Evaluation Metric / Behavior | Configuration A (ML-Only) | Configuration B (SHA-Only) | Configuration C (SHA + Blockchain) |
| :--- | :---: | :---: | :---: |
| **Tampered Detection Gate** | None | Local SHA-256 Comparison | On-Chain Registry Gate |
| **Verification Outcome** | `NO_GATE` | `HASH_MISMATCH` | `HASH_MISMATCH` |
| **Binary Modification Detected?** | **No** | **Yes** | **Yes** |
| **Model Loaded into Memory?** | **Yes** (Untrusted) | **No** (Aborted) | **No** (Aborted) |
| **Fail-Closed API Response** | N/A (Inference Served) | Application-level error | **HTTP 503 Service Unavailable** |
| **Inference Attempt Allowed?** | Allowed | Denied | Denied |
| **Forensic Audit Logged?** | No | No | **Yes** (`MODEL_VERIFICATION_FAILURE`) |

### Key Takeaway
While both Configuration B and Configuration C reliably detect unauthorized byte modifications, Configuration C binds this detection directly to the backend application lifecycle, fail-closed REST API gating, and structured audit persistence.

---

## 10. Unregistered Model/Version Comparative Evaluation (Experiment B5)

Experiment B5 evaluates the system when presented with an unregistered model identity and version key (`iot-ids-rf:v9.9.9`).

| Dimension | Configuration A (ML-Only) | Configuration B (SHA-Only) | Configuration C (SHA + Blockchain) |
| :--- | :--- | :--- | :--- |
| **Evaluated Key** | `iot-ids-rf:v9.9.9` | `iot-ids-rf:v9.9.9` | `iot-ids-rf:v9.9.9` |
| **Registry Check Present?** | **No** | **No** | **Yes** (`ModelRegistry.sol`) |
| **Version Authorization** | N/A | Unverified (Digest match only) | **REJECTED (`NOT_REGISTERED`)** |
| **Model Loaded in RAM?** | Yes | Depends on external hash | **False (Loading blocked)** |
| **`/predict` API Code** | HTTP 200 | Application-dependent | **HTTP 503** |
| **Security Finding** | No provenance protection | Lacks registry-membership check | **Fail-closed provenance enforcement** |

### Critical Research Finding: Integrity vs. Provenance Authorization
This experiment highlights the decisive distinction between cryptographic integrity and provenance authorization:
- **Integrity Verification (SHA-only):** Answers *"Has this specific binary file changed byte-for-byte?"* If an attacker replaces the binary with a valid, differently trained model and updates the expected hash file, SHA-only will declare the artifact valid.
- **Provenance Authorization (SHA + Blockchain):** Answers *"Has this specific model identity and version been authorized and registered on-chain by the designated administrator?"* An unregistered model/version is rejected by the evaluated provenance gate, preventing that tested substitution scenario from proceeding through the model-loading path. This result demonstrates deterministic rejection of the tested unregistered key (`v9.9.9`) under the evaluated trust assumptions; it is not a universal guarantee against every arbitrary model-substitution attack vector, nor does it establish that the registered model artifact is inherently benign or semantically safe.

---

## 11. Pre-Load Verification Overhead Comparative Analysis (Experiment B6)

Experiment B6 quantifies the pre-load verification overhead introduced by cryptographic hashing and blockchain registry queries.

| System Configuration | Pre-Load Verification Scope | $N$ | Mean (ms) | Median (ms) | Std Dev (ms) | Min (ms) | Max (ms) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Config A (ML-Only)** | No verification gate | — | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| **Config B (SHA-Only)** | Local disk hashing (6.3MB) | 30 | 5.65 | 5.62 | 0.14 | 5.41 | 6.06 |
| **Config C (SHA + Blockchain)** | Hashing + On-Chain State Read | 30 | 20.31 | 19.44 | 2.74 | 16.78 | 28.91 |

### Incremental Blockchain Cost Metrics
- **Absolute Incremental Mean Overhead ($C - B$):** $+14.66\text{ ms}$
- **Absolute Incremental Median Overhead ($C - B$):** $+13.82\text{ ms}$
- **Overhead Ratio ($C / B$):** $3.60\times$
- **Verification vs. Pure Inference Ratio ($C / \text{ML}$):** $0.48\times$ (Pre-load verification is less than half of a single pure inference cycle).

### Operational Classification
This overhead is incurred strictly as a **pre-load verification cost** during model initialization before memory loading. The evaluated pre-load verification operations are outside the per-flow inference path; no blockchain lookup or model re-hashing is performed during network-flow classification. This establishes architectural separation of the measured verification operations from the evaluated inference path, but it is not a controlled throughput measurement.

---

## 12. Runtime Inference Separation (Experiment B7)

Experiment B7 measures runtime per-flow inference performance after the verified model has been loaded into server memory.

### Empirical Latency Measurements ($N=100$ trials)
- **Pure ML Off-Chain Inference (Local Memory):**
  - Mean: 42.40 ms (95% CI: [41.25, 43.61] ms)
  - Median: 42.45 ms
  - Std Dev: 5.99 ms
- **End-to-End API Request (`/predict` HTTP + Validation + Predict + SQLite Log):**
  - Mean: 51.49 ms (95% CI: [50.37, 52.99] ms)
  - Median: 49.73 ms
  - Std Dev: 7.02 ms
  - Maximum: 109.05 ms

### Operational Decoupling Verification
1. **Zero Per-Flow Blockchain Queries:** Exactly 0 EVM RPC calls, smart contract queries, or transactions are dispatched during `/predict` calls.
2. **Zero Per-Flow Hash Recomputations:** The 6.3 MB binary is not re-hashed during flow evaluation.
3. **Off-Chain Execution:** The evaluated per-flow inference path performs prediction without a blockchain lookup.

---

## 13. Comparative Security Outcome Matrix (Experiment B8)

Experiment B8 consolidates the comparative security outcomes across all five critical operating scenarios:

| Operational Scenario | Configuration A (ML-Only) | Configuration B (SHA-Only) | Configuration C (SHA + Blockchain) |
| :--- | :--- | :--- | :--- |
| **1. Registered legitimate artifact** | Accepted / Loaded (No integrity gate) | Accepted / Loaded (Matches expected digest) | Accepted / Loaded (Matches on-chain registered digest) |
| **2. Locally modified artifact** | No artifact-integrity verification is performed in this baseline. | Rejected (HASH_MISMATCH against expected digest) | Rejected (HASH_MISMATCH; fail-closed; HTTP 503) |
| **3. Unregistered model / version** | No provenance registry check exists in this baseline. | Provides local artifact-integrity comparison but no blockchain-backed registry-membership check. | Rejected (NOT_REGISTERED; fail-closed; HTTP 503) |
| **4. Verification failure handling** | No verification gate present | Fail closed (loading aborted) | Fail closed (loading aborted; HTTP 503; audited) |
| **5. Runtime inference after load** | Available (off-chain execution) | Available (off-chain execution; no per-flow hash) | Available (off-chain execution; no blockchain lookup) |

---

## 14. Statistical & Comparative Summary (Experiment B9)

Experiment B9 compiles descriptive statistics and 95% bootstrap confidence intervals across all measured operations:

| System Operation | Scope / Architecture | $N$ | Mean (ms) | Median (ms) | Std Dev (ms) | Min (ms) | Max (ms) | 95% Bootstrap CI (ms) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Local SHA-256 Hashing Alone** | Config B Pre-Load Gate | 30 | 5.65 | 5.62 | 0.14 | 5.41 | 6.06 | [5.60, 5.70] |
| **In-Process EVM Read Alone** | Config C Component | 30 | 8.90 | 7.91 | 2.07 | 6.99 | 13.70 | [8.21, 9.68] |
| **Total Pre-Load Verification Gate** | Config C Total Pre-Load | 30 | 20.31 | 19.44 | 2.74 | 16.78 | 28.91 | [19.37, 21.30] |
| **Pure ML Off-Chain Inference** | RAM Compute (Per-Flow) | 100 | 42.40 | 42.45 | 5.99 | 34.12 | 70.54 | [41.25, 43.61] |
| **End-to-End API /predict Request** | HTTP + Audit (Per-Flow) | 100 | 51.49 | 49.73 | 7.02 | 45.84 | 109.05 | [50.37, 52.99] |

---

## 15. Forensic Audit Evidence & Demarcation (Experiment B10)

Experiment B10 validates the operational security audit trail generated during system execution.

### A. Event Frequency Distribution (10 Total Events)
- `PREDICTION`: 5 events (off-chain flow classifications with prediction label and latency)
- `MODEL_LOAD_BLOCKED`: 2 events (unverified boot state and tampered artifact attempts blocked)
- `MODEL_VERIFICATION`: 1 event (successful legitimate model verification logged)
- `MODEL_VERIFICATION_FAILURE`: 1 event (tampered artifact mismatch logged with diff details)
- `MODEL_LOAD`: 1 event (authorized model deserialization logged)

### B. Payload Privacy Verification
- An automated audit of all event records confirmed that **zero raw network flow feature dictionaries** (e.g., `sload`, `dload`, `sinpkt`, `dinpkt`) are persisted. Only summary classifications, latency timings, and status flags are recorded.

### C. Architectural Demarcation
- The SQLite audit database is an off-chain operational store optimized for local forensic review. It is **not** an on-chain ledger and does not provide decentralized Byzantine fault tolerance.

---

## 16. Generated Comparative Figures

Two thesis-ready evaluation figures were generated under `reports/figures/`:

1. **Figure 4: Comparative Verification Overhead**
   - File: [`reports/figures/figure4_comparative_verification_overhead.png`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/figures/figure4_comparative_verification_overhead.png)
   - *Description:* Dual-panel chart illustrating pre-load verification overhead across Configurations A, B, and C alongside runtime inference latencies, illustrating the cost separation between initialization gates and runtime prediction.
2. **Figure 5: Comparative Security Properties Matrix**
   - File: [`reports/figures/figure5_comparative_security_matrix.png`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/figures/figure5_comparative_security_matrix.png)
   - *Description:* Visual capability matrix highlighting the progression from ML-only (unprotected) to SHA-only (integrity verification) to SHA + Blockchain (provenance authorization, fail-closed enforcement, and auditability).

---

## 17. Research-Integrity Audit Summary

An automated scan of all Phase 6B documentation, scripts, and results verified:
- **Zero Unsupported Performance or Security Claims:** Confirmed 0 unsupported claims regarding `real-time`, `wire-speed`, `high-throughput`, `zero latency`, `zero overhead`, `zero runtime penalty`, `sub-50 ms`, `tamper-proof`, `guaranteed secure`, `blockchain improves accuracy`, `blockchain detects attacks`, `proves model safety`, `decentralized public blockchain performance`, or `packet-level` processing.
- **Legitimate Disclaimers Preserved:** All reported latencies are explicitly qualified as local benchmark observations without constituting hardware SLAs, wire-speed guarantees, or public network performance claims.
- **Demarcation Confirmed:** ML classifies flows; SHA-256 verifies binary integrity; blockchain authorizes model release provenance; inference runs off-chain without per-prediction blockchain lookups.

---

## 18. Threats to Validity

1. **Construct Validity:** Local EVM execution (`py-evm`) accurately captures smart contract bytecode execution but does not model peer-to-peer network transport delay or public mempool dynamics.
2. **Internal Validity:** OS process scheduling introduces latency variance ($\sigma = 2.74\text{ ms}$ on verification, $\sigma = 5.99\text{ ms}$ on pure inference). Discarding 5 warm-up trials and using $N \ge 30$ sample sizes mitigates transient execution variance.
3. **External Validity:** UNSW-NB15 evaluates tabular network-flow summary features rather than live physical network packets; specialized IoT hardware (e.g., microcontrollers) may exhibit different memory and hashing constraints.

---

## 19. Limitations

1. **Benchmark Scope:** The evaluation uses UNSW-NB15 network-flow records, not raw physical NIC packet buffers.
2. **Execution Environment:** In-process EVM testing does not simulate blockchain validator reorganizations, 51% attacks, or dynamic gas pricing.
3. **Audit Ledger Scope:** The SQLite database is an off-chain operational store and does not claim to be a distributed consensus ledger.
4. **Security Boundaries:** SHA-256 verification confirms artifact integrity against a registered digest; it does not protect against training data poisoning or runtime evasion attacks.

---

## 20. Reproducibility Instructions

To reproduce the complete Phase 6B comparative results:

```bash
# 1. Run the Phase 6B comparative evaluation harness
python scripts/run_phase6b_experiments.py

# 2. Run automated regression test suites
python -m pytest tests -v
cd frontend && npm test -- --run && npm run build && cd ..
```

---

## 21. Git Checkpoint & Stopping Rule

- **Starting Baseline Checkpoint:** `4c11e071c8fda45f2c2383bdefbe82b18306fc0c`
- **Commit Convention:** In accordance with the self-reference rule, the final commit SHA will not be embedded in this report and will be reported externally upon push.
- **Stopping Rule Enforced:** Phase 6B is COMPLETE. Phase 6C has NOT been started.
