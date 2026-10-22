# Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

**Final-Year B.Tech Research Project**  
**Core Focus:** Trusted AI Model Provenance, Cryptographic Integrity Verification, and Tamper-Evident Auditing for Machine Learning-Based IoT Network Intrusion Detection Systems.

---

## 1. Project Philosophy & Architecture

A conventional ML-based intrusion-detection system answers:
> *"Is this network traffic normal or malicious?"*

However, in critical zero-trust IoT infrastructure, a second fundamental security question arises:
> *"Can we trust the AI model that is making this prediction?"*

This project rigorously decouples these responsibilities:

```
[IoT Network Traffic]
        │
        ▼
┌───────────────────────────────┐
│     ML Intrusion Detector     │ ──> Benign vs. Malicious Prediction
│  (Random Forest / UNSW-NB15)  │     (High-Speed Off-Chain Inference)
└───────────────────────────────┘
        ▲
        │ Pre-Deployment Integrity Gate
┌───────────────────────────────┐
│     Model Artifact File       │ ──> SHA-256 Digest (64 hex / bytes32)
│     (ids_model.joblib)        │
└───────────────────────────────┘
        │
        ▼ Cryptographic Comparison (LOCAL_HASH == REGISTERED_HASH)
┌───────────────────────────────┐
│  Blockchain Provenance Layer  │ ──> Immutable Root of Trust
│      (ModelRegistry.sol)      │     (On-Chain bytes32 Hash, Version, Timestamp)
└───────────────────────────────┘
```

> [!IMPORTANT]
> **Separation of Concerns:**  
> The blockchain stores model provenance and cryptographic references; it does **not** store the model artifact or perform intrusion detection.  
> 
> **Scientific Scope & Limitations:**  
> A successful hash comparison establishes artifact integrity relative to the registered reference. It does **not** prove that the model is accurate, unbiased, adversarially robust, or free from all security vulnerabilities.

---

## 2. On-Chain vs. Off-Chain Data Model

Consistent with modern decentralized systems literature (e.g., *BASIS Schema, Kaushik et al., Springer 2026*), the architecture employs a hybrid on-chain/off-chain model:
- **Off-Chain:** Heavy binary model files (`ids_model.joblib`, 6.3 MB) and raw network traffic datasets (`UNSW-NB15`, ~47 MB) remain strictly off-chain at the local edge node.
- **On-Chain (`ModelRegistry.sol`):** Anchors only lightweight, fixed-size 32-byte cryptographic digests (`bytes32 modelHash`), release version, algorithm label, registrant address, and block timestamp.

---

## 3. Directory Layout

```
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
├── requirements.txt                     # Pinned project dependencies
├── pytest.ini                           # Test configuration
└── README.md                            # Documentation and replication instructions
```

---

## 4. Replication & Execution

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
