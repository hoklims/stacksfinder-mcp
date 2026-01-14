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
 * Set the OAuth token for the current request.
 * Called by HTTP transport when an Authorization header is present.
 */
export declare function setOAuthToken(token: string | null): void;
/**
 * Get the OAuth token for the current request.
 * Returns null if no OAuth token is set.
 */
export declare function getOAuthToken(): string | null;
/**
 * Get the best available auth token (OAuth first, then API key).
 * Used by tools that need to authenticate with the API.
 */
export declare function getAuthToken(): string | null;
/**
 * Check if any authentication is available.
 */
export declare function hasAuth(): boolean;
/**
 * Reset config (useful for testing).
 */
export declare function resetConfig(): void;
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
/**
 * Get the current user's tier information.
 * Calls /api/v1/mcp/me and caches the result.
 */
export declare function getUserTier(): Promise<UserTierInfo>;
/**
 * Check if the current user has Pro tier or higher.
 */
export declare function isPro(): Promise<boolean>;
/**
 * Clear the tier cache (useful when user upgrades).
 */
export declare function clearTierCache(): void;
export {};
//# sourceMappingURL=config.d.ts.map