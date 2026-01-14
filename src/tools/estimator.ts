import { z } from 'zod';
import { apiRequest } from '../utils/api-client.js';
import { McpError, ErrorCode, checkProAccess } from '../utils/errors.js';
import { debug } from '../utils/logger.js';

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Input schema for estimate_project tool.
 */
export const EstimateProjectInputSchema = z.object({
	specs: z
		.string()
		.min(100, 'Specifications must be at least 100 characters')
		.max(10000, 'Specifications must be at most 10,000 characters')
		.describe('Project specifications or requirements (free text, min 100 chars)'),
	teamSize: z.number().min(1).max(100).optional().describe('Number of developers on the team'),
	seniorityLevel: z
		.enum(['junior', 'mid', 'senior', 'expert'])
		.optional()
		.default('mid')
		.describe('Average seniority level of the team'),
	region: z
		.enum(['france', 'us', 'uk', 'remote-global'])
		.optional()
		.default('france')
		.describe('Region for pricing reference'),
	includeMarket: z.boolean().optional().default(true).describe('Include market analysis')
});

export type EstimateProjectInput = z.infer<typeof EstimateProjectInputSchema>;

/**
 * Input schema for get_estimate_quota tool.
 */
export const GetEstimateQuotaInputSchema = z.object({});

export type GetEstimateQuotaInput = z.infer<typeof GetEstimateQuotaInputSchema>;

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const estimateProjectToolDefinition = {
	name: 'estimate_project',
	description: `Estimate scope, pricing, and analyze market for a software project.

Provides:
- Detailed hour breakdown by feature (with complexity assessment)
- Price ranges by team seniority level (junior/mid/senior/expert)
- Competitor analysis and market trends (real-time via Perplexity)
- Market size and gaps identification
- Risk identification with mitigation suggestions

Perfect for freelancers and agencies creating quotes.

**Pricing is 100% deterministic** - same inputs always produce same outputs.
Market analysis is best-effort and may vary with web data changes.`,
	inputSchema: {
		type: 'object' as const,
		properties: {
			specs: {
				type: 'string',
				description: 'Project specifications (min 100 chars, max 10,000)'
			},
			teamSize: {
				type: 'number',
				description: 'Number of developers (optional)'
			},
			seniorityLevel: {
				type: 'string',
				enum: ['junior', 'mid', 'senior', 'expert'],
				description: 'Average team seniority (default: mid)'
			},
			region: {
				type: 'string',
				enum: ['france', 'us', 'uk', 'remote-global'],
				description: 'Region for pricing (default: france)'
			},
			includeMarket: {
				type: 'boolean',
				description: 'Include market analysis (default: true)'
			}
		},
		required: ['specs']
	}
};

export const getEstimateQuotaToolDefinition = {
	name: 'get_estimate_quota',
	description: 'Check your remaining estimate quota for this week and month.',
	inputSchema: {
		type: 'object' as const,
		properties: {},
		required: []
	}
};

// ============================================================================
// API TYPES
// ============================================================================

interface EstimateApiResponse {
	estimate: {
		id: string;
		createdAt: string;
		inputsHash: string;
		pricingTableVersion: string;
		determinism: {
			pricing: true;
			scope: 'schema-stabilized';
			market: false;
		};
		scope: {
			totalHours: { min: number; max: number };
			breakdown: Array<{
				name: string;
				description: string;
				hours: { min: number; max: number };
				complexity: string;
			}>;
			buffer: { hours: { min: number; max: number }; percentage: number };
			complexity: string;
			risks: Array<{
				id: string;
				severity: string;
				description: string;
				mitigation?: string;
			}>;
			assumptions: string[];
			projectType?: string;
			industry?: string;
		};
		pricing: {
			currency: string;
			byProfile: Record<string, { min: number; max: number }>;
			adjustments: Array<{ id: string; label: string; percentage: number; applied: boolean }>;
			adjustmentMultiplier: number;
			recommended: number;
			hoursPerDay: number;
		};
		market?: {
			status: string;
			competitors: Array<{
				name: string;
				url: string;
				pricing: string;
				positioning: string;
			}>;
			marketSize: string;
			trends: string[];
			gaps: string[];
			suggestedPricing: string;
			sources: Array<{ title: string; url: string }>;
			disclaimer: string;
		};
		confidence: number;
		warnings: string[];
	};
	_meta: {
		tier: string;
		marketIncluded: boolean;
		pricingTableVersion: string;
		cached: boolean;
	};
}

interface QuotaApiResponse {
	quota: {
		estimates: {
			weekly: { used: number; limit: number; remaining: number; resetsAt: string };
			monthly: { used: number; limit: number; remaining: number; resetsAt: string };
		};
		marketAnalysis: {
			available: boolean;
			used: number;
			limit: number;
			remaining: number;
		};
		tier: string;
	};
}

// ============================================================================
// EXECUTE FUNCTIONS
// ============================================================================

/**
 * Execute estimate_project tool.
 */
export async function executeEstimateProject(
	input: EstimateProjectInput
): Promise<{ text: string; isError?: boolean }> {
	// Check Pro access
	const tierCheck = await checkProAccess('estimate_project');
	if (tierCheck) return tierCheck;

	debug(`[estimate_project] Estimating project (${input.specs.length} chars)`);

	try {
		const response = await apiRequest<EstimateApiResponse>('/api/v1/estimate', {
			method: 'POST',
			body: {
				specs: input.specs,
				teamSize: input.teamSize,
				seniorityLevel: input.seniorityLevel,
				region: input.region,
				includeMarket: input.includeMarket
			},
			timeoutMs: 60000 // 60s timeout for LLM calls
		});

		return { text: formatEstimateResult(response) };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to generate estimate'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

/**
 * Execute get_estimate_quota tool.
 */
export async function executeGetEstimateQuota(
	_input: GetEstimateQuotaInput
): Promise<{ text: string; isError?: boolean }> {
	// Check Pro access
	const tierCheck = await checkProAccess('get_estimate_quota');
	if (tierCheck) return tierCheck;

	debug('[get_estimate_quota] Fetching quota');

	try {
		const response = await apiRequest<QuotaApiResponse>('/api/v1/estimate', {
			method: 'GET'
		});

		return { text: formatQuotaResult(response) };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}
		const error = new McpError(
			ErrorCode.API_ERROR,
			err instanceof Error ? err.message : 'Failed to fetch quota'
		);
		return { text: error.toResponseText(), isError: true };
	}
}

// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Format estimate result as markdown.
 */
function formatEstimateResult(response: EstimateApiResponse): string {
	const { estimate, _meta } = response;
	const { scope, pricing, market } = estimate;

	let text = `## Project Estimate\n\n`;
	text += `**ID**: \`${estimate.id}\`\n`;
	text += `**Confidence**: ${estimate.confidence}%\n`;
	text += `**Pricing Table Version**: ${estimate.pricingTableVersion}\n\n`;

	// Warnings
	if (estimate.warnings.length > 0) {
		text += `### Warnings\n\n`;
		for (const w of estimate.warnings) {
			text += `- ${w}\n`;
		}
		text += `\n`;
	}

	// Scope
	text += `### Scope Analysis\n\n`;
	text += `**Total Hours**: ${scope.totalHours.min} - ${scope.totalHours.max}h\n`;
	text += `**Complexity**: ${scope.complexity}\n`;
	text += `**Buffer**: ${scope.buffer.percentage}% (${scope.buffer.hours.min}-${scope.buffer.hours.max}h)\n\n`;

	// Feature breakdown
	text += `#### Feature Breakdown\n\n`;
	text += `| Feature | Hours | Complexity |\n`;
	text += `|---------|-------|------------|\n`;
	for (const f of scope.breakdown) {
		text += `| ${f.name} | ${f.hours.min}-${f.hours.max}h | ${f.complexity} |\n`;
	}
	text += `\n`;

	// Assumptions
	if (scope.assumptions.length > 0) {
		text += `#### Assumptions\n\n`;
		for (const a of scope.assumptions) {
			text += `- ${a}\n`;
		}
		text += `\n`;
	}

	// Pricing
	text += `### Pricing (${pricing.currency})\n\n`;
	text += `| Seniority | Min | Max |\n`;
	text += `|-----------|-----|-----|\n`;
	for (const [level, range] of Object.entries(pricing.byProfile)) {
		text += `| ${level} | ${formatCurrency(range.min, pricing.currency)} | ${formatCurrency(range.max, pricing.currency)} |\n`;
	}
	text += `\n`;

	// Recommended price (single win-win value)
	if (pricing.recommended) {
		text += `**💰 Prix recommandé**: ${formatCurrency(pricing.recommended, pricing.currency)}\n\n`;
	}

	// Adjustments
	const appliedAdj = pricing.adjustments.filter((a) => a.applied);
	if (appliedAdj.length > 0) {
		text += `**Adjustments Applied** (×${pricing.adjustmentMultiplier}):\n`;
		for (const adj of appliedAdj) {
			text += `- ${adj.label}: +${Math.round(adj.percentage * 100)}%\n`;
		}
		text += `\n`;
	}

	// Market (Pro only)
	if (market && market.status === 'ok') {
		text += `### Market Analysis\n\n`;

		// Competitors
		if (market.competitors.length > 0) {
			text += `#### Competitors\n\n`;
			for (const c of market.competitors) {
				text += `- **${c.name}** (${c.pricing}) - ${c.positioning}\n`;
			}
			text += `\n`;
		}

		// Market size
		if (market.marketSize) {
			text += `**Market Size**: ${market.marketSize}\n\n`;
		}

		// Trends
		if (market.trends.length > 0) {
			text += `**Trends**:\n`;
			for (const t of market.trends) {
				text += `- ${t}\n`;
			}
			text += `\n`;
		}

		// Gaps
		if (market.gaps.length > 0) {
			text += `**Gaps/Opportunities**:\n`;
			for (const g of market.gaps) {
				text += `- ${g}\n`;
			}
			text += `\n`;
		}

		// Suggested pricing
		if (market.suggestedPricing) {
			text += `**Suggested Pricing**: ${market.suggestedPricing}\n\n`;
		}

		// Sources
		if (market.sources.length > 0) {
			text += `_Sources: ${market.sources.map((s) => s.title).join(', ')}_\n\n`;
		}

		text += `_${market.disclaimer}_\n\n`;
	} else if (!_meta.marketIncluded) {
		text += `### Market Analysis\n\n`;
		text += `_Market analysis not included in this request._\n\n`;
	}

	// Risks
	if (scope.risks.length > 0) {
		text += `### Risks\n\n`;
		for (const r of scope.risks) {
			text += `- **[${r.severity.toUpperCase()}]** ${r.description}\n`;
			if (r.mitigation) {
				text += `  _Mitigation_: ${r.mitigation}\n`;
			}
		}
		text += `\n`;
	}

	// Disclaimer
	text += `---\n`;
	text += `_Estimates are indicative. Always validate with an expert before quoting clients._\n`;
	text += `_Pricing is 100% deterministic. Market analysis may vary with web data._\n`;

	return text;
}

/**
 * Format quota result as markdown.
 */
function formatQuotaResult(response: QuotaApiResponse): string {
	const { quota } = response;

	let text = `## Estimate Quota Status\n\n`;
	text += `**Tier**: ${quota.tier}\n\n`;

	// Estimates
	text += `### Estimates\n\n`;
	text += `| Period | Used | Limit | Remaining | Resets |\n`;
	text += `|--------|------|-------|-----------|--------|\n`;
	text += `| Weekly | ${quota.estimates.weekly.used} | ${formatLimit(quota.estimates.weekly.limit)} | ${formatLimit(quota.estimates.weekly.remaining)} | ${formatDate(quota.estimates.weekly.resetsAt)} |\n`;
	text += `| Monthly | ${quota.estimates.monthly.used} | ${formatLimit(quota.estimates.monthly.limit)} | ${formatLimit(quota.estimates.monthly.remaining)} | ${formatDate(quota.estimates.monthly.resetsAt)} |\n`;
	text += `\n`;

	// Market analysis
	text += `### Market Analysis\n\n`;
	if (quota.marketAnalysis.available) {
		text += `**Available**: Yes\n`;
		text += `**Used this month**: ${quota.marketAnalysis.used}\n`;
		text += `**Limit**: ${formatLimit(quota.marketAnalysis.limit)}\n`;
		text += `**Remaining**: ${formatLimit(quota.marketAnalysis.remaining)}\n`;
	} else {
		text += `**Available**: No\n`;
	}

	return text;
}

/**
 * Format currency amount.
 */
function formatCurrency(amount: number, currency: string): string {
	return new Intl.NumberFormat(currency === 'EUR' ? 'fr-FR' : 'en-US', {
		style: 'currency',
		currency,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Format limit (handle unlimited).
 */
function formatLimit(limit: number): string {
	return limit === -1 || !isFinite(limit) ? '∞' : String(limit);
}

/**
 * Format ISO date to readable format.
 */
function formatDate(isoDate: string): string {
	try {
		return new Date(isoDate).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	} catch {
		return isoDate;
	}
}
