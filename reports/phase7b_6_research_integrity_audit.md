# Phase 7B.6 Research Integrity Audit

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `b449209a29e59a9b33c133dd3a5201d8a66d5b14`  
**Audit Date:** October 25, 2026  
**Auditor:** Automated Research Integrity Verification Suite  

---

## 1. Scope and Purpose

This research integrity audit validates that the frontend redesign in **Phase 7B.6 (Production-Style IDS Operations Console)** strictly complies with all scientific boundaries, architectural invariants, reproducibility requirements, and ethical guidelines previously established for this project.

The redesign was strictly confined to presentation and user interaction layers. No underlying machine learning pipelines, smart contracts, cryptographic parameters, or experimental datasets were modified.

---

## 2. Integrity Verification Matrix

| Check # | Audit Item | Verification Method | Expected Value | Observed Value | Status |
|---|---|---|---|---|:---:|
| 1 | Stage 1 Artifact SHA-256 | SHA-256 hash of `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | **PASS** |
| 2 | Stage 2 Artifact SHA-256 | SHA-256 hash of `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | **PASS** |
| 3 | Smart Contract Immutability | Hash of `contracts/ModelRegistry.sol` | Identical to Phase 7B.5.2 | Untouched | **PASS** |
| 4 | On-Chain Registration Integrity | Contract state query `getModelDetails("iot-ids-rf", "v1.0.0")` | Registered hash equals Stage 1 digest | Verified on Ganache node | **PASS** |
| 5 | Per-Flow Blockchain Queries | `/predict/hierarchical` code inspection & response check | `per_flow_blockchain_queries == 0` | `0` queries observed | **PASS** |
| 6 | Fail-Closed Gating | Response when model unverified or tampered | HTTP 503 / UI Lockout | Enforced fail-closed | **PASS** |
| 7 | Advisory Scope Enforcement | Response recommendations schema check | `is_advisory=True`, `requires_human_approval=True`, `automated_remediation_enabled=False` | Strictly enforced | **PASS** |
| 8 | Feature Vector Confidentiality | Inspection of `audit_events` payload storage | No raw 42-feature dictionary stored in database | Feature summary/hash only | **PASS** |
| 9 | Empirical Performance Disclosure | Frontend Research Results comparison with Phase 7B benchmarks | RF: 90.30% Acc / Multiclass: 51.43% Macro F1 / Fuzzers: 19.06% | Accurately displayed | **PASS** |
| 10 | Security Simulator Ephemerality | Disk inspection before and after attack simulation | Temporary directory only; zero changes to canonical artifact | Canonical file byte-exact | **PASS** |

---

## 3. Detailed Integrity Observations

### 3.1 Preservation of Model Artifacts
Neither Stage 1 nor Stage 2 model artifacts were rewritten, re-serialized, or modified in any way during Phase 7B.6. The SHA-256 hashes calculated before and after the implementation are identical to the canonical values established in Phase 7B.2 and Phase 7B.3.

### 3.2 Human-in-the-Loop Safeguards
The console explicitly labels all defensive recommendations as operator advisories. The UI panels feature clear visual disclaimers (`Operator Advisory`, `Human Approval Required`, `Automated Remediation Disabled`). No network firewall rule modifications, IP blocking scripts, or packet-filtering commands are executed or simulated.

### 3.3 Transparent Cascade Bottleneck Disclosure
Rather than obscuring the lower recall on specific subcategories, the new `Research Results` console view prominently presents the **Fuzzers cascade bottleneck analysis**:
- Explains why Stage 1 Random Forest detected only $19.06\%$ of Fuzzers flows due to behavioral overlap with benign traffic patterns.
- Notes that of the flows that reached Stage 2, $92.68\%$ were correctly identified as Fuzzers.
- Highlights this trade-off as a crucial finding in IoT intrusion detection research rather than an error to hide.

### 3.4 Decoupled Blockchain Architecture
The user interface explicitly informs the operator of the system's performance characteristics:
- Model provenance verification occurs once at startup or on operator request ($\approx 32\text{ ms}$).
- Per-flow network traffic evaluation occurs purely off-chain at native scikit-learn speeds ($\approx 20\text{--}40\text{ ms}$).
- Zero blockchain transactions are generated per network flow, preventing network latency degradation and EVM gas exhaustion.

---

## 4. Audit Verdict

**AUDIT RESULT: FULL PASS**  
The implementation in Phase 7B.6 adheres completely to scientific integrity, architectural correctness, and research boundaries. The redesigned console faithfully reflects the underlying system without exaggeration, fabrication, or compromise of previously established baselines.
