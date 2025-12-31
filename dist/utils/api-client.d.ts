/**
 * Make an authenticated API request with concurrency limiting and caching.
 */
export declare function apiRequest<T>(path: string, options?: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown>;
    timeoutMs?: number;
    useCache?: boolean;
}): Promise<T>;
/**
 * POST to the score API with caching.
 */
export declare function scoreRequest<T>(body: Record<string, unknown>): Promise<T>;
/**
 * GET a blueprint by ID.
 */
export declare function getBlueprintRequest<T>(blueprintId: string): Promise<T>;
/**
 * Create blueprint request body.
 */
export interface CreateBlueprintRequest {
    projectName?: string;
    projectContext: {
        projectName?: string;
        projectType: string;
        projectDescription?: string;
        scale: string;
        teamSize?: string;
        budget?: string;
        timeline?: string;
        constraints?: Array<{
            type: string;
            value: string;
            mandatory?: boolean;
        }>;
        constraintIds?: string[];
        priorities?: string[];
    };
    source: 'mcp';
    mcpToolName: string;
}
/**
 * Create blueprint response.
 */
export interface CreateBlueprintResponse {
    jobId: string;
    projectId: string;
    status: 'pending' | 'running' | 'completed';
    progress: number;
    resultRef?: string;
    _links: {
        job: string;
        blueprint: string | null;
    };
}
/**
 * POST to create a new blueprint.
 * This creates a project and queues a job for blueprint generation.
 */
export declare function createBlueprintRequest(body: CreateBlueprintRequest): Promise<CreateBlueprintResponse>;
/**
 * Poll job status.
 */
export interface JobStatusResponse {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    resultRef?: string;
    errorCode?: string;
    errorMessage?: string;
}
/**
 * GET job status by ID.
 */
export declare function getJobStatusRequest(jobId: string): Promise<JobStatusResponse>;
/**
 * Clear the score cache (useful for testing).
 */
export declare function clearScoreCache(): void;
//# sourceMappingURL=api-client.d.ts.map