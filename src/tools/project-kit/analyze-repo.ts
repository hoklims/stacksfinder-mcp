/**
 * analyze_repo_mcps Tool
 *
 * Analyzes a repository to detect the tech stack and recommend
 * appropriate MCP servers based on the detected technologies.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
import type {
	AnalyzeRepoMCPsInput,
	AnalyzeRepoMCPsOutput,
	MCPCompatibilityResult,
	ExcludedRecommendation,
	MCPRecommendation
} from './types.js';
import { AnalyzeRepoMCPsInputSchema } from './types.js';
import { detectStackFromFiles } from './detect-stack.js';
import { matchMCPsForStack, generateInstallConfig } from './match-mcps.js';
import { debug, info, error } from '../../utils/logger.js';
import {
	initRulesIndex,
	getAllRules,
	generateReport,
	findRule,
	canonicalizeMcpId,
	type CompatibilityReport
} from '@stacksfinder/mcp-compatibility';

// ============================================================================
// INSTALLED MCP DETECTION
// ============================================================================

/**
 * Common locations for MCP configuration files.
 */
const MCP_CONFIG_LOCATIONS = [
	// Claude Desktop (macOS)
	'~/Library/Application Support/Claude/claude_desktop_config.json',
	// Claude Desktop (Windows)
	'%APPDATA%/Claude/claude_desktop_config.json',
	// Claude Desktop (Linux)
	'~/.config/claude/claude_desktop_config.json',
	// Cursor
	'.cursor/mcp.json',
	// VS Code
	'.vscode/mcp.json',
	// Project-local
	'mcp.json',
	'.mcp.json'
];

/**
 * Expand path with environment variables and home directory.
 */
function expandPath(p: string): string {
	// Expand home directory
	if (p.startsWith('~/')) {
		p = path.join(os.homedir(), p.slice(2));
	}

	// Expand environment variables (Windows style)
	p = p.replace(/%([^%]+)%/g, (_, envVar) => process.env[envVar] || '');

	return p;
}

/**
 * Parse MCP config file and extract installed server slugs.
 */
async function parseConfigFile(configPath: string): Promise<string[]> {
	try {
		const content = await fs.readFile(configPath, 'utf-8');
		const config = JSON.parse(content);

		const servers: string[] = [];

		// Handle mcpServers object format
		if (config.mcpServers && typeof config.mcpServers === 'object') {
			servers.push(...Object.keys(config.mcpServers));
		}

		// Handle servers array format
		if (Array.isArray(config.servers)) {
			for (const server of config.servers) {
				if (server.name) {
					servers.push(server.name);
				}
			}
		}

		return servers;
	} catch {
		return [];
	}
}

/**
 * Detect installed MCPs from configuration files.
 */
async function getInstalledMCPs(
	workspaceRoot: string,
	customConfigPath?: string
): Promise<string[]> {
	const installedMcps: Set<string> = new Set();

	// Check custom config path first
	if (customConfigPath) {
		const servers = await parseConfigFile(path.resolve(workspaceRoot, customConfigPath));
		servers.forEach((s) => installedMcps.add(s));
	}

	// Check all common locations
	for (const location of MCP_CONFIG_LOCATIONS) {
		let configPath: string;

		if (location.startsWith('~') || location.includes('%')) {
			// Absolute/home paths
			configPath = expandPath(location);
		} else {
			// Relative to workspace
			configPath = path.join(workspaceRoot, location);
		}

		const servers = await parseConfigFile(configPath);
		servers.forEach((s) => installedMcps.add(s));
	}

	debug(`Found ${installedMcps.size} installed MCPs`);
	return Array.from(installedMcps);
}

// ============================================================================
// COMPATIBILITY HELPERS
// ============================================================================

let rulesInitialized = false;

/**
 * Ensure rules index is initialized.
 */
function ensureRulesInitialized(): void {
	if (!rulesInitialized) {
		initRulesIndex(getAllRules());
		rulesInitialized = true;
	}
}

/**
 * Convert CompatibilityReport to MCPCompatibilityResult.
 */
function convertToCompatibilityResult(report: CompatibilityReport): MCPCompatibilityResult {
	return {
		score: report.summary.score,
		grade: report.summary.grade,
		conflicts: report.conflicts.map((c) => ({
			mcpA: c.rule.mcpA,
			mcpB: c.rule.mcpB,
			reason: c.rule.reason,
			severity: c.rule.severity
		})),
		redundancies: report.redundancies.map((r) => ({
			mcpA: r.rule.mcpA,
			mcpB: r.rule.mcpB,
			reason: r.rule.reason,
			severity: r.rule.severity
		})),
		synergies: report.synergies.map((s) => ({
			mcpA: s.rule.mcpA,
			mcpB: s.rule.mcpB,
			reason: s.rule.reason
		})),
		suggestions: report.suggestions.map((s) => ({
			mcp: s.mcp,
			reason: s.reason,
			basedOn: s.basedOn
		}))
	};
}

// ============================================================================
// TOOL IMPLEMENTATION
// ============================================================================

/**
 * Analyze repository and recommend MCPs.
 */
export async function analyzeRepo(input: AnalyzeRepoMCPsInput): Promise<AnalyzeRepoMCPsOutput> {
	const workspaceRoot = input.workspaceRoot || process.cwd();

	info(`Analyzing repository at: ${workspaceRoot}`);

	// Initialize compatibility rules
	ensureRulesInitialized();

	// Step 1: Detect installed MCPs
	const installedMcps = await getInstalledMCPs(workspaceRoot, input.mcpConfigPath);

	// Step 2: Detect stack from files
	const { stack: detectedStack, filesAnalyzed } = await detectStackFromFiles(workspaceRoot);

	// Log detection summary
	const stackSummary = [
		detectedStack.frontend && `frontend: ${detectedStack.frontend.name}`,
		detectedStack.backend && `backend: ${detectedStack.backend.name}`,
		detectedStack.database && `database: ${detectedStack.database.name}`,
		detectedStack.orm && `orm: ${detectedStack.orm.name}`,
		detectedStack.auth && `auth: ${detectedStack.auth.name}`,
		detectedStack.hosting && `hosting: ${detectedStack.hosting.name}`,
		detectedStack.payments && `payments: ${detectedStack.payments.name}`,
		detectedStack.services.length > 0 &&
			`services: ${detectedStack.services.map((s) => s.name).join(', ')}`
	]
		.filter(Boolean)
		.join(', ');

	info(`Detected stack: ${stackSummary || 'none'}`);

	// Step 3: Match MCPs for detected stack
	const allRecommendedMcps = matchMCPsForStack(detectedStack, {
		includeInstalled: input.includeInstalled,
		installedMcps
	});

	// Step 4: Check compatibility between installed MCPs
	const installedReport = generateReport(installedMcps, getAllRules());
	const installedCompatibility = convertToCompatibilityResult(installedReport);

	// Step 5: Check recommendations against installed MCPs for conflicts
	const excludedRecommendations: ExcludedRecommendation[] = [];
	const recommendationConflicts: Array<{
		recommended: string;
		conflictsWith: string;
		reason: string;
	}> = [];
	const safeRecommendations: MCPRecommendation[] = [];

	for (const rec of allRecommendedMcps) {
		const canonicalRec = canonicalizeMcpId(rec.slug);
		let hasConflict = false;

		for (const installed of installedMcps) {
			const rule = findRule(canonicalRec, installed);

			if (rule && rule.status === 'conflict') {
				hasConflict = true;
				excludedRecommendations.push({
					mcp: rec.slug,
					reason: rule.reason,
					conflictsWith: installed
				});
				recommendationConflicts.push({
					recommended: rec.slug,
					conflictsWith: installed,
					reason: rule.reason
				});
				debug(`Excluded ${rec.slug}: conflicts with installed ${installed}`);
				break;
			}
		}

		if (!hasConflict) {
			safeRecommendations.push(rec);
		}
	}

	info(
		`Recommended ${safeRecommendations.length} MCPs (${excludedRecommendations.length} excluded due to conflicts)`
	);

	// Step 6: Generate install configs for safe recommendations only
	const installConfig = generateInstallConfig(safeRecommendations);

	return {
		detectedStack,
		installedMcps,
		recommendedMcps: safeRecommendations,
		excludedRecommendations,
		compatibility: {
			installed: installedCompatibility,
			recommendationConflicts
		},
		installConfig,
		metadata: {
			filesAnalyzed,
			analysisDate: new Date().toISOString()
		}
	};
}

// ============================================================================
// TOOL HANDLER
// ============================================================================

/**
 * Tool definition for MCP server registration.
 */
export const analyzeRepoMcpsTool = {
	name: 'analyze_repo_mcps',
	description: `Analyze your current repository to detect the tech stack and recommend relevant MCP servers.

This tool examines your project files (package.json, .env, config files, etc.) to:
1. Detect frontend, backend, database, auth, hosting, and payment technologies
2. Find already installed MCP servers
3. Recommend new MCPs that would enhance your development workflow
4. Generate ready-to-use install configurations for Cursor, Claude Desktop, and Windsurf

Example use cases:
- "What MCPs would help with my project?"
- "Analyze my repo and suggest useful MCP servers"
- "Which MCPs am I missing based on my tech stack?"`,

	inputSchema: {
		type: 'object',
		properties: {
			includeInstalled: {
				type: 'boolean',
				description: 'Include already installed MCPs in recommendations (default: false)',
				default: false
			},
			mcpConfigPath: {
				type: 'string',
				description: 'Override path to MCP configuration file'
			},
			workspaceRoot: {
				type: 'string',
				description: 'Override workspace root directory (default: current directory)'
			}
		}
	},

	handler: async (params: unknown) => {
		try {
			const input = AnalyzeRepoMCPsInputSchema.parse(params);
			const result = await analyzeRepo(input);

			// Format output for display
			const output = formatAnalysisOutput(result);

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
			error('analyze_repo_mcps error:', err);
			throw err;
		}
	}
};

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

/**
 * Format analysis output for display.
 */
function formatAnalysisOutput(result: AnalyzeRepoMCPsOutput): string {
	const lines: string[] = [];

	lines.push('# Repository Analysis\n');

	// Detected Stack
	lines.push('## Detected Technologies\n');

	const stackItems = [
		result.detectedStack.frontend &&
			`- **Frontend**: ${result.detectedStack.frontend.name}${result.detectedStack.frontend.version ? ` (${result.detectedStack.frontend.version})` : ''}`,
		result.detectedStack.backend &&
			`- **Backend**: ${result.detectedStack.backend.name}${result.detectedStack.backend.version ? ` (${result.detectedStack.backend.version})` : ''}`,
		result.detectedStack.database &&
			`- **Database**: ${result.detectedStack.database.name}${result.detectedStack.database.version ? ` (${result.detectedStack.database.version})` : ''}`,
		result.detectedStack.orm &&
			`- **ORM**: ${result.detectedStack.orm.name}${result.detectedStack.orm.version ? ` (${result.detectedStack.orm.version})` : ''}`,
		result.detectedStack.auth &&
			`- **Auth**: ${result.detectedStack.auth.name}${result.detectedStack.auth.version ? ` (${result.detectedStack.auth.version})` : ''}`,
		result.detectedStack.hosting &&
			`- **Hosting**: ${result.detectedStack.hosting.name}${result.detectedStack.hosting.version ? ` (${result.detectedStack.hosting.version})` : ''}`,
		result.detectedStack.payments &&
			`- **Payments**: ${result.detectedStack.payments.name}${result.detectedStack.payments.version ? ` (${result.detectedStack.payments.version})` : ''}`
	].filter((item): item is string => Boolean(item));

	if (stackItems.length > 0) {
		lines.push(...stackItems);
	} else {
		lines.push('_No technologies detected from project files._');
	}

	if (result.detectedStack.services.length > 0) {
		lines.push('\n**Services**:');
		for (const service of result.detectedStack.services) {
			lines.push(`- ${service.name}`);
		}
	}

	lines.push('');

	// Files Analyzed
	lines.push('## Files Analyzed\n');
	if (result.metadata.filesAnalyzed.length > 0) {
		lines.push(result.metadata.filesAnalyzed.map((f) => `- \`${f}\``).join('\n'));
	} else {
		lines.push('_No recognized configuration files found._');
	}
	lines.push('');

	// Installed MCPs + Compatibility
	if (result.installedMcps.length > 0) {
		lines.push('## Already Installed MCPs\n');
		lines.push(result.installedMcps.map((m) => `- ${m}`).join('\n'));
		lines.push('');

		// Compatibility Report for installed MCPs
		const compat = result.compatibility.installed;
		const gradeEmoji =
			compat.grade === 'A' ? '🟢' : compat.grade === 'B' ? '🔵' : compat.grade === 'C' ? '🟡' : '🔴';

		lines.push('### Compatibility Check\n');
		lines.push(`**Health Score**: ${compat.score}/100 (Grade ${compat.grade}) ${gradeEmoji}\n`);

		if (compat.conflicts.length > 0) {
			lines.push('#### 🔴 Conflicts\n');
			for (const conflict of compat.conflicts) {
				const severity = conflict.severity === 'critical' ? '⚠️ Critical' : '⚡ Warning';
				lines.push(`- **${conflict.mcpA}** ↔ **${conflict.mcpB}** (${severity})`);
				lines.push(`  - ${conflict.reason}`);
			}
			lines.push('');
		}

		if (compat.redundancies.length > 0) {
			lines.push('#### 🟡 Redundancies\n');
			for (const redundancy of compat.redundancies) {
				lines.push(`- **${redundancy.mcpA}** ↔ **${redundancy.mcpB}**`);
				lines.push(`  - ${redundancy.reason}`);
			}
			lines.push('');
		}

		if (compat.synergies.length > 0) {
			lines.push('#### 🔵 Synergies\n');
			for (const synergy of compat.synergies) {
				lines.push(`- **${synergy.mcpA}** + **${synergy.mcpB}** ✨`);
				lines.push(`  - ${synergy.reason}`);
			}
			lines.push('');
		}

		if (compat.suggestions.length > 0) {
			lines.push('#### 💡 Suggestions\n');
			for (const suggestion of compat.suggestions) {
				lines.push(`- Consider adding **${suggestion.mcp}**`);
				lines.push(`  - ${suggestion.reason} (pairs well with ${suggestion.basedOn})`);
			}
			lines.push('');
		}
	}

	// Excluded Recommendations (due to conflicts)
	if (result.excludedRecommendations.length > 0) {
		lines.push('## Excluded Recommendations\n');
		lines.push('_The following MCPs were not recommended due to conflicts with your installed MCPs:_\n');
		for (const excluded of result.excludedRecommendations) {
			lines.push(`- **${excluded.mcp}** conflicts with \`${excluded.conflictsWith}\``);
			lines.push(`  - ${excluded.reason}`);
		}
		lines.push('');
	}

	// Recommended MCPs
	lines.push('## Recommended MCPs\n');

	if (result.recommendedMcps.length === 0) {
		lines.push('_No additional MCPs recommended. You have everything you need!_');
	} else {
		// Group by priority
		const highPriority = result.recommendedMcps.filter((m) => m.priority === 'high');
		const mediumPriority = result.recommendedMcps.filter((m) => m.priority === 'medium');
		const lowPriority = result.recommendedMcps.filter((m) => m.priority === 'low');

		if (highPriority.length > 0) {
			lines.push('### 🔴 High Priority\n');
			for (const mcp of highPriority) {
				lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
				lines.push(`- ${mcp.description}`);
				lines.push(`- _Matched: ${mcp.matchedTech}_`);
				lines.push('');
			}
		}

		if (mediumPriority.length > 0) {
			lines.push('### 🟡 Medium Priority\n');
			for (const mcp of mediumPriority) {
				lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
				lines.push(`- ${mcp.description}`);
				lines.push(`- _Matched: ${mcp.matchedTech}_`);
				lines.push('');
			}
		}

		if (lowPriority.length > 0) {
			lines.push('### 🟢 Low Priority\n');
			for (const mcp of lowPriority) {
				lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
				lines.push(`- ${mcp.description}`);
				lines.push(`- _Matched: ${mcp.matchedTech}_`);
				lines.push('');
			}
		}
	}

	// Quick Install
	if (result.recommendedMcps.length > 0) {
		lines.push('## Quick Install\n');
		lines.push('Add to your Claude Desktop config (`claude_desktop_config.json`):\n');
		lines.push('```json');
		lines.push(JSON.stringify(result.installConfig.claudeDesktop, null, 2));
		lines.push('```\n');
	}

	// Metadata
	lines.push(`---\n_Analysis completed: ${result.metadata.analysisDate}_`);

	return lines.join('\n');
}
