# Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection

**Final-Year B.Tech Research Project**  
**Core Focus:** Trusted AI Model Provenance, Cryptographic Integrity Verification, and Tamper-Evident Auditing for Machine Learning-Based IoT Network Intrusion Detection Systems.

---

## 1. Project Philosophy & Core Distinction

A conventional ML-based intrusion-detection system answers:
> *"Is this network traffic normal or malicious?"*

However, in critical zero-trust IoT infrastructure, a second security question arises:
> *"Can we trust the AI model that is making this prediction?"*

This project rigorously decouples these responsibilities:
1. **Machine Learning Component:** Performs high-speed IoT network traffic intrusion classification (Benign vs. Attack). Blockchain does **not** perform network traffic classification.
2. **Blockchain Component (Phases 4–6):** Maintains immutable model provenance, cryptographic hashes (SHA-256), and security audit trails. The heavy model weights and raw IoT traffic are stored **off-chain**; only cryptographic proofs and metadata are anchored on-chain.

> [!NOTE]
> *Blockchain-based registration and verification will be implemented in a subsequent phase.* The present phase establishes the cryptographic model-provenance foundation.

---

## 2. Model Provenance & Cryptographic Integrity

### Why the AI Model is a Security-Sensitive Asset
In an IoT environment, an intrusion detection system (IDS) acts as the first line of defense against botnets, denial-of-service (DoS), and unauthorized reconnaissance. If an adversary gains access to the host file system or edge gateway, they can subtly alter model decision boundaries, inject backdoors (trojans), or replace the model with a degraded version that systematically whitelists malicious traffic. Therefore, the serialized AI model artifact (`ids_model.joblib`) must be treated as a mission-critical asset requiring cryptographic integrity verification prior to deployment and execution.

### Cryptographic Foundation: SHA-256
We use standard SHA-256 (Secure Hash Algorithm 256-bit) to compute deterministic digital fingerprints of the model artifact file bytes:
- **Low Memory Streaming:** Computes the hash over 64 KB buffers, ensuring efficient calculation regardless of file size.
- **Preimage & Collision Resistance:** Computationally infeasible to craft a malicious or mutated model file that matches an authorized 64-character hexadecimal digest.
- **Strict Byte-Level Representation:** The hash reflects the exact binary bytes of the serialized artifact on disk, rather than in-memory object state or arbitrary filename metadata.

### Logical Model Version vs. Cryptographic Model Hash
- **Model ID (`iot-ids-rf`):** Stable logical identifier representing the functional purpose of the model within the IoT security infrastructure.
- **Model Version (`v1.0.0`):** Semantic release version indicating human-managed iterations, feature updates, or retraining cycles.
- **Model SHA-256 Hash (`dc5e16889ea247...`):** Exact cryptographic digest of the compiled binary artifact. Any modification to weights, preprocessing pipelines, or tree thresholds changes this digest completely, regardless of whether the version string remains the same.

### Why the Model Artifact is Kept Off-Chain
Deploying serialized machine learning artifacts (e.g., 6.3 MB `ids_model.joblib`) directly onto an on-chain smart contract is prohibitively expensive, creates storage bloat, and introduces severe transaction latency. Consistent with modern decentralized systems literature (e.g., *BASIS Schema, Kaushik et al., Springer 2026*), the architecture employs a **hybrid on-chain/off-chain model**:
- Heavy binary model files and network traffic datasets remain **off-chain** at the local edge node or artifact repository.
- Lightweight cryptographic commitments (the 32-byte SHA-256 hash, model ID, version, and training timestamp) are anchored for provenance.

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
│   ├── hashing.py                       # Streaming SHA-256 calculation and hex digest validation
│   └── provenance.py                    # Provenance record schema and verify_model_integrity gatekeeper
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
│   ├── tampering_experiment.py          # Reproducible binary model tampering verification experiment
│   └── results/
│       └── model_integrity_results.json # Machine-readable experimental records
├── tests/
│   ├── test_ml_pipeline.py              # ML pipeline tests (8 tests)
│   └── test_provenance.py               # Provenance & cryptographic integrity tests (10 tests)
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

### Run All Automated Unit Tests (18 Tests)
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

### Run Sample Inference on Unseen Packets
```bash
python -m ml.predict
```

### Run the Reproducible Tampering Detection Experiment
```bash
python -m experiments.tampering_experiment
```
