/**
 * Base Elasticsearch Client
 *
 * Provides common functionality for Elasticsearch API calls
 * with timeout, retry logic, and circuit breaker pattern.
 */
import { ES_BASE_CONFIG } from "./schema.js";
// ============================================================================
// Configuration
// ============================================================================
/**
 * Request timeout in milliseconds (default: 30 seconds)
 */
const REQUEST_TIMEOUT_MS = parseInt(process.env.ES_REQUEST_TIMEOUT_MS || "30000", 10);
/**
 * Circuit breaker configuration
 */
const CIRCUIT_BREAKER_CONFIG = {
    /** Number of failures before opening circuit */
    failureThreshold: parseInt(process.env.ES_CIRCUIT_FAILURE_THRESHOLD || "5", 10),
    /** Time to wait before attempting recovery (ms) */
    recoveryTimeout: parseInt(process.env.ES_CIRCUIT_RECOVERY_MS || "30000", 10),
    /** Number of successful requests in half-open state to close circuit */
    successThreshold: parseInt(process.env.ES_CIRCUIT_SUCCESS_THRESHOLD || "2", 10),
};
/** Circuit breaker state per ES host */
const circuitBreakers = new Map();
function getCircuitBreaker(host) {
    let breaker = circuitBreakers.get(host);
    if (!breaker) {
        breaker = {
            state: "closed",
            failures: 0,
            successes: 0,
            lastFailureTime: 0,
        };
        circuitBreakers.set(host, breaker);
    }
    return breaker;
}
function recordSuccess(host) {
    const breaker = getCircuitBreaker(host);
    if (breaker.state === "half-open") {
        breaker.successes++;
        if (breaker.successes >= CIRCUIT_BREAKER_CONFIG.successThreshold) {
            // Circuit recovered
            breaker.state = "closed";
            breaker.failures = 0;
            breaker.successes = 0;
            breaker.lastError = undefined;
            console.log(`[CircuitBreaker] Circuit CLOSED for ${host} - service recovered`);
        }
    }
    else if (breaker.state === "closed") {
        // Reset failure count on success
        breaker.failures = 0;
    }
}
function recordFailure(host, error) {
    const breaker = getCircuitBreaker(host);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    breaker.lastError = error;
    breaker.successes = 0;
    if (breaker.state === "half-open") {
        // Failed during recovery - reopen circuit
        breaker.state = "open";
        console.warn(`[CircuitBreaker] Circuit OPEN for ${host} - recovery failed: ${error}`);
    }
    else if (breaker.state === "closed" && breaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
        breaker.state = "open";
        console.warn(`[CircuitBreaker] Circuit OPEN for ${host} after ${breaker.failures} failures: ${error}`);
    }
}
function canRequest(host) {
    const breaker = getCircuitBreaker(host);
    if (breaker.state === "closed") {
        return { allowed: true };
    }
    if (breaker.state === "open") {
        const timeSinceFailure = Date.now() - breaker.lastFailureTime;
        if (timeSinceFailure >= CIRCUIT_BREAKER_CONFIG.recoveryTimeout) {
            // Attempt recovery
            breaker.state = "half-open";
            breaker.successes = 0;
            console.log(`[CircuitBreaker] Circuit HALF-OPEN for ${host} - attempting recovery`);
            return { allowed: true };
        }
        return {
            allowed: false,
            reason: `Circuit breaker OPEN for Elasticsearch (${breaker.failures} failures). Last error: ${breaker.lastError}. Retry in ${Math.ceil((CIRCUIT_BREAKER_CONFIG.recoveryTimeout - timeSinceFailure) / 1000)}s`,
        };
    }
    // half-open - allow request for testing
    return { allowed: true };
}
/**
 * Get circuit breaker stats for monitoring
 */
export function getCircuitBreakerStats() {
    const stats = {};
    for (const [host, state] of circuitBreakers.entries()) {
        stats[host] = { ...state };
    }
    return stats;
}
/**
 * Reset circuit breaker for a host (useful for testing)
 */
export function resetCircuitBreaker(host) {
    if (host) {
        circuitBreakers.delete(host);
    }
    else {
        circuitBreakers.clear();
    }
}
// ============================================================================
// Errors
// ============================================================================
export class ElasticsearchApiError extends Error {
    statusCode;
    errorType;
    constructor(message, statusCode, errorType) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.name = "ElasticsearchApiError";
    }
}
export class CircuitBreakerError extends Error {
    constructor(message) {
        super(message);
        this.name = "CircuitBreakerError";
    }
}
export class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "TimeoutError";
    }
}
// ============================================================================
// Base Client
// ============================================================================
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
export class BaseElasticsearchClient {
    baseUrl;
    headers;
    host;
    constructor() {
        const esUrl = ES_BASE_CONFIG.url;
        const apiKey = ES_BASE_CONFIG.apiKey;
        const username = ES_BASE_CONFIG.username;
        const password = ES_BASE_CONFIG.password;
        if (!esUrl) {
            throw new ElasticsearchApiError("Elasticsearch URL is required. Set ES_URL environment variable.");
        }
        this.baseUrl = esUrl.replace(/\/$/, "");
        this.host = new URL(this.baseUrl).host;
        this.headers = {
            "Content-Type": "application/json",
        };
        // Set authentication - priority: API key > basic auth
        if (apiKey) {
            // ES API key can be provided as-is (already base64 encoded) or as id:key
            // If it contains a colon, encode it; otherwise use as-is
            const encodedKey = apiKey.includes(":")
                ? Buffer.from(apiKey).toString("base64")
                : apiKey;
            this.headers["Authorization"] = `ApiKey ${encodedKey}`;
        }
        else if (username && password) {
            const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
            this.headers["Authorization"] = `Basic ${basicAuth}`;
        }
    }
    async request(method, path, body, timeoutMs = REQUEST_TIMEOUT_MS) {
        // Check circuit breaker
        const circuitCheck = canRequest(this.host);
        if (!circuitCheck.allowed) {
            throw new CircuitBreakerError(circuitCheck.reason);
        }
        const url = `${this.baseUrl}${path}`;
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const options = {
            method,
            headers: this.headers,
            signal: controller.signal,
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        // Retry logic for transient network failures
        const maxRetries = 2;
        let lastError = null;
        try {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) {
                        const errorBody = await response.text();
                        let errorMessage = `Elasticsearch API error: ${response.status}`;
                        try {
                            const errorJson = JSON.parse(errorBody);
                            errorMessage = errorJson.error?.reason || errorJson.message || errorMessage;
                        }
                        catch {
                            if (errorBody)
                                errorMessage = errorBody;
                        }
                        // Record failure for 5xx errors (server-side issues)
                        if (response.status >= 500) {
                            recordFailure(this.host, errorMessage);
                        }
                        throw new ElasticsearchApiError(errorMessage, response.status);
                    }
                    // Success - record it
                    recordSuccess(this.host);
                    return response.json();
                }
                catch (error) {
                    // Handle abort (timeout)
                    if (error instanceof Error && error.name === "AbortError") {
                        const timeoutError = new TimeoutError(`Request timed out after ${timeoutMs}ms: ${url}`);
                        recordFailure(this.host, timeoutError.message);
                        throw timeoutError;
                    }
                    if (error instanceof ElasticsearchApiError) {
                        throw error; // Don't retry HTTP errors
                    }
                    if (error instanceof CircuitBreakerError || error instanceof TimeoutError) {
                        throw error;
                    }
                    lastError = error instanceof Error ? error : new Error(String(error));
                    const errorDetails = `${lastError.name}: ${lastError.message}`;
                    if (attempt < maxRetries) {
                        console.warn(`[ElasticsearchClient] Fetch failed for ${url} (attempt ${attempt + 1}/${maxRetries + 1}): ${errorDetails}. Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
                    }
                    else {
                        console.error(`[ElasticsearchClient] Fetch failed for ${url} after ${maxRetries + 1} attempts: ${errorDetails}`);
                        recordFailure(this.host, errorDetails);
                    }
                }
            }
            throw new ElasticsearchApiError(`Failed to connect to Elasticsearch after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Test connection to Elasticsearch
     */
    async testConnection() {
        const breaker = getCircuitBreaker(this.host);
        try {
            const info = await this.request("GET", "/");
            return {
                connected: true,
                clusterName: info.cluster_name,
                circuitState: breaker.state,
            };
        }
        catch (error) {
            return {
                connected: false,
                error: error instanceof Error ? error.message : String(error),
                circuitState: breaker.state,
            };
        }
    }
    /**
     * Search with a query
     */
    async search(index, query, timeoutMs) {
        return this.request("POST", `/${index}/_search`, query, timeoutMs);
    }
    /**
     * Get field mappings for an index
     */
    async getMapping(index) {
        return this.request("GET", `/${index}/_mapping`);
    }
}
//# sourceMappingURL=client.js.map