import { z } from 'zod';
declare const ConfigSchema: z.ZodObject<{
    apiUrl: z.ZodDefault<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    debug: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    apiUrl: string;
    debug: boolean;
    apiKey?: string | undefined;
}, {
    apiUrl?: string | undefined;
    apiKey?: string | undefined;
    debug?: boolean | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
/**
 * Load configuration from environment variables.
 * Call this once at startup.
 */
export declare function loadConfig(): Config;
/**
 * Get the current configuration.
 * Throws if loadConfig() hasn't been called.
 */
export declare function getConfig(): Config;
/**
 * Check if API key is configured.
 */
export declare function hasApiKey(): boolean;
/**
 * Reset config (useful for testing).
 */
export declare function resetConfig(): void;
export {};
//# sourceMappingURL=config.d.ts.map