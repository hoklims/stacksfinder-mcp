import { z } from 'zod';
/**
 * Input schema for create_audit tool.
 */
export declare const CreateAuditInputSchema: z.ZodObject<{
    name: z.ZodString;
    technologies: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        category?: string | undefined;
        version?: string | undefined;
    }, {
        name: string;
        category?: string | undefined;
        version?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    technologies: {
        name: string;
        category?: string | undefined;
        version?: string | undefined;
    }[];
    name: string;
}, {
    technologies: {
        name: string;
        category?: string | undefined;
        version?: string | undefined;
    }[];
    name: string;
}>;
export type CreateAuditInput = z.infer<typeof CreateAuditInputSchema>;
/**
 * Input schema for get_audit tool.
 */
export declare const GetAuditInputSchema: z.ZodObject<{
    auditId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    auditId: string;
}, {
    auditId: string;
}>;
export type GetAuditInput = z.infer<typeof GetAuditInputSchema>;
/**
 * Input schema for list_audits tool.
 */
export declare const ListAuditsInputSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export type ListAuditsInput = z.infer<typeof ListAuditsInputSchema>;
/**
 * Input schema for compare_audits tool.
 */
export declare const CompareAuditsInputSchema: z.ZodObject<{
    baseAuditId: z.ZodString;
    compareAuditId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    baseAuditId: string;
    compareAuditId: string;
}, {
    baseAuditId: string;
    compareAuditId: string;
}>;
export type CompareAuditsInput = z.infer<typeof CompareAuditsInputSchema>;
/**
 * Input schema for get_audit_quota tool.
 */
export declare const GetAuditQuotaInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type GetAuditQuotaInput = z.infer<typeof GetAuditQuotaInputSchema>;
/**
 * Input schema for get_migration_recommendation tool.
 */
export declare const GetMigrationRecommendationInputSchema: z.ZodObject<{
    auditId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    auditId: string;
}, {
    auditId: string;
}>;
export type GetMigrationRecommendationInput = z.infer<typeof GetMigrationRecommendationInputSchema>;
export declare const createAuditToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            technologies: {
                type: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                            description: string;
                        };
                        version: {
                            type: string;
                            description: string;
                        };
                        category: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
                description: string;
            };
        };
        required: string[];
    };
};
export declare const getAuditToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            auditId: {
                type: string;
                format: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare const listAuditsToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
export declare const compareAuditsToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            baseAuditId: {
                type: string;
                format: string;
                description: string;
            };
            compareAuditId: {
                type: string;
                format: string;
                description: string;
            };
        };
        required: string[];
    };
};
export declare const getAuditQuotaToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
        required: never[];
    };
};
export declare const getMigrationRecommendationToolDefinition: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            auditId: {
                type: string;
                format: string;
                description: string;
            };
        };
        required: string[];
    };
};
/**
 * Execute create_audit tool.
 */
export declare function executeCreateAudit(input: CreateAuditInput): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Execute get_audit tool.
 */
export declare function executeGetAudit(input: GetAuditInput): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Execute list_audits tool.
 */
export declare function executeListAudits(input: ListAuditsInput): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Execute compare_audits tool.
 */
export declare function executeCompareAudits(input: CompareAuditsInput): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Execute get_audit_quota tool.
 */
export declare function executeGetAuditQuota(): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Execute get_migration_recommendation tool.
 */
export declare function executeGetMigrationRecommendation(input: GetMigrationRecommendationInput): Promise<{
    text: string;
    isError?: boolean;
}>;
//# sourceMappingURL=audit.d.ts.map