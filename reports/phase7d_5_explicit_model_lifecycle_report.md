# Phase 7D.5 — Explicit Model Verification and Load Lifecycle Report

## 1. Executive Summary & Starting Checkpoint

- **Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
- **Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
- **Phase:** Phase 7D.5 — Explicit Model Verification and Load Lifecycle
- **Starting Checkpoint:** `66a82edaff570d837d99347f4642e15172f14439` (confirmed on branch `master`)
- **Status:** Complete, rigorously validated, research-integrity preserved.

Prior to Phase 7D.5, the FastAPI backend defaulted `AUTO_VERIFY_ON_STARTUP = true` and `ModelService.verify_and_load()` immediately coupled cryptographic on-chain verification with in-memory model deserialization (`joblib.load()`). Consequently, the frontend console displayed `LOADED & ACTIVE` upon launch, obscuring the observable gate that protects the intrusion detection inference plane.

Phase 7D.5 decouples cryptographic provenance verification (`verify()`) from in-memory model loading (`load_model()`), sets `AUTO_VERIFY_ON_STARTUP = false` by default, enforces a 400 Bad Request fail-closed gate on unverified load attempts, and updates the frontend Security Solution and Detection Workbench to require explicit two-step operator control.

---

## 2. Root Cause Analysis (`AUTO_VERIFY_ON_STARTUP`)

1. **Configuration Default:** In `backend/config.py`, `AUTO_VERIFY_ON_STARTUP` was initialized to `os.getenv("AUTO_VERIFY_ON_STARTUP", "true").lower() in ("true", "1", "yes")`. During FastAPI application startup event, `model_service.verify_and_load(verification_service)` was invoked automatically.
2. **Coupled Service Method:** In `backend/services/model_service.py`, `verify_and_load()` performed both the SHA-256 calculation / blockchain digest comparison and executed `joblib.load()` in one step. Thus, verification could not be observed independently from memory loading.
3. **Simulation Reset Coupling:** In `backend/main.py`, `/demo/model-replacement/reset` automatically verified and reloaded canonical models, bypassing operator observation of the restoration gate.

---

## 3. Previous vs. New Explicit Model Lifecycle

### Previous Automatic Lifecycle
```text
APPLICATION START
        ↓
AUTO_VERIFY_ON_STARTUP (true)
        ↓
verify_and_load()
  ├── Compute SHA-256
  ├── Query ModelRegistry.sol
  ├── Compare hashes (MATCH)
  └── joblib.load() [automatic in-memory deserialization]
        ↓
MODEL LOADED & ACTIVE
        ↓
Frontend immediately displays loaded and active state upon mounting
```

### New Explicit Evaluator-Controlled Lifecycle
```text
APPLICATION START
        ↓
AUTO_VERIFY_ON_STARTUP (false)
        ↓
State: UNVERIFIED, UNLOADED, model_pipeline = None
Inference: LOCKED FAIL-CLOSED (HTTP 503)
        ↓
[Operator clicks: "✓ VERIFY AUTHORIZED MODEL"]
        ↓
POST /model/verify
  ├── Compute artifact SHA-256
  ├── Query ModelRegistry.sol digest
  └── Compare hashes (MATCH -> VERIFIED)
        ↓
State: VERIFIED, UNLOADED, model_pipeline = None
Inference: STILL LOCKED FAIL-CLOSED (HTTP 503)
Load Button: ENABLED
        ↓
[Operator clicks: "📥 AUTHORIZE & LOAD MODEL"]
        ↓
POST /model/load
  ├── Check verification gate (verification_status == "VERIFIED")
  ├── joblib.load() [deserialize artifact into memory]
  └── Log MODEL_LOAD audit event
        ↓
State: VERIFIED, LOADED, model_pipeline != None
Inference: UNLOCKED & AVAILABLE (HTTP 200)
```

---

## 4. Architectural & Implementation Details

### 4.1 Backend Engine (`backend/`)
1. **`backend/config.py`**:
   - Changed default: `self.AUTO_VERIFY_ON_STARTUP = os.getenv("AUTO_VERIFY_ON_STARTUP", "false").lower() in ("true", "1", "yes")`.
2. **`backend/schemas.py`**:
   - Added `is_loaded: bool = False` to `ModelVerifyResponse`.
3. **`backend/services/model_service.py`**:
   - Implemented `verify(verification_service)`: performs artifact location, SHA-256 computation, smart contract reference query, and status evaluation (`VERIFIED`, `HASH_MISMATCH`, `NOT_REGISTERED`, `BLOCKCHAIN_UNAVAILABLE`). Does **NOT** call `joblib.load()`. `is_loaded` remains `False`, `model_pipeline` remains `None`.
   - Implemented `load_model()`: verifies prerequisite `self.verification_status == "VERIFIED"`. Deserializes artifact via `joblib.load(self.model_path)`, sets `self.is_loaded = True`, logs `MODEL_LOAD` audit event. Raises `RuntimeError` if unverified.
   - Retained `verify_and_load()` convenience method for automated test suites.
   - Preserved `unload_model()` to reset pipeline to `None`, `is_loaded = False`, `verification_status = "UNVERIFIED"`.
4. **`backend/main.py`**:
   - `POST /model/verify`: calls `svc.verify(verification_service)`, returning `is_loaded=False`.
   - `POST /model/load`: checks target status. If unverified, returns HTTP 400 Bad Request. When verified, calls `load_model()`. Supports optional `target` query parameter (`stage1` or `stage2`).
   - `POST /demo/model-replacement/reset`: defaults to `reload=False`, resetting memory to `UNVERIFIED` and `UNLOADED` without auto-loading, enabling explicit evaluator demonstration of recovery.

### 4.2 Frontend Presentation Layer (`frontend/src/`)
1. **`frontend/src/components/SecuritySolutionOverview.jsx`**:
   - Top posture tracker displays initially:
     - `[1] MODEL PROVENANCE: ● UNVERIFIED`
     - `[2] INTRUSION DETECTION: LOCKED — VERIFY MODEL FIRST`
     - `[3] LATEST INFERENCE: AWAITING MODEL AUTHORIZATION`
     - `[4] OPERATOR ADVISORY: NOT AVAILABLE`
     - `[5] OPERATIONAL AUDIT: 0 PER-FLOW EVM QUERIES`
   - Model Trust card status badge displays `● UNVERIFIED` initially.
   - Execution plane metadata indicates `UNLOADED (Locked Fail-Closed)`.
   - Button 1 (`solution-verify-btn`): text `"✓ VERIFY AUTHORIZED MODEL"` / `"✓ VERIFIED"`. Triggers verification against `ModelRegistry.sol` without loading into memory.
   - Button 2 (`solution-load-btn`): disabled prior to verification with tooltip `"Model verification required before loading into memory"`. Becomes enabled after verification. Once clicked and loaded, displays `"✓ MODEL LOADED & ACTIVE"`.
2. **`frontend/src/components/IntrusionDetection.jsx`**:
   - Displays alert banner `MODEL NOT AUTHORIZED: Network-flow analysis unavailable. Verify and load the authorized model first.` when unloaded.
   - Displays status badge `🔒 ENGINE LOCKED`.
   - Downstream network-flow analysis remains locked fail-closed until models are verified and loaded.
3. **`frontend/src/api/client.js`**:
   - Updated `api.loadModel(target)` to support optional target query parameter (`stage1` / `stage2`).

---

## 5. Security & Fail-Closed Gate Matrix

| Scenario | Local Hash | Registry Hash | Verification Status | Load Allowed? | Inference Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Initial Startup** | Calculated | `None` (Unqueried) | `UNVERIFIED` | ❌ No (HTTP 400) | ❌ Blocked (HTTP 503) |
| **Tampered Artifact** | Corrupted | Authoritative | `HASH_MISMATCH` | ❌ No (HTTP 400) | ❌ Blocked (HTTP 503) |
| **Unregistered Version**| Calculated | Not Found | `NOT_REGISTERED` | ❌ No (HTTP 400) | ❌ Blocked (HTTP 503) |
| **Node Unreachable** | Calculated | Unreachable | `BLOCKCHAIN_UNAVAILABLE` | ❌ No (HTTP 400) | ❌ Blocked (HTTP 503) |
| **Missing Artifact** | Missing | Authoritative | `FILE_NOT_FOUND` | ❌ No (HTTP 400) | ❌ Blocked (HTTP 503) |
| **Verified Only** | Authoritative | Authoritative | `VERIFIED` | ⚠️ Pending Load | ❌ Blocked (HTTP 503) |
| **Verified & Loaded** | Authoritative | Authoritative | `VERIFIED` | ✅ Yes (`LOADED`) | ✅ Allowed (HTTP 200) |

---

## 6. Model Replacement & Recovery Behavior

1. **Simulation Trigger:** `POST /demo/model-replacement` perturbs an ephemeral copy of the model in an OS temporary folder.
2. **Detection & Fail-Closed Isolation:** Verification identifies `HASH_MISMATCH`. Memory is immediately unloaded (`is_loaded = False`), downstream inference endpoints return HTTP 503 Service Unavailable.
3. **Reset Operation:** `POST /demo/model-replacement/reset` verifies canonical disk artifact hash (`dc5e1688...`), logs `MODEL_RESTORED` with action `CANONICAL_RESTORED`, and resets status to `UNVERIFIED` / `UNLOADED` without silently reloading into memory.
4. **Explicit Restoration:** Evaluator explicitly executes `POST /model/verify` (returns `VERIFIED`, `is_loaded: False`), followed by `POST /model/load` (returns `LOADED`, `is_loaded: True`), restoring inference access cleanly and demonstrably.

---

## 7. Authoritative Cryptographic Hashes & Contract Address

- **Stage 1 (Binary IDS):**
  - Model ID: `iot-ids-rf:v1.0.0`
  - Digest: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- **Stage 2 (Multiclass Classifier):**
  - Model ID: `iot-ids-attack-classifier:v1.0.0`
  - Digest: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **Training Dataset (UNSW-NB15):**
  - Digest: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`
- **Testing Dataset (UNSW-NB15):**
  - Digest: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`
- **ModelRegistry Contract Address:**
  - Address: `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`

---

## 8. Test Execution Verification

### 8.1 Backend Test Suite (`pytest -q`)
- Command: `pytest -q`
- Result: **116 passed in 42.81s**
- Added / updated tests:
  - `test_11_explicit_lifecycle_verify_without_load`: `/model/verify` sets `VERIFIED` and `is_loaded: False`.
  - `test_12_explicit_lifecycle_load_unverified_fails`: `/model/load` without verify returns HTTP 400 Bad Request.
  - `test_13_explicit_lifecycle_load_after_verify_succeeds`: `/model/load` after verify sets `LOADED` and `is_loaded: True`.
  - `test_14_complete_explicit_lifecycle_gate`: verifies progression from `START` -> `UNVERIFIED` -> `VERIFY` -> `LOAD` -> `PREDICT`.
  - `test_model_replacement_simulator.py`: updated tests 6, 7, 8 to validate explicit verification/loading after reset.

### 8.2 Frontend Test Suite (`npm run test`)
- Command: `npm --prefix frontend run test`
- Result: **79 passed across 4 test files (0 failures)**
- Added tests in `solution_workflow.test.jsx`:
  - Test 28: Initial mount renders UNVERIFIED and UNLOADED without automatic verify or load calls.
  - Test 29: Top posture card shows unverified and locked state before operator actions.
  - Test 30: AUTHORIZE & LOAD MODEL button is disabled before verification.
  - Test 31: Successful verification enables AUTHORIZE & LOAD without immediately loading model.
  - Test 32: Explicit load sets model to LOADED & ACTIVE and unlocks Intrusion Detection Workbench.
  - Test 33: Reset does not silently reload model but restores canonical artifact in UNVERIFIED/UNLOADED state.

### 8.3 Frontend Production Build (`npm run build`)
- Command: `npm --prefix frontend run build`
- Result: **Built successfully in 637ms** (dist/index.html 0.63 kB, dist/assets/index-BwSO2vlj.js 265.45 kB).

---

## 9. Conclusion

Phase 7D.5 has converted the implicit startup verification into a transparent, observable, two-stage gate. Evaluators can now clearly witness the state transitions from unverified/unloaded to verified, and then to loaded/authorized, demonstrating the cryptographic provenance architecture in real time.
