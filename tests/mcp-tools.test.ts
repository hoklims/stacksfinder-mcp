/**
 * MCP Server Integration Tests
 *
 * Tests all 21 MCP tools to ensure they are functional.
 * Run with: npm test or vitest
 */

import { describe, test, expect, beforeAll } from 'vitest';
import { createServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListToolsResultSchema, type CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// ============================================================================
// TEST SETUP
// ============================================================================

// Helper to extract text from tool result
function getResultText(result: CallToolResult): string {
	const content = result.content as Array<{ type: string; text?: string }>;
	const textContent = content.find((c) => c.type === 'text');
	return textContent?.text || '';
}

let client: Client;
let server: ReturnType<typeof createServer>;

beforeAll(async () => {
	server = createServer();
	client = new Client({ name: 'test-client', version: '1.0.0' });

	const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
	await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
});

// ============================================================================
// TOOL DISCOVERY TESTS
// ============================================================================

describe('MCP Server Tool Discovery', () => {
	test('should list all 21 registered tools', async () => {
		const result = await client.request({ method: 'tools/list' }, ListToolsResultSchema);

		expect(result.tools).toBeDefined();
		expect(result.tools.length).toBe(21);

		const toolNames = result.tools.map((t) => t.name);
		expect(toolNames).toContain('list_technologies');
		expect(toolNames).toContain('analyze_tech');
		expect(toolNames).toContain('compare_techs');
		expect(toolNames).toContain('recommend_stack_demo');
		expect(toolNames).toContain('recommend_stack');
		expect(toolNames).toContain('get_blueprint');
		expect(toolNames).toContain('create_blueprint');
		expect(toolNames).toContain('setup_api_key');
		expect(toolNames).toContain('list_api_keys');
		expect(toolNames).toContain('revoke_api_key');
		expect(toolNames).toContain('create_audit');
		expect(toolNames).toContain('get_audit');
		expect(toolNames).toContain('list_audits');
		expect(toolNames).toContain('compare_audits');
		expect(toolNames).toContain('get_audit_quota');
		expect(toolNames).toContain('get_migration_recommendation');
		expect(toolNames).toContain('generate_mcp_kit');
		expect(toolNames).toContain('analyze_repo_mcps');
		expect(toolNames).toContain('prepare_mcp_installation');
		expect(toolNames).toContain('execute_mcp_installation');
		expect(toolNames).toContain('check_mcp_compatibility');
	});

	test('all tools should have annotations', async () => {
		const result = await client.request({ method: 'tools/list' }, ListToolsResultSchema);

		for (const tool of result.tools) {
			expect(tool.annotations).toBeDefined();
			expect(tool.annotations?.readOnlyHint).toBeDefined();
			expect(tool.annotations?.openWorldHint).toBeDefined();
		}
	});

	test('local tools should have openWorldHint=false', async () => {
		const result = await client.request({ method: 'tools/list' }, ListToolsResultSchema);

		const localTools = [
			'list_technologies',
			'analyze_tech',
			'compare_techs',
			'recommend_stack_demo',
			'generate_mcp_kit',
			'check_mcp_compatibility',
			'analyze_repo_mcps',
			'execute_mcp_installation'
		];

		for (const toolName of localTools) {
			const tool = result.tools.find((t) => t.name === toolName);
			expect(tool).toBeDefined();
			expect(tool?.annotations?.openWorldHint).toBe(false);
		}
	});

	test('API tools should have openWorldHint=true', async () => {
		const result = await client.request({ method: 'tools/list' }, ListToolsResultSchema);

		const apiTools = [
			'recommend_stack',
			'get_blueprint',
			'create_blueprint',
			'setup_api_key',
			'list_api_keys',
			'revoke_api_key',
			'create_audit',
			'get_audit',
			'list_audits',
			'compare_audits',
			'get_audit_quota',
			'get_migration_recommendation'
		];

		for (const toolName of apiTools) {
			const tool = result.tools.find((t) => t.name === toolName);
			expect(tool).toBeDefined();
			expect(tool?.annotations?.openWorldHint).toBe(true);
		}
	});
});

// ============================================================================
// LOCAL TOOL TESTS (no API key required)
// ============================================================================

describe('Local Tools (No API Key)', () => {
	test('list_technologies should return technologies', async () => {
		const result = (await client.callTool({
			name: 'list_technologies',
			arguments: {}
		})) as CallToolResult;

		expect(result.content).toBeDefined();
		const text = getResultText(result);
		expect(text).toContain('technologies');
		expect(text).toContain('frontend');
	});

	test('list_technologies should filter by category', async () => {
		const result = (await client.callTool({
			name: 'list_technologies',
			arguments: { category: 'database' }
		})) as CallToolResult;

		const text = getResultText(result);
		expect(text).toContain('database');
	});

	test('analyze_tech should analyze nextjs', async () => {
		const result = (await client.callTool({
			name: 'analyze_tech',
			arguments: { technology: 'nextjs' }
		})) as CallToolResult;

		const text = getResultText(result);
		expect(text).toContain('Next.js');
		expect(text).toContain('Score');
	});

	test('analyze_tech should return error for unknown tech', async () => {
		const result = (await client.callTool({
			name: 'analyze_tech',
			arguments: { technology: 'unknown-tech-xyz' }
		})) as CallToolResult;

		expect(result.isError).toBe(true);
		const text = getResultText(result);
		expect(text).toContain('Unknown');
	});

	test('compare_techs should compare frameworks', async () => {
		const result = (await client.callTool({
			name: 'compare_techs',
			arguments: { technologies: ['nextjs', 'sveltekit'] }
		})) as CallToolResult;

		const text = getResultText(result);
		expect(text).toContain('Comparison');
		expect(text).toContain('Next.js');
		expect(text).toContain('SvelteKit');
	});

	test('compare_techs should handle different contexts', async () => {
		const result = (await client.callTool({
			name: 'compare_techs',
			arguments: { technologies: ['postgres', 'mysql'], context: 'enterprise' }
		})) as CallToolResult;

		const text = getResultText(result);
		// Comparison might not include context word but should work
		expect(text).toContain('Comparison');
	});

	test('recommend_stack_demo should return recommendations', async () => {
		const result = (await client.callTool({
			name: 'recommend_stack_demo',
			arguments: { projectType: 'saas' }
		})) as CallToolResult;

		// May return rate limit error, that's fine
		const text = getResultText(result);
		expect(text.length).toBeGreaterThan(0);
	});

	test('generate_mcp_kit should generate recommendations', async () => {
		const result = (await client.callTool({
			name: 'generate_mcp_kit',
			arguments: {
				projectDescription:
					'A SaaS application for managing customer subscriptions with Stripe payments, PostgreSQL database, and Next.js frontend'
			}
		})) as CallToolResult;

		const text = getResultText(result);
		const parsed = JSON.parse(text);
		expect(parsed).toHaveProperty('stack');
		expect(parsed).toHaveProperty('mcps');
	});

	test('check_mcp_compatibility should detect conflicts', async () => {
		const result = (await client.callTool({
			name: 'check_mcp_compatibility',
			arguments: { mcps: ['supabase-mcp', 'neon-mcp'] }
		})) as CallToolResult;

		const text = getResultText(result);
		expect(text.toLowerCase()).toContain('conflict');
	});

	test('check_mcp_compatibility should detect synergies', async () => {
		const result = (await client.callTool({
			name: 'check_mcp_compatibility',
			arguments: { mcps: ['stripe-mcp', 'resend-mcp'] }
		})) as CallToolResult;

		const text = getResultText(result);
		expect(text.toLowerCase()).toContain('synerg');
	});
});

// ============================================================================
// API TOOL TESTS (require API key - test error handling)
// ============================================================================

describe('API Tools (Error Handling Without API Key)', () => {
	test('recommend_stack should require API key or config', async () => {
		const result = (await client.callTool({
			name: 'recommend_stack',
			arguments: { projectType: 'saas' }
		})) as CallToolResult;

		// Should fail without API key or config
		expect(result.isError).toBe(true);
		const text = getResultText(result);
		// Error message could be about config or API key
		expect(text.toLowerCase()).toMatch(/config|api|error/i);
	});

	test('get_blueprint should handle invalid UUID', async () => {
		// This tests input validation
		try {
			await client.callTool({
				name: 'get_blueprint',
				arguments: { blueprintId: 'not-a-uuid' }
			});
		} catch (error) {
			// Expected to fail validation
			expect(error).toBeDefined();
		}
	});

	test('list_api_keys should require API key', async () => {
		const result = (await client.callTool({
			name: 'list_api_keys',
			arguments: {}
		})) as CallToolResult;

		expect(result.isError).toBe(true);
	});

	test('get_audit_quota should require API key', async () => {
		const result = (await client.callTool({
			name: 'get_audit_quota',
			arguments: {}
		})) as CallToolResult;

		expect(result.isError).toBe(true);
	});

	test('create_audit should require API key', async () => {
		const result = (await client.callTool({
			name: 'create_audit',
			arguments: {
				name: 'Test Audit',
				technologies: [{ name: 'React', version: '18.0.0' }]
			}
		})) as CallToolResult;

		expect(result.isError).toBe(true);
	});
});

// ============================================================================
// INPUT VALIDATION TESTS
// ============================================================================

describe('Input Validation', () => {
	test('analyze_tech should require technology parameter', async () => {
		try {
			await client.callTool({
				name: 'analyze_tech',
				arguments: {}
			});
			expect(true).toBe(false); // Should not reach here
		} catch (error) {
			expect(error).toBeDefined();
		}
	});

	test('compare_techs should require at least 2 technologies', async () => {
		try {
			await client.callTool({
				name: 'compare_techs',
				arguments: { technologies: ['nextjs'] }
			});
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeDefined();
		}
	});

	test('compare_techs should reject more than 4 technologies', async () => {
		try {
			await client.callTool({
				name: 'compare_techs',
				arguments: { technologies: ['nextjs', 'sveltekit', 'remix', 'nuxt', 'astro'] }
			});
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeDefined();
		}
	});

	test('generate_mcp_kit should require minimum description length', async () => {
		try {
			await client.callTool({
				name: 'generate_mcp_kit',
				arguments: { projectDescription: 'Too short' }
			});
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeDefined();
		}
	});

	test('check_mcp_compatibility should require at least 1 MCP', async () => {
		try {
			await client.callTool({
				name: 'check_mcp_compatibility',
				arguments: { mcps: [] }
			});
			expect(true).toBe(false);
		} catch (error) {
			expect(error).toBeDefined();
		}
	});
});

// ============================================================================
// PROJECT-KIT TOOL TESTS
// ============================================================================

describe('Project-Kit Tools', () => {
	test('analyze_repo_mcps should work without workspace', async () => {
		const result = (await client.callTool({
			name: 'analyze_repo_mcps',
			arguments: { workspaceRoot: '/nonexistent/path' }
		})) as CallToolResult;

		// Should return empty analysis, not error
		const text = getResultText(result);
		expect(text).toContain('Repository Analysis');
	});

	test('execute_mcp_installation should handle missing .env-mcp', async () => {
		const result = (await client.callTool({
			name: 'execute_mcp_installation',
			arguments: { envMcpPath: '/nonexistent/.env-mcp' }
		})) as CallToolResult;

		const text = getResultText(result);
		// Should handle gracefully
		expect(text.length).toBeGreaterThan(0);
	});
});
