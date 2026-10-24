# Phase 7A.1: Research Integrity Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7A.1 (Research Integrity Reconciliation for Phase 7A)  
**Date:** October 24, 2026  
**Status:** COMPLETE & EMPIRICALLY RECONCILED  

---

## 1. Status

Reconciliation completed successfully. All identified overbroad formulations across Phase 7A feasibility reports, audit documentation, and synthesis scripts have been reconciled with evidence-scoped academic language.

---

## 2. Scope

This phase is strictly documentation-only. It does not train any new machine learning model, modify existing model weights, alter the Solidity smart contract, modify the FastAPI backend or React dashboard, alter raw dataset files, or mutate any measured Phase 7A empirical finding.

---

## 3. Corrections Applied

Five specific conceptual formulations were reviewed and reconciled:

### 1. Stage 1 Performance Claims
- **Previous Phrasing:** Stated that the future hierarchical architecture *"maintains high binary detection performance (90.30% accuracy, 98.78% precision, 2.29% FPR) as an independent security gate."*
- **Reconciled Phrasing:** *"The existing binary model remains the first-stage detection gate. Its previously measured 90.30% accuracy and 2.29% false-positive rate remain the established Stage 1 baseline. The end-to-end performance of the future hierarchical system must be measured separately in Phase 7B."*
- **Rationale:** Clarifies that the 90.30% accuracy and 2.29% false-positive rate characterize the standalone Stage 1 binary gate; the end-to-end performance of a combined two-stage pipeline is an empirical question for Phase 7B rather than an automatic inheritance.

### 2. Leakage Language
- **Previous Phrasing:** Used absolute formulations such as *"Feature extraction is mathematically leak-free"* and *"Zero data leakage exists."*
- **Reconciled Phrasing:** *"The inspected feature-extraction pipeline excludes label, attack_cat, and id from the model input; no target-column leakage was identified in the Phase 7A analysis."*
- **Rationale:** Replaces uncalibrated absolute certainty claims with evidence-scoped findings based on the inspected pipeline code.

### 3. UNSW-NB15 / IoT Generalization
- **Previous Phrasing:** Stated that *"Normal traffic (which constitutes the vast majority of benign flows in IoT networks) is processed solely by the lightweight binary model."*
- **Reconciled Phrasing:** *"In the evaluated UNSW-NB15 benchmark, flows classified as Normal are processed only by Stage 1, avoiding unnecessary Stage 2 classification for flows classified as benign."*
- **Rationale:** Confines the statement strictly to the evaluated benchmark dataset rather than making unverified empirical generalizations about global IoT network traffic distributions.

### 4. Class Weighting Evaluation
- **Previous Phrasing:** Stated that *"Future training should employ class_weight='balanced' in Random Forest estimators to penalize errors on minority categories like Worms."*
- **Reconciled Phrasing:** *"`class_weight='balanced'` should be evaluated as one candidate strategy for addressing the severe class imbalance; its effect must be compared empirically in Phase 7B."*
- **Rationale:** Positions balanced class weighting as an experimental candidate strategy to be evaluated rather than an asserted certainty prior to empirical measurement.

### 5. Minority-Class Limitation for Worms
- **Previous Phrasing:** Framed the 44 Worms instances primarily around bootstrap confidence interval recommendations.
- **Reconciled Phrasing:** *"The Worms category has only 44 training samples in the evaluated training partition, so minority-class metrics for this category may have high variance and should be interpreted cautiously in Phase 7B."*
- **Rationale:** Explicitly highlights the statistical sample-size limitation without inventing speculative performance bounds.

---

## 4. Empirical Values Preserved

All empirical findings, counts, hashes, and distributions established in Phase 7A remain strictly invariant and bit-exact:
- **Dataset Hashes:**
  - Training Set: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` (invariant)
  - Testing Set: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` (invariant)
- **Candidate Multi-Class Sample Sizes:**
  - Candidate Training Flows (`label == 1`): Exactly **45,332**
  - Candidate Testing Flows (`label == 1`): Exactly **119,341**
  - Total Candidate Attack Flows: Exactly **164,673**
- **Category Counts & Imbalance:**
  - Generic: 18,871 (train) / 40,000 (test)
  - Exploits: 11,132 (train) / 33,393 (test)
  - Fuzzers: 6,062 (train) / 18,184 (test)
  - DoS: 4,089 (train) / 12,264 (test)
  - Reconnaissance: 3,496 (train) / 10,491 (test)
  - Analysis: 677 (train) / 2,000 (test)
  - Backdoor: 583 (train) / 1,746 (test)
  - Shellcode: 378 (train) / 1,133 (test)
  - Worms: Exactly **44** (train) / 130 (test)
  - Imbalance Ratio: Exactly **428.89 : 1** (Generic vs. Worms in training)
- **Feature Set:** Exactly **42** predictive input features (39 numerical, 3 categorical).
- **Models Trained in Phase 7A.1:** Exactly **0**.

---

## 5. Research Integrity Assessment

A comprehensive audit of the reconciled documentation and code confirms:
- **Unsupported positive performance/security claims:** **0**
- **Autonomous remediation claims:** **0**
- **Universal leakage-free claims:** **0** (scoped strictly to inspected feature columns)
- **Self-certifying descriptors:** **0**
- **Class-weight guarantees:** **0** (framed as empirical candidate strategy)
- **All conceptual boundaries:** 100% compliant with academic research standards.

---

## 6. Phase 7B Boundary

**Phase 7B has not been started. No multiclass model has been trained as part of this reconciliation.**  
All future modeling, training scripts, balanced weighting comparisons, and two-stage pipeline evaluations remain strictly partitioned into Phase 7B.

---

## 7. Git Checkpoint Notice

- **Starting Baseline Checkpoint:** `d525d2de040b0301e625bb8265ec52fa9c7f483a` (`research: evaluate multiclass attack classification feasibility`)
- **Target Branch:** `master`
- **Self-Reference Rule Compliance:** In adherence to project guidelines, this document does not hardcode its own commit SHA. The authoritative final commit SHA resulting from this reconciliation will be reported externally in the completion response upon remote push.
