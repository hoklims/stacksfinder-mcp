/**
 * Error codes for MCP tool responses.
 */
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["RATE_LIMITED"] = "RATE_LIMITED";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["API_ERROR"] = "API_ERROR";
    ErrorCode["TECH_NOT_FOUND"] = "TECH_NOT_FOUND";
    ErrorCode["TIMEOUT"] = "TIMEOUT";
    ErrorCode["CONFIG_ERROR"] = "CONFIG_ERROR";
})(ErrorCode || (ErrorCode = {}));
/**
 * MCP-friendly error with code and optional suggestions.
 */
export class McpError extends Error {
    code;
    suggestions;
    constructor(code, message, suggestions) {
        super(message);
        this.name = 'McpError';
        this.code = code;
        this.suggestions = suggestions;
    }
    /**
     * Format error for MCP response text.
     */
    toResponseText() {
        let text = `**Error (${this.code})**: ${this.message}`;
        if (this.suggestions && this.suggestions.length > 0) {
            text += `\n\n**Suggestions**:\n${this.suggestions.map((s) => `- ${s}`).join('\n')}`;
        }
        return text;
    }
}
/**
 * Calculate Levenshtein distance between two strings.
 */
export function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            }
            else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1 // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
/**
 * Find similar strings using Levenshtein distance.
 */
export function findSimilar(input, candidates, limit = 3) {
    const inputLower = input.toLowerCase();
    return candidates
        .map((candidate) => ({
        candidate,
        distance: levenshteinDistance(inputLower, candidate.toLowerCase())
    }))
        .filter((item) => item.distance <= 3) // Max 3 edits
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map((item) => item.candidate);
}
/**
 * Create error for unknown technology ID.
 */
export function techNotFoundError(techId, availableTechs) {
    const similar = findSimilar(techId, availableTechs);
    const suggestions = similar.length > 0
        ? [`Did you mean: ${similar.join(', ')}?`, 'Use list_technologies to see all available IDs.']
        : ['Use list_technologies to see all available technology IDs.'];
    return new McpError(ErrorCode.TECH_NOT_FOUND, `Unknown technology: "${techId}"`, suggestions);
}
/**
 * Map HTTP status codes to error codes.
 */
export function httpStatusToErrorCode(status) {
    switch (status) {
        case 401:
        case 403:
            return ErrorCode.UNAUTHORIZED;
        case 404:
            return ErrorCode.NOT_FOUND;
        case 429:
            return ErrorCode.RATE_LIMITED;
        case 400:
        case 422:
            return ErrorCode.INVALID_INPUT;
        default:
            return ErrorCode.API_ERROR;
    }
}
/**
 * Create error from HTTP response.
 */
export function apiError(status, message) {
    const code = httpStatusToErrorCode(status);
    const defaultMessages = {
        [ErrorCode.UNAUTHORIZED]: 'API key is invalid or missing. Set STACKSFINDER_API_KEY.',
        [ErrorCode.NOT_FOUND]: 'Resource not found.',
        [ErrorCode.RATE_LIMITED]: 'Rate limit exceeded. Please try again later.',
        [ErrorCode.INVALID_INPUT]: 'Invalid request parameters.',
        [ErrorCode.API_ERROR]: `API request failed with status ${status}.`,
        [ErrorCode.TECH_NOT_FOUND]: 'Technology not found.',
        [ErrorCode.TIMEOUT]: 'Request timed out.',
        [ErrorCode.CONFIG_ERROR]: 'Configuration error.'
    };
    return new McpError(code, message || defaultMessages[code]);
}
//# sourceMappingURL=errors.js.map