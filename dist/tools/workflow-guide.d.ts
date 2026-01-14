import { z } from 'zod';
/**
 * Goals that users can have when using StacksFinder
 */
export declare const WORKFLOW_GOALS: readonly ["discover", "setup_api_key", "get_recommendation", "audit_project", "migrate_stack", "install_mcp", "compare_techs", "create_blueprint"];
/**
 * Client contexts for adapted snippets
 */
export declare const WORKFLOW_CONTEXTS: readonly ["chatgpt", "claude", "cursor", "cli"];
/**
 * User tiers
 */
export declare const USER_TIERS: readonly ["free", "pro", "unknown"];
export type WorkflowGoal = (typeof WORKFLOW_GOALS)[number];
export type WorkflowContext = (typeof WORKFLOW_CONTEXTS)[number];
export type UserTier = (typeof USER_TIERS)[number];
/**
 * Input schema for get_workflow_guide tool
 */
export declare const GetWorkflowGuideInputSchema: z.ZodObject<{
    current_goal: z.ZodOptional<z.ZodEnum<["discover", "setup_api_key", "get_recommendation", "audit_project", "migrate_stack", "install_mcp", "compare_techs", "create_blueprint"]>>;
    completed_tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    user_tier: z.ZodDefault<z.ZodOptional<z.ZodEnum<["free", "pro", "unknown"]>>>;
    known_constraints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    context: z.ZodDefault<z.ZodOptional<z.ZodEnum<["chatgpt", "claude", "cursor", "cli"]>>>;
}, "strip", z.ZodTypeAny, {
    context: "cli" | "cursor" | "chatgpt" | "claude";
    user_tier: "free" | "pro" | "unknown";
    current_goal?: "compare_techs" | "create_blueprint" | "setup_api_key" | "discover" | "get_recommendation" | "audit_project" | "migrate_stack" | "install_mcp" | undefined;
    completed_tools?: string[] | undefined;
    known_constraints?: string[] | undefined;
}, {
    context?: "cli" | "cursor" | "chatgpt" | "claude" | undefined;
    current_goal?: "compare_techs" | "create_blueprint" | "setup_api_key" | "discover" | "get_recommendation" | "audit_project" | "migrate_stack" | "install_mcp" | undefined;
    completed_tools?: string[] | undefined;
    user_tier?: "free" | "pro" | "unknown" | undefined;
    known_constraints?: string[] | undefined;
}>;
export type GetWorkflowGuideInput = z.infer<typeof GetWorkflowGuideInputSchema>;
/**
 * Tool definition for MCP registration
 */
export declare const getWorkflowGuideToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            current_goal: {
                type: string;
                enum: string[];
                description: string;
            };
            completed_tools: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            user_tier: {
                type: string;
                enum: string[];
                description: string;
            };
            known_constraints: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            context: {
                type: string;
                enum: string[];
                description: string;
            };
        };
    };
};
/**
 * Execute the workflow guide tool
 */
export declare function executeGetWorkflowGuide(input: GetWorkflowGuideInput): {
    text: string;
};
//# sourceMappingURL=workflow-guide.d.ts.map