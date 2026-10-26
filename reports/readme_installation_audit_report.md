# Final README.md Installation & Setup Audit Report

**Date:** 2026-10-26  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Commit Checkpoint:** `42697ee392c6cf77c53208ef3ed47a55bc2e480d`  
**Auditor:** Antigravity Autonomous Assistant  

---

## 1. Objective

The objective of this audit and documentation update is to ensure that the repository's `README.md` contains an accurate, comprehensive, and empirically verified installation, configuration, deployment, and execution procedure for an independent researcher or evaluator cloning this repository fresh.

The existing README successfully documented the project motivation, philosophy, on-chain/off-chain data boundaries, baseline ML metrics, and local EVM latency benchmarks. However, the operational setup instructions had not been updated to reflect the full multi-process system developed through Phase 7D (including the two-stage hierarchical IDS, decoupled model verification and load lifecycle, ephemeral security demonstration, and real network-flow workbench). This audit reconciles the documentation with the actual working code, scripts, and endpoints without altering any underlying ML models, datasets, smart contracts, or application logic.

---

## 2. Existing README Assessment

Prior to this update, the `README.md` file (at checkpoint `42697ee392c6cf77c53208ef3ed47a55bc2e480d`) contained:
- A strong conceptual overview of decoupled model provenance vs. off-chain ML inference.
- Cryptographic hashing specifications and canonical UNSW-NB15 dataset hashes.
- Initial single-model implementation status up to Phase 5A (Random Forest baseline, `ModelRegistry.sol`, FastAPI backend, and early React dashboard).
- Benchmark tables from early local EVM experiments ($N=30$ reads, Phase 4 latency benchmarks).
- A basic replication section covering `pip install -r requirements.txt`, `python -m pytest tests -v` (stating 40 tests), and initial single-model endpoints.

---

## 3. Missing or Outdated Information Identified

The audit revealed the following specific gaps between the existing documentation and the actual Phase 7D repository state:
1. **Prerequisites Underspecified:** Node.js, npm, and local EVM provider (Ganache) requirements were not explicitly consolidated into a dedicated Prerequisites section.
2. **Missing Local Blockchain Startup Instructions:** The requirement to run a local deterministic EVM node (`npx ganache --wallet.deterministic`) on port 8545 for persistent multi-process interaction was not explained.
3. **Missing Stage 2 Model Registration:** The documentation only covered Stage 1 (`iot-ids-rf`), omitting the on-chain registration procedure for the Stage 2 multiclass attack classifier (`iot-ids-attack-classifier:v1.0.0`).
4. **Dynamic Contract Configuration Unclear:** The existing text did not explain that `python -m blockchain.scripts.deploy` dynamically generates `blockchain/deployment/deployment.json`, which is then loaded automatically by `backend/config.py`.
5. **Outdated Verification & Load Lifecycle:** The documentation did not reflect the Phase 7D decoupled lifecycle (`✓ VERIFY AUTHORIZED MODEL` $\rightarrow$ `VERIFIED / UNLOADED` $\rightarrow$ `📥 LOAD MODEL` $\rightarrow$ `LOADED / ACTIVE`), nor the browser reload reset behavior (`POST /model/session/reset`).
6. **Network Traffic Workbench Missing:** The instructions did not explain how an evaluator uses the new UNSW-NB15 network traffic flow selector and hierarchical inference.
7. **Ephemeral Model Replacement Simulator Omitted:** The security demonstration endpoint (`/demo/model-replacement`) and restoration process were undocumented in the user guide.
8. **Test Suite Counts Outdated:** The README stated 40 backend tests and 7 frontend tests, whereas the codebase now features **117 backend pytest tests** and **83 frontend vitest tests** (200 total automated tests).
9. **No Troubleshooting Guidance:** Common runtime issues such as Ganache connection errors, stale background Uvicorn daemon processes, port conflicts, and deployment state synchronization were unaddressed.

---

## 4. Changes Made to README.md

The following sections were updated or newly added to `README.md`, while preserving all core research philosophy, architectural diagrams, benchmark numbers, and scientific disclaimers:
- **Section 1 (Architecture):** Updated text and diagram to reflect the two-stage hierarchical detection architecture (Stage 1 Binary + Stage 2 Multi-Class).
- **Section 2 (Data Model):** Added canonical SHA-256 hashes for both Stage 1 and Stage 2 models, as well as UNSW-NB15 training and testing partitions.
- **Section 3 (Implementation Status):** Updated to reflect all completed phases through Phase 7D (Hierarchical IDS, fail-closed verification gate, ephemeral model replacement simulator, decoupled verify/load lifecycle, React operations console, and 200 automated tests).
- **Section 4 (Benchmarks):** Maintained all empirical benchmark data and added hierarchical inference latency reference ($52.40\text{ ms}$).
- **Section 5 (Directory Layout):** Updated layout tree to include hierarchical artifacts, additional test suites, and new backend services.
- **Section 6 (Prerequisites):** Added clear prerequisite specifications for Git, Python 3.10+, Node.js/npm, and local Ganache EVM.
- **Section 7 (Step-by-Step Installation & Local Deployment):** Detailed 7-step guide covering cloning, virtual environments (PowerShell, CMD, bash), dependency installation, Ganache startup, contract deployment, on-chain model registration (Stage 1 & Stage 2), FastAPI startup, and React frontend launch.
- **Section 8 (First Run & Model Verification Lifecycle):** Documented the explicit decoupled security gate, state transitions, session reset on reload, and SPA navigation persistence.
- **Section 9 (Intrusion Detection Workbench):** Documented the normal user workflow using UNSW-NB15 network flow records, hierarchical classification, human-in-the-loop security advisory, and audit logging.
- **Section 10 (Model Replacement Security Demonstration):** Documented the ephemeral simulator workflow (`POST /demo/model-replacement`), `HASH_MISMATCH` fail-closed load blocking, and canonical restoration (`POST /demo/model-replacement/reset`).
- **Section 11 (Automated Testing & Verification):** Documented current test execution commands for backend pytest (117 tests), frontend vitest (83 tests), Vite production build, and the research reproducibility script.
- **Section 12 (Troubleshooting Guide):** Added targeted troubleshooting for blockchain connection issues, missing deployment receipts, stale backend processes, port binding conflicts, and frontend-backend connectivity.
- **Section 13 (Research Integrity & Scientific Disclaimers):** Reinforced scientific boundaries regarding local EVM evaluation, decoupled per-flow latency, integrity vs. accuracy, and advisory-only recommendations.

---

## 5. Verified Commands

Every command documented in `README.md` was inspected and verified against the repository's active scripts and source code:

| Command | Working Directory | Purpose | Verification Status |
| :--- | :--- | :--- | :--- |
| `git clone https://github.com/afrid995/blockchain-ai-iot-ids.git` | System | Clone repository | Verified repository remote URL |
| `python -m venv .venv` | Root | Create isolated virtual environment | Standard Python virtualenv command |
| `pip install -r requirements.txt` | Root | Install Python dependencies | Verified against `requirements.txt` |
| `npx ganache --wallet.deterministic` | Root | Start local EVM node on port 8545 | Verified default RPC endpoint in `core/blockchain.py` |
| `python -m blockchain.scripts.deploy` | Root | Deploy `ModelRegistry.sol` & write `deployment.json` | Verified execution & dynamic config generation |
| `python -m blockchain.scripts.register_model` | Root | Register Stage 1 model (`iot-ids-rf:v1.0.0`) | Verified against canonical artifact & provenance |
| `python -c "from backend.config import settings; ... c.register_model(...)"` | Root | Register Stage 2 model (`iot-ids-attack-classifier:v1.0.0`) | Verified against canonical Stage 2 artifact |
| `uvicorn backend.main:app --host 127.0.0.1 --port 8000` | Root | Start FastAPI backend service | Verified application factory & endpoints |
| `curl -X GET http://127.0.0.1:8000/health` | Root | Backend health check | Verified response `{"status":"HEALTHY",...}` |
| `cd frontend && npm install` | `frontend/` | Install React dependencies | Verified `frontend/package.json` |
| `npm run dev` | `frontend/` | Start Vite dev server on port 5173 | Verified `frontend/vite.config.js` |
| `pytest -q` | Root | Execute all backend unit & integration tests | **117 passed** in 49.31s |
| `npm --prefix frontend run test` | `frontend/` | Execute all frontend vitest tests | **83 passed** in 6.74s across 4 suites |
| `npm --prefix frontend run build` | `frontend/` | Compile frontend production bundle | **Built cleanly** in 605ms |
| `python -m scripts.reproduce_research` | Root | End-to-end evidence reproduction | Verified script in `scripts/reproduce_research.py` |

---

## 6. Current End-to-End Setup Flow

The complete end-to-end operational pipeline documented in the updated README is structured as follows:

```text
[1. Clone Repo] 
      ↓
[2. Setup Python Virtualenv & pip install] 
      ↓
[3. Start Local Ganache EVM (Port 8545)] 
      ↓
[4. Deploy ModelRegistry.sol (Generates deployment.json)] 
      ↓
[5. Register Stage 1 & Stage 2 Models On-Chain] 
      ↓
[6. Start FastAPI Backend (Port 8000)] 
      ↓
[7. Start React Frontend (Port 5173)] 
      ↓
[8. Open Browser: POST /model/session/reset → UNVERIFIED / UNLOADED] 
      ↓
[9. Click "✓ VERIFY AUTHORIZED MODEL" → SHA-256 vs Blockchain → VERIFIED / UNLOADED] 
      ↓
[10. Click "📥 LOAD MODEL" → joblib.load() into Memory → LOADED / ACTIVE] 
      ↓
[11. IDS Available: Select Flow in Traffic Workbench → Hierarchical Inference → Advisory]
```

---

## 7. Research Integrity Confirmation

In strict accordance with Scope Rule 1:
- **ML Models:** No model weights, hyperparameters, or training logic were modified.
- **Model Artifacts:** Neither `ids_model.joblib` nor `attack_classifier.joblib` were modified.
- **Datasets:** `UNSW_NB15_training-set.csv` and `UNSW_NB15_testing-set.csv` remain unaltered with byte-identical SHA-256 digests.
- **Hashes:** All canonical hashes remain identical to authoritative specifications:
  - Stage 1: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
  - Stage 2: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
  - Training Data: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`
  - Testing Data: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`
- **Smart Contracts:** `ModelRegistry.sol` was not changed.
- **Prediction Architecture & Security Logic:** Hierarchical classification, fail-closed deserialization, ephemeral simulator, and frontend presentation logic were completely untouched.
- **Only documentation files (`README.md` and this audit report) were modified.**

---

## 8. Validation Evidence

All validation checks were executed directly in the current repository environment:

### 8.1 Backend Test Suite Execution
- **Command:** `pytest -q`
- **Result:**
  ```text
  ........................................................................ [ 61%]
  .............................................                            [100%]
  117 passed in 49.31s
  ```
- **Status:** **PASS** (117 / 117 tests passing)

### 8.2 Frontend Vitest Test Suite Execution
- **Command:** `npm --prefix frontend run test`
- **Result:**
  ```text
  Test Files  4 passed (4)
       Tests  83 passed (83)
    Start at  20:03:20
    Duration  6.74s
  ```
- **Suites:**
  - `src/test/analytics.test.js`: 16 passed
  - `src/test/App.test.jsx`: 10 passed
  - `src/test/architecture_workflow.test.jsx`: 20 passed
  - `src/test/solution_workflow.test.jsx`: 37 passed
- **Status:** **PASS** (83 / 83 tests passing)

### 8.3 Frontend Production Build
- **Command:** `npm --prefix frontend run build`
- **Result:**
  ```text
  vite v6.4.5 building for production...
  transforming...
  ✓ 41 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   0.63 kB │ gzip:  0.43 kB
  dist/assets/index-Dtd2aIt0.css   41.71 kB │ gzip:  7.09 kB
  dist/assets/index-BSqg3l_m.js   265.89 kB │ gzip: 73.29 kB
  ✓ built in 605ms
  ```
- **Status:** **PASS** (Production bundle generated without errors)

### 8.4 Git Status & Working Tree Cleanliness
- **Target Modified Files:**
  - `README.md`
  - `reports/readme_installation_audit_report.md`
- **Unrelated Implementation Files:** Zero modifications.
