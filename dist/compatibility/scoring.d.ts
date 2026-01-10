/**
 * MCP Compatibility Scoring
 *
 * Health score calculation based on conflicts, redundancies, and synergies.
 */
import type { CompatibilityReport, Grade, MatchedRule } from './types.js';
import type { CompatibilityRule } from './types.js';
/**
 * Calculate the health score from matched rules.
 *
 * Formula:
 * - Base: 100
 * - -40 per conflict (critical)
 * - -20 per conflict (warning)
 * - -10 per redundant (warning)
 * - -5 per redundant (info)
 * - +5 per synergy (cap +15)
 * - Clamp 0..100
 *
 * @param conflicts - Array of conflict rules
 * @param redundancies - Array of redundancy rules
 * @param synergies - Array of synergy rules
 * @returns Score between 0 and 100
 */
export declare function calculateHealthScore(conflicts: MatchedRule[], redundancies: MatchedRule[], synergies: MatchedRule[]): number;
/**
 * Get grade from score.
 *
 * - A: 90-100
 * - B: 75-89
 * - C: 55-74
 * - D: < 55
 */
export declare function getGrade(score: number): Grade;
/**
 * Generate a full compatibility report for a set of MCPs.
 *
 * @param mcps - Array of MCP IDs to analyze
 * @param allRules - All compatibility rules (for suggestions)
 * @returns Full compatibility report
 */
export declare function generateReport(mcps: string[], allRules: CompatibilityRule[]): CompatibilityReport;
/**
 * Format a compatibility report as Markdown.
 *
 * @param report - The compatibility report to format
 * @returns Markdown string
 */
export declare function formatReportAsMarkdown(report: CompatibilityReport): string;
/**
 * Get a short summary line for the report.
 */
export declare function getReportSummaryLine(report: CompatibilityReport): string;
//# sourceMappingURL=scoring.d.ts.map