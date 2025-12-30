/**
 * Winston-based logging for the Elasticsearch MCP Server
 *
 * ELK-friendly JSON format with standard fields:
 * - @timestamp: ISO8601 timestamp (Elasticsearch default)
 * - level: log level (error, warn, info, debug)
 * - message: log message
 *
 * Usage:
 *   import { logger } from "./lib/logging.js";
 *   logger.info("message");
 *   logger.info("message", { key: "value" });
 */
import winston from "winston";
/**
 * Winston logger instance - outputs ELK-friendly JSON
 */
export declare const logger: winston.Logger;
/**
 * Set the logging mode based on transport type
 * @param isStdioMode - If true, all logs go to stderr; otherwise stdout
 */
export declare function setLoggingMode(isStdioMode: boolean): void;
/**
 * Get current log level
 */
export declare function getLogLevel(): string;
/**
 * Parse FastMCP log messages to extract structured data
 * Converts plain text logs into structured JSON format
 */
export declare function parseFastMcpMessage(args: unknown[]): {
    message: string;
    meta?: Record<string, unknown>;
    matched: boolean;
};
/**
 * FastMCP logger adapter - routes FastMCP logs through Winston
 * with structured parsing for better ELK integration
 */
export declare const fastMcpLogger: {
    debug: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
};
//# sourceMappingURL=logging.d.ts.map