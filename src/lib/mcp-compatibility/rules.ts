/**
 * MCP Compatibility Rules
 *
 * 30 initial rules covering common conflicts, redundancies, and synergies.
 * Rules are ordered alphabetically by pair key (mcpA < mcpB).
 */

import type { CompatibilityRule } from './types.js';

/**
 * All compatibility rules.
 * Each rule has mcpA < mcpB (alphabetically) for consistent indexing.
 */
export const COMPATIBILITY_RULES: CompatibilityRule[] = [
  // ============================================
  // DATABASE CONFLICTS (4 rules)
  // ============================================
  {
    id: 'db-001',
    mcpA: 'neon-mcp',
    mcpB: 'supabase-mcp',
    status: 'conflict',
    category: 'database',
    severity: 'critical',
    reason: 'Both provide managed PostgreSQL. Using multiple database providers increases complexity and cost.',
    solution: 'Choose one database provider. Neon for serverless scale, Supabase for full BaaS features.',
    recommendation: 'either',
  },
  {
    id: 'db-002',
    mcpA: 'planetscale-mcp',
    mcpB: 'supabase-mcp',
    status: 'conflict',
    category: 'database',
    severity: 'critical',
    reason: 'PlanetScale (MySQL) and Supabase (PostgreSQL) are different database paradigms.',
    solution: 'Choose one database. Consider query patterns and team expertise.',
    recommendation: 'either',
  },
  {
    id: 'db-003',
    mcpA: 'neon-mcp',
    mcpB: 'planetscale-mcp',
    status: 'conflict',
    category: 'database',
    severity: 'critical',
    reason: 'Neon (PostgreSQL) and PlanetScale (MySQL) are fundamentally different databases.',
    solution: 'Pick one based on your ORM preference and team experience.',
    recommendation: 'either',
  },
  {
    id: 'db-004',
    mcpA: 'neon-mcp',
    mcpB: 'turso-mcp',
    status: 'conflict',
    category: 'database',
    severity: 'warning',
    reason: 'Both are serverless databases. Turso (SQLite) vs Neon (PostgreSQL) serve different use cases.',
    solution: 'Use Turso for edge-first apps, Neon for traditional server workloads.',
    recommendation: 'either',
  },

  // ============================================
  // ORM REDUNDANCIES (3 rules)
  // ============================================
  {
    id: 'orm-001',
    mcpA: 'drizzle-mcp',
    mcpB: 'prisma-mcp',
    status: 'redundant',
    category: 'orm',
    severity: 'warning',
    reason: 'Both are TypeScript ORMs. Having two ORMs creates inconsistent data access patterns.',
    solution: 'Standardize on one ORM. Drizzle for SQL-first, Prisma for schema-first.',
    recommendation: 'either',
  },
  {
    id: 'orm-002',
    mcpA: 'prisma-mcp',
    mcpB: 'typeorm-mcp',
    status: 'redundant',
    category: 'orm',
    severity: 'warning',
    reason: 'Both are TypeScript ORMs with overlapping functionality.',
    solution: 'Choose Prisma for better DX, TypeORM for decorator-based entities.',
    recommendation: 'A',
  },
  {
    id: 'orm-003',
    mcpA: 'drizzle-mcp',
    mcpB: 'typeorm-mcp',
    status: 'redundant',
    category: 'orm',
    severity: 'warning',
    reason: 'Multiple ORMs add complexity without clear benefit.',
    solution: 'Standardize on Drizzle for modern SQL-like syntax.',
    recommendation: 'A',
  },

  // ============================================
  // AUTH CONFLICTS (3 rules)
  // ============================================
  {
    id: 'auth-001',
    mcpA: 'auth0-mcp',
    mcpB: 'clerk-mcp',
    status: 'conflict',
    category: 'auth',
    severity: 'warning',
    reason: 'Both are full auth providers. Using multiple auth systems is confusing for users.',
    solution: 'Choose Clerk for faster setup, Auth0 for enterprise compliance.',
    recommendation: 'either',
  },
  {
    id: 'auth-002',
    mcpA: 'clerk-mcp',
    mcpB: 'supabase-auth-mcp',
    status: 'redundant',
    category: 'auth',
    severity: 'info',
    reason: 'Both provide auth. Supabase Auth is included with Supabase, Clerk is standalone.',
    solution: 'Use Supabase Auth if using Supabase DB, Clerk if you need more auth features.',
    recommendation: 'either',
  },
  {
    id: 'auth-003',
    mcpA: 'auth0-mcp',
    mcpB: 'lucia-mcp',
    status: 'conflict',
    category: 'auth',
    severity: 'warning',
    reason: 'Auth0 is hosted auth, Lucia is self-hosted. Different paradigms.',
    solution: 'Use Auth0 for managed auth, Lucia for full control.',
    recommendation: 'either',
  },

  // ============================================
  // DATABASE + ORM SYNERGIES (4 rules)
  // ============================================
  {
    id: 'syn-001',
    mcpA: 'drizzle-mcp',
    mcpB: 'neon-mcp',
    status: 'synergy',
    category: 'database',
    severity: 'info',
    reason: 'Drizzle + Neon is a powerful serverless stack with excellent TypeScript support.',
    recommendation: 'both',
  },
  {
    id: 'syn-002',
    mcpA: 'drizzle-mcp',
    mcpB: 'turso-mcp',
    status: 'synergy',
    category: 'database',
    severity: 'info',
    reason: 'Drizzle has first-class Turso support for edge-first SQLite applications.',
    recommendation: 'both',
  },
  {
    id: 'syn-003',
    mcpA: 'prisma-mcp',
    mcpB: 'supabase-mcp',
    status: 'conditional',
    category: 'database',
    severity: 'info',
    reason: 'Prisma works with Supabase but requires proper connection pooling setup.',
    solution: 'Use Supabase connection pooler URL in Prisma schema.',
    recommendation: 'both',
  },
  {
    id: 'syn-004',
    mcpA: 'planetscale-mcp',
    mcpB: 'prisma-mcp',
    status: 'synergy',
    category: 'database',
    severity: 'info',
    reason: 'Prisma + PlanetScale is a well-documented, production-ready combination.',
    recommendation: 'both',
  },

  // ============================================
  // PLATFORM SYNERGIES (5 rules)
  // ============================================
  {
    id: 'syn-005',
    mcpA: 'github-mcp',
    mcpB: 'vercel-mcp',
    status: 'synergy',
    category: 'deployment',
    severity: 'info',
    reason: 'Vercel has native GitHub integration for automatic deployments.',
    recommendation: 'both',
    suggestWhenMissing: ['vercel-mcp'],
  },
  {
    id: 'syn-006',
    mcpA: 'cloudflare-mcp',
    mcpB: 'r2-mcp',
    status: 'synergy',
    category: 'storage',
    severity: 'info',
    reason: 'R2 is Cloudflare\'s S3-compatible storage, tightly integrated with Workers.',
    recommendation: 'both',
    suggestWhenMissing: ['r2-mcp'],
  },
  {
    id: 'syn-007',
    mcpA: 'resend-mcp',
    mcpB: 'stripe-mcp',
    status: 'synergy',
    category: 'payments',
    severity: 'info',
    reason: 'Stripe for payments + Resend for transactional emails (receipts, invoices).',
    recommendation: 'both',
    suggestWhenMissing: ['resend-mcp'],
  },
  {
    id: 'syn-008',
    mcpA: 'supabase-auth-mcp',
    mcpB: 'supabase-mcp',
    status: 'synergy',
    category: 'auth',
    severity: 'info',
    reason: 'Supabase Auth is built into Supabase and shares the same user context.',
    recommendation: 'both',
  },
  {
    id: 'syn-009',
    mcpA: 'github-mcp',
    mcpB: 'netlify-mcp',
    status: 'synergy',
    category: 'deployment',
    severity: 'info',
    reason: 'Netlify has native GitHub integration for CI/CD.',
    recommendation: 'both',
  },

  // ============================================
  // DEPLOYMENT REDUNDANCIES (3 rules)
  // ============================================
  {
    id: 'deploy-001',
    mcpA: 'netlify-mcp',
    mcpB: 'vercel-mcp',
    status: 'redundant',
    category: 'deployment',
    severity: 'warning',
    reason: 'Both are frontend deployment platforms with similar features.',
    solution: 'Choose Vercel for Next.js, Netlify for static sites and forms.',
    recommendation: 'either',
  },
  {
    id: 'deploy-002',
    mcpA: 'fly-mcp',
    mcpB: 'railway-mcp',
    status: 'redundant',
    category: 'deployment',
    severity: 'info',
    reason: 'Both are container deployment platforms targeting similar use cases.',
    solution: 'Choose Railway for simpler DX, Fly for more control.',
    recommendation: 'either',
  },
  {
    id: 'deploy-003',
    mcpA: 'cloudflare-mcp',
    mcpB: 'vercel-mcp',
    status: 'redundant',
    category: 'deployment',
    severity: 'info',
    reason: 'Both offer edge computing. Consider your framework support needs.',
    solution: 'Vercel for Next.js, Cloudflare for Workers/Pages.',
    recommendation: 'either',
  },

  // ============================================
  // PAYMENTS (2 rules)
  // ============================================
  {
    id: 'pay-001',
    mcpA: 'paddle-mcp',
    mcpB: 'stripe-mcp',
    status: 'conflict',
    category: 'payments',
    severity: 'warning',
    reason: 'Both are payment processors. Using multiple adds complexity.',
    solution: 'Paddle for MoR (handles taxes), Stripe for more control.',
    recommendation: 'either',
  },
  {
    id: 'pay-002',
    mcpA: 'lemonsqueezy-mcp',
    mcpB: 'paddle-mcp',
    status: 'redundant',
    category: 'payments',
    severity: 'info',
    reason: 'Both are Merchant of Record solutions with similar features.',
    solution: 'LemonSqueezy for creators, Paddle for SaaS.',
    recommendation: 'either',
  },

  // ============================================
  // AI MCPs (3 rules)
  // ============================================
  {
    id: 'ai-001',
    mcpA: 'anthropic-mcp',
    mcpB: 'openai-mcp',
    status: 'compatible',
    category: 'ai',
    severity: 'info',
    reason: 'Can use multiple AI providers for fallback or model comparison.',
    recommendation: 'both',
  },
  {
    id: 'ai-002',
    mcpA: 'context7-mcp',
    mcpB: 'perplexity-mcp',
    status: 'synergy',
    category: 'ai',
    severity: 'info',
    reason: 'Context7 for docs, Perplexity for web search - complementary capabilities.',
    recommendation: 'both',
  },
  {
    id: 'ai-003',
    mcpA: 'brave-search-mcp',
    mcpB: 'perplexity-mcp',
    status: 'redundant',
    category: 'ai',
    severity: 'info',
    reason: 'Both provide web search capabilities. Perplexity includes AI synthesis.',
    solution: 'Choose Perplexity for AI answers, Brave for raw search results.',
    recommendation: 'either',
  },

  // ============================================
  // VERSION CONTROL (1 rule)
  // ============================================
  {
    id: 'vcs-001',
    mcpA: 'github-mcp',
    mcpB: 'gitlab-mcp',
    status: 'conflict',
    category: 'version-control',
    severity: 'warning',
    reason: 'Using multiple Git platforms for the same project creates confusion.',
    solution: 'Standardize on one platform for your organization.',
    recommendation: 'either',
  },

  // ============================================
  // MONITORING (1 rule)
  // ============================================
  {
    id: 'mon-001',
    mcpA: 'datadog-mcp',
    mcpB: 'sentry-mcp',
    status: 'synergy',
    category: 'monitoring',
    severity: 'info',
    reason: 'Sentry for errors, Datadog for APM/metrics - different focus areas.',
    recommendation: 'both',
  },

  // ============================================
  // EMAIL (1 rule)
  // ============================================
  {
    id: 'email-001',
    mcpA: 'resend-mcp',
    mcpB: 'sendgrid-mcp',
    status: 'redundant',
    category: 'email',
    severity: 'info',
    reason: 'Both are transactional email services with similar capabilities.',
    solution: 'Choose Resend for modern DX, SendGrid for enterprise scale.',
    recommendation: 'A',
  },
];

/**
 * Get all rules (for initialization)
 */
export function getAllRules(): CompatibilityRule[] {
  return COMPATIBILITY_RULES;
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category: string): CompatibilityRule[] {
  return COMPATIBILITY_RULES.filter((rule) => rule.category === category);
}

/**
 * Get rules by status
 */
export function getRulesByStatus(status: string): CompatibilityRule[] {
  return COMPATIBILITY_RULES.filter((rule) => rule.status === status);
}

/**
 * List of curated popular MCPs for the matrix UI
 */
export const CURATED_MCPS = [
  // Database
  'supabase-mcp',
  'neon-mcp',
  'planetscale-mcp',
  'turso-mcp',

  // ORM
  'prisma-mcp',
  'drizzle-mcp',

  // Auth
  'clerk-mcp',
  'auth0-mcp',

  // Payments
  'stripe-mcp',
  'paddle-mcp',

  // Deployment
  'vercel-mcp',
  'netlify-mcp',
  'cloudflare-mcp',

  // AI
  'openai-mcp',
  'anthropic-mcp',
  'context7-mcp',

  // Version Control
  'github-mcp',

  // Email
  'resend-mcp',

  // Monitoring
  'sentry-mcp',
];
