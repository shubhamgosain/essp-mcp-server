/**
 * Jest test setup file
 * 
 * Sets up global mocks and test environment
 */

import { jest, beforeEach } from '@jest/globals';

// Mock environment variables for tests
process.env.ES_URL = 'http://localhost:9200';
process.env.ES_API_KEY = 'test-api-key';
process.env.ES_APM_INDEX = 'apm-test*';
process.env.ES_KIBANA_INDEX = '.kibana-test*';
process.env.ES_MAX_TIME_RANGE_HOURS = '24';
process.env.ES_MAX_RESULTS = '500';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Mock fetch globally
(global as unknown as { fetch: jest.Mock }).fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  ((global as unknown as { fetch: jest.Mock }).fetch as jest.Mock).mockReset();
});

// Export for type safety in tests
export { jest };
