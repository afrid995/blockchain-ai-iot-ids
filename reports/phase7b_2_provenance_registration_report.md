# Phase 7B.2: Stage 2 Attack-Type Classifier Provenance Registration and Integrity Verification Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.2 — Register and Verify Selected Attack-Type Classifier  
**Starting Checkpoint:** `353bbad4e18b9f61cecbb4192715fdb89ce58714` (Phase 7B.1 Closed)  
**Self-Reference Rule Notice:** Per project integrity conventions, the final commit SHA for this phase is not embedded within this document and is reported externally upon completion.

---

## 1. Title

**Cryptographic Provenance Registration and Experimental Integrity Auditing for Stage 2 Attack-Type Multiclass Intrusion Detection Model.**

---

## 2. Objective

Phase 7B.2 evaluates whether the selected Stage 2 attack-type classifier (`model_b_balanced_rf`), trained and empirically benchmarked in Phase 7B/7B.1, can be registered as an immutable cryptographic commitment within the existing Solidity `ModelRegistry` smart contract and verified under controlled legitimate, tampered, unregistered, and missing artifact conditions.

---

## 3. Research Question

> Can the selected Stage 2 attack-type classifier be registered as a cryptographically identified model artifact and subsequently pass or fail integrity verification according to its exact registered SHA-256 digest?

This phase evaluates **model provenance, artifact integrity, and verification gatekeeper behavior**, not classification accuracy. It does not evaluate benign/normal traffic separation, does not claim that blockchain improves classifier accuracy, and does not claim that blockchain detects attacks.

---

## 4. Scope and Non-Goals

### In Scope
- Verification of canonical Stage 1 and Stage 2 artifact hashes prior to registration.
- Distinct model identity creation (`iot-ids-attack-classifier:v1.0.0`) to prevent collision with Stage 1 (`iot-ids-rf:v1.0.0`).
- Registration of the 32-byte binary SHA-256 digest in `ModelRegistry.sol`.
- Controlled evaluation of Scenarios E1–E5.
- Empirical measurement of deployment latency, registration gas, and N=30 verification query latencies in the local EVM environment.

### Non-Goals (Explicitly Excluded)
- **No FastAPI Integration**: Stage 2 is NOT integrated into the production `/api/predict` endpoint.
- **No Automated Remediation**: Remediation logic is excluded.
- **No Frontend Dashboard Modifications**: The React frontend is untouched.
- **No Model Retraining**: Neither Stage 1 nor Stage 2 models are retrained.
- **No Solidity Contract Modifications**: The existing `ModelRegistry.sol` contract is reused without modification.
- **No End-to-End Hierarchical IDS Performance Claims**: Stage 2 is tested in isolation.

---

## 5. Stage 2 Model Identity

To ensure collision-free keying within the smart contract mapping `keccak256(abi.encodePacked(modelId, ":", version))`, Stage 2 is assigned a dedicated identity:

- **Stage 1 Binary Baseline**:
  - Model ID: `iot-ids-rf`
  - Version: `v1.0.0`
  - On-Chain Key: `keccak256("iot-ids-rf:v1.0.0")`
- **Stage 2 Multiclass Classifier**:
  - Model ID: `iot-ids-attack-classifier`
  - Version: `v1.0.0`
  - On-Chain Key: `keccak256("iot-ids-attack-classifier:v1.0.0")`
  - Algorithm: `RandomForestClassifier`

---

## 6. Artifact Integrity Pre-Check

Before submitting transactions, both model artifacts were hashed directly from disk using streaming SHA-256:

| Model Stage | Artifact Path | File Size | Measured SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1 (Binary)** | `ml/artifacts/ids_model.joblib` | 6,319,677 bytes | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **VERIFIED (Unchanged)** |
| **Stage 2 (Multiclass)** | `ml/artifacts/attack_classifier.joblib` | 19,376,646 bytes | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **VERIFIED (Canonical)** |

---

## 7. Blockchain Registry Design

The existing `ModelRegistry.sol` contract enforces strict decentralized provenance:
- **Digest Format**: 32 binary bytes (`bytes32`), converted from the 64-character hexadecimal SHA-256 string.
- **Data Boundaries**: Stores only metadata (`modelId`, `version`, `modelHash`, `algorithm`, `registeredAt`, `registrant`). It stores **zero** network flows, zero features, zero weights, zero PII, and zero dataset rows.
- **Immutability**: Re-registration of an existing key reverts with `"ModelRegistry: Model version already registered"`.

---

## 8. Experimental Setup

- **EVM Environment**: `EthereumTesterProvider` (py-evm local execution environment).
- **Contract Address**: `0xF2E246BB76DF876Cef8b38ae84130F4F55De395b`
- **Deployer / Registrant**: `0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf`
- **Deployment Gas Consumed**: $1,244,483$
- **Deployment Latency**: $0.031236$ s
- **Registration Transaction Hash**: `5ed5dff5c08ac95378b6c6673d78213bc0870e4e58726bf9b4f65dc885aa12e1`
- **Registration Block**: 2
- **Registration Gas Consumed**: $214,206$
- **Registration Transaction Latency**: $0.069538$ s

---

## 9. Scenario E1: Legitimate Registered Artifact

- **Target**: `iot-ids-attack-classifier:v1.0.0`
- **Local Artifact Path**: `ml/artifacts/attack_classifier.joblib`
- **Local SHA-256 Digest**: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **On-Chain Registered Digest**: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **Verification Status**: `VERIFIED` (`verified = True`)
- **Read Latency (RPC Call)**: $13.1922$ ms
- **Total Verification Latency (Hashing + On-Chain Query)**: $26.4971$ ms
- **Outcome**: **PASS**. The authentic model successfully satisfies the on-chain gate.

---

## 10. Scenario E2: Tampered Artifact

- **Procedure**: A temporary duplicate of `attack_classifier.joblib` was created in an isolated temporary location. A 50-byte sequence (`b"\x00TAMPERED_BYTE_PAYLOAD_PHASE_7B_2_INTEGRITY_CHECK\x00"`) was appended to the file.
- **Original Size**: $19,376,646$ bytes $\rightarrow$ **Tampered Size**: $19,376,696$ bytes
- **Tampered SHA-256 Digest**: `18341fea70236f462b3b842d201aeb7e8ea2099196edcc169bc421c48a3b5195`
- **On-Chain Registered Digest**: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **Verification Status**: `HASH_MISMATCH` (`verified = False`)
- **Canonical Artifact Protection**: The canonical `ml/artifacts/attack_classifier.joblib` file was re-verified immediately following the test; its SHA-256 remained exactly `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`.
- **Outcome**: **PASS**. Binary tampering was detected deterministically and rejected with fail-closed behavior.

---

## 11. Scenario E3: Unregistered Version

- **Procedure**: The authentic canonical artifact was verified against an unreleased version identifier (`v9.9.9`).
- **Target**: `iot-ids-attack-classifier:v9.9.9`
- **Verification Status**: `NOT_REGISTERED` (`verified = False`)
- **Message**: `Model 'iot-ids-attack-classifier' version 'v9.9.9' is not registered on-chain.`
- **Outcome**: **PASS**. The security gate rejects unapproved versions.

---

## 12. Scenario E4: Missing Artifact

- **Procedure**: Integrity verification was requested for a nonexistent local path (`ml/artifacts/nonexistent_attack_classifier.joblib`).
- **Target**: `iot-ids-attack-classifier:v1.0.0`
- **Verification Status**: `FILE_NOT_FOUND` (`verified = False`)
- **Outcome**: **PASS**. Missing filesystem assets are caught gracefully before submission to the network.

---

## 13. Scenario E5: Wrong Expected Hash

- **Procedure**: The canonical artifact was verified using the pre-load integrity gate against a deliberately incorrect expected hash (`"a" * 64`).
- **Verification Status**: `HASH_MISMATCH` (`verified = False`)
- **Outcome**: **PASS**. The gatekeeper rejects models when expected digests do not align with actual file bytes.

---

## 14. Measured Blockchain and Provenance Overhead

Statistical latency profiling was conducted over $N = 30$ independent verification trials in the local EVM environment:

| Performance Metric | Mean | Median | Min | Max | Std Dev |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Overall Verification Latency (Hash + On-Chain Query)** | 37.19 ms | 37.51 ms | 30.53 ms | 39.88 ms | 1.79 ms |
| **On-Chain Read Latency (Smart Contract Query)** | 21.28 ms | 21.53 ms | 18.40 ms | 24.12 ms | 1.33 ms |

### Architectural Decoupling Note
This verification overhead is incurred strictly at model deployment/initialization time. It is **not** incurred on a per-sample prediction basis, preserving runtime inference speeds for offline prediction.

---

## 15. Security Interpretation

Cryptographic hash verification guarantees that the byte stream of the loaded artifact matches the exact digest registered on the blockchain. 

### What This Proves:
- The local artifact has not suffered bit-level corruption, unauthorized substitution, or post-training payload tampering.
- Only artifacts explicitly registered by the contract owner can achieve `VERIFIED` status.

### What This Does NOT Prove:
- It does **not** prove the model is accurate, robust, or generalizable.
- It does **not** prove the absence of training-data poisoning during model construction.
- It does **not** guarantee prevention of adversarial network-flow perturbations.

---

## 16. Limitations

1. **Local Test Environment**: Latency and gas measurements were recorded using `EthereumTesterProvider` (py-evm); public Ethereum or layer-2 testnets will exhibit different network round-trip latencies and gas fee dynamics.
2. **Offline Isolation**: Stage 2 was evaluated in isolation from the FastAPI prediction service.
3. **No Dynamic Key Rotation**: The contract enforces immutability; key retirement requires deploying new versions.

---

## 17. Reproducibility

The entire experiment is reproducible with deterministic outputs by running:
```bash
python experiments/stage2_provenance_experiment.py
```
Output data is preserved in:
- `ml/artifacts/attack_classifier_provenance_record.json`
- `experiments/results/phase7b_2_provenance_results.json`

---

## 18. Conclusion

The experiment demonstrates that, in the evaluated local environment, the selected Stage 2 classifier (`iot-ids-attack-classifier:v1.0.0`) can be registered using its SHA-256 digest (`596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`) and that the tested legitimate artifact verifies while the tested modified, unregistered, and missing cases are rejected according to the registry and provenance logic.
