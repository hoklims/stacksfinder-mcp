/**
 * Project Kit Tests
 *
 * Tests for the generate_mcp_kit and analyze_repo_mcps tools.
 */

import { describe, it, expect } from 'bun:test';
import {
	matchMCPsForTechnologies,
	generateInstallConfig,
	TECH_MCP_MAPPINGS
} from '../src/tools/project-kit/match-mcps.js';
import type { MCPRecommendation, DetectedStack } from '../src/tools/project-kit/types.js';
import { PRIORITIES, PROJECT_TYPES, SCALES } from '../src/tools/project-kit/types.js';

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
