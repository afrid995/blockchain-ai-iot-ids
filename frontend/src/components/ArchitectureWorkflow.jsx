import React from 'react';

/**
 * Visual architecture workflow reflecting the actual runtime execution state:
 * - Stage 1: Model Trust Gate (SHA-256 + Blockchain Registry)
 * - Stage 2: Verified Model Loaded (Memory Authorization)
 * - Stage 3: Network Flow Input (UNSW-NB15 Flow Selection)
 * - Stage 4: Stage 1 Binary IDS (Benign vs Attack)
 * - Stage 5: Stage 2 Attack Type Classification (Conditional: Only on Attack)
 * - Stage 6: Advisory Response Recommendation (Deterministic Human Guidance)
 */
export function ArchitectureWorkflow({
  verificationState, // 'UNVERIFIED' | 'VERIFIED' | 'FAILED'
  modelLoadedState,  // false | true
  flowSelected,      // false | true
  stage1Result,      // null | 'Benign' | 'Attack'
  stage2Invoked,     // false | true
  stage2Result,      // null | string
  advisoryResult,    // null | object
}) {
  // Determine node states
  const getNodeState = (stageNum) => {
    switch (stageNum) {
      case 1: // Model Trust Gate
        if (verificationState === 'VERIFIED') return 'completed';
        if (verificationState === 'FAILED') return 'blocked';
        return 'active';
      case 2: // Model Loaded
        if (modelLoadedState) return 'completed';
        if (verificationState === 'VERIFIED') return 'unlocked';
        if (verificationState === 'FAILED') return 'blocked';
        return 'locked';
      case 3: // Network Flow Input
        if (!modelLoadedState) return 'locked';
        if (flowSelected) return 'completed';
        return 'active';
      case 4: // Stage 1 IDS
        if (!flowSelected) return 'locked';
        if (stage1Result) return 'completed';
        return 'active';
      case 5: // Stage 2 Attack Classification (Conditional)
        if (!stage1Result) return 'locked';
        if (stage1Result === 'Benign') return 'bypassed';
        if (stage2Invoked && stage2Result) return 'completed';
        return 'active';
      case 6: // Advisory Response
        if (!stage1Result) return 'locked';
        if (advisoryResult) return 'completed';
        return 'active';
      default:
        return 'locked';
    }
  };

  const getStatusBadge = (state) => {
    switch (state) {
      case 'completed':
        return <span className="workflow-badge completed">✓ COMPLETED</span>;
      case 'active':
        return <span className="workflow-badge active">⚡ READY / ACTIVE</span>;
      case 'unlocked':
        return <span className="workflow-badge unlocked">🔓 READY TO LOAD</span>;
      case 'bypassed':
        return <span className="workflow-badge bypassed">⏭️ BYPASSED (BENIGN)</span>;
      case 'blocked':
        return <span className="workflow-badge blocked">⛔ BLOCKED (FAIL-CLOSED)</span>;
      case 'locked':
      default:
        return <span className="workflow-badge locked">🔒 LOCKED</span>;
    }
  };

  const node1State = getNodeState(1);
  const node2State = getNodeState(2);
  const node3State = getNodeState(3);
  const node4State = getNodeState(4);
  const node5State = getNodeState(5);
  const node6State = getNodeState(6);

  return (
    <section className="architecture-workflow-panel" aria-label="System Architecture Flow">
      <div className="workflow-header">
        <div>
          <h2 className="workflow-title">System Architecture & Execution Flow</h2>
          <p className="workflow-subtitle">
            Sequential security state machine: stages unlock only after preceding gates succeed.
          </p>
        </div>
        <div className="blockchain-boundary-banner" title="Strict Control-Plane Decoupling">
          <div className="boundary-badge">CONTROL PLANE ONLY</div>
          <div className="boundary-text">
            <span>Blockchain role: <strong>MODEL PROVENANCE / INTEGRITY</strong></span>
            <span className="separator">•</span>
            <span>Per-flow registry lookups: <strong>0</strong></span>
          </div>
        </div>
      </div>

      <div className="workflow-pipeline">
        {/* Step 1: Model Trust Gate */}
        <div className={`workflow-node ${node1State}`}>
          <div className="node-indicator">
            <span className="node-num">①</span>
            <span className="node-name">MODEL TRUST GATE</span>
          </div>
          <div className="node-body">
            <div className="node-desc">Local SHA-256 vs On-Chain Registry</div>
            <div className="node-detail">ModelRegistry.sol (EVM)</div>
          </div>
          <div className="node-footer">{getStatusBadge(node1State)}</div>
        </div>

        <div className="workflow-connector">
          <span className="connector-arrow">➔</span>
        </div>

        {/* Step 2: Model Loaded */}
        <div className={`workflow-node ${node2State}`}>
          <div className="node-indicator">
            <span className="node-num">②</span>
            <span className="node-name">AUTHORIZED MODEL LOAD</span>
          </div>
          <div className="node-body">
            <div className="node-desc">Gated Memory Deserialization</div>
            <div className="node-detail">Stage 1 + Stage 2 Pipelines</div>
          </div>
          <div className="node-footer">{getStatusBadge(node2State)}</div>
        </div>

        <div className="workflow-connector">
          <span className="connector-arrow">➔</span>
        </div>

        {/* Step 3: Network Flow Input */}
        <div className={`workflow-node ${node3State}`}>
          <div className="node-indicator">
            <span className="node-num">③</span>
            <span className="node-name">NETWORK FLOW INPUT</span>
          </div>
          <div className="node-body">
            <div className="node-desc">42 UNSW-NB15 Flow Features</div>
            <div className="node-detail">Packet & Connection Telemetry</div>
          </div>
          <div className="node-footer">{getStatusBadge(node3State)}</div>
        </div>

        <div className="workflow-connector">
          <span className="connector-arrow">➔</span>
        </div>

        {/* Step 4: Stage 1 IDS */}
        <div className={`workflow-node ${node4State}`}>
          <div className="node-indicator">
            <span className="node-num">④</span>
            <span className="node-name">STAGE 1: BINARY IDS</span>
          </div>
          <div className="node-body">
            <div className="node-desc">Random Forest Gatekeeper</div>
            <div className="node-detail">
              {stage1Result ? `Prediction: ${stage1Result.toUpperCase()}` : 'Benign vs Attack Filter'}
            </div>
          </div>
          <div className="node-footer">{getStatusBadge(node4State)}</div>
        </div>

        <div className="workflow-connector">
          <span className="connector-arrow">➔</span>
        </div>

        {/* Step 5: Conditional Stage 2 */}
        <div className={`workflow-node ${node5State}`}>
          <div className="node-indicator">
            <span className="node-num">⑤</span>
            <span className="node-name">STAGE 2: ATTACK CLASSIFIER</span>
          </div>
          <div className="node-body">
            <div className="node-desc">Conditional Multiclass (Random Forest)</div>
            <div className="node-detail">
              {node5State === 'bypassed'
                ? 'Bypassed (Flow is Benign)'
                : stage2Result
                ? `Category: ${stage2Result}`
                : 'Invoked only if Stage 1 = Attack'}
            </div>
          </div>
          <div className="node-footer">{getStatusBadge(node5State)}</div>
        </div>

        <div className="workflow-connector">
          <span className="connector-arrow">➔</span>
        </div>

        {/* Step 6: Advisory Response */}
        <div className={`workflow-node ${node6State}`}>
          <div className="node-indicator">
            <span className="node-num">⑥</span>
            <span className="node-name">ADVISORY RESPONSE</span>
          </div>
          <div className="node-body">
            <div className="node-desc">Deterministic Operational Guidance</div>
            <div className="node-detail">Human Approval Required (Non-Remediating)</div>
          </div>
          <div className="node-footer">{getStatusBadge(node6State)}</div>
        </div>
      </div>

      <div className="workflow-provenance-callout">
        <span className="callout-icon">ℹ️</span>
        <span className="callout-text">
          <strong>Architectural Invariant:</strong> The evaluated per-flow inference path performs zero blockchain registry lookups.
          Blockchain consensus and cryptographic verification occur strictly at application startup / pre-load gating.
        </span>
      </div>
    </section>
  );
}
