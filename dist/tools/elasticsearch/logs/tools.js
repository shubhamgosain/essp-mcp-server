/**
 * Elasticsearch Logs MCP Tools
 *
 * Tools for querying log data from Elasticsearch
 */
import { z } from "zod";
import { createLogsClient, ElasticsearchApiError } from "./client.js";
import { logsAuthSchema, timeRangeSchema, dataViewSchema, queryFilterSchema, fieldSelectionSchema, aggregationMetricSchema, timeIntervalSchema, } from "./schema.js";
// ============================================================================
// Parameter Schemas
// ============================================================================
const listDataViewsParams = z.object({
    ...logsAuthSchema,
    filterPattern: z.string().optional().describe("Filter data views by name pattern (case-insensitive)"),
});
const getLogFieldsParams = z.object({
    ...logsAuthSchema,
    ...dataViewSchema,
    fieldType: z.enum(["keyword", "text", "number", "date", "all"]).optional().default("all")
        .describe("Filter fields by type"),
});
const getFieldValuesParams = z.object({
    ...logsAuthSchema,
    ...dataViewSchema,
    ...timeRangeSchema,
    field: z.string().describe("Field name to get unique values for"),
    limit: z.number().optional().default(20).describe("Maximum number of values to return (default: 20)"),
});
const searchLogsParams = z.object({
    ...logsAuthSchema,
    ...dataViewSchema,
    ...timeRangeSchema,
    ...queryFilterSchema,
    ...fieldSelectionSchema,
    limit: z.number().optional().default(100).describe("Maximum number of logs to return (default: 100, max: 500)"),
});
const getLogContextParams = z.object({
    ...logsAuthSchema,
    ...dataViewSchema,
    logId: z.string().describe("Document ID of the target log entry"),
    before: z.number().optional().default(10).describe("Number of logs to fetch before the target (default: 10)"),
    after: z.number().optional().default(10).describe("Number of logs to fetch after the target (default: 10)"),
});
const aggregateLogsParams = z.object({
    ...logsAuthSchema,
    ...dataViewSchema,
    ...timeRangeSchema,
    ...queryFilterSchema,
    groupBy: z.string().describe("Field to group by (e.g., 'level', 'service', 'client_ip')"),
    timeInterval: timeIntervalSchema,
    metric: aggregationMetricSchema,
    metricField: z.string().optional().describe("Field for metric calculation (required if metric is not 'count')"),
    limit: z.number().optional().default(10).describe("Maximum number of groups to return (default: 10, max: 50)"),
});
const comparePeriodsParams = z.object({
    ...logsAuthSchema,
    ...dataViewSchema,
    ...queryFilterSchema,
    groupBy: z.string().describe("Field to group by for comparison"),
    period1Start: z.string().describe("Start time of first period (e.g., 'now-2d')"),
    period1End: z.string().describe("End time of first period (e.g., 'now-1d')"),
    period2Start: z.string().describe("Start time of second period (e.g., 'now-1d')"),
    period2End: z.string().describe("End time of second period (e.g., 'now')"),
    metric: z.enum(["count", "avg", "sum"]).optional().default("count").describe("Metric to compare"),
    metricField: z.string().optional().describe("Field for metric calculation"),
});
// ============================================================================
// Tools
// ============================================================================
export const listDataViewsTool = {
    name: "list_log_data_views",
    description: "List available log data views (index patterns) from Kibana. ONLY use when user explicitly asks about logs, log files, or raw log data. For application errors/performance, use APM tools first.",
    parameters: listDataViewsParams,
    execute: async (args) => {
        try {
            const client = createLogsClient();
            const dataViews = await client.listDataViews(args.filterPattern);
            return JSON.stringify({
                dataViews: dataViews.map((dv) => ({
                    id: dv.id,
                    indexPattern: dv.title,
                    name: dv.name,
                    timeField: dv.timeFieldName,
                })),
                count: dataViews.length,
                filter: args.filterPattern || null,
            }, null, 2);
        }
        catch (error) {
            if (error instanceof ElasticsearchApiError) {
                throw new Error(`Failed to list data views: ${error.message}`);
            }
            throw error;
        }
    },
};
export const getLogFieldsTool = {
    name: "get_log_fields",
    description: "Get available fields for a log index pattern. ONLY use when user explicitly asks about logs. For application errors/performance, use APM tools first.",
    parameters: getLogFieldsParams,
    execute: async (args) => {
        try {
            const client = createLogsClient();
            let fields = await client.getFields(args.indexPattern);
            // Filter by type if specified
            if (args.fieldType && args.fieldType !== "all") {
                const typeMap = {
                    keyword: ["keyword"],
                    text: ["text"],
                    number: ["long", "integer", "short", "byte", "double", "float", "half_float", "scaled_float"],
                    date: ["date"],
                };
                const allowedTypes = typeMap[args.fieldType] || [];
                fields = fields.filter((f) => allowedTypes.includes(f.type));
            }
            return JSON.stringify({
                indexPattern: args.indexPattern,
                fields: fields.map((f) => ({
                    name: f.name,
                    type: f.type,
                    searchable: f.searchable,
                    aggregatable: f.aggregatable,
                })),
                count: fields.length,
            }, null, 2);
        }
        catch (error) {
            if (error instanceof ElasticsearchApiError) {
                throw new Error(`Failed to get fields: ${error.message}`);
            }
            throw error;
        }
    },
};
export const getFieldValuesTool = {
    name: "get_log_field_values",
    description: "Get unique values for a log field. ONLY use when user explicitly asks about logs. For application errors/performance, use APM tools first. Returns top values by document count.",
    parameters: getFieldValuesParams,
    execute: async (args) => {
        try {
            const client = createLogsClient();
            const requestedLimit = args.limit || 20;
            const values = await client.getFieldValues(args.indexPattern, args.field, args.startTime, args.endTime, requestedLimit);
            const mightHaveMore = values.length >= requestedLimit;
            const response = {
                indexPattern: args.indexPattern,
                field: args.field,
                values,
                count: values.length,
                mightHaveMoreValues: mightHaveMore,
                timeRange: {
                    start: args.startTime,
                    end: args.endTime,
                },
            };
            if (mightHaveMore) {
                response.note = `Showing top ${values.length} values by document count. There may be additional values not shown.`;
            }
            return JSON.stringify(response, null, 2);
        }
        catch (error) {
            if (error instanceof ElasticsearchApiError) {
                throw new Error(`Failed to get field values: ${error.message}`);
            }
            throw error;
        }
    },
};
export const searchLogsTool = {
    name: "search_logs",
    description: "Search raw log entries. ONLY use when user explicitly asks about logs, log files, or raw log data. For application errors/performance, use APM tools (get_apm_errors, get_apm_transactions) first. Results capped at 500 - check 'truncated' field.",
    parameters: searchLogsParams,
    execute: async (args) => {
        try {
            const client = createLogsClient();
            const result = await client.searchLogs(args.indexPattern, args.startTime, args.endTime, args.query, args.fields, args.limit);
            const isTruncated = result.total > result.logs.length;
            const response = {
                indexPattern: args.indexPattern,
                query: args.query || null,
                logs: result.logs,
                count: result.logs.length,
                totalMatches: result.total,
                truncated: isTruncated,
                timeRange: {
                    start: args.startTime,
                    end: args.endTime,
                },
            };
            // Add explicit warning when results are truncated
            if (isTruncated) {
                response.warning = `Results truncated: showing ${result.logs.length} of ${result.total} matching logs. For complete analysis, use aggregate_logs tool or narrow your time range/query.`;
            }
            return JSON.stringify(response, null, 2);
        }
        catch (error) {
            if (error instanceof ElasticsearchApiError) {
                throw new Error(`Failed to search logs: ${error.message}`);
            }
            throw error;
        }
    },
};
export const getLogContextTool = {
    name: "get_log_context",
    description: "Get logs before and after a specific log entry. ONLY use when user explicitly asks about logs. For tracing requests, use get_apm_trace instead.",
    parameters: getLogContextParams,
    execute: async (args) => {
        try {
            const client = createLogsClient();
            const context = await client.getLogContext(args.indexPattern, args.logId, args.before, args.after);
            if (!context.target) {
                return JSON.stringify({
                    error: `Log entry with ID '${args.logId}' not found`,
                }, null, 2);
            }
            return JSON.stringify({
                indexPattern: args.indexPattern,
                targetLogId: args.logId,
                before: context.before,
                target: context.target,
                after: context.after,
                totalContext: context.before.length + 1 + context.after.length,
            }, null, 2);
        }
        catch (error) {
            if (error instanceof ElasticsearchApiError) {
                throw new Error(`Failed to get log context: ${error.message}`);
            }
            throw error;
        }
    },
};
export const aggregateLogsTool = {
    name: "aggregate_logs",
    description: "Aggregate raw logs by a field. ONLY use when user explicitly asks about log analytics. For error rates/latency trends, use APM tools (get_apm_error_rate, get_apm_latency) first. Returns top groups (max 50).",
    parameters: aggregateLogsParams,
    execute: async (args) => {
        try {
            // Validate metricField is provided when needed
            if (args.metric !== "count" && !args.metricField) {
                throw new Error(`metricField is required when metric is '${args.metric}'`);
            }
            const client = createLogsClient();
            const buckets = await client.aggregateLogs(args.indexPattern, args.startTime, args.endTime, args.groupBy, args.query, args.timeInterval, args.metric, args.metricField, args.limit);
            const effectiveLimit = Math.min(args.limit || 10, 50);
            const mightHaveMore = buckets.length >= effectiveLimit;
            const response = {
                indexPattern: args.indexPattern,
                groupBy: args.groupBy,
                metric: args.metric,
                metricField: args.metricField || null,
                timeInterval: args.timeInterval || null,
                query: args.query || null,
                buckets,
                bucketCount: buckets.length,
                mightHaveMoreGroups: mightHaveMore,
                timeRange: {
                    start: args.startTime,
                    end: args.endTime,
                },
            };
            if (mightHaveMore) {
                response.note = `Showing top ${buckets.length} groups by ${args.metric}. There may be additional groups not shown. Add filters to narrow results.`;
            }
            return JSON.stringify(response, null, 2);
        }
        catch (error) {
            if (error instanceof ElasticsearchApiError) {
                throw new Error(`Failed to aggregate logs: ${error.message}`);
            }
            throw error;
        }
    },
};
export const comparePeriodsTool = {
    name: "compare_log_periods",
    description: "Compare log metrics between two time periods. ONLY use when user explicitly asks about log trends. For application error rate changes, use APM tools first.",
    parameters: comparePeriodsParams,
    execute: async (args) => {
        try {
            if (args.metric !== "count" && !args.metricField) {
                throw new Error(`metricField is required when metric is '${args.metric}'`);
            }
            const client = createLogsClient();
            const comparison = await client.comparePeriods(args.indexPattern, args.groupBy, args.period1Start, args.period1End, args.period2Start, args.period2End, args.query, args.metric, args.metricField);
            return JSON.stringify({
                indexPattern: args.indexPattern,
                groupBy: args.groupBy,
                metric: args.metric,
                query: args.query || null,
                period1: {
                    timeRange: { start: args.period1Start, end: args.period1End },
                    ...comparison.period1,
                },
                period2: {
                    timeRange: { start: args.period2Start, end: args.period2End },
                    ...comparison.period2,
                },
                change: comparison.change,
            }, null, 2);
        }
        catch (error) {
            if (error instanceof ElasticsearchApiError) {
                throw new Error(`Failed to compare periods: ${error.message}`);
            }
            throw error;
        }
    },
};
/**
 * All Logs tools exported as an array
 */
export const logsTools = [
    listDataViewsTool,
    getLogFieldsTool,
    getFieldValuesTool,
    searchLogsTool,
    getLogContextTool,
    aggregateLogsTool,
    comparePeriodsTool,
];
//# sourceMappingURL=tools.js.map