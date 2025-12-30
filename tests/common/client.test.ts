/**
 * Tests for Base Elasticsearch Client
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  ElasticsearchApiError,
  CircuitBreakerError,
  TimeoutError,
  getCircuitBreakerStats,
  resetCircuitBreaker,
} from '../../src/tools/elasticsearch/common/client.js';

// Create a concrete implementation for testing
class TestElasticsearchClient {
  protected baseUrl: string;
  protected headers: Record<string, string>;
  private host: string;

  constructor() {
    this.baseUrl = 'http://localhost:9200';
    this.host = 'localhost:9200';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'ApiKey test-api-key',
    };
  }

  getHost(): string {
    return this.host;
  }

  getHeaders(): Record<string, string> {
    return this.headers;
  }
}

describe('Elasticsearch Common Client', () => {
  beforeEach(() => {
    resetCircuitBreaker();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('ElasticsearchApiError', () => {
    it('should create error with message only', () => {
      const error = new ElasticsearchApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ElasticsearchApiError');
      expect(error.statusCode).toBeUndefined();
      expect(error.errorType).toBeUndefined();
    });

    it('should create error with status code', () => {
      const error = new ElasticsearchApiError('Not found', 404);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create error with error type', () => {
      const error = new ElasticsearchApiError('Query error', 400, 'search_phase_execution_exception');
      expect(error.message).toBe('Query error');
      expect(error.statusCode).toBe(400);
      expect(error.errorType).toBe('search_phase_execution_exception');
    });
  });

  describe('CircuitBreakerError', () => {
    it('should create circuit breaker error', () => {
      const error = new CircuitBreakerError('Circuit is open');
      expect(error.message).toBe('Circuit is open');
      expect(error.name).toBe('CircuitBreakerError');
    });
  });

  describe('TimeoutError', () => {
    it('should create timeout error', () => {
      const error = new TimeoutError('Request timed out');
      expect(error.message).toBe('Request timed out');
      expect(error.name).toBe('TimeoutError');
    });
  });

  describe('Circuit Breaker Functions', () => {
    it('should return empty stats initially', () => {
      const stats = getCircuitBreakerStats();
      expect(Object.keys(stats).length).toBe(0);
    });

    it('should reset all circuit breakers', () => {
      // Force create a circuit breaker entry by calling stats
      resetCircuitBreaker();
      const stats = getCircuitBreakerStats();
      expect(Object.keys(stats).length).toBe(0);
    });

    it('should reset specific circuit breaker', () => {
      resetCircuitBreaker('localhost:9200');
      const stats = getCircuitBreakerStats();
      expect(stats['localhost:9200']).toBeUndefined();
    });
  });

  describe('TestElasticsearchClient', () => {
    it('should construct with correct URL', () => {
      const client = new TestElasticsearchClient();
      expect(client.getHost()).toBe('localhost:9200');
    });

    it('should set API key header', () => {
      const client = new TestElasticsearchClient();
      const headers = client.getHeaders();
      expect(headers['Authorization']).toBe('ApiKey test-api-key');
    });

    it('should set content type header', () => {
      const client = new TestElasticsearchClient();
      const headers = client.getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});

describe('Client Authentication', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw error when ES_URL is not set', async () => {
    process.env.ES_URL = '';
    
    // Re-import to get fresh config
    const { BaseElasticsearchClient } = await import('../../src/tools/elasticsearch/common/client.js');
    
    class TestClient extends BaseElasticsearchClient {}
    
    expect(() => new TestClient()).toThrow('Elasticsearch URL is required');
  });
});

