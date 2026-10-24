# Phase 6B.1: Research-Integrity Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Phase:** 6B.1 (Research-Integrity Reconciliation)
**Date:** October 24, 2026
**Status:** COMPLETE & RECONCILED

---

## 1. Starting Phase 6B Checkpoint

Prior to executing this Phase 6B.1 research-integrity reconciliation, the verified repository checkpoint was:
- **Baseline Git Commit:** `7ba1e9bcf1d894f43f6fe5ceeb295af0f8310114`
- **Baseline Commit Message:** `feat: add phase 6b comparative evaluation`
- **Branch:** `master`
- **Remote:** `origin/master` (clean working tree, fully synchronized)

---

## 2. Exact Documentation Corrections

This reconciliation targeted three specific overbroad formulations identified during research review within the Phase 6B documentation:

| Section & Document | Previous Phrasing | Corrected Phrasing | Rationale |
| :--- | :--- | :--- | :--- |
| **Section 10 (Experiment B5 Analysis)**<br>`reports/phase6b_comparative_evaluation_report.md` | `An unregistered version key is deterministically rejected, preventing unauthorized model substitution.` | `An unregistered model/version is rejected by the evaluated provenance gate, preventing that tested substitution scenario from proceeding through the model-loading path. This result demonstrates deterministic rejection of the tested unregistered key (v9.9.9) under the evaluated trust assumptions; it is not a universal guarantee against every arbitrary model-substitution attack vector, nor does it establish that the registered model artifact is inherently benign or semantically safe.` | Scopes the finding strictly to the tested unregistered substitution scenario and evaluated trust assumptions, eliminating universal security claims. |
| **Section 11 (Experiment B6 Classification)**<br>`reports/phase6b_comparative_evaluation_report.md` | `It does not degrade per-flow packet or flow classification throughput.` | `The evaluated pre-load verification operations are outside the per-flow inference path; no blockchain lookup or model re-hashing is performed during network-flow classification. This establishes architectural separation of the measured verification operations from the evaluated inference path, but it is not a controlled throughput measurement.` | Removes unsupported throughput claims because Phase 6B measured latency distributions rather than controlled wire-speed network throughput. |
| **Section 1 (Executive Summary)**<br>`reports/phase6b_comparative_evaluation_report.md` | `conduct a rigorous, fair, and publication-grade comparative evaluation` | `conduct a rigorous, fair, and academically structured comparative evaluation` | Replaces self-certifying language with objective academic tone. |
| **Section 16 (Figure Description)**<br>`reports/phase6b_comparative_evaluation_report.md` | `Two publication-quality figures were generated` | `Two thesis-ready evaluation figures were generated` | Replaces external validation claims with descriptive terminology. |
| **Section 1 & Section 5**<br>`reports/phase6b_research_integrity_audit.md` | `publication-grade scientific and academic integrity standards` / `publication-grade and defensible for B.Tech` | `rigorous academic and research integrity standards` / `designed to support a reproducible and defensible B.Tech thesis evaluation.` | Removes self-certifying language from audit objectives and sign-off. |

---

## 3. Detailed Explanation of Research Boundaries

### A. Unregistered-Model Rejection Boundary
The Experiment B5 comparative evaluation demonstrates that when an unregistered version key (`iot-ids-rf:v9.9.9`) is presented to Configuration C, the on-chain smart contract returns `is_registered = False`, causing the verification gate to output `NOT_REGISTERED` and abort model loading with HTTP 503.
- **What is demonstrated:** Rejection of the specific tested unregistered version under the evaluated smart-contract gate.
- **What is NOT claimed:** This does not constitute an unconditional guarantee that blockchain prevents every conceivable model-substitution vector (e.g., direct host-level memory tampering, rogue admin keys, compromised compiler toolchains). Furthermore, on-chain registration does not certify that the underlying machine learning weights are free from training-time poisoning or backdoor triggers.

### B. Throughput vs. Latency Separation Boundary
Phase 6B measured empirical execution latency distributions:
- Pre-load verification gate latency ($N=30$, mean 20.31 ms)
- Pure off-chain ML inference latency ($N=100$, mean 42.40 ms)
- End-to-end HTTP request latency ($N=100$, mean 51.49 ms)
Because the benchmark did not evaluate streaming network packets under saturation, hardware queueing under load, or packet-per-second throughput thresholds, claiming that pre-load verification *"does not degrade throughput"* was overbroad. The corrected phrasing accurately identifies that pre-load verification executes outside the runtime inference path, proving architectural separation without asserting an unmeasured throughput guarantee.

### C. Objective Academic Phrasing
All self-certifying terms (such as *"publication-grade"* and *"publication-ready"*) have been eliminated across all Phase 6B documents. The project documentation reflects an objective, defensible standard appropriate for B.Tech thesis evaluation without claiming formal publication status or peer-reviewed endorsement.

---

## 4. Preservation of Empirical Evidence

All empirical experimental results, distributions, confidence intervals, sample sizes, and confusion matrix values remain strictly invariant:

| Metric / Parameter | Evaluated Configuration | Measured Empirical Value | Status |
| :--- | :--- | :---: | :--- |
| **Classification Accuracy** | Config A (ML-Only) | 90.30% (0.902978) | Preserved Exactly |
| **Precision** | Config A (ML-Only) | 98.78% (0.987778) | Preserved Exactly |
| **Recall (Detection Rate)** | Config A (ML-Only) | 86.82% (0.868193) | Preserved Exactly |
| **F1 Score** | Config A (ML-Only) | 92.41% (0.924133) | Preserved Exactly |
| **Specificity** | Config A (ML-Only) | 97.71% (0.977107) | Preserved Exactly |
| **False Positive Rate (FPR)** | Config A (ML-Only) | 2.29% (0.022893) | Preserved Exactly |
| **ROC-AUC Score** | Config A (ML-Only) | 98.60% (0.985992) | Preserved Exactly |
| **Pure ML Inference Mean Latency** | Config A ($N=100$) | 42.40 ms | Preserved Exactly |
| **Pure ML Inference 95% Bootstrap CI** | Config A ($N=100$) | [41.25, 43.61] ms | Preserved Exactly |
| **Pure ML Inference Median Latency** | Config A ($N=100$) | 42.45 ms | Preserved Exactly |
| **SHA-Only Verification Mean Latency** | Config B ($N=30$) | 5.65 ms | Preserved Exactly |
| **SHA-Only Verification 95% Bootstrap CI** | Config B ($N=30$) | [5.60, 5.70] ms | Preserved Exactly |
| **SHA-Only Verification Median Latency** | Config B ($N=30$) | 5.62 ms | Preserved Exactly |
| **SHA-Only Verification Std Dev** | Config B ($N=30$) | 0.14 ms | Preserved Exactly |
| **Canonical SHA Verification Trials** | Config B ($N=30$) | 30/30 (100% VERIFIED) | Preserved Exactly |
| **Tampered Artifact Detection** | Config B & C | HASH_MISMATCH (Rejected) | Preserved Exactly |
| **Local SHA-256 Component Mean Latency** | Config C ($N=30$) | 5.40 ms | Preserved Exactly |
| **On-Chain Read Component Mean Latency** | Config C ($N=30$) | 8.90 ms | Preserved Exactly |
| **Total Pre-Load Gate Mean Latency** | Config C ($N=30$) | 20.31 ms | Preserved Exactly |
| **Total Pre-Load Gate 95% Bootstrap CI** | Config C ($N=30$) | [19.37, 21.30] ms | Preserved Exactly |
| **Total Pre-Load Gate Median Latency** | Config C ($N=30$) | 19.44 ms | Preserved Exactly |
| **Pre-Load Verification Overhead Delta ($C - B$)** | Comparative ($N=30$) | +14.66 ms mean | Preserved Exactly |
| **Pre-Load Verification Ratio ($C / B$)** | Comparative ($N=30$) | 3.60x mean | Preserved Exactly |
| **End-to-End API Request Mean Latency** | Config C ($N=100$) | 51.49 ms | Preserved Exactly |
| **End-to-End API Request 95% Bootstrap CI** | Config C ($N=100$) | [50.37, 52.99] ms | Preserved Exactly |
| **Per-Flow Blockchain Queries on `/predict`** | Runtime Inference | 0 | Preserved Exactly |
| **Per-Flow Model Re-Hashing on `/predict`** | Runtime Inference | 0 | Preserved Exactly |

---

## 5. Confirmation of Implementation Invariance

Zero application or implementation files were modified during this reconciliation pass:
- **ML Pipeline:** Unchanged (`RandomForestClassifier`, scikit-learn 1.6.1).
- **Model Artifact:** Unchanged (`ids_model.joblib`, 6,319,677 bytes; SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`).
- **Benchmark Datasets:** Unchanged (`UNSW_NB15_training-set.csv`, `UNSW_NB15_testing-set.csv`).
- **Solidity Contract:** Unchanged (`ModelRegistry.sol`, Solidity `^0.8.20`).
- **FastAPI Backend:** Unchanged (`main.py`, `models.py`, `database.py`, `verifier.py`, `model_service.py`).
- **React Frontend:** Unchanged (React 18 + Vite 6 dashboard components and tests).
- **Comparative Experiment Runner:** Unchanged (`scripts/run_phase6b_experiments.py`).

---

## 6. Research-Integrity Audit Outcome

A comprehensive text scan across all Phase 6B documentation verified:
- **Unsupported Universal Security Claims:** **0** (eliminated unconditional "preventing model substitution" wording).
- **Unsupported Performance Claims:** **0** (eliminated "does not degrade throughput" wording; 0 claims of zero latency, zero overhead, sub-50 ms guarantees, real-time SLAs, or wire-speed operation).
- **Self-Certifying Claims:** **0** (eliminated all "publication-grade" language).
- **Legitimate Disclaimers Preserved:** Explicit disclaimers clarifying local in-process EVM testing (`EthereumTesterProvider`), tabular network flow features vs. raw packet buffers, and off-chain SQLite storage demarcation are preserved and contextualized.

---

## 7. Validation Test Results

Both test suites, the frontend production build, and the experiment runner were executed:

### A. Backend Pytest Suite
Command: `python -m pytest tests -v`
- **Collected:** 40 tests
- **Passed:** 40 tests (100%)
- **Failed:** 0
- **Duration:** 10.34 s
- **Status:** PASS

### B. Frontend Vitest Suite
Command: `npm test -- --run` (in `frontend/`)
- **Collected:** 26 tests across 2 test suites
- **Passed:** 26 tests (100%)
- **Failed:** 0
- **Duration:** 2.14 s
- **Status:** PASS

### C. Frontend Production Build
Command: `npm run build` (in `frontend/`)
- **Modules Transformed:** 36 modules
- **Bundle Output:** `dist/index.html` (0.63 kB), `dist/assets/index-CI5V17C0.css` (11.63 kB), `dist/assets/index-BIGcTXC2.js` (181.11 kB)
- **Exit Code:** 0
- **Status:** SUCCESS

### D. Phase 6B Experiment Runner
Command: `python scripts/run_phase6b_experiments.py`
- **Duration:** 15.45 s
- **Experiments Executed:** B1–B10 all passed
- **Exit Code:** 0
- **Status:** SUCCESS

---

## 8. Git Checkpoint & Final Reporting Convention

- **Starting Baseline Checkpoint:** `7ba1e9bcf1d894f43f6fe5ceeb295af0f8310114`
- **Reconciliation Scope:** Documentation only ([`reports/phase6b_comparative_evaluation_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6b_comparative_evaluation_report.md), [`reports/phase6b_research_integrity_audit.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6b_research_integrity_audit.md), and [`reports/phase6b_1_research_integrity_reconciliation.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6b_1_research_integrity_reconciliation.md)).
- **Self-Reference Rule:** The final commit SHA will not be embedded in this report; it is reported externally in the completion response upon remote synchronization.

---

## 9. Scope Boundary & Phase 6C Status

**Phase 6B.1 is COMPLETE.**

**Phase 6C has NOT been started.** No implementation changes, architectural modifications, or Phase 6C activities have been initiated.
