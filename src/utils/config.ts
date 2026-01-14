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
