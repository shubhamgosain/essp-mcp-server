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
export declare const ES_LOGS_CONFIG: {
    kibanaIndex: string;
    maxTimeRangeHours: number;
    maxResults: number;
};
/**
 * Logs schema - no auth params exposed to agents
 * Authentication comes from environment variables only.
 */
export declare const logsAuthSchema: {};
/**
 * Re-export common schemas
 */
export { timeRangeSchema, paginationSchema };
/**
 * Data view/index pattern reference
 */
export declare const dataViewSchema: {
    indexPattern: z.ZodString;
};
/**
 * Query filter schema
 */
export declare const queryFilterSchema: {
    query: z.ZodOptional<z.ZodString>;
};
/**
 * Field selection schema
 */
export declare const fieldSelectionSchema: {
    fields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
};
/**
 * Aggregation metric types
 */
export declare const aggregationMetricSchema: z.ZodDefault<z.ZodEnum<["count", "avg", "sum", "min", "max"]>>;
/**
 * Time interval for date histograms
 */
export declare const timeIntervalSchema: z.ZodOptional<z.ZodString>;
//# sourceMappingURL=schema.d.ts.map