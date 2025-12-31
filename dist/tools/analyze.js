import { z } from 'zod';
import { CONTEXTS, DATA_VERSION, DIMENSION_LABELS, SCORE_DIMENSIONS, calculateOverallScore, findCompatibleTechs, getAllTechIds, getScores, getTechnology, scoreToGrade, techExists } from '../data/index.js';
import { techNotFoundError } from '../utils/errors.js';
/**
 * Input schema for analyze_tech tool.
 */
export const AnalyzeTechInputSchema = z.object({
    technology: z.string().min(1).describe('Technology ID to analyze (e.g., "nextjs", "postgres")'),
    context: z.enum(CONTEXTS).optional().default('default').describe('Context for score lookup')
});
/**
 * Tool definition for MCP registration.
 */
export const analyzeTechToolDefinition = {
    name: 'analyze_tech',
    description: 'Detailed analysis of a technology with 6-dimension scores, strengths, weaknesses, and compatible technologies.',
    inputSchema: {
        type: 'object',
        properties: {
            technology: {
                type: 'string',
                description: 'Technology ID (e.g., "nextjs", "postgres", "drizzle")'
            },
            context: {
                type: 'string',
                enum: CONTEXTS,
                description: 'Context for scoring (default, mvp, enterprise)'
            }
        },
        required: ['technology']
    }
};
/**
 * Identify strengths (top scores) and weaknesses (low scores).
 */
function analyzeStrengthsWeaknesses(scores) {
    const sorted = SCORE_DIMENSIONS.map((dim) => ({
        dim: DIMENSION_LABELS[dim],
        dimKey: dim,
        score: scores[dim]
    })).sort((a, b) => b.score - a.score);
    // Top 2 as strengths (if score >= 85)
    const strengths = sorted.filter((s) => s.score >= 85).slice(0, 2);
    // Bottom 2 as weaknesses (if score < 80)
    const weaknesses = sorted
        .reverse()
        .filter((s) => s.score < 80)
        .slice(0, 2);
    return {
        strengths: strengths.map((s) => ({ dim: s.dim, score: s.score })),
        weaknesses: weaknesses.map((s) => ({ dim: s.dim, score: s.score }))
    };
}
/**
 * Execute analyze_tech tool.
 */
export function executeAnalyzeTech(input) {
    const { technology, context = 'default' } = input;
    // Check if technology exists
    if (!techExists(technology)) {
        const error = techNotFoundError(technology, getAllTechIds());
        return { text: error.toResponseText(), isError: true };
    }
    const tech = getTechnology(technology);
    const scores = getScores(technology, context);
    const overallScore = calculateOverallScore(scores);
    const grade = scoreToGrade(overallScore);
    // Get strengths and weaknesses
    const { strengths, weaknesses } = analyzeStrengthsWeaknesses(scores);
    // Get compatible technologies
    const compatible = findCompatibleTechs(technology);
    // Build response
    let text = `## ${tech.name} Analysis (context: ${context})

**Category**: ${tech.category}
**Overall Score**: ${overallScore}/100 (${grade})
**URL**: ${tech.url}

### Scores by Dimension
| Dimension | Score | Grade |
|-----------|-------|-------|
`;
    for (const dim of SCORE_DIMENSIONS) {
        const score = scores[dim];
        text += `| ${DIMENSION_LABELS[dim]} | ${score} | ${scoreToGrade(score)} |\n`;
    }
    // Strengths
    if (strengths.length > 0) {
        text += '\n### Strengths\n';
        for (const s of strengths) {
            text += `- **${s.dim}** (${s.score}/100)\n`;
        }
    }
    // Weaknesses
    if (weaknesses.length > 0) {
        text += '\n### Weaknesses\n';
        for (const w of weaknesses) {
            text += `- ${w.dim} (${w.score}/100)\n`;
        }
    }
    // Compatible technologies
    if (compatible.length > 0) {
        text += '\n### Compatible Technologies (top 8)\n';
        const compatList = compatible.map((c) => `${c.id} (${c.score})`).join(', ');
        text += `${compatList}\n`;
    }
    text += `\nData version: ${DATA_VERSION}`;
    return { text };
}
//# sourceMappingURL=analyze.js.map