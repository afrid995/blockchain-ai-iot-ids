# Phase 7B.3.1 — Research-Integrity Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.3.1 — Research-Integrity Reconciliation for Hierarchical IDS Results  
**Date:** October 2026  
**Starting Checkpoint:** `4807e3e11f4a9d70b0ee7be830c6f9b5e4806e54`  
**Scope:** Strictly documentation and research-integrity reconciliation; no code or model changes.  

---

## 1. Purpose and Context

Following the completion of Phase 7B.3 (Controlled Hierarchical Stage 1 → Stage 2 IDS Integration), a rigorous academic research-integrity review identified four areas where documentation wording exceeded the empirical evidence or required precision alignment:
1. An unsupported causal attribution regarding Shellcode detection performance.
2. Overbroad language regarding cryptographic security and model safety guarantees.
3. Imprecise terminology equating measured latency reductions with general computational/FLOP reductions.
4. An inaccurate reference to the underlying EVM execution environment in audit documentation.

This phase executes a **documentation-only reconciliation**. All empirical data, model artifacts, datasets, test suites, and architectural boundaries remain completely untouched and identical to Phase 7B.3.

---

## 2. Reconciled Areas and Corrections

### Correction 1 — Shellcode Observational Language Reconciliation
- **Previous Claim:** "Shellcode achieves 63.46% end-to-end recall due to balanced tree weighting and distinct packet-size characteristics."
- **Integrity Finding:** The experiment measured end-to-end classification recall across classes, but did not perform ablation experiments isolating the specific contribution of tree class-weighting or packet-size features. Causal claims without ablation evidence are scientifically unsupported.
- **Reconciled Wording:**
  > "Shellcode achieves 63.46% end-to-end recall in this evaluation. The experiment does not isolate the contribution of class weighting or individual feature groups to this result."
- **Files Reconciled:**
  - `reports/phase7b_3_hierarchical_ids_evaluation_report.md`
  - `reports/phase7b_3_research_integrity_audit.md`
  - `reports/phase7b_3_completion_report.md`
  - `experiments/results/phase7b_3_hierarchical_results.json`
  - `experiments/hierarchical_ids_evaluation.py`

---

### Correction 2 — Cryptographic Provenance Scope Reconciliation
- **Previous Claim:** "Cryptographic provenance registration guarantees that the loaded model artifact precisely matches the authorized binary artifact... It prevents silent artifact tampering, unauthorized substitution, or bit-rot."
- **Integrity Finding:** Cryptographic hashing and smart-contract verification detect whether an artifact's bytes differ from a pre-registered digest. They do not prevent tampering at the filesystem level, guarantee organizational authenticity, prevent bit-rot in a storage-system sense, or certify model safety, robustness, or absence of training-time poisoning.
- **Reconciled Wording:**
  > "Cryptographic provenance verification establishes whether the observed model artifact exactly matches the SHA-256 digest registered for the specified model identity and version. A digest mismatch is therefore detectable by the evaluated verification mechanism. This does not establish that the registered artifact is safe, benign, or free from pre-registration compromise."
- **Files Reconciled:**
  - `reports/phase7b_3_hierarchical_ids_evaluation_report.md`
  - `reports/phase7b_3_completion_report.md`

---

### Correction 3 — Latency vs. Computation Terminology Alignment
- **Previous Claim:** "Conditional invocation yields a 26.0% computation reduction..."
- **Integrity Finding:** The benchmark measured wall-clock execution time (L3 conditional mean = 32.06 ms vs. L4 unconditional reference mean = 43.31 ms). Equating elapsed wall-clock latency with "computation reduction" inappropriately implies measured FLOPs, CPU instruction counts, or energy savings that were not directly instrumented.
- **Reconciled Wording:**
  > "Conditional invocation yielded a 26.0% measured mean-latency reduction relative to the unconditional double-inference reference in the evaluated benchmark."
- **Files Reconciled:**
  - `reports/phase7b_3_hierarchical_ids_evaluation_report.md`
  - `reports/phase7b_3_completion_report.md`

---

### Correction 4 — Blockchain Execution Environment Verification
- **Previous Audit Note:** `Scoped strictly to local Hardhat/Anvil EVM test execution`
- **Integrity Finding:** Inspection of the actual codebase (`core/blockchain.py`) confirms that the blockchain connector utilizes Web3.py's in-process `EthereumTesterProvider` backed by `py-evm`. The project does not execute against external Hardhat or Anvil daemon processes.
- **Reconciled Wording:**
  > `Scoped strictly to local EthereumTesterProvider backed by py-evm`
- **Preserved Decoupling Statement:**
  > "The evaluated per-flow hierarchical inference path performed no blockchain registry lookup."
- **Files Reconciled:**
  - `reports/phase7b_3_research_integrity_audit.md`

---

## 3. Preserved Scientific and Empirical Invariants

The following invariants remain strictly unchanged and verified:

1. **No empirical metrics changed:** All binary metrics (Accuracy 90.30%, Precision 98.78%, Recall 86.82%, F1 92.41%), multiclass metrics (Oracle Macro F1 53.06%, Operational Macro F1 51.43% / 50.64%), and category end-to-end recalls are preserved to the exact decimal digit.
2. **No model artifacts changed:**
   - Stage 1 SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
   - Stage 2 SHA-256: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
3. **No dataset changed:**
   - Training SHA-256: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559`
   - Testing SHA-256: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`
4. **No methodology changed:** Operational routing remains strictly governed by Stage 1 predictions ($\hat{y}_1 == 1$) without ground-truth label leakage.
5. **No automated remediation introduced:** The system evaluates pure predictive classification; zero defensive intervention (packet dropping, IP blocking, firewall manipulation) exists.
6. **No per-flow blockchain calls introduced:** Per-flow blockchain calls remain verified at exactly 0.

---

## 4. Verification Sign-Off

Phase 7B.3.1 satisfies all four reconciliation mandates with complete fidelity to academic integrity.
