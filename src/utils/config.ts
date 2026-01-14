import { z } from 'zod';

const ConfigSchema = z.object({
	apiUrl: z.string().url().default('https://stacksfinder.com'),
	apiKey: z.string().optional(),
	debug: z.boolean().default(false)
});

export type Config = z.infer<typeof ConfigSchema>;

let _config: Config | null = null;

/**
 * Request-scoped OAuth token.
 * Set by HTTP transport for each request, used by tools that support OAuth.
 */
let _oauthToken: string | null = null;

/**
 * Load configuration from environment variables.
 * Call this once at startup.
 */
export function loadConfig(): Config {
	if (_config) return _config;

	_config = ConfigSchema.parse({
		apiUrl: process.env.STACKSFINDER_API_URL || 'https://stacksfinder.com',
		apiKey: process.env.STACKSFINDER_API_KEY,
		debug: process.env.STACKSFINDER_MCP_DEBUG === 'true'
	});

	return _config;
}

/**
 * Get the current configuration.
 * Throws if loadConfig() hasn't been called.
 */
export function getConfig(): Config {
	if (!_config) {
		throw new Error('Config not loaded. Call loadConfig() first.');
	}
	return _config;
}

/**
 * Check if API key is configured.
 */
export function hasApiKey(): boolean {
	const config = getConfig();
	return !!config.apiKey;
}

/**
 * Set the OAuth token for the current request.
 * Called by HTTP transport when an Authorization header is present.
 */
export function setOAuthToken(token: string | null): void {
	_oauthToken = token;
}

/**
 * Get the OAuth token for the current request.
 * Returns null if no OAuth token is set.
 */
export function getOAuthToken(): string | null {
	return _oauthToken;
}

/**
 * Get the best available auth token (OAuth first, then API key).
 * Used by tools that need to authenticate with the API.
 */
export function getAuthToken(): string | null {
	// OAuth takes precedence (for ChatGPT integration)
	if (_oauthToken) return _oauthToken;
	// Fall back to API key from environment
	return _config?.apiKey || null;
}

/**
 * Check if any authentication is available.
 */
export function hasAuth(): boolean {
	return !!getAuthToken();
}

/**
 * Reset config (useful for testing).
 */
export function resetConfig(): void {
	_config = null;
	_oauthToken = null;
}

// ============================================================================
// User Tier Management
// ============================================================================

export type UserTier = 'free' | 'pro' | 'team' | 'unknown';

interface UserTierInfo {
	tier: UserTier;
	isPro: boolean;
	isTeam: boolean;
	quota: {
		remaining: number;
		limit: number;
		used: number;
	};
}

let _cachedTierInfo: UserTierInfo | null = null;
let _tierCacheExpiry: number = 0;
const TIER_CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Get the current user's tier information.
 * Calls /api/v1/mcp/me and caches the result.
 */
export async function getUserTier(): Promise<UserTierInfo> {
	const authToken = getAuthToken();

	// No auth = free tier
	if (!authToken) {
		return {
			tier: 'free',
			isPro: false,
			isTeam: false,
			quota: { remaining: 0, limit: 0, used: 0 }
		};
	}

	// Check cache
	if (_cachedTierInfo && Date.now() < _tierCacheExpiry) {
		return _cachedTierInfo;
	}

	const config = getConfig();

	try {
		const response = await fetch(`${config.apiUrl}/api/v1/mcp/me`, {
			headers: {
				Authorization: `Bearer ${authToken}`
			}
		});

		if (!response.ok) {
			// Auth failed = treat as free
			return {
				tier: 'free',
				isPro: false,
				isTeam: false,
				quota: { remaining: 0, limit: 0, used: 0 }
			};
		}

		const data = await response.json() as {
			tier: UserTier;
			isPro: boolean;
			isTeam: boolean;
			quota: { remaining: number; limit: number; used: number };
		};

		_cachedTierInfo = {
			tier: data.tier,
			isPro: data.isPro,
			isTeam: data.isTeam,
			quota: data.quota
		};
		_tierCacheExpiry = Date.now() + TIER_CACHE_TTL_MS;

		return _cachedTierInfo;
	} catch {
		// Network error = treat as unknown
		return {
			tier: 'unknown',
			isPro: false,
			isTeam: false,
			quota: { remaining: 0, limit: 0, used: 0 }
		};
	}
}

/**
 * Check if the current user has Pro tier or higher.
 */
export async function isPro(): Promise<boolean> {
	const tierInfo = await getUserTier();
	return tierInfo.isPro;
}

/**
 * Clear the tier cache (useful when user upgrades).
 */
export function clearTierCache(): void {
	_cachedTierInfo = null;
	_tierCacheExpiry = 0;
}
