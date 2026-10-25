import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { api, BASE_URL } from '../api/client';

describe('Phase 7B.6 Production-Style IDS Operations Console Tests', () => {
  const mockHealth = {
    status: 'healthy',
    application_status: 'running',
    blockchain_status: 'connected',
    model_status: 'loaded',
    timestamp: '2026-10-25T12:00:00Z',
  };

  const mockModelStatusVerified = {
    model_id: 'iot-ids-rf',
    model_version: 'v1.0.0',
    algorithm: 'RandomForestClassifier',
    local_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    registered_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    verification_status: 'VERIFIED',
    is_loaded: true,
    last_verified_at: '2026-10-25T12:05:00Z',
    read_latency_ms: 15.65,
  };

  const mockModelStatusUnverified = {
    ...mockModelStatusVerified,
    verification_status: 'UNVERIFIED',
    is_loaded: false,
  };

  const mockStage2Status = {
    model_id: 'iot-ids-attack-classifier',
    model_version: 'v1.0.0',
    algorithm: 'RandomForestClassifier',
    local_sha256: '596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208',
    registered_sha256: '596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208',
    verification_status: 'VERIFIED',
    is_loaded: true,
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
    timestamp: '2026-10-25T12:10:00Z',
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
    timestamp: '2026-10-25T12:11:00Z',
  };

  const mockAuditData = {
    total: 2,
    limit: 10,
    offset: 0,
    events: [
      {
        event_id: 'audit-001',
        timestamp: '2026-10-25T12:10:00Z',
        event_type: 'PREDICTION',
        status: 'SUCCESS',
        model_id: 'iot-ids-rf',
        model_version: 'v1.0.0',
        verification_status: 'VERIFIED',
        prediction: 'Attack',
        inference_latency_ms: 41.25,
        details: { final_category: 'DoS', stage1_prediction: 'Attack' },
      },
      {
        event_id: 'audit-002',
        timestamp: '2026-10-25T12:05:00Z',
        event_type: 'MODEL_VERIFICATION',
        status: 'SUCCESS',
        model_id: 'iot-ids-rf',
        model_version: 'v1.0.0',
        verification_status: 'VERIFIED',
        details: { cryptographic_integrity: 'MATCH', action_taken: 'AUTHORIZED_AND_LOADED' },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. DASHBOARD: Operational landing page renders by default
  it('1. Default landing page is Dashboard with system status and telemetry', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.getByText(/Security Operations Dashboard/i)).toBeInTheDocument();
      expect(screen.getByTestId('header-telemetry')).toBeInTheDocument();
      expect(screen.getByTestId('header-verification-status')).toHaveTextContent(/VERIFIED/i);
    });
  });

  // 2. DASHBOARD: System status grid reflects actual health and model status
  it('2. Dashboard displays real system status and detection engine gating', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('status-card-app')).toHaveTextContent(/RUNNING/i);
      expect(screen.getByTestId('status-card-blockchain')).toHaveTextContent(/CONNECTED/i);
      expect(screen.getByTestId('dashboard-verification-status')).toHaveTextContent('VERIFIED');
      expect(screen.getByTestId('dashboard-model-id')).toHaveTextContent('iot-ids-rf:v1.0.0');
    });
  });

  // 3. DASHBOARD: Detection summary aggregates and recent events rendered
  it('3. Dashboard displays session aggregates and recent events table', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('detection-summary-panel')).toBeInTheDocument();
      expect(screen.getByTestId('recent-events-panel')).toBeInTheDocument();
      expect(screen.getByTestId('summary-total-predictions')).toHaveTextContent('1');
      expect(screen.getByTestId('summary-attack-count')).toHaveTextContent('1');
      expect(screen.getByTestId('recent-events-table')).toBeInTheDocument();
    });
  });

  // 4. DETECTION: Network-flow input panel and preset selection
  it('4. Intrusion Detection page provides authentic network-flow input presets', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('prediction-card')).toBeInTheDocument();
      expect(screen.getByTestId('preset-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
      expect(screen.getByText(/Network-Flow Input Record/i)).toBeInTheDocument();
    });
  });

  // 5. DETECTION: Hierarchical Attack prediction invokes Stage 2 and displays advisory
  it('5. Hierarchical attack prediction invokes Stage 2 classification and displays response advisory', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('stage1-result-box')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-label')).toHaveTextContent(/Attack/i);
      expect(screen.getByTestId('stage2-result-box')).toBeInTheDocument();
      expect(screen.getByTestId('stage2-category')).toHaveTextContent('DoS');
      expect(screen.getByTestId('advisory-panel')).toBeInTheDocument();
      expect(screen.getByTestId('advisory-recommended-action')).toHaveTextContent(/Inspect traffic volume and rate anomalies/i);
      expect(screen.getByTestId('advisory-operator-guidance')).toHaveTextContent(/Review source IP distribution/i);
    });
  });

  // 6. DETECTION: Benign prediction produces Normal and bypasses Stage 2
  it('6. Benign flow produces Normal verdict and bypasses Stage 2 attack classification', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalBenignResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('prediction-label')).toHaveTextContent(/Benign/i);
      expect(screen.getByText(/Stage 2 Multiclass Classifier: Bypassed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('stage2-category')).not.toBeInTheDocument();
    });
  });

  // 7. DETECTION: Advisory flags enforce human approval and disabled automated remediation
  it('7. Advisory response explicitly discloses human approval requirement and disabled automated remediation', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));
    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Human operator approval strictly required/i)).toBeInTheDocument();
      expect(screen.getByText(/Automated remediation is disabled/i)).toBeInTheDocument();
    });
  });

  // 8. DETECTION: Unloaded model shows fail-closed warning
  it('8. Unloaded/unverified model displays fail-closed warning banner and locked status', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusUnverified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('flow-locked-placeholder')).toBeInTheDocument();
      expect(screen.getByTestId('detection-engine-state')).toHaveTextContent(/ENGINE LOCKED/i);
    });
  });

  // 9. MODEL SECURITY: Renders identity and cryptographic hashes
  it('9. Model Security page renders model identity and dual SHA-256 digests', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-model-security'));

    await waitFor(() => {
      expect(screen.getByTestId('model-provenance-card')).toBeInTheDocument();
      expect(screen.getByTestId('model-id')).toHaveTextContent('iot-ids-rf');
      expect(screen.getByTestId('model-version')).toHaveTextContent('v1.0.0');
      expect(screen.getByTestId('local-hash')).toHaveTextContent(/dc5e16889ea247a4/);
      expect(screen.getByTestId('registered-hash')).toHaveTextContent(/dc5e16889ea247a4/);
      expect(screen.getByTestId('verified-success-box')).toBeInTheDocument();
    });
  });

  // 10. MODEL SECURITY: Verification action queries EVM and updates status
  it('10. Verification action executes POST /model/verify and confirms consensus match', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    const verifySpy = vi.spyOn(api, 'verifyModel').mockResolvedValue({
      verified: true,
      status: 'VERIFIED',
      local_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    });

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-model-security'));

    await waitFor(() => {
      expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('verify-btn'));

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('status-badge')).toHaveTextContent(/Verified/i);
    });
  });

  // 11. MODEL SECURITY: Failed verification displays HASH_MISMATCH and locked gate
  it('11. Failed verification displays HASH_MISMATCH and fail-closed notice', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded (HASH_MISMATCH)' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue({
      ...mockModelStatusVerified,
      verification_status: 'HASH_MISMATCH',
      is_loaded: false,
    });
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-model-security'));

    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent(/Hash Mismatch/i);
      expect(screen.getByTestId('verified-mismatch-box')).toBeInTheDocument();
      expect(screen.getByText(/Unloaded \(Inference Blocked\)/i)).toBeInTheDocument();
    });
  });

  // 12. SECURITY TESTING: Controlled model replacement test triggers HASH_MISMATCH
  it('12. Security Testing facility executes controlled model replacement test', async () => {
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
      observed_hash: 'a7fc43063d36f359bc6c4f14a98bf233d3a1bdebbc2d7a98e1e67a872624cf65',
      action_taken: 'MODEL_LOAD_BLOCKED',
      downstream_state: 'LOCKED',
      message: 'Model replacement detected. Observed SHA-256 does not match on-chain registered digest. Model loading blocked fail-closed.',
    };

    const simSpy = vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockSimResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-security-testing'));

    await waitFor(() => {
      expect(screen.getByTestId('simulate-replacement-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('simulate-replacement-btn'));

    await waitFor(() => {
      expect(simSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('tamper-detected-alert')).toBeInTheDocument();
      expect(screen.getByTestId('mismatch-badge')).toBeInTheDocument();
      expect(screen.getByText(/SIMULATED MODEL REPLACEMENT DETECTED/i)).toBeInTheDocument();
      expect(screen.getByText(/DISABLED \(HTTP 503 Fail-Closed\)/i)).toBeInTheDocument();
    });
  });

  // 13. SECURITY TESTING: Restoration resets state to VERIFIED
  it('13. Restoring model resets state to VERIFIED and unblocks inference', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

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

    const resetSpy = vi.spyOn(api, 'resetModelReplacement').mockResolvedValue(mockResetResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-security-testing'));

    await waitFor(() => {
      expect(screen.getByTestId('restore-model-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('restore-model-btn'));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('restored-banner')).toBeInTheDocument();
      expect(screen.getByText(/CANONICAL MODEL RESTORED & VERIFIED/i)).toBeInTheDocument();
    });
  });

  // 14. SECURITY TESTING: Unregistered version candidate rejection
  it('14. Testing unregistered version candidate triggers fail-closed rejection', async () => {
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

    fireEvent.click(screen.getByTestId('tab-security-testing'));

    await waitFor(() => {
      expect(screen.getByTestId('simulate-unregistered-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('simulate-unregistered-btn'));

    await waitFor(() => {
      expect(unregSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/REJECTED: NOT_REGISTERED \(v9.9.9\)/i)).toBeInTheDocument();
    });
  });

  // 15. AUDIT LOG: Table renders events and pagination controls
  it('15. Audit Log displays operational events table with pagination and filter', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-audit'));

    await waitFor(() => {
      expect(screen.getByTestId('audit-log-card')).toBeInTheDocument();
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
      expect(screen.getByTestId('event-type-filter')).toBeInTheDocument();
      expect(screen.getByTestId('prev-page-btn')).toBeInTheDocument();
      expect(screen.getByTestId('next-page-btn')).toBeInTheDocument();
    });
  });

  // 16. AUDIT LOG: Filter change triggers API query
  it('16. Audit Log filter dropdown queries backend with eventType parameter', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    const auditSpy = vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-audit'));

    await waitFor(() => {
      expect(screen.getByTestId('event-type-filter')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('event-type-filter'), { target: { value: 'PREDICTION' } });

    await waitFor(() => {
      expect(auditSpy).toHaveBeenCalledWith(10, 0, 'PREDICTION');
    });
  });

  // 17. RESEARCH RESULTS: Authoritative metrics rendered
  it('17. Research Results tab renders authoritative UNSW-NB15 benchmark metrics', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-research-results'));

    await waitFor(() => {
      expect(screen.getByTestId('research-results-page')).toBeInTheDocument();
      expect(screen.getByText(/Stage 1: Binary IDS \(Random Forest\)/i)).toBeInTheDocument();
      expect(screen.getByText('90.30%')).toBeInTheDocument();
      expect(screen.getByText('98.78%')).toBeInTheDocument();
      expect(screen.getByText('86.82%')).toBeInTheDocument();
      expect(screen.getByText('92.41%')).toBeInTheDocument();
      expect(screen.getByText(/Stage 2: Attack Classifier \(Multiclass RF\)/i)).toBeInTheDocument();
      expect(screen.getByText('53.06%')).toBeInTheDocument();
      expect(screen.getByText('51.43%')).toBeInTheDocument();
    });
  });

  // 18. RESEARCH RESULTS: Important limitation disclosure is explicitly rendered
  it('18. Research Results tab explicitly discloses Stage 2 cascade error limitation', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-research-results'));

    await waitFor(() => {
      expect(screen.getByText(/Important Research Limitation:/i)).toBeInTheDocument();
      expect(screen.getByText(/Stage 2 performance is affected by upstream Stage 1 false negatives/i)).toBeInTheDocument();
    });
  });

  // 19. REST API ISOLATION: Frontend communicates strictly via REST API (no direct Web3 RPC)
  it('19. Frontend communicates strictly via REST API (no direct Web3 RPC)', () => {
    expect(BASE_URL).toMatch(/http:\/\/(127\.0\.0\.1|localhost):8000/);
    expect(window.ethereum).toBeUndefined();
  });

  // 20. PRIVACY BOUNDARY: No raw 42-feature vectors in audit records
  it('20. Frontend does not persist raw 42-feature vectors in audit records', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    expect(screen.queryByTestId('raw-feature-vector-payload')).not.toBeInTheDocument();
  });
});
