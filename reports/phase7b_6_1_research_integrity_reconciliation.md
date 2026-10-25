# Phase 7B.6.1 Research Integrity Reconciliation Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `c97d8afe1a5e23b9a86b230b0c241d43ad535a45`  
**Reconciliation Date:** October 25, 2026  
**Commit Message:** `fix: reconcile frontend research metrics and claims`  

---

## 1. Executive Summary

Phase 7B.6.1 is a dedicated **research-integrity and metric reconciliation phase**. Following the successful deployment and testing of the production-style IDS Operations Console in Phase 7B.6, an exhaustive audit was performed against the authoritative experimental results established in Phase 6 and Phase 7.

This audit identified metric discrepancies, imprecise metric attributions, and unsupported wording across Phase 7B.6 documentation and user interface text. Every item has been reconciled back to strict, evidence-based experimental values.

**Core Research Invariants Preserved:**
- No ML model was retrained or re-serialized.
- No model artifact on disk was modified.
- No Solidity smart contract was modified.
- No on-chain registered SHA-256 digest was altered.
- No prediction algorithm, feature schema, or preprocessor was changed.
- No experimental result was fabricated or substituted.

---

## 2. Reconciled Items and Discrepancy Audits

### 2.1 Correction 1: Stage 1 F1 Score Reconciliation
- **Previous Discrepancy:** Certain report summaries cited `Stage 1 F1 = 91.89%`.
- **Authoritative Experimental Value:** The authoritative evaluation of the Stage 1 binary Random Forest classifier on the UNSW-NB15 test partition ($N = 175,341$) established:
  - Accuracy: $90.30\%$
  - Precision: $98.78\%$
  - Recall: $86.82\%$
  - **F1 Score: $92.41\%$**
  - Specificity: $97.71\%$
  - False Positive Rate: $2.29\%$
  - ROC-AUC: $98.60\%$
- **Reconciliation Action:** All references citing $91.89\%$ have been corrected to the verified $92.41\%$.

### 2.2 Correction 2: Stage 2 Multiclass Metric Reconciliation
- **Previous Discrepancy:** Certain report sections cited `Stage 2 Accuracy = 78.36%` alongside the operational routed Macro F1 ($51.43\%$).
- **Authoritative Experimental Value:**
  - Standalone selected balanced classifier (Phase 7B.1):
    - **Accuracy: $76.18\%$**
    - Balanced Accuracy: $53.41\%$
    - Macro Precision: $57.60\%$
    - Macro Recall: $53.41\%$
    - Macro F1: $53.06\%$ (95% CI: $[52.008\%, 54.069\%]$)
    - Weighted F1: $77.50\%$
  - Operational hierarchical evaluation (Phase 7B.3, $N = 104,893$ routed flows):
    - **Operational routed-attack Macro F1: $51.43\%$**
    - **Operational routed-attack Balanced Accuracy: $51.20\%$**
- **Reconciliation Action:** Removed the $78.36\%$ accuracy claim. Explicitly labeled $76.18\%$ as standalone selected-classifier accuracy and differentiated it from the operational hierarchical routed Macro F1 ($51.43\%$) and Balanced Accuracy ($51.20\%$).

### 2.3 Correction 3: Fuzzers Bottleneck Metric Wording
- **Previous Discrepancy:** Text loosely stated `Stage 1 detected only 19.06% of Fuzzers`, merging different evaluation stages into an unsupported shorthand.
- **Authoritative Experimental Value:**
  - Total true Fuzzers in test set: $18,184$
  - Routed by Stage 1 to Stage 2: $4,664$ flows ($25.65\%$)
  - False negatives at Stage 1: $13,520$ flows ($74.35\%$ of Fuzzers exited early as Benign)
  - Proportion of all Stage 1 false negatives that were Fuzzers: $85.95\%$ ($13,520 / 15,730$)
  - **Operational hierarchical E2E recall for Fuzzers: $14.83\%$**
- **Reconciliation Action:** Replaced informal summaries with precise dual-stage terminology:
  - *Stage 1 Routing:* "Stage 1 routed 4,664 of 18,184 Fuzzer flows to Stage 2 (25.65%), leaving 13,520 Fuzzer flows as Stage 1 false negatives (85.95% of all Stage 1 false negatives were Fuzzers)."
  - *Hierarchical E2E:* "Across the complete hierarchy, the operational hierarchical E2E recall for Fuzzers was 14.83%."

### 2.4 Correction 4: Latency Attribution Reconciliation
- **Previous Discrepancy:** Text referenced `control plane latency ≈ 32 ms verification`.
- **Authoritative Experimental Value:**
  - The measured $\approx 32.06\text{ ms}$ ($N = 100$) quantity is **hierarchical inference latency** on CPU (Stage 1 alone: $21.04\text{ ms}$, Stage 2 alone: $23.09\text{ ms}$).
  - The model provenance pre-load verification gate latency (Phase 6B, $N = 30$) is **$20.31\text{ ms}$** ($95\%$ CI: $[19.37, 21.30]\text{ ms}$; SHA-256 computation: $5.65\text{ ms}$).
- **Reconciliation Action:** Corrected all attributions:
  - Provenance verification pre-load gate: mean $20.31\text{ ms}$ on local EVM.
  - Hierarchical inference execution: mean $32.06\text{ ms}$ on local CPU.
  - Noted that local Ganache / EthereumTester measurements do not reflect public blockchain transaction gas or network congestion.

### 2.5 Correction 5: Removal of Unsupported "Real-Time" Wording
- **Previous Discrepancy:** Instances of `real-time telemetry`, `live monitoring`, and `real-time operational workflows` appeared in UI comments and documentation headers.
- **Authoritative Framing:** The IDS evaluates discrete network-flow feature records off-chain in user space. It does not interface directly with wire-speed physical network interface cards (NICs) or provide formal hard real-time execution guarantees.
- **Reconciliation Action:** Replaced occurrences with evidence-based terminology:
  - `session metrics` / `recorded runtime metrics`
  - `operational status`
  - `controlled security test`
  - `session-based operational workflows`
  - Restricted "live" strictly to current client-server polling indicators.

### 2.6 Correction 6: "Production-Grade" Claim Correction
- **Previous Discrepancy:** Phase 7B.6 completion text described the frontend as a `production-grade Cybersecurity Security Operations Center (SOC) console`.
- **Authoritative Framing:** The project is a B.Tech capstone research prototype evaluated in a controlled laboratory environment with a local Ganache EVM testbed.
- **Reconciliation Action:** Changed all references to `production-style IDS Operations Console` or `operational-style IDS security console`.

### 2.7 Correction 7: Audit Log and Security Testing Wording
- **Audit Log:** Removed any characterization of SQLite audit storage as "immutable". Maintained exact phrasing: `local operational audit trail` off-chain in SQLite (`backend/data/audit.db`), strictly separate from the on-chain smart contract provenance registry.
- **Security Testing:** Replaced informal or sensationalist phrasing ("hacker attack", "attacker blocked") with rigorous terminology: `Controlled model replacement security test` and `Simulated model replacement using an ephemeral candidate artifact` with fail-closed memory deserialization abort.

---

## 3. Preservation of Canonical Cryptographic Artifacts

SHA-256 digests of canonical on-disk model artifacts were verified before and after reconciliation:

| Model Stage | Canonical Artifact Path | Authoritative SHA-256 Digest | Verified Digest | Integrity Status |
|---|---|---|---|:---:|
| **Stage 1 (Binary RF)** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **PRISTINE / UNCHANGED** |
| **Stage 2 (Multiclass RF)** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **PRISTINE / UNCHANGED** |

---

## 4. Test Suite and Build Verification

### 4.1 Frontend Test Execution (`vitest`)
All 46 unit and integration tests across three test suites passed with 100% success:
```text
 ✓ src/test/analytics.test.js (16 tests)
 ✓ src/test/App.test.jsx (10 tests)
 ✓ src/test/architecture_workflow.test.jsx (20 tests)

Test Files  3 passed (3)
     Tests  46 passed (46)
  Duration  3.85s
```

### 4.2 Frontend Production Build (`vite build`)
The production build compiled with zero errors:
```text
vite v6.4.5 building for production...
✓ 40 modules transformed.
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-B9ZgiUPh.css   38.12 kB │ gzip:  6.49 kB
dist/assets/index-VW2Mva50.js   229.34 kB │ gzip: 66.01 kB
✓ built in 672ms
```

### 4.3 Backend Test Execution (`pytest`)
All 112 pytest unit and integration tests passed with 100% success in 44.81s:
```text
============================ 112 passed in 44.81s =============================
```

---

## 5. Git Status and Checkpoints

- **Starting Checkpoint:** `c97d8afe1a5e23b9a86b230b0c241d43ad535a45`
- **Target Commit Message:** `fix: reconcile frontend research metrics and claims`
- **Working Tree State:** Completely clean, zero uncommitted or untracked changes.
- **Remote Synchronization:** Local `master` synchronized with `origin/master`.
