import React, { useState } from 'react';
import flowPresetsData from '../utils/flowPresets.json';
import { api } from '../api/client';

export function LiveTest({ isModelLoaded }) {
  const [endpointMode, setEndpointMode] = useState('hierarchical'); // 'hierarchical' | 'legacy'
  const [selectedPreset, setSelectedPreset] = useState('Normal');
  const [customJson, setCustomJson] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const activeFlow = flowPresetsData[selectedPreset]?.features || flowPresetsData['Normal'].features;

  const handleExecute = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    let payload = activeFlow;
    if (isCustom && customJson.trim()) {
      try {
        payload = JSON.parse(customJson);
      } catch (err) {
        setError('Invalid JSON in custom features: ' + err.message);
        setIsLoading(false);
        return;
      }
    }

    try {
      let res;
      if (endpointMode === 'hierarchical') {
        res = await api.predictHierarchical(payload);
      } else {
        res = await api.predict(payload);
      }
      setResponse(res);
    } catch (err) {
      setError(err.message || 'Inference execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="live-test-page">
      <div className="section-header">
        <div className="section-badge info">OPERATOR WORKBENCH</div>
        <h2 className="section-title">Direct Inference & Endpoint Testing</h2>
        <p className="section-subtitle">
          Directly query both legacy binary and hierarchical inference endpoints with authentic network-flow telemetry.
        </p>
      </div>

      {!isModelLoaded && (
        <div className="alert-box warning">
          ⚠️ <strong>Model Unloaded:</strong> Ensure models are verified and loaded in the Architecture tab before executing inference.
        </div>
      )}

      <div className="live-test-controls-grid">
        <div className="control-card">
          <label className="form-label" htmlFor="endpoint-mode-select">Target Endpoint Architecture:</label>
          <div className="endpoint-selector-tabs">
            <button
              className={`btn-toggle ${endpointMode === 'hierarchical' ? 'active' : ''}`}
              onClick={() => setEndpointMode('hierarchical')}
              type="button"
            >
              POST /predict/hierarchical (Phase 7 Hierarchical + Advisory)
            </button>
            <button
              className={`btn-toggle ${endpointMode === 'legacy' ? 'active' : ''}`}
              onClick={() => setEndpointMode('legacy')}
              type="button"
            >
              POST /predict (Legacy Binary Baseline)
            </button>
          </div>
        </div>

        <div className="control-card">
          <label className="form-label">Flow Preset Selection:</label>
          <div className="flow-preset-chips">
            {Object.keys(flowPresetsData).map((k) => (
              <button
                key={k}
                className={`chip ${selectedPreset === k && !isCustom ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPreset(k);
                  setIsCustom(false);
                }}
                type="button"
              >
                {k === 'Normal' ? 'Normal / Benign' : k}
              </button>
            ))}
            <button
              className={`chip ${isCustom ? 'active' : ''}`}
              onClick={() => setIsCustom(true)}
              type="button"
            >
              Custom JSON
            </button>
          </div>
        </div>
      </div>

      {isCustom ? (
        <div className="custom-editor-panel">
          <label className="form-label" htmlFor="custom-features-textarea">Raw 42-Feature JSON Vector:</label>
          <textarea
            id="custom-features-textarea"
            className="form-control font-mono"
            rows={8}
            value={customJson || JSON.stringify(activeFlow, null, 2)}
            onChange={(e) => setCustomJson(e.target.value)}
          />
        </div>
      ) : (
        <div className="preset-summary-display">
          <h4>Preset: {flowPresetsData[selectedPreset]?.intended_scenario}</h4>
          <p className="summary-meta font-mono font-xs">
            Proto: {flowPresetsData[selectedPreset]?.summary.protocol} | Service: {flowPresetsData[selectedPreset]?.summary.service} | State: {flowPresetsData[selectedPreset]?.summary.state} | Pkts: {flowPresetsData[selectedPreset]?.summary.source_packets}+{flowPresetsData[selectedPreset]?.summary.dest_packets}
          </p>
        </div>
      )}

      <div className="test-action-bar">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleExecute}
          disabled={isLoading || !isModelLoaded}
          type="button"
        >
          {isLoading ? 'Processing Inference...' : `SUBMIT TO ${endpointMode.toUpperCase()} ENDPOINT`}
        </button>
      </div>

      {error && (
        <div className="alert-box danger">
          <strong>Request Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="live-response-container">
          <div className="response-header">
            <h4>Inference Execution Result (HTTP 200 OK)</h4>
            <span className="font-mono font-xs">Inference Time: {response.inference_latency_ms?.toFixed(2)} ms</span>
          </div>

          <div className="response-metrics-cards">
            {endpointMode === 'hierarchical' ? (
              <>
                <div className="metric-box">
                  <span className="box-label">Final Outcome</span>
                  <span className="box-val text-primary font-bold">{response.final_prediction}</span>
                </div>
                <div className="metric-box">
                  <span className="box-label">Stage 1 Result</span>
                  <span className="box-val font-mono">{response.stage1_prediction} ({(response.stage1_confidence * 100).toFixed(1)}%)</span>
                </div>
                <div className="metric-box">
                  <span className="box-label">Stage 2 Invoked</span>
                  <span className="box-val font-mono">{response.stage2_invoked ? 'YES' : 'NO (BYPASSED)'}</span>
                </div>
                <div className="metric-box">
                  <span className="box-label">Per-Flow Blockchain Queries</span>
                  <span className="box-val font-mono text-success">0</span>
                </div>
              </>
            ) : (
              <>
                <div className="metric-box">
                  <span className="box-label">Binary Prediction</span>
                  <span className="box-val text-primary font-bold">{response.prediction}</span>
                </div>
                <div className="metric-box">
                  <span className="box-label">Confidence</span>
                  <span className="box-val font-mono">{(response.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="metric-box">
                  <span className="box-label">Model Status</span>
                  <span className="box-val font-mono">{response.verification_status}</span>
                </div>
              </>
            )}
          </div>

          {response.advisory_recommendation && (
            <div className="live-advisory-box">
              <h5>Advisory Guidance: {response.advisory_recommendation.category} ({response.advisory_recommendation.severity})</h5>
              <p className="action-txt">{response.advisory_recommendation.recommended_action}</p>
              <div className="advisory-sub-meta">
                <span>Priority: <strong>{response.advisory_recommendation.investigation_priority}</strong></span>
                <span className="separator">•</span>
                <span>Requires Approval: <strong>{response.advisory_recommendation.requires_human_approval ? 'YES' : 'NO'}</strong></span>
                <span className="separator">•</span>
                <span>Auto-Remediation: <strong>{response.advisory_recommendation.automated_remediation_enabled ? 'ENABLED' : 'DISABLED'}</strong></span>
              </div>
            </div>
          )}

          <div className="raw-response-json">
            <span className="json-label">Complete API Response Payload:</span>
            <pre className="font-mono">{JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
