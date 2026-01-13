import { findSimilar } from '../utils/errors.js';

// Import JSON directly - esbuild bundles these inline for Smithery
import techScoresData from './technology_scores.json' with { type: 'json' };
import compatibilityData from './compatibility_matrix.json' with { type: 'json' };

/**
 * Data version - update when syncing from source.
 */
export const DATA_VERSION = '2025.12.30';

/**
 * Score dimensions.
 */
export const SCORE_DIMENSIONS = ['perf', 'dx', 'ecosystem', 'maintain', 'cost', 'compliance'] as const;
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

/**
 * Human-readable dimension names.
 */
export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
	perf: 'Performance',
	dx: 'Developer Experience',
	ecosystem: 'Ecosystem',
	maintain: 'Maintainability',
	cost: 'Cost Efficiency',
	compliance: 'Compliance'
};

/**
 * Technology categories.
 */
export const CATEGORIES = [
	'frontend',
	'backend',
	'meta-framework',
	'database',
	'orm',
	'auth',
	'hosting',
	'payments'
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Score contexts.
 */
export const CONTEXTS = ['default', 'mvp', 'enterprise'] as const;
export type Context = (typeof CONTEXTS)[number];

/**
 * Score set for a technology.
 */
export interface Scores {
	perf: number;
	dx: number;
	ecosystem: number;
	maintain: number;
	cost: number;
	compliance: number;
}

/**
 * Technology information.
 */
export interface TechInfo {
	id: string;
	name: string;
	category: Category;
	url: string;
	scores: Record<Context, Scores>;
}

/**
 * Technology scores file structure.
 */
interface TechScoresFile {
	$version: string;
	$description: string;
	technologies: Record<string, TechInfo>;
}

/**
 * Compatibility matrix file structure.
 */
interface CompatibilityFile {
	$version: string;
	$description: string;
	matrix: Record<string, Record<string, number>>;
}

// Type assertions for imported JSON
const scores = techScoresData as TechScoresFile;
const compat = compatibilityData as CompatibilityFile;

/**
 * Get all technology IDs.
 */
export function getAllTechIds(): string[] {
	return Object.keys(scores.technologies);
}

/**
 * Get a technology by ID.
 */
export function getTechnology(id: string): TechInfo | null {
	return scores.technologies[id] || null;
}

/**
 * Get all technologies.
 */
export function getAllTechnologies(): TechInfo[] {
	return Object.values(scores.technologies);
}

/**
 * Get technologies by category.
 */
export function getTechnologiesByCategory(category: Category): TechInfo[] {
	return getAllTechnologies().filter((tech) => tech.category === category);
}

/**
 * Get technologies grouped by category.
 */
export function getTechnologiesGroupedByCategory(): Record<Category, TechInfo[]> {
	const grouped: Record<Category, TechInfo[]> = {
		frontend: [],
		backend: [],
		'meta-framework': [],
		database: [],
		orm: [],
		auth: [],
		hosting: [],
		payments: []
	};

	for (const tech of getAllTechnologies()) {
		if (tech.category in grouped) {
			grouped[tech.category].push(tech);
		}
	}

	return grouped;
}

/**
 * Get scores for a technology in a specific context.
 */
export function getScores(techId: string, context: Context = 'default'): Scores | null {
	const tech = getTechnology(techId);
	if (!tech) return null;
	return tech.scores[context] || tech.scores.default;
}

/**
 * Calculate overall score (average of all dimensions).
 */
export function calculateOverallScore(scores: Scores): number {
	const sum = SCORE_DIMENSIONS.reduce((acc, dim) => acc + scores[dim], 0);
	return Math.round(sum / SCORE_DIMENSIONS.length);
}

/**
 * Get letter grade from score.
 */
export function scoreToGrade(score: number): string {
	if (score >= 97) return 'A+';
	if (score >= 93) return 'A';
	if (score >= 90) return 'A-';
	if (score >= 87) return 'B+';
	if (score >= 83) return 'B';
	if (score >= 80) return 'B-';
	if (score >= 77) return 'C+';
	if (score >= 73) return 'C';
	if (score >= 70) return 'C-';
	if (score >= 67) return 'D+';
	if (score >= 63) return 'D';
	if (score >= 60) return 'D-';
	return 'F';
}

/**
 * Get compatibility score between two technologies.
 * Returns 50 (neutral) if no direct compatibility is defined.
 */
export function getCompatibility(techA: string, techB: string): number {
	// Same tech is always compatible
	if (techA === techB) return 100;

	// Check both directions
	const scoreAB = compat.matrix[techA]?.[techB];
	const scoreBA = compat.matrix[techB]?.[techA];

	// Return defined score, preferring A→B
	if (scoreAB !== undefined) return scoreAB;
	if (scoreBA !== undefined) return scoreBA;

	// Default to neutral
	return 50;
}

/**
 * Get compatibility verdict.
 */
export function getCompatibilityVerdict(score: number): string {
	if (score === 0) return 'Incompatible';
	if (score < 50) return 'Poor';
	if (score < 80) return 'Acceptable';
	if (score < 95) return 'Good';
	return 'Excellent';
}

/**
 * Find compatible technologies for a given tech.
 * Returns sorted by compatibility score (descending).
 */
export function findCompatibleTechs(techId: string, limit = 8): Array<{ id: string; score: number }> {
	const allIds = getAllTechIds().filter((id) => id !== techId);

	return allIds
		.map((id) => ({
			id,
			score: getCompatibility(techId, id)
		}))
		.filter((item) => item.score > 50) // Only include acceptable+ compatibility
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
}

/**
 * Find similar technology IDs using Levenshtein distance.
 */
export function findSimilarTechIds(input: string, limit = 3): string[] {
	return findSimilar(input, getAllTechIds(), limit);
}

/**
 * Check if a technology ID exists.
 */
export function techExists(id: string): boolean {
	return id in scores.technologies;
}

/**
 * Get source data version from JSON files.
 */
export function getSourceDataVersion(): { scores: string; compatibility: string } {
	return {
		scores: scores.$version,
		compatibility: compat.$version
	};
}
