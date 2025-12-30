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
export declare const ES_BASE_CONFIG: {
    url: string | undefined;
    apiKey: string | undefined;
    username: string | undefined;
    password: string | undefined;
};
/**
 * Base schema for Elasticsearch tools - no auth params exposed to agents
 * Authentication comes from environment variables only.
 */
export declare const elasticsearchBaseAuthSchema: {};
/**
 * Common time range schema for queries
 */
export declare const timeRangeSchema: {
    startTime: z.ZodString;
    endTime: z.ZodDefault<z.ZodOptional<z.ZodString>>;
};
/**
 * Pagination schema
 */
export declare const paginationSchema: {
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
};
//# sourceMappingURL=schema.d.ts.map