/**
 * Logs-specific schema definitions
 *
 * Authentication comes from environment variables only:
 * - ES_URL: Elasticsearch URL
 * - ES_API_KEY: API key for authentication (recommended)
 * - ES_USERNAME / ES_PASSWORD: Basic auth credentials (alternative)
 */
import { z } from "zod";
import { timeRangeSchema, paginationSchema } from "../common/schema.js";
/**
 * Logs configuration from environment variables
 */
export const ES_LOGS_CONFIG = {
    // Use wildcard to match all Kibana indices (supports multi-version clusters)
    kibanaIndex: process.env.ES_KIBANA_INDEX || ".kibana*",
    maxTimeRangeHours: parseInt(process.env.ES_MAX_TIME_RANGE_HOURS || "24", 10),
    maxResults: parseInt(process.env.ES_MAX_RESULTS || "500", 10),
};
/**
 * Logs schema - no auth params exposed to agents
 * Authentication comes from environment variables only.
 */
export const logsAuthSchema = {};
/**
 * Re-export common schemas
 */
export { timeRangeSchema, paginationSchema };
/**
 * Data view/index pattern reference
 */
export const dataViewSchema = {
    indexPattern: z
        .string()
        .describe("Index pattern to query (e.g., 'logs-myapp-*'). Use list_log_data_views to discover available patterns."),
};
/**
 * Query filter schema
 */
export const queryFilterSchema = {
    query: z
        .string()
        .optional()
        .describe("KQL query string to filter logs (e.g., 'level:error AND service:api')"),
};
/**
 * Field selection schema
 */
export const fieldSelectionSchema = {
    fields: z
        .array(z.string())
        .optional()
        .describe("Specific fields to return (default: all fields). Use get_log_fields to discover available fields."),
};
/**
 * Aggregation metric types
 */
export const aggregationMetricSchema = z
    .enum(["count", "avg", "sum", "min", "max"])
    .default("count")
    .describe("Aggregation metric type");
/**
 * Time interval for date histograms
 */
export const timeIntervalSchema = z
    .string()
    .optional()
    .describe("Time bucket interval for time-based breakdown (e.g., '1h', '15m', '1d')");
//# sourceMappingURL=schema.js.map