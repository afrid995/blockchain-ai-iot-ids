# Phase 6C: Research-Integrity Audit Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
**Phase:** 6C (Final Experimental Synthesis & Statistical Evidence)
**Date:** October 24, 2026
**Status:** PASSED (100% COMPLIANT)

---

## 1. Audit Objective

This audit provides an automated and systematic verification of all documentation, scripts, and synthesized results generated in Phase 6C:
- [`scripts/run_phase6c_synthesis.py`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/scripts/run_phase6c_synthesis.py)
- [`reports/phase6c_final_synthesis_results.json`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6c_final_synthesis_results.json)
- [`reports/phase6c_final_experimental_synthesis_report.md`](file:///c:/Users/Shaik%20Afrid/OneDrive/Desktop/major_project/reports/phase6c_final_experimental_synthesis_report.md)

The audit confirms that:
1. Zero unsupported performance guarantees or marketing exaggerations exist.
2. The core conceptual demarcation between ML inference, cryptographic hashing, and blockchain smart contract lookups is rigorously maintained.
3. All empirical measurements are accurately cited from reproducible Phase 6A and 6B result files without modification or fabrication.
4. Scientifically necessary disclaimers and limitations are preserved and contextualized.
5. All self-certifying language (e.g., "publication-grade") is strictly prohibited.

---

## 2. Prohibited Terminology Audit

An automated text scan evaluated 16 prohibited terms and concepts across all newly generated Phase 6C deliverables. To maintain methodology consistency, the audit distinguishes between **unsupported positive claims** (which must be strictly 0) and **legitimate disclaimers or limitation references** (which explicitly state what the system does not guarantee):

| Audited Term / Concept | Unsupported Positive Claims | Legitimate Disclaimers / Contextualized Limitations | Audit Compliance Outcome |
| :--- | :---: | :---: | :--- |
| `real-time` | **0** | 2 | Strictly in disclaimers stating measurements do not constitute real-time guarantees. |
| `wire-speed` | **0** | 2 | Strictly in disclaimers stating measurements do not represent wire-speed guarantees. |
| `zero latency` | **0** | 1 | Appears in prohibited claims inventory; all operations report positive non-zero latency. |
| `zero runtime penalty` | **0** | 1 | Appears in prohibited claims inventory; runtime latencies are empirically measured. |
| `zero overhead` | **0** | 2 | Disclaimers clarify pre-load verification incurs a measured overhead (+14.66 ms). |
| `sub-50 ms` | **0** | 2 | Appears in prohibited claims inventory; empirical distributions reported as observed. |
| `high-throughput` | **0** | 1 | Appears in prohibited claims inventory; replaced with exact trial sample counts. |
| `tamper-proof` | **0** | 1 | Replaced with "tamper-evident" and cryptographic mismatch detection. |
| `guaranteed secure` | **0** | 1 | Security boundaries explicitly scoped to pre-load artifact integrity. |
| `blockchain improves accuracy` | **0** | 2 | Explicitly rejected: blockchain provides provenance records, not ML optimization. |
| `blockchain detects attacks` | **0** | 1 | Explicitly clarified: Random Forest classifies flows; blockchain registers model identity. |
| `SHA-256 proves model safety` | **0** | 2 | Explicitly clarified: SHA-256 proves binary correspondence with registered digest only. |
| `SHA-256 prevents arbitrary code execution` | **0** | 1 | Explicitly listed as an out-of-scope threat if the host operating system is compromised. |
| `production blockchain performance` | **0** | 1 | Explicitly qualified as an in-process local EVM benchmark (`EthereumTesterProvider`). |
| `universal prevention` | **0** | 1 | Scoped to tested substitution scenarios under evaluated trust assumptions. |
| `publication-grade` | **0** | 0 | Prohibited; replaced with objective academic evaluation terminology. |

---

## 3. Conceptual Demarcation Verification

The deliverables strictly adhere to the five core conceptual standards:

1. **Intrusion Classification:**
   - *Standard:* "ML performs intrusion classification."
   - *Compliance:* Verified. Section 5 of the synthesis report documents that the Random Forest model determines `Benign` vs `Attack` across tabular flow features with 90.30% accuracy and 92.41% F1 score.
2. **Artifact Integrity:**
   - *Standard:* "SHA-256 provides exact artifact-integrity comparison against a reference digest."
   - *Compliance:* Verified. Hashing verifies byte-exact digest matches ($5.65\text{ ms}$ mean) without conflating integrity with semantic correctness.
3. **Evaluated On-Chain Provenance Registry:**
   - *Standard:* "Blockchain provides the evaluated on-chain provenance registry for model identity, version, digest, algorithm, registrant, and timestamp."
   - *Compliance:* Verified. The Solidity smart contract (`ModelRegistry.sol`) is evaluated strictly as an on-chain provenance registry in a local EVM environment. No claims of public multi-node decentralized consensus are made.
4. **Pre-Load Verification:**
   - *Standard:* "The backend performs verification before model loading."
   - *Compliance:* Verified. Fail-closed architecture tests prove that unverified or tampered models are blocked from loading into memory.
5. **Runtime Separation:**
   - *Standard:* "The evaluated per-flow inference path performs prediction without a blockchain lookup."
   - *Compliance:* Verified. Pre-load verification is measured before model loading ($20.31\text{ ms}$ mean), while runtime inference executes entirely off-chain in memory ($42.40\text{ ms}$ pure compute, $51.49\text{ ms}$ API latency) without per-flow blockchain lookups or SHA recomputations.

---

## 4. Derived Metric Demarcation Verification

The audit confirms that all derived metrics are explicitly labeled and distinguished from directly measured quantities:
- Directly measured: local SHA hashing ($5.65\text{ ms}$), on-chain read ($8.90\text{ ms}$), total pre-load gate ($20.31\text{ ms}$), pure ML inference ($42.40\text{ ms}$), API latency ($51.49\text{ ms}$).
- Derived metrics: incremental overhead ($+14.66\text{ ms}$), relative ratio ($3.60\times$), gate-to-ML ratio ($0.48\times$), gate-to-API ratio ($0.39\times$).
- Invariance: No numerical values were altered, rounded, or re-estimated from the Phase 6B baseline.

---

## 5. Audit Sign-Off

All Phase 6C experimental synthesis artifacts have passed research-integrity verification. The experimental methodology, derived metrics, and documentation are designed to support a reproducible and defensible B.Tech thesis evaluation.
