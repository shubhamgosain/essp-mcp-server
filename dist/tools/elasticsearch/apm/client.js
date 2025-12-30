/**
 * Elasticsearch APM Client
 *
 * Handles API calls to Elasticsearch for APM data.
 *
 * Authentication comes from environment variables only:
 * - ES_URL: Elasticsearch URL (required)
 * - ES_API_KEY: API key for authentication (recommended)
 * - ES_USERNAME / ES_PASSWORD: Basic auth credentials (alternative)
 */
import { BaseElasticsearchClient, ElasticsearchApiError } from "../common/client.js";
import { ES_APM_CONFIG } from "./schema.js";
import { logger } from "../../../lib/logging.js";
export { ElasticsearchApiError };
export class ApmElasticsearchClient extends BaseElasticsearchClient {
    apmIndex;
    constructor(params = {}) {
        super();
        this.apmIndex = params.apmIndex || ES_APM_CONFIG.apmIndex;
    }
    /**
     * Search APM data
     */
    async searchApm(query) {
        logger.debug("elasticsearch_apm_query", {
            es_apm_index: this.apmIndex,
            query_size: query.size,
        });
        return this.search(this.apmIndex, query);
    }
    /**
     * Get the current APM index pattern
     */
    getIndex() {
        return this.apmIndex;
    }
    /**
     * Get APM services
     */
    async getServices(startTime, endTime = "now") {
        const query = {
            size: 0,
            query: {
                bool: {
                    filter: [
                        { range: { "@timestamp": { gte: startTime, lte: endTime } } },
                    ],
                },
            },
            aggs: {
                services: {
                    terms: {
                        field: "service.name",
                        size: 1000,
                    },
                },
            },
        };
        const response = await this.searchApm(query);
        const buckets = response.aggregations?.services?.buckets || [];
        return buckets.map((b) => b.key);
    }
    /**
     * Get service transactions
     */
    async getTransactions(serviceName, startTime, endTime = "now", transactionType, limit = 100) {
        const filters = [
            { range: { "@timestamp": { gte: startTime, lte: endTime } } },
            { term: { "service.name": serviceName } },
            { term: { "processor.event": "transaction" } },
        ];
        if (transactionType) {
            filters.push({ term: { "transaction.type": transactionType } });
        }
        const query = {
            size: limit,
            query: {
                bool: { filter: filters },
            },
            sort: [{ "@timestamp": "desc" }],
            _source: [
                "transaction.id",
                "trace.id",
                "transaction.name",
                "transaction.type",
                "transaction.duration.us",
                "transaction.result",
                "@timestamp",
            ],
        };
        const response = await this.searchApm(query);
        return response.hits.hits.map((hit) => {
            const src = hit._source;
            const transaction = src.transaction;
            const trace = src.trace;
            const duration = transaction?.duration;
            return {
                transactionId: String(transaction?.id || ""),
                traceId: String(trace?.id || ""),
                name: String(transaction?.name || ""),
                type: String(transaction?.type || ""),
                duration: Number(duration?.us || 0) / 1000,
                result: String(transaction?.result || ""),
                timestamp: String(src["@timestamp"] || ""),
            };
        });
    }
    /**
     * Get service errors
     */
    async getErrors(serviceName, startTime, endTime = "now", limit = 100) {
        const query = {
            size: limit,
            query: {
                bool: {
                    filter: [
                        { range: { "@timestamp": { gte: startTime, lte: endTime } } },
                        { term: { "service.name": serviceName } },
                        { term: { "processor.event": "error" } },
                    ],
                },
            },
            sort: [{ "@timestamp": "desc" }],
            _source: [
                "error.id",
                "trace.id",
                "error.exception.message",
                "error.exception.type",
                "error.culprit",
                "@timestamp",
            ],
        };
        const response = await this.searchApm(query);
        return response.hits.hits.map((hit) => {
            const src = hit._source;
            const error = src.error;
            const trace = src.trace;
            const exception = error?.exception;
            return {
                errorId: String(error?.id || ""),
                traceId: String(trace?.id || ""),
                message: String(exception?.message || ""),
                type: String(exception?.type || ""),
                culprit: String(error?.culprit || ""),
                timestamp: String(src["@timestamp"] || ""),
            };
        });
    }
    /**
     * Get trace by ID
     */
    async getTrace(traceId) {
        const query = {
            size: 1000,
            query: {
                bool: {
                    filter: [
                        { term: { "trace.id": traceId } },
                    ],
                },
            },
            sort: [{ "@timestamp": "asc" }],
            _source: [
                "span.id",
                "parent.id",
                "span.name",
                "transaction.name",
                "span.type",
                "transaction.type",
                "span.subtype",
                "span.duration.us",
                "transaction.duration.us",
                "@timestamp",
                "service.name",
                "processor.event",
            ],
        };
        const response = await this.searchApm(query);
        return response.hits.hits.map((hit) => {
            const src = hit._source;
            const span = src.span;
            const transaction = src.transaction;
            const parent = src.parent;
            const service = src.service;
            const spanDuration = span?.duration;
            const txDuration = transaction?.duration;
            return {
                spanId: String(span?.id || transaction?.id || ""),
                parentId: parent?.id ? String(parent.id) : undefined,
                name: String(span?.name || transaction?.name || ""),
                type: String(span?.type || transaction?.type || ""),
                subtype: span?.subtype ? String(span.subtype) : undefined,
                duration: Number(spanDuration?.us || txDuration?.us || 0) / 1000,
                timestamp: String(src["@timestamp"] || ""),
                serviceName: String(service?.name || ""),
            };
        });
    }
    /**
     * Get service latency statistics
     */
    async getLatencyStats(serviceName, startTime, endTime = "now", transactionType) {
        const filters = [
            { range: { "@timestamp": { gte: startTime, lte: endTime } } },
            { term: { "service.name": serviceName } },
            { term: { "processor.event": "transaction" } },
        ];
        if (transactionType) {
            filters.push({ term: { "transaction.type": transactionType } });
        }
        const query = {
            size: 0,
            query: {
                bool: { filter: filters },
            },
            aggs: {
                latency_stats: {
                    stats: { field: "transaction.duration.us" },
                },
                latency_percentiles: {
                    percentiles: {
                        field: "transaction.duration.us",
                        percents: [50, 95, 99],
                    },
                },
            },
        };
        const response = await this.searchApm(query);
        const stats = response.aggregations?.latency_stats;
        const percentiles = response.aggregations?.latency_percentiles;
        return {
            avg: (stats?.avg || 0) / 1000,
            p50: (percentiles?.values?.["50.0"] || 0) / 1000,
            p95: (percentiles?.values?.["95.0"] || 0) / 1000,
            p99: (percentiles?.values?.["99.0"] || 0) / 1000,
            max: (stats?.max || 0) / 1000,
            count: stats?.count || 0,
        };
    }
    /**
     * Get error rate for a service
     */
    async getErrorRate(serviceName, startTime, endTime = "now") {
        const query = {
            size: 0,
            query: {
                bool: {
                    filter: [
                        { range: { "@timestamp": { gte: startTime, lte: endTime } } },
                        { term: { "service.name": serviceName } },
                        { term: { "processor.event": "transaction" } },
                    ],
                },
            },
            aggs: {
                total: { value_count: { field: "transaction.id" } },
                failures: {
                    filter: {
                        bool: {
                            should: [
                                { term: { "transaction.result": "HTTP 5xx" } },
                                { range: { "http.response.status_code": { gte: 500 } } },
                                { term: { "event.outcome": "failure" } },
                            ],
                        },
                    },
                },
            },
        };
        const response = await this.searchApm(query);
        const total = response.aggregations?.total?.value || 0;
        const failures = response.aggregations?.failures?.doc_count || 0;
        return {
            totalTransactions: total,
            failedTransactions: failures,
            errorRate: total > 0 ? (failures / total) * 100 : 0,
        };
    }
}
// ============================================================================
// Connection Pool
// ============================================================================
const MAX_POOL_SIZE = parseInt(process.env.MAX_CLIENT_POOL_SIZE || "50", 10);
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MINUTES || "30", 10) * 60 * 1000;
const clientPool = new Map();
function isExpired(entry) {
    if (CACHE_TTL_MS === 0)
        return false;
    return Date.now() - entry.createdAt > CACHE_TTL_MS;
}
function getConnectionFingerprint(params) {
    // Since auth comes from env vars, only apmIndex can vary per request
    return `apm|${params.apmIndex || ES_APM_CONFIG.apmIndex}`;
}
function evictLRUIfNeeded() {
    if (clientPool.size < MAX_POOL_SIZE)
        return;
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, value] of clientPool.entries()) {
        if (value.lastUsed < oldestTime) {
            oldestTime = value.lastUsed;
            oldestKey = key;
        }
    }
    if (oldestKey) {
        clientPool.delete(oldestKey);
    }
}
export function getApmPoolStats() {
    return {
        size: clientPool.size,
        maxSize: MAX_POOL_SIZE,
        ttlMinutes: CACHE_TTL_MS / 60000,
    };
}
export function clearApmPool() {
    clientPool.clear();
}
export function createApmClient(params) {
    const fingerprint = getConnectionFingerprint(params);
    const cached = clientPool.get(fingerprint);
    if (cached) {
        if (isExpired(cached)) {
            clientPool.delete(fingerprint);
        }
        else {
            cached.lastUsed = Date.now();
            return cached.client;
        }
    }
    const client = new ApmElasticsearchClient(params);
    evictLRUIfNeeded();
    const now = Date.now();
    clientPool.set(fingerprint, { client, lastUsed: now, createdAt: now });
    return client;
}
//# sourceMappingURL=client.js.map