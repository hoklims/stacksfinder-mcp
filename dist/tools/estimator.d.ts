import { z } from 'zod';
/**
 * Input schema for estimate_project tool.
 */
export declare const EstimateProjectInputSchema: z.ZodObject<{
    specs: z.ZodString;
    teamSize: z.ZodOptional<z.ZodNumber>;
    seniorityLevel: z.ZodDefault<z.ZodOptional<z.ZodEnum<["junior", "mid", "senior", "expert"]>>>;
    region: z.ZodDefault<z.ZodOptional<z.ZodEnum<["france", "us", "uk", "remote-global"]>>>;
    includeMarket: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    specs: string;
    seniorityLevel: "junior" | "mid" | "senior" | "expert";
    region: "france" | "us" | "uk" | "remote-global";
    includeMarket: boolean;
    teamSize?: number | undefined;
}, {
    specs: string;
    teamSize?: number | undefined;
    seniorityLevel?: "junior" | "mid" | "senior" | "expert" | undefined;
    region?: "france" | "us" | "uk" | "remote-global" | undefined;
    includeMarket?: boolean | undefined;
}>;
export type EstimateProjectInput = z.infer<typeof EstimateProjectInputSchema>;
/**
 * Input schema for get_estimate_quota tool.
 */
export declare const GetEstimateQuotaInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type GetEstimateQuotaInput = z.infer<typeof GetEstimateQuotaInputSchema>;
export declare const estimateProjectToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            specs: {
                type: string;
                description: string;
            };
            teamSize: {
                type: string;
                description: string;
            };
            seniorityLevel: {
                type: string;
                enum: string[];
                description: string;
            };
            region: {
                type: string;
                enum: string[];
                description: string;
            };
            includeMarket: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare const getEstimateQuotaToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
};
/**
 * Execute estimate_project tool.
 */
export declare function executeEstimateProject(input: EstimateProjectInput): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Execute get_estimate_quota tool.
 */
export declare function executeGetEstimateQuota(_input: GetEstimateQuotaInput): Promise<{
    text: string;
    isError?: boolean;
}>;
//# sourceMappingURL=estimator.d.ts.map