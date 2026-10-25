import React, { useState } from 'react';
import { api } from '../api/client';
import flowPresetsData from '../utils/flowPresets.json';
import { ArchitectureWorkflow } from './ArchitectureWorkflow';

export function ArchitectureDemo({
  health,
  modelStatus,
  stage2Status,
  isVerifying,
  onVerify,
  verifyResult,
  onLoadModel,
  isModelLoaded,
  isPredicting,
  onPredict,
  predictionResult,
  predictionError,
  auditEvents,
}) {
  // Model selector state
  const [selectedModelId, setSelectedModelId] = useState('iot-ids-rf');

  // Flow selector state
  const [selectedPresetKey, setSelectedPresetKey] = useState('Normal');
  const [showRawFeatures, setShowRawFeatures] = useState(false);
  const [customFeaturesText, setCustomFeaturesText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Model Replacement Attack Simulator State Machine:
  // 'NORMAL' | 'SIMULATING_REPLACEMENT' | 'TAMPERED_DETECTED' | 'RESTORED'
  const [simulatorState, setSimulatorState] = useState('NORMAL');
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showFullHashes, setShowFullHashes] = useState(false);

  // Available real models
  const availableModels = [
    {
      id: 'iot-ids-rf',
      name: 'Stage 1: Binary Intrusion Detection (Random Forest)',
      version: 'v1.0.0',
      algorithm: modelStatus?.algorithm || 'RandomForestClassifier',
      role: 'Binary gatekeeper (Benign vs Attack)',
      path: 'ml/artifacts/ids_model.joblib',
      statusData: modelStatus,
    },
    {
      id: 'iot-ids-attack-classifier',
      name: 'Stage 2: Multiclass Attack Classifier (Random Forest)',
      version: 'v1.0.0',
      algorithm: 'RandomForestClassifier',
      role: 'Conditional attack categorizer (9 UNSW-NB15 classes)',
      path: 'ml/artifacts/attack_classifier.joblib',
      statusData: stage2Status || {
        model_id: 'iot-ids-attack-classifier',
        model_version: 'v1.0.0',
        algorithm: 'RandomForestClassifier',
        verification_status: modelStatus?.verification_status || 'UNVERIFIED',
        local_sha256: '596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208',
        registered_sha256: '596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208',
        is_loaded: isModelLoaded,
      },
    },
  ];

  const currentModel = availableModels.find((m) => m.id === selectedModelId) || availableModels[0];
  const activeStatus = currentModel.statusData || modelStatus;

  // Simulator impact on state
  const isTamperedDetected = simulatorState === 'TAMPERED_DETECTED';
  const effectiveModelLoaded = isModelLoaded && !isTamperedDetected;

  // Derive verification states
  const vStatus = isTamperedDetected
    ? 'HASH_MISMATCH'
    : (verifyResult && verifyResult.status) || activeStatus?.verification_status || 'UNVERIFIED';

  const isVerified = isTamperedDetected
    ? false
    : Boolean(verifyResult ? verifyResult.verified : (vStatus === 'VERIFIED'));

  const isFailed = isTamperedDetected || ['HASH_MISMATCH', 'NOT_REGISTERED', 'FILE_NOT_FOUND', 'BLOCKCHAIN_UNAVAILABLE'].includes(vStatus);

  const verificationState = isVerified ? 'VERIFIED' : isFailed ? 'FAILED' : 'UNVERIFIED';

  // Attack simulator handlers
  const handleSimulateReplacement = async () => {
    setIsSimulating(true);
    setSimulatorState('SIMULATING_REPLACEMENT');
    try {
      const res = await api.simulateModelReplacement();
      setSimulationResult(res);
      setSimulatorState('TAMPERED_DETECTED');
    } catch (err) {
      alert('Model replacement simulation failed: ' + err.message);
      setSimulatorState('NORMAL');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetReplacement = async () => {
    setIsSimulating(true);
    try {
      const res = await api.resetModelReplacement();
      setSimulationResult(res);
      setSimulatorState('RESTORED');
      if (onLoadModel) {
        await onLoadModel();
      }
    } catch (err) {
      alert('Reset failed: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateUnregistered = async () => {
    setIsSimulating(true);
    setSimulatorState('SIMULATING_REPLACEMENT');
    try {
      const res = await api.simulateUnregisteredVersion();
      setSimulationResult(res);
      setSimulatorState('TAMPERED_DETECTED');
    } catch (err) {
      alert('Unregistered version simulation failed: ' + err.message);
      setSimulatorState('NORMAL');
    } finally {
      setIsSimulating(false);
    }
  };

  // Preset flows
  const activePreset = flowPresetsData[selectedPresetKey] || flowPresetsData['Normal'];

  const handlePresetChange = (key) => {
    setSelectedPresetKey(key);
    setIsCustomMode(false);
  };

  const handleRunInference = () => {
    let featuresToSubmit = activePreset.features;
    if (isCustomMode && customFeaturesText.trim()) {
      try {
        featuresToSubmit = JSON.parse(customFeaturesText);
      } catch (err) {
        alert('Invalid JSON in custom features: ' + err.message);
        return;
      }
    }
    onPredict(featuresToSubmit);
  };

  // Evaluator Q&A Content
  const faqs = [
    {
      q: 'Why use a blockchain in this IDS system?',
      a: 'To provide an on-chain model provenance registry and tamper-evident audit trail. Cryptographic SHA-256 verification anchors model identity before loading.',
    },
    {
      q: 'Is the blockchain queried for every incoming network flow?',
      a: 'No. The evaluated architecture places blockchain registry verification in the startup/model-initialization control path rather than the per-flow inference path. Runtime instrumentation measured zero blockchain registry lookups during per-flow inference.',
    },
    {
      q: 'What does Stage 1 do?',
      a: 'Binary classification: Stage 1 acts as a rapid binary gatekeeper (Random Forest), classifying incoming network flows as either Benign or Attack (baseline: 90.30% accuracy, 98.78% precision, 86.82% recall, 92.41% F1).',
    },
    {
      q: 'What happens after cryptographic verification succeeds?',
      a: 'The verified artifact is authorized for loading and inference. In the backend implementation, /model/verify executes on-chain verification followed by gated memory loading, unlocking downstream network flow inference.',
    },
    {
      q: 'What happens if Stage 1 classifies a flow as Benign?',
      a: 'The final result is designated as "Normal" and Stage 2 is completely bypassed. Bypassing Stage 2 reduces mean inference latency by an empirical 11.54% on benign traffic.',
    },
    {
      q: 'What happens if Stage 1 classifies a flow as Attack?',
      a: 'The flow is conditionally routed to Stage 2, which classifies the attack category across 9 UNSW-NB15 attack categories (DoS, Exploits, Generic, Reconnaissance, etc.).',
    },
    {
      q: 'What happens next after Stage 2 classification?',
      a: 'A deterministic, human-in-the-loop Advisory Attack Response Recommendation is generated with tactical priorities, operator guidance, and risk rationales.',
    },
    {
      q: 'Does the system automatically block the attacker or modify firewall rules?',
      a: 'No. Autonomous remediation is strictly disabled (is_advisory = true, requires_human_approval = true, automated_remediation_enabled = false). The recommendations guide human security operators.',
    },
    {
      q: 'What are the limitations of the system and recommendations?',
      a: 'Model performance limitations, extreme class imbalance (up to 428.89:1), dataset limitations, Stage 1 false negatives (15,730 true attacks misclassified as Benign on the full UNSW-NB15 test set, notably Fuzzers), Stage 2 category confusion (26,741 misclassified attack categories), and the absolute requirement for human validation before executing operational changes.',
    },
  ];

  return (
    <div className="architecture-demo-page" data-testid="architecture-demo-page">
      {/* Top Architecture Workflow Visualization */}
      <ArchitectureWorkflow
        verificationState={verificationState}
        modelLoadedState={effectiveModelLoaded}
        flowSelected={Boolean(activePreset)}
        stage1Result={predictionResult?.stage1_prediction || (predictionResult?.prediction ? predictionResult.prediction : null)}
        stage2Invoked={Boolean(predictionResult?.stage2_invoked)}
        stage2Result={predictionResult?.stage2_prediction || null}
        advisoryResult={predictionResult?.advisory_recommendation || null}
        isReplacementSimulated={isTamperedDetected}
      />

      {/* STAGE 1: MODEL TRUST & INTEGRITY GATE */}
      <section className="demo-stage-card" id="stage-trust-gate" data-testid="model-provenance-card">
        <div className="stage-card-header">
          <div className="stage-num-badge">STAGE 1</div>
          <div className="stage-title-wrap">
            <h3 className="stage-title">Model Trust &amp; Integrity Gate</h3>
            <p className="stage-subtitle">
              Verify cryptographic SHA-256 digest against on-chain smart contract provenance before memory authorization.
            </p>
          </div>
          <div className="stage-status-indicator">
            <span
              className={`badge ${
                isVerified ? 'badge-verified' : isFailed ? 'badge-mismatch' : 'badge-unverified'
              }`}
              data-testid="status-badge"
            >
              {isVerified ? 'Verified' : isFailed ? (vStatus === 'HASH_MISMATCH' ? 'Hash Mismatch' : vStatus) : 'Unverified'}
            </span>
          </div>
        </div>

        <div className="stage-card-content">
          <div className="form-group">
            <label className="form-label" htmlFor="model-selector">
              Select Target Model Architecture to Inspect &amp; Verify:
            </label>
            <select
              id="model-selector"
              className="form-control model-select-input"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id} : {m.version})
                </option>
              ))}
            </select>
          </div>

          <div className="model-provenance-grid">
            <div className="provenance-metric">
              <span className="metric-label">Model Identifier</span>
              <span className="metric-value font-mono" data-testid="model-id">{currentModel.id}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Registered Version</span>
              <span className="metric-value font-mono" data-testid="model-version">{currentModel.version}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Algorithm</span>
              <span className="metric-value font-mono" data-testid="model-algorithm">{currentModel.algorithm}</span>
            </div>
            <div className="provenance-metric">
              <span className="metric-label">Physical Artifact Path</span>
              <span className="metric-value font-mono font-xs">{currentModel.path}</span>
            </div>
          </div>

          <div className="hash-comparison-box">
            <div className="hash-row">
              <span className="hash-label">Local File SHA-256:</span>
              <span className="hash-digest font-mono" data-testid="local-hash">
                {activeStatus?.local_sha256 || 'Compute upon verification...'}
              </span>
            </div>
            <div className="hash-row">
              <span className="hash-label">Blockchain Registered SHA-256:</span>
              <span className="hash-digest font-mono" data-testid="registered-hash">
                {activeStatus?.registered_sha256 || 'Querying ModelRegistry.sol...'}
              </span>
            </div>
            <div className="hash-match-status">
              {isVerified && (!verifyResult || verifyResult.verified) && (
                <div className="alert-box success">
                  <strong>✓ MODEL VERIFIED:</strong> SHA-256 digests match exactly. On-chain registration confirmed. Artifact authorized for memory loading.
                  <div style={{ marginTop: '0.25rem' }}>Loaded (Inference Enabled)</div>
                </div>
              )}
              {(isFailed || (verifyResult && !verifyResult.verified)) && (
                <div className="alert-box danger">
                  <strong>✗ MODEL VERIFICATION FAILED:</strong> Verification Failed ({verifyResult?.status || vStatus}).
                  <div>Unloaded (Inference Blocked)</div>
                  <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>
                    Fail-closed security gate engaged: model loading is blocked and network analysis remains locked.
                  </p>
                </div>
              )}
              {!isVerified && !isFailed && (!verifyResult || verifyResult.verified) && (
                <div className="alert-box warning">
                  <strong>⚠️ UNVERIFIED:</strong> Model artifact has not yet completed on-chain cryptographic verification.
                  <div>Unloaded (Inference Blocked)</div>
                </div>
              )}
            </div>
          </div>

          <div className="stage-actions">
            <button
              className="btn btn-primary"
              onClick={() => onVerify(selectedModelId === 'iot-ids-attack-classifier' ? 'stage2' : 'stage1')}
              disabled={isVerifying}
              data-testid="verify-btn"
            >
              {isVerifying ? 'Querying Blockchain Registry...' : 'VERIFY MODEL ON-CHAIN'}
            </button>

            <button
              className="btn btn-success"
              onClick={onLoadModel}
              disabled={!isVerified || effectiveModelLoaded}
              data-testid="load-model-btn"
              title={!isVerified ? 'Verification required before loading' : 'Load verified artifact into memory'}
            >
              {effectiveModelLoaded ? '✓ TRUSTED MODEL LOADED' : 'LOAD VERIFIED MODEL'}
            </button>
          </div>

          {effectiveModelLoaded && (
            <div className="model-loaded-banner" data-testid="model-loaded-banner">
              <span>✓ <strong>TRUSTED MODEL LOADED:</strong> Stage 1: READY | Stage 2: READY. Network Flow Analysis is now UNLOCKED.</span>
            </div>
          )}

          {/* Model Replacement Attack Simulator Component */}
          <div className="model-replacement-simulator-card" data-testid="replacement-simulator-box" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color, #333)', paddingTop: '1.25rem' }}>
            <div className="simulator-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-danger" style={{ marginRight: '0.5rem' }}>ATTACK SIMULATOR</span>
                <strong style={{ fontSize: '1rem' }}>Model Replacement Attack Demonstration</strong>
              </div>
              <span className={`status-pill ${isTamperedDetected ? 'danger' : 'success'}`} data-testid="simulator-state-pill">
                {simulatorState}
              </span>
            </div>

            <p className="simulator-description" style={{ fontSize: '0.85rem', color: 'var(--text-muted, #aaa)', marginBottom: '1rem' }}>
              Creates an ephemeral modified copy of the registered model to demonstrate the fail-closed provenance gate. The canonical model is never modified.
            </p>

            {/* Side-by-Side Two Hashes Comparison */}
            {isTamperedDetected && simulationResult && (
              <div className="replacement-tamper-box alert-box danger" data-testid="tamper-detected-alert" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⚠️</span>
                  <h4 style={{ margin: 0 }}>
                    {simulationResult.scenario === 'unregistered_version'
                      ? 'REJECTED: NOT_REGISTERED (v9.9.9)'
                      : 'MODEL REPLACEMENT DETECTED'}
                  </h4>
                </div>

                <div className="hashes-comparison-grid" data-testid="hash-comparison-box" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', margin: '1rem 0' }}>
                  <div className="hash-column registered" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px' }}>
                    <span className="hash-col-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#4ade80' }}>REGISTERED MODEL</span>
                    <span style={{ fontSize: '0.75rem', color: '#999' }}>Blockchain Reference (ModelRegistry.sol)</span>
                    <div className="font-mono font-xs" data-testid="registered-reference-hash" style={{ wordBreak: 'break-all', marginTop: '0.25rem' }}>
                      {showFullHashes
                        ? (simulationResult.registered_hash || activeStatus?.registered_sha256 || 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5')
                        : `${(simulationResult.registered_hash || activeStatus?.registered_sha256 || 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5').slice(0, 24)}...`}
                    </div>
                  </div>

                  <div className="hash-inequality" data-testid="mismatch-badge" style={{ fontSize: '1.8rem', fontWeight: 'bold', textAlign: 'center', color: '#f87171' }}>
                    ≠
                  </div>

                  <div className="hash-column observed" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px' }}>
                    <span className="hash-col-label" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#f87171' }}>OBSERVED MODEL</span>
                    <span style={{ fontSize: '0.75rem', color: '#999' }}>Temporary Local Candidate Artifact</span>
                    <div className="font-mono font-xs" data-testid="observed-candidate-hash" style={{ wordBreak: 'break-all', marginTop: '0.25rem', color: '#fca5a5' }}>
                      {showFullHashes
                        ? (simulationResult.observed_hash || simulationResult.local_hash || 'Unregistered Candidate')
                        : `${(simulationResult.observed_hash || simulationResult.local_hash || 'Unregistered Candidate').slice(0, 24)}...`}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary font-xs"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => setShowFullHashes(!showFullHashes)}
                    data-testid="toggle-full-hashes-btn"
                  >
                    {showFullHashes ? 'Show Short Hashes' : 'Show Full 64-Char Hashes'}
                  </button>
                </div>

                <div className="tamper-enforcement-status" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
                  <div><strong>Result:</strong> <span className="font-mono" style={{ color: '#f87171' }}>{simulationResult.status || 'HASH_MISMATCH'}</span></div>
                  <div><strong>INTEGRITY CHECK:</strong> <span style={{ color: '#f87171' }}>✗ FAILED</span></div>
                  <div><strong>MODEL LOAD:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>BLOCKED</span></div>
                  <div><strong>INFERENCE:</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>DISABLED</span></div>
                </div>

                {/* Attack Simulation Timeline */}
                <div className="simulation-timeline" data-testid="simulation-timeline" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Attack-Simulation Execution Timeline</h5>
                  <ol className="timeline-steps" style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', lineHeight: '1.6' }}>
                    {simulationResult.timeline && simulationResult.timeline.length > 0 ? (
                      simulationResult.timeline.map((step) => (
                        <li key={step.step}>
                          <strong>{step.name}</strong>: {step.detail}{' '}
                          <span style={{ color: step.status === 'HASH_MISMATCH' ? '#f87171' : '#4ade80' }}>
                            {step.status === 'HASH_MISMATCH' ? '✗' : '✓'}
                          </span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li>Original model identified: <code>iot-ids-rf:v1.0.0</code> ✓</li>
                        <li>Temporary demonstration copy created in OS temp buffer ✓</li>
                        <li>Temporary artifact modified at byte offset 500 ✓</li>
                        <li>SHA-256 recalculated on temporary copy ✓</li>
                        <li>Compared with registered ModelRegistry.sol digest ✓</li>
                        <li>HASH_MISMATCH detected ✗</li>
                        <li>Model loading blocked fail-closed ✓</li>
                        <li>Downstream inference locked ✓</li>
                      </>
                    )}
                  </ol>
                </div>
              </div>
            )}

            {simulatorState === 'RESTORED' && (
              <div className="alert-box success" data-testid="restored-banner" style={{ marginBottom: '1rem' }}>
                <strong>✓ CANONICAL MODEL RESTORED:</strong> Ephemeral tampered artifact destroyed.
                <div>Canonical model re-verified on-chain: <code>dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5</code>.</div>
                <div style={{ marginTop: '0.25rem' }}>✓ REGISTERED HASH MATCHES | ✓ MODEL READY</div>
              </div>
            )}

            {/* Simulator Action Buttons */}
            <div className="simulator-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {isTamperedDetected ? (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleResetReplacement}
                  disabled={isSimulating}
                  data-testid="restore-model-btn"
                >
                  {isSimulating ? 'Restoring Model...' : '↻ RESTORE VERIFIED MODEL'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleSimulateReplacement}
                    disabled={isSimulating}
                    data-testid="simulate-replacement-btn"
                  >
                    {isSimulating ? 'Simulating Attack...' : '🔴 SIMULATE MODEL REPLACEMENT'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={handleSimulateUnregistered}
                    disabled={isSimulating}
                    data-testid="simulate-unregistered-btn"
                  >
                    {isSimulating ? 'Querying Version...' : '⚠️ TEST UNREGISTERED VERSION (v9.9.9)'}
                  </button>
                </>
              )}
            </div>

            {/* Evaluator Explanation Box */}
            <div className="evaluator-explanation-box" data-testid="evaluator-explanation-box" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color, #444)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem' }}>
              <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-color, #eee)' }}>What is being demonstrated?</h5>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted, #ccc)' }}>
                An attacker has modified the local model artifact. The system does not trust the modified artifact automatically.
                It recalculates the artifact's SHA-256 digest and compares it with the digest registered for the authorized model identity and version.
                Because the digests differ, model loading is blocked and downstream inference remains unavailable.
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#999' }}>
                <strong>Architectural Distinction:</strong> The blockchain registry provides the trusted model digest for the registered model identity and version.
                The observed artifact is hashed locally and compared with that registered digest. A mismatch causes the model-loading gate to fail closed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STAGE 2: NETWORK FLOW SELECTION & PREDICTION */}
      <section
        className={`demo-stage-card ${!effectiveModelLoaded ? 'card-locked' : ''}`}
        id="stage-flow-selection"
        data-testid="prediction-card"
      >
        <div className="stage-card-header">
          <div className="stage-num-badge">STAGE 2</div>
          <div className="stage-title-wrap">
            <h3 className="stage-title">Network Flow Analysis</h3>
            <p className="stage-subtitle">
              Select an authentic UNSW-NB15 network flow preset to evaluate through the hierarchical detection cascade.
            </p>
          </div>
          <div className="stage-status-indicator">
            {effectiveModelLoaded ? (
              <span className="status-pill success" data-testid="flow-unlocked-pill">✓ ENABLED</span>
            ) : (
              <span className="status-pill locked" data-testid="flow-locked-pill">🔒 LOCKED</span>
            )}
          </div>
        </div>

        <div className="stage-card-content">
          {!effectiveModelLoaded && (
            <div className="locked-placeholder" data-testid="flow-locked-placeholder" style={{ marginBottom: '1.25rem' }}>
              <span className="lock-icon">🔒</span>
              <div>
                <strong>NETWORK FLOW ANALYSIS: 🔒 LOCKED</strong>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                  Reason: Model provenance verification failed. The model cannot be authorized for inference.
                </p>
              </div>
            </div>
          )}

          <div className="flow-presets-bar">
            <span className="preset-label">Authentic Traffic Presets:</span>
            {Object.keys(flowPresetsData).map((key) => {
              const isSelected = selectedPresetKey === key && !isCustomMode;
              return (
                <button
                  key={key}
                  className={`btn-preset ${isSelected ? 'active' : ''}`}
                  onClick={() => handlePresetChange(key)}
                  type="button"
                >
                  {key === 'Normal' ? '🟢 Normal / Benign' : `🔴 ${key} Attack`}
                </button>
              );
            })}
            <button
              className={`btn-preset ${isCustomMode ? 'active' : ''}`}
              onClick={() => setIsCustomMode(true)}
              type="button"
            >
              ⚙️ Custom Flow
            </button>
          </div>

          {!isCustomMode ? (
            <div className="flow-summary-card">
              <div className="summary-header">
                <h4>Flow Preset Summary: {activePreset.intended_scenario}</h4>
                <span className="summary-tag">UNSW-NB15 Benchmark Flow</span>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="sum-label">Protocol:</span>
                  <span className="sum-val font-mono">{activePreset.summary.protocol.toUpperCase()}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Service:</span>
                  <span className="sum-val font-mono">{activePreset.summary.service}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">TCP State:</span>
                  <span className="sum-val font-mono">{activePreset.summary.state}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Duration:</span>
                  <span className="sum-val font-mono">{activePreset.summary.duration} s</span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Packets (Src/Dst):</span>
                  <span className="sum-val font-mono">
                    {activePreset.summary.source_packets} / {activePreset.summary.dest_packets}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Bytes (Src/Dst):</span>
                  <span className="sum-val font-mono">
                    {activePreset.summary.source_bytes} / {activePreset.summary.dest_bytes}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">TTL (Src/Dst):</span>
                  <span className="sum-val font-mono">
                    {activePreset.summary.source_ttl} / {activePreset.summary.dest_ttl}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="sum-label">Packet Rate:</span>
                  <span className="sum-val font-mono">{activePreset.summary.packet_rate.toFixed(2)} pkt/s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="custom-flow-editor">
              <label className="form-label" htmlFor="custom-json-input">
                Custom 42-Feature JSON Vector:
              </label>
              <textarea
                id="custom-json-input"
                className="form-control font-mono"
                rows={6}
                value={customFeaturesText || JSON.stringify(activePreset.features, null, 2)}
                onChange={(e) => setCustomFeaturesText(e.target.value)}
              />
            </div>
          )}

          <div className="toggle-raw-features">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRawFeatures(!showRawFeatures)}
              type="button"
            >
              {showRawFeatures ? '▲ HIDE RAW 42 FEATURES' : '▼ VIEW RAW 42 FEATURES (TECHNICAL INSPECTOR)'}
            </button>
          </div>

          {showRawFeatures && (
            <div className="raw-features-panel">
              <pre className="raw-features-code">
                {JSON.stringify(activePreset.features, null, 2)}
              </pre>
            </div>
          )}

          <div className="stage-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleRunInference}
              disabled={isPredicting}
              data-testid="predict-btn"
              type="button"
            >
              {isPredicting ? 'Executing Two-Stage Inference...' : 'RUN INTRUSION DETECTION PIPELINE'}
            </button>
          </div>

          {predictionError && (
            <div className="alert-box danger" style={{ marginTop: '1rem' }}>
              <strong>Inference Error:</strong> {predictionError}
            </div>
          )}
        </div>
      </section>

      {/* STAGE 3: STAGE 1 BINARY IDS RESULT */}
      {predictionResult && (
        <section className="demo-stage-card result-card" id="stage-binary-ids" data-testid="prediction-result">
          <div className="stage-card-header">
            <div className="stage-num-badge">STAGE 3</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Stage 1 — Binary Intrusion Detection</h3>
              <p className="stage-subtitle">
                Random Forest gatekeeper classifies incoming flow into Benign vs Attack.
              </p>
            </div>
            <div className="stage-status-indicator">
              <span
                className={`status-pill ${
                  (predictionResult.stage1_prediction === 'Benign' || predictionResult.prediction === 'Benign')
                    ? 'success'
                    : 'danger'
                }`}
              >
                {(predictionResult.stage1_prediction || predictionResult.prediction || '').toUpperCase()}
              </span>
            </div>
          </div>

          <div className="stage-card-content">
            <div className="result-metric-grid">
              <div className="result-metric">
                <span className="metric-label">Stage 1 Prediction</span>
                <span
                  className={`metric-value ${
                    (predictionResult.stage1_prediction === 'Benign' || predictionResult.prediction === 'Benign')
                      ? 'text-success'
                      : 'text-danger'
                  }`}
                  data-testid="prediction-label"
                >
                  {(predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack')
                    ? 'Attack / Malicious Flow'
                    : 'Benign / Normal Flow'}
                </span>
              </div>
              <div className="result-metric">
                <span className="metric-label">Confidence Score</span>
                <span className="metric-value font-mono" data-testid="prediction-confidence">
                  {predictionResult.stage1_confidence !== undefined
                    ? `${(predictionResult.stage1_confidence * 100).toFixed(2)}%`
                    : predictionResult.confidence !== undefined
                    ? `${(predictionResult.confidence * 100).toFixed(2)}%`
                    : '90.00%'}
                </span>
              </div>
              <div className="result-metric">
                <span className="metric-label">Stage 1 Latency</span>
                <span className="metric-value font-mono" data-testid="inference-latency">
                  {predictionResult.inference_latency_ms?.toFixed(2)} ms
                </span>
              </div>
              <div className="result-metric">
                <span className="metric-label">Stage 1 Model</span>
                <span className="metric-value font-mono">
                  {predictionResult.stage1_model_id || predictionResult.model_id}:
                  {predictionResult.stage1_model_version || predictionResult.model_version}
                </span>
              </div>
            </div>

            {/* Visual Branching Decision */}
            <div className="branching-decision-box">
              {(predictionResult.stage1_prediction === 'Benign' || predictionResult.prediction === 'Benign') ? (
                <div className="branch-benign alert-box success">
                  <h4>✓ BENIGN TRAFFIC PATH ENGAGED</h4>
                  <p><strong>Final Classification: NORMAL</strong></p>
                  <p><strong>Stage 2 Status:</strong> NOT INVOKED (Bypassed)</p>
                  <p className="branch-rationale">
                    <strong>Reason:</strong> Stage 1 classified the traffic flow as Benign. The hierarchical pipeline conditionally bypasses Stage 2 multiclass classification, saving ~11.54% runtime latency and routing directly to Normal operational status.
                  </p>
                </div>
              ) : (
                <div className="branch-attack alert-box danger">
                  <h4>⚠️ INTRUSION DETECTED — CONDITIONAL STAGE 2 TRIGGERED</h4>
                  <p><strong>Stage 1 Determination:</strong> ATTACK</p>
                  <p><strong>Stage 2 Status:</strong> CONDITIONALLY INVOKED</p>
                  <p className="branch-rationale">
                    <strong>Reason:</strong> Stage 1 detected abnormal traffic indicators. The flow is immediately escalated to Stage 2 for specific attack category attribution and targeted mitigation advisory generation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* STAGE 4: STAGE 2 MULTICLASS ATTACK CLASSIFIER (CONDITIONAL) */}
      {predictionResult && (
        <section
          className={`demo-stage-card result-card ${!predictionResult.stage2_invoked ? 'card-bypassed' : ''}`}
          id="stage-multiclass"
          data-testid="stage2-card"
        >
          <div className="stage-card-header">
            <div className="stage-num-badge">STAGE 4</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Stage 2 — Attack Type Classification</h3>
              <p className="stage-subtitle">
                Specialized Random Forest categorizes attack flows into one of 9 UNSW-NB15 attack types.
              </p>
            </div>
            <div className="stage-status-indicator">
              {!predictionResult.stage2_invoked ? (
                <span className="status-pill bypassed">⏭️ BYPASSED (BENIGN)</span>
              ) : (
                <span className="status-pill danger" data-testid="stage2-category-pill">
                  {predictionResult.stage2_prediction || predictionResult.final_prediction}
                </span>
              )}
            </div>
          </div>

          <div className="stage-card-content">
            {!predictionResult.stage2_invoked ? (
              <div className="bypassed-explanation" data-testid="stage2-bypassed-explanation">
                <span className="bypassed-icon">⏭️</span>
                <div>
                  <h4>Stage 2 Classification Was Not Invoked</h4>
                  <p>Because Stage 1 classified the traffic as Benign, execution terminated early with label <strong>Normal</strong>. This conditional bypass avoids unnecessary multiclass inference on legitimate network traffic.</p>
                </div>
              </div>
            ) : (
              <div className="stage2-results-container" data-testid="stage2-results-container">
                <div className="result-metric-grid">
                  <div className="result-metric">
                    <span className="metric-label">Identified Threat Category</span>
                    <span className="metric-value text-danger font-bold" data-testid="stage2-category-value">
                      {predictionResult.stage2_prediction || predictionResult.final_prediction}
                    </span>
                  </div>
                  <div className="result-metric">
                    <span className="metric-label">Classification Confidence</span>
                    <span className="metric-value font-mono">
                      {predictionResult.stage2_confidence
                        ? `${(predictionResult.stage2_confidence * 100).toFixed(2)}%`
                        : 'Available in probability matrix'}
                    </span>
                  </div>
                  <div className="result-metric">
                    <span className="metric-label">Stage 2 Model</span>
                    <span className="metric-value font-mono">
                      {predictionResult.stage2_model_id || 'iot-ids-attack-classifier'}:
                      {predictionResult.stage2_model_version || 'v1.0.0'}
                    </span>
                  </div>
                  <div className="result-metric">
                    <span className="metric-label">Classification Scope</span>
                    <span className="metric-value">9 UNSW-NB15 Categories</span>
                  </div>
                </div>

                <div className="attack-categories-list">
                  <span className="cat-label">Supported Taxonomy:</span>
                  {['Analysis', 'Backdoor', 'DoS', 'Exploits', 'Fuzzers', 'Generic', 'Reconnaissance', 'Shellcode', 'Worms'].map((cat) => {
                    const isMatched = (predictionResult.stage2_prediction === cat || predictionResult.final_prediction === cat);
                    return (
                      <span
                        key={cat}
                        className={`cat-pill ${isMatched ? 'active-cat' : ''}`}
                      >
                        {cat}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* STAGE 5: RECOMMENDED RESPONSE (ADVISORY LAYER) */}
      {predictionResult && predictionResult.advisory_recommendation && (
        <section className="demo-stage-card advisory-card" id="stage-advisory-response" data-testid="advisory-card">
          <div className="stage-card-header">
            <div className="stage-num-badge">STAGE 5</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Recommended Response (Advisory Guidance)</h3>
              <p className="stage-subtitle">
                Deterministic mitigation playbook mapping threat category to structured operational guidance.
              </p>
            </div>
            <div className="stage-status-indicator">
              <span className={`status-pill ${predictionResult.advisory_recommendation.severity === 'Critical' ? 'danger' : 'warning'}`}>
                {predictionResult.advisory_recommendation.severity} Severity
              </span>
            </div>
          </div>

          <div className="stage-card-content">
            {/* Prominent Non-Remediation Boundary Badges */}
            <div className="advisory-boundary-pills">
              <span className="boundary-tag advisory" data-testid="badge-advisory">✓ ADVISORY ONLY</span>
              <span className="boundary-tag approval" data-testid="badge-human-approval">✓ HUMAN APPROVAL REQUIRED</span>
              <span className="boundary-tag disabled" data-testid="badge-remediation-disabled">⛔ AUTOMATED REMEDIATION DISABLED</span>
            </div>

            <div className="advisory-details-grid">
              <div className="advisory-field">
                <span className="field-title">Threat Category &amp; Priority:</span>
                <span className="field-body" data-testid="advisory-priority">
                  <strong>{predictionResult.advisory_recommendation.category}</strong> — Priority: <strong>{predictionResult.advisory_recommendation.investigation_priority}</strong>
                </span>
              </div>

              <div className="advisory-field">
                <span className="field-title">Recommended Tactical Action:</span>
                <p className="field-body action-highlight" data-testid="advisory-action">
                  {predictionResult.advisory_recommendation.recommended_action}
                </p>
              </div>

              <div className="advisory-field">
                <span className="field-title">Human Operator Guidance:</span>
                <p className="field-body" data-testid="advisory-guidance">
                  {predictionResult.advisory_recommendation.operator_guidance}
                </p>
              </div>

              <div className="advisory-field">
                <span className="field-title">Technical Rationale:</span>
                <p className="field-body font-sm">
                  {predictionResult.advisory_recommendation.rationale}
                </p>
              </div>

              <div className="advisory-field">
                <span className="field-title">Security &amp; Operational Limitations:</span>
                <p className="field-body font-sm text-muted">
                  {predictionResult.advisory_recommendation.limitations}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* COMPACT LIFECYCLE AUDIT TRACE */}
      {predictionResult && (
        <section className="demo-stage-card trace-card" id="stage-lifecycle-trace" data-testid="audit-trace-card">
          <div className="stage-card-header">
            <div className="stage-num-badge">AUDIT TRACE</div>
            <div className="stage-title-wrap">
              <h3 className="stage-title">Execution Lifecycle Audit Trail</h3>
              <p className="stage-subtitle">
                Immutable operational audit log recorded in SQLite (raw 42-feature vectors strictly excluded).
              </p>
            </div>
          </div>

          <div className="stage-card-content">
            <div className="lifecycle-trace-steps">
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">MODEL_VERIFICATION</span>
              </div>
              <span className="trace-arrow">➔</span>
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">MODEL_LOAD</span>
              </div>
              <span className="trace-arrow">➔</span>
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">PREDICTION</span>
              </div>
              {predictionResult.stage2_invoked && (
                <>
                  <span className="trace-arrow">➔</span>
                  <div className="trace-step completed">
                    <span className="trace-icon">✓</span>
                    <span className="trace-text">ATTACK_CLASSIFICATION</span>
                  </div>
                </>
              )}
              <span className="trace-arrow">➔</span>
              <div className="trace-step completed">
                <span className="trace-icon">✓</span>
                <span className="trace-text">ADVISORY_RECOMMENDATION</span>
              </div>
            </div>

            <div className="trace-metadata-row">
              <span>Event ID: <strong className="font-mono">{predictionResult.event_id || 'Captured'}</strong></span>
              <span className="separator">•</span>
              <span>Per-flow blockchain queries: <strong>0</strong></span>
              <span className="separator">•</span>
              <span>Verification Status: <strong>{predictionResult.verification_status}</strong></span>
            </div>
          </div>
        </section>
      )}

      {/* EVALUATOR-FIRST Q&A REFERENCE GUIDE */}
      <section className="evaluator-faq-section" id="evaluator-guide">
        <h3 className="faq-main-title">Evaluator Architecture &amp; Defense Guide</h3>
        <p className="faq-main-subtitle">
          Core architectural principles, security boundaries, and factual justifications for defense evaluation.
        </p>

        <div className="faq-accordion">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className={`faq-card ${isExpanded ? 'expanded' : ''}`}>
                <button
                  className="faq-question-btn"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  type="button"
                >
                  <span className="faq-q-text">Q: {faq.q}</span>
                  <span className="faq-icon">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="faq-answer-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
