#!/usr/bin/env node

/**
 * HTTP entry point for Smithery hosted deployments.
 */

import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { loadConfig } from './utils/config.js';
import { setDebug, info, error } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * Creates a sandbox server for Smithery capability scanning.
 * Default export as required by Smithery.
 */
export function createSandboxServer() {
	return createServer();
}

// Default export must be the createServer function for Smithery
export default createSandboxServer;

async function main(): Promise<void> {
	const config = loadConfig();

	if (config.debug) {
		setDebug(true);
		info('Debug logging enabled');
	}

	const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
		if (req.method === 'GET' && req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'ok', version: '1.3.5' }));
			return;
		}

		if (req.method === 'POST' && req.url === '/mcp') {
			try {
				let body = '';
				for await (const chunk of req) {
					body += chunk;
				}
				const jsonBody = JSON.parse(body);

				const server = createServer();
				const transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: undefined,
					enableJsonResponse: true
				});

				res.on('finish', () => {
					transport.close();
					server.close();
				});

				await server.connect(transport);
				await transport.handleRequest(req, res, jsonBody);
			} catch (err) {
				error('Error handling MCP request', err);
				if (!res.headersSent) {
					res.writeHead(500, { 'Content-Type': 'application/json' });
					res.end(
						JSON.stringify({
							jsonrpc: '2.0',
							error: { code: -32603, message: 'Internal server error' },
							id: null
						})
					);
				}
			}
			return;
		}

		res.writeHead(404, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify({ error: 'Not found' }));
	});

	httpServer.listen(PORT, '0.0.0.0', () => {
		info(`StacksFinder MCP HTTP Server running on port ${PORT}`);
		info('POST /mcp for MCP requests, GET /health for health checks');
	});
}

// Only start server when run directly
const isDirectRun = process.argv[1]?.includes('http') || process.env.SMITHERY_RUN === 'true';
if (isDirectRun && !process.env.SMITHERY_SCAN) {
	main().catch((err) => {
		console.error('Fatal error:', err);
		process.exit(1);
	});
}
