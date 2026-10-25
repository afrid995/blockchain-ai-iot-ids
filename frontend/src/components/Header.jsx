import React from 'react';

export function Header({ health, modelStatus, isRefreshing, onRefresh }) {
  const isAppRunning = health?.application_status === 'running';
  const isBlockchainConnected = health?.blockchain_status === 'connected';
  const isModelLoaded = Boolean(modelStatus?.is_loaded ?? (health?.model_status === 'loaded'));
  const verificationStatus = modelStatus?.verification_status || 'UNVERIFIED';

  const getVerificationBadgeClass = () => {
    if (verificationStatus === 'VERIFIED') return 'badge-verified';
    if (verificationStatus === 'HASH_MISMATCH') return 'badge-mismatch';
    if (verificationStatus === 'BLOCKCHAIN_UNAVAILABLE') return 'badge-danger';
    return 'badge-unverified';
  };

  return (
    <header className="app-header">
      <div className="container header-content">
        <div className="brand-group">
          <div className="brand-title">
            <span className="brand-icon">🛡️</span>
            <span>Blockchain-Backed IoT Intrusion Detection</span>
            <span className="console-tag">OPERATIONS CONSOLE</span>
          </div>
          <div className="brand-meta">
            Model: <code className="font-mono">{modelStatus?.model_id || 'iot-ids-rf'}:{modelStatus?.model_version || 'v1.0.0'}</code>
          </div>
        </div>

        <div className="health-pills" data-testid="header-telemetry">
          {/* Provenance Verification Badge */}
          <div className="health-pill" title="Cryptographic Model Provenance Verification Status">
            <span className={`dot ${verificationStatus === 'VERIFIED' ? 'online' : verificationStatus === 'HASH_MISMATCH' ? 'offline' : 'warning'}`} />
            <span className={`badge ${getVerificationBadgeClass()}`} data-testid="header-verification-status">
              ● {verificationStatus}
            </span>
          </div>

          {/* Blockchain Node Status */}
          <div className="health-pill" title="Ethereum EVM Provenance Node Status">
            <span className={`dot ${isBlockchainConnected ? 'online' : 'offline'}`} />
            <span>Blockchain: <strong>{isBlockchainConnected ? 'CONNECTED' : 'DISCONNECTED'}</strong></span>
          </div>

          {/* Inference Engine Memory Status */}
          <div className="health-pill" title="Detection Engine Memory State (Fail-Closed Gate)">
            <span className={`dot ${isModelLoaded ? 'online' : 'warning'}`} />
            <span>Model: <strong>{isModelLoaded ? 'LOADED' : 'UNLOADED'}</strong></span>
          </div>

          {/* Refresh Action */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh system status"
            aria-label="Refresh status"
            data-testid="header-refresh-btn"
          >
            {isRefreshing ? <span className="spinner" /> : '↻ Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
}
