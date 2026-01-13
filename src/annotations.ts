/**
 * MCP Tool Annotations
 *
 * These annotations help MCP clients (VS Code, Cursor, etc.) understand
 * the behavior of each tool and make informed decisions about enabling them.
 *
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools
 */

import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool behavior hints:
 * - readOnlyHint: true = tool doesn't modify anything (safe)
 * - destructiveHint: true = tool can delete/destroy data
 * - idempotentHint: true = calling multiple times = same result
 * - openWorldHint: true = interacts with external APIs/services
 */

// ============================================================================
// LOCAL TOOLS (no API calls, fully offline)
// ============================================================================

/** List technologies - local lookup, read-only */
export const listTechnologiesAnnotations: ToolAnnotations = {
	title: 'List Technologies',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

/** Analyze technology - local scoring, read-only */
export const analyzeTechAnnotations: ToolAnnotations = {
	title: 'Analyze Technology',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

/** Compare technologies - local scoring, read-only */
export const compareTechsAnnotations: ToolAnnotations = {
	title: 'Compare Technologies',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

/** Recommend stack demo - local scoring with rate limit, read-only */
export const recommendStackDemoAnnotations: ToolAnnotations = {
	title: 'Recommend Stack (Demo)',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

/** Generate MCP kit - local analysis, read-only */
export const generateMcpKitAnnotations: ToolAnnotations = {
	title: 'Generate MCP Kit',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

/** Check MCP compatibility - local rule checking, read-only */
export const checkCompatibilityAnnotations: ToolAnnotations = {
	title: 'Check MCP Compatibility',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

// ============================================================================
// LOCAL TOOLS WITH FILE SYSTEM ACCESS
// ============================================================================

/** Analyze repo MCPs - reads local files, no modifications */
export const analyzeRepoMcpsAnnotations: ToolAnnotations = {
	title: 'Analyze Repository MCPs',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

/** Prepare MCP installation - creates .env-mcp file */
export const prepareMcpInstallationAnnotations: ToolAnnotations = {
	title: 'Prepare MCP Installation',
	readOnlyHint: false, // Creates files
	destructiveHint: false, // Doesn't delete anything
	idempotentHint: true, // Same input = same file
	openWorldHint: false
};

/** Execute MCP installation - generates commands only, no execution */
export const executeMcpInstallationAnnotations: ToolAnnotations = {
	title: 'Execute MCP Installation',
	readOnlyHint: true, // Only generates commands, doesn't execute
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false
};

// ============================================================================
// API-BASED TOOLS (require network access)
// ============================================================================

/** Recommend stack - calls StacksFinder API */
export const recommendStackAnnotations: ToolAnnotations = {
	title: 'Recommend Stack',
	readOnlyHint: true, // API is read-only
	destructiveHint: false,
	idempotentHint: true, // Same request = same response
	openWorldHint: true // External API call
};

/** Get blueprint - fetches from API */
export const getBlueprintAnnotations: ToolAnnotations = {
	title: 'Get Blueprint',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};

/** Create blueprint - creates resource via API */
export const createBlueprintAnnotations: ToolAnnotations = {
	title: 'Create Blueprint',
	readOnlyHint: false, // Creates a resource
	destructiveHint: false,
	idempotentHint: false, // Creates new resource each time
	openWorldHint: true
};

/** Setup API key - authenticates and creates key */
export const setupApiKeyAnnotations: ToolAnnotations = {
	title: 'Setup API Key',
	readOnlyHint: false, // Creates API key
	destructiveHint: false,
	idempotentHint: false, // Creates new key each time
	openWorldHint: true
};

/** List API keys - fetches from API */
export const listApiKeysAnnotations: ToolAnnotations = {
	title: 'List API Keys',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};

/** Revoke API key - deletes resource */
export const revokeApiKeyAnnotations: ToolAnnotations = {
	title: 'Revoke API Key',
	readOnlyHint: false,
	destructiveHint: true, // Permanently revokes key
	idempotentHint: true, // Revoking twice = same result
	openWorldHint: true
};

// ============================================================================
// AUDIT TOOLS (API-based)
// ============================================================================

/** Create audit - creates resource */
export const createAuditAnnotations: ToolAnnotations = {
	title: 'Create Technical Debt Audit',
	readOnlyHint: false,
	destructiveHint: false,
	idempotentHint: false, // Creates new audit each time
	openWorldHint: true
};

/** Get audit - fetches from API */
export const getAuditAnnotations: ToolAnnotations = {
	title: 'Get Audit Report',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};

/** List audits - fetches from API */
export const listAuditsAnnotations: ToolAnnotations = {
	title: 'List Audit Reports',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};

/** Compare audits - fetches and compares */
export const compareAuditsAnnotations: ToolAnnotations = {
	title: 'Compare Audit Reports',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};

/** Get audit quota - fetches from API */
export const getAuditQuotaAnnotations: ToolAnnotations = {
	title: 'Get Audit Quota',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};

/** Get migration recommendation - analyzes audit */
export const getMigrationRecommendationAnnotations: ToolAnnotations = {
	title: 'Get Migration Recommendation',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};

// ============================================================================
// ESTIMATOR TOOLS (API-based, LLM + Perplexity)
// ============================================================================

/** Estimate project - creates estimate via LLM + optional market analysis */
export const estimateProjectAnnotations: ToolAnnotations = {
	title: 'Estimate Project',
	readOnlyHint: false, // Creates estimate, consumes quota
	destructiveHint: false,
	idempotentHint: false, // LLM responses can vary
	openWorldHint: true // Calls Claude + optional Perplexity
};

/** Get estimate quota - fetches quota status */
export const getEstimateQuotaAnnotations: ToolAnnotations = {
	title: 'Get Estimate Quota',
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: true
};
