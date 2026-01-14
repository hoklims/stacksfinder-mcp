import { z } from 'zod';
import { apiRequest } from '../utils/api-client.js';
import { McpError, ErrorCode } from '../utils/errors.js';
import { debug } from '../utils/logger.js';
import { hasApiKey } from '../utils/config.js';

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Input schema for create_audit tool.
 */
export const CreateAuditInputSchema = z.object({
	name: z.string().min(1).max(200).describe('Name for the audit report'),
	technologies: z
		.array(
			z.object({
				name: z.string().min(1).describe('Technology name (e.g., "react", "express", "lodash")'),
				version: z.string().optional().describe('Version string (e.g., "18.2.0", "4.17.21")'),
				category: z.string().optional().describe('Optional category (e.g., "frontend", "backend")')
			})
		)
		.min(1)
		.max(50)
		.describe('List of technologies to audit')
});

export type CreateAuditInput = z.infer<typeof CreateAuditInputSchema>;

/**
 * Input schema for get_audit tool.
 */
export const GetAuditInputSchema = z.object({
	auditId: z.string().uuid().describe('Audit report UUID')
});

export type GetAuditInput = z.infer<typeof GetAuditInputSchema>;

/**
 * Input schema for list_audits tool.
 */
export const ListAuditsInputSchema = z.object({
	limit: z.number().min(1).max(50).optional().default(10).describe('Max results to return'),
	offset: z.number().min(0).optional().default(0).describe('Pagination offset')
});

export type ListAuditsInput = z.infer<typeof ListAuditsInputSchema>;

/**
 * Input schema for compare_audits tool.
 */
export const CompareAuditsInputSchema = z.object({
	baseAuditId: z.string().uuid().describe('Base audit ID (older)'),
	compareAuditId: z.string().uuid().describe('Compare audit ID (newer)')
});

export type CompareAuditsInput = z.infer<typeof CompareAuditsInputSchema>;

/**
 * Input schema for get_audit_quota tool.
 */
export const GetAuditQuotaInputSchema = z.object({});

export type GetAuditQuotaInput = z.infer<typeof GetAuditQuotaInputSchema>;

/**
 * Input schema for get_migration_recommendation tool.
 */
export const GetMigrationRecommendationInputSchema = z.object({
	auditId: z.string().uuid().describe('Audit report UUID to analyze for migration')
});

export type GetMigrationRecommendationInput = z.infer<typeof GetMigrationRecommendationInputSchema>;

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const createAuditToolDefinition = {
	name: 'create_audit',
	description: `Create a technical debt audit for your tech stack. Analyzes for deprecated packages, security vulnerabilities, EOL versions, and upgrade recommendations.

**Tier**: Requires Pro or Team subscription (OR OAuth session)

**Prerequisites**:
- Pro/Team account or authenticated via OAuth
- List of technologies with versions (use package.json data)

**Next Steps**:
- Get full report: \`get_audit({ auditId: "returned-uuid" })\`
- Get migration plan: \`get_migration_recommendation({ auditId: "uuid" })\`
- Compare over time: \`compare_audits({ baseAuditId, compareAuditId })\`

**Output includes**:
- Health score (0-100)
- Findings by severity (critical/high/medium/low/info)
- Actionable upgrade recommendations
- CVE detection for known vulnerabilities

**Common Pitfalls**:
- Include version numbers for accurate vulnerability detection
- Use technology names as they appear in package managers

**Example**: \`create_audit({ name: "Q1 2026 Stack Review", technologies: [{ name: "React", version: "17.0.0" }, { name: "Node.js", version: "14.0.0" }] })\``,
	inputSchema: {
		type: 'object' as const,
		properties: {
			name: {
				type: 'string',
				description: 'Name for the audit report (e.g., "Q1 2026 Stack Review")'
			},
			technologies: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						name: { type: 'string', description: 'Technology name' },
						version: { type: 'string', description: 'Version (optional)' },
						category: { type: 'string', description: 'Category (optional)' }
					},
					required: ['name']
				},
				description: 'Technologies to audit'
			}
		},
		required: ['name', 'technologies']
	}
};

export const getAuditToolDefinition = {
	name: 'get_audit',
	description: 'Fetch a completed audit report by ID. Returns all findings and health score.',
	inputSchema: {
		type: 'object' as const,
		properties: {
			auditId: {
				type: 'string',
				format: 'uuid',
				description: 'Audit report UUID'
			}
		},
		required: ['auditId']
	}
};

export const listAuditsToolDefinition = {
	name: 'list_audits',
	description: 'List your audit reports with pagination. Shows name, status, health score, and creation date.',
	inputSchema: {
		type: 'object' as const,
		properties: {
			limit: {
				type: 'number',
				description: 'Max results (1-50, default 10)'
			},
			offset: {
				type: 'number',
				description: 'Pagination offset (default 0)'
			}
		},
		required: []
	}
};

export const compareAuditsToolDefinition = {
	name: 'compare_audits',
	description: `Compare two audit reports to track technical debt trends over time.
Shows new issues introduced, issues resolved, and health score change.
Useful for measuring progress on debt reduction.`,
	inputSchema: {
		type: 'object' as const,
		properties: {
			baseAuditId: {
				type: 'string',
				format: 'uuid',
				description: 'Base (older) audit ID'
			},
			compareAuditId: {
				type: 'string',
				format: 'uuid',
				description: 'Compare (newer) audit ID'
			}
		},
		required: ['baseAuditId', 'compareAuditId']
	}
};

export const getAuditQuotaToolDefinition = {
	name: 'get_audit_quota',
	description: 'Check your remaining audit quota for this month.',
	inputSchema: {
		type: 'object' as const,
		properties: {},
		required: []
	}
};

export const getMigrationRecommendationToolDefinition = {
	name: 'get_migration_recommendation',
	description: `Analyze an audit report for migration opportunities.
Returns a detailed migration recommendation including:
- Technologies that should be replaced
- Recommended modern alternatives
- Migration roadmap with phases
- Risk assessment
- Builder constraints to pre-fill for generating a migration blueprint

Use this after create_audit to get actionable migration guidance.`,
	inputSchema: {
		type: 'object' as const,
		properties: {
			auditId: {
				type: 'string',
				format: 'uuid',
				description: 'Audit report UUID to analyze'
			}
		},
		required: ['auditId']
	}
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface AuditFinding {
	id: string;
	category: string;
	severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
	title: string;
	description: string;
	technology: string;
	currentVersion?: string;
	recommendedVersion?: string;
	eolDate?: string;
	cveIds?: string[];
	migrationEffort?: string;
	suggestedAction: string;
	references?: string[];
	autoFixable?: boolean;
}

interface AuditSummary {
	totalFindings: number;
	criticalCount: number;
	highCount: number;
	mediumCount: number;
	lowCount: number;
	infoCount: number;
	healthScore: number;
}

interface AuditResponse {
	id: string;
	name: string;
	status: string;
	findings?: AuditFinding[];
	summary?: AuditSummary;
	createdAt: string;
	completedAt?: string;
}

interface AuditListResponse {
	audits: Array<{
		id: string;
		name: string;
		status: string;
		summary?: AuditSummary;
		createdAt: string;
	}>;
	total: number;
}

interface CompareResponse {
	comparison: {
		baseAudit: { id: string; name: string; healthScore: number };
		compareAudit: { id: string; name: string; healthScore: number };
		healthScoreDelta: number;
		trend: 'improving' | 'stable' | 'degrading';
		newFindings: AuditFinding[];
		resolvedFindings: AuditFinding[];
		newCount: number;
		resolvedCount: number;
	};
}

interface QuotaResponse {
	quota: {
		used: number;
		limit: number | 'unlimited';
		remaining: number | 'unlimited';
		resetsAt: string | null;
	};
}

interface MigrationRecommendationResponse {
	auditId: string;
	needsMigration: boolean;
	migrationScore: number;
	affectedTechCount: number;
	criticalIssues: number;
	recommendation: {
		id: string;
		urgency: 'critical' | 'high' | 'medium' | 'low';
		scope: 'full-stack' | 'partial' | 'incremental';
		title: string;
		summary: string;
		estimatedEffort: string;
		techsToReplace: Array<{
			techId: string;
			name: string;
			currentVersion?: string;
			reason: string;
			relatedFindings: string[];
		}>;
		suggestedAlternatives: Array<{
			forTech: string;
			alternatives: string[];
			preferredChoice?: string;
			reason: string;
		}>;
		inferredConstraints: string[];
		inferredContext: {
			projectType?: string;
			scale?: string;
			priorities: string[];
		};
		migrationSteps: Array<{
			order: number;
			phase: string;
			description: string;
			techsAffected: string[];
			effort: string;
		}>;
		risks: Array<{
			level: 'high' | 'medium' | 'low';
			description: string;
			mitigation: string;
		}>;
	} | null;
	builderPreFill: {
		constraintIds: string[];
		context: {
			projectType?: string;
			scale?: string;
			priorities: string[];
		};
		hints: {
			techsToAvoid: string[];
			preferredAlternatives: Record<string, string>;
		};
		migrationMode: boolean;
	} | null;
}

// ============================================================================
// FORMATTERS
// ============================================================================

function formatSeverityMarker(severity: string): string {
	switch (severity) {
		case 'critical':
			return '[CRITICAL]';
		case 'high':
			return '[HIGH]';
		case 'medium':
			return '[MEDIUM]';
		case 'low':
			return '[LOW]';
		case 'info':
			return '[INFO]';
		default:
			return '[-]';
	}
}

function formatHealthScore(score: number): string {
	if (score >= 90) return `[EXCELLENT] ${score}/100`;
	if (score >= 70) return `[GOOD] ${score}/100`;
	if (score >= 50) return `[FAIR] ${score}/100`;
	return `[NEEDS ATTENTION] ${score}/100`;
}

function formatAuditReport(audit: AuditResponse): string {
	let text = `## Audit Report: ${audit.name}\n\n`;
	text += `**ID**: ${audit.id}\n`;
	text += `**Status**: ${audit.status}\n`;
	text += `**Created**: ${new Date(audit.createdAt).toLocaleDateString()}\n`;

	if (audit.summary) {
		text += `\n### Health Score\n`;
		text += `${formatHealthScore(audit.summary.healthScore)}\n\n`;

		text += `### Summary\n`;
		text += `| Severity | Count |\n`;
		text += `|----------|-------|\n`;
		text += `| Critical | ${audit.summary.criticalCount} |\n`;
		text += `| High | ${audit.summary.highCount} |\n`;
		text += `| Medium | ${audit.summary.mediumCount} |\n`;
		text += `| Low | ${audit.summary.lowCount} |\n`;
		text += `| Info | ${audit.summary.infoCount} |\n`;
		text += `\n**Total Findings**: ${audit.summary.totalFindings}\n`;
	}

	if (audit.findings && audit.findings.length > 0) {
		text += `\n### Findings\n\n`;

		for (const finding of audit.findings) {
			text += `#### ${formatSeverityMarker(finding.severity)} ${finding.title}\n`;
			text += `**Technology**: ${finding.technology}`;
			if (finding.currentVersion) {
				text += ` (v${finding.currentVersion})`;
			}
			text += `\n`;
			text += `**Category**: ${finding.category}\n`;
			text += `**Severity**: ${finding.severity.toUpperCase()}\n\n`;
			text += `${finding.description}\n\n`;

			if (finding.recommendedVersion) {
				text += `**Recommended**: Upgrade to v${finding.recommendedVersion}\n`;
			}
			if (finding.migrationEffort) {
				text += `**Migration Effort**: ${finding.migrationEffort}\n`;
			}
			if (finding.cveIds && finding.cveIds.length > 0) {
				text += `**CVEs**: ${finding.cveIds.join(', ')}\n`;
			}

			text += `\n**Action**: ${finding.suggestedAction}\n\n`;

			if (finding.references && finding.references.length > 0) {
				text += `**References**:\n`;
				for (const ref of finding.references) {
					text += `- ${ref}\n`;
				}
			}
			text += `---\n\n`;
		}
	} else if (audit.status === 'completed') {
		text += `\n### All Clear\n`;
		text += `Your stack passed all checks. Great job maintaining your technical health!\n`;
	}

	return text;
}

function formatComparison(comparison: CompareResponse['comparison']): string {
	let text = `## Audit Comparison\n\n`;

	text += `### Overview\n`;
	text += `| Audit | Health Score |\n`;
	text += `|-------|-------------|\n`;
	text += `| ${comparison.baseAudit.name} (base) | ${comparison.baseAudit.healthScore}/100 |\n`;
	text += `| ${comparison.compareAudit.name} (compare) | ${comparison.compareAudit.healthScore}/100 |\n`;
	text += `\n`;

	const trendMarker =
		comparison.trend === 'improving'
			? '[UP]'
			: comparison.trend === 'degrading'
				? '[DOWN]'
				: '[STABLE]';

	text += `### Trend: ${trendMarker} ${comparison.trend.toUpperCase()}\n`;
	text += `**Health Score Change**: ${comparison.healthScoreDelta > 0 ? '+' : ''}${comparison.healthScoreDelta} points\n\n`;

	if (comparison.resolvedCount > 0) {
		text += `### Resolved Issues (${comparison.resolvedCount})\n`;
		for (const finding of comparison.resolvedFindings) {
			text += `- ${formatSeverityMarker(finding.severity)} ${finding.title} (${finding.technology})\n`;
		}
		text += `\n`;
	}

	if (comparison.newCount > 0) {
		text += `### New Issues (${comparison.newCount})\n`;
		for (const finding of comparison.newFindings) {
			text += `- ${formatSeverityMarker(finding.severity)} ${finding.title} (${finding.technology})\n`;
		}
		text += `\n`;
	}

	if (comparison.resolvedCount === 0 && comparison.newCount === 0) {
		text += `### No Changes\n`;
		text += `The findings are identical between these two audits.\n`;
	}

	return text;
}

function formatMigrationRecommendation(response: MigrationRecommendationResponse): string {
	if (!response.needsMigration) {
		return `## Migration Analysis\n\n**No migration recommended.**\n\nYour stack is healthy with no critical issues requiring migration.\n\n**Migration Score**: ${response.migrationScore}/100 (below threshold)`;
	}

	const rec = response.recommendation;
	if (!rec) {
		return `## Migration Analysis\n\nUnable to generate recommendation.`;
	}

	const urgencyMarker = {
		critical: '[CRITICAL]',
		high: '[HIGH]',
		medium: '[MEDIUM]',
		low: '[LOW]'
	}[rec.urgency];

	let text = `## ${urgencyMarker} Migration Recommendation\n\n`;
	text += `### ${rec.title}\n\n`;
	text += `**Migration Score**: ${response.migrationScore}/100\n`;
	text += `**Urgency**: ${rec.urgency.toUpperCase()}\n`;
	text += `**Scope**: ${rec.scope}\n`;
	text += `**Estimated Effort**: ${rec.estimatedEffort}\n`;
	text += `**Affected Technologies**: ${response.affectedTechCount}\n`;
	text += `**Critical Issues**: ${response.criticalIssues}\n\n`;

	text += `${rec.summary}\n\n`;

	// Technologies to Replace
	if (rec.techsToReplace.length > 0) {
		text += `### Technologies to Replace\n\n`;
		text += `| Technology | Version | Reason |\n`;
		text += `|------------|---------|--------|\n`;
		for (const tech of rec.techsToReplace) {
			text += `| ${tech.name} | ${tech.currentVersion || '-'} | ${tech.reason} |\n`;
		}
		text += `\n`;
	}

	// Suggested Alternatives
	if (rec.suggestedAlternatives.length > 0) {
		text += `### Recommended Alternatives\n\n`;
		for (const alt of rec.suggestedAlternatives) {
			text += `**${alt.forTech}** → `;
			const alts = alt.alternatives.map(a => 
				a === alt.preferredChoice ? `**${a}** (recommended)` : a
			);
			text += alts.join(', ');
			text += `\n`;
			text += `  _${alt.reason}_\n\n`;
		}
	}

	// Migration Roadmap
	if (rec.migrationSteps.length > 0) {
		text += `### Migration Roadmap\n\n`;
		for (const step of rec.migrationSteps) {
			text += `**Phase ${step.order}: ${step.phase}** (${step.effort} effort)\n`;
			text += `${step.description}\n`;
			if (step.techsAffected.length > 0) {
				text += `Affects: ${step.techsAffected.join(', ')}\n`;
			}
			text += `\n`;
		}
	}

	// Risks
	if (rec.risks.length > 0) {
		text += `### Risk Assessment\n\n`;
		for (const risk of rec.risks) {
			const riskMarker = risk.level === 'high' ? '[HIGH]' : risk.level === 'medium' ? '[MEDIUM]' : '[LOW]';
			text += `${riskMarker} **${risk.level.toUpperCase()} RISK**: ${risk.description}\n`;
			text += `   _Mitigation_: ${risk.mitigation}\n\n`;
		}
	}

	// Inferred Constraints
	if (rec.inferredConstraints.length > 0) {
		text += `### Inferred Builder Constraints\n\n`;
		text += `These constraints will be pre-filled when generating a migration blueprint:\n`;
		text += rec.inferredConstraints.map(c => `\`${c}\``).join(', ');
		text += `\n\n`;
	}

	// Builder Pre-fill info
	if (response.builderPreFill) {
		text += `### Generate Migration Blueprint\n\n`;
		text += `Use the StacksFinder Builder with these pre-filled settings:\n`;
		if (response.builderPreFill.context.projectType) {
			text += `- **Project Type**: ${response.builderPreFill.context.projectType}\n`;
		}
		if (response.builderPreFill.context.scale) {
			text += `- **Scale**: ${response.builderPreFill.context.scale}\n`;
		}
		if (response.builderPreFill.context.priorities.length > 0) {
			text += `- **Priorities**: ${response.builderPreFill.context.priorities.join(', ')}\n`;
		}
		if (response.builderPreFill.hints.techsToAvoid.length > 0) {
			text += `- **Avoid**: ${response.builderPreFill.hints.techsToAvoid.join(', ')}\n`;
		}
		text += `\nVisit https://stacksfinder.com/builder to generate your migration blueprint.\n`;
	}

	return text;
}

// ============================================================================
// EXECUTE FUNCTIONS
// ============================================================================

function requireApiKey(): void {
	if (!hasApiKey()) {
		throw new McpError(
			ErrorCode.CONFIG_ERROR,
			'API key required for audit operations. Set STACKSFINDER_API_KEY environment variable.',
			['Get your API key from https://stacksfinder.com/settings/api']
		);
	}
}

/**
 * Execute create_audit tool.
 */
export async function executeCreateAudit(
	input: CreateAuditInput
): Promise<{ text: string; isError?: boolean }> {
	requireApiKey();

	debug('Creating audit', { name: input.name, techCount: input.technologies.length });

	try {
		const response = await apiRequest<AuditResponse>('/api/v1/audits', {
			method: 'POST',
			body: {
				name: input.name,
				stackInput: {
					technologies: input.technologies
				},
				source: 'mcp'
			},
			timeoutMs: 30000
		});

		const text = formatAuditReport(response);
		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to create audit'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

/**
 * Execute get_audit tool.
 */
export async function executeGetAudit(
	input: GetAuditInput
): Promise<{ text: string; isError?: boolean }> {
	requireApiKey();

	debug('Fetching audit', { auditId: input.auditId });

	try {
		const response = await apiRequest<AuditResponse>(`/api/v1/audits/${input.auditId}`);
		const text = formatAuditReport(response);
		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			if (err.code === ErrorCode.NOT_FOUND) {
				err.suggestions = [
					'Use list_audits to see your available audit reports.',
					'Create a new audit with create_audit.'
				];
			}
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to fetch audit'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

/**
 * Execute list_audits tool.
 */
export async function executeListAudits(
	input: ListAuditsInput
): Promise<{ text: string; isError?: boolean }> {
	requireApiKey();

	debug('Listing audits', { limit: input.limit, offset: input.offset });

	try {
		const response = await apiRequest<AuditListResponse>(
			`/api/v1/audits?limit=${input.limit}&offset=${input.offset}`
		);

		if (response.audits.length === 0) {
			return {
				text: `## Your Audits\n\nNo audit reports found. Create one with the \`create_audit\` tool.`
			};
		}

		let text = `## Your Audits (${response.audits.length} of ${response.total})\n\n`;
		text += `| Name | Health Score | Status | Created |\n`;
		text += `|------|-------------|--------|--------|\n`;

		for (const audit of response.audits) {
			const score = audit.summary?.healthScore ?? '-';
			const date = new Date(audit.createdAt).toLocaleDateString();
			text += `| ${audit.name} | ${score}/100 | ${audit.status} | ${date} |\n`;
		}

		if (response.total > response.audits.length) {
			text += `\n_Showing ${response.audits.length} of ${response.total} audits. Use offset parameter for more._`;
		}

		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to list audits'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

/**
 * Execute compare_audits tool.
 */
export async function executeCompareAudits(
	input: CompareAuditsInput
): Promise<{ text: string; isError?: boolean }> {
	requireApiKey();

	debug('Comparing audits', { base: input.baseAuditId, compare: input.compareAuditId });

	try {
		const response = await apiRequest<CompareResponse>('/api/v1/audits/compare', {
			method: 'POST',
			body: {
				baseAuditId: input.baseAuditId,
				compareAuditId: input.compareAuditId
			}
		});

		const text = formatComparison(response.comparison);
		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to compare audits'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

/**
 * Execute get_audit_quota tool.
 */
export async function executeGetAuditQuota(): Promise<{ text: string; isError?: boolean }> {
	requireApiKey();

	debug('Getting audit quota');

	try {
		const response = await apiRequest<QuotaResponse>('/api/v1/audits/quota');
		const { quota } = response;

		let text = `## Audit Quota\n\n`;
		text += `| Metric | Value |\n`;
		text += `|--------|-------|\n`;
		text += `| Used | ${quota.used} |\n`;
		text += `| Limit | ${quota.limit} |\n`;
		text += `| Remaining | ${quota.remaining} |\n`;

		if (quota.resetsAt) {
			text += `| Resets At | ${new Date(quota.resetsAt).toLocaleDateString()} |\n`;
		}

		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to get audit quota'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

/**
 * Execute get_migration_recommendation tool.
 */
export async function executeGetMigrationRecommendation(
	input: GetMigrationRecommendationInput
): Promise<{ text: string; isError?: boolean }> {
	requireApiKey();

	debug('Getting migration recommendation', { auditId: input.auditId });

	try {
		const response = await apiRequest<MigrationRecommendationResponse>(
			`/api/v1/audits/${input.auditId}/migration`
		);

		const text = formatMigrationRecommendation(response);
		return { text };
	} catch (err) {
		if (err instanceof McpError) {
			if (err.code === ErrorCode.NOT_FOUND) {
				err.suggestions = [
					'Use list_audits to see your available audit reports.',
					'Make sure the audit is completed before requesting migration analysis.',
					'Create a new audit with create_audit.'
				];
			}
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to get migration recommendation'
		);
		return { text: error.toResponseText(), isError: true };
	}
}
