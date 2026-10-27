import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { api } from '../api/client';

describe('Phase 7D.8 Authentic Network Traffic Dataset Workbench Tests', () => {
  const mockDatasetInfo = {
    dataset_name: 'UNSW-NB15 Testing Set',
    dataset_type: 'Network-flow intrusion benchmark',
    source: 'Local project dataset (data/raw/UNSW_NB15_testing-set.csv)',
    sha256: 'bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa',
    total_records: 175341,
    benign_records: 56000,
    attack_records: 119341,
    total_features: 42,
    filter_options: {
      protocols: ['tcp', 'udp', 'arp', 'ospf'],
      services: ['-', 'http', 'dns', 'ftp', 'smtp'],
      states: ['FIN', 'INT', 'CON', 'REQ'],
    },
  };

  const mockDatasetRecordsPage1 = {
    total: 175341,
    page: 1,
    page_size: 25,
    total_pages: 7014,
    records: [
      {
        index: 1,
        id: 1,
        summary: {
          protocol: 'tcp',
          service: '-',
          state: 'FIN',
          duration: 0.121478,
          spkts: 6,
          dpkts: 4,
          total_pkts: 10,
          sbytes: 258,
          dbytes: 172,
          total_bytes: 430,
          rate: 74.08,
          sttl: 252,
          dttl: 254,
        },
        features: {
          dur: 0.121478,
          proto: 'tcp',
          service: '-',
          state: 'FIN',
          spkts: 6,
          dpkts: 4,
          sbytes: 258,
          dbytes: 172,
          rate: 74.08,
          sttl: 252,
          dttl: 254,
          sload: 14158.94,
          dload: 8495.36,
          sloss: 0,
          dloss: 0,
          sinpkt: 24.29,
          dinpkt: 8.37,
          sjit: 30.17,
          djit: 11.83,
          swin: 255,
          stcpb: 621772692,
          dtcpb: 2202533631,
          dwin: 255,
          tcprtt: 0,
          synack: 0,
          ackdat: 0,
          smean: 43,
          dmean: 43,
          trans_depth: 0,
          response_body_len: 0,
          ct_srv_src: 1,
          ct_state_ttl: 0,
          ct_dst_ltm: 1,
          ct_src_dport_ltm: 1,
          ct_dst_sport_ltm: 1,
          ct_dst_src_ltm: 1,
          is_ftp_login: 0,
          ct_ftp_cmd: 0,
          ct_flw_http_mthd: 0,
          ct_src_ltm: 1,
          ct_srv_dst: 1,
          is_sm_ips_ports: 0,
        },
        ground_truth: {
          label: 0,
          attack_cat: 'Normal',
        },
      },
      {
        index: 2,
        id: 2,
        summary: {
          protocol: 'udp',
          service: 'dns',
          state: 'INT',
          duration: 0.000009,
          spkts: 2,
          dpkts: 0,
          total_pkts: 2,
          sbytes: 114,
          dbytes: 0,
          total_bytes: 114,
          rate: 111111.11,
          sttl: 254,
          dttl: 0,
        },
        features: {
          dur: 0.000009,
          proto: 'udp',
          service: 'dns',
          state: 'INT',
          spkts: 2,
          dpkts: 0,
          sbytes: 114,
          dbytes: 0,
          rate: 111111.11,
          sttl: 254,
          dttl: 0,
          sload: 50666668.0,
          dload: 0.0,
          sloss: 0,
          dloss: 0,
          sinpkt: 0.009,
          dinpkt: 0.0,
          sjit: 0.0,
          djit: 0.0,
          swin: 0,
          stcpb: 0,
          dtcpb: 0,
          dwin: 0,
          tcprtt: 0.0,
          synack: 0.0,
          ackdat: 0.0,
          smean: 57,
          dmean: 0,
          trans_depth: 0,
          response_body_len: 0,
          ct_srv_src: 2,
          ct_state_ttl: 2,
          ct_dst_ltm: 1,
          ct_src_dport_ltm: 1,
          ct_dst_sport_ltm: 1,
          ct_dst_src_ltm: 2,
          is_ftp_login: 0,
          ct_ftp_cmd: 0,
          ct_flw_http_mthd: 0,
          ct_src_ltm: 1,
          ct_srv_dst: 2,
          is_sm_ips_ports: 0,
        },
        ground_truth: {
          label: 0,
          attack_cat: 'Normal',
        },
      },
      {
        index: 47912,
        id: 47912,
        summary: {
          protocol: 'ddp',
          service: '-',
          state: 'INT',
          duration: 0.000001,
          spkts: 2,
          dpkts: 0,
          total_pkts: 2,
          sbytes: 104,
          dbytes: 0,
          total_bytes: 104,
          rate: 1000000.0,
          sttl: 254,
          dttl: 0,
        },
        features: {
          dur: 0.000001,
          proto: 'ddp',
          service: '-',
          state: 'INT',
          spkts: 2,
          dpkts: 0,
          sbytes: 104,
          dbytes: 0,
          rate: 1000000.0,
          sttl: 254,
          dttl: 0,
          sload: 416000000.0,
          dload: 0.0,
          sloss: 0,
          dloss: 0,
          sinpkt: 0.001,
          dinpkt: 0.0,
          sjit: 0.0,
          djit: 0.0,
          swin: 0,
          stcpb: 0,
          dtcpb: 0,
          dwin: 0,
          tcprtt: 0.0,
          synack: 0.0,
          ackdat: 0.0,
          smean: 52,
          dmean: 0,
          trans_depth: 0,
          response_body_len: 0,
          ct_srv_src: 1,
          ct_state_ttl: 2,
          ct_dst_ltm: 1,
          ct_src_dport_ltm: 1,
          ct_dst_sport_ltm: 1,
          ct_dst_src_ltm: 1,
          is_ftp_login: 0,
          ct_ftp_cmd: 0,
          ct_flw_http_mthd: 0,
          ct_src_ltm: 1,
          ct_srv_dst: 1,
          is_sm_ips_ports: 0,
        },
        ground_truth: {
          label: 1,
          attack_cat: 'Backdoor',
        },
      },
    ],
  };

  const mockHealth = {
    status: 'HEALTHY',
    application_status: 'RUNNING',
    blockchain_status: 'CONNECTED',
    model_status: 'LOADED',
    timestamp: '2026-10-27T08:00:00Z',
  };

  const mockModelStatusLoaded = {
    model_id: 'iot-ids-rf',
    model_version: 'v1.0.0',
    algorithm: 'RandomForestClassifier',
    model_path: 'ml/artifacts/ids_model.joblib',
    artifact_size_bytes: 6319677,
    local_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    registered_sha256: 'dc5e16889ea247a4aa275f44a1b864c63f190bbdd1d1d4a68f1e1345a252e7c5',
    contract_address: '0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec',
    verification_status: 'VERIFIED',
    is_loaded: true,
  };

  const mockHierarchicalAttackResponse = {
    final_prediction: 'Backdoor',
    stage1_prediction: 'Attack',
    stage1_code: 1,
    stage1_confidence: 0.982,
    stage2_invoked: true,
    stage2_prediction: 'Backdoor',
    stage2_confidence: 0.941,
    advisory_recommendation: {
      category: 'Backdoor',
      severity: 'Critical',
      investigation_priority: 'Urgent',
      recommended_action: 'Isolate affected host and terminate unauthorized persistence channels.',
      operator_guidance: 'Inspect reverse shells and unauthorized persistent binaries.',
      is_advisory: true,
      requires_human_approval: true,
    },
    stage1_model_id: 'iot-ids-rf',
    stage1_model_version: 'v1.0.0',
    stage2_model_id: 'iot-ids-attack-classifier',
    stage2_model_version: 'v1.0.0',
    verification_status: 'VERIFIED',
    event_id: 'evt-test-001',
    inference_latency_ms: 35.12,
    per_flow_blockchain_queries: 0,
    timestamp: '2026-10-27T08:01:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, 'resetModelSession').mockResolvedValue({
      success: true,
      action_taken: 'SESSION_RESET',
      verification_status: 'UNVERIFIED',
      is_loaded: false,
    });
    vi.spyOn(api, 'getHealth').mockResolvedValue(mockHealth);
    vi.spyOn(api, 'getModelStatus').mockResolvedValue(mockModelStatusLoaded);
    vi.spyOn(api, 'getDatasetInfo').mockResolvedValue(mockDatasetInfo);
    vi.spyOn(api, 'getDatasetRecords').mockResolvedValue(mockDatasetRecordsPage1);
    vi.spyOn(api, 'getAuditEvents').mockResolvedValue({ total: 0, limit: 10, offset: 0, events: [] });
  });

  it('1. Dataset Information Panel displays authentic UNSW-NB15 metadata and record count', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('dataset-info-panel')).toBeInTheDocument();
      expect(screen.getByText('UNSW-NB15 Testing Set')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-total-records')).toHaveTextContent('175,341');
      expect(screen.getByText(/Network-flow intrusion benchmark/i)).toBeInTheDocument();
      expect(screen.getByText(/bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa/i)).toBeInTheDocument();
      expect(screen.getByText(/Benign: 56,000 \| Attack: 119,341/i)).toBeInTheDocument();
    });
  });

  it('2. Evaluation Scope Notice explicitly differentiates interactive demonstration from research evaluation', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      const scopeNotice = screen.getByTestId('eval-scope-notice');
      expect(scopeNotice).toBeInTheDocument();
      expect(scopeNotice).toHaveTextContent(/Interactive analysis uses individual authentic UNSW-NB15 testing records/i);
      expect(scopeNotice).toHaveTextContent(/Research evaluation was performed over the complete 175,341-record testing set/i);
      expect(scopeNotice).toHaveTextContent(/The interactive workbench is a demonstration interface/i);
    });
  });

  it('3. Pre-inference filters allow protocol, service, state, and search without leaking attack categories', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('traffic-filters')).toBeInTheDocument();
      expect(screen.getByTestId('filter-proto-select')).toBeInTheDocument();
      expect(screen.getByTestId('filter-service-select')).toBeInTheDocument();
      expect(screen.getByTestId('filter-state-select')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('btn-random-flow')).toBeInTheDocument();
    });

    // Ensure NO attack categories are present in pre-inference filter dropdowns
    const protoSelect = screen.getByTestId('filter-proto-select');
    const protoOptions = Array.from(protoSelect.querySelectorAll('option')).map((o) => o.value);
    expect(protoOptions).not.toContain('DoS');
    expect(protoOptions).not.toContain('Exploits');
    expect(protoOptions).not.toContain('Generic');
    expect(protoOptions).not.toContain('Fuzzers');

    // Trigger filter change
    fireEvent.change(protoSelect, { target: { value: 'udp' } });
    expect(api.getDatasetRecords).toHaveBeenCalledWith(
      expect.objectContaining({ proto: 'udp' })
    );
  });

  it('4. Pagination bar renders current page, total pages, record count, and navigation buttons', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('dataset-pagination')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-prev-btn')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-next-btn')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-total-pages')).toHaveTextContent('7,014');
      expect(screen.getByTestId('pagination-total-records')).toHaveTextContent('175,341');
    });

    // Click next page
    fireEvent.click(screen.getByTestId('pagination-next-btn'));
    expect(api.getDatasetRecords).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 })
    );
  });

  it('5. Selecting an authentic dataset record displays its 42 input features and summary', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-flow-details')).toBeInTheDocument();
    });

    // Click toggle to inspect all 42 features
    const toggleBtn = screen.getByText(/Inspect All 42 Features/i);
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByTestId('all-42-features-grid')).toBeInTheDocument();
      expect(screen.getByText('dur:')).toBeInTheDocument();
      expect(screen.getByText('proto:')).toBeInTheDocument();
      expect(screen.getByText('spkts:')).toBeInTheDocument();
      expect(screen.getByText('dpkts:')).toBeInTheDocument();
      expect(screen.getByText('sbytes:')).toBeInTheDocument();
      expect(screen.getByText('dbytes:')).toBeInTheDocument();
    });
  });

  it('6. Hierarchical prediction runs off-chain and reveals ground truth only post-inference', async () => {
    vi.spyOn(api, 'predictHierarchical').mockResolvedValue(mockHierarchicalAttackResponse);

    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
    });

    // Before clicking analyze, no prediction results or ground truth should be shown
    expect(screen.queryByTestId('stage1-result-box')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ground-truth-eval-box')).not.toBeInTheDocument();

    // Execute prediction
    fireEvent.click(screen.getByTestId('predict-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('stage1-result-box')).toBeInTheDocument();
      expect(screen.getByTestId('prediction-label')).toHaveTextContent(/Attack \/ Malicious Flow/i);
      expect(screen.getByTestId('stage2-result-box')).toBeInTheDocument();
      expect(screen.getByTestId('stage2-category')).toHaveTextContent('Backdoor');
      expect(screen.getByTestId('advisory-panel')).toBeInTheDocument();

      // Post-inference ground truth appears clearly labeled as evaluation only
      const gtBox = screen.getByTestId('ground-truth-eval-box');
      expect(gtBox).toBeInTheDocument();
      expect(gtBox).toHaveTextContent(/GROUND TRUTH — EVALUATION ONLY/i);
      expect(gtBox).toHaveTextContent(/Normal/i); // From selected initial record
    });
  });

  it('7. Phase 7D.10 verifies Flow 0001 through Flow 0006 shortcut buttons are completely absent from the workbench', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('tab-detection'));

    await waitFor(() => {
      expect(screen.getByTestId('prediction-card')).toBeInTheDocument();
      expect(screen.getByTestId('dataset-pagination')).toBeInTheDocument();
    });

    // Verify all hardcoded flow shortcuts and headings are absent
    expect(screen.queryByText('Flow 0001')).not.toBeInTheDocument();
    expect(screen.queryByText('Flow 0002')).not.toBeInTheDocument();
    expect(screen.queryByText('Flow 0003')).not.toBeInTheDocument();
    expect(screen.queryByText('Flow 0004')).not.toBeInTheDocument();
    expect(screen.queryByText('Flow 0005')).not.toBeInTheDocument();
    expect(screen.queryByText('Flow 0006')).not.toBeInTheDocument();
    expect(screen.queryByText(/NETWORK TRAFFIC RECORD SELECTOR/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('flow-btn-Flow 0001')).not.toBeInTheDocument();
    expect(screen.queryByTestId('flow-btn-Flow 0002')).not.toBeInTheDocument();
    expect(screen.queryByTestId('flow-btn-Flow 0003')).not.toBeInTheDocument();
    expect(screen.queryByTestId('flow-btn-Flow 0004')).not.toBeInTheDocument();
    expect(screen.queryByTestId('flow-btn-Flow 0005')).not.toBeInTheDocument();
    expect(screen.queryByTestId('flow-btn-Flow 0006')).not.toBeInTheDocument();

    // Verify authentic dataset workbench remains fully functional
    expect(screen.getByTestId('dataset-info-panel')).toBeInTheDocument();
    expect(screen.getByTestId('traffic-filters')).toBeInTheDocument();
    expect(screen.getByTestId('btn-random-flow')).toBeInTheDocument();
    expect(screen.getByTestId('dataset-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('predict-btn')).toBeInTheDocument();
    expect(screen.getByTestId('traffic-row-1')).toBeInTheDocument();

    // Selecting a table row populates the inference workflow
    fireEvent.click(screen.getByTestId('traffic-row-2'));
    expect(screen.getByTestId('selected-flow-details')).toHaveTextContent(/Record #000002/i);
    expect(screen.getByTestId('selected-flow-details')).toHaveTextContent(/UDP/i);
  });
});
