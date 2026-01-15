import { z } from 'zod';

// ============================================================================
// WORKFLOW GUIDE TOOL
// Intelligent context-aware guide for ChatGPT/Claude/Cursor users
// ============================================================================

/**
 * Goals that users can have when using StacksFinder
 */
export const WORKFLOW_GOALS = [
	'discover', // New user exploring StacksFinder
	'setup_api_key', // User wants Pro features
	'get_recommendation', // User wants a stack recommendation
	'audit_project', // User wants to audit technical debt
	'migrate_stack', // User wants migration recommendations
	'install_mcp', // User wants to set up MCP in their IDE
	'compare_techs', // User wants to compare technologies
	'create_blueprint' // User wants to create/save a blueprint
] as const;

/**
 * Client contexts for adapted snippets
 */
export const WORKFLOW_CONTEXTS = ['chatgpt', 'claude', 'cursor', 'cli'] as const;

/**
 * User tiers
 */
export const USER_TIERS = ['free', 'pro', 'unknown'] as const;

export type WorkflowGoal = (typeof WORKFLOW_GOALS)[number];
export type WorkflowContext = (typeof WORKFLOW_CONTEXTS)[number];
export type UserTier = (typeof USER_TIERS)[number];

/**
 * Input schema for get_workflow_guide tool
 */
export const GetWorkflowGuideInputSchema = z.object({
	current_goal: z
		.enum(WORKFLOW_GOALS)
		.optional()
		.describe('What the user is trying to accomplish. If not specified, defaults to discover.'),
	completed_tools: z
		.array(z.string())
		.optional()
		.describe('Tools already called in this session (e.g., ["list_technologies", "analyze_tech"])'),
	user_tier: z
		.enum(USER_TIERS)
		.optional()
		.default('unknown')
		.describe('User tier: free, pro, or unknown'),
	known_constraints: z
		.array(z.string())
		.optional()
		.describe('Constraints like "must_use_postgresql", "wants_realtime", "prefer_react"'),
	context: z
		.enum(WORKFLOW_CONTEXTS)
		.optional()
		.default('chatgpt')
		.describe('Client context for adapted snippets and URLs')
});

export type GetWorkflowGuideInput = z.infer<typeof GetWorkflowGuideInputSchema>;

/**
 * Tool definition for MCP registration
 */
export const getWorkflowGuideToolDefinition = {
	name: 'get_workflow_guide',
	description: `Intelligent workflow guide that recommends the next tool to use based on your goal and context.

**When to use**:
- You're unsure which StacksFinder tool to call next
- You want to understand the recommended workflow for your goal
- You need help navigating Pro vs Free features

**Supported Goals**:
- discover: Explore available technologies
- setup_api_key: Get Pro features access
- get_recommendation: Get a stack recommendation
- audit_project: Audit technical debt
- migrate_stack: Get migration recommendations
- install_mcp: Set up MCP in your IDE
- compare_techs: Compare technologies side-by-side
- create_blueprint: Create and save a blueprint

**Example**: get_workflow_guide({ current_goal: "audit_project", user_tier: "free" })`,
	inputSchema: {
		type: 'object' as const,
		properties: {
			current_goal: {
				type: 'string',
				enum: WORKFLOW_GOALS as unknown as string[],
				description: 'What the user is trying to accomplish'
			},
			completed_tools: {
				type: 'array',
				items: { type: 'string' },
				description: 'Tools already called in this session'
			},
			user_tier: {
				type: 'string',
				enum: USER_TIERS as unknown as string[],
				description: 'User tier: free, pro, or unknown'
			},
			known_constraints: {
				type: 'array',
				items: { type: 'string' },
				description: 'User constraints like must_use_postgresql'
			},
			context: {
				type: 'string',
				enum: WORKFLOW_CONTEXTS as unknown as string[],
				description: 'Client context for adapted snippets'
			}
		}
	}
};

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

interface WorkflowStep {
	tool: string;
	description: string;
	example: Record<string, unknown>;
	requiresPro: boolean;
	alternativeIfFree?: string;
}

interface WorkflowDefinition {
	goal: WorkflowGoal;
	title: string;
	prerequisiteTools?: string[];
	prerequisiteCondition?: string;
	steps: WorkflowStep[];
	fallbackMessage?: string;
}

const WORKFLOWS: Record<WorkflowGoal, WorkflowDefinition> = {
	discover: {
		goal: 'discover',
		title: 'Explore StacksFinder Technologies',
		steps: [
			{
				tool: 'list_technologies',
				description: 'Browse all available technologies by category',
				example: { category: 'frontend' },
				requiresPro: false
			},
			{
				tool: 'analyze_tech',
				description: 'Get detailed analysis of a specific technology',
				example: { technology: 'nextjs', context: 'mvp' },
				requiresPro: false
			}
		]
	},
	setup_api_key: {
		goal: 'setup_api_key',
		title: 'Set Up Pro Features Access',
		steps: [
			{
				tool: 'create_api_key',
				description: 'Create an API key using OAuth (preferred for ChatGPT)',
				example: { keyName: 'my-chatgpt-key' },
				requiresPro: true
			},
			{
				tool: 'setup_api_key',
				description: 'Alternative: Create API key with email/password',
				example: { email: 'you@example.com', password: 'your-password' },
				requiresPro: true
			}
		]
	},
	get_recommendation: {
		goal: 'get_recommendation',
		title: 'Get Stack Recommendation',
		steps: [
			{
				tool: 'recommend_stack_demo',
				description: 'Try the free demo (1 per day)',
				example: { projectType: 'saas', scale: 'mvp' },
				requiresPro: false
			},
			{
				tool: 'recommend_stack',
				description: 'Get unlimited recommendations with Pro',
				example: { projectType: 'saas', scale: 'startup', priorities: ['scalability', 'developer-experience'] },
				requiresPro: true,
				alternativeIfFree: 'Try recommend_stack_demo first'
			}
		]
	},
	audit_project: {
		goal: 'audit_project',
		title: 'Audit Technical Debt',
		prerequisiteCondition: 'Authentication required',
		steps: [
			{
				tool: 'create_audit',
				description: 'Create a technical debt audit for your stack',
				example: {
					name: 'My Project Audit',
					technologies: [
						{ name: 'React', version: '17.0.0' },
						{ name: 'Node.js', version: '14.0.0' }
					]
				},
				requiresPro: true
			},
			{
				tool: 'get_audit',
				description: 'Retrieve audit results',
				example: { auditId: 'uuid-from-create_audit' },
				requiresPro: true
			}
		]
	},
	migrate_stack: {
		goal: 'migrate_stack',
		title: 'Get Migration Recommendations',
		prerequisiteTools: ['create_audit'],
		prerequisiteCondition: 'Completed audit',
		steps: [
			{
				tool: 'get_migration_recommendation',
				description: 'Get migration roadmap based on audit results',
				example: { auditId: 'uuid-from-completed-audit' },
				requiresPro: true,
				alternativeIfFree: 'First create an audit with create_audit'
			}
		]
	},
	install_mcp: {
		goal: 'install_mcp',
		title: 'Install MCP Server in Your IDE',
		steps: [
			{
				tool: 'analyze_repo_mcps',
				description: 'Analyze your repo to detect stack and recommend MCPs (requires CLI access)',
				example: { workspaceRoot: '/path/to/project' },
				requiresPro: false
			},
			{
				tool: 'prepare_mcp_installation',
				description: 'Generate .env-mcp configuration file',
				example: { workspaceRoot: '/path/to/project' },
				requiresPro: false
			},
			{
				tool: 'execute_mcp_installation',
				description: 'Generate installation commands',
				example: { targetClient: 'claude-code' },
				requiresPro: false
			}
		],
		fallbackMessage:
			'For ChatGPT users without CLI access, visit https://stacksfinder.com/guides/mcp for manual setup instructions.'
	},
	compare_techs: {
		goal: 'compare_techs',
		title: 'Compare Technologies',
		prerequisiteTools: ['list_technologies'],
		steps: [
			{
				tool: 'compare_techs',
				description: 'Side-by-side comparison of 2-4 technologies',
				example: { technologies: ['nextjs', 'sveltekit', 'remix'], context: 'mvp' },
				requiresPro: false
			}
		]
	},
	create_blueprint: {
		goal: 'create_blueprint',
		title: 'Create and Save Blueprint',
		prerequisiteCondition: 'Authentication required',
		steps: [
			{
				tool: 'recommend_stack',
				description: 'Generate a stack recommendation first',
				example: { projectType: 'saas', scale: 'startup' },
				requiresPro: true
			},
			{
				tool: 'create_blueprint',
				description: 'Save the recommendation as a blueprint',
				example: { projectType: 'saas', scale: 'startup', priorities: ['time-to-market'] },
				requiresPro: true
			},
			{
				tool: 'get_blueprint',
				description: 'Retrieve saved blueprint',
				example: { blueprintId: 'uuid-from-create_blueprint' },
				requiresPro: true
			}
		]
	}
};

// ============================================================================
// GUIDE EXECUTION
// ============================================================================

/**
 * Execute the workflow guide tool
 */
export function executeGetWorkflowGuide(input: GetWorkflowGuideInput): { text: string } {
	const { current_goal, completed_tools = [], user_tier = 'unknown', known_constraints = [], context = 'chatgpt' } = input;

	// Default to discover if no goal specified or unknown goal
	const goal: WorkflowGoal = current_goal && WORKFLOW_GOALS.includes(current_goal) ? current_goal : 'discover';

	const workflow = WORKFLOWS[goal];
	const completedSet = new Set(completed_tools.map((t) => t.toLowerCase()));

	// Find the next recommended step
	let nextStep: WorkflowStep | null = null;
	let stepIndex = 0;

	for (let i = 0; i < workflow.steps.length; i++) {
		const step = workflow.steps[i];
		if (!completedSet.has(step.tool.toLowerCase())) {
			nextStep = step;
			stepIndex = i;
			break;
		}
	}

	// Check if prerequisites are met
	const missingPrerequisites: string[] = [];
	if (workflow.prerequisiteTools) {
		for (const prereq of workflow.prerequisiteTools) {
			if (!completedSet.has(prereq.toLowerCase())) {
				missingPrerequisites.push(prereq);
			}
		}
	}

	// Build response
	let text = `## Goal\n`;
	text += `**${workflow.title}**\n\n`;

	// Context section
	text += `## You Have\n`;
	text += `- **Tier**: ${user_tier === 'unknown' ? 'Unknown (try a Pro tool to find out)' : user_tier}\n`;
	text += `- **Completed**: ${completed_tools.length > 0 ? completed_tools.join(', ') : 'None yet'}\n`;
	if (known_constraints.length > 0) {
		text += `- **Constraints**: ${known_constraints.join(', ')}\n`;
	}
	text += `- **Context**: ${context}\n\n`;

	// Handle missing prerequisites
	if (missingPrerequisites.length > 0) {
		text += `## Missing Prerequisites\n`;
		text += `Before ${goal}, you need to complete: **${missingPrerequisites.join(', ')}**\n\n`;
		text += `Run \`get_workflow_guide({ current_goal: "${missingPrerequisites[0].includes('audit') ? 'audit_project' : 'discover'}" })\` for guidance.\n\n`;
	}

	// Next recommended tool
	if (nextStep) {
		text += `## Next Recommended Tool\n`;
		text += `**\`${nextStep.tool}\`** - ${nextStep.description}\n\n`;

		text += `Example:\n`;
		text += '```json\n';
		text += JSON.stringify(nextStep.example, null, 2);
		text += '\n```\n\n';

		text += `## Why\n`;
		text += `This is step ${stepIndex + 1} of ${workflow.steps.length} in the "${workflow.title}" workflow.\n\n`;

		// Alternatives
		text += `## Alternatives\n`;
		if (workflow.steps.length > 1 && stepIndex < workflow.steps.length - 1) {
			const altStep = workflow.steps.find((s, i) => i !== stepIndex && !completedSet.has(s.tool.toLowerCase()));
			if (altStep) {
				text += `- Skip to \`${altStep.tool}\`: ${altStep.description}\n`;
			}
		}
		if (goal !== 'discover') {
			text += `- Start fresh: \`list_technologies\` to explore available options\n`;
		}
	} else {
		// All steps completed
		text += `## Workflow Complete!\n`;
		text += `You've completed all steps in the "${workflow.title}" workflow.\n\n`;
		text += `**Next suggestions**:\n`;
		if (goal === 'audit_project') {
			text += `- Get migration recommendations: \`get_workflow_guide({ current_goal: "migrate_stack" })\`\n`;
		} else if (goal === 'get_recommendation') {
			text += `- Save as blueprint: \`get_workflow_guide({ current_goal: "create_blueprint" })\`\n`;
		} else {
			text += `- Try another workflow: \`get_workflow_guide({ current_goal: "get_recommendation" })\`\n`;
		}
	}

	// Troubleshooting section
	text += `\n## Troubleshooting\n`;
	if (context === 'chatgpt') {
		text += `- **Tool blocked by platform**: Rephrase your prompt or use the web interface at stacksfinder.com\n`;
		text += `- **OAuth fails**: Re-authenticate in ChatGPT settings, or use \`setup_api_key\` with dummy email/password\n`;
		text += `- **Schema not refreshed**: Recreate the ChatGPT Action or wait for cache to clear\n`;
	} else if (context === 'claude' || context === 'cursor') {
		text += `- **API key not working**: Ensure STACKSFINDER_API_KEY is set in your MCP config\n`;
		text += `- **Tool not found**: Update to latest version: \`npm install -g @stacksfinder/mcp-server\`\n`;
	} else {
		text += `- **Connection issues**: Check your API key and network connection\n`;
	}

	// Fallback message for specific workflows
	if (workflow.fallbackMessage && context === 'chatgpt') {
		text += `\n**Note**: ${workflow.fallbackMessage}\n`;
	}

	return { text };
}
