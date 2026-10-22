# Phase 4 — Backend Integration & Security Audit Layer Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Author:** Senior Systems Engineer & Research Architect  
**Date:** October 22, 2026  
**Audited Baseline Commit:** `e522c391104ba4b49c579209c61166f175f7ddf2`  
**Phase 4 Verdict:** **APPROVED**  

---

## 1. Executive Summary

Phase 4 establishes the **Backend Integration & Security Audit Layer**, connecting the previously completed off-chain machine learning intrusion detection pipeline (Phase 1), cryptographic model provenance (Phase 2), and Ethereum smart contract registry (Phase 3) into a cohesive RESTful backend service built on FastAPI.

Key achievements of Phase 4:
1. **Architectural Decoupling Preserved:** Strict separation of responsibilities is maintained:
   - ML inference classifies network flows off-chain.
   - Smart contract (`ModelRegistry.sol`) anchors 32-byte model provenance digests on-chain.
   - FastAPI orchestrates the system, enforces a strict pre-load verification gate, and logs security audit events.
2. **Fail-Closed Verification Gate:** Prohibits `joblib.load()` and rejects inference requests (HTTP 503) if verification fails (`HASH_MISMATCH`, `NOT_REGISTERED`, `BLOCKCHAIN_UNAVAILABLE`, or `FILE_NOT_FOUND`).
3. **Decoupled Verification vs. Inference:** Blockchain lookup occurs once at initialization/explicit verification, not on the steady-state per-flow prediction path.
4. **Structured Security Auditing:** Local append-oriented SQLite audit store records lifecycle and prediction events with unique UUIDs, timestamps, and execution latencies without persisting sensitive raw network payloads.
5. **Empirical Benchmarks:** Controlled experiments measured verification latency (mean: 27.23 ms), pure ML inference latency (mean: 39.16 ms), and end-to-end API `/predict` latency (mean: 49.30 ms).
6. **Automated Testing:** 40 unit and integration tests passing across all layers in 9.05 seconds.

---

## 2. Baseline Specification

- **Previous Baseline Commit:** `e522c391104ba4b49c579209c61166f175f7ddf2` (`docs: finalize phase 3.1 research integrity corrections`)
- **Remote Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
- **Target Branch:** `master`
- **Trained Model Artifact:** `ml/artifacts/ids_model.joblib` (6,319,677 bytes)
- **Model SHA-256 Digest:** `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- **Smart Contract:** `ModelRegistry.sol` (Solidity 0.8.20) at `0xF2E246BB76DF876Cef8b38ae84130F4F55De395b`

---

## 3. Final Backend Architecture

```text
                    ┌───────────────────────────────┐
                    │  Blockchain Model Registry    │
                    │      (ModelRegistry.sol)      │
                    │  Key: "iot-ids-rf:v1.0.0"     │
                    │  Digest: bytes32 SHA-256      │
                    └───────────────┬───────────────┘
                                    │
                                    ▼ On-Chain State Read (Once at Init / Refresh)
                          VerificationService
                                    │
                             PASS / FAIL
                                    │
                                    ▼
                          Fail-Closed Gatekeeper
                            (ModelService)
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                    [VERIFIED]             [FAILED]
                         │                     │
                         ▼                     ▼
                  joblib.load()           Do NOT Load
                         │                     │
                         ▼                     ▼
                    Model Ready         Inference Blocked (503)
                         │
                         ▼ Off-Chain Inference
┌────────────────┐       │
│  Network Flow  │ ────► │ FastAPI Backend Service
│    Features    │       │   - POST /predict
└────────────────┘       │   - POST /model/verify
                         │   - GET /model/status
                         │   - GET /health
                         │   - GET /audit/events
                         └──────────────┬───────────────┘
                                        │
                                        ▼ Operational Events
                         ┌──────────────────────────────┐
                         │   Local SQLite Audit Store   │
                         │      (backend/data/audit.db) │
                         └──────────────────────────────┘
```

### Layer Responsibilities
- **AI/ML Layer (Off-Chain):** Evaluates 42 network flow features against the trained Random Forest pipeline to classify traffic as Benign (0) or Attack (1) with class confidence scores.
- **Cryptographic Layer (Off-Chain):** Generates streaming SHA-256 digests over binary artifact bytes using 64 KB buffers.
- **Blockchain Layer (On-Chain):** Provides immutable, decentralized storage of authorized model digests (`bytes32`), versions, algorithms, registrant addresses, and block timestamps.
- **Backend API Layer (FastAPI):** Exposes JSON REST endpoints, enforces the pre-deserialization verification gate, serves low-latency inferences, and logs structured operational events.
- **Audit Layer (Local SQLite):** Stores append-oriented audit logs of security lifecycle and prediction events.

---

## 4. Files Added and Modified

### Files Added
1. `backend/__init__.py`: Package initialization.
2. `backend/config.py`: Application configuration with environment variable fallbacks.
3. `backend/schemas.py`: Pydantic request/response models.
4. `backend/services/__init__.py`: Services package initialization.
5. `backend/services/audit_service.py`: Append-oriented SQLite audit logger.
6. `backend/services/verification_service.py`: Blockchain verification connector.
7. `backend/services/model_service.py`: Model lifecycle manager and fail-closed gate.
8. `backend/services/prediction_service.py`: Gated off-chain ML inference engine.
9. `backend/main.py`: FastAPI app, route definitions, lifecycle, and global exception handlers.
10. `tests/test_backend.py`: Automated test suite covering Scenarios A–G, health, status, and API validation (10 tests).
11. `experiments/backend_latency_experiment.py`: Benchmark runner measuring verification, inference, and end-to-end API latencies.
12. `experiments/results/backend_integration_results.json`: Empirical measurement records.
13. `reports/pre_phase4_full_audit.md`: Formal pre-Phase 4 research integrity report.
14. `reports/phase4_backend_integration_report.md`: Formal Phase 4 completion report.

### Files Modified
1. `requirements.txt`: Cleaned duplicate `web3>=7.0.0` entry (Finding F-01).
2. `README.md`: Documented Phase 4 architecture, endpoints, benchmark table, and replication instructions.

---

## 5. FastAPI Endpoints Implemented

| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Reports overall, application, blockchain, and model component statuses. | `200 OK` |
| `GET` | `/model/status` | Reports model metadata, local SHA-256, on-chain hash, and verification status. | `200 OK` |
| `POST` | `/model/verify` | Explicitly computes artifact hash, queries smart contract, and loads model on success. | `200 OK` |
| `POST` | `/predict` | Ingests network flow features, verifies gate state, runs off-chain ML inference, logs audit event. | `200 OK` / `503 Service Unavailable` / `422 Unprocessable` |
| `GET` | `/audit/events` | Returns paginated list of security audit events with optional `event_type` filter. | `200 OK` |
| `GET` | `/audit/events/{event_id}` | Retrieves a single security event by its unique UUID. | `200 OK` / `404 Not Found` |

---

## 6. Model Verification Gate Lifecycle

```text
Application Startup / Explicit POST /model/verify
                 │
                 ▼
     Calculate Local Artifact SHA-256
                 │
                 ▼
     Query ModelRegistry.sol On-Chain
                 │
           ┌─────┴─────┐
           │           │
        VERIFIED    FAILURE (HASH_MISMATCH / NOT_REGISTERED / BLOCKCHAIN_UNAVAILABLE / FILE_NOT_FOUND)
           │           │
           ▼           ▼
      joblib.load()   Purge pipeline from memory
           │           │
           ▼           ▼
      is_loaded=True  is_loaded=False
           │           │
           ▼           ▼
   Enable /predict   Reject /predict with HTTP 503
```

### Decoupling Verification from Inference
- Steady-state per-flow inference does **not** invoke the blockchain.
- Model verification occurs once at startup (or via explicit `/model/verify` request).
- Once `VERIFIED` and loaded, `/predict` executes pure off-chain inference in sub-50 ms without incurring on-chain read latencies or gas costs.

---

## 7. Fail-Closed Security Behavior

The system strictly adheres to the **fail-closed** security model:

1. **Tampered Artifact (`HASH_MISMATCH`):**
   If the local artifact binary differs from the registered digest by even one bit, verification returns `HASH_MISMATCH`, model loading is aborted, and `/predict` returns `503 Service Unavailable`.
2. **Unregistered Model (`NOT_REGISTERED`):**
   If the queried model ID or version is absent from the smart contract, loading is aborted and inference is rejected.
3. **EVM / Node Failure (`BLOCKCHAIN_UNAVAILABLE`):**
   If the blockchain RPC or provider is unreachable, the system does **not** fall back to unverified local files. Loading is blocked and `/predict` returns `503 Service Unavailable`.
4. **Missing Artifact (`FILE_NOT_FOUND`):**
   If the model artifact path does not exist on disk, verification returns `FILE_NOT_FOUND` and loading is blocked.

---

## 8. Security Event Audit Logging

### Storage Mechanism
- Implemented using a local SQLite database (`backend/data/audit.db`) with Write-Ahead Logging (`PRAGMA journal_mode=WAL`).
- Provides local, append-oriented operational logging.

### Event Schema
```json
{
  "event_id": "771e8470-f4b6-4b47-97d8-aa356d77364b",
  "timestamp": "2026-10-22T15:48:35.485149+00:00",
  "event_type": "PREDICTION",
  "model_id": "iot-ids-rf",
  "model_version": "v1.0.0",
  "verification_status": "VERIFIED",
  "prediction": "Attack",
  "inference_latency_ms": 38.5701,
  "verification_latency_ms": null,
  "status": "SUCCESS",
  "details": {
    "feature_count": 42,
    "confidence": 0.90,
    "prediction_code": 1
  }
}
```

### Event Types
- `MODEL_VERIFICATION`: Successful on-chain integrity verification.
- `MODEL_VERIFICATION_FAILURE`: Failed verification attempt.
- `MODEL_LOAD`: Approved model artifact deserialized into memory.
- `MODEL_LOAD_BLOCKED`: Model deserialization rejected by fail-closed gate.
- `PREDICTION`: Completed off-chain intrusion detection inference.
- `SYSTEM_ERROR`: Unhandled operational exception.

### Privacy Boundary
To protect sensitive operational data, the full raw feature payload is **not** stored in the audit log. Only feature counts, class confidence scores, prediction labels, and operational latencies are persisted.

---

## 9. Security Test Scenarios & Observed Results

All scenarios were tested via `tests/test_backend.py`:

| Scenario | Condition | Expected Outcome | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Scenario A** | Legitimate model artifact matching registered hash. | `VERIFIED`, model loaded, `/predict` succeeds (200), audit logged. | Verified on-chain, pipeline loaded, prediction returned `Attack`/`Benign`. | **PASS** |
| **Scenario B** | Corrupted artifact bytes on disk. | `HASH_MISMATCH`, model loading blocked, `/predict` rejected (503). | Hash mismatch caught, loading blocked, predict returned 503. | **PASS** |
| **Scenario C** | Unregistered model version (e.g. `v9.9.9`). | `NOT_REGISTERED`, model loading blocked, `/predict` rejected (503). | Contract reported false, loading blocked, predict returned 503. | **PASS** |
| **Scenario D** | Disconnected blockchain provider (None). | `BLOCKCHAIN_UNAVAILABLE`, loading blocked, no insecure fallback. | EVM disconnected, loading blocked, predict returned 503. | **PASS** |
| **Scenario E** | Model artifact path points to non-existent file. | `FILE_NOT_FOUND`, loading blocked. | Path checked, loading blocked, returned `FILE_NOT_FOUND`. | **PASS** |
| **Scenario F** | Flow records with flat / nested features & extra ID columns. | Automatic stripping of `id`, `label`, `attack_cat`; valid inference. | Non-predictive columns stripped, inference succeeded with confidence score. | **PASS** |
| **Scenario G** | Audit event retrieval, pagination, filtering, single lookup. | List query, filter by `event_type`, single UUID lookup, 404 on missing. | Correct pagination count, filtered by type, single event returned, 404 on invalid ID. | **PASS** |

---

## 10. Performance Benchmarks

Measured via `experiments/backend_latency_experiment.py` in the local evaluation environment (`Windows-11`, `Python 3.12.4`, `Intel64 Family 6 Model 154`, `EthereumTesterProvider`):

| Latency Metric | Samples | Mean | Median | Min | Max | StDev | Description |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Model Verification** | $N=30$ | `27.2321 ms` | `27.0404 ms` | `24.0745 ms` | `41.3059 ms` | `1.5278 ms` | Full SHA-256 calculation over 6.32 MB binary + EVM read |
| **On-Chain Read Alone** | $N=30$ | `13.5491 ms` | `13.3017 ms` | `11.7908 ms` | `17.4762 ms` | `1.2953 ms` | Smart contract `getModelRecord` state query |
| **Pure ML Inference** | $N=100$ | `39.1582 ms` | `38.7294 ms` | `36.2706 ms` | `56.2219 ms` | `2.6823 ms` | Isolated Random Forest classification per flow |
| **End-to-End API `/predict`** | $N=100$ | `49.3021 ms` | `48.2380 ms` | `44.9322 ms` | `105.1077 ms` | `7.1562 ms` | Complete HTTP request, validation, gate check, inference, and audit write |

---

## 11. Automated Test Suite Results

Executed command:
```bash
python -m pytest tests -v
```

Execution Summary:
```text
============================= test session starts =============================
platform win32 -- Python 3.12.4, pytest-8.4.1, pluggy-1.6.0
rootdir: C:\Users\Shaik Afrid\OneDrive\Desktop\major_project
configfile: pytest.ini
testpaths: tests
plugins: anyio-4.9.0, langsmith-0.4.4, cov-6.2.1
collected 40 items

tests/test_backend.py (10 tests) ..........                              [ 25%]
tests/test_blockchain.py (12 tests) ............                         [ 55%]
tests/test_ml_pipeline.py (8 tests) ........                             [ 75%]
tests/test_provenance.py (10 tests) ..........                           [100%]

============================= 40 passed in 9.05s ==============================
```

- **Total Test Cases:** 40
- **Passed:** 40 (100%)
- **Failed:** 0
- **Skipped:** 0
- **Duration:** 9.05 seconds

---

## 12. Research Claim Audit

| Claim | Classification | Evidence / Basis |
| :--- | :--- | :--- |
| **Decoupled Verification from Inference** | **SUPPORTED** | Steady-state inference (`/predict`) performs purely off-chain inference without calling Web3 or smart contracts. |
| **Fail-Closed Gatekeeper** | **SUPPORTED** | Verified across Scenarios B, C, D, and E: `joblib.load()` is never called unless SHA-256 matches the registered hash. |
| **Cryptographic Integrity Verification** | **QUALIFIED** | Hash verification establishes binary correspondence with the registered digest; it does **not** prove model accuracy, adversarial robustness, or absence of training-data poisoning. |
| **Audit Log Immutability** | **QUALIFIED** | The local SQLite audit log provides append-oriented tracking; it is **not** by itself blockchain tamper-proof or cryptographically anchored. |
| **Low-Latency Inference** | **QUALIFIED** | Empirical API latency is ~49.3 ms in the local test environment; performance will vary under multi-client network load. |
| **IoT Deployment Suitability** | **QUALIFIED** | Evaluation uses UNSW-NB15 flow benchmark data on desktop x86_64; performance on resource-constrained embedded microcontrollers remains future work. |

---

## 13. System Limitations

1. **Benchmark Scope:** The system is evaluated on UNSW-NB15 network flow records rather than raw physical sensor packets from constrained microcontrollers (e.g. ESP32).
2. **Local EVM Environment:** Smart contract interactions are benchmarked on `EthereumTesterProvider` (in-process py-evm); public network latency (RPC transmission, mempool queuing, block gas limits) is not modeled.
3. **Artifact Integrity vs. Model Quality:** SHA-256 binary hashing verifies that an artifact has not been modified after registration. It provides no guarantee against malicious training data (data poisoning) or inherent classification errors.
4. **In-Memory Tampering Boundary:** The verification gate inspects the serialized file on disk prior to deserialization. In-memory memory modification (e.g., process injection or debugger tampering) post-loading is outside the threat model of file-level hashing.
5. **Local Audit Store:** The SQLite audit database is local and append-oriented. While sufficient for Phase 4 operational auditing, it does not possess decentralized consensus or cryptographic block hashing.

---

## 14. Security Considerations & Threat Model

| Threat | Addressed By | Residual Risk |
| :--- | :--- | :--- |
| **Artifact Replacement / Trojaning** | Pre-load SHA-256 verification against smart contract reference. | High security against binary replacement prior to load. |
| **Arbitrary Pickle Execution** | Deserialization (`joblib.load`) is blocked unless artifact hash exactly matches trusted on-chain reference. | Mitigates untrusted deserialization attacks on the local filesystem. |
| **Unregistered Model Deployment** | Smart contract lookup returns `NOT_REGISTERED`, preventing load. | Access control on smart contract (`onlyOwner`) prevents unauthorized registrations. |
| **EVM / Node Outage** | Fail-closed behavior returns `BLOCKCHAIN_UNAVAILABLE` and refuses to load unverified models. | Denial of Service if blockchain node is down during initialization. |
| **In-Memory Process Hooking** | Out of scope for static file verification. | Requires OS-level memory integrity protection (e.g. Intel SGX / secure enclaves). |

---

## 15. Phase 4 Verdict

### **Verdict: APPROVED**

Phase 4 has met all research, architectural, testing, and performance requirements:
- The FastAPI backend is modular, functional, and fully tested.
- The model verification gate enforces fail-closed security across all negative scenarios.
- The off-chain inference pipeline achieves sub-50 ms end-to-end API latency decoupled from blockchain overhead.
- All 40 unit and integration tests pass cleanly.
- Research claims are strictly qualified and backed by empirical evidence.

---

## 16. Phase 5 Readiness

### **Readiness: READY FOR PHASE 5**

The backend REST API provides all necessary endpoints (`/health`, `/model/status`, `/model/verify`, `/predict`, `/audit/events`) with CORS middleware and structured JSON responses. The project is fully prepared for **Phase 5 (React Frontend / Dashboard)**.
