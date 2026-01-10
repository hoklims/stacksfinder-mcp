import { z } from 'zod';
import { scoreRequest } from '../utils/api-client.js';
import { McpError, ErrorCode } from '../utils/errors.js';
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
		'Recommends the best tech stack for a project using real-time scoring with context adjustments. Requires API key.',
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
 * API response structure (simplified).
 */
interface ScoreApiResponse {
	stacks: Array<{
		category: string;
		technology: string;
		score: number;
		grade: string;
	}>;
	confidence: 'high' | 'medium' | 'low';
	inputsNormalized: Record<string, unknown>;
	requestId?: string;
}

/**
 * Format API response for MCP output.
 */
function formatResponse(response: ScoreApiResponse, projectType: string, scale: string): string {
	let text = `## Recommended Stack for ${projectType.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} (${scale})

| Category | Technology | Score | Grade |
|----------|------------|-------|-------|
`;

	for (const stack of response.stacks) {
		text += `| ${stack.category} | ${stack.technology} | ${stack.score} | ${stack.grade} |\n`;
	}

	text += `
**Confidence**: ${response.confidence}`;

	if (response.requestId) {
		text += `
**Request ID**: ${response.requestId}`;
	}

	// Include raw JSON for programmatic access
	text += `

<json>
${JSON.stringify({ stacks: response.stacks, confidence: response.confidence, inputsNormalized: response.inputsNormalized })}
</json>`;

	return text;
}

/**
 * Execute recommend_stack tool.
 */
export async function executeRecommendStack(
	input: RecommendStackInput
): Promise<{ text: string; isError?: boolean }> {
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
