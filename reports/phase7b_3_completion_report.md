# Phase 7B.3 — Completion Report: Controlled Hierarchical IDS Integration

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.3 — Controlled Hierarchical Stage 1 → Stage 2 IDS Integration  
**Date:** October 2026  
**Starting Checkpoint:** `fd1fa5622b4c9a5c3d35d35e495dd6f947fd0a87`  
**Status:** COMPLETED & VERIFIED  

---

## 1. Executive Summary

Phase 7B.3 implemented and evaluated the controlled hierarchical composition of the two blockchain-registered models:
1. **Stage 1 Binary IDS (`ids_model.joblib`):** Filters network traffic into Benign or Attack.
2. **Stage 2 Multiclass Classifier (`attack_classifier.joblib`):** Categorizes admitted intrusions into 9 UNSW-NB15 attack categories.

The evaluation was performed across all 175,341 flows of the authentic UNSW-NB15 test set. The experiment confirmed exact routing determinism, characterized error propagation across pipeline stages, quantified minority-class detection limits, and validated that per-flow inference executes with zero runtime blockchain overhead.

---

## 2. Invariant Verification

Before running hierarchical inference, all cryptographic invariants were verified:

| Asset | Canonical Path | Verified SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| **Training Set** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | `VERIFIED` |
| **Testing Set** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | `VERIFIED` |
| **Stage 1 Artifact** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `VERIFIED` |
| **Stage 2 Artifact** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `VERIFIED` |

Neither artifact was retrained, modified, or regenerated.

---

## 3. Sample and Routing Counts Reconciliation

| Dimension | Count | Percentage | Verification Status |
| :--- | :--- | :--- | :--- |
| **Total Test Flows** | 175,341 | 100.00% | Evaluated in full |
| **True Benign Flows** | 56,000 | 31.94% | Ground-truth $y=0$ |
| **True Attack Flows** | 119,341 | 68.06% | Ground-truth $y=1$ |
| **Stage 1 Predicted Benign** | 70,448 | 40.18% | Bypassed Stage 2; output `"Normal"` |
| **Stage 1 Predicted Attack** | 104,893 | 59.82% | Routed to Stage 2 |
| **Stage 2 Routed Flows** | **104,893** | **59.82%** | **Programmatically Verified ($\Delta = 0$)** |
| **True Attacks Reaching Stage 2** | 103,611 | 59.09% | 86.82% of true attacks |
| **True Attacks Missed by Stage 1 (FN)** | 15,730 | 8.97% | 13.18% of true attacks |
| **False-Positive Benign Reaching Stage 2** | 1,282 | 0.73% | 2.29% of true benign |

---

## 4. Evaluated Configurations Summary

### Configuration H1: Operational Hierarchical System (Primary)
- **Binary Admission Performance:**
  - Accuracy: **90.30%**
  - Precision: **98.78%**
  - Recall: **86.82%**
  - F1-Score: **92.41%**
  - Specificity: **97.71%**
  - False Positive Rate: **2.29%**
  - Confusion Matrix: $\text{TN}=54,718, \text{FP}=1,282, \text{FN}=15,730, \text{TP}=103,611$
  - *Architectural Note:* By construction, binary admission matches Stage 1's decision boundary; Stage 2 provides multiclass categorization of admitted attacks.
- **Multiclass Attack Attribution (View B):**
  - On Routed True Attacks ($N=103,611$): Macro F1 = **51.43%**, Balanced Accuracy = **51.20%**, Accuracy = **74.19%**, Weighted F1 = **75.77%**.
  - Across All Routed Flows ($N=104,893$): Macro F1 = **50.64%**, Macro Precision = **55.22%**, Macro Recall = **51.20%**, Weighted F1 = **75.32%**.

### Configuration H2: Oracle-Routed Diagnostic Reference (View A)
- Evaluated on all $N=119,341$ true attack flows.
- Accuracy: **76.18%**
- Macro F1: **53.06%**
- Balanced Accuracy: **53.41%**
- Weighted F1: **77.50%**
- *Status:* Diagnostic reference only; quantifies upper bound in the absence of Stage 1 routing errors.

### Configuration H3: Stage 1 Standalone Reference
- Historical baseline binary metrics from Phases 1–6 ($N=175,341$): Accuracy 90.30%, Precision 98.78%, Recall 86.82%, F1 92.41%, ROC-AUC 0.9860.

---

## 5. Category Routing and Minority Class Findings

| Category | True Count | Routed Count | Routing Rate | Correct Stage 2 | Stage 2 Recall (Routed) | End-to-End Recall |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Generic** | 40,000 | 39,959 | 99.90% | 39,223 | 98.16% | **98.06%** |
| **Exploits** | 33,393 | 32,409 | 97.05% | 17,958 | 55.41% | **53.78%** |
| **Fuzzers** | 18,184 | 4,664 | 25.65% | 2,696 | 57.80% | **14.83%** |
| **DoS** | 12,264 | 12,059 | 98.33% | 8,284 | 68.70% | **67.55%** |
| **Reconnaissance** | 10,491 | 10,215 | 97.37% | 7,709 | 75.47% | **73.48%** |
| **Analysis** | 2,000 | 1,468 | 73.40% | 59 | 4.02% | **2.95%** |
| **Backdoor** | 1,746 | 1,736 | 99.43% | 202 | 11.64% | **11.57%** |
| **Shellcode** | 1,133 | 974 | 85.97% | 719 | 73.82% | **63.46%** |
| **Worms** | 130 | 127 | 97.69% | 20 | 15.75% | **15.38%** |

### Minority Class Observations:
1. **Fuzzers Filtering Bottleneck:** 13,520 of 18,184 Fuzzers flows (74.35%) are misclassified as Benign by Stage 1, bounding end-to-end recall to 14.83% despite 57.80% accuracy among routed flows.
2. **Analysis and Worms Deficits:** Analysis achieves only 2.95% end-to-end recall (59/2,000 detected); Worms achieves 15.38% (20/130 detected) due to acute training data scarcity.
3. **Shellcode Detection:** Shellcode achieves 63.46% end-to-end recall in this evaluation ($N=1,133$). The experiment does not isolate the contribution of class weighting or individual feature groups to this result.

---

## 6. Computational Latency Benchmarks ($N=100$)

| Execution Path | Mean Latency | Median Latency | Min Latency | Max Latency | Std Dev |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **L1: Stage 1 Alone** | 21.04 ms | 19.85 ms | 17.58 ms | 28.23 ms | 2.52 ms |
| **L2: Stage 2 Alone** | 23.09 ms | 22.10 ms | 19.01 ms | 31.45 ms | 2.68 ms |
| **L3: Hierarchical (Conditional)** | **32.06 ms** | **35.90 ms** | 17.65 ms | 48.92 ms | 10.42 ms |
| **L4: Unconditional Reference** | 43.31 ms | 43.12 ms | 38.12 ms | 56.78 ms | 3.89 ms |

- **Conditional Speedup:** Conditional invocation yielded a 26.0% measured mean-latency reduction relative to the unconditional double-inference reference in the evaluated benchmark (L4).
- **Per-Flow Blockchain Queries:** Verified strictly **0**.

---

## 7. Verification and Test Suite Status

1. **Dedicated Unit Tests (`tests/test_hierarchical_ids.py`):**
   - 10 passed out of 10.
2. **Full Backend Test Suite (`python -m pytest tests -v`):**
   - **70 passed out of 70** in 14.44s.
3. **Frontend Test Suite (`npm test -- --run`):**
   - **26 passed out of 26** in 2.08s.
4. **Frontend Production Build (`npm run build`):**
   - Built successfully in 595ms (zero errors, zero warnings).

---

## 8. Artifacts and Deliverables

1. **Evaluator Script:** [`experiments/hierarchical_ids_evaluation.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/experiments/hierarchical_ids_evaluation.py)
2. **Structured JSON Results:** [`experiments/results/phase7b_3_hierarchical_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/experiments/results/phase7b_3_hierarchical_results.json)
3. **Evaluation Figures:**
   - [`reports/figures/figure11_hierarchical_confusion_matrix.png`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/figures/figure11_hierarchical_confusion_matrix.png)
   - [`reports/figures/figure12_category_routing_analysis.png`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/figures/figure12_category_routing_analysis.png)
   - [`reports/figures/figure13_hierarchical_category_performance.png`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/figures/figure13_hierarchical_category_performance.png)
4. **Formal Evaluation Report:** [`reports/phase7b_3_hierarchical_ids_evaluation_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase7b_3_hierarchical_ids_evaluation_report.md)
5. **Research-Integrity Audit:** [`reports/phase7b_3_research_integrity_audit.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase7b_3_research_integrity_audit.md)
6. **Unit Tests:** [`tests/test_hierarchical_ids.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/tests/test_hierarchical_ids.py)

---

## 9. Limitations & Research Boundaries

1. **Error Cascading:** 15,730 true attack flows missed by Stage 1 never reach Stage 2; Fuzzers is disproportionately affected (74.35% missed).
2. **False Positive Contamination:** 1,282 benign flows misclassified by Stage 1 enter Stage 2 and trigger false attack alarms.
3. **Zero Automated Remediation:** No defensive intervention (blocking, quarantine, iptables, packet drop) is implemented.
4. **Zero-Day Limitation:** Cryptographic provenance verification establishes whether the observed model artifact exactly matches the SHA-256 digest registered for the specified model identity and version. It does not protect against distribution shifts, adversarial evasion, or zero-day exploits.

---

## 10. Self-Reference and Final Sign-Off

In accordance with the project self-reference convention, the final commit SHA will not be embedded within repository markdown files; it will be verified and reported externally in the prompt response. Phase 7B.3 is fully complete, mathematically reconciled, and verified.
