# Phase 7D.4.1 — Final Research-Integrity Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `1c3f244159cc04aba65545d4601a33181af0e49c`  
**Phase:** 7D.4.1 — Research-Integrity & Documentation Precision Reconciliation  
**Date:** October 26, 2026  

---

## 1. Executive Summary

Phase 7D.4.1 was executed to conduct a final, rigorous research-integrity audit and precision reconciliation following the workspace deduplication implemented in Phase 7D.4. While Phase 7D.4 successfully removed duplicate network-flow input selectors and analysis triggers from the **Security Solution** overview, this reconciliation phase addressed several residual research-integrity and evidence-accuracy concerns:

1. **Reconciliation of Authoritative Cryptographic Hashes:** Corrected inadvertent placeholder digests (`ead12534...`, `7ee91bba...`) recorded in the Phase 7D.4 report to strictly match the canonical binary hashes from the project's provenance records and smart contract registry.
2. **Authoritative Contract Address Handling:** Corrected documentation references to the deployed `ModelRegistry` contract address (`0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`, eliminating stale `0xa2b6...` literals) and removed silent hard-coded address fallbacks in the frontend UI. If the blockchain address is unavailable from backend status, the UI explicitly reports `Unavailable`.
3. **Elimination of Remaining Redundant Detection Details:** Replaced the remaining detailed inference panels in `SecuritySolutionOverview.jsx` (which had previously mirrored Stage 2 attack categorizations, operator advisory recommendations, and audit logging cards) with a compact, read-only summary (status, Stage 1 verdict, Stage 1 confidence, and an authoritative navigation link to the Intrusion Detection Workbench).
4. **Truthful 7-Stage Lifecycle Evidence:** Re-engineered the 7-stage lifecycle tracker so that stages are never marked as `Passed` unconditionally. If verification has not yet run or data is missing, stages display `Pending` or `Unavailable` with accurate descriptive subtitles.
5. **Removal of Misleading Metadata Fallbacks:** Eliminated all hard-coded fallback defaults in `SecuritySolutionOverview.jsx` and `ModelSecurity.jsx` for artifact sizes, registration timestamps, registrant addresses, and cryptographic digests, replacing them with explicit `Unavailable` indicators.
6. **Precise Technical Terminology:** Enforced strict separation and terminology across documentation:
   - SHA-256 establishes byte-level digest equality against a registered reference.
   - `ModelRegistry` smart contract supplies authoritative on-chain model identity, version, and digest.
   - SQLite serves exclusively as an off-chain, local operational audit event store.
   - Zero per-flow blockchain lookups are performed during inference ingestion (`per_flow_blockchain_queries = 0`).

---

## 2. Authoritative Hashes & Provenance Manifest

The authoritative cryptographic digests were re-verified directly against the project's physical artifacts, registration records, and dataset manifests:

| Artifact / Asset | File Path | Authoritative SHA-256 Digest | Provenance Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1 Binary IDS Model** | `ml/artifacts/ids_model.joblib` | `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` | `provenance_record.json` / `ModelRegistry.sol` | **Verified** |
| **Stage 2 Multiclass Model** | `ml/artifacts/attack_classifier.joblib` | `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` | `attack_classifier_provenance_record.json` / `ModelRegistry.sol` | **Verified** |
| **UNSW-NB15 Training Dataset** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | `provenance_record.json` | **Verified** |
| **UNSW-NB15 Testing Dataset** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | `attack_classifier_provenance_record.json` | **Verified** |

All placeholder strings introduced in the Phase 7D.4 report (`ead12534...`, `7ee91bba...`) have been fully corrected in documentation and reconciled against the underlying system.

---

## 3. Blockchain Contract Address & Fallback Elimination

The authoritative contract deployment metadata in `blockchain/deployment/deployment.json` specifies:
```json
{
  "network": "local-evm",
  "contract_name": "ModelRegistry",
  "contract_address": "0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec",
  "deployer_address": "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
}
```

### Corrections Implemented:
1. **Report Cleanliness:** Replaced all occurrences of stale address literals (such as `0xa2b6...`) in documentation with the canonical deployment address `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`.
2. **UI Fallback Removal:**
   - In `ModelSecurity.jsx` and `SecuritySolutionOverview.jsx`, previously if `verifyResult?.contract_address` and `activeStatus?.contract_address` were absent, the component fell back to hard-coded strings.
   - The components now assign `null` or `'Unavailable'`. If the backend does not return an active contract address, the UI displays `Unavailable` instead of silently substituting a simulated address.

---

## 4. Removal of Residual Detailed Duplication in Security Solution

While Phase 7D.4 removed input flow selection and inference buttons from `SecuritySolutionOverview.jsx`, it left detailed inference output cards that duplicated the Intrusion Detection Workbench:
- Duplicate Stage 2 multiclass attack card (`solution-stage2-card`, `solution-stage2-category`, `solution-stage2-confidence`).
- Duplicate security advisory recommendation panel (`solution-advisory-panel`, recommended operator action, guidance, approval disclaimer).
- Duplicate audit event evidence card (`solution-audit-evidence-card`).

### Action Taken:
- Removed all three redundant detailed cards from `SecuritySolutionOverview.jsx`.
- Replaced with a **compact read-only summary** that provides:
  1. Latest inference status (`COMPLETED` or `Awaiting Flow Analysis`).
  2. Latest Stage 1 verdict (`Attack` or `Normal` / `Benign`).
  3. Latest Stage 1 confidence (e.g. `94.5%`).
  4. Direct navigation action: `Open Intrusion Detection Workbench →` where complete Stage 2 classifications, operator advisory recommendations, and audit event telemetry are authoritatively reviewed.
- Prohibited `/predict/hierarchical` API calls from `SecuritySolutionOverview.jsx`.
- Retained the model replacement incident alert banner (`solution-tamper-detected-alert`) strictly when an authentic `HASH_MISMATCH` is returned by the backend; zero synthetic incidents or artificial timestamps are generated.

---

## 5. Truthful Lifecycle Evidence Architecture

Previously, steps 1, 2, and 3 of the 7-stage lifecycle tracker rendered `Passed` unconditionally, even when models were unverified or the blockchain was unreachable.

The lifecycle tracker was refactored to derive state directly from authentic backend verification responses:

| Lifecycle Stage | Condition for `Passed` | Condition for `Pending` | Condition for `Failed` / `Unavailable` / `Blocked` |
| :--- | :--- | :--- | :--- |
| **1. ARTIFACT** | Local artifact exists on disk | Status is uninitialized / unchecked | File missing (`FILE_NOT_FOUND`) |
| **2. SHA-256** | Local SHA-256 digest calculated | Local digest not yet computed | Computation error |
| **3. REGISTRY** | On-chain record queried and returned | Registry not yet queried | `BLOCKCHAIN_UNAVAILABLE` (RPC unreachable) or `NOT_REGISTERED` |
| **4. COMPARISON** | Observed digest equals registered digest | Digests not yet available | Digests differ (`HASH_MISMATCH`) or registry unreachable (`Blocked`) |
| **5. DECISION** | `status === 'VERIFIED'` | `status === 'UNVERIFIED'` | `HASH_MISMATCH`, `NOT_REGISTERED`, or `BLOCKCHAIN_UNAVAILABLE` |
| **6. LOAD GATE** | Model load authorized (`isTargetVerified`) | Pending verification | Load blocked fail-closed |
| **7. IDS STATUS** | Model loaded in memory & inference ready | Engine unverified / unloaded | Inference locked fail-closed |

---

## 6. Elimination of Misleading Metadata Fallbacks

The following fabricated defaults were purged from both `SecuritySolutionOverview.jsx` and `ModelSecurity.jsx`:

| Field | Pre-7D.4.1 Fallback | Reconciled Post-7D.4.1 Behavior |
| :--- | :--- | :--- |
| **Artifact Size** | `isStage1 ? 448512 : 524288` bytes | Renders `Unavailable` if missing from backend data |
| **Registrant Address** | `'0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'` | Renders `Unavailable` if missing from backend data |
| **Registration Timestamp** | `1729850000` / `'2026-10-25 10:00:00 UTC'` | Renders `Unavailable` if missing from backend data |
| **Observed SHA-256** | Hard-coded canonical digest | Renders `Unavailable (Not calculated)` if missing |
| **Registered SHA-256** | Hard-coded canonical digest | Renders `Unavailable (Not queried)` if missing |
| **Verification Latency** | `'15.65'` ms | Renders `N/A` if missing from backend response |

---

## 7. Modified Files & Components

1. `frontend/src/components/SecuritySolutionOverview.jsx`:
   - Purged fabricated fallback defaults for artifact size, timestamps, registrant, contract address, and digests.
   - Refactored 7-stage lifecycle tracker to truthfully reflect pending and unavailable states.
   - Replaced extensive Stage 2, advisory, and audit duplicate panels with compact read-only detection status summary.
   - Safeguarded incident warning to only trigger on actual `HASH_MISMATCH` from backend.
2. `frontend/src/components/ModelSecurity.jsx`:
   - Purged fabricated fallback defaults for artifact size, timestamps, registrant, contract address, and digests.
   - Replaced hard-coded verification latency string with truthful dynamic latency or `N/A`.
3. `reports/phase7d_4_frontend_deduplication_report.md`:
   - Corrected placeholder hash strings to canonical values (`dc5e1688...`, `596b98ce...`).
   - Corrected contract address reference to `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec`.
   - Updated artifact filenames to `ids_model.joblib` and `attack_classifier.joblib`.
   - Clarified that the latest detection display in Security Solution is a compact read-only summary.
4. `frontend/src/test/solution_workflow.test.jsx`:
   - Added tests 23 through 27 verifying absent metadata handling, contract address display, truthful lifecycle states, compact detection summary, and authentic tampering alert rendering.
5. `reports/phase7d_4_1_research_integrity_reconciliation.md`:
   - Comprehensive Phase 7D.4.1 reconciliation deliverable.

---

## 8. Test Execution & Build Verification

### 8.1 Vitest Frontend Suite
All 4 test suites passed with 100% success rate:
```text
✓ src/test/analytics.test.js (16 tests)
✓ src/test/App.test.jsx (10 tests)
✓ src/test/architecture_workflow.test.jsx (20 tests)
✓ src/test/solution_workflow.test.jsx (27 tests)

Test Files  4 passed (4)
     Tests  73 passed (73)
  Duration  4.64s
```

### 8.2 Pytest Backend Suite
All 112 backend tests passed without error:
```text
112 passed in 42.49s (100%)
```

### 8.3 Production Build
Vite production build completed cleanly in 646ms with zero errors or warnings:
```text
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-Dtd2aIt0.css   41.71 kB │ gzip:  7.09 kB
dist/assets/index-_9lwjsJp.js   265.14 kB │ gzip: 73.07 kB
✓ built in 646ms
```

---

## 9. Invariant Confirmation

- **ML Artifacts:** `ids_model.joblib` and `attack_classifier.joblib` untouched.
- **Datasets:** `data/raw/` and `data/processed/` untouched.
- **Smart Contract:** `contracts/ModelRegistry.sol` and deployment records untouched.
- **Backend Endpoints:** FastAPI routes, schemas, and verification pipelines untouched.
- **Zero Per-Flow Blockchain Invariant:** Decoupled inference architecture strictly preserved (`per_flow_blockchain_queries = 0`).
- **Fail-Closed Gating:** Unverified or mismatched models strictly blocked from memory loading.
