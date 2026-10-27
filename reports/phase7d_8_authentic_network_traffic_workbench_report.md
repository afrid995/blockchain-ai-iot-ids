# Phase 7D.8 Implementation Report: Authentic Network Traffic Dataset Workbench

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `84ce2244cf6de6a788ee7bff933bca3ea06cfbb9`  
**Completion Date:** October 27, 2026  
**Commit Message:** `feat: add authentic network traffic dataset workbench`  

---

## 1. Objective

The objective of Phase 7D.8 was to enhance the **Intrusion Detection Workbench** in the frontend operations console so that it visibly, interactively, and functionally operates on the **authentic UNSW-NB15 testing dataset**, replacing the superficial perception that the system only supports a tiny hardcoded set of network-flow presets. The system now exposes all 175,341 authentic records from `data/raw/UNSW_NB15_testing-set.csv` through efficient backend pagination, realistic protocol/service/state filtering, random sampling, full 42-feature input vector inspection, and quarantined post-inference ground truth verification.

---

## 2. Existing Limitation

Prior to this phase:
- The Intrusion Detection Workbench presented a static dropdown containing only 6 hardcoded preset scenarios (`Flow 0001` - `Flow 0006`).
- This gave evaluators the false impression that the ML model was evaluated on a synthetic toy sample or that only 6 flows could be processed.
- Ground-truth attack categories were previously exposed in dropdown scenario labels (e.g. "DoS", "Fuzzers", "Exploits"), leaking the ground truth before classification and undermining realistic zero-knowledge IDS operational semantics.
- Evaluators could not browse, search, or select arbitrary authentic flows from the underlying 175,341-record benchmark partition.

---

## 3. Authentic Dataset Source

The workbench operates directly on the authentic, untouched UNSW-NB15 testing partition:
- **File Path:** `data/raw/UNSW_NB15_testing-set.csv`
- **File Size:** ~46.5 MB (45 columns)
- **Canonical SHA-256 Digest:** `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`
- **Integrity Status:** Strictly preserved without any byte modifications, re-ordering, or synthetic insertions.

---

## 4. Record Count and Class Distribution

The authentic testing partition contains:
- **Total Records:** `175,341`
- **Benign Records (`label = 0`):** `56,000` (31.94%)
- **Attack Records (`label = 1`):** `119,341` (68.06%)
- **Attack Category Breakdown:**
  - `Generic`: 40,000
  - `Exploits`: 33,393
  - `Fuzzers`: 18,184
  - `DoS`: 12,264
  - `Reconnaissance`: 10,491
  - `Analysis`: 2,000
  - `Backdoor`: 1,746
  - `Shellcode`: 1,133
  - `Worms`: 130
- **Total Research Dataset (Train + Test):** `82,332 + 175,341 = 257,673` records.

---

## 5. Pagination Implementation

To support instant, fluid UI rendering without shipping a 32 MB payload over HTTP:
- **Backend Service (`backend/services/dataset_service.py`):**
  - Efficiently loads the CSV into memory once via Pandas on startup (~0.53 seconds).
  - Performs zero-copy array slicing on requests (`O(1)` slice time, ~0.11 ms per page query).
  - Slices records by 1-based page and page size: `start = (page - 1) * page_size`, `end = start + page_size`.
  - Computes `total_pages = ceil(total_filtered / page_size)`.
- **API Endpoint:** `GET /dataset/records?page=1&page_size=25&proto=...&service=...&state=...&search=...`
- **Frontend Pagination Controls:**
  - Supports configurable page sizes: `10`, `25`, and `50` records per page.
  - Page navigation: `Previous Page`, `Next Page`, and direct page jump input across all 7,014 pages (at 25 records/page).
  - Boundary handling: First page disables `Previous`, final page (`page 7014` with 16 records) disables `Next`.
  - Format formatting: Uses `.toLocaleString('en-US')` across all counts to ensure consistent numeric formatting.

---

## 6. Pre-Inference Filtering

The workbench implements realistic network-level filtering:
- **Protocol Filter (`proto`):** Filters by transport protocol (e.g., `tcp`, `udp`, `arp`, `unas`, `ospf`, etc.).
- **Service Filter (`service`):** Filters by application service (e.g., `-` [none], `http`, `dns`, `smtp`, `ftp`, `ssh`, etc.).
- **State Filter (`state`):** Filters by connection state (e.g., `FIN`, `CON`, `INT`, `REQ`, `RST`, etc.).
- **Record / Flow ID Search:** Direct search by 1-based authentic record ID or dataset flow index.
- **Random Flow Sampler:** **Pick Random Flow** button (`GET /dataset/random`) draws a uniform authentic sample across the entire 175,341 distribution.
- **Strict Anti-Leakage Invariant:** Attack categories (e.g. DoS, Fuzzers, Generic) are strictly **excluded** from pre-inference filter options. In an authentic security deployment, network taps and packet capture sensors observe packet headers, not ground-truth labels.

---

## 7. Selected-Flow Inspection

When a network flow is selected from the table or preset dropdown:
- **Summary Metrics Bar:** Renders core telemetry immediately: Flow Record ID, Connection Duration (`dur`), Transport Protocol (`proto`), Application Service (`service`), Connection State (`state`), Source/Destination Packet Counts (`spkts`, `dpkts`), Byte Rates (`sbytes`, `dbytes`), and Source/Destination TTL (`sttl`, `dttl`).
- **Collapsible 42-Feature Model Vector:**
  - An expandable drawer exposes the complete 42-feature input vector expected by the Stage 1 and Stage 2 Random Forest pipelines.
  - Distinguishes clearly between raw network measurements (`dur`, `sbytes`, `dbytes`, `sttl`, `dttl`, `sloss`, `dloss`, `Sload`, `Dload`, `Spkts`, `Dpkts`, etc.) and categorical columns mapped during preprocessing (`proto`, `service`, `state`).
  - Formatted cleanly as labeled key-value badges with zero JSON clipping.

---

## 8. Prediction Flow & Steady-State Decoupling

The execution flow preserves the decoupled hierarchical detection architecture:
1. User clicks **Analyze Traffic Flow** (`POST /predict/hierarchical`).
2. Payload contains strictly the 42 predictive feature attributes (ground-truth `attack_cat` and `label` are not included).
3. Backend validates fail-closed model gate state:
   - If model is unverified or unloaded, returns HTTP 503 `FAIL_CLOSED`.
   - If model is `VERIFIED / LOADED & ACTIVE`, dispatches payload to Stage 1.
4. **Stage 1 Binary Inference (`iot-ids-rf:v1.0.0`):**
   - Evaluates the flow against the Random Forest classifier.
   - If verdict is `Normal`, returns classification immediately; Stage 2 is bypassed.
5. **Stage 2 Multi-Class Inference (`iot-ids-attack-classifier:v1.0.0`):**
   - If Stage 1 detects `Attack`, the flow is automatically routed off-chain to Stage 2.
   - Stage 2 predicts specific UNSW-NB15 attack category (e.g. `Exploits`, `DoS`, `Generic`, `Fuzzers`).
6. **Security Advisory & Audit Event:**
   - Security advisory engine maps the predicted category to human-in-the-loop mitigation guidance.
   - Operation is logged to SQLite audit store with model hash and timestamp.
7. **Per-Flow Blockchain Queries:** Strictly **0**. Blockchain verification occurs once at the deployment/startup lifecycle gate; steady-state flow inference executes off-chain.

---

## 9. Ground-Truth Separation

To maintain strict scientific integrity and avoid data leakage:
- Ground-truth columns (`label` and `attack_cat`) are quarantined on the client and stripped before invoking `/predict/hierarchical`.
- Ground truth is revealed **strictly post-inference** in the dedicated **Quarantined Ground Truth Verification** panel.
- Shows side-by-side comparison between:
  - Stage 1 Prediction vs. Ground-Truth Binary Class (`Normal` vs `Attack`).
  - Stage 2 Prediction vs. Ground-Truth Attack Category (`Exploits`, `DoS`, etc.).
  - Match indicators (`✓ Exact Match` or `⚠️ Discrepancy`) allowing immediate empirical verification of model classification behavior on arbitrary dataset rows.

---

## 10. Interactive vs. Research Evaluation Distinction

The workbench renders a prominent **Evaluation Scope Notice** to maintain transparent research claims:
> **Evaluation Scope Notice:**
> - **Interactive Workbench:** Designed for human-in-the-loop flow inspection, single-flow hierarchical classification, and verification of model decisions on individual authentic records.
> - **Research Evaluation:** Rigorous scientific evaluation was conducted systematically over the complete, untouched 175,341-flow benchmark testing partition (yielding 90.30% binary accuracy, 98.78% precision, 86.82% recall, 2.29% FPR for Stage 1, and 51.43% hierarchical macro F1 for Stage 2).
> - Single-flow interactive testing demonstrates functionality and transparency; it does not replace the full-corpus statistical evaluation.

---

## 11. Automated Test Suite Results

The comprehensive test suite verifies both backend and frontend implementations:

### Backend Pytest Suite (`129 passed in 53.00s`)
- `tests/test_dataset_service.py` (12 tests):
  - `test_01_dataset_file_and_sha256_integrity`: Verified SHA-256 matches `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa`.
  - `test_02_dataset_info_metadata`: Verified total records = 175,341 (Benign: 56,000, Attack: 119,341, features: 42).
  - `test_03_default_pagination`: Verified page 1 default slice (25 records, total pages = 7,014).
  - `test_04_custom_page_size_and_boundary`: Verified page size 50 and boundary page 7014 (16 records).
  - `test_05_invalid_page_and_page_size`: Verified HTTP 422 validation on non-positive integers.
  - `test_06_filter_by_protocol`: Verified protocol filter (`proto=tcp`) returns only TCP flows.
  - `test_07_filter_by_service_and_state`: Verified service (`http`) and state (`FIN`) filters.
  - `test_08_search_by_id`: Verified search by flow index.
  - `test_09_single_record_retrieval`: Verified 1-based index access and out-of-range 404 response.
  - `test_10_random_record_retrieval`: Verified valid structure from random sampler.
  - `test_11_no_attack_cat_filtering_allowed`: Verified attack categories are rejected from filtering.
  - `test_12_hierarchical_prediction_with_authentic_features`: Verified end-to-end inference on authentic record with 0 per-flow blockchain lookups.
- **Existing Backend Suites:** 117 tests passing across ML pipeline, smart contracts, provenance, fail-closed gates, hierarchical routing, and security simulator.
- **Total Backend Tests:** **129 passed**.

### Frontend Vitest Suite (`89 passed across 5 test files`)
- `src/test/dataset_workbench.test.jsx` (6 tests):
  - 1. Dataset information banner renders authentic dataset metadata (175,341 records, Benign 56,000, Attack 119,341, canonical SHA-256).
  - 2. Evaluation scope notice clarifies interactive single-flow vs full 175,341 research benchmark evaluation.
  - 3. Pre-inference filters allow protocol, service, state, and search without leaking attack categories.
  - 4. Pagination bar renders current page, total pages, record count, and navigation buttons.
  - 5. Selecting an authentic dataset record displays its 42 input features and summary.
  - 6. Ground-truth attack category is quarantined before prediction and displayed post-inference.
- **Existing Frontend Suites:**
  - `src/test/App.test.jsx`: 10 passed.
  - `src/test/analytics.test.js`: 16 passed.
  - `src/test/architecture_workflow.test.jsx`: 20 passed.
  - `src/test/solution_workflow.test.jsx`: 37 passed.
- **Total Frontend Tests:** **89 passed**.
- **Combined Test Suite:** **218 automated tests passing**.

---

## 12. Production Build Verification

The frontend production build was verified via `npm --prefix frontend run build`:
- **Result:** Successfully bundled in 673 ms.
- **Output:** Clean bundle written to `frontend/dist/` with 0 syntax or bundling errors.

---

## 13. Git Checkpoint

- **Starting Checkpoint:** `84ce2244cf6de6a788ee7bff933bca3ea06cfbb9`
- **Final Checkpoint:** Will be recorded upon commit.
- **Commit Message:** `feat: add authentic network traffic dataset workbench`
- **Branch:** `master`
- **Remote:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`
