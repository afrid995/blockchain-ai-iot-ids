/**
 * Deterministic analytics aggregation utilities for security audit events.
 *
 * All aggregations are computed directly from structured records returned by
 * the backend's /audit/events endpoint.
 *
 * CRITICAL RESEARCH INTEGRITY:
 * - Does not invent historical events or fabricate metrics.
 * - Handles empty arrays, missing fields, and nulls safely without producing NaN/Infinity.
 * - Latency statistics represent local evaluation measurements and are not performance guarantees.
 */

/**
 * Aggregate prediction statistics from audit events.
 *
 * @param {Array} events - List of SecurityEvent objects.
 * @returns {Object} Aggregated prediction counts, proportions, and presence flag.
 */
export function aggregatePredictions(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      total: 0,
      attackCount: 0,
      benignCount: 0,
      otherCount: 0,
      attackPercentage: 0,
      benignPercentage: 0,
      hasData: false,
    };
  }

  // Filter events that represent predictions
  const predictionEvents = events.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    if (e.event_type === 'PREDICTION') return true;
    if (typeof e.prediction === 'string' && e.prediction.trim() !== '') return true;
    return false;
  });

  if (predictionEvents.length === 0) {
    return {
      total: 0,
      attackCount: 0,
      benignCount: 0,
      otherCount: 0,
      attackPercentage: 0,
      benignPercentage: 0,
      hasData: false,
    };
  }

  let attackCount = 0;
  let benignCount = 0;
  let otherCount = 0;

  for (const ev of predictionEvents) {
    const pred = (ev.prediction || '').trim().toLowerCase();
    if (pred === 'attack') {
      attackCount += 1;
    } else if (pred === 'benign') {
      benignCount += 1;
    } else {
      otherCount += 1;
    }
  }

  const total = predictionEvents.length;
  const attackPercentage = total > 0 ? Number(((attackCount / total) * 100).toFixed(1)) : 0;
  const benignPercentage = total > 0 ? Number(((benignCount / total) * 100).toFixed(1)) : 0;

  return {
    total,
    attackCount,
    benignCount,
    otherCount,
    attackPercentage,
    benignPercentage,
    hasData: true,
  };
}

/**
 * Aggregate model verification outcomes from audit events.
 *
 * @param {Array} events - List of SecurityEvent objects.
 * @returns {Object} Breakdown of verification successes, failures, and statuses.
 */
export function aggregateVerifications(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      total: 0,
      successCount: 0,
      failureCount: 0,
      byStatus: {
        VERIFIED: 0,
        HASH_MISMATCH: 0,
        NOT_REGISTERED: 0,
        BLOCKCHAIN_UNAVAILABLE: 0,
        FILE_NOT_FOUND: 0,
        UNVERIFIED: 0,
        OTHER: 0,
      },
      hasData: false,
    };
  }

  const verificationEvents = events.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    const type = (e.event_type || '').toUpperCase();
    return type === 'MODEL_VERIFICATION' || type === 'MODEL_VERIFICATION_FAILURE';
  });

  if (verificationEvents.length === 0) {
    return {
      total: 0,
      successCount: 0,
      failureCount: 0,
      byStatus: {
        VERIFIED: 0,
        HASH_MISMATCH: 0,
        NOT_REGISTERED: 0,
        BLOCKCHAIN_UNAVAILABLE: 0,
        FILE_NOT_FOUND: 0,
        UNVERIFIED: 0,
        OTHER: 0,
      },
      hasData: false,
    };
  }

  let successCount = 0;
  let failureCount = 0;
  const byStatus = {
    VERIFIED: 0,
    HASH_MISMATCH: 0,
    NOT_REGISTERED: 0,
    BLOCKCHAIN_UNAVAILABLE: 0,
    FILE_NOT_FOUND: 0,
    UNVERIFIED: 0,
    OTHER: 0,
  };

  for (const ev of verificationEvents) {
    const status = (ev.status || '').toUpperCase();
    const eventType = (ev.event_type || '').toUpperCase();
    const vStatus = (ev.verification_status || '').toUpperCase();

    // Determine success or failure
    if (status === 'SUCCESS' || eventType === 'MODEL_VERIFICATION' || vStatus === 'VERIFIED') {
      successCount += 1;
    } else {
      failureCount += 1;
    }

    // Tally specific status code
    if (vStatus in byStatus) {
      byStatus[vStatus] += 1;
    } else if (vStatus) {
      byStatus.OTHER += 1;
    } else if (eventType === 'MODEL_VERIFICATION') {
      byStatus.VERIFIED += 1;
    } else {
      byStatus.OTHER += 1;
    }
  }

  return {
    total: verificationEvents.length,
    successCount,
    failureCount,
    byStatus,
    hasData: true,
  };
}

/**
 * Compute descriptive statistics for observed off-chain prediction latency.
 *
 * @param {Array} events - List of SecurityEvent objects.
 * @returns {Object} Count, mean, median, min, max, and presence flag.
 */
export function calculateLatencyStats(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      min: null,
      max: null,
      hasData: false,
    };
  }

  const values = [];
  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    const lat = ev.inference_latency_ms;
    if (typeof lat === 'number' && !Number.isNaN(lat) && Number.isFinite(lat) && lat > 0) {
      values.push(lat);
    }
  }

  if (values.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      min: null,
      max: null,
      hasData: false,
    };
  }

  values.sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = Number((sum / count).toFixed(2));

  let median;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = Number(((values[mid - 1] + values[mid]) / 2).toFixed(2));
  } else {
    median = Number(values[mid].toFixed(2));
  }

  const min = Number(values[0].toFixed(2));
  const max = Number(values[count - 1].toFixed(2));

  return {
    count,
    mean,
    median,
    min,
    max,
    hasData: true,
  };
}

/**
 * Aggregate distribution of audit event types from loaded events.
 *
 * @param {Array} events - List of SecurityEvent objects.
 * @returns {Object} List of event types with counts and percentages.
 */
export function aggregateEventTypes(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      total: 0,
      types: [],
      hasData: false,
    };
  }

  const typeCounts = {};
  let validCount = 0;

  for (const ev of events) {
    if (!ev || typeof ev !== 'object') continue;
    const rawType = (ev.event_type || 'UNKNOWN').trim();
    if (!rawType) continue;
    typeCounts[rawType] = (typeCounts[rawType] || 0) + 1;
    validCount += 1;
  }

  if (validCount === 0) {
    return {
      total: 0,
      types: [],
      hasData: false,
    };
  }

  const types = Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Number(((count / validCount) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total: validCount,
    types,
    hasData: true,
  };
}

/**
 * Generate a complete analytics summary from loaded security events.
 *
 * @param {Array} events - List of SecurityEvent objects.
 * @returns {Object} Comprehensive analytics data package.
 */
export function getAnalyticsSummary(events = []) {
  return {
    predictions: aggregatePredictions(events),
    verifications: aggregateVerifications(events),
    latency: calculateLatencyStats(events),
    eventTypes: aggregateEventTypes(events),
    loadedEventsCount: Array.isArray(events) ? events.length : 0,
  };
}
