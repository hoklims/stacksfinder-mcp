/**
 * MCP Compatibility Utilities
 *
 * Canonical matching utilities for consistent MCP identification.
 */

import type { CompatibilityRule, MatchedRule } from './types.js';

/**
 * Aliases map for common MCP name variations.
 * Keys are normalized (lowercase, trimmed), values are canonical IDs.
 */
export const MCP_ALIASES: Record<string, string> = {
  // Database MCPs
  supabase: 'supabase-mcp',
  '@supabase/mcp': 'supabase-mcp',
  '@supabase/mcp-server': 'supabase-mcp',
  neon: 'neon-mcp',
  '@neondatabase/mcp': 'neon-mcp',
  '@neondatabase/mcp-server': 'neon-mcp',
  planetscale: 'planetscale-mcp',
  '@planetscale/mcp': 'planetscale-mcp',
  turso: 'turso-mcp',
  '@tursodb/mcp': 'turso-mcp',
  mongodb: 'mongodb-mcp',
  '@mongodb/mcp': 'mongodb-mcp',

  // ORM MCPs
  prisma: 'prisma-mcp',
  '@prisma/mcp': 'prisma-mcp',
  drizzle: 'drizzle-mcp',
  'drizzle-orm': 'drizzle-mcp',
  typeorm: 'typeorm-mcp',

  // Auth MCPs
  clerk: 'clerk-mcp',
  '@clerk/mcp': 'clerk-mcp',
  auth0: 'auth0-mcp',
  '@auth0/mcp': 'auth0-mcp',
  'supabase-auth': 'supabase-auth-mcp',
  lucia: 'lucia-mcp',

  // Payments MCPs
  stripe: 'stripe-mcp',
  '@stripe/mcp': 'stripe-mcp',
  paddle: 'paddle-mcp',
  '@paddle/mcp': 'paddle-mcp',
  lemonsqueezy: 'lemonsqueezy-mcp',
  'lemon-squeezy': 'lemonsqueezy-mcp',

  // Deployment MCPs
  vercel: 'vercel-mcp',
  '@vercel/mcp': 'vercel-mcp',
  netlify: 'netlify-mcp',
  '@netlify/mcp': 'netlify-mcp',
  cloudflare: 'cloudflare-mcp',
  '@cloudflare/mcp': 'cloudflare-mcp',
  railway: 'railway-mcp',
  fly: 'fly-mcp',
  'fly.io': 'fly-mcp',
  render: 'render-mcp',

  // Storage MCPs
  r2: 'r2-mcp',
  'cloudflare-r2': 'r2-mcp',
  s3: 's3-mcp',
  'aws-s3': 's3-mcp',
  uploadthing: 'uploadthing-mcp',

  // Email MCPs
  resend: 'resend-mcp',
  '@resend/mcp': 'resend-mcp',
  sendgrid: 'sendgrid-mcp',
  postmark: 'postmark-mcp',

  // Version Control MCPs
  github: 'github-mcp',
  '@github/mcp': 'github-mcp',
  gitlab: 'gitlab-mcp',
  '@gitlab/mcp': 'gitlab-mcp',

  // AI MCPs
  openai: 'openai-mcp',
  '@openai/mcp': 'openai-mcp',
  anthropic: 'anthropic-mcp',
  '@anthropic/mcp': 'anthropic-mcp',
  perplexity: 'perplexity-mcp',
  context7: 'context7-mcp',

  // Communication MCPs
  slack: 'slack-mcp',
  '@slack/mcp': 'slack-mcp',
  discord: 'discord-mcp',
  telegram: 'telegram-mcp',

  // Monitoring MCPs
  sentry: 'sentry-mcp',
  '@sentry/mcp': 'sentry-mcp',
  datadog: 'datadog-mcp',

  // Testing MCPs
  playwright: 'playwright-mcp',
  '@playwright/mcp': 'playwright-mcp',
  puppeteer: 'puppeteer-mcp',

  // Documentation MCPs
  obsidian: 'obsidian-mcp',
  notion: 'notion-mcp',
  confluence: 'confluence-mcp',

  // General MCPs
  filesystem: 'filesystem-mcp',
  'sequential-thinking': 'sequential-thinking-mcp',
  'brave-search': 'brave-search-mcp',
};

/**
 * Canonicalize an MCP ID to a consistent format.
 *
 * @param id - The MCP ID to canonicalize (e.g., "supabase", "@supabase/mcp")
 * @returns The canonical ID (e.g., "supabase-mcp")
 */
export function canonicalizeMcpId(id: string): string {
  const normalized = id.toLowerCase().trim();
  return MCP_ALIASES[normalized] ?? normalized;
}

/**
 * Generate a consistent pair key for two MCPs.
 * The key is ordered alphabetically to ensure A/B and B/A produce the same key.
 *
 * @param a - First MCP ID
 * @param b - Second MCP ID
 * @returns Pair key in format "mcpA::mcpB" (alphabetically ordered)
 */
export function pairKey(a: string, b: string): string {
  const canonA = canonicalizeMcpId(a);
  const canonB = canonicalizeMcpId(b);
  const [first, second] = [canonA, canonB].sort();
  return `${first}::${second}`;
}

/**
 * Rules indexed by pair key for O(1) lookup.
 * Populated by initRulesIndex().
 */
let RULES_BY_PAIR: Map<string, CompatibilityRule> = new Map();

/**
 * Initialize the rules index from an array of rules.
 * Must be called before using findRule().
 *
 * @param rules - Array of compatibility rules
 */
export function initRulesIndex(rules: CompatibilityRule[]): void {
  RULES_BY_PAIR = new Map();
  for (const rule of rules) {
    const key = pairKey(rule.mcpA, rule.mcpB);
    RULES_BY_PAIR.set(key, rule);
  }
}

/**
 * Get the rules index (for testing).
 */
export function getRulesIndex(): Map<string, CompatibilityRule> {
  return RULES_BY_PAIR;
}

/**
 * Find a compatibility rule for two MCPs.
 * Order doesn't matter: findRule(A, B) === findRule(B, A)
 *
 * @param a - First MCP ID (can be any alias)
 * @param b - Second MCP ID (can be any alias)
 * @returns The matching rule, or undefined if no rule exists
 */
export function findRule(a: string, b: string): CompatibilityRule | undefined {
  const key = pairKey(a, b);
  return RULES_BY_PAIR.get(key);
}

/**
 * Generate all unique pairs from an array of MCPs.
 * Used to check all nC2 combinations.
 *
 * @param mcps - Array of MCP IDs
 * @returns Array of [mcpA, mcpB] pairs
 */
export function generatePairs(mcps: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < mcps.length; i++) {
    for (let j = i + 1; j < mcps.length; j++) {
      pairs.push([mcps[i], mcps[j]]);
    }
  }
  return pairs;
}

/**
 * Check all pairs of MCPs for compatibility issues.
 *
 * @param mcps - Array of MCP IDs to check
 * @returns Object with categorized matched rules
 */
export function checkAllPairs(mcps: string[]): {
  conflicts: MatchedRule[];
  redundancies: MatchedRule[];
  synergies: MatchedRule[];
  conditionals: MatchedRule[];
} {
  const conflicts: MatchedRule[] = [];
  const redundancies: MatchedRule[] = [];
  const synergies: MatchedRule[] = [];
  const conditionals: MatchedRule[] = [];

  const pairs = generatePairs(mcps);

  for (const [a, b] of pairs) {
    const rule = findRule(a, b);
    if (rule) {
      const matched: MatchedRule = {
        rule,
        inputA: a,
        inputB: b,
      };

      switch (rule.status) {
        case 'conflict':
          conflicts.push(matched);
          break;
        case 'redundant':
          redundancies.push(matched);
          break;
        case 'synergy':
          synergies.push(matched);
          break;
        case 'conditional':
          conditionals.push(matched);
          break;
        // 'compatible' - no action needed
      }
    }
  }

  return { conflicts, redundancies, synergies, conditionals };
}

/**
 * Get suggestions based on synergy rules.
 * If user has MCP A and rule says A+B is a synergy,
 * suggest B if user doesn't have it.
 *
 * @param mcps - Array of installed MCP IDs
 * @param allRules - All compatibility rules
 * @returns Array of suggestions
 */
export function getSuggestions(
  mcps: string[],
  allRules: CompatibilityRule[]
): { mcp: string; reason: string; basedOn: string }[] {
  const suggestions: { mcp: string; reason: string; basedOn: string }[] = [];
  const canonicalMcps = new Set(mcps.map(canonicalizeMcpId));
  const suggestedSet = new Set<string>();

  // Find synergy rules where user has one but not the other
  for (const rule of allRules) {
    if (rule.status !== 'synergy') continue;

    const hasA = canonicalMcps.has(rule.mcpA);
    const hasB = canonicalMcps.has(rule.mcpB);

    // If user has A but not B
    if (hasA && !hasB && !suggestedSet.has(rule.mcpB)) {
      suggestions.push({
        mcp: rule.mcpB,
        reason: rule.reason,
        basedOn: rule.mcpA,
      });
      suggestedSet.add(rule.mcpB);
    }

    // If user has B but not A
    if (hasB && !hasA && !suggestedSet.has(rule.mcpA)) {
      suggestions.push({
        mcp: rule.mcpA,
        reason: rule.reason,
        basedOn: rule.mcpB,
      });
      suggestedSet.add(rule.mcpA);
    }

    // Check suggestWhenMissing field
    if (rule.suggestWhenMissing && (hasA || hasB)) {
      for (const suggested of rule.suggestWhenMissing) {
        const canonSuggested = canonicalizeMcpId(suggested);
        if (!canonicalMcps.has(canonSuggested) && !suggestedSet.has(canonSuggested)) {
          suggestions.push({
            mcp: canonSuggested,
            reason: `Pairs well with ${hasA ? rule.mcpA : rule.mcpB}`,
            basedOn: hasA ? rule.mcpA : rule.mcpB,
          });
          suggestedSet.add(canonSuggested);
        }
      }
    }
  }

  return suggestions;
}
