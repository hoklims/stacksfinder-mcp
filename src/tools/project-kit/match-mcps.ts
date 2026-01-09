/**
 * MCP Matching Module
 *
 * Matches detected technologies to recommended MCP servers.
 * Uses tech→MCP mappings from the database catalog.
 */

import type { DetectedStack, MCPRecommendation, MCPInstallConfigs, MCPPriority } from './types.js';
import { info } from '../../utils/logger.js';

// ============================================================================
// MCP TECH MAPPINGS (Local Lookup Table)
// ============================================================================

/**
 * Local mapping of technologies to recommended MCPs.
 * This is used when database is not available or for fast local matching.
 */
export const TECH_MCP_MAPPINGS: Array<{
	techIdentifier: string;
	mcpSlug: string;
	priority: MCPPriority;
	reason: string;
	category: string;
}> = [
	// ==========================================================================
	// DATABASE SERVICES
	// ==========================================================================
	{
		techIdentifier: 'supabase',
		mcpSlug: 'supabase-mcp',
		priority: 'high',
		reason: 'Direct database access with RLS-aware queries',
		category: 'database'
	},
	{
		techIdentifier: 'neon',
		mcpSlug: 'neon-mcp',
		priority: 'high',
		reason: 'Branch management and serverless Postgres operations',
		category: 'database'
	},
	{
		techIdentifier: 'planetscale',
		mcpSlug: 'planetscale-mcp',
		priority: 'high',
		reason: 'Database branching and schema management',
		category: 'database'
	},
	{
		techIdentifier: 'mongodb',
		mcpSlug: 'mongodb-mcp',
		priority: 'high',
		reason: 'MongoDB Atlas operations and query assistance',
		category: 'database'
	},
	{
		techIdentifier: 'postgresql',
		mcpSlug: 'postgres-mcp',
		priority: 'medium',
		reason: 'PostgreSQL database operations and query building',
		category: 'database'
	},
	{
		techIdentifier: 'redis',
		mcpSlug: 'upstash-mcp',
		priority: 'medium',
		reason: 'Redis operations with rate limiting support',
		category: 'database'
	},
	{
		techIdentifier: 'upstash',
		mcpSlug: 'upstash-mcp',
		priority: 'high',
		reason: 'Upstash Redis and QStash management',
		category: 'database'
	},
	{
		techIdentifier: 'firebase',
		mcpSlug: 'firebase-mcp',
		priority: 'high',
		reason: 'Firestore, Auth, and Storage operations',
		category: 'database'
	},

	// ==========================================================================
	// PAYMENT SERVICES
	// ==========================================================================
	{
		techIdentifier: 'stripe',
		mcpSlug: 'stripe-mcp',
		priority: 'high',
		reason: 'Payment processing, subscriptions, and webhook management',
		category: 'payments'
	},
	{
		techIdentifier: 'paddle',
		mcpSlug: 'paddle-mcp',
		priority: 'high',
		reason: 'Paddle billing, subscriptions, and tax handling',
		category: 'payments'
	},

	// ==========================================================================
	// VERSION CONTROL
	// ==========================================================================
	{
		techIdentifier: 'github',
		mcpSlug: 'github-mcp',
		priority: 'high',
		reason: 'GitHub repository, issues, and PR management',
		category: 'version-control'
	},

	// ==========================================================================
	// HOSTING PLATFORMS
	// ==========================================================================
	{
		techIdentifier: 'vercel',
		mcpSlug: 'vercel-mcp',
		priority: 'medium',
		reason: 'Deployment and project configuration',
		category: 'hosting'
	},
	{
		techIdentifier: 'cloudflare',
		mcpSlug: 'cloudflare-mcp',
		priority: 'medium',
		reason: 'Workers, KV, R2, and DNS management',
		category: 'hosting'
	},
	{
		techIdentifier: 'netlify',
		mcpSlug: 'netlify-mcp',
		priority: 'medium',
		reason: 'Site deployment and function management',
		category: 'hosting'
	},
	{
		techIdentifier: 'fly',
		mcpSlug: 'fly-mcp',
		priority: 'medium',
		reason: 'Fly.io deployment and scaling',
		category: 'hosting'
	},
	{
		techIdentifier: 'railway',
		mcpSlug: 'railway-mcp',
		priority: 'medium',
		reason: 'Railway deployment and database management',
		category: 'hosting'
	},

	// ==========================================================================
	// PRODUCTIVITY & COLLABORATION
	// ==========================================================================
	{
		techIdentifier: 'notion',
		mcpSlug: 'notion-mcp',
		priority: 'medium',
		reason: 'Notion workspace operations',
		category: 'productivity'
	},
	{
		techIdentifier: 'slack',
		mcpSlug: 'slack-mcp',
		priority: 'medium',
		reason: 'Slack messaging and channel management',
		category: 'communication'
	},
	{
		techIdentifier: 'discord',
		mcpSlug: 'discord-mcp',
		priority: 'low',
		reason: 'Discord bot and server management',
		category: 'communication'
	},
	{
		techIdentifier: 'linear',
		mcpSlug: 'linear-mcp',
		priority: 'medium',
		reason: 'Linear issue tracking and project management',
		category: 'productivity'
	},

	// ==========================================================================
	// MONITORING & ANALYTICS
	// ==========================================================================
	{
		techIdentifier: 'sentry',
		mcpSlug: 'sentry-mcp',
		priority: 'medium',
		reason: 'Error tracking and performance monitoring',
		category: 'monitoring'
	},
	{
		techIdentifier: 'posthog',
		mcpSlug: 'posthog-mcp',
		priority: 'low',
		reason: 'Product analytics and feature flags',
		category: 'analytics'
	},

	// ==========================================================================
	// EMAIL SERVICES
	// ==========================================================================
	{
		techIdentifier: 'resend',
		mcpSlug: 'resend-mcp',
		priority: 'medium',
		reason: 'Transactional email management',
		category: 'email'
	},
	{
		techIdentifier: 'sendgrid',
		mcpSlug: 'sendgrid-mcp',
		priority: 'medium',
		reason: 'Email sending and template management',
		category: 'email'
	},

	// ==========================================================================
	// AI/LLM SERVICES
	// ==========================================================================
	{
		techIdentifier: 'openai',
		mcpSlug: 'openai-mcp',
		priority: 'medium',
		reason: 'OpenAI API management and model selection',
		category: 'ai-llm'
	},
	{
		techIdentifier: 'anthropic',
		mcpSlug: 'anthropic-mcp',
		priority: 'medium',
		reason: 'Claude API management',
		category: 'ai-llm'
	},

	// ==========================================================================
	// TESTING
	// ==========================================================================
	{
		techIdentifier: 'playwright',
		mcpSlug: 'playwright-mcp',
		priority: 'high',
		reason: 'Browser automation and E2E testing',
		category: 'testing'
	},
	{
		techIdentifier: 'puppeteer',
		mcpSlug: 'puppeteer-mcp',
		priority: 'medium',
		reason: 'Headless browser automation',
		category: 'testing'
	},

	// ==========================================================================
	// CLOUD PROVIDERS
	// ==========================================================================
	{
		techIdentifier: 'aws',
		mcpSlug: 'aws-mcp',
		priority: 'medium',
		reason: 'AWS service management',
		category: 'hosting'
	},

	// ==========================================================================
	// SEARCH
	// ==========================================================================
	{
		techIdentifier: 'elasticsearch',
		mcpSlug: 'elasticsearch-mcp',
		priority: 'medium',
		reason: 'Elasticsearch indexing and search operations',
		category: 'search'
	},
	{
		techIdentifier: 'meilisearch',
		mcpSlug: 'meilisearch-mcp',
		priority: 'medium',
		reason: 'Meilisearch index and search management',
		category: 'search'
	}
];

/**
 * Universal MCPs always recommended regardless of stack.
 */
const UNIVERSAL_MCPS_LOCAL: Array<{
	slug: string;
	name: string;
	description: string;
	priority: MCPPriority;
	reason: string;
	category: string;
	githubUrl?: string;
}> = [
	{
		slug: 'context7',
		name: 'Context7',
		description: 'Up-to-date documentation lookup for any library',
		priority: 'high',
		reason: 'Essential for accurate documentation lookup across any tech stack',
		category: 'documentation',
		githubUrl: 'https://github.com/upstash/context7'
	},
	{
		slug: 'sequential-thinking',
		name: 'Sequential Thinking',
		description: 'Better reasoning for complex multi-step tasks',
		priority: 'medium',
		reason: 'Improves reasoning quality for architecture decisions',
		category: 'ai-llm',
		githubUrl: 'https://github.com/modelcontextprotocol/servers'
	}
];

// ============================================================================
// MCP INSTALL CONFIG GENERATORS
// ============================================================================

/**
 * Generate install configurations for different MCP clients.
 */
export function generateInstallConfig(mcps: MCPRecommendation[]): MCPInstallConfigs {
	const cursor: Record<string, unknown> = { mcpServers: {} };
	const claudeDesktop: Record<string, unknown> = { mcpServers: {} };
	const windsurf: Record<string, unknown> = { mcpServers: {} };

	for (const mcp of mcps) {
		const serverConfig = {
			command: 'npx',
			args: ['-y', mcp.slug],
			env: {}
		};

		(cursor.mcpServers as Record<string, unknown>)[mcp.slug] = serverConfig;
		(claudeDesktop.mcpServers as Record<string, unknown>)[mcp.slug] = serverConfig;
		(windsurf.mcpServers as Record<string, unknown>)[mcp.slug] = serverConfig;
	}

	return { cursor, claudeDesktop, windsurf };
}

// ============================================================================
// MCP MATCHING
// ============================================================================

/**
 * Match detected stack to recommended MCPs.
 */
export function matchMCPsForStack(
	stack: DetectedStack,
	options: {
		includeInstalled?: boolean;
		installedMcps?: string[];
	} = {}
): MCPRecommendation[] {
	const { includeInstalled = false, installedMcps = [] } = options;
	const recommendations: MCPRecommendation[] = [];
	const seenSlugs = new Set<string>();

	// Helper to add recommendation if not already added
	const addRecommendation = (
		mapping: (typeof TECH_MCP_MAPPINGS)[0],
		matchedTech: string
	): void => {
		if (seenSlugs.has(mapping.mcpSlug)) return;
		if (!includeInstalled && installedMcps.includes(mapping.mcpSlug)) return;

		seenSlugs.add(mapping.mcpSlug);
		recommendations.push({
			slug: mapping.mcpSlug,
			name: formatMCPName(mapping.mcpSlug),
			description: mapping.reason,
			priority: mapping.priority,
			reason: mapping.reason,
			matchedTech,
			category: mapping.category,
			installCommand: `npx -y ${mapping.mcpSlug}`
		});
	};

	// Match from detected stack categories
	const stackCategories: Array<{ tech: string | undefined; source: string }> = [
		{ tech: stack.frontend?.name, source: 'frontend' },
		{ tech: stack.backend?.name, source: 'backend' },
		{ tech: stack.database?.name, source: 'database' },
		{ tech: stack.orm?.name, source: 'orm' },
		{ tech: stack.auth?.name, source: 'auth' },
		{ tech: stack.hosting?.name, source: 'hosting' },
		{ tech: stack.payments?.name, source: 'payments' }
	];

	for (const { tech, source } of stackCategories) {
		if (!tech) continue;

		const mappings = TECH_MCP_MAPPINGS.filter(
			(m) => m.techIdentifier.toLowerCase() === tech.toLowerCase()
		);

		for (const mapping of mappings) {
			addRecommendation(mapping, `${tech} (${source})`);
		}
	}

	// Match from detected services
	for (const service of stack.services) {
		const mappings = TECH_MCP_MAPPINGS.filter(
			(m) => m.techIdentifier.toLowerCase() === service.name.toLowerCase()
		);

		for (const mapping of mappings) {
			addRecommendation(mapping, `${service.name} (service)`);
		}
	}

	// Add universal MCPs
	for (const universal of UNIVERSAL_MCPS_LOCAL) {
		if (seenSlugs.has(universal.slug)) continue;
		if (!includeInstalled && installedMcps.includes(universal.slug)) continue;

		seenSlugs.add(universal.slug);
		recommendations.push({
			slug: universal.slug,
			name: universal.name,
			description: universal.description,
			priority: universal.priority,
			reason: universal.reason,
			matchedTech: 'universal',
			category: universal.category,
			githubUrl: universal.githubUrl,
			installCommand: `npx -y @anthropic/mcp-server-${universal.slug.replace('-mcp', '')}`
		});
	}

	// Sort by priority (high > medium > low)
	const priorityOrder: Record<MCPPriority, number> = {
		high: 3,
		medium: 2,
		low: 1
	};

	recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

	info(`Matched ${recommendations.length} MCPs for detected stack`);
	return recommendations;
}

/**
 * Match technologies from project description/constraints to MCPs.
 * Used by generate_mcp_kit when no repo is being analyzed.
 */
export function matchMCPsForTechnologies(
	technologies: string[],
	options: {
		includeInstalled?: boolean;
		installedMcps?: string[];
	} = {}
): MCPRecommendation[] {
	const { includeInstalled = false, installedMcps = [] } = options;
	const recommendations: MCPRecommendation[] = [];
	const seenSlugs = new Set<string>();

	for (const tech of technologies) {
		const normalizedTech = tech.toLowerCase().replace(/[^a-z0-9]/g, '');

		const mappings = TECH_MCP_MAPPINGS.filter((m) => {
			const normalizedIdentifier = m.techIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '');
			return (
				normalizedIdentifier === normalizedTech ||
				normalizedIdentifier.includes(normalizedTech) ||
				normalizedTech.includes(normalizedIdentifier)
			);
		});

		for (const mapping of mappings) {
			if (seenSlugs.has(mapping.mcpSlug)) continue;
			if (!includeInstalled && installedMcps.includes(mapping.mcpSlug)) continue;

			seenSlugs.add(mapping.mcpSlug);
			recommendations.push({
				slug: mapping.mcpSlug,
				name: formatMCPName(mapping.mcpSlug),
				description: mapping.reason,
				priority: mapping.priority,
				reason: mapping.reason,
				matchedTech: tech,
				category: mapping.category,
				installCommand: `npx -y ${mapping.mcpSlug}`
			});
		}
	}

	// Add universal MCPs
	for (const universal of UNIVERSAL_MCPS_LOCAL) {
		if (seenSlugs.has(universal.slug)) continue;
		if (!includeInstalled && installedMcps.includes(universal.slug)) continue;

		seenSlugs.add(universal.slug);
		recommendations.push({
			slug: universal.slug,
			name: universal.name,
			description: universal.description,
			priority: universal.priority,
			reason: universal.reason,
			matchedTech: 'universal',
			category: universal.category,
			githubUrl: universal.githubUrl
		});
	}

	// Sort by priority
	const priorityOrder: Record<MCPPriority, number> = {
		high: 3,
		medium: 2,
		low: 1
	};

	recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

	return recommendations;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format MCP slug into human-readable name.
 */
function formatMCPName(slug: string): string {
	return slug
		.replace(/-mcp$/, '')
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
		.concat(' MCP');
}

/**
 * Get MCP info by slug.
 */
export function getMCPInfo(slug: string): (typeof TECH_MCP_MAPPINGS)[0] | undefined {
	return TECH_MCP_MAPPINGS.find((m) => m.mcpSlug === slug);
}

/**
 * Get all MCPs for a specific category.
 */
export function getMCPsByCategory(category: string): typeof TECH_MCP_MAPPINGS {
	return TECH_MCP_MAPPINGS.filter((m) => m.category === category);
}

/**
 * Get all supported technology identifiers.
 */
export function getSupportedTechnologies(): string[] {
	const techs = new Set<string>();
	for (const mapping of TECH_MCP_MAPPINGS) {
		techs.add(mapping.techIdentifier);
	}
	return Array.from(techs).sort();
}

/**
 * Get universal MCPs that should always be recommended.
 */
export function getUniversalMCPs(): typeof UNIVERSAL_MCPS_LOCAL {
	return UNIVERSAL_MCPS_LOCAL;
}
