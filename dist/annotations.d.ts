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
/** List technologies - local lookup, read-only */
export declare const listTechnologiesAnnotations: ToolAnnotations;
/** Analyze technology - local scoring, read-only */
export declare const analyzeTechAnnotations: ToolAnnotations;
/** Compare technologies - local scoring, read-only */
export declare const compareTechsAnnotations: ToolAnnotations;
/** Recommend stack demo - local scoring with rate limit, read-only */
export declare const recommendStackDemoAnnotations: ToolAnnotations;
/** Generate MCP kit - local analysis, read-only */
export declare const generateMcpKitAnnotations: ToolAnnotations;
/** Check MCP compatibility - local rule checking, read-only */
export declare const checkCompatibilityAnnotations: ToolAnnotations;
/** Analyze repo MCPs - reads local files, no modifications */
export declare const analyzeRepoMcpsAnnotations: ToolAnnotations;
/** Prepare MCP installation - creates .env-mcp file */
export declare const prepareMcpInstallationAnnotations: ToolAnnotations;
/** Execute MCP installation - generates commands only, no execution */
export declare const executeMcpInstallationAnnotations: ToolAnnotations;
/** Recommend stack - calls StacksFinder API */
export declare const recommendStackAnnotations: ToolAnnotations;
/** Get blueprint - fetches from API */
export declare const getBlueprintAnnotations: ToolAnnotations;
/** Create blueprint - creates resource via API */
export declare const createBlueprintAnnotations: ToolAnnotations;
/** Setup API key - authenticates and creates key */
export declare const setupApiKeyAnnotations: ToolAnnotations;
/** List API keys - fetches from API */
export declare const listApiKeysAnnotations: ToolAnnotations;
/** Revoke API key - deletes resource */
export declare const revokeApiKeyAnnotations: ToolAnnotations;
/** Create audit - creates resource */
export declare const createAuditAnnotations: ToolAnnotations;
/** Get audit - fetches from API */
export declare const getAuditAnnotations: ToolAnnotations;
/** List audits - fetches from API */
export declare const listAuditsAnnotations: ToolAnnotations;
/** Compare audits - fetches and compares */
export declare const compareAuditsAnnotations: ToolAnnotations;
/** Get audit quota - fetches from API */
export declare const getAuditQuotaAnnotations: ToolAnnotations;
/** Get migration recommendation - analyzes audit */
export declare const getMigrationRecommendationAnnotations: ToolAnnotations;
//# sourceMappingURL=annotations.d.ts.map