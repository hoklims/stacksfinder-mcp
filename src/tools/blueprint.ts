import { z } from 'zod';
import { getBlueprintRequest } from '../utils/api-client.js';
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
