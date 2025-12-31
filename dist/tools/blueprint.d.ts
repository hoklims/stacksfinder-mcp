import { z } from 'zod';
/**
 * Input schema for get_blueprint tool.
 */
export declare const GetBlueprintInputSchema: z.ZodObject<{
    blueprintId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    blueprintId: string;
}, {
    blueprintId: string;
}>;
export type GetBlueprintInput = z.infer<typeof GetBlueprintInputSchema>;
/**
 * Tool definition for MCP registration.
 */
export declare const getBlueprintToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            blueprintId: {
                type: string;
                format: string;
                description: string;
            };
        };
        required: string[];
    };
};
/**
 * Execute get_blueprint tool.
 */
export declare function executeGetBlueprint(input: GetBlueprintInput): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Input schema for create_blueprint tool.
 */
export declare const CreateBlueprintInputSchema: z.ZodObject<{
    projectName: z.ZodOptional<z.ZodString>;
    projectType: z.ZodEnum<["web-app", "mobile-app", "api", "desktop", "cli", "library", "e-commerce", "saas", "marketplace"]>;
    scale: z.ZodEnum<["mvp", "startup", "growth", "enterprise"]>;
    projectDescription: z.ZodOptional<z.ZodString>;
    priorities: z.ZodOptional<z.ZodArray<z.ZodEnum<["time-to-market", "scalability", "developer-experience", "cost-efficiency", "performance", "security", "maintainability"]>, "many">>;
    constraints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    waitForCompletion: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    projectType: "web-app" | "mobile-app" | "api" | "desktop" | "cli" | "library" | "e-commerce" | "saas" | "marketplace";
    scale: "mvp" | "enterprise" | "startup" | "growth";
    waitForCompletion: boolean;
    priorities?: ("time-to-market" | "scalability" | "developer-experience" | "cost-efficiency" | "performance" | "security" | "maintainability")[] | undefined;
    constraints?: string[] | undefined;
    projectName?: string | undefined;
    projectDescription?: string | undefined;
}, {
    projectType: "web-app" | "mobile-app" | "api" | "desktop" | "cli" | "library" | "e-commerce" | "saas" | "marketplace";
    scale: "mvp" | "enterprise" | "startup" | "growth";
    priorities?: ("time-to-market" | "scalability" | "developer-experience" | "cost-efficiency" | "performance" | "security" | "maintainability")[] | undefined;
    constraints?: string[] | undefined;
    projectName?: string | undefined;
    projectDescription?: string | undefined;
    waitForCompletion?: boolean | undefined;
}>;
export type CreateBlueprintInput = z.infer<typeof CreateBlueprintInputSchema>;
/**
 * Tool definition for MCP registration.
 */
export declare const createBlueprintToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            projectName: {
                type: string;
                description: string;
                maxLength: number;
            };
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
            projectDescription: {
                type: string;
                description: string;
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
                maxItems: number;
                description: string;
            };
            waitForCompletion: {
                type: string;
                description: string;
                default: boolean;
            };
        };
        required: string[];
    };
};
/**
 * Execute create_blueprint tool.
 */
export declare function executeCreateBlueprint(input: CreateBlueprintInput): Promise<{
    text: string;
    isError?: boolean;
}>;
//# sourceMappingURL=blueprint.d.ts.map