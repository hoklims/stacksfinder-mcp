/**
 * MCPFinder Project Kit Module
 *
 * Exports all project-kit tools for MCP server registration:
 * - generate_mcp_kit: Project description -> optimal stack + recommended MCPs
 * - analyze_repo_mcps: Repository analysis -> detected stack -> recommended MCPs
 */

// Tool handlers
export { generateMCPKitTool, generateMCPKit } from './generate.js';
export { analyzeRepoMcpsTool, analyzeRepo } from './analyze-repo.js';

// Types
export * from './types.js';

// Detection utilities (for testing/advanced use)
export { detectStackFromFiles } from './detect-stack.js';
export {
	matchMCPsForStack,
	matchMCPsForTechnologies,
	generateInstallConfig,
	TECH_MCP_MAPPINGS
} from './match-mcps.js';
