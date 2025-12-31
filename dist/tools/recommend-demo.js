import { z } from 'zod';
import { DATA_VERSION, calculateOverallScore, getScores, getTechnologiesByCategory, scoreToGrade } from '../data/index.js';
import { wasDemoUsedToday, recordDemoUsage, getDeviceId } from '../utils/device-id.js';
import { debug } from '../utils/logger.js';
/**
 * Project types supported.
 */
const PROJECT_TYPES = [
    'web-app',
    'mobile-app',
    'api',
    'desktop',
    'cli',
    'library',
    'e-commerce',
    'saas',
    'marketplace'
];
/**
 * Scale options.
 */
const SCALES = ['mvp', 'startup', 'growth', 'enterprise'];
/**
 * Input schema for recommend_stack_demo tool.
 */
export const RecommendStackDemoInputSchema = z.object({
    projectType: z.enum(PROJECT_TYPES).describe('Type of project'),
    scale: z.enum(SCALES).optional().default('mvp').describe('Project scale')
});
/**
 * Tool definition for MCP registration.
 */
export const recommendStackDemoToolDefinition = {
    name: 'recommend_stack_demo',
    description: `Try StacksFinder's tech stack recommendations for FREE - once per day, no account required.

Returns the optimal technology for each category based on deterministic scoring.
For unlimited access, priorities, constraints, and AI-generated narratives, upgrade to Pro at https://stacksfinder.com/pricing`,
    inputSchema: {
        type: 'object',
        properties: {
            projectType: {
                type: 'string',
                enum: PROJECT_TYPES,
                description: 'Type of project (e.g., saas, web-app, api)'
            },
            scale: {
                type: 'string',
                enum: SCALES,
                description: 'Project scale (mvp, startup, growth, enterprise)'
            }
        },
        required: ['projectType']
    }
};
/**
 * Map scale to scoring context.
 */
function scaleToContext(scale) {
    if (scale === 'enterprise' || scale === 'growth')
        return 'enterprise';
    if (scale === 'mvp' || scale === 'startup')
        return 'mvp';
    return 'default';
}
/**
 * Category weights for different project types.
 * Higher weight = more important for this project type.
 */
const PROJECT_TYPE_WEIGHTS = {
    'web-app': { 'meta-framework': 1.2, frontend: 1.1, database: 1.0 },
    'saas': { 'meta-framework': 1.2, database: 1.1, auth: 1.2, payments: 1.3 },
    'e-commerce': { 'meta-framework': 1.1, database: 1.1, payments: 1.4 },
    'api': { backend: 1.3, database: 1.2, hosting: 1.1 },
    'mobile-app': { backend: 1.2, database: 1.1, auth: 1.2 },
    'marketplace': { 'meta-framework': 1.1, database: 1.2, auth: 1.1, payments: 1.3 },
    'cli': { backend: 1.0 },
    'library': { backend: 1.0 },
    'desktop': { frontend: 1.1, backend: 1.1, database: 1.0 }
};
/**
 * Categories to include based on project type.
 */
const PROJECT_TYPE_CATEGORIES = {
    'web-app': ['meta-framework', 'database', 'orm', 'auth', 'hosting'],
    'saas': ['meta-framework', 'database', 'orm', 'auth', 'hosting', 'payments'],
    'e-commerce': ['meta-framework', 'database', 'orm', 'auth', 'hosting', 'payments'],
    'api': ['backend', 'database', 'orm', 'auth', 'hosting'],
    'mobile-app': ['backend', 'database', 'orm', 'auth', 'hosting'],
    'marketplace': ['meta-framework', 'database', 'orm', 'auth', 'hosting', 'payments'],
    'cli': ['backend'],
    'library': ['backend'],
    'desktop': ['frontend', 'backend', 'database', 'orm']
};
/**
 * Select best tech for each category based on scores.
 */
function selectBestTechPerCategory(categories, context, projectType) {
    const results = [];
    const weights = PROJECT_TYPE_WEIGHTS[projectType] || {};
    for (const category of categories) {
        const techs = getTechnologiesByCategory(category);
        if (techs.length === 0)
            continue;
        let bestTech = techs[0];
        let bestScore = 0;
        for (const tech of techs) {
            const scores = getScores(tech.id, context);
            if (!scores)
                continue;
            let overall = calculateOverallScore(scores);
            // Apply project-type specific weight
            const weight = weights[category] || 1.0;
            overall = Math.round(overall * weight);
            if (overall > bestScore) {
                bestScore = overall;
                bestTech = tech;
            }
        }
        const finalScores = getScores(bestTech.id, context);
        const finalScore = finalScores ? calculateOverallScore(finalScores) : 0;
        results.push({
            category,
            technology: bestTech.name,
            score: finalScore,
            grade: scoreToGrade(finalScore)
        });
    }
    return results;
}
/**
 * Execute recommend_stack_demo tool.
 */
export function executeRecommendStackDemo(input) {
    const { projectType, scale = 'mvp' } = input;
    debug('recommend_stack_demo called', { projectType, scale });
    // Check rate limit
    if (wasDemoUsedToday()) {
        const deviceId = getDeviceId();
        return {
            text: `## Daily Demo Limit Reached

You've already used your free demo today.

**Options:**
1. Come back tomorrow for another free demo
2. Create a free account at https://stacksfinder.com/register
3. Upgrade to Pro for unlimited recommendations: https://stacksfinder.com/pricing

**Pro benefits:**
- Unlimited stack recommendations
- Custom priorities (time-to-market, scalability, security, etc.)
- Technology constraints
- AI-generated implementation narratives
- API access for automation
- MCP integration with full features

---
*Device ID: ${deviceId.slice(0, 8)}...*`,
            isError: true
        };
    }
    // Get categories for this project type
    const categories = PROJECT_TYPE_CATEGORIES[projectType] || ['meta-framework', 'database', 'auth', 'hosting'];
    // Get scoring context
    const context = scaleToContext(scale);
    // Select best tech per category
    const recommendations = selectBestTechPerCategory(categories, context, projectType);
    // Record usage
    recordDemoUsage();
    // Format response
    const projectLabel = projectType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    let text = `## Recommended Stack for ${projectLabel} (${scale})

| Category | Technology | Score | Grade |
|----------|------------|-------|-------|
`;
    for (const rec of recommendations) {
        text += `| ${rec.category} | ${rec.technology} | ${rec.score} | ${rec.grade} |\n`;
    }
    text += `
**Confidence**: medium (demo mode - no priorities/constraints applied)

---

### Want More?

This is a **simplified demo**. The full version includes:
- Custom priorities (time-to-market, scalability, security, etc.)
- Technology constraints ("must use PostgreSQL", "no AWS")
- Compatibility scoring between all selected technologies
- AI-generated implementation narrative with setup guides
- Confidence scoring (high/medium/low) based on your inputs

**Upgrade to Pro**: https://stacksfinder.com/pricing
**Create free account**: https://stacksfinder.com/register

---
*Data version: ${DATA_VERSION} | Demo (1/day limit)*`;
    return { text };
}
//# sourceMappingURL=recommend-demo.js.map