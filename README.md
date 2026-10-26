# Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

**Final-Year B.Tech Research Project**  
**Core Focus:** Trusted AI Model Provenance, Cryptographic Integrity Verification, and Tamper-Evident Auditing for Machine Learning-Based Network Intrusion Detection Systems.

---

## 1. Project Philosophy & Architecture

A conventional ML-based intrusion-detection system answers:
> *"Is this network traffic normal or malicious?"*

However, in untrusted deployment environments, a second fundamental security question arises:
> *"Can we trust the AI model artifact that is making this prediction?"*

This project rigorously decouples these responsibilities:

```text
[Network Flow Traffic (UNSW-NB15)]
                 │
                 ▼
┌─────────────────────────────────┐
│     Hierarchical ML Detector    │ ──> Stage 1: Benign vs. Malicious (Binary)
│    (Stage 1 & Stage 2 RF)       │     Stage 2: Attack Classification (Multi-Class)
└─────────────────────────────────┘     (Off-Chain ML Inference)
                 ▲
                 │ Pre-Deployment Cryptographic Verification
┌─────────────────────────────────┐
│      Model Artifact Files       │ ──> Streaming SHA-256 Digest (bytes32)
│  (ids_model / attack_classifier)│
└─────────────────────────────────┘
                 │
                 ▼ Cryptographic Comparison (LOCAL_HASH == REGISTERED_HASH)
┌─────────────────────────────────┐
│   Blockchain Provenance Layer   │ ──> Tamper-Evident Provenance Registry
│       (ModelRegistry.sol)       │     (On-Chain bytes32 Hash, Version, Timestamp)
└─────────────────────────────────┘
```

### Core Research Distinctions & Scientific Scope

> [!IMPORTANT]
> **Separation of Concerns:**  
> The blockchain stores model provenance and cryptographic references; it does **not** store heavy model artifacts or perform network intrusion detection.  
> 
> **Architectural Separation vs. Latency:**  
> The blockchain verification operation is architecturally separated from steady-state ML inference and is **not invoked for every network-flow prediction** in the current design. Steady-state inference executes strictly off-chain at zero per-flow blockchain overhead.  
> 
> **Environmental Qualification:**  
> The measured blockchain read and write latencies reflect the evaluated local EVM environment (`EthereumTesterProvider` / local Ganache RPC) and should not be interpreted as representative of public or production blockchain networks.  
> 
> **Benchmark Dataset Context:**  
> UNSW-NB15 is used as a network intrusion-detection benchmark for the ML component; the current experiment does not by itself establish deployment performance on a physical IoT network.  
> 
> **Verification Semantics:**  
> A successful hash comparison establishes artifact integrity relative to the registered reference. It does **not** prove that the model is accurate, unbiased, adversarially robust, or free from data poisoning. The blockchain-backed registry provides a trusted reference for registered model hashes within the experimental architecture.

---

## 2. On-Chain vs. Off-Chain Data Model

Consistent with decentralized systems literature (e.g., *BASIS Schema, Kaushik et al., Springer 2026*), the architecture maintains a strict on-chain/off-chain boundary:
- **Off-Chain:** Heavy binary model files (`ids_model.joblib` [6.3 MB], `attack_classifier.joblib` [18.5 MB]) and raw network traffic benchmark datasets (`UNSW-NB15`, ~47 MB) remain strictly off-chain at the local system node.
- **On-Chain (`ModelRegistry.sol`):** Anchors only lightweight, fixed-size 32-byte cryptographic digests (`bytes32 modelHash`), release version, algorithm label, registrant address, and block timestamp.

### Canonical Cryptographic Invariants
- **Stage 1 Binary Classifier (`iot-ids-rf:v1.0.0`):** `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
- **Stage 2 Multi-Class Classifier (`iot-ids-attack-classifier:v1.0.0`):** `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **UNSW-NB15 Training Partition:** `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`
- **UNSW-NB15 Testing Partition:** `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`

---

## 3. Implementation Status

### Completed Components (Phases 1–7D)
- **ML Intrusion Detection Baseline (Phase 1):** Random Forest trained on authentic UNSW-NB15 (90.30% accuracy, 98.78% precision, 86.82% recall, 2.29% FPR on untouched test partition).
- **Cryptographic Model Hashing (Phase 2):** Low-memory streaming SHA-256 calculator operating over 64 KB binary buffers.
- **Model Provenance Schema (Phase 2):** Structured JSON provenance records linking model ID, version, dataset hash, training hyperparameters, and metrics.
- **Blockchain Model Registry (Phase 3):** Solidity 0.8.20 smart contract (`ModelRegistry.sol`) with unique `model_id + version` keys, duplicate registration rejection, and access control.
- **Blockchain-Backed Model Integrity Verification (Phase 3):** Web3 engine validating local artifact hashes against on-chain records.
- **FastAPI Backend Integration Layer (Phase 4):** RESTful service orchestrating model verification, fail-closed model loading, off-chain intrusion detection inference, and security event auditing.
- **Fail-Closed Model Verification Gate (Phase 4 & 7D):** Prohibits memory deserialization (`joblib.load()`) and rejects inference requests (HTTP 503) if verification fails (`HASH_MISMATCH`, `NOT_REGISTERED`, `BLOCKCHAIN_UNAVAILABLE`, `FILE_NOT_FOUND`).
- **Two-Stage Hierarchical ML Architecture (Phases 6–7B):**
  - Stage 1: Binary classifier (`iot-ids-rf:v1.0.0`) detecting normal vs. attack traffic.
  - Stage 2: Multi-class classifier (`iot-ids-attack-classifier:v1.0.0`) categorizing attacks into UNSW-NB15 attack types (Exploits, DoS, Generic, Fuzzers, Reconnaissance, etc.). Stage 2 is executed conditionally only if Stage 1 identifies malicious traffic.
- **Security Event Audit Logging (Phases 4 & 7B):** Local append-oriented SQLite audit store recording lifecycle and prediction events without persisting raw 42-feature network payloads.
- **Ephemeral Model Replacement Security Simulator (Phase 7B.5):** Controlled security testing suite creating ephemeral in-memory candidate mutations to demonstrate deterministic `HASH_MISMATCH` detection and fail-closed load gating without modifying canonical artifacts.
- **Explicit Verification & Load Lifecycle (Phase 7D.5–7D.7):** Decoupled two-step lifecycle requiring explicit pre-load verification (`✓ VERIFY AUTHORIZED MODEL`) followed by explicit loading (`📥 LOAD MODEL`), resetting to `UNVERIFIED / UNLOADED` on browser application reloads.
- **React Frontend Operations Console (Phases 5–7D):** Modern cyber-defense operations console featuring an Intrusion Detection Workbench with UNSW-NB15 network traffic flow selector, Model Integrity Verification, Security Advisory, and Audit Logs.
- **Automated Test Suite:** Comprehensive test suite with **200 automated tests passing** (117 backend pytest tests + 83 frontend vitest component and workflow tests).

---

## 4. Performance & Overhead Benchmarks

All metrics reflect empirical measurements from the evaluated local EVM environment (`EthereumTesterProvider` / local Ganache):

- **Model Registration Write Latency:** `0.0714` seconds (~71.4 ms)
- **Model Registration Gas Consumed:** `214,023` gas
- **On-Chain Hash Read Latency ($N=30$ samples):**
  - Mean: `7.2058 ms`
  - Median: `7.2653 ms`
  - Min: `6.3054 ms`
  - Max: `7.9071 ms`
  - Standard Deviation: `0.4148 ms`

### Backend Integration & Latency Benchmarks (Phase 4 & Phase 7B)

Measured empirically using `experiments/backend_latency_experiment.py` and `experiments/final_end_to_end_integration.py`:

| Benchmark Phase | Samples | Mean | Median | StDev | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Model Verification** | $N=30$ | `27.23 ms` | `27.04 ms` | `1.53 ms` | SHA-256 calculation over binary artifact + EVM read |
| **On-Chain Read Alone** | $N=30$ | `13.55 ms` | `13.30 ms` | `1.30 ms` | Smart contract `getModelRecord` call |
| **Pure ML Inference (Stage 1)** | $N=100$ | `39.16 ms` | `38.73 ms` | `2.68 ms` | Off-chain Random Forest binary classification per flow |
| **Hierarchical Inference (S1 + S2)** | $N=100$ | `52.40 ms` | `50.15 ms` | `4.22 ms` | Off-chain Stage 1 + Stage 2 classification for attacks |
| **End-to-End API `/predict`** | $N=100$ | `49.30 ms` | `48.24 ms` | `7.16 ms` | HTTP parsing, gate check, ML inference, and SQLite audit |

> [!NOTE]
> In this architecture, model verification is performed at application startup/deployment or via an explicit `/model/verify` boundary rather than for every network-flow inference request. Therefore, the blockchain lookup is decoupled from steady-state per-flow inference. This is an architectural separation and not an experimental claim of zero end-to-end latency overhead.

---

## 5. Directory Layout

```text
major_project/
├── frontend/                                # Phase 5-7D React Dashboard UI
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                    # REST client communicating with FastAPI
│   │   ├── components/
│   │   │   ├── AlertBanner.jsx              # Status & error alerts
│   │   │   ├── AuditLog.jsx                 # Operational event viewer & modal inspector
│   │   │   ├── Header.jsx                   # System health indicators & brand header
│   │   │   ├── IntrusionDetection.jsx       # Network Traffic Workbench (UNSW-NB15 flows)
│   │   │   ├── ModelSecurity.jsx            # Security Testing & Model Replacement simulator
│   │   │   ├── SecuritySolutionOverview.jsx # Decoupled Verify & Load lifecycle workspace
│   │   │   └── StatusBadge.jsx              # Semantic status indicators
│   │   ├── test/
│   │   │   ├── setup.js
│   │   │   ├── App.test.jsx                 # Component tests (10 tests)
│   │   │   ├── analytics.test.js            # Frontend metrics tests (16 tests)
│   │   │   ├── architecture_workflow.test.jsx # Operations console tests (20 tests)
│   │   │   └── solution_workflow.test.jsx   # Solution lifecycle tests (37 tests)
│   │   ├── App.jsx                          # Dashboard container
│   │   ├── index.css                        # Cyber-defense UI stylesheet
│   │   └── main.jsx                         # Application entry point
│   ├── package.json
│   └── vite.config.js
├── backend/                                 # Phase 4 & 7D FastAPI REST Service
│   ├── __init__.py
│   ├── config.py                            # App configuration & dynamic deployment loading
│   ├── schemas.py                           # Pydantic request/response schemas
│   ├── main.py                              # FastAPI routes, lifecycle, error handlers
│   └── services/
│       ├── __init__.py
│       ├── audit_service.py                 # Local SQLite append audit store
│       ├── hierarchical_service.py          # Stage 1 + Stage 2 routing engine
│       ├── model_replacement_simulator.py   # Ephemeral security attack testing service
│       ├── model_service.py                 # Fail-closed model gatekeeper & lifecycle state
│       ├── prediction_service.py            # Off-chain ML inference engine
│       └── verification_service.py          # Blockchain-backed integrity verifier
├── data/
│   ├── raw/
│   │   ├── UNSW_NB15_training-set.csv       # 82,332 records (SHA-256: 734fe6642edf...)
│   │   └── UNSW_NB15_testing-set.csv        # 175,341 records (SHA-256: bec7dd5ec88d...)
│   └── processed/
├── core/
│   ├── __init__.py
│   ├── hashing.py                           # Streaming SHA-256 digest calculation
│   ├── provenance.py                        # Structured provenance records & local verifier
│   ├── blockchain.py                        # Web3 client, bytes32 conversion, and EVM verifier
│   └── response_recommendations.py          # Human-in-the-loop security advisory mappings
├── blockchain/
│   ├── contracts/
│   │   └── ModelRegistry.sol                # Solidity 0.8.20 provenance registry contract
│   ├── artifacts/
│   │   └── ModelRegistry.json               # Compiled ABI and Bytecode
│   ├── deployment/
│   │   └── deployment.json                  # Local EVM deployment receipt & contract address
│   ├── scripts/
│   │   ├── compile.py                       # Solcx compilation runner
│   │   ├── deploy.py                        # Contract deployment script
│   │   └── register_model.py                # On-chain model registration script
│   └── README.md                            # Blockchain layer architecture notes
├── ml/
│   ├── __init__.py
│   ├── dataset.py                           # Dataset loader, downloader, inspection, hashing
│   ├── preprocess.py                        # ColumnTransformer and Pipeline builder
│   ├── train.py                             # Training runner and metadata generator
│   ├── evaluate.py                          # Academic metrics evaluation
│   ├── predict.py                           # Inference wrapper with integrity gating
│   └── artifacts/
│       ├── ids_model.joblib                 # Stage 1 model pipeline (6.3 MB)
│       ├── model_metadata.json              # Stage 1 metadata with cryptographic digests
│       ├── provenance_record.json           # Stage 1 standardized provenance record
│       ├── attack_classifier.joblib         # Stage 2 model pipeline (18.5 MB)
│       ├── attack_classifier_metadata.json  # Stage 2 metadata with cryptographic digests
│       └── attack_classifier_provenance_record.json # Stage 2 provenance record
├── experiments/
│   ├── tampering_experiment.py              # Local binary tampering simulation
│   ├── blockchain_provenance_experiment.py  # Blockchain provenance & latency benchmarking
│   ├── backend_latency_experiment.py        # Phase 4 end-to-end latency benchmarks
│   ├── stage2_provenance_experiment.py      # Stage 2 on-chain registration & verification
│   ├── hierarchical_ids_evaluation.py       # Full-set hierarchical evaluation (175,341 flows)
│   └── final_end_to_end_integration.py      # End-to-end E1-E7 integration runner
├── tests/
│   ├── test_ml_pipeline.py                  # ML pipeline tests (8 tests)
│   ├── test_provenance.py                   # Provenance & cryptographic tests (10 tests)
│   ├── test_blockchain.py                   # Smart contract & Web3 integration tests (12 tests)
│   ├── test_backend.py                      # FastAPI & security gate tests (24 tests)
│   ├── test_multiclass_classifier.py        # Stage 2 attack classifier tests (10 tests)
│   ├── test_stage2_provenance.py            # Stage 2 blockchain provenance tests (10 tests)
│   ├── test_hierarchical_ids.py             # Hierarchical classification tests (10 tests)
│   ├── test_response_recommendations.py     # Advisory response tests (10 tests)
│   ├── test_model_replacement_simulator.py  # Security replacement simulator tests (11 tests)
│   └── test_end_to_end_integration.py       # Comprehensive integration tests (12 tests)
├── reports/                                 # Formal research integrity and audit reports
├── requirements.txt                         # Pinned Python dependencies
├── pytest.ini                               # Pytest test configuration
└── README.md                                # Project documentation and setup guide
```

---

## 6. Prerequisites

Before setting up the project, ensure the following software tools are installed on your system:

- **Git:** Version control system to clone the repository.
- **Python 3.10+** (tested and verified on Python 3.12): For backend APIs, ML inference, and blockchain tooling.
- **Node.js (v18+) & npm (v9+):** For the React / Vite frontend operations console.
- **Local Ethereum-Compatible EVM Environment:**
  - The recommended provider for the interactive multi-process application demo is **Ganache** (`npx ganache`).
  - *Note:* The automated test suite (`pytest`) uses an in-process deterministic `EthereumTesterProvider` (`py-evm`), meaning `pytest` can run completely standalone without starting an external Ganache instance.

---

## 7. Step-by-Step Installation & Local System Deployment

Follow these steps to set up and run the complete system locally from a fresh clone.

### Step 1: Clone the Repository

```bash
git clone https://github.com/afrid995/blockchain-ai-iot-ids.git
cd blockchain-ai-iot-ids
```

### Step 2: Python Virtual Environment & Dependencies

Create and activate an isolated Python virtual environment:

- **Windows PowerShell:**
  ```powershell
  python -m venv .venv
  .venv\Scripts\Activate.ps1
  ```
- **Windows Command Prompt:**
  ```cmd
  python -m venv .venv
  .venv\Scripts\activate.bat
  ```
- **Linux / macOS:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

Install all required Python dependencies:

```bash
pip install -r requirements.txt
```

### Step 3: Start the Local Blockchain (Ganache)

For the live multi-process interactive demonstration, open a dedicated terminal window and start a local deterministic Ethereum-compatible node:

```bash
npx ganache --wallet.deterministic
```

- **RPC Endpoint:** `http://127.0.0.1:8545`
- **Network ID:** `5777`
- *Security Note:* Ganache generates deterministic local test accounts pre-funded with test Ether. No real funds, private keys, or external credentials are used.

> [!TIP]
> If you do not have `npx` installed globally, you can install Ganache globally via `npm install -g ganache` and run `ganache --wallet.deterministic`.

### Step 4: Deploy the ModelRegistry Smart Contract

In a new terminal (with `.venv` activated), deploy the `ModelRegistry.sol` contract to the local Ganache network:

```bash
python -m blockchain.scripts.deploy
```

- **Output:** The script compiles the Solidity contract (if not already compiled), executes deployment, and writes the deployment receipt and dynamic `contract_address` to `blockchain/deployment/deployment.json`.
- **Dynamic Configuration:** `backend/config.py` automatically reads the contract address from `blockchain/deployment/deployment.json`. You do not need to manually copy or edit contract addresses.

### Step 5: Register Hierarchical Models On-Chain

Register both canonical models in the deployed `ModelRegistry` smart contract:

1. **Register Stage 1 Binary Classifier (`iot-ids-rf:v1.0.0`):**
   ```bash
   python -m blockchain.scripts.register_model
   ```
   *Action:* Calculates the streaming SHA-256 digest of `ml/artifacts/ids_model.joblib`, confirms it matches `ml/artifacts/provenance_record.json`, and submits an on-chain transaction registering the model.

2. **Register Stage 2 Multi-Class Classifier (`iot-ids-attack-classifier:v1.0.0`):**
   ```bash
   python -c "from backend.config import settings; from core.blockchain import BlockchainRegistryClient; from core.hashing import calculate_sha256; c = BlockchainRegistryClient(rpc_url=settings.RPC_URL, contract_address=settings.CONTRACT_ADDRESS); c.register_model(settings.STAGE2_MODEL_ID, settings.STAGE2_MODEL_VERSION, calculate_sha256(settings.STAGE2_MODEL_PATH), settings.STAGE2_ALGORITHM)"
   ```
   *Action:* Calculates the SHA-256 digest of `ml/artifacts/attack_classifier.joblib` and registers `iot-ids-attack-classifier` version `v1.0.0` on the active contract.

### Step 6: Start the FastAPI Backend Service

Start the backend REST API server:

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

- **Host & Port:** `http://127.0.0.1:8000`
- **System Health Endpoint:** `http://127.0.0.1:8000/health`
- **Interactive OpenAPI Documentation:** `http://127.0.0.1:8000/docs`
- **Startup State:** By default (`AUTO_VERIFY_ON_STARTUP=false`), models are initialized as `UNVERIFIED` and `UNLOADED`. The backend must be running before the frontend is opened.

Verify backend health in another terminal:

```bash
curl -X GET http://127.0.0.1:8000/health
```

### Step 7: Install and Start the React Frontend Dashboard

In another terminal, navigate to the `frontend/` directory, install frontend packages, and launch Vite:

```bash
cd frontend
npm install
npm run dev
```

- **Operations Console URL:** `http://localhost:5173`
- **Backend Connection:** The frontend connects automatically to `http://127.0.0.1:8000` (configured via `VITE_API_BASE_URL` with fallback to `http://127.0.0.1:8000`, requiring no `.env` file for standard local execution).

---

## 8. First Run & Explicit Model Verification Lifecycle

When you open `http://localhost:5173` in your browser, the application demonstrates an explicit, decoupled model authorization lifecycle:

```text
APPLICATION OPENED / RELOADED
              ↓
  (POST /model/session/reset)
              ↓
   Stage 1: UNVERIFIED / UNLOADED
   Stage 2: UNVERIFIED / UNLOADED
   IDS State: LOCKED
              ↓
Click: [✓ VERIFY AUTHORIZED MODEL]
              ↓
  (POST /model/verify?target=stage1)
  (SHA-256 hash calculated & compared with ModelRegistry)
              ↓
       VERIFIED / UNLOADED
              ↓
Click: [📥 LOAD MODEL]
              ↓
  (POST /model/load?target=stage1)
  (joblib.load into memory)
              ↓
       LOADED / ACTIVE
              ↓
       IDS UNLOCKED & READY
```

### Security & Architecture Lifecycle Rules
1. **Pre-Load Verification:** Cryptographic verification is enforced before any model artifact is loaded into server memory.
2. **Gated Deserialization:** Verification alone does **not** load the model into memory. Loading is an explicit subsequent action (`📥 LOAD MODEL`) that is permanently locked unless cryptographic verification succeeds.
3. **Application Reload Reset:** Refreshing or reloading the browser resets the authorization memory state via `POST /model/session/reset` to `UNVERIFIED / UNLOADED`, requiring the evaluator to repeat the explicit security gate.
4. **SPA Navigation Persistence:** Navigating between tabs within the single-page application (e.g. from Security Solution to Intrusion Detection Workbench) maintains the loaded model in memory without requiring re-verification.

---

## 9. Normal User Workflow: Intrusion Detection Workbench

Once the model is `LOADED / ACTIVE`, you can perform intrusion detection evaluations:

1. In the frontend navigation header, select **Intrusion Detection Workbench**.
2. **Select Network Flow Record:** Choose an authentic UNSW-NB15 network-flow record from the selector.
   - The UI displays the raw network-flow features: connection duration, protocol (`proto`), service (`service`), state (`state`), source/destination packet counts (`spkts`, `dpkts`), byte rates, and TTL values.
   - Ground-truth attack categories are intentionally hidden prior to classification to reflect realistic IDS operations.
3. **Run Hierarchical Detection:** Click **Analyze Traffic Flow**.
4. **Inspect Hierarchical Output:**
   - **Stage 1 (Binary Classification):** Determines whether the flow is `Normal (Benign)` or `Attack (Malicious)`.
   - **Stage 2 (Multi-Class Classification):** If Stage 1 detects an Attack, the flow is routed to Stage 2 (`iot-ids-attack-classifier`) to determine the specific attack category (e.g., `Exploits`, `DoS`, `Generic`, `Fuzzers`, `Reconnaissance`). If Stage 1 classifies the flow as Normal, Stage 2 is bypassed.
   - **Security Advisory:** Recommends defensive mitigation procedures (e.g., rate-limiting, firewall rule adjustment, port isolation). All recommendations are advisory-only (human-in-the-loop, zero autonomous remediation).
   - **Audit Trail:** An operational audit entry is logged to the local SQLite database recording the event, timestamp, and model hash, without persisting raw network feature payloads.

---

## 10. Model Replacement Security Demonstration

The application contains a built-in **ephemeral model replacement attack simulator** to demonstrate fail-closed integrity gating:

1. In the frontend, navigate to **Security Solution** -> **Tamper-Evident Testing**.
2. Click **Run Model Replacement Simulation** (`POST /demo/model-replacement`).
3. **What the Simulator Does:**
   - Creates a temporary, segregated byte perturbation in an ephemeral copy of the model candidate.
   - **Research Invariant:** The canonical model artifact on disk is **never permanently modified**.
   - Recalculates the candidate's streaming SHA-256 digest.
   - Compares the observed digest with the on-chain registered digest in `ModelRegistry.sol`.
   - Detects the discrepancy and reports status: `HASH_MISMATCH`.
   - Triggers the fail-closed verification gate: model loading is immediately blocked (`MODEL_LOAD_BLOCKED`), downstream IDS inference is locked (`LOCKED`), and an audit event is recorded.
4. Click **Restore Canonical Model** (`POST /demo/model-replacement/reset`):
   - Restores the active candidate pointer to the canonical model artifact.
   - Resets the gate to `UNVERIFIED / UNLOADED`.
   - Re-verifying the model restores the legitimate `VERIFIED` status.

### Scientific Scope of Verification
- **SHA-256:** Performs low-overhead, byte-level digest calculation.
- **ModelRegistry.sol:** Acts as the decentralized, tamper-evident reference for model identity, version, and digest.
- **Verification Gate:** Enforces fail-closed deserialization policy before memory loading.
- *Clarification:* The blockchain does not "detect hackers" or inspect network packets; it provides an immutable reference to detect unauthorized modifications to AI model binaries.

---

## 11. Automated Testing & Verification

The repository maintains an extensive test suite verifying ML pipelines, smart contracts, backend APIs, and frontend user workflows.

### Run All Backend Tests (117 Tests)

The backend test suite executes on an in-process EVM provider (`EthereumTesterProvider`) and does not require Ganache to be running:

```bash
pytest -q
```
*Expected Result:* 117 tests passing across ML pipeline, smart contracts, provenance, fail-closed security gates, hierarchical routing, and simulator endpoints.

### Run Frontend Vitest Component & Workflow Tests (83 Tests)

```bash
npm --prefix frontend run test
```
*Expected Result:* 83 tests passing across 4 test suites (`App.test.jsx`, `analytics.test.js`, `architecture_workflow.test.jsx`, `solution_workflow.test.jsx`).

### Frontend Production Build Verification

```bash
npm --prefix frontend run build
```
*Expected Result:* Production bundle compiled cleanly to `frontend/dist/`.

### Run Comprehensive Research Reproducibility Workflow

To execute the automated end-to-end evidence reproduction script:

```bash
python -m scripts.reproduce_research
```

---

## 12. Troubleshooting Guide

### 1. Ganache / Local Blockchain Connection Refused
- **Symptom:** Backend logs show connection warnings or `BLOCKCHAIN_UNAVAILABLE` when attempting to verify against Ganache.
- **Resolution:** Verify that Ganache is running on `http://127.0.0.1:8545` via `npx ganache --wallet.deterministic`. If Ganache is restarted, you must re-run contract deployment (`python -m blockchain.scripts.deploy`) and registration, as a restarted Ganache chain starts with an empty state.

### 2. Contract Not Deployed / Missing `deployment.json`
- **Symptom:** `GET /model/status` returns `contract_address: null` or verification returns `NOT_REGISTERED`.
- **Resolution:** Execute `python -m blockchain.scripts.deploy` to create `blockchain/deployment/deployment.json`, followed by model registration.

### 3. Stale Backend Daemon Process
- **Symptom:** Endpoints return HTTP 404 or outdated responses after code modifications.
- **Resolution:** If a previous Uvicorn daemon is still running in the background, terminate it:
  - PowerShell: `Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process`
  - Command Prompt: `taskkill /F /IM python.exe`
  - Linux/macOS: `pkill -f uvicorn`
  Then restart FastAPI with `uvicorn backend.main:app --host 127.0.0.1 --port 8000`.

### 4. Port Conflicts (Port 8000 or 5173 In Use)
- **Symptom:** Uvicorn reports `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)`.
- **Resolution:** Either stop the process occupying the port, or specify an alternative port:
  ```powershell
  uvicorn backend.main:app --host 127.0.0.1 --port 8001
  ```
  If changing the backend port, specify `VITE_API_BASE_URL=http://127.0.0.1:8001` when launching the frontend:
  ```powershell
  $env:VITE_API_BASE_URL="http://127.0.0.1:8001"; npm run dev
  ```

### 5. Frontend Cannot Connect to Backend
- **Symptom:** Frontend displays "Cannot connect to backend service at http://127.0.0.1:8000".
- **Resolution:** Verify the FastAPI server is running by opening `http://127.0.0.1:8000/health` in your browser. Ensure the backend is started before using the frontend.

---

## 13. Research Integrity & Scientific Disclaimers

1. **Local Evaluation Environment:** All smart contract deployments and latency benchmarks were evaluated in local Ethereum test environments (`EthereumTesterProvider` and local Ganache CLI). Gas consumption, confirmation times, and transaction costs will vary on public testnets or mainnets.
2. **Decoupled Per-Flow Latency:** Model verification occurs at deployment or system startup. Per-flow inference runs strictly off-chain with zero per-prediction blockchain read or write transactions.
3. **Integrity vs. Accuracy:** A cryptographically verified model artifact proves solely that the binary has not been altered since on-chain registration. It does not certify absence of adversarial vulnerabilities, bias, or training set manipulation.
4. **Advisory Security Guidance:** All mitigation recommendations produced by the security advisory engine are advisory suggestions for human network operators; the system intentionally avoids autonomous network reconfiguration or remediation.
