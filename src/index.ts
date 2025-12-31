#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { loadConfig } from './utils/config.js';
import { setDebug, info, error } from './utils/logger.js';

/**
 * Main entry point for the MCP server.
 * Uses stdio transport for communication with LLM clients.
 */
async function main(): Promise<void> {
	// Load configuration
	const config = loadConfig();

	// Enable debug logging if configured
	if (config.debug) {
		setDebug(true);
		info('Debug logging enabled');
	}

	// Create the server
	const server = createServer();

	// Create stdio transport
	const transport = new StdioServerTransport();

	// Handle graceful shutdown
	const shutdown = async () => {
		info('Shutting down...');
		try {
			await server.close();
		} catch (err) {
			error('Error during shutdown', err);
		}
		process.exit(0);
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	// Connect and start serving
	try {
		info('Connecting via stdio transport...');
		await server.connect(transport);
		info('Server ready and listening');
	} catch (err) {
		error('Failed to start server', err);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
