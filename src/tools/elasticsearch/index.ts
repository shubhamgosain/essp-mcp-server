/**
 * Elasticsearch Tools Module
 * 
 * Exports all Elasticsearch-related MCP tools (APM and Logs)
 */

// Common utilities
export * from "./common/index.js";

// APM tools
export * from "./apm/index.js";

// Logs tools  
export * from "./logs/index.js";

// Combined tool exports for convenience
import { apmTools } from "./apm/tools.js";
import { logsTools } from "./logs/tools.js";

/**
 * All Elasticsearch tools (APM + Logs)
 */
export const elasticsearchTools = [...apmTools, ...logsTools];

/**
 * APM tools only
 */
export { apmTools };

/**
 * Logs tools only
 */
export { logsTools };

