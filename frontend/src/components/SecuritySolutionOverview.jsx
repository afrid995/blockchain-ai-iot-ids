import React, { useState } from 'react';
import { api } from '../api/client';

/**
 * Phase 7D.4 — Security Solution Overview:
 * Authoritative end-to-end security solution state and provenance decision workspace.
 * Responsibilities:
 * - Model Trust: Identity, artifact specs, verification state, gated memory load controls
 * - Provenance Decision: Pre-load verification causal flow against ModelRegistry.sol
 * - Cryptographic Evidence: Real-time SHA-256 calculation vs. on-chain reference comparison
 * - Blockchain Provenance: ModelRegistry contract details, registrant, timestamp
 * - 7-Stage Lifecycle Gate: Step-by-step gate verification status
 * - Overall Security State: High-level solution posture with clear links to dedicated workspaces
 * - Latest Detection Summary: Read-only summary of the most recent inference result
 * - Model Replacement Status: Read-only summary of integrity protection status
 *
 * NOTE: Network traffic selection and hierarchical inference are strictly authoritative
 * in IntrusionDetection.jsx (Intrusion Detection Workbench).
 * Controlled tampering simulation is strictly authoritative in SecurityTesting.jsx.
 */
export function SecuritySolutionOverview({
  health,
  modelStatus,
  stage2Status,
  isModelLoaded,
  isVerifying,
  onVerify,
  verifyResult,
  verificationError,
  onLoadModel,
  predictionResult,
  predictionError,
  auditEvents = [],
  onRefreshStatus,
  onNavigate,
}) {
  // Stage selection for verification inspection
  const [selectedStage, setSelectedStage] = useState('stage1');
  const [localVerifyResult, setLocalVerifyResult] = useState(null);
  const [showCryptoFullHashes, setShowCryptoFullHashes] = useState(false);
  const [isVerifyingLocal, setIsVerifyingLocal] = useState(false);

  // Active stage metadata derivation
  const isStage1 = selectedStage === 'stage1';
  const activeStatus = isStage1 ? modelStatus : (stage2Status || modelStatus);
  const activeVerify = localVerifyResult || (verifyResult && (verifyResult.model_id === (isStage1 ? 'iot-ids-rf' : 'iot-ids-attack-classifier') || verifyResult.model_id === (isStage1 ? 'stage1' : 'stage2')) ? verifyResult : null);

  const modelId = isStage1 ? (modelStatus?.model_id || 'iot-ids-rf') : (stage2Status?.model_id || 'iot-ids-attack-classifier');
  const modelVersion = isStage1 ? (modelStatus?.model_version || 'v1.0.0') : (stage2Status?.model_version || 'v1.0.0');
  const algorithm = activeVerify?.algorithm || activeStatus?.algorithm || 'RandomForestClassifier';
  const modelPath = isStage1 ? (modelStatus?.model_path || 'ml/artifacts/ids_model.joblib') : (stage2Status?.model_path || 'ml/artifacts/attack_classifier.joblib');
  const artifactSizeBytes = activeVerify?.artifact_size_bytes ?? activeStatus?.artifact_size_bytes;

  const registeredDigest = activeVerify?.registered_hash || activeStatus?.registered_sha256 || null;
  const observedDigest = activeVerify?.local_hash || activeStatus?.local_sha256 || null;

  const currentVerifyStatus = activeVerify?.status || activeStatus?.verification_status || 'UNVERIFIED';
  const isDigestMatch = Boolean(observedDigest && registeredDigest && (observedDigest.toLowerCase() === registeredDigest.toLowerCase()));
  const isTargetVerified = currentVerifyStatus === 'VERIFIED' && isDigestMatch;
  const isMismatch = currentVerifyStatus === 'HASH_MISMATCH' || (Boolean(observedDigest && registeredDigest) && !isDigestMatch && currentVerifyStatus !== 'NOT_REGISTERED' && currentVerifyStatus !== 'UNVERIFIED');
  const isNotRegistered = currentVerifyStatus === 'NOT_REGISTERED';
  const isBlockchainUnavailable = currentVerifyStatus === 'BLOCKCHAIN_UNAVAILABLE';

  const contractAddress = activeVerify?.contract_address || activeStatus?.contract_address || null;
  const registrantAddress = activeVerify?.registrant || activeStatus?.registrant || null;
  const registeredAtTimestamp = activeVerify?.registered_at || activeStatus?.registered_at || null;
  const formattedRegistrationDate = registeredAtTimestamp ? new Date(registeredAtTimestamp * 1000).toUTCString() : 'Unavailable';

  // Overall system verification states
  const verificationStatus = modelStatus?.verification_status || 'UNVERIFIED';
  const isVerified = verificationStatus === 'VERIFIED';
  const isFailClosed = !isModelLoaded || !isVerified;

  // Handle explicit verification of selected stage
  const handleVerifyAuthorized = async () => {
    setIsVerifyingLocal(true);
    try {
      if (onVerify) {
        const res = await onVerify(selectedStage);
        if (res) setLocalVerifyResult(res);
      } else {
        const res = await api.verifyModel(selectedStage);
        setLocalVerifyResult(res);
        if (onRefreshStatus) await onRefreshStatus();
      }
    } catch {
      // verification error captured by parent or local
    } finally {
      setIsVerifyingLocal(false);
    }
  };

  return (
    <div className="security-solution-overview" data-testid="solution-overview-page">
      {/* 1. SECTION HEADER & OBJECTIVE STATEMENT */}
      <div className="console-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🎯</span>
            <h2 className="console-title" style={{ margin: 0 }}>End-to-End Security Solution</h2>
            <span className="console-tag">PROVENANCE &amp; TRUST STATE</span>
          </div>
          <p className="console-subtitle" style={{ marginTop: '0.35rem' }}>
            Authoritative security posture, cryptographic model trust validation, on-chain provenance governance, and high-level solution telemetry.
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

      {/* Fail-Closed Gate Alert if Model is not loaded or mismatch */}
      {isFailClosed && (
        <div className="alert-box danger" style={{ marginBottom: '1.5rem' }} data-testid="solution-fail-closed-alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <div>
              <strong>FAIL-CLOSED ENFORCEMENT ENGAGED:</strong> Model memory is currently unloaded or unverified.
              Inference is locked fail-closed until models are cryptographically verified against <code>ModelRegistry.sol</code> and authorized for execution.
            </div>
          </div>
        </div>
      )}

      {/* Verification Error Banner */}
      {verificationError && (
        <div className="alert-box danger" style={{ marginBottom: '1.5rem' }} data-testid="solution-verification-error">
          <strong>Verification Error:</strong> {verificationError}
        </div>
      )}

      {/* 2. HIGH-LEVEL PIPELINE STATUS BAR */}
      <div className="console-card" style={{ marginBottom: '1.5rem', padding: '1rem' }} data-testid="pipeline-tracker">
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
          END-TO-END SECURITY SOLUTION POSTURE
        </div>
        <div className="pipeline-steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
          <div className={`pipeline-step-box ${isVerified && isModelLoaded ? 'step-active' : 'step-locked'}`}>
            <span className="font-xs text-muted">[1] MODEL PROVENANCE</span>
            <strong style={{ color: isVerified && isModelLoaded ? '#4ade80' : '#f87171' }}>
              {isVerified && isModelLoaded ? '✓ LOADED & ACTIVE' : isVerified ? 'VERIFIED (UNLOADED)' : 'LOCKED FAIL-CLOSED'}
            </strong>
          </div>
          <div className={`pipeline-step-box ${isModelLoaded ? 'step-active' : ''}`}>
            <span className="font-xs text-muted">[2] INTRUSION DETECTION</span>
            <strong style={{ color: isModelLoaded ? '#60a5fa' : '#94a3b8' }}>
              {isModelLoaded ? 'READY IN WORKBENCH' : 'ENGINE LOCKED'}
            </strong>
          </div>
          <div className={`pipeline-step-box ${predictionResult ? 'step-active' : ''}`}>
            <span className="font-xs text-muted">[3] LATEST INFERENCE</span>
            <strong>
              {predictionResult ? (predictionResult.stage1_prediction || predictionResult.prediction) : 'NO RUN YET'}
            </strong>
          </div>
          <div className={`pipeline-step-box ${predictionResult?.advisory_recommendation ? 'step-active' : ''}`}>
            <span className="font-xs text-muted">[4] OPERATOR ADVISORY</span>
            <strong>
              {predictionResult?.advisory_recommendation ? `${predictionResult.advisory_recommendation.investigation_priority} PRIORITY` : 'ADVISORY READY'}
            </strong>
          </div>
          <div className="pipeline-step-box step-active">
            <span className="font-xs text-muted">[5] OPERATIONAL AUDIT</span>
            <strong style={{ color: '#4ade80' }}>
              0 PER-FLOW EVM QUERIES
            </strong>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN MAIN GRID: MODEL TRUST (LEFT) & SYSTEM SECURITY STATE (RIGHT) */}
      <div className="console-grid-2col">
        {/* LEFT COLUMN: MODEL TRUST & PROVENANCE GATE */}
        <div className="console-card" data-testid="solution-model-trust-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Model Trust &amp; Provenance Verification</h3>
            <span
              className={`badge ${isTargetVerified ? 'badge-verified' : isMismatch ? 'badge-mismatch' : 'badge-unverified'}`}
              data-testid="solution-model-trust-badge"
            >
              {isTargetVerified ? '● VERIFIED' : isMismatch ? '⚠️ HASH_MISMATCH' : isNotRegistered ? '● NOT REGISTERED' : '● UNVERIFIED'}
            </span>
          </div>

          {/* Architecture Stage Selector */}
          <div className="form-group" style={{ marginBottom: '1rem' }} data-testid="stage-target-selector">
            <label className="form-label" htmlFor="solution-stage-target-select">
              Select Architecture Stage to Inspect:
            </label>
            <div className="toggle-group">
              <button
                type="button"
                className={`btn-toggle ${isStage1 ? 'active' : ''}`}
                onClick={() => { setSelectedStage('stage1'); setLocalVerifyResult(null); }}
                data-testid="target-stage1-btn"
              >
                Stage 1: Binary IDS (iot-ids-rf)
              </button>
              <button
                type="button"
                className={`btn-toggle ${!isStage1 ? 'active' : ''}`}
                onClick={() => { setSelectedStage('stage2'); setLocalVerifyResult(null); }}
                data-testid="target-stage2-btn"
              >
                Stage 2: Multiclass (iot-ids-attack-classifier)
              </button>
            </div>
          </div>

          {/* Model Identity Metadata Grid */}
          <div className="flow-spec-card" style={{ marginBottom: '1rem' }}>
            <div className="flow-spec-header">
              <span>TARGET MODEL ARTIFACT METADATA</span>
              <span className="font-mono font-xs text-secondary">{modelId}:{modelVersion}</span>
            </div>
            <div className="flow-spec-grid">
              <div className="spec-item">
                <span className="spec-label">Model Identifier:</span>
                <span className="spec-val font-mono">{modelId}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Model Version:</span>
                <span className="spec-val font-mono">{modelVersion}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Algorithm:</span>
                <span className="spec-val font-mono">{algorithm}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Disk Artifact Path:</span>
                <span className="spec-val font-mono font-xs">{modelPath}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Artifact Size:</span>
                <span className="spec-val font-mono font-xs">
                  {artifactSizeBytes != null ? `${Number(artifactSizeBytes).toLocaleString()} bytes (${Math.round(artifactSizeBytes / 1024)} KB)` : 'Unavailable'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Execution Plane:</span>
                <span className="spec-val font-mono font-xs" style={{ color: isModelLoaded ? '#4ade80' : '#f87171' }}>
                  {isModelLoaded ? 'LOADED (Active Memory)' : 'UNLOADED (Locked Fail-Closed)'}
                </span>
              </div>
            </div>
          </div>

          {/* Verification & Model Load Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleVerifyAuthorized}
              disabled={isVerifying || isVerifyingLocal}
              data-testid="solution-verify-btn"
              style={{ flex: 1, minWidth: '180px' }}
            >
              {isVerifying || isVerifyingLocal ? 'Verifying Against Blockchain...' : '✓ VERIFY AUTHORIZED MODEL'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onLoadModel}
              disabled={!isTargetVerified}
              data-testid="solution-load-btn"
              style={{ flex: 1, minWidth: '180px' }}
              title={!isTargetVerified ? 'Model verification required before loading into memory' : 'Authorize and load verified model into execution plane'}
            >
              📥 AUTHORIZE &amp; LOAD MODEL
            </button>
          </div>

          {/* Decision Panel with Causal Flow */}
          <div className={`decision-panel ${isTargetVerified ? 'verified' : isMismatch ? 'mismatch' : isNotRegistered ? 'not-registered' : isBlockchainUnavailable ? 'blocked' : 'unverified'}`} data-testid="solution-decision-panel">
            <div className="decision-header">
              <span className="decision-icon">
                {isTargetVerified ? '✓' : isMismatch ? '⚠️' : isNotRegistered ? '❓' : isBlockchainUnavailable ? '🔌' : 'ℹ️'}
              </span>
              <strong className="decision-verdict">
                DECISION: {isTargetVerified ? 'VERIFIED — MODEL LOAD AUTHORIZED' : isMismatch ? 'HASH_MISMATCH — MODEL LOAD BLOCKED (FAIL-CLOSED)' : isNotRegistered ? 'NOT_REGISTERED — MODEL LOAD BLOCKED' : isBlockchainUnavailable ? 'BLOCKCHAIN_UNAVAILABLE — MODEL LOAD BLOCKED (FAIL-CLOSED)' : 'UNVERIFIED — RUN VERIFICATION'}
              </strong>
            </div>
            <div className="decision-causal-flow" data-testid="decision-causal-flow">
              {isTargetVerified ? (
                <>
                  Registered model found ({modelId}:{modelVersion})<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;+<br />
                  Observed SHA-256 matches registered digest ({registeredDigest ? registeredDigest.slice(0, 16) : ''}...)<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  <strong>VERIFIED</strong><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  Model loading authorized for inference execution plane
                </>
              ) : isMismatch ? (
                <>
                  Registered model found ({modelId}:{modelVersion})<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;+<br />
                  Observed SHA-256 differs from registered digest<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  <strong>HASH_MISMATCH</strong><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  Model loading blocked fail-closed; inference locked
                </>
              ) : isNotRegistered ? (
                <>
                  Model identity not found in smart contract registry<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  <strong>NOT_REGISTERED</strong><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  Model loading blocked fail-closed; inference locked
                </>
              ) : isBlockchainUnavailable ? (
                <>
                  Blockchain RPC endpoint is unreachable<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  <strong>BLOCKCHAIN_UNAVAILABLE</strong><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  Model loading blocked fail-closed; inference locked
                </>
              ) : (
                <>
                  Model artifact awaiting cryptographic integrity verification<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  <strong>UNVERIFIED</strong><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
                  Run verification before loading into memory
                </>
              )}
            </div>
          </div>

          {/* Cryptographic Evidence Panel: SHA-256 Integrity Check */}
          <div className="evidence-panel" style={{ marginTop: '1rem' }} data-testid="solution-crypto-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🔐</span>
                <strong style={{ fontSize: '0.88rem', letterSpacing: '0.04em' }}>SHA-256 INTEGRITY CHECK</strong>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm font-xs"
                onClick={() => setShowCryptoFullHashes(!showCryptoFullHashes)}
                data-testid="crypto-toggle-hash-btn"
              >
                {showCryptoFullHashes ? 'Short Form' : 'Full 64-Hex'}
              </button>
            </div>

            <div className="crypto-hash-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span className="font-xs text-muted">CALCULATION STATUS:</span>
                <span className={`font-mono font-xs ${observedDigest ? 'text-success' : 'text-muted'}`}>
                  {observedDigest ? '✓ COMPLETED (Calculated on Disk Artifact)' : '○ PENDING (Artifact not yet evaluated)'}
                </span>
              </div>

              <div className="hashes-comparison-grid" style={{ marginTop: '0.5rem' }} data-testid="solution-hash-comparison">
                <div className="hash-column">
                  <span className="hash-col-label font-xs text-muted">OBSERVED ARTIFACT DIGEST</span>
                  <div
                    className="font-mono font-xs text-primary"
                    style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}
                    data-testid="crypto-observed-hash"
                    title={observedDigest || 'Unavailable'}
                  >
                    {observedDigest
                      ? (showCryptoFullHashes
                        ? observedDigest
                        : `${observedDigest.slice(0, 16)}...${observedDigest.slice(-8)}`)
                      : 'Unavailable'}
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: isDigestMatch ? '#34d399' : (observedDigest && registeredDigest) ? '#f87171' : '#94a3b8' }}>
                    {isDigestMatch ? '=' : (observedDigest && registeredDigest) ? '≠' : '?'}
                  </span>
                </div>

                <div className="hash-column">
                  <span className="hash-col-label font-xs text-muted">REGISTERED REFERENCE DIGEST</span>
                  <div
                    className="font-mono font-xs text-success"
                    style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}
                    data-testid="crypto-registered-hash"
                    title={registeredDigest || 'Unavailable'}
                  >
                    {registeredDigest
                      ? (showCryptoFullHashes
                        ? registeredDigest
                        : `${registeredDigest.slice(0, 16)}...${registeredDigest.slice(-8)}`)
                      : 'Unavailable'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Provenance Details Panel */}
          <div className="evidence-panel" style={{ marginTop: '1rem' }} data-testid="solution-blockchain-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.1rem' }}>⛓️</span>
              <strong style={{ fontSize: '0.88rem', letterSpacing: '0.04em' }}>BLOCKCHAIN PROVENANCE LEDGER (ModelRegistry.sol)</strong>
            </div>

            <div className="flow-spec-grid">
              <div className="spec-item">
                <span className="spec-label">Smart Contract Address:</span>
                <span className="spec-val font-mono font-xs text-primary" data-testid="blockchain-contract-address">
                  {contractAddress || 'Unavailable'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Queried Model / Version:</span>
                <span className="spec-val font-mono font-xs">
                  {modelId}:{modelVersion}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Registration Status:</span>
                <span className={`spec-val font-mono font-xs ${registeredDigest ? 'text-success' : isNotRegistered ? 'text-danger' : 'text-muted'}`} data-testid="blockchain-reg-status">
                  {registeredDigest ? '✓ REGISTERED (isModelRegistered = true)' : isNotRegistered ? '✗ NOT REGISTERED (isModelRegistered = false)' : isBlockchainUnavailable ? '⚠️ UNAVAILABLE (Contract unreachable)' : '○ UNKNOWN (Registry not queried)'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Registered Algorithm:</span>
                <span className="spec-val font-mono font-xs" data-testid="blockchain-algorithm">
                  {activeVerify?.algorithm || activeStatus?.algorithm || 'Unavailable'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Registrant Address:</span>
                <span className="spec-val font-mono font-xs text-secondary" data-testid="blockchain-registrant">
                  {registrantAddress || 'Unavailable'}
                </span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Registration Timestamp:</span>
                <span className="spec-val font-mono font-xs text-secondary" data-testid="blockchain-timestamp">
                  {formattedRegistrationDate}
                </span>
              </div>
            </div>

            <div className="spec-item" style={{ marginTop: '0.5rem' }}>
              <span className="spec-label">Registered SHA-256 Digest:</span>
              <span className="spec-val font-mono font-xs text-success" style={{ wordBreak: 'break-all' }} data-testid="blockchain-reg-digest">
                {registeredDigest || 'Unavailable'}
              </span>
            </div>

            <div className="font-xs text-muted" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', lineHeight: '1.5' }}>
              <em>Contract Interface:</em> Backend verification service queried the registered model record via web3 contract call (<code>getModelRecord</code>, <code>getModelHash</code>, <code>isModelRegistered</code>).
            </div>
          </div>

          {/* 7-Stage Lifecycle Gate Tracker */}
          <div className="evidence-panel" style={{ marginTop: '1rem' }} data-testid="solution-lifecycle-tracker">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🚦</span>
              <strong style={{ fontSize: '0.88rem', letterSpacing: '0.04em' }}>MODEL-LOADING GATE LIFECYCLE (7-STAGE)</strong>
            </div>

            <div className="lifecycle-steps-grid">
              <div className="lifecycle-step-card">
                <span className="font-xs text-muted">1. ARTIFACT</span>
                <span className={`lifecycle-pill ${observedDigest || activeStatus?.model_path ? 'passed' : 'pending'}`}>
                  {observedDigest || activeStatus?.model_path ? 'Passed' : 'Pending'}
                </span>
                <span className="font-mono font-xs" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {observedDigest || activeStatus?.model_path ? 'Found on disk' : 'Unchecked'}
                </span>
              </div>
              <div className="lifecycle-step-card">
                <span className="font-xs text-muted">2. SHA-256</span>
                <span className={`lifecycle-pill ${observedDigest ? 'passed' : 'pending'}`}>
                  {observedDigest ? 'Passed' : 'Pending'}
                </span>
                <span className="font-mono font-xs" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {observedDigest ? 'Digest calculated' : 'Not calculated'}
                </span>
              </div>
              <div className="lifecycle-step-card">
                <span className="font-xs text-muted">3. REGISTRY</span>
                <span className={`lifecycle-pill ${registeredDigest ? 'passed' : isBlockchainUnavailable ? 'failed' : isNotRegistered ? 'failed' : 'pending'}`}>
                  {registeredDigest ? 'Passed' : isBlockchainUnavailable ? 'Unavailable' : isNotRegistered ? 'Not Found' : 'Pending'}
                </span>
                <span className="font-mono font-xs" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {registeredDigest ? 'Record queried' : isBlockchainUnavailable ? 'RPC unreachable' : isNotRegistered ? 'Record missing' : 'Not queried'}
                </span>
              </div>
              <div className="lifecycle-step-card">
                <span className="font-xs text-muted">4. COMPARISON</span>
                <span className={`lifecycle-pill ${observedDigest && registeredDigest ? (isDigestMatch ? 'passed' : 'failed') : isBlockchainUnavailable ? 'blocked' : 'pending'}`}>
                  {observedDigest && registeredDigest ? (isDigestMatch ? 'Passed' : 'Failed') : isBlockchainUnavailable ? 'Blocked' : 'Pending'}
                </span>
                <span className="font-mono font-xs" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {observedDigest && registeredDigest ? (isDigestMatch ? 'Digests match' : 'Digests differ') : isBlockchainUnavailable ? 'Registry unavailable' : 'Awaiting digests'}
                </span>
              </div>
              <div className="lifecycle-step-card">
                <span className="font-xs text-muted">5. DECISION</span>
                <span className={`lifecycle-pill ${isTargetVerified ? 'passed' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'failed' : 'pending'}`}>
                  {isTargetVerified ? 'Passed' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'Failed' : 'Pending'}
                </span>
                <span className="font-mono font-xs" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {isTargetVerified ? 'VERIFIED' : (isMismatch ? 'HASH_MISMATCH' : isNotRegistered ? 'NOT_REGISTERED' : isBlockchainUnavailable ? 'UNAVAILABLE' : 'Not verified')}
                </span>
              </div>
              <div className="lifecycle-step-card">
                <span className="font-xs text-muted">6. LOAD GATE</span>
                <span className={`lifecycle-pill ${isTargetVerified ? 'passed' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'blocked' : 'pending'}`}>
                  {isTargetVerified ? 'Passed' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'Blocked' : 'Pending'}
                </span>
                <span className="font-mono font-xs" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {isTargetVerified ? 'Load authorized' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'Load blocked' : 'Pending verification'}
                </span>
              </div>
              <div className="lifecycle-step-card">
                <span className="font-xs text-muted">7. IDS STATUS</span>
                <span className={`lifecycle-pill ${isTargetVerified && isModelLoaded ? 'passed' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'blocked' : 'pending'}`}>
                  {isTargetVerified && isModelLoaded ? 'Passed' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'Blocked' : 'Pending'}
                </span>
                <span className="font-mono font-xs" style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {isTargetVerified && isModelLoaded ? 'Inference ready' : (isMismatch || isNotRegistered || isBlockchainUnavailable) ? 'Inference locked' : 'Engine unloaded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: END-TO-END SECURITY STATE, WORKSPACE OWNERSHIP & DETECTION TELEMETRY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Workspace Ownership & Authoritative Functions Card */}
          <div className="console-card" data-testid="solution-security-state-panel">
            <div className="card-header">
              <h3 className="card-title">Operational Workspace Ownership</h3>
              <span className="badge badge-info">Architecture Separation</span>
            </div>
            <p className="font-xs text-secondary" style={{ marginBottom: '1rem' }}>
              Each major capability is authoritatively governed in its dedicated workspace. Use the quick-links below to navigate directly to operational components:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Intrusion Detection Card */}
              <div className="flow-spec-card" style={{ padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>⚡ Network Traffic &amp; Intrusion Detection</strong>
                    <p className="font-xs text-muted" style={{ margin: '0.2rem 0 0 0' }}>
                      Select UNSW-NB15 traffic records and run hierarchical classification (Stage 1 Binary IDS → Stage 2 Multiclass → Deterministic Advisory).
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate && onNavigate('detection')}
                    data-testid="nav-to-detection-btn"
                  >
                    Open Detection Workbench →
                  </button>
                </div>
              </div>

              {/* Security Testing Card */}
              <div className="flow-spec-card" style={{ padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>🧪 Security Testing Facility</strong>
                    <p className="font-xs text-muted" style={{ margin: '0.2rem 0 0 0' }}>
                      Run controlled model-replacement simulations, test unregistered candidate versions, and verify fail-closed locks and state recovery.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate && onNavigate('security-testing')}
                    data-testid="nav-to-testing-btn"
                  >
                    Open Security Testing →
                  </button>
                </div>
              </div>

              {/* Model Security Card */}
              <div className="flow-spec-card" style={{ padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>🛡️ Model Security &amp; Blockchain Provenance</strong>
                    <p className="font-xs text-muted" style={{ margin: '0.2rem 0 0 0' }}>
                      Inspect on-chain ModelRegistry registration ledger, verify cryptographic digests, and configure pre-load gates.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate && onNavigate('model-security')}
                    data-testid="nav-to-model-security-btn"
                  >
                    Open Model Security →
                  </button>
                </div>
              </div>

              {/* Operational Audit Card */}
              <div className="flow-spec-card" style={{ padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>📜 Local Operational Audit Log</strong>
                    <p className="font-xs text-muted" style={{ margin: '0.2rem 0 0 0' }}>
                      Browse, filter, and audit local tamper-evident event records logged off-chain in SQLite (0 per-flow blockchain lookups).
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate && onNavigate('audit')}
                    data-testid="nav-to-audit-btn"
                  >
                    View Audit Events →
                  </button>
                </div>
              </div>

              {/* Research Results Card */}
              <div className="flow-spec-card" style={{ padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>📑 Empirical Research Results</strong>
                    <p className="font-xs text-muted" style={{ margin: '0.2rem 0 0 0' }}>
                      Review authoritative benchmark metrics, confusion matrices, Fuzzers cascade limitations, and timing experiments.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate && onNavigate('research-results')}
                    data-testid="nav-to-research-btn"
                  >
                    View Research Results →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Model Tampering Incident Status Card */}
          {(verificationStatus === 'HASH_MISMATCH' || activeVerify?.status === 'HASH_MISMATCH' || activeStatus?.verification_status === 'HASH_MISMATCH') && (
            <div className="console-card alert-box danger" data-testid="solution-tamper-detected-alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                <h4 style={{ margin: 0, color: '#f87171' }}>TAMPERING / REPLACEMENT INCIDENT DETECTED</h4>
              </div>
              <p className="font-xs" style={{ margin: '0 0 0.75rem 0' }}>
                Observed model artifact digest does not match the reference digest registered in <code>ModelRegistry.sol</code>.
                The fail-closed gate has blocked deserialization and locked all inference requests.
              </p>
              <div className="spec-item">
                <span className="spec-label">Enforcement Action:</span>
                <span className="spec-val font-mono font-xs text-danger">MODEL LOAD: BLOCKED | INFERENCE: LOCKED</span>
              </div>
              <div className="spec-item" style={{ marginTop: '0.4rem' }}>
                <span className="spec-label">Verification Status:</span>
                <span className="spec-val font-mono font-xs text-warning">HASH_MISMATCH</span>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-warning btn-sm"
                  onClick={() => onNavigate && onNavigate('security-testing')}
                >
                  Go to Security Testing Facility to Restore Verified State →
                </button>
              </div>
            </div>
          )}

          {/* LATEST DETECTION OUTCOME (COMPACT READ-ONLY SUMMARY) */}
          <div className="console-card" data-testid="solution-latest-detection-card">
            <div className="card-header">
              <h3 className="card-title">Latest Detection Status (Read-Only Summary)</h3>
              <span className="badge badge-secondary font-mono font-xs">
                {predictionResult ? 'COMPLETED' : 'Awaiting Flow Analysis'}
              </span>
            </div>

            {!predictionResult ? (
              <div className="empty-state-box" style={{ padding: '1.5rem', textAlign: 'center' }} data-testid="solution-no-detection">
                <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>📡</div>
                <strong>No Detection Run In Current Session</strong>
                <p className="text-secondary font-xs" style={{ maxWidth: '380px', margin: '0.35rem auto 0.75rem auto' }}>
                  Network-flow selection and classification are performed exclusively in the Intrusion Detection Workbench.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate && onNavigate('detection')}
                  data-testid="solution-goto-workbench-btn"
                >
                  ⚡ Open Intrusion Detection Workbench
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} data-testid="solution-latest-detection">
                <div className="flow-spec-card" style={{ padding: '0.85rem' }} data-testid="solution-stage1-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span className="font-xs text-muted" style={{ display: 'block' }}>LATEST INFERENCE STATUS</span>
                      <strong className="font-mono font-xs" style={{ color: '#4ade80' }}>COMPLETED</strong>
                    </div>
                    <div>
                      <span className="font-xs text-muted" style={{ display: 'block' }}>STAGE 1 VERDICT</span>
                      <strong
                        className="font-mono"
                        style={{
                          fontSize: '1rem',
                          color:
                            predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                              ? '#f87171'
                              : '#4ade80',
                        }}
                        data-testid="solution-stage1-verdict"
                      >
                        {predictionResult.stage1_prediction || predictionResult.prediction || 'Unknown'}
                      </strong>
                    </div>
                    <div>
                      <span className="font-xs text-muted" style={{ display: 'block' }}>STAGE 1 CONFIDENCE</span>
                      <span className="font-mono font-xs" data-testid="solution-stage1-confidence">
                        {((predictionResult.stage1_confidence ?? predictionResult.confidence ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="font-xs text-muted" style={{ lineHeight: '1.4' }}>
                  <em>Note:</em> Stage 2 attack classification, operator advisory guidance, and audit event logs are maintained authoritatively in the Intrusion Detection Workbench and Operational Audit workspaces.
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate && onNavigate('detection')}
                  data-testid="solution-goto-workbench-details-btn"
                >
                  Open Intrusion Detection Workbench →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
