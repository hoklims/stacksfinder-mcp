import { z } from 'zod';
import { scoreRequest } from '../utils/api-client.js';
import { McpError, ErrorCode, checkProAccess } from '../utils/errors.js';
import { debug } from '../utils/logger.js';

/**
 * Project types supported by the API.
 */
const PROJECT_TYPES = [
	'web-app',
	'mobile-app',
	'api',
	'desktop',
	'cli',
	'library',
	'e-commerce',
	'saas',
	'marketplace'
] as const;

/**
 * Scale options.
 */
const SCALES = ['mvp', 'startup', 'growth', 'enterprise'] as const;

/**
 * Priority options.
 */
const PRIORITIES = [
	'time-to-market',
	'scalability',
	'developer-experience',
	'cost-efficiency',
	'performance',
	'security',
	'maintainability'
] as const;

/**
 * Input schema for recommend_stack tool.
 */
export const RecommendStackInputSchema = z.object({
	projectType: z.enum(PROJECT_TYPES).describe('Type of project'),
	scale: z.enum(SCALES).optional().default('mvp').describe('Project scale'),
	priorities: z
		.array(z.enum(PRIORITIES))
		.max(3)
		.optional()
		.default([])
		.describe('Top priorities (max 3)'),
	constraints: z.array(z.string()).optional().default([]).describe('Project constraints')
});

export type RecommendStackInput = z.infer<typeof RecommendStackInputSchema>;

/**
 * Tool definition for MCP registration.
 */
export const recommendStackToolDefinition = {
	name: 'recommend_stack',
	description:
		'Recommends the best tech stack for a project using real-time scoring with context adjustments.',
	inputSchema: {
		type: 'object' as const,
		properties: {
			projectType: {
				type: 'string',
				enum: PROJECT_TYPES,
				description: 'Type of project (e.g., saas, web-app, api)'
			},
			scale: {
				type: 'string',
				enum: SCALES,
				description: 'Project scale (mvp, startup, growth, enterprise)'
			},
			priorities: {
				type: 'array',
				items: { type: 'string', enum: PRIORITIES },
				maxItems: 3,
				description: 'Top priorities (max 3)'
			},
			constraints: {
				type: 'array',
				items: { type: 'string' },
				description: 'Project constraints (e.g., real-time, multi-tenant)'
			}
		},
		required: ['projectType']
	}
};

/**
 * API response structure (V2 format).
 */
interface CategoryTech {
	id: string;
	name: string;
	score: number;
	grade: string;
	isRecommended: boolean;
}

interface ScoreApiResponse {
	categories: Array<{
		category: string;
		technologies: CategoryTech[];
	}>;
	confidence: { level: 'high' | 'medium' | 'low' };
	appliedWeights: Record<string, number>;
	requestHash?: string;
}

/**
 * Format API response for MCP output.
 */
function formatResponse(response: ScoreApiResponse, projectType: string, scale: string): string {
	let text = `## Recommended Stack for ${projectType.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} (${scale})

| Category | Technology | Score | Grade |
|----------|------------|-------|-------|
`;

	const stacks: Array<{ category: string; technology: string; score: number; grade: string }> = [];

	for (const cat of response.categories) {
		// Get the recommended tech (isRecommended=true) or first one
		const recommended = cat.technologies.find((t) => t.isRecommended) || cat.technologies[0];
		if (recommended) {
			stacks.push({
				category: cat.category,
				technology: recommended.name,
				score: recommended.score,
				grade: recommended.grade
			});
			text += `| ${cat.category} | ${recommended.name} | ${recommended.score} | ${recommended.grade} |\n`;
		}
	}

	text += `
**Confidence**: ${response.confidence?.level || 'medium'}`;

	if (response.requestHash) {
		text += `
**Request ID**: ${response.requestHash}`;
	}

	// Include raw JSON for programmatic access
	text += `

<json>
${JSON.stringify({ stacks, confidence: response.confidence?.level, appliedWeights: response.appliedWeights })}
</json>`;

	return text;
}

/**
 * Execute recommend_stack tool.
 */
export async function executeRecommendStack(
	input: RecommendStackInput
): Promise<{ text: string; isError?: boolean }> {
	// Check Pro access first
	const tierCheck = await checkProAccess('recommend_stack', 'recommend_stack_demo');
	if (tierCheck) {
		return tierCheck;
	}

	const { projectType, scale = 'mvp', priorities = [], constraints = [] } = input;

	// Deduplicate priorities
	const uniquePriorities = [...new Set(priorities)].slice(0, 3);

	debug('Calling score API', { projectType, scale, priorities: uniquePriorities, constraints });

	try {
		// API V2 expects context wrapper object
		const response = await scoreRequest<ScoreApiResponse>({
			context: {
				projectType,
				scale,
				priorities: uniquePriorities,
				constraintIds: constraints
			},
			selectedTechs: {},
			constraintIds: constraints
		});

		const text = formatResponse(response, projectType, scale);
		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}

		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to get recommendations'
		);
		return { text: error.toResponseText(), isError: true };
	}
}
