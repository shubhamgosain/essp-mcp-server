/**
 * APM-specific schema definitions
 *
 * Authentication comes from environment variables only:
 * - ES_URL: Elasticsearch URL
 * - ES_API_KEY: API key for authentication (recommended)
 * - ES_USERNAME / ES_PASSWORD: Basic auth credentials (alternative)
 */
import { z } from "zod";
import { timeRangeSchema } from "../common/schema.js";
/**
 * APM configuration from environment variables
 */
export const ES_APM_CONFIG = {
    apmIndex: process.env.ES_APM_INDEX || "apm*",
};
/**
 * APM schema - only index pattern exposed to agents
 * Authentication comes from environment variables only.
 */
export const apmAuthSchema = {
    apmIndex: z
        .string()
        .optional()
        .describe("APM index pattern (uses ES_APM_INDEX env var, default: apm-*)"),
};
/**
 * Re-export time range schema for convenience
 */
export { timeRangeSchema };
/**
 * Service filter schema
 */
export const serviceFilterSchema = {
    serviceName: z
        .string()
        .optional()
        .describe("Filter by service name"),
    environment: z
        .string()
        .optional()
        .describe("Filter by environment (e.g., production, staging)"),
};
//# sourceMappingURL=schema.js.map