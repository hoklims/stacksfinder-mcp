/**
 * execute_mcp_installation Tool
 *
 * Reads a .env-mcp file and generates installation commands for MCPs
 * where the user has provided the required credentials.
 */
import type { ExecuteMCPInstallationInput, ExecuteMCPInstallationOutput } from './installation-types.js';
/**
 * Execute MCP installation by reading .env-mcp and generating commands.
 */
export declare function executeMCPInstallation(input: ExecuteMCPInstallationInput): Promise<ExecuteMCPInstallationOutput>;
/**
 * Tool definition for MCP server registration.
 */
export declare const executeMCPInstallationTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            envMcpPath: {
                type: string;
                description: string;
            };
            targetClient: {
                type: string;
                enum: string[];
                description: string;
            };
            dryRun: {
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
//# sourceMappingURL=execute-installation.d.ts.map