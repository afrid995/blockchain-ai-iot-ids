# Phase 7B.6.2 Final Documentation Precision Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `d29a0b68d5ba10ff66ebd0a473b64de25ff28313`  
**Completion Date:** October 25, 2026  
**Commit Message:** `docs: finalize phase 7b6 research wording`  

---

## 1. Executive Summary & Objective

Phase 7B.6.2 represents the **final documentation and research-language precision freeze** for Phase 7B.6. The primary objective is to eliminate all remaining informal language, unverified contract interface references, overclaimed performance properties, and streaming connotations across reports and user interface documentation.

This phase strictly conforms to research integrity boundaries:
- **Zero changes to machine learning models:** No model retraining, re-serialization, or parameter tuning.
- **Zero changes to datasets:** Authentic UNSW-NB15 test partitions remain intact.
- **Zero changes to smart contracts:** `blockchain/contracts/ModelRegistry.sol` remains unchanged.
- **Zero changes to registered digests:** On-chain hashes for Stage 1 (`dc5e...e7c5`) and Stage 2 (`596b...3208`) remain unchanged.
- **Zero changes to prediction architecture:** Hierarchical inference and deterministic response advisories remain unchanged.
- **Zero changes to experimental results:** All numeric findings match established experimental benchmarks.

---

## 2. Inventory of Precision Corrections Applied

### 2.1 Correction 1: Smart Contract Interface Function Names
- **Previous Wording:** Mention of `getModelDetails("iot-ids-rf", "v1.0.0")` in research audit check #4.
- **Precise Correction:** Replaced with the actual functions implemented on `blockchain/contracts/ModelRegistry.sol`:
  `getModelRecord("iot-ids-rf", "v1.0.0")` and `getModelHash("iot-ids-rf", "v1.0.0")`.
- **Rationale:** `ModelRegistry.sol` exposes `isModelRegistered`, `getModelHash`, and `getModelRecord`. No `getModelDetails` function exists in the contract interface.

### 2.2 Correction 2: Smart Contract Source Stability vs. "Immutability"
- **Previous Wording:** `Smart Contract Immutability — ModelRegistry.sol unchanged`.
- **Precise Correction:** Replaced with: `ModelRegistry.sol source and contract implementation were not modified during this frontend phase.`
- **Rationale:** A source-file checksum test verifies that the local Solidity source code has not been altered; it does not constitute a formal proof of blockchain ledger immutability.

### 2.3 Correction 3: Architectural Separation vs. Latency/Gas Guarantees
- **Previous Wording:** `Zero blockchain transactions are generated per network flow, preventing network latency degradation and EVM gas exhaustion.`
- **Precise Correction:** Replaced with:
  > *“No per-flow blockchain queries were observed in the evaluated `/predict/hierarchical` inference path. Blockchain interaction remains outside the measured per-flow inference path. This demonstrates the implemented architectural separation; it does not constitute a universal guarantee about latency or blockchain performance.”*
- **Rationale:** The evaluation measures the specific software implementation in a local environment. General claims about "preventing gas exhaustion" or "universal zero-overhead" are unsupported engineering overclaims.

### 2.4 Correction 4: Model Verification Lifecycle
- **Previous Wording:** `Model provenance verification occurs once at startup or on operator request.`
- **Precise Correction:** Replaced with:
  > *“Model provenance verification occurs during model initialization/pre-load or when explicitly requested by the operator. The verification gate runs before authorized model loading; successful verification permits the model to be loaded for inference.”*
- **Rationale:** Accurately reflects the implemented lifecycle in `backend/main.py` where verification is enforced prior to memory deserialization and model activation.

### 2.5 Correction 5: "Telemetry" Language Refinement
- **Previous Wording:** Occurrences of `telemetry stream`, `live telemetry`, and general `telemetry` headers that could imply real-time streaming data ingestion from physical network hardware.
- **Precise Correction:** Substituted with evidence-based terminology:
  - `operational status`
  - `session metrics`
  - `recorded runtime metrics`
  - `current backend status`
  - `recorded security events`
- **Rationale:** The system evaluates discrete, recorded 42-feature tabular network flow records from UNSW-NB15 in user-space Python rather than physical network interface packet streams.

### 2.6 Correction 6: Security Testing & Audit Trail Framing
- **Security Testing:** Consistently framed as `Controlled model replacement security test` and `Simulated model replacement using an ephemeral candidate artifact`. The evaluation demonstrates that candidate model binaries with perturbed digests are rejected by the pre-load verification gate.
- **Audit Trail:** Consistently designated as `local operational audit trail` off-chain in SQLite (`backend/data/audit.db`), maintaining strict separation from the on-chain smart contract reference registry.

---

## 3. Authoritative Empirical Metrics Reference

The following established metrics remain verified across all documentation and user interface views:

### 3.1 Stage 1 Binary Intrusion Detection (Random Forest)
- Evaluation Sample Size: $N = 175,341$ flows
- Accuracy: $90.30\%$
- Precision: $98.78\%$
- Recall: $86.82\%$
- **F1 Score: $92.41\%$**
- Specificity: $97.71\%$
- False Positive Rate: $2.29\%$
- ROC-AUC: $98.60\%$

### 3.2 Stage 2 Multiclass Attack Classification (Random Forest)
- Standalone Selected Balanced Classifier (Phase 7B.1):
  - Accuracy: $76.18\%$
  - Balanced Accuracy: $53.41\%$
  - Macro Precision: $57.60\%$
  - Macro Recall: $53.41\%$
  - **Macro F1: $53.06\%$** (95% CI: $[52.008\%, 54.069\%]$)
  - Weighted F1: $77.50\%$
- Operational Hierarchical Routing (Phase 7B.3, $N = 104,893$ flows):
  - **Operational Hierarchical Routed Macro F1: $51.43\%$**
  - **Operational Hierarchical Routed Balanced Accuracy: $51.20\%$**

### 3.3 Fuzzers Cascade Error Analysis
- True Fuzzers in Test Set: $18,184$
- Routed to Stage 2: $4,664$ ($25.65\%$)
- Stage 1 False Negatives: $13,520$ ($74.35\%$)
- Fuzzers Proportion of All Stage 1 False Negatives: $85.95\%$ ($13,520 / 15,730$)
- **Operational Hierarchical E2E Fuzzers Recall: $14.83\%$**

### 3.4 Evaluated System Latency (Local Benchmark Environment)
- Standalone SHA-256 Computation ($N = 30$): mean $5.65\text{ ms}$
- Pre-Load Verification Gate ($N = 30$, SHA + EVM read): mean $20.31\text{ ms}$ ($95\%$ CI: $[19.37, 21.30]\text{ ms}$)
- Stage 1 Standalone Inference ($N = 100$): mean $21.04\text{ ms}$ on CPU
- Stage 2 Standalone Inference ($N = 100$): mean $23.09\text{ ms}$ on CPU
- **Hierarchical Conditional Inference ($N = 100$): mean $32.06\text{ ms}$ on CPU**
- **Per-Flow Blockchain Queries Observed:** **0**

---

## 4. Canonical Cryptographic Integrity

Direct SHA-256 calculation of model artifacts on disk confirms 100% byte-level integrity:
- **Stage 1 Artifact (`ml/artifacts/ids_model.joblib`):**  
  `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` (PRISTINE)
- **Stage 2 Artifact (`ml/artifacts/attack_classifier.joblib`):**  
  `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` (PRISTINE)

---

## 5. Verification Test & Build Outcomes

### 5.1 Backend Regression Suite (`pytest`)
All 112 pytest unit and integration tests passed cleanly:
```text
============================ 112 passed in 35.96s =============================
```

### 5.2 Frontend Vitest Suite (`vitest run`)
All 46 unit and integration tests passed cleanly:
```text
 ✓ src/test/analytics.test.js (16 tests)
 ✓ src/test/App.test.jsx (10 tests)
 ✓ src/test/architecture_workflow.test.jsx (20 tests)

Test Files  3 passed (3)
     Tests  46 passed (46)
```

### 5.3 Frontend Production Build (`vite build`)
Vite compiled the production bundle with zero errors or warnings:
```text
vite v6.4.5 building for production...
✓ 40 modules transformed.
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-B9ZgiUPh.css   38.12 kB │ gzip:  6.49 kB
dist/assets/index-VW2Mva50.js   229.34 kB │ gzip: 66.01 kB
✓ built in 672ms
```

---

## 6. Git Status & Checkpoints

- **Starting Checkpoint:** `d29a0b68d5ba10ff66ebd0a473b64de25ff28313`
- **Commit Message:** `docs: finalize phase 7b6 research wording`
- **Remote Synchronization:** Local `master` synchronized with `origin/master`.
- **Working Tree State:** Completely clean.
