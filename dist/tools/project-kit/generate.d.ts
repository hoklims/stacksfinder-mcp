/**
 * generate_mcp_kit Tool
 *
 * Generates a complete project kit with optimal tech stack and MCP recommendations
 * based on a project description.
 */
import type { GenerateMCPKitInput, GenerateMCPKitOutput } from './types.js';
/**
 * Generate complete project kit.
 */
export declare function generateMCPKit(input: GenerateMCPKitInput): GenerateMCPKitOutput;
/**
 * Tool definition for MCP server registration.
 */
export declare const generateMCPKitTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            projectDescription: {
                type: string;
                description: string;
                minLength: number;
                maxLength: number;
            };
            priorities: {
                type: string;
                items: {
                    type: string;
                    enum: readonly ["time-to-market", "scalability", "developer-experience", "cost-efficiency", "performance", "security", "maintainability"];
                };
                maxItems: number;
                description: string;
            };
            constraints: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            projectType: {
                type: string;
                enum: readonly ["web-app", "mobile-app", "api", "saas", "e-commerce", "marketplace", "cli", "library"];
                description: string;
            };
            scale: {
                type: string;
                enum: readonly ["mvp", "startup", "growth", "enterprise"];
                description: string;
            };
        };
        required: string[];
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
//# sourceMappingURL=generate.d.ts.map