import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from './api/client';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { SecuritySolutionOverview } from './components/SecuritySolutionOverview';
import { Dashboard } from './components/Dashboard';
import { IntrusionDetection } from './components/IntrusionDetection';
import { ModelSecurity } from './components/ModelSecurity';
import { SecurityTesting } from './components/SecurityTesting';
import { AuditLog } from './components/AuditLog';
import { ResearchResults } from './components/ResearchResults';
import { AlertBanner } from './components/AlertBanner';

export function App() {
  // Navigation state (Default is Security Solution for coherent end-to-end demonstration)
  const [activeTab, setActiveTab] = useState('solution');

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

  // Engine loading state
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

  // Analytics states
  const [analyticsEvents, setAnalyticsEvents] = useState([]);
  const [analyticsTotal, setAnalyticsTotal] = useState(0);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  // Fetch audit records for table & aggregates
  const loadAuditEvents = useCallback(async (limit = 10, offset = 0, filter = '') => {
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

  // Fetch all system telemetry
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
        // Stage 2 may not be standalone queryable in all configurations
      }

      await Promise.all([
        loadAnalytics(),
        loadAuditEvents(auditLimit, auditOffset, auditFilter),
      ]);
    } catch (err) {
      setGeneralError(
        `Backend Connection Alert: ${err.message}. Verify that the FastAPI backend server is running on http://127.0.0.1:8000.`
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAnalytics, loadAuditEvents, auditLimit, auditOffset, auditFilter]);

  // Initial load
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Handle explicit verification
  const handleVerify = async (target = 'stage1') => {
    setIsVerifying(true);
    setVerificationError(null);
    setLastVerifyResult(null);

    try {
      const result = await api.verifyModel(target);
      setLastVerifyResult(result);
      await loadAll();
      return result;
    } catch (err) {
      setVerificationError(err.message || 'Verification request failed.');
      throw err;
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle explicit model load
  const handleLoadModel = async () => {
    try {
      const res = await api.loadModel();
      setIsModelLoaded(true);
      await loadAll();
      return res;
    } catch (err) {
      setVerificationError(err.message || 'Model load blocked fail-closed.');
      throw err;
    }
  };

  // Handle flow prediction (uses hierarchical endpoint by default)
  const handlePredict = async (features, mode = 'hierarchical') => {
    setIsPredicting(true);
    setPredictionError(null);
    setPredictionResult(null);

    try {
      let result;
      if (mode === 'legacy') {
        result = await api.predict(features);
      } else {
        try {
          result = await api.predictHierarchical(features);
        } catch (hierErr) {
          result = await api.predict(features);
        }
      }
      setPredictionResult(result);
      // Refresh audit logs
      loadAuditEvents(auditLimit, auditOffset, auditFilter);
      loadAnalytics();
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setPredictionError(
          `Inference Blocked (HTTP 503): Fail-closed verification gate active. Model is unverified or unloaded.`
        );
      } else {
        setPredictionError(err.message || 'Inference execution failed.');
      }
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="app-shell">
      {/* Compact SOC Application Header */}
      <Header
        health={health}
        modelStatus={modelStatus}
        isRefreshing={isRefreshing}
        onRefresh={loadAll}
      />

      <main className="container">
        {generalError && (
          <AlertBanner
            type="danger"
            message={generalError}
            onDismiss={() => setGeneralError(null)}
          />
        )}

        {/* 7-Tab Operations Navigation */}
        <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* PAGE 0: SECURITY SOLUTION OVERVIEW (DEFAULT PRIMARY WORKFLOW) */}
        <div style={{ display: activeTab === 'solution' ? 'block' : 'none' }}>
          <SecuritySolutionOverview
            health={health}
            modelStatus={modelStatus}
            stage2Status={stage2Status}
            isModelLoaded={isModelLoaded}
            isVerifying={isVerifying}
            onVerify={handleVerify}
            verifyResult={lastVerifyResult}
            verificationError={verificationError}
            onLoadModel={handleLoadModel}
            isPredicting={isPredicting}
            onPredict={handlePredict}
            predictionResult={predictionResult}
            predictionError={predictionError}
            auditEvents={auditEvents}
            onRefreshStatus={loadAll}
            onNavigate={setActiveTab}
          />
        </div>

        {/* PAGE 1: OPERATIONS DASHBOARD */}
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <Dashboard
            health={health}
            modelStatus={modelStatus}
            stage2Status={stage2Status}
            auditEvents={auditEvents}
            auditTotal={auditTotal}
            onNavigate={setActiveTab}
          />
        </div>

        {/* PAGE 2: INTRUSION DETECTION (PRIMARY WORKBENCH) */}
        <div style={{ display: activeTab === 'detection' ? 'block' : 'none' }}>
          <IntrusionDetection
            isModelLoaded={isModelLoaded}
            isPredicting={isPredicting}
            onPredict={handlePredict}
            predictionResult={predictionResult}
            predictionError={predictionError}
            modelStatus={modelStatus}
          />
        </div>

        {/* PAGE 3: MODEL SECURITY & PROVENANCE */}
        <div style={{ display: activeTab === 'model-security' ? 'block' : 'none' }}>
          <ModelSecurity
            health={health}
            modelStatus={modelStatus}
            stage2Status={stage2Status}
            isVerifying={isVerifying}
            onVerify={handleVerify}
            verifyResult={lastVerifyResult}
            onLoadModel={handleLoadModel}
            isModelLoaded={isModelLoaded}
            verificationError={verificationError}
          />
        </div>

        {/* PAGE 4: SECURITY TESTING FACILITY */}
        <div style={{ display: activeTab === 'security-testing' ? 'block' : 'none' }}>
          <SecurityTesting onModelStatusRefresh={loadAll} />
        </div>

        {/* PAGE 5: LOCAL OPERATIONAL AUDIT LOG */}
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
              loadAuditEvents(auditLimit, 0, newFilter);
            }}
            onPageChange={(newOffset) => {
              setAuditOffset(newOffset);
              loadAuditEvents(auditLimit, newOffset, auditFilter);
            }}
            onRefresh={() => loadAuditEvents(auditLimit, auditOffset, auditFilter)}
            isLoading={isLoadingAudit}
            error={auditError}
          />
        </div>

        {/* PAGE 6: EMPIRICAL RESEARCH RESULTS */}
        <div style={{ display: activeTab === 'research-results' ? 'block' : 'none' }}>
          <ResearchResults
            events={analyticsEvents}
            totalEventsCount={analyticsTotal}
            isLoading={isLoadingAnalytics}
            error={analyticsError}
            onRefresh={loadAnalytics}
          />
        </div>

        {/* Operational Console Footer Notice */}
        <footer className="console-footer">
          <div className="footer-content">
            <span className="footer-title">IoT Intrusion Detection Operations Console</span>
            <p className="footer-text font-xs text-muted">
              <strong>Research Prototype Disclosures:</strong> Blockchain-backed model provenance enforces pre-load verification against <code>ModelRegistry.sol</code>.
              Per-flow network intrusion classification is executed strictly off-chain with zero per-flow blockchain lookups.
              Response recommendations are advisory only; human operator approval is required for all mitigation workflows.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
