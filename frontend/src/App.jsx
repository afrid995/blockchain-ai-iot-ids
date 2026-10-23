import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from './api/client';
import { Header } from './components/Header';
import { ModelProvenance } from './components/ModelProvenance';
import { PredictionForm } from './components/PredictionForm';
import { AnalyticsSection } from './components/AnalyticsSection';
import { AuditLog } from './components/AuditLog';
import { AlertBanner } from './components/AlertBanner';

export function App() {
  // System states
  const [health, setHealth] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [lastVerifyResult, setLastVerifyResult] = useState(null);

  // Prediction states
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  // Audit states
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLimit] = useState(10);
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditFilter, setAuditFilter] = useState('');
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState(null);

  // Analytics states (Phase 5B)
  const [analyticsEvents, setAnalyticsEvents] = useState([]);
  const [analyticsTotal, setAnalyticsTotal] = useState(0);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Fetch audit records for paginated table
  const loadAuditEvents = useCallback(async (limit, offset, filter) => {
    setIsLoadingAudit(true);
    setAuditError(null);
    try {
      const data = await api.getAuditEvents(limit, offset, filter || null);
      setAuditEvents(data?.events || []);
      setAuditTotal(data?.total || 0);
    } catch (err) {
      setAuditError(err.message || 'Failed to load audit records');
    } finally {
      setIsLoadingAudit(false);
    }
  }, []);

  // Fetch analytics records (up to 100 recent audit events)
  const loadAnalytics = useCallback(async () => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const data = await api.getAuditEvents(100, 0, null);
      setAnalyticsEvents(data?.events || []);
      setAnalyticsTotal(data?.total || 0);
    } catch (err) {
      setAnalyticsError(err.message || 'Failed to load analytics data');
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  // Fetch all system data
  const loadAll = useCallback(async () => {
    setIsRefreshing(true);
    setGeneralError(null);
    try {
      const [healthData, statusData] = await Promise.all([
        api.getHealth(),
        api.getModelStatus(),
      ]);
      setHealth(healthData);
      setModelStatus(statusData);
      await loadAnalytics();
    } catch (err) {
      setGeneralError(
        `Backend Connection Alert: ${err.message}. Please verify that the FastAPI backend server is running on http://127.0.0.1:8000.`
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAnalytics]);

  // Initial load
  useEffect(() => {
    loadAll();
    loadAuditEvents(auditLimit, auditOffset, auditFilter);
  }, [loadAll, loadAuditEvents, auditLimit, auditOffset, auditFilter]);

  // Handle explicit verification
  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    setLastVerifyResult(null);

    try {
      const result = await api.verifyModel();
      setLastVerifyResult(result);
      // Refresh status, audit events, and analytics to reflect new gate state
      await Promise.all([
        api.getModelStatus().then(setModelStatus),
        api.getHealth().then(setHealth),
        loadAuditEvents(auditLimit, auditOffset, auditFilter),
        loadAnalytics(),
      ]);
    } catch (err) {
      setVerificationError(err.message || 'Verification failed unexpectedly.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle flow prediction
  const handlePredict = async (features) => {
    setIsPredicting(true);
    setPredictionError(null);
    setPredictionResult(null);

    try {
      const result = await api.predict(features);
      setPredictionResult(result);
      // Automatically refresh audit events and analytics
      loadAuditEvents(auditLimit, auditOffset, auditFilter);
      loadAnalytics();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setPredictionError(
          `Inference Blocked (HTTP 503): Model failed the cryptographic verification gate. Reason: ${err.message}`
        );
      } else {
        setPredictionError(err.message || 'Prediction request failed.');
      }
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div>
      <Header health={health} isRefreshing={isRefreshing} onRefresh={loadAll} />

      <main className="container">
        {generalError && (
          <AlertBanner
            type="danger"
            message={generalError}
            onDismiss={() => setGeneralError(null)}
          />
        )}

        <div className="dashboard-grid">
          {/* Section 1: Model Provenance & Cryptographic Verification Gate */}
          <ModelProvenance
            modelStatus={modelStatus}
            onVerify={handleVerify}
            isVerifying={isVerifying}
            verificationError={verificationError}
            lastVerifyResult={lastVerifyResult}
          />

          {/* Section 2: Off-Chain Intrusion Detection Inference */}
          <PredictionForm
            onPredict={handlePredict}
            isPredicting={isPredicting}
            predictionResult={predictionResult}
            predictionError={predictionError}
            isModelLoaded={modelStatus?.is_loaded}
          />

          {/* Section 3: Dashboard Analytics & Audit Visualization (Phase 5B) */}
          <AnalyticsSection
            events={analyticsEvents}
            totalEventsCount={analyticsTotal}
            isLoading={isLoadingAnalytics}
            error={analyticsError}
            onRefresh={loadAnalytics}
          />

          {/* Section 4: Operational Security Audit Trail */}
          <AuditLog
            events={auditEvents}
            total={auditTotal}
            limit={auditLimit}
            offset={auditOffset}
            eventTypeFilter={auditFilter}
            onFilterChange={(newFilter) => {
              setAuditFilter(newFilter);
              setAuditOffset(0);
            }}
            onPageChange={(newOffset) => setAuditOffset(newOffset)}
            isLoading={isLoadingAudit}
            error={auditError}
          />
        </div>

        <footer className="research-notice">
          <strong>Research Prototype Disclosures:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
            <li>
              <strong>Architecture Decoupling:</strong> The React frontend communicates strictly with the FastAPI REST API.
              Direct blockchain RPC access, model deserialization, and ML inference are strictly executed on the backend.
            </li>
            <li>
              <strong>Cryptographic Verification:</strong> SHA-256 verification establishes exact binary correspondence with
              the registered on-chain digest in <code>ModelRegistry.sol</code>. It does not establish model correctness,
              adversarial robustness, or absence of training-data poisoning.
            </li>
            <li>
              <strong>Benchmarking Context:</strong> Evaluated using the UNSW-NB15 flow benchmark. Reported latencies reflect
              measurements in the local evaluation environment (<code>EthereumTesterProvider</code>) and do not represent
              public blockchain performance or physical microcontroller telemetry.
            </li>
            <li>
              <strong>Audit Logging:</strong> Events are recorded in an append-oriented SQLite store for operational tracking;
              this local store is not by itself a decentralized blockchain ledger.
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}

export default App;
