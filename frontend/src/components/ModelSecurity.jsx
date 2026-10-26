import React, { useState } from 'react';

export function ModelSecurity({
  health,
  modelStatus,
  stage2Status,
  isVerifying,
  onVerify,
  verifyResult,
  onLoadModel,
  isModelLoaded,
  verificationError,
}) {
  const [showFullHashes, setShowFullHashes] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('stage1'); // 'stage1' | 'stage2'

  const isStage1 = selectedTarget === 'stage1';
  const activeStatus = isStage1 ? modelStatus : (stage2Status || modelStatus);

  const modelId = isStage1 ? (modelStatus?.model_id || 'iot-ids-rf') : (stage2Status?.model_id || 'iot-ids-attack-classifier');
  const modelVersion = isStage1 ? (modelStatus?.model_version || 'v1.0.0') : (stage2Status?.model_version || 'v1.0.0');
  const algorithm = isStage1 ? (modelStatus?.algorithm || 'RandomForestClassifier') : (stage2Status?.algorithm || 'RandomForestClassifier');
  const artifactPath = isStage1 ? (modelStatus?.model_path || 'ml/artifacts/ids_model.joblib') : (stage2Status?.model_path || 'ml/artifacts/attack_classifier.joblib');
  const artifactSize = verifyResult?.artifact_size_bytes ?? activeStatus?.artifact_size_bytes;
  const contractAddress = verifyResult?.contract_address || activeStatus?.contract_address || 'Unavailable';
  const registrant = verifyResult?.registrant || activeStatus?.registrant || 'Unavailable';
  const registeredAt = verifyResult?.registered_at || activeStatus?.registered_at;
  const formattedDate = registeredAt ? new Date(registeredAt * 1000).toUTCString() : 'Unavailable';

  const localSha = verifyResult?.local_hash || activeStatus?.local_sha256 || null;
  const registeredSha = verifyResult?.registered_hash || activeStatus?.registered_sha256 || null;

  const vStatus = verifyResult?.status || activeStatus?.verification_status || 'UNVERIFIED';
  const isVerified = vStatus === 'VERIFIED';
  const isFailed = vStatus === 'HASH_MISMATCH' || vStatus === 'NOT_REGISTERED' || vStatus === 'BLOCKCHAIN_UNAVAILABLE';
  const effectiveLoaded = isModelLoaded && isVerified;

  const handleVerifyClick = async () => {
    if (onVerify) {
      await onVerify(selectedTarget);
    }
  };

  return (
    <div className="model-security-page" data-testid="model-provenance-card">
      {/* Section Header */}
      <div className="console-section-header">
        <div>
          <h2 className="console-title">Model Security &amp; Blockchain Provenance</h2>
          <p className="console-subtitle">
            Cryptographic verification gate anchoring off-chain machine learning binaries to smart-contract digests.
          </p>
        </div>
        <div>
          <span
            className={`badge ${
              isVerified ? 'badge-verified' : isFailed ? 'badge-mismatch' : 'badge-unverified'
            }`}
            data-testid="status-badge"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
          >
            {isVerified ? 'Verified' : isFailed ? (vStatus === 'HASH_MISMATCH' ? 'Hash Mismatch' : vStatus) : 'Unverified'}
          </span>
        </div>
      </div>

      {/* Verification Error Alert */}
      {verificationError && (
        <div className="alert-box danger" data-testid="verification-error-banner" style={{ marginBottom: '1.5rem' }}>
          <strong>Verification Fault:</strong> {verificationError}
        </div>
      )}

      {/* Main Grid: Target Model Details & Provenance Ledger */}
      <div className="console-grid-2col">
        {/* Left Column: Target Model Governance Card */}
        <div className="console-card">
          <div className="card-header">
            <h3 className="card-title">Target Model Governance</h3>
            <span className="badge badge-secondary">Control-Plane Gating</span>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="model-target-select">
              Select Architecture Stage to Inspect:
            </label>
            <div className="toggle-group">
              <button
                type="button"
                className={`btn-toggle ${isStage1 ? 'active' : ''}`}
                onClick={() => setSelectedTarget('stage1')}
                data-testid="target-stage1-btn"
              >
                Stage 1: Binary IDS (iot-ids-rf)
              </button>
              <button
                type="button"
                className={`btn-toggle ${!isStage1 ? 'active' : ''}`}
                onClick={() => setSelectedTarget('stage2')}
                data-testid="target-stage2-btn"
              >
                Stage 2: Multiclass (iot-ids-attack-classifier)
              </button>
            </div>
          </div>

          <div className="model-provenance-grid">
            <div className="provenance-metric">
              <span className="metric-label">Model Identifier</span>
              <span className="metric-value font-mono" data-testid="model-id">{modelId}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Registered Version</span>
              <span className="metric-value font-mono" data-testid="model-version">{modelVersion}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Algorithm Specification</span>
              <span className="metric-value font-mono" data-testid="model-algorithm">{algorithm}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Physical Binary Location</span>
              <span className="metric-value font-mono font-xs">{artifactPath}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Artifact Size</span>
              <span className="metric-value font-mono font-xs">
                {artifactSize != null ? `${Number(artifactSize).toLocaleString()} bytes` : 'Unavailable'}
              </span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Registry Contract</span>
              <span className="metric-value font-mono font-xs">{contractAddress}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Registrant Wallet</span>
              <span className="metric-value font-mono font-xs text-secondary">{registrant}</span>
            </div>
          </div>

          {/* Operational State Indicators */}
          <div className="security-state-box" style={{ marginTop: '1.25rem' }}>
            <div className="security-state-row">
              <span className="state-label">Cryptographic Verification:</span>
              <strong style={{ color: isVerified ? '#4ade80' : isFailed ? '#f87171' : '#facc15' }}>
                {vStatus}
              </strong>
            </div>
            <div className="security-state-row">
              <span className="state-label">Engine Memory Loading:</span>
              <strong style={{ color: effectiveLoaded ? '#4ade80' : '#f87171' }}>
                {effectiveLoaded ? 'LOADED (Active in Memory)' : 'UNLOADED (Purged fail-closed)'}
              </strong>
            </div>
            <div className="security-state-row">
              <span className="state-label">Off-Chain Inference Gating:</span>
              <strong style={{ color: effectiveLoaded ? '#4ade80' : '#f87171' }}>
                {effectiveLoaded ? 'Inference Enabled' : 'Inference Locked'}
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="model-actions-row" style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleVerifyClick}
              disabled={isVerifying}
              data-testid="verify-btn"
            >
              {isVerifying ? (
                <span>
                  <span className="spinner" /> Verifying Against EVM...
                </span>
              ) : (
                '🛡️ VERIFY MODEL'
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onLoadModel}
              disabled={!isVerified || effectiveLoaded}
              data-testid="load-model-btn"
              title={!isVerified ? 'Model verification required before loading' : effectiveLoaded ? 'Model already loaded and active in memory' : 'Load verified model into execution plane'}
            >
              {effectiveLoaded ? '✓ MODEL READY' : '📥 LOAD MODEL'}
            </button>
          </div>
        </div>

        {/* Right Column: Cryptographic Dual Hash Verification */}
        <div className="console-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Cryptographic Hash Correspondence</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowFullHashes(!showFullHashes)}
              data-testid="toggle-hash-format-btn"
            >
              {showFullHashes ? 'Short Form' : 'Full 64-Hex'}
            </button>
          </div>

          <div className="hash-comparison-panel" data-testid="hash-comparison-box">
            {/* Local Artifact Hash */}
            <div className="hash-row-card">
              <div className="hash-header-row">
                <span className="hash-title">LOCAL DISK ARTIFACT SHA-256</span>
                <span className="badge badge-secondary">Off-Chain Binary</span>
              </div>
              <div className="font-mono font-xs hash-string" data-testid="local-hash">
                {localSha ? (showFullHashes ? localSha : `${localSha.slice(0, 24)}...${localSha.slice(-8)}`) : 'Unavailable'}
              </div>
            </div>

            {/* Blockchain Registered Hash */}
            <div className="hash-row-card" style={{ marginTop: '1rem' }}>
              <div className="hash-header-row">
                <span className="hash-title">BLOCKCHAIN REGISTERED SHA-256</span>
                <span className="badge badge-success">ModelRegistry.sol</span>
              </div>
              <div className="font-mono font-xs hash-string text-success" data-testid="registered-hash">
                {registeredSha ? (showFullHashes ? registeredSha : `${registeredSha.slice(0, 24)}...${registeredSha.slice(-8)}`) : 'Unavailable'}
              </div>
            </div>

            {/* Verification Verdict Box */}
            <div className="verification-verdict-box" style={{ marginTop: '1.25rem' }}>
              {isVerified ? (
                <div className="alert-box success" data-testid="verified-success-box">
                  <strong>✓ PROVENANCE CONFIRMED:</strong> Local artifact SHA-256 matches smart contract digest exactly.
                  <div className="font-xs" style={{ marginTop: '0.25rem' }}>
                    Loaded (Inference Enabled) — Verification latency: {activeStatus?.read_latency_ms != null ? `${activeStatus.read_latency_ms.toFixed(2)} ms` : (verifyResult?.verification_latency_ms != null ? `${verifyResult.verification_latency_ms.toFixed(2)} ms` : 'N/A')}
                  </div>
                </div>
              ) : isFailed ? (
                <div className="alert-box danger" data-testid="verified-mismatch-box">
                  <strong>✗ VERIFICATION GATE ENGAGED:</strong> Verification Failed ({verifyResult?.status || vStatus}).
                  <div className="font-xs" style={{ marginTop: '0.25rem' }}>
                    Unloaded (Inference Blocked) — Candidate artifact does not correspond to the on-chain consensus digest.
                  </div>
                </div>
              ) : (
                <div className="alert-box warning">
                  <strong>○ UNVERIFIED ARTIFACT:</strong> Model pending cryptographic integrity check against the EVM.
                  <div className="font-xs" style={{ marginTop: '0.25rem' }}>
                    Click "VERIFY MODEL" above to evaluate binary digest against <code>ModelRegistry.sol</code>.
                  </div>
                </div>
              )}
            </div>

            {/* Smart Contract Technical Information */}
            <div className="contract-metadata-box" style={{ marginTop: '1rem' }}>
              <div className="spec-item">
                <span className="spec-label">Smart Contract:</span>
                <span className="spec-val font-mono">ModelRegistry.sol (Solidity ^0.8.20)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Contract Interface:</span>
                <span className="spec-val font-mono font-xs">getModelRecord, getModelHash, isModelRegistered</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Network Architecture:</span>
                <span className="spec-val font-mono">Local EVM (RPC: 8545) — Control Plane Only</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Per-Flow Invariant:</span>
                <span className="spec-val font-mono">0 On-Chain Queries During Ingestion</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
