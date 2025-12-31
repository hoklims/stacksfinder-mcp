import { z } from 'zod';
/**
 * Input schema for setup_api_key tool.
 */
export declare const SetupApiKeyInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    keyName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    keyName?: string | undefined;
}, {
    email: string;
    password: string;
    keyName?: string | undefined;
}>;
export type SetupApiKeyInput = z.infer<typeof SetupApiKeyInputSchema>;
/**
 * Tool definition for setup_api_key.
 */
export declare const setupApiKeyToolDefinition: {
    name: string;
    description: string;
};
/**
 * Execute setup_api_key tool.
 */
export declare function executeSetupApiKey(input: SetupApiKeyInput): Promise<{
    text: string;
    isError?: boolean;
    apiKey?: string;
}>;
/**
 * Input schema for list_api_keys tool.
 */
export declare const ListApiKeysInputSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export type ListApiKeysInput = z.infer<typeof ListApiKeysInputSchema>;
/**
 * Tool definition for list_api_keys.
 */
export declare const listApiKeysToolDefinition: {
    name: string;
    description: string;
};
/**
 * Execute list_api_keys tool.
 */
export declare function executeListApiKeys(): Promise<{
    text: string;
    isError?: boolean;
}>;
/**
 * Input schema for revoke_api_key tool.
 */
export declare const RevokeApiKeyInputSchema: z.ZodObject<{
    keyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    keyId: string;
}, {
    keyId: string;
}>;
export type RevokeApiKeyInput = z.infer<typeof RevokeApiKeyInputSchema>;
/**
 * Tool definition for revoke_api_key.
 */
export declare const revokeApiKeyToolDefinition: {
    name: string;
    description: string;
};
/**
 * Execute revoke_api_key tool.
 */
export declare function executeRevokeApiKey(input: RevokeApiKeyInput): Promise<{
    text: string;
    isError?: boolean;
}>;
//# sourceMappingURL=api-keys.d.ts.map