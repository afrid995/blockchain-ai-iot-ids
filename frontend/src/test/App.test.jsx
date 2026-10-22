import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { api, ApiError } from '../api/client';

describe('Phase 5A Frontend React Dashboard Tests', () => {
  const mockHealth = {
    status: 'healthy',
    application_status: 'running',
    blockchain_status: 'connected',
    model_status: 'loaded',
    timestamp: '2026-10-22T20:00:00Z',
  };

  const mockModelStatusVerified = {
    model_id: 'iot-ids-rf',
    model_version: 'v1.0.0',
    algorithm: 'RandomForestClassifier',
    local_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    registered_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    verification_status: 'VERIFIED',
    is_loaded: true,
    last_verified_at: '2026-10-22T20:05:00Z',
    read_latency_ms: 13.55,
  };

  const mockAuditData = {
    total: 1,
    limit: 10,
    offset: 0,
    events: [
      {
        event_id: 'test-event-uuid-0001',
        timestamp: '2026-10-22T20:06:00Z',
        event_type: 'PREDICTION',
        status: 'SUCCESS',
        model_id: 'iot-ids-rf',
        model_version: 'v1.0.0',
        verification_status: 'VERIFIED',
        prediction: 'Attack',
        inference_latency_ms: 38.57,
        details: { confidence: 0.9, feature_count: 42 },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Dashboard renders with header, cards, and research disclosures', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Blockchain-Backed IoT Intrusion Detection/i)).toBeInTheDocument();
      expect(screen.getByTestId('model-provenance-card')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-card')).toBeInTheDocument();
      expect(screen.getByTestId('audit-log-card')).toBeInTheDocument();
      expect(screen.getByText(/Research Prototype Disclosures:/i)).toBeInTheDocument();
    });
  });

  it('2. API data is represented correctly', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('model-id')).toHaveTextContent('iot-ids-rf');
      expect(screen.getByTestId('model-version')).toHaveTextContent('v1.0.0');
      expect(screen.getByTestId('local-hash')).toHaveTextContent(/dc5e16889ea247a4/);
      expect(screen.getByTestId('registered-hash')).toHaveTextContent(/dc5e16889ea247a4/);
    });
  });

  it('3. Verification status is displayed correctly (VERIFIED)', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);

    render(<App />);

    await waitFor(() => {
      const badge = screen.getByTestId('status-badge');
      expect(badge).toHaveTextContent(/Verified/i);
      expect(screen.getByText(/Loaded \(Inference Enabled\)/i)).toBeInTheDocument();
    });
  });

  it('4. Verification failure is displayed as failure with fail-closed warning', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue({
      ...mockHealth,
      status: 'degraded',
      model_status: 'unloaded (HASH_MISMATCH)',
    });
    vi.spyOn(api, 'getModelStatus').mockResolvedValue({
      ...mockModelStatusVerified,
      verification_status: 'HASH_MISMATCH',
      is_loaded: false,
    });
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'verifyModel').mockResolvedValue({
      verified: false,
      status: 'HASH_MISMATCH',
      message: 'Local artifact SHA-256 differs from blockchain-registered hash.',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Hash Mismatch/i)).toBeInTheDocument();
      expect(screen.getByText(/Unloaded \(Inference Blocked\)/i)).toBeInTheDocument();
    });

    // Trigger verification
    const verifyBtn = screen.getByTestId('verify-btn');
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Verification Failed \(HASH_MISMATCH\)/i)).toBeInTheDocument();
    });
  });

  it('5. Prediction result is displayed correctly with classification, confidence, and latency', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue(mockAuditData);
    vi.spyOn(api, 'predict').mockResolvedValue({
      prediction: 'Attack',
      prediction_code: 1,
      confidence: 0.9452,
      model_id: 'iot-ids-rf',
      model_version: 'v1.0.0',
      verification_status: 'VERIFIED',
      event_id: 'new-pred-uuid-1234',
      inference_latency_ms: 38.57,
      timestamp: '2026-10-22T20:10:00Z',
    });

    render(<App />);

    const predictBtn = screen.getByTestId('predict-btn');
    fireEvent.click(predictBtn);

    await waitFor(() => {
      expect(screen.getByTestId('prediction-result')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-label')).toHaveTextContent(/Attack \/ Malicious Flow/i);
      expect(screen.getByTestId('prediction-confidence')).toHaveTextContent('94.52%');
      expect(screen.getByTestId('inference-latency')).toHaveTextContent(/38.57 ms/);
    });
  });

  it('6. API error state is displayed correctly when backend is unavailable', async () => {
    vi.spyOn(api, 'getHealth').mockRejectedValue(
      new ApiError('Cannot connect to backend service', 0)
    );
    vi.spyOn(api, 'getModelStatus').mockRejectedValue(
      new ApiError('Cannot connect to backend service', 0)
    );
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, events: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Backend Connection Alert/i)).toBeInTheDocument();
    });
  });

  it('7. Empty audit-event state works when no events exist', async () => {
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusVerified);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({
      total: 0,
      limit: 10,
      offset: 0,
      events: [],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-audit-state')).toHaveTextContent(
        /No security audit events recorded matching the current filter/i
      );
    });
  });
});
