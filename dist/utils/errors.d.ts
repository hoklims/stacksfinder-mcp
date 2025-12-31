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
    CONFIG_ERROR = "CONFIG_ERROR"
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
//# sourceMappingURL=errors.d.ts.map