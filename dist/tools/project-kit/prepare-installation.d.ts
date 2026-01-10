/**
 * prepare_mcp_installation Tool
 *
 * Analyzes a repository, detects needed MCPs, and generates a .env-mcp
 * template file for the user to fill in with their API keys.
 */
import type { PrepareMCPInstallationInput, PrepareMCPInstallationOutput } from './installation-types.js';
/**
 * Prepare MCP installation by analyzing repo and generating .env-mcp.
 */
export declare function prepareMCPInstallation(input: PrepareMCPInstallationInput): Promise<PrepareMCPInstallationOutput>;
/**
 * Tool definition for MCP server registration.
 */
export declare const prepareMCPInstallationTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            workspaceRoot: {
                type: string;
                description: string;
            };
            mcpConfigPath: {
                type: string;
                description: string;
            };
            includeInstalled: {
                type: string;
                description: string;
                default: boolean;
            };
            envMcpPath: {
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
//# sourceMappingURL=prepare-installation.d.ts.map