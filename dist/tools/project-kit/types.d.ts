/**
 * Shared types for MCPFinder project-kit tools.
 *
 * These types define the input/output schemas for:
 * - generate_mcp_kit: Project description -> stack + MCPs
 * - analyze_repo_mcps: Repo files -> detected stack -> MCPs
 */
import { z } from 'zod';
export declare const PRIORITIES: readonly ["time-to-market", "scalability", "developer-experience", "cost-efficiency", "performance", "security", "maintainability"];
export type Priority = (typeof PRIORITIES)[number];
export declare const PROJECT_TYPES: readonly ["web-app", "mobile-app", "api", "saas", "e-commerce", "marketplace", "cli", "library"];
export type ProjectType = (typeof PROJECT_TYPES)[number];
export declare const SCALES: readonly ["mvp", "startup", "growth", "enterprise"];
export type Scale = (typeof SCALES)[number];
export declare const TECH_TYPES: readonly ["frontend", "backend", "database", "orm", "service", "auth", "hosting", "payments"];
export type TechType = (typeof TECH_TYPES)[number];
export declare const MCP_PRIORITIES: readonly ["high", "medium", "low"];
export type MCPPriority = (typeof MCP_PRIORITIES)[number];
/**
 * A detected technology from project files.
 */
export interface Detection {
    type: TechType;
    name: string;
    version?: string;
    confidence: number;
    source: string;
}
/**
 * Aggregated detected stack from all sources.
 */
export interface DetectedStack {
    frontend?: DetectedTech;
    backend?: DetectedTech;
    database?: DetectedTech;
    orm?: DetectedTech;
    auth?: DetectedTech;
    hosting?: DetectedTech;
    payments?: DetectedTech;
    services: DetectedTech[];
}
export interface DetectedTech {
    name: string;
    version?: string;
    confidence: number;
    source: string;
}
/**
 * A recommended MCP server.
 */
export interface MCPRecommendation {
    slug: string;
    name: string;
    description: string;
    priority: MCPPriority;
    reason: string;
    matchedTech: string;
    installCommand?: string;
    category: string;
    githubUrl?: string;
}
/**
 * Install configuration for multiple clients.
 */
export interface MCPInstallConfigs {
    cursor: Record<string, unknown>;
    claudeDesktop: Record<string, unknown>;
    windsurf: Record<string, unknown>;
}
export declare const GenerateMCPKitInputSchema: z.ZodObject<{
    projectDescription: z.ZodString;
    priorities: z.ZodOptional<z.ZodArray<z.ZodEnum<["time-to-market", "scalability", "developer-experience", "cost-efficiency", "performance", "security", "maintainability"]>, "many">>;
    constraints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectType: z.ZodOptional<z.ZodEnum<["web-app", "mobile-app", "api", "saas", "e-commerce", "marketplace", "cli", "library"]>>;
    scale: z.ZodOptional<z.ZodEnum<["mvp", "startup", "growth", "enterprise"]>>;
}, "strip", z.ZodTypeAny, {
    projectDescription: string;
    projectType?: "web-app" | "mobile-app" | "api" | "cli" | "library" | "e-commerce" | "saas" | "marketplace" | undefined;
    scale?: "mvp" | "enterprise" | "startup" | "growth" | undefined;
    priorities?: ("time-to-market" | "scalability" | "developer-experience" | "cost-efficiency" | "performance" | "security" | "maintainability")[] | undefined;
    constraints?: string[] | undefined;
}, {
    projectDescription: string;
    projectType?: "web-app" | "mobile-app" | "api" | "cli" | "library" | "e-commerce" | "saas" | "marketplace" | undefined;
    scale?: "mvp" | "enterprise" | "startup" | "growth" | undefined;
    priorities?: ("time-to-market" | "scalability" | "developer-experience" | "cost-efficiency" | "performance" | "security" | "maintainability")[] | undefined;
    constraints?: string[] | undefined;
}>;
export type GenerateMCPKitInput = z.infer<typeof GenerateMCPKitInputSchema>;
export interface TechRecommendation {
    id: string;
    name: string;
    score: number;
    grade: string;
    reason: string;
}
export interface GenerateMCPKitOutput {
    stack: {
        frontend?: TechRecommendation;
        backend?: TechRecommendation;
        database?: TechRecommendation;
        auth?: TechRecommendation;
        hosting?: TechRecommendation;
        payments?: TechRecommendation;
    };
    mcps: MCPRecommendation[];
    rationale: string;
    detectedConstraints: string[];
    metadata: {
        scoringVersion: string;
        generatedAt: string;
    };
}
export declare const AnalyzeRepoMCPsInputSchema: z.ZodObject<{
    includeInstalled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    mcpConfigPath: z.ZodOptional<z.ZodString>;
    workspaceRoot: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    includeInstalled: boolean;
    mcpConfigPath?: string | undefined;
    workspaceRoot?: string | undefined;
}, {
    includeInstalled?: boolean | undefined;
    mcpConfigPath?: string | undefined;
    workspaceRoot?: string | undefined;
}>;
export type AnalyzeRepoMCPsInput = z.infer<typeof AnalyzeRepoMCPsInputSchema>;
/**
 * Compatibility check results for installed MCPs.
 */
export interface MCPCompatibilityResult {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D';
    conflicts: Array<{
        mcpA: string;
        mcpB: string;
        reason: string;
        severity: 'critical' | 'warning' | 'info';
    }>;
    redundancies: Array<{
        mcpA: string;
        mcpB: string;
        reason: string;
        severity: 'critical' | 'warning' | 'info';
    }>;
    synergies: Array<{
        mcpA: string;
        mcpB: string;
        reason: string;
    }>;
    suggestions: Array<{
        mcp: string;
        reason: string;
        basedOn: string;
    }>;
}
/**
 * MCPs excluded from recommendations with reasons.
 */
export interface ExcludedRecommendation {
    mcp: string;
    reason: string;
    conflictsWith: string;
}
export interface AnalyzeRepoMCPsOutput {
    detectedStack: DetectedStack;
    installedMcps: string[];
    recommendedMcps: MCPRecommendation[];
    excludedRecommendations: ExcludedRecommendation[];
    compatibility: {
        installed: MCPCompatibilityResult;
        recommendationConflicts: Array<{
            recommended: string;
            conflictsWith: string;
            reason: string;
        }>;
    };
    installConfig: MCPInstallConfigs;
    metadata: {
        filesAnalyzed: string[];
        analysisDate: string;
    };
}
export interface DetectionRule {
    file: string;
    parser: (content: string) => Detection[];
    priority: number;
}
/**
 * MCPs that are always recommended regardless of detected stack.
 */
export declare const UNIVERSAL_MCPS: Array<{
    slug: string;
    name: string;
    description: string;
    priority: MCPPriority;
    reason: string;
    category: string;
}>;
//# sourceMappingURL=types.d.ts.map