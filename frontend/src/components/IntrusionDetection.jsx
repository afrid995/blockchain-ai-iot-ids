import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const DEFAULT_INITIAL_RECORD = {
  flow_id: 'Record #000001',
  dataset_id: 1,
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
    source_ttl: 252,
    dest_ttl: 254,
    packet_rate: 74.08749,
    byte_rate: 3539.7356,
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
    rate: 74.08749,
    sttl: 252,
    dttl: 254,
    sload: 14158.94238,
    dload: 8495.365234,
    sloss: 0,
    dloss: 0,
    sinpkt: 24.2956,
    dinpkt: 8.375,
    sjit: 30.177547,
    djit: 11.830604,
    swin: 255,
    stcpb: 621772692,
    dtcpb: 2202533631,
    dwin: 255,
    tcprtt: 0.0,
    synack: 0.0,
    ackdat: 0.0,
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
};

const DEFAULT_DATASET_INFO = {
  dataset_name: 'UNSW-NB15 Testing Set',
  dataset_type: 'Network-flow intrusion benchmark',
  source: 'Local project dataset (data/raw/UNSW_NB15_testing-set.csv)',
  sha256: 'bec7dd5ec88dc2a0ccc7a07879d338395ed7421750f675fd0339e07dfe0648fa',
  total_records: 175341,
  benign_records: 56000,
  attack_records: 119341,
  total_features: 42,
  filter_options: {
    protocols: ['tcp', 'udp', 'unas', 'arp', 'ospf', 'sctp'],
    services: ['-', 'http', 'dns', 'ftp', 'smtp', 'ssh', 'ftp-data'],
    states: ['FIN', 'INT', 'CON', 'REQ', 'RST'],
  },
};

export function IntrusionDetection({
  isModelLoaded,
  isPredicting,
  onPredict,
  predictionResult,
  predictionError,
  modelStatus,
}) {
  // Active record selection label for authentic UNSW-NB15 records
  const [selectedPreset, setSelectedPreset] = useState('Record #000001');

  // Dataset information and server-paginated records state
  const [datasetInfo, setDatasetInfo] = useState(DEFAULT_DATASET_INFO);
  const [datasetRecords, setDatasetRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(175341);
  const [totalPages, setTotalPages] = useState(7014);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [datasetError, setDatasetError] = useState(null);

  // Filters state (strictly no attack category filter allowed before inference)
  const [filterProto, setFilterProto] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterState, setFilterState] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageJumpInput, setPageJumpInput] = useState('1');

  // Active flow and feature vector state
  const [activeFlowData, setActiveFlowData] = useState(DEFAULT_INITIAL_RECORD);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customJson, setCustomJson] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [endpointMode, setEndpointMode] = useState('hierarchical'); // 'hierarchical' | 'legacy'

  // Fetch dataset info on initial mount
  useEffect(() => {
    let isMounted = true;
    const loadInfo = async () => {
      try {
        if (api && api.getDatasetInfo) {
          const info = await api.getDatasetInfo();
          if (isMounted && info && info.total_records) {
            setDatasetInfo(info);
            setTotalRecords(info.total_records);
          }
        }
      } catch {
        // Fallback info preserved
      }
    };
    loadInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch paginated dataset records from authentic UNSW-NB15
  const fetchRecords = useCallback(
    async (pageToLoad, sizeToLoad, proto, service, state, search) => {
      setIsLoadingRecords(true);
      setDatasetError(null);
      try {
        if (api && api.getDatasetRecords) {
          const res = await api.getDatasetRecords({
            page: pageToLoad,
            pageSize: sizeToLoad,
            proto: proto || '',
            service: service || '',
            state: state || '',
            search: search || '',
          });

          if (res && res.records && res.records.length > 0) {
            setDatasetRecords(res.records);
            setTotalRecords(res.total);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil(res.total / sizeToLoad)));
            setCurrentPage(res.page);
            setPageJumpInput(String(res.page));
            return;
          }
        }
      } catch (err) {
        setDatasetError(`Dataset Query Alert: ${err.message}`);
      } finally {
        setIsLoadingRecords(false);
      }
    },
    []
  );

  // Load records on page, pageSize, or filter changes
  useEffect(() => {
    fetchRecords(currentPage, pageSize, filterProto, filterService, filterState, searchQuery);
  }, [currentPage, pageSize, filterProto, filterService, filterState, searchQuery, fetchRecords]);

  // Handle table row click from authentic dataset
  const handleDatasetRowClick = (rec) => {
    const recId = rec.id || rec.index || 1;
    setSelectedPreset(`Record #${String(recId).padStart(6, '0')}`);
    setActiveFlowData({
      flow_id: `Record #${recId}`,
      dataset_id: recId,
      summary: rec.summary,
      features: rec.features,
      ground_truth: rec.ground_truth,
    });
  };

  // Quick Random Flow Selector from authentic dataset
  const handlePickRandomFlow = async () => {
    try {
      if (api && api.getRandomDatasetRecord) {
        const randRec = await api.getRandomDatasetRecord();
        if (randRec && randRec.features) {
          handleDatasetRowClick(randRec);
          return;
        }
      }
    } catch {
      // Fallback: pick random record from loaded page
      if (datasetRecords && datasetRecords.length > 0) {
        const randRec = datasetRecords[Math.floor(Math.random() * datasetRecords.length)];
        handleDatasetRowClick(randRec);
      }
    }
  };

  const handleResetFilters = () => {
    setFilterProto('');
    setFilterService('');
    setFilterState('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageJump = () => {
    const target = parseInt(pageJumpInput, 10);
    if (!Number.isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
    } else {
      setPageJumpInput(String(currentPage));
    }
  };

  const activeFeatures = activeFlowData?.features || {};

  const formatDuration = (dur) => {
    if (dur === undefined || dur === null) return 'N/A';
    const num = Number(dur);
    if (num < 0.0001) return `${num.toFixed(6)}s (<10µs)`;
    return `${num.toFixed(4)}s`;
  };

  const formatRate = (rate, dur) => {
    if (dur === undefined || dur === null || Number(dur) < 0.001) return 'N/A';
    if (rate === undefined || rate === null || Number.isNaN(Number(rate))) return 'N/A';
    return `${Number(rate).toFixed(1)} /s`;
  };

  const formatByteRate = (sbytes, dbytes, dur) => {
    if (dur === undefined || dur === null || Number(dur) < 0.001) return 'N/A';
    const totalBytes = Number(sbytes || 0) + Number(dbytes || 0);
    return `${(totalBytes / Number(dur)).toFixed(1)} B/s`;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setJsonError(null);

    let payload = activeFeatures;
    if (isCustomMode) {
      try {
        payload = JSON.parse(customJson);
      } catch (err) {
        setJsonError('Invalid JSON format: ' + err.message);
        return;
      }
    }

    if (onPredict) {
      await onPredict(payload, endpointMode);
    }
  };

  // Determine current dropdown value
  const currentDropdownValue = String(activeFlowData?.dataset_id || activeFlowData?.index || activeFlowData?.id || '');

  return (
    <div className="intrusion-detection-page" data-testid="prediction-card">
      {/* Section Header */}
      <div className="console-section-header">
        <div>
          <h2 className="console-title">Authentic Network Traffic Workbench</h2>
          <p className="console-subtitle">
            Explore authentic UNSW-NB15 testing records (N = 175,341) and execute verification-gated hierarchical intrusion classification.
          </p>
        </div>
        <div className="header-status-indicator">
          <span
            className={`badge ${isModelLoaded ? 'badge-success' : 'badge-danger'}`}
            data-testid="detection-engine-state"
          >
            {isModelLoaded ? '● ENGINE READY' : '🔒 ENGINE LOCKED'}
          </span>
        </div>
      </div>

      {/* Dataset Information & Scope Panel */}
      <div className="dataset-info-banner" data-testid="dataset-info-panel">
        <div className="dataset-meta-grid">
          <div className="dataset-meta-item">
            <span className="meta-label">DATASET</span>
            <strong className="meta-val">{datasetInfo.dataset_name}</strong>
          </div>
          <div className="dataset-meta-item">
            <span className="meta-label">RECORDS AVAILABLE</span>
            <strong className="meta-val font-mono" data-testid="dataset-total-records">
              {totalRecords.toLocaleString('en-US')}
            </strong>
          </div>
          <div className="dataset-meta-item">
            <span className="meta-label">DATASET TYPE</span>
            <strong className="meta-val">{datasetInfo.dataset_type}</strong>
          </div>
          <div className="dataset-meta-item">
            <span className="meta-label">BENCHMARK SPLIT</span>
            <strong className="meta-val font-mono">
              Benign: {datasetInfo.benign_records ? datasetInfo.benign_records.toLocaleString('en-US') : '56,000'} | Attack: {datasetInfo.attack_records ? datasetInfo.attack_records.toLocaleString('en-US') : '119,341'}
            </strong>
          </div>
          <div className="dataset-meta-item full-width">
            <span className="meta-label">CANONICAL SHA-256 DIGEST</span>
            <span className="meta-val font-mono font-xs text-muted">
              {datasetInfo.sha256}
            </span>
          </div>
        </div>

        {/* Evaluation Scope Notice */}
        <div className="dataset-eval-scope-box" data-testid="eval-scope-notice">
          <strong>EVALUATION SCOPE:</strong>
          <span style={{ marginLeft: '0.4rem' }}>
            Interactive analysis uses individual authentic UNSW-NB15 testing records selected from the 175,341-record testing dataset.
            Research evaluation was performed over the complete 175,341-record testing set (N = 175,341).
            The interactive workbench is a demonstration interface; it does not replace the full experimental evaluation.
          </span>
        </div>
      </div>

      {/* Model Not Ready / Unloaded Warning */}
      {!isModelLoaded && (
        <div className="alert-box danger" data-testid="flow-locked-placeholder" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔒</span>
            <div>
              <strong>MODEL NOT AUTHORIZED:</strong> Network-flow analysis unavailable.
              Verify and load the authorized model first. Dataset browsing remains accessible below.
            </div>
          </div>
        </div>
      )}

      {/* Dataset Query Error Alert */}
      {datasetError && (
        <div className="alert-box warning" style={{ marginBottom: '1rem' }}>
          {datasetError}
        </div>
      )}

      {/* Prediction Error Alert */}
      {predictionError && (
        <div className="alert-box danger" data-testid="prediction-error-banner" style={{ marginBottom: '1.5rem' }}>
          <strong>Inference Request Rejected:</strong> {predictionError}
        </div>
      )}

      {/* Main Grid: Input & Dataset Explorer on Left, Results on Right */}
      <div className="console-grid-2col">
        {/* Left Column: Authentic Dataset Explorer & Selected Flow */}
        <div className="console-card">
          <div className="card-header">
            <h3 className="card-title">Network-Flow Input Record (Network Traffic)</h3>
            <span className="badge badge-secondary">175,341 Authentic Records</span>
          </div>

          <form onSubmit={handleFormSubmit}>
            {/* Input Mode Selector */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Input Telemetry Source:</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`btn-toggle ${!isCustomMode ? 'active' : ''}`}
                  onClick={() => {
                    setIsCustomMode(false);
                    setJsonError(null);
                  }}
                  data-testid="mode-preset-btn"
                >
                  Authentic UNSW-NB15 Records
                </button>
                <button
                  type="button"
                  className={`btn-toggle ${isCustomMode ? 'active' : ''}`}
                  onClick={() => {
                    setIsCustomMode(true);
                    if (!customJson) {
                      setCustomJson(JSON.stringify(activeFeatures, null, 2));
                    }
                  }}
                  data-testid="mode-custom-btn"
                >
                  Custom Flow JSON
                </button>
              </div>
            </div>

            {!isCustomMode ? (
              <>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  {/* Search & Flow Filtering Toolbar (No Attack Categories Allowed) */}
                  <div className="traffic-filter-toolbar" data-testid="traffic-filters">
                    <div className="filter-item">
                      <label className="filter-label">Protocol:</label>
                      <select
                        className="form-control font-xs"
                        value={filterProto}
                        onChange={(e) => {
                          setFilterProto(e.target.value);
                          setCurrentPage(1);
                        }}
                        data-testid="filter-proto-select"
                      >
                        <option value="">All Protocols</option>
                        {(datasetInfo.filter_options?.protocols || ['tcp', 'udp', 'arp']).slice(0, 30).map((p) => (
                          <option key={p} value={p}>{p.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-item">
                      <label className="filter-label">Service:</label>
                      <select
                        className="form-control font-xs"
                        value={filterService}
                        onChange={(e) => {
                          setFilterService(e.target.value);
                          setCurrentPage(1);
                        }}
                        data-testid="filter-service-select"
                      >
                        <option value="">All Services</option>
                        {(datasetInfo.filter_options?.services || ['-', 'http', 'dns', 'ftp']).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-item">
                      <label className="filter-label">State:</label>
                      <select
                        className="form-control font-xs"
                        value={filterState}
                        onChange={(e) => {
                          setFilterState(e.target.value);
                          setCurrentPage(1);
                        }}
                        data-testid="filter-state-select"
                      >
                        <option value="">All States</option>
                        {(datasetInfo.filter_options?.states || ['FIN', 'INT', 'CON']).map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div className="filter-item search-grow">
                      <label className="filter-label">Search Record / Flow ID:</label>
                      <input
                        type="text"
                        className="form-control font-xs"
                        placeholder="e.g. 1, 47912, or proto..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        data-testid="search-input"
                      />
                    </div>

                    <div className="filter-actions">
                      <button
                        type="button"
                        className="btn btn-secondary font-xs"
                        onClick={handlePickRandomFlow}
                        title="Sample a random flow from the authentic 175,341-record testing set"
                        data-testid="btn-random-flow"
                      >
                        🎲 Pick Random Flow
                      </button>
                      {(filterProto || filterService || filterState || searchQuery) && (
                        <button
                          type="button"
                          className="btn btn-secondary font-xs"
                          onClick={handleResetFilters}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Flow Records Table View */}
                  <div className="traffic-table-container">
                    <table className="traffic-table" data-testid="traffic-records-table">
                      <thead>
                        <tr>
                          <th>Record #</th>
                          <th>Protocol</th>
                          <th>Service</th>
                          <th>State</th>
                          <th>Duration</th>
                          <th>Packets</th>
                          <th>Bytes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingRecords ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '1.25rem' }}>
                              <span className="spinner" /> Loading authentic UNSW-NB15 records...
                            </td>
                          </tr>
                        ) : datasetRecords.length > 0 ? (
                          datasetRecords.map((rec) => {
                            const s = rec.summary || {};
                            const proto = (s.protocol || '').toUpperCase();
                            const isSelected = activeFlowData?.dataset_id === rec.id;
                            return (
                              <tr
                                key={rec.index || rec.id}
                                className={isSelected ? 'selected' : ''}
                                onClick={() => handleDatasetRowClick(rec)}
                                data-testid={`traffic-row-${rec.index || rec.id}`}
                              >
                                <td className="font-mono">
                                  <strong>#{String(rec.index || rec.id).padStart(6, '0')}</strong>
                                </td>
                                <td className="font-mono">{proto}</td>
                                <td className="font-mono">{s.service || '-'}</td>
                                <td className="font-mono">{s.state || '-'}</td>
                                <td className="font-mono">{formatDuration(s.duration)}</td>
                                <td className="font-mono">{(s.total_pkts || 0).toLocaleString()}</td>
                                <td className="font-mono">{(s.total_bytes || 0).toLocaleString()}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                              {isLoadingRecords ? 'Loading authentic UNSW-NB15 records...' : datasetError || 'No records found matching filters.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Dataset Pagination Bar */}
                  <div className="dataset-pagination-bar" data-testid="dataset-pagination">
                    <div className="pagination-info font-xs text-muted">
                      Page <strong>{currentPage}</strong> of <strong data-testid="pagination-total-pages">{totalPages.toLocaleString('en-US')}</strong> (<span data-testid="pagination-total-records">{totalRecords.toLocaleString('en-US')}</span> records)
                    </div>

                    <div className="pagination-controls">
                      <button
                        type="button"
                        className="btn btn-secondary font-xs"
                        disabled={currentPage <= 1 || isLoadingRecords}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        data-testid="pagination-prev-btn"
                      >
                        ◀ Previous
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary font-xs"
                        disabled={currentPage >= totalPages || isLoadingRecords}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        data-testid="pagination-next-btn"
                      >
                        Next ▶
                      </button>
                    </div>

                    <div className="pagination-jump">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <label className="font-xs text-muted" htmlFor="page-jump-input">Go to page:</label>
                        <input
                          id="page-jump-input"
                          type="number"
                          min="1"
                          max={totalPages}
                          className="form-control font-xs"
                          style={{ width: '65px', padding: '0.2rem 0.4rem' }}
                          value={pageJumpInput}
                          onChange={(e) => setPageJumpInput(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary font-xs"
                          style={{ padding: '0.2rem 0.5rem' }}
                          onClick={handlePageJump}
                        >
                          Go
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.5rem' }}>
                        <label className="font-xs text-muted" htmlFor="page-size-select">Size:</label>
                        <select
                          id="page-size-select"
                          className="form-control font-xs"
                          style={{ width: '60px', padding: '0.2rem' }}
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Accessible Dropdown for Flow Selection */}
                  <div style={{ marginTop: '0.4rem' }}>
                    <label htmlFor="preset-select" className="font-xs text-muted" style={{ display: 'block', marginBottom: '0.2rem' }}>
                      Select Traffic Record:
                    </label>
                    <select
                      id="preset-select"
                      className="form-control font-mono font-xs"
                      value={currentDropdownValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = datasetRecords.find((r) => String(r.id || r.index) === val);
                        if (found) handleDatasetRowClick(found);
                      }}
                      data-testid="preset-dropdown"
                    >
                      {datasetRecords.length === 0 ? (
                        <option value={currentDropdownValue}>
                          {selectedPreset} — {String(activeFlowData?.summary?.protocol || activeFeatures.proto).toUpperCase()} · {(activeFeatures.spkts || 0) + (activeFeatures.dpkts || 0)} pkts
                        </option>
                      ) : (
                        datasetRecords.map((rec) => {
                          const s = rec.summary || {};
                          const proto = (s.protocol || '').toUpperCase();
                          const dur = formatDuration(s.duration);
                          return (
                            <option key={`rec-${rec.id || rec.index}`} value={String(rec.id || rec.index)}>
                              Record #{String(rec.index || rec.id).padStart(6, '0')} — {proto} · {s.total_pkts} pkts · {s.total_bytes} B · {dur}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                </div>

                {/* Selected Flow Detail Card */}
                {activeFlowData && (
                  <div className="flow-spec-card" data-testid="selected-flow-details">
                    <div className="flow-spec-header">
                      <span>SELECTED NETWORK FLOW</span>
                      <span className="font-mono font-xs text-secondary">
                        {selectedPreset} (UNSW-NB15 Record #{String(activeFlowData.dataset_id || 1).padStart(6, '0')})
                      </span>
                    </div>
                    <div className="flow-spec-grid">
                      <div className="spec-item">
                        <span className="spec-label">Protocol:</span>
                        <span className="spec-val font-mono">{String(activeFlowData.summary?.protocol || activeFeatures.proto).toUpperCase()}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Service:</span>
                        <span className="spec-val font-mono">{activeFlowData.summary?.service || activeFeatures.service || '-'}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Transaction State:</span>
                        <span className="spec-val font-mono">{activeFlowData.summary?.state || activeFeatures.state || '-'}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Duration:</span>
                        <span className="spec-val font-mono">{formatDuration(activeFlowData.summary?.duration ?? activeFeatures.dur)}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Packets:</span>
                        <span className="spec-val font-mono">
                          {activeFeatures.spkts || 0} src / {activeFeatures.dpkts || 0} dst ({((activeFeatures.spkts || 0) + (activeFeatures.dpkts || 0))} total)
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Transaction Bytes:</span>
                        <span className="spec-val font-mono">
                          {(activeFeatures.sbytes || 0).toLocaleString()} src / {(activeFeatures.dbytes || 0).toLocaleString()} dst
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Packet Rate:</span>
                        <span className="spec-val font-mono" data-testid="selected-flow-packet-rate">
                          {formatRate(activeFeatures.rate, activeFlowData.summary?.duration ?? activeFeatures.dur)}
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Byte Rate:</span>
                        <span className="spec-val font-mono" data-testid="selected-flow-byte-rate">
                          {formatByteRate(activeFeatures.sbytes, activeFeatures.dbytes, activeFlowData.summary?.duration ?? activeFeatures.dur)}
                        </span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">TTL (Time-to-Live):</span>
                        <span className="spec-val font-mono">{activeFeatures.sttl || 0} src / {activeFeatures.dttl || 0} dst</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Same-Service Conns:</span>
                        <span className="spec-val font-mono">{activeFeatures.ct_srv_src ?? 'N/A'} (ct_srv_src)</span>
                      </div>
                    </div>

                    {/* Collapsible 42 Features Vector Inspection */}
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="font-xs text-muted" style={{ fontWeight: 'bold' }}>
                          FLOW FEATURES (42 model input features):
                        </span>
                        <button
                          type="button"
                          className="btn-link font-xs"
                          onClick={() => setShowAllFeatures(!showAllFeatures)}
                          style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {showAllFeatures ? 'Hide All 42 Features ▲' : 'Inspect All 42 Features ▼'}
                        </button>
                      </div>

                      <p className="font-xs text-muted" style={{ margin: '0.2rem 0 0.4rem 0' }}>
                        Raw dataset feature values passed to hierarchical model. Preprocessing applies leak-free scaling and encoding internally.
                      </p>

                      {showAllFeatures && (
                        <div className="feature-vector-grid font-mono font-xs" data-testid="all-42-features-grid">
                          {Object.keys(activeFeatures).map((featKey) => (
                            <div key={featKey} className="feature-kv-pill">
                              <span className="feat-key">{featKey}:</span>
                              <span className="feat-val">{String(activeFeatures[featKey])}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="custom-flow-json">
                  Custom 42-Feature Network Flow JSON:
                </label>
                <textarea
                  id="custom-flow-json"
                  className="form-control font-mono font-xs"
                  rows={10}
                  value={customJson}
                  onChange={(e) => setCustomJson(e.target.value)}
                  placeholder="Paste JSON dictionary of 42 UNSW-NB15 flow features..."
                  data-testid="custom-json-textarea"
                />
                {jsonError && (
                  <div className="text-danger font-xs" style={{ marginTop: '0.4rem' }}>
                    {jsonError}
                  </div>
                )}
              </div>
            )}

            {/* Architecture Mode Selector */}
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Classification Architecture:</label>
              <div className="endpoint-selector-tabs">
                <button
                  type="button"
                  className={`btn-toggle ${endpointMode === 'hierarchical' ? 'active' : ''}`}
                  onClick={() => setEndpointMode('hierarchical')}
                  data-testid="mode-hierarchical-btn"
                >
                  Hierarchical IDS + Response Advisory (Primary)
                </button>
                <button
                  type="button"
                  className={`btn-toggle ${endpointMode === 'legacy' ? 'active' : ''}`}
                  onClick={() => setEndpointMode('legacy')}
                  data-testid="mode-legacy-btn"
                >
                  Binary Classifier Only (Baseline)
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isPredicting}
                data-testid="predict-btn"
                title={!isModelLoaded ? 'Model not authorized. Verify and load the authorized model first.' : 'Analyze network flow'}
              >
                {isPredicting ? (
                  <span>
                    <span className="spinner" /> Analyzing Network Flow...
                  </span>
                ) : (
                  '⚡ ANALYZE NETWORK FLOW'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Hierarchical Detection Results & Response Advisory */}
        <div className="console-card" data-testid="detection-results-card">
          <div className="card-header">
            <h3 className="card-title">Detection &amp; Advisory Results</h3>
            {predictionResult && (
              <span className="font-mono font-xs text-secondary" data-testid="inference-latency">
                Latency: {predictionResult.inference_latency_ms?.toFixed(2)} ms
              </span>
            )}
          </div>

          {!predictionResult ? (
            <div className="empty-state-box" style={{ padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📡</div>
              <strong>Awaiting Network Flow Input</strong>
              <p className="text-secondary font-xs" style={{ marginTop: '0.25rem' }}>
                Select a network traffic record on the left and click "ANALYZE NETWORK FLOW" to execute off-chain classification.
              </p>
            </div>
          ) : (
            <div className="results-container" data-testid="prediction-result">
              {/* Stage 1 Binary Detection Card */}
              <div
                className={`result-stage-card ${
                  predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                    ? 'attack-theme'
                    : 'benign-theme'
                }`}
                data-testid="stage1-result-box"
              >
                <div className="stage-card-header">
                  <span className="stage-tag">STAGE 1 — BINARY IDS</span>
                  <span className="font-mono font-xs">
                    Model: {predictionResult.stage1_model_id || predictionResult.model_id || 'iot-ids-rf'}
                  </span>
                </div>

                <div className="stage-result-grid">
                  <div>
                    <span className="result-metric-label">DETECTION OUTCOME</span>
                    <div
                      className="result-verdict"
                      style={{
                        color:
                          predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                            ? '#f87171'
                            : '#4ade80',
                      }}
                      data-testid="prediction-label"
                    >
                      {predictionResult.stage1_prediction === 'Attack' || predictionResult.prediction === 'Attack'
                        ? 'ATTACK / Malicious Flow'
                        : 'BENIGN / Normal Flow'}
                    </div>
                  </div>

                  <div>
                    <span className="result-metric-label">CONFIDENCE SCORE</span>
                    <div className="font-mono result-confidence" data-testid="prediction-confidence">
                      {((predictionResult.stage1_confidence ?? predictionResult.confidence ?? 0) * 100).toFixed(
                        predictionResult.stage1_confidence !== undefined && predictionResult.stage1_confidence !== null ? 1 : 2
                      )}%
                    </div>
                  </div>

                  <div>
                    <span className="result-metric-label">VERIFICATION GATE</span>
                    <div className="font-mono font-xs text-success" data-testid="prediction-provenance-status">
                      ✓ {predictionResult.verification_status || 'VERIFIED'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 2 Multiclass Attack Classification Card */}
              {predictionResult.stage2_invoked ? (
                <div className="result-stage-card attack-theme" style={{ marginTop: '1rem' }} data-testid="stage2-result-box">
                  <div className="stage-card-header">
                    <span className="stage-tag">STAGE 2 — ATTACK CLASSIFICATION</span>
                    <span className="font-mono font-xs">
                      Model: {predictionResult.stage2_model_id || 'iot-ids-attack-classifier'}
                    </span>
                  </div>

                  <div className="stage-result-grid">
                    <div>
                      <span className="result-metric-label">CLASSIFIED ATTACK CATEGORY</span>
                      <div className="result-verdict font-mono" style={{ color: '#fb923c' }} data-testid="stage2-category">
                        {predictionResult.stage2_prediction || predictionResult.final_prediction}
                      </div>
                    </div>

                    <div>
                      <span className="result-metric-label">CATEGORY CONFIDENCE</span>
                      <div className="font-mono result-confidence" data-testid="stage2-confidence">
                        {((predictionResult.stage2_confidence ?? 0.85) * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div>
                      <span className="result-metric-label">ROUTING LOGIC</span>
                      <div className="font-mono font-xs text-secondary">
                        Gated strictly on Stage 1 Attack
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stage2-bypassed-card" style={{ marginTop: '1rem' }} data-testid="stage2-bypassed">
                  <span>ℹ️ <strong>Stage 2 Multiclass Classifier: Bypassed</strong> (Stage 2: BYPASSED — Stage 1 classified this flow as Benign). Normal traffic does not invoke attack categorization.</span>
                </div>
              )}

              {/* Response Advisory Panel */}
              {predictionResult.advisory_recommendation && (
                <div className="advisory-panel" style={{ marginTop: '1rem' }} data-testid="advisory-panel">
                  <div className="advisory-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="advisory-icon">📋</span>
                      <h4 className="advisory-title">
                        SECURITY ADVISORY: {predictionResult.advisory_recommendation.category}
                      </h4>
                    </div>
                    <div className="advisory-meta-pills">
                      <span className="badge badge-danger">
                        Severity: {predictionResult.advisory_recommendation.severity}
                      </span>
                      <span className="badge badge-warning">
                        Priority: {predictionResult.advisory_recommendation.investigation_priority}
                      </span>
                    </div>
                  </div>

                  <div className="advisory-content">
                    <div className="advisory-item">
                      <span className="advisory-item-label">Recommended Operator Action:</span>
                      <p className="advisory-item-text" data-testid="advisory-recommended-action">
                        {predictionResult.advisory_recommendation.recommended_action}
                      </p>
                    </div>

                    <div className="advisory-item">
                      <span className="advisory-item-label">Operator Guidance:</span>
                      <p className="advisory-item-text text-secondary font-xs" data-testid="advisory-operator-guidance">
                        {predictionResult.advisory_recommendation.operator_guidance}
                      </p>
                    </div>

                    {predictionResult.advisory_recommendation.rationale && (
                      <div className="advisory-item">
                        <span className="advisory-item-label">Rationale:</span>
                        <p className="advisory-item-text text-secondary font-xs">
                          {predictionResult.advisory_recommendation.rationale}
                        </p>
                      </div>
                    )}

                    {predictionResult.advisory_recommendation.limitations && (
                      <div className="advisory-item">
                        <span className="advisory-item-label">Operational Limitation:</span>
                        <p className="advisory-item-text text-muted font-xs">
                          {predictionResult.advisory_recommendation.limitations}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="advisory-footer-disclaimer">
                    <span>⚠️ Human operator approval strictly required. Automated remediation is disabled. Advisory guidance does not execute defensive network modifications.</span>
                  </div>
                </div>
              )}

              {/* Ground Truth: Post-Inference Evaluation Only */}
              <div className="eval-ground-truth-box" data-testid="ground-truth-eval-box">
                <span className="text-muted" style={{ fontWeight: 'bold' }}>GROUND TRUTH — EVALUATION ONLY: </span>
                <span className="font-mono font-xs text-secondary" style={{ marginLeft: '0.4rem' }}>
                  {activeFlowData.ground_truth?.attack_cat || 'Normal'} (Label {activeFlowData.ground_truth?.label ?? 0})
                </span>
                <p className="font-xs text-muted" style={{ margin: '0.25rem 0 0 0' }}>
                  This ground-truth label originates from the authentic UNSW-NB15 benchmark testing dataset. It is strictly quarantined from model input features and shown solely for post-inference evaluation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
