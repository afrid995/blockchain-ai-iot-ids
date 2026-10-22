import React, { useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { AlertBanner } from './AlertBanner';

export function ModelProvenance({
  modelStatus,
  onVerify,
  isVerifying,
  verificationError,
  lastVerifyResult,
}) {
  const isLoaded = modelStatus?.is_loaded;
  const status = modelStatus?.verification_status || 'UNVERIFIED';

  return (
    <div className="card" data-testid="model-provenance-card">
      <div className="card-header">
        <h2 className="card-title">
          <span>📦</span>
          <span>Model Provenance & Integrity Gate</span>
        </h2>
        <StatusBadge status={status} />
      </div>

      {verificationError && (
        <AlertBanner type="danger" message={verificationError} />
      )}

      {lastVerifyResult && !lastVerifyResult.verified && (
        <AlertBanner
          type="danger"
          message={`Verification Failed (${lastVerifyResult.status}): ${
            lastVerifyResult.message || 'Artifact does not match on-chain reference.'
          } Fail-closed gate is active; model is blocked.`}
        />
      )}

      {lastVerifyResult && lastVerifyResult.verified && (
        <AlertBanner
          type="success"
          message={`Verification Succeeded: Local artifact matches blockchain digest. Model loaded into memory.`}
        />
      )}

      <table className="data-table">
        <tbody>
          <tr>
            <th>Model ID</th>
            <td data-testid="model-id">{modelStatus?.model_id || '—'}</td>
          </tr>
          <tr>
            <th>Model Version</th>
            <td data-testid="model-version">{modelStatus?.model_version || '—'}</td>
          </tr>
          <tr>
            <th>Algorithm</th>
            <td>{modelStatus?.algorithm || '—'}</td>
          </tr>
          <tr>
            <th>Memory Gate State</th>
            <td>
              {isLoaded ? (
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  ● Loaded (Inference Enabled)
                </span>
              ) : (
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                  ○ Unloaded (Inference Blocked)
                </span>
              )}
            </td>
          </tr>
          <tr>
            <th>Local Artifact SHA-256</th>
            <td className="hash-cell" data-testid="local-hash">
              {modelStatus?.local_sha256 || 'Calculating...'}
            </td>
          </tr>
          <tr>
            <th>Registered Blockchain SHA-256</th>
            <td className="hash-cell" data-testid="registered-hash">
              {modelStatus?.registered_sha256 || 'Querying registry...'}
            </td>
          </tr>
          {modelStatus?.last_verified_at && (
            <tr>
              <th>Last Verification Time</th>
              <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {new Date(modelStatus.last_verified_at).toLocaleString()}
              </td>
            </tr>
          )}
          {modelStatus?.read_latency_ms !== null &&
            modelStatus?.read_latency_ms !== undefined && (
              <tr>
                <th>On-Chain Query Latency</th>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {modelStatus.read_latency_ms.toFixed(2)} ms{' '}
                  <span style={{ color: 'var(--text-muted)' }}>
                    (local test EVM)
                  </span>
                </td>
              </tr>
            )}
        </tbody>
      </table>

      <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          className="btn btn-verify"
          onClick={onVerify}
          disabled={isVerifying}
          data-testid="verify-btn"
        >
          {isVerifying ? (
            <>
              <span className="spinner" /> Verifying Against EVM...
            </>
          ) : (
            'Verify Model On-Chain'
          )}
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Invokes pre-load verification gate on FastAPI backend
        </span>
      </div>

      <div
        style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-color)',
        }}
      >
        <strong>Research Boundary:</strong> Cryptographic verification establishes
        exact binary correspondence with the registered on-chain digest. It does
        not establish model accuracy, adversarial robustness, or absence of
        training-data poisoning.
      </div>
    </div>
  );
}
