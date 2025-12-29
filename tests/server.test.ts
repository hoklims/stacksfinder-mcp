import { describe, it, expect, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import { loadConfig, resetConfig } from '../src/utils/config.js';

describe('MCP Server', () => {
	beforeEach(() => {
		resetConfig();
		// Set minimal env vars
		process.env.STACKSFINDER_API_URL = 'https://test.stacksfinder.com';
		loadConfig();
	});

	it('should create a server instance', () => {
		const server = createServer();
		expect(server).toBeDefined();
	});

	it('should be an McpServer instance with expected methods', () => {
		const server = createServer();
		// McpServer should have connect method
		expect(typeof server.connect).toBe('function');
	});
});
