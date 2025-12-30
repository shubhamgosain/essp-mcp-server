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
// Log level from environment, default to "info"
const LOG_LEVEL = process.env.LOG_LEVEL?.toLowerCase() || "info";
/**
 * ELK-friendly JSON format
 * Uses @timestamp for Elasticsearch compatibility
 */
const elkFormat = winston.format.combine(winston.format.timestamp(), winston.format.printf((info) => {
    const { level, message, timestamp, ...meta } = info;
    // Build ELK-friendly log object
    const logEntry = {
        "@timestamp": timestamp,
        level,
        message,
    };
    // Flatten metadata into log entry
    if (Object.keys(meta).length > 0) {
        Object.assign(logEntry, meta);
    }
    return JSON.stringify(logEntry);
}));
/**
 * Winston logger instance - outputs ELK-friendly JSON
 */
export const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: elkFormat,
    transports: [
        new winston.transports.Console({
            stderrLevels: ["error", "warn"],
        }),
    ],
});
/**
 * Set the logging mode based on transport type
 * @param isStdioMode - If true, all logs go to stderr; otherwise stdout
 */
export function setLoggingMode(isStdioMode) {
    logger.clear();
    if (isStdioMode) {
        // stdio mode: all logs to stderr (stdout reserved for MCP protocol)
        logger.add(new winston.transports.Console({
            stderrLevels: ["error", "warn", "info", "debug"],
        }));
    }
    else {
        // HTTP mode: errors/warnings to stderr, info/debug to stdout
        logger.add(new winston.transports.Console({
            stderrLevels: ["error", "warn"],
        }));
    }
}
/**
 * Get current log level
 */
export function getLogLevel() {
    return LOG_LEVEL;
}
// ============================================================================
// FastMCP Logger Adapter
// ============================================================================
/**
 * Parse FastMCP log messages to extract structured data
 * Converts plain text logs into structured JSON format
 */
export function parseFastMcpMessage(args) {
    const rawMessage = args.map(String).join(" ");
    // Parse SSE stream messages: "[mcp-proxy] establishing new SSE stream for session ID <uuid>"
    const sseMatch = rawMessage.match(/\[mcp-proxy\]\s*(.+?)\s+for session ID\s+([a-f0-9-]+)/i);
    if (sseMatch) {
        return {
            matched: true,
            message: "fastmcp_event",
            meta: {
                component: "mcp-proxy",
                event: sseMatch[1].trim(),
                session_id: sseMatch[2],
            },
        };
    }
    // Parse general [mcp-proxy] messages
    const proxyMatch = rawMessage.match(/\[mcp-proxy\]\s*(.+)/i);
    if (proxyMatch) {
        return {
            matched: true,
            message: "fastmcp_event",
            meta: {
                component: "mcp-proxy",
                event: proxyMatch[1].trim(),
            },
        };
    }
    // Default: return raw message (not a FastMCP message)
    return { matched: false, message: rawMessage };
}
/**
 * FastMCP logger adapter - routes FastMCP logs through Winston
 * with structured parsing for better ELK integration
 */
export const fastMcpLogger = {
    debug: (...args) => {
        const { message, meta } = parseFastMcpMessage(args);
        logger.debug(message, meta);
    },
    error: (...args) => {
        const { message, meta } = parseFastMcpMessage(args);
        logger.error(message, meta);
    },
    info: (...args) => {
        const { message, meta } = parseFastMcpMessage(args);
        logger.info(message, meta);
    },
    log: (...args) => {
        const { message, meta } = parseFastMcpMessage(args);
        logger.info(message, meta);
    },
    warn: (...args) => {
        const { message, meta } = parseFastMcpMessage(args);
        logger.warn(message, meta);
    },
};
// ============================================================================
// Console Interceptor for FastMCP internal logs
// ============================================================================
/**
 * Intercept console.log to catch FastMCP internal messages (e.g., [mcp-proxy])
 * that bypass the logger parameter and route them through Winston
 */
const originalConsoleLog = console.log;
console.log = (...args) => {
    // Use existing parser to check if this is a FastMCP message
    const parsed = parseFastMcpMessage(args);
    if (parsed.matched) {
        // Route FastMCP messages through Winston
        logger.info(parsed.message, parsed.meta);
        return;
    }
    // Let other console.log calls pass through
    originalConsoleLog.apply(console, args);
};
//# sourceMappingURL=logging.js.map