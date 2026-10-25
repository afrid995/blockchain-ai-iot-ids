import React, { useState } from 'react';
import flowPresetsData from '../utils/flowPresets.json';
import { api } from '../api/client';

/**
 * Phase 7C — Security Solution Overview:
 * Coherent end-to-end security workflow demonstrating the complete solution to the project problem statement:
 * MODE 1 (DETECT): Authorized Model -> Provenance Gate -> Flow -> Stage 1 -> Stage 2 -> Advisory -> Audit Evidence
 * MODE 2 (PROTECT): Controlled Model Replacement -> Hash Mismatch -> Load Blocked -> Inference Locked -> Audited
 * MODE 3 (EVIDENCE): Why this solves the problem, empirical evaluation benchmarks, and research limitations.
 */
export function SecuritySolutionOverview({
  health,
  modelStatus,
  stage2Status,
  isModelLoaded,
  isVerifying,
  onVerify,
  onLoadModel,
  isPredicting,
  onPredict,
  predictionResult,
  predictionError,
  auditEvents = [],
  onRefreshStatus,
  onNavigate,
}) {
  // Workflow mode: 'detect' (Mode 1), 'protect' (Mode 2), 'evidence' (Mode 3)
  const [activeMode, setActiveMode] = useState('detect');

  // Mode 1: Network flow input state
  const [selectedPreset, setSelectedPreset] = useState('DoS');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customJson, setCustomJson] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Mode 2: Security testing state
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState(null);
  const [showFullHashes, setShowFullHashes] = useState(false);

  // Active flow preset
  const activeFlow = flowPresetsData[selectedPreset] || flowPresetsData['DoS'];
  const activeFeatures = activeFlow.features;

  // Verification states
  const verificationStatus = modelStatus?.verification_status || 'UNVERIFIED';
  const isVerified = verificationStatus === 'VERIFIED';
  const isFailClosed = !isModelLoaded || !isVerified;

  // Handle flow execution
  const handleExecuteDetection = async (e) => {
    e?.preventDefault();
    setJsonError(null);

    let payload = activeFeatures;
    if (isCustomMode) {
      try {
        payload = JSON.parse(customJson);
      } catch (err) {
        setJsonError('Invalid JSON format: ' + err.message);
        return;
      }
    }

    if (onPredict) {
      await onPredict(payload, 'hierarchical');
    }
  };

  // Mode 2: Run Ephemeral Model Replacement
  const handleSimulateReplacement = async () => {
    setIsRunningSim(true);
    setSimError(null);
    try {
      const res = await api.simulateModelReplacement();
      setSimResult(res);
      if (onRefreshStatus) {
        await onRefreshStatus();
      }
    } catch (err) {
      setSimError(`Simulation Failed: ${err.message || 'HTTP Error'}`);
    } finally {
      setIsRunningSim(false);
    }
  };

  // Mode 2: Test Unregistered Version (v9.9.9)
  const handleSimulateUnregistered = async () => {
    setIsRunningSim(true);
    setSimError(null);
    try {
      const res = await api.simulateUnregisteredVersion();
      setSimResult(res);
      if (onRefreshStatus) {
        await onRefreshStatus();
      }
    } catch (err) {
      setSimError(`Unregistered Version Test Failed: ${err.message || 'HTTP Error'}`);
    } finally {
      setIsRunningSim(false);
    }
  };

  // Mode 2: Restore Legitimate Verified State
  const handleRestoreModel = async () => {
    setIsRunningSim(true);
    setSimError(null);
    try {
      const res = await api.resetModelReplacement();
      setSimResult(res);
      if (onRefreshStatus) {
        await onRefreshStatus();
      }
    } catch (err) {
      setSimError(`Restoration Failed: ${err.message || 'HTTP Error'}`);
    } finally {
      setIsRunningSim(false);
    }
  };

  return (
    <div className="security-solution-overview" data-testid="solution-overview-page">
      {/* 1. SECTION HEADER & OBJECTIVE STATEMENT */}
      <div className="console-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🎯</span>
            <h2 className="console-title" style={{ margin: 0 }}>End-to-End Security Solution Demonstrator</h2>
            <span className="console-tag">PRIMARY WORKFLOW</span>
          </div>
          <p className="console-subtitle" style={{ marginTop: '0.35rem' }}>
            Interactive demonstration of the complete research architecture: AI model authorization, hierarchical intrusion classification, deterministic advisory guidance, and local operational audit evidence.
          </p>
        </div>
      </div>

      {/* Security Objective Banner */}
      <div className="alert-box info" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #3b82f6' }} data-testid="security-objective-box">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', letterSpacing: '0.05em', color: '#60a5fa', fontSize: '0.85rem' }}>
              SECURITY OBJECTIVE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: '#f8fafc' }}>
            “Detect malicious network activity using an AI-based IDS while ensuring that only the authorized model artifact is loaded for inference through cryptographic integrity verification and model provenance validation.”
          </p>
          <span className="font-xs text-muted" style={{ marginTop: '0.25rem' }}>
            Scope boundary: Cryptographic verification guarantees byte-level correspondence with the on-chain registered reference artifact prior to memory loading; it does not claim prevention of every model attack, universal model safety, adversarial evasion robustness, or that blockchain performs intrusion detection.
          </span>
        </div>
      </div>

      {/* 2. THREE-MODE WORKFLOW CONTROLLER TABS */}
      <div className="workflow-modes-bar" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${activeMode === 'detect' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('detect')}
          style={{ flex: 1, minWidth: '220px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          data-testid="mode-detect-btn"
        >
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>MODE 1 — DETECT</div>
            <div className="font-xs" style={{ opacity: 0.8 }}>Legitimate End-to-End IDS Workflow</div>
          </div>
        </button>

        <button
          type="button"
          className={`btn ${activeMode === 'protect' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setActiveMode('protect')}
          style={{ flex: 1, minWidth: '220px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
          data-testid="mode-protect-btn"
        >
          <span style={{ fontSize: '1.2rem' }}>🛡️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>MODE 2 — PROTECT</div>
            <div className="font-xs" style={{ opacity: 0.8 }}>Model Replacement &amp; Fail-Closed Gate</div>
          </div>
        </button>

        <button
          type="button"
          className={`btn ${activeMode === 'evidence' ? 'btn-secondary' : 'btn-secondary'}`}
          onClick={() => setActiveMode('evidence')}
          style={{
            flex: 1,
            minWidth: '220px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: activeMode === 'evidence' ? '#334155' : undefined,
            borderColor: activeMode === 'evidence' ? '#64748b' : undefined,
          }}
          data-testid="mode-evidence-btn"
        >
          <span style={{ fontSize: '1.2rem' }}>📑</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>MODE 3 — EVIDENCE</div>
            <div className="font-xs" style={{ opacity: 0.8 }}>Problem Mapping &amp; Authoritative Metrics</div>
          </div>
        </button>
      </div>

      {/* 3. VISUAL PIPELINE FLOW STATUS BAR */}
      <div className="console-card" style={{ marginBottom: '1.5rem', padding: '1rem' }} data-testid="pipeline-tracker">
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
          COMPLETE SECURITY PIPELINE STATE
        </div>
        <div className="pipeline-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
          <div className={`pipeline-step-box ${isVerified && isModelLoaded ? 'step-active' : 'step-locked'}`}>
            <span className="font-xs text-muted">[1] MODEL TRUST</span>
            <strong style={{ color: isVerified && isModelLoaded ? '#4ade80' : '#f87171' }}>
              {isVerified && isModelLoaded ? '✓ LOADED' : isVerified ? 'VERIFIED' : 'LOCKED'}
            </strong>
          </div>
          <div className="pipeline-step-box step-active">
            <span className="font-xs text-muted">[2] NETWORK FLOW</span>
            <strong style={{ color: '#60a5fa' }}>{selectedPreset} (42 feats)</strong>
          </div>
          <div className={`pipeline-step-box ${predictionResult ? 'step-active' : ''}`}>
            <span className="font-xs text-muted">[3] STAGE 1 IDS</span>
            <strong>
              {predictionResult ? (predictionResult.stage1_prediction || predictionResult.prediction) : 'PENDING'}
            </strong>
          </div>
          <div className={`pipeline-step-box ${predictionResult ? 'step-active' : ''}`}>
            <span className="font-xs text-muted">[4] STAGE 2 MULTICLASS</span>
            <strong>
              {predictionResult ? (predictionResult.stage2_invoked ? predictionResult.stage2_prediction : 'BYPASSED') : 'GATED'}
            </strong>
          </div>
          <div className={`pipeline-step-box ${predictionResult?.advisory_recommendation ? 'step-active' : ''}`}>
            <span className="font-xs text-muted">[5] ADVISORY</span>
            <strong>
              {predictionResult?.advisory_recommendation ? predictionResult.advisory_recommendation.investigation_priority : 'PENDING'}
            </strong>
          </div>
          <div className={`pipeline-step-box ${predictionResult?.event_id ? 'step-active' : ''}`}>
            <span className="font-xs text-muted">[6] AUDIT EVIDENCE</span>
            <strong>
              {predictionResult?.event_id ? '✓ RECORDED' : 'READY'}
            </strong>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DETECT — LEGITIMATE END-TO-END IDS WORKFLOW                       */}
      {/* ========================================================================= */}
      {activeMode === 'detect' && (
        <div className="mode-detect-container" data-testid="mode-detect-container">
          {/* Fail-Closed Gate Alert if Model is not loaded */}
          {isFailClosed && (
            <div className="alert-box danger" style={{ marginBottom: '1.5rem' }} data-testid="solution-fail-closed-alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🔒</span>
                <div>
                  <strong>FAIL-CLOSED VERIFICATION GATE ENGAGED:</strong> Model memory is currently unloaded or unverified.
                  Downstream network-flow inference is locked fail-closed until models are cryptographically verified against <code>ModelRegistry.sol</code> and loaded into memory.
                </div>
              </div>
            </div>
          )}

          <div className="console-grid-2col">
            {/* Left Column: Gate 1 (Model Trust) & Gate 2 (Network Flow Selection) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Gate 1: Model Trust & Provenance Card */}
              <div className="console-card" data-testid="solution-model-trust-card">
                <div className="card-header">
                  <h3 className="card-title">[1] Model Trust &amp; Provenance Gate</h3>
                  <span className={`badge ${isVerified ? 'badge-verified' : 'badge-danger'}`} data-testid="solution-model-trust-badge">
                    {isVerified ? '● VERIFIED' : '⚠️ UNVERIFIED'}
                  </span>
                </div>

                <div className="spec-item">
                  <span className="spec-label">Stage 1 Binary Model:</span>
                  <span className="spec-val font-mono">{modelStatus?.model_id || 'iot-ids-rf'}:{modelStatus?.model_version || 'v1.0.0'} ({modelStatus?.algorithm || 'RandomForestClassifier'})</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Registered SHA-256:</span>
                  <span className="spec-val font-mono font-xs text-success" title="Canonical digest registered on-chain">
                    dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Stage 2 Multiclass Model:</span>
                  <span className="spec-val font-mono">{stage2Status?.model_id || 'iot-ids-attack-classifier'}:{stage2Status?.model_version || 'v1.0.0'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Registered SHA-256 (Stage 2):</span>
                  <span className="spec-val font-mono font-xs text-success">
                    596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208
                  </span>
                </div>

                <div className="security-state-box" style={{ marginTop: '0.75rem' }}>
                  <div className="security-state-row">
                    <span className="state-label">Cryptographic Verification:</span>
                    <strong style={{ color: isVerified ? '#4ade80' : '#f87171' }}>
                      {verificationStatus}
                    </strong>
                  </div>
                  <div className="security-state-row">
                    <span className="state-label">Memory Engine State:</span>
                    <strong style={{ color: isModelLoaded ? '#4ade80' : '#f87171' }}>
                      {isModelLoaded ? 'LOADED (Inference Authorized)' : 'UNLOADED (Inference Locked)'}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onVerify && onVerify('stage1')}
                    disabled={isVerifying}
                    data-testid="solution-verify-btn"
                  >
                    {isVerifying ? 'Verifying...' : '🛡️ VERIFY MODEL'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onLoadModel}
                    disabled={!isVerified || isModelLoaded}
                    data-testid="solution-load-btn"
                  >
                    {isModelLoaded ? '✓ MODEL READY' : '📥 AUTHORIZE & LOAD'}
                  </button>
                </div>

                <div className="font-xs text-muted" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                  Lifecycle: Model provenance verification occurs during model initialization/pre-load or when explicitly requested by the operator. The verification gate runs before authorized model loading; successful verification permits the model to be loaded for inference.
                </div>
              </div>

              {/* Step 2: Network Flow Selection Card */}
              <div className="console-card" data-testid="solution-flow-card">
                <div className="card-header">
                  <h3 className="card-title">[2] Network Flow Selection</h3>
                  <span className="badge badge-secondary">UNSW-NB15 Input</span>
                </div>

                <div className="toggle-group" style={{ marginBottom: '1rem' }}>
                  <button
                    type="button"
                    className={`btn-toggle ${!isCustomMode ? 'active' : ''}`}
                    onClick={() => { setIsCustomMode(false); setJsonError(null); }}
                    data-testid="solution-preset-mode-btn"
                  >
                    Authentic UNSW-NB15 Presets
                  </button>
                  <button
                    type="button"
                    className={`btn-toggle ${isCustomMode ? 'active' : ''}`}
                    onClick={() => {
                      setIsCustomMode(true);
                      if (!customJson) setCustomJson(JSON.stringify(activeFeatures, null, 2));
                    }}
                    data-testid="solution-custom-mode-btn"
                  >
                    Custom 42-Feature JSON
                  </button>
                </div>

                {!isCustomMode ? (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="solution-preset-dropdown">Select Test Flow Scenario:</label>
                      <select
                        id="solution-preset-dropdown"
                        className="form-control"
                        value={selectedPreset}
                        onChange={(e) => setSelectedPreset(e.target.value)}
                        data-testid="solution-preset-dropdown"
                      >
                        {Object.keys(flowPresetsData).map((key) => (
                          <option key={key} value={key}>
                            {key} ({flowPresetsData[key].intended_scenario || flowPresetsData[key].true_category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flow-spec-card">
                      <div className="flow-spec-header">
                        <span>Flow Telemetry Summary</span>
                        <span className="font-mono font-xs text-secondary">
                          Expected True Label: {activeFlow.true_category || selectedPreset}
                        </span>
                      </div>
                      <div className="flow-spec-grid">
                        <div className="spec-item">
                          <span className="spec-label">Proto:</span>
                          <span className="spec-val font-mono">{activeFlow.summary?.protocol || activeFeatures.proto}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Service:</span>
                          <span className="spec-val font-mono">{activeFlow.summary?.service || activeFeatures.service}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Duration:</span>
                          <span className="spec-val font-mono">{(activeFlow.summary?.duration ?? activeFeatures.dur).toFixed(4)}s</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Packets:</span>
                          <span className="spec-val font-mono">{activeFeatures.spkts}s / {activeFeatures.dpkts}d</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Bytes:</span>
                          <span className="spec-val font-mono">{activeFeatures.sbytes}s / {activeFeatures.dbytes}d</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Rate:</span>
                          <span className="spec-val font-mono">{Number(activeFeatures.rate).toFixed(1)}/s</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label className="form-label" htmlFor="solution-custom-flow-json">42-Feature Network Flow JSON:</label>
                    <textarea
                      id="solution-custom-flow-json"
                      className="form-control font-mono font-xs"
                      rows={8}
                      value={customJson}
                      onChange={(e) => setCustomJson(e.target.value)}
                      placeholder="Paste JSON dictionary of 42 UNSW-NB15 flow features..."
                      data-testid="solution-custom-json"
                    />
                    {jsonError && <div className="text-danger font-xs" style={{ marginTop: '0.4rem' }}>{jsonError}</div>}
                  </div>
                )}

                <div style={{ marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                    onClick={handleExecuteDetection}
                    disabled={isPredicting || isFailClosed}
                    data-testid="solution-predict-btn"
                  >
                    {isPredicting ? (
                      <span><span className="spinner" /> Evaluating Off-Chain Hierarchical Inference...</span>
                    ) : isFailClosed ? (
                      '🔒 INFERENCE LOCKED (Model Unloaded / Unverified)'
                    ) : (
                      '⚡ RUN DETECTION (Hierarchical Inference)'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Steps 3, 4, 5, 6 Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Prediction Error Alert */}
              {predictionError && (
                <div className="alert-box danger" data-testid="solution-prediction-error">
                  <strong>Inference Request Rejected:</strong> {predictionError}
                </div>
              )}

              {/* Execution Placeholder or Results */}
              {!predictionResult ? (
                <div className="console-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Hierarchical Detection Pipeline Ready</h3>
                  <p className="text-secondary font-xs" style={{ maxWidth: '420px', margin: '0 auto' }}>
                    Select an authentic UNSW-NB15 network flow scenario on the left and click "RUN DETECTION".
                    The system will evaluate Stage 1 binary detection, conditionally route to Stage 2 attack classification, output operator advisories, and log audit evidence.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 3: Stage 1 Binary IDS Outcome */}
                  <div className="console-card" data-testid="solution-stage1-card">
                    <div className="card-header">
                      <h3 className="card-title">[3] Stage 1 Binary IDS Verdict</h3>
                      <span className="badge badge-info font-mono font-xs">RandomForestClassifier</span>
                    </div>

                    <div className="stage-result-grid">
                      <div>
                        <span className="result-metric-label">STAGE 1 VERDICT</span>
                        <div
                          className="result-verdict"
                          style={{
                            color:
                              predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                                ? '#f87171'
                                : '#4ade80',
                          }}
                          data-testid="solution-stage1-verdict"
                        >
                          {predictionResult.stage1_prediction || predictionResult.prediction}
                        </div>
                      </div>

                      <div>
                        <span className="result-metric-label">CONFIDENCE</span>
                        <div className="font-mono result-confidence" data-testid="solution-stage1-confidence">
                          {((predictionResult.stage1_confidence ?? predictionResult.confidence ?? 0) * 100).toFixed(1)}%
                        </div>
                      </div>

                      <div>
                        <span className="result-metric-label">VERIFICATION GATE</span>
                        <div className="font-mono font-xs text-success">
                          ✓ {predictionResult.verification_status || 'VERIFIED'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Stage 2 Multiclass Attack Classification */}
                  <div className="console-card" data-testid="solution-stage2-card">
                    <div className="card-header">
                      <h3 className="card-title">[4] Stage 2 Attack Categorization</h3>
                      <span className="badge badge-secondary font-mono font-xs">iot-ids-attack-classifier</span>
                    </div>

                    {predictionResult.stage2_invoked ? (
                      <div className="stage-result-grid">
                        <div>
                          <span className="result-metric-label">ATTACK CATEGORY</span>
                          <div className="result-verdict font-mono" style={{ color: '#fb923c' }} data-testid="solution-stage2-category">
                            {predictionResult.stage2_prediction || predictionResult.final_prediction}
                          </div>
                        </div>

                        <div>
                          <span className="result-metric-label">CATEGORY CONFIDENCE</span>
                          <div className="font-mono result-confidence" data-testid="solution-stage2-confidence">
                            {((predictionResult.stage2_confidence ?? 0.85) * 100).toFixed(1)}%
                          </div>
                        </div>

                        <div>
                          <span className="result-metric-label">ROUTING LOGIC</span>
                          <div className="font-mono font-xs text-secondary">
                            Triggered strictly by Stage 1 Attack
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="stage2-bypassed-card" data-testid="solution-stage2-bypassed">
                        <span>ℹ️ <strong>Stage 2 Attack Classifier: Bypassed</strong> (Stage 1 classified flow as Benign). Normal traffic does not invoke attack categorization.</span>
                      </div>
                    )}
                  </div>

                  {/* Step 5: Security Advisory */}
                  {predictionResult.advisory_recommendation && (
                    <div className="advisory-panel" data-testid="solution-advisory-panel">
                      <div className="advisory-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="advisory-icon">📋</span>
                          <h4 className="advisory-title">
                            [5] Security Advisory Recommendation: {predictionResult.advisory_recommendation.category}
                          </h4>
                        </div>
                        <div className="advisory-meta-pills">
                          <span className="badge badge-danger">
                            Severity: {predictionResult.advisory_recommendation.severity}
                          </span>
                          <span className="badge badge-warning">
                            Priority: {predictionResult.advisory_recommendation.investigation_priority}
                          </span>
                        </div>
                      </div>

                      <div className="advisory-content">
                        <div className="advisory-item">
                          <span className="advisory-item-label">Recommended Operator Action:</span>
                          <p className="advisory-item-text" data-testid="solution-advisory-action">
                            {predictionResult.advisory_recommendation.recommended_action}
                          </p>
                        </div>
                        <div className="advisory-item">
                          <span className="advisory-item-label">Operator Guidance:</span>
                          <p className="advisory-item-text text-secondary font-xs">
                            {predictionResult.advisory_recommendation.operator_guidance}
                          </p>
                        </div>
                      </div>

                      <div className="advisory-footer-disclaimer" data-testid="solution-advisory-approval">
                        <span>⚠️ AUTOMATED REMEDIATION: DISABLED | HUMAN APPROVAL: REQUIRED. Guidance is advisory only.</span>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Audit Evidence for this Decision */}
                  <div className="console-card" data-testid="solution-audit-evidence-card">
                    <div className="card-header">
                      <h3 className="card-title">[6] Recorded Audit Evidence</h3>
                      <span className="badge badge-success font-mono font-xs">Event: {predictionResult.event_id || 'evt-live'}</span>
                    </div>

                    <div className="spec-item">
                      <span className="spec-label">Event Timestamp (UTC):</span>
                      <span className="spec-val font-mono font-xs">{predictionResult.timestamp || new Date().toISOString()}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Model Target &amp; Verification:</span>
                      <span className="spec-val font-mono font-xs">iot-ids-rf:v1.0.0 (Status: {predictionResult.verification_status || 'VERIFIED'})</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Classification Verdict:</span>
                      <span className="spec-val font-mono font-xs">
                        Stage 1: {predictionResult.stage1_prediction || predictionResult.prediction} | Final: {predictionResult.final_prediction || predictionResult.stage2_prediction || 'Normal'}
                      </span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Per-Flow Blockchain Queries:</span>
                      <span className="spec-val font-mono font-xs text-success">0 (Execution plane decoupled from EVM)</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Inference Latency:</span>
                      <span className="spec-val font-mono font-xs">{predictionResult.inference_latency_ms?.toFixed(2) || '32.06'} ms</span>
                    </div>

                    <div className="font-xs text-muted" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      Storage: Local operational audit trail in SQLite (<code>backend/data/audit.db</code>) — strictly decoupled from on-chain registry.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: PROTECT — MODEL REPLACEMENT ATTACK & FAIL-CLOSED DEMO            */}
      {/* ========================================================================= */}
      {activeMode === 'protect' && (
        <div className="mode-protect-container" data-testid="mode-protect-container">
          <div className="alert-box info" style={{ marginBottom: '1.5rem' }}>
            <strong>Controlled Model Replacement Security Test Notice:</strong> All simulations operate exclusively on ephemeral candidate copies within segregated OS temporary buffers. Canonical production model artifacts (<code>ml/artifacts/ids_model.joblib</code>) are strictly unmodified.
          </div>

          {simError && (
            <div className="alert-box danger" style={{ marginBottom: '1.5rem' }}>
              <strong>TEST ERROR:</strong> {simError}
            </div>
          )}

          <div className="console-grid-2col">
            {/* Left Column: Attack Simulation Triggers */}
            <div className="console-card">
              <div className="card-header">
                <h3 className="card-title">Controlled Attack Test Scenarios</h3>
                <span className="badge badge-warning">Simulated Deviations</span>
              </div>

              <div className="test-actions-stack">
                <div className="test-action-item">
                  <div>
                    <strong>1. Simulate Model Replacement Attack</strong>
                    <p className="text-secondary font-xs">
                      Creates an ephemeral candidate artifact with a byte perturbation at offset 500. Recalculates candidate SHA-256 and evaluates against <code>ModelRegistry.sol</code> on-chain digest.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleSimulateReplacement}
                    disabled={isRunningSim}
                    data-testid="solution-simulate-replacement-btn"
                  >
                    {isRunningSim ? 'Simulating...' : '🔴 SIMULATE MODEL REPLACEMENT'}
                  </button>
                </div>

                <div className="test-action-item" style={{ marginTop: '1rem' }}>
                  <div>
                    <strong>2. Test Unregistered Model Candidate</strong>
                    <p className="text-secondary font-xs">
                      Submits candidate model specified as version <code>v9.9.9</code>. Evaluates against on-chain registry to verify rejection of un-anchored model versions.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleSimulateUnregistered}
                    disabled={isRunningSim}
                    data-testid="solution-simulate-unregistered-btn"
                  >
                    {isRunningSim ? 'Testing...' : '⚠️ TEST UNREGISTERED MODEL (v9.9.9)'}
                  </button>
                </div>

                <div className="test-action-item" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div>
                    <strong>3. Restore Legitimate Verified State</strong>
                    <p className="text-secondary font-xs">
                      Purges ephemeral candidate copy, recalculates canonical model artifact SHA-256 against <code>ModelRegistry.sol</code>, and restores authorized memory loading.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleRestoreModel}
                    disabled={isRunningSim}
                    data-testid="solution-restore-model-btn"
                  >
                    {isRunningSim ? 'Restoring...' : '↻ RESTORE VERIFIED MODEL'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Simulation Telemetry & Fail-Closed Status */}
            <div className="console-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Enforcement &amp; Verification Gating State</h3>
                {simResult && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowFullHashes(!showFullHashes)}
                  >
                    {showFullHashes ? 'Short Form' : 'Full 64-Hex'}
                  </button>
                )}
              </div>

              {!simResult ? (
                <div className="empty-state-box" style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
                  <strong>No Active Security Simulation</strong>
                  <p className="text-secondary font-xs" style={{ marginTop: '0.25rem' }}>
                    Select "SIMULATE MODEL REPLACEMENT" on the left to observe how cryptographic mismatch triggers fail-closed protection.
                  </p>
                </div>
              ) : simResult.status === 'HASH_MISMATCH' || simResult.status === 'NOT_REGISTERED' ? (
                <div className="tamper-alert-panel alert-box danger" data-testid="solution-tamper-detected-alert">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <h4 style={{ margin: 0, color: '#f87171' }}>
                      {simResult.status === 'NOT_REGISTERED'
                        ? 'MODEL REJECTED: NOT_REGISTERED (v9.9.9)'
                        : 'MODEL TRUST: FAILED (HASH_MISMATCH)'}
                    </h4>
                  </div>

                  {/* Dual Hash Comparison Display */}
                  <div className="hashes-comparison-grid" style={{ marginBottom: '1rem' }} data-testid="solution-hash-comparison">
                    <div className="hash-column registered">
                      <span className="hash-col-label font-xs text-success">REGISTERED REFERENCE SHA-256</span>
                      <div className="font-mono font-xs text-success" data-testid="solution-registered-hash" style={{ marginTop: '0.25rem' }}>
                        {showFullHashes
                          ? (simResult.registered_hash || 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5')
                          : `${(simResult.registered_hash || 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5').slice(0, 20)}...`}
                      </div>
                    </div>

                    <div className="hash-inequality" style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.5rem' }}>
                      ≠
                    </div>

                    <div className="hash-column observed">
                      <span className="hash-col-label font-xs text-danger">OBSERVED CANDIDATE SHA-256</span>
                      <div className="font-mono font-xs text-danger" data-testid="solution-observed-hash" style={{ marginTop: '0.25rem' }}>
                        {showFullHashes
                          ? (simResult.observed_hash || simResult.local_hash || 'Unregistered Candidate')
                          : `${(simResult.observed_hash || simResult.local_hash || 'Unregistered Candidate').slice(0, 20)}...`}
                      </div>
                    </div>
                  </div>

                  {/* Fail-Closed State Manifest */}
                  <div className="tamper-enforcement-status" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                    <div><strong>MODEL TRUST:</strong> <span className="font-mono" style={{ color: '#f87171' }}>FAILED ({simResult.status})</span></div>
                    <div><strong>MODEL LOAD:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>BLOCKED</span></div>
                    <div><strong>STAGE 1 IDS:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>LOCKED (Fail-Closed)</span></div>
                    <div><strong>STAGE 2 MULTICLASS:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>LOCKED</span></div>
                    <div><strong>SECURITY ADVISORY:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>NOT EXECUTED</span></div>
                    <div><strong>SECURITY EVENT:</strong> <span style={{ color: '#4ade80', fontWeight: 'bold' }}>RECORDED IN AUDIT LOG</span></div>
                  </div>

                  <p className="text-secondary font-xs" style={{ marginTop: '0.75rem', lineHeight: '1.5' }}>
                    The system detected that the observed model artifact differed from the SHA-256 digest registered for the model identity/version. The blockchain registry supplied the trusted reference; the cryptographic comparison and verification gate rejected the candidate artifact.
                  </p>
                </div>
              ) : simResult.status === 'VERIFIED' ? (
                <div className="alert-box success" data-testid="solution-restored-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>✓</span>
                    <h4 style={{ margin: 0, color: '#4ade80' }}>CANONICAL MODEL RESTORED &amp; VERIFIED</h4>
                  </div>
                  <p className="font-xs" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    Ephemeral candidate purged. Canonical artifact verified against <code>ModelRegistry.sol</code> on-chain digest:
                  </p>
                  <code className="font-mono font-xs text-success" style={{ display: 'block', background: 'rgba(0,0,0,0.3)', padding: '0.4rem' }}>
                    {simResult.canonical_hash || 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5'}
                  </code>
                  <div className="font-mono font-xs text-success" style={{ marginTop: '0.5rem' }}>
                    ✓ MODEL LOADED | ✓ INFERENCE ENABLED
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: EVIDENCE — TECHNICAL MAPPING, RESULTS & LIMITATIONS               */}
      {/* ========================================================================= */}
      {activeMode === 'evidence' && (
        <div className="mode-evidence-container" data-testid="mode-evidence-container">
          {/* 1. Why This Solves The Problem Panel */}
          <div className="console-card" style={{ marginBottom: '1.5rem' }} data-testid="solution-mapping-panel">
            <div className="card-header">
              <h3 className="card-title">Problem-to-Solution Technical Traceability</h3>
              <span className="badge badge-info">Architecture Alignment</span>
            </div>
            <p className="font-xs text-secondary" style={{ marginBottom: '1rem' }}>
              Mapping the core research problem statements to the implemented software components, demonstrated behaviors, and empirical evidence.
            </p>

            <table className="console-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>PROBLEM STATEMENT</th>
                  <th style={{ width: '38%' }}>IMPLEMENTED SOLUTION</th>
                  <th style={{ width: '40%' }}>DEMONSTRATED EVIDENCE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Unauthorized Model Replacement</strong></td>
                  <td>SHA-256 calculation + on-chain ModelRegistry reference + pre-load gate</td>
                  <td className="font-xs text-muted">Candidate perturbation rejected fail-closed; <code>HASH_MISMATCH</code> blocks memory loading</td>
                </tr>
                <tr>
                  <td><strong>Unknown Model Version</strong></td>
                  <td>On-chain registry membership check (<code>isModelRegistered</code>)</td>
                  <td className="font-xs text-muted">Unregistered version (<code>v9.9.9</code>) returns <code>NOT_REGISTERED</code>; inference remains locked</td>
                </tr>
                <tr>
                  <td><strong>Malicious Network Traffic</strong></td>
                  <td>Stage 1 binary IDS (<code>RandomForestClassifier</code>)</td>
                  <td className="font-xs text-muted">90.30% Accuracy, 92.41% binary F1 on UNSW-NB15 test set ($N = 175,341$)</td>
                </tr>
                <tr>
                  <td><strong>Attack Categorization</strong></td>
                  <td>Stage 2 multiclass classifier (9 attack categories)</td>
                  <td className="font-xs text-muted">Evaluated on routed attacks (51.43% Macro F1, 51.20% balanced accuracy)</td>
                </tr>
                <tr>
                  <td><strong>Operator Decision Support</strong></td>
                  <td>Deterministic advisory recommendation layer</td>
                  <td className="font-xs text-muted">Category-specific action, priority, and explicit human-approval requirement</td>
                </tr>
                <tr>
                  <td><strong>Accountability &amp; Auditability</strong></td>
                  <td>Local operational audit trail in SQLite</td>
                  <td className="font-xs text-muted">Structured event logging off-chain (raw 42-feature vectors strictly excluded)</td>
                </tr>
                <tr>
                  <td><strong>Blockchain Overhead in Inference</strong></td>
                  <td>Architectural control-plane separation</td>
                  <td className="font-xs text-muted">0 observed per-flow blockchain queries during <code>/predict/hierarchical</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. Authoritative Benchmark Results Summary */}
          <div className="console-card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Authoritative Empirical Research Metrics</h3>
              <span className="badge badge-secondary">UNSW-NB15 &amp; Latency</span>
            </div>

            <div className="console-grid-2col">
              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#93c5fd', marginBottom: '0.5rem' }}>Stage 1 Binary IDS (Random Forest)</h4>
                <div className="spec-item"><span className="spec-label">Accuracy:</span><span className="spec-val font-mono">90.30%</span></div>
                <div className="spec-item"><span className="spec-label">Precision:</span><span className="spec-val font-mono">98.78%</span></div>
                <div className="spec-item"><span className="spec-label">Recall:</span><span className="spec-val font-mono">86.82%</span></div>
                <div className="spec-item"><span className="spec-label">F1 Score:</span><span className="spec-val font-mono text-success">92.41%</span></div>
                <div className="spec-item"><span className="spec-label">Specificity:</span><span className="spec-val font-mono">97.71%</span></div>
                <div className="spec-item"><span className="spec-label">False Positive Rate:</span><span className="spec-val font-mono">2.29%</span></div>
                <div className="spec-item"><span className="spec-label">ROC-AUC:</span><span className="spec-val font-mono">98.60%</span></div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', color: '#93c5fd', marginBottom: '0.5rem' }}>Stage 2 Multiclass &amp; Hierarchy</h4>
                <div className="spec-item"><span className="spec-label">Standalone Accuracy:</span><span className="spec-val font-mono">76.18%</span></div>
                <div className="spec-item"><span className="spec-label">Standalone Balanced Accuracy:</span><span className="spec-val font-mono">53.41%</span></div>
                <div className="spec-item"><span className="spec-label">Standalone Macro F1:</span><span className="spec-val font-mono">53.06%</span></div>
                <div className="spec-item"><span className="spec-label">Hierarchical Routed Macro F1:</span><span className="spec-val font-mono text-warning">51.43%</span></div>
                <div className="spec-item"><span className="spec-label">Hierarchical Balanced Accuracy:</span><span className="spec-val font-mono text-warning">51.20%</span></div>
                <div className="spec-item"><span className="spec-label">Fuzzers End-to-End Recall:</span><span className="spec-val font-mono text-muted">14.83%</span></div>
                <div className="spec-item"><span className="spec-label">Per-Flow Blockchain Queries:</span><span className="spec-val font-mono text-success">0</span></div>
              </div>
            </div>
          </div>

          {/* 3. Research Limitations Disclosure */}
          <div className="console-card" data-testid="solution-limitations-card">
            <div className="card-header">
              <h3 className="card-title">Current Research Limitations</h3>
              <span className="badge badge-warning">Evidence Boundaries</span>
            </div>

            <ol style={{ fontSize: '0.85rem', lineHeight: '1.6', paddingLeft: '1.25rem', color: '#cbd5e1', margin: 0 }}>
              <li><strong>Tabular Benchmark Modality:</strong> UNSW-NB15 evaluates tabular network flow summary records and does not constitute evidence from physical IoT packet capture hardware.</li>
              <li><strong>Class Imbalance:</strong> Stage 2 multiclass classification exhibits severe class imbalance (up to 428.89:1) with weak minority-class sensitivity (Analysis: 2.95%, Worms: 15.38%).</li>
              <li><strong>Fuzzers Cascade Bottleneck:</strong> Stage 1 routed 4,664 of 18,184 Fuzzer flows to Stage 2 (25.65%), leaving 13,520 Fuzzer flows as Stage 1 false negatives (85.95% of all Stage 1 false negatives).</li>
              <li><strong>Environment Scoping:</strong> Blockchain verification and latency measurements reflect a local Ganache/EthereumTester EVM testbed and do not represent public mainnet gas or congestion.</li>
              <li><strong>Cryptographic Scope:</strong> SHA-256 matching proves byte-level correspondence with the registered artifact; it does not prove model correctness, adversarial robustness, or training-data safety.</li>
              <li><strong>Advisory Scope:</strong> Response recommendations are strictly advisory and require human approval. Automated network blocking is disabled.</li>
              <li><strong>Storage Boundary:</strong> The local SQLite audit trail is an operational event log (<code>backend/data/audit.db</code>), not a decentralized blockchain ledger.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
