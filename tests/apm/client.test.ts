/**
 * Tests for APM Elasticsearch Client
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  ApmElasticsearchClient,
  createApmClient,
  getApmPoolStats,
  clearApmPool,
  ElasticsearchApiError,
} from '../../src/tools/elasticsearch/apm/client.js';
import { resetCircuitBreaker } from '../../src/tools/elasticsearch/common/client.js';

// Mock response helpers
function mockSuccessResponse(data: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockErrorResponse(status: number, message: string) {
  return Promise.resolve({
    ok: false,
    status,
    text: () => Promise.resolve(JSON.stringify({ error: { reason: message } })),
  });
}

describe('APM Elasticsearch Client', () => {
  beforeEach(() => {
    resetCircuitBreaker();
    clearApmPool();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('ApmElasticsearchClient', () => {
    it('should create client with default index', () => {
      const client = new ApmElasticsearchClient();
      expect(client.getIndex()).toBe('apm-test*');
    });

    it('should create client with custom index', () => {
      const client = new ApmElasticsearchClient({ apmIndex: 'custom-apm-*' });
      expect(client.getIndex()).toBe('custom-apm-*');
    });
  });

  describe('testConnection', () => {
    it('should return connected status on success', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          cluster_name: 'test-cluster',
          version: { number: '8.0.0' },
        })
      );

      const client = createApmClient({});
      const result = await client.testConnection();

      expect(result.connected).toBe(true);
      expect(result.clusterName).toBe('test-cluster');
    });

    it('should return disconnected status on failure', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockErrorResponse(500, 'Connection refused')
      );

      const client = createApmClient({});
      const result = await client.testConnection();

      expect(result.connected).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });

  describe('getServices', () => {
    it('should return list of services', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            services: {
              buckets: [
                { key: 'service-a' },
                { key: 'service-b' },
                { key: 'service-c' },
              ],
            },
          },
        })
      );

      const client = createApmClient({});
      const services = await client.getServices('now-1h', 'now');

      expect(services).toEqual(['service-a', 'service-b', 'service-c']);
    });

    it('should return empty array when no services', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            services: { buckets: [] },
          },
        })
      );

      const client = createApmClient({});
      const services = await client.getServices('now-1h', 'now');

      expect(services).toEqual([]);
    });
  });

  describe('getTransactions', () => {
    it('should return transactions with all fields', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 1 },
            hits: [
              {
                _source: {
                  transaction: {
                    id: 'tx-123',
                    name: 'GET /api/users',
                    type: 'request',
                    result: 'HTTP 2xx',
                    duration: { us: 150000 },
                  },
                  trace: { id: 'trace-456' },
                  '@timestamp': '2024-01-01T12:00:00Z',
                },
              },
            ],
          },
        })
      );

      const client = createApmClient({});
      const transactions = await client.getTransactions('my-service', 'now-1h', 'now');

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        transactionId: 'tx-123',
        traceId: 'trace-456',
        name: 'GET /api/users',
        type: 'request',
        duration: 150, // Converted from microseconds to milliseconds
        result: 'HTTP 2xx',
        timestamp: '2024-01-01T12:00:00Z',
      });
    });

    it('should filter by transaction type', async () => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        // Verify transaction type filter is included
        const hasTypeFilter = body.query.bool.filter.some(
          (f: object) => 'term' in f && 'transaction.type' in (f as Record<string, Record<string, string>>).term
        );
        expect(hasTypeFilter).toBe(true);
        return mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
        });
      });

      const client = createApmClient({});
      await client.getTransactions('my-service', 'now-1h', 'now', 'request');
    });
  });

  describe('getErrors', () => {
    it('should return errors with exception details', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 1 },
            hits: [
              {
                _source: {
                  error: {
                    id: 'err-123',
                    culprit: 'userController.getUser',
                    exception: {
                      message: 'User not found',
                      type: 'NotFoundException',
                    },
                  },
                  trace: { id: 'trace-789' },
                  '@timestamp': '2024-01-01T12:00:00Z',
                },
              },
            ],
          },
        })
      );

      const client = createApmClient({});
      const errors = await client.getErrors('my-service', 'now-1h', 'now');

      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        errorId: 'err-123',
        traceId: 'trace-789',
        message: 'User not found',
        type: 'NotFoundException',
        culprit: 'userController.getUser',
        timestamp: '2024-01-01T12:00:00Z',
      });
    });
  });

  describe('getTrace', () => {
    it('should return trace spans', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 2 },
            hits: [
              {
                _source: {
                  span: {
                    id: 'span-1',
                    name: 'db query',
                    type: 'db',
                    subtype: 'postgresql',
                    duration: { us: 5000 },
                  },
                  parent: { id: 'span-0' },
                  service: { name: 'my-service' },
                  '@timestamp': '2024-01-01T12:00:00.100Z',
                },
              },
              {
                _source: {
                  transaction: {
                    id: 'span-0',
                    name: 'GET /api/users',
                    type: 'request',
                    duration: { us: 10000 },
                  },
                  service: { name: 'my-service' },
                  '@timestamp': '2024-01-01T12:00:00.000Z',
                },
              },
            ],
          },
        })
      );

      const client = createApmClient({});
      const spans = await client.getTrace('trace-123');

      expect(spans).toHaveLength(2);
      expect(spans[0].spanId).toBe('span-1');
      expect(spans[0].parentId).toBe('span-0');
      expect(spans[0].subtype).toBe('postgresql');
      expect(spans[1].spanId).toBe('span-0');
      expect(spans[1].parentId).toBeUndefined();
    });
  });

  describe('getLatencyStats', () => {
    it('should return latency statistics', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            latency_stats: {
              count: 100,
              avg: 150000, // 150ms in microseconds
              max: 500000, // 500ms
            },
            latency_percentiles: {
              values: {
                '50.0': 100000, // p50 = 100ms
                '95.0': 300000, // p95 = 300ms
                '99.0': 450000, // p99 = 450ms
              },
            },
          },
        })
      );

      const client = createApmClient({});
      const stats = await client.getLatencyStats('my-service', 'now-1h', 'now');

      expect(stats.count).toBe(100);
      expect(stats.avg).toBe(150); // Converted to ms
      expect(stats.p50).toBe(100);
      expect(stats.p95).toBe(300);
      expect(stats.p99).toBe(450);
      expect(stats.max).toBe(500);
    });
  });

  describe('getErrorRate', () => {
    it('should calculate error rate percentage', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            total: { value: 1000 },
            failures: { doc_count: 50 },
          },
        })
      );

      const client = createApmClient({});
      const stats = await client.getErrorRate('my-service', 'now-1h', 'now');

      expect(stats.totalTransactions).toBe(1000);
      expect(stats.failedTransactions).toBe(50);
      expect(stats.errorRate).toBe(5); // 5%
    });

    it('should return 0 error rate when no transactions', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            total: { value: 0 },
            failures: { doc_count: 0 },
          },
        })
      );

      const client = createApmClient({});
      const stats = await client.getErrorRate('my-service', 'now-1h', 'now');

      expect(stats.errorRate).toBe(0);
    });
  });

  describe('searchApm', () => {
    it('should execute custom query', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 5 },
            hits: [
              { _index: 'apm-test', _id: 'doc-1', _source: { field: 'value' } },
            ],
          },
          aggregations: { count: { value: 5 } },
        })
      );

      const client = createApmClient({});
      const result = await client.searchApm({ query: { match_all: {} } });

      expect(result.hits.total.value).toBe(5);
      expect(result.hits.hits).toHaveLength(1);
      expect(result.aggregations).toBeDefined();
    });
  });
});

describe('Connection Pool', () => {
  beforeEach(() => {
    clearApmPool();
    resetCircuitBreaker();
  });

  it('should start with empty pool', () => {
    const stats = getApmPoolStats();
    expect(stats.size).toBe(0);
  });

  it('should add client to pool', () => {
    createApmClient({});
    const stats = getApmPoolStats();
    expect(stats.size).toBe(1);
  });

  it('should reuse cached client', () => {
    const client1 = createApmClient({});
    const client2 = createApmClient({});
    expect(client1).toBe(client2);
    
    const stats = getApmPoolStats();
    expect(stats.size).toBe(1);
  });

  it('should create separate clients for different indexes', () => {
    const client1 = createApmClient({ apmIndex: 'apm-a-*' });
    const client2 = createApmClient({ apmIndex: 'apm-b-*' });
    expect(client1).not.toBe(client2);
    
    const stats = getApmPoolStats();
    expect(stats.size).toBe(2);
  });

  it('should clear pool', () => {
    createApmClient({});
    createApmClient({ apmIndex: 'other-*' });
    
    let stats = getApmPoolStats();
    expect(stats.size).toBe(2);
    
    clearApmPool();
    
    stats = getApmPoolStats();
    expect(stats.size).toBe(0);
  });
});

