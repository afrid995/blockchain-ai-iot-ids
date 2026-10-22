import React from 'react';

export function Header({ health, isRefreshing, onRefresh }) {
  const isAppRunning = health?.application_status === 'running';
  const isBlockchainConnected = health?.blockchain_status === 'connected';
  const isModelLoaded = health?.model_status === 'loaded';

  return (
    <header className="app-header">
      <div className="container header-content">
        <div>
          <div className="brand-title">
            <span>🛡️</span>
            <span>Blockchain-Backed IoT Intrusion Detection</span>
          </div>
          <div className="brand-subtitle">
            Cryptographic Model Provenance Registry & Off-Chain ML Inference
          </div>
        </div>

        <div className="health-pills">
          <div className="health-pill" title="FastAPI Backend Status">
            <span className={`dot ${isAppRunning ? 'online' : 'offline'}`} />
            <span>API: {health?.application_status || 'offline'}</span>
          </div>

          <div className="health-pill" title="Ethereum EVM Connection Status">
            <span className={`dot ${isBlockchainConnected ? 'online' : 'offline'}`} />
            <span>EVM: {health?.blockchain_status || 'disconnected'}</span>
          </div>

          <div className="health-pill" title="Fail-Closed Model Memory Status">
            <span className={`dot ${isModelLoaded ? 'online' : 'warning'}`} />
            <span>Model: {health?.model_status || 'unloaded'}</span>
          </div>

          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            title="Refresh system status"
            aria-label="Refresh status"
          >
            {isRefreshing ? <span className="spinner" /> : '↻ Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
}
