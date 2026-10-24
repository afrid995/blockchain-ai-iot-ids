# Phase 6A: Research-Integrity Audit Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Phase:** 6A (Experimental Evaluation Framework)
**Date:** October 24, 2026
**Status:** PASSED (100% COMPLIANT)

---

## 1. Audit Objective

This audit verifies that all Phase 6A deliverables adhere strictly to rigorous academic and scientific standards. It enforces that:
1. No unsupported performance guarantees or marketing claims are present.
2. The core conceptual boundaries between ML inference, cryptographic hashing, and blockchain registry lookups are accurately maintained.
3. All empirical measurements are accurately reported from reproducible code without fabrication.
4. Scientific disclaimers and limitations are preserved without creating textual inconsistencies between claim prohibitions and limitation inventories.

---

## 2. Prohibited Terminology Audit

An automated text audit was conducted across all files created or modified in Phase 6A:
- [`scripts/run_phase6a_experiments.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/scripts/run_phase6a_experiments.py)
- [`reports/phase6a_experimental_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_experimental_results.json)
- [`reports/phase6a_experimental_evaluation_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_experimental_evaluation_report.md)

### Detailed Scan Results

To ensure complete methodology consistency, the audit strictly distinguishes between **unsupported performance claims** (which must be 0) and **legitimate disclaimers or limitation references** (which explicitly state what the system does not guarantee):

| Prohibited Term / Concept | Unsupported Performance Claims | Legitimate Disclaimers / Limitations | Compliance Status & Context |
| :--- | :---: | :---: | :--- |
| `real-time` | **0** | **3** | Appears strictly in explicit disclaimers stating that measurements do not constitute a fixed real-time SLA. |
| `wire-speed` | **0** | **3** | Appears strictly in explicit disclaimers stating that measurements do not represent a wire-speed guarantee. |
| `zero latency` | **0** | **1** | All operations report positive non-zero latency measurements; appears in prohibited claims inventory. |
| `zero runtime penalty` | **0** | **1** | Explicitly disclaimed as an invalid claim; runtime latency is empirically measured and reported. |
| `zero overhead` | **0** | **3** | Overhead is quantified (28.60 ms pre-load, 11.61 ms API delta); appears in disclaimers stating zero overhead is not claimed. |
| `sub-50 ms` | **0** | **3** | Empirical measurements reported as observed distributions; appears in disclaimers stating sub-50 ms is not guaranteed on arbitrary hardware. |
| `high-throughput` | **0** | **1** | Replaced with empirical sample counts and trial numbers; appears in prohibited claims inventory. |
| `tamper-proof` | **0** | **1** | Replaced with "tamper-evident" and "cryptographic mismatch detection"; appears in prohibited claims inventory. |
| `guaranteed secure` | **0** | **1** | Security qualifications explicitly state operational scope and boundaries; appears in prohibited claims inventory. |
| `blockchain improves accuracy` | **0** | **2** | Explicitly rejected: blockchain provides provenance records, not ML training or optimization. |
| `blockchain detects attacks` | **0** | **1** | Explicitly clarified: Random Forest classifies traffic; blockchain registers model identity. |
| `SHA-256 proves model safety` | **0** | **2** | Explicitly clarified: SHA-256 proves binary correspondence with registered digest only. |
| `SHA-256 prevents arbitrary code execution` | **0** | **1** | Explicitly listed as an out-of-scope threat if the host server is fully compromised. |
| `production blockchain performance` | **0** | **2** | Explicitly qualified as an in-process local EVM benchmark (`EthereumTesterProvider`). |

---

## 3. Conceptual Demarcation Verification

The deliverables strictly adhere to the five core conceptual standards:

1. **Intrusion Classification:**
   - *Standard:* "ML performs intrusion classification."
   - *Compliance:* Verified. Section 2 of the formal report documents that the Random Forest model determines `Benign` vs `Attack`.
2. **Artifact Integrity:**
   - *Standard:* "SHA-256 provides exact artifact-integrity comparison against a registered digest."
   - *Compliance:* Verified. All hashing functions and tests verify byte-exact digest matches without conflating integrity with semantic correctness.
3. **Evaluated On-Chain Provenance Registry:**
   - *Standard:* "Blockchain provides the evaluated on-chain provenance registry for the model identity, version, digest, algorithm, registrant, and timestamp."
   - *Compliance:* Verified. The Solidity smart contract (`ModelRegistry.sol`) is evaluated strictly as an on-chain provenance registry in a local EVM environment. No claims of public multi-node decentralized consensus are made.
4. **Pre-Load Verification:**
   - *Standard:* "The backend performs verification before model loading."
   - *Compliance:* Verified. Fail-closed architecture tests (Experiment E6) prove that unverified or tampered models are blocked from loading into memory.
5. **Runtime Separation:**
   - *Standard:* "The evaluated per-flow inference path performs prediction without a blockchain lookup."
   - *Compliance:* Verified. Blockchain verification is performed before model loading (28.60 ms mean pre-load gate), while the evaluated per-flow inference path performs off-chain prediction without a blockchain lookup (41.63 ms mean pure compute, 53.24 ms mean API latency).

---

## 4. Audit Sign-Off

All Phase 6A experimental evaluation artifacts have passed research-integrity verification. The experimental results and documentation are defensible for B.Tech thesis evaluation and submission.
