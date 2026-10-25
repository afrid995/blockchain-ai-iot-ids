import React, { useState } from 'react';
import { AlertBanner } from './AlertBanner';

export function AuditLog({
  events = [],
  total = 0,
  limit = 10,
  offset = 0,
  eventTypeFilter = '',
  onFilterChange,
  onPageChange,
  onRefresh,
  isLoading,
  error,
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const eventTypes = [
    { label: 'All Event Types', value: '' },
    { label: 'Predictions (PREDICTION)', value: 'PREDICTION' },
    { label: 'Model Verifications (MODEL_VERIFICATION)', value: 'MODEL_VERIFICATION' },
    { label: 'Verification Failures (MODEL_VERIFICATION_FAILURE)', value: 'MODEL_VERIFICATION_FAILURE' },
    { label: 'Model Replacement Detected (MODEL_REPLACEMENT_DETECTED)', value: 'MODEL_REPLACEMENT_DETECTED' },
    { label: 'Model Restored (MODEL_RESTORED)', value: 'MODEL_RESTORED' },
    { label: 'Model Loads (MODEL_LOAD)', value: 'MODEL_LOAD' },
    { label: 'Blocked Loads (MODEL_LOAD_BLOCKED)', value: 'MODEL_LOAD_BLOCKED' },
    { label: 'System Errors (SYSTEM_ERROR)', value: 'SYSTEM_ERROR' },
  ];

  return (
    <div className="audit-log-page" data-testid="audit-log-card">
      {/* Section Header */}
      <div className="console-section-header">
        <div>
          <h2 className="console-title">Local Operational Audit Trail</h2>
          <p className="console-subtitle">
            Immutable operational security event log recorded off-chain in local SQLite storage.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {onRefresh && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              disabled={isLoading}
              data-testid="audit-refresh-btn"
            >
              {isLoading ? 'Refreshing...' : '↻ Refresh Log'}
            </button>
          )}
          <select
            className="form-control"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
            value={eventTypeFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            aria-label="Filter events by type"
            data-testid="event-type-filter"
          >
            {eventTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <AlertBanner type="danger" message={error} />}

      <div className="console-card" style={{ marginTop: '1rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="console-table" data-testid="audit-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>TIMESTAMP (UTC)</th>
                <th style={{ width: '130px' }}>EVENT ID</th>
                <th>EVENT TYPE</th>
                <th style={{ width: '110px' }}>STATUS</th>
                <th>MODEL</th>
                <th>OUTCOME / PREDICTION</th>
                <th style={{ width: '110px' }}>LATENCY</th>
                <th style={{ width: '90px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                    <span className="spinner" /> Loading audit records...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                    data-testid="empty-audit-state"
                  >
                    No security audit events recorded matching the current filter.
                  </td>
                </tr>
              ) : (
                events.map((e) => {
                  const isErr = e.status === 'ERROR' || e.event_type?.includes('FAIL') || e.event_type?.includes('BLOCKED');
                  const isWarn = e.status === 'WARNING' || e.event_type === 'MODEL_REPLACEMENT_DETECTED';
                  const statusBadgeClass = isErr ? 'badge-danger' : isWarn ? 'badge-warning' : 'badge-success';

                  return (
                    <tr key={e.event_id} data-testid="audit-row">
                      <td className="font-mono font-xs text-muted">
                        {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="font-mono font-xs">
                        {e.event_id ? e.event_id.slice(0, 8) + '...' : '—'}
                      </td>
                      <td className="font-mono font-xs">
                        <span className="event-type-badge">{e.event_type}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="font-mono font-xs">
                        {e.model_id ? `${e.model_id}:${e.model_version || 'v1.0.0'}` : (e.model_version || '—')}
                      </td>
                      <td className="font-xs">
                        {e.prediction ? (
                          <span
                            style={{
                              fontWeight: 600,
                              color: e.prediction.toLowerCase().includes('attack') ? '#f87171' : '#4ade80',
                            }}
                          >
                            {e.prediction}
                          </span>
                        ) : e.details?.action_taken ? (
                          <code>{e.details.action_taken}</code>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="font-mono font-xs">
                        {e.inference_latency_ms !== null && e.inference_latency_ms !== undefined
                          ? `${e.inference_latency_ms.toFixed(2)} ms`
                          : e.verification_latency_ms !== null && e.verification_latency_ms !== undefined
                          ? `${e.verification_latency_ms.toFixed(2)} ms`
                          : '—'}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                          onClick={() => setSelectedEvent(e)}
                          data-testid={`view-event-${e.event_id}`}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <span className="font-xs text-secondary">
            Total Logged Events: <strong>{total}</strong> (Page {currentPage} of {totalPages})
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={offset === 0 || isLoading}
              onClick={() => onPageChange(Math.max(0, offset - limit))}
              data-testid="prev-page-btn"
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={offset + limit >= total || isLoading}
              onClick={() => onPageChange(offset + limit)}
              data-testid="next-page-btn"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Audit Architecture Notice */}
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.75rem',
          }}
        >
          <strong>Audit Storage Boundary:</strong> Events are recorded locally in an append-oriented SQLite database (<code>backend/data/audit.db</code>).
          Raw 42-feature telemetry vectors are strictly excluded from persistent records to maintain operational privacy. This local log is an operational audit trail, not a decentralized blockchain ledger.
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedEvent(null)}
          data-testid="audit-modal-backdrop"
        >
          <div
            className="console-card"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
            data-testid="audit-detail-modal"
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Security Event Details</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close modal"
              >
                ✕ Close
              </button>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className="spec-item">
                <span className="spec-label">Event ID:</span>
                <span className="spec-val font-mono font-xs">{selectedEvent.event_id}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Timestamp (UTC):</span>
                <span className="spec-val font-mono font-xs">{selectedEvent.timestamp}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Event Type:</span>
                <span className="spec-val font-mono">{selectedEvent.event_type}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Outcome Status:</span>
                <span className="spec-val font-mono">{selectedEvent.status}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Model Target:</span>
                <span className="spec-val font-mono">{selectedEvent.model_id}:{selectedEvent.model_version || 'v1.0.0'}</span>
              </div>
              {selectedEvent.prediction && (
                <div className="spec-item">
                  <span className="spec-label">Detection Outcome:</span>
                  <span className="spec-val font-mono">{selectedEvent.prediction}</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <span className="spec-label">Payload &amp; Verification Details:</span>
              <pre
                className="font-mono font-xs"
                style={{
                  background: 'var(--bg-primary)',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  overflowX: 'auto',
                  marginTop: '0.35rem',
                  color: '#93c5fd',
                }}
              >
                {JSON.stringify(selectedEvent.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
