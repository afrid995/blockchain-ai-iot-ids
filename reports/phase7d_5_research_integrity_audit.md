# Phase 7D.5 — Research-Integrity Audit

## 1. Scope and Boundary Declaration

This audit provides a formal verification of scientific and research integrity for the changes enacted during **Phase 7D.5: Explicit Model Verification and Load Lifecycle**.

> **Authoritative Research Integrity Statement:**  
> The change modifies model lifecycle orchestration and frontend state presentation only. It does not modify the trained model artifacts, dataset, model parameters, registered hashes, smart contract implementation, or prediction architecture.

---

## 2. Model Artifact Integrity Verification

The binary model artifacts stored on disk were independently verified via cryptographic SHA-256 calculation. No retraining, modification, or weight perturbation was performed.

| Artifact Role | File Path | Authoritative SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| **Stage 1 (Binary IDS)** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **MATCH** |
| **Stage 2 (Category Classifier)** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **MATCH** |

---

## 3. Dataset Integrity Verification

The UNSW-NB15 training and testing datasets utilized across evaluation phases remain bit-for-bit identical to the authoritative baselines.

| Dataset Asset | Authoritative SHA-256 Digest | Status |
| :--- | :--- | :--- |
| **Training Dataset** | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **VERIFIED** |
| **Testing Dataset** | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **VERIFIED** |

---

## 4. Smart Contract & Blockchain Deployment Verification

The `ModelRegistry.sol` smart contract implementation and its on-chain deployment records were preserved without alteration.

- **Contract Source:** `contracts/ModelRegistry.sol` (unmodified)
- **Deployed Contract Address:** `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`
- **Registrant Address:** `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
- **Registered Model Records:**
  - `iot-ids-rf:v1.0.0` $\rightarrow$ `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
  - `iot-ids-attack-classifier:v1.0.0` $\rightarrow$ `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`

No redeployment or on-chain transaction was fabricated.

---

## 5. Architectural Invariance Verification

1. **Prediction Architecture:**
   - Stage 1 continues to execute binary Random Forest classification (Normal vs. Attack).
   - Stage 2 continues to execute multi-class Random Forest classification on detected attacks.
   - Deterministic Advisory Recommendation continues to map Stage 1 & Stage 2 outputs to human-in-the-loop advisories.
2. **Inference Latency Profile:**
   - 0 per-flow blockchain lookups are incurred during inference.
   - Verification occurs strictly out-of-band at the operational boundary prior to memory loading.
3. **Fail-Closed Security Invariance:**
   - Calling `/predict` or `/predict/hierarchical` before verification or loading strictly returns HTTP 503 Service Unavailable.
   - Calling `/model/load` before verification returns HTTP 400 Bad Request.
   - Tampered artifacts (`HASH_MISMATCH`) and unregistered versions (`NOT_REGISTERED`) cannot be loaded.

---

## 6. Audit Conclusion

All technical modifications in Phase 7D.5 are purely operational and orchestrational. The underlying empirical models, data distributions, smart contract mechanics, and research findings remain completely invariant and verifiable.
