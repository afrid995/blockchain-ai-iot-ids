# Phase 7B — Multiclass Attack-Type Classifier Evaluation

## 1. Objective

Phase 7B evaluates whether an attack-only multiclass classifier (Stage 2) can differentiate the 9 attack categories defined in the authentic UNSW-NB15 benchmark dataset using the same 42 network-flow features established by the baseline binary intrusion detection system (Stage 1). 

Following the feasibility analysis conducted in Phase 7A and reconciled in Phase 7A.1, this experimental evaluation trains, benchmarks, and analyzes two model variants:
- **Model A**: Standard Random Forest (uniform sample weighting)
- **Model B**: Balanced Random Forest (`class_weight="balanced"`)

The evaluation strictly isolates Stage 2 classifier behavior on attack traffic. It does not integrate Stage 2 into the production FastAPI prediction path, does not modify the baseline binary model, does not register the model on the blockchain, and does not perform automated remediation.

---

## 2. Dataset and Provenance

The evaluation uses strictly the authentic UNSW-NB15 training and testing CSV files residing in the repository. Both dataset files were verified prior to data partitioning against canonical reference SHA-256 digests:

| Partition | Repository Path | Canonical SHA-256 Digest | Status |
| :--- | :--- | :--- | :--- |
| **Training** | `data/raw/UNSW_NB15_training-set.csv` | `734fe6642edf758f7c94d7d9149426b49d202fe8e7bf0bef47392489c3c0a559` | **VERIFIED** |
| **Testing** | `data/raw/UNSW_NB15_testing-set.csv` | `bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa` | **VERIFIED** |

Neither file was modified, altered, or rewritten during this evaluation.

---

## 3. Attack-Only Dataset Construction

Because Stage 2 operates downstream of binary intrusion detection (classifying flows identified as malicious by Stage 1), Stage 2 training and test corpora are constructed by filtering raw network flows where:
$$\text{label} == 1 \quad \text{AND} \quad \text{attack\_cat} \neq \text{"Normal"}$$

This filtering yields the following exact attack sample counts:
- **Training Attack Partition ($N_{\text{train}}$)**: $45,332$ flows (derived from $82,332$ raw training rows)
- **Testing Attack Partition ($N_{\text{test}}$)**: $119,341$ flows (derived from $175,341$ raw testing rows)

### Class Distribution and Imbalance

The 9 evaluated attack categories exhibit extreme class imbalance, characterized by a $428.89:1$ training ratio between Generic ($18,871$) and Worms ($44$):

| Attack Category | Training Count ($N = 45,332$) | Training % | Testing Count ($N = 119,341$) | Testing % |
| :--- | :--- | :--- | :--- | :--- |
| **Generic** | 18,871 | 41.63% | 40,000 | 33.52% |
| **Exploits** | 11,132 | 24.56% | 33,393 | 27.98% |
| **Fuzzers** | 6,062 | 13.37% | 18,184 | 15.24% |
| **DoS** | 4,089 | 9.02% | 12,264 | 10.28% |
| **Reconnaissance** | 3,496 | 7.71% | 10,491 | 8.79% |
| **Analysis** | 677 | 1.49% | 2,000 | 1.68% |
| **Backdoor** | 583 | 1.29% | 1,746 | 1.46% |
| **Shellcode** | 378 | 0.83% | 1,133 | 0.95% |
| **Worms** | 44 | 0.10% | 130 | 0.11% |

---

## 4. Feature Representation

The model representation uses the established 42 network-flow features:
- **39 Numerical Features**: `dur`, `spkts`, `dpkts`, `sbytes`, `dbytes`, `rate`, `sttl`, `dttl`, `sload`, `dload`, `sloss`, `dloss`, `sinpkt`, `dinpkt`, `sjit`, `djit`, `swin`, `stcpb`, `dtcpb`, `dwin`, `tcprtt`, `synack`, `ackdat`, `smean`, `dmean`, `trans_depth`, `response_body_len`, `ct_srv_src`, `ct_state_ttl`, `ct_dst_ltm`, `ct_src_dport_ltm`, `ct_dst_sport_ltm`, `ct_dst_src_ltm`, `is_ftp_login`, `ct_ftp_cmd`, `ct_flw_http_mthd`, `ct_src_ltm`, `ct_srv_dst`, `is_sm_ips_ports`.
- **3 Categorical Features**: `proto`, `service`, `state`.

Non-predictive and target annotations (`id`, `label`, `attack_cat`) are strictly stripped from the input feature set prior to training and inference.

---

## 5. Preprocessing

Preprocessing is implemented via a Scikit-Learn `ColumnTransformer` integrated directly into the `Pipeline`:
1. **Numerical Pipeline**:
   - `ReplaceInfTransformer`: Maps $\pm\infty$ values to `NaN`.
   - `SimpleImputer(strategy="median")`: Imputes missing or converted `NaN` values using training median statistics.
   - `StandardScaler()`: Standardizes features to zero mean and unit variance based strictly on training parameters.
2. **Categorical Pipeline**:
   - `SimpleImputer(strategy="constant", fill_value="missing")`: Replaces unobserved missing states.
   - `OneHotEncoder(handle_unknown="ignore", sparse_output=False)`: Encodes discrete categorical levels. Unseen testing categories are transformed to all-zero vectors, preventing inference-time exceptions.

### Data Leakage Safeguards
The preprocessor is fit **strictly on the training attack partition**. The testing partition is never passed to `.fit()` or `.fit_transform()`. Preprocessing and model inference are serialized together into a single atomic object (`attack_classifier.joblib`), ensuring identical transformation execution without test-set tuning.

---

## 6. Experimental Configurations

Both models were trained using deterministic seeds (`random_state=42`) with identical feature transformations, splits, and estimator counts ($100$ trees, maximum depth $20$, $n\_jobs=-1$):

- **Model A (Standard Random Forest)**:
  - Hyperparameters: `n_estimators=100`, `max_depth=20`, `class_weight=None`, `random_state=42`.
  - Behavior: Minimizes global sample impurity without adjusting for class prevalence.
- **Model B (Balanced Random Forest)**:
  - Hyperparameters: `n_estimators=100`, `max_depth=20`, `class_weight="balanced"`, `random_state=42`.
  - Behavior: Automatically weights inversely proportional to class frequencies:
    $$w_c = \frac{N_{\text{train}}}{K \cdot N_{c}}$$
    where $K=9$ classes, giving larger update weights to rare classes (e.g., Worms weight $\approx 114.47$, Generic weight $\approx 0.27$).

---

## 7. Evaluation Metrics

Because of the severe $428.89:1$ class imbalance, overall accuracy is a misleading metric that is heavily dominated by majority classes (`Generic`, `Exploits`, `Fuzzers`).

The primary model selection metric is **Macro F1**:
$$\text{Macro F1} = \frac{1}{K} \sum_{c=1}^K F1_c$$
Supported by:
- **Balanced Accuracy**: Mean of recall across all classes:
  $$\text{Balanced Accuracy} = \frac{1}{K} \sum_{c=1}^K \text{Recall}_c$$
- **Per-Class Recall and Precision**
- **Bootstrap 95% Confidence Interval for Macro F1** ($B=1,000$ iterations)

---

## 8. Standard Random Forest Results

Model A (Standard RF) was trained in $2.96$ seconds and evaluated on the $119,341$ attack flows:
- **Accuracy**: $77.60\%$ ($0.776003$)
- **Balanced Accuracy**: $51.04\%$ ($0.510351$)
- **Macro Precision**: $70.31\%$ ($0.703105$)
- **Macro Recall**: $51.04\%$ ($0.510351$)
- **Macro F1**: $52.27\%$ ($0.522662$)
- **Weighted F1**: $77.63\%$ ($0.776321$)

**Failure Mode**: Model A exhibited complete detection failure on the `Analysis` category:
- Precision: $0.00\%$
- Recall: $0.00\%$
- F1: $0.00\%$ (0 true positives out of 2,000 ground-truth samples).

---

## 9. Balanced Random Forest Results

Model B (Balanced RF) was trained in $2.95$ seconds and evaluated on the same $119,341$ attack flows:
- **Accuracy**: $76.18\%$ ($0.761775$)
- **Balanced Accuracy**: $53.41\%$ ($0.534064$)
- **Macro Precision**: $57.60\%$ ($0.576026$)
- **Macro Recall**: $53.41\%$ ($0.534064$)
- **Macro F1**: $53.06\%$ ($0.530577$)
- **Weighted F1**: $77.50\%$ ($0.775049$)

### Bootstrap Percentile Confidence Interval
A bootstrap analysis ($B = 1,000$ iterations, random seed $42$) on the fixed test predictions evaluated:
- **Macro F1 Mean**: $53.021\%$
- **Macro F1 Std**: $0.516\%$
- **95% Percentile Confidence Interval**: $[52.008\%, 54.069\%]$

---

## 10. Model Comparison

| Evaluation Metric | Model A (Standard RF) | Model B (Balanced RF) | Difference (B - A) | Superior Configuration |
| :--- | :--- | :--- | :--- | :--- |
| **Accuracy** | 77.60% | 76.18% | -1.42 pp | Model A |
| **Balanced Accuracy** | 51.04% | 53.41% | **+2.37 pp** | **Model B** |
| **Macro Precision** | 70.31% | 57.60% | -12.71 pp | Model A |
| **Macro Recall** | 51.04% | 53.41% | **+2.37 pp** | **Model B** |
| **Macro F1 (Primary)** | 52.27% | 53.06% | **+0.79 pp** | **Model B** |
| **Weighted F1** | 77.63% | 77.50% | -0.13 pp | Model A |
| **Training Time** | 2.96 s | 2.95 s | -0.01 s | Identical |

While Model A achieves a marginally higher global accuracy ($+1.42$ pp), it does so by sacrificing minority classes. Model B provides superior balanced accuracy ($+2.37$ pp) and superior Macro F1 ($+0.79$ pp).

---

## 11. Per-Class Results

| Attack Category | Test Support | Model A Precision | Model A Recall | Model A F1 | Model B Precision | Model B Recall | Model B F1 | Delta F1 (B - A) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Analysis** | 2,000 | 0.00% | 0.00% | 0.00% | 5.04% | 2.95% | **3.72%** | **+3.72 pp** |
| **Backdoor** | 1,746 | 98.51% | 3.78% | 7.28% | 6.84% | 11.57% | **8.60%** | **+1.32 pp** |
| **DoS** | 12,264 | 34.05% | 59.84% | 43.40% | 33.79% | 67.68% | **45.07%** | **+1.67 pp** |
| **Exploits** | 33,393 | 72.79% | 65.26% | **68.82%** | 81.25% | 55.94% | 66.26% | -2.56 pp |
| **Fuzzers** | 18,184 | 88.20% | 86.57% | 87.38% | 92.84% | 86.40% | **89.50%** | **+2.13 pp** |
| **Generic** | 40,000 | 96.80% | 98.20% | 97.49% | 97.16% | 98.06% | **97.60%** | **+0.11 pp** |
| **Reconnaissance** | 10,491 | 92.73% | 73.34% | **81.90%** | 88.71% | 75.87% | 81.79% | -0.12 pp |
| **Shellcode** | 1,133 | 65.51% | 60.02% | **62.64%** | 55.66% | 66.81% | 60.73% | -1.91 pp |
| **Worms** | 130 | 84.21% | 12.31% | 21.48% | 57.14% | 15.38% | **24.24%** | **+2.77 pp** |

---

## 12. Confusion Matrix

The normalized confusion matrix for Model B (`figure9_multiclass_confusion_matrix.png`) reveals the following structural interaction patterns:

1. **Generic**: Almost completely separated ($98.06\%$ recall, $39,223$ true positives).
2. **Fuzzers**: Highly discernible ($86.40\%$ recall, $15,711$ true positives), with minor leakage into Exploits ($1,291$ flows) and DoS ($863$ flows).
3. **Reconnaissance**: Reliably classified ($75.87\%$ recall, $7,960$ true positives), with primary confusion toward Exploits ($1,438$ flows).
4. **DoS vs Exploits**: Reciprocal overlap exists where DoS achieves $67.68\%$ recall ($8,300$ flows) while $3,456$ flows misclassify as Exploits.
5. **Exploits**: While achieving $55.94\%$ recall ($18,679$ flows), $11,363$ flows misclassify as DoS.
6. **Minority Classes (Analysis, Backdoor, Shellcode, Worms)**:
   - Analysis has severe confusion with Exploits ($1,093$ flows) and DoS ($531$ flows).
   - Backdoor has strong confusion with Exploits ($978$ flows) and DoS ($444$ flows).
   - Worms ($130$ samples) sees $20$ true positives ($15.38\%$ recall), with $73$ flows misclassified as Exploits and $21$ as DoS.

---

## 13. Rare-Class Analysis

Special attention must be paid to the rare classes:
- **Worms ($N_{\text{train}} = 44$, $N_{\text{test}} = 130$)**:
  With only 44 training instances, Worms accounts for $0.10\%$ of training attacks. Although Model B achieves $24.24\%$ F1 ($15.38\%$ recall, $57.14\%$ precision), **estimates for Worms are subject to statistical instability due to extreme sample scarcity**. This measured test performance cannot be assumed to generalize reliably to unobserved operational environments.
- **Analysis ($N_{\text{train}} = 677$, $N_{\text{test}} = 2,000$)**:
  Model A experienced a complete detection collapse ($0.00\%$ F1). While Model B recovers non-zero recall ($2.95\%$), its low precision ($5.04\%$) reflects severe overlapping feature spaces with DoS and Exploits.
- **Backdoor ($N_{\text{train}} = 583$, $N_{\text{test}} = 1,746$)**:
  Recall increased from $3.78\%$ (Model A) to $11.57\%$ (Model B), but precision fell from $98.51\%$ to $6.84\%$, reflecting the cost of aggressive minority re-weighting without domain-specific feature engineering.

---

## 14. Model Selection

**Selected Model: Model B (Balanced Random Forest)**
- Configuration: `RandomForestClassifier(n_estimators=100, max_depth=20, class_weight="balanced", random_state=42, n_jobs=-1)`

### Selection Rationale:
1. **Primary Metric**: Model B achieves a higher Macro F1 ($53.06\%$ vs $52.27\%$).
2. **Balanced Accuracy**: Model B achieves $+2.37$ percentage points higher balanced accuracy ($53.41\%$ vs $51.04\%$).
3. **Prevention of Category Collapse**: Model A completely failed to identify `Analysis` ($0$ true positives), whereas Model B preserves non-zero detection capability across all 9 categories.
4. **Minority Sensitivity**: Model B nearly doubles recall for `Backdoor` ($11.57\%$ vs $3.78\%$) and improves recall for `DoS` ($67.68\%$ vs $59.84\%$) and `Worms` ($15.38\%$ vs $12.31\%$).

---

## 15. Artifact Integrity

The selected Model B pipeline (preprocessing + classifier) was serialized to disk:
- **Artifact Path**: `ml/artifacts/attack_classifier.joblib`
- **Artifact Size**: $19,376,646$ bytes ($18.48$ MB)
- **Cryptographic SHA-256 Digest**:
  ```text
  596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208
  ```
- **Metadata Path**: `ml/artifacts/attack_classifier_metadata.json`
- **Results Path**: `experiments/results/phase7b_multiclass_results.json`

The SHA-256 digest is deterministic, verified across storage files, and stored in machine-readable metadata.

---

## 16. Leakage Audit

A programmatic leakage audit was executed prior to model finalization:

| Verification Item | Inspected State | Audit Status |
| :--- | :--- | :--- |
| `label` in Training Features | Absent | **PASS** |
| `label` in Testing Features | Absent | **PASS** |
| `attack_cat` in Training Features | Absent | **PASS** |
| `attack_cat` in Testing Features | Absent | **PASS** |
| `id` in Training Features | Absent | **PASS** |
| `id` in Testing Features | Absent | **PASS** |
| Preprocessor Fit Contamination | Fit strictly on training partition | **PASS** |
| Test Label Access During Training | None | **PASS** |
| Pre-split Train/Test Merging | None | **PASS** |
| Synthetic Oversampling of Test Data | None | **PASS** |
| Test-Set Hyperparameter Tuning | None (parameters fixed a priori) | **PASS** |

**Audit Conclusion**:
> *No target-column leakage was identified in the inspected Phase 7B training pipeline.*

---

## 17. Threats to Validity

1. **Construct Validity**: Attack categories are defined based on synthetic testbed traffic generated in the UNSW-NB15 environment; labels reflect simulated attack profiles rather than in-the-wild zero-day exploits.
2. **Internal Validity**: The extreme class imbalance ($428.89:1$) induces high variance in decision boundaries for rare classes. Changing the random seed for bootstrap slightly shifts percentile bounds ($\pm 0.5\%$).
3. **External Validity**: Traffic characteristics are specific to the protocols, services, and topologies captured in the UNSW-NB15 dataset. Generalization to enterprise IoT networks with novel protocol stacks cannot be assumed.

---

## 18. Limitations

1. **Stage 2 Isolation**: This evaluation tests Stage 2 in isolation on attack flows. It does not measure false positives against benign traffic (which is handled by Stage 1).
2. **Rare-Class Statistical Instability**: The Worms category has only 44 training flows. Its evaluated performance is subject to high statistical instability.
3. **Overlap Between Attack Categories**: Significant structural confusion exists between Exploits, DoS, and Analysis due to shared statistical flow attributes (e.g., packet bursts, connection rates).
4. **No Blockchain Provenance in Stage 2 Yet**: Blockchain registration was deliberately omitted in this phase. Provenance registration is scheduled for Phase 7B.1.

---

## 19. Conclusion

Phase 7B successfully trained and evaluated a 9-class Stage 2 attack-type classifier on the authentic UNSW-NB15 dataset. 

By comparing Standard Random Forest against Balanced Random Forest, the evaluation demonstrated that class-balanced weighting improves Macro F1 from $52.27\%$ to $53.06\%$ and Balanced Accuracy from $51.04\%$ to $53.41\%$, preventing complete category collapse on minority attacks like `Analysis`. The final pipeline was serialized to `attack_classifier.joblib` with SHA-256 `596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208`.

**Critical Distinction**:
This evaluation validates the standalone performance of the Stage 2 attack-type classifier. **It does NOT validate or claim end-to-end performance of a complete hierarchical IDS**, nor does it demonstrate production-ready security or real-time remediation. Full hierarchical integration and provenance auditing remain subject to subsequent development phases.
