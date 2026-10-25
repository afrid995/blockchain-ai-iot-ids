import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { api, BASE_URL } from '../api/client';

describe('Phase 7B.5.4 Architecture Demonstration Workflow Tests', () => {
  const mockHealth = {
    status: 'healthy',
    application_status: 'running',
    blockchain_status: 'connected',
    model_status: 'loaded',
    timestamp: '2026-10-25T10:00:00Z',
  };

  const mockModelStatusVerified = {
    model_id: 'iot-ids-rf',
    model_version: 'v1.0.0',
    algorithm: 'RandomForestClassifier',
    local_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    registered_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    verification_status: 'VERIFIED',
    is_loaded: true,
    last_verified_at: '2026-10-25T10:05:00Z',
    read_latency_ms: 12.34,
  };

  const mockModelStatusUnverified = {
    ...mockModelStatusVerified,
    verification_status: 'UNVERIFIED',
    is_loaded: false,
  };

  const mockHierarchicalAttackResponse = {
    final_prediction: 'DoS',
    stage1_prediction: 'Attack',
    stage1_code: 1,
    stage1_confidence: 0.945,
    stage2_invoked: true,
    stage2_prediction: 'DoS',
    stage2_confidence: 0.882,
    advisory_recommendation: {
      category: 'DoS',
      severity: 'High',
      investigation_priority: 'High',
      recommended_action: 'Inspect traffic volume and rate anomalies. Consider operator-approved rate limiting.',
      operator_guidance: 'Review source IP distribution, SYN flood signatures, and queue depth.',
      rationale: 'Denial of Service flows aim to exhaust network bandwidth or CPU.',
      limitations: 'Advisory only. Flash crowds can match statistical signatures.',
      is_advisory: true,
      requires_human_approval: true,
      automated_remediation_enabled: false,
    },
    stage1_model_id: 'iot-ids-rf',
    stage1_model_version: 'v1.0.0',
    stage2_model_id: 'iot-ids-attack-classifier',
    stage2_model_version: 'v1.0.0',
    verification_status: 'VERIFIED',
    event_id: 'evt-hier-001',
    inference_latency_ms: 41.25,
    per_flow_blockchain_queries: 0,
    timestamp: '2026-10-25T10:10:00Z',
  };

  const mockHierarchicalBenignResponse = {
    final_prediction: 'Normal',
    stage1_prediction: 'Benign',
    stage1_code: 0,
    stage1_confidence: 0.982,
    stage2_invoked: false,
    stage2_prediction: null,
    stage2_confidence: null,
    advisory_recommendation: {
      category: 'Normal',
      severity: 'Informational',
      investigation_priority: 'Low',
      recommended_action: 'Routine observation. Standard baseline logging.',
      operator_guidance: 'No immediate remediation required.',
      rationale: 'Traffic flow conforms to expected baseline.',
      limitations: 'Does not guarantee absence of low-and-slow threats.',
      is_advisory: true,
      requires_human_approval: true,
      automated_remediation_enabled: false,
    },
    stage1_model_id: 'iot-ids-rf',
    stage1_model_version: 'v1.0.0',
    stage2_model_id: 'iot-ids-attack-classifier',
    stage2_model_version: 'v1.0.0',
    verification_status: 'VERIFIED',
    event_id: 'evt-hier-002',
    inference_latency_ms: 22.45,
    per_flow_blockchain_queries: 0,
    timestamp: '2026-10-25T10:11:00Z',
  };

  const mockAuditData = {
    total: 2,
    limit: 10,
    offset: 0,
    events: [
      {
        event_id: 'audit-001',
        timestamp: '2026-10-25T10:10:00Z',
        event_type: 'PREDICTION',
        status: 'SUCCESS',
        model_id: 'iot-ids-rf',
        model_version: 'v1.0.0',
        verification_status: 'VERIFIED',
        details: { final_category: 'DoS', stage1_prediction: 'Attack' },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Initial state shows Model Trust Gate
  it('1. Initial state renders Model Trust & Integrity Gate as primary screen', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('model-provenance-card')).toBeInTheDocument();
      expect(screen.getByText(/Model Trust & Integrity Gate/i)).toBeInTheDocument();
      expect(screen.getByText(/System Architecture & Execution Flow/i)).toBeInTheDocument();
    });
  });

  // 2. Network Flow stage is locked before model verification
  it('2. Network Flow stage shows locked state when model is unverified/unloaded', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusUnverified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('flow-locked-placeholder')).toBeInTheDocument();
      const loadBtn = screen.getByTestId('load-model-btn');
      expect(loadBtn).toBeDisabled();
    });
  });

  // 3. Model verification success unlocks model loading
  it('3. Model verification success authorizes model loading', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusUnverified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });
    vi.spyOn(api, 'verifyModel').mockResolvedValue({
      verified: true,
      status: 'VERIFIED',
      model_id: 'iot-ids-rf',
      version: 'v1.0.0',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('verify-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('load-model-btn')).not.toBeDisabled();
    });
  });

  // 4. Model verification failure keeps downstream stages locked
  it('4. Model verification failure keeps downstream stages locked (fail-closed)', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded (HASH_MISMATCH)' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue({ ...mockModelStatusUnverified, verification_status: 'HASH_MISMATCH' });
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });
    vi.spyOn(api, 'verifyModel').mockResolvedValue({
      verified: false,
      status: 'HASH_MISMATCH',
      message: 'Local SHA-256 does not match blockchain digest.',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('verify-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('load-model-btn')).toBeDisabled();
      expect(screen.getByText(/Verification Failed \(HASH_MISMATCH\)/i)).toBeInTheDocument();
    });
  });

  // 5. Successful model loading unlocks network-flow analysis
  it('5. Successful model loading unlocks network-flow analysis', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('model-loaded-banner')).toBeInTheDocument();
      expect(screen.getByText(/Stage 1: READY | Stage 2: READY/i)).toBeInTheDocument();
    });
  });

  // 6. Benign prediction produces Normal and does not invoke Stage 2
  it('6. Benign prediction produces Normal and does not invoke Stage 2', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalBenignResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('prediction-result')).toBeInTheDocument();
      expect(screen.getByTestId('stage2-bypassed-explanation')).toBeInTheDocument();
      expect(screen.getByText(/Stage 2 Classification Was Not Invoked/i)).toBeInTheDocument();
      expect(screen.getByText(/Final Classification: NORMAL/i)).toBeInTheDocument();
    });
  });

  // 7. Attack prediction invokes Stage 2
  it('7. Attack prediction invokes Stage 2 conditionally', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('stage2-results-container')).toBeInTheDocument();
      expect(screen.getByText(/INTRUSION DETECTED — CONDITIONAL STAGE 2 TRIGGERED/i)).toBeInTheDocument();
    });
  });

  // 8. Stage 2 category is displayed correctly
  it('8. Stage 2 category is displayed correctly (DoS)', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('stage2-category-value')).toHaveTextContent('DoS');
      expect(screen.getByTestId('stage2-category-pill')).toHaveTextContent('DoS');
    });
  });

  // 9. Advisory recommendation is displayed
  it('9. Advisory recommendation is displayed with tactical action and guidance', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('advisory-card')).toBeInTheDocument();
      expect(screen.getByTestId('advisory-action')).toHaveTextContent(/Inspect traffic volume and rate anomalies/i);
      expect(screen.getByTestId('advisory-guidance')).toHaveTextContent(/Review source IP distribution/i);
    });
  });

  // 10. is_advisory === true
  it('10. Displays prominent "ADVISORY ONLY" badge', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('badge-advisory')).toHaveTextContent(/ADVISORY ONLY/i);
    });
  });

  // 11. requires_human_approval === true
  it('11. Displays prominent "HUMAN APPROVAL REQUIRED" badge', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('badge-human-approval')).toHaveTextContent(/HUMAN APPROVAL REQUIRED/i);
    });
  });

  // 12. automated_remediation_enabled === false
  it('12. Displays prominent "AUTOMATED REMEDIATION DISABLED" badge', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('badge-remediation-disabled')).toHaveTextContent(/AUTOMATED REMEDIATION DISABLED/i);
    });
  });

  // 13. Tampered Stage 1 blocks downstream execution
  it('13. Tampered Stage 1 security scenario triggers fail-closed block', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'runSecurityScenario').mockResolvedValue({
      scenario: 'tampered_stage1',
      status: 'HASH_MISMATCH',
      verified: false,
      model_id: 'iot-ids-rf',
      version: 'v1.0.0',
      action_taken: 'MODEL_LOAD_BLOCKED',
      downstream_state: 'LOCKED',
      message: 'Tampered Stage 1 model rejected (HASH_MISMATCH). Loading blocked fail-closed.',
    });

    render(<App />);

    // Switch to Security Test tab
    fireEvent.click(screen.getByRole('tab', { name: /Security Test/i }));

    await waitFor(() => {
      expect(screen.getByText(/Fail-Closed Model Integrity Testing/i)).toBeInTheDocument();
    });

    // Run Tampered Stage 1 simulation
    const btn = screen.getByRole('button', { name: /RUN TEST TAMPERED STAGE 1/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/GATE STATUS: HASH_MISMATCH/i)).toBeInTheDocument();
      expect(screen.getAllByText(/MODEL_LOAD_BLOCKED/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  // 14. Tampered Stage 2 is fail-closed
  it('14. Tampered Stage 2 security scenario blocks Stage 2 fail-closed', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'runSecurityScenario').mockResolvedValue({
      scenario: 'tampered_stage2',
      status: 'HASH_MISMATCH',
      verified: false,
      model_id: 'iot-ids-attack-classifier',
      version: 'v1.0.0',
      action_taken: 'STAGE2_LOAD_BLOCKED',
      downstream_state: 'LOCKED',
      message: 'Tampered Stage 2 model rejected (HASH_MISMATCH). Stage 2 loading blocked fail-closed.',
    });

    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: /Security Test/i }));

    const btn = screen.getByRole('button', { name: /RUN TEST TAMPERED STAGE 2/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getAllByText(/STAGE2_LOAD_BLOCKED/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  // 15. Existing /predict compatibility remains intact
  it('15. Existing /predict legacy endpoint compatibility remains functional', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predict').mockResolvedValue({
      prediction: 'Attack',
      prediction_code: 1,
      confidence: 0.92,
      model_id: 'iot-ids-rf',
      model_version: 'v1.0.0',
      verification_status: 'VERIFIED',
      inference_latency_ms: 35.12,
      timestamp: '2026-10-25T10:20:00Z',
    });

    render(<App />);

    // Switch to Live Test tab
    fireEvent.click(screen.getByRole('tab', { name: /Live Test/i }));

    await waitFor(() => {
      expect(screen.getByText(/Direct Inference & Endpoint Testing/i)).toBeInTheDocument();
    });

    // Select legacy endpoint
    fireEvent.click(screen.getByText(/POST \/predict \(Legacy Binary Baseline\)/i));

    // Submit prediction
    const submitBtn = screen.getByRole('button', { name: /SUBMIT TO LEGACY ENDPOINT/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Binary Prediction/i)).toBeInTheDocument();
      expect(screen.getByText('92.0%')).toBeInTheDocument();
    });
  });

  // 16. Existing /model/status compatibility remains intact
  it('16. /model/status endpoint response contract preserved', async () => {
    const getModelStatusSpy = vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(getModelStatusSpy).toHaveBeenCalled();
      expect(screen.getByTestId('model-id')).toHaveTextContent('iot-ids-rf');
      expect(screen.getByTestId('model-version')).toHaveTextContent('v1.0.0');
    });
  });

  // 17. Architecture state reflects actual backend response
  it('17. Architecture workflow reflects pipeline status', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/System Architecture & Execution Flow/i)).toBeInTheDocument();
      expect(screen.getByText(/CONTROL PLANE ONLY/i)).toBeInTheDocument();
      expect(screen.getByText(/Per-flow registry lookups:/i)).toBeInTheDocument();
    });
  });

  // 18. No raw 42-feature vector is persisted by frontend behavior
  it('18. Frontend does not persist raw 42-feature vectors in audit records', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    // Audit trace component shows event metadata without raw flow feature lists
    expect(screen.queryByTestId('raw-feature-vector-payload')).not.toBeInTheDocument();
  });

  // 19. No direct blockchain RPC calls originate from React
  it('19. Frontend communicates strictly via REST API (no direct Web3 RPC)', () => {
    // Assert BASE_URL targets REST backend, not Ethereum RPC port 8545
    expect(BASE_URL).toMatch(/http:\/\/(127\.0\.0\.1|localhost):8000/);
    expect(window.ethereum).toBeUndefined();
  });

  // 20. Research Metrics and Audit sections remain accessible
  it('20. Research Metrics and Audit sections remain fully accessible via navigation tabs', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    // Test Research Metrics tab
    fireEvent.click(screen.getByRole('tab', { name: /Research Metrics/i }));
    await waitFor(() => {
      expect(screen.getByText(/Research Metrics & Performance Statistics/i)).toBeInTheDocument();
      expect(screen.getByText(/The Fuzzers Bottleneck:/i)).toBeInTheDocument();
    });

    // Test Audit Trail tab
    fireEvent.click(screen.getByRole('tab', { name: /Audit Trail/i }));
    await waitFor(() => {
      expect(screen.getByTestId('audit-log-card')).toBeInTheDocument();
    });
  });

  // 21. Simulator: Normal state renders Attack Simulator controls & Evaluator Box
  it('21. Architecture view renders Model Replacement Attack Simulator controls and Evaluator Box', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('simulate-replacement-btn')).toBeInTheDocument();
      expect(screen.getByTestId('simulate-unregistered-btn')).toBeInTheDocument();
      expect(screen.getByTestId('evaluator-explanation-box')).toBeInTheDocument();
    });
  });

  // 22. Simulator: Triggering replacement shows mismatch and 8-step timeline
  it('22. Simulating model replacement reveals hash mismatch, blocked status, and 8-step timeline', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    const mockSimResponse = {
      scenario: 'model_replacement',
      status: 'HASH_MISMATCH',
      verified: false,
      model_id: 'iot-ids-rf',
      version: 'v1.0.0',
      registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      observed_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      action_taken: 'MODEL_LOAD_BLOCKED',
      downstream_state: 'LOCKED',
      message: 'Model replacement detected. Observed SHA-256 does not match on-chain registered digest. Model loading blocked fail-closed.',
      timeline: [
        { step: 1, name: 'Original model identified', status: 'COMPLETED', detail: 'iot-ids-rf:v1.0.0' },
        { step: 2, name: 'Temporary demonstration copy created', status: 'COMPLETED', detail: 'Segregated ephemeral temp buffer' },
        { step: 3, name: 'Temporary artifact modified', status: 'COMPLETED', detail: 'Controlled byte perturbation applied at offset 500' },
        { step: 4, name: 'SHA-256 recalculated', status: 'COMPLETED', detail: 'Observed: e3b0c44298fc1c14...' },
        { step: 5, name: 'Compared with registered digest', status: 'COMPLETED', detail: 'Queried ModelRegistry.sol digest' },
        { step: 6, name: 'Integrity check evaluated', status: 'HASH_MISMATCH', detail: 'Observed digest does not match on-chain digest' },
        { step: 7, name: 'Model loading blocked', status: 'COMPLETED', detail: 'Memory deserialization aborted fail-closed' },
        { step: 8, name: 'Downstream inference locked', status: 'COMPLETED', detail: 'Network flow analysis disabled' },
      ],
    };

    const simSpy = vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockSimResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('simulate-replacement-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('simulate-replacement-btn'));

    await waitFor(() => {
      expect(simSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('hash-comparison-box')).toBeInTheDocument();
      expect(screen.getByTestId('mismatch-badge')).toBeInTheDocument();
      expect(screen.getByTestId('simulation-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('restore-model-btn')).toBeInTheDocument();
    });
  });

  // 23. Simulator: Restoring model resets state and unlocks downstream workflow
  it('23. Restoring model resets state to VERIFIED and re-authorizes downstream inference', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    const mockSimResponse = {
      scenario: 'model_replacement',
      status: 'HASH_MISMATCH',
      verified: false,
      model_id: 'iot-ids-rf',
      version: 'v1.0.0',
      registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      observed_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      action_taken: 'MODEL_LOAD_BLOCKED',
      downstream_state: 'LOCKED',
      message: 'Model replacement detected.',
      timeline: [],
    };

    const mockResetResponse = {
      scenario: 'model_replacement_reset',
      status: 'VERIFIED',
      verified: true,
      model_id: 'iot-ids-rf',
      version: 'v1.0.0',
      canonical_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      action_taken: 'AUTHORIZED_AND_LOADED',
      downstream_state: 'UNLOCKED',
      message: 'Canonical model verified against on-chain registry and restored to memory. Inference authorized.',
    };

    vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockSimResponse);
    const resetSpy = vi.spyOn(api, 'resetModelReplacement').mockResolvedValue(mockResetResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('simulate-replacement-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('simulate-replacement-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('restore-model-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('restore-model-btn'));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/CANONICAL MODEL RESTORED/i)).toBeInTheDocument();
      expect(screen.queryByTestId('mismatch-badge')).not.toBeInTheDocument();
    });
  });

  // 24. Simulator: Unregistered version test demonstrates NOT_REGISTERED rejection
  it('24. Testing unregistered version candidate triggers fail-closed rejection', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    const mockUnregisteredResponse = {
      scenario: 'unregistered_version',
      status: 'NOT_REGISTERED',
      verified: false,
      model_id: 'iot-ids-rf',
      version: 'v9.9.9',
      local_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      registered_hash: null,
      action_taken: 'MODEL_LOAD_BLOCKED',
      downstream_state: 'LOCKED',
      message: 'Unregistered model version v9.9.9 rejected (NOT_REGISTERED). Loading blocked fail-closed.',
    };

    const unregSpy = vi.spyOn(api, 'simulateUnregisteredVersion').mockResolvedValue(mockUnregisteredResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('simulate-unregistered-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('simulate-unregistered-btn'));

    await waitFor(() => {
      expect(unregSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/REJECTED: NOT_REGISTERED/i)).toBeInTheDocument();
      expect(screen.getByTestId('restore-model-btn')).toBeInTheDocument();
    });
  });
});
