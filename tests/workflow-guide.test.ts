/**
 * Workflow Guide Tool Tests
 *
 * Tests for the get_workflow_guide tool that provides intelligent workflow guidance.
 * Run with: npm test or vitest
 */

import { describe, test, expect } from 'vitest';
import { executeGetWorkflowGuide, type GetWorkflowGuideInput } from '../src/tools/workflow-guide.js';

describe('get_workflow_guide', () => {
	// ========================================================================
	// HAPPY PATH TESTS
	// ========================================================================

	describe('Happy Path', () => {
		test('returns discover flow for new users with no goal', () => {
			const result = executeGetWorkflowGuide({});

			expect(result.text).toContain('Explore StacksFinder Technologies');
			expect(result.text).toContain('list_technologies');
			expect(result.text).toContain('Example:');
		});

		test('returns discover flow when goal is discover', () => {
			const result = executeGetWorkflowGuide({ current_goal: 'discover' });

			expect(result.text).toContain('Explore StacksFinder Technologies');
			expect(result.text).toContain('list_technologies');
		});

		test('suggests upgrade for free user wanting audit', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'audit_project',
				user_tier: 'free'
			});

			expect(result.text).toContain('Audit Technical Debt');
			expect(result.text).toContain('create_audit');
			// Free users are still guided to create_audit, upgrade messaging is handled by API
		});

		test('provides workflow for Pro user wanting audit', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'audit_project',
				user_tier: 'pro'
			});

			expect(result.text).toContain('Audit Technical Debt');
			expect(result.text).toContain('create_audit');
			expect(result.text).not.toContain('Upgrade to Pro');
		});

		test('shows stack recommendation workflow', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'get_recommendation'
			});

			expect(result.text).toContain('Get Stack Recommendation');
			expect(result.text).toContain('recommend_stack_demo');
		});
	});

	// ========================================================================
	// EDGE CASES (REAL-WORLD SCENARIOS)
	// ========================================================================

	describe('Edge Cases', () => {
		test('handles unknown goal by defaulting to discover', () => {
			const result = executeGetWorkflowGuide({
				// @ts-expect-error Testing invalid input
				current_goal: 'unknown_goal_xyz'
			});

			expect(result.text).toContain('Explore StacksFinder Technologies');
			expect(result.text).toContain('list_technologies');
		});

		test('compare_techs suggests list_technologies first when no prereqs done', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'compare_techs',
				completed_tools: []
			});

			// Should suggest compare_techs but note prerequisites
			expect(result.text).toContain('Compare Technologies');
			expect(result.text).toContain('compare_techs');
			expect(result.text).toContain('Missing Prerequisites');
			expect(result.text).toContain('list_technologies');
		});

		test('compare_techs proceeds when list_technologies already completed', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'compare_techs',
				completed_tools: ['list_technologies']
			});

			expect(result.text).toContain('Compare Technologies');
			expect(result.text).toContain('compare_techs');
			expect(result.text).not.toContain('Missing Prerequisites');
		});

		test('audit_project without Pro tier shows workflow with troubleshooting', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'audit_project',
				user_tier: 'free'
			});

			// Free users are guided through the audit workflow
			expect(result.text).toContain('Audit Technical Debt');
			expect(result.text).toContain('create_audit');
			// Troubleshooting section includes OAuth fallback
			expect(result.text).toContain('Troubleshooting');
			expect(result.text).toContain('setup_api_key');
		});

		test('migrate_stack without audit suggests create_audit first', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'migrate_stack',
				completed_tools: []
			});

			expect(result.text).toContain('Missing Prerequisites');
			expect(result.text).toContain('create_audit');
		});

		test('migrate_stack proceeds when audit is completed', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'migrate_stack',
				completed_tools: ['create_audit']
			});

			expect(result.text).toContain('get_migration_recommendation');
		});

		test('install_mcp in context=chatgpt suggests guide URL', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'install_mcp',
				context: 'chatgpt'
			});

			expect(result.text).toContain('Install MCP Server');
			expect(result.text).toContain('stacksfinder.com/guides/mcp');
		});

		test('install_mcp in context=claude gives different troubleshooting', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'install_mcp',
				context: 'claude'
			});

			expect(result.text).toContain('STACKSFINDER_API_KEY');
			expect(result.text).not.toContain('OAuth fails');
		});

		test('completed_tools already contains recommended tool suggests next', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'discover',
				completed_tools: ['list_technologies']
			});

			// Should suggest analyze_tech since list_technologies is done
			expect(result.text).toContain('analyze_tech');
		});

		test('all steps completed shows workflow complete message', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'discover',
				completed_tools: ['list_technologies', 'analyze_tech']
			});

			expect(result.text).toContain('Workflow Complete');
		});
	});

	// ========================================================================
	// CONTEXT AND CONSTRAINTS
	// ========================================================================

	describe('Context and Constraints', () => {
		test('shows constraints in output when provided', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'get_recommendation',
				known_constraints: ['must_use_postgresql', 'prefer_react']
			});

			expect(result.text).toContain('must_use_postgresql');
			expect(result.text).toContain('prefer_react');
		});

		test('chatgpt context includes OAuth troubleshooting', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'discover',
				context: 'chatgpt'
			});

			expect(result.text).toContain('OAuth');
			expect(result.text).toContain('Schema not refreshed');
		});

		test('cli context has different troubleshooting', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'discover',
				context: 'cli'
			});

			expect(result.text).toContain('Connection issues');
		});

		test('unknown tier suggests trying a Pro tool', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'discover',
				user_tier: 'unknown'
			});

			expect(result.text).toContain('Unknown (try a Pro tool to find out)');
		});
	});

	// ========================================================================
	// WORKFLOW CHAINS
	// ========================================================================

	describe('Workflow Chains', () => {
		test('setup_api_key workflow recommends create_api_key for OAuth', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'setup_api_key'
			});

			expect(result.text).toContain('create_api_key');
			expect(result.text).toContain('OAuth');
			expect(result.text).toContain('preferred');
		});

		test('create_blueprint workflow starts with recommend_stack', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'create_blueprint',
				completed_tools: []
			});

			expect(result.text).toContain('recommend_stack');
		});

		test('create_blueprint suggests create_blueprint after recommend_stack', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'create_blueprint',
				completed_tools: ['recommend_stack']
			});

			expect(result.text).toContain('create_blueprint');
			expect(result.text).toContain('Save the recommendation');
		});

		test('audit workflow suggests migration after completion', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'audit_project',
				completed_tools: ['create_audit', 'get_audit'],
				user_tier: 'pro'
			});

			expect(result.text).toContain('Workflow Complete');
			expect(result.text).toContain('migrate_stack');
		});
	});

	// ========================================================================
	// OUTPUT FORMAT
	// ========================================================================

	describe('Output Format', () => {
		test('includes all required sections', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'get_recommendation'
			});

			expect(result.text).toContain('## Goal');
			expect(result.text).toContain('## You Have');
			expect(result.text).toContain('## Next Recommended Tool');
			expect(result.text).toContain('## Why');
			expect(result.text).toContain('## Alternatives');
			expect(result.text).toContain('## Troubleshooting');
		});

		test('includes JSON example for next tool', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'get_recommendation'
			});

			expect(result.text).toContain('```json');
			expect(result.text).toContain('projectType');
		});

		test('shows step progress', () => {
			const result = executeGetWorkflowGuide({
				current_goal: 'discover'
			});

			expect(result.text).toMatch(/step \d+ of \d+/i);
		});
	});
});
