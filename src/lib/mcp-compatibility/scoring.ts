/**
 * MCP Compatibility Scoring
 *
 * Health score calculation based on conflicts, redundancies, and synergies.
 */

import type {
  CompatibilityReport,
  CompatibilitySummary,
  Grade,
  MatchedRule,
  Suggestion,
} from './types.js';
import { checkAllPairs, getSuggestions, canonicalizeMcpId } from './utils.js';
import type { CompatibilityRule } from './types.js';

/**
 * Scoring constants
 */
const SCORE_PENALTIES = {
  conflict_critical: -40,
  conflict_warning: -20,
  redundant_warning: -10,
  redundant_info: -5,
} as const;

const SCORE_BONUSES = {
  synergy: 5,
  synergy_cap: 15,
} as const;

/**
 * Grade thresholds
 */
const GRADE_THRESHOLDS = {
  A: 90,
  B: 75,
  C: 55,
} as const;

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
export function calculateHealthScore(
  conflicts: MatchedRule[],
  redundancies: MatchedRule[],
  synergies: MatchedRule[]
): number {
  let score = 100;

  // Apply conflict penalties
  for (const matched of conflicts) {
    if (matched.rule.severity === 'critical') {
      score += SCORE_PENALTIES.conflict_critical;
    } else if (matched.rule.severity === 'warning') {
      score += SCORE_PENALTIES.conflict_warning;
    }
  }

  // Apply redundancy penalties
  for (const matched of redundancies) {
    if (matched.rule.severity === 'warning') {
      score += SCORE_PENALTIES.redundant_warning;
    } else if (matched.rule.severity === 'info') {
      score += SCORE_PENALTIES.redundant_info;
    }
  }

  // Apply synergy bonuses (capped)
  const synergyBonus = Math.min(
    synergies.length * SCORE_BONUSES.synergy,
    SCORE_BONUSES.synergy_cap
  );
  score += synergyBonus;

  // Clamp to 0..100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get grade from score.
 *
 * - A: 90-100
 * - B: 75-89
 * - C: 55-74
 * - D: < 55
 */
export function getGrade(score: number): Grade {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  return 'D';
}

/**
 * Generate a full compatibility report for a set of MCPs.
 *
 * @param mcps - Array of MCP IDs to analyze
 * @param allRules - All compatibility rules (for suggestions)
 * @returns Full compatibility report
 */
export function generateReport(
  mcps: string[],
  allRules: CompatibilityRule[]
): CompatibilityReport {
  // Check all pairs
  const { conflicts, redundancies, synergies } = checkAllPairs(mcps);

  // Calculate score and grade
  const score = calculateHealthScore(conflicts, redundancies, synergies);
  const grade = getGrade(score);

  // Get suggestions based on synergies
  const suggestions: Suggestion[] = getSuggestions(mcps, allRules);

  // Build summary
  const summary: CompatibilitySummary = {
    total: mcps.length,
    conflicts: conflicts.length,
    redundancies: redundancies.length,
    synergies: synergies.length,
    score,
    grade,
  };

  // Get canonical IDs for analyzed MCPs
  const analyzedMcps = [...new Set(mcps.map(canonicalizeMcpId))];

  return {
    summary,
    conflicts,
    redundancies,
    synergies,
    suggestions,
    analyzedMcps,
  };
}

/**
 * Format a compatibility report as Markdown.
 *
 * @param report - The compatibility report to format
 * @returns Markdown string
 */
export function formatReportAsMarkdown(report: CompatibilityReport): string {
  const lines: string[] = [];

  // Header
  lines.push('## MCP Compatibility Report\n');
  lines.push(`**Health Score: ${report.summary.score}/100 (Grade ${report.summary.grade})**\n`);

  // Summary table
  lines.push('### Summary');
  lines.push('| Metric | Count |');
  lines.push('|--------|-------|');
  lines.push(`| MCPs Analyzed | ${report.summary.total} |`);
  lines.push(`| 🔴 Conflicts | ${report.summary.conflicts} |`);
  lines.push(`| 🟡 Redundancies | ${report.summary.redundancies} |`);
  lines.push(`| 🟢 Synergies | ${report.summary.synergies} |`);
  lines.push('');

  // Conflicts
  if (report.conflicts.length > 0) {
    lines.push('### 🔴 Conflicts');
    for (const matched of report.conflicts) {
      const { rule, inputA, inputB } = matched;
      lines.push(`\n**${inputA} ⚡ ${inputB}** (${rule.severity})`);
      lines.push(`- Category: ${rule.category}`);
      lines.push(`- Reason: ${rule.reason}`);
      if (rule.solution) {
        lines.push(`- Solution: ${rule.solution}`);
      }
    }
    lines.push('');
  }

  // Redundancies
  if (report.redundancies.length > 0) {
    lines.push('### 🟡 Redundancies');
    for (const matched of report.redundancies) {
      const { rule, inputA, inputB } = matched;
      lines.push(`\n**${inputA} ↔ ${inputB}** (${rule.severity})`);
      lines.push(`- Category: ${rule.category}`);
      lines.push(`- Reason: ${rule.reason}`);
      if (rule.solution) {
        lines.push(`- Solution: ${rule.solution}`);
      }
    }
    lines.push('');
  }

  // Synergies
  if (report.synergies.length > 0) {
    lines.push('### 🟢 Synergies');
    for (const matched of report.synergies) {
      const { rule, inputA, inputB } = matched;
      lines.push(`\n**${inputA} + ${inputB}**`);
      lines.push(`- ${rule.reason}`);
    }
    lines.push('');
  }

  // Suggestions
  if (report.suggestions.length > 0) {
    lines.push('### 💡 Suggestions');
    for (const suggestion of report.suggestions) {
      lines.push(`- Consider adding \`${suggestion.mcp}\` - ${suggestion.reason} (pairs with ${suggestion.basedOn})`);
    }
    lines.push('');
  }

  // No issues
  if (
    report.conflicts.length === 0 &&
    report.redundancies.length === 0 &&
    report.synergies.length === 0
  ) {
    lines.push('\n✅ No compatibility issues found between the analyzed MCPs.');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get a short summary line for the report.
 */
export function getReportSummaryLine(report: CompatibilityReport): string {
  const { summary } = report;
  const issues = summary.conflicts + summary.redundancies;

  if (issues === 0) {
    return `✅ All ${summary.total} MCPs are compatible (Score: ${summary.score}/100)`;
  }

  return `⚠️ Found ${summary.conflicts} conflicts, ${summary.redundancies} redundancies among ${summary.total} MCPs (Score: ${summary.score}/100, Grade ${summary.grade})`;
}
