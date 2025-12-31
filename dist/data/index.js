import { createRequire } from 'module';
import { findSimilar } from '../utils/errors.js';
const require = createRequire(import.meta.url);
// Load JSON data at module initialization
const techScoresData = require('./technology_scores.json');
const compatibilityData = require('./compatibility_matrix.json');
/**
 * Data version - update when syncing from source.
 */
export const DATA_VERSION = '2025.12.30';
/**
 * Score dimensions.
 */
export const SCORE_DIMENSIONS = ['perf', 'dx', 'ecosystem', 'maintain', 'cost', 'compliance'];
/**
 * Human-readable dimension names.
 */
export const DIMENSION_LABELS = {
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
];
/**
 * Score contexts.
 */
export const CONTEXTS = ['default', 'mvp', 'enterprise'];
/**
 * Get all technology IDs.
 */
export function getAllTechIds() {
    return Object.keys(techScoresData.technologies);
}
/**
 * Get a technology by ID.
 */
export function getTechnology(id) {
    return techScoresData.technologies[id] || null;
}
/**
 * Get all technologies.
 */
export function getAllTechnologies() {
    return Object.values(techScoresData.technologies);
}
/**
 * Get technologies by category.
 */
export function getTechnologiesByCategory(category) {
    return getAllTechnologies().filter((tech) => tech.category === category);
}
/**
 * Get technologies grouped by category.
 */
export function getTechnologiesGroupedByCategory() {
    const grouped = {
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
export function getScores(techId, context = 'default') {
    const tech = getTechnology(techId);
    if (!tech)
        return null;
    return tech.scores[context] || tech.scores.default;
}
/**
 * Calculate overall score (average of all dimensions).
 */
export function calculateOverallScore(scores) {
    const sum = SCORE_DIMENSIONS.reduce((acc, dim) => acc + scores[dim], 0);
    return Math.round(sum / SCORE_DIMENSIONS.length);
}
/**
 * Get letter grade from score.
 */
export function scoreToGrade(score) {
    if (score >= 97)
        return 'A+';
    if (score >= 93)
        return 'A';
    if (score >= 90)
        return 'A-';
    if (score >= 87)
        return 'B+';
    if (score >= 83)
        return 'B';
    if (score >= 80)
        return 'B-';
    if (score >= 77)
        return 'C+';
    if (score >= 73)
        return 'C';
    if (score >= 70)
        return 'C-';
    if (score >= 67)
        return 'D+';
    if (score >= 63)
        return 'D';
    if (score >= 60)
        return 'D-';
    return 'F';
}
/**
 * Get compatibility score between two technologies.
 * Returns 50 (neutral) if no direct compatibility is defined.
 */
export function getCompatibility(techA, techB) {
    // Same tech is always compatible
    if (techA === techB)
        return 100;
    // Check both directions
    const scoreAB = compatibilityData.matrix[techA]?.[techB];
    const scoreBA = compatibilityData.matrix[techB]?.[techA];
    // Return defined score, preferring A→B
    if (scoreAB !== undefined)
        return scoreAB;
    if (scoreBA !== undefined)
        return scoreBA;
    // Default to neutral
    return 50;
}
/**
 * Get compatibility verdict.
 */
export function getCompatibilityVerdict(score) {
    if (score === 0)
        return 'Incompatible';
    if (score < 50)
        return 'Poor';
    if (score < 80)
        return 'Acceptable';
    if (score < 95)
        return 'Good';
    return 'Excellent';
}
/**
 * Find compatible technologies for a given tech.
 * Returns sorted by compatibility score (descending).
 */
export function findCompatibleTechs(techId, limit = 8) {
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
export function findSimilarTechIds(input, limit = 3) {
    return findSimilar(input, getAllTechIds(), limit);
}
/**
 * Check if a technology ID exists.
 */
export function techExists(id) {
    return id in techScoresData.technologies;
}
/**
 * Get source data version from JSON files.
 */
export function getSourceDataVersion() {
    return {
        scores: techScoresData.$version,
        compatibility: compatibilityData.$version
    };
}
//# sourceMappingURL=index.js.map