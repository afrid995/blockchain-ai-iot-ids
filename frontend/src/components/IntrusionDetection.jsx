import React, { useState } from 'react';
import flowPresetsData from '../utils/flowPresets.json';

export function IntrusionDetection({
  isModelLoaded,
  isPredicting,
  onPredict,
  predictionResult,
  predictionError,
  modelStatus,
}) {
  const [selectedPreset, setSelectedPreset] = useState('Normal');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customJson, setCustomJson] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [endpointMode, setEndpointMode] = useState('hierarchical'); // 'hierarchical' | 'legacy'

  const activeFlowData = flowPresetsData[selectedPreset] || flowPresetsData['Normal'];
  const activeFeatures = activeFlowData.features;

  const handlePresetChange = (e) => {
    setSelectedPreset(e.target.value);
    setJsonError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
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
      await onPredict(payload, endpointMode);
    }
  };

  return (
    <div className="intrusion-detection-page" data-testid="prediction-card">
      {/* Section Header */}
      <div className="console-section-header">
        <div>
          <h2 className="console-title">Network-Flow Intrusion Detection</h2>
          <p className="console-subtitle">
            Off-chain hierarchical intrusion classification and deterministic response advisory engine.
          </p>
        </div>
        <div className="header-status-indicator">
          <span className={`badge ${isModelLoaded ? 'badge-success' : 'badge-danger'}`} data-testid="detection-engine-state">
            {isModelLoaded ? '● ENGINE READY' : '🔒 ENGINE LOCKED'}
          </span>
        </div>
      </div>

      {/* Model Not Ready / Unloaded Warning */}
      {!isModelLoaded && (
        <div className="alert-box danger" data-testid="flow-locked-placeholder" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔒</span>
            <div>
              <strong>FAIL-CLOSED VERIFICATION GATE ENGAGED:</strong> Model memory is currently unloaded.
              Network flow analysis is locked fail-closed until models are cryptographically verified against the blockchain registry.
            </div>
          </div>
        </div>
      )}

      {/* Prediction Error Alert */}
      {predictionError && (
        <div className="alert-box danger" data-testid="prediction-error-banner" style={{ marginBottom: '1.5rem' }}>
          <strong>Inference Request Rejected:</strong> {predictionError}
        </div>
      )}

      {/* Main Grid: Input on Left, Results on Right */}
      <div className="console-grid-2col">
        {/* Left Column: Flow Ingestion & Configuration */}
        <div className="console-card">
          <div className="card-header">
            <h3 className="card-title">Network-Flow Input Record</h3>
            <span className="badge badge-secondary">UNSW-NB15 Flow Features</span>
          </div>

          <form onSubmit={handleFormSubmit}>
            {/* Input Mode Selector */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Input Telemetry Source:</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`btn-toggle ${!isCustomMode ? 'active' : ''}`}
                  onClick={() => {
                    setIsCustomMode(false);
                    setJsonError(null);
                  }}
                  data-testid="mode-preset-btn"
                >
                  Authentic Flow Presets
                </button>
                <button
                  type="button"
                  className={`btn-toggle ${isCustomMode ? 'active' : ''}`}
                  onClick={() => {
                    setIsCustomMode(true);
                    if (!customJson) {
                      setCustomJson(JSON.stringify(activeFeatures, null, 2));
                    }
                  }}
                  data-testid="mode-custom-btn"
                >
                  Custom Flow JSON
                </button>
              </div>
            </div>

            {!isCustomMode ? (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="preset-select">
                    Select Test Flow Scenario:
                  </label>
                  <select
                    id="preset-select"
                    className="form-control"
                    value={selectedPreset}
                    onChange={handlePresetChange}
                    data-testid="preset-dropdown"
                  >
                    {Object.keys(flowPresetsData).map((key) => (
                      <option key={key} value={key}>
                        {key} ({flowPresetsData[key].intended_scenario || flowPresetsData[key].true_category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Flow Parameters Summary Card */}
                <div className="flow-spec-card">
                  <div className="flow-spec-header">
                    <span>Selected Flow Telemetry Summary</span>
                    <span className="font-mono font-xs text-secondary">
                      True Label: {activeFlowData.true_category || selectedPreset}
                    </span>
                  </div>
                  <div className="flow-spec-grid">
                    <div className="spec-item">
                      <span className="spec-label">Protocol:</span>
                      <span className="spec-val font-mono">{activeFlowData.summary?.protocol || activeFeatures.proto}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Service:</span>
                      <span className="spec-val font-mono">{activeFlowData.summary?.service || activeFeatures.service}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Duration:</span>
                      <span className="spec-val font-mono">{(activeFlowData.summary?.duration ?? activeFeatures.dur).toFixed(4)}s</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Packets:</span>
                      <span className="spec-val font-mono">{activeFeatures.spkts} src / {activeFeatures.dpkts} dst</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Bytes:</span>
                      <span className="spec-val font-mono">{activeFeatures.sbytes} src / {activeFeatures.dbytes} dst</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Packet Rate:</span>
                      <span className="spec-val font-mono">{Number(activeFeatures.rate).toFixed(1)} /s</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="custom-flow-json">
                  Custom 42-Feature Network Flow JSON:
                </label>
                <textarea
                  id="custom-flow-json"
                  className="form-control font-mono font-xs"
                  rows={10}
                  value={customJson}
                  onChange={(e) => setCustomJson(e.target.value)}
                  placeholder="Paste JSON dictionary of 42 UNSW-NB15 flow features..."
                  data-testid="custom-json-textarea"
                />
                {jsonError && (
                  <div className="text-danger font-xs" style={{ marginTop: '0.4rem' }}>
                    {jsonError}
                  </div>
                )}
              </div>
            )}

            {/* Architecture Mode Selector */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Classification Architecture:</label>
              <div className="endpoint-selector-tabs">
                <button
                  type="button"
                  className={`btn-toggle ${endpointMode === 'hierarchical' ? 'active' : ''}`}
                  onClick={() => setEndpointMode('hierarchical')}
                  data-testid="mode-hierarchical-btn"
                >
                  Hierarchical IDS + Response Advisory (Primary)
                </button>
                <button
                  type="button"
                  className={`btn-toggle ${endpointMode === 'legacy' ? 'active' : ''}`}
                  onClick={() => setEndpointMode('legacy')}
                  data-testid="mode-legacy-btn"
                >
                  Binary Classifier Only (Baseline)
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isPredicting}
                data-testid="predict-btn"
              >
                {isPredicting ? (
                  <span>
                    <span className="spinner" /> Analyzing Network Flow...
                  </span>
                ) : (
                  '⚡ Analyze Network Flow'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Hierarchical Detection Results & Response Advisory */}
        <div className="console-card" data-testid="detection-results-card">
          <div className="card-header">
            <h3 className="card-title">Detection &amp; Advisory Results</h3>
            {predictionResult && (
              <span className="font-mono font-xs text-secondary" data-testid="inference-latency">
                Latency: {predictionResult.inference_latency_ms?.toFixed(2)} ms
              </span>
            )}
          </div>

          {!predictionResult ? (
            <div className="empty-state-box" style={{ padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
              <strong>Awaiting Network Flow Input</strong>
              <p className="text-secondary font-xs" style={{ marginTop: '0.25rem' }}>
                Select a flow scenario on the left and click "Analyze Network Flow" to execute off-chain classification.
              </p>
            </div>
          ) : (
            <div className="results-container" data-testid="prediction-result">
              {/* Stage 1 Binary Detection Card */}
              <div
                className={`result-stage-card ${
                  predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                    ? 'attack-theme'
                    : 'benign-theme'
                }`}
                data-testid="stage1-result-box"
              >
                <div className="stage-card-header">
                  <span className="stage-tag">STAGE 1: BINARY IDS</span>
                  <span className="font-mono font-xs">
                    Model: {predictionResult.stage1_model_id || predictionResult.model_id || 'iot-ids-rf'}
                  </span>
                </div>

                <div className="stage-result-grid">
                  <div>
                    <span className="result-metric-label">DETECTION OUTCOME</span>
                    <div
                      className="result-verdict"
                      style={{
                        color:
                          predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                            ? '#f87171'
                            : '#4ade80',
                      }}
                      data-testid="prediction-label"
                    >
                      {predictionResult.stage1_prediction
                        ? predictionResult.stage1_prediction
                        : predictionResult.prediction === 'Attack'
                        ? 'Attack / Malicious Flow'
                        : predictionResult.prediction}
                    </div>
                  </div>

                  <div>
                    <span className="result-metric-label">CONFIDENCE SCORE</span>
                    <div className="font-mono result-confidence" data-testid="prediction-confidence">
                      {((predictionResult.stage1_confidence ?? predictionResult.confidence ?? 0) * 100).toFixed(
                        predictionResult.stage1_confidence !== undefined && predictionResult.stage1_confidence !== null ? 1 : 2
                      )}%
                    </div>
                  </div>

                  <div>
                    <span className="result-metric-label">VERIFICATION GATE</span>
                    <div className="font-mono font-xs text-success" data-testid="prediction-provenance-status">
                      ✓ {predictionResult.verification_status || 'VERIFIED'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 2 Multiclass Attack Classification Card */}
              {predictionResult.stage2_invoked ? (
                <div className="result-stage-card attack-theme" style={{ marginTop: '1rem' }} data-testid="stage2-result-box">
                  <div className="stage-card-header">
                    <span className="stage-tag">STAGE 2: MULTICLASS ATTACK CLASSIFIER</span>
                    <span className="font-mono font-xs">
                      Model: {predictionResult.stage2_model_id || 'iot-ids-attack-classifier'}
                    </span>
                  </div>

                  <div className="stage-result-grid">
                    <div>
                      <span className="result-metric-label">CLASSIFIED ATTACK CATEGORY</span>
                      <div className="result-verdict font-mono" style={{ color: '#fb923c' }} data-testid="stage2-category">
                        {predictionResult.stage2_prediction || predictionResult.final_prediction}
                      </div>
                    </div>

                    <div>
                      <span className="result-metric-label">CATEGORY CONFIDENCE</span>
                      <div className="font-mono result-confidence" data-testid="stage2-confidence">
                        {((predictionResult.stage2_confidence ?? 0.85) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <span className="result-metric-label">ROUTING LOGIC</span>
                      <div className="font-mono font-xs text-secondary">
                        Gated strictly on Stage 1 Attack
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stage2-bypassed-card" style={{ marginTop: '1rem' }}>
                  <span>ℹ️ <strong>Stage 2 Multiclass Classifier: Bypassed</strong> (Stage 1 classified flow as Benign). Normal traffic does not invoke attack categorization.</span>
                </div>
              )}

              {/* Response Advisory Panel */}
              {predictionResult.advisory_recommendation && (
                <div className="advisory-panel" style={{ marginTop: '1rem' }} data-testid="advisory-panel">
                  <div className="advisory-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="advisory-icon">📋</span>
                      <h4 className="advisory-title">
                        Operator Advisory Recommendation: {predictionResult.advisory_recommendation.category}
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
                      <p className="advisory-item-text" data-testid="advisory-recommended-action">
                        {predictionResult.advisory_recommendation.recommended_action}
                      </p>
                    </div>

                    <div className="advisory-item">
                      <span className="advisory-item-label">Investigation Guidance:</span>
                      <p className="advisory-item-text text-secondary font-xs" data-testid="advisory-operator-guidance">
                        {predictionResult.advisory_recommendation.operator_guidance}
                      </p>
                    </div>

                    {predictionResult.advisory_recommendation.limitations && (
                      <div className="advisory-item">
                        <span className="advisory-item-label">Operational Limitation:</span>
                        <p className="advisory-item-text text-muted font-xs">
                          {predictionResult.advisory_recommendation.limitations}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="advisory-footer-disclaimer">
                    <span>⚠️ Human operator approval strictly required. Automated remediation is disabled. Advisory guidance does not execute defensive network modifications.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
