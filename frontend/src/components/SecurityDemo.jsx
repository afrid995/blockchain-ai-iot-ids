import React, { useState } from 'react';
import { api } from '../api/client';

/**
 * Security Demonstration Mode:
 * Interactively demonstrates the fail-closed provenance gate by testing:
 * 1. Legitimate model verification (VERIFIED -> LOADED)
 * 2. Single-byte mutated Stage 1 artifact (HASH_MISMATCH -> BLOCKED)
 * 3. Single-byte mutated Stage 2 artifact (HASH_MISMATCH -> BLOCKED)
 * 4. Unregistered model version (NOT_REGISTERED -> BLOCKED)
 * 5. Nonexistent model file (FILE_NOT_FOUND -> BLOCKED)
 */
export function SecurityDemo({ onModelStatusRefresh }) {
  const [isRunningScenario, setIsRunningScenario] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [scenarioError, setScenarioError] = useState(null);

  const scenarios = [
    {
      id: 'legitimate',
      name: 'Verify Legitimate Model',
      badge: 'CANONICAL',
      desc: 'Verify authentic, registered model artifacts against on-chain digests.',
      expected: 'VERIFIED',
      btnClass: 'btn-success',
    },
    {
      id: 'tampered_stage1',
      name: 'Test Tampered Stage 1',
      badge: 'SECURITY TEST',
      desc: 'Simulate single-byte mutation in Stage 1 weights. Tests fail-closed rejection.',
      expected: 'HASH_MISMATCH',
      btnClass: 'btn-danger',
    },
    {
      id: 'tampered_stage2',
      name: 'Test Tampered Stage 2',
      badge: 'SECURITY TEST',
      desc: 'Simulate single-byte mutation in Stage 2 weights. Tests fail-closed rejection.',
      expected: 'HASH_MISMATCH',
      btnClass: 'btn-danger',
    },
    {
      id: 'unregistered_version',
      name: 'Test Unregistered Version',
      badge: 'SECURITY TEST',
      desc: 'Attempt to load unapproved model version v9.9.9 without on-chain record.',
      expected: 'NOT_REGISTERED',
      btnClass: 'btn-warning',
    },
    {
      id: 'missing_artifact',
      name: 'Test Missing Artifact',
      badge: 'SECURITY TEST',
      desc: 'Point verification to nonexistent file path to verify graceful handling.',
      expected: 'FILE_NOT_FOUND',
      btnClass: 'btn-warning',
    },
  ];

  const handleExecuteScenario = async (scenarioId) => {
    setIsRunningScenario(true);
    setActiveScenario(scenarioId);
    setScenarioResult(null);
    setScenarioError(null);

    try {
      const data = await api.runSecurityScenario(scenarioId);
      setScenarioResult(data);
      if (onModelStatusRefresh) {
        onModelStatusRefresh();
      }
    } catch (err) {
      setScenarioError(err.message || 'Simulation execution failed');
    } finally {
      setIsRunningScenario(false);
    }
  };

  return (
    <div className="security-demo-page">
      <div className="section-header">
        <div className="section-badge danger">TAMPER-EVIDENT DEFENSE DEMONSTRATOR</div>
        <h2 className="section-title">Fail-Closed Model Integrity Testing</h2>
        <p className="section-subtitle">
          Interactively test how the startup provenance gate responds to unauthorized modifications, corruptions, and unregistered artifacts.
        </p>
      </div>

      <div className="scenarios-grid">
        {scenarios.map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <div key={sc.id} className={`scenario-card ${isSelected ? 'active-scenario' : ''}`}>
              <div className="scenario-card-header">
                <span className={`scenario-badge ${sc.id === 'legitimate' ? 'success' : 'danger'}`}>
                  {sc.badge}
                </span>
                <span className="expected-outcome font-mono font-xs">
                  Expected: {sc.expected}
                </span>
              </div>
              <h3 className="scenario-name">{sc.name}</h3>
              <p className="scenario-desc">{sc.desc}</p>
              <button
                className={`btn ${sc.btnClass} scenario-btn`}
                onClick={() => handleExecuteScenario(sc.id)}
                disabled={isRunningScenario}
                type="button"
              >
                {isRunningScenario && isSelected ? 'Simulating Attack...' : `RUN ${sc.name.toUpperCase()}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Simulation Output Box */}
      {scenarioResult && (
        <div className="simulation-result-box" aria-live="polite">
          <div className="simulation-result-header">
            <h4>Live Security Gate Response: Scenario [{scenarioResult.scenario}]</h4>
            <span
              className={`status-pill ${
                scenarioResult.status === 'VERIFIED' ? 'success' : 'danger'
              }`}
            >
              GATE STATUS: {scenarioResult.status}
            </span>
          </div>

          <div className="fail-closed-flow-diagram">
            <div className="flow-step">
              <span className="step-num">1</span>
              <span className="step-title">ARTIFACT INSPECTION</span>
              <span className="step-sub">Local SHA-256 Calculated</span>
            </div>
            <span className="flow-arrow">➔</span>
            <div className="flow-step">
              <span className="step-num">2</span>
              <span className="step-title">ON-CHAIN LOOKUP</span>
              <span className="step-sub">ModelRegistry.sol Queried</span>
            </div>
            <span className="flow-arrow">➔</span>
            <div
              className={`flow-step ${
                scenarioResult.status === 'VERIFIED' ? 'step-success' : 'step-failure'
              }`}
            >
              <span className="step-num">3</span>
              <span className="step-title">
                {scenarioResult.status === 'VERIFIED' ? 'HASH EQUALITY CONFIRMED' : 'HASH MISMATCH / REJECTED'}
              </span>
              <span className="step-sub">Exact Byte Comparison</span>
            </div>
            <span className="flow-arrow">➔</span>
            <div
              className={`flow-step ${
                scenarioResult.action_taken === 'AUTHORIZED_AND_LOADED'
                  ? 'step-success'
                  : 'step-blocked'
              }`}
            >
              <span className="step-num">4</span>
              <span className="step-title">
                {scenarioResult.action_taken === 'AUTHORIZED_AND_LOADED'
                  ? 'AUTHORIZED & LOADED'
                  : 'MODEL LOAD BLOCKED'}
              </span>
              <span className="step-sub">
                Downstream State: {scenarioResult.downstream_state}
              </span>
            </div>
          </div>

          <div className="simulation-detail-grid">
            <div className="sim-field">
              <span className="field-label">Target Model:</span>
              <span className="field-val font-mono">{scenarioResult.model_id}:{scenarioResult.version}</span>
            </div>
            <div className="sim-field">
              <span className="field-label">Calculated Local Hash:</span>
              <span className="field-val font-mono font-xs">{scenarioResult.local_hash || 'None'}</span>
            </div>
            <div className="sim-field">
              <span className="field-label">Registered On-Chain Hash:</span>
              <span className="field-val font-mono font-xs">{scenarioResult.registered_hash || 'None / Not Found'}</span>
            </div>
            <div className="sim-field">
              <span className="field-label">Enforced Action:</span>
              <span className="field-val text-danger font-bold">{scenarioResult.action_taken}</span>
            </div>
          </div>

          <div className="simulation-message-box">
            <p><strong>System Defense Output:</strong> {scenarioResult.message}</p>
          </div>
        </div>
      )}

      {scenarioError && (
        <div className="alert-box danger">
          <strong>Simulation Error:</strong> {scenarioError}
        </div>
      )}

      <div className="security-qualification-card">
        <h4>Cryptographic Qualification & Research Invariant</h4>
        <p>
          Cryptographic integrity verification establishes that the observed model file exactly matches the 32-byte digest registered on-chain for its designated model ID and version.
          It proves binary non-tampering since registration. It does <strong>not</strong> prove absence of inherent model bias, training data cleanliness, or adversarial robustness.
          All tests use temporary in-memory copies and strictly preserve canonical model weights on disk.
        </p>
      </div>
    </div>
  );
}
