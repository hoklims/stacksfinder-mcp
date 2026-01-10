/**
 * execute_mcp_installation Tool
 *
 * Reads a .env-mcp file and generates installation commands for MCPs
 * where the user has provided the required credentials.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import type {
	ExecuteMCPInstallationInput,
	ExecuteMCPInstallationOutput,
	MCPInstallCommand,
	MCPEnvVar
} from './installation-types.js';
import { ExecuteMCPInstallationInputSchema, getMCPRegistryEntry } from './installation-types.js';
import { info, error, debug } from '../../utils/logger.js';

// ============================================================================
// ENV-MCP FILE PARSING
// ============================================================================

interface ParsedEnvMcp {
	/** INSTALL_xxx flags per MCP slug */
	installFlags: Map<string, boolean>;
	/** All env var values */
	envVars: Map<string, string>;
}

/**
 * Parse .env-mcp file content.
 */
function parseEnvMcpContent(content: string): ParsedEnvMcp {
	const installFlags = new Map<string, boolean>();
	const envVars = new Map<string, string>();

	const lines = content.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip comments and empty lines
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		// Parse KEY=VALUE
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) continue;

		const key = trimmed.substring(0, eqIndex).trim();
		const value = trimmed.substring(eqIndex + 1).trim();

		// Handle INSTALL_xxx flags
		if (key.startsWith('INSTALL_')) {
			const slug = key
				.replace('INSTALL_', '')
				.toLowerCase()
				.replace(/_/g, '-');
			installFlags.set(slug, value.toLowerCase() === 'true');
		} else if (value) {
			// Store non-empty env vars
			envVars.set(key, value);
		}
	}

	return { installFlags, envVars };
}

// ============================================================================
// COMMAND GENERATION
// ============================================================================

type TargetClient = 'claude-code' | 'claude-desktop' | 'cursor' | 'vscode' | 'windsurf';

/**
 * Generate Claude Code CLI command for an MCP.
 */
function generateClaudeCodeCommand(
	slug: string,
	npmPackage: string,
	envVars: Map<string, string>,
	requiredVars: MCPEnvVar[]
): string {
	// Build the JSON config
	const config: Record<string, unknown> = {
		command: 'npx',
		args: ['-y', npmPackage]
	};

	// Add env vars if any
	const envObj: Record<string, string> = {};
	for (const varDef of requiredVars) {
		const value = envVars.get(varDef.name);
		if (value) {
			envObj[varDef.name] = value;
		}
	}

	if (Object.keys(envObj).length > 0) {
		config.env = envObj;
	}

	const jsonStr = JSON.stringify(config).replace(/"/g, '\\"');
	return `claude mcp add-json "${slug}" "${jsonStr}"`;
}

/**
 * Generate JSON config for Claude Desktop / Cursor / VS Code.
 */
function generateJsonConfig(
	_slug: string,
	npmPackage: string,
	envVars: Map<string, string>,
	requiredVars: MCPEnvVar[]
): Record<string, unknown> {
	const config: Record<string, unknown> = {
		command: 'npx',
		args: ['-y', npmPackage]
	};

	// Add env vars if any
	const envObj: Record<string, string> = {};
	for (const varDef of requiredVars) {
		const value = envVars.get(varDef.name);
		if (value) {
			envObj[varDef.name] = value;
		}
	}

	if (Object.keys(envObj).length > 0) {
		config.env = envObj;
	}

	return config;
}

/**
 * Get config file path for target client.
 */
function getConfigPathForClient(client: TargetClient): string {
	switch (client) {
		case 'claude-code':
			return '~/.claude.json (managed by CLI)';
		case 'claude-desktop':
			return process.platform === 'win32'
				? '%APPDATA%\\Claude\\claude_desktop_config.json'
				: process.platform === 'darwin'
					? '~/Library/Application Support/Claude/claude_desktop_config.json'
					: '~/.config/claude/claude_desktop_config.json';
		case 'cursor':
			return process.platform === 'win32'
				? '%APPDATA%\\Cursor\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json'
				: '~/.cursor/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json';
		case 'vscode':
			return 'VS Code MCP extension settings';
		case 'windsurf':
			return '~/.windsurf/mcp.json';
	}
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if all required env vars are present for an MCP.
 */
function validateEnvVars(
	requiredVars: MCPEnvVar[],
	envVars: Map<string, string>
): { ready: boolean; missingVars: string[] } {
	const missingVars: string[] = [];

	for (const varDef of requiredVars) {
		if (varDef.requirement === 'required') {
			const value = envVars.get(varDef.name);
			if (!value || value.trim() === '') {
				missingVars.push(varDef.name);
			}
		}
	}

	return {
		ready: missingVars.length === 0,
		missingVars
	};
}

// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================

/**
 * Execute MCP installation by reading .env-mcp and generating commands.
 */
export async function executeMCPInstallation(
	input: ExecuteMCPInstallationInput
): Promise<ExecuteMCPInstallationOutput> {
	const envMcpPath = input.envMcpPath || path.join(process.cwd(), '.env-mcp');
	const targetClient = input.targetClient || 'claude-code';
	const dryRun = input.dryRun ?? false;

	info(`Executing MCP installation from: ${envMcpPath}`);
	info(`Target client: ${targetClient}`);

	// Step 1: Read and parse .env-mcp file
	let content: string;
	try {
		content = await fs.readFile(envMcpPath, 'utf-8');
	} catch (err) {
		error(`Failed to read .env-mcp: ${err}`);
		throw new Error(
			`Could not read .env-mcp file at ${envMcpPath}. ` +
				'Run prepare_mcp_installation first to generate it.'
		);
	}

	const parsed = parseEnvMcpContent(content);
	debug(`Found ${parsed.installFlags.size} MCPs with install flags`);
	debug(`Found ${parsed.envVars.size} env vars`);

	// Step 2: Generate commands for each MCP
	const commands: MCPInstallCommand[] = [];
	const aggregateConfig: Record<string, Record<string, unknown>> = {};

	for (const [slug, shouldInstall] of parsed.installFlags) {
		if (!shouldInstall) {
			commands.push({
				slug,
				name: formatMCPName(slug),
				ready: false,
				missingVars: [],
				status: 'skipped'
			});
			continue;
		}

		const registryEntry = getMCPRegistryEntry(slug);
		if (!registryEntry) {
			debug(`MCP ${slug} not found in registry, skipping`);
			continue;
		}

		// Validate env vars
		const validation = validateEnvVars(registryEntry.envVars, parsed.envVars);

		const command: MCPInstallCommand = {
			slug,
			name: registryEntry.name,
			ready: validation.ready,
			missingVars: validation.missingVars,
			status: validation.ready ? 'ready' : 'missing_vars'
		};

		if (validation.ready) {
			// Generate commands
			command.claudeCodeCommand = generateClaudeCodeCommand(
				slug,
				registryEntry.npmPackage,
				parsed.envVars,
				registryEntry.envVars
			);

			command.jsonConfig = generateJsonConfig(
				slug,
				registryEntry.npmPackage,
				parsed.envVars,
				registryEntry.envVars
			);

			// Add to aggregate config
			aggregateConfig[slug] = command.jsonConfig;
		}

		commands.push(command);
	}

	// Step 3: Calculate stats
	const readyCount = commands.filter((c) => c.status === 'ready').length;
	const pendingCount = commands.filter((c) => c.status === 'missing_vars').length;

	// Step 4: Generate aggregate command for Claude Code
	let aggregateCommand: string | undefined;
	if (targetClient === 'claude-code' && readyCount > 0) {
		const readyCommands = commands
			.filter((c) => c.status === 'ready' && c.claudeCodeCommand)
			.map((c) => c.claudeCodeCommand!);

		aggregateCommand = readyCommands.join(' && ');
	}

	// Step 5: Generate post-install instructions
	const postInstallInstructions = generatePostInstallInstructions(
		targetClient,
		readyCount,
		pendingCount
	);

	// Step 6: Generate summary message
	const message = generateSummaryMessage(commands, targetClient, dryRun);

	return {
		commands,
		readyCount,
		pendingCount,
		aggregateCommand,
		aggregateConfig: Object.keys(aggregateConfig).length > 0 ? { mcpServers: aggregateConfig } : undefined,
		postInstallInstructions,
		message
	};
}

// ============================================================================
// HELPERS
// ============================================================================

function formatMCPName(slug: string): string {
	return slug
		.replace(/-mcp$/, '')
		.split('-')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
		.concat(' MCP');
}

function generatePostInstallInstructions(
	client: TargetClient,
	readyCount: number,
	pendingCount: number
): string[] {
	const instructions: string[] = [];

	if (readyCount === 0) {
		instructions.push('No MCPs are ready to install. Please fill in the required credentials in .env-mcp');
		return instructions;
	}

	switch (client) {
		case 'claude-code':
			instructions.push('After running the installation commands:');
			instructions.push('1. Restart Claude Code to load the new MCP servers');
			instructions.push('2. Verify with: claude mcp list');
			break;

		case 'claude-desktop':
			instructions.push('To install:');
			instructions.push(`1. Open ${getConfigPathForClient(client)}`);
			instructions.push('2. Add the mcpServers config from aggregateConfig');
			instructions.push('3. Restart Claude Desktop');
			break;

		case 'cursor':
			instructions.push('To install:');
			instructions.push('1. Open Cursor Settings > Extensions > Claude Dev');
			instructions.push('2. Add each MCP server configuration');
			instructions.push('3. Restart Cursor');
			break;

		case 'vscode':
			instructions.push('To install:');
			instructions.push('1. Open VS Code Settings');
			instructions.push('2. Search for "MCP" and configure the servers');
			instructions.push('3. Reload VS Code window');
			break;

		case 'windsurf':
			instructions.push('To install:');
			instructions.push(`1. Edit ${getConfigPathForClient(client)}`);
			instructions.push('2. Add the mcpServers config from aggregateConfig');
			instructions.push('3. Restart Windsurf');
			break;
	}

	if (pendingCount > 0) {
		instructions.push('');
		instructions.push(`Note: ${pendingCount} MCP(s) are missing required credentials.`);
		instructions.push('Fill in the missing values in .env-mcp and run execute_mcp_installation again.');
	}

	return instructions;
}

function generateSummaryMessage(
	commands: MCPInstallCommand[],
	client: TargetClient,
	dryRun: boolean
): string {
	const readyCount = commands.filter((c) => c.status === 'ready').length;
	const pendingCount = commands.filter((c) => c.status === 'missing_vars').length;
	const skippedCount = commands.filter((c) => c.status === 'skipped').length;

	const lines: string[] = [];

	if (dryRun) {
		lines.push('🔍 DRY RUN - No changes will be made\n');
	}

	lines.push('# MCP Installation Summary\n');

	// Stats
	lines.push(`- ✅ Ready to install: ${readyCount}`);
	lines.push(`- ⏳ Missing credentials: ${pendingCount}`);
	lines.push(`- ⏭️ Skipped: ${skippedCount}`);
	lines.push('');

	// Ready MCPs
	if (readyCount > 0) {
		lines.push('## Ready to Install\n');
		for (const cmd of commands.filter((c) => c.status === 'ready')) {
			lines.push(`- ✅ **${cmd.name}** (\`${cmd.slug}\`)`);
		}
		lines.push('');
	}

	// Pending MCPs
	if (pendingCount > 0) {
		lines.push('## Missing Credentials\n');
		for (const cmd of commands.filter((c) => c.status === 'missing_vars')) {
			lines.push(`- ⏳ **${cmd.name}** - missing: ${cmd.missingVars.join(', ')}`);
		}
		lines.push('');
	}

	// Skipped MCPs
	if (skippedCount > 0) {
		lines.push('## Skipped (INSTALL_xxx=false)\n');
		for (const cmd of commands.filter((c) => c.status === 'skipped')) {
			lines.push(`- ⏭️ ${cmd.name}`);
		}
		lines.push('');
	}

	// Instructions
	if (readyCount > 0 && client === 'claude-code') {
		lines.push('## Installation Command\n');
		lines.push('Run the aggregateCommand to install all ready MCPs, then restart Claude Code.');
	}

	return lines.join('\n');
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Tool definition for MCP server registration.
 */
export const executeMCPInstallationTool = {
	name: 'execute_mcp_installation',
	description: `Read a .env-mcp configuration file and generate installation commands for the MCPs.

This tool:
1. Reads the .env-mcp file generated by prepare_mcp_installation
2. Validates that required environment variables are present
3. Generates installation commands for the target IDE/client
4. Returns post-installation instructions

Prerequisites:
- Run prepare_mcp_installation first to generate .env-mcp
- Fill in the required API keys and credentials in .env-mcp
- Set INSTALL_xxx=false for MCPs you want to skip

Supported targets:
- claude-code: Generates 'claude mcp add-json' commands
- claude-desktop: Generates JSON config for claude_desktop_config.json
- cursor: Generates JSON config for Cursor MCP settings
- vscode: Generates JSON config for VS Code MCP extension
- windsurf: Generates JSON config for Windsurf

Output:
- Individual commands/configs for each ready MCP
- Aggregate command (for Claude Code) or config (for others)
- List of MCPs missing required credentials
- Post-installation instructions`,

	inputSchema: {
		type: 'object',
		properties: {
			envMcpPath: {
				type: 'string',
				description: 'Path to .env-mcp file (default: .env-mcp in current directory)'
			},
			targetClient: {
				type: 'string',
				enum: ['claude-code', 'claude-desktop', 'cursor', 'vscode', 'windsurf'],
				description: 'Target IDE/client for installation (default: claude-code)'
			},
			dryRun: {
				type: 'boolean',
				description: 'Only generate commands without marking ready to execute (default: false)'
			}
		}
	},

	handler: async (params: unknown) => {
		try {
			const input = ExecuteMCPInstallationInputSchema.parse(params);
			const result = await executeMCPInstallation(input);

			// Format output for display
			const output = formatExecutionOutput(result);

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
			error('execute_mcp_installation error:', err);
			throw err;
		}
	}
};

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

function formatExecutionOutput(result: ExecuteMCPInstallationOutput): string {
	const lines: string[] = [];

	lines.push(result.message);
	lines.push('');

	// Show aggregate command for Claude Code
	if (result.aggregateCommand) {
		lines.push('---\n');
		lines.push('## Claude Code Installation\n');
		lines.push('Run this command to install all ready MCPs:\n');
		lines.push('```bash');
		lines.push(result.aggregateCommand);
		lines.push('```\n');
	}

	// Show JSON config for other clients
	if (result.aggregateConfig && !result.aggregateCommand) {
		lines.push('---\n');
		lines.push('## JSON Configuration\n');
		lines.push('Add this to your MCP configuration file:\n');
		lines.push('```json');
		lines.push(JSON.stringify(result.aggregateConfig, null, 2));
		lines.push('```\n');
	}

	// Post-install instructions
	if (result.postInstallInstructions.length > 0) {
		lines.push('---\n');
		lines.push('## Post-Installation\n');
		for (const instruction of result.postInstallInstructions) {
			lines.push(instruction);
		}
	}

	return lines.join('\n');
}
