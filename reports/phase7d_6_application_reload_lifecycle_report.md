# Phase 7D.6 — Application Reload Lifecycle Report: Model Authorization Reset

## 1. Executive Summary & Starting Checkpoint

- **Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
- **Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
- **Phase:** Phase 7D.6 — Reset Model Authorization on Frontend Application Reload
- **Starting Checkpoint:** `262154b5a1281b48f8e97fe9c7fdb0a4c46c753b` (verified on branch `master`)
- **Status:** Complete, strictly validated, research integrity preserved.

Phase 7D.6 ensures that whenever the evaluator reloads or refreshes the frontend application (e.g., via browser reload, F5, or opening a new session), the model authorization lifecycle restarts completely from:

```text
UNVERIFIED
+
UNLOADED
+
IDS LOCKED (FAIL-CLOSED)
```

The evaluator must then explicitly repeat the security lifecycle:

```text
OPEN / RELOAD
    ↓
UNVERIFIED & UNLOADED
    ↓
[Click: "✓ VERIFY AUTHORIZED MODEL"]
    ↓
VERIFIED & UNLOADED
    ↓
[Click: "📥 AUTHORIZE & LOAD MODEL"]
    ↓
LOADED & ACTIVE
    ↓
IDS AVAILABLE
```

---

## 2. Reason for Change & Prior Limitations

In Phase 7D.5, the backend was configured with `AUTO_VERIFY_ON_STARTUP = false`, requiring explicit verification and loading upon backend startup. However, if an evaluator loaded the model and subsequently refreshed the browser window without restarting the FastAPI backend server, the backend remained in memory in the `LOADED` state. Consequently, the newly reloaded frontend would observe `LOADED & ACTIVE`, bypassing the need to demonstrate the security gate again.

Phase 7D.6 addresses this by introducing an explicit session-reset handshake upon frontend application mount, ensuring that browser reloads cleanly restart the model authorization lifecycle while preserving the loaded state during normal single-page application (SPA) tab navigation.

---

## 3. Architecture & Technical Implementation

### 3.1 Backend Control Plane (`backend/`)

1. **`backend/services/model_service.py`**:
   - Enhanced `unload_model()` to clear both execution memory and cached verification records (`model_pipeline = None`, `is_loaded = False`, `verification_status = "UNVERIFIED"`, `last_verification_result = None`, `last_verified_at = None`).
   - Implemented `reset_session()`: provides a clean in-memory reset of authorization and execution state without touching disk files or blockchain records.
2. **`backend/schemas.py`**:
   - Added `ModelSessionResetResponse` schema:
     ```python
     class ModelSessionResetResponse(BaseModel):
         success: bool = True
         action_taken: str = "SESSION_RESET"
         verification_status: str = "UNVERIFIED"
         is_loaded: bool = False
         stage1_ready: bool = False
         stage2_ready: bool = False
         downstream_state: str = "LOCKED"
         message: str
     ```
3. **`backend/main.py`**:
   - Implemented endpoint `POST /model/session/reset`:
     - Resets active authorization and memory state for both Stage 1 (`iot-ids-rf`) and Stage 2 (`iot-ids-attack-classifier`).
     - Logs `SESSION_RESET` event in `audit_service`.
     - Returns `ModelSessionResetResponse` with `is_loaded: False` and `verification_status: "UNVERIFIED"`.
     - Enforces fail-closed downstream inference (HTTP 503 on `/predict` and `/predict/hierarchical`).

### 3.2 Frontend Initialization & Session Management (`frontend/src/`)

1. **`frontend/src/api/client.js`**:
   - Added `api.resetModelSession()` calling `POST /model/session/reset`.
2. **`frontend/src/App.jsx`**:
   - Refactored component mount effect to execute the session reset handshake prior to retrieving telemetry:
     ```javascript
     useEffect(() => {
       let isMounted = true;
       const initializeSession = async () => {
         setIsRefreshing(true);
         setGeneralError(null);
         try {
           await api.resetModelSession();
         } catch (err) {
           if (!isMounted) return;
           setGeneralError(`Backend Connection Alert: ${err.message}. Verify that the FastAPI backend server is running...`);
           setIsRefreshing(false);
           return;
         }
         if (!isMounted) return;
         await loadAll();
       };
       initializeSession();
       return () => { isMounted = false; };
     }, [loadAll]);
     ```
   - **SPA Navigation Invariance:** The initialization effect executes only on application mount (browser reload or initial load). Switching tabs (`activeTab` changes between Security Solution, Dashboard, Intrusion Detection, Model Security, Security Testing, Audit Log, Research Results) does **not** trigger session reset.
   - **Fail-Safe Error Handling:** If `api.resetModelSession()` fails (e.g. server unreachable), the frontend displays an explicit connection alert banner and does not optimistically display unverified or loaded states.
   - **No Client Storage Leaks:** Model authorization is never persisted in `localStorage` or `sessionStorage`.

---

## 4. Lifecycle Progression Matrix

| Event / Operation | Backend Status | Backend Loaded? | Load Button State | Predict Allowed? | Posture Bar Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Initial Mount / Reload** | `UNVERIFIED` | ❌ `False` | Disabled | ❌ 503 Locked | `● UNVERIFIED` |
| **`POST /model/verify`** | `VERIFIED` | ❌ `False` | Enabled | ❌ 503 Locked | `VERIFIED (UNLOADED)` |
| **`POST /model/load`** | `VERIFIED` | ✅ `True` | Active (`LOADED`) | ✅ 200 Allowed | `✓ LOADED & ACTIVE` |
| **Workspace Navigation** | `VERIFIED` | ✅ `True` | Active (`LOADED`) | ✅ 200 Allowed | `✓ LOADED & ACTIVE` |
| **Browser Reload (F5)** | `UNVERIFIED` | ❌ `False` | Disabled | ❌ 503 Locked | `● UNVERIFIED` |

---

## 5. Security & Invariance Analysis

1. **No Tampering Confusion:**
   - `POST /model/session/reset` is strictly an in-memory session reset.
   - It is completely distinct from `/demo/model-replacement` and `/demo/model-replacement/reset` (which demonstrate ephemeral file tampering and canonical byte restoration).
2. **Zero Per-Flow Blockchain Queries:**
   - `per_flow_blockchain_queries` remains strictly `0`. Session reset is an out-of-band control plane operation and is not invoked on the prediction path.
3. **Fail-Closed Gate Preservation:**
   - Attempting `POST /model/load` immediately after session reset returns `HTTP 400 Bad Request`.
   - Attempting `POST /predict` or `POST /predict/hierarchical` immediately after session reset returns `HTTP 503 Service Unavailable`.

---

## 6. Authoritative Hashes and Environment Metadata

- **Stage 1 (Binary IDS):** `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- **Stage 2 (Multiclass Classifier):** `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **Training Dataset (UNSW-NB15):** `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`
- **Testing Dataset (UNSW-NB15):** `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`
- **Contract Address:** `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`

---

## 7. Verification and Testing Evidence

### 7.1 Backend Suite (`pytest -q`)
- Command: `pytest -q`
- Output: **117 passed in 36.39s** (0 failures).
- Added `test_15_model_session_reset_lifecycle` in `tests/test_backend.py`:
  1. Verifies session reset from loaded state produces `UNVERIFIED` and `UNLOADED`.
  2. Confirms downstream inference returns `HTTP 503`.
  3. Confirms subsequent verification sets `VERIFIED` with `is_loaded: False`.
  4. Confirms subsequent explicit load sets `LOADED` with `is_loaded: True`.
  5. Confirms subsequent prediction succeeds with `HTTP 200`.

### 7.2 Frontend Suite (`npm run test`)
- Command: `npm --prefix frontend run test`
- Output: **83 passed across 4 test files** (0 failures).
- Added Phase 7D.6 tests in `frontend/src/test/solution_workflow.test.jsx`:
  - Test 34: Application mount explicitly calls `api.resetModelSession()`.
  - Test 35: Workspace tab navigation does NOT call `resetModelSession()`.
  - Test 36: Simulating browser reload unmount/remount re-triggers session reset to `UNVERIFIED` / `UNLOADED`.
  - Test 37: Failed session reset displays connection alert banner and does not falsely display unverified model as ready.

### 7.3 Frontend Production Build (`npm run build`)
- Command: `npm --prefix frontend run build`
- Output: **Built in 701ms** (clean production bundle generated).

### 7.4 Live Runtime Validation
- Confirmed with live FastAPI backend on `http://127.0.0.1:8000`:
  - Pre-reset: `verified = VERIFIED`, `is_loaded = True`.
  - `POST /model/session/reset` $\rightarrow$ `status: UNVERIFIED`, `is_loaded: False`.
  - Subsequent `POST /predict` returns `503 Service Unavailable`.
