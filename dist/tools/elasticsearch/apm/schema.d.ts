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
export declare const ES_APM_CONFIG: {
    apmIndex: string;
};
/**
 * APM schema - only index pattern exposed to agents
 * Authentication comes from environment variables only.
 */
export declare const apmAuthSchema: {
    apmIndex: z.ZodOptional<z.ZodString>;
};
/**
 * Re-export time range schema for convenience
 */
export { timeRangeSchema };
/**
 * Service filter schema
 */
export declare const serviceFilterSchema: {
    serviceName: z.ZodOptional<z.ZodString>;
    environment: z.ZodOptional<z.ZodString>;
};
//# sourceMappingURL=schema.d.ts.map