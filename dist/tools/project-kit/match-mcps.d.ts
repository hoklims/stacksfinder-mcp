/**
 * MCP Matching Module
 *
 * Matches detected technologies to recommended MCP servers.
 * Uses tech→MCP mappings from the database catalog.
 */
import type { DetectedStack, MCPRecommendation, MCPInstallConfigs, MCPPriority } from './types.js';
/**
 * Local mapping of technologies to recommended MCPs.
 * This is used when database is not available or for fast local matching.
 */
export declare const TECH_MCP_MAPPINGS: Array<{
    techIdentifier: string;
    mcpSlug: string;
    priority: MCPPriority;
    reason: string;
    category: string;
}>;
/**
 * Universal MCPs always recommended regardless of stack.
 */
declare const UNIVERSAL_MCPS_LOCAL: Array<{
    slug: string;
    name: string;
    description: string;
    priority: MCPPriority;
    reason: string;
    category: string;
    githubUrl?: string;
}>;
/**
 * Generate install configurations for different MCP clients.
 */
export declare function generateInstallConfig(mcps: MCPRecommendation[]): MCPInstallConfigs;
/**
 * Match detected stack to recommended MCPs.
 */
export declare function matchMCPsForStack(stack: DetectedStack, options?: {
    includeInstalled?: boolean;
    installedMcps?: string[];
}): MCPRecommendation[];
/**
 * Match technologies from project description/constraints to MCPs.
 * Used by generate_mcp_kit when no repo is being analyzed.
 */
export declare function matchMCPsForTechnologies(technologies: string[], options?: {
    includeInstalled?: boolean;
    installedMcps?: string[];
}): MCPRecommendation[];
/**
 * Get MCP info by slug.
 */
export declare function getMCPInfo(slug: string): (typeof TECH_MCP_MAPPINGS)[0] | undefined;
/**
 * Get all MCPs for a specific category.
 */
export declare function getMCPsByCategory(category: string): typeof TECH_MCP_MAPPINGS;
/**
 * Get all supported technology identifiers.
 */
export declare function getSupportedTechnologies(): string[];
/**
 * Get universal MCPs that should always be recommended.
 */
export declare function getUniversalMCPs(): typeof UNIVERSAL_MCPS_LOCAL;
export {};
//# sourceMappingURL=match-mcps.d.ts.map