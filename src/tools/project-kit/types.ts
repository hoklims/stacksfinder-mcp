/**
 * Shared types for MCPFinder project-kit tools.
 *
 * These types define the input/output schemas for:
 * - generate_mcp_kit: Project description -> stack + MCPs
 * - analyze_repo_mcps: Repo files -> detected stack -> MCPs
 */

import { z } from 'zod';

// ============================================================================
// COMMON ENUMS
// ============================================================================

export const PRIORITIES = [
	'time-to-market',
	'scalability',
	'developer-experience',
	'cost-efficiency',
	'performance',
	'security',
	'maintainability'
] as const;

export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_TYPES = [
	'web-app',
	'mobile-app',
	'api',
	'saas',
	'e-commerce',
	'marketplace',
	'cli',
	'library'
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const SCALES = ['mvp', 'startup', 'growth', 'enterprise'] as const;

export type Scale = (typeof SCALES)[number];

export const TECH_TYPES = ['frontend', 'backend', 'database', 'orm', 'service', 'auth', 'hosting', 'payments'] as const;

export type TechType = (typeof TECH_TYPES)[number];

export const MCP_PRIORITIES = ['high', 'medium', 'low'] as const;

export type MCPPriority = (typeof MCP_PRIORITIES)[number];

// ============================================================================
// DETECTION TYPES
// ============================================================================

/**
 * A detected technology from project files.
 */
export interface Detection {
	type: TechType;
	name: string;
	version?: string;
	confidence: number; // 0-1
	source: string; // e.g., 'package.json', '.env.example'
}

/**
 * Aggregated detected stack from all sources.
 */
export interface DetectedStack {
	frontend?: DetectedTech;
	backend?: DetectedTech;
	database?: DetectedTech;
	orm?: DetectedTech;
	auth?: DetectedTech;
	hosting?: DetectedTech;
	payments?: DetectedTech;
	services: DetectedTech[];
}

export interface DetectedTech {
	name: string;
	version?: string;
	confidence: number;
	source: string;
}

// ============================================================================
// MCP RECOMMENDATION TYPES
// ============================================================================

/**
 * A recommended MCP server.
 */
export interface MCPRecommendation {
	slug: string;
	name: string;
	description: string;
	priority: MCPPriority;
	reason: string;
	matchedTech: string; // Which detected tech triggered this
	installCommand?: string;
	category: string;
	githubUrl?: string;
}

/**
 * Install configuration for multiple clients.
 */
export interface MCPInstallConfigs {
	cursor: Record<string, unknown>;
	claudeDesktop: Record<string, unknown>;
	windsurf: Record<string, unknown>;
}

// ============================================================================
// GENERATE_MCP_KIT TYPES
// ============================================================================

export const GenerateMCPKitInputSchema = z.object({
	projectDescription: z.string().min(50).max(5000).describe('Describe your project (50-5000 chars)'),
	priorities: z.array(z.enum(PRIORITIES)).max(3).optional().describe('Top priorities (max 3)'),
	constraints: z.array(z.string()).optional().describe('Tech constraints (e.g., must-use-postgresql)'),
	projectType: z.enum(PROJECT_TYPES).optional().describe('Project type (if known)'),
	scale: z.enum(SCALES).optional().describe('Project scale (if known)')
});

export type GenerateMCPKitInput = z.infer<typeof GenerateMCPKitInputSchema>;

export interface TechRecommendation {
	id: string;
	name: string;
	score: number;
	grade: string;
	reason: string;
}

export interface GenerateMCPKitOutput {
	stack: {
		frontend?: TechRecommendation;
		backend?: TechRecommendation;
		database?: TechRecommendation;
		auth?: TechRecommendation;
		hosting?: TechRecommendation;
		payments?: TechRecommendation;
	};
	mcps: MCPRecommendation[];
	rationale: string;
	detectedConstraints: string[];
	metadata: {
		scoringVersion: string;
		generatedAt: string;
	};
}

// ============================================================================
// ANALYZE_REPO_MCPS TYPES
// ============================================================================

export const AnalyzeRepoMCPsInputSchema = z.object({
	includeInstalled: z.boolean().optional().default(false).describe('Include already installed MCPs'),
	mcpConfigPath: z.string().optional().describe('Override MCP config location'),
	workspaceRoot: z.string().optional().describe('Override workspace root')
});

export type AnalyzeRepoMCPsInput = z.infer<typeof AnalyzeRepoMCPsInputSchema>;

export interface AnalyzeRepoMCPsOutput {
	detectedStack: DetectedStack;
	installedMcps: string[];
	recommendedMcps: MCPRecommendation[];
	installConfig: MCPInstallConfigs;
	metadata: {
		filesAnalyzed: string[];
		analysisDate: string;
	};
}

// ============================================================================
// DETECTION RULE TYPES
// ============================================================================

export interface DetectionRule {
	file: string;
	parser: (content: string) => Detection[];
	priority: number; // Higher = more authoritative
}

// ============================================================================
// UNIVERSAL MCPs
// ============================================================================

/**
 * MCPs that are always recommended regardless of detected stack.
 */
export const UNIVERSAL_MCPS: Array<{
	slug: string;
	name: string;
	description: string;
	priority: MCPPriority;
	reason: string;
	category: string;
}> = [
	{
		slug: 'context7',
		name: 'Context7',
		description: 'Up-to-date documentation lookup for any library',
		priority: 'high',
		reason: 'Essential for accurate documentation lookup across any tech stack',
		category: 'documentation'
	},
	{
		slug: 'sequential-thinking',
		name: 'Sequential Thinking',
		description: 'Better reasoning for complex multi-step tasks',
		priority: 'medium',
		reason: 'Improves reasoning quality for architecture decisions',
		category: 'ai-llm'
	}
];
