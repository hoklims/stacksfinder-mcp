/**
 * analyze_repo_mcps Tool
 *
 * Analyzes a repository to detect the tech stack and recommend
 * appropriate MCP servers based on the detected technologies.
 */
import type { AnalyzeRepoMCPsInput, AnalyzeRepoMCPsOutput } from './types.js';
/**
 * Analyze repository and recommend MCPs.
 */
export declare function analyzeRepo(input: AnalyzeRepoMCPsInput): Promise<AnalyzeRepoMCPsOutput>;
/**
 * Tool definition for MCP server registration.
 */
export declare const analyzeRepoMcpsTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            includeInstalled: {
                type: string;
                description: string;
                default: boolean;
            };
            mcpConfigPath: {
                type: string;
                description: string;
            };
            workspaceRoot: {
                type: string;
                description: string;
            };
        };
    };
    handler: (params: unknown) => Promise<{
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
    } | {
        content: {
            type: string;
            text: string;
        }[];
        isError: boolean;
    }>;
};
//# sourceMappingURL=analyze-repo.d.ts.map