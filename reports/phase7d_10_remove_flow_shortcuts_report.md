# Phase 7D.10 — Remove Hardcoded Flow Shortcut Strip Report

**Project Title:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Starting Checkpoint:** `4a20ebb91b6849bcde940e306759468e8d0ab99a`  
**Phase:** 7D.10 — Remove Duplicate / Hardcoded Flow Shortcut Strip  
**Date:** October 27, 2026  

---

## 1. Executive Summary

Phase 7D.10 resolved the remaining hardcoded telemetry artifact in the **Intrusion Detection Workbench** by eliminating the legacy six-flow shortcut strip (`Flow 0001`–`Flow 0006`).

Following the integration of authentic UNSW-NB15 dataset exploration (Phase 7D.8) with server-side pagination across all 175,341 testing records, the top shortcut strip presented a misleading visual cue: a fixed row of six buttons (`Flow 0001 (TCP)`, `Flow 0002 (ENCAP)`, `Flow 0003 (TCP)`, `Flow 0004 (TCP)`, `Flow 0005 (TCP)`, `Flow 0006 (UDP)`) that seemed to restrict the system to a toy demonstration rather than an evaluation operating over the authentic benchmark corpus.

Phase 7D.10 removed:
1. The `NETWORK TRAFFIC RECORD SELECTOR` heading and shortcut strip subheader.
2. The six quick-select pill buttons (`traffic-flow-btn`, `traffic-selector-bar`).
3. The fallback table loop that previously displayed `Flow 0001` through `Flow 0006` if dataset records were not yet loaded.
4. The `<optgroup label="Benchmark Flow Presets">` option group from the accessible record dropdown (`preset-dropdown`).
5. Legacy helper state and functions (`handlePresetSelect`, `flowPresetsData` import).

The **Intrusion Detection Workbench** now operates directly on the **authentic UNSW-NB15 dataset**:
- Operators browse, filter, search, and paginate through all 175,341 authentic records.
- Operators select records directly from the paginated table or accessible dropdown.
- Operators can sample arbitrary authentic records via the "🎲 Pick Random Flow" selector.
- Selected records populate the 42-feature telemetry vector for hierarchical inference.
- Ground truth remains strictly quarantined prior to prediction.

Zero modifications were made to backend APIs, machine learning models, dataset files, cryptographic checksums, or smart contracts.

---

## 2. Modified Components and Removed Elements

### 2.1 File: `frontend/src/components/IntrusionDetection.jsx`

#### A. Removed Shortcut Strip UI
- **DOM Container:** `<div className="traffic-selector-bar" role="tablist">`
- **Headings Removed:**
  - `NETWORK TRAFFIC RECORD SELECTOR`
  - `Authentic UNSW-NB15 Records` (strip subheader)
- **Buttons Removed:**
  - `Flow 0001 (TCP)` (`data-testid="flow-btn-Flow 0001"`)
  - `Flow 0002 (ENCAP)` (`data-testid="flow-btn-Flow 0002"`)
  - `Flow 0003 (TCP)` (`data-testid="flow-btn-Flow 0003"`)
  - `Flow 0004 (TCP)` (`data-testid="flow-btn-Flow 0004"`)
  - `Flow 0005 (TCP)` (`data-testid="flow-btn-Flow 0005"`)
  - `Flow 0006 (UDP)` (`data-testid="flow-btn-Flow 0006"`)

#### B. Removed Fallback Preset Table Rendering
- Formerly, if `datasetRecords.length === 0`, the table mapped over `flowPresetsData`, rendering rows for `Flow 0001` through `Flow 0006`.
- Replaced with a truthful status message:
  ```jsx
  <tr>
    <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
      {isLoadingRecords ? 'Loading authentic UNSW-NB15 records...' : datasetError || 'No records found matching filters.'}
    </td>
  </tr>
  ```

#### C. Cleaned Accessible Dropdown (`preset-dropdown`)
- Removed `<optgroup label="Benchmark Flow Presets">` containing hardcoded `Flow 0001`–`Flow 0006` `<option>` elements.
- The dropdown now directly renders records from the loaded authentic dataset page (`datasetRecords.map(...)`).

#### D. State and Helper Function Cleanup
- Removed unused import `import flowPresetsData from '../utils/flowPresets.json'`.
- Initialized active flow state with `DEFAULT_INITIAL_RECORD` corresponding exactly to authentic UNSW-NB15 testing set Record #1 (`id=1, dur=0.121478, proto=tcp, service=-, state=FIN...`).
- Removed `handlePresetSelect`.
- Updated `handlePickRandomFlow` fallback to sample from loaded page records rather than static preset keys.
- Updated `currentDropdownValue` calculation to reflect authentic dataset IDs directly.

---

## 3. Preservation of Authentic Dataset Workbench

The authentic dataset workbench remains fully functional:

| Feature | Implementation | Authoritative Source |
| :--- | :--- | :--- |
| **Dataset Metadata** | Name, task type, source CSV, SHA-256 digest, total count (175,341) | `GET /dataset/info` |
| **Record Browsing** | Tabular display of authentic flow parameters (Protocol, Service, State, Duration, Packets, Bytes) | `GET /dataset/records` |
| **Server-Side Pagination** | 7,014 total pages (25 records/page) with Prev/Next, jump-to-page, and page-size selector | `GET /dataset/records?page=...&page_size=...` |
| **Pre-Inference Filtering** | Protocols (`tcp`, `udp`, etc.), Services (`http`, `dns`, etc.), States (`FIN`, `INT`, etc.), Search query | `GET /dataset/records?...` |
| **Random Record Sampling** | Samples random authentic flows from the full 175,341 corpus | `GET /dataset/random` |
| **Feature Inspection** | Expandable grid displaying all 42 model input features for selected flow | Frontend state inspection |
| **Hierarchical Prediction** | Stage 1 Binary RF $\rightarrow$ Stage 2 Multi-Class RF (invoked only on malicious flows) | `POST /predict/hierarchical` |
| **Operator Advisory** | Structured response with investigation priority and operator guidance | Inference response schema |
| **Ground-Truth Quarantine** | `label` and `attack_cat` displayed strictly post-inference under evaluation banner | Client-side isolation |

---

## 4. Test Suite Updates & Validation

### 4.1 Updated Tests

#### `frontend/src/test/solution_workflow.test.jsx`
- **Test 11:** Verified that Intrusion Detection workspace contains the Network Traffic Workbench and explicitly confirmed absence of `Flow 0001` through `Flow 0006` and the `NETWORK TRAFFIC RECORD SELECTOR` heading.
- **Test 12:** Verified that selecting authentic dataset records (Record #000001, Record #000002) updates the flow preview, while confirming that `Flow 0001` through `Flow 0006` are absent from selectable dropdown options.
- **`setupDefaultMocks`:** Enhanced to mock `getDatasetInfo`, `getDatasetRecords`, and `getRandomDatasetRecord` with authentic record structures.

#### `frontend/src/test/dataset_workbench.test.jsx`
- **Test 7 (New):** Dedicated test asserting that:
  - `Flow 0001` through `Flow 0006` are absent from the DOM.
  - `NETWORK TRAFFIC RECORD SELECTOR` is absent from the DOM.
  - `flow-btn-Flow 0001` through `flow-btn-Flow 0006` test IDs are absent.
  - Authentic dataset table, pagination, random picker, filters, and feature preview remain functional.
  - Clicking authentic table rows updates the inference workflow.

### 4.2 Test Suite Execution

1. **Frontend Vitest Suite:**
   ```text
   ✓ src/test/analytics.test.js (16 tests)
   ✓ src/test/dataset_workbench.test.jsx (9 tests)
   ✓ src/test/model_lifecycle.test.jsx (8 tests)
   ✓ src/test/architecture_workflow.test.jsx (20 tests)
   ✓ src/test/solution_workflow.test.jsx (37 tests)

   Test Files  5 passed (5)
        Tests  90 passed (90)
     Duration  7.97s
   ```

2. **Frontend Production Build (Vite):**
   ```text
   ✓ 40 modules transformed.
   dist/index.html                   0.63 kB │ gzip:  0.43 kB
   dist/assets/index-CcoCcITl.css   43.59 kB │ gzip:  7.40 kB
   dist/assets/index-eicUYFH8.js   265.73 kB │ gzip: 74.00 kB
   ✓ built in 664ms
   ```
   *(Bundle size reduced from 271.51 kB to 265.73 kB due to removal of static preset objects from IntrusionDetection bundle).*

3. **Backend Integration Tests (Pytest):**
   ```text
   129 passed, 2483 warnings in 51.02s
   ```

---

## 5. Conclusion

Phase 7D.10 cleanly removed obsolete hardcoded flow shortcut buttons while preserving the authentic UNSW-NB15 network traffic dataset workbench. Operators now interact exclusively with authentic benchmark network flows.
