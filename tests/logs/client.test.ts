/**
 * Tests for Logs Elasticsearch Client
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  LogsElasticsearchClient,
  TimeRangeExceededError,
  createLogsClient,
  getLogsPoolStats,
  clearLogsPool,
  ElasticsearchApiError,
} from '../../src/tools/elasticsearch/logs/client.js';
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

describe('Logs Elasticsearch Client', () => {
  beforeEach(() => {
    resetCircuitBreaker();
    clearLogsPool();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('TimeRangeExceededError', () => {
    it('should create error with hours info', () => {
      const error = new TimeRangeExceededError(48, 24);
      expect(error.requestedHours).toBe(48);
      expect(error.maxAllowedHours).toBe(24);
      expect(error.message).toContain('48 hours');
      expect(error.message).toContain('24 hours');
      expect(error.name).toBe('TimeRangeExceededError');
    });
  });

  describe('listDataViews', () => {
    it('should return data views from Kibana 8.x format', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 2 },
            hits: [
              {
                _id: 'data-view:logs-view-1',
                _source: {
                  'data-view': {
                    title: 'logs-app-*',
                    name: 'Application Logs',
                    timeFieldName: '@timestamp',
                  },
                },
              },
              {
                _id: 'data-view:logs-view-2',
                _source: {
                  'data-view': {
                    title: 'logs-infra-*',
                    timeFieldName: '@timestamp',
                  },
                },
              },
            ],
          },
        })
      );

      const client = createLogsClient();
      const dataViews = await client.listDataViews();

      expect(dataViews).toHaveLength(2);
      expect(dataViews[0].id).toBe('logs-view-1');
      expect(dataViews[0].title).toBe('logs-app-*');
      expect(dataViews[0].name).toBe('Application Logs');
      expect(dataViews[0].timeFieldName).toBe('@timestamp');
    });

    it('should return data views from Kibana 7.x format', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 1 },
            hits: [
              {
                _id: 'index-pattern:old-logs-*',
                _source: {
                  'index-pattern': {
                    title: 'old-logs-*',
                    timeFieldName: 'timestamp',
                  },
                },
              },
            ],
          },
        })
      );

      const client = createLogsClient();
      const dataViews = await client.listDataViews();

      expect(dataViews).toHaveLength(1);
      expect(dataViews[0].id).toBe('old-logs-*');
      expect(dataViews[0].title).toBe('old-logs-*');
    });

    it('should filter by pattern', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 2 },
            hits: [
              {
                _id: 'dv1',
                _source: { 'data-view': { title: 'logs-app-*' } },
              },
              {
                _id: 'dv2',
                _source: { 'data-view': { title: 'metrics-*' } },
              },
            ],
          },
        })
      );

      const client = createLogsClient();
      const dataViews = await client.listDataViews('logs');

      expect(dataViews).toHaveLength(1);
      expect(dataViews[0].title).toBe('logs-app-*');
    });

    it('should exclude APM and system indices', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 4 },
            hits: [
              { _id: 'dv1', _source: { 'data-view': { title: 'logs-*' } } },
              { _id: 'dv2', _source: { 'data-view': { title: 'apm-*' } } },
              { _id: 'dv3', _source: { 'data-view': { title: '.kibana-event-log' } } },
              { _id: 'dv4', _source: { 'data-view': { title: 'metrics-system-*' } } },
            ],
          },
        })
      );

      const client = createLogsClient();
      const dataViews = await client.listDataViews();

      expect(dataViews).toHaveLength(1);
      expect(dataViews[0].title).toBe('logs-*');
    });
  });

  describe('getFields', () => {
    it('should return field mappings', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          'logs-app-2024.01': {
            mappings: {
              properties: {
                '@timestamp': { type: 'date' },
                message: { type: 'text' },
                level: { type: 'keyword' },
                count: { type: 'long' },
              },
            },
          },
        })
      );

      const client = createLogsClient();
      const fields = await client.getFields('logs-app-*');

      expect(fields).toHaveLength(4);
      
      const timestampField = fields.find((f) => f.name === '@timestamp');
      expect(timestampField?.type).toBe('date');
      expect(timestampField?.aggregatable).toBe(true);

      const messageField = fields.find((f) => f.name === 'message');
      expect(messageField?.type).toBe('text');
      expect(messageField?.searchable).toBe(true);
      expect(messageField?.aggregatable).toBe(false);

      const levelField = fields.find((f) => f.name === 'level');
      expect(levelField?.type).toBe('keyword');
      expect(levelField?.aggregatable).toBe(true);
    });

    it('should handle nested fields', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          'logs-*': {
            mappings: {
              properties: {
                http: {
                  properties: {
                    request: {
                      properties: {
                        method: { type: 'keyword' },
                      },
                    },
                  },
                },
              },
            },
          },
        })
      );

      const client = createLogsClient();
      const fields = await client.getFields('logs-*');

      const methodField = fields.find((f) => f.name === 'http.request.method');
      expect(methodField).toBeDefined();
      expect(methodField?.type).toBe('keyword');
    });
  });

  describe('getFieldValues', () => {
    it('should return unique field values', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            field_values: {
              buckets: [
                { key: 'error' },
                { key: 'warn' },
                { key: 'info' },
              ],
            },
          },
        })
      );

      const client = createLogsClient();
      const values = await client.getFieldValues(
        'logs-*',
        'level',
        'now-1h',
        'now'
      );

      expect(values).toEqual(['error', 'warn', 'info']);
    });

    it('should throw on time range exceeded', async () => {
      const client = createLogsClient();

      await expect(
        client.getFieldValues('logs-*', 'level', 'now-48h', 'now')
      ).rejects.toThrow(TimeRangeExceededError);
    });
  });

  describe('searchLogs', () => {
    it('should return log entries', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 100 },
            hits: [
              {
                _id: 'log-1',
                _index: 'logs-app-2024.01.01',
                _source: {
                  '@timestamp': '2024-01-01T12:00:00Z',
                  message: 'Test log message',
                  level: 'info',
                },
              },
            ],
          },
        })
      );

      const client = createLogsClient();
      const result = await client.searchLogs('logs-*', 'now-1h', 'now');

      expect(result.total).toBe(100);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].id).toBe('log-1');
      expect(result.logs[0].timestamp).toBe('2024-01-01T12:00:00Z');
    });

    it('should filter with KQL query', async () => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        // Verify query_string filter is included
        const hasQueryString = body.query.bool.filter.some(
          (f: object) => 'query_string' in f
        );
        expect(hasQueryString).toBe(true);
        return mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
        });
      });

      const client = createLogsClient();
      await client.searchLogs('logs-*', 'now-1h', 'now', 'level:error');
    });

    it('should respect limit', async () => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        expect(body.size).toBe(50);
        return mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
        });
      });

      const client = createLogsClient();
      await client.searchLogs('logs-*', 'now-1h', 'now', undefined, undefined, 50);
    });

    it('should enforce max results', async () => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        expect(body.size).toBeLessThanOrEqual(500);
        return mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
        });
      });

      const client = createLogsClient();
      await client.searchLogs('logs-*', 'now-1h', 'now', undefined, undefined, 1000);
    });
  });

  describe('getLogContext', () => {
    it('should return surrounding logs', async () => {
      // First call for target log
      // Second call for before logs
      // Third call for after logs
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockSuccessResponse({
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'target-log',
                  _index: 'logs-*',
                  _source: {
                    '@timestamp': '2024-01-01T12:00:00Z',
                    message: 'Target log',
                  },
                },
              ],
            },
          });
        } else if (callCount === 2) {
          return mockSuccessResponse({
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'before-log',
                  _index: 'logs-*',
                  _source: {
                    '@timestamp': '2024-01-01T11:59:59Z',
                    message: 'Before log',
                  },
                },
              ],
            },
          });
        } else {
          return mockSuccessResponse({
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'after-log',
                  _index: 'logs-*',
                  _source: {
                    '@timestamp': '2024-01-01T12:00:01Z',
                    message: 'After log',
                  },
                },
              ],
            },
          });
        }
      });

      const client = createLogsClient();
      const context = await client.getLogContext('logs-*', 'target-log', 1, 1);

      expect(context.target).not.toBeNull();
      expect(context.target?.id).toBe('target-log');
      expect(context.before).toHaveLength(1);
      expect(context.after).toHaveLength(1);
    });

    it('should return null target when not found', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
        })
      );

      const client = createLogsClient();
      const context = await client.getLogContext('logs-*', 'nonexistent');

      expect(context.target).toBeNull();
      expect(context.before).toEqual([]);
      expect(context.after).toEqual([]);
    });
  });

  describe('aggregateLogs', () => {
    it('should return aggregation buckets', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            by_group: {
              buckets: [
                { key: 'error', doc_count: 100 },
                { key: 'warn', doc_count: 50 },
                { key: 'info', doc_count: 200 },
              ],
            },
          },
        })
      );

      const client = createLogsClient();
      const buckets = await client.aggregateLogs(
        'logs-*',
        'now-1h',
        'now',
        'level'
      );

      expect(buckets).toHaveLength(3);
      expect(buckets[0].key).toBe('error');
      expect(buckets[0].doc_count).toBe(100);
    });

    it('should include time histogram when requested', async () => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        const groupAggs = body.aggs.by_group.aggs;
        expect(groupAggs.over_time).toBeDefined();
        expect(groupAggs.over_time.date_histogram.fixed_interval).toBe('1h');
        return mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: { by_group: { buckets: [] } },
        });
      });

      const client = createLogsClient();
      await client.aggregateLogs(
        'logs-*',
        'now-24h',
        'now',
        'level',
        undefined,
        '1h'
      );
    });

    it('should include metric aggregation for non-count metrics', async () => {
      (global.fetch as jest.Mock).mockImplementation((url, options) => {
        const body = JSON.parse(options.body);
        const groupAggs = body.aggs.by_group.aggs;
        expect(groupAggs.metric_value).toBeDefined();
        expect(groupAggs.metric_value.avg.field).toBe('response_time');
        return mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: { by_group: { buckets: [] } },
        });
      });

      const client = createLogsClient();
      await client.aggregateLogs(
        'logs-*',
        'now-24h',
        'now',
        'service',
        undefined,
        undefined,
        'avg',
        'response_time'
      );
    });
  });

  describe('comparePeriods', () => {
    it('should compare two time periods', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            by_group: {
              buckets: [
                { key: 'error', doc_count: 100 },
                { key: 'info', doc_count: 200 },
              ],
            },
          },
        })
      );

      const client = createLogsClient();
      const comparison = await client.comparePeriods(
        'logs-*',
        'level',
        'now-2d',
        'now-1d',
        'now-1d',
        'now'
      );

      expect(comparison.period1.total).toBe(300);
      expect(comparison.period2.total).toBe(300);
      expect(comparison.change.total).toBe('+0%');
    });
  });
});

describe('Logs Connection Pool', () => {
  beforeEach(() => {
    clearLogsPool();
    resetCircuitBreaker();
  });

  it('should start with empty pool', () => {
    const stats = getLogsPoolStats();
    expect(stats.size).toBe(0);
  });

  it('should add client to pool', () => {
    createLogsClient();
    const stats = getLogsPoolStats();
    expect(stats.size).toBe(1);
  });

  it('should reuse cached client', () => {
    const client1 = createLogsClient();
    const client2 = createLogsClient();
    expect(client1).toBe(client2);
    
    const stats = getLogsPoolStats();
    expect(stats.size).toBe(1);
  });

  it('should clear pool', () => {
    createLogsClient();
    
    let stats = getLogsPoolStats();
    expect(stats.size).toBe(1);
    
    clearLogsPool();
    
    stats = getLogsPoolStats();
    expect(stats.size).toBe(0);
  });
});

