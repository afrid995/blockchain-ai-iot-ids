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
    { label: 'Model Loads (MODEL_LOAD)', value: 'MODEL_LOAD' },
    { label: 'Blocked Loads (MODEL_LOAD_BLOCKED)', value: 'MODEL_LOAD_BLOCKED' },
    { label: 'System Errors (SYSTEM_ERROR)', value: 'SYSTEM_ERROR' },
  ];

  return (
    <div className="card full-width" data-testid="audit-log-card">
      <div className="card-header">
        <h2 className="card-title">
          <span>📜</span>
          <span>Security Audit Trail & Operational Events</span>
        </h2>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              background: 'var(--bg-primary)',
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

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" data-testid="audit-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Event ID</th>
              <th>Event Type</th>
              <th>Status</th>
              <th>Model Version</th>
              <th>Outcome / Prediction</th>
              <th>Latency (ms)</th>
              <th>Action</th>
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
                const isErr = e.status === 'ERROR' || e.event_type.includes('FAIL') || e.event_type.includes('BLOCKED');
                const isWarn = e.status === 'WARNING';
                const statusColor = isErr ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--success)';

                return (
                  <tr key={e.event_id} data-testid="audit-row">
                    <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="hash-cell" style={{ fontSize: '0.75rem' }}>
                      {e.event_id ? e.event_id.slice(0, 8) + '...' : '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {e.event_type}
                    </td>
                    <td>
                      <span style={{ color: statusColor, fontWeight: 600, fontSize: '0.75rem' }}>
                        ● {e.status}
                      </span>
                    </td>
                    <td>{e.model_version || '—'}</td>
                    <td>
                      {e.prediction ? (
                        <span
                          style={{
                            fontWeight: 600,
                            color: e.prediction.toLowerCase().includes('attack') ? '#f87171' : '#34d399',
                          }}
                        >
                          {e.prediction}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {e.inference_latency_ms !== null && e.inference_latency_ms !== undefined
                        ? `${e.inference_latency_ms.toFixed(2)} ms`
                        : e.verification_latency_ms !== null && e.verification_latency_ms !== undefined
                        ? `${e.verification_latency_ms.toFixed(2)} ms`
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
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

      <div className="pagination">
        <span>
          Total Events: <strong>{total}</strong> (Page {currentPage} of {totalPages})
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            disabled={offset === 0 || isLoading}
            onClick={() => onPageChange(Math.max(0, offset - limit))}
            data-testid="prev-page-btn"
          >
            ← Previous
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            disabled={offset + limit >= total || isLoading}
            onClick={() => onPageChange(offset + limit)}
            data-testid="next-page-btn"
          >
            Next →
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem',
        }}
      >
        <strong>Audit Boundary:</strong> Events are recorded locally in an append-oriented SQLite database.
        Raw network payloads are not persisted to maintain operational privacy. This local log is not by itself a
        decentralized blockchain ledger.
      </div>

      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
          data-testid="event-modal"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="card"
            style={{ maxWidth: '640px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h3 className="card-title">
                <span>🔍</span>
                <span>Audit Event Record</span>
              </h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.2rem 0.5rem' }}
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>

            <table className="data-table">
              <tbody>
                <tr>
                  <th>Event ID</th>
                  <td className="hash-cell">{selectedEvent.event_id}</td>
                </tr>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <td>{selectedEvent.timestamp}</td>
                </tr>
                <tr>
                  <th>Event Type</th>
                  <td>{selectedEvent.event_type}</td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>{selectedEvent.status}</td>
                </tr>
                <tr>
                  <th>Model ID / Version</th>
                  <td>
                    {selectedEvent.model_id || '—'} / {selectedEvent.model_version || '—'}
                  </td>
                </tr>
                <tr>
                  <th>Verification Status</th>
                  <td>{selectedEvent.verification_status || '—'}</td>
                </tr>
                <tr>
                  <th>Prediction</th>
                  <td>{selectedEvent.prediction || '—'}</td>
                </tr>
                <tr>
                  <th>Inference Latency</th>
                  <td>
                    {selectedEvent.inference_latency_ms !== null
                      ? `${selectedEvent.inference_latency_ms} ms (local environment)`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <th>Verification Latency</th>
                  <td>
                    {selectedEvent.verification_latency_ms !== null
                      ? `${selectedEvent.verification_latency_ms} ms (local environment)`
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '1rem' }}>
              <div className="form-label">Metadata & Details (JSON):</div>
              <pre
                style={{
                  background: 'var(--bg-primary)',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  overflowX: 'auto',
                  border: '1px solid var(--border-color)',
                  color: 'var(--accent-cyan)',
                }}
              >
                {JSON.stringify(selectedEvent.details, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
