import { describe, it, expect } from 'vitest';
import { executeListTechs } from '../src/tools/list-techs.js';
import { DATA_VERSION, getAllTechIds } from '../src/data/index.js';

describe('list_technologies tool', () => {
	it('should list all technologies when no category filter', () => {
		const result = executeListTechs({});

		expect(result).toContain('Available technologies');
		expect(result).toContain(`Data version: ${DATA_VERSION}`);

		// Should include technologies from multiple categories
		expect(result).toContain('## meta-framework');
		expect(result).toContain('## database');
		expect(result).toContain('## hosting');

		// Should include specific technologies
		expect(result).toContain('nextjs');
		expect(result).toContain('postgres');
		expect(result).toContain('vercel');
	});

	it('should include total count in output', () => {
		const result = executeListTechs({});
		const totalTechs = getAllTechIds().length;

		expect(result).toContain(`(${totalTechs} total)`);
	});

	it('should filter by meta-framework category', () => {
		const result = executeListTechs({ category: 'meta-framework' });

		expect(result).toContain('meta-framework');
		expect(result).toContain('nextjs');
		expect(result).toContain('sveltekit');
		expect(result).toContain('nuxt');

		// Should NOT include other categories
		expect(result).not.toContain('## database');
		expect(result).not.toContain('## hosting');
	});

	it('should filter by database category', () => {
		const result = executeListTechs({ category: 'database' });

		expect(result).toContain('postgres');
		expect(result).toContain('sqlite');
		expect(result).toContain('supabase');

		// Should NOT include meta-frameworks
		expect(result).not.toContain('nextjs');
		expect(result).not.toContain('sveltekit');
	});

	it('should filter by orm category', () => {
		const result = executeListTechs({ category: 'orm' });

		expect(result).toContain('drizzle');
		expect(result).toContain('prisma');
	});

	it('should filter by auth category', () => {
		const result = executeListTechs({ category: 'auth' });

		expect(result).toContain('better-auth');
		expect(result).toContain('clerk');
	});

	it('should filter by hosting category', () => {
		const result = executeListTechs({ category: 'hosting' });

		expect(result).toContain('vercel');
		expect(result).toContain('cloudflare');
		expect(result).toContain('railway');
	});

	it('should include technology names in parentheses', () => {
		const result = executeListTechs({ category: 'meta-framework' });

		expect(result).toContain('nextjs (Next.js)');
		expect(result).toContain('sveltekit (SvelteKit)');
	});

	it('should show count when filtering by category', () => {
		const result = executeListTechs({ category: 'database' });

		// Should show count for filtered category
		expect(result).toMatch(/Available technologies in "database" \(\d+ total\)/);
	});
});
