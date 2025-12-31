import { z } from 'zod';
/**
 * Input schema for compare_techs tool.
 */
export declare const CompareTechsInputSchema: z.ZodObject<{
    technologies: z.ZodArray<z.ZodString, "many">;
    context: z.ZodDefault<z.ZodOptional<z.ZodEnum<["default", "mvp", "enterprise"]>>>;
}, "strip", z.ZodTypeAny, {
    context: "default" | "mvp" | "enterprise";
    technologies: string[];
}, {
    technologies: string[];
    context?: "default" | "mvp" | "enterprise" | undefined;
}>;
export type CompareTechsInput = z.infer<typeof CompareTechsInputSchema>;
/**
 * Tool definition for MCP registration.
 */
export declare const compareTechsToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            technologies: {
                type: string;
                items: {
                    type: string;
                };
                minItems: number;
                maxItems: number;
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
 * Execute compare_techs tool.
 */
export declare function executeCompareTechs(input: CompareTechsInput): {
    text: string;
    isError?: boolean;
};
//# sourceMappingURL=compare.d.ts.map