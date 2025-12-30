/**
 * Base Elasticsearch Client
 *
 * Provides common functionality for Elasticsearch API calls
 * with timeout, retry logic, and circuit breaker pattern.
 */
type CircuitState = "closed" | "open" | "half-open";
interface CircuitBreakerState {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailureTime: number;
    lastError?: string;
}
/**
 * Get circuit breaker stats for monitoring
 */
export declare function getCircuitBreakerStats(): Record<string, CircuitBreakerState>;
/**
 * Reset circuit breaker for a host (useful for testing)
 */
export declare function resetCircuitBreaker(host?: string): void;
export declare class ElasticsearchApiError extends Error {
    statusCode?: number | undefined;
    errorType?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, errorType?: string | undefined);
}
export declare class CircuitBreakerError extends Error {
    constructor(message: string);
}
export declare class TimeoutError extends Error {
    constructor(message: string);
}
export interface SearchResponse<T = unknown> {
    hits: {
        total: {
            value: number;
            relation: string;
        };
        hits: Array<{
            _index: string;
            _id: string;
            _source: T;
            _score?: number;
        }>;
    };
    aggregations?: Record<string, unknown>;
}
export interface MappingResponse {
    [index: string]: {
        mappings: {
            properties: Record<string, {
                type: string;
                fields?: Record<string, unknown>;
            }>;
        };
    };
}
/**
 * Base Elasticsearch client with common request handling
 *
 * Authentication comes from environment variables only:
 * - ES_URL: Elasticsearch URL (required)
 * - ES_API_KEY: API key for authentication (recommended)
 * - ES_USERNAME / ES_PASSWORD: Basic auth credentials (alternative)
 *
 * Priority: API Key > Basic Auth
 */
export declare abstract class BaseElasticsearchClient {
    protected baseUrl: string;
    protected headers: Record<string, string>;
    private host;
    constructor();
    protected request<T>(method: string, path: string, body?: unknown, timeoutMs?: number): Promise<T>;
    /**
     * Test connection to Elasticsearch
     */
    testConnection(): Promise<{
        connected: boolean;
        clusterName?: string;
        error?: string;
        circuitState?: CircuitState;
    }>;
    /**
     * Search with a query
     */
    search<T = unknown>(index: string, query: object, timeoutMs?: number): Promise<SearchResponse<T>>;
    /**
     * Get field mappings for an index
     */
    getMapping(index: string): Promise<MappingResponse>;
}
export {};
//# sourceMappingURL=client.d.ts.map