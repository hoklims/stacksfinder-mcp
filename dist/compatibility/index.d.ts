/**
 * @stacksfinder/mcp-compatibility (bundled)
 *
 * MCP compatibility matrix - detect conflicts, redundancies, and synergies between MCP servers.
 */
export type { MCPCategory, CompatibilityStatus, Severity, CompatibilityRule, MatchedRule, Suggestion, Grade, CompatibilitySummary, CompatibilityReport, CompatibilityToolOutput, RecommendationConflict, ExcludedRecommendation, AnalyzeRepoCompatibility, } from './types.js';
export { MCP_CATEGORIES } from './types.js';
export { MCP_ALIASES, canonicalizeMcpId, pairKey, initRulesIndex, getRulesIndex, findRule, generatePairs, checkAllPairs, getSuggestions, } from './utils.js';
export { COMPATIBILITY_RULES, getAllRules, getRulesByCategory, getRulesByStatus, CURATED_MCPS, } from './rules.js';
export { calculateHealthScore, getGrade, generateReport, formatReportAsMarkdown, getReportSummaryLine, } from './scoring.js';
//# sourceMappingURL=index.d.ts.map