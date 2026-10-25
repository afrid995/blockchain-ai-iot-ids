# Phase 7B.5.6 Runtime Debug Report — Model Replacement Simulator 404

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Reviewer:** Research Implementation & Systems Debugging Team  
**Date:** 2026-10-25  
**Starting Checkpoint:** `ca3dd31b5a06575a3cf6d353df588316e61fef14`  
**Status:** Diagnosed, Resolved, and Verified  

---

## 1. Incident Overview & Observed Problem

When invoking the **SIMULATE MODEL REPLACEMENT** button in the Architecture Demonstration tab of the React frontend at `http://localhost:5173`, the user received an alert:

```text
Model replacement simulation failed: Not Found
```

This indicated an HTTP 404 error returned by the server when executing the request.

---

## 2. Investigation & Root Cause Analysis

### 2.1 Route Existence in Source Code vs. Running Application

| Route | Exists in Source Code (`backend/main.py`) | Existed in Running OpenAPI (`GET /openapi.json`) |
| :--- | :---: | :---: |
| `POST /demo/model-replacement` | **YES** | **NO** (Prior to restart) |
| `POST /demo/model-replacement/reset` | **YES** | **NO** (Prior to restart) |
| `POST /demo/unregistered-version` | **YES** | **NO** (Prior to restart) |

Inspection of `http://127.0.0.1:8000/openapi.json` on the active backend server revealed only 9 total paths:
- `/audit/events`
- `/audit/events/{event_id}`
- `/health`
- `/model/load`
- `/model/status`
- `/model/verify`
- `/predict`
- `/predict/hierarchical`
- `/security/test-scenario`

Zero `/demo/` endpoints were exposed in the running process.

### 2.2 Direct Endpoint Test Prior to Restart
Executing an independent HTTP request outside of React:
```bash
POST http://127.0.0.1:8000/demo/model-replacement
```
Returned:
```json
HTTP/1.1 404 Not Found
{"detail":"Not Found"}
```

### 2.3 Frontend/Backend URL Alignment Verification
- **Frontend Base URL:** `http://127.0.0.1:8000` (resolved via `import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'`)
- **Exact Request URL:** `http://127.0.0.1:8000/demo/model-replacement`
- **Frontend Port / Host:** Port 5173 on `localhost`
- **Backend Port / Host:** Port 8000 on `127.0.0.1`
- **Proxy Configuration:** None present or required; frontend makes direct CORS-enabled REST calls to FastAPI.

### 2.4 Root Cause
The root cause was purely a **runtime daemon staleness issue**, **NOT an implementation defect**:
1. The FastAPI uvicorn daemon process (task-4131) had been launched during Phase 7B.5.5 without `--reload`.
2. When the new routes were subsequently implemented and tested in Phase 7B.5.6, the running Uvicorn daemon continued running the stale in-memory application bytecode.
3. Furthermore, the local Ganache EVM testbed instance had been restarted without deploying `ModelRegistry.sol` to the new Ganache chain instance, causing `blockchain/deployment/deployment.json` to point to a nonexistent contract on the active chain.

---

## 3. Corrective Procedure & Resolution

### 3.1 Step-by-Step Resolution
1. **Contract Deployment:** Executed `python -m blockchain.scripts.deploy` to deploy `ModelRegistry.sol` to the running Ganache EVM.
   - Deployed Address: `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`
   - Block Number: 15
   - Metadata recorded in `blockchain/deployment/deployment.json`.
2. **On-Chain Model Registration:**
   - Registered canonical Stage 1 model (`iot-ids-rf:v1.0.0`, SHA: `dc5e1688...`) via `python -m blockchain.scripts.register_model`.
   - Registered canonical Stage 2 model (`iot-ids-attack-classifier:v1.0.0`, SHA: `596b98ce...`).
3. **Backend Server Restart:**
   - Terminated the stale Uvicorn daemon process.
   - Started a fresh FastAPI instance from repository root:
     ```powershell
     python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
     ```
4. **OpenAPI Schema Verification:**
   Queried `GET http://127.0.0.1:8000/openapi.json`:
   - Confirmed 12 total routes now exposed, including:
     - `/demo/model-replacement`
     - `/demo/model-replacement/reset`
     - `/demo/unregistered-version`

---

## 4. Verification & Independent Test Evidence

### 4.1 Direct HTTP Endpoint Tests Against Fresh Backend

#### Test A: `POST /demo/model-replacement`
- **HTTP Status:** 200 OK
- **Payload:**
  ```json
  {
    "scenario": "model_replacement",
    "status": "HASH_MISMATCH",
    "verified": false,
    "model_id": "iot-ids-rf",
    "version": "v1.0.0",
    "registered_hash": "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5",
    "observed_hash": "a7fc43063d36f359bc6c4f14a98bf233d3a1bdebbc2d7a98e1e67a872624cf65",
    "action_taken": "MODEL_LOAD_BLOCKED",
    "downstream_state": "LOCKED",
    "message": "Model replacement detected. Observed SHA-256 does not match on-chain registered digest. Model loading blocked fail-closed.",
    "timeline": [
      {"step": 1, "name": "Original model identified", "status": "COMPLETED", "detail": "iot-ids-rf:v1.0.0"},
      {"step": 2, "name": "Temporary demonstration copy created", "status": "COMPLETED", "detail": "Segregated ephemeral temp buffer"},
      {"step": 3, "name": "Temporary artifact modified", "status": "COMPLETED", "detail": "Controlled byte perturbation applied at offset 500"},
      {"step": 4, "name": "SHA-256 recalculated", "status": "COMPLETED", "detail": "Observed: a7fc43063d36f359..."},
      {"step": 5, "name": "Compared with registered digest", "status": "COMPLETED", "detail": "Queried ModelRegistry.sol digest"},
      {"step": 6, "name": "Integrity check evaluated", "status": "HASH_MISMATCH", "detail": "Observed digest does not match on-chain digest"},
      {"step": 7, "name": "Model loading blocked", "status": "COMPLETED", "detail": "Memory deserialization aborted fail-closed"},
      {"step": 8, "name": "Downstream inference locked", "status": "COMPLETED", "detail": "Network flow analysis disabled"}
    ]
  }
  ```

#### Test B: `POST /demo/model-replacement/reset`
- **HTTP Status:** 200 OK
- **Payload:**
  ```json
  {
    "scenario": "model_replacement_reset",
    "status": "VERIFIED",
    "verified": true,
    "model_id": "iot-ids-rf",
    "version": "v1.0.0",
    "canonical_hash": "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5",
    "registered_hash": "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5",
    "action_taken": "AUTHORIZED_AND_LOADED",
    "downstream_state": "UNLOCKED"
  }
  ```

#### Test C: `POST /demo/unregistered-version`
- **HTTP Status:** 200 OK
- **Payload:**
  ```json
  {
    "scenario": "unregistered_version",
    "status": "NOT_REGISTERED",
    "verified": false,
    "model_id": "iot-ids-rf",
    "version": "v9.9.9",
    "action_taken": "MODEL_LOAD_BLOCKED",
    "downstream_state": "LOCKED"
  }
  ```

### 4.2 Health & Status Telemetry
- `GET /health`:
  ```json
  {
    "status": "healthy",
    "application_status": "running",
    "blockchain_status": "connected",
    "model_status": "loaded"
  }
  ```
- `GET /model/status`:
  ```json
  {
    "model_id": "iot-ids-rf",
    "model_version": "v1.0.0",
    "local_sha256": "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5",
    "registered_sha256": "dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5",
    "verification_status": "VERIFIED",
    "is_loaded": true
  }
  ```

### 4.3 Automated Test Suites & Production Build
- **Backend Tests:** 112 passed in 44.29s (100% green).
- **Frontend Tests:** 50 passed in 4.01s (100% green).
- **Vite Build:** 40 modules transformed, 0 errors, gzip 69.76 kB.

### 4.4 Canonical Hash Verification
All 4 canonical file digests remain verified:
- `ids_model.joblib`: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- `attack_classifier.joblib`: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- `UNSW_NB15_training-set.csv`: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`
- `UNSW_NB15_testing-set.csv`: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`

---

## 5. Standard Operating Procedure for Live Execution

To run the live system from a fresh state:
1. **Start EVM Node:**
   ```powershell
   npx ganache --port 8545 --wallet.deterministic
   ```
2. **Deploy Contract & Register Models:**
   ```powershell
   python -m blockchain.scripts.deploy
   python -m blockchain.scripts.register_model
   python -c "from backend.config import settings; from core.blockchain import BlockchainRegistryClient; from core.hashing import calculate_sha256; c = BlockchainRegistryClient(rpc_url=settings.RPC_URL, contract_address=settings.CONTRACT_ADDRESS); c.register_model(settings.STAGE2_MODEL_ID, settings.STAGE2_MODEL_VERSION, calculate_sha256(settings.STAGE2_MODEL_PATH), settings.STAGE2_ALGORITHM)"
   ```
3. **Start FastAPI Backend Server:**
   ```powershell
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
   ```
4. **Start React Frontend:**
   ```powershell
   Set-Location frontend
   npm run dev
   ```
