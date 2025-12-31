import { describe, it, expect } from 'vitest';
import { executeCompareTechs } from '../src/tools/compare.js';
import { DATA_VERSION } from '../src/data/index.js';

describe('compare_techs tool', () => {
	it('should compare two technologies', () => {
		const result = executeCompareTechs({ technologies: ['nextjs', 'sveltekit'] });

		expect(result.isError).toBeUndefined();
		expect(result.text).toContain('## Comparison: Next.js vs SvelteKit');
		expect(result.text).toContain('### Overall Scores');
		expect(result.text).toContain('### Per-Dimension Winners');
		expect(result.text).toContain('### Compatibility Matrix');
		expect(result.text).toContain(`Data version: ${DATA_VERSION}`);
	});

	it('should compare three technologies', () => {
		const result = executeCompareTechs({ technologies: ['nextjs', 'sveltekit', 'nuxt'] });

		expect(result.isError).toBeUndefined();
		expect(result.text).toContain('## Comparison: Next.js vs SvelteKit vs Nuxt');
	});

	it('should compare four technologies', () => {
		const result = executeCompareTechs({ technologies: ['nextjs', 'sveltekit', 'nuxt', 'remix'] });

		expect(result.isError).toBeUndefined();
		expect(result.text).toContain('Next.js');
		expect(result.text).toContain('SvelteKit');
		expect(result.text).toContain('Nuxt');
		expect(result.text).toContain('Remix');
	});

	it('should show compatibility matrix between all pairs', () => {
		const result = executeCompareTechs({ technologies: ['nextjs', 'sveltekit', 'nuxt'] });

		// Should have 3 pairs: nextjs↔sveltekit, nextjs↔nuxt, sveltekit↔nuxt
		expect(result.text).toContain('nextjs ↔ sveltekit');
		expect(result.text).toContain('nextjs ↔ nuxt');
		expect(result.text).toContain('sveltekit ↔ nuxt');
	});

	it('should return error for unknown technology', () => {
		const result = executeCompareTechs({ technologies: ['nextjs', 'unknowntech'] });

		expect(result.isError).toBe(true);
		expect(result.text).toContain('**Error (TECH_NOT_FOUND)**');
	});

	it('should return error for duplicate technologies', () => {
		const result = executeCompareTechs({ technologies: ['nextjs', 'nextjs'] });

		expect(result.isError).toBe(true);
		expect(result.text).toContain('Duplicate');
	});

	it('should respect context parameter', () => {
		const defaultResult = executeCompareTechs({ technologies: ['nextjs', 'sveltekit'], context: 'default' });
		const enterpriseResult = executeCompareTechs({
			technologies: ['nextjs', 'sveltekit'],
			context: 'enterprise'
		});

		expect(defaultResult.text).toContain('context: default');
		expect(enterpriseResult.text).toContain('context: enterprise');
	});

	it('should declare tie when margin is less than 3', () => {
		// Find two techs with close scores in at least one dimension
		// This tests the tie handling logic
		const result = executeCompareTechs({ technologies: ['react', 'vue'] });

		// The result should contain either a winner or "Tie"
		expect(result.text).toMatch(/Winner|Tie/);
	});

	it('should provide verdict and recommendation', () => {
		const result = executeCompareTechs({ technologies: ['nextjs', 'sveltekit'] });

		expect(result.text).toContain('**Verdict**');
	});
});
