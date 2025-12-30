/**
 * Tests for Logs schema definitions
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  ES_LOGS_CONFIG,
  logsAuthSchema,
  dataViewSchema,
  queryFilterSchema,
  fieldSelectionSchema,
  aggregationMetricSchema,
  timeIntervalSchema,
  timeRangeSchema,
  paginationSchema,
} from '../../src/tools/elasticsearch/logs/schema.js';

describe('Logs Schema', () => {
  describe('ES_LOGS_CONFIG', () => {
    it('should read kibana index from environment', () => {
      expect(ES_LOGS_CONFIG.kibanaIndex).toBe('.kibana-test*');
    });

    it('should read max time range from environment', () => {
      expect(ES_LOGS_CONFIG.maxTimeRangeHours).toBe(24);
    });

    it('should read max results from environment', () => {
      expect(ES_LOGS_CONFIG.maxResults).toBe(500);
    });
  });

  describe('logsAuthSchema', () => {
    it('should be an empty object (auth from env vars only)', () => {
      expect(logsAuthSchema).toEqual({});
    });
  });

  describe('dataViewSchema', () => {
    const schema = z.object(dataViewSchema);

    it('should require indexPattern', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid index pattern', () => {
      const result = schema.safeParse({ indexPattern: 'logs-myapp-*' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.indexPattern).toBe('logs-myapp-*');
      }
    });
  });

  describe('queryFilterSchema', () => {
    const schema = z.object(queryFilterSchema);

    it('should accept empty object', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept KQL query', () => {
      const result = schema.safeParse({ query: 'level:error AND service:api' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('level:error AND service:api');
      }
    });

    it('should make query optional', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBeUndefined();
      }
    });
  });

  describe('fieldSelectionSchema', () => {
    const schema = z.object(fieldSelectionSchema);

    it('should accept empty object', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept array of field names', () => {
      const result = schema.safeParse({ 
        fields: ['@timestamp', 'message', 'level'] 
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fields).toEqual(['@timestamp', 'message', 'level']);
      }
    });

    it('should make fields optional', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fields).toBeUndefined();
      }
    });
  });

  describe('aggregationMetricSchema', () => {
    it('should accept count metric', () => {
      const result = aggregationMetricSchema.safeParse('count');
      expect(result.success).toBe(true);
    });

    it('should accept avg metric', () => {
      const result = aggregationMetricSchema.safeParse('avg');
      expect(result.success).toBe(true);
    });

    it('should accept sum metric', () => {
      const result = aggregationMetricSchema.safeParse('sum');
      expect(result.success).toBe(true);
    });

    it('should accept min metric', () => {
      const result = aggregationMetricSchema.safeParse('min');
      expect(result.success).toBe(true);
    });

    it('should accept max metric', () => {
      const result = aggregationMetricSchema.safeParse('max');
      expect(result.success).toBe(true);
    });

    it('should reject invalid metric', () => {
      const result = aggregationMetricSchema.safeParse('median');
      expect(result.success).toBe(false);
    });

    it('should default to count', () => {
      const result = aggregationMetricSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('count');
      }
    });
  });

  describe('timeIntervalSchema', () => {
    it('should accept valid intervals', () => {
      expect(timeIntervalSchema.safeParse('1h').success).toBe(true);
      expect(timeIntervalSchema.safeParse('15m').success).toBe(true);
      expect(timeIntervalSchema.safeParse('1d').success).toBe(true);
    });

    it('should be optional', () => {
      const result = timeIntervalSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });
  });

  describe('Re-exported schemas', () => {
    it('should export timeRangeSchema', () => {
      const schema = z.object(timeRangeSchema);
      const result = schema.safeParse({ startTime: 'now-1h' });
      expect(result.success).toBe(true);
    });

    it('should export paginationSchema', () => {
      const schema = z.object(paginationSchema);
      const result = schema.safeParse({ limit: 50 });
      expect(result.success).toBe(true);
    });
  });
});

