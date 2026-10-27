# Final Completion Report: Project Python Virtual Environment Establishment

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `f221cc0d2aadd5d5cbf2b3281c77e878539d74a9`  
**Commit Message:** `build: establish project Python virtual environment`  
**Branch:** `master`  
**Completion Date:** October 27, 2026  

---

## 1. Executive Summary

The project has been successfully migrated from relying on globally installed Python packages to an isolated, reproducible project-local Python virtual environment at `.venv/`. All backend test suites, research reproducibility workflows, blockchain tools, and frontend applications were validated against `.venv`.

---

## 2. Environment & Dependency Installation Result

- **Python Version:** Python 3.12.4 (64-bit, MSC v.1940, Windows 11)
- **Virtual Environment Path:** `C:\Users\Shaik Afrid\OneDrive\Desktop\major_project\.venv`
- **Python Executable:** `C:\Users\Shaik Afrid\OneDrive\Desktop\major_project\.venv\Scripts\python.exe`
- **Pip Executable:** `pip 26.2.2 from C:\Users\Shaik Afrid\OneDrive\Desktop\major_project\.venv\Lib\site-packages\pip (python 3.12)`
- **Packaging Tools Upgraded:** `pip==26.2.2`, `setuptools==84.2.1`, `wheel==0.48.0`
- **Key Dependencies Pinned in `requirements.txt`:**
  - `scikit-learn==1.5.2` (preserves deserialization compatibility for serialized `ids_model.joblib`)
  - `pandas==2.2.2` (preserves testing set schema handling and slicing performance)
  - `joblib==1.5.1` (preserves model pipeline pickling structures)
  - `fastapi==0.115.13` (preserves REST API contracts)
  - `web3==8.0.0` (validated Web3.py provider)
  - `eth-tester==0.14.0b1` & `py-evm==0.12.1b1` (in-process EVM testbed)
  - `py-solc-x==2.0.5` (Solidity 0.8.20 compiler bindings)
  - `httpx>=0.27.0` (FastAPI TestClient transport)
  - `matplotlib>=3.8.0` (evaluation metric plotting)

---

## 3. Test & Validation Results

### Backend Automated Test Suite
- **Command:** `.\.venv\Scripts\python.exe -m pytest -q`
- **Result:** **129 passed** in 52.54s (100% pass rate, 0 failures, 0 errors).

### Research Reproducibility Workflow
- **Command:** `.\.venv\Scripts\python.exe -m scripts.reproduce_research`
- **Result:** `ALL REPRODUCIBILITY STAGES VERIFIED (PASS)`
- **Stages Verified:**
  - Stage A: Baseline metrics (90.30% accuracy, 98.78% precision, 86.82% recall, 2.29% FPR) verified against provenance record.
  - Stage B: Cryptographic SHA-256 tampering detection verified (`HASH_MISMATCH` triggered on mutation).
  - Stage C: Blockchain Model Registry verified on local EVM.
  - Stage D: Fail-closed verification gate verified (HTTP 503 when unverified/unloaded).
  - Stage E: React dashboard production build verified.

### End-to-End Hierarchical Integration Experiment
- **Command:** `.\.venv\Scripts\python.exe experiments/final_end_to_end_integration.py`
- **Result:** `ALL EXPERIMENTS PASSED` (E1 through E7). Full evaluation over N = 175,341 flows verified (90.30% Stage 1 binary accuracy, 51.43% Stage 2 multiclass attack macro F1, 0 per-flow blockchain lookups).

### Blockchain Tooling Verification
- **Command:** `.\.venv\Scripts\python.exe -m blockchain.scripts.compile`
- **Result:** Successfully compiled `ModelRegistry.sol` (solc 0.8.20) into `blockchain/artifacts/ModelRegistry.json`.

### Frontend Component & Workflow Tests
- **Command:** `npm --prefix frontend run test`
- **Result:** **89 passed** across 5 test suites.

### Frontend Production Build
- **Command:** `npm --prefix frontend run build`
- **Result:** Clean build produced in 719 ms to `frontend/dist/`.

---

## 4. Documentation & Research Integrity Verification

- **README Update:** Updated Section 7 Step 2 with clear instructions for virtual environment creation, activation, packaging tools upgrade, dependency installation, and verification.
- **Git State:** `.venv/` and `.pytest_cache/` properly ignored in `.gitignore`.
- **Zero Invariant Drift:** All model artifacts, training/testing datasets, model hashes, contract code, and deployment configurations remain unchanged.

---

## 5. Scope & Environment Limitations

All timings and gas values reflect local EVM simulation (`EthereumTesterProvider` / py-evm / local Ganache). Timings should not be construed as representative of public or proof-of-stake mainnet conditions. Steady-state intrusion detection inference executes strictly off-chain at zero per-flow blockchain overhead.
