import { z } from 'zod';
const ConfigSchema = z.object({
    apiUrl: z.string().url().default('https://stacksfinder.com'),
    apiKey: z.string().optional(),
    debug: z.boolean().default(false)
});
let _config = null;
/**
 * Load configuration from environment variables.
 * Call this once at startup.
 */
export function loadConfig() {
    if (_config)
        return _config;
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
export function getConfig() {
    if (!_config) {
        throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return _config;
}
/**
 * Check if API key is configured.
 */
export function hasApiKey() {
    const config = getConfig();
    return !!config.apiKey;
}
/**
 * Reset config (useful for testing).
 */
export function resetConfig() {
    _config = null;
}
//# sourceMappingURL=config.js.map