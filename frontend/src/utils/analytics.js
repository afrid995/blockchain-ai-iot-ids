/**
 * Deterministic analytics aggregation utilities for security audit events.
 *
 * All aggregations are computed directly from structured records returned by
 * the backend's /audit/events endpoint.
 *
 * CRITICAL RESEARCH INTEGRITY:
 * - Does not invent historical events or fabricate metrics.
 * - Quarantines ground-truth UNSW-NB15 labels (label, attack_cat): operational
 *   analytics reflect purely detector outputs (Stage 1 & Stage 2 predictions).
 * - Quarantines ADVISORY_RECOMMENDATION events to prevent prediction double-counting.
 * - Handles empty arrays, missing fields, and nulls safely without producing NaN/Infinity.
 * - Latency statistics represent local evaluation measurements and are not performance guarantees.
 */

// Canonical UNSW-NB15 multiclass attack categories
const ATTACK_CATEGORIES = new Set([
  'fuzzers',
  'analysis',
  'backdoors',
  'backdoor',
  'dos',
  'exploits',
  'generic',
  'reconnaissance',
  'shellcode',
  'worms',
]);

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
      otherPercentage: 0,
      categories: {},
      hasData: false,
    };
  }

  // Filter events that strictly represent inference predictions.
  // Quarantines ADVISORY_RECOMMENDATION, MODEL_LOAD, MODEL_VERIFICATION, etc.
  const predictionEvents = events.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    if (e.event_type) {
      return e.event_type === 'PREDICTION';
    }
    // Backward-compatible fallback for synthetic tests without event_type
    return typeof e.prediction === 'string' && e.prediction.trim() !== '';
  });

  if (predictionEvents.length === 0) {
    return {
      total: 0,
      attackCount: 0,
      benignCount: 0,
      otherCount: 0,
      attackPercentage: 0,
      benignPercentage: 0,
      otherPercentage: 0,
      categories: {},
      hasData: false,
    };
  }

  let attackCount = 0;
  let benignCount = 0;
  let otherCount = 0;
  const categories = {};

  for (const ev of predictionEvents) {
    const details = ev.details && typeof ev.details === 'object' ? ev.details : {};

    // 1. Check Stage 1 binary classification from details
    let isAttack = false;
    let isBenign = false;

    const s1Pred = details.stage1_prediction ? String(details.stage1_prediction).trim().toLowerCase() : '';
    if (s1Pred === 'attack') {
      isAttack = true;
    } else if (s1Pred === 'benign' || s1Pred === 'normal') {
      isBenign = true;
    }

    // 2. Check binary classification numeric codes if not yet resolved
    if (!isAttack && !isBenign) {
      const s1Code = details.stage1_code;
      if (s1Code === 1 || s1Code === '1') {
        isAttack = true;
      } else if (s1Code === 0 || s1Code === '0') {
        isBenign = true;
      }
    }

    if (!isAttack && !isBenign) {
      const predCode = details.prediction_code;
      if (predCode === 1 || predCode === '1') {
        isAttack = true;
      } else if (predCode === 0 || predCode === '0') {
        isBenign = true;
      }
    }

    // 3. Check details.prediction if not yet resolved
    if (!isAttack && !isBenign && details.prediction) {
      const dPred = String(details.prediction).trim().toLowerCase();
      if (dPred === 'attack' || ATTACK_CATEGORIES.has(dPred)) {
        isAttack = true;
      } else if (dPred === 'benign' || dPred === 'normal') {
        isBenign = true;
      }
    }

    // 4. Check Stage 2 invocation flag: Stage 2 is only conditionally invoked when Stage 1 flags an attack
    if (!isAttack && !isBenign && details.stage2_invoked === true) {
      isAttack = true;
    }

    // 5. Check top-level prediction string
    if (!isAttack && !isBenign) {
      const p = (ev.prediction || '').trim().toLowerCase();
      if (p === 'attack' || p === '1' || ATTACK_CATEGORIES.has(p)) {
        isAttack = true;
      } else if (p === 'benign' || p === 'normal' || p === '0') {
        isBenign = true;
      }
    }

    // 6. Check final_prediction in details
    if (!isAttack && !isBenign && details.final_prediction) {
      const fp = String(details.final_prediction).trim().toLowerCase();
      if (fp === 'attack' || ATTACK_CATEGORIES.has(fp)) {
        isAttack = true;
      } else if (fp === 'benign' || fp === 'normal') {
        isBenign = true;
      }
    }

    // Tally result
    if (isAttack) {
      attackCount += 1;

      // Extract attack category if available for hierarchical breakdown
      const rawCat = details.stage2_prediction || details.final_prediction || ev.prediction;
      if (rawCat && typeof rawCat === 'string') {
        const catClean = rawCat.trim();
        const catLower = catClean.toLowerCase();
        if (ATTACK_CATEGORIES.has(catLower)) {
          const canonical = catLower === 'dos' ? 'DoS' : catClean.charAt(0).toUpperCase() + catClean.slice(1).toLowerCase();
          categories[canonical] = (categories[canonical] || 0) + 1;
        }
      }
    } else if (isBenign) {
      benignCount += 1;
    } else {
      otherCount += 1;
    }
  }

  const total = predictionEvents.length;
  const attackPercentage = total > 0 ? Number(((attackCount / total) * 100).toFixed(1)) : 0;
  const benignPercentage = total > 0 ? Number(((benignCount / total) * 100).toFixed(1)) : 0;
  const otherPercentage = total > 0 ? Number(((otherCount / total) * 100).toFixed(1)) : 0;

  return {
    total,
    attackCount,
    benignCount,
    otherCount,
    attackPercentage,
    benignPercentage,
    otherPercentage,
    categories,
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
  const initialByStatus = {
    VERIFIED: 0,
    HASH_MISMATCH: 0,
    NOT_REGISTERED: 0,
    BLOCKCHAIN_UNAVAILABLE: 0,
    FILE_NOT_FOUND: 0,
    INVALID_EXPECTED_HASH: 0,
    SYSTEM_ERROR: 0,
    UNVERIFIED: 0,
    OTHER: 0,
  };

  if (!Array.isArray(events) || events.length === 0) {
    return {
      total: 0,
      successCount: 0,
      failureCount: 0,
      byStatus: initialByStatus,
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
      byStatus: initialByStatus,
      hasData: false,
    };
  }

  let successCount = 0;
  let failureCount = 0;
  const byStatus = { ...initialByStatus };

  for (const ev of verificationEvents) {
    const status = (ev.status || '').toUpperCase();
    const eventType = (ev.event_type || '').toUpperCase();
    const vStatus = (ev.verification_status || '').toUpperCase();

    // Determine success or failure
    const isSuccess =
      (eventType === 'MODEL_VERIFICATION' && vStatus === 'VERIFIED') ||
      (status === 'SUCCESS' && vStatus === 'VERIFIED') ||
      (vStatus === 'VERIFIED' && status !== 'FAILURE');

    if (isSuccess) {
      successCount += 1;
    } else {
      failureCount += 1;
    }

    // Tally specific status code
    if (vStatus in byStatus) {
      byStatus[vStatus] += 1;
    } else if (eventType === 'MODEL_VERIFICATION') {
      byStatus.VERIFIED += 1;
    } else if (vStatus) {
      byStatus.OTHER += 1;
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
 * Non-prediction events (e.g. model verifications) are strictly quarantined.
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
    // Strictly isolate prediction latency: if event_type is present, it must be PREDICTION
    if (ev.event_type && ev.event_type !== 'PREDICTION') continue;

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
