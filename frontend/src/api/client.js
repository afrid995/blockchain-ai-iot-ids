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
  getModelStatus: () => request('/model/status'),
  verifyModel: () => request('/model/verify', { method: 'POST' }),
  predict: (features) =>
    request('/predict', {
      method: 'POST',
      body: JSON.stringify({ features }),
    }),
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
