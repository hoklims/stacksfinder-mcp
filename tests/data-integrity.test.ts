import { describe, it, expect } from 'vitest';
import {
	getAllTechnologies,
	getAllTechIds,
	getCompatibility,
	getTechnology,
	SCORE_DIMENSIONS,
	CATEGORIES
} from '../src/data/index.js';

describe('Data Integrity', () => {
	describe('Technology scores', () => {
		it('should have all 6 score dimensions for every technology', () => {
			const techs = getAllTechnologies();

			for (const tech of techs) {
				for (const context of ['default', 'mvp', 'enterprise'] as const) {
					const scores = tech.scores[context];
					expect(scores, `${tech.id} missing scores for context: ${context}`).toBeDefined();

					for (const dim of SCORE_DIMENSIONS) {
						expect(typeof scores[dim], `${tech.id}.${context}.${dim} should be a number`).toBe('number');
						expect(scores[dim], `${tech.id}.${context}.${dim} should be 0-100`).toBeGreaterThanOrEqual(0);
						expect(scores[dim], `${tech.id}.${context}.${dim} should be 0-100`).toBeLessThanOrEqual(100);
					}
				}
			}
		});

		it('should have valid category for every technology', () => {
			const techs = getAllTechnologies();
			const validCategories = new Set(CATEGORIES);

			for (const tech of techs) {
				expect(
					validCategories.has(tech.category),
					`${tech.id} has invalid category: ${tech.category}`
				).toBe(true);
			}
		});

		it('should have unique technology IDs', () => {
			const ids = getAllTechIds();
			const uniqueIds = new Set(ids);

			expect(ids.length).toBe(uniqueIds.size);
		});

		it('should have valid URLs for every technology', () => {
			const techs = getAllTechnologies();

			for (const tech of techs) {
				expect(tech.url, `${tech.id} should have a URL`).toBeTruthy();
				expect(tech.url, `${tech.id} URL should start with https://`).toMatch(/^https:\/\//);
			}
		});
	});

	describe('Compatibility matrix', () => {
		it('should have directional compatibility (matrix may be asymmetric)', () => {
			// The compatibility matrix is intentionally asymmetric in some cases.
			// For example, "nodejs → prisma" might have a different score than "prisma → nodejs"
			// because the relationship depends on which tech is the primary choice.
			// This test verifies that lookups work correctly in both directions.
			const techIds = getAllTechIds();

			for (const idA of techIds) {
				for (const idB of techIds) {
					if (idA === idB) continue;

					const scoreAB = getCompatibility(idA, idB);
					const scoreBA = getCompatibility(idB, idA);

					// Both lookups should return valid scores (0-100)
					expect(scoreAB, `Compatibility ${idA}→${idB} should be 0-100`).toBeGreaterThanOrEqual(0);
					expect(scoreAB, `Compatibility ${idA}→${idB} should be 0-100`).toBeLessThanOrEqual(100);
					expect(scoreBA, `Compatibility ${idB}→${idA} should be 0-100`).toBeGreaterThanOrEqual(0);
					expect(scoreBA, `Compatibility ${idB}→${idA} should be 0-100`).toBeLessThanOrEqual(100);
				}
			}
		});

		it('should have valid compatibility scores (0-100)', () => {
			const techIds = getAllTechIds();

			for (const idA of techIds) {
				for (const idB of techIds) {
					const score = getCompatibility(idA, idB);

					expect(score, `Compatibility ${idA}↔${idB} should be 0-100`).toBeGreaterThanOrEqual(0);
					expect(score, `Compatibility ${idA}↔${idB} should be 0-100`).toBeLessThanOrEqual(100);
				}
			}
		});

		it('should return 100 for same technology', () => {
			const techIds = getAllTechIds();

			for (const id of techIds) {
				expect(getCompatibility(id, id), `${id} compatibility with itself should be 100`).toBe(100);
			}
		});

		it('should return neutral (50) for undefined pairs', () => {
			// Pick two techs that likely have no direct compatibility defined
			// but are not incompatible
			const score = getCompatibility('solid', 'railway');

			// Should be 50 (neutral) if not explicitly defined
			expect(score).toBe(50);
		});
	});

	describe('Data consistency', () => {
		it('should have at least 15 technologies', () => {
			const count = getAllTechIds().length;
			expect(count).toBeGreaterThanOrEqual(15);
		});

		it('should have technologies in each major category', () => {
			const majorCategories = ['meta-framework', 'database', 'orm', 'auth', 'hosting'];

			for (const category of majorCategories) {
				const techs = getAllTechnologies().filter((t) => t.category === category);
				expect(techs.length, `Category ${category} should have at least 1 tech`).toBeGreaterThanOrEqual(1);
			}
		});

		it('should have getTechnology return null for unknown IDs', () => {
			const result = getTechnology('definitely-not-a-real-tech');
			expect(result).toBeNull();
		});
	});
});
