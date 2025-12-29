import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfig, resetConfig } from '../src/utils/config.js';
import { ErrorCode } from '../src/utils/errors.js';

// Mock fetch for testing
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
	beforeEach(() => {
		resetConfig();
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('without API key', () => {
		it('should throw CONFIG_ERROR when API key is not set', async () => {
			process.env.STACKSFINDER_API_URL = 'https://test.stacksfinder.com';
			delete process.env.STACKSFINDER_API_KEY;
			loadConfig();

			// Import after config is set
			const { apiRequest } = await import('../src/utils/api-client.js');

			await expect(apiRequest('/api/v1/test')).rejects.toMatchObject({
				code: ErrorCode.CONFIG_ERROR
			});
		});
	});

	describe('with API key', () => {
		beforeEach(() => {
			process.env.STACKSFINDER_API_URL = 'https://test.stacksfinder.com';
			process.env.STACKSFINDER_API_KEY = 'sk_test_xxx';
			loadConfig();
		});

		it('should map 401 to UNAUTHORIZED error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () => JSON.stringify({ error: 'Invalid API key' })
			});

			const { apiRequest } = await import('../src/utils/api-client.js');

			await expect(apiRequest('/api/v1/test')).rejects.toMatchObject({
				code: ErrorCode.UNAUTHORIZED
			});
		});

		it('should map 429 to RATE_LIMITED error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 429,
				text: async () => JSON.stringify({ error: 'Rate limit exceeded' })
			});

			const { apiRequest } = await import('../src/utils/api-client.js');

			await expect(apiRequest('/api/v1/test')).rejects.toMatchObject({
				code: ErrorCode.RATE_LIMITED
			});
		});

		it('should map 404 to NOT_FOUND error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				text: async () => JSON.stringify({ error: 'Not found' })
			});

			const { apiRequest } = await import('../src/utils/api-client.js');

			await expect(apiRequest('/api/v1/test')).rejects.toMatchObject({
				code: ErrorCode.NOT_FOUND
			});
		});

		it('should handle timeout', async () => {
			// Simulate a request that takes too long
			mockFetch.mockImplementationOnce(() => {
				return new Promise((_, reject) => {
					const error = new Error('Aborted');
					error.name = 'AbortError';
					setTimeout(() => reject(error), 100);
				});
			});

			const { apiRequest } = await import('../src/utils/api-client.js');

			await expect(apiRequest('/api/v1/test', { timeoutMs: 50 })).rejects.toMatchObject({
				code: ErrorCode.TIMEOUT
			});
		});

		it('should handle non-JSON response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				headers: new Map([['content-type', 'text/html']]),
				json: async () => {
					throw new Error('Not JSON');
				}
			});

			const { apiRequest } = await import('../src/utils/api-client.js');

			await expect(apiRequest('/api/v1/test')).rejects.toMatchObject({
				code: ErrorCode.API_ERROR
			});
		});

		it('should successfully parse JSON response', async () => {
			const mockData = { result: 'success', data: [1, 2, 3] };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				headers: new Map([['content-type', 'application/json']]),
				json: async () => mockData
			});

			const { apiRequest } = await import('../src/utils/api-client.js');
			const result = await apiRequest('/api/v1/test');

			expect(result).toEqual(mockData);
		});
	});
});
