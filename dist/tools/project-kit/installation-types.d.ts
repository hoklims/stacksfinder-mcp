/**
 * Types for MCP Installation Workflow
 *
 * These types define the input/output schemas for:
 * - prepare_mcp_installation: Recommend MCPs -> Generate .env-mcp template
 * - execute_mcp_installation: Read .env-mcp -> Return install commands
 */
import { z } from 'zod';
import type { MCPPriority } from './types.js';
export type EnvVarRequirement = 'required' | 'optional' | 'conditional';
export interface MCPEnvVar {
    name: string;
    description: string;
    requirement: EnvVarRequirement;
    example?: string;
    /** For conditional vars: what condition must be met */
    condition?: string;
}
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
export declare const PrepareMCPInstallationInputSchema: z.ZodObject<{
    /** Workspace root to analyze (default: current directory) */
    workspaceRoot: z.ZodOptional<z.ZodString>;
    /** Override path to existing MCP config file */
    mcpConfigPath: z.ZodOptional<z.ZodString>;
    /** Include already installed MCPs in the preparation */
    includeInstalled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    /** Path where .env-mcp will be created (default: .env-mcp in workspaceRoot) */
    envMcpPath: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    includeInstalled: boolean;
    mcpConfigPath?: string | undefined;
    workspaceRoot?: string | undefined;
    envMcpPath?: string | undefined;
}, {
    includeInstalled?: boolean | undefined;
    mcpConfigPath?: string | undefined;
    workspaceRoot?: string | undefined;
    envMcpPath?: string | undefined;
}>;
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
export declare const ExecuteMCPInstallationInputSchema: z.ZodObject<{
    /** Path to .env-mcp file (default: .env-mcp in current directory) */
    envMcpPath: z.ZodOptional<z.ZodString>;
    /** Target IDE/client for installation */
    targetClient: z.ZodDefault<z.ZodOptional<z.ZodEnum<["claude-code", "claude-desktop", "cursor", "vscode", "windsurf"]>>>;
    /** Only generate commands, don't mark as ready to execute */
    dryRun: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    targetClient: "claude-code" | "claude-desktop" | "cursor" | "vscode" | "windsurf";
    dryRun: boolean;
    envMcpPath?: string | undefined;
}, {
    envMcpPath?: string | undefined;
    targetClient?: "claude-code" | "claude-desktop" | "cursor" | "vscode" | "windsurf" | undefined;
    dryRun?: boolean | undefined;
}>;
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
export declare const MCP_REGISTRY: MCPRegistryEntry[];
/**
 * Get MCP registry entry by slug.
 */
export declare function getMCPRegistryEntry(slug: string): MCPRegistryEntry | undefined;
/**
 * Get all env vars required by a list of MCPs.
 */
export declare function getRequiredEnvVars(mcpSlugs: string[]): MCPEnvVar[];
//# sourceMappingURL=installation-types.d.ts.map