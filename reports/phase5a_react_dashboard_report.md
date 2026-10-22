# Phase 5A — React Dashboard UI Implementation Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Author:** Senior Full-Stack & Research Systems Engineer  
**Date:** October 22, 2026  
**Audited Starting Baseline Commit:** `1d322f4a1b23e4fba079ffaf5d2d53ebd8deb90e`  
**Phase 5A Verdict:** **APPROVED**  

---

## 1. Executive Summary

Phase 5A implements the **React-Based Dashboard UI**, establishing a clean, modular, and responsive presentation layer that connects operators to the existing FastAPI backend services developed in Phase 4.

Key achievements of Phase 5A:
1. **Presentation Layer Foundation:** Created a standalone React application (`frontend/`) powered by Vite, featuring component-level modularity and an environment-configurable API client (`src/api/client.js`).
2. **Model Provenance Interface:** Implemented an interactive dashboard section displaying model metadata, local SHA-256 digests, on-chain registered references, and verification status (`VERIFIED`, `HASH_MISMATCH`, `NOT_REGISTERED`, `BLOCKCHAIN_UNAVAILABLE`, `FILE_NOT_FOUND`). Operators can explicitly trigger on-chain verification via `POST /model/verify`.
3. **Off-Chain Intrusion Detection Console:** Built a network-flow feature submission interface with pre-loaded authentic UNSW-NB15 flow presets (Benign vs. Attack). Inference results display prediction verdicts, confidence percentages, classification codes, and isolated model inference latency.
4. **Security Audit Log Explorer:** Developed an operational audit-event browser with event-type filtering (`PREDICTION`, `MODEL_VERIFICATION`, `MODEL_VERIFICATION_FAILURE`, `MODEL_LOAD`, `MODEL_LOAD_BLOCKED`, `SYSTEM_ERROR`), pagination, and detailed modal inspection of operational metadata.
5. **Strict Architectural Decoupling:** The frontend acts purely as a client to the FastAPI backend. It does not interface directly with Ethereum/Web3 RPC nodes, calculate SHA-256 hashes independently, or deserialize `.joblib` model binaries.
6. **Automated Testing & Build Validation:** Created 7 component and integration tests with Vitest and React Testing Library (100% pass rate). Production build succeeded with Vite. All 40 existing backend tests continue to pass.

---

## 2. Repository State Prior to Phase 5A

Before implementing Phase 5A, the repository was inspected:
- **Baseline Commit:** `1d322f4a1b23e4fba079ffaf5d2d53ebd8deb90e` (`docs: reconcile final phase 4.1 git checkpoint`).
- **Backend Architecture:** Fully functional FastAPI service (`backend/main.py`) exposing `/health`, `/model/status`, `/model/verify`, `/predict`, and `/audit/events`.
- **Backend Test Status:** 40 passed in 10.42 seconds across `tests/test_backend.py`, `tests/test_blockchain.py`, `tests/test_ml_pipeline.py`, and `tests/test_provenance.py`.
- **Frontend State:** No frontend directory or package existed (`frontend/` did not exist on disk).
- **Branch:** `master`, clean working tree.

---

## 3. System Architecture & Component Interaction

```text
┌────────────────────────────────────────────────────────┐
│                   React Dashboard                      │
│                      (frontend/)                       │
│  - System Health Indicators (Header)                   │
│  - Model Provenance & Verification Trigger             │
│  - Off-Chain Intrusion Detection Console               │
│  - Operational Security Audit Log Viewer               │
└───────────────────────────┬────────────────────────────┘
                            │
                            │ HTTP / JSON REST
                            ▼
┌────────────────────────────────────────────────────────┐
│                 FastAPI REST Backend                   │
│                       (backend/)                       │
│  - GET /health                                         │
│  - GET /model/status                                   │
│  - POST /model/verify                                  │
│  - POST /predict                                       │
│  - GET /audit/events                                   │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Off-Chain ML Pipeline        On-Chain Registry Read
                │                        │
                ▼                        ▼
┌──────────────────────────────┐ ┌───────────────────────┐
│     Random Forest IDS        │ │   ModelRegistry.sol   │
│  (ids_model.joblib, 6.3 MB)  │ │ (Local EVM Provider)  │
└──────────────────────────────┘ └───────────────────────┘
```

The React frontend has zero direct connection to Ethereum RPC nodes or machine learning binaries. All data flow is mediated by the FastAPI backend, preserving the fail-closed verification gate and decoupled inference pipeline.

---

## 4. Implemented Frontend Components

The following files and modules were established under `frontend/`:

| Module / Component | Path | Description |
| :--- | :--- | :--- |
| **API Client** | `src/api/client.js` | Modular HTTP client consuming FastAPI endpoints via `fetch`, with structured `ApiError` error handling and environment-variable base URL configuration (`VITE_API_BASE_URL`). |
| **Application Root** | `src/App.jsx` | Top-level state coordinator managing health polling, verification triggers, flow prediction, and audit synchronization. |
| **Brand & Health Header** | `src/components/Header.jsx` | Header bar showing component status for application, EVM connectivity, and model memory load status pills, plus manual refresh. |
| **Model Provenance Card** | `src/components/ModelProvenance.jsx` | Displays model ID, version, algorithm, local artifact hash, registered blockchain hash, memory gate state, and the "Verify Model On-Chain" trigger button. |
| **Prediction Console** | `src/components/PredictionForm.jsx` | JSON input editor with authentic UNSW-NB15 Benign/Attack presets, flow classification trigger, and result callout with confidence and isolated inference latency. |
| **Audit Event Explorer** | `src/components/AuditLog.jsx` | Paginated event list, event-type filtering dropdown, and modal inspector for detailed event metadata. |
| **Semantic Status Badge** | `src/components/StatusBadge.jsx` | Color-coded badges for `VERIFIED`, `HASH_MISMATCH`, `NOT_REGISTERED`, `BLOCKCHAIN_UNAVAILABLE`, `FILE_NOT_FOUND`, and `UNVERIFIED`. |
| **Alert Notification** | `src/components/AlertBanner.jsx` | Reusable alert banner for operational errors, gate rejections, and success notices. |
| **Cyber-Defense Styles** | `src/index.css` | Accessible dark theme with high-contrast status colors, typography, tables, and responsive grid layout. |
| **Entry Point** | `src/main.jsx` | React 18 DOM mount point. |
| **Test Suite** | `src/test/App.test.jsx` | Automated Vitest test suite verifying 7 core dashboard behaviors. |
| **Test Setup** | `src/test/setup.js` | Testing library setup and mock cleanup. |
| **Build Config** | `vite.config.js` | Vite bundler configuration with jsdom test environment. |

---

## 5. API Endpoints Consumed

The frontend consumes the existing FastAPI endpoints without requiring any backend modifications:

| Endpoint | HTTP Method | Frontend Component | Purpose |
| :--- | :---: | :--- | :--- |
| `/health` | `GET` | `Header.jsx`, `App.jsx` | Displays component health (API running, EVM connected, Model loaded). |
| `/model/status` | `GET` | `ModelProvenance.jsx`, `App.jsx` | Loads model ID, versions, local SHA-256, on-chain hash, and gate state. |
| `/model/verify` | `POST` | `ModelProvenance.jsx` | Triggers explicit on-chain verification; updates gate and memory status. |
| `/predict` | `POST` | `PredictionForm.jsx` | Submits network flow features; renders classification verdict and latency. |
| `/audit/events` | `GET` | `AuditLog.jsx`, `App.jsx` | Queries paginated security events filtered by `event_type`. |

---

## 6. Client-Side Security Boundary

The frontend strictly enforces the project's architectural security boundaries:
1. **No Direct Web3 Connection:** The client does not use `ethers.js`, `web3.js`, or browser wallet extensions (e.g. MetaMask). It relies exclusively on the backend for smart contract interactions.
2. **No Client-Side Hash Verification:** The frontend never computes SHA-256 digests or decides verification status independently; all status representations originate from the backend verification gatekeeper.
3. **No Model File Access:** The frontend never loads, unpacks, or deserializes `.joblib` model binaries.
4. **No Raw Payload Storage:** Raw network-flow feature vectors are never cached or persisted to `localStorage`, `sessionStorage`, or cookies.
5. **Fail-Closed Presentation:** When the backend returns HTTP 503 (model unverified or hash mismatch), the UI clearly presents the failure as an active security gate block rather than masking it.

---

## 7. Testing & Build Verification

### Frontend Automated Tests (Vitest)
Executed command:
```bash
cd frontend && npm test
```

Results:
```text
 ✓ src/test/App.test.jsx (7 tests) 230ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Duration  1.68s
```

All 7 required scenarios passed:
1. Dashboard renders with header, cards, and research disclosures.
2. API data is represented correctly (model ID, version, local/registered hashes).
3. Verification status is displayed correctly (`VERIFIED`, memory gate loaded).
4. Verification failure is displayed as failure with fail-closed warning (`HASH_MISMATCH`).
5. Prediction result is displayed correctly (verdict, confidence, latency).
6. API error state is displayed correctly when backend is unavailable.
7. Empty audit-event state works when no events exist.

### Frontend Production Build (Vite)
Executed command:
```bash
cd frontend && npm run build
```

Results:
```text
vite v6.4.5 building for production...
✓ 34 modules transformed.
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-B_FX9ORe.css    6.24 kB │ gzip:  1.91 kB
dist/assets/index-Cmwf0Tz9.js   166.88 kB │ gzip: 53.05 kB
✓ built in 569ms
```

### Backend Automated Test Regression (pytest)
Executed command:
```bash
python -m pytest tests -v
```

Results:
```text
============================= 40 passed in 10.42s =============================
```
- **Total Backend Tests:** 40
- **Passed:** 40 (100%)
- **Failed:** 0
- **Regressions:** Zero backend regressions.

---

## 8. Research-Integrity Audit

An audit of the frontend user interface text confirmed that zero overstrong or unsupported claims were introduced:
- **No Unconditional Latency Claims:** The UI explicitly labels inference latency with the qualifier: `(isolated off-chain model inference in local environment)`.
- **No "Tamper-Proof" or "100% Secure" Claims:** The UI avoids absolute security terminology.
- **Explicit Disclosures:** The dashboard footer prominently displays disclosures regarding architectural decoupling, cryptographic scope, local EVM benchmarking, and local SQLite audit boundaries.
- **No Unsupported Throughput / Real-Time Claims:** Zero occurrences of "wire-speed", "real-time", or "high-throughput" in UI text.

---

## 9. Discovered Limitations

1. **Local Evaluation Environment:** The UI connects to a local FastAPI instance and local EVM test node; public network latency, gas fee fluctuations, and mobile network conditions are not modeled.
2. **Tabular Feature Presets:** Presets use tabular flow features from the UNSW-NB15 benchmark rather than direct PCAP packet captures or raw microcontroller sensor streams.
3. **Single-Node Deployment:** The dashboard is designed for single-operator console interaction rather than multi-tenant role-based access control (RBAC).

---

## 10. Git & Reproducibility Checkpoint

| Checkpoint Parameter | Recorded Repository State | Verification Status |
| :--- | :--- | :--- |
| **Phase 4 Baseline Commit** | `ed6e1cf94b7a94e3fdfda5e2dc19aad69dc1f141` | Historical baseline |
| **Phase 4.1.2 Starting Baseline** | `1d322f4a1b23e4fba079ffaf5d2d53ebd8deb90e` | Verified starting HEAD |
| **Phase 5A Implementation Commit** | `5bab3ea44d8100e3efe2b241eec541b710c7bf98` | Verified implementation (`feat(frontend): implement Phase 5A React dashboard for model provenance and inference`) |
| **Final Phase 5A Reconciliation Commit** | `360053502a28c89da950dc50714511e8179a6076` | Verified against `origin/master` (`refs/heads/master`) |
| **Final Commit Message** | `docs: reconcile final phase 5a research checkpoint` | Verified |
| **Target Branch** | `master` | Active branch |
| **GitHub Remote URL** | `https://github.com/afrid995/blockchain-ai-iot-ids.git` | Verified |
| **Push Status** | Pushed successfully to `origin/master` | Confirmed |
| **Final Remote HEAD** | `360053502a28c89da950dc50714511e8179a6076` | Exact match verified |
| **Working Tree** | Clean (`nothing to commit, working tree clean`) | Verified |
| **Backend Tests** | 40 passed (0 failures, zero regressions) | Confirmed |
| **Frontend Tests** | 7 passed (0 failures) | Confirmed |
| **Build Status** | Successful (Vite production build in 557ms) | Confirmed |

### Reproducibility Checkpoint Summary

| Checkpoint | Commit |
|---|---|
| Phase 4.1.2 baseline | `1d322f4a1b23e4fba079ffaf5d2d53ebd8deb90e` |
| Phase 5A implementation | `5bab3ea44d8100e3efe2b241eec541b710c7bf98` |
| Final Phase 5A checkpoint | `360053502a28c89da950dc50714511e8179a6076` |
| Final remote HEAD | `360053502a28c89da950dc50714511e8179a6076` |

---

## 11. Phase 5A Stopping Rule Compliance

Work on Phase 5A has ceased immediately upon completing the React dashboard foundation, backend endpoint integration, and test suite. In compliance with Section 12 of the instructions:
- No advanced charts or graphs have been added.
- No WebSockets or live streaming mechanisms have been introduced.
- No user authentication or session infrastructure has been created.
- No Docker, Kubernetes, or cloud deployment templates have been written.
- No smart contract or ML model changes have been made.
- Work is strictly paused awaiting further instructions.
