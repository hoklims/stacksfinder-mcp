import { z } from 'zod';
import { CONTEXTS, DATA_VERSION, DIMENSION_LABELS, SCORE_DIMENSIONS, calculateOverallScore, getAllTechIds, getCompatibility, getCompatibilityVerdict, getScores, getTechnology, scoreToGrade, techExists } from '../data/index.js';
import { McpError, ErrorCode, techNotFoundError } from '../utils/errors.js';
/**
 * Input schema for compare_techs tool.
 */
export const CompareTechsInputSchema = z.object({
    technologies: z
        .array(z.string().min(1))
        .min(2)
        .max(4)
        .describe('Technology IDs to compare (2-4 technologies)'),
    context: z.enum(CONTEXTS).optional().default('default').describe('Context for score lookup')
});
/**
 * Tool definition for MCP registration.
 */
export const compareTechsToolDefinition = {
    name: 'compare_techs',
    description: 'Side-by-side comparison of 2-4 technologies with per-dimension winners and compatibility matrix.',
    inputSchema: {
        type: 'object',
        properties: {
            technologies: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 4,
                description: 'Technology IDs to compare (e.g., ["nextjs", "sveltekit", "nuxt"])'
            },
            context: {
                type: 'string',
                enum: CONTEXTS,
                description: 'Context for scoring (default, mvp, enterprise)'
            }
        },
        required: ['technologies']
    }
};
/**
 * Determine winner for each dimension.
 */
function determineDimensionWinners(techs) {
    const winners = [];
    for (const dim of SCORE_DIMENSIONS) {
        const sorted = [...techs].sort((a, b) => b.scores[dim] - a.scores[dim]);
        const first = sorted[0];
        const second = sorted[1];
        const margin = first.scores[dim] - second.scores[dim];
        let winner;
        let notes;
        if (margin < 3) {
            // Tie if margin is less than 3
            winner = null;
            notes = 'Tie';
        }
        else if (margin < 10) {
            winner = first.name;
            notes = 'Close competition';
        }
        else {
            winner = first.name;
            notes = 'Clear winner';
        }
        winners.push({
            dimension: DIMENSION_LABELS[dim],
            winner,
            margin,
            notes
        });
    }
    return winners;
}
/**
 * Execute compare_techs tool.
 */
export function executeCompareTechs(input) {
    const { technologies, context = 'default' } = input;
    // Validate all technologies exist
    const allTechIds = getAllTechIds();
    const invalidTechs = [];
    for (const techId of technologies) {
        if (!techExists(techId)) {
            invalidTechs.push(techId);
        }
    }
    if (invalidTechs.length > 0) {
        const error = techNotFoundError(invalidTechs[0], allTechIds);
        return { text: error.toResponseText(), isError: true };
    }
    // Check for duplicates
    const uniqueTechs = [...new Set(technologies)];
    if (uniqueTechs.length !== technologies.length) {
        const error = new McpError(ErrorCode.INVALID_INPUT, 'Duplicate technologies in comparison list');
        return { text: error.toResponseText(), isError: true };
    }
    // Build comparison data
    const comparisons = technologies.map((techId) => {
        const tech = getTechnology(techId);
        const scores = getScores(techId, context);
        const overall = calculateOverallScore(scores);
        return {
            id: techId,
            name: tech.name,
            scores,
            overall,
            grade: scoreToGrade(overall)
        };
    });
    // Sort by overall score
    const sorted = [...comparisons].sort((a, b) => b.overall - a.overall);
    // Determine dimension winners
    const dimensionWinners = determineDimensionWinners(comparisons);
    // Build response
    const techNames = comparisons.map((t) => t.name).join(' vs ');
    let text = `## Comparison: ${techNames} (context: ${context})

### Overall Scores
| Technology | Score | Grade |
|------------|-------|-------|
`;
    for (const tech of sorted) {
        text += `| ${tech.name} | ${tech.overall} | ${tech.grade} |\n`;
    }
    // Per-dimension breakdown
    text += `
### Per-Dimension Winners
| Dimension | Winner | Margin | Notes |
|-----------|--------|--------|-------|
`;
    for (const w of dimensionWinners) {
        const winnerDisplay = w.winner ?? 'Tie';
        const marginDisplay = w.winner ? `+${w.margin}` : '-';
        text += `| ${w.dimension} | ${winnerDisplay} | ${marginDisplay} | ${w.notes} |\n`;
    }
    // Compatibility matrix (for all pairs)
    text += '\n### Compatibility Matrix\n| Pair | Score | Verdict |\n|------|-------|---------|\n';
    for (let i = 0; i < comparisons.length; i++) {
        for (let j = i + 1; j < comparisons.length; j++) {
            const a = comparisons[i];
            const b = comparisons[j];
            const score = getCompatibility(a.id, b.id);
            const verdict = getCompatibilityVerdict(score);
            text += `| ${a.id} ↔ ${b.id} | ${score} | ${verdict} |\n`;
        }
    }
    // Verdict
    const leader = sorted[0];
    const runnerUp = sorted[1];
    const overallMargin = leader.overall - runnerUp.overall;
    text += '\n';
    if (overallMargin < 3) {
        text += `**Verdict**: Close call between ${leader.name} and ${runnerUp.name}\n`;
        text += `**Recommendation**: Both are strong choices; consider your specific priorities.`;
    }
    else {
        text += `**Verdict**: ${leader.name} leads with ${leader.overall}/100\n`;
        // Find what leader is best at
        const leaderStrengths = dimensionWinners.filter((w) => w.winner === leader.name).map((w) => w.dimension);
        if (leaderStrengths.length > 0) {
            const strengthsText = leaderStrengths.slice(0, 2).join(' and ');
            text += `**Recommendation**: Consider ${leader.name} for ${strengthsText} priorities.`;
        }
    }
    text += `\n\nData version: ${DATA_VERSION}`;
    return { text };
}
//# sourceMappingURL=compare.js.map