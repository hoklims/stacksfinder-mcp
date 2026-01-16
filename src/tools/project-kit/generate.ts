/**
 * generate_mcp_kit Tool
 *
 * Generates a complete project kit with optimal tech stack and MCP recommendations
 * based on a project description.
 */

import { z } from 'zod';
import type {
	GenerateMCPKitInput,
	GenerateMCPKitOutput,
	TechRecommendation,
	MCPRecommendation,
	ProjectType,
	Scale,
	Priority
} from './types.js';
import { GenerateMCPKitInputSchema, PROJECT_TYPES, SCALES, PRIORITIES } from './types.js';
import { matchMCPsForTechnologies, generateInstallConfig } from './match-mcps.js';
import {
	DATA_VERSION,
	type Category,
	type Context,
	calculateOverallScore,
	getScores,
	getTechnologiesByCategory,
	scoreToGrade
} from '../../data/index.js';
import { debug, info, error } from '../../utils/logger.js';

// ============================================================================
// PROJECT ANALYSIS
// ============================================================================

/**
 * Keywords that help detect project type from description.
 */
const PROJECT_TYPE_KEYWORDS: Record<ProjectType, string[]> = {
	'web-app': ['web app', 'website', 'web application', 'dashboard', 'portal', 'landing page'],
	'mobile-app': ['mobile', 'ios', 'android', 'react native', 'flutter', 'native app'],
	api: ['api', 'rest', 'graphql', 'backend service', 'microservice', 'serverless function'],
	saas: ['saas', 'subscription', 'multi-tenant', 'b2b', 'platform', 'software as a service'],
	'e-commerce': ['e-commerce', 'ecommerce', 'shop', 'store', 'cart', 'checkout', 'products'],
	marketplace: ['marketplace', 'two-sided', 'buyers and sellers', 'listings', 'transactions'],
	cli: ['cli', 'command line', 'terminal', 'console application'],
	library: ['library', 'package', 'npm', 'module', 'sdk']
};

/**
 * Keywords that help detect scale from description.
 */
const SCALE_KEYWORDS: Record<Scale, string[]> = {
	mvp: ['mvp', 'prototype', 'proof of concept', 'poc', 'quick', 'simple', 'basic', 'minimal'],
	startup: ['startup', 'early stage', 'small team', 'growing', 'seed', 'series a'],
	growth: ['growth', 'scaling', 'high traffic', 'production', 'mature', 'series b', 'series c'],
	enterprise: ['enterprise', 'large scale', 'fortune 500', 'corporate', 'compliance', 'soc2']
};

/**
 * Keywords that help detect priorities from description.
 */
const PRIORITY_KEYWORDS: Record<Priority, string[]> = {
	'time-to-market': ['fast', 'quick', 'rapid', 'ship quickly', 'deadline', 'asap', 'mvp'],
	scalability: ['scale', 'scalable', 'millions of users', 'high traffic', 'growth'],
	'developer-experience': ['developer experience', 'dx', 'easy to use', 'good tooling'],
	'cost-efficiency': ['budget', 'cheap', 'cost effective', 'affordable', 'low cost', 'free tier'],
	performance: ['fast', 'performance', 'speed', 'low latency', 'optimized'],
	security: ['security', 'secure', 'compliance', 'gdpr', 'hipaa', 'soc2', 'encryption'],
	maintainability: ['maintainable', 'clean code', 'long term', 'easy to maintain', 'readable']
};

/**
 * Detect project type from description.
 */
function detectProjectType(description: string): ProjectType {
	const lowerDesc = description.toLowerCase();

	for (const [type, keywords] of Object.entries(PROJECT_TYPE_KEYWORDS)) {
		for (const keyword of keywords) {
			if (lowerDesc.includes(keyword)) {
				return type as ProjectType;
			}
		}
	}

	return 'web-app'; // Default
}

/**
 * Detect scale from description.
 */
function detectScale(description: string): Scale {
	const lowerDesc = description.toLowerCase();

	for (const [scale, keywords] of Object.entries(SCALE_KEYWORDS)) {
		for (const keyword of keywords) {
			if (lowerDesc.includes(keyword)) {
				return scale as Scale;
			}
		}
	}

	return 'mvp'; // Default
}

/**
 * Detect priorities from description.
 */
function detectPriorities(description: string): Priority[] {
	const lowerDesc = description.toLowerCase();
	const detected: Priority[] = [];

	for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
		for (const keyword of keywords) {
			if (lowerDesc.includes(keyword)) {
				detected.push(priority as Priority);
				break;
			}
		}
	}

	// Return top 3
	return detected.slice(0, 3);
}

/**
 * Extract technology constraints from description.
 */
function extractConstraints(description: string, explicitConstraints: string[] = []): string[] {
	const constraints: string[] = [...explicitConstraints];
	const lowerDesc = description.toLowerCase();

	// Common constraint patterns
	const constraintPatterns: Array<{ pattern: RegExp; constraint: string }> = [
		// Database constraints
		{ pattern: /\b(postgres|postgresql)\b/i, constraint: 'must-use-postgresql' },
		{ pattern: /\b(mysql)\b/i, constraint: 'must-use-mysql' },
		{ pattern: /\b(mongodb|mongo)\b/i, constraint: 'must-use-mongodb' },
		{ pattern: /\b(sqlite)\b/i, constraint: 'must-use-sqlite' },

		// Framework constraints
		{ pattern: /\b(react|next\.?js)\b/i, constraint: 'must-use-react' },
		{ pattern: /\b(vue|nuxt)\b/i, constraint: 'must-use-vue' },
		{ pattern: /\b(svelte|sveltekit)\b/i, constraint: 'must-use-svelte' },
		{ pattern: /\b(angular)\b/i, constraint: 'must-use-angular' },

		// Hosting constraints
		{ pattern: /\b(vercel)\b/i, constraint: 'must-use-vercel' },
		{ pattern: /\b(cloudflare)\b/i, constraint: 'must-use-cloudflare' },
		{ pattern: /\b(aws)\b/i, constraint: 'must-use-aws' },
		{ pattern: /\b(self[- ]?hosted)\b/i, constraint: 'self-hosted' },

		// Auth constraints
		{ pattern: /\b(clerk)\b/i, constraint: 'must-use-clerk' },
		{ pattern: /\b(auth0)\b/i, constraint: 'must-use-auth0' },
		{ pattern: /\b(supabase auth)\b/i, constraint: 'must-use-supabase-auth' },

		// Payments
		{ pattern: /\b(stripe)\b/i, constraint: 'must-use-stripe' },
		{ pattern: /\b(paddle)\b/i, constraint: 'must-use-paddle' },

		// Features
		{ pattern: /\b(real[- ]?time)\b/i, constraint: 'needs-realtime' },
		{ pattern: /\b(multi[- ]?tenant)\b/i, constraint: 'multi-tenant' },
		{ pattern: /\b(ai|llm|machine learning)\b/i, constraint: 'ai-features' },
		{ pattern: /\b(edge|low latency)\b/i, constraint: 'edge-deployment' }
	];

	for (const { pattern, constraint } of constraintPatterns) {
		if (pattern.test(lowerDesc) && !constraints.includes(constraint)) {
			constraints.push(constraint);
		}
	}

	return constraints;
}

// ============================================================================
// STACK GENERATION
// ============================================================================

/**
 * Category weights for different project types.
 */
const PROJECT_TYPE_WEIGHTS: Record<string, Partial<Record<Category, number>>> = {
	'web-app': { 'meta-framework': 1.2, frontend: 1.1, database: 1.0 },
	saas: { 'meta-framework': 1.2, database: 1.1, auth: 1.2, payments: 1.3 },
	'e-commerce': { 'meta-framework': 1.1, database: 1.1, payments: 1.4 },
	api: { backend: 1.3, database: 1.2, hosting: 1.1 },
	'mobile-app': { backend: 1.2, database: 1.1, auth: 1.2 },
	marketplace: { 'meta-framework': 1.1, database: 1.2, auth: 1.1, payments: 1.3 },
	cli: { backend: 1.0 },
	library: { backend: 1.0 },
	desktop: { frontend: 1.1, backend: 1.1, database: 1.0 }
};

/**
 * Categories to include based on project type.
 */
const PROJECT_TYPE_CATEGORIES: Record<string, Category[]> = {
	'web-app': ['meta-framework', 'database', 'orm', 'auth', 'hosting'],
	saas: ['meta-framework', 'database', 'orm', 'auth', 'hosting', 'payments'],
	'e-commerce': ['meta-framework', 'database', 'orm', 'auth', 'hosting', 'payments'],
	api: ['backend', 'database', 'orm', 'auth', 'hosting'],
	'mobile-app': ['backend', 'database', 'orm', 'auth', 'hosting'],
	marketplace: ['meta-framework', 'database', 'orm', 'auth', 'hosting', 'payments'],
	cli: ['backend'],
	library: ['backend'],
	desktop: ['frontend', 'backend', 'database', 'orm']
};

/**
 * Map scale to scoring context.
 */
function scaleToContext(scale: Scale): Context {
	if (scale === 'enterprise' || scale === 'growth') return 'enterprise';
	if (scale === 'mvp' || scale === 'startup') return 'mvp';
	return 'default';
}

/**
 * Select best tech for each category.
 */
function selectBestTechPerCategory(
	categories: Category[],
	context: Context,
	projectType: string
): Map<Category, TechRecommendation> {
	const results = new Map<Category, TechRecommendation>();
	const weights = PROJECT_TYPE_WEIGHTS[projectType] || {};

	for (const category of categories) {
		const techs = getTechnologiesByCategory(category);
		if (techs.length === 0) continue;

		let bestTech = techs[0];
		let bestScore = 0;

		for (const tech of techs) {
			const scores = getScores(tech.id, context);
			if (!scores) continue;

			let overall = calculateOverallScore(scores);

			// Apply project-type specific weight
			const weight = weights[category] || 1.0;
			overall = Math.round(overall * weight);

			if (overall > bestScore) {
				bestScore = overall;
				bestTech = tech;
			}
		}

		const finalScores = getScores(bestTech.id, context);
		const finalScore = finalScores ? calculateOverallScore(finalScores) : 0;

		results.set(category, {
			id: bestTech.id,
			name: bestTech.name,
			score: finalScore,
			grade: scoreToGrade(finalScore),
			reason: `Best match for ${projectType} at ${context} scale`
		});
	}

	return results;
}

// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================

/**
 * Generate complete project kit.
 */
export function generateMCPKit(input: GenerateMCPKitInput): GenerateMCPKitOutput {
	const { projectDescription, priorities: explicitPriorities, constraints: explicitConstraints } =
		input;

	// Step 1: Analyze description
	const projectType = input.projectType || detectProjectType(projectDescription);
	const scale = input.scale || detectScale(projectDescription);
	const priorities =
		explicitPriorities && explicitPriorities.length > 0
			? explicitPriorities
			: detectPriorities(projectDescription);
	const constraints = extractConstraints(projectDescription, explicitConstraints);

	info(`Generating kit for ${projectType} (${scale})`);
	debug('Detected constraints:', constraints);

	// Step 2: Get categories for this project type
	const categories =
		PROJECT_TYPE_CATEGORIES[projectType] || PROJECT_TYPE_CATEGORIES['web-app'];
	const context = scaleToContext(scale);

	// Step 3: Select best tech per category
	const techMap = selectBestTechPerCategory(categories, context, projectType);

	// Step 4: Build stack output
	const stack: GenerateMCPKitOutput['stack'] = {};

	// Map categories to stack keys
	const categoryToStackKey: Record<Category, keyof GenerateMCPKitOutput['stack']> = {
		frontend: 'frontend',
		'meta-framework': 'frontend', // Meta-frameworks are frontend
		backend: 'backend',
		database: 'database',
		orm: 'database', // ORM is part of database layer
		auth: 'auth',
		hosting: 'hosting',
		payments: 'payments',
		cms: 'backend' // CMS systems are backend services
	};

	for (const [category, tech] of techMap.entries()) {
		const stackKey = categoryToStackKey[category];
		if (stackKey && !stack[stackKey]) {
			stack[stackKey] = tech;
		}
	}

	// Step 5: Match MCPs for the stack
	const technologies = Array.from(techMap.values()).map((t) => t.name);
	const mcps = matchMCPsForTechnologies(technologies);

	// Step 6: Generate rationale
	const rationale = generateRationale(projectType, scale, priorities, stack, mcps);

	info(`Generated kit with ${Object.keys(stack).length} stack categories and ${mcps.length} MCPs`);

	return {
		stack,
		mcps,
		rationale,
		detectedConstraints: constraints,
		metadata: {
			scoringVersion: DATA_VERSION,
			generatedAt: new Date().toISOString()
		}
	};
}

/**
 * Generate human-readable rationale.
 */
function generateRationale(
	projectType: ProjectType,
	scale: Scale,
	priorities: Priority[],
	stack: GenerateMCPKitOutput['stack'],
	mcps: MCPRecommendation[]
): string {
	const projectLabel = projectType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	const techCount = Object.keys(stack).length;
	const mcpCount = mcps.length;

	let rationale = `For your ${projectLabel} at ${scale} scale`;

	if (priorities.length > 0) {
		rationale += ` with focus on ${priorities.join(', ')}`;
	}

	rationale += `, we recommend ${techCount} core technologies and ${mcpCount} MCP servers to enhance your development workflow.`;

	// Add stack highlights
	if (stack.frontend) {
		rationale += ` ${stack.frontend.name} provides excellent developer experience and performance.`;
	}
	if (stack.database) {
		rationale += ` ${stack.database.name} offers the right balance of scalability and ease of use.`;
	}

	// Add MCP highlights
	const highPriorityMcps = mcps.filter((m) => m.priority === 'high');
	if (highPriorityMcps.length > 0) {
		rationale += ` Key MCPs like ${highPriorityMcps.map((m) => m.name).join(' and ')} will significantly improve your AI-assisted development.`;
	}

	return rationale;
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Tool definition for MCP server registration.
 */
export const generateMCPKitTool = {
	name: 'generate_mcp_kit',
	description: `Generate a complete project kit with optimal tech stack and MCP recommendations based on your project description.

Describe your project and get:
1. **Optimal Tech Stack**: Best technologies for each category (frontend, backend, database, auth, hosting, payments)
2. **MCP Recommendations**: AI-assistant tools tailored to your chosen technologies
3. **Install Configurations**: Ready-to-use configs for Claude Desktop, Cursor, and Windsurf

Example prompts:
- "I'm building a SaaS for project management with real-time collaboration"
- "Building an MVP for a marketplace connecting freelancers with clients"
- "Creating an e-commerce platform with Stripe payments and PostgreSQL"`,

	inputSchema: {
		type: 'object',
		properties: {
			projectDescription: {
				type: 'string',
				description: 'Describe your project (50-5000 chars). Include goals, features, and any preferences.',
				minLength: 50,
				maxLength: 5000
			},
			priorities: {
				type: 'array',
				items: {
					type: 'string',
					enum: PRIORITIES
				},
				maxItems: 3,
				description: 'Top priorities (max 3): time-to-market, scalability, developer-experience, cost-efficiency, performance, security, maintainability'
			},
			constraints: {
				type: 'array',
				items: { type: 'string' },
				description: 'Technology constraints (e.g., must-use-postgresql, self-hosted)'
			},
			projectType: {
				type: 'string',
				enum: PROJECT_TYPES,
				description: 'Project type (auto-detected if not provided)'
			},
			scale: {
				type: 'string',
				enum: SCALES,
				description: 'Project scale (auto-detected if not provided)'
			}
		},
		required: ['projectDescription']
	},

	handler: async (params: unknown) => {
		try {
			const input = GenerateMCPKitInputSchema.parse(params);
			const result = generateMCPKit(input);

			// Format output for display
			const output = formatKitOutput(result);

			return {
				content: [
					{
						type: 'text',
						text: output
					}
				]
			};
		} catch (err) {
			if (err instanceof z.ZodError) {
				error('Invalid input:', err.errors);
				return {
					content: [
						{
							type: 'text',
							text: `Invalid input: ${err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
						}
					],
					isError: true
				};
			}
			error('generate_mcp_kit error:', err);
			throw err;
		}
	}
};

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

/**
 * Format kit output for display.
 */
function formatKitOutput(result: GenerateMCPKitOutput): string {
	const lines: string[] = [];

	lines.push('# Your Project Kit\n');
	lines.push(result.rationale);
	lines.push('');

	// Stack Table
	lines.push('## Recommended Tech Stack\n');
	lines.push('| Category | Technology | Score | Grade |');
	lines.push('|----------|------------|-------|-------|');

	const stackEntries = Object.entries(result.stack) as Array<
		[string, TechRecommendation]
	>;
	for (const [category, tech] of stackEntries) {
		lines.push(`| ${category} | ${tech.name} | ${tech.score} | ${tech.grade} |`);
	}
	lines.push('');

	// MCPs
	lines.push('## Recommended MCPs\n');

	const highPriority = result.mcps.filter((m) => m.priority === 'high');
	const mediumPriority = result.mcps.filter((m) => m.priority === 'medium');
	const lowPriority = result.mcps.filter((m) => m.priority === 'low');

	if (highPriority.length > 0) {
		lines.push('### Must-Have (High Priority)\n');
		for (const mcp of highPriority) {
			lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
			lines.push(`- ${mcp.description}`);
			lines.push(`- _Matched: ${mcp.matchedTech}_`);
			lines.push('');
		}
	}

	if (mediumPriority.length > 0) {
		lines.push('### Recommended (Medium Priority)\n');
		for (const mcp of mediumPriority) {
			lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
			lines.push(`- ${mcp.description}`);
			lines.push('');
		}
	}

	if (lowPriority.length > 0) {
		lines.push('### Nice-to-Have (Low Priority)\n');
		for (const mcp of lowPriority) {
			lines.push(`- **${mcp.name}**: ${mcp.description}`);
		}
		lines.push('');
	}

	// Detected Constraints
	if (result.detectedConstraints.length > 0) {
		lines.push('## Detected Constraints\n');
		lines.push(result.detectedConstraints.map((c) => `- ${c}`).join('\n'));
		lines.push('');
	}

	// Install Config
	lines.push('## Quick Install\n');
	const installConfig = generateInstallConfig(result.mcps);
	lines.push('Add to your Claude Desktop config (`claude_desktop_config.json`):\n');
	lines.push('```json');
	lines.push(JSON.stringify(installConfig.claudeDesktop, null, 2));
	lines.push('```\n');

	// Metadata
	lines.push(`---`);
	lines.push(`*Scoring version: ${result.metadata.scoringVersion}*`);
	lines.push(`*Generated: ${result.metadata.generatedAt}*`);

	return lines.join('\n');
}
