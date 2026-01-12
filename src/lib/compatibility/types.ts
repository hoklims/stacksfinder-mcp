/**
 * MCP Compatibility Types
 *
 * Single source of truth for compatibility matrix types.
 * Used by both the MCP server and web application.
 */

/**
 * MCP category types - typed enum for validation
 */
export const MCP_CATEGORIES = [
  'database',
  'orm',
  'auth',
  'payments',
  'deployment',
  'monitoring',
  'email',
  'storage',
  'ai',
  'version-control',
  'communication',
  'testing',
  'documentation',
  'general',
] as const;

export type MCPCategory = (typeof MCP_CATEGORIES)[number];

/**
 * Compatibility status between two MCPs
 */
export type CompatibilityStatus =
  | 'compatible' // No issues, can be used together
  | 'conflict' // Should not be used together
  | 'redundant' // Overlapping functionality
  | 'synergy' // Work well together
  | 'conditional'; // Works with specific configuration

/**
 * Severity levels for compatibility issues
 */
export type Severity = 'critical' | 'warning' | 'info';

/**
 * A single compatibility rule between two MCPs
 */
export interface CompatibilityRule {
  /** Unique rule identifier (e.g., 'db-001', 'orm-002') */
  id: string;

  /**
   * First MCP in the pair (canonical ID).
   * Must be alphabetically less than mcpB after canonicalization.
   */
  mcpA: string;

  /**
   * Second MCP in the pair (canonical ID).
   * Must be alphabetically greater than mcpA after canonicalization.
   */
  mcpB: string;

  /** Compatibility status */
  status: CompatibilityStatus;

  /** Category this rule belongs to */
  category: MCPCategory;

  /** Severity of the issue (for conflicts/redundancies) */
  severity: Severity;

  /** Human-readable explanation */
  reason: string;

  /** Suggested solution for conflicts/redundancies */
  solution?: string;

  /**
   * Which MCP is recommended when there's a conflict/redundancy
   * - 'A': Recommend mcpA
   * - 'B': Recommend mcpB
   * - 'either': Both are fine, pick one
   * - 'both': Keep both (for synergies or conditional)
   */
  recommendation?: 'A' | 'B' | 'either' | 'both';

  /**
   * For synergy rules: suggest these MCPs if the synergy partner is missing.
   * E.g., if user has stripe-mcp, suggest resend-mcp
   */
  suggestWhenMissing?: string[];
}

/**
 * A rule matched against user's MCPs
 */
export interface MatchedRule {
  /** The compatibility rule that was matched */
  rule: CompatibilityRule;

  /** The actual MCP ID from user input (before canonicalization) */
  inputA: string;

  /** The actual MCP ID from user input (before canonicalization) */
  inputB: string;
}

/**
 * A suggestion based on synergy rules
 */
export interface Suggestion {
  /** MCP to suggest */
  mcp: string;

  /** Why it's suggested */
  reason: string;

  /** Which installed MCP triggered this suggestion */
  basedOn: string;
}

/**
 * Grade based on health score
 */
export type Grade = 'A' | 'B' | 'C' | 'D';

/**
 * Summary statistics for a compatibility report
 */
export interface CompatibilitySummary {
  /** Total MCPs analyzed */
  total: number;

  /** Number of conflicts found */
  conflicts: number;

  /** Number of redundancies found */
  redundancies: number;

  /** Number of synergies found */
  synergies: number;

  /**
   * Health score (0-100)
   * Formula:
   * - Base: 100
   * - -40 per conflict (critical)
   * - -20 per conflict (warning)
   * - -10 per redundant (warning)
   * - -5 per redundant (info)
   * - +5 per synergy (cap +15)
   * - Clamp 0..100
   */
  score: number;

  /**
   * Grade based on score
   * - A: 90-100
   * - B: 75-89
   * - C: 55-74
   * - D: < 55
   */
  grade: Grade;
}

/**
 * Full compatibility report
 */
export interface CompatibilityReport {
  /** Summary statistics */
  summary: CompatibilitySummary;

  /** All conflicts found */
  conflicts: MatchedRule[];

  /** All redundancies found */
  redundancies: MatchedRule[];

  /** All synergies found */
  synergies: MatchedRule[];

  /** Suggestions based on synergies */
  suggestions: Suggestion[];

  /** MCPs that were analyzed (canonical IDs) */
  analyzedMcps: string[];
}

/**
 * Output format for MCP tool
 */
export interface CompatibilityToolOutput {
  /** Markdown-formatted report for display */
  text: string;

  /** Structured data for programmatic use */
  data: CompatibilityReport;

  /** Whether an error occurred */
  isError: boolean;
}

/**
 * Conflict found between a recommendation and installed MCPs
 */
export interface RecommendationConflict {
  /** The recommended MCP that conflicts */
  recommended: string;

  /** The installed MCP it conflicts with */
  conflictsWith: string;

  /** The rule that was matched */
  rule: CompatibilityRule;
}

/**
 * Excluded recommendation with reason
 */
export interface ExcludedRecommendation {
  /** The MCP that was excluded */
  mcp: string;

  /** Why it was excluded */
  excludedBecause: string;
}

/**
 * Enhanced output for analyze_repo_mcps integration
 */
export interface AnalyzeRepoCompatibility {
  /** Report for currently installed MCPs */
  installedReport: CompatibilityReport;

  /** Conflicts between recommendations and installed MCPs */
  recommendationConflicts: RecommendationConflict[];
}
