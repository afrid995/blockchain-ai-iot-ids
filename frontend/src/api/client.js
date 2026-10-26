/**
 * API client module for interacting with the FastAPI backend.
 *
 * Configurable via VITE_API_BASE_URL environment variable.
 * Does not communicate directly with Ethereum RPC or ML binaries.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

class ApiError extends Error {
  constructor(message, status, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const detail = data?.detail || response.statusText || 'Unknown error';
      throw new ApiError(
        typeof detail === 'string' ? detail : JSON.stringify(detail),
        response.status,
        data
      );
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network failure or connection refused
    throw new ApiError(
      `Cannot connect to backend service at ${BASE_URL}. Ensure the FastAPI server is running.`,
      0,
      { originalError: err.message }
    );
  }
}

export const api = {
  getHealth: () => request('/health'),
  getModelStatus: (target = 'stage1') => request(`/model/status?target=${encodeURIComponent(target)}`),
  verifyModel: (target = 'stage1') => request(`/model/verify?target=${encodeURIComponent(target)}`, { method: 'POST' }),
  loadModel: (target = null) => {
    const query = target ? `?target=${encodeURIComponent(target)}` : '';
    return request(`/model/load${query}`, { method: 'POST' });
  },
  predict: (features) =>
    request('/predict', {
      method: 'POST',
      body: JSON.stringify({ features }),
    }),
  predictHierarchical: (features) =>
    request('/predict/hierarchical', {
      method: 'POST',
      body: JSON.stringify({ features }),
    }),
  runSecurityScenario: (scenario) =>
    request('/security/test-scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),
  simulateModelReplacement: () => request('/demo/model-replacement', { method: 'POST' }),
  resetModelReplacement: () => request('/demo/model-replacement/reset', { method: 'POST' }),
  simulateUnregisteredVersion: () => request('/demo/unregistered-version', { method: 'POST' }),
  getAuditEvents: (limit = 20, offset = 0, eventType = null) => {
    let query = `?limit=${limit}&offset=${offset}`;
    if (eventType) {
      query += `&event_type=${encodeURIComponent(eventType)}`;
    }
    return request(`/audit/events${query}`);
  },
  getAuditEvent: (eventId) => request(`/audit/events/${encodeURIComponent(eventId)}`),
};

export { ApiError, BASE_URL };
