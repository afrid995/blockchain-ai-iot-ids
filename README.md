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
│      ML Intrusion Detector      │ ──> Benign vs. Malicious Classification
│   (Random Forest / UNSW-NB15)   │     (Off-Chain ML Inference)
└─────────────────────────────────┘
                 ▲
                 │ Pre-Deployment Cryptographic Verification
┌─────────────────────────────────┐
│      Model Artifact File        │ ──> Streaming SHA-256 Digest (bytes32)
│      (ids_model.joblib)         │
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
> The blockchain stores model provenance and cryptographic references; it does **not** store the model artifact or perform intrusion detection.  
> 
> **Architectural Separation vs. Latency:**  
> The blockchain verification operation is architecturally separated from steady-state ML inference and is not invoked for every network-flow prediction in the current design.  
> 
> **Environmental Qualification:**  
> The measured blockchain read latency reflects the local `EthereumTesterProvider`/`py-evm` experimental environment and should not be interpreted as representative of public or production blockchain networks.  
> 
> **Benchmark Dataset Context:**  
> UNSW-NB15 is used as a network intrusion-detection benchmark for the ML component; the current experiment does not by itself establish deployment performance on a physical IoT network.  
> 
> **Verification Semantics:**  
> A successful hash comparison establishes artifact integrity relative to the registered reference. It does **not** prove that the model is accurate, unbiased, adversarially robust, or free from data poisoning. The blockchain-backed registry provides a trusted reference for registered model hashes within the experimental architecture.

---

## 2. On-Chain vs. Off-Chain Data Model

Consistent with decentralized systems literature (e.g., *BASIS Schema, Kaushik et al., Springer 2026*), the architecture maintains a strict on-chain/off-chain boundary:
- **Off-Chain:** Heavy binary model files (`ids_model.joblib`, 6.3 MB) and raw network traffic benchmark datasets (`UNSW-NB15`, ~47 MB) remain strictly off-chain at the local system node.
- **On-Chain (`ModelRegistry.sol`):** Anchors only lightweight, fixed-size 32-byte cryptographic digests (`bytes32 modelHash`), release version, algorithm label, registrant address, and block timestamp.

---

## 3. Implementation Status

### Completed Components (Phases 1–3)
- **ML Intrusion Detection Baseline:** Random Forest trained on authentic UNSW-NB15 (90.30% accuracy, 98.78% precision, 86.82% recall, 2.29% FPR on untouched test partition).
- **Cryptographic Model Hashing:** Low-memory streaming SHA-256 calculator operating over 64 KB binary buffers.
- **Model Provenance Schema:** Structured JSON provenance records linking model ID, version, dataset hash, training hyperparameters, and metrics.
- **Blockchain Model Registry:** Solidity 0.8.20 smart contract (`ModelRegistry.sol`) with unique `model_id + version` keys, duplicate registration rejection, and access control.
- **Blockchain-Backed Model Integrity Verification:** Client engine validating local artifact hashes against on-chain records.
- **Reproducible Experiments:**
  - Legitimate model verification (`VERIFIED`).
  - Binary tampering experiment using an isolated temporary copy (`HASH_MISMATCH`).
  - Unregistered model query (`NOT_REGISTERED`).
  - Blockchain overhead benchmarking (write latency, gas, read latency statistics over $N=30$ trials).
- **Automated Test Suite:** 30 unit and integration tests passing.

### Planned Components (Future Phases — Not Yet Implemented)
- FastAPI backend application service.
- Security-event and audit logging API.
- React-based dashboard.
- Production/testnet blockchain deployment (e.g., Sepolia or private consortium chain).
- Evaluation on physical IoT hardware.

---

## 4. Performance & Overhead Benchmarks

All metrics reflect actual measurements from the local `EthereumTesterProvider` environment:

- **Model Registration Write Latency:** `0.0714` seconds (~71.4 ms)
- **Model Registration Gas Consumed:** `214,023` gas
- **On-Chain Hash Read Latency ($N=30$ samples):**
  - Mean: `7.2058 ms`
  - Median: `7.2653 ms`
  - Min: `6.3054 ms`
  - Max: `7.9071 ms`
  - Standard Deviation: `0.4148 ms`

> [!NOTE]
> The measured blockchain hash-read latency was approximately 7.2 ms in the local `EthereumTesterProvider`/`py-evm` environment. In the current architecture, model verification is performed at model loading/deployment or an explicit verification boundary rather than for every network-flow inference request. Therefore, the blockchain lookup is not part of the steady-state per-flow inference path. This is an architectural separation and not an experimental claim of zero end-to-end latency overhead.

---

## 5. Directory Layout

```text
major_project/
├── data/
│   ├── raw/
│   │   ├── UNSW_NB15_training-set.csv   # 82,332 records (SHA-256: 734fe6642edf...)
│   │   └── UNSW_NB15_testing-set.csv    # 175,341 records (SHA-256: bec7dd5ec88d...)
│   └── processed/
├── core/
│   ├── __init__.py
│   ├── hashing.py                       # Streaming SHA-256 digest calculation
│   ├── provenance.py                    # Structured provenance records & local verifier
│   └── blockchain.py                    # Web3 client, bytes32 conversion, and EVM verifier
├── blockchain/
│   ├── contracts/
│   │   └── ModelRegistry.sol            # Solidity 0.8.20 provenance registry contract
│   ├── artifacts/
│   │   └── ModelRegistry.json           # Compiled ABI and Bytecode
│   ├── deployment/
│   │   └── deployment.json              # Local EVM deployment receipt & contract address
│   ├── scripts/
│   │   ├── compile.py                   # Solcx compilation runner
│   │   ├── deploy.py                    # Contract deployment script
│   │   └── register_model.py            # On-chain model registration script
│   └── README.md                        # Blockchain layer architecture notes
├── ml/
│   ├── __init__.py
│   ├── dataset.py                       # Dataset loader, downloader, inspection, and SHA-256 hashing
│   ├── preprocess.py                    # Leak-free ColumnTransformer and Pipeline builder
│   ├── train.py                         # Training runner, artifact serializer, and metadata generator
│   ├── evaluate.py                      # Academic metrics evaluation (Acc, Rec, Prec, F1, FPR, ROC-AUC)
│   ├── predict.py                       # Inference wrapper with feature schema validation and integrity gating
│   └── artifacts/
│       ├── ids_model.joblib             # Serialized trained model pipeline (6.3 MB)
│       ├── model_metadata.json          # Scientific metadata with cryptographic digests
│       └── provenance_record.json       # Standardized provenance record
├── experiments/
│   ├── tampering_experiment.py          # Local binary tampering simulation
│   ├── blockchain_provenance_experiment.py # Blockchain provenance & latency benchmarking
│   └── results/
│       ├── model_integrity_results.json    # Local tampering experimental records
│       └── blockchain_provenance_results.json # On-chain verification & latency records
├── tests/
│   ├── test_ml_pipeline.py              # ML pipeline tests (8 tests)
│   ├── test_provenance.py               # Provenance & local cryptographic tests (10 tests)
│   └── test_blockchain.py               # Smart contract & Web3 integration tests (12 tests)
├── reports/                             # Formal research integrity and audit reports
├── requirements.txt                     # Pinned project dependencies
├── pytest.ini                           # Test configuration
└── README.md                            # Documentation and replication instructions
```

---

## 6. Replication & Execution

### Environment Setup
```bash
pip install -r requirements.txt
```

### Run All Automated Unit & Integration Tests (30 Tests)
```bash
python -m pytest tests -v
```

### Inspect the Raw Dataset
```bash
python -m ml.inspect_data
```

### Train and Evaluate Baseline Model
```bash
python -m ml.train
```

### Compile and Deploy Smart Contract
```bash
python -m blockchain.scripts.compile
python -m blockchain.scripts.deploy
```

### Register Phase 2 Model on Blockchain
```bash
python -m blockchain.scripts.register_model
```

### Run Blockchain Provenance & Latency Experiment
```bash
python -m experiments.blockchain_provenance_experiment
```
