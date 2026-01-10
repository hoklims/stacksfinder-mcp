/**
 * @stacksfinder/mcp-compatibility (bundled)
 *
 * MCP compatibility matrix - detect conflicts, redundancies, and synergies between MCP servers.
 */
export { MCP_CATEGORIES } from './types.js';
// Utils
export { MCP_ALIASES, canonicalizeMcpId, pairKey, initRulesIndex, getRulesIndex, findRule, generatePairs, checkAllPairs, getSuggestions, } from './utils.js';
// Rules
export { COMPATIBILITY_RULES, getAllRules, getRulesByCategory, getRulesByStatus, CURATED_MCPS, } from './rules.js';
// Scoring
export { calculateHealthScore, getGrade, generateReport, formatReportAsMarkdown, getReportSummaryLine, } from './scoring.js';
//# sourceMappingURL=index.js.map