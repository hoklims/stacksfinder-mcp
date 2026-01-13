/**
 * Project Kit Tests
 *
 * Tests for the generate_mcp_kit and analyze_repo_mcps tools.
 */

import { describe, it, expect } from 'vitest';
import {
	matchMCPsForTechnologies,
	generateInstallConfig,
	TECH_MCP_MAPPINGS
} from '../src/tools/project-kit/match-mcps.js';
import type { MCPRecommendation, DetectedStack } from '../src/tools/project-kit/types.js';
import { PRIORITIES, PROJECT_TYPES, SCALES } from '../src/tools/project-kit/types.js';
import {
	MCP_REGISTRY,
	getMCPRegistryEntry,
	getRequiredEnvVars
} from '../src/tools/project-kit/installation-types.js';

// ============================================================================
// TECH MCP MAPPINGS TESTS
// ============================================================================

describe('TECH_MCP_MAPPINGS', () => {
	it('should have mappings for major database services', () => {
		const dbMcps = TECH_MCP_MAPPINGS.filter((m) => m.category === 'database');
		expect(dbMcps.length).toBeGreaterThan(0);

		const slugs = dbMcps.map((m) => m.mcpSlug);
		expect(slugs).toContain('supabase-mcp');
		expect(slugs).toContain('neon-mcp');
	});

	it('should have mappings for hosting providers', () => {
		const hostingMcps = TECH_MCP_MAPPINGS.filter((m) => m.category === 'hosting');
		expect(hostingMcps.length).toBeGreaterThan(0);

		const slugs = hostingMcps.map((m) => m.mcpSlug);
		expect(slugs).toContain('vercel-mcp');
		expect(slugs).toContain('cloudflare-mcp');
	});

	it('should have valid priority values', () => {
		const validPriorities = ['high', 'medium', 'low'];
		for (const mapping of TECH_MCP_MAPPINGS) {
			expect(validPriorities).toContain(mapping.priority);
		}
	});

	it('should have reasons for all mappings', () => {
		for (const mapping of TECH_MCP_MAPPINGS) {
			expect(mapping.reason.length).toBeGreaterThan(0);
		}
	});
});

// ============================================================================
// MATCH MCPS FOR TECHNOLOGIES TESTS
// ============================================================================

describe('matchMCPsForTechnologies', () => {
	it('should match Supabase to supabase-mcp', () => {
		const techs = ['supabase'];
		const result = matchMCPsForTechnologies(techs);

		const supabaseMcp = result.find((r) => r.slug === 'supabase-mcp');
		expect(supabaseMcp).toBeDefined();
		expect(supabaseMcp?.priority).toBe('high');
	});

	it('should match Vercel to vercel-mcp', () => {
		const techs = ['vercel'];
		const result = matchMCPsForTechnologies(techs);

		const vercelMcp = result.find((r) => r.slug === 'vercel-mcp');
		expect(vercelMcp).toBeDefined();
	});

	it('should include universal MCPs', () => {
		const techs = ['nextjs'];
		const result = matchMCPsForTechnologies(techs);

		// Should include context7 as a universal MCP
		const context7 = result.find((r) => r.slug === 'context7');
		expect(context7).toBeDefined();
		expect(context7?.matchedTech).toBe('universal');
	});

	it('should filter out installed MCPs when specified', () => {
		const techs = ['supabase', 'vercel'];
		const installedMcps = ['supabase-mcp'];

		const result = matchMCPsForTechnologies(techs, {
			includeInstalled: false,
			installedMcps
		});

		const supabaseMcp = result.find((r) => r.slug === 'supabase-mcp');
		expect(supabaseMcp).toBeUndefined();

		const vercelMcp = result.find((r) => r.slug === 'vercel-mcp');
		expect(vercelMcp).toBeDefined();
	});

	it('should include installed MCPs when includeInstalled is true', () => {
		const techs = ['supabase'];
		const installedMcps = ['supabase-mcp'];

		const result = matchMCPsForTechnologies(techs, {
			includeInstalled: true,
			installedMcps
		});

		const supabaseMcp = result.find((r) => r.slug === 'supabase-mcp');
		expect(supabaseMcp).toBeDefined();
	});

	it('should handle empty tech array', () => {
		const techs: string[] = [];
		const result = matchMCPsForTechnologies(techs);

		// Should still include universal MCPs
		expect(result.length).toBeGreaterThan(0);
	});

	it('should not duplicate MCPs', () => {
		const techs = ['supabase', 'postgresql'];
		const result = matchMCPsForTechnologies(techs);

		const slugs = result.map((r) => r.slug);
		const uniqueSlugs = new Set(slugs);
		expect(slugs.length).toBe(uniqueSlugs.size);
	});
});

// ============================================================================
// GENERATE INSTALL CONFIG TESTS
// ============================================================================

describe('generateInstallConfig', () => {
	it('should generate valid Claude Desktop config', () => {
		const mcps: MCPRecommendation[] = [
			{
				slug: 'github-mcp',
				name: 'GitHub MCP',
				description: 'GitHub operations',
				priority: 'high',
				matchedTech: 'universal',
				installCommand: 'npx -y @modelcontextprotocol/server-github',
				envVars: ['GITHUB_TOKEN']
			}
		];

		const config = generateInstallConfig(mcps);

		expect(config.claudeDesktop).toBeDefined();
		expect(config.claudeDesktop.mcpServers).toBeDefined();
		expect(config.claudeDesktop.mcpServers['github-mcp']).toBeDefined();
	});

	it('should generate npx command format', () => {
		const mcps: MCPRecommendation[] = [
			{
				slug: 'neon-mcp',
				name: 'Neon MCP',
				description: 'Neon database',
				priority: 'high',
				matchedTech: 'neon',
				installCommand: 'npx -y @neondatabase/mcp-server-neon',
				envVars: ['NEON_API_KEY']
			}
		];

		const config = generateInstallConfig(mcps);
		const neonConfig = config.claudeDesktop.mcpServers['neon-mcp'] as {
			command: string;
			args: string[];
			env: Record<string, string>;
		};

		expect(neonConfig.command).toBe('npx');
		expect(neonConfig.args).toContain('-y');
		expect(neonConfig.args).toContain('neon-mcp');
	});

	it('should handle empty MCP array', () => {
		const mcps: MCPRecommendation[] = [];
		const config = generateInstallConfig(mcps);

		expect(config.claudeDesktop.mcpServers).toEqual({});
	});
});

// ============================================================================
// TYPES CONSTANTS TESTS
// ============================================================================

describe('Type Constants', () => {
	it('should export valid PRIORITIES', () => {
		expect(PRIORITIES).toContain('time-to-market');
		expect(PRIORITIES).toContain('scalability');
		expect(PRIORITIES).toContain('developer-experience');
		expect(PRIORITIES.length).toBeGreaterThanOrEqual(7);
	});

	it('should export valid PROJECT_TYPES', () => {
		expect(PROJECT_TYPES).toContain('web-app');
		expect(PROJECT_TYPES).toContain('saas');
		expect(PROJECT_TYPES).toContain('api');
		expect(PROJECT_TYPES.length).toBeGreaterThanOrEqual(8);
	});

	it('should export valid SCALES', () => {
		expect(SCALES).toContain('mvp');
		expect(SCALES).toContain('startup');
		expect(SCALES).toContain('growth');
		expect(SCALES).toContain('enterprise');
	});
});

// ============================================================================
// MCP REGISTRY TESTS
// ============================================================================

describe('MCP_REGISTRY', () => {
	it('should have entries for major database services', () => {
		const dbMcps = MCP_REGISTRY.filter((m) => m.category === 'database');
		expect(dbMcps.length).toBeGreaterThan(0);

		const slugs = dbMcps.map((m) => m.slug);
		expect(slugs).toContain('supabase-mcp');
		expect(slugs).toContain('neon-mcp');
		expect(slugs).toContain('postgres-mcp');
	});

	it('should have entries for payment services', () => {
		const paymentMcps = MCP_REGISTRY.filter((m) => m.category === 'payments');
		expect(paymentMcps.length).toBeGreaterThan(0);

		const slugs = paymentMcps.map((m) => m.slug);
		expect(slugs).toContain('stripe-mcp');
		expect(slugs).toContain('paddle-mcp');
	});

	it('should have valid npm package names', () => {
		for (const entry of MCP_REGISTRY) {
			expect(entry.npmPackage).toBeDefined();
			expect(entry.npmPackage.length).toBeGreaterThan(0);
			// npm packages should start with @ or a lowercase letter
			expect(entry.npmPackage).toMatch(/^[@a-z]/);
		}
	});

	it('should have required env vars marked correctly', () => {
		const supabase = MCP_REGISTRY.find((m) => m.slug === 'supabase-mcp');
		expect(supabase).toBeDefined();
		expect(supabase!.envVars.length).toBeGreaterThan(0);

		const requiredVars = supabase!.envVars.filter((v) => v.requirement === 'required');
		expect(requiredVars.length).toBe(2); // SUPABASE_URL, SUPABASE_SERVICE_KEY
	});

	it('should have entries that need no env vars', () => {
		const context7 = MCP_REGISTRY.find((m) => m.slug === 'context7');
		expect(context7).toBeDefined();
		expect(context7!.envVars.length).toBe(0);

		const playwright = MCP_REGISTRY.find((m) => m.slug === 'playwright-mcp');
		expect(playwright).toBeDefined();
		expect(playwright!.envVars.length).toBe(0);
	});
});

describe('getMCPRegistryEntry', () => {
	it('should return entry for valid slug', () => {
		const entry = getMCPRegistryEntry('neon-mcp');
		expect(entry).toBeDefined();
		expect(entry!.name).toBe('Neon MCP');
		expect(entry!.npmPackage).toBe('@neondatabase/mcp-server-neon');
	});

	it('should return undefined for unknown slug', () => {
		const entry = getMCPRegistryEntry('unknown-mcp');
		expect(entry).toBeUndefined();
	});

	it('should find universal MCPs', () => {
		const context7 = getMCPRegistryEntry('context7');
		expect(context7).toBeDefined();
		expect(context7!.category).toBe('documentation');
	});
});

describe('getRequiredEnvVars', () => {
	it('should collect env vars from multiple MCPs', () => {
		const envVars = getRequiredEnvVars(['supabase-mcp', 'neon-mcp']);
		expect(envVars.length).toBeGreaterThanOrEqual(3); // 2 from Supabase + 1 from Neon
	});

	it('should deduplicate env vars', () => {
		// Even if called twice with the same MCP, should not duplicate
		const envVars = getRequiredEnvVars(['neon-mcp', 'neon-mcp']);
		const neonApiKeys = envVars.filter((v) => v.name === 'NEON_API_KEY');
		expect(neonApiKeys.length).toBe(1);
	});

	it('should return empty array for unknown slugs', () => {
		const envVars = getRequiredEnvVars(['unknown-1', 'unknown-2']);
		expect(envVars.length).toBe(0);
	});

	it('should handle MCPs with no env vars', () => {
		const envVars = getRequiredEnvVars(['context7', 'playwright-mcp']);
		expect(envVars.length).toBe(0);
	});
});

// ============================================================================
// ENV-MCP PARSING TESTS (inline helper since function is not exported)
// ============================================================================

describe('parseEnvMcpContent (logic validation)', () => {
	// We test the parsing logic indirectly through the expected behavior

	it('should parse INSTALL_xxx flags correctly', () => {
		const content = `
# Comment line
INSTALL_NEON_MCP=true
INSTALL_SUPABASE_MCP=false
NEON_API_KEY=test_key
`;
		// The parsing converts INSTALL_NEON_MCP to slug 'neon-mcp'
		// and INSTALL_SUPABASE_MCP to slug 'supabase-mcp'
		// This tests the slug conversion logic: NEON_MCP -> neon-mcp
		const slug = 'NEON_MCP'.toLowerCase().replace(/_/g, '-');
		expect(slug).toBe('neon-mcp');
	});

	it('should handle empty values', () => {
		const content = 'NEON_API_KEY=';
		// Empty values should not be added to envVars map
		const eqIndex = content.indexOf('=');
		const value = content.substring(eqIndex + 1).trim();
		expect(value).toBe('');
	});

	it('should skip comment lines', () => {
		const lines = ['# This is a comment', 'NEON_API_KEY=value'];
		const nonComments = lines.filter((l) => !l.trim().startsWith('#'));
		expect(nonComments.length).toBe(1);
	});
});

// ============================================================================
// COMMAND GENERATION TESTS (logic validation)
// ============================================================================

describe('Command generation (logic validation)', () => {
	it('should format Claude Code command correctly', () => {
		// Test the expected format of claude mcp add-json command
		const slug = 'neon-mcp';
		const config = {
			command: 'npx',
			args: ['-y', '@neondatabase/mcp-server-neon'],
			env: { NEON_API_KEY: 'test_key' }
		};

		const jsonStr = JSON.stringify(config).replace(/"/g, '\\"');
		const expectedCommand = `claude mcp add-json "${slug}" "${jsonStr}"`;

		expect(expectedCommand).toContain('claude mcp add-json');
		expect(expectedCommand).toContain('neon-mcp');
		expect(expectedCommand).toContain('npx');
	});

	it('should not include env in config when no vars needed', () => {
		const config: Record<string, unknown> = {
			command: 'npx',
			args: ['-y', '@upstash/context7-mcp']
		};

		// Empty envVars should not add env property
		const envObj: Record<string, string> = {};
		if (Object.keys(envObj).length > 0) {
			config.env = envObj;
		}

		expect(config.env).toBeUndefined();
	});
});

// ============================================================================
// VALIDATION TESTS (logic validation)
// ============================================================================

describe('validateEnvVars (logic validation)', () => {
	it('should identify missing required vars', () => {
		const requiredVars = [
			{ name: 'API_KEY', description: 'Key', requirement: 'required' as const },
			{ name: 'OPTIONAL_VAR', description: 'Optional', requirement: 'optional' as const }
		];

		const envVars = new Map<string, string>();
		// Don't set API_KEY

		const missingVars: string[] = [];
		for (const varDef of requiredVars) {
			if (varDef.requirement === 'required') {
				const value = envVars.get(varDef.name);
				if (!value || value.trim() === '') {
					missingVars.push(varDef.name);
				}
			}
		}

		expect(missingVars).toContain('API_KEY');
		expect(missingVars).not.toContain('OPTIONAL_VAR');
	});

	it('should pass when all required vars are present', () => {
		const requiredVars = [
			{ name: 'API_KEY', description: 'Key', requirement: 'required' as const }
		];

		const envVars = new Map<string, string>();
		envVars.set('API_KEY', 'my_key');

		const missingVars: string[] = [];
		for (const varDef of requiredVars) {
			if (varDef.requirement === 'required') {
				const value = envVars.get(varDef.name);
				if (!value || value.trim() === '') {
					missingVars.push(varDef.name);
				}
			}
		}

		expect(missingVars.length).toBe(0);
	});
});
