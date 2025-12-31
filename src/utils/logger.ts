/**
 * stderr-only logger for MCP server.
 * stdout is reserved for the MCP protocol (stdio transport).
 */

let debugEnabled = false;

/**
 * Enable or disable debug logging.
 */
export function setDebug(enabled: boolean): void {
	debugEnabled = enabled;
}

/**
 * Check if debug logging is enabled.
 */
export function isDebugEnabled(): boolean {
	return debugEnabled;
}

/**
 * Log a debug message to stderr (only if debug is enabled).
 */
export function debug(message: string, data?: unknown): void {
	if (!debugEnabled) return;
	const timestamp = new Date().toISOString();
	if (data !== undefined) {
		console.error(`[${timestamp}] [DEBUG] ${message}`, JSON.stringify(data));
	} else {
		console.error(`[${timestamp}] [DEBUG] ${message}`);
	}
}

/**
 * Log an info message to stderr.
 */
export function info(message: string): void {
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] [INFO] ${message}`);
}

/**
 * Log a warning message to stderr.
 */
export function warn(message: string, err?: unknown): void {
	const timestamp = new Date().toISOString();
	if (err instanceof Error) {
		console.error(`[${timestamp}] [WARN] ${message}: ${err.message}`);
	} else if (err !== undefined) {
		console.error(`[${timestamp}] [WARN] ${message}:`, err);
	} else {
		console.error(`[${timestamp}] [WARN] ${message}`);
	}
}

/**
 * Log an error message to stderr.
 */
export function error(message: string, err?: unknown): void {
	const timestamp = new Date().toISOString();
	if (err instanceof Error) {
		console.error(`[${timestamp}] [ERROR] ${message}: ${err.message}`);
		if (debugEnabled && err.stack) {
			console.error(err.stack);
		}
	} else if (err !== undefined) {
		console.error(`[${timestamp}] [ERROR] ${message}:`, err);
	} else {
		console.error(`[${timestamp}] [ERROR] ${message}`);
	}
}

export const log = { debug, info, warn, error, setDebug, isDebugEnabled };
