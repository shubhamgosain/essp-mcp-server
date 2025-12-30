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
import { z } from "zod";
import { BaseElasticsearchClient, ElasticsearchApiError, SearchResponse } from "../common/client.js";
import { apmAuthSchema } from "./schema.js";
type ApmAuthParams = z.infer<z.ZodObject<typeof apmAuthSchema>>;
export { ElasticsearchApiError };
export declare class ApmElasticsearchClient extends BaseElasticsearchClient {
    private apmIndex;
    constructor(params?: ApmAuthParams);
    /**
     * Search APM data
     */
    searchApm<T = unknown>(query: object): Promise<SearchResponse<T>>;
    /**
     * Get the current APM index pattern
     */
    getIndex(): string;
    /**
     * Get APM services
     */
    getServices(startTime: string, endTime?: string): Promise<string[]>;
    /**
     * Get service transactions
     */
    getTransactions(serviceName: string, startTime: string, endTime?: string, transactionType?: string, limit?: number): Promise<Array<{
        transactionId: string;
        traceId: string;
        name: string;
        type: string;
        duration: number;
        result: string;
        timestamp: string;
    }>>;
    /**
     * Get service errors
     */
    getErrors(serviceName: string, startTime: string, endTime?: string, limit?: number): Promise<Array<{
        errorId: string;
        traceId: string;
        message: string;
        type: string;
        culprit: string;
        timestamp: string;
    }>>;
    /**
     * Get trace by ID
     */
    getTrace(traceId: string): Promise<Array<{
        spanId: string;
        parentId?: string;
        name: string;
        type: string;
        subtype?: string;
        duration: number;
        timestamp: string;
        serviceName: string;
    }>>;
    /**
     * Get service latency statistics
     */
    getLatencyStats(serviceName: string, startTime: string, endTime?: string, transactionType?: string): Promise<{
        avg: number;
        p50: number;
        p95: number;
        p99: number;
        max: number;
        count: number;
    }>;
    /**
     * Get error rate for a service
     */
    getErrorRate(serviceName: string, startTime: string, endTime?: string): Promise<{
        totalTransactions: number;
        failedTransactions: number;
        errorRate: number;
    }>;
}
export declare function getApmPoolStats(): {
    size: number;
    maxSize: number;
    ttlMinutes: number;
};
export declare function clearApmPool(): void;
export declare function createApmClient(params: ApmAuthParams): ApmElasticsearchClient;
//# sourceMappingURL=client.d.ts.map