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
  constructor(
    public requestedHours: number,
    public maxAllowedHours: number
  ) {
    super(`Time range of ${requestedHours} hours exceeds maximum allowed ${maxAllowedHours} hours. Use a shorter time range.`);
    this.name = "TimeRangeExceededError";
  }
}

/**
 * Parse a relative time string like "now-24h" or "now-7d" to milliseconds offset
 */
function parseRelativeTime(timeStr: string): number {
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

  const multipliers: Record<string, number> = {
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
function calculateTimeRangeHours(startTime: string, endTime: string): number {
  const startMs = parseRelativeTime(startTime);
  const endMs = parseRelativeTime(endTime);
  const diffMs = Math.abs(endMs - startMs);
  return diffMs / (60 * 60 * 1000);
}

/**
 * Validate that the time range doesn't exceed the maximum allowed
 */
function validateTimeRange(startTime: string, endTime: string, maxHours: number): void {
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
// Types
// ============================================================================

export interface DataView {
  id: string;
  title: string;
  name?: string;
  timeFieldName?: string;
}

export interface LogField {
  name: string;
  type: string;
  searchable: boolean;
  aggregatable: boolean;
}

export interface LogEntry {
  id: string;
  index: string;
  timestamp: string;
  source: Record<string, unknown>;
}

export interface AggregationBucket {
  key: string;
  doc_count: number;
  over_time?: Array<{ time: string; count: number }>;
  metric_value?: number;
}

// ============================================================================
// Client
// ============================================================================

export class LogsElasticsearchClient extends BaseElasticsearchClient {
  private kibanaIndex: string;
  private maxResults: number;
  private maxTimeRangeHours: number;

  constructor() {
    super();
    this.kibanaIndex = ES_LOGS_CONFIG.kibanaIndex;
    this.maxResults = ES_LOGS_CONFIG.maxResults;
    this.maxTimeRangeHours = ES_LOGS_CONFIG.maxTimeRangeHours;
  }

  /**
   * Patterns to exclude from data view listing (system/internal indices)
   */
  private static readonly EXCLUDED_PATTERNS = [
    "apm",              // APM indices (use APM tools instead)
    "metrics-",         // Metrics indices
    "kibana-event-log", // Kibana internal logs
    ".kibana",          // Kibana system indices
    ".internal",        // Internal indices
    ".fleet",           // Fleet indices
    ".security",        // Security indices
  ];

  /**
   * Check if a data view should be excluded
   */
  private isExcludedDataView(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return LogsElasticsearchClient.EXCLUDED_PATTERNS.some(pattern => 
      lowerTitle.includes(pattern.toLowerCase())
    );
  }

  /**
   * List available data views (index patterns) from Kibana
   * Supports both Kibana 7.x (index-pattern) and 8.x (data-view) formats
   * Excludes system indices like apm*, metrics-*, kibana-event-log
   */
  async listDataViews(filterPattern?: string): Promise<DataView[]> {
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

    const response = await this.search<Record<string, unknown>>(this.kibanaIndex, query);
    
    let dataViews = response.hits.hits.map((hit) => {
      // Try Kibana 8.x format first, then fall back to 7.x
      const dataView = hit._source["data-view"] as Record<string, unknown> | undefined;
      const indexPattern = hit._source["index-pattern"] as Record<string, unknown> | undefined;
      const source = dataView || indexPattern;
      
      // Extract ID - remove type prefix if present
      let id = hit._id;
      if (id.startsWith("data-view:")) {
        id = id.replace("data-view:", "");
      } else if (id.startsWith("index-pattern:")) {
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
      dataViews = dataViews.filter(
        (dv) =>
          dv.title.toLowerCase().includes(lowerFilter) ||
          (dv.name && dv.name.toLowerCase().includes(lowerFilter))
      );
    }

    logger.debug("elasticsearch_logs_data_views_found", { count: dataViews.length });
    return dataViews;
  }

  /**
   * Get field mappings for an index pattern
   */
  async getFields(indexPattern: string): Promise<LogField[]> {
    logger.debug("elasticsearch_logs_get_fields", { index: indexPattern });

    const mapping = await this.getMapping(indexPattern);
    const fields: LogField[] = [];

    // Extract fields from mapping
    for (const indexName in mapping) {
      const properties = mapping[indexName]?.mappings?.properties || {};
      this.extractFields(properties, "", fields);
    }

    // Deduplicate by name
    const uniqueFields = new Map<string, LogField>();
    for (const field of fields) {
      if (!uniqueFields.has(field.name)) {
        uniqueFields.set(field.name, field);
      }
    }

    return Array.from(uniqueFields.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractFields(
    properties: Record<string, { type: string; properties?: Record<string, unknown>; fields?: Record<string, unknown> }>,
    prefix: string,
    fields: LogField[]
  ): void {
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
        this.extractFields(
          prop.properties as Record<string, { type: string; properties?: Record<string, unknown> }>,
          fullName,
          fields
        );
      }
    }
  }

  /**
   * Get unique values for a field
   */
  async getFieldValues(
    indexPattern: string,
    field: string,
    startTime: string,
    endTime: string,
    limit: number = 20
  ): Promise<string[]> {
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
    const buckets = (response.aggregations?.field_values as { buckets: Array<{ key: string }> })?.buckets || [];
    return buckets.map((b) => String(b.key));
  }

  /**
   * Search logs
   */
  async searchLogs(
    indexPattern: string,
    startTime: string,
    endTime: string,
    kqlQuery?: string,
    fields?: string[],
    limit: number = 100
  ): Promise<{ logs: LogEntry[]; total: number }> {
    // Validate time range
    validateTimeRange(startTime, endTime, this.maxTimeRangeHours);
    
    logger.debug("elasticsearch_logs_search", {
      index: indexPattern,
      has_query: !!kqlQuery,
      limit,
    });

    // Enforce max results
    const effectiveLimit = Math.min(limit, this.maxResults);

    const filters: object[] = [
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

    const query: Record<string, unknown> = {
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

    const response = await this.search<Record<string, unknown>>(indexPattern, query);

    return {
      logs: response.hits.hits.map((hit) => ({
        id: hit._id,
        index: hit._index,
        timestamp: String((hit._source as Record<string, unknown>)["@timestamp"] || ""),
        source: hit._source as Record<string, unknown>,
      })),
      total: response.hits.total.value,
    };
  }

  /**
   * Get latest logs (tail)
   */
  async getLatestLogs(
    indexPattern: string,
    kqlQuery?: string,
    limit: number = 50
  ): Promise<LogEntry[]> {
    const effectiveLimit = Math.min(limit, 200);
    
    // Latest logs use fixed 1h window - no validation needed
    const result = await this.searchLogs(
      indexPattern,
      "now-1h",
      "now",
      kqlQuery,
      undefined,
      effectiveLimit
    );

    return result.logs;
  }

  /**
   * Get log context (surrounding logs)
   */
  async getLogContext(
    indexPattern: string,
    logId: string,
    before: number = 10,
    after: number = 10
  ): Promise<{ before: LogEntry[]; target: LogEntry | null; after: LogEntry[] }> {
    logger.debug("elasticsearch_logs_context", { index: indexPattern, log_id: logId });

    // First, get the target log
    const targetQuery = {
      query: {
        ids: { values: [logId] },
      },
    };

    const targetResponse = await this.search<Record<string, unknown>>(indexPattern, targetQuery);
    
    if (targetResponse.hits.hits.length === 0) {
      return { before: [], target: null, after: [] };
    }

    const targetHit = targetResponse.hits.hits[0];
    const targetTimestamp = (targetHit._source as Record<string, unknown>)["@timestamp"];
    const target: LogEntry = {
      id: targetHit._id,
      index: targetHit._index,
      timestamp: String(targetTimestamp || ""),
      source: targetHit._source as Record<string, unknown>,
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

    const beforeResponse = await this.search<Record<string, unknown>>(indexPattern, beforeQuery);
    const beforeLogs = beforeResponse.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index,
      timestamp: String((hit._source as Record<string, unknown>)["@timestamp"] || ""),
      source: hit._source as Record<string, unknown>,
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

    const afterResponse = await this.search<Record<string, unknown>>(indexPattern, afterQuery);
    const afterLogs = afterResponse.hits.hits.map((hit) => ({
      id: hit._id,
      index: hit._index,
      timestamp: String((hit._source as Record<string, unknown>)["@timestamp"] || ""),
      source: hit._source as Record<string, unknown>,
    }));

    return { before: beforeLogs, target, after: afterLogs };
  }

  /**
   * Aggregate logs
   */
  async aggregateLogs(
    indexPattern: string,
    startTime: string,
    endTime: string,
    groupBy: string,
    kqlQuery?: string,
    timeInterval?: string,
    metric: "count" | "avg" | "sum" | "min" | "max" = "count",
    metricField?: string,
    limit: number = 10
  ): Promise<AggregationBucket[]> {
    // Aggregations can use a longer time range (7 days) since they're summarized
    const aggMaxHours = this.maxTimeRangeHours * 7; // 7x the normal limit for aggregations
    validateTimeRange(startTime, endTime, aggMaxHours);
    
    logger.debug("elasticsearch_logs_aggregate", {
      index: indexPattern,
      group_by: groupBy,
      metric,
    });

    const effectiveLimit = Math.min(limit, 50);

    const filters: object[] = [
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
    const aggs: Record<string, unknown> = {
      by_group: {
        terms: {
          field: groupBy,
          size: effectiveLimit,
        },
        aggs: {},
      },
    };

    const groupAggs = aggs.by_group as { aggs: Record<string, unknown> };

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
    const buckets = (response.aggregations?.by_group as { buckets: Array<Record<string, unknown>> })?.buckets || [];

    return buckets.map((bucket) => {
      const result: AggregationBucket = {
        key: String(bucket.key),
        doc_count: bucket.doc_count as number,
      };

      // Add time breakdown if present
      if (bucket.over_time) {
        const timeBuckets = (bucket.over_time as { buckets: Array<{ key_as_string: string; doc_count: number }> }).buckets;
        result.over_time = timeBuckets.map((tb) => ({
          time: tb.key_as_string,
          count: tb.doc_count,
        }));
      }

      // Add metric value if present
      if (bucket.metric_value) {
        result.metric_value = (bucket.metric_value as { value: number }).value;
      }

      return result;
    });
  }

  /**
   * Compare two time periods
   */
  async comparePeriods(
    indexPattern: string,
    groupBy: string,
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string,
    kqlQuery?: string,
    metric: "count" | "avg" | "sum" = "count",
    metricField?: string
  ): Promise<{
    period1: { total: number; byGroup: Record<string, number> };
    period2: { total: number; byGroup: Record<string, number> };
    change: { total: string; byGroup: Record<string, string> };
  }> {
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
    const getValue = (bucket: AggregationBucket) => metric === "count" ? bucket.doc_count : (bucket.metric_value || 0);
    
    const period1Total = period1Result.reduce((sum, b) => sum + getValue(b), 0);
    const period2Total = period2Result.reduce((sum, b) => sum + getValue(b), 0);

    // Build by-group maps
    const period1ByGroup: Record<string, number> = {};
    const period2ByGroup: Record<string, number> = {};

    for (const bucket of period1Result) {
      period1ByGroup[bucket.key] = getValue(bucket);
    }
    for (const bucket of period2Result) {
      period2ByGroup[bucket.key] = getValue(bucket);
    }

    // Calculate changes
    const calculateChange = (old: number, current: number): string => {
      if (old === 0) return current > 0 ? "+∞%" : "0%";
      const change = ((current - old) / old) * 100;
      const sign = change >= 0 ? "+" : "";
      return `${sign}${Math.round(change)}%`;
    };

    const changeByGroup: Record<string, string> = {};
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

const clientPool = new Map<string, { client: LogsElasticsearchClient; lastUsed: number; createdAt: number }>();

function isExpired(entry: { createdAt: number }): boolean {
  if (CACHE_TTL_MS === 0) return false;
  return Date.now() - entry.createdAt > CACHE_TTL_MS;
}

function getConnectionFingerprint(): string {
  // Since auth comes from env vars, all logs clients use the same connection
  return "logs|default";
}

function evictLRUIfNeeded(): void {
  if (clientPool.size < MAX_POOL_SIZE) return;

  let oldestKey: string | null = null;
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

export function getLogsPoolStats(): { size: number; maxSize: number; ttlMinutes: number } {
  return {
    size: clientPool.size,
    maxSize: MAX_POOL_SIZE,
    ttlMinutes: CACHE_TTL_MS / 60000,
  };
}

export function clearLogsPool(): void {
  clientPool.clear();
}

export function createLogsClient(): LogsElasticsearchClient {
  const fingerprint = getConnectionFingerprint();
  const cached = clientPool.get(fingerprint);
  
  if (cached) {
    if (isExpired(cached)) {
      clientPool.delete(fingerprint);
    } else {
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

