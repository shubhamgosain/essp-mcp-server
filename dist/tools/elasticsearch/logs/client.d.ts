/**
 * Elasticsearch Logs Client
 *
 * Handles API calls to Elasticsearch for log data and Kibana data views
 * with time range enforcement to prevent expensive queries.
 */
import { BaseElasticsearchClient, ElasticsearchApiError } from "../common/client.js";
export { ElasticsearchApiError };
/**
 * Error thrown when time range exceeds the maximum allowed
 */
export declare class TimeRangeExceededError extends Error {
    requestedHours: number;
    maxAllowedHours: number;
    constructor(requestedHours: number, maxAllowedHours: number);
}
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
    over_time?: Array<{
        time: string;
        count: number;
    }>;
    metric_value?: number;
}
export declare class LogsElasticsearchClient extends BaseElasticsearchClient {
    private kibanaIndex;
    private maxResults;
    private maxTimeRangeHours;
    constructor();
    /**
     * Patterns to exclude from data view listing (system/internal indices)
     */
    private static readonly EXCLUDED_PATTERNS;
    /**
     * Check if a data view should be excluded
     */
    private isExcludedDataView;
    /**
     * List available data views (index patterns) from Kibana
     * Supports both Kibana 7.x (index-pattern) and 8.x (data-view) formats
     * Excludes system indices like apm*, metrics-*, kibana-event-log
     */
    listDataViews(filterPattern?: string): Promise<DataView[]>;
    /**
     * Get field mappings for an index pattern
     */
    getFields(indexPattern: string): Promise<LogField[]>;
    private extractFields;
    /**
     * Get unique values for a field
     */
    getFieldValues(indexPattern: string, field: string, startTime: string, endTime: string, limit?: number): Promise<string[]>;
    /**
     * Search logs
     */
    searchLogs(indexPattern: string, startTime: string, endTime: string, kqlQuery?: string, fields?: string[], limit?: number): Promise<{
        logs: LogEntry[];
        total: number;
    }>;
    /**
     * Get latest logs (tail)
     */
    getLatestLogs(indexPattern: string, kqlQuery?: string, limit?: number): Promise<LogEntry[]>;
    /**
     * Get log context (surrounding logs)
     */
    getLogContext(indexPattern: string, logId: string, before?: number, after?: number): Promise<{
        before: LogEntry[];
        target: LogEntry | null;
        after: LogEntry[];
    }>;
    /**
     * Aggregate logs
     */
    aggregateLogs(indexPattern: string, startTime: string, endTime: string, groupBy: string, kqlQuery?: string, timeInterval?: string, metric?: "count" | "avg" | "sum" | "min" | "max", metricField?: string, limit?: number): Promise<AggregationBucket[]>;
    /**
     * Compare two time periods
     */
    comparePeriods(indexPattern: string, groupBy: string, period1Start: string, period1End: string, period2Start: string, period2End: string, kqlQuery?: string, metric?: "count" | "avg" | "sum", metricField?: string): Promise<{
        period1: {
            total: number;
            byGroup: Record<string, number>;
        };
        period2: {
            total: number;
            byGroup: Record<string, number>;
        };
        change: {
            total: string;
            byGroup: Record<string, string>;
        };
    }>;
}
export declare function getLogsPoolStats(): {
    size: number;
    maxSize: number;
    ttlMinutes: number;
};
export declare function clearLogsPool(): void;
export declare function createLogsClient(): LogsElasticsearchClient;
//# sourceMappingURL=client.d.ts.map