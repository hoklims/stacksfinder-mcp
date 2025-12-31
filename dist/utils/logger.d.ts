/**
 * stderr-only logger for MCP server.
 * stdout is reserved for the MCP protocol (stdio transport).
 */
/**
 * Enable or disable debug logging.
 */
export declare function setDebug(enabled: boolean): void;
/**
 * Check if debug logging is enabled.
 */
export declare function isDebugEnabled(): boolean;
/**
 * Log a debug message to stderr (only if debug is enabled).
 */
export declare function debug(message: string, data?: unknown): void;
/**
 * Log an info message to stderr.
 */
export declare function info(message: string): void;
/**
 * Log a warning message to stderr.
 */
export declare function warn(message: string, err?: unknown): void;
/**
 * Log an error message to stderr.
 */
export declare function error(message: string, err?: unknown): void;
export declare const log: {
    debug: typeof debug;
    info: typeof info;
    warn: typeof warn;
    error: typeof error;
    setDebug: typeof setDebug;
    isDebugEnabled: typeof isDebugEnabled;
};
//# sourceMappingURL=logger.d.ts.map