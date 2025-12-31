import { z } from 'zod';
/**
 * Input schema for recommend_stack tool.
 */
export declare const RecommendStackInputSchema: z.ZodObject<{
    projectType: z.ZodEnum<["web-app", "mobile-app", "api", "desktop", "cli", "library", "e-commerce", "saas", "marketplace"]>;
    scale: z.ZodDefault<z.ZodOptional<z.ZodEnum<["mvp", "startup", "growth", "enterprise"]>>>;
    priorities: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodEnum<["time-to-market", "scalability", "developer-experience", "cost-efficiency", "performance", "security", "maintainability"]>, "many">>>;
    constraints: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    projectType: "web-app" | "mobile-app" | "api" | "desktop" | "cli" | "library" | "e-commerce" | "saas" | "marketplace";
    scale: "mvp" | "enterprise" | "startup" | "growth";
    priorities: ("time-to-market" | "scalability" | "developer-experience" | "cost-efficiency" | "performance" | "security" | "maintainability")[];
    constraints: string[];
}, {
    projectType: "web-app" | "mobile-app" | "api" | "desktop" | "cli" | "library" | "e-commerce" | "saas" | "marketplace";
    scale?: "mvp" | "enterprise" | "startup" | "growth" | undefined;
    priorities?: ("time-to-market" | "scalability" | "developer-experience" | "cost-efficiency" | "performance" | "security" | "maintainability")[] | undefined;
    constraints?: string[] | undefined;
}>;
export type RecommendStackInput = z.infer<typeof RecommendStackInputSchema>;
/**
 * Tool definition for MCP registration.
 */
export declare const recommendStackToolDefinition: {
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
        };
        required: string[];
    };
};
/**
 * Execute recommend_stack tool.
 */
export declare function executeRecommendStack(input: RecommendStackInput): Promise<{
    text: string;
    isError?: boolean;
}>;
//# sourceMappingURL=recommend.d.ts.map