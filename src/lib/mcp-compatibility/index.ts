/**
 * @stacksfinder/mcp-compatibility
 *
 * MCP compatibility matrix - detect conflicts, redundancies, and synergies between MCP servers.
 *
 * @example
 * ```typescript
 * import {
 *   generateReport,
 *   formatReportAsMarkdown,
 *   initRulesIndex,
 *   getAllRules,
 * } from '@stacksfinder/mcp-compatibility';
 *
 * // Initialize the rules index
 * initRulesIndex(getAllRules());
 *
 * // Generate a report
 * const report = generateReport(
 *   ['supabase-mcp', 'neon-mcp', 'prisma-mcp'],
 *   getAllRules()
 * );
 *
 * // Format as markdown
 * const markdown = formatReportAsMarkdown(report);
 * ```
 */

// Types
export type {
  MCPCategory,
  CompatibilityStatus,
  Severity,
  CompatibilityRule,
  MatchedRule,
  Suggestion,
  Grade,
  CompatibilitySummary,
  CompatibilityReport,
  CompatibilityToolOutput,
  RecommendationConflict,
  ExcludedRecommendation,
  AnalyzeRepoCompatibility,
} from './types.js';

export { MCP_CATEGORIES } from './types.js';

// Utils
export {
  MCP_ALIASES,
  canonicalizeMcpId,
  pairKey,
  initRulesIndex,
  getRulesIndex,
  findRule,
  generatePairs,
  checkAllPairs,
  getSuggestions,
} from './utils.js';

// Rules
export {
  COMPATIBILITY_RULES,
  getAllRules,
  getRulesByCategory,
  getRulesByStatus,
  CURATED_MCPS,
} from './rules.js';

// Scoring
export {
  calculateHealthScore,
  getGrade,
  generateReport,
  formatReportAsMarkdown,
  getReportSummaryLine,
} from './scoring.js';
