import { z } from 'zod';
/**
 * Input schema for recommend_stack_demo tool.
 */
export declare const RecommendStackDemoInputSchema: z.ZodObject<{
    projectType: z.ZodEnum<["web-app", "mobile-app", "api", "desktop", "cli", "library", "e-commerce", "saas", "marketplace"]>;
    scale: z.ZodDefault<z.ZodOptional<z.ZodEnum<["mvp", "startup", "growth", "enterprise"]>>>;
}, "strip", z.ZodTypeAny, {
    projectType: "web-app" | "mobile-app" | "api" | "desktop" | "cli" | "library" | "e-commerce" | "saas" | "marketplace";
    scale: "mvp" | "enterprise" | "startup" | "growth";
}, {
    projectType: "web-app" | "mobile-app" | "api" | "desktop" | "cli" | "library" | "e-commerce" | "saas" | "marketplace";
    scale?: "mvp" | "enterprise" | "startup" | "growth" | undefined;
}>;
export type RecommendStackDemoInput = z.infer<typeof RecommendStackDemoInputSchema>;
/**
 * Tool definition for MCP registration.
 */
export declare const recommendStackDemoToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectType: {
                type: string;
                enum: readonly ["web-app", "mobile-app", "api", "desktop", "cli", "library", "e-commerce", "saas", "marketplace"];
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
};
/**
 * Execute recommend_stack_demo tool.
 */
export declare function executeRecommendStackDemo(input: RecommendStackDemoInput): {
    text: string;
    isError?: boolean;
};
//# sourceMappingURL=recommend-demo.d.ts.map