# Phase 7B.5.2 — Design & API Consistency Reconciliation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.5.2 — Documentation-Only Research-Integrity & Design-Consistency Reconciliation  
**Date:** October 2026  
**Starting Checkpoint:** `909b76d1aec487935d45b4cf08add27bb264db61`  
**Status:** COMPLETE & VERIFIED  

---

## 1. Starting Checkpoint

The starting commit for this documentation-only reconciliation phase is:
`909b76d1aec487935d45b4cf08add27bb264db61`

Prior to editing, repository state and remote synchronization were verified against `origin/master`:
- Current HEAD was confirmed identical to `origin/master`.
- Working tree was clean.
- Codebase inspection confirmed that no Phase 7B.5 implementation had been performed.

---

## 2. Corrections Made

### 2.1 Removal of Unsupported Blockchain and Traffic Generalizations
In Section 12 of `reports/phase7b_5_design_review.md`, text previously asserted speculative quantitative claims regarding IoT gateway packet rates ("thousands of packets per second"), per-flow consensus latency, and "unsustainable transaction gas costs".

These statements have been replaced with a strictly architecture- and evidence-grounded formulation:
> "The evaluated architecture intentionally places blockchain registry verification outside the per-flow inference path. Phase 7B.5 will instrument the runtime inference path and verify that no blockchain registry lookups occur per flow. Blockchain performance measurements are restricted to the evaluated local EthereumTesterProvider/py-evm environment and are not extrapolated to public blockchain networks."

No speculative public-mainnet latency, throughput, or gas values are claimed.

### 2.2 Reconciliation of Smart Contract Function Interface
In Section 7 of `reports/phase7b_5_design_review.md`, the design previously cited `getModel(model_id, version)`.

Direct inspection of `blockchain/contracts/ModelRegistry.sol` and `blockchain/artifacts/ModelRegistry.json` confirmed that the smart contract does not define `getModel()`. Instead, the Solidity interface exposes:
- `getModelRecord(string memory modelId, string memory version) external view returns (...)`
- `getModelHash(string memory modelId, string memory version) external view returns (bytes32)`
- `isModelRegistered(string memory modelId, string memory version) external view returns (bool)`

In the Python backend client (`core/blockchain.py`), the method `BlockchainClient.get_model()` invokes `self.contract.functions.getModelRecord(model_id, version).call()`.

The design reference in Section 7 was updated to accurately state `getModelRecord(model_id, version)` (or `isModelRegistered(model_id, version)`), correctly matching the existing Solidity ABI without modifying the smart contract.

### 2.3 Reconciliation of Backend REST API Endpoint Names
In Section 4 of `reports/phase7b_5_completion_report.md` (and related test references), the design previously referred to `GET /model/info`.

Inspection of `backend/main.py` revealed that the existing operational endpoint is:
- `GET /model/status` (exposing `ModelStatusResponse`) alongside `POST /predict` (the established binary baseline endpoint).

The documentation was updated to reference `GET /model/status` consistently. No compatibility alias was created and zero backend routing code was modified.

### 2.4 Correction of Attack-Only Class Imbalance Counts
In Section 15 of `reports/phase7b_5_design_review.md`, the text previously stated an inconsistent sample volume:
> "Generic ($N=40,000$ in train) and Worms ($N=130$) fundamentally restricts minority-class representation despite balanced class weighting."

While the ratio `428.89:1` was mathematically correct, the raw counts $N=40,000$ and $N=130$ were erroneous. The authoritative attack-only training counts established in Phase 7A and Phase 7B are:
- **Generic:** 18,871
- **Worms:** 44
- **Ratio:** $18,871 / 44 = 428.886 \approx 428.89:1$

The text was corrected to state:
> "Extreme attack-only training imbalance exists between Generic ($N=18,871$) and Worms ($N=44$), corresponding to a 428.89:1 ratio. This severely limits the empirical representation of the rare Worms category despite the use of balanced class weighting."

### 2.5 Clarification of the Model Provenance Gate Architecture
The design documents were audited to verify that the cryptographic verification gate is unequivocally presented as a **single application-startup / pre-load authorization step**, and strictly **not** a per-flow check:

```text
Application / Model Initialization
        │
        ▼
SHA-256 + Blockchain Provenance Verification Gate
        │
        ▼
Authorized Model Loading (Fail-Closed if digest mismatch)
        │
        ▼
Per-Flow Runtime Inference (Off-Chain)
        │
        ├── Stage 1: Binary IDS (IDSModelService)
        │        │
        │        ├── Benign ───────────────► Normal (Advisory Low)
        │        │
        │        └── Attack
        │                 │
        │                 ▼
        │        Stage 2: Multiclass Attack Category
        │                 │
        │                 ▼
        │        Advisory Response Guidance (Deterministic Taxonomy)
        │                 │
        │                 ▼
        │        Local SQLite Security Event Log (Append-Oriented)
```

During per-flow runtime inference, the number of blockchain queries is strictly zero.

---

## 3. Explicit Research Boundary Affirmation

1. **No ML Model Retraining:** Neither Stage 1 nor Stage 2 model weights or hyper-parameters were modified.
2. **No Artifact Alteration:**
   - Stage 1 model digest: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5` (VERIFIED UNCHANGED)
   - Stage 2 model digest: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208` (VERIFIED UNCHANGED)
3. **No Dataset Alteration:**
   - Training set digest: `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` (VERIFIED UNCHANGED)
   - Testing set digest: `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` (VERIFIED UNCHANGED)
4. **No Smart Contract Alteration:** `ModelRegistry.sol` byte-for-byte unchanged.
5. **No Backend Implementation:** Neither `POST /predict/hierarchical` nor `HierarchicalPredictionService` was created. Existing `POST /predict` and `GET /model/status` remain unchanged.
6. **No Frontend Implementation:** React code and dashboard views remain untouched.
7. **No Experiment Execution:** Experiments E1 through E7 have not been executed.
8. **No Automated Remediation:** All mitigation recommendations remain advisory and require human approval.

---

## 4. Regression Test Results

Following documentation edits, the full test suite was executed:

1. **Backend Test Suite (`python -m pytest tests -v`):**
   - 82 passed out of 82 tests (100% pass rate).
2. **Frontend Test Suite (`cd frontend; npm test -- --run; cd ..`):**
   - 26 passed out of 26 tests (100% pass rate).
3. **Frontend Production Build (`cd frontend; npm run build; cd ..`):**
   - Succeeded with zero warnings and zero errors (Vite production build).

---

## 5. Self-Reference Convention

In accordance with project research-integrity standards, this report records the authoritative starting checkpoint (`909b76d1aec487935d45b4cf08add27bb264db61`). The final Git commit hash is omitted from this file and is reported externally in the completion response upon remote synchronization.

---

## 6. Research-Integrity Conclusion

**STATUS: RECONCILED, CONSISTENT & APPROVED (PASS)**

The design documentation for Phase 7B.5 now accurately matches the existing code repository, smart contract ABI, REST API routes, dataset distribution metrics, and architectural boundaries. The project is fully prepared for future Phase 7B.5 implementation.
