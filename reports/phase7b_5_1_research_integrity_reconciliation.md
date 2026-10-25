# Phase 7B.5.1 — Research-Integrity Reconciliation Before Final Integration

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.5.1 — Research-Integrity Reconciliation Before Final Integration  
**Date:** October 2026  
**Starting Checkpoint:** `9f2fb119535788a49ea990c6e2129afb1e91df4f`  
**Status:** COMPLETE & VERIFIED  

---

## 1. Starting Checkpoint

The starting commit for this documentation-only reconciliation phase is:
`9f2fb119535788a49ea990c6e2129afb1e91df4f`

Prior to editing, git branch state and remote synchronization were verified against `origin/master`:
- Working tree was verified clean.
- All pre-existing test suites passed without regression (pytest 82 tests, vitest 26 tests, vite production build).
- Cryptographic digests of Stage 1 (`dc5e1688...e7c5`), Stage 2 (`596b98ce...3208`), training dataset (`734fe664...a559`), and testing dataset (`bec7dd5e...48fa`) were verified unaltered.

---

## 2. Issue 1 — Incorrect Model A Historical Metrics

### 2.1 Description of Discrepancy
In `reports/phase7b_5_design_review.md` (Section 3), erroneous metrics were inadvertently cited for Model A (Standard Random Forest) under the multiclass Stage 2 classifier selection summary:
- Erroneously cited: Macro F1 = 44.59%, Balanced Accuracy = 44.75%, Accuracy = 79.99%.

These figures did not reflect the authoritative empirical measurements established during the Phase 7B experiment (`experiments/train_attack_classifier.py`) and recorded in `reports/phase7b_multiclass_classifier_report.md`.

### 2.2 Correct Authoritative Metrics
The authoritative Phase 7B experimental results across $N = 119,341$ attack flows are:

#### Model A — Standard Random Forest
- **Accuracy:** 77.60%
- **Balanced Accuracy:** 51.04%
- **Macro Precision:** 70.31%
- **Macro Recall:** 51.04%
- **Macro F1-Score:** 52.27%
- **Weighted F1-Score:** 77.63%

#### Model B — Balanced Random Forest (Selected Canonical Artifact)
- **Accuracy:** 76.18%
- **Balanced Accuracy:** 53.41%
- **Macro Precision:** 57.60%
- **Macro Recall:** 53.41%
- **Macro F1-Score:** 53.06%
- **Weighted F1-Score:** 77.50%

Model B remains the selected, canonical, and blockchain-registered Stage 2 classifier due to its superior minority-class sensitivity under extreme class imbalance (428.89:1 Generic-to-Worms imbalance). Model B was not retrained, regenerated, or replaced.

### 2.3 Reconciliation Action Taken
All occurrences of `44.59%`, `44.75%`, and `79.99%` were removed from `reports/phase7b_5_design_review.md` and replaced with the authoritative Model A values (Accuracy = 77.60%, Balanced Accuracy = 51.04%, Macro Precision = 70.31%, Macro Recall = 51.04%, Macro F1 = 52.27%, Weighted F1 = 77.63%).

---

## 3. Issue 2 — Unsupported / Ambiguous Historical EVM Latency Wording

### 3.1 Description of Discrepancy
In `reports/phase7b_5_design_review.md` (Section 3 and Section 12), text asserted:
- *"Pre-load blockchain verification latency (~80–90 ms on local EVM)"*
- *"Querying an Ethereum smart contract per flow would introduce prohibitive network latency (~80–90 ms even on local EVM, seconds on public chains)"*

Presenting `~80–90 ms` as a generalized historical EVM benchmark is scientifically indefensible because EVM execution timings across previous phases varied depending on specific operation types (contract deployment vs. registry read vs. model verification), batch sizes, and local execution environments (in-memory `EthereumTesterProvider` backed by `py-evm`).

### 3.2 Corrected Latency Methodology
The documentation was amended to state clearly:
> "Pre-load blockchain-backed verification is performed in the local EthereumTesterProvider/py-evm evaluation environment. Its latency is environment- and operation-specific and will be freshly measured as part of the Phase 7B.5 implementation evaluation."

In Section 12, the speculative latency claim `(~80–90 ms even on local EVM, seconds on public chains)` was replaced with an accurate architectural description:
> "Querying an Ethereum smart contract per flow would introduce prohibitive consensus and RPC latency (inherent to on-chain operations) alongside unsustainable transaction gas costs."

No single historical latency measurement is claimed to represent public Ethereum, production networks, or general blockchain performance.

---

## 4. Blockchain Architectural and Boundary Wording Correction

### 4.1 Description of Discrepancy
In `reports/phase7b_5_research_integrity_audit.md` (Section 1), the text used broad causal wording:
- *"the design prevents blockchain network latency from contaminating per-flow inference"*

### 4.2 Narrowed Empirically Testable Statement
In accordance with research-integrity standards, broad causal language was replaced with the strictly testable architectural formulation:
> "The evaluated architecture places blockchain registry verification outside the per-flow inference path; Phase 7B.5 will instrument the runtime path to confirm zero per-flow blockchain registry lookups while retaining tamper-evidence against unauthorized artifact modification."

The project strictly disclaims:
- Zero runtime overhead;
- Zero latency overhead;
- Zero computational overhead;
- High throughput or real-time guarantees;
- Public mainnet performance extrapolations.

The per-flow inference path performs exactly $0$ blockchain registry lookups; this is an architectural constraint that will be verified empirically through runtime instrumentation.

---

## 5. Scope Confirmation: Invariants Preserved

1. **No Code Implementation:** Zero Python endpoints, routes, middleware, or scripts were added or modified. Neither `/predict` nor `/predict/hierarchical` was implemented or altered.
2. **No Model Retraining or Modification:**
   - Stage 1 model (`ml/artifacts/ids_model.joblib`) SHA-256 remains:  
     `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
   - Stage 2 model (`ml/artifacts/attack_classifier.joblib`) SHA-256 remains:  
     `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
3. **No Dataset Alteration:**
   - `data/raw/UNSW_NB15_training-set.csv` SHA-256: `734fe664...a559` (VERIFIED)
   - `data/raw/UNSW_NB15_testing-set.csv` SHA-256: `bec7dd5e...48fa` (VERIFIED)
4. **No Smart Contract Changes:** `ModelRegistry.sol` remains unchanged. No new on-chain registrations or contract redeployments occurred.
5. **No Automated Remediation:** The response recommendation layer remains strictly advisory (`is_advisory = True`, `requires_human_approval = True`, `automated_remediation_enabled = False`).
6. **Implementation Status:** Phase 7B.5 implementation has **NOT** been started.

---

## 6. Self-Reference Convention

In accordance with project research-integrity standards, this reconciliation report records the authoritative starting checkpoint (`9f2fb119535788a49ea990c6e2129afb1e91df4f`). The final Git commit hash is omitted from this file and will be reported externally in the completion response following remote synchronization.

---

## 7. Final Research-Integrity Status

**STATUS: RECONCILED & APPROVED (PASS)**

All historical metrics in Phase 7B.5 design documentation now accurately match authoritative Phase 7B empirical measurements. Latency claims and architectural boundaries are appropriately scoped, and the repository is completely prepared for authorized Phase 7B.5 implementation.
