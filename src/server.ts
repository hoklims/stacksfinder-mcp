import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { DATA_VERSION, CATEGORIES, CONTEXTS } from './data/index.js';
import { listTechsToolDefinition, executeListTechs, ListTechsInputSchema } from './tools/list-techs.js';
import { analyzeTechToolDefinition, executeAnalyzeTech, AnalyzeTechInputSchema } from './tools/analyze.js';
import { compareTechsToolDefinition, executeCompareTechs, CompareTechsInputSchema } from './tools/compare.js';
import { recommendStackToolDefinition, executeRecommendStack, RecommendStackInputSchema } from './tools/recommend.js';
import { getBlueprintToolDefinition, executeGetBlueprint, GetBlueprintInputSchema } from './tools/blueprint.js';
import { info, debug } from './utils/logger.js';

/**
 * Create and configure the MCP server.
 */
export function createServer(): McpServer {
	const server = new McpServer({
		name: 'stacksfinder',
		version: '1.0.0'
	});

	info(`StacksFinder MCP Server v1.0.0 (data version: ${DATA_VERSION})`);

	// Register list_technologies tool (local, discovery)
	server.registerTool(
		listTechsToolDefinition.name,
		{
			title: 'List Technologies',
			description: listTechsToolDefinition.description,
			inputSchema: {
				category: z.enum(CATEGORIES).optional().describe('Filter by category')
			}
		},
		async (args) => {
			debug('list_technologies called', args);
			const input = ListTechsInputSchema.parse(args);
			const text = executeListTechs(input);
			return {
				content: [{ type: 'text', text }]
			};
		}
	);

	// Register analyze_tech tool (local)
	server.registerTool(
		analyzeTechToolDefinition.name,
		{
			title: 'Analyze Technology',
			description: analyzeTechToolDefinition.description,
			inputSchema: {
				technology: z.string().min(1).describe('Technology ID to analyze'),
				context: z.enum(CONTEXTS).optional().describe('Context for scoring')
			}
		},
		async (args) => {
			debug('analyze_tech called', args);
			const input = AnalyzeTechInputSchema.parse(args);
			const { text, isError } = executeAnalyzeTech(input);
			return {
				content: [{ type: 'text', text }],
				isError
			};
		}
	);

	// Register compare_techs tool (local)
	server.registerTool(
		compareTechsToolDefinition.name,
		{
			title: 'Compare Technologies',
			description: compareTechsToolDefinition.description,
			inputSchema: {
				technologies: z.array(z.string().min(1)).min(2).max(4).describe('Technologies to compare'),
				context: z.enum(CONTEXTS).optional().describe('Context for scoring')
			}
		},
		async (args) => {
			debug('compare_techs called', args);
			const input = CompareTechsInputSchema.parse(args);
			const { text, isError } = executeCompareTechs(input);
			return {
				content: [{ type: 'text', text }],
				isError
			};
		}
	);

	// Register recommend_stack tool (API-based)
	server.registerTool(
		recommendStackToolDefinition.name,
		{
			title: 'Recommend Stack',
			description: recommendStackToolDefinition.description,
			inputSchema: {
				projectType: z
					.enum([
						'web-app',
						'mobile-app',
						'api',
						'desktop',
						'cli',
						'library',
						'e-commerce',
						'saas',
						'marketplace'
					])
					.describe('Type of project'),
				scale: z.enum(['mvp', 'startup', 'growth', 'enterprise']).optional().describe('Project scale'),
				priorities: z
					.array(
						z.enum([
							'time-to-market',
							'scalability',
							'developer-experience',
							'cost-efficiency',
							'performance',
							'security',
							'maintainability'
						])
					)
					.max(3)
					.optional()
					.describe('Top priorities (max 3)'),
				constraints: z.array(z.string()).optional().describe('Project constraints')
			}
		},
		async (args) => {
			debug('recommend_stack called', args);
			const input = RecommendStackInputSchema.parse(args);
			const { text, isError } = await executeRecommendStack(input);
			return {
				content: [{ type: 'text', text }],
				isError
			};
		}
	);

	// Register get_blueprint tool (API-based)
	server.registerTool(
		getBlueprintToolDefinition.name,
		{
			title: 'Get Blueprint',
			description: getBlueprintToolDefinition.description,
			inputSchema: {
				blueprintId: z.string().uuid().describe('Blueprint UUID')
			}
		},
		async (args) => {
			debug('get_blueprint called', args);
			const input = GetBlueprintInputSchema.parse(args);
			const { text, isError } = await executeGetBlueprint(input);
			return {
				content: [{ type: 'text', text }],
				isError
			};
		}
	);

	info('Registered 5 tools: list_technologies, analyze_tech, compare_techs, recommend_stack, get_blueprint');

	return server;
}
