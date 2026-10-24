# Phase 6A.2: Final Research-Integrity Terminology Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Phase:** 6A.2 (Final Research-Integrity Terminology Reconciliation)
**Date:** October 24, 2026
**Status:** COMPLETE & RECONCILED

---

## 1. Phase 6A Baseline Checkpoint

Prior to executing this Phase 6A.2 terminology reconciliation, the verified repository checkpoint was:
- **Baseline Git Commit:** `046c7eb4faadc462fd8adb661824fdba7ae8b9ac`
- **Baseline Commit Message:** `docs: reconcile phase 6a research integrity terminology`
- **Branch:** `master`
- **Remote:** `origin/master` (clean working tree, fully synchronized)

---

## 2. Exact Documentation Corrections

This reconciliation targeted terminology within [`reports/phase6a_experimental_evaluation_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_experimental_evaluation_report.md) to ensure exact scientific precision regarding pre-load verification timing and network-flow vs. packet demarcation.

| Section & Location | Previous Phrasing | Corrected Phrasing | Rationale |
| :--- | :--- | :--- | :--- |
| **Section 2 (Demarcation Boundary 4)** | `No blockchain queries are performed during packet classification.` | `No blockchain queries are performed during network-flow classification.` | Accurately describes UNSW-NB15 flow records and avoids claiming raw packet evaluation. |
| **Section 3 (Objective 5)** | `separation between one-time pre-load verification and runtime per-flow inference` | `separation between pre-load verification and runtime per-flow inference` | Pre-load verification terminology aligned with measured scope. |
| **Section 11 (Experiment E5 Description)** | `overhead is incurred **once at server initialization**, leaving runtime per-flow inference completely unencumbered by blockchain transactions or queries.` | `The verification workflow is a pre-load verification cost measured before model loading; it is not a measurement of complete application or server startup time. Once verified and loaded into memory, runtime per-flow inference is performed completely off-chain without blockchain lookups.` | Replaces server initialization claims with precise pre-load verification cost definition. |
| **Section 11 (Table A Scope)** | `One-time gate at boot` | `Verification gate before model loading` | Clarifies that the 28.60 ms measurement evaluates the verification workflow, not application boot. |
| **Section 12 (Table Condition 1)** | `Initial Server Boot` | `Initial Unverified State` | Eliminates ambiguity between server boot time and the unverified initial state. |
| **Section 14 (Table B Condition 4)** | `Initial Unverified Boot` | `Initial Unverified State` | Harmonizes terminology across the fail-closed security matrix. |
| **Section 14 (Table C Timing Scope)** | `Pre-Load Verification (One-Time Gate)` | `Verification gate before model loading` | Aligns Table C scope with measured verification workflow. |
| **Section 15 (Figure 1 Caption)** | `across one-time pre-load verification (28.60 ms)` | `across pre-load verification (28.60 ms)` | Consistent description of the pre-load verification gate. |
| **Section 16 (Demonstration Point 3)** | `Live per-flow packet evaluation is not subjected to blockchain block times...` | `The evaluated per-flow network-flow inference is not subjected to blockchain block times...` | Accurately qualifies the evaluated per-flow inference path and network-flow benchmark. |
| **Section 20 (Research-Integrity Audit)** | `Zero occurrences of prohibited claims...` | `Zero unsupported performance or security claims... Legitimate Disclaimers Preserved...` | Eliminates audit self-contradiction by distinguishing 0 unsupported claims from legitimate disclaimers. |

---

## 3. Pre-Load Verification Terminology Correction

The Phase 6A evaluation measured the latency required to execute the verification workflow:
1. Reading the 6.3 MB binary artifact (`ids_model.joblib`) from disk and calculating its SHA-256 cryptographic digest ($6.64\text{ ms}$ mean).
2. Querying the local EVM smart contract (`ModelRegistry.sol`) via `web3.py` to retrieve the registered digest and metadata ($13.55\text{ ms}$ mean).
3. Comparing digests, validating version strings, and confirming authorization ($8.41\text{ ms}$ overhead and boundary checks).

Total measured verification workflow latency:
- **Sample Count ($N$):** 30 repeated trials
- **Mean Latency:** 28.60 ms
- **Median Latency:** 28.54 ms
- **Standard Deviation ($\sigma$):** 2.68 ms
- **Minimum Latency:** 19.22 ms
- **Maximum Latency:** 35.18 ms

### Why the Terminology Was Corrected
Describing this 28.60 ms latency as *"server initialization"*, *"application boot time"*, or a *"fixed startup cost"* was scientifically inaccurate because:
- The experiment did not measure operating system process creation, Python runtime initialization, FastAPI/uvicorn application startup, or full server boot.
- The 28.60 ms measurement captures strictly the **pre-load verification cost** executed before the machine learning model is deserialized into memory.
- Once verified and loaded into memory, runtime per-flow inference executes entirely off-chain without blockchain queries.

The formal report now explicitly states:
> **“The verification workflow is a pre-load verification cost measured before model loading; it is not a measurement of complete application or server startup time.”**

---

## 4. Network-Flow vs. Packet Terminology Correction

The empirical IDS evaluation uses the **UNSW-NB15 benchmark dataset**.

### Key Distinction
- UNSW-NB15 records consist of **42 tabular network flow summary features** (e.g., `sbytes`, `dbytes`, `sttl`, `dttl`, `sload`, `dload`, `spkts`, `dpkts`) computed across completed or windowed network flows using Argus and Bro/Zeek.
- The experiment evaluated tabular feature vector inference; it did not capture raw Ethernet frames, process PCAP streams, interface with network interface cards (NICs), or perform kernel-level packet inspection.

### Corrections Applied
1. References to *"packet classification"* or *"live per-flow packet evaluation"* have been corrected to:
   - **“network-flow classification”**
   - **“evaluated per-flow network-flow inference”**
2. The core architectural boundary is preserved and explicitly stated:
   > **“The evaluated per-flow inference path performs prediction without a blockchain lookup.”**
3. The report explicitly disclaims wire-speed packet processing, line-rate throughput, or raw packet-level deployment claims.

---

## 5. Preservation of Empirical Numerical Values

All empirical experimental measurements, sample counts, and statistical parameters remain strictly invariant:

| Metric / Measurement | Published Value | Exact Internal Representation | Status |
| :--- | :---: | :---: | :--- |
| **Classification Accuracy** | 90.30% | 0.902978 | Preserved Exactly |
| **Precision** | 98.78% | 0.987778 | Preserved Exactly |
| **Recall (Detection Rate)** | 86.82% | 0.868193 | Preserved Exactly |
| **F1 Score** | 92.41% | 0.924133 | Preserved Exactly |
| **Specificity** | 97.71% | 0.977107 | Preserved Exactly |
| **False Positive Rate (FPR)** | 2.29% | 0.022893 | Preserved Exactly |
| **ROC-AUC Score** | 98.60% | 0.985992 | Preserved Exactly |
| **True Positives (TP)** | 103,611 | 103,611 | Preserved Exactly |
| **True Negatives (TN)** | 54,718 | 54,718 | Preserved Exactly |
| **False Positives (FP)** | 1,282 | 1,282 | Preserved Exactly |
| **False Negatives (FN)** | 15,730 | 15,730 | Preserved Exactly |
| **Local SHA-256 Hashing Mean Latency** | 6.64 ms | 6.6370 ms | Preserved Exactly |
| **On-Chain Read Mean Latency** | 13.55 ms | 13.5478 ms | Preserved Exactly |
| **Pre-Load Verification Mean Latency** | 28.60 ms | 28.6001 ms | Preserved Exactly |
| **Pre-Load Verification Median Latency** | 28.54 ms | 28.5449 ms | Preserved Exactly |
| **Pre-Load Verification Std Dev** | 2.68 ms | 2.6823 ms | Preserved Exactly |
| **Pre-Load Verification Min Latency** | 19.22 ms | 19.2176 ms | Preserved Exactly |
| **Pre-Load Verification Max Latency** | 35.18 ms | 35.1784 ms | Preserved Exactly |
| **Pure ML Model Compute Mean Latency** | 41.63 ms | 41.6256 ms | Preserved Exactly |
| **End-to-End API Request Mean Latency** | 53.24 ms | 53.2361 ms | Preserved Exactly |
| **End-to-End API Request Maximum Latency** | 177.22 ms | 177.2171 ms | Preserved Exactly |
| **Verification Trial Sample Size** | $N = 30$ | 30 | Preserved Exactly |
| **Inference Trial Sample Size** | $N = 100$ | 100 | Preserved Exactly |
| **UNSW-NB15 Test Partition Size** | $N = 175,341$ | 175,341 | Preserved Exactly |

---

## 6. Confirmation of Implementation Invariance

This reconciliation pass made zero modifications to the application codebase:
- **Machine Learning Pipeline:** Unchanged (`RandomForestClassifier`, 100 estimators, max depth 20, random state 42).
- **Binary Model Artifact:** Unchanged (`ids_model.joblib`, 6,319,677 bytes, SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`).
- **Benchmark Datasets:** Unchanged (`UNSW_NB15_training-set.csv`, `UNSW_NB15_testing-set.csv`).
- **Smart Contract:** Unchanged (`ModelRegistry.sol`, Solidity `^0.8.20`).
- **FastAPI Backend:** Unchanged (endpoints, fail-closed gate logic, SQLite WAL logging).
- **React Frontend:** Unchanged (dashboard components, chart renders, status pills).
- **Experimental Methodology:** Unchanged ($N=30$ verification trials, $N=100$ inference trials, warm-up isolation).

---

## 7. Regression Verification Results

Both regression test suites and the frontend production build were executed:

### A. Backend Pytest Suite
Command: `python -m pytest tests -v`
- **Collected:** 40 tests across 4 test modules
- **Passed:** 40 tests (100%)
- **Failed:** 0
- **Duration:** 10.98 s
- **Status:** PASS

### B. Frontend Vitest Suite
Command: `npm test -- --run` (in `frontend/`)
- **Test Files:** 2 passed (`analytics.test.js`, `App.test.jsx`)
- **Passed:** 26 tests (100%)
- **Failed:** 0
- **Duration:** 1.93 s
- **Status:** PASS

### C. Frontend Production Build
Command: `npm run build` (in `frontend/`)
- **Modules Transformed:** 36 modules
- **Bundle Output:** `dist/index.html` (0.63 kB), `dist/assets/index-CI5V17C0.css` (11.63 kB), `dist/assets/index-BIGcTXC2.js` (181.11 kB)
- **Exit Code:** 0
- **Status:** SUCCESS

---

## 8. Experiment-Runner Verification Result

Command: `python scripts/run_phase6a_experiments.py`
- **Execution Environment:** Windows 11, Python 3.12.4, in-process `EthereumTesterProvider`
- **Duration:** 14.94 s
- **All Experiments Passed:**
  - E1 (Baseline ML & Latency): PASS
  - E2 (Legitimate Verification Gate): PASS
  - E3 (Tampered Artifact Mutation Detection): PASS
  - E4 (Unregistered Model Rejection): PASS
  - E5 (Cost Separation Verification): PASS
  - E6 (Fail-Closed Matrix Enforcement): PASS
  - E7 (Forensic Audit Trail & Demarcation): PASS
- **Figures Generated:** 3 publication figures in `reports/figures/`
- **Exit Code:** 0

---

## 9. Research-Integrity Audit

An automated audit across all Phase 6A documentation, scripts, and results evaluated 14 prohibited phrases:

| Audited Term / Concept | Unsupported Claims | Legitimate Disclaimers / Contextualized Limitations | Audit Compliance Outcome |
| :--- | :---: | :---: | :--- |
| `real-time` | **0** | 3 | Legitimate disclaimers state results do not constitute fixed real-time SLAs. |
| `wire-speed` | **0** | 3 | Legitimate disclaimers state results do not constitute wire-speed guarantees. |
| `zero latency` | **0** | 1 | All operations report positive non-zero latency; appears in prohibited inventory. |
| `zero runtime penalty` | **0** | 1 | Explicitly disclaimed; runtime latency is measured and reported. |
| `zero overhead` | **0** | 3 | Overhead quantified; disclaimers note zero overhead is not claimed. |
| `sub-50 ms` | **0** | 3 | Empirical measurements reported; disclaimers note no guarantee on arbitrary hardware. |
| `high-throughput` | **0** | 1 | Replaced with exact sample counts ($N=30$, $N=100$, $N=175,341$). |
| `tamper-proof` | **0** | 1 | Replaced with "tamper-evident" and cryptographic mismatch detection. |
| `guaranteed secure` | **0** | 1 | Security boundaries explicitly scoped to pre-load artifact integrity. |
| `blockchain improves accuracy` | **0** | 2 | Explicitly rejected; blockchain provides provenance, not ML training. |
| `blockchain detects attacks` | **0** | 1 | Explicitly clarified; ML classifies flows, blockchain registers model identity. |
| `SHA-256 proves model safety` | **0** | 2 | Explicitly clarified; SHA-256 proves binary correspondence with registered digest only. |
| `decentralized public blockchain performance` | **0** | 2 | Explicitly qualified as an in-process local EVM benchmark (`EthereumTesterProvider`). |
| `packet-level` | **0** | 2 | Explicitly qualified as tabular network-flow records rather than raw PCAP packet streams. |

### Adherence to 8 Core Demarcation Principles
1. **ML performs intrusion classification:** Evaluates network flows as Benign or Attack.
2. **SHA-256 verifies artifact correspondence:** Confirms exact binary match with registered digest.
3. **Blockchain provides on-chain provenance registry:** Stores model identity, version, digest, algorithm, registrant, and timestamp.
4. **Backend verification occurs before model loading:** Pre-load verification blocks untrusted binaries.
5. **Runtime inference path performs prediction without a blockchain lookup:** Prediction executes off-chain.
6. **Local EVM measurements do not represent public Ethereum networks:** In-process EVM isolates logic without gas or P2P latency.
7. **UNSW-NB15 is a network-flow benchmark:** Tabular flow summary vectors, not physical IoT hardware deployments.
8. **SHA-256 artifact correspondence does not prove model safety:** Does not prevent poisoning, backdoor triggers, or evasion attacks.

---

## 10. Git Checkpoint Information

- **Starting Baseline:** `046c7eb4faadc462fd8adb661824fdba7ae8b9ac`
- **Reconciliation Scope:** Documentation only ([`reports/phase6a_experimental_evaluation_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_experimental_evaluation_report.md) and [`reports/phase6a_2_research_integrity_reconciliation.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_2_research_integrity_reconciliation.md)).
- **Commit Convention:** In accordance with the self-reference rule, the final commit SHA will not be embedded in this document and will be reported externally upon push.

---

## 11. Limitations

1. **Benchmark Modality:** UNSW-NB15 evaluates tabular flow summary vectors generated from network captures rather than real-time raw physical NIC packet buffers.
2. **Execution Environment:** In-process EVM (`py-evm`) isolates smart contract logic without modeling public Ethereum congestion, miner/validator delays, or dynamic gas fee fluctuations.
3. **Audit Ledger Scope:** Operational event audit storage utilizes an off-chain SQLite database optimized for fast local accountability rather than distributed consensus.
4. **Security Scope:** SHA-256 verification guarantees artifact integrity and provenance match; it does not protect against poisoning during initial training or runtime adversarial evasion attacks.

---

## 12. Explicit Statement Regarding Phase 6B

**Phase 6B has NOT been started.**

This concludes Phase 6A.2 (Final Research-Integrity Terminology Reconciliation). No implementation, architectural extensions, or Phase 6B activities have been initiated or executed.
