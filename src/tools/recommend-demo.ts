import { z } from 'zod';
import {
	DATA_VERSION,
	type Category,
	type Context,
	calculateOverallScore,
	getCompatibility,
	getScores,
	getTechnologiesByCategory,
	scoreToGrade
} from '../data/index.js';
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
] as const;

/**
 * Scale options.
 */
const SCALES = ['mvp', 'startup', 'growth', 'enterprise'] as const;

/**
 * Input schema for recommend_stack_demo tool.
 */
export const RecommendStackDemoInputSchema = z.object({
	projectType: z.enum(PROJECT_TYPES).describe('Type of project'),
	scale: z.enum(SCALES).optional().default('mvp').describe('Project scale')
});

export type RecommendStackDemoInput = z.infer<typeof RecommendStackDemoInputSchema>;

/**
 * Tool definition for MCP registration.
 */
export const recommendStackDemoToolDefinition = {
	name: 'recommend_stack_demo',
	description: `Quick tech stack recommendation based on project type and scale.

**Prerequisites**: None - great starting point for new users.

**Next Steps**:
- Analyze a specific tech: \`analyze_tech({ technology: "recommended-id" })\`
- Full recommendation with priorities: \`recommend_stack()\`

**Output includes**:
- Optimal technology for each category (frontend, backend, database, etc.)
- Score and grade for each recommendation
- Based on 100% deterministic scoring (no AI hallucinations)

**Example**: \`recommend_stack_demo({ projectType: "saas", scale: "mvp" })\``,
	inputSchema: {
		type: 'object' as const,
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
function scaleToContext(scale: string): Context {
	if (scale === 'enterprise' || scale === 'growth') return 'enterprise';
	if (scale === 'mvp' || scale === 'startup') return 'mvp';
	return 'default';
}

/**
 * Category weights for different project types.
 * Higher weight = more important for this project type.
 */
const PROJECT_TYPE_WEIGHTS: Record<string, Partial<Record<Category, number>>> = {
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
const PROJECT_TYPE_CATEGORIES: Record<string, Category[]> = {
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
 * Check if a technology is compatible with all already-selected technologies.
 * Returns false if ANY hard incompatibility (score=0) is found.
 */
function isCompatibleWithSelected(techId: string, selectedTechIds: string[]): boolean {
	for (const selectedId of selectedTechIds) {
		const compatScore = getCompatibility(techId, selectedId);
		if (compatScore === 0) {
			return false; // Hard incompatibility
		}
	}
	return true;
}

/**
 * Select best tech for each category based on scores.
 * Tracks selected techs and filters out incompatible options.
 */
function selectBestTechPerCategory(
	categories: Category[],
	context: Context,
	projectType: string
): Array<{ category: Category; technology: string; score: number; grade: string }> {
	const results: Array<{ category: Category; technology: string; score: number; grade: string }> = [];
	const weights = PROJECT_TYPE_WEIGHTS[projectType] || {};
	const selectedTechIds: string[] = []; // Track selections for compatibility checking

	for (const category of categories) {
		const techs = getTechnologiesByCategory(category);
		if (techs.length === 0) continue;

		let bestTech: (typeof techs)[0] | null = null;
		let bestScore = 0;

		for (const tech of techs) {
			// Skip if incompatible with already-selected techs
			if (!isCompatibleWithSelected(tech.id, selectedTechIds)) {
				continue;
			}

			const scores = getScores(tech.id, context);
			if (!scores) continue;

			let overall = calculateOverallScore(scores);

			// Apply project-type specific weight
			const weight = weights[category] || 1.0;
			overall = Math.round(overall * weight);

			if (overall > bestScore) {
				bestScore = overall;
				bestTech = tech;
			}
		}

		// Only add if we found a compatible tech
		if (bestTech) {
			const finalScores = getScores(bestTech.id, context);
			const finalScore = finalScores ? calculateOverallScore(finalScores) : 0;

			results.push({
				category,
				technology: bestTech.name,
				score: finalScore,
				grade: scoreToGrade(finalScore)
			});

			// Track this selection for future compatibility checks
			selectedTechIds.push(bestTech.id);
		}
	}

	return results;
}

/**
 * Execute recommend_stack_demo tool.
 */
export function executeRecommendStackDemo(
	input: RecommendStackDemoInput
): { text: string; isError?: boolean } {
	const { projectType, scale = 'mvp' } = input;

	debug('recommend_stack_demo called', { projectType, scale });

	// Check rate limit
	if (wasDemoUsedToday()) {
		const deviceId = getDeviceId();
		return {
			text: `## Daily Demo Limit Reached

You've already used the demo today. Try again tomorrow or use \`recommend_stack()\` for full access.

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

**Next steps:**
- Analyze a tech: \`analyze_tech({ technology: "nextjs" })\`
- Compare alternatives: \`compare_techs({ technologies: ["nextjs", "sveltekit"] })\`
- Full recommendation with priorities: \`recommend_stack()\`

---
*Data version: ${DATA_VERSION}*`;

	return { text };
}
