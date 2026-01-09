/**
 * Stack Detection Module
 *
 * Detects technologies from project files using pattern matching.
 * Each detection rule parses a specific file type and returns detected technologies.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Detection, DetectionRule, DetectedStack, DetectedTech, TechType } from './types.js';
import { debug, warn } from '../../utils/logger.js';

// ============================================================================
// PACKAGE.JSON PARSER
// ============================================================================

function parsePackageJson(content: string): Detection[] {
	try {
		const pkg = JSON.parse(content);
		const deps = { ...pkg.dependencies, ...pkg.devDependencies };
		const detections: Detection[] = [];

		// Frontend frameworks
		const frontendMappings: Record<string, string> = {
			svelte: 'svelte',
			'@sveltejs/kit': 'sveltekit',
			react: 'react',
			next: 'nextjs',
			vue: 'vue',
			nuxt: 'nuxt',
			'@angular/core': 'angular',
			'solid-js': 'solidjs',
			astro: 'astro',
			remix: 'remix'
		};

		for (const [pkg, tech] of Object.entries(frontendMappings)) {
			if (deps[pkg]) {
				detections.push({
					type: 'frontend',
					name: tech,
					version: deps[pkg],
					confidence: 1,
					source: 'package.json'
				});
			}
		}

		// Backend/Runtime
		const backendMappings: Record<string, string> = {
			express: 'express',
			fastify: 'fastify',
			hono: 'hono',
			elysia: 'elysia',
			'@nestjs/core': 'nestjs',
			'@hono/node-server': 'hono',
			koa: 'koa'
		};

		for (const [pkg, tech] of Object.entries(backendMappings)) {
			if (deps[pkg]) {
				detections.push({
					type: 'backend',
					name: tech,
					version: deps[pkg],
					confidence: 1,
					source: 'package.json'
				});
			}
		}

		// ORMs / Database clients
		const ormMappings: Record<string, string> = {
			'drizzle-orm': 'drizzle',
			prisma: 'prisma',
			'@prisma/client': 'prisma',
			typeorm: 'typeorm',
			kysely: 'kysely',
			mongoose: 'mongodb'
		};

		for (const [pkg, tech] of Object.entries(ormMappings)) {
			if (deps[pkg]) {
				detections.push({
					type: 'orm',
					name: tech,
					version: deps[pkg],
					confidence: 1,
					source: 'package.json'
				});
			}
		}

		// Auth libraries
		const authMappings: Record<string, string> = {
			'@clerk/nextjs': 'clerk',
			'@clerk/svelte': 'clerk',
			'@auth/core': 'authjs',
			'next-auth': 'authjs',
			'lucia-auth': 'lucia',
			lucia: 'lucia',
			'better-auth': 'better-auth',
			'@supabase/auth-helpers-sveltekit': 'supabase',
			'@supabase/auth-helpers-nextjs': 'supabase'
		};

		for (const [pkg, tech] of Object.entries(authMappings)) {
			if (deps[pkg]) {
				detections.push({
					type: 'auth',
					name: tech,
					version: deps[pkg],
					confidence: 1,
					source: 'package.json'
				});
			}
		}

		// Payment services
		const paymentMappings: Record<string, string> = {
			stripe: 'stripe',
			'@stripe/stripe-js': 'stripe',
			'@paddle/paddle-js': 'paddle',
			'@lemonsqueezy/lemonsqueezy.js': 'lemonsqueezy'
		};

		for (const [pkg, tech] of Object.entries(paymentMappings)) {
			if (deps[pkg]) {
				detections.push({
					type: 'payments',
					name: tech,
					version: deps[pkg],
					confidence: 1,
					source: 'package.json'
				});
			}
		}

		// Services (SaaS)
		const serviceMappings: Record<string, string> = {
			'@supabase/supabase-js': 'supabase',
			'@vercel/analytics': 'vercel',
			'@vercel/og': 'vercel',
			'@vercel/postgres': 'vercel',
			'@sentry/node': 'sentry',
			'@sentry/svelte': 'sentry',
			'@sentry/nextjs': 'sentry',
			resend: 'resend',
			'@neon/serverless': 'neon',
			'@neondatabase/serverless': 'neon',
			'@upstash/redis': 'upstash',
			'@upstash/ratelimit': 'upstash',
			'@planetscale/database': 'planetscale',
			'posthog-js': 'posthog',
			'posthog-node': 'posthog',
			'@octokit/rest': 'github',
			'@slack/web-api': 'slack',
			'@notionhq/client': 'notion',
			'@linear/sdk': 'linear',
			openai: 'openai',
			'@anthropic-ai/sdk': 'anthropic',
			cloudflare: 'cloudflare',
			'@aws-sdk/client-s3': 'aws',
			firebase: 'firebase',
			'firebase-admin': 'firebase',
			'@google-cloud/firestore': 'firebase',
			appwrite: 'appwrite',
			'@playwright/test': 'playwright',
			playwright: 'playwright',
			puppeteer: 'puppeteer'
		};

		for (const [pkg, tech] of Object.entries(serviceMappings)) {
			if (deps[pkg]) {
				detections.push({
					type: 'service',
					name: tech,
					version: deps[pkg],
					confidence: 1,
					source: 'package.json'
				});
			}
		}

		return detections;
	} catch {
		warn('Failed to parse package.json');
		return [];
	}
}

// ============================================================================
// ENV FILE PARSER
// ============================================================================

function parseEnvFile(content: string): Detection[] {
	const detections: Detection[] = [];

	const envMappings: Array<{ pattern: RegExp; tech: string; type: TechType }> = [
		// Database services
		{ pattern: /SUPABASE_URL/i, tech: 'supabase', type: 'service' },
		{ pattern: /SUPABASE_KEY/i, tech: 'supabase', type: 'service' },
		{ pattern: /SUPABASE_ANON_KEY/i, tech: 'supabase', type: 'service' },
		{ pattern: /DATABASE_URL.*neon/i, tech: 'neon', type: 'database' },
		{ pattern: /DATABASE_URL.*supabase/i, tech: 'supabase', type: 'database' },
		{ pattern: /DATABASE_URL.*planetscale/i, tech: 'planetscale', type: 'database' },
		{ pattern: /NEON_/i, tech: 'neon', type: 'service' },
		{ pattern: /PLANETSCALE_/i, tech: 'planetscale', type: 'service' },

		// Payment services
		{ pattern: /STRIPE_SECRET/i, tech: 'stripe', type: 'payments' },
		{ pattern: /STRIPE_WEBHOOK/i, tech: 'stripe', type: 'payments' },
		{ pattern: /STRIPE_PUBLISHABLE/i, tech: 'stripe', type: 'payments' },
		{ pattern: /PADDLE_/i, tech: 'paddle', type: 'payments' },
		{ pattern: /LEMONSQUEEZY_/i, tech: 'lemonsqueezy', type: 'payments' },

		// Auth services
		{ pattern: /CLERK_/i, tech: 'clerk', type: 'auth' },
		{ pattern: /AUTH0_/i, tech: 'auth0', type: 'auth' },
		{ pattern: /NEXTAUTH_/i, tech: 'authjs', type: 'auth' },

		// Email/Communication
		{ pattern: /RESEND_API/i, tech: 'resend', type: 'service' },
		{ pattern: /SENDGRID_/i, tech: 'sendgrid', type: 'service' },
		{ pattern: /SLACK_/i, tech: 'slack', type: 'service' },
		{ pattern: /DISCORD_/i, tech: 'discord', type: 'service' },

		// Monitoring/Analytics
		{ pattern: /SENTRY_DSN/i, tech: 'sentry', type: 'service' },
		{ pattern: /POSTHOG_/i, tech: 'posthog', type: 'service' },
		{ pattern: /DATADOG_/i, tech: 'datadog', type: 'service' },

		// Productivity/Collaboration
		{ pattern: /NOTION_/i, tech: 'notion', type: 'service' },
		{ pattern: /LINEAR_/i, tech: 'linear', type: 'service' },
		{ pattern: /GITHUB_TOKEN/i, tech: 'github', type: 'service' },
		{ pattern: /GITHUB_CLIENT/i, tech: 'github', type: 'service' },

		// AI/LLM
		{ pattern: /OPENAI_API/i, tech: 'openai', type: 'service' },
		{ pattern: /ANTHROPIC_API/i, tech: 'anthropic', type: 'service' },

		// Hosting
		{ pattern: /CLOUDFLARE_/i, tech: 'cloudflare', type: 'hosting' },
		{ pattern: /VERCEL_/i, tech: 'vercel', type: 'hosting' },
		{ pattern: /NETLIFY_/i, tech: 'netlify', type: 'hosting' },
		{ pattern: /FLY_/i, tech: 'fly', type: 'hosting' },
		{ pattern: /RAILWAY_/i, tech: 'railway', type: 'hosting' },

		// Cache/Storage
		{ pattern: /UPSTASH_/i, tech: 'upstash', type: 'service' },
		{ pattern: /REDIS_URL/i, tech: 'redis', type: 'service' },
		{ pattern: /AWS_S3/i, tech: 'aws', type: 'service' },
		{ pattern: /CLOUDINARY_/i, tech: 'cloudinary', type: 'service' }
	];

	const seen = new Set<string>();
	for (const { pattern, tech, type } of envMappings) {
		if (pattern.test(content) && !seen.has(`${type}:${tech}`)) {
			seen.add(`${type}:${tech}`);
			detections.push({
				type,
				name: tech,
				confidence: 0.9,
				source: '.env.example'
			});
		}
	}

	return detections;
}

// ============================================================================
// CONFIG FILE PARSERS
// ============================================================================

function parseWranglerToml(): Detection[] {
	return [
		{
			type: 'hosting',
			name: 'cloudflare',
			confidence: 1,
			source: 'wrangler.toml'
		}
	];
}

function parseVercelJson(): Detection[] {
	return [
		{
			type: 'hosting',
			name: 'vercel',
			confidence: 1,
			source: 'vercel.json'
		}
	];
}

function parseFlyToml(): Detection[] {
	return [
		{
			type: 'hosting',
			name: 'fly',
			confidence: 1,
			source: 'fly.toml'
		}
	];
}

function parseRailwayToml(): Detection[] {
	return [
		{
			type: 'hosting',
			name: 'railway',
			confidence: 1,
			source: 'railway.toml'
		}
	];
}

function parseNetlifyToml(): Detection[] {
	return [
		{
			type: 'hosting',
			name: 'netlify',
			confidence: 1,
			source: 'netlify.toml'
		}
	];
}

// ============================================================================
// DOCKER PARSER
// ============================================================================

function parseDockerCompose(content: string): Detection[] {
	const detections: Detection[] = [];
	const lowerContent = content.toLowerCase();

	const serviceMappings: Array<{ keyword: string; type: TechType; name: string }> = [
		{ keyword: 'postgres', type: 'database', name: 'postgresql' },
		{ keyword: 'mysql', type: 'database', name: 'mysql' },
		{ keyword: 'mariadb', type: 'database', name: 'mysql' },
		{ keyword: 'mongo', type: 'database', name: 'mongodb' },
		{ keyword: 'redis', type: 'service', name: 'redis' },
		{ keyword: 'elasticsearch', type: 'service', name: 'elasticsearch' },
		{ keyword: 'meilisearch', type: 'service', name: 'meilisearch' },
		{ keyword: 'rabbitmq', type: 'service', name: 'rabbitmq' },
		{ keyword: 'minio', type: 'service', name: 'minio' }
	];

	for (const { keyword, type, name } of serviceMappings) {
		if (lowerContent.includes(keyword)) {
			detections.push({
				type,
				name,
				confidence: 0.9,
				source: 'docker-compose.yml'
			});
		}
	}

	return detections;
}

// ============================================================================
// ORM CONFIG PARSERS
// ============================================================================

function parseDrizzleConfig(content: string): Detection[] {
	const detections: Detection[] = [
		{
			type: 'orm',
			name: 'drizzle',
			confidence: 1,
			source: 'drizzle.config.ts'
		}
	];

	// Detect database from dialect
	if (content.includes("'postgresql'") || content.includes('"postgresql"') || content.includes('pg')) {
		detections.push({
			type: 'database',
			name: 'postgresql',
			confidence: 0.9,
			source: 'drizzle.config.ts'
		});
	}
	if (content.includes("'mysql'") || content.includes('"mysql"')) {
		detections.push({
			type: 'database',
			name: 'mysql',
			confidence: 0.9,
			source: 'drizzle.config.ts'
		});
	}
	if (content.includes("'sqlite'") || content.includes('"sqlite"')) {
		detections.push({
			type: 'database',
			name: 'sqlite',
			confidence: 0.9,
			source: 'drizzle.config.ts'
		});
	}

	return detections;
}

function parsePrismaSchema(content: string): Detection[] {
	const detections: Detection[] = [
		{
			type: 'orm',
			name: 'prisma',
			confidence: 1,
			source: 'prisma/schema.prisma'
		}
	];

	// Detect database from provider
	if (content.includes('provider = "postgresql"') || content.includes("provider = 'postgresql'")) {
		detections.push({
			type: 'database',
			name: 'postgresql',
			confidence: 1,
			source: 'prisma/schema.prisma'
		});
	}
	if (content.includes('provider = "mysql"') || content.includes("provider = 'mysql'")) {
		detections.push({
			type: 'database',
			name: 'mysql',
			confidence: 1,
			source: 'prisma/schema.prisma'
		});
	}
	if (content.includes('provider = "mongodb"') || content.includes("provider = 'mongodb'")) {
		detections.push({
			type: 'database',
			name: 'mongodb',
			confidence: 1,
			source: 'prisma/schema.prisma'
		});
	}
	if (content.includes('provider = "sqlite"') || content.includes("provider = 'sqlite'")) {
		detections.push({
			type: 'database',
			name: 'sqlite',
			confidence: 1,
			source: 'prisma/schema.prisma'
		});
	}

	return detections;
}

// ============================================================================
// DETECTION RULES
// ============================================================================

export const DETECTION_RULES: DetectionRule[] = [
	// Package.json (highest priority for Node.js ecosystem)
	{
		file: 'package.json',
		priority: 10,
		parser: parsePackageJson
	},

	// ENV files (service detection)
	{
		file: '.env.example',
		priority: 8,
		parser: parseEnvFile
	},
	{
		file: '.env.local.example',
		priority: 8,
		parser: parseEnvFile
	},
	{
		file: '.env.sample',
		priority: 8,
		parser: parseEnvFile
	},

	// Hosting platform configs
	{
		file: 'wrangler.toml',
		priority: 10,
		parser: parseWranglerToml
	},
	{
		file: 'vercel.json',
		priority: 10,
		parser: parseVercelJson
	},
	{
		file: 'fly.toml',
		priority: 10,
		parser: parseFlyToml
	},
	{
		file: 'railway.toml',
		priority: 10,
		parser: parseRailwayToml
	},
	{
		file: 'netlify.toml',
		priority: 10,
		parser: parseNetlifyToml
	},

	// Docker
	{
		file: 'docker-compose.yml',
		priority: 7,
		parser: parseDockerCompose
	},
	{
		file: 'docker-compose.yaml',
		priority: 7,
		parser: parseDockerCompose
	},

	// ORM configs
	{
		file: 'drizzle.config.ts',
		priority: 10,
		parser: parseDrizzleConfig
	},
	{
		file: 'drizzle.config.js',
		priority: 10,
		parser: parseDrizzleConfig
	},
	{
		file: 'prisma/schema.prisma',
		priority: 10,
		parser: parsePrismaSchema
	}
];

// ============================================================================
// STACK DETECTION
// ============================================================================

/**
 * Detect technologies from project files.
 */
export async function detectStackFromFiles(workspaceRoot: string): Promise<{
	stack: DetectedStack;
	filesAnalyzed: string[];
}> {
	const allDetections: Detection[] = [];
	const filesAnalyzed: string[] = [];

	// Run all detection rules
	for (const rule of DETECTION_RULES) {
		const filePath = path.join(workspaceRoot, rule.file);

		try {
			const content = await fs.readFile(filePath, 'utf-8');
			const detections = rule.parser(content);

			if (detections.length > 0) {
				filesAnalyzed.push(rule.file);
				allDetections.push(...detections);
				debug(`Detected ${detections.length} technologies from ${rule.file}`);
			}
		} catch {
			// File doesn't exist or can't be read, skip
		}
	}

	// Aggregate detections by type, keeping highest confidence for each tech
	const stack = aggregateDetections(allDetections);

	return { stack, filesAnalyzed };
}

/**
 * Aggregate detections into a coherent stack structure.
 * For each category, pick the highest-confidence detection.
 */
function aggregateDetections(detections: Detection[]): DetectedStack {
	const byType = new Map<TechType, Detection[]>();

	// Group by type
	for (const detection of detections) {
		const existing = byType.get(detection.type) || [];
		existing.push(detection);
		byType.set(detection.type, existing);
	}

	// Pick highest confidence for each category
	const pickBest = (type: TechType): DetectedTech | undefined => {
		const candidates = byType.get(type);
		if (!candidates || candidates.length === 0) return undefined;

		// Sort by confidence descending
		candidates.sort((a, b) => b.confidence - a.confidence);
		const best = candidates[0];

		return {
			name: best.name,
			version: best.version,
			confidence: best.confidence,
			source: best.source
		};
	};

	// Collect all services (not just the best one)
	const services: DetectedTech[] = [];
	const serviceDetections = byType.get('service') || [];
	const seenServices = new Set<string>();

	for (const detection of serviceDetections) {
		if (!seenServices.has(detection.name)) {
			seenServices.add(detection.name);
			services.push({
				name: detection.name,
				version: detection.version,
				confidence: detection.confidence,
				source: detection.source
			});
		}
	}

	// Sort services by confidence
	services.sort((a, b) => b.confidence - a.confidence);

	return {
		frontend: pickBest('frontend'),
		backend: pickBest('backend'),
		database: pickBest('database'),
		orm: pickBest('orm'),
		auth: pickBest('auth'),
		hosting: pickBest('hosting'),
		payments: pickBest('payments'),
		services
	};
}
