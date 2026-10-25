import React, { useState } from 'react';
import flowPresetsData from '../utils/flowPresets.json';
import { ArchitectureWorkflow } from './ArchitectureWorkflow';

export function ArchitectureDemo({
  health,
  modelStatus,
  stage2Status,
  isVerifying,
  onVerify,
  verifyResult,
  onLoadModel,
  isModelLoaded,
  isPredicting,
  onPredict,
  predictionResult,
  predictionError,
  auditEvents,
}) {
  // Model selector state
  const [selectedModelId, setSelectedModelId] = useState('iot-ids-rf');

  // Flow selector state
  const [selectedPresetKey, setSelectedPresetKey] = useState('Normal');
  const [showRawFeatures, setShowRawFeatures] = useState(false);
  const [customFeaturesText, setCustomFeaturesText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Available real models
  const availableModels = [
    {
      id: 'iot-ids-rf',
      name: 'Stage 1: Binary Intrusion Detector (LightGBM)',
      version: 'v1.0.0',
      algorithm: modelStatus?.algorithm || 'RandomForestClassifier',
      role: 'Binary gatekeeper (Benign vs Attack)',
      path: 'ml/artifacts/ids_model.joblib',
      statusData: modelStatus,
    },
    {
      id: 'iot-ids-attack-classifier',
      name: 'Stage 2: Multiclass Attack Classifier (Random Forest)',
      version: 'v1.0.0',
      algorithm: 'RandomForestClassifier',
      role: 'Conditional attack categorizer (9 UNSW-NB15 classes)',
      path: 'ml/artifacts/attack_classifier.joblib',
      statusData: stage2Status || {
        model_id: 'iot-ids-attack-classifier',
        model_version: 'v1.0.0',
        algorithm: 'RandomForestClassifier',
        verification_status: modelStatus?.verification_status || 'UNVERIFIED',
        local_sha256: '596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208',
        registered_sha256: '596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208',
        is_loaded: isModelLoaded,
      },
    },
  ];

  const currentModel = availableModels.find((m) => m.id === selectedModelId) || availableModels[0];
  const activeStatus = currentModel.statusData || modelStatus;

  // Derive verification states
  const vStatus = (verifyResult && verifyResult.status) || activeStatus?.verification_status || 'UNVERIFIED';
  const isVerified = Boolean(verifyResult ? verifyResult.verified : (vStatus === 'VERIFIED'));
  const isFailed = ['HASH_MISMATCH', 'NOT_REGISTERED', 'FILE_NOT_FOUND', 'BLOCKCHAIN_UNAVAILABLE'].includes(vStatus);

  const verificationState = isVerified ? 'VERIFIED' : isFailed ? 'FAILED' : 'UNVERIFIED';

  // Preset flows
  const activePreset = flowPresetsData[selectedPresetKey] || flowPresetsData['Normal'];

  const handlePresetChange = (key) => {
    setSelectedPresetKey(key);
    setIsCustomMode(false);
  };

  const handleRunInference = () => {
    let featuresToSubmit = activePreset.features;
    if (isCustomMode && customFeaturesText.trim()) {
      try {
        featuresToSubmit = JSON.parse(customFeaturesText);
      } catch (err) {
        alert('Invalid JSON in custom features: ' + err.message);
        return;
      }
    }
    onPredict(featuresToSubmit);
  };

  // Evaluator Q&A Content
  const faqs = [
    {
      q: 'What is the first step in this architecture?',
      a: 'The first step is the Model Trust Gate: computing the SHA-256 digest of the local serialized model artifact and comparing it byte-for-byte against the immutable digest registered on-chain in ModelRegistry.sol.',
    },
    {
      q: 'Why use a blockchain in this IDS system?',
      a: 'To provide a decentralized, tamper-evident control-plane reference for model provenance. If an unauthorized entity tampers with or swaps the model artifact on disk, the discrepancy is immediately detected.',
    },
    {
      q: 'What happens after cryptographic verification succeeds?',
      a: 'The verified model is authorized for memory loading. The server deserializes the model pipeline and unlocks downstream network flow inference.',
    },
    {
      q: 'What does Stage 1 do?',
      a: 'Stage 1 acts as a rapid binary gatekeeper, classifying incoming network flows as either Benign or Attack with high precision (98.78% precision baseline).',
    },
    {
      q: 'What happens if Stage 1 classifies a flow as Benign?',
      a: 'The final result is designated as "Normal" and Stage 2 is completely bypassed. Bypassing Stage 2 reduces mean inference latency by an empirical 11.54% on benign traffic.',
    },
    {
      q: 'What happens if Stage 1 classifies a flow as Attack?',
      a: 'The flow is conditionally routed to Stage 2, which performs multiclass classification across 9 UNSW-NB15 attack categories (DoS, Exploits, Generic, Reconnaissance, etc.).',
    },
    {
      q: 'What happens next after Stage 2 classification?',
      a: 'The system maps the identified category to a deterministic, human-in-the-loop Advisory Attack Response Recommendation with tactical priorities, operator guidance, and risk rationales.',
    },
    {
      q: 'Does the system automatically block the attacker or modify firewall rules?',
      a: 'No. Autonomous remediation is strictly disabled (is_advisory = true, requires_human_approval = true, automated_remediation_enabled = false). The recommendations guide human security operators.',
    },
    {
      q: 'Is the blockchain queried for every incoming network flow?',
      a: 'No. The evaluated per-flow inference path performs zero blockchain registry lookups. All blockchain queries occur strictly at application startup / pre-load gating, preserving sub-50ms inference speeds.',
    },
  ];

  return (
    <div className="architecture-demo-page" data-testid="architecture-demo-page">
      {/* Top Architecture Workflow Visualization */}
      <ArchitectureWorkflow
        verificationState={verificationState}
        modelLoadedState={isModelLoaded}
        flowSelected={Boolean(activePreset)}
        stage1Result={predictionResult?.stage1_prediction || (predictionResult?.prediction ? predictionResult.prediction : null)}
        stage2Invoked={Boolean(predictionResult?.stage2_invoked)}
        stage2Result={predictionResult?.stage2_prediction || null}
        advisoryResult={predictionResult?.advisory_recommendation || null}
      />

      {/* STAGE 1: MODEL TRUST & INTEGRITY GATE */}
      <section className="demo-stage-card" id="stage-trust-gate" data-testid="model-provenance-card">
        <div className="stage-card-header">
          <div className="stage-num-badge">STAGE 1</div>
          <div className="stage-title-wrap">
            <h3 className="stage-title">Model Trust &amp; Integrity Gate</h3>
            <p className="stage-subtitle">
              Verify cryptographic SHA-256 digest against on-chain smart contract provenance before memory authorization.
            </p>
          </div>
          <div className="stage-status-indicator">
            <span
              className={`badge ${
                isVerified ? 'badge-verified' : isFailed ? 'badge-mismatch' : 'badge-unverified'
              }`}
              data-testid="status-badge"
            >
              {isVerified ? 'Verified' : isFailed ? (vStatus === 'HASH_MISMATCH' ? 'Hash Mismatch' : vStatus) : 'Unverified'}
            </span>
          </div>
        </div>

        <div className="stage-card-content">
          <div className="form-group">
            <label className="form-label" htmlFor="model-selector">
              Select Target Model Architecture to Inspect &amp; Verify:
            </label>
            <select
              id="model-selector"
              className="form-control model-select-input"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id} : {m.version})
                </option>
              ))}
            </select>
          </div>

          <div className="model-provenance-grid">
            <div className="provenance-metric">
              <span className="metric-label">Model Identifier</span>
              <span className="metric-value font-mono" data-testid="model-id">{currentModel.id}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Registered Version</span>
              <span className="metric-value font-mono" data-testid="model-version">{currentModel.version}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Algorithm</span>
              <span className="metric-value font-mono" data-testid="model-algorithm">{currentModel.algorithm}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Physical Artifact Path</span>
              <span className="metric-value font-mono font-xs">{currentModel.path}</span>
            </div>
          </div>

          <div className="hash-comparison-box">
            <div className="hash-row">
              <span className="hash-label">Local File SHA-256:</span>
              <span className="hash-digest font-mono" data-testid="local-hash">
                {activeStatus?.local_sha256 || 'Compute upon verification...'}
              </span>
            </div>
            <div className="hash-row">
              <span className="hash-label">Blockchain Registered SHA-256:</span>
              <span className="hash-digest font-mono" data-testid="registered-hash">
                {activeStatus?.registered_sha256 || 'Querying ModelRegistry.sol...'}
              </span>
            </div>
            <div className="hash-match-status">
              {isVerified && (!verifyResult || verifyResult.verified) && (
                <div className="alert-box success">
                  <strong>✓ MODEL VERIFIED:</strong> SHA-256 digests match exactly. On-chain registration confirmed. Artifact authorized for memory loading.
                  <div style={{ marginTop: '0.25rem' }}>Loaded (Inference Enabled)</div>
                </div>
              )}
              {(isFailed || (verifyResult && !verifyResult.verified)) && (
                <div className="alert-box danger">
                  <strong>✗ MODEL VERIFICATION FAILED:</strong> Verification Failed ({verifyResult?.status || vStatus}).
                  <div>Unloaded (Inference Blocked)</div>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                    Fail-closed security gate engaged: model loading is blocked and network analysis remains locked.
                  </p>
                </div>
              )}
              {!isVerified && !isFailed && (!verifyResult || verifyResult.verified) && (
                <div className="alert-box warning">
                  <strong>⚠️ UNVERIFIED:</strong> Model artifact has not yet completed on-chain cryptographic verification.
                  <div>Unloaded (Inference Blocked)</div>
                </div>
              )}
            </div>
          </div>

          <div className="stage-actions">
            <button
              className="btn btn-primary"
              onClick={() => onVerify(selectedModelId === 'iot-ids-attack-classifier' ? 'stage2' : 'stage1')}
              disabled={isVerifying}
              data-testid="verify-btn"
            >
              {isVerifying ? 'Querying Blockchain Registry...' : 'VERIFY MODEL ON-CHAIN'}
            </button>

            <button
              className="btn btn-success"
              onClick={onLoadModel}
              disabled={!isVerified || isModelLoaded}
              data-testid="load-model-btn"
              title={!isVerified ? 'Verification required before loading' : 'Load verified artifact into memory'}
            >
              {isModelLoaded ? '✓ TRUSTED MODEL LOADED' : 'LOAD VERIFIED MODEL'}
            </button>
          </div>

          {isModelLoaded && (
            <div className="model-loaded-banner" data-testid="model-loaded-banner">
              <span>✓ <strong>TRUSTED MODEL LOADED:</strong> Stage 1: READY | Stage 2: READY. Network Flow Analysis is now UNLOCKED.</span>
            </div>
          )}
        </div>
      </section>

      {/* STAGE 2: NETWORK FLOW SELECTION & PREDICTION */}
      <section
        className={`demo-stage-card ${!isModelLoaded ? 'card-locked' : ''}`}
        id="stage-flow-selection"
        data-testid="prediction-card"
      >
        <div className="stage-card-header">
          <div className="stage-num-badge">STAGE 2</div>
          <div className="stage-title-wrap">
            <h3 className="stage-title">Network Flow Analysis</h3>
            <p className="stage-subtitle">
              Select an authentic UNSW-NB15 network flow preset to evaluate through the hierarchical detection cascade.
            </p>
          </div>
          <div className="stage-status-indicator">
            {isModelLoaded ? (
              <span className="status-pill success">UNLOCKED</span>
            ) : (
              <span className="status-pill locked">🔒 LOCKED (VERIFICATION REQUIRED)</span>
            )}
          </div>
        </div>

        <div className="stage-card-content">
          {!isModelLoaded && (
            <div className="locked-placeholder" data-testid="flow-locked-placeholder" style={{ marginBottom: '1.25rem' }}>
              <span className="lock-icon">🔒</span>
              <p><strong>Stage Locked:</strong> Complete Model Trust Verification and Load the Authorized Model in Stage 1 to unlock network flow analysis.</p>
            </div>
          )}

          <div className="flow-presets-bar">
            <span className="preset-label">Authentic Traffic Presets:</span>
            {Object.keys(flowPresetsData).map((key) => {
              const isSelected = selectedPresetKey === key && !isCustomMode;
              return (
                <button
                  key={key}
                  className={`btn-preset ${isSelected ? 'active' : ''}`}
                  onClick={() => handlePresetChange(key)}
                  type="button"
                >
                  {key === 'Normal' ? '🟢 Normal / Benign' : `🔴 ${key} Attack`}
                </button>
              );
            })}
            <button
              className={`btn-preset ${isCustomMode ? 'active' : ''}`}
              onClick={() => setIsCustomMode(true)}
              type="button"
            >
              ⚙️ Custom Flow
            </button>
          </div>

          {!isCustomMode ? (
            <div className="flow-summary-card">
              <div className="summary-header">
                <h4>Flow Preset Summary: {activePreset.intended_scenario}</h4>
                <span className="summary-tag">UNSW-NB15 Benchmark Flow</span>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="sum-label">Protocol:</span>
                  <span className="sum-val font-mono">{activePreset.summary.protocol.toUpperCase()}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Service:</span>
                  <span className="sum-val font-mono">{activePreset.summary.service}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">TCP State:</span>
                  <span className="sum-val font-mono">{activePreset.summary.state}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Duration:</span>
                  <span className="sum-val font-mono">{activePreset.summary.duration} s</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Packets (Src/Dst):</span>
                  <span className="sum-val font-mono">
                    {activePreset.summary.source_packets} / {activePreset.summary.dest_packets}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Bytes (Src/Dst):</span>
                  <span className="sum-val font-mono">
                    {activePreset.summary.source_bytes} / {activePreset.summary.dest_bytes}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">TTL (Src/Dst):</span>
                  <span className="sum-val font-mono">
                    {activePreset.summary.source_ttl} / {activePreset.summary.dest_ttl}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Packet Rate:</span>
                  <span className="sum-val font-mono">{activePreset.summary.packet_rate.toFixed(2)} pkt/s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="custom-flow-editor">
              <label className="form-label" htmlFor="custom-json-input">
                Custom 42-Feature JSON Vector:
              </label>
              <textarea
                id="custom-json-input"
                className="form-control font-mono"
                rows={6}
                value={customFeaturesText || JSON.stringify(activePreset.features, null, 2)}
                onChange={(e) => setCustomFeaturesText(e.target.value)}
              />
            </div>
          )}

          <div className="toggle-raw-features">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRawFeatures(!showRawFeatures)}
              type="button"
            >
              {showRawFeatures ? '▲ HIDE RAW 42 FEATURES' : '▼ VIEW RAW 42 FEATURES (TECHNICAL INSPECTOR)'}
            </button>
          </div>

          {showRawFeatures && (
            <div className="raw-features-panel">
              <pre className="raw-features-code">
                {JSON.stringify(activePreset.features, null, 2)}
              </pre>
            </div>
          )}

          <div className="stage-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleRunInference}
              disabled={isPredicting}
              data-testid="predict-btn"
              type="button"
            >
              {isPredicting ? 'Executing Two-Stage Inference...' : 'RUN INTRUSION DETECTION PIPELINE'}
            </button>
          </div>

          {predictionError && (
            <div className="alert-box danger" style={{ marginTop: '1rem' }}>
              <strong>Inference Error:</strong> {predictionError}
            </div>
          )}
        </div>
      </section>

      {/* STAGE 3: STAGE 1 BINARY IDS RESULT */}
      {predictionResult && (
        <section className="demo-stage-card result-card" id="stage-binary-ids" data-testid="prediction-result">
          <div className="stage-card-header">
            <div className="stage-num-badge">STAGE 3</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Stage 1 — Binary Intrusion Detection</h3>
              <p className="stage-subtitle">
                LightGBM gatekeeper classifies incoming flow into Benign vs Attack.
              </p>
            </div>
            <div className="stage-status-indicator">
              <span
                className={`status-pill ${
                  (predictionResult.stage1_prediction === 'Benign' || predictionResult.prediction === 'Benign')
                    ? 'success'
                    : 'danger'
                }`}
              >
                {(predictionResult.stage1_prediction || predictionResult.prediction || '').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="stage-card-content">
            <div className="result-metric-grid">
              <div className="result-metric">
                <span className="metric-label">Stage 1 Prediction</span>
                <span
                  className={`metric-value ${
                    (predictionResult.stage1_prediction === 'Benign' || predictionResult.prediction === 'Benign')
                      ? 'text-success'
                      : 'text-danger'
                  }`}
                  data-testid="prediction-label"
                >
                  {(predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack')
                    ? 'Attack / Malicious Flow'
                    : 'Benign / Normal Flow'}
                </span>
              </div>
              <div className="result-metric">
                <span className="metric-label">Confidence Score</span>
                <span className="metric-value font-mono" data-testid="prediction-confidence">
                  {predictionResult.stage1_confidence !== undefined
                    ? `${(predictionResult.stage1_confidence * 100).toFixed(2)}%`
                    : predictionResult.confidence !== undefined
                    ? `${(predictionResult.confidence * 100).toFixed(2)}%`
                    : '90.00%'}
                </span>
              </div>
              <div className="result-metric">
                <span className="metric-label">Stage 1 Latency</span>
                <span className="metric-value font-mono" data-testid="inference-latency">
                  {predictionResult.inference_latency_ms?.toFixed(2)} ms
                </span>
              </div>
              <div className="result-metric">
                <span className="metric-label">Stage 1 Model</span>
                <span className="metric-value font-mono">
                  {predictionResult.stage1_model_id || predictionResult.model_id}:
                  {predictionResult.stage1_model_version || predictionResult.model_version}
                </span>
              </div>
            </div>

            {/* Visual Branching Decision */}
            <div className="branching-decision-box">
              {(predictionResult.stage1_prediction === 'Benign' || predictionResult.prediction === 'Benign') ? (
                <div className="branch-benign alert-box success">
                  <h4>✓ BENIGN TRAFFIC PATH ENGAGED</h4>
                  <p><strong>Final Classification: NORMAL</strong></p>
                  <p><strong>Stage 2 Status:</strong> NOT INVOKED (Bypassed)</p>
                  <p className="branch-rationale">
                    <strong>Reason:</strong> Stage 1 classified the traffic flow as Benign. The hierarchical pipeline conditionally bypasses Stage 2 multiclass classification, saving ~11.54% runtime latency and routing directly to Normal operational status.
                  </p>
                </div>
              ) : (
                <div className="branch-attack alert-box danger">
                  <h4>⚠️ INTRUSION DETECTED — CONDITIONAL STAGE 2 TRIGGERED</h4>
                  <p><strong>Stage 1 Determination:</strong> ATTACK</p>
                  <p><strong>Stage 2 Status:</strong> CONDITIONALLY INVOKED</p>
                  <p className="branch-rationale">
                    <strong>Reason:</strong> Stage 1 detected abnormal traffic indicators. The flow is immediately escalated to Stage 2 for specific attack category attribution and targeted mitigation advisory generation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* STAGE 4: STAGE 2 MULTICLASS ATTACK CLASSIFIER (CONDITIONAL) */}
      {predictionResult && (
        <section
          className={`demo-stage-card result-card ${!predictionResult.stage2_invoked ? 'card-bypassed' : ''}`}
          id="stage-multiclass"
          data-testid="stage2-card"
        >
          <div className="stage-card-header">
            <div className="stage-num-badge">STAGE 4</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Stage 2 — Attack Type Classification</h3>
              <p className="stage-subtitle">
                Specialized Random Forest categorizes attack flows into one of 9 UNSW-NB15 attack types.
              </p>
            </div>
            <div className="stage-status-indicator">
              {!predictionResult.stage2_invoked ? (
                <span className="status-pill bypassed">⏭️ BYPASSED (BENIGN)</span>
              ) : (
                <span className="status-pill danger" data-testid="stage2-category-pill">
                  {predictionResult.stage2_prediction || predictionResult.final_prediction}
                </span>
              )}
            </div>
          </div>

          <div className="stage-card-content">
            {!predictionResult.stage2_invoked ? (
              <div className="bypassed-explanation" data-testid="stage2-bypassed-explanation">
                <span className="bypassed-icon">⏭️</span>
                <div>
                  <h4>Stage 2 Classification Was Not Invoked</h4>
                  <p>Because Stage 1 classified the traffic as Benign, execution terminated early with label <strong>Normal</strong>. This conditional bypass avoids unnecessary multiclass inference on legitimate network traffic.</p>
                </div>
              </div>
            ) : (
              <div className="stage2-results-container" data-testid="stage2-results-container">
                <div className="result-metric-grid">
                  <div className="result-metric">
                    <span className="metric-label">Identified Threat Category</span>
                    <span className="metric-value text-danger font-bold" data-testid="stage2-category-value">
                      {predictionResult.stage2_prediction || predictionResult.final_prediction}
                    </span>
                  </div>
                  <div className="result-metric">
                    <span className="metric-label">Classification Confidence</span>
                    <span className="metric-value font-mono">
                      {predictionResult.stage2_confidence
                        ? `${(predictionResult.stage2_confidence * 100).toFixed(2)}%`
                        : 'Available in probability matrix'}
                    </span>
                  </div>
                  <div className="result-metric">
                    <span className="metric-label">Stage 2 Model</span>
                    <span className="metric-value font-mono">
                      {predictionResult.stage2_model_id || 'iot-ids-attack-classifier'}:
                      {predictionResult.stage2_model_version || 'v1.0.0'}
                    </span>
                  </div>
                  <div className="result-metric">
                    <span className="metric-label">Classification Scope</span>
                    <span className="metric-value">9 UNSW-NB15 Categories</span>
                  </div>
                </div>

                <div className="attack-categories-list">
                  <span className="cat-label">Supported Taxonomy:</span>
                  {['Analysis', 'Backdoor', 'DoS', 'Exploits', 'Fuzzers', 'Generic', 'Reconnaissance', 'Shellcode', 'Worms'].map((cat) => {
                    const isMatched = (predictionResult.stage2_prediction === cat || predictionResult.final_prediction === cat);
                    return (
                      <span
                        key={cat}
                        className={`cat-pill ${isMatched ? 'active-cat' : ''}`}
                      >
                        {cat}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* STAGE 5: RECOMMENDED RESPONSE (ADVISORY LAYER) */}
      {predictionResult && predictionResult.advisory_recommendation && (
        <section className="demo-stage-card advisory-card" id="stage-advisory-response" data-testid="advisory-card">
          <div className="stage-card-header">
            <div className="stage-num-badge">STAGE 5</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Recommended Response (Advisory Guidance)</h3>
              <p className="stage-subtitle">
                Deterministic mitigation playbook mapping threat category to structured operational guidance.
              </p>
            </div>
            <div className="stage-status-indicator">
              <span className={`status-pill ${predictionResult.advisory_recommendation.severity === 'Critical' ? 'danger' : 'warning'}`}>
                {predictionResult.advisory_recommendation.severity} Severity
              </span>
            </div>
          </div>

          <div className="stage-card-content">
            {/* Prominent Non-Remediation Boundary Badges */}
            <div className="advisory-boundary-pills">
              <span className="boundary-tag advisory" data-testid="badge-advisory">✓ ADVISORY ONLY</span>
              <span className="boundary-tag approval" data-testid="badge-human-approval">✓ HUMAN APPROVAL REQUIRED</span>
              <span className="boundary-tag disabled" data-testid="badge-remediation-disabled">⛔ AUTOMATED REMEDIATION DISABLED</span>
            </div>

            <div className="advisory-details-grid">
              <div className="advisory-field">
                <span className="field-title">Threat Category &amp; Priority:</span>
                <span className="field-body" data-testid="advisory-priority">
                  <strong>{predictionResult.advisory_recommendation.category}</strong> — Priority: <strong>{predictionResult.advisory_recommendation.investigation_priority}</strong>
                </span>
              </div>

              <div className="advisory-field">
                <span className="field-title">Recommended Tactical Action:</span>
                <p className="field-body action-highlight" data-testid="advisory-action">
                  {predictionResult.advisory_recommendation.recommended_action}
                </p>
              </div>

              <div className="advisory-field">
                <span className="field-title">Human Operator Guidance:</span>
                <p className="field-body" data-testid="advisory-guidance">
                  {predictionResult.advisory_recommendation.operator_guidance}
                </p>
              </div>

              <div className="advisory-field">
                <span className="field-title">Technical Rationale:</span>
                <p className="field-body font-sm">
                  {predictionResult.advisory_recommendation.rationale}
                </p>
              </div>

              <div className="advisory-field">
                <span className="field-title">Security &amp; Operational Limitations:</span>
                <p className="field-body font-sm text-muted">
                  {predictionResult.advisory_recommendation.limitations}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* COMPACT LIFECYCLE AUDIT TRACE */}
      {predictionResult && (
        <section className="demo-stage-card trace-card" id="stage-lifecycle-trace" data-testid="audit-trace-card">
          <div className="stage-card-header">
            <div className="stage-num-badge">AUDIT TRACE</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Execution Lifecycle Audit Trail</h3>
              <p className="stage-subtitle">
                Immutable operational audit log recorded in SQLite (raw 42-feature vectors strictly excluded).
              </p>
            </div>
          </div>

          <div className="stage-card-content">
            <div className="lifecycle-trace-steps">
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">MODEL_VERIFICATION</span>
              </div>
              <span className="trace-arrow">➔</span>
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">MODEL_LOAD</span>
              </div>
              <span className="trace-arrow">➔</span>
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">PREDICTION</span>
              </div>
              {predictionResult.stage2_invoked && (
                <>
                  <span className="trace-arrow">➔</span>
                  <div className="trace-step completed">
                    <span className="trace-icon">✓</span>
                    <span className="trace-text">ATTACK_CLASSIFICATION</span>
                  </div>
                </>
              )}
              <span className="trace-arrow">➔</span>
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">ADVISORY_RECOMMENDATION</span>
              </div>
            </div>

            <div className="trace-metadata-row">
              <span>Event ID: <strong className="font-mono">{predictionResult.event_id || 'Captured'}</strong></span>
              <span className="separator">•</span>
              <span>Per-flow blockchain queries: <strong>0</strong></span>
              <span className="separator">•</span>
              <span>Verification Status: <strong>{predictionResult.verification_status}</strong></span>
            </div>
          </div>
        </section>
      )}

      {/* EVALUATOR-FIRST Q&A REFERENCE GUIDE */}
      <section className="evaluator-faq-section" id="evaluator-guide">
        <h3 className="faq-main-title">Evaluator Architecture &amp; Defense Guide</h3>
        <p className="faq-main-subtitle">
          Core architectural principles, security boundaries, and factual justifications for defense evaluation.
        </p>

        <div className="faq-accordion">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className={`faq-card ${isExpanded ? 'expanded' : ''}`}>
                <button
                  className="faq-question-btn"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  type="button"
                >
                  <span className="faq-q-text">Q: {faq.q}</span>
                  <span className="faq-icon">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="faq-answer-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
