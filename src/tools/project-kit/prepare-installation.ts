/**
 * prepare_mcp_installation Tool
 *
 * Analyzes a repository, detects needed MCPs, and generates a .env-mcp
 * template file for the user to fill in with their API keys.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import type {
	PrepareMCPInstallationInput,
	PrepareMCPInstallationOutput,
	MCPInstallInfo
} from './installation-types.js';
import { PrepareMCPInstallationInputSchema, getMCPRegistryEntry } from './installation-types.js';
import { analyzeRepo } from './analyze-repo.js';
import { info, error, debug } from '../../utils/logger.js';

// ============================================================================
// ENV-MCP FILE GENERATION
// ============================================================================

/**
 * Generate the content for .env-mcp file.
 */
function generateEnvMcpContent(mcpsToInstall: MCPInstallInfo[]): string {
	const lines: string[] = [];
	const timestamp = new Date().toISOString();

	// Header
	lines.push('# ============================================================================');
	lines.push('# MCP INSTALLATION CONFIGURATION');
	lines.push(`# Generated: ${timestamp}`);
	lines.push('# ============================================================================');
	lines.push('#');
	lines.push('# This file contains environment variables needed for MCP server installation.');
	lines.push('# Fill in the values for the MCPs you want to install.');
	lines.push('#');
	lines.push('# Requirements:');
	lines.push('#   [REQUIRED]    - Must be filled for the MCP to work');
	lines.push('#   [OPTIONAL]    - Can be left empty, MCP will use defaults');
	lines.push('#   [CONDITIONAL] - Required only if specific feature is used');
	lines.push('#');
	lines.push('# After filling in the values, run the execute_mcp_installation tool');
	lines.push('# to install the MCPs.');
	lines.push('# ============================================================================');
	lines.push('');

	// Installation Control Section
	lines.push('# ============================================================================');
	lines.push('# INSTALLATION CONTROL');
	lines.push('# ============================================================================');
	lines.push('# Set to "true" for MCPs you want to install, "false" to skip.');
	lines.push('');

	for (const mcp of mcpsToInstall) {
		const varName = `INSTALL_${mcp.slug.toUpperCase().replace(/-/g, '_')}`;
		lines.push(`# ${mcp.name} - ${mcp.description}`);
		lines.push(`# Priority: ${mcp.priority.toUpperCase()} | Matched: ${mcp.matchedTech}`);
		lines.push(`${varName}=true`);
		lines.push('');
	}

	// Group MCPs by category
	const mcpsByCategory = new Map<string, MCPInstallInfo[]>();
	for (const mcp of mcpsToInstall) {
		const category = mcp.category;
		if (!mcpsByCategory.has(category)) {
			mcpsByCategory.set(category, []);
		}
		mcpsByCategory.get(category)!.push(mcp);
	}

	// Generate env vars by category
	for (const [category, mcps] of mcpsByCategory) {
		lines.push('# ============================================================================');
		lines.push(`# ${category.toUpperCase().replace(/-/g, ' ')}`);
		lines.push('# ============================================================================');
		lines.push('');

		for (const mcp of mcps) {
			lines.push(`# --- ${mcp.name} ---`);
			if (mcp.docsUrl) {
				lines.push(`# Docs: ${mcp.docsUrl}`);
			}
			if (mcp.githubUrl) {
				lines.push(`# GitHub: ${mcp.githubUrl}`);
			}
			lines.push('');

			if (mcp.envVars.length === 0) {
				lines.push('# No environment variables required for this MCP.');
				lines.push('');
			} else {
				for (const envVar of mcp.envVars) {
					const requirementTag = `[${envVar.requirement.toUpperCase()}]`;
					lines.push(`# ${requirementTag} ${envVar.description}`);
					if (envVar.example) {
						lines.push(`# Example: ${envVar.example}`);
					}
					if (envVar.condition) {
						lines.push(`# Condition: ${envVar.condition}`);
					}
					lines.push(`${envVar.name}=`);
					lines.push('');
				}
			}
		}
	}

	// Footer
	lines.push('# ============================================================================');
	lines.push('# END OF CONFIGURATION');
	lines.push('# ============================================================================');
	lines.push('# Run: execute_mcp_installation to install the MCPs with these settings.');
	lines.push('');

	return lines.join('\n');
}

/**
 * Convert MCPRecommendation to MCPInstallInfo with full details.
 */
function enrichMCPRecommendation(
	slug: string,
	matchedTech: string,
	priority: string,
	category: string
): MCPInstallInfo | null {
	const registryEntry = getMCPRegistryEntry(slug);

	if (!registryEntry) {
		// Fallback for MCPs not in registry
		debug(`MCP ${slug} not found in registry, using minimal info`);
		return {
			slug,
			name: formatMCPName(slug),
			description: `MCP server for ${matchedTech}`,
			priority: priority as MCPInstallInfo['priority'],
			matchedTech,
			category,
			installCommand: `npx -y ${slug}`,
			envVars: []
		};
	}

	return {
		slug: registryEntry.slug,
		name: registryEntry.name,
		description: registryEntry.description,
		priority: priority as MCPInstallInfo['priority'],
		matchedTech,
		category: registryEntry.category,
		installCommand: `npx -y ${registryEntry.npmPackage}`,
		envVars: registryEntry.envVars,
		githubUrl: registryEntry.githubUrl,
		docsUrl: registryEntry.docsUrl
	};
}

/**
 * Format MCP slug into human-readable name.
 */
function formatMCPName(slug: string): string {
	return slug
		.replace(/-mcp$/, '')
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
		.concat(' MCP');
}

// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================

/**
 * Prepare MCP installation by analyzing repo and generating .env-mcp.
 */
export async function prepareMCPInstallation(
	input: PrepareMCPInstallationInput
): Promise<PrepareMCPInstallationOutput> {
	const workspaceRoot = input.workspaceRoot || process.cwd();
	const envMcpPath = input.envMcpPath || path.join(workspaceRoot, '.env-mcp');

	info(`Preparing MCP installation for workspace: ${workspaceRoot}`);

	// Step 1: Analyze the repository
	const analysisResult = await analyzeRepo({
		workspaceRoot,
		mcpConfigPath: input.mcpConfigPath,
		includeInstalled: input.includeInstalled
	});

	// Step 2: Enrich recommendations with full install info
	const mcpsToInstall: MCPInstallInfo[] = [];

	for (const rec of analysisResult.recommendedMcps) {
		const installInfo = enrichMCPRecommendation(rec.slug, rec.matchedTech, rec.priority, rec.category);

		if (installInfo) {
			mcpsToInstall.push(installInfo);
		}
	}

	info(`Found ${mcpsToInstall.length} MCPs to install`);

	// Step 3: Generate .env-mcp content
	const envMcpContent = generateEnvMcpContent(mcpsToInstall);

	// Step 4: Write .env-mcp file
	try {
		await fs.writeFile(envMcpPath, envMcpContent, 'utf-8');
		info(`Generated .env-mcp at: ${envMcpPath}`);
	} catch (err) {
		error(`Failed to write .env-mcp: ${err}`);
		throw new Error(`Failed to write .env-mcp file: ${err}`);
	}

	// Step 5: Generate summary message
	const requiredVarsCount = mcpsToInstall.reduce(
		(count, mcp) => count + mcp.envVars.filter((v) => v.requirement === 'required').length,
		0
	);

	const message = [
		`✅ Generated .env-mcp with ${mcpsToInstall.length} MCP(s) to install.`,
		'',
		'📋 Next steps:',
		`1. Open ${envMcpPath}`,
		`2. Fill in the ${requiredVarsCount} required environment variable(s)`,
		'3. Set INSTALL_xxx=false for any MCPs you want to skip',
		'4. Run execute_mcp_installation to install the MCPs',
		'',
		`📁 File location: ${envMcpPath}`
	].join('\n');

	return {
		envMcpPath,
		mcpsToInstall,
		installedMcps: analysisResult.installedMcps,
		message,
		envMcpContent
	};
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Tool definition for MCP server registration.
 */
export const prepareMCPInstallationTool = {
	name: 'prepare_mcp_installation',
	description: `Analyze your repository and generate a .env-mcp configuration file for MCP server installation.

This tool:
1. Detects your tech stack from project files (package.json, .env, etc.)
2. Identifies which MCP servers would benefit your project
3. Finds already installed MCPs to avoid duplicates
4. Generates a .env-mcp template file with all required environment variables

The generated .env-mcp file contains:
- INSTALL_xxx flags to control which MCPs to install
- Required and optional environment variables for each MCP
- Documentation links and examples

After running this tool:
1. Open the generated .env-mcp file
2. Fill in the API keys and configuration values
3. Set INSTALL_xxx=false for MCPs you don't want
4. Run execute_mcp_installation to complete the setup

Example use cases:
- "Prepare MCP installation for my project"
- "Generate .env-mcp for my tech stack"
- "What MCPs do I need and what credentials do they require?"`,

	inputSchema: {
		type: 'object',
		properties: {
			workspaceRoot: {
				type: 'string',
				description: 'Workspace root directory (default: current directory)'
			},
			mcpConfigPath: {
				type: 'string',
				description: 'Override path to existing MCP configuration file'
			},
			includeInstalled: {
				type: 'boolean',
				description: 'Include already installed MCPs in the preparation (default: false)',
				default: false
			},
			envMcpPath: {
				type: 'string',
				description: 'Path where .env-mcp will be created (default: .env-mcp in workspaceRoot)'
			}
		}
	},

	handler: async (params: unknown) => {
		try {
			const input = PrepareMCPInstallationInputSchema.parse(params);
			const result = await prepareMCPInstallation(input);

			// Format output for display
			const output = formatPreparationOutput(result);

			return {
				content: [
					{
						type: 'text',
						text: output
					}
				]
			};
		} catch (err) {
			if (err instanceof z.ZodError) {
				error('Invalid input:', err.errors);
				return {
					content: [
						{
							type: 'text',
							text: `Invalid input: ${err.errors.map((e) => e.message).join(', ')}`
						}
					],
					isError: true
				};
			}
			error('prepare_mcp_installation error:', err);
			throw err;
		}
	}
};

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

/**
 * Format preparation output for display.
 */
function formatPreparationOutput(result: PrepareMCPInstallationOutput): string {
	const lines: string[] = [];

	lines.push('# MCP Installation Preparation\n');

	// Summary
	lines.push('## Summary\n');
	lines.push(`- **MCPs to install**: ${result.mcpsToInstall.length}`);
	lines.push(`- **Already installed**: ${result.installedMcps.length}`);
	lines.push(`- **Config file**: \`${result.envMcpPath}\``);
	lines.push('');

	// Already installed
	if (result.installedMcps.length > 0) {
		lines.push('## Already Installed MCPs\n');
		for (const mcp of result.installedMcps) {
			lines.push(`- ✅ ${mcp}`);
		}
		lines.push('');
	}

	// MCPs to install
	if (result.mcpsToInstall.length > 0) {
		lines.push('## MCPs to Install\n');

		// Group by priority
		const highPriority = result.mcpsToInstall.filter((m) => m.priority === 'high');
		const mediumPriority = result.mcpsToInstall.filter((m) => m.priority === 'medium');
		const lowPriority = result.mcpsToInstall.filter((m) => m.priority === 'low');

		if (highPriority.length > 0) {
			lines.push('### 🔴 High Priority\n');
			for (const mcp of highPriority) {
				const requiredVars = mcp.envVars.filter((v) => v.requirement === 'required');
				lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
				lines.push(`- ${mcp.description}`);
				lines.push(`- Matched: ${mcp.matchedTech}`);
				if (requiredVars.length > 0) {
					lines.push(`- Required vars: ${requiredVars.map((v) => v.name).join(', ')}`);
				} else {
					lines.push('- No credentials required');
				}
				lines.push('');
			}
		}

		if (mediumPriority.length > 0) {
			lines.push('### 🟡 Medium Priority\n');
			for (const mcp of mediumPriority) {
				const requiredVars = mcp.envVars.filter((v) => v.requirement === 'required');
				lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
				lines.push(`- ${mcp.description}`);
				lines.push(`- Matched: ${mcp.matchedTech}`);
				if (requiredVars.length > 0) {
					lines.push(`- Required vars: ${requiredVars.map((v) => v.name).join(', ')}`);
				} else {
					lines.push('- No credentials required');
				}
				lines.push('');
			}
		}

		if (lowPriority.length > 0) {
			lines.push('### 🟢 Low Priority\n');
			for (const mcp of lowPriority) {
				const requiredVars = mcp.envVars.filter((v) => v.requirement === 'required');
				lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
				lines.push(`- ${mcp.description}`);
				lines.push(`- Matched: ${mcp.matchedTech}`);
				if (requiredVars.length > 0) {
					lines.push(`- Required vars: ${requiredVars.map((v) => v.name).join(', ')}`);
				} else {
					lines.push('- No credentials required');
				}
				lines.push('');
			}
		}
	}

	// Next steps
	lines.push('## Next Steps\n');
	lines.push('1. 📝 Open the generated `.env-mcp` file');
	lines.push('2. 🔑 Fill in the required API keys and credentials');
	lines.push('3. ⚙️ Set `INSTALL_xxx=false` for MCPs you want to skip');
	lines.push('4. 🚀 Run `execute_mcp_installation` to install the MCPs');
	lines.push('');

	// File location
	lines.push('---\n');
	lines.push(`📁 Configuration file: \`${result.envMcpPath}\``);

	return lines.join('\n');
}
