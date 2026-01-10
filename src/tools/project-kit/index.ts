/**
 * MCPFinder Project Kit Module
 *
 * Exports all project-kit tools for MCP server registration:
 * - generate_mcp_kit: Project description -> optimal stack + recommended MCPs
 * - analyze_repo_mcps: Repository analysis -> detected stack -> recommended MCPs
 * - prepare_mcp_installation: Analyze repo -> Generate .env-mcp template
 * - execute_mcp_installation: Read .env-mcp -> Generate install commands
 */

// Tool handlers
export { generateMCPKitTool, generateMCPKit } from './generate.js';
export { analyzeRepoMcpsTool, analyzeRepo } from './analyze-repo.js';
export { prepareMCPInstallationTool, prepareMCPInstallation } from './prepare-installation.js';
export { executeMCPInstallationTool, executeMCPInstallation } from './execute-installation.js';

// Types
export * from './types.js';
export * from './installation-types.js';

// Detection utilities (for testing/advanced use)
export { detectStackFromFiles } from './detect-stack.js';
export {
	matchMCPsForStack,
	matchMCPsForTechnologies,
	generateInstallConfig,
	TECH_MCP_MAPPINGS
} from './match-mcps.js';
