import React, { useState } from 'react';
import { AlertBanner } from './AlertBanner';

const BENIGN_PRESET = {
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
};

const ATTACK_PRESET = {
  dur: 0.000011,
  proto: 'udp',
  service: '-',
  state: 'INT',
  spkts: 2,
  dpkts: 0,
  sbytes: 496,
  dbytes: 0,
  rate: 90909.0902,
  sttl: 254,
  dttl: 0,
  sload: 180363632.0,
  dload: 0.0,
  sloss: 0,
  dloss: 0,
  sinpkt: 0.011,
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
  smean: 248,
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
};

export function PredictionForm({ onPredict, isPredicting, predictionResult, predictionError, isModelLoaded }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(BENIGN_PRESET, null, 2));
  const [parseError, setParseError] = useState(null);

  const handlePreset = (preset) => {
    setJsonText(JSON.stringify(preset, null, 2));
    setParseError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setParseError(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      setParseError(`Invalid JSON syntax: ${err.message}`);
      return;
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setParseError('Payload must be a JSON object of feature key-value pairs.');
      return;
    }

    onPredict(parsed);
  };

  const isAttack =
    predictionResult?.prediction?.toLowerCase() === 'attack' ||
    predictionResult?.prediction?.toLowerCase() === 'malicious';

  return (
    <div className="card" data-testid="prediction-card">
      <div className="card-header">
        <h2 className="card-title">
          <span>⚡</span>
          <span>Off-Chain ML Intrusion Detection</span>
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          RandomForestClassifier (UNSW-NB15)
        </span>
      </div>

      {!isModelLoaded && (
        <AlertBanner
          type="warning"
          message="Model is currently unloaded or unverified. Submitting inference requests will trigger the fail-closed verification gate and return HTTP 503."
        />
      )}

      {parseError && <AlertBanner type="danger" message={parseError} />}
      {predictionError && <AlertBanner type="danger" message={predictionError} />}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="preset-bar">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
              Presets:
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => handlePreset(BENIGN_PRESET)}
            >
              Benign Flow Preset
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => handlePreset(ATTACK_PRESET)}
            >
              Attack Flow Preset
            </button>
          </div>

          <label className="form-label" htmlFor="feature-json">
            Network Flow Features (JSON):
          </label>
          <textarea
            id="feature-json"
            className="form-control"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck="false"
            data-testid="features-textarea"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isPredicting}
          data-testid="predict-btn"
        >
          {isPredicting ? (
            <>
              <span className="spinner" /> Classifying Traffic...
            </>
          ) : (
            'Classify Network Flow'
          )}
        </button>
      </form>

      {predictionResult && (
        <div
          className={`prediction-box ${isAttack ? 'attack' : 'benign'}`}
          data-testid="prediction-result"
        >
          <div className="pred-heading">
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Classification Outcome:
              </span>
              <div
                className={`pred-verdict ${isAttack ? 'attack' : 'benign'}`}
                data-testid="prediction-label"
              >
                {isAttack ? '⚠ Attack / Malicious Flow' : '✓ Normal / Benign Flow'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Confidence:
              </span>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: isAttack ? '#f87171' : '#34d399',
                }}
                data-testid="prediction-confidence"
              >
                {(predictionResult.confidence * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          <table className="data-table" style={{ marginTop: '0.5rem' }}>
            <tbody>
              <tr>
                <th>Prediction Code</th>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {predictionResult.prediction_code}
                </td>
              </tr>
              <tr>
                <th>Gatekeeper Status</th>
                <td>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                    {predictionResult.verification_status}
                  </span>
                </td>
              </tr>
              <tr>
                <th>Inference Latency</th>
                <td style={{ fontFamily: 'var(--font-mono)' }} data-testid="inference-latency">
                  {predictionResult.inference_latency_ms?.toFixed(2)} ms{' '}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    (isolated off-chain model inference in local environment)
                  </span>
                </td>
              </tr>
              <tr>
                <th>Audit Event UUID</th>
                <td className="hash-cell" style={{ fontSize: '0.75rem' }}>
                  {predictionResult.event_id}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
