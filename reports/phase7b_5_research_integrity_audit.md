# Phase 7B.5 — Research-Integrity Audit Report (Design Review)

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.5 — Final End-to-End Integration Design Review  
**Date:** October 2026  
**Starting Checkpoint:** `384ad9266e3f7545e6570334c13041a5540b5da2`  
**Audit Evaluation Result:** PASS (All 16 Criteria Satisfied)  

---

## Audit Framework

This research-integrity audit evaluates the design review artifacts created for Phase 7B.5 (`reports/phase7b_5_design_review.md` and `reports/figures/figure15_final_architecture.png`). The audit confirms that the proposed integration architecture enforces strict academic boundaries, preserves empirical baselines, avoids over-claiming, and adheres to scientific reproducibility standards.

---

## Audit Findings Matrix

| Audit Dimension | Target Requirement | Evaluation Assessment & Evidence | Audit Status |
| :--- | :--- | :--- | :---: |
| **1. Dataset Provenance** | Authentic UNSW-NB15 partitions must be verified by SHA-256 | Training (`734fe664...a559`) and Testing (`bec7dd5e...48fa`) digests verified on disk; zero synthetic data used. | **PASS** |
| **2. Model Hashes** | Both canonical model artifacts must match verified digests | Stage 1 (`dc5e1688...e7c5`) and Stage 2 (`596b98ce...3208`) hashes verified on disk without alteration. | **PASS** |
| **3. Stage 1 Invariance** | Stage 1 binary model parameters and weights must remain unchanged | Canonical artifact `ids_model.joblib` is preserved; baseline metrics (90.30% Acc, 98.78% Prec) documented as invariant. | **PASS** |
| **4. Stage 2 Invariance** | Stage 2 multiclass model parameters and weights must remain unchanged | Canonical artifact `attack_classifier.joblib` is preserved; historical metrics (53.06% Macro F1) preserved as invariant. | **PASS** |
| **5. No Retraining** | Neither model may be retrained, fine-tuned, or re-fit | Design strictly specifies loading existing pre-trained pipelines; zero training scripts invoked. | **PASS** |
| **6. No Unsupported Security Claims** | Digest match must not be conflated with model safety or absence of backdoors | Design Section 13 explicitly states: SHA-256 confirms byte correspondence, not model safety, robustness, or absence of poisoning. | **PASS** |
| **7. No Autonomous Remediation** | Zero active defense actions (firewall, iptables, packet drop, host isolation) | Design Section 8 and Risk R10 strictly mandate passive advisory guidance only; zero automated execution. | **PASS** |
| **8. No Per-Flow Blockchain Requirement** | Per-flow blockchain calls must be strictly 0 | Design Section 12 confirms blockchain operates solely as a pre-load gate; per-flow runtime queries = 0. | **PASS** |
| **9. Local EVM Qualification** | EVM environment must be accurately scoped to local testbed | Design Section 7 and Risk R5 explicitly qualify the environment as local `EthereumTesterProvider` (backed by `py-evm`). | **PASS** |
| **10. Advisory Limitations** | Recommendations must not claim attack prevention or mitigation efficacy | Design Section 9 and 21 formally state that recommendations are advisory heuristics requiring human review. | **PASS** |
| **11. Error Propagation Transparency** | Cascading errors from Stage 1 and Stage 2 must be prominently detailed | Design Section 14 tracks all 15,730 Stage 1 missed attacks (13,520 Fuzzers) and 26,741 Stage 2 category errors. | **PASS** |
| **12. Minority-Class Treatment** | Low detection rates for rare classes must not be obscured | Design Section 3 and 14 transparently detail low recall for Analysis (2.95%), Backdoor (11.57%), and Worms (15.38%). | **PASS** |
| **13. UNSW-NB15 Generalization** | Dataset limitations must be formally acknowledged | Design Section 15 documents 2015 testbed origins, synthetic ground-truth issues, and lack of modern IoT protocols (MQTT, CoAP). | **PASS** |
| **14. Latency Claim Discipline** | Prohibit claims of "zero runtime overhead", "zero latency", or "wire-speed" | Design Section 11 and Risk R6 mandate reporting measured local millisecond quantities without broad performance inflation. | **PASS** |
| **15. Reproducibility Plan** | Explicit deterministic instructions must be provided | Design Section 18 outlines exact commands, prerequisites, test executions, and expected artifact outputs. | **PASS** |
| **16. Historical vs. Future Results** | Existing baseline measurements must be distinguished from future tests | Design Section 3 (Historical Baselines) is formally segregated from Section 6 (Proposed Phase 7B.5 Experiments E1–E7). | **PASS** |

---

## Detailed Audit Commentary

### 1. Integrity of Architectural Decoupling
The design review successfully preserves the core scientific thesis of the project: **decoupling cryptographic integrity verification from runtime inference**. The evaluated architecture places blockchain registry verification outside the per-flow inference path; Phase 7B.5 will instrument the runtime path to confirm zero per-flow blockchain registry lookups while retaining tamper-evidence against unauthorized artifact modification.

### 2. Treatment of Autonomous Remediation
The audit confirms that the advisory response recommendation layer remains strictly non-remediating. The design mandates human operator triage for all recommendations (`requires_human_approval = True`), forbids executable command strings, and acknowledges that issuing recommendations for misclassified flows can produce misleading operational advice.

### 3. Error Propagation Realism
The audit commends the transparent documentation of the "Fuzzers bottleneck", where 74.35% of all Fuzzers flows (13,520 flows) are filtered out as benign by Stage 1 and never reach Stage 2. Acknowledging this severe error cascading rather than claiming seamless two-stage synergy is exemplary research practice.

---

## Audit Sign-Off

The Phase 7B.5 design review document (`reports/phase7b_5_design_review.md`) satisfies all sixteen research-integrity criteria with zero violations.

**OVERALL AUDIT OUTCOME: PASS.**
