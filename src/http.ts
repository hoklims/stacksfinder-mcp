#!/usr/bin/env node

/**
 * HTTP entry point for Smithery hosted deployments.
 * Compatible with ChatGPT Developer Mode and other MCP clients.
 */

import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { loadConfig } from './utils/config.js';
import { setDebug, info, error } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Load version from package.json
const __dirname = dirname(fileURLToPath(import.meta.url));
let VERSION = '1.4.0';
try {
	const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
	VERSION = pkg.version;
} catch {
	// Fallback to hardcoded version if package.json is not available (e.g., in bundled builds)
}

// ============================================================================
// Rate Limiting (in-memory, 60 req/min per IP)
// ============================================================================
const RATE_LIMIT = 60;
const RATE_WINDOW = 60000; // 1 minute
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: IncomingMessage): string {
	return (
		req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
		req.socket.remoteAddress ||
		'unknown'
	);
}

function isRateLimited(key: string): { limited: boolean; remaining: number; resetIn: number } {
	const now = Date.now();
	const entry = requestCounts.get(key);

	if (!entry || now > entry.resetAt) {
		requestCounts.set(key, { count: 1, resetAt: now + RATE_WINDOW });
		return { limited: false, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW };
	}

	entry.count++;
	const remaining = Math.max(0, RATE_LIMIT - entry.count);
	const resetIn = entry.resetAt - now;

	return { limited: entry.count > RATE_LIMIT, remaining, resetIn };
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of requestCounts.entries()) {
		if (now > entry.resetAt) {
			requestCounts.delete(key);
		}
	}
}, 300000);

// ============================================================================
// CORS Headers (optional, for browser-based testing)
// ============================================================================
const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	Vary: 'Origin'
};

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
		// Generate request ID for log correlation
		const requestId = randomUUID().slice(0, 8);
		const clientIp = getRateLimitKey(req);

		// Apply CORS headers to all responses
		Object.entries(CORS_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

		// Handle CORS preflight
		if (req.method === 'OPTIONS') {
			res.writeHead(204);
			res.end();
			return;
		}

		// Health check endpoint (no rate limiting)
		if (req.method === 'GET' && req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'ok', version: VERSION }));
			return;
		}

		// Rate limiting for MCP endpoint
		const rateLimit = isRateLimited(clientIp);
		res.setHeader('X-RateLimit-Limit', RATE_LIMIT.toString());
		res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
		res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetIn / 1000).toString());

		if (rateLimit.limited) {
			info(`[${requestId}] Rate limit exceeded for ${clientIp}`);
			res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
			res.end(JSON.stringify({ error: 'Rate limit exceeded. Try again in 60 seconds.' }));
			return;
		}

		if (req.method === 'POST' && req.url === '/mcp') {
			info(`[${requestId}] MCP request from ${clientIp}`);

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
				error(`[${requestId}] Error handling MCP request`, err);
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

		info(`[${requestId}] 404 Not found: ${req.method} ${req.url}`);
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
