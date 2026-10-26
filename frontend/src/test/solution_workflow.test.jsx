import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { api } from '../api/client';

describe('Phase 7C End-to-End Solution Demonstrator Tests', () => {
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
    registered_at: 1729850000,
    registrant: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    artifact_size_bytes: 448512,
  };

  const mockUnregisteredResponse = {
    scenario: 'unregistered_version',
    status: 'NOT_REGISTERED',
    verified: false,
    model_id: 'iot-ids-rf',
    version: 'v9.9.9',
    registered_hash: null,
    observed_hash: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    action_taken: 'MODEL_LOAD_BLOCKED',
    downstream_state: 'LOCKED',
    message: 'Candidate model version v9.9.9 is not registered in ModelRegistry.',
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

  // --- Normal workflow ---

  it('1. Authorized model state renders on landing page', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
      expect(screen.getByTestId('solution-model-trust-badge')).toHaveTextContent(/VERIFIED/i);
      expect(screen.getByTestId('solution-model-trust-card')).toHaveTextContent(/iot-ids-rf/i);
    });
  });

  it('2. Network-flow preset loads and updates preview', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-preset-dropdown')).toBeInTheDocument();
    });

    const select = screen.getByTestId('solution-preset-dropdown');
    fireEvent.change(select, { target: { value: 'Normal' } });

    expect(select.value).toBe('Normal');
    expect(screen.getByTestId('solution-flow-card')).toHaveTextContent(/Expected True Label:\s*Normal/i);
  });

  it('3. Detection invokes /predict/hierarchical', async () => {
    setupDefaultMocks();
    const predictSpy = vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-predict-btn'));

    await waitFor(() => {
      expect(predictSpy).toHaveBeenCalled();
    });
  });

  it('4. Stage 1 Benign bypasses Stage 2', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalBenignResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-stage1-verdict')).toHaveTextContent(/Benign/i);
      expect(screen.getByTestId('solution-stage2-bypassed')).toBeInTheDocument();
      expect(screen.getByTestId('solution-stage2-bypassed')).toHaveTextContent(/Bypassed/i);
    });
  });

  it('5. Stage 1 Attack displays Stage 2 classification', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-stage1-verdict')).toHaveTextContent(/Attack/i);
      expect(screen.getByTestId('solution-stage2-category')).toHaveTextContent('DoS');
      expect(screen.getByTestId('solution-stage2-confidence')).toHaveTextContent('88.2%');
    });
  });

  it('6. Advisory recommendation is displayed', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-advisory-panel')).toBeInTheDocument();
      expect(screen.getByTestId('solution-advisory-action')).toHaveTextContent(/Inspect traffic volume/i);
    });
  });

  it('7. Human approval remains required in advisory response', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-advisory-approval')).toHaveTextContent(/HUMAN APPROVAL:\s*REQUIRED/i);
    });
  });

  it('8. Audit evidence is displayed with zero per-flow queries', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-predict-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-audit-evidence-card')).toBeInTheDocument();
      expect(screen.getByTestId('solution-audit-evidence-card')).toHaveTextContent(/Per-Flow Blockchain Queries:\s*0/i);
    });
  });

  // --- Model replacement workflow ---

  it('9. Replacement simulation invokes the correct demo endpoint', async () => {
    setupDefaultMocks();
    const simSpy = vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockTamperSimulationResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mode-protect-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mode-protect-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-simulate-replacement-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-simulate-replacement-btn'));

    await waitFor(() => {
      expect(simSpy).toHaveBeenCalled();
    });
  });

  it('10. Actual candidate hash is displayed in comparison', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockTamperSimulationResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-simulate-replacement-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-simulate-replacement-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-observed-hash')).toHaveTextContent(/a7fc4306/i);
      expect(screen.getByTestId('solution-observed-hash')).not.toHaveTextContent(/deadbeef/i);
    });
  });

  it('11. HASH_MISMATCH state is prominently displayed', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockTamperSimulationResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));
    fireEvent.click(screen.getByTestId('solution-simulate-replacement-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-tamper-detected-alert')).toHaveTextContent(/HASH_MISMATCH/i);
    });
  });

  it('12. Model loading is blocked when hash mismatch occurs', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockTamperSimulationResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));
    fireEvent.click(screen.getByTestId('solution-simulate-replacement-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-tamper-detected-alert')).toHaveTextContent(/MODEL LOAD:\s*BLOCKED/i);
    });
  });

  it('13. Downstream inference becomes locked upon tampering', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockTamperSimulationResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));
    fireEvent.click(screen.getByTestId('solution-simulate-replacement-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-tamper-detected-alert')).toHaveTextContent(/STAGE 1 IDS:\s*LOCKED/i);
    });
  });

  it('14. Security event audit record is confirmed in response', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'simulateModelReplacement').mockResolvedValue(mockTamperSimulationResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));
    fireEvent.click(screen.getByTestId('solution-simulate-replacement-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-tamper-detected-alert')).toHaveTextContent(/RECORDED IN AUDIT LOG/i);
    });
  });

  it('15. Restore returns the system to verified state', async () => {
    setupDefaultMocks();
    const resetSpy = vi.spyOn(api, 'resetModelReplacement').mockResolvedValue(mockResetResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-restore-model-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-restore-model-btn'));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalled();
      expect(screen.getByTestId('solution-restored-banner')).toHaveTextContent(/CANONICAL MODEL RESTORED/i);
    });
  });

  // --- Unregistered model ---

  it('16. NOT_REGISTERED state is displayed for unknown version', async () => {
    setupDefaultMocks();
    const unregSpy = vi.spyOn(api, 'simulateUnregisteredVersion').mockResolvedValue(mockUnregisteredResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-simulate-unregistered-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-simulate-unregistered-btn'));

    await waitFor(() => {
      expect(unregSpy).toHaveBeenCalled();
      expect(screen.getByTestId('solution-tamper-detected-alert')).toHaveTextContent(/NOT_REGISTERED/i);
    });
  });

  it('17. Downstream inference remains locked for unregistered model', async () => {
    setupDefaultMocks();
    vi.spyOn(api, 'simulateUnregisteredVersion').mockResolvedValue(mockUnregisteredResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('mode-protect-btn'));
    fireEvent.click(screen.getByTestId('solution-simulate-unregistered-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-tamper-detected-alert')).toHaveTextContent(/STAGE 1 IDS:\s*LOCKED/i);
    });
  });

  // --- Research integrity ---

  it('18. Canonical SHA-256 hashes are displayed and preserved', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
      expect(screen.getByText(/dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5/i)).toBeInTheDocument();
    });
  });

  it('19. Authoritative benchmark metrics are rendered in Mode 3 (Evidence)', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('mode-evidence-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mode-evidence-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('mode-evidence-container')).toBeInTheDocument();
    });

    const evidenceContainer = screen.getByTestId('mode-evidence-container');
    const withinEvidence = within(evidenceContainer);

    // Stage 1 authoritative metrics
    expect(withinEvidence.getAllByText(/90.30%/i).length).toBeGreaterThan(0);
    expect(withinEvidence.getAllByText(/98.78%/i).length).toBeGreaterThan(0);
    expect(withinEvidence.getAllByText(/86.82%/i).length).toBeGreaterThan(0);
    expect(withinEvidence.getAllByText(/92.41%/i).length).toBeGreaterThan(0);
    // Stage 2 authoritative metrics
    expect(withinEvidence.getAllByText(/76.18%/i).length).toBeGreaterThan(0);
    expect(withinEvidence.getAllByText(/53.06%/i).length).toBeGreaterThan(0);
    // Operational hierarchy
    expect(withinEvidence.getAllByText(/51.43%/i).length).toBeGreaterThan(0);
  });

  it('20. No unsupported overclaims appear across all solution views', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-overview-page')).toBeInTheDocument();
    });

    const pageText = document.body.textContent;
    expect(pageText).not.toMatch(/blockchain detects hackers/i);
    expect(pageText).not.toMatch(/blockchain prevents attacks/i);
    expect(pageText).not.toMatch(/\btamper-proof\b/i);
    expect(pageText).not.toMatch(/\bzero latency\b/i);
    expect(pageText).not.toMatch(/\bzero overhead\b/i);
    expect(pageText).not.toMatch(/\breal-time ids\b/i);
    expect(pageText).not.toMatch(/\bwire-speed\b/i);
    expect(pageText).not.toMatch(/\bautonomous defense\b/i);
    expect(pageText).not.toMatch(/\bproduction-ready\b/i);
    expect(pageText).not.toMatch(/\b100% secure\b/i);
  });

  // --- Phase 7D Evidence Demonstrator Tests ---

  it('21. Legitimate verification renders actual observed and registered digest evidence', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-crypto-panel')).toBeInTheDocument();
      expect(screen.getByTestId('crypto-observed-hash')).toHaveTextContent(/dc5e1688/i);
      expect(screen.getByTestId('crypto-registered-hash')).toHaveTextContent(/dc5e1688/i);
      expect(screen.getByTestId('crypto-comparison-result')).toHaveTextContent('MATCH');
    });
  });

  it('22. Legitimate matching digests produce VERIFIED and MODEL LOAD AUTHORIZED', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-decision-banner')).toHaveTextContent(/VERIFIED — MODEL LOAD AUTHORIZED/i);
      expect(screen.getByTestId('solution-decision-panel')).toHaveTextContent(/Model loading authorized/i);
    });
  });

  it('23. Clicking VERIFY AUTHORIZED MODEL executes backend verification', async () => {
    setupDefaultMocks();
    const verifySpy = vi.spyOn(api, 'verifyModel').mockResolvedValue(mockVerifyResponse);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-verify-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('solution-verify-btn'));

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith('stage1');
    });
  });

  it('24. Full hash toggle reveals complete 64-character hex digests', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('crypto-toggle-hash-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('crypto-toggle-hash-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('crypto-observed-hash')).toHaveTextContent('dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5');
      expect(screen.getByTestId('crypto-registered-hash')).toHaveTextContent('dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5');
    });
  });

  it('25. Blockchain provenance panel exposes contract address, registrant, algorithm, timestamp', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-blockchain-panel')).toBeInTheDocument();
      expect(screen.getByTestId('blockchain-contract-address')).toHaveTextContent(/0x5FbDB2315678afecb367f032d93F642f64180aa3/i);
      expect(screen.getByTestId('blockchain-reg-status')).toHaveTextContent(/REGISTERED/i);
      expect(screen.getByTestId('blockchain-algorithm')).toHaveTextContent('RandomForestClassifier');
      expect(screen.getByTestId('blockchain-registrant')).toHaveTextContent(/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266/i);
      expect(screen.getByTestId('blockchain-reg-digest')).toHaveTextContent('dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5');
    });
  });

  it('26. 7-Stage lifecycle gate tracker renders all 7 stages', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-lifecycle-tracker')).toBeInTheDocument();
      expect(screen.getByTestId('solution-lifecycle-tracker')).toHaveTextContent(/1. ARTIFACT/i);
      expect(screen.getByTestId('solution-lifecycle-tracker')).toHaveTextContent(/2. SHA-256/i);
      expect(screen.getByTestId('solution-lifecycle-tracker')).toHaveTextContent(/3. REGISTRY/i);
      expect(screen.getByTestId('solution-lifecycle-tracker')).toHaveTextContent(/4. COMPARISON/i);
      expect(screen.getByTestId('solution-lifecycle-tracker')).toHaveTextContent(/5. DECISION/i);
      expect(screen.getByTestId('solution-lifecycle-tracker')).toHaveTextContent(/6. LOAD GATE/i);
      expect(screen.getByTestId('solution-lifecycle-tracker')).toHaveTextContent(/7. IDS STATUS/i);
    });
  });

  it('27. Technical architecture flow diagram and WHAT THIS PROVES are rendered', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-architecture-diagram')).toBeInTheDocument();
      expect(screen.getByTestId('solution-architecture-diagram')).toHaveTextContent(/MODEL ARTIFACT/i);
      expect(screen.getByTestId('solution-what-this-proves')).toBeInTheDocument();
      expect(screen.getByTestId('solution-what-this-proves')).toHaveTextContent(/Research Integrity Notice/i);
    });
  });

  it('28. Evaluator demonstration guide outlines TEST A through TEST D', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-evaluator-guide')).toBeInTheDocument();
      expect(screen.getByTestId('solution-evaluator-guide')).toHaveTextContent(/TEST A — Authorized Model/i);
      expect(screen.getByTestId('solution-evaluator-guide')).toHaveTextContent(/TEST B — Model Replacement/i);
      expect(screen.getByTestId('solution-evaluator-guide')).toHaveTextContent(/TEST C — Recovery/i);
      expect(screen.getByTestId('solution-evaluator-guide')).toHaveTextContent(/TEST D — Unregistered Version/i);
    });
  });

  it('29. Stage target selector toggles between Stage 1 and Stage 2 inspection', async () => {
    setupDefaultMocks();

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('stage-select-stage2-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('stage-select-stage2-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('solution-model-trust-card')).toHaveTextContent(/iot-ids-attack-classifier/i);
      expect(screen.getByTestId('crypto-registered-hash')).toHaveTextContent(/596b98ce/i);
      expect(screen.getByTestId('blockchain-reg-digest')).toHaveTextContent('596b98ce0b9ed9bb80c04cea7790d81ec77c6e4470030c32b3739ef007703208');
    });
  });

  it('30. Failed verification prevents model loading and disables inference', async () => {
    const mockModelStatusUnverified = {
      ...mockModelStatusVerified,
      verification_status: 'HASH_MISMATCH',
      is_loaded: false,
    };
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusUnverified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('solution-load-btn')).toBeDisabled();
      expect(screen.getByTestId('solution-predict-btn')).toBeDisabled();
    });
  });
});
