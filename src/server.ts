import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { DATA_VERSION, CATEGORIES, CONTEXTS } from "./data/index.js";
import {
  listTechsToolDefinition,
  executeListTechs,
  ListTechsInputSchema,
} from "./tools/list-techs.js";
import {
  analyzeTechToolDefinition,
  executeAnalyzeTech,
  AnalyzeTechInputSchema,
} from "./tools/analyze.js";
import {
  compareTechsToolDefinition,
  executeCompareTechs,
  CompareTechsInputSchema,
} from "./tools/compare.js";
import {
  recommendStackToolDefinition,
  executeRecommendStack,
  RecommendStackInputSchema,
} from "./tools/recommend.js";
import {
  getBlueprintToolDefinition,
  executeGetBlueprint,
  GetBlueprintInputSchema,
  createBlueprintToolDefinition,
  executeCreateBlueprint,
  CreateBlueprintInputSchema,
} from "./tools/blueprint.js";
import {
  recommendStackDemoToolDefinition,
  executeRecommendStackDemo,
  RecommendStackDemoInputSchema,
} from "./tools/recommend-demo.js";
import {
  setupApiKeyToolDefinition,
  executeSetupApiKey,
  SetupApiKeyInputSchema,
  listApiKeysToolDefinition,
  executeListApiKeys,
  revokeApiKeyToolDefinition,
  executeRevokeApiKey,
  RevokeApiKeyInputSchema,
  createApiKeyToolDefinition,
  executeCreateApiKey,
  CreateApiKeyInputSchema,
} from "./tools/api-keys.js";
import {
  createAuditToolDefinition,
  executeCreateAudit,
  CreateAuditInputSchema,
  getAuditToolDefinition,
  executeGetAudit,
  GetAuditInputSchema,
  listAuditsToolDefinition,
  executeListAudits,
  ListAuditsInputSchema,
  compareAuditsToolDefinition,
  executeCompareAudits,
  CompareAuditsInputSchema,
  getAuditQuotaToolDefinition,
  executeGetAuditQuota,
  getMigrationRecommendationToolDefinition,
  executeGetMigrationRecommendation,
  GetMigrationRecommendationInputSchema,
  importBetterTStackToolDefinition,
  executeImportBetterTStack,
  ImportBetterTStackInputSchema,
} from "./tools/audit.js";
import {
  generateMCPKitTool,
  generateMCPKit,
  GenerateMCPKitInputSchema,
  analyzeRepoMcpsTool,
  analyzeRepo,
  AnalyzeRepoMCPsInputSchema,
  PRIORITIES,
  PROJECT_TYPES,
  SCALES,
  type AnalyzeRepoMCPsOutput,
} from "./tools/project-kit/index.js";
import {
  prepareMCPInstallationTool,
  prepareMCPInstallation,
} from "./tools/project-kit/prepare-installation.js";
import {
  executeMCPInstallationTool,
  executeMCPInstallation,
} from "./tools/project-kit/execute-installation.js";
import {
  PrepareMCPInstallationInputSchema,
  ExecuteMCPInstallationInputSchema,
} from "./tools/project-kit/installation-types.js";
import {
  checkCompatibilityToolDefinition,
  executeCheckCompatibility,
  CheckCompatibilityInputSchema,
} from "./tools/check-compatibility.js";
import {
  getWorkflowGuideToolDefinition,
  executeGetWorkflowGuide,
  GetWorkflowGuideInputSchema,
  WORKFLOW_GOALS,
  WORKFLOW_CONTEXTS,
  USER_TIERS,
} from "./tools/workflow-guide.js";
import {
  estimateProjectToolDefinition,
  executeEstimateProject,
  EstimateProjectInputSchema,
  getEstimateQuotaToolDefinition,
  executeGetEstimateQuota,
} from "./tools/estimator.js";
import { info, debug } from "./utils/logger.js";
import {
  listTechnologiesAnnotations,
  analyzeTechAnnotations,
  compareTechsAnnotations,
  recommendStackDemoAnnotations,
  recommendStackAnnotations,
  getBlueprintAnnotations,
  createBlueprintAnnotations,
  setupApiKeyAnnotations,
  listApiKeysAnnotations,
  revokeApiKeyAnnotations,
  createApiKeyAnnotations,
  createAuditAnnotations,
  getAuditAnnotations,
  listAuditsAnnotations,
  compareAuditsAnnotations,
  getAuditQuotaAnnotations,
  getMigrationRecommendationAnnotations,
  generateMcpKitAnnotations,
  analyzeRepoMcpsAnnotations,
  prepareMcpInstallationAnnotations,
  executeMcpInstallationAnnotations,
  checkCompatibilityAnnotations,
  estimateProjectAnnotations,
  getEstimateQuotaAnnotations,
  getWorkflowGuideAnnotations,
} from "./annotations.js";

/**
 * Create and configure the MCP server.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "stacksfinder",
    version: "1.0.0",
  });

  info(`StacksFinder MCP Server v1.0.0 (data version: ${DATA_VERSION})`);

  // Register list_technologies tool (local, discovery)
  server.registerTool(
    listTechsToolDefinition.name,
    {
      title: "List Technologies",
      description: listTechsToolDefinition.description,
      inputSchema: {
        category: z.enum(CATEGORIES).optional().describe("Filter by category"),
      },
      annotations: listTechnologiesAnnotations,
    },
    async (args) => {
      debug("list_technologies called", args);
      const input = ListTechsInputSchema.parse(args);
      const text = executeListTechs(input);
      return {
        content: [{ type: "text", text }],
      };
    },
  );

  // Register analyze_tech tool (local)
  server.registerTool(
    analyzeTechToolDefinition.name,
    {
      title: "Analyze Technology",
      description: analyzeTechToolDefinition.description,
      inputSchema: {
        technology: z.string().min(1).describe("Technology ID to analyze"),
        context: z.enum(CONTEXTS).optional().describe("Context for scoring"),
      },
      annotations: analyzeTechAnnotations,
    },
    async (args) => {
      debug("analyze_tech called", args);
      const input = AnalyzeTechInputSchema.parse(args);
      const { text, isError } = executeAnalyzeTech(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register compare_techs tool (local)
  server.registerTool(
    compareTechsToolDefinition.name,
    {
      title: "Compare Technologies",
      description: compareTechsToolDefinition.description,
      inputSchema: {
        technologies: z
          .array(z.string().min(1))
          .min(2)
          .max(4)
          .describe("Technologies to compare"),
        context: z.enum(CONTEXTS).optional().describe("Context for scoring"),
      },
      annotations: compareTechsAnnotations,
    },
    async (args) => {
      debug("compare_techs called", args);
      const input = CompareTechsInputSchema.parse(args);
      const { text, isError } = executeCompareTechs(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register recommend_stack_demo tool (FREE, local scoring, 1/day limit)
  server.registerTool(
    recommendStackDemoToolDefinition.name,
    {
      title: "Recommend Stack (Demo)",
      description: recommendStackDemoToolDefinition.description,
      inputSchema: {
        projectType: z
          .enum([
            "web-app",
            "mobile-app",
            "api",
            "desktop",
            "cli",
            "library",
            "e-commerce",
            "saas",
            "marketplace",
          ])
          .describe("Type of project"),
        scale: z
          .enum(["mvp", "startup", "growth", "enterprise"])
          .optional()
          .describe("Project scale"),
      },
      annotations: recommendStackDemoAnnotations,
    },
    async (args) => {
      debug("recommend_stack_demo called", args);
      const input = RecommendStackDemoInputSchema.parse(args);
      const { text, isError } = executeRecommendStackDemo(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register recommend_stack tool (API-based, requires API key)
  server.registerTool(
    recommendStackToolDefinition.name,
    {
      title: "Recommend Stack",
      description: recommendStackToolDefinition.description,
      inputSchema: {
        projectType: z
          .enum([
            "web-app",
            "mobile-app",
            "api",
            "desktop",
            "cli",
            "library",
            "e-commerce",
            "saas",
            "marketplace",
          ])
          .describe("Type of project"),
        scale: z
          .enum(["mvp", "startup", "growth", "enterprise"])
          .optional()
          .describe("Project scale"),
        priorities: z
          .array(
            z.enum([
              "time-to-market",
              "scalability",
              "developer-experience",
              "cost-efficiency",
              "performance",
              "security",
              "maintainability",
            ]),
          )
          .max(3)
          .optional()
          .describe("Top priorities (max 3)"),
        constraints: z
          .array(z.string())
          .optional()
          .describe("Project constraints"),
      },
      annotations: recommendStackAnnotations,
    },
    async (args) => {
      debug("recommend_stack called", args);
      const input = RecommendStackInputSchema.parse(args);
      const { text, isError } = await executeRecommendStack(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register get_blueprint tool (API-based)
  server.registerTool(
    getBlueprintToolDefinition.name,
    {
      title: "Get Blueprint",
      description: getBlueprintToolDefinition.description,
      inputSchema: {
        blueprintId: z.string().uuid().describe("Blueprint UUID"),
      },
      annotations: getBlueprintAnnotations,
    },
    async (args) => {
      debug("get_blueprint called", args);
      const input = GetBlueprintInputSchema.parse(args);
      const { text, isError } = await executeGetBlueprint(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register create_blueprint tool (API-based, requires API key with blueprint:write)
  server.registerTool(
    createBlueprintToolDefinition.name,
    {
      title: "Create Blueprint",
      description: createBlueprintToolDefinition.description,
      inputSchema: {
        projectName: z
          .string()
          .max(100)
          .optional()
          .describe("Project name (optional)"),
        projectType: z
          .enum([
            "web-app",
            "mobile-app",
            "api",
            "desktop",
            "cli",
            "library",
            "e-commerce",
            "saas",
            "marketplace",
          ])
          .describe("Type of project"),
        scale: z
          .enum(["mvp", "startup", "growth", "enterprise"])
          .describe("Project scale"),
        projectDescription: z
          .string()
          .max(2000)
          .optional()
          .describe("Brief description (optional)"),
        priorities: z
          .array(
            z.enum([
              "time-to-market",
              "scalability",
              "developer-experience",
              "cost-efficiency",
              "performance",
              "security",
              "maintainability",
            ]),
          )
          .max(3)
          .optional()
          .describe("Top 3 priorities (optional)"),
        constraints: z
          .array(z.string())
          .max(20)
          .optional()
          .describe("Technology constraint IDs (optional)"),
        waitForCompletion: z
          .boolean()
          .optional()
          .describe("Wait for completion (default: true)"),
      },
      annotations: createBlueprintAnnotations,
    },
    async (args) => {
      debug("create_blueprint called", args);
      const input = CreateBlueprintInputSchema.parse(args);
      const { text, isError } = await executeCreateBlueprint(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register setup_api_key tool (API-based, no auth required)
  server.registerTool(
    setupApiKeyToolDefinition.name,
    {
      title: "Setup API Key",
      description: setupApiKeyToolDefinition.description,
      inputSchema: {
        email: z.string().email().describe("Your StacksFinder account email"),
        password: z
          .string()
          .min(1)
          .describe("Your StacksFinder account password"),
        keyName: z
          .string()
          .max(100)
          .optional()
          .describe("Optional name for the API key"),
      },
      annotations: setupApiKeyAnnotations,
    },
    async (args) => {
      debug("setup_api_key called", args.email);
      const input = SetupApiKeyInputSchema.parse(args);
      const { text, isError } = await executeSetupApiKey(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register list_api_keys tool (API-based, requires API key)
  server.registerTool(
    listApiKeysToolDefinition.name,
    {
      title: "List API Keys",
      description: listApiKeysToolDefinition.description,
      inputSchema: {},
      annotations: listApiKeysAnnotations,
    },
    async () => {
      debug("list_api_keys called");
      const { text, isError } = await executeListApiKeys();
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register revoke_api_key tool (API-based, requires API key)
  server.registerTool(
    revokeApiKeyToolDefinition.name,
    {
      title: "Revoke API Key",
      description: revokeApiKeyToolDefinition.description,
      inputSchema: {
        keyId: z.string().uuid().describe("The UUID of the API key to revoke"),
      },
      annotations: revokeApiKeyAnnotations,
    },
    async (args) => {
      debug("revoke_api_key called", args.keyId);
      const input = RevokeApiKeyInputSchema.parse(args);
      const { text, isError } = await executeRevokeApiKey(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register create_api_key tool (OAuth-based, no email/password required)
  server.registerTool(
    createApiKeyToolDefinition.name,
    {
      title: "Create API Key",
      description: createApiKeyToolDefinition.description,
      inputSchema: {
        keyName: z
          .string()
          .max(100)
          .optional()
          .describe("Optional name for the API key"),
      },
      annotations: createApiKeyAnnotations,
    },
    async (args) => {
      debug("create_api_key called");
      const input = CreateApiKeyInputSchema.parse(args);
      const { text, isError } = await executeCreateApiKey(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // ========================================================================
  // AUDIT TOOLS (Technical Debt Analysis)
  // ========================================================================

  // Register create_audit tool (API-based, requires API key with audit:write)
  server.registerTool(
    createAuditToolDefinition.name,
    {
      title: "Create Technical Debt Audit",
      description: createAuditToolDefinition.description,
      inputSchema: {
        name: z.string().min(1).max(200).describe("Name for the audit report"),
        technologies: z
          .array(
            z.object({
              name: z.string().min(1).describe("Technology name"),
              version: z.string().optional().describe("Version string"),
              category: z.string().optional().describe("Category"),
            }),
          )
          .min(1)
          .max(50)
          .describe("Technologies to audit"),
      },
      annotations: createAuditAnnotations,
    },
    async (args) => {
      debug("create_audit called", args);
      const input = CreateAuditInputSchema.parse(args);
      const { text, isError } = await executeCreateAudit(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register get_audit tool (API-based, requires API key with audit:read)
  server.registerTool(
    getAuditToolDefinition.name,
    {
      title: "Get Audit Report",
      description: getAuditToolDefinition.description,
      inputSchema: {
        auditId: z.string().uuid().describe("Audit report UUID"),
      },
      annotations: getAuditAnnotations,
    },
    async (args) => {
      debug("get_audit called", args);
      const input = GetAuditInputSchema.parse(args);
      const { text, isError } = await executeGetAudit(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register list_audits tool (API-based, requires API key with audit:read)
  server.registerTool(
    listAuditsToolDefinition.name,
    {
      title: "List Audit Reports",
      description: listAuditsToolDefinition.description,
      inputSchema: {
        limit: z.number().min(1).max(50).optional().describe("Max results"),
        offset: z.number().min(0).optional().describe("Pagination offset"),
      },
      annotations: listAuditsAnnotations,
    },
    async (args) => {
      debug("list_audits called", args);
      const input = ListAuditsInputSchema.parse(args);
      const { text, isError } = await executeListAudits(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register compare_audits tool (API-based, requires API key with audit:read)
  server.registerTool(
    compareAuditsToolDefinition.name,
    {
      title: "Compare Audit Reports",
      description: compareAuditsToolDefinition.description,
      inputSchema: {
        baseAuditId: z.string().uuid().describe("Base (older) audit ID"),
        compareAuditId: z.string().uuid().describe("Compare (newer) audit ID"),
      },
      annotations: compareAuditsAnnotations,
    },
    async (args) => {
      debug("compare_audits called", args);
      const input = CompareAuditsInputSchema.parse(args);
      const { text, isError } = await executeCompareAudits(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register get_audit_quota tool (API-based, requires API key)
  server.registerTool(
    getAuditQuotaToolDefinition.name,
    {
      title: "Get Audit Quota",
      description: getAuditQuotaToolDefinition.description,
      inputSchema: {},
      annotations: getAuditQuotaAnnotations,
    },
    async () => {
      debug("get_audit_quota called");
      const { text, isError } = await executeGetAuditQuota();
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register get_migration_recommendation tool (API-based, requires API key with audit:read)
  server.registerTool(
    getMigrationRecommendationToolDefinition.name,
    {
      title: "Get Migration Recommendation",
      description: getMigrationRecommendationToolDefinition.description,
      inputSchema: {
        auditId: z
          .string()
          .uuid()
          .describe("Audit report UUID to analyze for migration"),
      },
      annotations: getMigrationRecommendationAnnotations,
    },
    async (args) => {
      debug("get_migration_recommendation called", args);
      const input = GetMigrationRecommendationInputSchema.parse(args);
      const { text, isError } = await executeGetMigrationRecommendation(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register import_better_t_stack tool (API-based, requires API key with audit:write)
  server.registerTool(
    importBetterTStackToolDefinition.name,
    {
      title: "Import Better-T-Stack Project",
      description: importBetterTStackToolDefinition.description,
      inputSchema: {
        type: z.enum(["github", "package-json"]).describe("Import source type"),
        url: z
          .string()
          .optional()
          .describe("GitHub repository URL (for type=github)"),
        content: z
          .string()
          .optional()
          .describe("Raw package.json content (for type=package-json)"),
        name: z.string().max(200).optional().describe("Custom audit name"),
      },
      annotations: createAuditAnnotations, // Reuse audit annotations
    },
    async (args) => {
      debug("import_better_t_stack called", args);
      const input = ImportBetterTStackInputSchema.parse(args);
      const { text, isError } = await executeImportBetterTStack(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // ========================================================================
  // PROJECT-KIT TOOLS (MCPFinder)
  // ========================================================================

  // Register generate_mcp_kit tool (local, no API key required)
  server.registerTool(
    generateMCPKitTool.name,
    {
      title: "Generate MCP Kit",
      description: generateMCPKitTool.description,
      inputSchema: {
        projectDescription: z
          .string()
          .min(50)
          .max(5000)
          .describe("Describe your project (50-5000 chars)"),
        priorities: z
          .array(z.enum(PRIORITIES))
          .max(3)
          .optional()
          .describe("Top priorities (max 3)"),
        constraints: z
          .array(z.string())
          .optional()
          .describe("Tech constraints (e.g., must-use-postgresql)"),
        projectType: z
          .enum(PROJECT_TYPES)
          .optional()
          .describe("Project type (if known)"),
        scale: z.enum(SCALES).optional().describe("Project scale (if known)"),
      },
      annotations: generateMcpKitAnnotations,
    },
    async (args) => {
      debug("generate_mcp_kit called", args);
      const input = GenerateMCPKitInputSchema.parse(args);
      const result = generateMCPKit(input);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // Register analyze_repo_mcps tool (local, no API key required)
  server.registerTool(
    analyzeRepoMcpsTool.name,
    {
      title: "Analyze Repository MCPs",
      description: analyzeRepoMcpsTool.description,
      inputSchema: {
        includeInstalled: z
          .boolean()
          .optional()
          .describe("Include already installed MCPs (default: false)"),
        mcpConfigPath: z
          .string()
          .optional()
          .describe("Override path to MCP configuration file"),
        workspaceRoot: z
          .string()
          .optional()
          .describe(
            "Override workspace root directory (default: current directory)",
          ),
      },
      annotations: analyzeRepoMcpsAnnotations,
    },
    async (args) => {
      debug("analyze_repo_mcps called", args);
      const input = AnalyzeRepoMCPsInputSchema.parse(args);
      const result = await analyzeRepo(input);
      // Format as markdown for better readability
      return {
        content: [{ type: "text", text: formatAnalysisResult(result) }],
      };
    },
  );

  // Register prepare_mcp_installation tool (local, no API key required)
  server.registerTool(
    prepareMCPInstallationTool.name,
    {
      title: "Prepare MCP Installation",
      description: prepareMCPInstallationTool.description,
      inputSchema: {
        workspaceRoot: z
          .string()
          .optional()
          .describe("Workspace root directory (default: current directory)"),
        mcpConfigPath: z
          .string()
          .optional()
          .describe("Override path to existing MCP configuration file"),
        includeInstalled: z
          .boolean()
          .optional()
          .describe(
            "Include already installed MCPs in the preparation (default: false)",
          ),
        envMcpPath: z
          .string()
          .optional()
          .describe(
            "Path where .env-mcp will be created (default: .env-mcp in workspaceRoot)",
          ),
      },
      annotations: prepareMcpInstallationAnnotations,
    },
    async (args) => {
      debug("prepare_mcp_installation called", args);
      const input = PrepareMCPInstallationInputSchema.parse(args);
      const result = await prepareMCPInstallation(input);
      return {
        content: [
          {
            type: "text",
            text: result.message + "\n\n" + formatPreparationSummary(result),
          },
        ],
      };
    },
  );

  // Register execute_mcp_installation tool (local, no API key required)
  server.registerTool(
    executeMCPInstallationTool.name,
    {
      title: "Execute MCP Installation",
      description: executeMCPInstallationTool.description,
      inputSchema: {
        envMcpPath: z
          .string()
          .optional()
          .describe(
            "Path to .env-mcp file (default: .env-mcp in current directory)",
          ),
        targetClient: z
          .enum([
            "claude-code",
            "claude-desktop",
            "cursor",
            "vscode",
            "windsurf",
          ])
          .optional()
          .describe(
            "Target IDE/client for installation (default: claude-code)",
          ),
        dryRun: z
          .boolean()
          .optional()
          .describe(
            "Only generate commands without marking ready to execute (default: false)",
          ),
      },
      annotations: executeMcpInstallationAnnotations,
    },
    async (args) => {
      debug("execute_mcp_installation called", args);
      const input = ExecuteMCPInstallationInputSchema.parse(args);
      const result = await executeMCPInstallation(input);
      return {
        content: [{ type: "text", text: formatExecutionResult(result) }],
      };
    },
  );

  // ========================================================================
  // COMPATIBILITY TOOL (MCP Conflict Detection)
  // ========================================================================

  // Register check_mcp_compatibility tool (local, no API key required)
  server.registerTool(
    checkCompatibilityToolDefinition.name,
    {
      title: "Check MCP Compatibility",
      description: checkCompatibilityToolDefinition.description,
      inputSchema: {
        mcps: z
          .array(z.string().min(1))
          .min(1)
          .max(20)
          .describe("Array of MCP server IDs to check compatibility between"),
      },
      annotations: checkCompatibilityAnnotations,
    },
    async (args) => {
      debug("check_mcp_compatibility called", args);
      const input = CheckCompatibilityInputSchema.parse(args);
      const { text, data, isError } = executeCheckCompatibility(input);
      return {
        content: [
          { type: "text", text },
          {
            type: "text",
            text: `\n---\n\n**Structured Data:**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
          },
        ],
        isError,
      };
    },
  );

  // Register get_workflow_guide tool (local, FREE, no API key required)
  server.registerTool(
    getWorkflowGuideToolDefinition.name,
    {
      title: "Get Workflow Guide",
      description: getWorkflowGuideToolDefinition.description,
      inputSchema: {
        current_goal: z
          .enum(WORKFLOW_GOALS)
          .optional()
          .describe("What the user is trying to accomplish"),
        completed_tools: z
          .array(z.string())
          .optional()
          .describe("Tools already called in this session"),
        user_tier: z
          .enum(USER_TIERS)
          .optional()
          .describe("User tier: free, pro, or unknown"),
        known_constraints: z
          .array(z.string())
          .optional()
          .describe("Constraints like must_use_postgresql"),
        context: z
          .enum(WORKFLOW_CONTEXTS)
          .optional()
          .describe("Client context for adapted snippets"),
      },
      annotations: getWorkflowGuideAnnotations,
    },
    async (args) => {
      debug("get_workflow_guide called", args);
      const input = GetWorkflowGuideInputSchema.parse(args);
      const { text } = executeGetWorkflowGuide(input);
      return {
        content: [{ type: "text", text }],
      };
    },
  );

  // ========================================================================
  // ESTIMATOR TOOLS (Project Scope & Pricing)
  // ========================================================================

  // Register estimate_project tool (API-based, requires API key with estimate:write)
  server.registerTool(
    estimateProjectToolDefinition.name,
    {
      title: "Estimate Project",
      description: estimateProjectToolDefinition.description,
      inputSchema: {
        specs: z
          .string()
          .min(100)
          .max(10000)
          .describe("Project specifications (min 100 chars, max 10,000)"),
        teamSize: z
          .number()
          .min(1)
          .max(100)
          .optional()
          .describe("Number of developers"),
        seniorityLevel: z
          .enum(["junior", "mid", "senior", "expert"])
          .optional()
          .describe("Average team seniority (default: mid)"),
        region: z
          .enum(["france", "us", "uk", "remote-global"])
          .optional()
          .describe("Region for pricing (default: france)"),
        includeMarket: z
          .boolean()
          .optional()
          .describe("Include market analysis (default: true)"),
      },
      annotations: estimateProjectAnnotations,
    },
    async (args) => {
      debug("estimate_project called", {
        specsLength: (args.specs as string)?.length,
      });
      const input = EstimateProjectInputSchema.parse(args);
      const { text, isError } = await executeEstimateProject(input);
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  // Register get_estimate_quota tool (API-based, requires API key)
  server.registerTool(
    getEstimateQuotaToolDefinition.name,
    {
      title: "Get Estimate Quota",
      description: getEstimateQuotaToolDefinition.description,
      inputSchema: {},
      annotations: getEstimateQuotaAnnotations,
    },
    async () => {
      debug("get_estimate_quota called");
      const { text, isError } = await executeGetEstimateQuota({});
      return {
        content: [{ type: "text", text }],
        isError,
      };
    },
  );

  info(
    "Registered 26 tools: list_technologies, analyze_tech, compare_techs, recommend_stack_demo, recommend_stack, get_blueprint, create_blueprint, setup_api_key, list_api_keys, revoke_api_key, create_api_key, create_audit, get_audit, list_audits, compare_audits, get_audit_quota, get_migration_recommendation, import_better_t_stack, generate_mcp_kit, analyze_repo_mcps, prepare_mcp_installation, execute_mcp_installation, check_mcp_compatibility, get_workflow_guide, estimate_project, get_estimate_quota",
  );

  return server;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format analyze_repo_mcps result as readable markdown.
 */
function formatAnalysisResult(result: AnalyzeRepoMCPsOutput): string {
  const lines: string[] = [];

  lines.push("# Repository Analysis\n");

  // Detected Stack
  lines.push("## Detected Technologies\n");

  const stackItems = [
    result.detectedStack.frontend &&
      `- **Frontend**: ${result.detectedStack.frontend.name}${result.detectedStack.frontend.version ? ` (${result.detectedStack.frontend.version})` : ""}`,
    result.detectedStack.backend &&
      `- **Backend**: ${result.detectedStack.backend.name}${result.detectedStack.backend.version ? ` (${result.detectedStack.backend.version})` : ""}`,
    result.detectedStack.database &&
      `- **Database**: ${result.detectedStack.database.name}${result.detectedStack.database.version ? ` (${result.detectedStack.database.version})` : ""}`,
    result.detectedStack.orm &&
      `- **ORM**: ${result.detectedStack.orm.name}${result.detectedStack.orm.version ? ` (${result.detectedStack.orm.version})` : ""}`,
    result.detectedStack.auth &&
      `- **Auth**: ${result.detectedStack.auth.name}${result.detectedStack.auth.version ? ` (${result.detectedStack.auth.version})` : ""}`,
    result.detectedStack.hosting &&
      `- **Hosting**: ${result.detectedStack.hosting.name}${result.detectedStack.hosting.version ? ` (${result.detectedStack.hosting.version})` : ""}`,
    result.detectedStack.payments &&
      `- **Payments**: ${result.detectedStack.payments.name}${result.detectedStack.payments.version ? ` (${result.detectedStack.payments.version})` : ""}`,
  ].filter((item): item is string => Boolean(item));

  if (stackItems.length > 0) {
    lines.push(...stackItems);
  } else {
    lines.push("_No technologies detected from project files._");
  }

  if (result.detectedStack.services.length > 0) {
    lines.push("\n**Services**:");
    for (const service of result.detectedStack.services) {
      lines.push(`- ${service.name}`);
    }
  }

  lines.push("");

  // Files Analyzed
  lines.push("## Files Analyzed\n");
  if (result.metadata.filesAnalyzed.length > 0) {
    lines.push(
      result.metadata.filesAnalyzed.map((f) => `- \`${f}\``).join("\n"),
    );
  } else {
    lines.push("_No recognized configuration files found._");
  }
  lines.push("");

  // Installed MCPs
  if (result.installedMcps.length > 0) {
    lines.push("## Already Installed MCPs\n");
    lines.push(result.installedMcps.map((m) => `- ${m}`).join("\n"));
    lines.push("");
  }

  // Recommended MCPs
  lines.push("## Recommended MCPs\n");

  if (result.recommendedMcps.length === 0) {
    lines.push(
      "_No additional MCPs recommended. You have everything you need!_",
    );
  } else {
    // Group by priority
    const highPriority = result.recommendedMcps.filter(
      (m) => m.priority === "high",
    );
    const mediumPriority = result.recommendedMcps.filter(
      (m) => m.priority === "medium",
    );
    const lowPriority = result.recommendedMcps.filter(
      (m) => m.priority === "low",
    );

    if (highPriority.length > 0) {
      lines.push("### High Priority\n");
      for (const mcp of highPriority) {
        lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
        lines.push(`- ${mcp.description}`);
        lines.push(`- _Matched: ${mcp.matchedTech}_`);
        lines.push("");
      }
    }

    if (mediumPriority.length > 0) {
      lines.push("### Medium Priority\n");
      for (const mcp of mediumPriority) {
        lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
        lines.push(`- ${mcp.description}`);
        lines.push(`- _Matched: ${mcp.matchedTech}_`);
        lines.push("");
      }
    }

    if (lowPriority.length > 0) {
      lines.push("### Low Priority\n");
      for (const mcp of lowPriority) {
        lines.push(`**${mcp.name}** (\`${mcp.slug}\`)`);
        lines.push(`- ${mcp.description}`);
        lines.push(`- _Matched: ${mcp.matchedTech}_`);
        lines.push("");
      }
    }
  }

  // Quick Install
  if (result.recommendedMcps.length > 0) {
    lines.push("## Quick Install\n");
    lines.push(
      "Add to your Claude Desktop config (`claude_desktop_config.json`):\n",
    );
    lines.push("```json");
    lines.push(JSON.stringify(result.installConfig.claudeDesktop, null, 2));
    lines.push("```\n");
  }

  // Metadata
  lines.push(`---\n_Analysis completed: ${result.metadata.analysisDate}_`);

  return lines.join("\n");
}

/**
 * Format prepare_mcp_installation result summary.
 */
function formatPreparationSummary(result: {
  mcpsToInstall: Array<{
    slug: string;
    name: string;
    priority: string;
    envVars: Array<{ requirement: string }>;
  }>;
  installedMcps: string[];
  envMcpPath: string;
}): string {
  const lines: string[] = [];

  // MCPs to install grouped by priority
  if (result.mcpsToInstall.length > 0) {
    lines.push("## MCPs to Install\n");

    const highPriority = result.mcpsToInstall.filter(
      (m) => m.priority === "high",
    );
    const mediumPriority = result.mcpsToInstall.filter(
      (m) => m.priority === "medium",
    );
    const lowPriority = result.mcpsToInstall.filter(
      (m) => m.priority === "low",
    );

    if (highPriority.length > 0) {
      lines.push("### 🔴 High Priority");
      for (const mcp of highPriority) {
        const requiredVars = mcp.envVars.filter(
          (v) => v.requirement === "required",
        ).length;
        lines.push(`- **${mcp.name}** (${requiredVars} required vars)`);
      }
      lines.push("");
    }

    if (mediumPriority.length > 0) {
      lines.push("### 🟡 Medium Priority");
      for (const mcp of mediumPriority) {
        const requiredVars = mcp.envVars.filter(
          (v) => v.requirement === "required",
        ).length;
        lines.push(`- **${mcp.name}** (${requiredVars} required vars)`);
      }
      lines.push("");
    }

    if (lowPriority.length > 0) {
      lines.push("### 🟢 Low Priority");
      for (const mcp of lowPriority) {
        const requiredVars = mcp.envVars.filter(
          (v) => v.requirement === "required",
        ).length;
        lines.push(`- **${mcp.name}** (${requiredVars} required vars)`);
      }
      lines.push("");
    }
  }

  // Already installed
  if (result.installedMcps.length > 0) {
    lines.push("## Already Installed");
    for (const mcp of result.installedMcps) {
      lines.push(`- ✅ ${mcp}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format execute_mcp_installation result.
 */
function formatExecutionResult(result: {
  commands: Array<{
    slug: string;
    name: string;
    status: string;
    missingVars: string[];
    claudeCodeCommand?: string;
  }>;
  readyCount: number;
  pendingCount: number;
  aggregateCommand?: string;
  aggregateConfig?: Record<string, unknown>;
  postInstallInstructions: string[];
  message: string;
}): string {
  const lines: string[] = [];

  lines.push(result.message);
  lines.push("");

  // Show aggregate command for Claude Code
  if (result.aggregateCommand) {
    lines.push("---\n");
    lines.push("## Claude Code Installation\n");
    lines.push("Run this command to install all ready MCPs:\n");
    lines.push("```bash");
    lines.push(result.aggregateCommand);
    lines.push("```\n");
  }

  // Show JSON config for other clients
  if (result.aggregateConfig && !result.aggregateCommand) {
    lines.push("---\n");
    lines.push("## JSON Configuration\n");
    lines.push("Add this to your MCP configuration file:\n");
    lines.push("```json");
    lines.push(JSON.stringify(result.aggregateConfig, null, 2));
    lines.push("```\n");
  }

  // Post-install instructions
  if (result.postInstallInstructions.length > 0) {
    lines.push("---\n");
    lines.push("## Post-Installation\n");
    for (const instruction of result.postInstallInstructions) {
      lines.push(instruction);
    }
  }

  return lines.join("\n");
}
