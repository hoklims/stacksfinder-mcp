import { z } from 'zod';
/**
 * Input schema for list_technologies tool.
 */
export declare const ListTechsInputSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<["frontend", "backend", "meta-framework", "database", "orm", "auth", "hosting", "payments"]>>;
}, "strip", z.ZodTypeAny, {
    category?: "frontend" | "backend" | "meta-framework" | "database" | "orm" | "auth" | "hosting" | "payments" | undefined;
}, {
    category?: "frontend" | "backend" | "meta-framework" | "database" | "orm" | "auth" | "hosting" | "payments" | undefined;
}>;
export type ListTechsInput = z.infer<typeof ListTechsInputSchema>;
/**
 * Tool definition for MCP registration.
 */
export declare const listTechsToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            category: {
                type: string;
                enum: readonly ["frontend", "backend", "meta-framework", "database", "orm", "auth", "hosting", "payments"];
                description: string;
            };
        };
    };
};
/**
 * Execute list_technologies tool.
 */
export declare function executeListTechs(input: ListTechsInput): string;
//# sourceMappingURL=list-techs.d.ts.map