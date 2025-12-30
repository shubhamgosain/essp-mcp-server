/**
 * Tests for common schema definitions
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  ES_BASE_CONFIG,
  timeRangeSchema,
  paginationSchema,
  elasticsearchBaseAuthSchema,
} from '../../src/tools/elasticsearch/common/schema.js';

describe('Common Schema', () => {
  describe('ES_BASE_CONFIG', () => {
    it('should read ES_URL from environment', () => {
      expect(ES_BASE_CONFIG.url).toBe('http://localhost:9200');
    });

    it('should read ES_API_KEY from environment', () => {
      expect(ES_BASE_CONFIG.apiKey).toBe('test-api-key');
    });

    it('should have undefined username when not set', () => {
      // ES_USERNAME is not set in test environment
      expect(ES_BASE_CONFIG.username).toBeUndefined();
    });

    it('should have undefined password when not set', () => {
      // ES_PASSWORD is not set in test environment
      expect(ES_BASE_CONFIG.password).toBeUndefined();
    });
  });

  describe('timeRangeSchema', () => {
    const schema = z.object(timeRangeSchema);

    it('should validate valid time range with startTime only', () => {
      const result = schema.safeParse({ startTime: 'now-1h' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startTime).toBe('now-1h');
        expect(result.data.endTime).toBe('now');
      }
    });

    it('should validate valid time range with both times', () => {
      const result = schema.safeParse({ 
        startTime: '2024-01-01T00:00:00Z', 
        endTime: '2024-01-02T00:00:00Z' 
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startTime).toBe('2024-01-01T00:00:00Z');
        expect(result.data.endTime).toBe('2024-01-02T00:00:00Z');
      }
    });

    it('should fail without startTime', () => {
      const result = schema.safeParse({ endTime: 'now' });
      expect(result.success).toBe(false);
    });

    it('should default endTime to "now"', () => {
      const result = schema.safeParse({ startTime: 'now-24h' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.endTime).toBe('now');
      }
    });
  });

  describe('paginationSchema', () => {
    const schema = z.object(paginationSchema);

    it('should provide default values', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept custom limit', () => {
      const result = schema.safeParse({ limit: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should accept custom offset', () => {
      const result = schema.safeParse({ offset: 100 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(100);
      }
    });

    it('should accept both limit and offset', () => {
      const result = schema.safeParse({ limit: 25, offset: 50 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(50);
      }
    });
  });

  describe('elasticsearchBaseAuthSchema', () => {
    it('should be an empty object (auth from env vars only)', () => {
      expect(elasticsearchBaseAuthSchema).toEqual({});
    });
  });
});

