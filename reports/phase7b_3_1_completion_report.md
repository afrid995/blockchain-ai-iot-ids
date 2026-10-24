# Phase 7B.3.1 — Completion Report: Research-Integrity Reconciliation

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.3.1 — Research-Integrity Reconciliation for Hierarchical IDS Results  
**Date:** October 2026  
**Starting Checkpoint:** `4807e3e11f4a9d70b0ee7be830c6f9b5e4806e54`  
**Status:** COMPLETE & VERIFIED  

---

## 1. Executive Summary

Phase 7B.3.1 successfully executed a documentation-only research-integrity reconciliation for the Phase 7B.3 hierarchical IDS evaluation. Four specific wording and scoping refinements were implemented across the repository documentation:
1. Replacement of causal claims regarding Shellcode performance with strictly observational statements.
2. Replacement of overbroad claims of model safety and tamper-prevention with accurately scoped statements regarding digest-mismatch detection.
3. Alignment of latency benchmark descriptions to distinguish measured wall-clock execution time from unmeasured computational FLOP/instruction reductions.
4. Correction of the EVM test environment description in the audit report from an external test daemon to the actual in-process `EthereumTesterProvider` backed by `py-evm`.

This reconciliation involved zero code refactoring, zero model retraining, zero dataset modification, and zero alterations to empirical metrics. Phase 7B.4 has **NOT** been started.

---

## 2. Files Changed and Exact Corrections Made

| File Path | Description of Changes |
| :--- | :--- |
| `reports/phase7b_3_hierarchical_ids_evaluation_report.md` | Replaced causal Shellcode claim with observational wording; scoped provenance verification to digest-mismatch detection; updated latency reduction wording from "computation reduction" to "measured mean-latency reduction". |
| `reports/phase7b_3_research_integrity_audit.md` | Replaced causal Shellcode row with observational wording; corrected EVM execution environment description from Hardhat/Anvil to `local EthereumTesterProvider backed by py-evm`. |
| `reports/phase7b_3_completion_report.md` | Updated Shellcode detection summary; aligned latency speedup terminology; scoped zero-day/tampering limitation. |
| `experiments/results/phase7b_3_hierarchical_results.json` | Updated `minority_class_findings.Shellcode.conclusion` to match observational standard. |
| `experiments/hierarchical_ids_evaluation.py` | Updated `minority_class_findings["Shellcode"]["conclusion"]` string to ensure future runs export observational text. |
| `reports/phase7b_3_1_research_integrity_reconciliation.md` | Created dedicated research-integrity reconciliation report documenting all four corrections. |
| `reports/phase7b_3_1_completion_report.md` | Created formal Phase 7B.3.1 completion report. |

---

## 3. Preservation of Empirical Invariants

All empirical metrics established in Phase 7B.3 remain identical:

- **Sample and Routing Counts:**
  - Total test flows: 175,341
  - True benign flows: 56,000 (31.94%)
  - True attack flows: 119,341 (68.06%)
  - Stage 1 predicted benign: 70,448 (40.18%)
  - Stage 1 predicted attack: 104,893 (59.82%)
  - Stage 2 routed flows: 104,893 (exact routing equality verified)
  - True attacks reaching Stage 2: 103,611 (86.82% of true attacks)
  - True attacks missed by Stage 1 (FN): 15,730 (13.18% of true attacks)
  - False-positive benign reaching Stage 2: 1,282 (2.29% of true benign)

- **Configuration H1 (Operational Hierarchical):**
  - Binary Accuracy: 90.30%
  - Binary Precision: 98.78%
  - Binary Recall: 86.82%
  - Binary F1-Score: 92.41%
  - Binary Specificity: 97.71%
  - Binary FPR: 2.29%
  - Operational Stage 2 Macro F1: 51.43% (routed true attacks, $N=103,611$) / 50.64% (all routed flows, $N=104,893$)
  - Operational Stage 2 Balanced Accuracy: 51.20%

- **Configuration H2 (Oracle-Routed Diagnostic Reference):**
  - Macro F1: 53.06%
  - Balanced Accuracy: 53.41%

- **End-to-End Category Recalls:**
  - Generic: 98.06%
  - Exploits: 53.78%
  - Fuzzers: 14.83%
  - DoS: 67.55%
  - Reconnaissance: 73.48%
  - Analysis: 2.95%
  - Backdoor: 11.57%
  - Shellcode: 63.46%
  - Worms: 15.38%

- **Latency Benchmarks ($N=100$):**
  - L1 (Stage 1 alone): Mean = 21.04 ms
  - L2 (Stage 2 alone): Mean = 23.09 ms
  - L3 (Hierarchical conditional): Mean = 32.06 ms
  - L4 (Unconditional reference): Mean = 43.31 ms
  - Measured mean-latency reduction: approximately 26.0%

- **Per-Flow Blockchain Queries:** Exactly 0.

---

## 4. Cryptographic Hash Verification

| Target Asset | Expected SHA-256 Digest | Recomputed SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| **Stage 1 Model Artifact** | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `dc5e1688...e7c5` | `VERIFIED` |
| **Stage 2 Model Artifact** | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `596b98ce...3208` | `VERIFIED` |
| **Raw Training Dataset** | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | `734fe664...a559` | `VERIFIED` |
| **Raw Testing Dataset** | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | `bec7dd5e...48fa` | `VERIFIED` |

---

## 5. Test Suite and Regression Status

1. **Backend Test Suite (`python -m pytest tests -v`):**
   - **70 passed out of 70** tests in 14.44s (including all 10 hierarchical IDS tests).
2. **Frontend Test Suite (`npm test -- --run`):**
   - **26 passed out of 26** tests in 2.08s.
3. **Frontend Production Build (`npm run build`):**
   - Succeeded with zero errors and zero warnings.

---

## 6. Self-Reference and Final Sign-Off

In accordance with the project self-reference convention, the final commit SHA is omitted from repository markdown files and will be reported externally in the prompt response. Phase 7B.3.1 was strictly a documentation and research-integrity reconciliation pass. Phase 7B.4 has not been started.
