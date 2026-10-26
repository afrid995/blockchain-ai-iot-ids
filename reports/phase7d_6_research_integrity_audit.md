# Phase 7D.6 — Research-Integrity Audit

## 1. Authoritative Declaration

This document constitutes the formal research-integrity audit for **Phase 7D.6: Reset Model Authorization on Frontend Application Reload**.

> **Authoritative Statement:**  
> This phase modifies only model authorization-session lifecycle orchestration. It does not modify trained model artifacts, datasets, model parameters, registered hashes, smart contract implementation, or the prediction architecture.

---

## 2. Invariance Verification

### 2.1 Machine Learning Binaries
The model files on disk were verified using direct SHA-256 computation:
- **Stage 1 Binary IDS:** `ml/artifacts/ids_model.joblib`  
  Observed SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` (**MATCH**)
- **Stage 2 Multiclass Classifier:** `ml/artifacts/attack_classifier.joblib`  
  Observed SHA-256: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` (**MATCH**)

No model retraining, hyperparameter alteration, or artifact re-serialization was conducted.

### 2.2 Datasets
The training and evaluation sets for UNSW-NB15 remain identical to the authoritative evaluation baselines:
- **Training Dataset SHA-256:** `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` (**VERIFIED**)
- **Testing Dataset SHA-256:** `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` (**VERIFIED**)

### 2.3 Smart Contract & Blockchain Ledger
- **Smart Contract Code:** `contracts/ModelRegistry.sol` (invariant)
- **Deployment Address:** `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec` (invariant)
- **Registrant Address:** `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` (invariant)
- No new contract deployment or on-chain transaction was executed.

### 2.4 Downstream Inference Pipeline
- Off-chain hierarchical inference architecture remains intact.
- Out-of-band verification gate isolation is maintained with `0` per-flow blockchain lookups.
- Deterministic response advisory recommendations remain strictly invariant.

---

## 3. Session Reset Characterization

The `POST /model/session/reset` endpoint is an in-memory lifecycle reset:
1. It unloads deserialized pipelines from Python process memory (`model_pipeline = None`).
2. It resets the verification status to `UNVERIFIED` (`is_loaded = False`).
3. It does not delete or modify artifact files on disk.
4. It does not interact with the Ethereum EVM node.
5. It ensures browser reloads do not inherit prior session authorization states.

---

## 4. Conclusion

All modifications strictly govern control-plane session boundaries. The empirical validity, cryptographic guarantees, and detection accuracy of the research system remain fully intact and authenticated.
