# Phase 7B.4.1 — Research-Integrity Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.4.1 — Research-Integrity Reconciliation for Advisory Response Layer  
**Date:** October 2026  
**Starting Checkpoint:** `757511f5121ec399f5a6ce303311866c4b8838a3`  
**Scope:** Strictly documentation-only research-integrity reconciliation; zero code, model, dataset, or architecture changes.  

---

## 1. Executive Summary and Purpose

Following the completion of Phase 7B.4 (Implementation and Evaluation of an Advisory Attack Response Recommendation Layer), an academic research-integrity review identified an overbroad performance claim in the documentation. Specifically, the technical evaluation report used the phrase "Zero Runtime Overhead" and "Zero Blockchain Overhead".

While the experimental evaluation empirically established that the recommendation mapping layer performs **zero per-flow blockchain registry lookups** and **does not invoke model inference**, claiming "Zero Runtime Overhead" is overly broad. In-memory dictionary lookups, function calls, and data serialization incur standard CPU cycles and memory allocations; they do not possess literally zero runtime cost.

This reconciliation replaces the overbroad phrasing with precise, scientifically defensible terminology: **"No Per-Flow Blockchain Lookup"**.

---

## 2. Exact Wording Corrections

### Correction 1: Conclusion Section Claim
- **Target File:** `reports/phase7b_4_response_recommendation_report.md` (Section 12, Line 220)
- **Old Wording:**
  > `- **Zero Runtime Overhead:** Operates with zero per-flow blockchain lookups and zero alterations to model artifacts or API endpoints.`
- **New Wording:**
  > `- **No Per-Flow Blockchain Lookup:** The evaluated recommendation layer performs zero per-flow blockchain registry lookups and does not alter the model artifacts or API endpoints.`

### Correction 2: Architecture Section Header
- **Target File:** `reports/phase7b_4_response_recommendation_report.md` (Section 3, Line 62)
- **Old Wording:**
  > `- **Zero Blockchain Overhead:** Per-flow blockchain calls remain verified at **0**.`
- **New Wording:**
  > `- **No Per-Flow Blockchain Lookup:** Per-flow blockchain calls remain verified at **0**.`

### Correction 3: Objective Section Text
- **Target File:** `reports/phase7b_4_response_recommendation_report.md` (Section 1, Line 15)
- **Old Wording:**
  > `...without altering firewall or system states, and without incurring per-flow blockchain overhead.`
- **New Wording:**
  > `...without altering firewall or system states, and without performing per-flow blockchain lookups.`

### Supplementary Alignment: Completion Report
- **Target File:** `reports/phase7b_4_completion_report.md` (Section 7, Line 99)
- **Aligned Text:**
  > `- **Decoupled Architecture:** The evaluated recommendation layer performs zero per-flow blockchain registry lookups and does not alter model artifacts or API endpoints. Zero per-flow blockchain calls were introduced.`

---

## 3. Strict Boundary and Claims Verification

The revised documentation does NOT claim:
- Zero runtime overhead
- Zero latency
- Real-time performance guarantees
- Attack prevention
- Mitigation efficacy
- Optimal recommendations
- Guaranteed protection
- Autonomous defense
- Production readiness

The verified architectural finding is strictly:
> *"The evaluated recommendation layer performs zero per-flow blockchain registry lookups and does not alter the model artifacts or API endpoints."*

This does **not** imply that recommendation lookup is computational-free.

---

## 4. Preservation of Empirical Invariants

All empirical metrics, sample distributions, and model hashes remain 100% identical and verified:

1. **Taxonomy & Schema Invariants:**
   - 10 supported categories (Normal + 9 attack categories).
   - 100% deterministic taxonomy coverage.
   - 10-field recommendation schema populated for all categories.
   - Zero executable command templates (no iptables, ufw, route add, etc.).
   - Explicit advisory designation (`is_advisory = True`, `requires_human_approval = True`, `automated_remediation_enabled = False`).

2. **Empirical Distribution Invariants ($N = 175,341$ test flows):**
   - Normal: 70,448 flows (40.18%)
   - Generic: 40,344 flows (23.01%)
   - DoS: 24,538 flows (13.99%)
   - Exploits: 21,725 flows (12.39%)
   - Reconnaissance: 8,698 flows (4.96%)
   - Fuzzers: 4,242 flows (2.42%)
   - Backdoor: 2,952 flows (1.68%)
   - Shellcode: 1,189 flows (0.68%)
   - Analysis: 1,171 flows (0.67%)
   - Worms: 34 flows (0.02%)

3. **Error Propagation Invariants:**
   - True attacks receiving Normal guidance (Stage 1 FN): 15,730 flows (13.18% of attacks; 13,520 are Fuzzers).
   - True benign receiving attack guidance (Stage 1 FP): 1,282 flows (2.29% of benign).
   - True attacks receiving mismatched attack guidance (Stage 2 errors): 26,741 flows (22.41% of attacks).
   - True attacks receiving correct category guidance: 76,870 flows (64.41% of attacks).

4. **Cryptographic Hash Invariants:**
   - Stage 1 SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` (VERIFIED)
   - Stage 2 SHA-256: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` (VERIFIED)
   - Raw Training SHA-256: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` (VERIFIED)
   - Raw Testing SHA-256: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` (VERIFIED)

---

## 5. Test Suite and Regression Status

- **Dedicated Unit Tests (`tests/test_response_recommendations.py`):** 12 passed out of 12.
- **Backend Test Suite (`python -m pytest tests -v`):** 82 passed out of 82.
- **Frontend Test Suite (`npm test -- --run`):** 26 passed out of 26.
- **Frontend Build (`npm run build`):** Succeeded in 656ms.

---

## 6. Self-Reference Rule and Final Sign-Off

In accordance with repository self-reference conventions, the final commit SHA is omitted from this file and reported externally in the prompt response. Phase 7B.4.1 was strictly a documentation-only reconciliation pass. Phase 7B.5 has **NOT** been started.
