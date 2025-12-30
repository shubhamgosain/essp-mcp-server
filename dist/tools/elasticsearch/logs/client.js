/**
 * Elasticsearch Logs Client
 *
 * Handles API calls to Elasticsearch for log data and Kibana data views
 * with time range enforcement to prevent expensive queries.
 */
import { BaseElasticsearchClient, ElasticsearchApiError } from "../common/client.js";
import { ES_LOGS_CONFIG } from "./schema.js";
import { logger } from "../../../lib/logging.js";
export { ElasticsearchApiError };
// ============================================================================
// Time Range Enforcement
// ============================================================================
/**
 * Error thrown when time range exceeds the maximum allowed
 */
export class TimeRangeExceededError extends Error {
    requestedHours;
    maxAllowedHours;
    constructor(requestedHours, maxAllowedHours) {
        super(`Time range of ${requestedHours} hours exceeds maximum allowed ${maxAllowedHours} hours. Use a shorter time range.`);
        this.requestedHours = requestedHours;
        this.maxAllowedHours = maxAllowedHours;
        this.name = "TimeRangeExceededError";
    }
}
/**
 * Parse a relative time string like "now-24h" or "now-7d" to milliseconds offset
 */
function parseRelativeTime(timeStr) {
    if (timeStr === "now") {
        return Date.now();
    }
    // Handle ISO 8601 dates
    if (timeStr.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(timeStr)) {
        return new Date(timeStr).getTime();
    }
    // Handle relative time like "now-1h", "now-24h", "now-7d"
    const match = timeStr.match(/^now-(\d+)([smhdwMy])$/);
    if (!match) {
        // Try to parse as date anyway
        const parsed = new Date(timeStr).getTime();
        if (!isNaN(parsed)) {
            return parsed;
        }
        // Default to now if unparseable
        return Date.now();
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
        M: 30 * 24 * 60 * 60 * 1000,
        y: 365 * 24 * 60 * 60 * 1000,
    };
    const offsetMs = value * (multipliers[unit] || 0);
    return Date.now() - offsetMs;
}
/**
 * Calculate the time range in hours between two time strings
 */
function calculateTimeRangeHours(startTime, endTime) {
    const startMs = parseRelativeTime(startTime);
    const endMs = parseRelativeTime(endTime);
    const diffMs = Math.abs(endMs - startMs);
    return diffMs / (60 * 60 * 1000);
}
/**
 * Validate that the time range doesn't exceed the maximum allowed
 */
function validateTimeRange(startTime, endTime, maxHours) {
    const rangeHours = calculateTimeRangeHours(startTime, endTime);
    if (rangeHours > maxHours) {
        logger.warn("elasticsearch_time_range_exceeded", {
            requested_hours: Math.round(rangeHours * 10) / 10,
            max_allowed_hours: maxHours,
            start_time: startTime,
            end_time: endTime,
        });
        throw new TimeRangeExceededError(Math.round(rangeHours * 10) / 10, maxHours);
    }
}
// ============================================================================
// Client
// ============================================================================
export class LogsElasticsearchClient extends BaseElasticsearchClient {
    kibanaIndex;
    maxResults;
    maxTimeRangeHours;
    constructor() {
        super();
        this.kibanaIndex = ES_LOGS_CONFIG.kibanaIndex;
        this.maxResults = ES_LOGS_CONFIG.maxResults;
        this.maxTimeRangeHours = ES_LOGS_CONFIG.maxTimeRangeHours;
    }
    /**
     * Patterns to exclude from data view listing (system/internal indices)
     */
    static EXCLUDED_PATTERNS = [
        "apm", // APM indices (use APM tools instead)
        "metrics-", // Metrics indices
        "kibana-event-log", // Kibana internal logs
        ".kibana", // Kibana system indices
        ".internal", // Internal indices
        ".fleet", // Fleet indices
        ".security", // Security indices
    ];
    /**
     * Check if a data view should be excluded
     */
    isExcludedDataView(title) {
        const lowerTitle = title.toLowerCase();
        return LogsElasticsearchClient.EXCLUDED_PATTERNS.some(pattern => lowerTitle.includes(pattern.toLowerCase()));
    }
    /**
     * List available data views (index patterns) from Kibana
     * Supports both Kibana 7.x (index-pattern) and 8.x (data-view) formats
     * Excludes system indices like apm*, metrics-*, kibana-event-log
     */
    async listDataViews(filterPattern) {
        logger.debug("elasticsearch_logs_list_data_views", { filter: filterPattern, kibanaIndex: this.kibanaIndex });
        // Query for both Kibana 7.x (index-pattern) and 8.x (data-view) types
        const query = {
            size: 1000,
            query: {
                bool: {
                    should: [
                        { term: { type: "index-pattern" } },
                        { term: { type: "data-view" } },
                    ],
                    minimum_should_match: 1,
                },
            },
            _source: [
                // Kibana 7.x fields
                "index-pattern.title",
                "index-pattern.name",
                "index-pattern.timeFieldName",
                // Kibana 8.x fields
                "data-view.title",
                "data-view.name",
                "data-view.timeFieldName",
            ],
        };
        const response = await this.search(this.kibanaIndex, query);
        let dataViews = response.hits.hits.map((hit) => {
            // Try Kibana 8.x format first, then fall back to 7.x
            const dataView = hit._source["data-view"];
            const indexPattern = hit._source["index-pattern"];
            const source = dataView || indexPattern;
            // Extract ID - remove type prefix if present
            let id = hit._id;
            if (id.startsWith("data-view:")) {
                id = id.replace("data-view:", "");
            }
            else if (id.startsWith("index-pattern:")) {
                id = id.replace("index-pattern:", "");
            }
            return {
                id,
                title: String(source?.title || ""),
                name: source?.name ? String(source.name) : undefined,
                timeFieldName: source?.timeFieldName ? String(source.timeFieldName) : undefined,
            };
        });
        // Exclude system/internal indices
        dataViews = dataViews.filter(dv => dv.title && !this.isExcludedDataView(dv.title));
        // Filter by pattern if provided
        if (filterPattern) {
            const lowerFilter = filterPattern.toLowerCase();
            dataViews = dataViews.filter((dv) => dv.title.toLowerCase().includes(lowerFilter) ||
                (dv.name && dv.name.toLowerCase().includes(lowerFilter)));
        }
        logger.debug("elasticsearch_logs_data_views_found", { count: dataViews.length });
        return dataViews;
    }
    /**
     * Get field mappings for an index pattern
     */
    async getFields(indexPattern) {
        logger.debug("elasticsearch_logs_get_fields", { index: indexPattern });
        const mapping = await this.getMapping(indexPattern);
        const fields = [];
        // Extract fields from mapping
        for (const indexName in mapping) {
            const properties = mapping[indexName]?.mappings?.properties || {};
            this.extractFields(properties, "", fields);
        }
        // Deduplicate by name
        const uniqueFields = new Map();
        for (const field of fields) {
            if (!uniqueFields.has(field.name)) {
                uniqueFields.set(field.name, field);
            }
        }
        return Array.from(uniqueFields.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    extractFields(properties, prefix, fields) {
        for (const [name, prop] of Object.entries(properties)) {
            const fullName = prefix ? `${prefix}.${name}` : name;
            if (prop.type) {
                fields.push({
                    name: fullName,
                    type: prop.type,
                    searchable: prop.type !== "binary",
                    aggregatable: ["keyword", "long", "integer", "short", "byte", "double", "float", "date", "boolean", "ip"].includes(prop.type),
                });
            }
            // Handle nested properties
            if (prop.properties) {
                this.extractFields(prop.properties, fullName, fields);
            }
        }
    }
    /**
     * Get unique values for a field
     */
    async getFieldValues(indexPattern, field, startTime, endTime, limit = 20) {
        // Validate time range
        validateTimeRange(startTime, endTime, this.maxTimeRangeHours);
        logger.debug("elasticsearch_logs_get_field_values", { index: indexPattern, field });
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
                field_values: {
                    terms: {
                        field,
                        size: limit,
                    },
                },
            },
        };
        const response = await this.search(indexPattern, query);
        const buckets = response.aggregations?.field_values?.buckets || [];
        return buckets.map((b) => String(b.key));
    }
    /**
     * Search logs
     */
    async searchLogs(indexPattern, startTime, endTime, kqlQuery, fields, limit = 100) {
        // Validate time range
        validateTimeRange(startTime, endTime, this.maxTimeRangeHours);
        logger.debug("elasticsearch_logs_search", {
            index: indexPattern,
            has_query: !!kqlQuery,
            limit,
        });
        // Enforce max results
        const effectiveLimit = Math.min(limit, this.maxResults);
        const filters = [
            { range: { "@timestamp": { gte: startTime, lte: endTime } } },
        ];
        // Convert KQL to query_string (simplified - real KQL parsing is complex)
        if (kqlQuery) {
            filters.push({
                query_string: {
                    query: kqlQuery,
                    default_operator: "AND",
                },
            });
        }
        const query = {
            size: effectiveLimit,
            query: {
                bool: { filter: filters },
            },
            sort: [{ "@timestamp": "desc" }],
        };
        // Limit fields if specified
        if (fields && fields.length > 0) {
            query._source = fields;
        }
        const response = await this.search(indexPattern, query);
        return {
            logs: response.hits.hits.map((hit) => ({
                id: hit._id,
                index: hit._index,
                timestamp: String(hit._source["@timestamp"] || ""),
                source: hit._source,
            })),
            total: response.hits.total.value,
        };
    }
    /**
     * Get latest logs (tail)
     */
    async getLatestLogs(indexPattern, kqlQuery, limit = 50) {
        const effectiveLimit = Math.min(limit, 200);
        // Latest logs use fixed 1h window - no validation needed
        const result = await this.searchLogs(indexPattern, "now-1h", "now", kqlQuery, undefined, effectiveLimit);
        return result.logs;
    }
    /**
     * Get log context (surrounding logs)
     */
    async getLogContext(indexPattern, logId, before = 10, after = 10) {
        logger.debug("elasticsearch_logs_context", { index: indexPattern, log_id: logId });
        // First, get the target log
        const targetQuery = {
            query: {
                ids: { values: [logId] },
            },
        };
        const targetResponse = await this.search(indexPattern, targetQuery);
        if (targetResponse.hits.hits.length === 0) {
            return { before: [], target: null, after: [] };
        }
        const targetHit = targetResponse.hits.hits[0];
        const targetTimestamp = targetHit._source["@timestamp"];
        const target = {
            id: targetHit._id,
            index: targetHit._index,
            timestamp: String(targetTimestamp || ""),
            source: targetHit._source,
        };
        // Get logs before
        const beforeQuery = {
            size: before,
            query: {
                bool: {
                    filter: [
                        { range: { "@timestamp": { lt: targetTimestamp } } },
                    ],
                },
            },
            sort: [{ "@timestamp": "desc" }],
        };
        const beforeResponse = await this.search(indexPattern, beforeQuery);
        const beforeLogs = beforeResponse.hits.hits.map((hit) => ({
            id: hit._id,
            index: hit._index,
            timestamp: String(hit._source["@timestamp"] || ""),
            source: hit._source,
        })).reverse();
        // Get logs after
        const afterQuery = {
            size: after,
            query: {
                bool: {
                    filter: [
                        { range: { "@timestamp": { gt: targetTimestamp } } },
                    ],
                },
            },
            sort: [{ "@timestamp": "asc" }],
        };
        const afterResponse = await this.search(indexPattern, afterQuery);
        const afterLogs = afterResponse.hits.hits.map((hit) => ({
            id: hit._id,
            index: hit._index,
            timestamp: String(hit._source["@timestamp"] || ""),
            source: hit._source,
        }));
        return { before: beforeLogs, target, after: afterLogs };
    }
    /**
     * Aggregate logs
     */
    async aggregateLogs(indexPattern, startTime, endTime, groupBy, kqlQuery, timeInterval, metric = "count", metricField, limit = 10) {
        // Aggregations can use a longer time range (7 days) since they're summarized
        const aggMaxHours = this.maxTimeRangeHours * 7; // 7x the normal limit for aggregations
        validateTimeRange(startTime, endTime, aggMaxHours);
        logger.debug("elasticsearch_logs_aggregate", {
            index: indexPattern,
            group_by: groupBy,
            metric,
        });
        const effectiveLimit = Math.min(limit, 50);
        const filters = [
            { range: { "@timestamp": { gte: startTime, lte: endTime } } },
        ];
        if (kqlQuery) {
            filters.push({
                query_string: {
                    query: kqlQuery,
                    default_operator: "AND",
                },
            });
        }
        // Build aggregation
        const aggs = {
            by_group: {
                terms: {
                    field: groupBy,
                    size: effectiveLimit,
                },
                aggs: {},
            },
        };
        const groupAggs = aggs.by_group;
        // Add time histogram if requested
        if (timeInterval) {
            groupAggs.aggs.over_time = {
                date_histogram: {
                    field: "@timestamp",
                    fixed_interval: timeInterval,
                },
            };
        }
        // Add metric aggregation if not count
        if (metric !== "count" && metricField) {
            groupAggs.aggs.metric_value = {
                [metric]: { field: metricField },
            };
        }
        const query = {
            size: 0,
            query: {
                bool: { filter: filters },
            },
            aggs,
        };
        const response = await this.search(indexPattern, query);
        const buckets = response.aggregations?.by_group?.buckets || [];
        return buckets.map((bucket) => {
            const result = {
                key: String(bucket.key),
                doc_count: bucket.doc_count,
            };
            // Add time breakdown if present
            if (bucket.over_time) {
                const timeBuckets = bucket.over_time.buckets;
                result.over_time = timeBuckets.map((tb) => ({
                    time: tb.key_as_string,
                    count: tb.doc_count,
                }));
            }
            // Add metric value if present
            if (bucket.metric_value) {
                result.metric_value = bucket.metric_value.value;
            }
            return result;
        });
    }
    /**
     * Compare two time periods
     */
    async comparePeriods(indexPattern, groupBy, period1Start, period1End, period2Start, period2End, kqlQuery, metric = "count", metricField) {
        // Validate both periods use aggregation limit (7x normal)
        const aggMaxHours = this.maxTimeRangeHours * 7;
        validateTimeRange(period1Start, period1End, aggMaxHours);
        validateTimeRange(period2Start, period2End, aggMaxHours);
        logger.debug("elasticsearch_logs_compare", { index: indexPattern, group_by: groupBy });
        // Query both periods
        const [period1Result, period2Result] = await Promise.all([
            this.aggregateLogs(indexPattern, period1Start, period1End, groupBy, kqlQuery, undefined, metric, metricField, 50),
            this.aggregateLogs(indexPattern, period2Start, period2End, groupBy, kqlQuery, undefined, metric, metricField, 50),
        ]);
        // Calculate totals
        const getValue = (bucket) => metric === "count" ? bucket.doc_count : (bucket.metric_value || 0);
        const period1Total = period1Result.reduce((sum, b) => sum + getValue(b), 0);
        const period2Total = period2Result.reduce((sum, b) => sum + getValue(b), 0);
        // Build by-group maps
        const period1ByGroup = {};
        const period2ByGroup = {};
        for (const bucket of period1Result) {
            period1ByGroup[bucket.key] = getValue(bucket);
        }
        for (const bucket of period2Result) {
            period2ByGroup[bucket.key] = getValue(bucket);
        }
        // Calculate changes
        const calculateChange = (old, current) => {
            if (old === 0)
                return current > 0 ? "+∞%" : "0%";
            const change = ((current - old) / old) * 100;
            const sign = change >= 0 ? "+" : "";
            return `${sign}${Math.round(change)}%`;
        };
        const changeByGroup = {};
        const allKeys = new Set([...Object.keys(period1ByGroup), ...Object.keys(period2ByGroup)]);
        for (const key of allKeys) {
            changeByGroup[key] = calculateChange(period1ByGroup[key] || 0, period2ByGroup[key] || 0);
        }
        return {
            period1: { total: period1Total, byGroup: period1ByGroup },
            period2: { total: period2Total, byGroup: period2ByGroup },
            change: {
                total: calculateChange(period1Total, period2Total),
                byGroup: changeByGroup,
            },
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
function getConnectionFingerprint() {
    // Since auth comes from env vars, all logs clients use the same connection
    return "logs|default";
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
export function getLogsPoolStats() {
    return {
        size: clientPool.size,
        maxSize: MAX_POOL_SIZE,
        ttlMinutes: CACHE_TTL_MS / 60000,
    };
}
export function clearLogsPool() {
    clientPool.clear();
}
export function createLogsClient() {
    const fingerprint = getConnectionFingerprint();
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
    const client = new LogsElasticsearchClient();
    evictLRUIfNeeded();
    const now = Date.now();
    clientPool.set(fingerprint, { client, lastUsed: now, createdAt: now });
    return client;
}
//# sourceMappingURL=client.js.map