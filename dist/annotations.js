/**
 * MCP Tool Annotations
 *
 * These annotations help MCP clients (VS Code, Cursor, etc.) understand
 * the behavior of each tool and make informed decisions about enabling them.
 *
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools
 */
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
export const listTechnologiesAnnotations = {
    title: 'List Technologies',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
};
/** Analyze technology - local scoring, read-only */
export const analyzeTechAnnotations = {
    title: 'Analyze Technology',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
};
/** Compare technologies - local scoring, read-only */
export const compareTechsAnnotations = {
    title: 'Compare Technologies',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
};
/** Recommend stack demo - local scoring with rate limit, read-only */
export const recommendStackDemoAnnotations = {
    title: 'Recommend Stack (Demo)',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
};
/** Generate MCP kit - local analysis, read-only */
export const generateMcpKitAnnotations = {
    title: 'Generate MCP Kit',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
};
/** Check MCP compatibility - local rule checking, read-only */
export const checkCompatibilityAnnotations = {
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
export const analyzeRepoMcpsAnnotations = {
    title: 'Analyze Repository MCPs',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
};
/** Prepare MCP installation - creates .env-mcp file */
export const prepareMcpInstallationAnnotations = {
    title: 'Prepare MCP Installation',
    readOnlyHint: false, // Creates files
    destructiveHint: false, // Doesn't delete anything
    idempotentHint: true, // Same input = same file
    openWorldHint: false
};
/** Execute MCP installation - generates commands only, no execution */
export const executeMcpInstallationAnnotations = {
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
export const recommendStackAnnotations = {
    title: 'Recommend Stack',
    readOnlyHint: true, // API is read-only
    destructiveHint: false,
    idempotentHint: true, // Same request = same response
    openWorldHint: true // External API call
};
/** Get blueprint - fetches from API */
export const getBlueprintAnnotations = {
    title: 'Get Blueprint',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
/** Create blueprint - creates resource via API */
export const createBlueprintAnnotations = {
    title: 'Create Blueprint',
    readOnlyHint: false, // Creates a resource
    destructiveHint: false,
    idempotentHint: false, // Creates new resource each time
    openWorldHint: true
};
/** Setup API key - authenticates and creates key */
export const setupApiKeyAnnotations = {
    title: 'Setup API Key',
    readOnlyHint: false, // Creates API key
    destructiveHint: false,
    idempotentHint: false, // Creates new key each time
    openWorldHint: true
};
/** List API keys - fetches from API */
export const listApiKeysAnnotations = {
    title: 'List API Keys',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
/** Revoke API key - deletes resource */
export const revokeApiKeyAnnotations = {
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
export const createAuditAnnotations = {
    title: 'Create Technical Debt Audit',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false, // Creates new audit each time
    openWorldHint: true
};
/** Get audit - fetches from API */
export const getAuditAnnotations = {
    title: 'Get Audit Report',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
/** List audits - fetches from API */
export const listAuditsAnnotations = {
    title: 'List Audit Reports',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
/** Compare audits - fetches and compares */
export const compareAuditsAnnotations = {
    title: 'Compare Audit Reports',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
/** Get audit quota - fetches from API */
export const getAuditQuotaAnnotations = {
    title: 'Get Audit Quota',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
/** Get migration recommendation - analyzes audit */
export const getMigrationRecommendationAnnotations = {
    title: 'Get Migration Recommendation',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
//# sourceMappingURL=annotations.js.map