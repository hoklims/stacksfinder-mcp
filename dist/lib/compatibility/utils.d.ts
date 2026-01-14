/**
 * MCP Compatibility Utilities
 *
 * Canonical matching utilities for consistent MCP identification.
 */
import type { CompatibilityRule, MatchedRule } from './types.js';
/**
 * Aliases map for common MCP name variations.
 * Keys are normalized (lowercase, trimmed), values are canonical IDs.
 */
export declare const MCP_ALIASES: Record<string, string>;
/**
 * Canonicalize an MCP ID to a consistent format.
 *
 * @param id - The MCP ID to canonicalize (e.g., "supabase", "@supabase/mcp")
 * @returns The canonical ID (e.g., "supabase-mcp")
 */
export declare function canonicalizeMcpId(id: string): string;
/**
 * Generate a consistent pair key for two MCPs.
 * The key is ordered alphabetically to ensure A/B and B/A produce the same key.
 *
 * @param a - First MCP ID
 * @param b - Second MCP ID
 * @returns Pair key in format "mcpA::mcpB" (alphabetically ordered)
 */
export declare function pairKey(a: string, b: string): string;
/**
 * Initialize the rules index from an array of rules.
 * Must be called before using findRule().
 *
 * @param rules - Array of compatibility rules
 */
export declare function initRulesIndex(rules: CompatibilityRule[]): void;
/**
 * Get the rules index (for testing).
 */
export declare function getRulesIndex(): Map<string, CompatibilityRule>;
/**
 * Find a compatibility rule for two MCPs.
 * Order doesn't matter: findRule(A, B) === findRule(B, A)
 *
 * @param a - First MCP ID (can be any alias)
 * @param b - Second MCP ID (can be any alias)
 * @returns The matching rule, or undefined if no rule exists
 */
export declare function findRule(a: string, b: string): CompatibilityRule | undefined;
/**
 * Generate all unique pairs from an array of MCPs.
 * Used to check all nC2 combinations.
 *
 * @param mcps - Array of MCP IDs
 * @returns Array of [mcpA, mcpB] pairs
 */
export declare function generatePairs(mcps: string[]): [string, string][];
/**
 * Check all pairs of MCPs for compatibility issues.
 *
 * @param mcps - Array of MCP IDs to check
 * @returns Object with categorized matched rules
 */
export declare function checkAllPairs(mcps: string[]): {
    conflicts: MatchedRule[];
    redundancies: MatchedRule[];
    synergies: MatchedRule[];
    conditionals: MatchedRule[];
};
/**
 * Get suggestions based on synergy rules.
 * If user has MCP A and rule says A+B is a synergy,
 * suggest B if user doesn't have it.
 *
 * @param mcps - Array of installed MCP IDs
 * @param allRules - All compatibility rules
 * @returns Array of suggestions
 */
export declare function getSuggestions(mcps: string[], allRules: CompatibilityRule[]): {
    mcp: string;
    reason: string;
    basedOn: string;
}[];
//# sourceMappingURL=utils.d.ts.map