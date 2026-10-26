# Phase 7C Final Documentation Precision & Research-Integrity Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Starting Checkpoint:** `812cf2f7225fb38a5e1fb67a7b69cee6120c04b0`
**Date:** October 26, 2026
**Auditor:** Automated Research Integrity Verification Suite

---

## 1. Executive Objective

This reconciliation pass performs a strict documentation-only correction for Phase 7C to ensure that all documentation, reports, and UI research text adhere strictly to authoritative empirical evidence, eliminate typographical digest discrepancies, reconcile demonstration confidence reporting, remove unsupported latency comparisons, replace speculative terminology, and uphold scientific precision.

---

## 2. Issues Discovered & Exact Corrections

### 2.1 Testing Dataset SHA-256 Reconciliation
- **Issue Discovered:** `reports/phase7c_research_integrity_audit.md` contained the historical typographical digest `bec7dd5ec88dc2a000c7a07879d338395ed7421750f675fd0339e07dfe0648fa`.
- **Authoritative Value:** Direct SHA-256 computation of `data/raw/UNSW_NB15_testing-set.csv` yields `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`.
- **Correction Applied:** Updated `reports/phase7c_research_integrity_audit.md` and `reports/phase7c_completion_report.md` to reflect `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`.

### 2.2 DoS Attack Demonstration Confidence Reconciled
- **Issue Discovered:** `phase7c_completion_report.md` reported DoS Stage 2 confidence as `51.37%` (observed during live model inference on testbed features), whereas `phase7c_research_integrity_audit.md` reported `88.2%` (derived from unit test mock fixtures).
- **Correction Applied:** Removed numeric confidence claims from documentation per prompt instructions. The documentation now consistently states:
  > *"Stage 2 classified the demonstrated attack flow as DoS."*

### 2.3 Unsupported Latency Comparison Removed
- **Issue Discovered:** The Phase 7C traceability matrix in `reports/phase7c_research_integrity_audit.md` included a non-authoritative comparative statement: `~22 ms vs ~41 ms`.
- **Correction Applied:** Removed the informal comparison. Replaced with authoritative measured benchmark reporting:
  > *"Stage 1 conditionally gates Stage 2; Benign flows do not invoke the Stage 2 classifier. Measured component latencies are reported separately in the research evidence. Unit test 4 passes."*

### 2.4 "Real-Time Telemetry" Phrasing Replaced
- **Issue Discovered:** Headings and text in reports and frontend component contained "real-time telemetry" and "telemetry stream", which could be misinterpreted as a claim of real-time production packet processing.
- **Correction Applied:** Replaced with operational status phrasing:
  > *"The UI displays the evaluated runtime state and the measured per-flow blockchain-query count (per_flow_blockchain_queries = 0)."*
  - In `SecuritySolutionOverview.jsx`, replaced `"Flow Telemetry Summary"` with `"Flow Feature Summary"`.
  - In `phase7c_end_to_end_solution_report.md` and `phase7c_completion_report.md`, replaced `"Real-time 6-stage visual pipeline tracker"` with `"A 6-stage visual pipeline tracker displaying workflow state"`.

### 2.5 Local SQLite Audit Terminology Corrected
- **Issue Discovered:** Local SQLite logging was described in places with terms such as "non-repudiable" or "tamper-evident audit logging".
- **Correction Applied:** Clarified that the local SQLite audit trail is decoupled from the on-chain registry and is an operational event store:
  > *"The local SQLite operational audit trail records prediction and security-event metadata while excluding raw 42-feature network-flow vectors. It is separate from the on-chain model provenance registry and is not itself a blockchain-backed immutable log."*

### 2.6 "Immutable Reference" Language Qualified
- **Issue Discovered:** Phrases referring broadly to "immutable reference registered in Ethereum ModelRegistry.sol" over-claimed beyond the verified property.
- **Correction Applied:** Replaced with precise technical language:
  > *"the SHA-256 digest registered for the model identity/version in the evaluated on-chain ModelRegistry."*

### 2.7 Final Research-Integrity Verdict Corrected
- **Issue Discovered:** `reports/phase7c_research_integrity_audit.md` used `VERDICT: FULL PASS (100% COMPLIANT)` prior to reconciliation.
- **Correction Applied:** Replaced with:
  > *"VERDICT: PASS — Phase 7C documentation reconciled with the authoritative project record."*

---

## 3. Strict Confirmation of Scope & Implementation Invariants

No machine learning models were retrained.
No model artifacts were modified.
No datasets were modified.
No smart contract source code (`ModelRegistry.sol`) was changed.
No registered hashes were altered.
No prediction pipeline architecture was modified.
No backend inference behavior was changed.
No new features or dashboards were added.

---

## 4. Canonical Model and Dataset Hashes

The cryptographic digests remain pristine and authoritative:

| Asset | File Path | Authoritative SHA-256 Digest | Status |
|---|---|---|:---:|
| **Stage 1 Binary Model** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **MATCH** |
| **Stage 2 Multiclass Model** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **MATCH** |
| **Raw Training Dataset** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **MATCH** |
| **Raw Testing Dataset** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **MATCH** |

---

## 5. Authoritative Experimental Metrics

The authoritative benchmark figures are preserved verbatim across all reports and UI views:

### 5.1 Stage 1 Binary Intrusion Detector (Random Forest)
- Evaluation Samples: $N = 175,341$
- Accuracy: 90.30%
- Precision: 98.78%
- Recall: 86.82%
- F1-Score: 92.41%
- Specificity: 97.71%
- False Positive Rate (FPR): 2.29%
- ROC-AUC: 98.60%

### 5.2 Stage 2 Multiclass Attack Classifier (9 Classes)
- Evaluation Samples: $N = 119,341$
- Standalone Accuracy: 76.18%
- Balanced Accuracy: 53.41%
- Macro Precision: 57.60%
- Macro Recall: 53.41%
- Macro F1-Score: 53.06%
- Weighted F1-Score: 77.50%

### 5.3 Operational Hierarchical Pipeline
- Macro F1-Score: 51.43%
- Balanced Accuracy: 51.20%

### 5.4 Fuzzers Architectural Bottleneck Analysis
- True Fuzzers in Test Set: 18,184
- Routed to Stage 2: 4,664 (25.65%)
- Stage 1 False Negatives: 13,520 (85.95% of all Stage 1 false negatives)
- End-to-End Recall for Fuzzers: 14.83%

### 5.5 Evaluated Component Latencies (Mean)
- SHA-256 Digest Verification: 5.65 ms
- Pre-load Verification Gate: 20.31 ms
- Stage 1 Binary Inference: 21.04 ms
- Stage 2 Multiclass Inference: 23.09 ms
- Hierarchical Inference Pipeline: 32.06 ms
- Per-Flow Blockchain Queries: 0 (EVM execution plane decoupled from inference)

---

## 6. Test Suite and Build Status

- **Pytest Suite (`python -m pytest tests -v`):** 112 passed in 38.87 s (100% PASS)
- **Vitest Suite (`npm test -- --run`):** 66 passed in 4.39 s across 4 test suites (100% PASS)
- **Frontend Production Build (`npm run build`):** Vite v6.4.5 built 41 modules in 613 ms with 0 errors.

---

## 7. Research Integrity Status

**VERDICT: PASS — Phase 7C documentation reconciled with the authoritative project record.**
