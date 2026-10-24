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

---

## 2. Prohibited Terminology Audit

An automated case-insensitive text audit was conducted across all files created or modified in Phase 6A:
- [`scripts/run_phase6a_experiments.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/scripts/run_phase6a_experiments.py)
- [`reports/phase6a_experimental_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_experimental_results.json)
- [`reports/phase6a_experimental_evaluation_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6a_experimental_evaluation_report.md)

### Detailed Scan Results

| Prohibited Term / Phrase | Unsupported Occurrences | Verified Context / Compliance Status |
| :--- | :---: | :--- |
| `zero latency` | **0** | Clean. All operations report positive non-zero measurements. |
| `zero runtime penalty` | **0** | Clean. Explicitly disclaimed as an invalid claim. |
| `zero overhead` | **0** | Clean. Overhead is quantified (28.60 ms pre-load, 11.61 ms API delta). |
| `sub-50 ms` | **0** | Clean. Not cited as a guaranteed threshold; empirical measurements reported as observed distributions. |
| `real-time` | **0** | Clean. Only appears in explicit disclaimers (*"does not constitute a real-time SLA"*). |
| `wire-speed` | **0** | Clean. Only appears in explicit disclaimers (*"does not represent a wire-speed guarantee"*). |
| `high-throughput` | **0** | Clean. Replaced with empirical sample counts and trial numbers. |
| `tamper-proof` | **0** | Clean. Replaced with *"tamper-evident"* and *"cryptographic mismatch detection"*. |
| `guaranteed secure` | **0** | Clean. Security qualifications explicitly state operational scope and boundaries. |
| `blockchain improves accuracy` | **0** | Clean. Explicitly rejected: blockchain provides provenance records, not ML training or optimization. |
| `blockchain detects attacks` | **0** | Clean. Explicitly clarified: Random Forest classifies traffic; blockchain registers model identity. |
| `SHA-256 proves model safety` | **0** | Clean. Explicitly clarified: SHA-256 proves binary correspondence with registered digest only. |
| `SHA-256 prevents arbitrary code execution` | **0** | Clean. Explicitly listed as an out-of-scope threat if the host server is fully compromised. |
| `production blockchain performance` | **0** | Clean. Explicitly qualified as an in-process local EVM benchmark (`EthereumTesterProvider`). |

---

## 3. Conceptual Demarcation Verification

The deliverables strictly adhere to the five core conceptual standards:

1. **Intrusion Classification:**
   - *Standard:* "ML performs intrusion classification."
   - *Compliance:* Verified. Section 2 of the formal report documents that the Random Forest model determines `Benign` vs `Attack`.
2. **Artifact Integrity:**
   - *Standard:* "SHA-256 provides exact artifact-integrity comparison against a registered digest."
   - *Compliance:* Verified. All hashing functions and tests verify byte-exact digest matches without conflating integrity with semantic correctness.
3. **Decentralized Provenance:**
   - *Standard:* "Blockchain provides the evaluated on-chain provenance registry for the model identity, version, digest, algorithm, registrant, and timestamp."
   - *Compliance:* Verified. The Solidity smart contract (`ModelRegistry.sol`) is evaluated strictly as an immutable provenance record.
4. **Pre-Load Verification:**
   - *Standard:* "The backend performs verification before model loading."
   - *Compliance:* Verified. Fail-closed architecture tests (Experiment E6) prove that unverified or tampered models are blocked from loading into memory.
5. **Runtime Separation:**
   - *Standard:* "Per-flow inference is performed off-chain without a blockchain lookup."
   - *Compliance:* Verified. Experiment E5 isolates pre-load verification (28.60 ms) from pure off-chain inference (41.63 ms), proving zero blockchain interaction during packet evaluation.

---

## 4. Audit Sign-Off

All Phase 6A experimental evaluation artifacts have passed research-integrity verification. The experimental results and documentation are defensible for B.Tech thesis evaluation and submission.
