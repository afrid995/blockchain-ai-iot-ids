import React from 'react';
import { aggregatePredictions, aggregateVerifications } from '../utils/analytics';

export function Dashboard({
  health,
  modelStatus,
  stage2Status,
  auditEvents = [],
  auditTotal = 0,
  onNavigate,
}) {
  const isAppRunning = health?.application_status === 'running';
  const isBlockchainConnected = health?.blockchain_status === 'connected';
  const isModelLoaded = Boolean(modelStatus?.is_loaded ?? (health?.model_status === 'loaded'));
  const verificationStatus = modelStatus?.verification_status || 'UNVERIFIED';

  // Compute operational aggregates deterministically from actual audit events
  const predSummary = aggregatePredictions(auditEvents);
  const totalPredictions = predSummary.total;
  const benignCount = predSummary.benignCount;
  const attackCount = predSummary.attackCount;

  const verifSummary = aggregateVerifications(auditEvents);
  const totalVerifications = verifSummary.total;
  const verificationSuccessCount = verifSummary.successCount;
  const verificationFailureCount = verifSummary.failureCount;

  // Format timestamp helper
  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return String(ts);
    }
  };

  return (
    <div className="dashboard-page" data-testid="dashboard-page">
      {/* Page Header */}
      <div className="console-section-header">
        <div>
          <h2 className="console-title">Security Operations Dashboard</h2>
          <p className="console-subtitle">
            Operational status and telemetry for blockchain-backed model provenance and off-chain intrusion detection.
          </p>
        </div>
      </div>

      {/* 1. System Status Grid */}
      <div className="system-status-grid" data-testid="system-status-grid">
        <div className="status-card" data-testid="status-card-app">
          <div className="card-header-sm">
            <span className="card-title-sm">APPLICATION SERVICE</span>
            <span className={`status-dot ${isAppRunning ? 'online' : 'offline'}`} />
          </div>
          <div className="card-value-large font-mono">
            {health?.application_status?.toUpperCase() || 'OFFLINE'}
          </div>
          <div className="card-footer-meta">
            FastAPI REST Server: <code>127.0.0.1:8000</code>
          </div>
        </div>

        <div className="status-card" data-testid="status-card-blockchain">
          <div className="card-header-sm">
            <span className="card-title-sm">BLOCKCHAIN REGISTRY</span>
            <span className={`status-dot ${isBlockchainConnected ? 'online' : 'offline'}`} />
          </div>
          <div className="card-value-large font-mono">
            {isBlockchainConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </div>
          <div className="card-footer-meta">
            Control-Plane: <code>ModelRegistry.sol</code>
          </div>
        </div>

        <div className="status-card" data-testid="status-card-model">
          <div className="card-header-sm">
            <span className="card-title-sm">MODEL PROVENANCE GATE</span>
            <span className={`status-dot ${verificationStatus === 'VERIFIED' ? 'online' : verificationStatus === 'HASH_MISMATCH' ? 'offline' : 'warning'}`} />
          </div>
          <div className="card-value-large font-mono" data-testid="dashboard-verification-status">
            {verificationStatus}
          </div>
          <div className="card-footer-meta">
            Memory Engine: <strong>{isModelLoaded ? 'LOADED (Active)' : 'UNLOADED (Locked)'}</strong>
          </div>
        </div>

        <div className="status-card" data-testid="status-card-identity">
          <div className="card-header-sm">
            <span className="card-title-sm">ACTIVE DETECTOR ID</span>
            <span className="badge badge-info">Stage 1</span>
          </div>
          <div className="card-value-medium font-mono" data-testid="dashboard-model-id">
            {modelStatus?.model_id || 'iot-ids-rf'}:{modelStatus?.model_version || 'v1.0.0'}
          </div>
          <div className="card-footer-meta">
            Algorithm: <code>{modelStatus?.algorithm || 'RandomForestClassifier'}</code>
          </div>
        </div>
      </div>

      {/* 2. Detection Summary (Session Summary) */}
      <div className="console-panel" style={{ marginTop: '1.5rem' }} data-testid="detection-summary-panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Detection &amp; Verification Summary</h3>
            <p className="panel-subtitle">Current session aggregates derived from verified operational audit records.</p>
          </div>
          <span className="badge badge-secondary">Recorded Events</span>
        </div>

        <div className="summary-metrics-row">
          <div className="summary-metric-box">
            <span className="summary-label">TOTAL PREDICTIONS</span>
            <span className="summary-number font-mono" data-testid="summary-total-predictions">{totalPredictions}</span>
            <span className="summary-subtext">Off-chain flow evaluations</span>
          </div>

          <div className="summary-metric-box">
            <span className="summary-label">BENIGN FLOWS</span>
            <span className="summary-number font-mono" style={{ color: '#4ade80' }} data-testid="summary-benign-count">{benignCount}</span>
            <span className="summary-subtext">Classified normal traffic</span>
          </div>

          <div className="summary-metric-box">
            <span className="summary-label">ATTACK DETECTIONS</span>
            <span className="summary-number font-mono" style={{ color: '#f87171' }} data-testid="summary-attack-count">{attackCount}</span>
            <span className="summary-subtext">Gated to Stage 2 multiclass</span>
          </div>

          <div className="summary-metric-box">
            <span className="summary-label">PROVENANCE CHECKS</span>
            <span className="summary-number font-mono" style={{ color: '#60a5fa' }}>{totalVerifications}</span>
            <span className="summary-subtext">{verificationSuccessCount} verified / {verificationFailureCount} alerts</span>
          </div>

          <div className="summary-metric-box">
            <span className="summary-label">TOTAL AUDIT EVENTS</span>
            <span className="summary-number font-mono">{auditTotal}</span>
            <span className="summary-subtext">Persistent local SQLite log</span>
          </div>
        </div>
      </div>

      {/* 3. Recent Security Events Table */}
      <div className="console-panel" style={{ marginTop: '1.5rem' }} data-testid="recent-events-panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="panel-title">Recent Security Events</h3>
            <p className="panel-subtitle">Chronological ledger of operational verification and classification events.</p>
          </div>
          {onNavigate && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('audit')}
              data-testid="view-audit-link-btn"
            >
              View Full Audit Log →
            </button>
          )}
        </div>

        {auditEvents.length === 0 ? (
          <div className="empty-state-box">
            No audit events recorded in this session. Execute flow predictions or model verifications to generate audit records.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="console-table" data-testid="recent-events-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>TIME</th>
                  <th style={{ width: '220px' }}>EVENT</th>
                  <th style={{ width: '130px' }}>STATUS</th>
                  <th>TARGET MODEL</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.slice(0, 6).map((evt) => (
                  <tr key={evt.event_id || evt.timestamp}>
                    <td className="font-mono font-xs text-muted">{formatTime(evt.timestamp)}</td>
                    <td>
                      <span className="event-type-badge font-mono">{evt.event_type}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          evt.status === 'SUCCESS' || evt.verification_status === 'VERIFIED'
                            ? 'badge-success'
                            : evt.status === 'WARNING' || evt.verification_status === 'HASH_MISMATCH'
                            ? 'badge-danger'
                            : 'badge-secondary'
                        }`}
                      >
                        {evt.verification_status || evt.status || 'RECORDED'}
                      </span>
                    </td>
                    <td className="font-mono font-xs">
                      {evt.model_id ? `${evt.model_id}:${evt.model_version || 'v1.0.0'}` : 'iot-ids-rf:v1.0.0'}
                    </td>
                    <td className="font-xs text-secondary">
                      {evt.prediction
                        ? `Prediction: ${evt.prediction} (${evt.details?.final_category || evt.prediction})`
                        : evt.details?.action_taken
                        ? `Action: ${evt.details.action_taken}`
                        : evt.details?.cryptographic_integrity
                        ? `Integrity: ${evt.details.cryptographic_integrity}`
                        : JSON.stringify(evt.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Operational Action Shortcuts */}
      <div className="shortcuts-row" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {onNavigate && (
          <>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('detection')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              data-testid="shortcut-detection-btn"
            >
              <span>⚡</span> Analyze Network Flow in Intrusion Detection
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('model-security')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              data-testid="shortcut-model-security-btn"
            >
              <span>🛡️</span> Inspect Cryptographic Model Security &amp; Registry
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('security-testing')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              data-testid="shortcut-security-testing-btn"
            >
              <span>🧪</span> Access Controlled Security Testing Facility
            </button>
          </>
        )}
      </div>
    </div>
  );
}
