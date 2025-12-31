import { z } from 'zod';
import {
	getBlueprintRequest,
	createBlueprintRequest,
	getJobStatusRequest,
	type CreateBlueprintRequest,
	type JobStatusResponse
} from '../utils/api-client.js';
import { McpError, ErrorCode } from '../utils/errors.js';
import { debug } from '../utils/logger.js';

/**
 * Input schema for get_blueprint tool.
 */
export const GetBlueprintInputSchema = z.object({
	blueprintId: z.string().uuid().describe('Blueprint UUID')
});

export type GetBlueprintInput = z.infer<typeof GetBlueprintInputSchema>;

/**
 * Tool definition for MCP registration.
 */
export const getBlueprintToolDefinition = {
	name: 'get_blueprint',
	description:
		'Fetches an existing blueprint by ID. Blueprints are generated via the StacksFinder web UI. Requires API key.',
	inputSchema: {
		type: 'object' as const,
		properties: {
			blueprintId: {
				type: 'string',
				format: 'uuid',
				description: 'Blueprint UUID'
			}
		},
		required: ['blueprintId']
	}
};

/**
 * API response structure (whitelisted fields).
 */
interface BlueprintApiResponse {
	id: string;
	projectId: string;
	narrative?: string;
	selectedTechs: Array<{
		category: string;
		technology: string;
	}>;
	createdAt: string;
	projectContext?: {
		projectName?: string;
		projectType?: string;
		scale?: string;
	};
}

/**
 * Format blueprint for MCP output.
 */
function formatBlueprint(blueprint: BlueprintApiResponse): string {
	const projectName = blueprint.projectContext?.projectName || 'Unnamed Project';
	const projectType = blueprint.projectContext?.projectType || 'Unknown';
	const scale = blueprint.projectContext?.scale || 'mvp';

	const createdDate = new Date(blueprint.createdAt).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	let text = `## Blueprint: ${projectName}

**ID**: ${blueprint.id}
**Type**: ${projectType}
**Scale**: ${scale}
**Created**: ${createdDate}

### Selected Stack
| Category | Technology |
|----------|------------|
`;

	for (const tech of blueprint.selectedTechs) {
		text += `| ${tech.category} | ${tech.technology} |\n`;
	}

	if (blueprint.narrative) {
		text += `
### Narrative
${blueprint.narrative}`;
	}

	return text;
}

/**
 * Execute get_blueprint tool.
 */
export async function executeGetBlueprint(
	input: GetBlueprintInput
): Promise<{ text: string; isError?: boolean }> {
	const { blueprintId } = input;

	debug('Fetching blueprint', { blueprintId });

	try {
		const response = await getBlueprintRequest<BlueprintApiResponse>(blueprintId);
		const text = formatBlueprint(response);
		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			// Add helpful suggestion for NOT_FOUND
			if (err.code === ErrorCode.NOT_FOUND) {
				err.suggestions = [
					'Blueprints are generated via the StacksFinder web UI.',
					'Visit https://stacksfinder.com to create a new blueprint.'
				];
			}
			return { text: err.toResponseText(), isError: true };
		}

		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to fetch blueprint'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

// ============================================================================
// CREATE BLUEPRINT TOOL
// ============================================================================

/**
 * Valid project types for blueprint creation.
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
 * Valid scales for blueprint creation.
 */
const SCALES = ['mvp', 'startup', 'growth', 'enterprise'] as const;

/**
 * Valid priorities for blueprint creation.
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
 * Input schema for create_blueprint tool.
 */
export const CreateBlueprintInputSchema = z.object({
	projectName: z.string().min(1).max(100).optional().describe('Project name (optional)'),
	projectType: z
		.enum(PROJECT_TYPES)
		.describe('Type of project (e.g., web-app, saas, api)'),
	scale: z.enum(SCALES).describe('Project scale (mvp, startup, growth, enterprise)'),
	projectDescription: z
		.string()
		.max(2000)
		.optional()
		.describe('Brief project description (optional)'),
	priorities: z
		.array(z.enum(PRIORITIES))
		.max(3)
		.optional()
		.describe('Top 3 priorities (optional)'),
	constraints: z
		.array(z.string())
		.max(20)
		.optional()
		.describe('Technology constraint IDs (optional)'),
	waitForCompletion: z
		.boolean()
		.optional()
		.default(true)
		.describe('Wait for blueprint generation to complete (default: true)')
});

export type CreateBlueprintInput = z.infer<typeof CreateBlueprintInputSchema>;

/**
 * Tool definition for MCP registration.
 */
export const createBlueprintToolDefinition = {
	name: 'create_blueprint',
	description: `Creates a new tech stack blueprint for a project. Requires API key with 'blueprint:write' scope.

The blueprint generation is asynchronous. By default, this tool waits for completion and returns the full blueprint.
Set waitForCompletion=false to get the job ID immediately for manual polling.

Example usage:
- Create a SaaS MVP: projectType="saas", scale="mvp", priorities=["time-to-market", "cost-efficiency"]
- Create an enterprise API: projectType="api", scale="enterprise", priorities=["security", "scalability"]`,
	inputSchema: {
		type: 'object' as const,
		properties: {
			projectName: {
				type: 'string',
				description: 'Project name (optional)',
				maxLength: 100
			},
			projectType: {
				type: 'string',
				enum: PROJECT_TYPES,
				description: 'Type of project'
			},
			scale: {
				type: 'string',
				enum: SCALES,
				description: 'Project scale'
			},
			projectDescription: {
				type: 'string',
				description: 'Brief project description (optional)',
				maxLength: 2000
			},
			priorities: {
				type: 'array',
				items: { type: 'string', enum: PRIORITIES },
				maxItems: 3,
				description: 'Top 3 priorities (optional)'
			},
			constraints: {
				type: 'array',
				items: { type: 'string' },
				maxItems: 20,
				description: 'Technology constraint IDs (optional)'
			},
			waitForCompletion: {
				type: 'boolean',
				description: 'Wait for blueprint generation to complete (default: true)',
				default: true
			}
		},
		required: ['projectType', 'scale']
	}
};

/**
 * Poll job status until completion or failure.
 */
async function pollJobUntilComplete(
	jobId: string,
	maxAttempts = 30,
	intervalMs = 2000
): Promise<JobStatusResponse> {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const status = await getJobStatusRequest(jobId);

		if (status.status === 'completed') {
			return status;
		}

		if (status.status === 'failed' || status.status === 'cancelled') {
			throw new McpError(
				ErrorCode.API_ERROR,
				status.errorMessage || `Job ${status.status}: ${status.errorCode || 'Unknown error'}`
			);
		}

		// Wait before next poll
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new McpError(
		ErrorCode.TIMEOUT,
		`Blueprint generation timed out after ${(maxAttempts * intervalMs) / 1000} seconds`,
		['The job is still running. Use get_blueprint with the job resultRef to check later.']
	);
}

/**
 * Execute create_blueprint tool.
 */
export async function executeCreateBlueprint(
	input: CreateBlueprintInput
): Promise<{ text: string; isError?: boolean }> {
	const {
		projectName,
		projectType,
		scale,
		projectDescription,
		priorities,
		constraints,
		waitForCompletion = true
	} = input;

	debug('Creating blueprint', { projectType, scale, waitForCompletion });

	try {
		// Build request body
		const requestBody: CreateBlueprintRequest = {
			projectName,
			projectContext: {
				projectName,
				projectType,
				projectDescription,
				scale,
				priorities: priorities as CreateBlueprintRequest['projectContext']['priorities'],
				constraintIds: constraints
			},
			source: 'mcp',
			mcpToolName: 'create_blueprint'
		};

		// Create the blueprint job
		const createResponse = await createBlueprintRequest(requestBody);

		// If already completed (cached result), fetch and return
		if (createResponse.status === 'completed' && createResponse.resultRef) {
			const blueprint = await getBlueprintRequest<BlueprintApiResponse>(createResponse.resultRef);
			const text = formatBlueprint(blueprint);
			return {
				text: `## Blueprint Created (Cached)\n\n${text}\n\n---\n*Source: MCP Server*`
			};
		}

		// If not waiting, return job info
		if (!waitForCompletion) {
			return {
				text: `## Blueprint Generation Started

**Job ID**: ${createResponse.jobId}
**Project ID**: ${createResponse.projectId}
**Status**: ${createResponse.status}
**Progress**: ${createResponse.progress}%

Poll the job status at: ${createResponse._links.job}
Once complete, fetch the blueprint at: ${createResponse._links.blueprint || 'TBD'}

---
*Source: MCP Server*`
			};
		}

		// Poll until completion
		debug('Polling job until completion', { jobId: createResponse.jobId });
		const finalStatus = await pollJobUntilComplete(createResponse.jobId);

		if (!finalStatus.resultRef) {
			throw new McpError(ErrorCode.API_ERROR, 'Job completed but no blueprint ID returned');
		}

		// Fetch the completed blueprint
		const blueprint = await getBlueprintRequest<BlueprintApiResponse>(finalStatus.resultRef);
		const text = formatBlueprint(blueprint);

		return {
			text: `## Blueprint Created Successfully

${text}

---
**Job ID**: ${createResponse.jobId}
**Project ID**: ${createResponse.projectId}
*Source: MCP Server*`
		};
	} catch (err) {
		if (err instanceof McpError) {
			// Add helpful suggestions for common errors
			if (err.code === ErrorCode.CONFIG_ERROR) {
				err.suggestions = [
					'Ensure STACKSFINDER_API_KEY is set with a valid Pro or Team API key.',
					'Get your API key from https://stacksfinder.com/settings/api'
				];
			} else if (err.code === ErrorCode.UNAUTHORIZED) {
				err.suggestions = [
					"Your API key may be invalid or missing the 'blueprint:write' scope.",
					'Generate a new API key with the correct permissions at https://stacksfinder.com/settings/api'
				];
			} else if (err.code === ErrorCode.RATE_LIMITED) {
				err.suggestions = [
					'You have exceeded your monthly blueprint quota.',
					'Upgrade your plan at https://stacksfinder.com/pricing'
				];
			}
			return { text: err.toResponseText(), isError: true };
		}

		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to create blueprint'
		);
		return { text: error.toResponseText(), isError: true };
	}
}
