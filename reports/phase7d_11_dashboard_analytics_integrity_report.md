# Phase 7D.11 — Full Dashboard Analytics Data Integrity Audit Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `3bc1dc1d850a03c3b41540fc53be284eae24379b`  
**Phase:** 7D.11 — Full Dashboard Analytics Data Integrity Audit  
**Date:** October 27, 2026  

---

## 1. Executive Summary

Phase 7D.11 conducted a comprehensive mathematical, architectural, and schema-mapping correctness audit across the **Dashboard Analytics & Audit Visualization** engine.

Prior to this phase, an inspection of the operational dashboard revealed noticeable data inconsistencies:
- **Total Predictions:** 78
- **Attack Detections:** 0 (0.0%)
- **Benign Classifications:** 0 (0.0%)
- **Other / Unspecified:** 78 (100.0%)
- **Verification Attempts:** 9 (7 passed, 2 failed)
- **Loaded Audit Events:** 100 of 769 Events Loaded
- **Audit Event Distribution:** 39 `ADVISORY_RECOMMENDATION`, 39 `PREDICTION`, 7 `MODEL_LOAD`, 7 `MODEL_VERIFICATION`, 6 `SESSION_RESET`, 2 `MODEL_VERIFICATION_FAILURE`, 1 `MODEL_REPLACEMENT_DETECTED`

This audit identified and resolved four root causes:
1. **Advisory Event Double-Counting:** The prediction aggregator loosely matched any event containing a non-empty `prediction` string field. Because `ADVISORY_RECOMMENDATION` audit events record the advised attack category in their `prediction` column (e.g. `"DoS"`), all 39 advisory events were incorrectly ingested alongside the 39 actual `PREDICTION` events, artificially doubling the prediction count to 78.
2. **Hierarchical Prediction Schema Mapping Failure:** In two-stage hierarchical inference, benign flows yield verdict category `"Normal"`, and malicious flows yield the specific UNSW-NB15 multiclass attack category (e.g. `"DoS"`, `"Exploits"`, `"Generic"`, `"Fuzzers"`). The aggregator evaluated only literal string matches for `"attack"` and `"benign"`. Consequently, 100% of hierarchical predictions failed matching and collapsed into `Other / Unspecified` (78 of 78).
3. **Audit Event Scope Ambiguity:** The frontend loader hardcoded `api.getAuditEvents(100, 0, null)`. While the badge truthfully noted `100 of 769 Events Loaded`, downstream metric cards labeled as "Total Predictions" could be misread by evaluators as an aggregation of the entire audit database rather than a 100-event page.
4. **Quarantine of Non-Prediction Latency:** Latency statistics were clarified to strictly filter on `PREDICTION` events with positive finite durations, preventing cross-contamination from model verification or administrative execution times.

All aggregations in `frontend/src/utils/analytics.js`, `frontend/src/api/client.js`, `frontend/src/App.jsx`, `frontend/src/components/AnalyticsSection.jsx`, and `frontend/src/components/Dashboard.jsx` have been audited, reconciled, and verified.

---

## 2. Root Cause Analysis & Reconciliation Matrix

| UI Element / Metric | Previous Flawed Behavior | Root Cause | Corrected Behavior |
| :--- | :--- | :--- | :--- |
| **Total Predictions** | Displayed `78` | Filter treated `ADVISORY_RECOMMENDATION` events (which store advised category in `prediction`) as predictions. | Filter strictly accepts `e.event_type === 'PREDICTION'`. Advisory events are quarantined. Total matches exact count of prediction events. |
| **Attack Detections** | Displayed `0` (0.0%) | Evaluator only checked `prediction === 'attack'`. Hierarchical predictions record category name (`'DoS'`, `'Exploits'`, etc.) or Stage 1 flag in `details.stage1_prediction`. | Evaluator inspects `details.stage1_prediction`, `details.stage1_code`, `details.prediction_code`, and canonical attack category names. Predicted attacks are accurately classified. |
| **Benign Classifications** | Displayed `0` (0.0%) | Evaluator only checked `prediction === 'benign'`. Hierarchical inference outputs `'Normal'` for benign flows. | Evaluator maps `'Normal'`, `'benign'`, `stage1_code === 0`, and `stage1_prediction === 'Benign'` to Benign. |
| **Prediction Distribution** | Displayed `78 Other / Unspecified` | All hierarchical predictions fell through binary string equality checks. | Attack % and Benign % accurately sum to 100% of predictions. `Other` is strictly reserved for truly unrecognized outputs. |
| **Stage 2 Breakdown** | Absent from analytics | Only binary classifications were contemplated in visualization. | Added visual breakdown of identified Stage 2 attack categories (`DoS`, `Exploits`, `Generic`, etc.) when present in audit events. |
| **Loaded Event Scope** | Fixed at 100 events | `App.jsx` fetched page 1 with limit 100, leaving remaining events unloaded. | Added `getAllAuditEvents(pageSize=500)` in API client to paginate through the full audit store. Analytics now reflect the complete operational log. |
| **Verification Gate Stats** | Hardcoded subset in status object | Missing explicit keys for `INVALID_EXPECTED_HASH` and `SYSTEM_ERROR`. | Extended `byStatus` mapping to encompass all backend verification failure statuses. Verified `successCount + failureCount === total`. |
| **Latency Statistics** | Potential contamination if non-prediction events carried latency fields | `calculateLatencyStats` did not verify `event_type === 'PREDICTION'`. | Strictly enforces `ev.event_type === 'PREDICTION'`. Units verified as milliseconds (ms). Verification latency quarantined. |

---

## 3. Data Pipeline & Schema Audit

### 3.1 SQLite Audit Store (`backend/data/audit.db`)

Inspection of table `security_events`:
```sql
CREATE TABLE security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    model_id TEXT,
    model_version TEXT,
    verification_status TEXT,
    prediction TEXT,
    inference_latency_ms REAL,
    verification_latency_ms REAL,
    status TEXT NOT NULL,
    details_json TEXT
);
```

Audit of event distributions across all 787 stored records:
- `PREDICTION`: 159
- `ADVISORY_RECOMMENDATION`: 138
- `MODEL_VERIFICATION`: 130
- `MODEL_LOAD`: 126
- `MODEL_VERIFICATION_FAILURE`: 80
- `MODEL_LOAD_BLOCKED`: 57
- `SESSION_RESET`: 54
- `MODEL_RESTORED`: 23
- `MODEL_REPLACEMENT_DETECTED`: 17
- `SYSTEM_ERROR`: 3
**Total Database Records:** 787

### 3.2 Field Mapping Specifications

For every `PREDICTION` record:
1. **Binary Classification Determination (Order of Priority):**
   - Check `details.stage1_prediction`: `'Attack'` $\rightarrow$ Attack; `'Benign'` / `'Normal'` $\rightarrow$ Benign.
   - Check `details.stage1_code`: `1` $\rightarrow$ Attack; `0` $\rightarrow$ Benign.
   - Check `details.prediction_code`: `1` $\rightarrow$ Attack; `0` $\rightarrow$ Benign.
   - Check `details.prediction`: `'Attack'` / attack categories $\rightarrow$ Attack; `'Benign'` / `'Normal'` $\rightarrow$ Benign.
   - Check `details.stage2_invoked === true`: Stage 2 is conditionally invoked exclusively on Stage 1 Attack $\rightarrow$ Attack.
   - Check top-level `ev.prediction`: `'Attack'`, `'1'`, or UNSW-NB15 attack category (`fuzzers`, `analysis`, `backdoors`, `dos`, `exploits`, `generic`, `reconnaissance`, `shellcode`, `worms`) $\rightarrow$ Attack; `'Benign'`, `'Normal'`, `'0'` $\rightarrow$ Benign.
   - Check `details.final_prediction`: attack categories $\rightarrow$ Attack; `'Normal'` $\rightarrow$ Benign.
   - If no conditions match: increment `otherCount`.
2. **Multiclass Stage 2 Categorization:**
   - If Attack, resolve category name from `details.stage2_prediction`, `details.final_prediction`, or top-level `prediction`.
   - Normalize category casing (`'DoS'`, `'Exploits'`, `'Generic'`, etc.) and increment `categories[canonical]`.

---

## 4. Ground-Truth Quarantine Assurance

A critical research requirement is that **operational analytics must never use ground truth to compute prediction metrics**.

The audit verified:
1. The UNSW-NB15 ground truth columns (`label`, `attack_cat`, `ground_truth_label`, `ground_truth_category`) are strictly excluded from all aggregation routines in `analytics.js`.
2. A unit test was implemented in `frontend/src/test/analytics.test.js` where simulated records had conflicting ground-truth tags (e.g. `ground_truth_label: 0` for an `Attack` prediction). The test confirmed that the aggregation result depends solely on detector predictions and is invariant to changes in ground truth.
3. Ground-truth metrics remain quarantined to the **Research Results** offline benchmark panel (`ResearchResults.jsx`), where benchmark evaluation against the authoritative 175,341-record testing set is reported.

---

## 5. Verification Gate & Latency Aggregation

### 5.1 Model Verification Gate Aggregation
- **Target Event Types:** `MODEL_VERIFICATION` and `MODEL_VERIFICATION_FAILURE`.
- **Status Classification:**
  - Success: `status === 'SUCCESS'` or `verification_status === 'VERIFIED'`.
  - Failure: Any other status (e.g. `HASH_MISMATCH`, `NOT_REGISTERED`, `BLOCKCHAIN_UNAVAILABLE`, `FILE_NOT_FOUND`, `SYSTEM_ERROR`).
- **Mathematical Invariant:** `successCount + failureCount === total`.
- **Percentage Formula:** Each status percentage is calculated as `Number(((byStatus[status] / total) * 100).toFixed(1))` with safe handling for `total === 0`.

### 5.2 Latency Statistics Calculation
- **Filter:** `ev.event_type === 'PREDICTION'` with finite `inference_latency_ms > 0`.
- **Metrics Computed:**
  - Count: $N = |\text{valid latencies}|$
  - Mean: $\bar{x} = \frac{1}{N} \sum_{i=1}^N x_i$ (rounded to 2 decimal places)
  - Median: Middle value of sorted sequence (average of two middle elements if $N$ is even)
  - Minimum: $\min(x)$
  - Maximum: $\max(x)$
- **Quarantine:** Verification latency (`verification_latency_ms`) is quarantined and not mixed into prediction latency.

---

## 6. Scope & Pagination Architecture

### 6.1 Multi-Page Audit Ingestion
To ensure the analytics view accurately reflects the entire operational history:
- Added `api.getAllAuditEvents(pageSize = 500, maxEvents = 2000)` in `frontend/src/api/client.js`.
- Respects the backend query constraint `limit <= 500` defined in `backend/main.py`.
- Paginates sequentially until `allEvents.length === total` or maximum cap is reached.
- Updated `loadAnalytics` in `frontend/src/App.jsx` to load all events with automatic fallback to single-page retrieval if offline.

### 6.2 Truthful UI Labeling
In `frontend/src/components/AnalyticsSection.jsx`:
- Provenance badge dynamically reflects state: `{events.length} of {totalEventsCount} Events Loaded` with `badge-verified` styling when all events are in memory.
- Subtitle explicitly declares: *"Aggregate operational metrics derived from currently loaded security audit records"*.

---

## 7. Test Suite Execution & Build Verification

### 7.1 Frontend Vitest Suite
Execution of `npm --prefix frontend test -- --run`:
```text
Test Files  5 passed (5)
Tests       95 passed (95)
Duration    7.73s
```
Includes 21 dedicated unit tests in `src/test/analytics.test.js` covering:
- Pure prediction event aggregation and percentage calculation.
- Quarantining of `ADVISORY_RECOMMENDATION` events.
- Hierarchical schema mapping (`Normal` as Benign, attack categories as Attack).
- Ground-truth quarantine confirmation.
- Fallback to `otherCount` with invariant `total === attack + benign + other`.
- Verification statuses and invariant `success + failure === total`.
- Latency statistics (mean, median even/odd, min, max, non-prediction quarantine).
- Event type distributions.
- Zero-event empty state protection.

### 7.2 Backend Pytest Suite
Execution of `.\.venv\Scripts\python.exe -m pytest -q`:
```text
129 passed, 2483 warnings in 47.53s
```

### 7.3 Frontend Production Build
Execution of `npm --prefix frontend run build`:
```text
vite v6.4.5 building for production...
✓ 40 modules transformed.
dist/index.html                   0.63 kB │ gzip:  0.43 kB
dist/assets/index-CcoCcITl.css   43.59 kB │ gzip:  7.40 kB
dist/assets/index-BPveFxCB.js   267.92 kB │ gzip: 74.88 kB
✓ built in 761ms
```

---

## 8. Conclusion

Phase 7D.11 successfully resolved all mathematical, logical, and presentation discrepancies across Dashboard Analytics. Every figure rendered in the analytics interface is demonstrably derived from authenticated backend audit events without hardcoded or fabricated values.
