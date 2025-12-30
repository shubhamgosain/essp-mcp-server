# Elasticsearch Logs & APM MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to Elasticsearch Logs and APM (Application Performance Monitoring) data.

## Features

- **Elasticsearch APM**: Query APM data for transactions, errors, traces, and latency statistics
- **Elasticsearch Logs**: Search and aggregate logs with time range limits, circuit breaker, and query timeout
- **Structured Logging**: ELK-friendly JSON logs with Winston
- **Connection Pooling**: Efficient connection reuse with LRU eviction
- **Circuit Breaker**: Automatic protection against cascading failures
- **Request Timeout**: Configurable timeout for all Elasticsearch requests

## Quick Start

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build
npm start
```

## Usage

### Basic Usage (stdio mode - for IDE integrations)

```bash
# Default: stdio transport
npx tsx src/index.ts

# With debug logging
LOG_LEVEL=debug npx tsx src/index.ts
```

### HTTP Mode (for web integrations)

```bash
# HTTP Stream on port 8080
MCP_TRANSPORT=httpStream MCP_PORT=8080 npx tsx src/index.ts
```

### Full Example

```bash
ES_URL="https://elasticsearch.example.com:9243" \
ES_API_KEY="your-api-key" \
ES_APM_INDEX="apm*" \
LOG_LEVEL=info \
npx tsx src/index.ts
```

---

## Environment Variables

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_TRANSPORT` | Transport mode: `httpStream` or `stdio` | `stdio` |
| `MCP_PORT` | Port for HTTP server (only used with httpStream) | `8080` |
| `LOG_LEVEL` | Log level: `debug`, `info`, `warn`, `error` | `info` |

### Elasticsearch Connection

| Variable | Description | Default |
|----------|-------------|---------|
| `ES_URL` | Elasticsearch URL (required) | - |
| `ES_API_KEY` | API key for authentication (recommended) | - |
| `ES_USERNAME` | Username for basic auth (alternative to API key) | - |
| `ES_PASSWORD` | Password for basic auth (alternative to API key) | - |

**Authentication Priority:** API Key > Basic Auth

### Elasticsearch APM Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ES_APM_INDEX` | APM index pattern | `apm*` |

### Elasticsearch Logs Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ES_KIBANA_INDEX` | Kibana index for data views | `.kibana*` |
| `ES_MAX_TIME_RANGE_HOURS` | Max time range for log search | `24` |
| `ES_MAX_RESULTS` | Max documents per search | `500` |

### Resilience Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ES_REQUEST_TIMEOUT_MS` | Request timeout in milliseconds | `30000` |
| `ES_CIRCUIT_FAILURE_THRESHOLD` | Failures to open circuit | `5` |
| `ES_CIRCUIT_RECOVERY_MS` | Wait before recovery attempt | `30000` |
| `ES_CIRCUIT_SUCCESS_THRESHOLD` | Successes to close circuit | `2` |

### Connection Pool Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_CLIENT_POOL_SIZE` | Maximum pooled connections | `50` |
| `CACHE_TTL_MINUTES` | Connection TTL in minutes | `30` |

---

## Available Tools

### Elasticsearch APM Tools (8 tools)

| Tool | Description |
|------|-------------|
| `apm_health_check` | Test Elasticsearch APM connectivity |
| `list_apm_services` | List APM services in time range |
| `get_apm_transactions` | Get service transactions |
| `get_apm_errors` | Get service errors |
| `get_apm_trace` | Get trace by ID |
| `get_apm_latency` | Get latency statistics (avg, p50, p95, p99, max) |
| `get_apm_error_rate` | Get error rate percentage |
| `search_apm` | Execute raw Elasticsearch query against APM indices |

### Elasticsearch Logs Tools (7 tools)

| Tool | Description |
|------|-------------|
| `list_log_data_views` | Discover available indices from Kibana |
| `get_log_fields` | Get field schema for an index |
| `get_log_field_values` | Get unique values for a field |
| `search_logs` | Search logs with KQL filtering |
| `get_log_context` | Get surrounding logs for debugging |
| `aggregate_logs` | Group by + time histogram analytics |
| `compare_log_periods` | Period-over-period comparison |

---

## Protections

### Time Range Limits

Log searches are limited to prevent expensive queries:
- **Search/field values**: Max 24 hours (configurable via `ES_MAX_TIME_RANGE_HOURS`)
- **Aggregations**: Max 7x the search limit (168 hours by default)

### Circuit Breaker

Automatically opens when Elasticsearch is unhealthy:
- Opens after 5 consecutive failures
- Waits 30 seconds before attempting recovery
- Closes after 2 successful requests in half-open state

### Request Timeout

All requests have a configurable timeout (default 30 seconds) to prevent hanging queries.

### Result Limits

Search results are capped at 500 documents to prevent excessive memory usage.

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Clean build artifacts
npm run clean
```

---

## MCP Configuration

### Cursor IDE

Add to your `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "elasticsearch": {
      "command": "node",
      "args": ["/path/to/essp-mcp-server/dist/index.js"],
      "env": {
        "ES_URL": "https://elasticsearch.example.com:9243",
        "ES_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "elasticsearch": {
      "command": "node",
      "args": ["/path/to/essp-mcp-server/dist/index.js"],
      "env": {
        "ES_URL": "https://elasticsearch.example.com:9243",
        "ES_USERNAME": "admin",
        "ES_PASSWORD": "secret"
      }
    }
  }
}
```

---

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
ENV MCP_PORT=8080
ENV MCP_TRANSPORT=httpStream
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t essp-mcp-server .
docker run -p 8080:8080 \
  -e ES_URL="https://elasticsearch.example.com:9243" \
  -e ES_API_KEY="your-api-key" \
  essp-mcp-server
```

---

## License

MIT

