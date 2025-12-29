#!/usr/bin/env node
/**
 * CI script to check if MCP package data is in sync with source data.
 * Exits with code 1 if data differs, 0 if in sync.
 *
 * Usage:
 *   bun run check-data-sync
 *   npx tsx scripts/check-data-sync.ts
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// File pairs to check: [mcpPath, sourcePath]
const FILE_PAIRS = [
	['src/data/technology_scores.json', '../../src/lib/scoring/data/technology_scores.json'],
	['src/data/compatibility_matrix.json', '../../src/lib/scoring/data/compatibility_matrix.json']
] as const;

interface DiffResult {
	file: string;
	mcpPath: string;
	sourcePath: string;
	status: 'in_sync' | 'mcp_missing' | 'source_missing' | 'different';
	details?: string;
}

function normalizeJson(content: string): string {
	// Parse and re-stringify to normalize formatting
	try {
		return JSON.stringify(JSON.parse(content), null, 2);
	} catch {
		return content;
	}
}

function compareFiles(mcpRelPath: string, sourceRelPath: string): DiffResult {
	const mcpPath = resolve(__dirname, '..', mcpRelPath);
	const sourcePath = resolve(__dirname, '..', sourceRelPath);

	const result: DiffResult = {
		file: mcpRelPath,
		mcpPath,
		sourcePath,
		status: 'in_sync'
	};

	// Check if MCP file exists
	if (!existsSync(mcpPath)) {
		result.status = 'mcp_missing';
		result.details = `MCP package file missing: ${mcpPath}`;
		return result;
	}

	// Check if source file exists
	if (!existsSync(sourcePath)) {
		result.status = 'source_missing';
		result.details = `Source file missing: ${sourcePath}`;
		return result;
	}

	// Read and compare
	const mcpContent = normalizeJson(readFileSync(mcpPath, 'utf-8'));
	const sourceContent = normalizeJson(readFileSync(sourcePath, 'utf-8'));

	if (mcpContent !== sourceContent) {
		result.status = 'different';

		// Generate a simple diff summary
		const mcpLines = mcpContent.split('\n');
		const sourceLines = sourceContent.split('\n');

		let diffCount = 0;
		const maxDiffs = 5;
		const diffLines: string[] = [];

		for (let i = 0; i < Math.max(mcpLines.length, sourceLines.length); i++) {
			if (mcpLines[i] !== sourceLines[i]) {
				diffCount++;
				if (diffLines.length < maxDiffs) {
					diffLines.push(`  Line ${i + 1}:`);
					if (mcpLines[i]) diffLines.push(`    - MCP:    ${mcpLines[i].substring(0, 80)}`);
					if (sourceLines[i]) diffLines.push(`    + Source: ${sourceLines[i].substring(0, 80)}`);
				}
			}
		}

		result.details = [
			`Files differ (${diffCount} line differences):`,
			...diffLines,
			diffCount > maxDiffs ? `  ... and ${diffCount - maxDiffs} more differences` : ''
		]
			.filter(Boolean)
			.join('\n');
	}

	return result;
}

function main(): void {
	console.log('Checking MCP package data sync...\n');

	const results: DiffResult[] = [];
	let hasErrors = false;

	for (const [mcpPath, sourcePath] of FILE_PAIRS) {
		const result = compareFiles(mcpPath, sourcePath);
		results.push(result);

		if (result.status !== 'in_sync') {
			hasErrors = true;
		}
	}

	// Print results
	for (const result of results) {
		const statusEmoji =
			result.status === 'in_sync'
				? '✓'
				: result.status === 'different'
					? '✗'
					: result.status === 'mcp_missing'
						? '!'
						: '?';

		console.log(`${statusEmoji} ${result.file}: ${result.status}`);

		if (result.details) {
			console.log(result.details);
			console.log();
		}
	}

	if (hasErrors) {
		console.log('\n❌ Data sync check FAILED');
		console.log('\nTo fix, copy the source files to the MCP package:');
		console.log('  cp src/lib/scoring/data/*.json packages/mcp-server/src/data/');
		console.log('\nThen update DATA_VERSION in packages/mcp-server/src/data/index.ts');
		process.exit(1);
	} else {
		console.log('\n✅ All data files in sync');
		process.exit(0);
	}
}

main();
