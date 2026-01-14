import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfig, resetConfig } from '../src/utils/config.js';
import { ErrorCode } from '../src/utils/errors.js';
import {
	CreateAuditInputSchema,
	GetAuditInputSchema,
	ListAuditsInputSchema,
	CompareAuditsInputSchema,
	GetAuditQuotaInputSchema,
	createAuditToolDefinition,
	getAuditToolDefinition,
	listAuditsToolDefinition,
	compareAuditsToolDefinition,
	getAuditQuotaToolDefinition
} from '../src/tools/audit.js';

// Mock fetch for testing
const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;
globalThis.fetch = mockFetch as typeof fetch;

describe('Audit Tools - Schemas', () => {
	describe('CreateAuditInputSchema', () => {
		it('should validate valid input', () => {
			const result = CreateAuditInputSchema.safeParse({
				name: 'Q1 2026 Audit',
				technologies: [
					{ name: 'react', version: '18.2.0' },
					{ name: 'express', version: '4.18.2' }
				]
			});
			expect(result.success).toBe(true);
		});

		it('should require name', () => {
			const result = CreateAuditInputSchema.safeParse({
				technologies: [{ name: 'react' }]
			});
			expect(result.success).toBe(false);
		});

		it('should require at least one technology', () => {
			const result = CreateAuditInputSchema.safeParse({
				name: 'Test Audit',
				technologies: []
			});
			expect(result.success).toBe(false);
		});

		it('should allow technologies without version', () => {
			const result = CreateAuditInputSchema.safeParse({
				name: 'Test Audit',
				technologies: [{ name: 'react' }, { name: 'vue' }]
			});
			expect(result.success).toBe(true);
		});

		it('should reject empty technology names', () => {
			const result = CreateAuditInputSchema.safeParse({
				name: 'Test Audit',
				technologies: [{ name: '' }]
			});
			expect(result.success).toBe(false);
		});

		it('should limit to 50 technologies', () => {
			const techs = Array(51)
				.fill(null)
				.map((_, i) => ({ name: `tech${i}` }));
			const result = CreateAuditInputSchema.safeParse({
				name: 'Test Audit',
				technologies: techs
			});
			expect(result.success).toBe(false);
		});
	});

	describe('GetAuditInputSchema', () => {
		it('should validate valid UUID', () => {
			const result = GetAuditInputSchema.safeParse({
				auditId: '550e8400-e29b-41d4-a716-446655440000'
			});
			expect(result.success).toBe(true);
		});

		it('should reject invalid UUID', () => {
			const result = GetAuditInputSchema.safeParse({
				auditId: 'not-a-uuid'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('ListAuditsInputSchema', () => {
		it('should use default values', () => {
			const result = ListAuditsInputSchema.safeParse({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.limit).toBe(10);
				expect(result.data.offset).toBe(0);
			}
		});

		it('should accept custom limit and offset', () => {
			const result = ListAuditsInputSchema.safeParse({
				limit: 20,
				offset: 5
			});
			expect(result.success).toBe(true);
		});

		it('should reject limit > 50', () => {
			const result = ListAuditsInputSchema.safeParse({
				limit: 100
			});
			expect(result.success).toBe(false);
		});
	});

	describe('CompareAuditsInputSchema', () => {
		it('should validate two UUIDs', () => {
			const result = CompareAuditsInputSchema.safeParse({
				baseAuditId: '550e8400-e29b-41d4-a716-446655440000',
				compareAuditId: '550e8400-e29b-41d4-a716-446655440001'
			});
			expect(result.success).toBe(true);
		});

		it('should require both audit IDs', () => {
			const result = CompareAuditsInputSchema.safeParse({
				baseAuditId: '550e8400-e29b-41d4-a716-446655440000'
			});
			expect(result.success).toBe(false);
		});
	});

	describe('GetAuditQuotaInputSchema', () => {
		it('should accept empty object', () => {
			const result = GetAuditQuotaInputSchema.safeParse({});
			expect(result.success).toBe(true);
		});
	});
});

describe('Audit Tools - Definitions', () => {
	it('create_audit should have correct structure', () => {
		expect(createAuditToolDefinition.name).toBe('create_audit');
		expect(createAuditToolDefinition.description).toContain('technical debt audit');
		expect(createAuditToolDefinition.inputSchema.required).toContain('name');
		expect(createAuditToolDefinition.inputSchema.required).toContain('technologies');
	});

	it('get_audit should have correct structure', () => {
		expect(getAuditToolDefinition.name).toBe('get_audit');
		expect(getAuditToolDefinition.description).toContain('audit report');
		expect(getAuditToolDefinition.inputSchema.required).toContain('auditId');
	});

	it('list_audits should have correct structure', () => {
		expect(listAuditsToolDefinition.name).toBe('list_audits');
		expect(listAuditsToolDefinition.description).toContain('List');
		expect(listAuditsToolDefinition.inputSchema.required).toEqual([]);
	});

	it('compare_audits should have correct structure', () => {
		expect(compareAuditsToolDefinition.name).toBe('compare_audits');
		expect(compareAuditsToolDefinition.description).toContain('Compare');
		expect(compareAuditsToolDefinition.inputSchema.required).toContain('baseAuditId');
		expect(compareAuditsToolDefinition.inputSchema.required).toContain('compareAuditId');
	});

	it('get_audit_quota should have correct structure', () => {
		expect(getAuditQuotaToolDefinition.name).toBe('get_audit_quota');
		expect(getAuditQuotaToolDefinition.description).toContain('quota');
	});
});

describe('Audit Tools - Execution', () => {
	beforeEach(() => {
		resetConfig();
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('without API key', () => {
		it('executeCreateAudit should return error when API key is not set', async () => {
			process.env.STACKSFINDER_API_URL = 'https://test.stacksfinder.com';
			delete process.env.STACKSFINDER_API_KEY;
			loadConfig();

			const { executeCreateAudit } = await import('../src/tools/audit.js');

			const result = await executeCreateAudit({
				name: 'Test Audit',
				technologies: [{ name: 'react' }]
			});

			expect(result.isError).toBe(true);
			expect(result.text).toContain('API key');
		});

		it('executeGetAudit should return error when API key is not set', async () => {
			process.env.STACKSFINDER_API_URL = 'https://test.stacksfinder.com';
			delete process.env.STACKSFINDER_API_KEY;
			loadConfig();

			const { executeGetAudit } = await import('../src/tools/audit.js');

			const result = await executeGetAudit({
				auditId: '550e8400-e29b-41d4-a716-446655440000'
			});

			expect(result.isError).toBe(true);
			expect(result.text).toContain('API key');
		});
	});

	describe('with API key', () => {
		beforeEach(() => {
			process.env.STACKSFINDER_API_URL = 'https://test.stacksfinder.com';
			process.env.STACKSFINDER_API_KEY = 'sk_test_xxx';
			loadConfig();
		});

		it('executeCreateAudit should format successful response', async () => {
			const mockResponse = {
				id: '550e8400-e29b-41d4-a716-446655440000',
				name: 'Test Audit',
				status: 'completed',
				summary: {
					critical: 1,
					high: 2,
					medium: 3,
					low: 4,
					info: 5,
					healthScore: 75
				},
				findings: [
					{
						id: 'f1',
						category: 'security',
						severity: 'critical',
						title: 'Critical vulnerability in lodash',
						description: 'CVE-2021-23337 affects lodash < 4.17.21',
						technology: 'lodash',
						version: '4.17.20',
						suggestedAction: 'Upgrade to lodash 4.17.21 or later'
					}
				],
				createdAt: '2026-01-15T10:00:00Z'
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const { executeCreateAudit } = await import('../src/tools/audit.js');

			const result = await executeCreateAudit({
				name: 'Test Audit',
				technologies: [{ name: 'lodash', version: '4.17.20' }]
			});

			expect(result.isError).toBeUndefined();
			expect(result.text).toContain('Test Audit');
			expect(result.text).toContain('75/100');
			expect(result.text).toContain('critical');
		});

		it('executeListAudits should handle empty response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ audits: [], total: 0 })
			});

			const { executeListAudits } = await import('../src/tools/audit.js');

			const result = await executeListAudits({ limit: 10, offset: 0 });

			expect(result.isError).toBeUndefined();
			expect(result.text).toContain('No audit reports found');
			expect(result.text).toContain('create_audit');
		});

		it('executeListAudits should format audit list', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					audits: [
						{
							id: '550e8400-e29b-41d4-a716-446655440000',
							name: 'Q1 Audit',
							status: 'completed',
							summary: { healthScore: 80 },
							createdAt: '2026-01-15T10:00:00Z'
						}
					],
					total: 1
				})
			});

			const { executeListAudits } = await import('../src/tools/audit.js');

			const result = await executeListAudits({ limit: 10, offset: 0 });

			expect(result.isError).toBeUndefined();
			expect(result.text).toContain('Q1 Audit');
			expect(result.text).toContain('80/100');
		});

		it('executeGetAudit should handle not found', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 404,
				text: async () => JSON.stringify({ error: 'Audit not found' })
			});

			const { executeGetAudit } = await import('../src/tools/audit.js');

			const result = await executeGetAudit({
				auditId: '550e8400-e29b-41d4-a716-446655440000'
			});

			expect(result.isError).toBe(true);
			expect(result.text).toContain('NOT_FOUND');
		});

		it('executeGetAuditQuota should format quota response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					quota: {
						used: 3,
						limit: 10,
						remaining: 7,
						resetsAt: '2026-02-01T00:00:00Z'
					}
				})
			});

			const { executeGetAuditQuota } = await import('../src/tools/audit.js');

			const result = await executeGetAuditQuota();

			expect(result.isError).toBeUndefined();
			expect(result.text).toContain('3');
			expect(result.text).toContain('10');
			expect(result.text).toContain('7');
		});

		it('executeCompareAudits should format comparison response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					comparison: {
						baseAuditId: '550e8400-e29b-41d4-a716-446655440000',
						compareAuditId: '550e8400-e29b-41d4-a716-446655440001',
						newFindings: [],
						resolvedFindings: [
							{
								id: 'f1',
								category: 'security',
								severity: 'critical',
								title: 'Fixed vulnerability'
							}
						],
						healthScoreDelta: 15,
						trend: 'improving'
					}
				})
			});

			const { executeCompareAudits } = await import('../src/tools/audit.js');

			const result = await executeCompareAudits({
				baseAuditId: '550e8400-e29b-41d4-a716-446655440000',
				compareAuditId: '550e8400-e29b-41d4-a716-446655440001'
			});

			expect(result.isError).toBeUndefined();
			expect(result.text).toContain('improving');
			expect(result.text).toContain('+15');
		});
	});
});
