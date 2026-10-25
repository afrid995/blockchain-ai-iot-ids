# Phase 7B.4 — Advisory Attack Response Recommendation Layer Evaluation Report

**Project:** Blockchain-Based Provenance and Tamper-Evident Auditing for AI-Driven IoT Intrusion Detection  
**Repository:** `https://github.com/afrid995/blockchain-ai-iot-ids.git`  
**Phase:** 7B.4 — Implement and Evaluate an Advisory Attack Response Recommendation Layer  
**Date:** October 2026  
**Status:** Complete  

---

## 1. Objective

The objective of Phase 7B.4 is to design, implement, and evaluate a deterministic **advisory response recommendation layer** that maps output classifications from the hierarchical intrusion detection system (Stage 1 Binary IDS + Stage 2 Multiclass Attack Classifier) into structured mitigation guidance.

This layer bridges raw predictive classifications (`Normal` or one of nine attack categories) with actionable operator guidance without introducing autonomous defensive actions, without altering firewall or system states, and without incurring per-flow blockchain overhead.

---

## 2. Research Question

> **Can the predicted UNSW-NB15 attack category be mapped to a deterministic advisory response recommendation while preserving transparent limitations and avoiding unsupported claims of automated defense?**

Specifically, this study evaluates:
1. Does the mapping cover all supported output categories deterministically and completely?
2. Are safety boundaries strictly enforced such that no automated remediation actions or executable command templates are executed or emitted?
3. How do upstream classification errors (Stage 1 false negatives and Stage 2 category misclassifications) propagate into the advisory recommendation domain?
4. What are the operational limitations of static category-to-action mappings when applied to complex network intrusions?

---

## 3. Architecture Position

The advisory response recommendation layer operates downstream of the hierarchical classification pipeline:

```text
Network-Flow Features (42 features)
        │
        ▼
Stage 1 Binary IDS (ids_model.joblib)
        │
        ├── Benign (0) ──────────────► Normal (Final Label)
        │                               │
        │                               ▼
        │                       Advisory Benign Guidance
        │                       [Routine continuous monitoring]
        │
        └── Attack (1)
                │
                ▼
        Stage 2 Attack Classifier (attack_classifier.joblib)
                │
                ▼
        Attack Category (1 of 9 classes)
                │
                ▼
        Advisory Response Recommendation
        [Severity, Priority, Action, Operator Guidance, Limitations]
```

### Architectural Properties:
- **Decoupled Execution:** The recommendation layer is implemented as a pure, stateless mapping function in `core/response_recommendations.py`.
- **Zero Blockchain Overhead:** Per-flow blockchain calls remain verified at **0**.
- **Human-in-the-Loop Constraint:** Every recommendation mandates human review (`requires_human_approval = True`) and explicitly disclaims automated mitigation (`automated_remediation_enabled = False`).

---

## 4. Recommendation Taxonomy

The recommendation taxonomy defines structured, conservative mitigation guidance tailored to the threat characteristics of each UNSW-NB15 category:

| Output Category | Assigned Severity | Investigation Priority | Recommended Response Action (Summary) |
| :--- | :--- | :--- | :--- |
| **Normal** | Informational | Low | Maintain continuous telemetry collection and routine anomaly-detection baseline updates. |
| **Analysis** | Medium | Medium | Inspect unusual protocol and port-probing behavior; correlate with firewall and DNS telemetry. |
| **Backdoor** | High | High | Investigate endpoint persistence mechanisms; review authentication and process creation logs. |
| **DoS** | High | High | Inspect traffic volume anomalies; consider operator-approved rate limiting or upstream filtering. |
| **Exploits** | High | High | Inspect targeted application logs; review CVE patch status and suspicious payload patterns. |
| **Fuzzers** | Medium | Medium | Inspect malformed request patterns; review parser error logs and verify input validation. |
| **Generic** | Medium | Medium | Perform secondary triage; correlate flow telemetry with endpoint security logs. |
| **Reconnaissance** | Medium | Medium | Inspect scanning and sweep activity; review source IP behavior across ports and services. |
| **Shellcode** | Critical | Critical | Inspect endpoint memory, process, and security telemetry; verify service binary integrity. |
| **Worms** | Critical | Critical | Investigate lateral propagation; inspect east-west communication and evaluate network segmentation. |

---

## 5. Deterministic Mapping Design

The recommendation layer is encapsulated in `core/response_recommendations.py` and provides two primary interfaces:
- `get_response_recommendation(category: str) -> Dict[str, Any]`
- `get_all_response_recommendations() -> Dict[str, Dict[str, Any]]`

Each recommendation adheres to a rigorous ten-field schema:
1. `category`: Output class name.
2. `severity`: Threat severity rating (`Informational`, `Medium`, `High`, `Critical`).
3. `investigation_priority`: Triage urgency for security analysts (`Low`, `Medium`, `High`, `Critical`).
4. `recommended_action`: High-level advisory mitigation direction.
5. `operator_guidance`: Concrete investigative procedures and telemetry sources for the analyst.
6. `rationale`: Conceptual link between the attack category and the proposed guidance.
7. `limitations`: Explicit statement of classification uncertainty and potential false alarms.
8. `is_advisory`: Boolean flag strictly set to `True`.
9. `requires_human_approval`: Boolean flag strictly set to `True`.
10. `automated_remediation_enabled`: Boolean flag strictly set to `False`.

Any unknown or malformed input category immediately raises a controlled `KeyError` or `ValueError`, preventing silent fallback to arbitrary recommendations.

---

## 6. Coverage Results

Evaluation via `experiments/response_recommendation_evaluation.py` confirmed 100% taxonomy coverage:
- **Total Supported Categories:** Exactly 10 (1 Benign + 9 Attack categories).
- **Attack Category Coverage:** Exactly 9 attack categories covered with 1-to-1 deterministic mappings.
- **Benign Baseline Coverage:** `Normal` is explicitly mapped to routine baseline monitoring guidance.
- **Completeness:** Zero missing fields across all 10 recommendation objects.

---

## 7. Validation Results

A dedicated test suite (`tests/test_response_recommendations.py`) verified twelve formal invariants:
- **Test 1:** `Normal` returns valid informational guidance.
- **Test 2:** All 9 attack categories return structured guidance.
- **Test 3:** Exactly 10 categories are supported.
- **Test 4:** All 10 schema fields are present and non-empty.
- **Test 5:** Repeated queries return bitwise identical dictionaries (100% determinism).
- **Test 6:** Unknown category strings (`"Malware"`, `"Trojan"`, `""`, `None`) raise controlled exceptions.
- **Test 7:** Zero executable command templates (e.g., `iptables`, `ufw`, `drop table`) exist in any guidance text.
- **Test 8:** Every recommendation contains explicit limitation text referencing advisory status.
- **Test 9:** Recommendation retrieval incurs zero blockchain client invocations.
- **Test 10:** Recommendation retrieval incurs zero model loading or inference calls.
- **Test 11:** Stage 1 artifact SHA-256 remains unaltered (`dc5e...e7c5`).
- **Test 12:** Stage 2 artifact SHA-256 remains unaltered (`596b...3208`).

---

## 8. Safety and Remediation Boundary

To prevent unauthorized, unsafe, or premature defensive intervention:
1. **No Autonomous Mitigation:** The system produces passive intelligence for human operators; it does not manipulate iptables, issue TCP resets, terminate connections, or isolate nodes.
2. **No Command Generation:** Recommendations provide investigative procedural guidance (e.g., "Review source IP distribution", "Inspect process creation logs"), rather than executable script commands.
3. **No Claim of Attack Prevention:** The documentation disclaims any assertion that generating a recommendation prevents an attack from succeeding.

---

## 9. Relationship to Stage 1 and Stage 2 Errors

> **Critical Empirical Finding:**  
> The practical utility of an advisory response recommendation is fundamentally bounded by upstream classification accuracy. A recommendation issued for a misclassified flow will reflect the erroneous category rather than the true threat.

Mapping the recommendation taxonomy across the 175,341 authentic UNSW-NB15 test flows evaluated in Phase 7B.3 reveals the concrete impact of upstream classification errors:

### Contextual Recommendation Distribution (N = 175,341 flows)

| Category | Severity | Issued Recommendations | % of Test Flows | True Positive Recommendations | Mismatched Recommendations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Normal** | Informational | 70,448 | 40.18% | 54,718 | 15,730 (True Attacks missed by Stage 1) |
| **Generic** | Medium | 40,344 | 23.01% | 39,223 | 1,121 |
| **DoS** | High | 24,538 | 13.99% | 8,284 | 16,254 |
| **Exploits** | High | 21,725 | 12.39% | 17,958 | 3,767 |
| **Reconnaissance** | Medium | 8,698 | 4.96% | 7,709 | 989 |
| **Fuzzers** | Medium | 4,242 | 2.42% | 2,696 | 1,546 |
| **Backdoor** | High | 2,952 | 1.68% | 202 | 2,750 |
| **Shellcode** | Critical | 1,189 | 0.68% | 719 | 470 |
| **Analysis** | Medium | 1,171 | 0.67% | 59 | 1,112 |
| **Worms** | Critical | 34 | 0.02% | 20 | 14 |
| **Total** | — | **175,341** | **100.00%** | **131,588** | **43,753** |

### Detailed Error-Propagation Breakdown:
1. **Missed Attacks Receiving Normal Guidance:**  
   **15,730 true attack flows** (13.18% of all attacks) were misclassified as Benign by Stage 1. Consequently, these flows would receive "Normal / Routine Monitoring" guidance, failing to alert the operator. The vast majority of these missed flows belong to the **Fuzzers** category (13,520 flows).
2. **Benign Traffic Receiving Attack Guidance:**  
   **1,282 true benign flows** were misclassified by Stage 1 as attacks and admitted to Stage 2. These flows received false-alarm attack recommendations (761 Fuzzers, 409 Exploits, 56 Reconnaissance, 32 DoS, 20 Shellcode, 4 Generic), potentially causing unnecessary operator triage overhead.
3. **True Attacks Receiving Mismatched Attack Guidance:**  
   **26,741 true attack flows** (22.41% of all attacks) were correctly identified as malicious but assigned an incorrect attack category by Stage 2. For instance, DoS guidance was recommended for 24,538 flows, but only 8,284 were true DoS attacks; the remaining 16,254 flows were primarily misclassified Exploits or Backdoors.
4. **Minority Class Guidance Scarcity:**  
   - **Analysis:** Only 59 of 2,000 true instances receive correct Analysis guidance (2.95% recall).
   - **Backdoor:** Only 202 of 1,746 true instances receive correct Backdoor guidance (11.57% recall).
   - **Worms:** Only 20 of 130 true instances receive correct Worms guidance (15.38% recall).

---

## 10. Limitations

1. **Static Mapping:** The taxonomy maps static guidance based exclusively on the predicted category string. It does not ingest host-specific context, asset criticality, network topology, or historical threat intelligence.
2. **Error Sensitivity:** Because the mapping is deterministic, upstream false positives and false negatives directly translate into erroneous operator guidance.
3. **No Response Effectiveness Data:** The study does not evaluate real-world mitigation outcomes (e.g., MTTR, incident resolution time, or damage containment) because no benchmark dataset of response-action efficacy exists.
4. **Strictly Non-Autonomous:** The layer cannot execute defensive actions independently; it requires a qualified human analyst to validate the findings.

---

## 11. Reproducibility

The advisory response layer evaluation is fully deterministic and reproducible:

```bash
# 1. Run response recommendation evaluation and taxonomy visualization
python experiments/response_recommendation_evaluation.py

# 2. Run dedicated unit and safety tests (12 tests)
python -m pytest tests/test_response_recommendations.py -v

# 3. Run complete regression test suite (82 tests)
python -m pytest tests -v
```

Generated deliverables:
- Structured JSON Results: `experiments/results/phase7b_4_response_recommendation_results.json`
- Taxonomy Visualization: `reports/figures/figure14_attack_response_taxonomy.png`

---

## 12. Conclusion

Phase 7B.4 successfully implemented and evaluated an advisory attack response recommendation layer for the two-stage hierarchical IDS.

Key findings include:
- **Complete and Deterministic Taxonomy:** All 10 supported categories (Normal + 9 attack types) map deterministically to structured guidance adhering to a 10-field schema.
- **Safety Enforcement:** The layer contains zero executable command strings, disclaims autonomous mitigation, and mandates human review for all recommendations.
- **Transparent Error Context:** The analysis demonstrated that downstream recommendation quality is bounded by upstream classification accuracy, specifically highlighting the impact of Stage 1 false negatives (15,730 missed attacks) and Stage 2 category confusion.
- **Zero Runtime Overhead:** Operates with zero per-flow blockchain lookups and zero alterations to model artifacts or API endpoints.
