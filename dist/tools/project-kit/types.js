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
];
export const PROJECT_TYPES = [
    'web-app',
    'mobile-app',
    'api',
    'saas',
    'e-commerce',
    'marketplace',
    'cli',
    'library'
];
export const SCALES = ['mvp', 'startup', 'growth', 'enterprise'];
export const TECH_TYPES = ['frontend', 'backend', 'database', 'orm', 'service', 'auth', 'hosting', 'payments'];
export const MCP_PRIORITIES = ['high', 'medium', 'low'];
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
// ============================================================================
// ANALYZE_REPO_MCPS TYPES
// ============================================================================
export const AnalyzeRepoMCPsInputSchema = z.object({
    includeInstalled: z.boolean().optional().default(false).describe('Include already installed MCPs'),
    mcpConfigPath: z.string().optional().describe('Override MCP config location'),
    workspaceRoot: z.string().optional().describe('Override workspace root')
});
// ============================================================================
// UNIVERSAL MCPs
// ============================================================================
/**
 * MCPs that are always recommended regardless of detected stack.
 */
export const UNIVERSAL_MCPS = [
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
//# sourceMappingURL=types.js.map