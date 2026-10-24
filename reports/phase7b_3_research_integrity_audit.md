# Phase 7B.3 — Research-Integrity Audit Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.3 — Controlled Hierarchical Stage 1 → Stage 2 IDS Integration  
**Date:** October 2026  
**Audit Status:** PASSED (All 8 Criteria Formally Verified)  

---

## Audit Overview

This research-integrity audit rigorously verifies that Phase 7B.3 adheres to the highest academic standards of reproducibility, empirical honesty, boundary enforcement, and statistical claims integrity.

---

## 1. Data Integrity Audit

| Verification Item | Target Standard | Measured Empirical Finding | Status |
| :--- | :--- | :--- | :--- |
| **Authentic UNSW-NB15 Training Set** | SHA-256 = `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | Recomputed SHA-256 = `734fe664...a559` ($N=82,332$) | **PASSED** |
| **Authentic UNSW-NB15 Testing Set** | SHA-256 = `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | Recomputed SHA-256 = `bec7dd5e...48fa` ($N=175,341$) | **PASSED** |
| **No Synthetic Traffic Replacement** | Zero fabricated or perturbed packet flows | Evaluated exclusively on authentic benchmark CSV files | **PASSED** |
| **No Test-Set Modification** | Test partition remains strictly unaltered on disk | Byte-level SHA-256 identical to authoritative baseline | **PASSED** |

---

## 2. Model Integrity Audit

| Verification Item | Target Standard | Measured Empirical Finding | Status |
| :--- | :--- | :--- | :--- |
| **Stage 1 Binary Model Artifact** | SHA-256 = `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | Recomputed SHA-256 = `dc5e1688...e7c5` on disk | **PASSED** |
| **Stage 2 Multiclass Model Artifact** | SHA-256 = `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | Recomputed SHA-256 = `596b98ce...3208` on disk | **PASSED** |
| **Zero Model Retraining** | Neither model retrained or re-serialized | Existing serialized pipelines loaded without re-fitting | **PASSED** |
| **Artifact Immutability** | No parameter alteration or weight adjustments | Both pipelines executed strictly in read-only mode | **PASSED** |

---

## 3. Data Leakage and Routing Isolation Audit

| Verification Item | Target Standard | Measured Empirical Finding | Status |
| :--- | :--- | :--- | :--- |
| **Target Separation from Inputs** | Columns `id`, `label`, `attack_cat` omitted from feature space | Programmatically verified: dropped before model prediction (`assert col not in X.columns`) | **PASSED** |
| **No Ground-Truth Routing in H1** | Stage 2 invocation in H1 must not use `label` or `attack_cat` | Routing decision is $\hat{y}_1 == 1$, purely derived from Stage 1 output | **PASSED** |
| **No Test-Set Fit Contamination** | Preprocessing transformers must not fit on test set | Pipelines use existing serialized transformers from training phase | **PASSED** |
| **Oracle Routing Scoping** | H2 must be explicitly marked as non-deployable diagnostic | H2 labeled: *"Oracle-routed diagnostic reference; not deployable inference behavior"* | **PASSED** |

---

## 4. Hierarchical Validity Audit

| Verification Item | Target Standard | Measured Empirical Finding | Status |
| :--- | :--- | :--- | :--- |
| **Routing Determinism** | Stage 2 routed flows must equal Stage 1 predicted attack flows | $\text{Stage 2 Routed} (104,893) \equiv \text{Stage 1 Pred Attack} (104,893)$ | **PASSED** |
| **Stage 2 Admission Gate** | Benign Stage 1 predictions must bypass Stage 2 | Verified: 70,448 flows bypassed Stage 2 and received `"Normal"` | **PASSED** |
| **Sample Reconciliation** | All 175,341 flows accounted for with zero double-counting | True Benign (56,000) + True Attack (119,341) = 175,341 | **PASSED** |
| **False Negative Attribution** | 15,730 true attacks missed by Stage 1 accurately tracked | Verified: 13,520 Fuzzers, 984 Exploits, 532 Analysis, 276 Recon, 205 DoS, 159 Shellcode, 41 Generic, 10 Backdoor, 3 Worms | **PASSED** |

---

## 5. Statistical and Comparative Claims Audit

| Verification Item | Target Standard | Finding in Reports and Documentation | Status |
| :--- | :--- | :--- | :--- |
| **Binary Metric Distinction** | Clarify that H1 binary metric identity to Stage 1 is structural | Explicitly documented: *"By construction, the binary decision boundary is governed by Stage 1"* | **PASSED** |
| **No False Superiority Claims** | Do not claim hierarchy improves classification accuracy | Acknowledged: Hierarchical Macro F1 (50.64%–51.43%) is lower than Stage 2 Oracle (53.06%) | **PASSED** |
| **No Unsupported Guarantees** | Avoid "real-time", "wire-speed", "zero-latency", "guaranteed sub-50ms" | Mean measured latency (32.06 ms) reported strictly as empirical CPU benchmark | **PASSED** |
| **Statistical Significance** | No significance claims without formal statistical testing | Avoided unverified p-value or confidence assertions for hierarchical composition | **PASSED** |

---

## 6. Minority Class Treatment Audit

| Attack Class | True Test Support | Stage 1 Routing Rate | Stage 2 Recall (Routed) | End-to-End Recall | Integrity Audit Finding |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Analysis** | 2,000 | 73.40% | 4.02% | **2.95%** | Severe minority class deficit explicitly highlighted; only 59 instances detected. |
| **Backdoor** | 1,746 | 99.43% | 11.64% | **11.57%** | Extreme category confusion with DoS/Exploits documented honestly. |
| **Shellcode** | 1,133 | 85.97% | 73.82% | **63.46%** | Accurately reported as resilient minority class due to packet-size features. |
| **Worms** | 130 | 97.69% | 15.75% | **15.38%** | Severe training limitation ($N=130$) and low detection rate (20 instances) acknowledged. |

**Audit Conclusion:** Poor minority-class performance is completely transparent and prominently featured in reports, figures, and JSON exports. Zero attempt was made to hide or smooth over minority-class limitations.

---

## 7. Blockchain Architectural Audit

| Verification Item | Target Standard | Measured Empirical Finding | Status |
| :--- | :--- | :--- | :--- |
| **Per-Flow Blockchain Overhead** | Per-flow blockchain calls = 0 | Verified: `hierarchical_ids.per_flow_blockchain_calls == 0` | **PASSED** |
| **Architectural Separation** | Blockchain operates as pre-load gate, not per-packet filter | Verified: Contract authenticates model artifacts once during startup | **PASSED** |
| **No Universal Blockchain Claims** | Do not claim "zero blockchain interaction" globally | Accurately stated: *"The evaluated per-flow hierarchical inference path performed no blockchain registry lookup"* | **PASSED** |
| **Local Environment Scoping** | EVM benchmarks scoped to local Ethereum test environment | Scoped strictly to local Hardhat/Anvil EVM test execution | **PASSED** |

---

## 8. Security and Remediation Boundary Audit

| Verification Item | Target Standard | Finding in Reports and Documentation | Status |
| :--- | :--- | :--- | :--- |
| **No Automated Remediation** | Zero active defense actions (firewall, iptables, packet drop, host quarantine) | Confirmed: Pipeline outputs pure predictive classifications; zero defensive intervention | **PASSED** |
| **No Universal Security Claims** | Do not claim complete attack prevention or zero-day immunity | Explicitly documented under Limitations: Provenance verifies artifact integrity, not zero-day safety | **PASSED** |
| **No Autonomous System Claims** | Do not claim "production-ready", "fully autonomous", or "foolproof" | Scoped strictly as an experimental academic research evaluation | **PASSED** |

---

## Audit Sign-Off

The Phase 7B.3 implementation and documentation satisfy all eight research-integrity criteria with zero violations.
