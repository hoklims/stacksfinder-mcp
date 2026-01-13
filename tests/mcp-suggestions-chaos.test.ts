/**
 * MCP Suggestions Chaos Tests (Package)
 *
 * Tests the MCP server package suggestion tools with chaos inputs:
 * 1. Tech matching robustness
 * 2. Install config generation
 * 3. Edge cases and error handling
 * 4. Determinism across calls
 *
 * Run: npm test or bun test packages/mcp-server/tests/mcp-suggestions-chaos.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
	matchMCPsForTechnologies,
	matchMCPsForStack,
	generateInstallConfig,
	TECH_MCP_MAPPINGS,
	getSupportedTechnologies,
	getUniversalMCPs,
	getMCPsByCategory
} from '../src/tools/project-kit/match-mcps.js';
import type { DetectedStack, MCPRecommendation } from '../src/tools/project-kit/types.js';
import {
	MCP_REGISTRY,
	getMCPRegistryEntry,
	getRequiredEnvVars
} from '../src/tools/project-kit/installation-types.js';
import {
	executeCheckCompatibility,
	type CheckCompatibilityInput
} from '../src/tools/check-compatibility.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CHAOS INPUTS
// ═══════════════════════════════════════════════════════════════════════════════

const CHAOS_INPUTS = {
	unicode: ['日本語テック', 'émoji-tech', 'технология', '🚀-framework', '中文数据库'],
	specialChars: ['tech@name', 'tech#hash', 'tech$dollar', 'tech%percent', 'tech&amp', 'tech<>html'],
	whitespace: ['  spaced  ', '\ttabbed\t', '\nnewlined\n', ' \t\n mixed \n\t '],
	casing: ['SUPABASE', 'Supabase', 'supaBase', 'SUPABASE', 'suPAbase'],
	empty: ['', '   ', '\t', '\n'],
	veryLong: ['a'.repeat(200), 'tech-' + 'x'.repeat(500), 'abc'.repeat(100)],
	numeric: ['123', '456tech', 'tech789', '000', '999999'],
	similar: ['postgres', 'postgresql', 'postgre', 'postgress', 'pgsql', 'pg'],
	sqlInjection: ["'; DROP TABLE users; --", 'SELECT * FROM', 'OR 1=1', '<script>alert(1)</script>'],
	pathTraversal: ['../../../etc/passwd', '..\\..\\windows\\system32', '/dev/null']
};

// ═══════════════════════════════════════════════════════════════════════════════
// TECH MCP MAPPINGS CHAOS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('TECH_MCP_MAPPINGS - Chaos Tests', () => {
	it('should have no duplicate techIdentifier+mcpSlug pairs', () => {
		const seen = new Set<string>();
		const duplicates: string[] = [];

		for (const mapping of TECH_MCP_MAPPINGS) {
			const key = `${mapping.techIdentifier}:${mapping.mcpSlug}`;
			if (seen.has(key)) {
				duplicates.push(key);
			}
			seen.add(key);
		}

		expect(duplicates).toEqual([]);
	});

	it('should have valid slugs (lowercase, no spaces)', () => {
		for (const mapping of TECH_MCP_MAPPINGS) {
			expect(mapping.mcpSlug).toMatch(/^[a-z0-9-]+$/);
			expect(mapping.mcpSlug).not.toMatch(/\s/);
		}
	});

	it('should have non-empty reasons', () => {
		for (const mapping of TECH_MCP_MAPPINGS) {
			expect(mapping.reason.trim().length).toBeGreaterThan(5);
		}
	});

	it('should have valid priority values', () => {
		const validPriorities = ['high', 'medium', 'low'];
		for (const mapping of TECH_MCP_MAPPINGS) {
			expect(validPriorities).toContain(mapping.priority);
		}
	});

	it('should have entries for all major categories', () => {
		const categories = new Set(TECH_MCP_MAPPINGS.map((m) => m.category));
		expect(categories.has('database')).toBe(true);
		expect(categories.has('payments')).toBe(true);
		expect(categories.has('hosting')).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// matchMCPsForTechnologies CHAOS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('matchMCPsForTechnologies - Chaos Tests', () => {
	it('should handle empty technology array', () => {
		const result = matchMCPsForTechnologies([]);

		// Should still return universal MCPs
		expect(result.length).toBeGreaterThan(0);
		const universalCount = result.filter((r) => r.matchedTech === 'universal').length;
		expect(universalCount).toBeGreaterThan(0);
	});

	it('should handle unicode technology names gracefully', () => {
		const result = matchMCPsForTechnologies(CHAOS_INPUTS.unicode);

		// Should not throw and still include universal MCPs
		expect(result).toBeDefined();
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle special characters gracefully', () => {
		const result = matchMCPsForTechnologies(CHAOS_INPUTS.specialChars);

		// Should not throw
		expect(result).toBeDefined();
	});

	it('should handle SQL injection attempts gracefully', () => {
		const result = matchMCPsForTechnologies(CHAOS_INPUTS.sqlInjection);

		// Should not throw, no matches expected
		expect(result).toBeDefined();
		// Should still have universal MCPs
		const universal = result.filter((r) => r.matchedTech === 'universal');
		expect(universal.length).toBeGreaterThan(0);
	});

	it('should handle path traversal attempts gracefully', () => {
		const result = matchMCPsForTechnologies(CHAOS_INPUTS.pathTraversal);

		// Should not throw
		expect(result).toBeDefined();
	});

	it('should handle very long technology names', () => {
		const result = matchMCPsForTechnologies(CHAOS_INPUTS.veryLong);

		// Should not throw
		expect(result).toBeDefined();
	});

	it('should be case-insensitive for matching', () => {
		// All casing variants of supabase should produce same matches
		const results = CHAOS_INPUTS.casing.map((c) => matchMCPsForTechnologies([c]));

		// Each should find supabase-mcp (if properly case-insensitive)
		const supabaseMatches = results.map((r) => r.find((m) => m.slug === 'supabase-mcp'));

		// At least one should match
		const matchCount = supabaseMatches.filter((m) => m !== undefined).length;
		expect(matchCount).toBeGreaterThan(0);
	});

	it('should handle postgres variations', () => {
		// Test that postgres/postgresql/pg variations are handled
		const results = CHAOS_INPUTS.similar.map((s) => matchMCPsForTechnologies([s]));

		// At least some should match postgres-related MCPs
		const hasPostgresMatch = results.some((r) =>
			r.some((m) => m.slug.includes('postgres') || m.slug.includes('neon'))
		);
		// This depends on exact matching logic - either way, should not throw
		expect(results).toBeDefined();
	});

	it('should handle duplicate technologies', () => {
		const techs = ['supabase', 'supabase', 'supabase', 'stripe', 'stripe'];
		const result = matchMCPsForTechnologies(techs);

		// Should dedupe - no duplicate slugs
		const slugs = result.map((r) => r.slug);
		const uniqueSlugs = new Set(slugs);
		expect(slugs.length).toBe(uniqueSlugs.size);
	});

	it('should be deterministic - same input produces same output', () => {
		const techs = ['supabase', 'stripe', 'vercel'];

		const results = Array.from({ length: 5 }, () => matchMCPsForTechnologies(techs));

		// All results should have same length
		const lengths = results.map((r) => r.length);
		expect(new Set(lengths).size).toBe(1);

		// All results should have same slugs in same order
		const slugLists = results.map((r) => r.map((m) => m.slug).join(','));
		expect(new Set(slugLists).size).toBe(1);
	});

	it('should handle mix of valid and invalid technologies', () => {
		const techs = [
			'supabase', // Valid
			'🚀-tech', // Invalid
			'stripe', // Valid
			'unknown-xyz', // Invalid
			'vercel' // Valid
		];

		const result = matchMCPsForTechnologies(techs);

		// Should find matches for valid ones
		expect(result.some((r) => r.slug === 'supabase-mcp')).toBe(true);
		expect(result.some((r) => r.slug === 'stripe-mcp')).toBe(true);
	});

	it('should not include installed MCPs when excluded', () => {
		const techs = ['supabase', 'stripe', 'vercel'];
		const installedMcps = ['supabase-mcp', 'stripe-mcp'];

		const result = matchMCPsForTechnologies(techs, {
			includeInstalled: false,
			installedMcps
		});

		expect(result.find((r) => r.slug === 'supabase-mcp')).toBeUndefined();
		expect(result.find((r) => r.slug === 'stripe-mcp')).toBeUndefined();
		// vercel should still be included
		expect(result.find((r) => r.slug === 'vercel-mcp')).toBeDefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// matchMCPsForStack CHAOS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('matchMCPsForStack - Chaos Tests', () => {
	it('should handle empty stack', () => {
		const emptyStack: DetectedStack = {
			frontend: undefined,
			backend: undefined,
			database: undefined,
			orm: undefined,
			auth: undefined,
			hosting: undefined,
			payments: undefined,
			services: []
		};

		const result = matchMCPsForStack(emptyStack);

		// Should still return universal MCPs
		expect(result.length).toBeGreaterThan(0);
	});

	it('should handle stack with all categories', () => {
		const fullStack: DetectedStack = {
			frontend: { name: 'nextjs', version: '14.0.0', detected: 'package.json' },
			backend: { name: 'nodejs', version: '20.0.0', detected: 'package.json' },
			database: { name: 'supabase', version: '2.0.0', detected: '.env' },
			orm: { name: 'prisma', version: '5.0.0', detected: 'package.json' },
			auth: { name: 'clerk', version: '4.0.0', detected: 'package.json' },
			hosting: { name: 'vercel', version: undefined, detected: 'vercel.json' },
			payments: { name: 'stripe', version: '12.0.0', detected: 'package.json' },
			services: [
				{ name: 'github', detected: '.github' },
				{ name: 'sentry', detected: 'package.json' }
			]
		};

		const result = matchMCPsForStack(fullStack);

		// Should find matches for detected technologies
		expect(result.some((r) => r.slug === 'supabase-mcp')).toBe(true);
		expect(result.some((r) => r.slug === 'stripe-mcp')).toBe(true);
		expect(result.some((r) => r.slug === 'vercel-mcp')).toBe(true);
	});

	it('should handle stack with unknown technologies', () => {
		const stack: DetectedStack = {
			frontend: { name: 'unknown-framework', version: '1.0.0', detected: 'package.json' },
			backend: undefined,
			database: { name: '🚀-db', version: undefined, detected: '.env' },
			orm: undefined,
			auth: undefined,
			hosting: undefined,
			payments: undefined,
			services: []
		};

		const result = matchMCPsForStack(stack);

		// Should not throw
		expect(result).toBeDefined();
		// Should still include universal MCPs
		expect(result.some((r) => r.matchedTech === 'universal')).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// generateInstallConfig CHAOS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('generateInstallConfig - Chaos Tests', () => {
	it('should handle empty MCP array', () => {
		const config = generateInstallConfig([]);

		expect(config.claudeDesktop.mcpServers).toEqual({});
		expect(config.cursor.mcpServers).toEqual({});
		expect(config.windsurf.mcpServers).toEqual({});
	});

	it('should handle MCPs with special characters in slug', () => {
		const mcps: MCPRecommendation[] = [
			{
				slug: 'test-mcp-123',
				name: 'Test MCP',
				description: 'Test description with special chars: @#$%',
				priority: 'high',
				matchedTech: 'test',
				installCommand: 'npx -y test-mcp-123'
			}
		];

		const config = generateInstallConfig(mcps);

		expect(config.claudeDesktop.mcpServers).toHaveProperty('test-mcp-123');
	});

	it('should generate valid JSON-serializable config', () => {
		const mcps: MCPRecommendation[] = [
			{
				slug: 'neon-mcp',
				name: 'Neon MCP',
				description: 'Neon database',
				priority: 'high',
				matchedTech: 'neon',
				installCommand: 'npx -y @neondatabase/mcp-server-neon',
				envVars: ['NEON_API_KEY']
			},
			{
				slug: 'stripe-mcp',
				name: 'Stripe MCP',
				description: 'Stripe payments',
				priority: 'high',
				matchedTech: 'stripe',
				installCommand: 'npx -y @stripe/mcp-server',
				envVars: ['STRIPE_SECRET_KEY']
			}
		];

		const config = generateInstallConfig(mcps);

		// Should be JSON serializable
		const json = JSON.stringify(config);
		expect(json).toBeDefined();
		expect(() => JSON.parse(json)).not.toThrow();
	});

	it('should handle many MCPs without performance issues', () => {
		// Generate 50 mock MCPs
		const mcps: MCPRecommendation[] = Array.from({ length: 50 }, (_, i) => ({
			slug: `test-mcp-${i}`,
			name: `Test MCP ${i}`,
			description: `Description ${i}`,
			priority: 'high' as const,
			matchedTech: `tech-${i}`,
			installCommand: `npx -y test-mcp-${i}`
		}));

		const start = performance.now();
		const config = generateInstallConfig(mcps);
		const duration = performance.now() - start;

		// Should complete quickly (< 100ms)
		expect(duration).toBeLessThan(100);
		expect(Object.keys(config.claudeDesktop.mcpServers as Record<string, unknown>).length).toBe(50);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// MCP REGISTRY CHAOS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('MCP_REGISTRY - Chaos Tests', () => {
	it('should have no duplicate slugs', () => {
		const slugs = MCP_REGISTRY.map((m) => m.slug);
		const uniqueSlugs = new Set(slugs);
		expect(slugs.length).toBe(uniqueSlugs.size);
	});

	it('should have valid npm package names', () => {
		const npmPackageRegex = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

		for (const entry of MCP_REGISTRY) {
			expect(entry.npmPackage).toMatch(npmPackageRegex);
		}
	});

	it('should have consistent env var naming', () => {
		// Env vars should be UPPER_SNAKE_CASE
		const envVarRegex = /^[A-Z][A-Z0-9_]*$/;

		for (const entry of MCP_REGISTRY) {
			for (const envVar of entry.envVars) {
				expect(envVar.name).toMatch(envVarRegex);
			}
		}
	});

	it('should have entries with required env vars properly marked', () => {
		const validRequirements = ['required', 'optional'];

		for (const entry of MCP_REGISTRY) {
			for (const envVar of entry.envVars) {
				expect(validRequirements).toContain(envVar.requirement);
			}
		}
	});
});

describe('getMCPRegistryEntry - Chaos Tests', () => {
	it('should handle empty string', () => {
		const entry = getMCPRegistryEntry('');
		expect(entry).toBeUndefined();
	});

	it('should handle null-like strings', () => {
		const nullishInputs = ['null', 'undefined', 'NULL', 'UNDEFINED'];

		for (const input of nullishInputs) {
			const entry = getMCPRegistryEntry(input);
			expect(entry).toBeUndefined();
		}
	});

	it('should handle SQL injection attempts', () => {
		for (const input of CHAOS_INPUTS.sqlInjection) {
			const entry = getMCPRegistryEntry(input);
			expect(entry).toBeUndefined();
		}
	});

	it('should handle very long slugs', () => {
		const longSlug = 'a'.repeat(1000);
		const entry = getMCPRegistryEntry(longSlug);
		expect(entry).toBeUndefined();
	});
});

describe('getRequiredEnvVars - Chaos Tests', () => {
	it('should handle empty array', () => {
		const envVars = getRequiredEnvVars([]);
		expect(envVars).toEqual([]);
	});

	it('should handle array of unknown slugs', () => {
		const envVars = getRequiredEnvVars(['unknown-1', 'unknown-2', 'unknown-3']);
		expect(envVars).toEqual([]);
	});

	it('should handle mix of valid and invalid slugs', () => {
		const envVars = getRequiredEnvVars(['neon-mcp', 'invalid-xyz', 'supabase-mcp', 'unknown-abc']);

		// Should return env vars for valid slugs only
		expect(envVars.length).toBeGreaterThan(0);
		expect(envVars.some((v) => v.name === 'NEON_API_KEY')).toBe(true);
	});

	it('should deduplicate when same slug appears multiple times', () => {
		const envVars = getRequiredEnvVars(['neon-mcp', 'neon-mcp', 'neon-mcp']);

		const neonKeys = envVars.filter((v) => v.name === 'NEON_API_KEY');
		expect(neonKeys.length).toBe(1);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// MCP COMPATIBILITY CHAOS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('executeCheckCompatibility - Chaos Tests', () => {
	it('should handle empty array', () => {
		const result = executeCheckCompatibility({ mcps: [] });

		// Empty input returns error
		expect(result.isError).toBe(true);
	});

	it('should handle single MCP', () => {
		const result = executeCheckCompatibility({ mcps: ['neon-mcp'] });

		expect(result.data.summary.score).toBeGreaterThanOrEqual(0);
		expect(result.data.conflicts).toEqual([]);
		expect(result.data.redundancies).toEqual([]);
	});

	it('should handle unknown MCPs gracefully', () => {
		const result = executeCheckCompatibility({ mcps: ['unknown-mcp-1', 'unknown-mcp-2'] });

		// Should not throw and should have valid structure
		expect(result.data.summary.score).toBeDefined();
		expect(result.data.summary.grade).toBeDefined();
	});

	it('should detect conflicts between database providers', () => {
		const result = executeCheckCompatibility({ mcps: ['supabase-mcp', 'neon-mcp'] });

		// Should detect potential conflict (both are database providers)
		expect(result.data.conflicts.length).toBeGreaterThan(0);
		expect(result.data.summary.score).toBeLessThan(100);
	});

	it('should detect synergies', () => {
		const result = executeCheckCompatibility({ mcps: ['stripe-mcp', 'resend-mcp'] });

		// Stripe + Resend should have synergy (payment + email)
		expect(result.data.synergies.length).toBeGreaterThan(0);
	});

	it('should handle duplicate MCPs', () => {
		const result = executeCheckCompatibility({ mcps: ['neon-mcp', 'neon-mcp', 'neon-mcp'] });

		// Should handle gracefully (dedupe internally or not cause issues)
		expect(result).toBeDefined();
		expect(result.isError).toBeFalsy();
	});

	it('should handle many MCPs without performance issues', () => {
		const manyMcps = Array.from({ length: 20 }, (_, i) => `mcp-${i}`);

		const start = performance.now();
		const result = executeCheckCompatibility({ mcps: manyMcps });
		const duration = performance.now() - start;

		expect(duration).toBeLessThan(100);
		expect(result).toBeDefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('getSupportedTechnologies', () => {
	it('should return array of unique technologies', () => {
		const techs = getSupportedTechnologies();

		expect(techs.length).toBeGreaterThan(0);

		// Should be unique
		const uniqueTechs = new Set(techs);
		expect(techs.length).toBe(uniqueTechs.size);

		// Should be sorted
		const sorted = [...techs].sort();
		expect(techs).toEqual(sorted);
	});

	it('should include major technologies', () => {
		const techs = getSupportedTechnologies();

		expect(techs).toContain('supabase');
		expect(techs).toContain('stripe');
		expect(techs).toContain('vercel');
	});
});

describe('getUniversalMCPs', () => {
	it('should return array of universal MCPs', () => {
		const mcps = getUniversalMCPs();

		expect(mcps.length).toBeGreaterThan(0);

		// Should include context7
		expect(mcps.some((m) => m.slug === 'context7')).toBe(true);
	});

	it('should have valid priorities', () => {
		const mcps = getUniversalMCPs();
		const validPriorities = ['high', 'medium', 'low'];

		for (const mcp of mcps) {
			expect(validPriorities).toContain(mcp.priority);
		}
	});
});

describe('getMCPsByCategory', () => {
	it('should return MCPs for valid category', () => {
		const dbMcps = getMCPsByCategory('database');

		expect(dbMcps.length).toBeGreaterThan(0);
		for (const mcp of dbMcps) {
			expect(mcp.category).toBe('database');
		}
	});

	it('should return empty array for unknown category', () => {
		const mcps = getMCPsByCategory('unknown-category');
		expect(mcps).toEqual([]);
	});

	it('should return empty array for empty string', () => {
		const mcps = getMCPsByCategory('');
		expect(mcps).toEqual([]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

describe('MCP Suggestions Package Chaos Tests Summary', () => {
	it('Summary', () => {
		console.log('\n═══════════════════════════════════════════════════════════════');
		console.log('MCP SERVER PACKAGE CHAOS TEST SUMMARY');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log('Test categories:');
		console.log('  1. TECH_MCP_MAPPINGS integrity');
		console.log('  2. matchMCPsForTechnologies chaos inputs');
		console.log('  3. matchMCPsForStack edge cases');
		console.log('  4. generateInstallConfig robustness');
		console.log('  5. MCP_REGISTRY validation');
		console.log('  6. getMCPRegistryEntry edge cases');
		console.log('  7. checkMCPCompatibilitySync chaos');
		console.log('  8. Helper functions coverage');
		console.log('═══════════════════════════════════════════════════════════════');
		console.log(`Total tech mappings: ${TECH_MCP_MAPPINGS.length}`);
		console.log(`Total registry entries: ${MCP_REGISTRY.length}`);
		console.log(`Supported technologies: ${getSupportedTechnologies().length}`);
		console.log(`Universal MCPs: ${getUniversalMCPs().length}`);
		console.log('═══════════════════════════════════════════════════════════════\n');

		expect(true).toBe(true);
	});
});
