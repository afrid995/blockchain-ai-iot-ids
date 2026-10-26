# Phase 7D.3 — Network Traffic Workbench Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `113b3c190dcc622608085b3c39638b313c53bc12`  
**Phase:** 7D.3 — Replace Category-Based Test Selector with Network Traffic Records  
**Date:** October 26, 2026  

---

## 1. Executive Summary

In Phase 7D.3, the test flow selection interface across the Detection Workbench (`IntrusionDetection.jsx`) and the End-to-End Security Solution Demonstrator (`SecuritySolutionOverview.jsx`) was redesigned from a category-based selector (`Select Test Flow Scenario: Normal / DoS / Fuzzers / Exploits / Reconnaissance / Generic`) to an authentic **Network Traffic Records Workbench**.

Prior to this phase, exposing ground-truth attack category labels as selectable inputs compromised the operational credibility of the IDS interface by revealing the answer before model inference. The redesigned interface presents authentic network-flow records (`Flow 0001` through `Flow 0006`) derived directly from the canonical UNSW-NB15 testing dataset. The user selects network traffic based on network attributes (protocol, service, state, duration, packet count, and byte volume). Attack categories (`DoS`, `Fuzzers`, `Exploits`, `Generic`) and benign verdicts (`Normal`) appear strictly as **post-inference outputs** produced by the hierarchical detection pipeline (`/predict/hierarchical`).

Zero-duration flows (`dur < 0.001s`) were corrected to display packet and byte rates as `N/A`, eliminating misleading infinite or extreme calculated rates. All underlying ML models, dataset binaries, cryptographic hashes, smart contracts, and prediction architectures were strictly preserved.

---

## 2. Problem with Category-Based Selector

The previous Detection Workbench presented a dropdown menu with labels such as:
- `Normal`
- `DoS`
- `Fuzzers`
- `Exploits`
- `Reconnaissance`
- `Generic`

This design exhibited two critical flaws:
1. **Exposure of Ground Truth Prior to Inference:** An intrusion detection system in an operational security environment does not receive labeled attack categories as input telemetry; it receives raw or preprocessed network traffic flows. Exposing attack labels as input selections gave the impression that the user was selecting the desired classification outcome rather than submitting network telemetry for automated evaluation.
2. **Misleading Derived Rates on Sub-Millisecond Flows:** Network flows with zero duration (`dur = 0.0000s`) produced extreme packet rates (e.g., `3,333,333.3 /s`), creating unrealistic rate indicators in the telemetry card.

---

## 3. Data Source & Authentic UNSW-NB15 Records

The network traffic records were sourced directly from the project's authentic, preprocessed UNSW-NB15 testing dataset (`data/raw/UNSW_NB15_testing-set.csv` and `data/processed/` artifacts) without generating synthetic packets or fabricating artificial IP addresses.

| Flow ID | UNSW-NB15 Record # | Protocol | Service | State | Duration | Packets (Src / Dst) | Bytes (Src / Dst) | Packet Rate | Ground Truth Label | Stage 1 Expected | Stage 2 Expected |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Flow 0001** | #5 | TCP | - | FIN | 0.4495s | 10 / 6 (16) | 534 / 268 (802) | 35.6 /s | Normal (0) | Benign (75.4%) | **BYPASSED** |
| **Flow 0002** | #48166 | ENCAP | - | INT | 0.0000s | 2 / 0 (2) | 200 / 0 (200) | **N/A** | DoS (1) | Attack (94.4%) | DoS (51.4%) |
| **Flow 0003** | #47732 | TCP | ftp | FIN | 0.6755s | 12 / 12 (24) | 702 / 2596 (3298) | 35.5 /s | Fuzzers (1) | Attack (52.6%) | Fuzzers (74.5%) |
| **Flow 0004** | #48933 | TCP | http | FIN | 0.5060s | 14 / 24 (38) | 890 / 26106 (26996) | 75.1 /s | Exploits (1) | Attack (100.0%) | Exploits (90.0%) |
| **Flow 0005** | #43724 | TCP | http | FIN | 0.1794s | 10 / 6 (16) | 688 / 468 (1156) | 89.2 /s | Exploits (1) | Attack (100.0%) | Exploits (90.0%) |
| **Flow 0006** | #52862 | UDP | dns | INT | 0.0000s | 2 / 0 (2) | 114 / 0 (114) | **N/A** | Generic (1) | Attack (100.0%) | Generic (100.0%) |

---

## 4. Architectural Implementation & Changes Made

### 4.1 Input / Output Separation
- **Input Workbench:** The user selects among flow records (`Flow 0001` – `Flow 0006`). No attack labels (`DoS`, `Fuzzers`, `Exploits`, `Generic`) appear anywhere within the input selector, quick-select pills, or input parameter card.
- **Output Inspection:** Attack categories appear only within the **STAGE 2 — ATTACK CLASSIFICATION** panel after model inference.
- **Separated Evaluation Box:** If the evaluator needs to compare the prediction against the dataset ground truth, an explicit `GROUND TRUTH — EVALUATION ONLY` panel appears below the inference result card, clearly labeled as research validation rather than system input.

### 4.2 Traffic Record Selection Controls
Both `IntrusionDetection.jsx` and `SecuritySolutionOverview.jsx` provide three synchronized interaction methods:
1. **Flow Quick-Select Buttons:** Horizontal selection pill bar displaying `Flow 0001 (TCP)`, `Flow 0002 (ENCAP)`, `Flow 0003 (TCP/ftp)`, etc., with active state highlighting.
2. **Compact Network Traffic Table:** Interactive tabular overview displaying Flow ID, Protocol, Service, State, Duration, Packets, and Bytes with row-level selection clicks.
3. **Accessible Dropdown Selector:** Fallback dropdown populated with flow identifiers and concise telemetry summaries (`Flow 0001 — TCP · 16 pkts · 802 B · 0.4495s`).

### 4.3 Zero-Duration Rate Calculation Safeguards
In both `IntrusionDetection.jsx` and `SecuritySolutionOverview.jsx`:
```javascript
const formatDuration = (dur) => {
  if (dur === undefined || dur === null) return 'N/A';
  const num = Number(dur);
  if (num < 0.0001) return '0.0000s (<10µs)';
  return `${num.toFixed(4)}s`;
};

const formatRate = (rate, dur) => {
  if (dur === undefined || dur === null || Number(dur) < 0.001) return 'N/A';
  if (rate === undefined || rate === null || Number.isNaN(Number(rate))) return 'N/A';
  return `${Number(rate).toFixed(1)} /s`;
};

const formatByteRate = (sbytes, dbytes, dur) => {
  if (dur === undefined || dur === null || Number(dur) < 0.001) return 'N/A';
  const totalBytes = Number(sbytes || 0) + Number(dbytes || 0);
  return `${(totalBytes / Number(dur)).toFixed(1)} B/s`;
};
```
Flows with `dur < 0.001s` (such as `Flow 0002` and `Flow 0006`) now reliably render `N/A` for packet rate and byte rate rather than anomalous multi-million values.

### 4.4 Hierarchical Inference Flow
1. **Execution Request:** Clicking `ANALYZE NETWORK FLOW` submits the 42 extracted UNSW-NB15 numerical features to `POST /predict/hierarchical`.
2. **Stage 1 Binary IDS:** Displays either `ATTACK / Malicious Flow` (with confidence score) or `BENIGN / Normal Flow`.
3. **Conditional Stage 2 Routing:**
   - If Stage 1 is **Attack**: Stage 2 multiclass model classifies the specific attack family (`DoS`, `Fuzzers`, `Exploits`, `Generic`), displaying the classified category and category confidence score.
   - If Stage 1 is **Benign**: Stage 2 is explicitly bypassed, displaying:
     `Stage 2 Multiclass Classifier: Bypassed (Stage 2: BYPASSED — Stage1 classified this flow as Benign). Normal traffic does not invoke attack categorization.`
4. **Deterministic Security Advisory:** Renders severity, investigation priority, recommended operator actions, operator guidance, rationale, and operational limitations, guarded by the mandatory disclosure:
   `⚠️ Human operator approval strictly required. Automated remediation is disabled. Advisory guidance does not execute defensive network modifications.`

---

## 5. Architectural Invariants & Research Integrity Confirmation

- **Zero ML Modifications:** The Stage 1 binary Random Forest (`ml/artifacts/ids_model.joblib`) and Stage 2 multiclass Random Forest (`ml/artifacts/attack_classifier.joblib`) were not modified, retrained, or replaced.
- **Cryptographic Hashes Unaltered:**
  - Stage 1 canonical SHA-256: `dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5`
  - Stage 2 canonical SHA-256: `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`
- **Smart Contract Unaltered:** `ModelRegistry.sol` source and deployed contract at address `0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec` remain unchanged.
- **Zero Per-Flow Blockchain Queries:** The inference path continues to enforce local in-memory execution with zero per-flow blockchain lookups (`per_flow_blockchain_queries = 0`).
- **Authentic Dataset Retained:** UNSW-NB15 raw testing and training datasets remain bitwise identical to the project baseline.

---

## 6. Files Changed

1. `frontend/src/utils/flowPresets.json`:
   - Updated keys from attack category labels (`Normal`, `DoS`, `Fuzzers`, etc.) to flow identifiers (`Flow 0001` through `Flow 0006`).
   - Added flow metadata (`flow_id`, `dataset_id`, `summary`, `ground_truth`).
2. `frontend/src/components/IntrusionDetection.jsx`:
   - Replaced category dropdown with `NETWORK TRAFFIC` selection controls (table, quick-select pills, and dropdown).
   - Added `formatDuration`, `formatRate`, and `formatByteRate` helper functions to suppress invalid rate calculations.
   - Preserved `Network-Flow Input Record (Network Traffic)` card title.
   - Implemented conditional Stage 2 bypass notice and post-inference `GROUND TRUTH — EVALUATION ONLY` box.
3. `frontend/src/components/SecuritySolutionOverview.jsx`:
   - Updated Step 2 network traffic selection card with flow pills, dropdown, and selected flow detail preview.
   - Applied rate calculation guards to prevent infinite packet rates on zero-duration records.
   - Decoupled ground-truth display from input selection into a dedicated post-inference evaluation box.
4. `frontend/src/index.css`:
   - Added styling for `.traffic-selector-bar`, `.traffic-flow-btn`, `.traffic-table-container`, `.traffic-table`, and `.eval-ground-truth-box`.
5. `frontend/src/test/solution_workflow.test.jsx`:
   - Updated Test 2 to verify that category names are not selectable options, network flow records (`Flow 0001`, `Flow 0002`) are selectable, ground truth is absent from the input card, and zero-duration flows display `N/A`.
6. `reports/phase7d_3_network_traffic_workbench_report.md`:
   - Created this technical phase and audit report.

---

## 7. Verification and Test Results

### 7.1 Backend Test Suite (Pytest)
```text
tests/test_backend.py ..........                                         [  8%]
tests/test_blockchain.py ............                                    [ 19%]
tests/test_end_to_end_integration.py ....................                [ 37%]
tests/test_hierarchical_ids.py ..........                                [ 46%]
tests/test_ml_pipeline.py ........                                       [ 53%]
tests/test_model_replacement_simulator.py ..........                     [ 62%]
tests/test_multiclass_classifier.py ..........                           [ 71%]
tests/test_provenance.py ..........                                      [ 80%]
tests/test_response_recommendations.py ............                      [ 91%]
tests/test_stage2_provenance.py ..........                               [100%]

============================ 112 passed in 48.93s =============================
```

### 7.2 Frontend Test Suite (Vitest)
```text
 ✓ src/test/analytics.test.js (16 tests) 13ms
 ✓ src/test/App.test.jsx (10 tests) 1284ms
 ✓ src/test/architecture_workflow.test.jsx (20 tests) 3369ms
 ✓ src/test/solution_workflow.test.jsx (30 tests) 4377ms

 Test Files  4 passed (4)
      Tests  76 passed (76)
   Duration  6.39s
```

### 7.3 Vite Production Build
```text
vite v6.4.5 building for production...
transforming...
✓ 41 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-Dtd2aIt0.css   41.71 kB │ gzip:  7.09 kB
dist/assets/index-Cw5rmwjg.js   291.74 kB │ gzip: 78.64 kB
✓ built in 690ms
```

---

## 8. Git Commit & Push Verification

- **Commit Message:** `refactor: replace category selector with network traffic workbench`
- **Starting Checkpoint:** `113b3c190dcc622608085b3c39638b313c53bc12`
- **Target Branch:** `master`
- **Remote:** `origin/master` (`https://github.com/afrid995/blockchain-ai-iot-ids.git`)
- **Working Tree:** Clean
