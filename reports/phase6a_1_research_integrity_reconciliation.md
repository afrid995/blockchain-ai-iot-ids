# Phase 6A.1: Research-Integrity Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Phase:** 6A.1 (Research-Integrity & Terminology Reconciliation)
**Date:** October 24, 2026
**Status:** COMPLETE & RECONCILED

---

## 1. Phase 6A Starting Checkpoint

Prior to executing the Phase 6A.1 documentation reconciliation, the verified repository checkpoint was:
- **Baseline Git Commit:** `4a0aa3a157d083a32b0c96d6c7c9a831674fe98e`
- **Baseline Commit Message:** `research: add phase 6a experimental evaluation framework`
- **Branch:** `master`
- **Remote:** `origin/master` (clean working tree, fully synchronized)

---

## 2. Corrections Made

Phase 6A.1 performs targeted research-integrity wording and consistency corrections across the Phase 6A documentation and scripts. No ML code, smart contracts, backend services, or frontend components were modified.

The four primary corrections executed:
1. **Real-Time Terminology Audit Reconciliation:** Clarified the audit methodology so that the table distinguishes between unsupported performance claims (which are strictly 0) and legitimate disclaimers/limitation references (which cite the term to state what is *not* guaranteed).
2. **Runtime-Separation Wording Reconciliation:** Replaced absolute claims of universal proof with the rigorous formulation: *"The evaluated per-flow inference path performs prediction without a blockchain lookup."*
3. **On-Chain Provenance Terminology Reconciliation:** Replaced *"Decentralized Provenance"* with *"On-Chain Provenance Registry"* or *"Evaluated On-Chain Provenance Registry"*, accurately reflecting the local Ethereum-compatible execution environment (`EthereumTesterProvider`).
4. **Verification Timing Terminology Reconciliation:** Replaced *"fixed startup cost"* with *"pre-load verification cost"*, accurately reflecting that the experiment measured the verification gate rather than total application bootstrap time.

---

## 3. Explanation of the Real-Time Terminology Correction

In the initial Phase 6A audit, reporting zero literal occurrences of `real-time` while simultaneously noting its presence in disclaimer sentences created a semantic inconsistency.

In Phase 6A.1, the audit methodology was updated to explicitly evaluate two distinct metrics:
- **Unsupported Performance Claims:** Must be strictly **0**. The system makes zero claims of real-time guarantees, sub-50ms SLAs, or wire-speed packet processing.
- **Legitimate Disclaimers / Limitations:** Preserved and accurately counted (3 occurrences across script disclaimers, JSON results, and reports).

Scientifically necessary disclaimers (e.g., *"Does not constitute a wire-speed guarantee or fixed real-time SLA"*) are vital for thesis defense and academic integrity. They must not be omitted merely to force an artificial zero in an uncontextualized text match.

---

## 4. Explanation of the Runtime-Separation Wording Correction

Previous wording stated that the experiment *"proves zero blockchain interaction during packet evaluation"*, which risked over-generalization across untried environments or future implementations.

This was reconciled across reports and scripts to:
> **“The evaluated per-flow inference path performs prediction without a blockchain lookup.”**

This phrasing accurately describes what was empirically tested: in the evaluated architecture, model verification occurs prior to model loading into RAM; once loaded, the inference service processes feature dictionaries entirely in memory without dispatching RPC requests or contract calls to the blockchain.

---

## 5. Explanation of the On-Chain Provenance Terminology Correction

The term *"Decentralized Provenance"* could imply an empirical multi-node public consensus deployment (e.g., Ethereum mainnet, Sepolia, or a geographically distributed consortium).

The Phase 6A experiments were conducted using an isolated, in-process EVM provider (`EthereumTesterProvider` via `py-evm`). To maintain scientific accuracy:
- The terminology was revised to **“Evaluated On-Chain Provenance Registry”** or **“On-Chain Provenance Registry”**.
- Explicit disclaimers clarify that the evaluation demonstrates the smart contract logic and local EVM state read/write semantics without modeling public blockchain network latency, gas price volatility, or validator consensus reorganizations.

---

## 6. Verification Timing Terminology Correction

The Phase 6A report previously referred to the 28.60 ms verification gate latency as a *"fixed startup cost"*.

Because the experiment measured the execution latency of the verification workflow (SHA-256 disk hashing + EVM contract query) rather than complete Python process initialization, FastAPI application factory instantiation, and web server startup, the wording was corrected to:
> **“pre-load verification cost”**

This terminology accurately denotes the operational boundary: verification occurs after server initialization and before the model artifact is loaded into memory for inference.

---

## 7. Confirmation of Implementation & Experimental Invariance

This reconciliation was strictly limited to documentation, report consistency, and script banner wording:
- **ML Pipeline:** Unchanged (`RandomForestClassifier`, 100 estimators, max depth 20, random seed 42).
- **Model Artifact:** Unchanged (`ids_model.joblib`, 6,319,677 bytes, SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`).
- **Dataset Files:** Unchanged (UNSW-NB15 training and test sets unchanged).
- **Smart Contract:** Unchanged (`ModelRegistry.sol`, Solidity `^0.8.20`).
- **Backend Architecture:** Unchanged (FastAPI, fail-closed gate, SQLite audit log).
- **Frontend Dashboard:** Unchanged (React 18 + Vite 6).
- **Experimental Methodology:** Unchanged ($N=30$ verification trials, $N=100$ inference trials).
- **Empirical Numerical Results:** Unchanged (all measured latencies, percentages, and confusion matrix counts preserved exactly).

---

## 8. Test Results

The complete project regression suite was executed:

### A. Backend Pytest Suite
Command: `python -m pytest tests -v`
- **Total Tests Collected:** 40
- **Total Tests Passed:** 40 (100%)
- **Total Tests Failed:** 0
- **Execution Time:** ~9.35s
- **Breakdown:** `test_backend.py` (10), `test_blockchain.py` (12), `test_ml_pipeline.py` (8), `test_provenance.py` (10).

### B. Frontend Vitest Suite
Command: `cd frontend && npm test`
- **Total Tests Collected:** 26
- **Total Tests Passed:** 26 (100%)
- **Total Tests Failed:** 0
- **Execution Time:** ~2.32s
- **Breakdown:** `analytics.test.js` (16), `App.test.jsx` (10).

---

## 9. Frontend Production Build Result

Command: `cd frontend && npm run build`
- **Bundler:** Vite v6.4.5
- **Exit Code:** 0 (Success)
- **Compilation Time:** 646 ms
- **Output Artifacts:**
  - `dist/index.html` (0.63 kB)
  - `dist/assets/index-CI5V17C0.css` (11.63 kB)
  - `dist/assets/index-BIGcTXC2.js` (181.11 kB)

---

## 10. Experiment-Runner Result

Command: `python scripts/run_phase6a_experiments.py`
- **Exit Code:** 0 (Success)
- **Total Execution Time:** ~15.87s
- **Experiments Executed:** E1 through E7 all passed.
- **Figures Generated:** 3 thesis-ready publication figures (`figure1_latency_separation.png`, `figure2_verification_components.png`, `figure3_inference_distributions.png`).
- **Results File:** `reports/phase6a_experimental_results.json` generated and consistent.

---

## 11. Git Diff Check Result

Command: `git diff --check`
- **Status:** **PASS (0 warnings, 0 errors)**. All trailing whitespaces and formatting inconsistencies resolved.

---

## 12. Final Git Checkpoint Information

- **Starting Checkpoint:** `4a0aa3a157d083a32b0c96d6c7c9a831674fe98e`
- **Target Branch:** `master`
- **Reconciliation Scope:**
  - Modified: `scripts/run_phase6a_experiments.py`
  - Modified: `reports/phase6a_experimental_evaluation_report.md`
  - Modified: `reports/phase6a_research_integrity_audit.md`
  - Created: `reports/phase6a_1_research_integrity_reconciliation.md`

*(Note: Per the established self-reference convention, the exact resulting commit hash is reported externally in the completion message upon committing and pushing).*
