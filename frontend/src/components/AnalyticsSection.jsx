import React from 'react';
import { getAnalyticsSummary } from '../utils/analytics';

/**
 * Analytics and operational audit visualization component (Phase 5B).
 *
 * Displays aggregate metrics, distributions, and observed latency statistics
 * strictly derived from existing backend audit events.
 */
export function AnalyticsSection({
  events = [],
  totalEventsCount = 0,
  isLoading = false,
  error = null,
  onRefresh,
}) {
  const summary = getAnalyticsSummary(events);
  const { predictions, verifications, latency, eventTypes } = summary;

  return (
    <section className="card full-width" data-testid="analytics-section">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <span>📊</span> Dashboard Analytics &amp; Audit Visualization
          </h2>
          <p className="card-subtitle">
            Aggregate operational metrics derived from currently loaded security audit records
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span className="badge badge-unverified" data-testid="analytics-provenance-badge">
            {events.length} of {totalEventsCount} Events Loaded
          </span>
          {onRefresh && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              disabled={isLoading}
              data-testid="analytics-refresh-btn"
              title="Query latest audit events from backend"
            >
              {isLoading ? (
                <>
                  <span className="spinner" /> Refreshing...
                </>
              ) : (
                <>🔄 Refresh Analytics</>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" data-testid="analytics-error-alert">
          <div>
            <strong>Analytics unavailable — backend connection failed:</strong> {error}
          </div>
        </div>
      )}

      {/* Section E: Summary Metric Cards */}
      <div className="metric-cards-grid" data-testid="summary-cards-grid">
        {/* Metric 1: Total Predictions */}
        <div className="metric-card" data-testid="metric-predictions">
          <div className="metric-card-label">Total Predictions</div>
          <div className="metric-card-value">
            {predictions.hasData ? predictions.total : 0}
          </div>
          <div className="metric-card-subtext">
            {predictions.hasData
              ? `${predictions.attackCount} attack, ${predictions.benignCount} benign`
              : 'No prediction events in loaded audit data'}
          </div>
        </div>

        {/* Metric 2: Attack Detections */}
        <div className="metric-card" data-testid="metric-attacks">
          <div className="metric-card-label">Attack Detections</div>
          <div className="metric-card-value attack-text">
            {predictions.hasData ? predictions.attackCount : 0}
          </div>
          <div className="metric-card-subtext">
            {predictions.hasData
              ? `${predictions.attackPercentage}% of flow predictions`
              : 'No attack records'}
          </div>
        </div>

        {/* Metric 3: Benign Classifications */}
        <div className="metric-card" data-testid="metric-benign">
          <div className="metric-card-label">Benign Classifications</div>
          <div className="metric-card-value benign-text">
            {predictions.hasData ? predictions.benignCount : 0}
          </div>
          <div className="metric-card-subtext">
            {predictions.hasData
              ? `${predictions.benignPercentage}% of flow predictions`
              : 'No benign records'}
          </div>
        </div>

        {/* Metric 4: Verification Outcomes */}
        <div className="metric-card" data-testid="metric-verifications">
          <div className="metric-card-label">Verification Attempts</div>
          <div className="metric-card-value">
            {verifications.hasData ? verifications.total : 0}
          </div>
          <div className="metric-card-subtext">
            {verifications.hasData
              ? `${verifications.successCount} passed, ${verifications.failureCount} failed`
              : 'No verification events'}
          </div>
        </div>

        {/* Metric 5: Observed Mean Prediction Latency */}
        <div className="metric-card" data-testid="metric-latency">
          <div className="metric-card-label">Observed Mean Latency</div>
          <div className="metric-card-value">
            {latency.hasData && latency.mean !== null ? `${latency.mean} ms` : 'No data'}
          </div>
          <div className="metric-card-subtext">
            {latency.hasData
              ? `Median: ${latency.median} ms (n=${latency.count})`
              : 'Isolated off-chain inference'}
          </div>
        </div>

        {/* Metric 6: Total Audit Events Loaded */}
        <div className="metric-card" data-testid="metric-audit-total">
          <div className="metric-card-label">Loaded Audit Events</div>
          <div className="metric-card-value">{events.length}</div>
          <div className="metric-card-subtext">
            {eventTypes.hasData
              ? `Across ${eventTypes.types.length} event type categories`
              : 'Empty audit log'}
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="analytics-charts-grid">
        {/* Section A: Prediction Distribution */}
        <div className="chart-panel" data-testid="prediction-chart">
          <div className="chart-panel-header">
            <h3 className="chart-title">Prediction Distribution</h3>
            <span className="chart-caption">Based on currently loaded audit events</span>
          </div>

          {predictions.hasData ? (
            <div className="chart-body">
              {/* Proportional Stacked Bar */}
              <div
                className="stacked-bar"
                role="img"
                aria-label={`Prediction ratio: ${predictions.attackPercentage}% Attack, ${predictions.benignPercentage}% Benign`}
              >
                <div
                  className="bar-segment attack-bg"
                  style={{ width: `${predictions.attackPercentage}%` }}
                  title={`Attack: ${predictions.attackCount} (${predictions.attackPercentage}%)`}
                />
                <div
                  className="bar-segment benign-bg"
                  style={{ width: `${predictions.benignPercentage}%` }}
                  title={`Benign: ${predictions.benignCount} (${predictions.benignPercentage}%)`}
                />
              </div>

              {/* Legend & Breakdown */}
              <div className="chart-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="color-dot attack-dot" />
                    <strong>Attack / Malicious</strong>
                  </div>
                  <div className="breakdown-value">
                    <span>{predictions.attackCount}</span>
                    <span className="text-muted">({predictions.attackPercentage}%)</span>
                  </div>
                </div>

                <div className="breakdown-item">
                  <div className="breakdown-label">
                    <span className="color-dot benign-dot" />
                    <strong>Benign Flow</strong>
                  </div>
                  <div className="breakdown-value">
                    <span>{predictions.benignCount}</span>
                    <span className="text-muted">({predictions.benignPercentage}%)</span>
                  </div>
                </div>

                {predictions.otherCount > 0 && (
                  <div className="breakdown-item">
                    <div className="breakdown-label">
                      <span className="color-dot other-dot" />
                      <strong>Other / Unspecified</strong>
                    </div>
                    <div className="breakdown-value">
                      <span>{predictions.otherCount}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-chart-notice" data-testid="empty-prediction-chart">
              No prediction data available in loaded audit events.
            </div>
          )}
        </div>

        {/* Section B: Verification Outcomes */}
        <div className="chart-panel" data-testid="verification-chart">
          <div className="chart-panel-header">
            <h3 className="chart-title">Verification Outcomes</h3>
            <span className="chart-caption">Cryptographic integrity gate results</span>
          </div>

          {verifications.hasData ? (
            <div className="chart-body">
              <div className="status-bars-list">
                {Object.entries(verifications.byStatus)
                  .filter(([_, count]) => count > 0)
                  .map(([statusKey, count]) => {
                    const pct = Number(((count / verifications.total) * 100).toFixed(1));
                    return (
                      <div key={statusKey} className="status-bar-row">
                        <div className="status-row-header">
                          <span
                            className={`badge badge-${statusKey.toLowerCase()}`}
                            data-testid={`analytics-status-${statusKey.toLowerCase()}`}
                          >
                            {statusKey}
                          </span>
                          <span className="status-count-tag">
                            <strong>{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="mini-progress-bar">
                          <div
                            className={`mini-progress-fill status-fill-${statusKey.toLowerCase()}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="verification-summary-footer">
                <div>
                  Successful Verifications: <strong>{verifications.successCount}</strong>
                </div>
                <div>
                  Verification Failures: <strong>{verifications.failureCount}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-chart-notice" data-testid="empty-verification-chart">
              No verification events available.
            </div>
          )}
        </div>

        {/* Section C: Observed Prediction Latency */}
        <div className="chart-panel" data-testid="latency-chart">
          <div className="chart-panel-header">
            <h3 className="chart-title">Observed Prediction Latency</h3>
            <span className="chart-caption">Isolated off-chain inference in local environment</span>
          </div>

          {latency.hasData ? (
            <div className="chart-body">
              <div className="latency-stats-row">
                <div className="latency-stat-box">
                  <div className="stat-label">Sample Count</div>
                  <div className="stat-value">{latency.count}</div>
                </div>
                <div className="latency-stat-box">
                  <div className="stat-label">Mean Latency</div>
                  <div className="stat-value highlight-cyan">{latency.mean} ms</div>
                </div>
                <div className="latency-stat-box">
                  <div className="stat-label">Median Latency</div>
                  <div className="stat-value">{latency.median} ms</div>
                </div>
                <div className="latency-stat-box">
                  <div className="stat-label">Min Latency</div>
                  <div className="stat-value text-muted">{latency.min} ms</div>
                </div>
                <div className="latency-stat-box">
                  <div className="stat-label">Max Latency</div>
                  <div className="stat-value text-muted">{latency.max} ms</div>
                </div>
              </div>

              {/* Visual Range Indicator */}
              <div className="latency-range-container">
                <div className="range-track">
                  <div
                    className="range-fill"
                    style={{
                      left: '0%',
                      width: '100%',
                    }}
                  />
                  <div
                    className="range-marker marker-median"
                    title={`Median: ${latency.median} ms`}
                    style={{
                      left:
                        latency.max > latency.min
                          ? `${((latency.median - latency.min) / (latency.max - latency.min)) * 100}%`
                          : '50%',
                    }}
                  />
                </div>
                <div className="range-labels">
                  <span>Min: {latency.min} ms</span>
                  <span className="range-center-label">Median: {latency.median} ms</span>
                  <span>Max: {latency.max} ms</span>
                </div>
              </div>

              <div className="research-disclaimer-note">
                <strong>Measurement Boundary:</strong> Calculated solely from prediction audit events
                recorded in the local evaluation environment. Values represent off-chain model compute
                time and are not an SLA or high-throughput latency guarantee.
              </div>
            </div>
          ) : (
            <div className="empty-chart-notice" data-testid="empty-latency-chart">
              No latency records available in loaded audit events.
            </div>
          )}
        </div>

        {/* Section D: Audit-Event Distribution */}
        <div className="chart-panel" data-testid="event-distribution-chart">
          <div className="chart-panel-header">
            <h3 className="chart-title">Audit-Event Distribution</h3>
            <span className="chart-caption">Categorical breakdown of recorded operations</span>
          </div>

          {eventTypes.hasData ? (
            <div className="chart-body">
              <div className="event-type-bars">
                {eventTypes.types.map((item) => (
                  <div key={item.type} className="event-type-row">
                    <div className="event-type-meta">
                      <span className="event-type-name">{item.type}</span>
                      <span className="event-type-count">
                        <strong>{item.count}</strong> ({item.percentage}%)
                      </span>
                    </div>
                    <div className="mini-progress-bar">
                      <div
                        className="mini-progress-fill fill-accent-blue"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-chart-notice" data-testid="empty-distribution-chart">
              No audit events recorded.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AnalyticsSection;
