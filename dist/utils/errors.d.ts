/**
 * Error codes for MCP tool responses.
 */
export declare enum ErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    NOT_FOUND = "NOT_FOUND",
    RATE_LIMITED = "RATE_LIMITED",
    INVALID_INPUT = "INVALID_INPUT",
    API_ERROR = "API_ERROR",
    TECH_NOT_FOUND = "TECH_NOT_FOUND",
    TIMEOUT = "TIMEOUT",
    CONFIG_ERROR = "CONFIG_ERROR",
    TIER_REQUIRED = "TIER_REQUIRED"
}
/**
 * MCP-friendly error with code and optional suggestions.
 */
export declare class McpError extends Error {
    code: ErrorCode;
    suggestions?: string[];
    constructor(code: ErrorCode, message: string, suggestions?: string[]);
    /**
     * Format error for MCP response text.
     */
    toResponseText(): string;
}
/**
 * Calculate Levenshtein distance between two strings.
 */
export declare function levenshteinDistance(a: string, b: string): number;
/**
 * Find similar strings using Levenshtein distance.
 */
export declare function findSimilar(input: string, candidates: string[], limit?: number): string[];
/**
 * Create error for unknown technology ID.
 */
export declare function techNotFoundError(techId: string, availableTechs: string[]): McpError;
/**
 * Map HTTP status codes to error codes.
 */
export declare function httpStatusToErrorCode(status: number): ErrorCode;
/**
 * Create error from HTTP response.
 */
export declare function apiError(status: number, message?: string): McpError;
/**
 * Standard response for tools that require Pro tier.
 * Returns a neutral message without promotional content.
 */
export declare function tierRequiredResponse(toolName: string, alternativeTool?: string): {
    text: string;
    isError: boolean;
};
/**
 * Check if user has Pro access, return tier-required response if not.
 * Returns null if user has access, or the error response if not.
 */
export declare function checkProAccess(toolName: string, alternativeTool?: string): Promise<{
    text: string;
    isError: boolean;
} | null>;
//# sourceMappingURL=errors.d.ts.map