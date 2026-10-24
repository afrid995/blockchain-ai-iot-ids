# Phase 6C: Final Experimental Synthesis & Statistical Evidence Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Phase:** 6C (Final Experimental Synthesis & Statistical Evidence)
**Date:** October 24, 2026
**Status:** COMPLETE & EMPIRICALLY SYNTHESIZED

---

## 1. Executive Summary

This report establishes the final experimental synthesis and statistical evidence for the B.Tech final-year research project:
> **“Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection”**

The objective of Phase 6C is to synthesize the empirical findings established across Phases 6A and 6B into a cohesive, defensible, and methodologically sound thesis evidence base. The analysis evaluates three progressive system configurations:
1. **Configuration A (ML-Only Baseline):** Random Forest intrusion detection without pre-load artifact integrity or provenance gates.
2. **Configuration B (ML + SHA-256 Integrity Verification):** Pre-load artifact integrity verification using local SHA-256 digest comparison against an off-chain expected hash.
3. **Configuration C (ML + SHA-256 + Blockchain-Backed Provenance):** The full evaluated architecture integrating local SHA-256 computation, on-chain smart contract release authorization (`ModelRegistry.sol`), fail-closed REST API gating, off-chain runtime inference, and local SQLite audit logging.

The empirical evidence demonstrates that Configuration C provides release authorization, version provenance, and fail-closed security gating that local SHA-256 alone cannot establish, at a quantified pre-load verification cost of **$20.31\text{ ms}$** (an incremental $+14.66\text{ ms}$ over local SHA-256 hashing). Crucially, this verification cost is incurred strictly before model loading, while runtime network-flow inference executes completely off-chain without per-prediction blockchain queries ($0$ EVM calls during `/predict`).

---

## 2. Research Question

The synthesis directly answers the primary research question:

> **Does blockchain-backed model provenance provide measurable authorization and auditability benefits beyond local SHA-256 integrity verification alone, at a quantified pre-load verification cost, while keeping blockchain operations outside the evaluated per-flow inference path?**

### Definitive Research Findings
1. **Integrity vs. Provenance Authorization:** Local SHA-256 verification (Config B) proves binary correspondence against an expected hash, but cannot independently determine whether that digest or version was authorized by the designated governance entity. Blockchain-backed verification (Config C) uniquely enforces release authorization, rejecting unregistered version keys (`NOT_REGISTERED`) and failing closed.
2. **Quantified Cost Allocation:** The pre-load verification gate incurs a mean latency of $20.31\text{ ms}$ (95% CI: [19.37, 21.30] ms), which is $0.48\times$ the latency of a single pure ML inference compute cycle ($42.40\text{ ms}$) and $0.39\times$ of an end-to-end API request ($51.49\text{ ms}$).
3. **Operational Separation:** Zero blockchain RPC queries and zero model re-hashing operations occur during per-flow classification. Verification overhead is decoupled from runtime network-flow prediction.
4. **ML Independence Boundary:** Blockchain provenance does **not** improve machine learning intrusion detection accuracy, precision, recall, or F1 score; the model's detection metrics are invariant across Configurations A, B, and C.

---

## 3. Experimental Configurations

```
[Configuration A: ML-Only Baseline]
Flow Features ----> [ Model Loaded in Memory ] ----> Intrusion Predictions
                     (No integrity gate)

[Configuration B: SHA-256-Only Integrity Verification]
Model on Disk ----> [ Local SHA-256 Compute ] == [ Expected Digest (Off-Chain) ]
                           | (Match: Load to Memory)
Flow Features ----> [ Model in Memory ] -----------> Intrusion Predictions (Off-Chain)

[Configuration C: SHA-256 + Blockchain-Backed Provenance Verification]
Model on Disk ----> [ Local SHA-256 Compute ]
                           |
                      [ EVM ModelRegistry Query ] == [ Registered State (On-Chain) ]
                           | (Match & Registered: Load to Memory)
Flow Features ----> [ Model in Memory ] -----------> Intrusion Predictions (Off-Chain)
                                 |
                           [ SQLite Local Audit Log (Off-Chain) ]
```

### Detailed Configuration Progression

| Operational Dimension | Configuration A (ML-Only) | Configuration B (SHA-Only) | Configuration C (SHA + Blockchain) |
| :--- | :--- | :--- | :--- |
| **Model Architecture** | Random Forest (100 estimators, depth 20) | Random Forest (100 estimators, depth 20) | Random Forest (100 estimators, depth 20) |
| **Artifact Integrity Check** | None (File loaded directly) | Pre-load local SHA-256 calculation | Pre-load local SHA-256 calculation |
| **Digest Reference Source** | None | Off-chain trusted string / config | On-chain `ModelRegistry.sol` contract state |
| **Release Authorization** | None | None (Hash match only) | Enforced on-chain (`model_id`, `version`) |
| **Fail-Closed Loading Gate** | Absent | Application-level abort | Enforced Gate (`/predict` returns HTTP 503) |
| **Audit Logging** | Absent in baseline | Absent in baseline | Operational SQLite WAL structured event log |
| **Runtime Inference Path** | Off-chain RAM execution | Off-chain RAM execution | Off-chain RAM execution (0 blockchain calls) |

---

## 4. Evidence Sources

The synthesis integrates data directly from verified experiment records across the project lifecycle:
- **Baseline ML Evidence (Phase 1 & Phase 6A):** Evaluated across the complete UNSW-NB15 testing partition ($N=175,341$ records). Data source: [`reports/phase6a_experimental_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_experimental_results.json).
- **Comparative Evidence (Phase 6B):** Component latency breakdowns ($N=30$), pure inference distributions ($N=100$), end-to-end API latencies ($N=100$), and mutation detection trials. Data source: [`reports/phase6b_comparative_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6b_comparative_results.json).
- **Metadata and Provenance Records:** Model parameters and canonical SHA-256 digest (`dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`). Data sources: [`ml/artifacts/model_metadata.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/ml/artifacts/model_metadata.json) and [`ml/artifacts/provenance_record.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/ml/artifacts/provenance_record.json).
- **Synthesis Artifacts (Phase 6C):** Synthesized data catalog: [`reports/phase6c_final_synthesis_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6c_final_synthesis_results.json).

---

## 5. ML Baseline: Intrusion-Detection Capability

The Random Forest classifier was evaluated on 42 tabular network-flow features from the UNSW-NB15 benchmark. These metrics characterize the ML model and are invariant across all three security configurations:

| Evaluation Metric | Exact Proportion | Percentage (%) | Benchmark Dataset |
| :--- | :---: | :---: | :--- |
| **Accuracy** | 0.902978 | 90.30% | UNSW-NB15 Testing Set ($N=175,341$) |
| **Precision** | 0.987778 | 98.78% | UNSW-NB15 Testing Set ($N=175,341$) |
| **Recall (Detection Rate)** | 0.868193 | 86.82% | UNSW-NB15 Testing Set ($N=175,341$) |
| **F1 Score** | 0.924133 | 92.41% | UNSW-NB15 Testing Set ($N=175,341$) |
| **Specificity** | 0.977107 | 97.71% | UNSW-NB15 Testing Set ($N=175,341$) |
| **False Positive Rate (FPR)** | 0.022893 | 2.29% | UNSW-NB15 Testing Set ($N=175,341$) |
| **ROC-AUC Score** | 0.985992 | 98.60% | UNSW-NB15 Testing Set ($N=175,341$) |
| **True Positives (TP)** | 103,611 | — | UNSW-NB15 Testing Set ($N=175,341$) |
| **True Negatives (TN)** | 54,718 | — | UNSW-NB15 Testing Set ($N=175,341$) |
| **False Positives (FP)** | 1,282 | — | UNSW-NB15 Testing Set ($N=175,341$) |
| **False Negatives (FN)** | 15,730 | — | UNSW-NB15 Testing Set ($N=175,341$) |

### Explicit Research Boundary
> **The blockchain/provenance layer does not replace the intrusion-detection model and does not provide evidence of improved classification accuracy. Its evaluated contribution is model-integrity verification, release authorization, provenance, fail-closed loading, and auditability.**

---

## 6. Integrity Capability Comparison: Config A vs. Config B

Experiment B2 compared Configuration A (no gate) against Configuration B (SHA-only):

1. **What Configuration A Provides:** Configuration A executes off-chain inference in local RAM. However, it lacks binary inspection. If an unauthorized binary artifact is placed in the model path, Configuration A deserializes and executes it without warning.
2. **What Configuration B Adds:** Configuration B computes a 256-bit SHA-256 digest of the 6.3 MB binary file in $5.65\text{ ms}$ (mean) and compares it against an expected digest string. In isolated mutation tests with 37 appended sentinel bytes, Configuration B deterministically rejected the tampered binary as `HASH_MISMATCH` in $13.66\text{ ms}$.
3. **Limitation of Configuration B:** The expected digest in Configuration B is stored locally or supplied off-chain. If an attacker replaces both the model file and the local expected hash configuration, Configuration B validates the tampered pair because it lacks an independent, governance-authorized registry.

---

## 7. Provenance Capability Comparison: Config B vs. Config C

Experiment B5 compared Configuration B (SHA-only) against Configuration C (SHA + Blockchain) using an unregistered release key (`iot-ids-rf:v9.9.9`):

```
Scenario: Attacker presents validly hashed model with unauthorized version "v9.9.9"

[Config B: SHA-Only]
Binary SHA-256 == Expected Hash? ----> YES ----> [ Model Loaded in RAM ] (Unauthorized version active)

[Config C: SHA + Blockchain]
Binary SHA-256 == On-Chain Hash?
           AND
Is Version "v9.9.9" Registered? ------> NO -----> [ HTTP 503 Enforced ] (Loading aborted, Memory clean)
```

### Key Differences Identified
- **Cryptographic Integrity vs. Release Authorization:** Configuration B answers *"Did the binary change relative to the provided hash?"* Configuration C answers *"Was this specific model identity and version authorized by the designated governance entity on-chain?"*
- **Fail-Closed Application Integration:** Configuration C connects the on-chain verification state directly to the web service lifecycle. When an unregistered version is evaluated, the backend sets `is_loaded = False`, denies memory instantiation, and rejects incoming `/predict` requests with HTTP 503.
- **Audit Persistence:** Configuration C records verification attempts, failures, and prediction events in a local SQLite database, providing forensic accountability while excluding raw network feature payloads.

---

## 8. Timing and Overhead Analysis

The experimental synthesis strictly demarcates **directly measured empirical latencies** from **derived statistical metrics**:

### Table 1: Directly Measured Latency Distributions

| Measured Operational Component | Scope / Stage | $N$ Trials | Mean (ms) | Median (ms) | Std Dev (ms) | Min (ms) | Max (ms) | 95% Bootstrap CI (ms) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Config A Pre-Load Gate** | Baseline (No Gate) | — | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 | — |
| **Config B Local SHA-256 Hashing** | File Read + Crypto Hash | 30 | 5.65 | 5.62 | 0.14 | 5.41 | 6.06 | [5.60, 5.70] |
| **Config C Local SHA-256 Component** | Local Hashing in Gate | 30 | 5.40 | 5.13 | 0.74 | 4.60 | 7.76 | [5.16, 5.67] |
| **Config C EVM Registry Read** | On-Chain State Query | 30 | 8.90 | 7.91 | 2.07 | 6.99 | 13.70 | [8.21, 9.68] |
| **Config C Total Pre-Load Gate** | Hashing + EVM + Gate | 30 | 20.31 | 19.44 | 2.74 | 16.78 | 28.91 | [19.37, 21.30] |
| **Pure ML Off-Chain Inference** | Memory Compute (Per-Flow) | 100 | 42.40 | 42.45 | 5.99 | 34.12 | 70.54 | [41.25, 43.61] |
| **End-to-End API `/predict` Request** | HTTP + Predict + Audit | 100 | 51.49 | 49.73 | 7.02 | 45.84 | 109.05 | [50.37, 52.99] |

### Table 2: Explicitly Labeled Derived Metrics

| Derived Metric | Formula / Calculation | Derived Value | Operational Interpretation |
| :--- | :--- | :---: | :--- |
| **Incremental Mean Overhead ($C - B$)** | $20.31\text{ ms} - 5.65\text{ ms}$ | **$+14.66\text{ ms}$** | Pre-load cost of on-chain state read and gate logic |
| **Incremental Median Overhead ($C - B$)** | $19.44\text{ ms} - 5.62\text{ ms}$ | **$+13.82\text{ ms}$** | Median incremental cost of on-chain verification |
| **Relative Overhead Ratio ($C / B$)** | $20.31\text{ ms} / 5.65\text{ ms}$ | **$3.60\times$** | Total gate is 3.6x local hashing cost |
| **Pre-Load Gate vs. Pure ML Ratio** | $20.31\text{ ms} / 42.40\text{ ms}$ | **$0.48\times$** | Gate is less than half of a single inference compute cycle |
| **Pre-Load Gate vs. API Request Ratio** | $20.31\text{ ms} / 51.49\text{ ms}$ | **$0.39\times$** | Gate is ~39% of one end-to-end HTTP inference request |
| **Internal Gate Wrapper Overhead** | $20.31 - (5.40 + 8.90)\text{ ms}$ | **$6.01\text{ ms}$** | Python object instantiation and bytes32 hex conversions |

---

## 9. Comprehensive Security Scenario Matrix

The table below synthesizes system responses across seven operational scenarios:

| Scenario # | Evaluated Condition | Configuration A (ML-Only) | Configuration B (SHA-Only) | Configuration C (SHA + Blockchain) | Empirical Validation Basis |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **S1** | Original registered artifact (`ids_model.joblib`) | Allowed (Loaded directly without inspection) | Allowed (Matches expected off-chain digest) | Allowed (Matches on-chain registered digest) | 30/30 trials verified; loaded in RAM; `/predict` 200 OK |
| **S2** | Locally modified / tampered artifact | No artifact-integrity verification performed | Rejected (`HASH_MISMATCH` detected in 13.66 ms) | Rejected (Fail-closed gate aborts load; HTTP 503) | 37-byte injected mutation in isolated temporary copy |
| **S3** | Modified artifact with altered expected hash | No independent registry authorization | Validated if caller updates expected hash | Rejected (Digest mismatch against on-chain record) | Proves dependency of SHA-only on external trust |
| **S4** | Unregistered model / version (`v9.9.9`) | No registry check exists in baseline | Validates digest only; no version authorization | Rejected (`NOT_REGISTERED`; HTTP 503) | Evaluated with unregistered release key `v9.9.9` |
| **S5** | Model state in RAM after failed verification | No gate; binary remains loaded | Loading aborted in verified application path | Strictly fail-closed; memory clean; HTTP 503 | `is_loaded == False` verified in API status endpoint |
| **S6** | On-chain provenance record & registration event | No on-chain records | No on-chain records | Yes (`ModelRegistry.sol` event and state query) | Contract deployed at `0xF2E246BB76DF876Cef8b38ae84130F4F55De395b` |
| **S7** | Forensic audit logging of verification lifecycle | Absent in baseline | Absent in baseline | Evaluated audit trail (SQLite WAL structured log) | 10 events audited; zero raw feature payload leakage |

---

## 10. Runtime Architectural Separation

A central thesis contribution is demonstrating that pre-load verification overhead does not penalize per-flow network traffic evaluation:

```
[Initialization Phase] (Occurs before accepting network traffic)
  Disk I/O: Read 6.3MB file + compute SHA-256 (5.40 ms)
  Network/IPC: Query EVM ModelRegistry (8.90 ms)
  Logic: Compare hashes + verify authorization (6.01 ms)
  Total Pre-Load Gate: 20.31 ms (One-time cost before traffic handling)
                          |
                          v
[Runtime Inference Phase] (Executed per network flow)
  Incoming Flow Record ----> RAM Preprocessor ----> RAM Random Forest ----> Off-Chain Prediction
                                  |
                           Local SQLite Log
  • Blockchain Queries:        0
  • Contract Lookups:          0
  • Binary Hash Calculations:  0
  • Pure Compute Latency:      42.40 ms mean
  • End-to-End API Latency:    51.49 ms mean
```

### Architectural Claim
> **The evaluated pre-load verification operations are outside the per-flow inference path; no blockchain lookup or model re-hashing is performed during network-flow classification. This establishes architectural separation of the measured verification operations from the evaluated inference path, but it is not a controlled throughput measurement.**

---

## 11. Statistical Interpretation & Methodology

1. **Non-Parametric Bootstrap Discipline:** All empirical timing distributions were evaluated using descriptive parameters (mean, median, standard deviation, min, max) and non-parametric percentile bootstrap confidence intervals ($B = 1,000$ resamples, 95% confidence level, fixed random seed 42).
2. **Omission of Parametric Hypothesis Testing:** Parametric tests (e.g., Student's t-test, ANOVA) were omitted because:
   - Operating system scheduling and memory caches introduce positive skewness into timing distributions.
   - The capability differences (e.g., 0 ms vs. 5.65 ms vs. 20.31 ms) represent distinct deterministic code paths rather than small stochastic variations requiring p-value inference.
3. **Sample Sizes:** $N = 30$ trials were executed for pre-load verification operations (satisfying the central limit heuristic for sample variance estimation), and $N = 100$ trials were executed for per-flow inference operations.

---

## 12. What the Experiments Demonstrate

The empirical evidence directly substantiates the following conclusions:
1. **Cryptographic Tamper Detection:** Local SHA-256 computation deterministically detects unauthorized binary mutations (Experiment E3, B2, B4).
2. **On-Chain Version Authorization:** Querying the Solidity smart contract enables deterministic rejection of unregistered model identities and versions (`v9.9.9`), enforcing release governance that local SHA-256 alone cannot provide (Experiment E4, B5).
3. **Fail-Closed Application Security:** In all failure states (`UNVERIFIED`, `HASH_MISMATCH`, `NOT_REGISTERED`), the backend blocks memory instantiation and returns HTTP 503, preventing prediction requests from executing against unverified code (Experiment E6, B4, B5).
4. **Decoupled Verification Overhead:** Blockchain queries are confined to pre-load verification ($20.31\text{ ms}$ mean), leaving runtime flow inference unburdened by blockchain RPC delays (Experiment E5, B7).
5. **Privacy-Preserving Audit Accountability:** The SQLite audit trail records 100% of lifecycle security events while excluding raw network feature vectors (Experiment E7, B10).

---

## 13. What the Experiments Do NOT Demonstrate (Explicit Non-Claims)

To preserve scientific integrity, the following boundaries are explicitly affirmed:
1. **No ML Efficacy Improvement:** Blockchain does **not** train the model, tune hyperparameters, or improve classification accuracy, precision, recall, or F1 score.
2. **No Semantic Model Safety:** Cryptographic hash matching proves binary equivalence to the registered file; it does **not** prove that the model is free of training-data poisoning, algorithmic bias, or backdoor triggers.
3. **No Adversarial Evasion Robustness:** The system does **not** protect against adversarial feature perturbations submitted at runtime in network flows.
4. **No Public Network Performance Claims:** All blockchain benchmarks were conducted using an in-process EVM (`EthereumTesterProvider` / `py-evm`); public Ethereum mainnet gas prices, congestion, and consensus reorganizations were not modeled.
5. **No Embedded Hardware Validation:** Tests were performed on x86-64 workstation hardware, not constrained IoT microcontrollers (e.g., ARM Cortex-M).
6. **No Controlled Throughput Claims:** The benchmarks measured latency distributions; they do not establish wire-speed packet processing, line-rate throughput, or hardware real-time SLAs.
7. **No Arbitrary Code Execution Prevention:** SHA-256 verifies file bytes before loading; it does not protect the host if an adversary has root-level access to the runtime environment.

---

## 14. Threats to Validity

1. **Construct Validity:** In-process EVM testing isolates smart contract logic without modeling network transport latency or peer-to-peer gossip delays.
2. **Internal Validity:** OS thread scheduling introduces latency variance ($\sigma = 2.74\text{ ms}$ on verification, $\sigma = 5.99\text{ ms}$ on pure inference). Discarding 5 warm-up iterations and using bootstrap confidence intervals mitigates transient variance.
3. **External Validity:** UNSW-NB15 evaluates tabular flow summary vectors from 2015; contemporary IoT deployments with non-IP protocols (e.g., Zigbee, BLE) may exhibit different traffic characteristics.

---

## 15. Limitations

1. **Benchmark Modality:** Tabular flow records rather than raw PCAP packet buffers.
2. **Blockchain Environment:** Local virtual machine rather than multi-node consensus network.
3. **Audit Ledger Scope:** Off-chain SQLite database rather than a distributed Byzantine fault-tolerant ledger.
4. **Governance Model:** Single-administrator smart contract deployment rather than a decentralized multi-signature DAO.

---

## 16. Reproducibility Instructions

To reproduce the complete experimental synthesis and regenerate all figures:

```bash
# 1. Execute the Phase 6C synthesis pipeline
python scripts/run_phase6c_synthesis.py

# 2. Run automated regression test suites
python -m pytest tests -v
cd frontend && npm test -- --run && npm run build && cd ..
```

---

## 17. Final Research Conclusion

The experimental synthesis provides an unambiguous answer to the core research question:

- **Local SHA-256 integrity verification alone (Config B)** provides fast ($5.65\text{ ms}$), deterministic protection against binary tampering, but depends entirely on externally maintained expected digests and lacks an independent mechanism to establish whether a specific model release is authorized.
- **Blockchain-backed provenance verification (Config C)** introduces an on-chain release authorization registry that deterministically rejects unregistered versions (`NOT_REGISTERED`) and enforces fail-closed REST API gating, preventing unauthorized model substitution.
- This additional governance capability introduces a quantified pre-load verification cost of **$20.31\text{ ms}$** ($+14.66\text{ ms}$ incremental over local hashing), which is less than half the latency of a single pure inference cycle ($42.40\text{ ms}$).
- **Runtime inference remains completely off-chain**, executing zero blockchain queries during per-flow classification.
- **Blockchain does not improve intrusion-detection metrics** (Accuracy 90.30%, Precision 98.78%, Recall 86.82%, F1 92.41%). The security benefit is strictly one of **model provenance, release authorization, and tamper-evident auditing**, rather than enhanced attack classification.

---

## 18. Git Checkpoint & Reproducibility Note

- **Starting Baseline Checkpoint:** `ac3b79b274c7ab215f5a6b7ee129813df974a691` (Phase 6B.1 closed)
- **Target Branch:** `master`
- **Convention:** In adherence to the self-reference rule, the final commit SHA containing this report will be reported externally in the completion response upon remote push.

---

## 19. Stopping Rule

**Phase 6C is COMPLETE.**

No further implementation phases exist in Phase 6. Phase 6D has **NOT** been started.
