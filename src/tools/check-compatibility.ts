/**
 * MCP Compatibility Check Tool
 *
 * Free tier tool that checks compatibility between a set of MCP servers.
 * Detects conflicts, redundancies, and synergies.
 * Returns both markdown text and structured JSON data.
 */

import { z } from 'zod';
import {
  initRulesIndex,
  getAllRules,
  generateReport,
  formatReportAsMarkdown,
  getReportSummaryLine,
  CURATED_MCPS,
  type CompatibilityReport,
} from '@stacksfinder/mcp-compatibility';

// ============================================
// Input Schema
// ============================================

export const CheckCompatibilityInputSchema = z.object({
  mcps: z
    .array(z.string().min(1))
    .min(1)
    .max(20)
    .describe('Array of MCP server IDs to check compatibility between'),
});

export type CheckCompatibilityInput = z.infer<typeof CheckCompatibilityInputSchema>;

// ============================================
// Output Types
// ============================================

export interface CheckCompatibilityOutput {
  text: string;
  data: CompatibilityReport;
  isError?: boolean;
}

// ============================================
// Tool Definition
// ============================================

export const checkCompatibilityToolDefinition = {
  name: 'check_mcp_compatibility',
  description: `Check compatibility between MCP servers. Detects conflicts (e.g., two database providers), redundancies (e.g., two ORMs), and synergies (e.g., GitHub + Vercel).

Returns a health score (0-100) with grade (A/B/C/D) and detailed breakdown.

**Examples:**
- Check database compatibility: \`["supabase-mcp", "neon-mcp"]\` → conflict detected
- Check ORM redundancy: \`["prisma-mcp", "drizzle-mcp"]\` → redundancy warning
- Check synergies: \`["stripe-mcp", "resend-mcp"]\` → synergy detected

**Supported MCP IDs include:**
${CURATED_MCPS.slice(0, 10).map((mcp) => `- ${mcp}`).join('\n')}
...and more.

**Aliases supported:**
- "supabase" → "supabase-mcp"
- "@neondatabase/mcp" → "neon-mcp"
- "stripe" → "stripe-mcp"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      mcps: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 20,
        description: 'Array of MCP server IDs to check compatibility between',
      },
    },
    required: ['mcps'],
  },
};

// ============================================
// Initialize Rules Index
// ============================================

let rulesInitialized = false;

function ensureRulesInitialized(): void {
  if (!rulesInitialized) {
    initRulesIndex(getAllRules());
    rulesInitialized = true;
  }
}

// ============================================
// Execute Function
// ============================================

export function executeCheckCompatibility(
  input: CheckCompatibilityInput
): CheckCompatibilityOutput {
  try {
    // Validate input
    const parsed = CheckCompatibilityInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        text: `Invalid input: ${parsed.error.message}`,
        data: {
          analyzedMcps: [],
          summary: {
            total: 0,
            conflicts: 0,
            redundancies: 0,
            synergies: 0,
            score: 0,
            grade: 'D',
          },
          conflicts: [],
          redundancies: [],
          synergies: [],
          suggestions: [],
        },
        isError: true,
      };
    }

    const { mcps } = parsed.data;

    // Initialize rules index
    ensureRulesInitialized();

    // Generate compatibility report
    const report = generateReport(mcps, getAllRules());

    // Format as markdown
    const markdown = formatReportAsMarkdown(report);

    // Add summary line at the top
    const summaryLine = getReportSummaryLine(report);
    const text = `${summaryLine}\n\n${markdown}`;

    return {
      text,
      data: report,
      isError: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      text: `Error checking compatibility: ${errorMessage}`,
      data: {
        analyzedMcps: [],
        summary: {
          total: 0,
          conflicts: 0,
          redundancies: 0,
          synergies: 0,
          score: 0,
          grade: 'D',
        },
        conflicts: [],
        redundancies: [],
        synergies: [],
        suggestions: [],
      },
      isError: true,
    };
  }
}
