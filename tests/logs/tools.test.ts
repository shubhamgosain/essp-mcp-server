/**
 * Tests for Logs MCP Tools
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  listDataViewsTool,
  getLogFieldsTool,
  getFieldValuesTool,
  searchLogsTool,
  getLogContextTool,
  aggregateLogsTool,
  comparePeriodsTool,
  logsTools,
} from '../../src/tools/elasticsearch/logs/tools.js';
import { clearLogsPool } from '../../src/tools/elasticsearch/logs/client.js';
import { resetCircuitBreaker } from '../../src/tools/elasticsearch/common/client.js';

// Mock response helpers
function mockSuccessResponse(data: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

describe('Logs Tools', () => {
  beforeEach(() => {
    resetCircuitBreaker();
    clearLogsPool();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('logsTools array', () => {
    it('should contain 7 tools', () => {
      expect(logsTools).toHaveLength(7);
    });

    it('should have all expected tool names', () => {
      const toolNames = logsTools.map((t) => t.name);
      expect(toolNames).toContain('list_log_data_views');
      expect(toolNames).toContain('get_log_fields');
      expect(toolNames).toContain('get_log_field_values');
      expect(toolNames).toContain('search_logs');
      expect(toolNames).toContain('get_log_context');
      expect(toolNames).toContain('aggregate_logs');
      expect(toolNames).toContain('compare_log_periods');
    });
  });

  describe('listDataViewsTool', () => {
    it('should have correct name and description', () => {
      expect(listDataViewsTool.name).toBe('list_log_data_views');
      expect(listDataViewsTool.description).toContain('data views');
    });

    it('should return data views', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 2 },
            hits: [
              {
                _id: 'dv1',
                _source: {
                  'data-view': {
                    title: 'logs-app-*',
                    name: 'App Logs',
                    timeFieldName: '@timestamp',
                  },
                },
              },
              {
                _id: 'dv2',
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

      const result = await listDataViewsTool.execute({});
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(2);
      expect(parsed.dataViews[0].indexPattern).toBe('logs-app-*');
      expect(parsed.dataViews[0].name).toBe('App Logs');
    });

    it('should filter by pattern', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 2 },
            hits: [
              { _id: 'dv1', _source: { 'data-view': { title: 'logs-app-*' } } },
              { _id: 'dv2', _source: { 'data-view': { title: 'metrics-*' } } },
            ],
          },
        })
      );

      const result = await listDataViewsTool.execute({ filterPattern: 'logs' });
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(1);
      expect(parsed.filter).toBe('logs');
    });
  });

  describe('getLogFieldsTool', () => {
    it('should have correct name', () => {
      expect(getLogFieldsTool.name).toBe('get_log_fields');
    });

    it('should return fields', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          'logs-*': {
            mappings: {
              properties: {
                '@timestamp': { type: 'date' },
                message: { type: 'text' },
                level: { type: 'keyword' },
              },
            },
          },
        })
      );

      const result = await getLogFieldsTool.execute({ indexPattern: 'logs-*' });
      const parsed = JSON.parse(result);

      expect(parsed.indexPattern).toBe('logs-*');
      expect(parsed.count).toBe(3);
      expect(parsed.fields.some((f: { name: string }) => f.name === '@timestamp')).toBe(true);
    });

    it('should filter by field type', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          'logs-*': {
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

      const result = await getLogFieldsTool.execute({
        indexPattern: 'logs-*',
        fieldType: 'keyword',
      });
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(1);
      expect(parsed.fields[0].name).toBe('level');
    });
  });

  describe('getFieldValuesTool', () => {
    it('should have correct name', () => {
      expect(getFieldValuesTool.name).toBe('get_log_field_values');
    });

    it('should return field values', async () => {
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

      const result = await getFieldValuesTool.execute({
        indexPattern: 'logs-*',
        field: 'level',
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.values).toEqual(['error', 'warn', 'info']);
      expect(parsed.count).toBe(3);
    });

    it('should indicate when more values might exist', async () => {
      const values = Array.from({ length: 20 }, (_, i) => ({ key: `value-${i}` }));
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: { field_values: { buckets: values } },
        })
      );

      const result = await getFieldValuesTool.execute({
        indexPattern: 'logs-*',
        field: 'field',
        startTime: 'now-1h',
        endTime: 'now',
        limit: 20,
      });
      const parsed = JSON.parse(result);

      expect(parsed.mightHaveMoreValues).toBe(true);
      expect(parsed.note).toContain('additional values');
    });
  });

  describe('searchLogsTool', () => {
    it('should have correct name', () => {
      expect(searchLogsTool.name).toBe('search_logs');
    });

    it('should return logs', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 50 },
            hits: [
              {
                _id: 'log-1',
                _index: 'logs-2024.01.01',
                _source: {
                  '@timestamp': '2024-01-01T12:00:00Z',
                  message: 'Test message',
                },
              },
            ],
          },
        })
      );

      const result = await searchLogsTool.execute({
        indexPattern: 'logs-*',
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.count).toBe(1);
      expect(parsed.totalMatches).toBe(50);
      expect(parsed.logs[0].id).toBe('log-1');
    });

    it('should include truncation warning', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: {
            total: { value: 1000 },
            hits: Array.from({ length: 100 }, (_, i) => ({
              _id: `log-${i}`,
              _index: 'logs-*',
              _source: { '@timestamp': '2024-01-01T12:00:00Z' },
            })),
          },
        })
      );

      const result = await searchLogsTool.execute({
        indexPattern: 'logs-*',
        startTime: 'now-1h',
        endTime: 'now',
      });
      const parsed = JSON.parse(result);

      expect(parsed.truncated).toBe(true);
      expect(parsed.warning).toContain('truncated');
    });
  });

  describe('getLogContextTool', () => {
    it('should have correct name', () => {
      expect(getLogContextTool.name).toBe('get_log_context');
    });

    it('should return context', async () => {
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockSuccessResponse({
            hits: {
              total: { value: 1 },
              hits: [
                {
                  _id: 'target',
                  _index: 'logs-*',
                  _source: { '@timestamp': '2024-01-01T12:00:00Z' },
                },
              ],
            },
          });
        }
        return mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
        });
      });

      const result = await getLogContextTool.execute({
        indexPattern: 'logs-*',
        logId: 'target',
      });
      const parsed = JSON.parse(result);

      expect(parsed.targetLogId).toBe('target');
      expect(parsed.target).not.toBeNull();
    });

    it('should return error when log not found', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
        })
      );

      const result = await getLogContextTool.execute({
        indexPattern: 'logs-*',
        logId: 'nonexistent',
      });
      const parsed = JSON.parse(result);

      expect(parsed.error).toContain('not found');
    });
  });

  describe('aggregateLogsTool', () => {
    it('should have correct name', () => {
      expect(aggregateLogsTool.name).toBe('aggregate_logs');
    });

    it('should return aggregation buckets', async () => {
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

      const result = await aggregateLogsTool.execute({
        indexPattern: 'logs-*',
        startTime: 'now-1h',
        endTime: 'now',
        groupBy: 'level',
        metric: 'count',
      });
      const parsed = JSON.parse(result);

      expect(parsed.groupBy).toBe('level');
      expect(parsed.bucketCount).toBe(2);
      expect(parsed.buckets[0].key).toBe('error');
    });

    it('should require metricField for non-count metrics', async () => {
      await expect(
        aggregateLogsTool.execute({
          indexPattern: 'logs-*',
          startTime: 'now-1h',
          endTime: 'now',
          groupBy: 'service',
          metric: 'avg',
          // metricField missing
        })
      ).rejects.toThrow('metricField is required');
    });
  });

  describe('comparePeriodsTool', () => {
    it('should have correct name', () => {
      expect(comparePeriodsTool.name).toBe('compare_log_periods');
    });

    it('should compare periods', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        mockSuccessResponse({
          hits: { total: { value: 0 }, hits: [] },
          aggregations: {
            by_group: {
              buckets: [
                { key: 'error', doc_count: 50 },
                { key: 'info', doc_count: 100 },
              ],
            },
          },
        })
      );

      const result = await comparePeriodsTool.execute({
        indexPattern: 'logs-*',
        groupBy: 'level',
        period1Start: 'now-2d',
        period1End: 'now-1d',
        period2Start: 'now-1d',
        period2End: 'now',
        metric: 'count',
      });
      const parsed = JSON.parse(result);

      expect(parsed.period1.timeRange.start).toBe('now-2d');
      expect(parsed.period2.timeRange.start).toBe('now-1d');
      expect(parsed.change).toBeDefined();
    });

    it('should require metricField for non-count metrics', async () => {
      await expect(
        comparePeriodsTool.execute({
          indexPattern: 'logs-*',
          groupBy: 'service',
          period1Start: 'now-2d',
          period1End: 'now-1d',
          period2Start: 'now-1d',
          period2End: 'now',
          metric: 'avg',
          // metricField missing
        })
      ).rejects.toThrow('metricField is required');
    });
  });
});

