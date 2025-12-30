/**
 * Common schema definitions for Elasticsearch tools
 *
 * Authentication is handled via environment variables:
 * - ES_URL: Elasticsearch URL (required)
 * - ES_API_KEY: API key for authentication (recommended)
 * - ES_USERNAME: Basic auth username (alternative to API key)
 * - ES_PASSWORD: Basic auth password (alternative to API key)
 *
 * Priority: API Key > Basic Auth
 *
 * Agents do not need to provide credentials - they're configured at deployment.
 */
import { z } from "zod";
/**
 * Base Elasticsearch configuration from environment variables
 */
export const ES_BASE_CONFIG = {
    url: process.env.ES_URL,
    apiKey: process.env.ES_API_KEY,
    username: process.env.ES_USERNAME,
    password: process.env.ES_PASSWORD,
};
/**
 * Base schema for Elasticsearch tools - no auth params exposed to agents
 * Authentication comes from environment variables only.
 */
export const elasticsearchBaseAuthSchema = {};
/**
 * Common time range schema for queries
 */
export const timeRangeSchema = {
    startTime: z
        .string()
        .describe("Start time for the query (ISO 8601 format or relative like 'now-1h')"),
    endTime: z
        .string()
        .optional()
        .default("now")
        .describe("End time for the query (default: now)"),
};
/**
 * Pagination schema
 */
export const paginationSchema = {
    limit: z
        .number()
        .optional()
        .default(100)
        .describe("Maximum number of results to return (default: 100)"),
    offset: z
        .number()
        .optional()
        .default(0)
        .describe("Number of results to skip for pagination (default: 0)"),
};
//# sourceMappingURL=schema.js.map