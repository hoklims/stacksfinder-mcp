/**
 * Data version - update when syncing from source.
 */
export declare const DATA_VERSION = "2025.12.30";
/**
 * Score dimensions.
 */
export declare const SCORE_DIMENSIONS: readonly ["perf", "dx", "ecosystem", "maintain", "cost", "compliance"];
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];
/**
 * Human-readable dimension names.
 */
export declare const DIMENSION_LABELS: Record<ScoreDimension, string>;
/**
 * Technology categories.
 */
export declare const CATEGORIES: readonly ["frontend", "backend", "meta-framework", "database", "orm", "auth", "hosting", "payments"];
export type Category = (typeof CATEGORIES)[number];
/**
 * Score contexts.
 */
export declare const CONTEXTS: readonly ["default", "mvp", "enterprise"];
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
 * Get all technology IDs.
 */
export declare function getAllTechIds(): string[];
/**
 * Get a technology by ID.
 */
export declare function getTechnology(id: string): TechInfo | null;
/**
 * Get all technologies.
 */
export declare function getAllTechnologies(): TechInfo[];
/**
 * Get technologies by category.
 */
export declare function getTechnologiesByCategory(category: Category): TechInfo[];
/**
 * Get technologies grouped by category.
 */
export declare function getTechnologiesGroupedByCategory(): Record<Category, TechInfo[]>;
/**
 * Get scores for a technology in a specific context.
 */
export declare function getScores(techId: string, context?: Context): Scores | null;
/**
 * Calculate overall score (average of all dimensions).
 */
export declare function calculateOverallScore(scores: Scores): number;
/**
 * Get letter grade from score.
 */
export declare function scoreToGrade(score: number): string;
/**
 * Get compatibility score between two technologies.
 * Returns 50 (neutral) if no direct compatibility is defined.
 */
export declare function getCompatibility(techA: string, techB: string): number;
/**
 * Get compatibility verdict.
 */
export declare function getCompatibilityVerdict(score: number): string;
/**
 * Find compatible technologies for a given tech.
 * Returns sorted by compatibility score (descending).
 */
export declare function findCompatibleTechs(techId: string, limit?: number): Array<{
    id: string;
    score: number;
}>;
/**
 * Find similar technology IDs using Levenshtein distance.
 */
export declare function findSimilarTechIds(input: string, limit?: number): string[];
/**
 * Check if a technology ID exists.
 */
export declare function techExists(id: string): boolean;
/**
 * Get source data version from JSON files.
 */
export declare function getSourceDataVersion(): {
    scores: string;
    compatibility: string;
};
//# sourceMappingURL=index.d.ts.map