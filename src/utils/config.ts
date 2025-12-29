import { z } from 'zod';

const ConfigSchema = z.object({
	apiUrl: z.string().url().default('https://stacksfinder.com'),
	apiKey: z.string().optional(),
	debug: z.boolean().default(false)
});

export type Config = z.infer<typeof ConfigSchema>;

let _config: Config | null = null;

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
 * Reset config (useful for testing).
 */
export function resetConfig(): void {
	_config = null;
}
