# Phase 5B — Dashboard Analytics & Visualization Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 5B (Dashboard Analytics & Visualization)  
**Date:** October 23, 2026  
**Status:** COMPLETE & VERIFIED  

---

## 1. Phase 5B Objective

The objective of Phase 5B is to extend the existing React dashboard with a research-useful, lightweight analytics and visualization layer. This layer aggregates and visualizes operational behavior—including intrusion detection classifications, cryptographic verification outcomes, observed prediction latency, and audit-event distributions—using data already exposed by the existing FastAPI backend (`/audit/events`).

---

## 2. Scope

Phase 5B strictly adds frontend dashboard analytics and visualization. 
- **Zero changes** to the trained ML model, preprocessor, features, or training pipelines.
- **Zero changes** to the Solidity smart contract (`ModelRegistry.sol`) or blockchain deployment scripts.
- **Zero changes** to backend verification gates or fail-closed architecture.
- **Zero per-prediction blockchain calls** introduced.
- **Zero third-party charting bloat**: Implemented with pure, responsive, accessible SVG/CSS components in React to guarantee zero dependency vulnerabilities, deterministic testing in jsdom, and fast production compilation.

---

## 3. Architecture Impact

The fundamental architectural boundaries established in Phases 1–5A remain completely intact:
- **Presentation Layer (React):** Renders UI components, displays provenance metadata, executes user predictions, presents audit records, and deterministically computes aggregate analytics from backend records.
- **Backend Orchestration Layer (FastAPI):** Serves REST endpoints (`/health`, `/model/status`, `/model/verify`, `/predict`, `/audit/events`).
- **Off-Chain ML Inference:** Random Forest model executes inference locally off-chain without transmitting raw network flows onto the blockchain.
- **Cryptographic Model Verification Gate:** SHA-256 digest comparison against the immutable on-chain registry gates model loading into memory.
- **On-Chain Provenance Registry:** Ethereum smart contract stores model identity, version, artifact SHA-256 digest, and training metadata.
- **Operational Audit Log:** Append-oriented local SQLite store tracks operational events (inferences, verification attempts, gate blocks).

No live streaming, WebSockets, or polling intervals were introduced; data is refreshed deterministically via manual user controls or upon executing verifications and predictions.

---

## 4. Analytics Implemented

The analytics layer comprises five major visualization panels:

### A. Dashboard Summary Metric Cards (Section E)
Six responsive summary cards provide at-a-glance visibility into system activity:
1. **Total Predictions:** Total network flow classifications represented in currently loaded audit records, with count breakdown.
2. **Attack Detections:** Total malicious/intrusion flows identified, with attack percentage rate.
3. **Benign Classifications:** Total normal/benign flows identified, with benign percentage rate.
4. **Verification Attempts:** Total cryptographic integrity checks performed, with success vs. failure counts.
5. **Observed Mean Prediction Latency:** Mean off-chain model inference latency in milliseconds, with median and range.
6. **Loaded Audit Events:** Total audit records currently analyzed across all event categories.

### B. Prediction Distribution Chart (Section A)
- **Proportional Horizontal Bar:** High-contrast visual distribution bar color-coding Attack flows (Coral/Red) vs. Benign flows (Emerald/Green).
- **Categorical Breakdown:** Explicit count and percentage tags for each classification outcome.
- **Empty State:** Clean, explicit placeholder when zero prediction events exist.

### C. Verification Outcomes Chart (Section B)
- **Gate Outcome Breakdown:** Frequency and percentage of verification attempts grouped by exact status code:
  - `VERIFIED`: Successful hash match against blockchain registry.
  - `HASH_MISMATCH`: Local binary altered or tampered.
  - `NOT_REGISTERED`: Model ID/version not present on-chain.
  - `BLOCKCHAIN_UNAVAILABLE`: EVM RPC node unreachable.
- **Progress Indicators:** Proportional status bars for each observed status.
- **Empty State:** Explicit placeholder when no verification events exist.

### D. Observed Latency Statistics (Section C)
- **Descriptive Statistics Table:**
  - Sample Count ($n$)
  - Arithmetic Mean Latency ($\text{ms}$)
  - Median Latency ($\text{ms}$)
  - Minimum Latency ($\text{ms}$)
  - Maximum Latency ($\text{ms}$)
- **Visual Latency Range Bar:** Gradient range track showing minimum, median marker, and maximum boundaries.
- **Scientific Disclaimers:** Explicit label stating that latency reflects local evaluation measurements and does not constitute an SLA or performance guarantee.

### E. Audit-Event Distribution (Section D)
- **Categorical Operation Breakdown:** Proportional bars displaying frequency of all recorded operational event types (`PREDICTION`, `MODEL_VERIFICATION`, `MODEL_VERIFICATION_FAILURE`, `MODEL_LOAD`, `MODEL_LOAD_BLOCKED`, `SYSTEM_ERROR`).
- **Ranked Display:** Ordered by occurrence frequency.

---

## 5. Data Provenance

All displayed metrics are deterministically derived from structured JSON objects returned by the backend's `/audit/events` endpoint:

| Analytics Metric | Backend Event Field Source | Calculation Logic |
| :--- | :--- | :--- |
| **Total Predictions** | `event_type === 'PREDICTION'` | Count of matching records |
| **Attack / Benign Counts** | `prediction === 'Attack'` or `'Benign'` | Case-insensitive frequency tally |
| **Prediction Proportions** | `prediction` | $\frac{\text{count}}{\text{total predictions}} \times 100\%$ |
| **Verification Outcomes** | `event_type === 'MODEL_VERIFICATION'` or `'MODEL_VERIFICATION_FAILURE'` | Tally by `verification_status` and `status` |
| **Inference Latency** | `inference_latency_ms` | Filter numeric $> 0$, compute mean, median, min, max |
| **Event Distribution** | `event_type` | Frequency tally across all loaded records |

No synthetic, estimated, or fabricated historical records are created when backend records are absent. Empty states are explicitly rendered.

---

## 6. Verification & Automated Test Results

### A. Frontend Test Suite (Vitest)
Command executed:
```bash
cd frontend && npm test
```

Results:
```text
 ✓ src/test/analytics.test.js (16 tests) 8ms
 ✓ src/test/App.test.jsx (10 tests) 355ms

 Test Files  2 passed (2)
      Tests  26 passed (26)
   Duration  1.88s
```
- **Total Frontend Tests:** 26 passed (0 failures, 0 regressions).
  - 16 unit tests for deterministic aggregation utilities in `analytics.test.js`.
  - 10 integration tests in `App.test.jsx` covering dashboard rendering, verification states, fail-closed blocking, inference, empty states, and analytics UI.

### B. Frontend Production Build (Vite)
Command executed:
```bash
cd frontend && npm run build
```

Results:
```text
vite v6.4.5 building for production...
✓ 36 modules transformed.
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-CI5V17C0.css   11.63 kB │ gzip:  2.95 kB
dist/assets/index-BIGcTXC2.js   181.11 kB │ gzip: 55.96 kB
✓ built in 556ms
```
Production build completed cleanly with zero warnings or errors.

### C. Backend Regression Suite (pytest)
Command executed:
```bash
python -m pytest tests -v
```

Results:
```text
============================= 40 passed in 9.33s ==============================
```
- **Total Backend Tests:** 40 passed (0 failures, 0 regressions across ML, blockchain, provenance, and FastAPI backend integration suites).

### D. Total Automated Project Tests
- **Backend:** 40
- **Frontend:** 26
- **Total:** 66 passed (100% passing rate)

### E. Code Quality & Whitespace
Command executed:
```bash
git diff --check
```
Clean (exit code 0, zero trailing whitespace issues, zero merge conflict markers).

---

## 7. Research-Integrity Audit

A full repository audit confirmed that zero overstrong or unsupported claims were introduced:
- **No Unconditional Latency Claims:** Latency values are explicitly qualified: `(isolated off-chain model inference in local environment). Does not represent a latency guarantee or public network SLA.`
- **No "Tamper-Proof" or "100% Secure" Claims:** Security boundaries explicitly stated; local SQLite store is identified as operational append logging rather than a decentralized consensus ledger.
- **No Unsupported Throughput Claims:** Zero occurrences of "wire-speed", "real-time", "high-throughput", "zero latency", or "sub-50 ms" in UI code or documentation.
- **Explicit Cryptographic Limitations:** Disclosures confirm that SHA-256 verification establishes exact binary correspondence with the on-chain registry but does not prove model correctness, adversarial robustness, or absence of training-data poisoning.

---

## 8. Discovered Limitations

1. **Local Evaluation Environment:** Latency measurements reflect local workstation performance under Python 3.12 and EVM tester provider; public blockchain gas fluctuations and mobile IoT network latency are not modeled.
2. **Audit Event Window:** Analytics reflect the latest loaded batch of audit records (up to 100 events) rather than an exhaustive multi-year historical data warehouse.
3. **Tabular Benchmark Data:** Features originate from the UNSW-NB15 flow benchmark rather than raw radio-frequency (RF) signals or microcontroller sensor buses.
4. **Single-Operator Architecture:** The dashboard is structured as a security operator console rather than a multi-tenant enterprise system with fine-grained RBAC.

---

## 9. Regression Verification

Verification confirmed that all Phase 5A capabilities remain completely functional:
- Model provenance and SHA-256 digest comparison.
- Explicit verification trigger and fail-closed state management.
- Off-chain network-flow prediction with preset sample loading.
- Paginated operational security audit log with event filtering.
- Research prototype disclosures footer.

---

## 10. Git & Reproducibility Checkpoint

| Checkpoint Parameter | Recorded Repository State | Verification Status |
| :--- | :--- | :--- |
| **Phase 4 Baseline Commit** | `ed6e1cf94b7a94e3fdfda5e2dc19aad69dc1f141` | Historical baseline |
| **Phase 4.1.2 Baseline** | `1d322f4a1b23e4fba079ffaf5d2d53ebd8deb90e` | Historical baseline |
| **Phase 5A Implementation Commit** | `5bab3ea44d8100e3efe2b241eec541b710c7bf98` | Verified implementation |
| **Phase 5A Reconciliation Commit** | `360053502a28c89da950dc50714511e8179a6076` | Historical reconciliation |
| **Phase 5A.2 Starting Baseline** | `7d225bb4b43c997a89df808cbb1e1e2648b0eade` | Verified starting HEAD |
| **Target Branch** | `master` | Active branch |
| **GitHub Remote URL** | `https://github.com/afrid995/blockchain-ai-iot-ids.git` | Verified |
| **Backend Tests** | 40 passed (0 failures) | Confirmed |
| **Frontend Tests** | 26 passed (0 failures) | Confirmed |
| **Build Status** | Successful (Vite production build in 556ms) | Confirmed |

*(Note: Per Section 11 & 12 instructions, the exact final commit hash and remote HEAD produced by the Phase 5B commit are reported externally to prevent self-referential hash paradoxes).*

---

## 11. Phase 5B Stopping Rule Compliance

Work on Phase 5B has ceased immediately upon completing the dashboard analytics and visualization implementation, automated test suite, build verification, and documentation. In compliance with strict stopping rules:
- No Phase 5C or later tasks have been initiated.
- No deployment, cloud hosting, or containerization files have been created.
- No user authentication or session management has been added.
- No changes have been made to the trained ML model or Solidity smart contract.
- Work is strictly paused awaiting further instructions.
