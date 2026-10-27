# Research Integrity Audit: Project Python Virtual Environment Migration

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Commit:** `f221cc0d2aadd5d5cbf2b3281c77e878539d74a9`  
**Audit Date:** October 27, 2026  
**Evaluated Environment:** Windows 11 (AMD64), Python 3.12.4, Node.js v20.18.0  

---

## 1. Executive Summary

This audit evaluates the integrity, reproducibility, and safety of migrating from globally installed Python packages to a project-local virtual environment at `.venv/`. Every invariant, checksum, and operational constraint was verified against physical repository state and compiled artifacts.

**Overall Audit Result:** **PASS** (10/10 Invariants Verified).

---

## 2. Invariant Verification Checklist

| # | Audit Item | Expected Condition | Evaluated Status | Evidence & Notes |
| :---: | :--- | :--- | :---: | :--- |
| **1** | **Accidental Model Modification** | Binary model artifacts unaltered | **PASS** | `ml/artifacts/ids_model.joblib` and `ml/artifacts/attack_classifier.joblib` have identical file sizes and byte streams. `git status` shows 0 changes to model files. |
| **2** | **Accidental Dataset Modification** | Benchmark datasets unaltered | **PASS** | `data/raw/UNSW_NB15_training-set.csv` (82,332 rows) and `data/raw/UNSW_NB15_testing-set.csv` (175,341 rows) remain unaltered. |
| **3** | **Changed SHA-256 Values** | All canonical cryptographic digests intact | **PASS** | All 4 digests re-computed and confirmed: <br>• Stage 1: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`<br>• Stage 2: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`<br>• Training Data: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`<br>• Testing Data: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` |
| **4** | **Changed Blockchain Contract Source** | `ModelRegistry.sol` untouched | **PASS** | Solidity contract file `blockchain/contracts/ModelRegistry.sol` is unmodified. Compiled bytecodes and ABI in `blockchain/artifacts/ModelRegistry.json` match. |
| **5** | **Changed Deployment Configuration** | Local contract configuration unchanged | **PASS** | `blockchain/deployment/deployment.json` remains anchored to canonical local contract address `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`. |
| **6** | **Changed Backend Behavior** | Gating, routing, and endpoints identical | **PASS** | All 129 backend pytest tests pass inside `.venv`. Fail-closed gating (HTTP 503 on unverified/unloaded model) and off-chain inference confirmed. |
| **7** | **Changed Frontend Behavior** | UI components and workflows intact | **PASS** | All 89 frontend Vitest tests pass across 5 test suites. Production build succeeds cleanly in 719 ms. |
| **8** | **Dependency-Version Drift** | Controlled and pinned dependencies | **PASS** | Validated baseline versions pinned in `requirements.txt`: `scikit-learn==1.5.2` (avoids unpickling regressions), `pandas==2.2.2`, `joblib==1.5.1`, `fastapi==0.115.13`, `web3==8.0.0`, `eth-tester==0.14.0b1`, `py-evm==0.12.1b1`, `py-solc-x==2.0.5`. |
| **9** | **`.venv` Accidentally Tracked by Git** | Ignored by version control | **PASS** | Verified `.gitignore` contains `.venv/`, `.pytest_cache/`, `__pycache__/`. `git status` confirms `.venv/` is untracked and unstaged. |
| **10** | **Undocumented Installation Requirements** | Fully documented setup procedure | **PASS** | `README.md` Section 7 Step 2 updated with verified virtual environment creation, activation, packaging tools upgrade, dependency installation, and verification commands. |

---

## 3. Qualification & Scope Statement

The repository now has a project-local Python virtual environment with explicitly documented dependencies, subject to the tested Windows 11 / Python 3.12.4 platform. The scientific claims, cryptographic digests, experimental outcomes, and architectural separation boundaries remain completely unchanged.
