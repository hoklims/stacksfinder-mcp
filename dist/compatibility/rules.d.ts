/**
 * MCP Compatibility Rules
 *
 * 30 initial rules covering common conflicts, redundancies, and synergies.
 * Rules are ordered alphabetically by pair key (mcpA < mcpB).
 */
import type { CompatibilityRule } from './types.js';
/**
 * All compatibility rules.
 * Each rule has mcpA < mcpB (alphabetically) for consistent indexing.
 */
export declare const COMPATIBILITY_RULES: CompatibilityRule[];
/**
 * Get all rules (for initialization)
 */
export declare function getAllRules(): CompatibilityRule[];
/**
 * Get rules by category
 */
export declare function getRulesByCategory(category: string): CompatibilityRule[];
/**
 * Get rules by status
 */
export declare function getRulesByStatus(status: string): CompatibilityRule[];
/**
 * List of curated popular MCPs for the matrix UI
 */
export declare const CURATED_MCPS: string[];
//# sourceMappingURL=rules.d.ts.map