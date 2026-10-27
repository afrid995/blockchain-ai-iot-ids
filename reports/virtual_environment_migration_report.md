# Project Virtual Environment Migration Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Commit:** `f221cc0d2aadd5d5cbf2b3281c77e878539d74a9`  
**Date & Time:** October 27, 2026 — 14:22 IST (08:52 UTC)  
**Operating System:** Windows 11 (win32, x86_64)  
**Python Version:** Python 3.12.4  
**Virtual Environment Path:** `C:\Users\Shaik Afrid\OneDrive\Desktop\major_project\.venv`  

---

## 1. Environment Migration Summary

The repository was previously executed using globally installed Python packages. This migration established an isolated, project-local Python virtual environment at `.venv/` strictly for environment isolation, dependency tracking, and cross-system reproducibility without altering any application logic, model weights, smart contracts, or experimental results.

### Migration Methodology
1. **Virtual Environment Creation:** Created isolated `.venv/` using the system Python 3.12.4 interpreter via `python -m venv .venv`.
2. **Packaging Tools Upgrade:** Upgraded packaging infrastructure inside `.venv` via `python -m pip install --upgrade pip setuptools wheel` (`pip 26.2.2`, `setuptools 84.2.1`, `wheel 0.48.0`).
3. **Dependency Specification Alignment:** Updated `requirements.txt` to capture explicit versions validated by the research baseline, notably pinning `scikit-learn==1.5.2` (required to prevent joblib unpickling failures of `ColumnTransformer._RemainderColsList`), `pandas==2.2.2`, `joblib==1.5.1`, `fastapi==0.115.13`, `web3==8.0.0`, `eth-tester==0.14.0b1`, `py-evm==0.12.1b1`, and `py-solc-x==2.0.5`.
4. **Dependency Installation:** Installed dependencies strictly inside `.venv` via `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`.

---

## 2. Dependency Baseline & Installed Packages

| Package | Prior Global Baseline | Installed in `.venv` | Role & Compatibility Requirement |
| :--- | :---: | :---: | :--- |
| **Python** | 3.12.4 | 3.12.4 | Host runtime environment |
| **pip** | 24.0 | 26.2.2 | Package installer |
| **scikit-learn** | 1.5.2 | 1.5.2 | **Pinned:** Deserialization compatibility for `ids_model.joblib` |
| **pandas** | 2.2.2 | 2.2.2 | **Pinned:** Dataframe handling and UNSW-NB15 pagination |
| **joblib** | 1.5.1 | 1.5.1 | **Pinned:** Model serialization / unpickling |
| **numpy** | 2.4.6 | 2.5.4 | Numerical arrays and matrix transforms |
| **fastapi** | 0.115.13 | 0.115.13 | REST API service layer |
| **uvicorn** | 0.34.3 | 0.54.0 | ASGI web server |
| **pydantic** | 2.11.7 | 2.14.1 | Schema validation |
| **web3** | 8.0.0 | 8.0.0 | **Pinned:** EVM JSON-RPC and contract interface |
| **eth-tester** | 0.14.0b1 | 0.14.0b1 | **Pinned:** In-process EVM testbed for automated testing |
| **py-evm** | 0.12.1b1 | 0.12.1b1 | **Pinned:** Pure-Python Ethereum Virtual Machine execution |
| **py-solc-x** | 2.0.5 | 2.0.5 | **Pinned:** Solidity 0.8.20 compiler wrapper |
| **pytest** | 8.4.1 | 9.1.1 | Test execution framework |
| **pytest-cov** | 6.2.1 | 7.1.0 | Test coverage reporting |
| **httpx** | 0.28.1 | 0.28.1 | ASGI TestClient HTTP transport |
| **matplotlib** | 3.10.3 | 3.11.2 | Evaluation visualization and figure generation |

---

## 3. Package Isolation Verification

All isolation checks were executed directly against the `.venv` interpreter:

1. **Interpreter Resolution:**
   ```powershell
   .\.venv\Scripts\python.exe -c "import sys; print(sys.executable)"
   # Output: C:\Users\Shaik Afrid\OneDrive\Desktop\major_project\.venv\Scripts\python.exe
   ```
2. **Pip Resolution:**
   ```powershell
   .\.venv\Scripts\python.exe -m pip --version
   # Output: pip 26.2.2 from C:\Users\Shaik Afrid\OneDrive\Desktop\major_project\.venv\Lib\site-packages\pip (python 3.12)
   ```
3. **Core Module Import Verification:**
   ```powershell
   .\.venv\Scripts\python.exe -c "import fastapi, uvicorn, pandas, numpy, sklearn, joblib, web3, eth_tester, solcx; print('CORE_IMPORTS_OK')"
   # Output: CORE_IMPORTS_OK
   ```
4. **Git Isolation:** Confirmed `.gitignore` ignores `.venv/`, `.pytest_cache/`, and bytecode caches. `git status` confirms zero `.venv` files are tracked or staged.

---

## 4. Backend Test Suite Validation

The entire backend test suite was executed using `.venv\Scripts\python.exe -m pytest -q`:
- **Command:** `.\.venv\Scripts\python.exe -m pytest -q`
- **Result:** **129 passed** in 52.54s
- **Test Breakdown:**
  - `tests/test_ml_pipeline.py`: 8 passed
  - `tests/test_provenance.py`: 10 passed
  - `tests/test_blockchain.py`: 12 passed
  - `tests/test_backend.py`: 24 passed
  - `tests/test_dataset_service.py`: 12 passed
  - `tests/test_multiclass_classifier.py`: 10 passed
  - `tests/test_stage2_provenance.py`: 10 passed
  - `tests/test_hierarchical_ids.py`: 10 passed
  - `tests/test_response_recommendations.py`: 10 passed
  - `tests/test_model_replacement_simulator.py`: 11 passed
  - `tests/test_end_to_end_integration.py`: 12 passed
- **Status:** **PASS (129/129)** — 0 failures, 0 regressions.

---

## 5. Reproducibility & End-to-End Validation

Both comprehensive experimental and reproducibility workflows were executed inside `.venv`:

1. **Research Reproducibility Workflow (`python -m scripts.reproduce_research`):**
   - Stage A (Dataset & Baseline Metrics): PASS (90.30% binary accuracy, 98.78% precision, 86.82% recall, 2.29% FPR)
   - Stage B (SHA-256 Tampering Detection): PASS (binary mutation deterministically triggers `HASH_MISMATCH`)
   - Stage C (Blockchain Model Registry): PASS (`ModelRegistry.sol` deployed, `iot-ids-rf:v1.0.0` registered and read)
   - Stage D (Fail-Closed Backend Gate): PASS (unverified requests blocked HTTP 503; verified requests pass)
   - Stage E (React Operations Dashboard): PASS (Vite production bundle compiled)
   - **Overall Outcome:** `ALL REPRODUCIBILITY STAGES VERIFIED (PASS)` in 3.48 s.

2. **Final End-to-End Hierarchical Integration (`experiments/final_end_to_end_integration.py`):**
   - Canonical SHA-256 verification: PASS across Stage 1, Stage 2, Training dataset, and Testing dataset.
   - Experiments E1–E7: All PASS.
   - Full evaluation over N = 175,341 testing flows:
     - Stage 1 Predicted Benign: 70,448 | Predicted Attack: 104,893
     - Stage 2 Routed Attacks: 104,893 | Macro F1: 51.43% | Balanced Accuracy: 51.20%
     - Per-flow blockchain queries: **0**

3. **Backend Startup & Model Lifecycle Gate Check:**
   - Evaluated lifecycle: `Startup (UNVERIFIED/UNLOADED)` $\rightarrow$ `Verify (VERIFIED/UNLOADED)` $\rightarrow$ `Load (LOADED/ACTIVE)` $\rightarrow$ `Reload Reset (UNVERIFIED/UNLOADED)`.
   - Gated behavior confirmed: Inference blocked when unloaded (HTTP 503), unlocked when loaded (HTTP 200).

---

## 6. Frontend Validation

Frontend operations remain completely decoupled from the Python environment:
- **Test Suite (`npm --prefix frontend run test`):** **89 passed** across 5 test suites (`App.test.jsx`, `analytics.test.js`, `architecture_workflow.test.jsx`, `dataset_workbench.test.jsx`, `solution_workflow.test.jsx`).
- **Production Build (`npm --prefix frontend run build`):** Clean build generated in 719 ms to `frontend/dist/`.

---

## 7. README Documentation Update

Updated `README.md` Section 7 ("Step 2: Python Virtual Environment & Dependencies") to document:
- Creation of `.venv/` via `python -m venv .venv`.
- Activation on Windows PowerShell (`.venv\Scripts\Activate.ps1`), Windows CMD (`.venv\Scripts\activate.bat`), and Linux/macOS (`source .venv/bin/activate`).
- Packaging tools upgrade (`python -m pip install --upgrade pip setuptools wheel`).
- Dependency installation (`python -m pip install -r requirements.txt`).
- Environment verification commands (`python --version` and `python -m pip --version`).

---

## 8. Research Integrity Affirmation

This migration was executed strictly for packaging and environment isolation:
- **Zero Model Changes:** Model binaries (`ids_model.joblib`, `attack_classifier.joblib`) are byte-for-byte identical.
- **Zero Dataset Changes:** Raw CSV files (`UNSW_NB15_training-set.csv`, `UNSW_NB15_testing-set.csv`) are byte-for-byte identical.
- **Zero Hash Drift:** All four canonical SHA-256 checksums match their authoritative values.
- **Zero Smart Contract Changes:** `ModelRegistry.sol` source and bytecodes are untouched.
- **Zero Architecture Changes:** Two-stage hierarchical detection, zero per-flow blockchain lookups, and fail-closed gates remain strictly preserved.
