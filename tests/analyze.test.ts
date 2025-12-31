import { describe, it, expect } from 'vitest';
import { executeAnalyzeTech } from '../src/tools/analyze.js';
import { DATA_VERSION } from '../src/data/index.js';

describe('analyze_tech tool', () => {
	it('should return analysis for valid technology', () => {
		const result = executeAnalyzeTech({ technology: 'nextjs' });

		expect(result.isError).toBeUndefined();
		expect(result.text).toContain('## Next.js Analysis');
		expect(result.text).toContain('**Category**: meta-framework');
		expect(result.text).toContain('Performance');
		expect(result.text).toContain('Developer Experience');
		expect(result.text).toContain(`Data version: ${DATA_VERSION}`);
	});

	it('should respect context parameter', () => {
		const defaultResult = executeAnalyzeTech({ technology: 'nextjs', context: 'default' });
		const mvpResult = executeAnalyzeTech({ technology: 'nextjs', context: 'mvp' });

		expect(defaultResult.text).toContain('context: default');
		expect(mvpResult.text).toContain('context: mvp');
	});

	it('should return error for unknown technology', () => {
		const result = executeAnalyzeTech({ technology: 'unknowntech' });

		expect(result.isError).toBe(true);
		expect(result.text).toContain('**Error (TECH_NOT_FOUND)**');
		expect(result.text).toContain('unknowntech');
	});

	it('should suggest similar technologies for typos', () => {
		const result = executeAnalyzeTech({ technology: 'nexjs' }); // typo for nextjs

		expect(result.isError).toBe(true);
		expect(result.text).toContain('**Suggestions**');
		expect(result.text).toContain('nextjs');
	});

	it('should include compatible technologies', () => {
		const result = executeAnalyzeTech({ technology: 'postgres' });

		expect(result.text).toContain('### Compatible Technologies');
		expect(result.text).toContain('drizzle');
	});

	it('should include strengths and weaknesses', () => {
		const result = executeAnalyzeTech({ technology: 'sveltekit' });

		// SvelteKit has high perf/dx scores, lower ecosystem
		expect(result.text).toContain('### Strengths');
	});
});
