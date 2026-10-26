import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { api } from '../api/client';
import { SecuritySolutionOverview } from '../components/SecuritySolutionOverview';
import { ModelSecurity } from '../components/ModelSecurity';

describe('Phase 7D.4 Deduplicated Frontend Architecture & Solution Workflow Tests', () => {
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
    contract_address: '0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec',
    registrant: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    verification_status: 'VERIFIED',
    is_loaded: true,
    last_verified_at: '2026-10-25T12:05:00Z',
    read_latency_ms: 15.65,
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

  const mockTamperSimulationResponse = {
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
    timeline: [],
  };

  const mockVerifyResponse = {
    status: 'VERIFIED',
    local_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    matches: true,
    model_id: 'iot-ids-rf',
    model_version: 'v1.0.0',
    read_latency_ms: 15.65,
    algorithm: 'RandomForestClassifier',
    contract_address: '0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec',
    registered_at: 1729850000,
    registrant: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    artifact_size_bytes: 448512,
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

  const setupDefaultMocks = () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockImplementation(async (target) => {
      if (target === 'stage2') return mockStage2Status;
      return mockModelStatusVerified;
    });
    vi.spyOn(api, 'verifyModel').mockResolvedValue(mockVerifyResponse);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
  };

  // =========================================================================
  // 1. DEDUPLICATION VERIFICATION: SECURITY SOLUTION DOES NOT DUPLICATE WORKBENCH
  // =========================================================================

  it('1. Security Solution does NOT contain the Network Traffic selector or flow table', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    const page = screen.getByTestId('solution-overview-page');

    // Asserts removal of duplicate flow card, selector, and table
    expect(screen.queryByTestId('solution-flow-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-preset-dropdown')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-selected-flow-details')).not.toBeInTheDocument();
    expect(within(page).queryByRole('table')).not.toBeInTheDocument();
  });

  it('2. Security Solution does NOT contain duplicate flow-selection pills', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    const page = screen.getByTestId('solution-overview-page');

    // Confirms flow pills are absent from Security Solution
    expect(within(page).queryByText('Flow 0001')).not.toBeInTheDocument();
    expect(within(page).queryByText('Flow 0002')).not.toBeInTheDocument();
    expect(within(page).queryByText('Flow 0003')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-preset-mode-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-custom-mode-btn')).not.toBeInTheDocument();
  });

  it('3. Security Solution does NOT contain duplicate Analyze Network Flow button or custom JSON input', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    const page = screen.getByTestId('solution-overview-page');

    // Confirms prediction controls are not duplicated in Security Solution
    expect(screen.queryByTestId('solution-predict-btn')).not.toBeInTheDocument();
    expect(within(page).queryByText(/ANALYZE NETWORK FLOW/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-custom-flow-json')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-ground-truth-eval')).not.toBeInTheDocument();
  });

  // =========================================================================
  // 2. SECURITY SOLUTION AUTHORITATIVE RESPONSIBILITIES: MODEL TRUST & PROVENANCE
  // =========================================================================

  it('4. Security Solution renders authoritative model trust and provenance governance', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
      expect(screen.getByTestId('solution-model-trust-card')).toBeInTheDocument();
      expect(screen.getByTestId('solution-model-trust-badge')).toHaveTextContent(/VERIFIED/i);
    });

    const trustCard = screen.getByTestId('solution-model-trust-card');
    expect(within(trustCard).getByText('iot-ids-rf')).toBeInTheDocument();
    expect(within(trustCard).getAllByText('RandomForestClassifier').length).toBeGreaterThanOrEqual(1);
    expect(within(trustCard).getByText('ml/artifacts/ids_model.joblib')).toBeInTheDocument();
    expect(screen.getByTestId('solution-verify-btn')).toBeInTheDocument();
    expect(screen.getByTestId('solution-load-btn')).toBeInTheDocument();
  });

  it('5. Security Solution renders cryptographic SHA-256 comparison and hash toggle', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-crypto-panel')).toBeInTheDocument();
      expect(screen.getByTestId('crypto-observed-hash')).toHaveTextContent(/dc5e16889ea247a4/i);
      expect(screen.getByTestId('crypto-registered-hash')).toHaveTextContent(/dc5e16889ea247a4/i);
    });

    // Toggle full hash
    fireEvent.click(screen.getByTestId('crypto-toggle-hash-btn'));
    expect(screen.getByTestId('crypto-observed-hash')).toHaveTextContent(
      'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5'
    );
  });

  it('6. Security Solution renders blockchain ModelRegistry ledger metadata', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-blockchain-panel')).toBeInTheDocument();
      expect(screen.getByTestId('blockchain-contract-address')).toHaveTextContent(
        '0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec'
      );
      expect(screen.getByTestId('blockchain-reg-status')).toHaveTextContent(/isModelRegistered = true/i);
      expect(screen.getByTestId('blockchain-registrant')).toHaveTextContent(
        '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'
      );
      expect(screen.getByTestId('blockchain-reg-digest')).toHaveTextContent(
        'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5'
      );
    });
  });

  it('7. Security Solution renders 7-stage lifecycle gate tracker', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-lifecycle-tracker')).toBeInTheDocument();
      expect(screen.getByText(/1\. ARTIFACT/i)).toBeInTheDocument();
      expect(screen.getByText(/2\. SHA-256/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. REGISTRY/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. COMPARISON/i)).toBeInTheDocument();
      expect(screen.getByText(/5\. DECISION/i)).toBeInTheDocument();
      expect(screen.getByText(/6\. LOAD GATE/i)).toBeInTheDocument();
      expect(screen.getByText(/7\. IDS STATUS/i)).toBeInTheDocument();
    });
  });

  it('8. Security Solution stage target selector toggles between Stage 1 and Stage 2', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-target-selector')).toBeInTheDocument();
    });

    const selector = screen.getByTestId('stage-target-selector');
    const s2Btn = within(selector).getByTestId('target-stage2-btn');
    const s1Btn = within(selector).getByTestId('target-stage1-btn');
    const trustCard = screen.getByTestId('solution-model-trust-card');

    // Switch to Stage 2
    fireEvent.click(s2Btn);
    await waitFor(() => {
      expect(within(trustCard).getByText('iot-ids-attack-classifier')).toBeInTheDocument();
    });

    // Switch back to Stage 1
    fireEvent.click(s1Btn);
    await waitFor(() => {
      expect(within(trustCard).getByText('iot-ids-rf')).toBeInTheDocument();
    });
  });

  it('9. Security Solution verify button executes backend verification', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-verify-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-verify-btn'));

    await waitFor(() => {
      expect(api.verifyModel).toHaveBeenCalledWith('stage1');
    });
  });

  it('10. Security Solution displays workspace ownership panel with direct navigation links', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-security-state-panel')).toBeInTheDocument();
      expect(screen.getByTestId('nav-to-detection-btn')).toBeInTheDocument();
      expect(screen.getByTestId('nav-to-testing-btn')).toBeInTheDocument();
      expect(screen.getByTestId('nav-to-model-security-btn')).toBeInTheDocument();
      expect(screen.getByTestId('nav-to-audit-btn')).toBeInTheDocument();
      expect(screen.getByTestId('nav-to-research-btn')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. AUTHORITATIVE INTRUSION DETECTION / NETWORK TRAFFIC WORKBENCH TESTS
  // =========================================================================

  it('11. Intrusion Detection workspace authoritatively contains Network Traffic Workbench', async () => {
    setupDefaultMocks();
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('prediction-card')).toBeInTheDocument();
      expect(screen.getByTestId('preset-dropdown')).toBeInTheDocument();
      expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
      expect(screen.getByText(/Network-Flow Input Record \(Network Traffic\)/i)).toBeInTheDocument();
      expect(screen.getByText('Flow 0001')).toBeInTheDocument();
      expect(screen.getByText('Flow 0002')).toBeInTheDocument();
    });
  });

  it('12. Intrusion Detection allows selecting Flow 0001 through Flow 0006 and updates preview', async () => {
    setupDefaultMocks();
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('preset-dropdown')).toBeInTheDocument();
    });

    const select = screen.getByTestId('preset-dropdown');

    // 1. Verify category names are not selectable options
    const optionValues = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(optionValues).not.toContain('Normal');
    expect(optionValues).not.toContain('DoS');
    expect(optionValues).not.toContain('Generic');
    expect(optionValues).toContain('Flow 0001');
    expect(optionValues).toContain('Flow 0002');

    // 2. Select Flow 0002 (zero-duration flow) -> displays N/A for rate
    fireEvent.change(select, { target: { value: 'Flow 0002' } });
    expect(select.value).toBe('Flow 0002');
    expect(screen.getByTestId('selected-flow-packet-rate')).toHaveTextContent('N/A');
    expect(screen.getByTestId('selected-flow-byte-rate')).toHaveTextContent('N/A');

    // 3. Select Flow 0001
    fireEvent.change(select, { target: { value: 'Flow 0001' } });
    expect(select.value).toBe('Flow 0001');
    expect(screen.getByTestId('selected-flow-details')).toHaveTextContent(/Flow 0001/i);
    expect(screen.getByTestId('selected-flow-details')).toHaveTextContent(/TCP/i);
  });

  it('13. Intrusion Detection performs hierarchical inference and displays advisory', async () => {
    setupDefaultMocks();
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
      expect(screen.getByTestId('advisory-recommended-action')).toHaveTextContent(/Inspect traffic volume/i);
    });
  });

  it('14. Intrusion Detection Stage 1 Benign bypasses Stage 2 attack classification', async () => {
    setupDefaultMocks();
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

  // =========================================================================
  // 4. AUTHORITATIVE MODEL SECURITY WORKSPACE TESTS
  // =========================================================================

  it('15. Model Security workspace authoritatively performs model verification', async () => {
    setupDefaultMocks();
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-model-security'));

    await waitFor(() => {
      expect(screen.getByTestId('model-provenance-card')).toBeInTheDocument();
      expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('verify-btn'));

    await waitFor(() => {
      expect(api.verifyModel).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 5. AUTHORITATIVE SECURITY TESTING FACILITY TESTS
  // =========================================================================

  it('16. Security Testing facility authoritatively performs model replacement simulation', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockTamperSimulationResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-security-testing'));

    await waitFor(() => {
      expect(screen.getByTestId('security-testing-card')).toBeInTheDocument();
      expect(screen.getByTestId('simulate-replacement-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('simulate-replacement-btn'));

    await waitFor(() => {
      expect(api.simulateModelReplacement).toHaveBeenCalled();
      expect(screen.getByTestId('security-test-results')).toBeInTheDocument();
      expect(screen.getByTestId('tamper-detected-alert')).toHaveTextContent(/HASH_MISMATCH/i);
    });
  });

  it('17. Security Testing facility authoritatively supports reset/recovery', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'resetModelReplacement').mockResolvedValue(mockResetResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-security-testing'));

    await waitFor(() => {
      expect(screen.getByTestId('restore-model-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('restore-model-btn'));

    await waitFor(() => {
      expect(api.resetModelReplacement).toHaveBeenCalled();
      expect(screen.getByTestId('restored-banner')).toHaveTextContent(/Canonical Model Restored/i);
    });
  });

  // =========================================================================
  // 6. AUTHORITATIVE AUDIT & RESEARCH RESULTS WORKSPACE TESTS
  // =========================================================================

  it('18. Operational Audit workspace authoritatively displays audit event records', async () => {
    setupDefaultMocks();
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-audit'));

    await waitFor(() => {
      expect(screen.getByTestId('audit-log-card')).toBeInTheDocument();
      expect(screen.getByTestId('audit-table')).toBeInTheDocument();
    });

    const auditTable = screen.getByTestId('audit-table');
    expect(within(auditTable).getAllByText('PREDICTION').length).toBeGreaterThanOrEqual(1);
    expect(within(auditTable).getAllByText('MODEL_VERIFICATION').length).toBeGreaterThanOrEqual(1);
  });

  it('19. Research Results workspace authoritatively displays empirical research metrics', async () => {
    setupDefaultMocks();
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-research-results'));

    await waitFor(() => {
      expect(screen.getByTestId('research-results-page')).toBeInTheDocument();
    });

    const rrPage = screen.getByTestId('research-results-page');
    expect(within(rrPage).getByText(/Stage 1: Binary IDS/i)).toBeInTheDocument();
    expect(within(rrPage).getByText(/90.30% Accuracy/i)).toBeInTheDocument();
    expect(within(rrPage).getByText(/92.41%/i)).toBeInTheDocument();
  });

  // =========================================================================
  // 7. NAVIGATION & NO UNINTENDED API CALLS
  // =========================================================================

  it('20. Application navigation button switches directly from Security Solution to Detection', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('nav-to-detection-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('nav-to-detection-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('tab-detection')).toHaveClass('active');
    });
  });

  it('21. Security Solution does NOT execute unintended prediction or simulation API calls on load', async () => {
    setupDefaultMocks();
    const predictSpy = vi.spyOn(api, 'predictHierarchical');
    const legacyPredictSpy = vi.spyOn(api, 'predict');
    const simSpy = vi.spyOn(api, 'simulateModelReplacement');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    // Zero prediction or simulation calls should occur automatically from Security Solution
    expect(predictSpy).not.toHaveBeenCalled();
    expect(legacyPredictSpy).not.toHaveBeenCalled();
    expect(simSpy).not.toHaveBeenCalled();
  });

  it('22. Technical architecture diagram and evaluator guide presentation sections remain removed', async () => {
    setupDefaultMocks();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('solution-architecture-diagram')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-evaluator-guide')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-what-this-proves')).not.toBeInTheDocument();
  });

  // =========================================================================
  // 8. PHASE 7D.4.1 RESEARCH-INTEGRITY RECONCILIATION TESTS
  // =========================================================================

  it('23. Security Solution displays explicit "Unavailable" when metadata is absent from backend', () => {
    const emptyStatus = {
      model_id: 'iot-ids-rf',
      model_version: 'v1.0.0',
      algorithm: null,
      local_sha256: null,
      registered_sha256: null,
      contract_address: null,
      registrant: null,
      registered_at: null,
      artifact_size_bytes: null,
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    };

    render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={emptyStatus}
        stage2Status={emptyStatus}
        isModelLoaded={false}
        isVerifying={false}
      />
    );

    expect(screen.getByTestId('blockchain-contract-address')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('blockchain-registrant')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('blockchain-timestamp')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('blockchain-reg-digest')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('crypto-observed-hash')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('crypto-registered-hash')).toHaveTextContent('Unavailable');
  });

  it('24. Model Security displays explicit "Unavailable" when metadata is absent from backend', () => {
    const emptyStatus = {
      model_id: 'iot-ids-rf',
      model_version: 'v1.0.0',
      algorithm: null,
      local_sha256: null,
      registered_sha256: null,
      contract_address: null,
      registrant: null,
      registered_at: null,
      artifact_size_bytes: null,
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    };

    render(
      <ModelSecurity
        health={mockHealth}
        modelStatus={emptyStatus}
        stage2Status={emptyStatus}
        isModelLoaded={false}
        isVerifying={false}
      />
    );

    expect(screen.getByTestId('local-hash')).toHaveTextContent('Unavailable');
    expect(screen.getByTestId('registered-hash')).toHaveTextContent('Unavailable');
  });

  it('25. Lifecycle gate tracker truthfully reflects pending or unavailable states', () => {
    const unverifiedStatus = {
      model_id: 'iot-ids-rf',
      model_version: 'v1.0.0',
      local_sha256: null,
      registered_sha256: null,
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    };

    const { rerender } = render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={unverifiedStatus}
        stage2Status={unverifiedStatus}
        isModelLoaded={false}
      />
    );

    const tracker = screen.getByTestId('solution-lifecycle-tracker');
    expect(within(tracker).getAllByText(/Pending/i).length).toBeGreaterThanOrEqual(4);

    // Rerender with BLOCKCHAIN_UNAVAILABLE
    const unavailableStatus = {
      ...unverifiedStatus,
      verification_status: 'BLOCKCHAIN_UNAVAILABLE',
    };

    rerender(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={unavailableStatus}
        stage2Status={unavailableStatus}
        isModelLoaded={false}
      />
    );

    expect(within(tracker).getAllByText(/Unavailable/i).length).toBeGreaterThanOrEqual(1);
    expect(within(tracker).getAllByText(/Blocked/i).length).toBeGreaterThanOrEqual(1);
  });

  it('26. Security Solution renders only compact detection summary and omits detailed stage2/advisory/audit panels', () => {
    render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={mockModelStatusVerified}
        stage2Status={mockStage2Status}
        isModelLoaded={true}
        predictionResult={mockHierarchicalAttackResponse}
      />
    );

    expect(screen.getByTestId('solution-latest-detection-card')).toBeInTheDocument();
    expect(screen.getByTestId('solution-latest-detection')).toBeInTheDocument();

    expect(screen.getByTestId('solution-stage1-verdict')).toHaveTextContent('Attack');
    expect(screen.getByTestId('solution-stage1-confidence')).toHaveTextContent('94.5%');

    expect(screen.getByTestId('solution-goto-workbench-details-btn')).toBeInTheDocument();

    expect(screen.queryByTestId('solution-stage2-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-stage2-category')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-advisory-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('solution-audit-evidence-card')).not.toBeInTheDocument();
  });

  it('27. Security Solution displays incident alert when HASH_MISMATCH occurs without inventing data', () => {
    const mismatchStatus = {
      ...mockModelStatusVerified,
      verification_status: 'HASH_MISMATCH',
      is_loaded: false,
    };

    render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={mismatchStatus}
        stage2Status={mockStage2Status}
        isModelLoaded={false}
      />
    );

    expect(screen.getByTestId('solution-tamper-detected-alert')).toBeInTheDocument();
    expect(screen.getByText(/TAMPERING \/ REPLACEMENT INCIDENT DETECTED/i)).toBeInTheDocument();
    expect(screen.getByText(/MODEL LOAD: BLOCKED \| INFERENCE: LOCKED/i)).toBeInTheDocument();
  });

  // =========================================================================
  // Phase 7D.5: Explicit Model Verification and Load Lifecycle Tests
  // =========================================================================

  const mockStartupStatusUnverified = {
    model_id: 'iot-ids-rf',
    model_version: 'v1.0.0',
    algorithm: 'RandomForestClassifier',
    model_path: 'ml/artifacts/ids_model.joblib',
    artifact_size_bytes: 448512,
    local_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    registered_sha256: null,
    contract_address: '0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec',
    registered_at: null,
    registrant: null,
    verification_status: 'UNVERIFIED',
    is_loaded: false,
    last_verified_at: null,
    read_latency_ms: null,
    details: {},
  };

  it('28. Initial application mount renders UNVERIFIED and UNLOADED without automatic verify or load calls', async () => {
    const spyVerify = vi.spyOn(api, 'verifyModel');
    const spyLoad = vi.spyOn(api, 'loadModel');
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded (UNVERIFIED)' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockStartupStatusUnverified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    // Verify badges and labels reflect unverified / unloaded
    expect(screen.getByTestId('solution-model-trust-badge')).toHaveTextContent(/UNVERIFIED/i);
    expect(screen.getByText(/UNLOADED \(Locked Fail-Closed\)/i)).toBeInTheDocument();

    // Zero automatic POST /model/verify or POST /model/load on mount
    expect(spyVerify).not.toHaveBeenCalled();
    expect(spyLoad).not.toHaveBeenCalled();
  });

  it('29. Top posture card shows unverified and locked state before operator actions', () => {
    render(
      <SecuritySolutionOverview
        health={{ ...mockHealth, model_status: 'unloaded (UNVERIFIED)' }}
        modelStatus={mockStartupStatusUnverified}
        stage2Status={mockStartupStatusUnverified}
        isModelLoaded={false}
      />
    );

    const tracker = screen.getByTestId('pipeline-tracker');
    expect(within(tracker).getByText(/\[1\] MODEL PROVENANCE/i)).toBeInTheDocument();
    expect(within(tracker).getByText(/● UNVERIFIED/i)).toBeInTheDocument();
    expect(within(tracker).getByText(/LOCKED — VERIFY MODEL FIRST/i)).toBeInTheDocument();
    expect(within(tracker).getByText(/AWAITING MODEL AUTHORIZATION/i)).toBeInTheDocument();
    expect(within(tracker).getByText(/NOT AVAILABLE/i)).toBeInTheDocument();
    expect(within(tracker).getByText(/0 PER-FLOW EVM QUERIES/i)).toBeInTheDocument();
  });

  it('30. AUTHORIZE & LOAD MODEL button is disabled before verification', () => {
    render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={mockStartupStatusUnverified}
        stage2Status={mockStartupStatusUnverified}
        isModelLoaded={false}
      />
    );

    const loadBtn = screen.getByTestId('solution-load-btn');
    expect(loadBtn).toBeDisabled();
    expect(screen.getByTestId('solution-verify-btn')).not.toBeDisabled();
  });

  it('31. Successful verification enables AUTHORIZE & LOAD without immediately loading model', async () => {
    const onVerifyMock = vi.fn().mockResolvedValue({
      verified: true,
      status: 'VERIFIED',
      is_loaded: false,
      local_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      contract_address: '0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec',
      algorithm: 'RandomForestClassifier',
    });

    const { rerender } = render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={mockStartupStatusUnverified}
        stage2Status={mockStartupStatusUnverified}
        isModelLoaded={false}
        onVerify={onVerifyMock}
      />
    );

    // Click verify
    fireEvent.click(screen.getByTestId('solution-verify-btn'));
    expect(onVerifyMock).toHaveBeenCalled();

    // Rerender with verified but unloaded status
    const verifiedUnloadedStatus = {
      ...mockStartupStatusUnverified,
      verification_status: 'VERIFIED',
      registered_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      is_loaded: false,
    };

    rerender(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={verifiedUnloadedStatus}
        stage2Status={verifiedUnloadedStatus}
        isModelLoaded={false}
        verifyResult={{
          verified: true,
          status: 'VERIFIED',
          is_loaded: false,
          model_id: 'iot-ids-rf',
          local_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
          registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
        }}
      />
    );

    // Now verified, load button enabled, but model remains unloaded
    expect(screen.getByTestId('solution-model-trust-badge')).toHaveTextContent(/VERIFIED/i);
    expect(screen.getByText(/UNLOADED \(Locked Fail-Closed\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('solution-load-btn')).not.toBeDisabled();
  });

  it('32. Explicit load sets model to LOADED & ACTIVE and unlocks Intrusion Detection Workbench', () => {
    const onLoadMock = vi.fn();

    const verifiedUnloadedStatus = {
      ...mockStartupStatusUnverified,
      verification_status: 'VERIFIED',
      registered_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
      is_loaded: false,
    };

    const { rerender } = render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={verifiedUnloadedStatus}
        stage2Status={verifiedUnloadedStatus}
        isModelLoaded={false}
        onLoadModel={onLoadMock}
        verifyResult={{
          verified: true,
          status: 'VERIFIED',
          is_loaded: false,
          model_id: 'iot-ids-rf',
          local_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
          registered_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
        }}
      />
    );

    // Click load
    fireEvent.click(screen.getByTestId('solution-load-btn'));
    expect(onLoadMock).toHaveBeenCalled();

    // Rerender as loaded
    rerender(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={mockModelStatusVerified}
        stage2Status={mockStage2Status}
        isModelLoaded={true}
      />
    );

    expect(screen.getByText(/LOADED \(Active Memory\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('solution-load-btn')).toHaveTextContent(/MODEL LOADED & ACTIVE/i);
  });

  it('33. Reset does not silently reload the model but restores canonical artifact in UNVERIFIED/UNLOADED state', () => {
    const unverifiedAfterReset = {
      ...mockStartupStatusUnverified,
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    };

    render(
      <SecuritySolutionOverview
        health={mockHealth}
        modelStatus={unverifiedAfterReset}
        stage2Status={unverifiedAfterReset}
        isModelLoaded={false}
      />
    );

    expect(screen.getByTestId('solution-model-trust-badge')).toHaveTextContent(/UNVERIFIED/i);
    expect(screen.getByText(/UNLOADED \(Locked Fail-Closed\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('solution-load-btn')).toBeDisabled();
  });

  // =========================================================================
  // Phase 7D.6: Reset Model Authorization on Frontend Application Reload
  // =========================================================================

  it('34. Application mount explicitly executes api.resetModelSession() on initialization', async () => {
    const spyReset = vi.spyOn(api, 'resetModelSession').mockResolvedValue({
      success: true,
      action_taken: 'SESSION_RESET',
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    });
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded (UNVERIFIED)' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockStartupStatusUnverified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    expect(spyReset).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('solution-model-trust-badge')).toHaveTextContent(/UNVERIFIED/i);
  });

  it('35. Workspace tab navigation does NOT re-trigger session reset', async () => {
    const spyReset = vi.spyOn(api, 'resetModelSession').mockResolvedValue({
      success: true,
      action_taken: 'SESSION_RESET',
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    });
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'loaded' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    // Initial mount called reset once
    expect(spyReset).toHaveBeenCalledTimes(1);

    // Navigate to Intrusion Detection
    fireEvent.click(screen.getByTestId('tab-detection'));
    await waitFor(() => {
      expect(screen.getByTestId('prediction-card')).toBeInTheDocument();
    });

    // Navigate to Model Security
    fireEvent.click(screen.getByTestId('tab-model-security'));
    await waitFor(() => {
      expect(screen.getByTestId('model-provenance-card')).toBeInTheDocument();
    });

    // Navigate back to Security Solution
    fireEvent.click(screen.getByTestId('tab-solution'));
    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    // resetModelSession was NOT called again during SPA tab transitions
    expect(spyReset).toHaveBeenCalledTimes(1);
  });

  it('36. Simulating application reload re-triggers session reset and establishes fresh UNVERIFIED/UNLOADED cycle', async () => {
    const spyReset = vi.spyOn(api, 'resetModelSession').mockResolvedValue({
      success: true,
      action_taken: 'SESSION_RESET',
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    });
    vi.spyOn(api, 'getHealth').mockResolvedValue({ ...mockHealth, model_status: 'unloaded (UNVERIFIED)' });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockStartupStatusUnverified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });

    // Session 1: Mount
    const { unmount } = render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });
    expect(spyReset).toHaveBeenCalledTimes(1);

    // Simulate browser reload (unmount old tree, mount fresh tree)
    unmount();

    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    // Session 2: Second reset was performed on fresh reload
    expect(spyReset).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('solution-model-trust-badge')).toHaveTextContent(/UNVERIFIED/i);
    expect(screen.getByText(/UNLOADED \(Locked Fail-Closed\)/i)).toBeInTheDocument();
  });

  it('37. Failed session reset displays explicit error alert and does not falsely display unverified model as ready', async () => {
    vi.spyOn(api, 'resetModelSession').mockRejectedValue(new Error('Backend connection refused on reset'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('alert-banner')).toBeInTheDocument();
      expect(screen.getByText(/Backend Connection Alert.*Backend connection refused on reset/i)).toBeInTheDocument();
    });
  });
});
