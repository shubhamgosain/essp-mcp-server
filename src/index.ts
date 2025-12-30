#!/usr/bin/env node

/**
 * Elasticsearch Logs & APM MCP Server
 *
 * A standalone MCP server for Elasticsearch Logs and APM tools.
 * Provides AI assistants with access to log search, APM transactions, errors, and traces.
 */

import { FastMCP } from "fastmcp";

// Library imports
import {
  logger,
  setLoggingMode,
  getLogLevel,
  fastMcpLogger,
} from "./lib/logging.js";

// Tool imports - Elasticsearch APM
import {
  apmHealthCheckTool,
  listApmServicesTool,
  getTransactionsTool,
  getErrorsTool,
  getTraceTool,
  getLatencyStatsTool,
  getErrorRateTool,
  searchApmTool,
} from "./tools/elasticsearch/apm/tools.js";

// Tool imports - Elasticsearch Logs
import {
  listDataViewsTool,
  getLogFieldsTool,
  getFieldValuesTool,
  searchLogsTool,
  getLogContextTool,
  aggregateLogsTool,
  comparePeriodsTool,
} from "./tools/elasticsearch/logs/tools.js";

// ============================================================================
// Constants
// ============================================================================

const VERSION = "1.0.0";
const SERVER_NAME = "Elasticsearch Logs & APM MCP Server";

// ============================================================================
// MCP Server Setup
// ============================================================================

const server = new FastMCP({
  name: SERVER_NAME,
  version: VERSION,
  logger: fastMcpLogger,
});

// Register Elasticsearch APM tools (8 tools)
server.addTool(apmHealthCheckTool);
server.addTool(listApmServicesTool);
server.addTool(getTransactionsTool);
server.addTool(getErrorsTool);
server.addTool(getTraceTool);
server.addTool(getLatencyStatsTool);
server.addTool(getErrorRateTool);
server.addTool(searchApmTool);

// Register Elasticsearch Logs tools (7 tools)
server.addTool(listDataViewsTool);
server.addTool(getLogFieldsTool);
server.addTool(getFieldValuesTool);
server.addTool(searchLogsTool);
server.addTool(getLogContextTool);
server.addTool(aggregateLogsTool);
server.addTool(comparePeriodsTool);

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): { transport: "stdio" | "httpStream"; port: number } {
  const args = process.argv.slice(2);
  let transport: "stdio" | "httpStream" = "stdio";
  let port = 8080;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--transport" || arg === "-t") {
      const value = args[++i];
      if (value === "sse" || value === "http" || value === "httpStream") {
        transport = "httpStream";
      } else if (value === "stdio") {
        transport = "stdio";
      }
    } else if (arg === "--port" || arg === "-p") {
      port = parseInt(args[++i], 10);
    }
  }

  if (process.env.MCP_TRANSPORT) {
    const envTransport = process.env.MCP_TRANSPORT.toLowerCase();
    if (["sse", "http", "httpstream"].includes(envTransport)) {
      transport = "httpStream";
    } else if (envTransport === "stdio") {
      transport = "stdio";
    }
  }
  if (process.env.MCP_PORT) {
    port = parseInt(process.env.MCP_PORT, 10);
  }

  return { transport, port };
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  const { transport, port } = parseArgs();

  setLoggingMode(transport === "stdio");

  logger.info(`Starting ${SERVER_NAME} v${VERSION}`);
  logger.info(`Transport: ${transport}`);
  logger.info(`Log Level: ${getLogLevel()}`);
  logger.info(`Tools: Elasticsearch APM (8) + Logs (7) = 15 total`);

  if (transport === "httpStream") {
    await server.start({
      transportType: "httpStream",
      httpStream: {
        port,
        host: "0.0.0.0",
        stateless: false,
      },
    });

    logger.info(`Server listening on http://0.0.0.0:${port}/mcp`);
  } else {
    await server.start({ transportType: "stdio" });
  }
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

