/**
 * Tests for APM MCP Tools
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  apmHealthCheckTool,
  listApmServicesTool,
  getTransactionsTool,
  getErrorsTool,
  getTraceTool,
  getLatencyStatsTool,
  getErrorRateTool,
  searchApmTool,
  apmTools,
} from '../../src/tools/elasticsearch/apm/tools.js';
import { clearApmPool } from '../../src/tools/elasticsearch/apm/client.js';
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

describe('APM Tools', () => {
  beforeEach(() => {
    resetCircuitBreaker();
    clearApmPool();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('apmTools array', () => {
    it('should contain 8 tools', () => {
      expect(apmTools).toHaveLength(8);
    });

    it('should have all expected tool names', () => {
      const toolNames = apmTools.map((t) => t.name);
      expect(toolNames).toContain('apm_health_check');
      expect(toolNames).toContain('list_apm_services');
      expect(toolNames).toContain('get_apm_transactions');
      expect(toolNames).toContain('get_apm_errors');
      expect(toolNames).toContain('get_apm_trace');
      expect(toolNames).toContain('get_apm_latency');
      expect(toolNames).toContain('get_apm_error_rate');
      expect(toolNames).toContain('search_apm');
    });
  });

  describe('apmHealthCheckTool', () => {
    it('should have correct name and description', () => {
      expect(apmHealthCheckTool.name).toBe('apm_health_check');
      expect(apmHealthCheckTool.description).toContain('connectivity');
    });

    it('should return healthy status on success', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          cluster_name: 'test-cluster',
          version: { number: '8.0.0' },
        })
      );

      const result = await apmHealthCheckTool.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe('healthy');
      expect(parsed.component).toBe('elasticsearch-apm');
      expect(parsed.clusterName).toBe('test-cluster');
    });

    it('should return unhealthy status on failure', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockErrorResponse(500, 'Connection failed')
      );

      const result = await apmHealthCheckTool.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.status).toBe('unhealthy');
      expect(parsed.error).toContain('Connection failed');
    });
  });

  describe('listApmServicesTool', () => {
    it('should have correct name', () => {
      expect(listApmServicesTool.name).toBe('list_apm_services');
    });

    it('should return services list', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            services: {
              buckets: [
                { key: 'service-a' },
                { key: 'service-b' },
              ],
            },
          },
        })
      );

      const result = await listApmServicesTool.execute({
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.services).toEqual(['service-a', 'service-b']);
      expect(parsed.count).toBe(2);
      expect(parsed.timeRange.start).toBe('now-1h');
    });
  });

  describe('getTransactionsTool', () => {
    it('should have correct name', () => {
      expect(getTransactionsTool.name).toBe('get_apm_transactions');
    });

    it('should return transactions', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 1 },
            hits: [
              {
                _source: {
                  transaction: {
                    id: 'tx-1',
                    name: 'GET /api',
                    type: 'request',
                    result: 'HTTP 2xx',
                    duration: { us: 100000 },
                  },
                  trace: { id: 'trace-1' },
                  '@timestamp': '2024-01-01T12:00:00Z',
                },
              },
            ],
          },
        })
      );

      const result = await getTransactionsTool.execute({
        serviceName: 'my-service',
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.serviceName).toBe('my-service');
      expect(parsed.transactions).toHaveLength(1);
      expect(parsed.transactions[0].name).toBe('GET /api');
    });
  });

  describe('getErrorsTool', () => {
    it('should have correct name', () => {
      expect(getErrorsTool.name).toBe('get_apm_errors');
    });

    it('should return errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 1 },
            hits: [
              {
                _source: {
                  error: {
                    id: 'err-1',
                    culprit: 'handler',
                    exception: {
                      message: 'Error occurred',
                      type: 'RuntimeError',
                    },
                  },
                  trace: { id: 'trace-1' },
                  '@timestamp': '2024-01-01T12:00:00Z',
                },
              },
            ],
          },
        })
      );

      const result = await getErrorsTool.execute({
        serviceName: 'my-service',
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.serviceName).toBe('my-service');
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0].message).toBe('Error occurred');
    });
  });

  describe('getTraceTool', () => {
    it('should have correct name', () => {
      expect(getTraceTool.name).toBe('get_apm_trace');
    });

    it('should return trace spans', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 2 },
            hits: [
              {
                _source: {
                  span: { id: 's1', name: 'span1', type: 'db', duration: { us: 1000 } },
                  service: { name: 'service-a' },
                  '@timestamp': '2024-01-01T12:00:00Z',
                },
              },
              {
                _source: {
                  span: { id: 's2', name: 'span2', type: 'http', duration: { us: 2000 } },
                  service: { name: 'service-b' },
                  '@timestamp': '2024-01-01T12:00:01Z',
                },
              },
            ],
          },
        })
      );

      const result = await getTraceTool.execute({ traceId: 'trace-123' });
      const parsed = JSON.parse(result);

      expect(parsed.traceId).toBe('trace-123');
      expect(parsed.spanCount).toBe(2);
      expect(parsed.services).toContain('service-a');
      expect(parsed.services).toContain('service-b');
    });
  });

  describe('getLatencyStatsTool', () => {
    it('should have correct name', () => {
      expect(getLatencyStatsTool.name).toBe('get_apm_latency');
    });

    it('should return latency statistics', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            latency_stats: { count: 100, avg: 150000, max: 500000 },
            latency_percentiles: {
              values: { '50.0': 100000, '95.0': 300000, '99.0': 450000 },
            },
          },
        })
      );

      const result = await getLatencyStatsTool.execute({
        serviceName: 'my-service',
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.serviceName).toBe('my-service');
      expect(parsed.latencyMs.avg).toBe(150);
      expect(parsed.latencyMs.p95).toBe(300);
      expect(parsed.transactionCount).toBe(100);
    });
  });

  describe('getErrorRateTool', () => {
    it('should have correct name', () => {
      expect(getErrorRateTool.name).toBe('get_apm_error_rate');
    });

    it('should return error rate', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            total: { value: 1000 },
            failures: { doc_count: 25 },
          },
        })
      );

      const result = await getErrorRateTool.execute({
        serviceName: 'my-service',
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.serviceName).toBe('my-service');
      expect(parsed.totalTransactions).toBe(1000);
      expect(parsed.failedTransactions).toBe(25);
      expect(parsed.errorRatePercent).toBe(2.5);
    });
  });

  describe('searchApmTool', () => {
    it('should have correct name', () => {
      expect(searchApmTool.name).toBe('search_apm');
    });

    it('should execute raw query', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 5 },
            hits: [
              { _index: 'apm-test', _id: '1', _source: { field: 'value' } },
            ],
          },
        })
      );

      const result = await searchApmTool.execute({
        query: JSON.stringify({ query: { match_all: {} } }),
      });
      const parsed = JSON.parse(result);

      expect(parsed.totalHits).toBe(5);
      expect(parsed.hits).toHaveLength(1);
    });

    it('should throw on invalid JSON', async () => {
      await expect(
        searchApmTool.execute({ query: 'invalid json' })
      ).rejects.toThrow('Invalid query JSON');
    });
  });
});

