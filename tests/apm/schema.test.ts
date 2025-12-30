/**
 * Tests for APM schema definitions
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  ES_APM_CONFIG,
  apmAuthSchema,
  serviceFilterSchema,
  timeRangeSchema,
} from '../../src/tools/elasticsearch/apm/schema.js';

describe('APM Schema', () => {
  describe('ES_APM_CONFIG', () => {
    it('should read APM index from environment', () => {
      expect(ES_APM_CONFIG.apmIndex).toBe('apm-test*');
    });
  });

  describe('apmAuthSchema', () => {
    const schema = z.object(apmAuthSchema);

    it('should accept empty object', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept custom apmIndex', () => {
      const result = schema.safeParse({ apmIndex: 'custom-apm-*' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.apmIndex).toBe('custom-apm-*');
      }
    });

    it('should make apmIndex optional', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.apmIndex).toBeUndefined();
      }
    });
  });

  describe('serviceFilterSchema', () => {
    const schema = z.object(serviceFilterSchema);

    it('should accept empty object', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept serviceName', () => {
      const result = schema.safeParse({ serviceName: 'my-service' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.serviceName).toBe('my-service');
      }
    });

    it('should accept environment', () => {
      const result = schema.safeParse({ environment: 'production' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.environment).toBe('production');
      }
    });

    it('should accept both serviceName and environment', () => {
      const result = schema.safeParse({ 
        serviceName: 'my-service', 
        environment: 'staging' 
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.serviceName).toBe('my-service');
        expect(result.data.environment).toBe('staging');
      }
    });
  });

  describe('timeRangeSchema (re-exported)', () => {
    const schema = z.object(timeRangeSchema);

    it('should be available from APM schema module', () => {
      const result = schema.safeParse({ startTime: 'now-1h' });
      expect(result.success).toBe(true);
    });
  });
});

