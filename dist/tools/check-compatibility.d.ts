/**
 * MCP Compatibility Check Tool
 *
 * Free tier tool that checks compatibility between a set of MCP servers.
 * Detects conflicts, redundancies, and synergies.
 * Returns both markdown text and structured JSON data.
 */
import { z } from 'zod';
import { type CompatibilityReport } from '../lib/mcp-compatibility/index.js';
export declare const CheckCompatibilityInputSchema: z.ZodObject<{
    mcps: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    mcps: string[];
}, {
    mcps: string[];
}>;
export type CheckCompatibilityInput = z.infer<typeof CheckCompatibilityInputSchema>;
export interface CheckCompatibilityOutput {
    text: string;
    data: CompatibilityReport;
    isError?: boolean;
}
export declare const checkCompatibilityToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            mcps: {
                type: string;
                items: {
                    type: string;
                };
                minItems: number;
                maxItems: number;
                description: string;
            };
        };
        required: string[];
    };
};
export declare function executeCheckCompatibility(input: CheckCompatibilityInput): CheckCompatibilityOutput;
//# sourceMappingURL=check-compatibility.d.ts.map