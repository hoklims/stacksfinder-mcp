/**
 * Types for MCP Installation Workflow
 *
 * These types define the input/output schemas for:
 * - prepare_mcp_installation: Recommend MCPs -> Generate .env-mcp template
 * - execute_mcp_installation: Read .env-mcp -> Return install commands
 */

import { z } from 'zod';
import type { MCPPriority } from './types.js';

// ============================================================================
// ENV VAR REQUIREMENT TYPES
// ============================================================================

export type EnvVarRequirement = 'required' | 'optional' | 'conditional';

export interface MCPEnvVar {
	name: string;
	description: string;
	requirement: EnvVarRequirement;
	example?: string;
	/** For conditional vars: what condition must be met */
	condition?: string;
}

// ============================================================================
// MCP INSTALLATION INFO
// ============================================================================

export interface MCPInstallInfo {
	slug: string;
	name: string;
	description: string;
	priority: MCPPriority;
	matchedTech: string;
	category: string;
	/** npm package or npx command */
	installCommand: string;
	/** Environment variables needed */
	envVars: MCPEnvVar[];
	/** GitHub repo URL */
	githubUrl?: string;
	/** Documentation URL */
	docsUrl?: string;
}

// ============================================================================
// PREPARE_MCP_INSTALLATION TYPES
// ============================================================================

export const PrepareMCPInstallationInputSchema = z.object({
	/** Workspace root to analyze (default: current directory) */
	workspaceRoot: z.string().optional(),
	/** Override path to existing MCP config file */
	mcpConfigPath: z.string().optional(),
	/** Include already installed MCPs in the preparation */
	includeInstalled: z.boolean().optional().default(false),
	/** Path where .env-mcp will be created (default: .env-mcp in workspaceRoot) */
	envMcpPath: z.string().optional()
});

export type PrepareMCPInstallationInput = z.infer<typeof PrepareMCPInstallationInputSchema>;

export interface PrepareMCPInstallationOutput {
	/** Path to generated .env-mcp file */
	envMcpPath: string;
	/** MCPs that will be installed once env vars are filled */
	mcpsToInstall: MCPInstallInfo[];
	/** Already installed MCPs (skipped) */
	installedMcps: string[];
	/** Summary message */
	message: string;
	/** Content of the generated .env-mcp file */
	envMcpContent: string;
}

// ============================================================================
// EXECUTE_MCP_INSTALLATION TYPES
// ============================================================================

export const ExecuteMCPInstallationInputSchema = z.object({
	/** Path to .env-mcp file (default: .env-mcp in current directory) */
	envMcpPath: z.string().optional(),
	/** Target IDE/client for installation */
	targetClient: z
		.enum(['claude-code', 'claude-desktop', 'cursor', 'vscode', 'windsurf'])
		.optional()
		.default('claude-code'),
	/** Only generate commands, don't mark as ready to execute */
	dryRun: z.boolean().optional().default(false)
});

export type ExecuteMCPInstallationInput = z.infer<typeof ExecuteMCPInstallationInputSchema>;

export interface MCPInstallCommand {
	/** MCP slug */
	slug: string;
	/** MCP display name */
	name: string;
	/** Whether all required env vars are present */
	ready: boolean;
	/** Missing required env vars (if not ready) */
	missingVars: string[];
	/** Command to execute for Claude Code */
	claudeCodeCommand?: string;
	/** JSON config for Claude Desktop / Cursor */
	jsonConfig?: Record<string, unknown>;
	/** Status message */
	status: 'ready' | 'missing_vars' | 'skipped';
}

export interface ExecuteMCPInstallationOutput {
	/** Commands for each MCP */
	commands: MCPInstallCommand[];
	/** MCPs that are ready to install */
	readyCount: number;
	/** MCPs missing required env vars */
	pendingCount: number;
	/** Aggregate Claude Code command (if all ready) */
	aggregateCommand?: string;
	/** Aggregate JSON config for manual install */
	aggregateConfig?: Record<string, unknown>;
	/** Post-install instructions */
	postInstallInstructions: string[];
	/** Summary message */
	message: string;
}

// ============================================================================
// MCP REGISTRY WITH ENV VARS
// ============================================================================

/**
 * Registry of known MCPs with their installation requirements.
 * This extends TECH_MCP_MAPPINGS with env var information.
 */
export interface MCPRegistryEntry {
	slug: string;
	name: string;
	description: string;
	category: string;
	/** npm package name */
	npmPackage: string;
	/** Environment variables */
	envVars: MCPEnvVar[];
	/** GitHub URL */
	githubUrl?: string;
	/** Docs URL */
	docsUrl?: string;
}

/**
 * Known MCPs with their environment variable requirements.
 */
export const MCP_REGISTRY: MCPRegistryEntry[] = [
	// ========================================================================
	// DATABASE SERVICES
	// ========================================================================
	{
		slug: 'supabase-mcp',
		name: 'Supabase MCP',
		description: 'Direct database access with RLS-aware queries',
		category: 'database',
		npmPackage: '@supabase/mcp-server-supabase',
		envVars: [
			{
				name: 'SUPABASE_URL',
				description: 'Your Supabase project URL',
				requirement: 'required',
				example: 'https://xxxxx.supabase.co'
			},
			{
				name: 'SUPABASE_SERVICE_KEY',
				description: 'Service role key (not anon key) for full access',
				requirement: 'required',
				example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
			}
		],
		githubUrl: 'https://github.com/supabase-community/supabase-mcp',
		docsUrl: 'https://supabase.com/docs/guides/getting-started/mcp'
	},
	{
		slug: 'neon-mcp',
		name: 'Neon MCP',
		description: 'Branch management and serverless Postgres operations',
		category: 'database',
		npmPackage: '@neondatabase/mcp-server-neon',
		envVars: [
			{
				name: 'NEON_API_KEY',
				description: 'Neon API key from console.neon.tech',
				requirement: 'required',
				example: 'neon_api_key_xxxxx'
			}
		],
		githubUrl: 'https://github.com/neondatabase/mcp-server-neon',
		docsUrl: 'https://neon.tech/docs/guides/neon-mcp-server'
	},
	{
		slug: 'postgres-mcp',
		name: 'PostgreSQL MCP',
		description: 'PostgreSQL database operations and query building',
		category: 'database',
		npmPackage: '@modelcontextprotocol/server-postgres',
		envVars: [
			{
				name: 'POSTGRES_CONNECTION_STRING',
				description: 'PostgreSQL connection string',
				requirement: 'required',
				example: 'postgresql://user:password@localhost:5432/dbname'
			}
		],
		githubUrl: 'https://github.com/modelcontextprotocol/servers',
		docsUrl: 'https://www.npmjs.com/package/@modelcontextprotocol/server-postgres'
	},
	{
		slug: 'mongodb-mcp',
		name: 'MongoDB MCP',
		description: 'MongoDB Atlas operations and query assistance',
		category: 'database',
		npmPackage: '@mongodb/mcp-server',
		envVars: [
			{
				name: 'MONGODB_URI',
				description: 'MongoDB connection string',
				requirement: 'required',
				example: 'mongodb+srv://user:password@cluster.mongodb.net/dbname'
			}
		],
		githubUrl: 'https://github.com/mongodb/mongodb-mcp',
		docsUrl: 'https://www.mongodb.com/docs/atlas/mcp/'
	},
	{
		slug: 'upstash-mcp',
		name: 'Upstash MCP',
		description: 'Redis operations with rate limiting support',
		category: 'database',
		npmPackage: '@upstash/mcp-server',
		envVars: [
			{
				name: 'UPSTASH_REDIS_REST_URL',
				description: 'Upstash Redis REST URL',
				requirement: 'required',
				example: 'https://xxxxx.upstash.io'
			},
			{
				name: 'UPSTASH_REDIS_REST_TOKEN',
				description: 'Upstash Redis REST token',
				requirement: 'required',
				example: 'AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ='
			}
		],
		githubUrl: 'https://github.com/upstash/mcp-server',
		docsUrl: 'https://upstash.com/docs/redis/integrations/mcp'
	},
	{
		slug: 'firebase-mcp',
		name: 'Firebase MCP',
		description: 'Firestore, Auth, and Storage operations',
		category: 'database',
		npmPackage: '@anthropic/mcp-server-firebase',
		envVars: [
			{
				name: 'GOOGLE_APPLICATION_CREDENTIALS',
				description: 'Path to Firebase service account JSON file',
				requirement: 'required',
				example: '/path/to/service-account.json'
			},
			{
				name: 'FIREBASE_PROJECT_ID',
				description: 'Firebase project ID',
				requirement: 'optional',
				example: 'my-project-id'
			}
		],
		githubUrl: 'https://github.com/anthropics/anthropic-quickstarts',
		docsUrl: 'https://firebase.google.com/docs/admin/setup'
	},

	// ========================================================================
	// PAYMENT SERVICES
	// ========================================================================
	{
		slug: 'stripe-mcp',
		name: 'Stripe MCP',
		description: 'Payment processing, subscriptions, and webhook management',
		category: 'payments',
		npmPackage: '@stripe/mcp-server',
		envVars: [
			{
				name: 'STRIPE_API_KEY',
				description: 'Stripe secret API key',
				requirement: 'required',
				example: 'sk_live_xxxxx or sk_test_xxxxx'
			}
		],
		githubUrl: 'https://github.com/stripe/stripe-mcp',
		docsUrl: 'https://docs.stripe.com/mcp'
	},
	{
		slug: 'paddle-mcp',
		name: 'Paddle MCP',
		description: 'Paddle billing, subscriptions, and tax handling',
		category: 'payments',
		npmPackage: '@anthropic/mcp-server-paddle',
		envVars: [
			{
				name: 'PADDLE_API_KEY',
				description: 'Paddle API key',
				requirement: 'required',
				example: 'pdl_live_xxxxx or pdl_test_xxxxx'
			},
			{
				name: 'PADDLE_ENVIRONMENT',
				description: 'Paddle environment (sandbox or production)',
				requirement: 'optional',
				example: 'sandbox'
			}
		],
		githubUrl: 'https://github.com/PaddleHQ/paddle-mcp-server',
		docsUrl: 'https://developer.paddle.com/mcp'
	},

	// ========================================================================
	// VERSION CONTROL
	// ========================================================================
	{
		slug: 'github-mcp',
		name: 'GitHub MCP',
		description: 'GitHub repository, issues, and PR management',
		category: 'version-control',
		npmPackage: '@github/mcp-server',
		envVars: [
			{
				name: 'GITHUB_TOKEN',
				description: 'GitHub personal access token',
				requirement: 'required',
				example: 'ghp_xxxxx'
			}
		],
		githubUrl: 'https://github.com/github/github-mcp-server',
		docsUrl: 'https://github.blog/ai-and-ml/generative-ai/a-practical-guide-on-how-to-use-the-github-mcp-server/'
	},

	// ========================================================================
	// HOSTING PLATFORMS
	// ========================================================================
	{
		slug: 'vercel-mcp',
		name: 'Vercel MCP',
		description: 'Deployment and project configuration',
		category: 'hosting',
		npmPackage: '@vercel/mcp-server',
		envVars: [
			{
				name: 'VERCEL_TOKEN',
				description: 'Vercel API token',
				requirement: 'required',
				example: 'xxxxx'
			}
		],
		githubUrl: 'https://github.com/vercel/vercel-mcp',
		docsUrl: 'https://vercel.com/docs/mcp'
	},
	{
		slug: 'cloudflare-mcp',
		name: 'Cloudflare MCP',
		description: 'Workers, KV, R2, and DNS management',
		category: 'hosting',
		npmPackage: '@cloudflare/mcp-server-cloudflare',
		envVars: [
			{
				name: 'CLOUDFLARE_API_TOKEN',
				description: 'Cloudflare API token',
				requirement: 'required',
				example: 'xxxxx'
			},
			{
				name: 'CLOUDFLARE_ACCOUNT_ID',
				description: 'Cloudflare account ID',
				requirement: 'optional',
				example: 'xxxxx'
			}
		],
		githubUrl: 'https://github.com/cloudflare/mcp-server-cloudflare',
		docsUrl: 'https://developers.cloudflare.com/mcp/'
	},
	{
		slug: 'railway-mcp',
		name: 'Railway MCP',
		description: 'Railway deployment and database management',
		category: 'hosting',
		npmPackage: '@anthropic/mcp-server-railway',
		envVars: [
			{
				name: 'RAILWAY_TOKEN',
				description: 'Railway API token',
				requirement: 'required',
				example: 'xxxxx'
			}
		],
		githubUrl: 'https://github.com/modelcontextprotocol/servers',
		docsUrl: 'https://docs.railway.com/reference/mcp-server'
	},

	// ========================================================================
	// EMAIL SERVICES
	// ========================================================================
	{
		slug: 'resend-mcp',
		name: 'Resend MCP',
		description: 'Transactional email management',
		category: 'email',
		npmPackage: '@anthropic/mcp-server-resend',
		envVars: [
			{
				name: 'RESEND_API_KEY',
				description: 'Resend API key',
				requirement: 'required',
				example: 're_xxxxx'
			},
			{
				name: 'SENDER_EMAIL_ADDRESS',
				description: 'Default sender email address',
				requirement: 'optional',
				example: 'noreply@example.com'
			}
		],
		githubUrl: 'https://github.com/resend/mcp-server-resend',
		docsUrl: 'https://resend.com/docs/mcp'
	},

	// ========================================================================
	// MONITORING & ANALYTICS
	// ========================================================================
	{
		slug: 'sentry-mcp',
		name: 'Sentry MCP',
		description: 'Error tracking and performance monitoring',
		category: 'monitoring',
		npmPackage: '@sentry/mcp-server',
		envVars: [
			{
				name: 'SENTRY_AUTH_TOKEN',
				description: 'Sentry authentication token',
				requirement: 'required',
				example: 'sntrys_xxxxx'
			},
			{
				name: 'SENTRY_ORG',
				description: 'Sentry organization slug',
				requirement: 'optional',
				example: 'my-org'
			}
		],
		githubUrl: 'https://github.com/getsentry/sentry-mcp',
		docsUrl: 'https://docs.sentry.io/platforms/javascript/guides/mcp/'
	},

	// ========================================================================
	// TESTING
	// ========================================================================
	{
		slug: 'playwright-mcp',
		name: 'Playwright MCP',
		description: 'Browser automation and E2E testing',
		category: 'testing',
		npmPackage: '@anthropic/mcp-server-playwright',
		envVars: [],
		githubUrl: 'https://github.com/anthropics/anthropic-quickstarts',
		docsUrl: 'https://playwright.dev/'
	},

	// ========================================================================
	// UNIVERSAL / DOCUMENTATION
	// ========================================================================
	{
		slug: 'context7',
		name: 'Context7',
		description: 'Up-to-date documentation lookup for any library',
		category: 'documentation',
		npmPackage: '@upstash/context7-mcp',
		envVars: [],
		githubUrl: 'https://github.com/upstash/context7',
		docsUrl: 'https://www.npmjs.com/package/@upstash/context7-mcp'
	},
	{
		slug: 'sequential-thinking',
		name: 'Sequential Thinking',
		description: 'Better reasoning for complex multi-step tasks',
		category: 'ai-llm',
		npmPackage: '@modelcontextprotocol/server-sequential-thinking',
		envVars: [],
		githubUrl: 'https://github.com/modelcontextprotocol/servers',
		docsUrl: 'https://www.npmjs.com/package/@modelcontextprotocol/server-sequential-thinking'
	},
	{
		slug: 'filesystem-mcp',
		name: 'Filesystem MCP',
		description: 'Local filesystem operations',
		category: 'filesystem',
		npmPackage: '@modelcontextprotocol/server-filesystem',
		envVars: [
			{
				name: 'ALLOWED_PATHS',
				description: 'Comma-separated list of allowed paths',
				requirement: 'optional',
				example: '/home/user/projects,/tmp'
			}
		],
		githubUrl: 'https://github.com/modelcontextprotocol/servers',
		docsUrl: 'https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem'
	},

	// ========================================================================
	// PRODUCTIVITY
	// ========================================================================
	{
		slug: 'notion-mcp',
		name: 'Notion MCP',
		description: 'Notion workspace operations',
		category: 'productivity',
		npmPackage: '@anthropic/mcp-server-notion',
		envVars: [
			{
				name: 'NOTION_API_KEY',
				description: 'Notion integration token',
				requirement: 'required',
				example: 'secret_xxxxx'
			}
		],
		githubUrl: 'https://github.com/modelcontextprotocol/servers',
		docsUrl: 'https://developers.notion.com/'
	},
	{
		slug: 'linear-mcp',
		name: 'Linear MCP',
		description: 'Linear issue tracking and project management',
		category: 'productivity',
		npmPackage: '@anthropic/mcp-server-linear',
		envVars: [
			{
				name: 'LINEAR_API_KEY',
				description: 'Linear API key',
				requirement: 'required',
				example: 'lin_api_xxxxx'
			}
		],
		githubUrl: 'https://github.com/modelcontextprotocol/servers',
		docsUrl: 'https://developers.linear.app/'
	},
	{
		slug: 'slack-mcp',
		name: 'Slack MCP',
		description: 'Slack messaging and channel management',
		category: 'communication',
		npmPackage: '@anthropic/mcp-server-slack',
		envVars: [
			{
				name: 'SLACK_BOT_TOKEN',
				description: 'Slack bot OAuth token',
				requirement: 'required',
				example: 'xoxb-xxxxx'
			}
		],
		githubUrl: 'https://github.com/modelcontextprotocol/servers',
		docsUrl: 'https://api.slack.com/'
	},

	// ========================================================================
	// SEARCH
	// ========================================================================
	{
		slug: 'perplexity-mcp',
		name: 'Perplexity MCP',
		description: 'AI-powered web search',
		category: 'search',
		npmPackage: '@anthropic/mcp-server-perplexity',
		envVars: [
			{
				name: 'PERPLEXITY_API_KEY',
				description: 'Perplexity API key',
				requirement: 'required',
				example: 'pplx-xxxxx'
			}
		],
		githubUrl: 'https://github.com/ppl-ai/modelcontextprotocol',
		docsUrl: 'https://docs.perplexity.ai/'
	}
];

/**
 * Get MCP registry entry by slug.
 */
export function getMCPRegistryEntry(slug: string): MCPRegistryEntry | undefined {
	return MCP_REGISTRY.find((entry) => entry.slug === slug);
}

/**
 * Get all env vars required by a list of MCPs.
 */
export function getRequiredEnvVars(mcpSlugs: string[]): MCPEnvVar[] {
	const envVars: MCPEnvVar[] = [];
	const seen = new Set<string>();

	for (const slug of mcpSlugs) {
		const entry = getMCPRegistryEntry(slug);
		if (!entry) continue;

		for (const envVar of entry.envVars) {
			if (!seen.has(envVar.name)) {
				seen.add(envVar.name);
				envVars.push(envVar);
			}
		}
	}

	return envVars;
}
