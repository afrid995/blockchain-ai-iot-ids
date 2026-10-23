import { describe, it, expect } from 'vitest';
import {
  aggregatePredictions,
  aggregateVerifications,
  calculateLatencyStats,
  aggregateEventTypes,
  getAnalyticsSummary,
} from '../utils/analytics';

describe('Analytics Utility Functions (Phase 5B)', () => {
  const sampleEvents = [
    {
      event_id: 'e1',
      event_type: 'PREDICTION',
      prediction: 'Attack',
      inference_latency_ms: 38.5,
      status: 'SUCCESS',
    },
    {
      event_id: 'e2',
      event_type: 'PREDICTION',
      prediction: 'Benign',
      inference_latency_ms: 22.1,
      status: 'SUCCESS',
    },
    {
      event_id: 'e3',
      event_type: 'PREDICTION',
      prediction: 'Attack',
      inference_latency_ms: 45.4,
      status: 'SUCCESS',
    },
    {
      event_id: 'e4',
      event_type: 'MODEL_VERIFICATION',
      verification_status: 'VERIFIED',
      status: 'SUCCESS',
    },
    {
      event_id: 'e5',
      event_type: 'MODEL_VERIFICATION_FAILURE',
      verification_status: 'HASH_MISMATCH',
      status: 'FAILURE',
    },
    {
      event_id: 'e6',
      event_type: 'MODEL_LOAD_BLOCKED',
      status: 'BLOCKED',
    },
  ];

  describe('1. aggregatePredictions', () => {
    it('correctly aggregates predictions with counts and percentages', () => {
      const result = aggregatePredictions(sampleEvents);
      expect(result.hasData).toBe(true);
      expect(result.total).toBe(3);
      expect(result.attackCount).toBe(2);
      expect(result.benignCount).toBe(1);
      expect(result.otherCount).toBe(0);
      expect(result.attackPercentage).toBe(66.7);
      expect(result.benignPercentage).toBe(33.3);
    });

    it('handles only attack predictions', () => {
      const attacksOnly = [
        { event_type: 'PREDICTION', prediction: 'Attack' },
        { event_type: 'PREDICTION', prediction: 'attack' },
      ];
      const result = aggregatePredictions(attacksOnly);
      expect(result.total).toBe(2);
      expect(result.attackCount).toBe(2);
      expect(result.benignCount).toBe(0);
      expect(result.attackPercentage).toBe(100.0);
      expect(result.benignPercentage).toBe(0.0);
    });

    it('handles only benign predictions', () => {
      const benignOnly = [{ event_type: 'PREDICTION', prediction: 'Benign' }];
      const result = aggregatePredictions(benignOnly);
      expect(result.total).toBe(1);
      expect(result.attackCount).toBe(0);
      expect(result.benignCount).toBe(1);
      expect(result.attackPercentage).toBe(0.0);
      expect(result.benignPercentage).toBe(100.0);
    });

    it('handles empty or non-prediction events safely', () => {
      expect(aggregatePredictions([])).toEqual({
        total: 0,
        attackCount: 0,
        benignCount: 0,
        otherCount: 0,
        attackPercentage: 0,
        benignPercentage: 0,
        hasData: false,
      });

      expect(aggregatePredictions(null)).toEqual({
        total: 0,
        attackCount: 0,
        benignCount: 0,
        otherCount: 0,
        attackPercentage: 0,
        benignPercentage: 0,
        hasData: false,
      });

      const nonPredictions = [{ event_type: 'MODEL_LOAD' }];
      expect(aggregatePredictions(nonPredictions).hasData).toBe(false);
    });
  });

  describe('2. aggregateVerifications', () => {
    it('aggregates verification outcomes and by-status counts', () => {
      const result = aggregateVerifications(sampleEvents);
      expect(result.hasData).toBe(true);
      expect(result.total).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.byStatus.VERIFIED).toBe(1);
      expect(result.byStatus.HASH_MISMATCH).toBe(1);
      expect(result.byStatus.NOT_REGISTERED).toBe(0);
    });

    it('handles multiple statuses correctly', () => {
      const statusEvents = [
        { event_type: 'MODEL_VERIFICATION', verification_status: 'VERIFIED', status: 'SUCCESS' },
        { event_type: 'MODEL_VERIFICATION_FAILURE', verification_status: 'HASH_MISMATCH', status: 'FAILURE' },
        { event_type: 'MODEL_VERIFICATION_FAILURE', verification_status: 'NOT_REGISTERED', status: 'FAILURE' },
        { event_type: 'MODEL_VERIFICATION_FAILURE', verification_status: 'BLOCKCHAIN_UNAVAILABLE', status: 'FAILURE' },
      ];
      const result = aggregateVerifications(statusEvents);
      expect(result.total).toBe(4);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(3);
      expect(result.byStatus.VERIFIED).toBe(1);
      expect(result.byStatus.HASH_MISMATCH).toBe(1);
      expect(result.byStatus.NOT_REGISTERED).toBe(1);
      expect(result.byStatus.BLOCKCHAIN_UNAVAILABLE).toBe(1);
    });

    it('handles empty or non-verification arrays safely', () => {
      const result = aggregateVerifications([]);
      expect(result.hasData).toBe(false);
      expect(result.total).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.byStatus.VERIFIED).toBe(0);
    });
  });

  describe('3. calculateLatencyStats', () => {
    it('calculates mean, median, min, and max for latency values', () => {
      // Latencies: 22.1, 38.5, 45.4
      const result = calculateLatencyStats(sampleEvents);
      expect(result.hasData).toBe(true);
      expect(result.count).toBe(3);
      expect(result.min).toBe(22.1);
      expect(result.max).toBe(45.4);
      expect(result.mean).toBe(35.33); // (22.1 + 38.5 + 45.4) / 3 = 106.0 / 3 = 35.3333...
      expect(result.median).toBe(38.5);
    });

    it('calculates median for even number of measurements', () => {
      const evenEvents = [
        { inference_latency_ms: 10.0 },
        { inference_latency_ms: 20.0 },
        { inference_latency_ms: 30.0 },
        { inference_latency_ms: 40.0 },
      ];
      const result = calculateLatencyStats(evenEvents);
      expect(result.count).toBe(4);
      expect(result.median).toBe(25.0);
      expect(result.mean).toBe(25.0);
      expect(result.min).toBe(10.0);
      expect(result.max).toBe(40.0);
    });

    it('handles single latency measurement', () => {
      const single = [{ inference_latency_ms: 15.5 }];
      const result = calculateLatencyStats(single);
      expect(result.count).toBe(1);
      expect(result.mean).toBe(15.5);
      expect(result.median).toBe(15.5);
      expect(result.min).toBe(15.5);
      expect(result.max).toBe(15.5);
    });

    it('safely ignores null, undefined, negative, or NaN latency values', () => {
      const messyEvents = [
        { inference_latency_ms: null },
        { inference_latency_ms: undefined },
        { inference_latency_ms: -5.0 },
        { inference_latency_ms: 'invalid' },
        { inference_latency_ms: 50.0 },
      ];
      const result = calculateLatencyStats(messyEvents);
      expect(result.hasData).toBe(true);
      expect(result.count).toBe(1);
      expect(result.mean).toBe(50.0);
      expect(result.median).toBe(50.0);
    });

    it('returns empty structure when no latency values exist', () => {
      const noLatency = [{ event_type: 'MODEL_LOAD' }];
      const result = calculateLatencyStats(noLatency);
      expect(result.hasData).toBe(false);
      expect(result.count).toBe(0);
      expect(result.mean).toBeNull();
      expect(result.median).toBeNull();
      expect(result.min).toBeNull();
      expect(result.max).toBeNull();
    });
  });

  describe('4. aggregateEventTypes', () => {
    it('aggregates event type frequencies and percentages sorted descending', () => {
      const result = aggregateEventTypes(sampleEvents);
      expect(result.hasData).toBe(true);
      expect(result.total).toBe(6);
      expect(result.types[0].type).toBe('PREDICTION');
      expect(result.types[0].count).toBe(3);
      expect(result.types[0].percentage).toBe(50.0);
    });

    it('handles empty event list safely', () => {
      const result = aggregateEventTypes([]);
      expect(result.hasData).toBe(false);
      expect(result.total).toBe(0);
      expect(result.types).toEqual([]);
    });
  });

  describe('5. getAnalyticsSummary', () => {
    it('bundles all aggregations in a unified summary structure', () => {
      const summary = getAnalyticsSummary(sampleEvents);
      expect(summary.loadedEventsCount).toBe(6);
      expect(summary.predictions.total).toBe(3);
      expect(summary.verifications.total).toBe(2);
      expect(summary.latency.count).toBe(3);
      expect(summary.eventTypes.types.length).toBeGreaterThan(0);
    });

    it('returns structured empty summary when given empty input', () => {
      const summary = getAnalyticsSummary([]);
      expect(summary.loadedEventsCount).toBe(0);
      expect(summary.predictions.hasData).toBe(false);
      expect(summary.verifications.hasData).toBe(false);
      expect(summary.latency.hasData).toBe(false);
      expect(summary.eventTypes.hasData).toBe(false);
    });
  });
});
