import React, { useState } from 'react';
import { api } from '../api/client';

export function SecurityTesting({ onModelStatusRefresh }) {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);
  const [showFullHashes, setShowFullHashes] = useState(false);

  // 1. Run Controlled Model Replacement Test
  const handleRunReplacementTest = async () => {
    setIsRunningTest(true);
    setTestError(null);
    try {
      const res = await api.simulateModelReplacement();
      setTestResult(res);
      if (onModelStatusRefresh) {
        await onModelStatusRefresh();
      }
    } catch (err) {
      setTestError(`Security Test Execution Failed: ${err.message || 'HTTP Error'}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  // 2. Run Unregistered Version Test
  const handleRunUnregisteredVersionTest = async () => {
    setIsRunningTest(true);
    setTestError(null);
    try {
      const res = await api.simulateUnregisteredVersion();
      setTestResult(res);
      if (onModelStatusRefresh) {
        await onModelStatusRefresh();
      }
    } catch (err) {
      setTestError(`Unregistered Version Test Failed: ${err.message || 'HTTP Error'}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  // 3. Restore Legitimate Verified State
  const handleRestoreModel = async () => {
    setIsRunningTest(true);
    setTestError(null);
    try {
      const res = await api.resetModelReplacement();
      setTestResult(res);
      if (onModelStatusRefresh) {
        await onModelStatusRefresh();
      }
    } catch (err) {
      setTestError(`Model Restoration Failed: ${err.message || 'HTTP Error'}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const isTampered = testResult?.status === 'HASH_MISMATCH' || testResult?.status === 'NOT_REGISTERED';
  const isRestored = testResult?.status === 'VERIFIED';

  return (
    <div className="security-testing-page" data-testid="security-testing-card">
      {/* Section Header */}
      <div className="console-section-header">
        <div>
          <h2 className="console-title">Security Testing &amp; Fail-Closed Verification</h2>
          <p className="console-subtitle">
            Controlled operational testing facility for evaluating model-integrity and supply-chain tampering defenses.
          </p>
        </div>
        <span className="badge badge-warning">CONTROLLED TEST FACILITY</span>
      </div>

      {/* Ephemeral Safety Notice */}
      <div className="alert-box info" style={{ marginBottom: '1.5rem' }}>
        <strong>Controlled Security Test Notice:</strong> All simulations operate exclusively on ephemeral candidate copies within segregated OS temporary buffers. Canonical production model artifacts (<code>ml/artifacts/ids_model.joblib</code>) are strictly unmodified.
      </div>

      {/* In-Page Error Panel */}
      {testError && (
        <div className="alert-box danger" data-testid="test-error-panel" style={{ marginBottom: '1.5rem' }}>
          <strong>SECURITY TEST ERROR:</strong> {testError}
        </div>
      )}

      {/* Testing Controls Grid */}
      <div className="console-grid-2col">
        {/* Left Column: Test Execution Controls */}
        <div className="console-card">
          <div className="card-header">
            <h3 className="card-title">Available Security Test Scenarios</h3>
            <span className="badge badge-secondary">Gating Enforcement</span>
          </div>

          <p className="text-secondary font-xs" style={{ marginBottom: '1.25rem' }}>
            Trigger deliberate integrity deviations to verify that the blockchain provenance gate aborts memory deserialization and locks downstream inference fail-closed.
          </p>

          <div className="test-actions-stack">
            {/* Action 1: Model Replacement Test */}
            <div className="test-action-item">
              <div>
                <strong>1. Controlled Model Replacement Test</strong>
                <p className="text-secondary font-xs">
                  Creates an ephemeral candidate copy with a controlled byte perturbation at offset 500. Recalculates real SHA-256 and checks against on-chain consensus digest.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRunReplacementTest}
                disabled={isRunningTest}
                data-testid="simulate-replacement-btn"
              >
                {isRunningTest ? 'Executing...' : '🔴 Run Model Replacement Test'}
              </button>
            </div>

            {/* Action 2: Unregistered Model Version Test */}
            <div className="test-action-item" style={{ marginTop: '1rem' }}>
              <div>
                <strong>2. Unregistered Model Candidate Test</strong>
                <p className="text-secondary font-xs">
                  Submits a candidate model specified as version <code>v9.9.9</code>. Evaluates against smart contract to verify rejection of un-anchored model versions.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleRunUnregisteredVersionTest}
                disabled={isRunningTest}
                data-testid="simulate-unregistered-btn"
              >
                {isRunningTest ? 'Querying...' : '⚠️ Test Unregistered Version (v9.9.9)'}
              </button>
            </div>

            {/* Action 3: Restoration Control */}
            <div className="test-action-item" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <strong>3. Restore Verified Model State</strong>
                <p className="text-secondary font-xs">
                  Purges ephemeral copies, verifies the canonical model artifact SHA-256 against <code>ModelRegistry.sol</code>, and restores authorized memory state.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleRestoreModel}
                disabled={isRunningTest}
                data-testid="restore-model-btn"
              >
                {isRunningTest ? 'Restoring...' : '↻ RESTORE VERIFIED MODEL'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Controlled Test Inspection & Gating Status */}
        <div className="console-card" data-testid="security-test-results">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Test Telemetry &amp; Gating Status</h3>
            {testResult && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowFullHashes(!showFullHashes)}
              >
                {showFullHashes ? 'Short Form' : 'Full 64-Hex'}
              </button>
            )}
          </div>

          {!testResult ? (
            <div className="empty-state-box" style={{ padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧪</div>
              <strong>No Security Test Active</strong>
              <p className="text-secondary font-xs" style={{ marginTop: '0.25rem' }}>
                Select a test scenario on the left to evaluate fail-closed provenance enforcement.
              </p>
            </div>
          ) : isTampered ? (
            <div className="tamper-alert-panel alert-box danger" data-testid="tamper-detected-alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <h4 style={{ margin: 0 }}>
                  {testResult.scenario === 'unregistered_version'
                    ? 'REJECTED: NOT_REGISTERED (v9.9.9)'
                    : 'SIMULATED MODEL REPLACEMENT DETECTED'}
                </h4>
              </div>

              {/* Dual Hash Comparison Display */}
              <div className="hashes-comparison-grid" data-testid="hash-comparison-box">
                <div className="hash-column registered">
                  <span className="hash-col-label font-xs text-success">REGISTERED REFERENCE</span>
                  <div className="font-mono font-xs" data-testid="registered-reference-hash" style={{ marginTop: '0.25rem' }}>
                    {showFullHashes
                      ? (testResult.registered_hash || 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5')
                      : `${(testResult.registered_hash || 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5').slice(0, 20)}...`}
                  </div>
                </div>

                <div className="hash-inequality" data-testid="mismatch-badge" style={{ color: '#f87171', fontWeight: 'bold', fontSize: '1.5rem' }}>
                  ≠
                </div>

                <div className="hash-column observed">
                  <span className="hash-col-label font-xs text-danger">OBSERVED CANDIDATE</span>
                  <div className="font-mono font-xs" data-testid="observed-candidate-hash" style={{ marginTop: '0.25rem', color: '#fca5a5' }}>
                    {showFullHashes
                      ? (testResult.observed_hash || testResult.local_hash || 'Unregistered Candidate')
                      : `${(testResult.observed_hash || testResult.local_hash || 'Unregistered Candidate').slice(0, 20)}...`}
                  </div>
                </div>
              </div>

              {/* Enforcement Status Breakdown */}
              <div className="tamper-enforcement-status" style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                <div><strong>Result:</strong> <span className="font-mono" style={{ color: '#f87171' }}>{testResult.status}</span></div>
                <div><strong>Model Loading:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>BLOCKED</span></div>
                <div><strong>Downstream Inference:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>DISABLED (HTTP 503 Fail-Closed)</span></div>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#ccc' }}>
                {testResult.message}
              </div>
            </div>
          ) : isRestored ? (
            <div className="alert-box success" data-testid="restored-banner">
              <strong>✓ CANONICAL MODEL RESTORED &amp; VERIFIED:</strong>
              <div style={{ marginTop: '0.25rem' }}>
                Ephemeral candidate purged. Canonical artifact verified on-chain: <code>{testResult.canonical_hash}</code>
              </div>
              <div className="font-mono font-xs text-success" style={{ marginTop: '0.5rem' }}>
                ✓ MODEL LOADED | ✓ INFERENCE AVAILABLE
              </div>
            </div>
          ) : null}

          {/* Technical Note Box */}
          <div
            className="evaluator-explanation-box"
            data-testid="evaluator-explanation-box"
            style={{ marginTop: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '4px' }}
          >
            <h5 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-primary)', fontSize: '0.8rem' }}>Controlled Security Test Architecture</h5>
            <p className="text-secondary font-xs" style={{ margin: 0, lineHeight: '1.4' }}>
              The fail-closed verification gate recalculates SHA-256 prior to model loading into memory. Any mismatch against <code>ModelRegistry.sol</code> terminates deserialization and prevents execution of untrusted machine learning binaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
