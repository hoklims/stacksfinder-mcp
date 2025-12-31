import { z } from 'zod';
/**
 * Input schema for analyze_tech tool.
 */
export declare const AnalyzeTechInputSchema: z.ZodObject<{
    technology: z.ZodString;
    context: z.ZodDefault<z.ZodOptional<z.ZodEnum<["default", "mvp", "enterprise"]>>>;
}, "strip", z.ZodTypeAny, {
    technology: string;
    context: "default" | "mvp" | "enterprise";
}, {
    technology: string;
    context?: "default" | "mvp" | "enterprise" | undefined;
}>;
export type AnalyzeTechInput = z.infer<typeof AnalyzeTechInputSchema>;
/**
 * Tool definition for MCP registration.
 */
export declare const analyzeTechToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            technology: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                enum: readonly ["default", "mvp", "enterprise"];
                description: string;
            };
        };
        required: string[];
    };
};
/**
 * Execute analyze_tech tool.
 */
export declare function executeAnalyzeTech(input: AnalyzeTechInput): {
    text: string;
    isError?: boolean;
};
//# sourceMappingURL=analyze.d.ts.map