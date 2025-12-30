/**
 * Elasticsearch APM MCP Tools
 * 
 * Tools for querying APM data from Elasticsearch
 */

import { z } from "zod";
import { createApmClient, ElasticsearchApiError } from "./client.js";
import { apmAuthSchema, timeRangeSchema } from "./schema.js";

const VERSION = "1.0.0";

// ============================================================================
// Parameter Schemas
// ============================================================================

const apmHealthCheckParams = z.object(apmAuthSchema);

const listApmServicesParams = z.object({
  ...apmAuthSchema,
  ...timeRangeSchema,
});

const getTransactionsParams = z.object({
  ...apmAuthSchema,
  ...timeRangeSchema,
  serviceName: z.string().describe("Service name to query transactions for"),
  transactionType: z.string().optional().describe("Filter by transaction type (e.g., 'request', 'page-load')"),
  limit: z.number().optional().default(100).describe("Maximum number of transactions to return (default: 100)"),
});

const getErrorsParams = z.object({
  ...apmAuthSchema,
  ...timeRangeSchema,
  serviceName: z.string().describe("Service name to query errors for"),
  limit: z.number().optional().default(100).describe("Maximum number of errors to return (default: 100)"),
});

const getTraceParams = z.object({
  ...apmAuthSchema,
  traceId: z.string().describe("The trace ID to retrieve"),
});

const getLatencyStatsParams = z.object({
  ...apmAuthSchema,
  ...timeRangeSchema,
  serviceName: z.string().describe("Service name to query latency for"),
  transactionType: z.string().optional().describe("Filter by transaction type"),
});

const getErrorRateParams = z.object({
  ...apmAuthSchema,
  ...timeRangeSchema,
  serviceName: z.string().describe("Service name to query error rate for"),
});

const searchApmParams = z.object({
  ...apmAuthSchema,
  query: z.string().describe("Elasticsearch query DSL as JSON string"),
});

// ============================================================================
// Tools
// ============================================================================

export const apmHealthCheckTool = {
  name: "apm_health_check",
  description: "Test connectivity to Elasticsearch APM cluster",
  parameters: apmHealthCheckParams,
  execute: async (args: z.infer<typeof apmHealthCheckParams>) => {
    const timestamp = new Date().toISOString();

    try {
      const client = createApmClient(args);
      const connectionTest = await client.testConnection();

      if (connectionTest.connected) {
        return JSON.stringify({
          status: "healthy",
          service: "essp-mcp-server",
          component: "elasticsearch-apm",
          version: VERSION,
          timestamp,
          clusterName: connectionTest.clusterName,
        }, null, 2);
      }

      return JSON.stringify({
        status: "unhealthy",
        service: "essp-mcp-server",
        component: "elasticsearch-apm",
        version: VERSION,
        timestamp,
        error: connectionTest.error,
      }, null, 2);
    } catch (error) {
      return JSON.stringify({
        status: "unhealthy",
        service: "essp-mcp-server",
        component: "elasticsearch-apm",
        version: VERSION,
        timestamp,
        error: error instanceof Error ? error.message : String(error),
      }, null, 2);
    }
  },
};

export const listApmServicesTool = {
  name: "list_apm_services",
  description: "List all APM services that have reported data in the given time range",
  parameters: listApmServicesParams,
  execute: async (args: z.infer<typeof listApmServicesParams>) => {
    try {
      const client = createApmClient(args);
      const services = await client.getServices(args.startTime, args.endTime);

      return JSON.stringify({
        services,
        count: services.length,
        timeRange: {
          start: args.startTime,
          end: args.endTime,
        },
      }, null, 2);
    } catch (error) {
      if (error instanceof ElasticsearchApiError) {
        throw new Error(`Failed to list APM services: ${error.message}`);
      }
      throw error;
    }
  },
};

export const getTransactionsTool = {
  name: "get_apm_transactions",
  description: "Get recent transactions for a service with timing and result information",
  parameters: getTransactionsParams,
  execute: async (args: z.infer<typeof getTransactionsParams>) => {
    try {
      const client = createApmClient(args);
      const transactions = await client.getTransactions(
        args.serviceName,
        args.startTime,
        args.endTime,
        args.transactionType,
        args.limit
      );

      return JSON.stringify({
        serviceName: args.serviceName,
        transactions,
        count: transactions.length,
        timeRange: {
          start: args.startTime,
          end: args.endTime,
        },
      }, null, 2);
    } catch (error) {
      if (error instanceof ElasticsearchApiError) {
        throw new Error(`Failed to get transactions: ${error.message}`);
      }
      throw error;
    }
  },
};

export const getErrorsTool = {
  name: "get_apm_errors",
  description: "Get recent errors for a service with exception details",
  parameters: getErrorsParams,
  execute: async (args: z.infer<typeof getErrorsParams>) => {
    try {
      const client = createApmClient(args);
      const errors = await client.getErrors(
        args.serviceName,
        args.startTime,
        args.endTime,
        args.limit
      );

      return JSON.stringify({
        serviceName: args.serviceName,
        errors,
        count: errors.length,
        timeRange: {
          start: args.startTime,
          end: args.endTime,
        },
      }, null, 2);
    } catch (error) {
      if (error instanceof ElasticsearchApiError) {
        throw new Error(`Failed to get errors: ${error.message}`);
      }
      throw error;
    }
  },
};

export const getTraceTool = {
  name: "get_apm_trace",
  description: "Get all spans for a specific trace ID to analyze request flow across services",
  parameters: getTraceParams,
  execute: async (args: z.infer<typeof getTraceParams>) => {
    try {
      const client = createApmClient(args);
      const spans = await client.getTrace(args.traceId);

      return JSON.stringify({
        traceId: args.traceId,
        spans,
        spanCount: spans.length,
        services: [...new Set(spans.map((s) => s.serviceName))],
      }, null, 2);
    } catch (error) {
      if (error instanceof ElasticsearchApiError) {
        throw new Error(`Failed to get trace: ${error.message}`);
      }
      throw error;
    }
  },
};

export const getLatencyStatsTool = {
  name: "get_apm_latency",
  description: "Get latency statistics (avg, p50, p95, p99, max) for a service",
  parameters: getLatencyStatsParams,
  execute: async (args: z.infer<typeof getLatencyStatsParams>) => {
    try {
      const client = createApmClient(args);
      const stats = await client.getLatencyStats(
        args.serviceName,
        args.startTime,
        args.endTime,
        args.transactionType
      );

      return JSON.stringify({
        serviceName: args.serviceName,
        latencyMs: {
          avg: Math.round(stats.avg * 100) / 100,
          p50: Math.round(stats.p50 * 100) / 100,
          p95: Math.round(stats.p95 * 100) / 100,
          p99: Math.round(stats.p99 * 100) / 100,
          max: Math.round(stats.max * 100) / 100,
        },
        transactionCount: stats.count,
        timeRange: {
          start: args.startTime,
          end: args.endTime,
        },
      }, null, 2);
    } catch (error) {
      if (error instanceof ElasticsearchApiError) {
        throw new Error(`Failed to get latency stats: ${error.message}`);
      }
      throw error;
    }
  },
};

export const getErrorRateTool = {
  name: "get_apm_error_rate",
  description: "Get error rate percentage for a service",
  parameters: getErrorRateParams,
  execute: async (args: z.infer<typeof getErrorRateParams>) => {
    try {
      const client = createApmClient(args);
      const stats = await client.getErrorRate(
        args.serviceName,
        args.startTime,
        args.endTime
      );

      return JSON.stringify({
        serviceName: args.serviceName,
        totalTransactions: stats.totalTransactions,
        failedTransactions: stats.failedTransactions,
        errorRatePercent: Math.round(stats.errorRate * 100) / 100,
        timeRange: {
          start: args.startTime,
          end: args.endTime,
        },
      }, null, 2);
    } catch (error) {
      if (error instanceof ElasticsearchApiError) {
        throw new Error(`Failed to get error rate: ${error.message}`);
      }
      throw error;
    }
  },
};

export const searchApmTool = {
  name: "search_apm",
  description: "Execute a raw Elasticsearch query against APM indices for advanced queries",
  parameters: searchApmParams,
  execute: async (args: z.infer<typeof searchApmParams>) => {
    try {
      const client = createApmClient(args);
      const queryObj = JSON.parse(args.query);
      const results = await client.searchApm(queryObj);

      return JSON.stringify({
        totalHits: results.hits.total.value,
        hits: results.hits.hits.map((h) => ({
          index: h._index,
          id: h._id,
          source: h._source,
        })),
        aggregations: results.aggregations,
      }, null, 2);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid query JSON: ${error.message}`);
      }
      if (error instanceof ElasticsearchApiError) {
        throw new Error(`APM search failed: ${error.message}`);
      }
      throw error;
    }
  },
};

/**
 * All APM tools exported as an array
 */
export const apmTools = [
  apmHealthCheckTool,
  listApmServicesTool,
  getTransactionsTool,
  getErrorsTool,
  getTraceTool,
  getLatencyStatsTool,
  getErrorRateTool,
  searchApmTool,
];

