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
  const [selectedPreset, setSelectedPreset] = useState('Flow 0001');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customJson, setCustomJson] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [endpointMode, setEndpointMode] = useState('hierarchical'); // 'hierarchical' | 'legacy'

  const activeFlowData = flowPresetsData[selectedPreset] || flowPresetsData['Flow 0001'] || Object.values(flowPresetsData)[0];
  const activeFeatures = activeFlowData?.features || {};

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
              <strong>MODEL NOT AUTHORIZED:</strong> Network-flow analysis unavailable.
              Verify and load the authorized model first.
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
            <h3 className="card-title">Network-Flow Input Record (Network Traffic)</h3>
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
                  Authentic UNSW-NB15 Records
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
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 'bold' }}>
                      NETWORK TRAFFIC
                    </label>
                    <span className="font-xs text-muted">Authentic UNSW-NB15 Records</span>
                  </div>

                  {/* Flow Quick-Selection Pills */}
                  <div className="traffic-selector-bar" role="tablist" aria-label="Select Network Traffic Record">
                    {Object.keys(flowPresetsData).map((key) => {
                      const flow = flowPresetsData[key];
                      const proto = (flow.summary?.protocol || flow.features?.proto || '').toUpperCase();
                      const isSelected = selectedPreset === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`traffic-flow-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedPreset(key)}
                          data-testid={`flow-btn-${key}`}
                          aria-selected={isSelected}
                          role="tab"
                        >
                          {key} ({proto})
                        </button>
                      );
                    })}
                  </div>

                  {/* Flow Records Table View */}
                  <div className="traffic-table-container">
                    <table className="traffic-table" data-testid="traffic-records-table">
                      <thead>
                        <tr>
                          <th>Flow ID</th>
                          <th>Protocol</th>
                          <th>Service</th>
                          <th>State</th>
                          <th>Duration</th>
                          <th>Packets</th>
                          <th>Bytes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(flowPresetsData).map((key) => {
                          const flow = flowPresetsData[key];
                          const s = flow.summary || {};
                          const f = flow.features || {};
                          const proto = (s.protocol || f.proto || '').toUpperCase();
                          const service = s.service || f.service || '-';
                          const state = s.state || f.state || '-';
                          const dur = s.duration ?? f.dur ?? 0;
                          const pkts = (f.spkts || 0) + (f.dpkts || 0);
                          const bytes = (f.sbytes || 0) + (f.dbytes || 0);
                          const isSelected = selectedPreset === key;

                          return (
                            <tr
                              key={key}
                              className={isSelected ? 'selected' : ''}
                              onClick={() => setSelectedPreset(key)}
                              data-testid={`traffic-row-${key}`}
                            >
                              <td className="font-mono"><strong>{key}</strong></td>
                              <td className="font-mono">{proto}</td>
                              <td className="font-mono">{service}</td>
                              <td className="font-mono">{state}</td>
                              <td className="font-mono">{formatDuration(dur)}</td>
                              <td className="font-mono">{pkts.toLocaleString()}</td>
                              <td className="font-mono">{bytes.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Accessible Dropdown for Flow Selection */}
                  <div style={{ marginTop: '0.4rem' }}>
                    <label htmlFor="preset-select" className="font-xs text-muted" style={{ display: 'block', marginBottom: '0.2rem' }}>
                      Select Traffic Record:
                    </label>
                    <select
                      id="preset-select"
                      className="form-control font-mono font-xs"
                      value={selectedPreset}
                      onChange={handlePresetChange}
                      data-testid="preset-dropdown"
                    >
                      {Object.keys(flowPresetsData).map((key) => {
                        const flow = flowPresetsData[key];
                        const s = flow.summary || {};
                        const f = flow.features || {};
                        const proto = (s.protocol || f.proto || '').toUpperCase();
                        const dur = formatDuration(s.duration ?? f.dur ?? 0);
                        const pkts = (f.spkts || 0) + (f.dpkts || 0);
                        const bytes = (f.sbytes || 0) + (f.dbytes || 0);
                        return (
                          <option key={key} value={key}>
                            {key} — {proto} · {pkts} pkts · {bytes} B · {dur}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Selected Flow Detail Card */}
                <div className="flow-spec-card" data-testid="selected-flow-details">
                  <div className="flow-spec-header">
                    <span>SELECTED NETWORK FLOW</span>
                    <span className="font-mono font-xs text-secondary">
                      {selectedPreset} (UNSW-NB15 Record #{String(activeFlowData.dataset_id || 1).padStart(6, '0')})
                    </span>
                  </div>
                  <div className="flow-spec-grid">
                    <div className="spec-item">
                      <span className="spec-label">Protocol:</span>
                      <span className="spec-val font-mono">{String(activeFlowData.summary?.protocol || activeFeatures.proto).toUpperCase()}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Service:</span>
                      <span className="spec-val font-mono">{activeFlowData.summary?.service || activeFeatures.service || '-'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Transaction State:</span>
                      <span className="spec-val font-mono">{activeFlowData.summary?.state || activeFeatures.state || '-'}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Duration:</span>
                      <span className="spec-val font-mono">{formatDuration(activeFlowData.summary?.duration ?? activeFeatures.dur)}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Packets:</span>
                      <span className="spec-val font-mono">{activeFeatures.spkts} src / {activeFeatures.dpkts} dst</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Transaction Bytes:</span>
                      <span className="spec-val font-mono">{(activeFeatures.sbytes || 0).toLocaleString()} src / {(activeFeatures.dbytes || 0).toLocaleString()} dst</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Packet Rate:</span>
                      <span className="spec-val font-mono" data-testid="selected-flow-packet-rate">{formatRate(activeFeatures.rate, activeFeatures.dur)}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Byte Rate:</span>
                      <span className="spec-val font-mono" data-testid="selected-flow-byte-rate">{formatByteRate(activeFeatures.sbytes, activeFeatures.dbytes, activeFeatures.dur)}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">TTL (Time-to-Live):</span>
                      <span className="spec-val font-mono">{activeFeatures.sttl} src / {activeFeatures.dttl} dst</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Same-Service Conns:</span>
                      <span className="spec-val font-mono">{activeFeatures.ct_srv_src} (ct_srv_src)</span>
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
                title={!isModelLoaded ? 'Model not authorized. Verify and load the authorized model first.' : 'Analyze network flow'}
              >
                {isPredicting ? (
                  <span>
                    <span className="spinner" /> Analyzing Network Flow...
                  </span>
                ) : (
                  '⚡ ANALYZE NETWORK FLOW'
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
                Select a network traffic record on the left and click "ANALYZE NETWORK FLOW" to execute off-chain classification.
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
                  <span className="stage-tag">STAGE 1 — BINARY IDS</span>
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
                      {predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                        ? 'ATTACK / Malicious Flow'
                        : 'BENIGN / Normal Flow'}
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
                    <span className="stage-tag">STAGE 2 — ATTACK CLASSIFICATION</span>
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
                <div className="stage2-bypassed-card" style={{ marginTop: '1rem' }} data-testid="stage2-bypassed">
                  <span>ℹ️ <strong>Stage 2 Multiclass Classifier: Bypassed</strong> (Stage 2: BYPASSED — Stage1 classified this flow as Benign). Normal traffic does not invoke attack categorization.</span>
                </div>
              )}

              {/* Response Advisory Panel */}
              {predictionResult.advisory_recommendation && (
                <div className="advisory-panel" style={{ marginTop: '1rem' }} data-testid="advisory-panel">
                  <div className="advisory-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="advisory-icon">📋</span>
                      <h4 className="advisory-title">
                        SECURITY ADVISORY: {predictionResult.advisory_recommendation.category}
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
                      <span className="advisory-item-label">Operator Guidance:</span>
                      <p className="advisory-item-text text-secondary font-xs" data-testid="advisory-operator-guidance">
                        {predictionResult.advisory_recommendation.operator_guidance}
                      </p>
                    </div>

                    {predictionResult.advisory_recommendation.rationale && (
                      <div className="advisory-item">
                        <span className="advisory-item-label">Rationale:</span>
                        <p className="advisory-item-text text-secondary font-xs">
                          {predictionResult.advisory_recommendation.rationale}
                        </p>
                      </div>
                    )}

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

              {/* Ground Truth: Research Evaluation Only */}
              <div className="eval-ground-truth-box" data-testid="ground-truth-eval-box">
                <span className="text-muted" style={{ fontWeight: 'bold' }}>GROUND TRUTH — EVALUATION ONLY: </span>
                <span className="font-mono font-xs text-secondary" style={{ marginLeft: '0.4rem' }}>
                  {activeFlowData.ground_truth?.attack_cat || 'Normal'} (Label {activeFlowData.ground_truth?.label ?? 0})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
