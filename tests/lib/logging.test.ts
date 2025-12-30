/**
 * Tests for logging utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  logger,
  setLoggingMode,
  getLogLevel,
  parseFastMcpMessage,
  fastMcpLogger,
} from '../../src/lib/logging.js';

describe('Logging Utilities', () => {
  describe('logger', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('getLogLevel', () => {
    it('should return log level from environment', () => {
      // LOG_LEVEL is set to 'error' in setup.ts
      expect(getLogLevel()).toBe('error');
    });
  });

  describe('setLoggingMode', () => {
    it('should set stdio mode', () => {
      // Should not throw
      expect(() => setLoggingMode(true)).not.toThrow();
    });

    it('should set http mode', () => {
      // Should not throw
      expect(() => setLoggingMode(false)).not.toThrow();
    });
  });

  describe('parseFastMcpMessage', () => {
    it('should parse SSE stream messages', () => {
      const result = parseFastMcpMessage([
        '[mcp-proxy] establishing new SSE stream for session ID abc-123-def',
      ]);

      expect(result.matched).toBe(true);
      expect(result.message).toBe('fastmcp_event');
      expect(result.meta).toEqual({
        component: 'mcp-proxy',
        event: 'establishing new SSE stream',
        session_id: 'abc-123-def',
      });
    });

    it('should parse general mcp-proxy messages', () => {
      const result = parseFastMcpMessage([
        '[mcp-proxy] connection established',
      ]);

      expect(result.matched).toBe(true);
      expect(result.message).toBe('fastmcp_event');
      expect(result.meta).toEqual({
        component: 'mcp-proxy',
        event: 'connection established',
      });
    });

    it('should return unmatched for non-fastmcp messages', () => {
      const result = parseFastMcpMessage(['Regular log message']);

      expect(result.matched).toBe(false);
      expect(result.message).toBe('Regular log message');
      expect(result.meta).toBeUndefined();
    });

    it('should handle multiple arguments', () => {
      const result = parseFastMcpMessage(['Part 1', 'Part 2', 'Part 3']);

      expect(result.matched).toBe(false);
      expect(result.message).toBe('Part 1 Part 2 Part 3');
    });

    it('should handle non-string arguments', () => {
      const result = parseFastMcpMessage([123, { key: 'value' }, true]);

      expect(result.matched).toBe(false);
      expect(result.message).toContain('123');
    });
  });

  describe('fastMcpLogger', () => {
    it('should have debug method', () => {
      expect(typeof fastMcpLogger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof fastMcpLogger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof fastMcpLogger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof fastMcpLogger.error).toBe('function');
    });

    it('should have log method', () => {
      expect(typeof fastMcpLogger.log).toBe('function');
    });

    it('should not throw when calling methods', () => {
      expect(() => fastMcpLogger.debug('test')).not.toThrow();
      expect(() => fastMcpLogger.info('test')).not.toThrow();
      expect(() => fastMcpLogger.warn('test')).not.toThrow();
      expect(() => fastMcpLogger.error('test')).not.toThrow();
      expect(() => fastMcpLogger.log('test')).not.toThrow();
    });
  });
});

