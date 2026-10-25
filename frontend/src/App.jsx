import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from './api/client';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ArchitectureDemo } from './components/ArchitectureDemo';
import { LiveTest } from './components/LiveTest';
import { SecurityDemo } from './components/SecurityDemo';
import { ResearchMetrics } from './components/ResearchMetrics';
import { AuditLog } from './components/AuditLog';
import { AlertBanner } from './components/AlertBanner';

export function App() {
  // Navigation state (Default is Architecture)
  const [activeTab, setActiveTab] = useState('architecture');

  // System states
  const [health, setHealth] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [stage2Status, setStage2Status] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [lastVerifyResult, setLastVerifyResult] = useState(null);

  // Loading states
  const [isModelLoaded, setIsModelLoaded] = useState(false);

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
        api.getModelStatus('stage1'),
      ]);
      setHealth(healthData);
      setModelStatus(statusData);
      setIsModelLoaded(Boolean(statusData?.is_loaded));

      try {
        const s2Data = await api.getModelStatus('stage2');
        setStage2Status(s2Data);
      } catch {
        // Fallback if stage 2 status not independently queryable
      }

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
  const handleVerify = async (target = 'stage1') => {
    setIsVerifying(true);
    setVerificationError(null);
    setLastVerifyResult(null);

    try {
      const result = await api.verifyModel(target);
      setLastVerifyResult(result);
      // Refresh status and audit events
      await Promise.all([
        api.getModelStatus('stage1').then((data) => {
          setModelStatus(data);
          setIsModelLoaded(Boolean(data?.is_loaded));
        }),
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

  // Handle explicit model load
  const handleLoadModel = async () => {
    try {
      await api.loadModel();
      setIsModelLoaded(true);
      await loadAll();
    } catch (err) {
      setVerificationError(err.message || 'Model load blocked.');
    }
  };

  // Handle flow prediction (uses hierarchical endpoint)
  const handlePredict = async (features) => {
    setIsPredicting(true);
    setPredictionError(null);
    setPredictionResult(null);

    try {
      let result;
      try {
        // Primary Phase 7 Hierarchical Endpoint
        result = await api.predictHierarchical(features);
      } catch (hierErr) {
        // Fallback to legacy binary predict if hierarchical endpoint unavailable
        result = await api.predict(features);
      }
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
    <div className="app-shell">
      <Header health={health} isRefreshing={isRefreshing} onRefresh={loadAll} />

      <main className="container">
        {generalError && (
          <AlertBanner
            type="danger"
            message={generalError}
            onDismiss={() => setGeneralError(null)}
          />
        )}

        {/* Primary Navigation Bar */}
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* TAB 1: ARCHITECTURE DEMONSTRATOR (DEFAULT) */}
        <div style={{ display: activeTab === 'architecture' ? 'block' : 'none' }}>
          <ArchitectureDemo
            health={health}
            modelStatus={modelStatus}
            stage2Status={stage2Status}
            isVerifying={isVerifying}
            onVerify={handleVerify}
            verifyResult={lastVerifyResult}
            onLoadModel={handleLoadModel}
            isModelLoaded={isModelLoaded}
            isPredicting={isPredicting}
            onPredict={handlePredict}
            predictionResult={predictionResult}
            predictionError={predictionError}
            auditEvents={auditEvents}
          />
        </div>

        {/* TAB 2: LIVE TEST INFERENCE WORKBENCH */}
        <div style={{ display: activeTab === 'live-test' ? 'block' : 'none' }}>
          <LiveTest isModelLoaded={isModelLoaded} />
        </div>

        {/* TAB 3: SECURITY DEMONSTRATION MODE (FAIL-CLOSED) */}
        <div style={{ display: activeTab === 'security-test' ? 'block' : 'none' }}>
          <SecurityDemo onModelStatusRefresh={loadAll} />
        </div>

        {/* TAB 4: RESEARCH METRICS & STATISTICAL EVIDENCE */}
        <div style={{ display: activeTab === 'research-metrics' ? 'block' : 'none' }}>
          <ResearchMetrics
            events={analyticsEvents}
            totalEventsCount={analyticsTotal}
            isLoading={isLoadingAnalytics}
            error={analyticsError}
            onRefresh={loadAnalytics}
          />
        </div>

        {/* TAB 5: OPERATIONAL SECURITY AUDIT LOG */}
        <div style={{ display: activeTab === 'audit' ? 'block' : 'none' }}>
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

        {/* Evaluator Research Disclosures */}
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
              <strong>Per-Flow Blockchain Invariant:</strong> The evaluated per-flow inference path performs zero blockchain registry lookups.
            </li>
            <li>
              <strong>Advisory Response Boundary:</strong> The advisory attack recommendation layer does not perform autonomous remediation.
              Human operator review and approval are strictly required.
            </li>
            <li>
              <strong>Audit Logging:</strong> Events are recorded in an append-oriented SQLite store for operational tracking;
              raw 42-feature vectors are strictly excluded from persistent storage to protect telemetry privacy.
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}

export default App;
