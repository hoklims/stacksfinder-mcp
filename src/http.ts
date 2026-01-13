#!/usr/bin/env node

/**
 * HTTP entry point for Smithery hosted deployments.
 * Uses StreamableHTTPServerTransport instead of stdio.
 */

import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { loadConfig } from './utils/config.js';
import { setDebug, info, error } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * Creates a sandbox server for Smithery capability scanning.
 * This allows Smithery to scan tools/resources without real credentials.
 */
export function createSandboxServer() {
	return createServer();
}

async function main(): Promise<void> {
	// Load configuration
	const config = loadConfig();

	// Enable debug logging if configured
	if (config.debug) {
		setDebug(true);
		info('Debug logging enabled');
	}

	// Create HTTP server
	const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
		// Health check endpoint
		if (req.method === 'GET' && req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'ok', version: '1.3.5' }));
			return;
		}

		// MCP endpoint
		if (req.method === 'POST' && req.url === '/mcp') {
			try {
				// Parse JSON body
				let body = '';
				for await (const chunk of req) {
					body += chunk;
				}
				const jsonBody = JSON.parse(body);

				// Create fresh server and transport per request
				const server = createServer();
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: undefined,
					enableJsonResponse: true
				});

				// Clean up on response finish
				res.on('finish', () => {
					transport.close();
					server.close();
				});

				// Connect and handle request
				await server.connect(transport);
				await transport.handleRequest(req, res, jsonBody);
			} catch (err) {
				error('Error handling MCP request', err);
				if (!res.headersSent) {
					res.writeHead(500, { 'Content-Type': 'application/json' });
					res.end(
						JSON.stringify({
							jsonrpc: '2.0',
							error: {
								code: -32603,
								message: 'Internal server error'
							},
							id: null
						})
					);
				}
			}
			return;
		}

		// 404 for other routes
		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found' }));
	});

	httpServer.listen(PORT, '0.0.0.0', () => {
		info(`StacksFinder MCP HTTP Server running on port ${PORT}`);
		info('POST /mcp for MCP requests, GET /health for health checks');
	});
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
