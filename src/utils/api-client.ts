import { getConfig, hasApiKey } from './config.js';
import { McpError, ErrorCode, apiError } from './errors.js';
import { debug, error as logError } from './logger.js';

/**
 * Simple semaphore for concurrency limiting.
 */
class Semaphore {
	private permits: number;
	private queue: Array<() => void> = [];

	constructor(permits: number) {
		this.permits = permits;
	}

	async acquire(): Promise<void> {
		if (this.permits > 0) {
			this.permits--;
			return;
		}

		return new Promise<void>((resolve) => {
			this.queue.push(resolve);
		});
	}

	release(): void {
		const next = this.queue.shift();
		if (next) {
			next();
		} else {
			this.permits++;
		}
	}
}

/**
 * TTL cache for API responses.
 */
interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

class TTLCache<T> {
	private cache = new Map<string, CacheEntry<T>>();
	private ttlMs: number;

	constructor(ttlSeconds: number) {
		this.ttlMs = ttlSeconds * 1000;
	}

	get(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;

		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return undefined;
		}

		return entry.data;
	}

	set(key: string, data: T): void {
		this.cache.set(key, {
			data,
			expiresAt: Date.now() + this.ttlMs
		});
	}

	clear(): void {
		this.cache.clear();
	}
}

// Max 2 concurrent API requests
const semaphore = new Semaphore(2);

// 60 second TTL cache for score API
const scoreCache = new TTLCache<unknown>(60);

// Default timeout of 15 seconds
const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Generate cache key for score API request.
 */
function scoreCacheKey(params: Record<string, unknown>): string {
	const sorted = Object.keys(params)
		.sort()
		.reduce(
			(acc, key) => {
				acc[key] = params[key];
				return acc;
			},
			{} as Record<string, unknown>
		);
	return JSON.stringify(sorted);
}

/**
 * Make an authenticated API request with concurrency limiting and caching.
 */
export async function apiRequest<T>(
	path: string,
	options: {
		method?: 'GET' | 'POST';
		body?: Record<string, unknown>;
		timeoutMs?: number;
		useCache?: boolean;
	} = {}
): Promise<T> {
	const config = getConfig();
	const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS, useCache = false } = options;

	// Check for API key
	if (!hasApiKey()) {
		throw new McpError(
			ErrorCode.CONFIG_ERROR,
			'API key not configured. Set STACKSFINDER_API_KEY environment variable.',
			['Get your API key from https://stacksfinder.com/settings/api']
		);
	}

	// Check cache for score API
	const cacheKey = useCache && body ? scoreCacheKey(body) : null;
	if (cacheKey) {
		const cached = scoreCache.get(cacheKey);
		if (cached) {
			debug(`Cache hit for ${path}`);
			return cached as T;
		}
	}

	const url = `${config.apiUrl}${path}`;
	debug(`API request: ${method} ${url}`);

	// Acquire semaphore permit
	await semaphore.acquire();

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

		try {
			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${config.apiKey}`
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				let errorMessage: string | undefined;

				try {
					const errorJson = JSON.parse(errorText);
					errorMessage = errorJson.error || errorJson.message;
				} catch {
					// Not JSON, use raw text if short
					if (errorText.length < 200) {
						errorMessage = errorText;
					}
				}

				throw apiError(response.status, errorMessage);
			}

			const contentType = response.headers.get('content-type');
			if (!contentType?.includes('application/json')) {
				throw new McpError(ErrorCode.API_ERROR, 'API returned non-JSON response');
			}

			const data = (await response.json()) as T;

			// Cache successful score responses
			if (cacheKey) {
				scoreCache.set(cacheKey, data);
				debug(`Cached response for ${path}`);
			}

			return data;
		} catch (err) {
			clearTimeout(timeoutId);

			if (err instanceof McpError) {
				throw err;
			}

			if (err instanceof Error && err.name === 'AbortError') {
				throw new McpError(ErrorCode.TIMEOUT, `Request timed out after ${timeoutMs}ms`, [
					'The API may be under heavy load. Please try again.'
				]);
			}

			logError('API request failed', err);
			throw new McpError(
				ErrorCode.API_ERROR,
				err instanceof Error ? err.message : 'Unknown API error'
			);
		}
	} finally {
		semaphore.release();
	}
}

/**
 * POST to the score API with caching.
 */
export async function scoreRequest<T>(body: Record<string, unknown>): Promise<T> {
	return apiRequest<T>('/api/v1/score', {
		method: 'POST',
		body,
		useCache: true
	});
}

/**
 * GET a blueprint by ID.
 */
export async function getBlueprintRequest<T>(blueprintId: string): Promise<T> {
	return apiRequest<T>(`/api/v1/blueprints/${blueprintId}`);
}

/**
 * Clear the score cache (useful for testing).
 */
export function clearScoreCache(): void {
	scoreCache.clear();
}
