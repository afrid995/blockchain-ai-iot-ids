import React from 'react';
import { AnalyticsSection } from './AnalyticsSection';

/**
 * Page 6 — Research Results:
 * Empirical benchmark evidence from experimental evaluations on UNSW-NB15.
 * Clearly separated from session-based operational IDS console workflows.
 */
export function ResearchResults({
  events = [],
  totalEventsCount = 0,
  isLoading = false,
  error = null,
  onRefresh,
}) {
  return (
    <div className="research-results-page" data-testid="research-results-page">
      {/* Section Header */}
      <div className="console-section-header">
        <div>
          <h2 className="console-title">Research Results &amp; Empirical Evaluation</h2>
          <p className="console-subtitle">
            Measured benchmark performance on authentic UNSW-NB15 partitions (N = 175,341 flows) and EVM provenance latency.
          </p>
        </div>
        <span className="badge badge-secondary">OFFICIAL RESEARCH BENCHMARK</span>
      </div>

      {/* Important Limitation Disclosure */}
      <div className="alert-box warning" style={{ marginBottom: '1.5rem' }}>
        <strong>Important Research Limitation:</strong> Stage 2 performance is affected by upstream Stage 1 false negatives and severe class imbalance in the UNSW-NB15 attack categories. Inferences remain advisory and strictly require human operator review.
      </div>

      {/* Baseline Model Performance Tables */}
      <div className="console-grid-2col" style={{ marginBottom: '1.5rem' }}>
        {/* Stage 1 Binary IDS Baseline */}
        <div className="console-card">
          <div className="card-header">
            <h3 className="card-title">Stage 1: Binary IDS (Random Forest)</h3>
            <span className="badge badge-success">90.30% Accuracy</span>
          </div>
          <span className="font-mono font-xs text-secondary" style={{ display: 'block', marginBottom: '0.75rem' }}>
            ids_model.joblib | Registered SHA: dc5e1688...e7c5
          </span>

          <table className="console-table">
            <thead>
              <tr>
                <th>METRIC</th>
                <th style={{ textAlign: 'right' }}>VALUE</th>
                <th>EVALUATION CONTEXT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Accuracy</td>
                <td className="font-mono text-success" style={{ textAlign: 'right' }}>90.30%</td>
                <td className="font-xs text-muted">UNSW-NB15 test set (N = 175,341)</td>
              </tr>
              <tr>
                <td>Precision</td>
                <td className="font-mono text-success" style={{ textAlign: 'right' }}>98.78%</td>
                <td className="font-xs text-muted">High true positive fidelity</td>
              </tr>
              <tr>
                <td>Recall</td>
                <td className="font-mono" style={{ textAlign: 'right' }}>86.82%</td>
                <td className="font-xs text-muted">Attack capture sensitivity</td>
              </tr>
              <tr>
                <td>F1 Score</td>
                <td className="font-mono text-success" style={{ textAlign: 'right' }}>92.41%</td>
                <td className="font-xs text-muted">Harmonic mean precision/recall</td>
              </tr>
              <tr>
                <td>Specificity</td>
                <td className="font-mono" style={{ textAlign: 'right' }}>97.71%</td>
                <td className="font-xs text-muted">Benign flow retention rate</td>
              </tr>
              <tr>
                <td>False Positive Rate (FPR)</td>
                <td className="font-mono" style={{ textAlign: 'right' }}>2.29%</td>
                <td className="font-xs text-muted">Low operator alert fatigue</td>
              </tr>
              <tr>
                <td>ROC-AUC</td>
                <td className="font-mono text-success" style={{ textAlign: 'right' }}>98.60%</td>
                <td className="font-xs text-muted">Discriminative ability</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Stage 2 Multiclass Attack Classifier Baseline */}
        <div className="console-card">
          <div className="card-header">
            <h3 className="card-title">Stage 2: Attack Classifier (Multiclass RF)</h3>
            <span className="badge badge-warning">51.43% Routed Macro F1</span>
          </div>
          <span className="font-mono font-xs text-secondary" style={{ display: 'block', marginBottom: '0.75rem' }}>
            attack_classifier.joblib | Registered SHA: 596b98ce...3208
          </span>

          <table className="console-table">
            <thead>
              <tr>
                <th>METRIC</th>
                <th style={{ textAlign: 'right' }}>VALUE</th>
                <th>EVALUATION CONTEXT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Standalone Accuracy</td>
                <td className="font-mono text-success" style={{ textAlign: 'right' }}>76.18%</td>
                <td className="font-xs text-muted">Selected balanced classifier (Phase 7B.1)</td>
              </tr>
              <tr>
                <td>Standalone Weighted F1</td>
                <td className="font-mono text-success" style={{ textAlign: 'right' }}>77.50%</td>
                <td className="font-xs text-muted">Attack-only evaluation subset</td>
              </tr>
              <tr>
                <td>Oracle Attack Macro F1</td>
                <td className="font-mono" style={{ textAlign: 'right' }}>53.06%</td>
                <td className="font-xs text-muted">Isolated attack subset test</td>
              </tr>
              <tr>
                <td>Oracle Balanced Accuracy</td>
                <td className="font-mono" style={{ textAlign: 'right' }}>53.41%</td>
                <td className="font-xs text-muted">Class-balanced oracle test</td>
              </tr>
              <tr>
                <td>Hierarchical Routed Macro F1</td>
                <td className="font-mono text-warning" style={{ textAlign: 'right' }}>51.43%</td>
                <td className="font-xs text-muted">Operational Stage 1 &rarr; Stage 2 pipeline</td>
              </tr>
              <tr>
                <td>Hierarchical Balanced Accuracy</td>
                <td className="font-mono text-warning" style={{ textAlign: 'right' }}>51.20%</td>
                <td className="font-xs text-muted">Operational routed accuracy</td>
              </tr>
              <tr>
                <td>Supported Attack Classes</td>
                <td className="font-mono" style={{ textAlign: 'right' }}>9 Categories</td>
                <td className="font-xs text-muted">DoS, Exploits, Fuzzers, etc.</td>
              </tr>
              <tr>
                <td>Class Imbalance Ratio</td>
                <td className="font-mono text-danger" style={{ textAlign: 'right' }}>Up to 428.89:1</td>
                <td className="font-xs text-muted">Generic vs Worms / Analysis</td>
              </tr>
              <tr>
                <td>Minority Class Sensitivity</td>
                <td className="font-mono text-muted" style={{ textAlign: 'right' }}>Analysis: 2.95%</td>
                <td className="font-xs text-muted">Worms: 15.38% (severe bottleneck)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Provenance Evaluation & Latency Profiling */}
      <div className="console-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Provenance Verification &amp; Inference Latency Profiling</h3>
          <span className="badge badge-secondary">Measured Benchmarks (Local CPU)</span>
        </div>

        <div className="summary-metrics-row">
          <div className="summary-metric-box">
            <span className="summary-label">SHA-256 HASHING</span>
            <span className="summary-number font-mono text-success">5.65 ms</span>
            <span className="summary-subtext">Direct artifact digest (N=30)</span>
          </div>
          <div className="summary-metric-box">
            <span className="summary-label">PRE-LOAD VERIFICATION GATE</span>
            <span className="summary-number font-mono text-info">20.31 ms</span>
            <span className="summary-subtext">SHA + ModelRegistry read (N=30)</span>
          </div>
          <div className="summary-metric-box">
            <span className="summary-label">HIERARCHICAL INFERENCE</span>
            <span className="summary-number font-mono">32.06 ms</span>
            <span className="summary-subtext">Mean conditional inference (N=100)</span>
          </div>
          <div className="summary-metric-box">
            <span className="summary-label">PER-FLOW ON-CHAIN QUERIES</span>
            <span className="summary-number font-mono text-success">0</span>
            <span className="summary-subtext">Zero queries during flow analysis</span>
          </div>
        </div>

        <div className="font-xs text-muted" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
          *Note: Provenance verification latency (mean 20.31 ms) evaluated on local Ganache / EthereumTester EVM testbed. Hierarchical inference latency (mean 32.06 ms; Stage 1 alone 21.04 ms, Stage 2 alone 23.09 ms) evaluated on local CPU. Measurements do not reflect public Ethereum mainnet gas or transaction congestion.
        </div>
      </div>

      {/* The Fuzzers Bottleneck and Cascade Error Analysis */}
      <div className="console-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Hierarchical Cascade Error Analysis (Full UNSW-NB15 Test Set)</h3>
          <span className="badge badge-warning">Scientific Analysis</span>
        </div>
        <div className="cascade-summary-text" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#cbd5e1' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>The Fuzzers Bottleneck:</strong> Stage 1 routed 4,664 of 18,184 Fuzzer flows to Stage 2 (25.65%), leaving 13,520 Fuzzer flows as Stage 1 false negatives. In fact, 85.95% of all Stage 1 false negatives were Fuzzers. Across the complete hierarchy, the operational hierarchical E2E recall for Fuzzers was 14.83%.
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Operational Routing Breakdown:</strong> Stage 1 evaluates 175,341 test flows, predicting 70,448 Benign and 104,893 Attack. All 104,893 predicted attacks are routed to Stage 2 (103,611 true attacks + 1,282 benign false positives).
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Category Confusion:</strong> Out of 103,611 true attacks reaching Stage 2, 76,870 flows are correctly categorized (yielding 51.43% operational Macro F1 and 51.20% balanced accuracy on routed attacks), while 26,741 flows are assigned to an incorrect attack category.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Human Oversight Necessity:</strong> These cascade error disclosures underscore why automated remediation is strictly disabled and human approval is required.
          </p>
        </div>
      </div>

      {/* Operational Session Analytics */}
      <AnalyticsSection
        events={events}
        totalEventsCount={totalEventsCount}
        isLoading={isLoading}
        error={error}
        onRefresh={onRefresh}
      />
    </div>
  );
}

// Retain ResearchMetrics as an export for backward compatibility
export const ResearchMetrics = ResearchResults;
