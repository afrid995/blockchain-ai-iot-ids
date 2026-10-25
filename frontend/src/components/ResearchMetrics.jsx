import React from 'react';
import { AnalyticsSection } from './AnalyticsSection';

/**
 * Research Metrics & Statistical Evidence Tab:
 * Displays both live audit event distributions (via AnalyticsSection)
 * and the authoritative empirical research benchmark results from Phase 7B.
 */
export function ResearchMetrics({
  events = [],
  totalEventsCount = 0,
  isLoading = false,
  error = null,
  onRefresh,
}) {
  return (
    <div className="research-metrics-page">
      <div className="section-header">
        <div className="section-badge info">EMPIRICAL BENCHMARK EVIDENCE</div>
        <h2 className="section-title">Research Metrics & Performance Statistics</h2>
        <p className="section-subtitle">
          Authoritative performance evaluation on authentic UNSW-NB15 benchmark partitions (N = 175,341 flows).
        </p>
      </div>

      {/* Authoritative Model Baseline Tables */}
      <div className="metrics-baseline-grid">
        <div className="baseline-card">
          <h4>Stage 1: Binary IDS (LightGBM)</h4>
          <span className="card-sub font-mono">ids_model.joblib | SHA: dc5e1688...e7c5</span>
          <div className="baseline-table-wrap">
            <table className="baseline-table">
              <tbody>
                <tr>
                  <td>Accuracy</td>
                  <td className="font-mono text-success">90.30%</td>
                </tr>
                <tr>
                  <td>Precision</td>
                  <td className="font-mono text-success">98.78%</td>
                </tr>
                <tr>
                  <td>Recall</td>
                  <td className="font-mono">86.82%</td>
                </tr>
                <tr>
                  <td>F1 Score</td>
                  <td className="font-mono">92.41%</td>
                </tr>
                <tr>
                  <td>Specificity</td>
                  <td className="font-mono">97.71%</td>
                </tr>
                <tr>
                  <td>FPR</td>
                  <td className="font-mono">2.29%</td>
                </tr>
                <tr>
                  <td>ROC-AUC</td>
                  <td className="font-mono text-success">98.60%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="baseline-card">
          <h4>Stage 2: Attack Classifier (Random Forest)</h4>
          <span className="card-sub font-mono">attack_classifier.joblib | SHA: 596b98ce...3208</span>
          <div className="baseline-table-wrap">
            <table className="baseline-table">
              <tbody>
                <tr>
                  <td>Oracle Attack Macro F1</td>
                  <td className="font-mono">53.06%</td>
                </tr>
                <tr>
                  <td>Oracle Balanced Accuracy</td>
                  <td className="font-mono">53.41%</td>
                </tr>
                <tr>
                  <td>Hierarchical Routed Macro F1</td>
                  <td className="font-mono">51.43%</td>
                </tr>
                <tr>
                  <td>Hierarchical Balanced Accuracy</td>
                  <td className="font-mono">51.20%</td>
                </tr>
                <tr>
                  <td>Supported Categories</td>
                  <td className="font-mono">9 Classes</td>
                </tr>
                <tr>
                  <td>Extreme Class Imbalance</td>
                  <td className="font-mono text-warning">Up to 428.89:1</td>
                </tr>
                <tr>
                  <td>Minority Sensitivity</td>
                  <td className="font-mono text-muted">Analysis: 2.95%, Worms: 15.38%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Latency Breakdown Card */}
      <div className="latency-breakdown-card">
        <h4>Component-Level Execution Latency Profiling (N = 100 Flows)</h4>
        <div className="latency-grid">
          <div className="latency-item">
            <span className="l-name">T_gate (Pre-Load Provenance)</span>
            <span className="l-val font-mono">70.98 ms</span>
            <span className="l-note">Startup gate only</span>
          </div>
          <div className="latency-item">
            <span className="l-name">T_L1 (Stage 1 Binary)</span>
            <span className="l-val font-mono">23.40 ms</span>
            <span className="l-note">Every flow</span>
          </div>
          <div className="latency-item">
            <span className="l-name">T_L2 (Stage 2 Multiclass)</span>
            <span className="l-val font-mono">23.11 ms</span>
            <span className="l-note">Attacks only</span>
          </div>
          <div className="latency-item">
            <span className="l-name">T_rec (Advisory Mapping)</span>
            <span className="l-val font-mono">0.019 ms</span>
            <span className="l-note">Deterministic lookup</span>
          </div>
          <div className="latency-item highlight">
            <span className="l-name">Mean Latency Reduction</span>
            <span className="l-val font-mono text-success">11.54%</span>
            <span className="l-note">Via conditional bypass</span>
          </div>
        </div>
        <p className="latency-caption font-xs text-muted">
          *Blockchain latency measured on local EVM (EthereumTesterProvider). Not representative of public Ethereum mainnet.
        </p>
      </div>

      {/* Cascade Error Propagation Callout */}
      <div className="cascade-error-card">
        <h4>Hierarchical Cascade Error Analysis (Full UNSW-NB15 Test Set, N = 175,341)</h4>
        <div className="cascade-summary-text">
          <p>
            <strong>The Fuzzers Bottleneck:</strong> Stage 1 misclassifies 13,520 out of 18,184 Fuzzers attacks (74.35%) as Benign.
            Consequently, these flows exit early as "Normal" and are never analyzed by Stage 2.
          </p>
          <p>
            <strong>Category Confusion:</strong> Out of 103,611 true attack flows that pass Stage 1, Stage 2 correctly attributes 76,870 flows (64.41% of all attacks) and misclassifies 26,741 flows into incorrect attack categories.
          </p>
          <p>
            <strong>Human Oversight Necessity:</strong> These cascade error disclosures underscore why automated remediation is strictly disabled and human approval is required.
          </p>
        </div>
      </div>

      {/* Live Operational Analytics Section */}
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
