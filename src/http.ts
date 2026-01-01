#!/usr/bin/env node

/**
 * HTTP entry point for Smithery hosted deployments.
 * Uses StreamableHTTPServerTransport instead of stdio.
 */

import express, { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { loadConfig } from './utils/config.js';
import { setDebug, info, error } from './utils/logger.js';

async function main(): Promise<void> {
	// Load configuration
	const config = loadConfig();

	// Enable debug logging if configured
	if (config.debug) {
		setDebug(true);
		info('Debug logging enabled');
	}

	// Create Express app
	const app = express();
	app.use(express.json());

	// Health check endpoint
	app.get('/health', (_req: Request, res: Response) => {
		res.json({ status: 'ok', version: '1.0.0' });
	});

	// MCP endpoint - creates a new server instance per request
	app.post('/mcp', async (req: Request, res: Response) => {
		try {
			// Create fresh server and transport per request
			const server = createServer();
			const transport = new StreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
				enableJsonResponse: true
			});

			// Clean up on connection close
			res.on('close', () => {
				transport.close();
				server.close();
			});

			// Connect and handle request
			await server.connect(transport);
			await transport.handleRequest(req, res, req.body);
		} catch (err) {
			error('Error handling MCP request', err);
			if (!res.headersSent) {
				res.status(500).json({
					jsonrpc: '2.0',
					error: {
						code: -32603,
						message: 'Internal server error'
					},
					id: null
				});
			}
		}
	});

	// Start server
	const port = parseInt(process.env.PORT || '3000', 10);
	app.listen(port, '0.0.0.0', () => {
		info(`StacksFinder MCP HTTP Server running on port ${port}`);
		info('POST /mcp for MCP requests, GET /health for health checks');
	});
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
