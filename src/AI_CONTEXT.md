# MCP Server Source - AI Context

> **For AI assistants**: Quick reference for MCP server development.

## Directory Structure

```
src/
├── server.ts           # Main server entry point (all tool registrations)
├── index.ts            # Package exports
├── data/               # Scoring data (copied from main app at build)
│   └── index.ts        # Data version & category exports
├── tools/              # Tool implementations
│   ├── list-techs.ts   # list_technologies
│   ├── analyze.ts      # analyze_tech
│   ├── compare.ts      # compare_techs
│   ├── recommend.ts    # recommend_stack (Pro)
│   ├── recommend-demo.ts # recommend_stack_demo (Free, 1x/day)
│   ├── blueprint.ts    # get_blueprint, create_blueprint
│   ├── api-keys.ts     # setup_api_key, list_api_keys, revoke_api_key
│   ├── audit.ts        # create_audit, get_audit, list_audits, compare_audits
│   ├── check-compatibility.ts  # check_mcp_compatibility
│   └── project-kit/    # MCP Kit tools
│       ├── index.ts
│       ├── generate.ts       # generate_mcp_kit
│       ├── analyze.ts        # analyze_repo_mcps
│       ├── prepare.ts        # prepare_mcp_installation
│       └── execute.ts        # execute_mcp_installation
└── utils/              # Shared utilities
    └── api.ts          # API client for StacksFinder backend
```

## Tool Pattern

Each tool follows this pattern:

```typescript
// tools/example.ts
import { z } from 'zod';

// 1. Input schema (Zod)
export const ExampleInputSchema = z.object({
  param: z.string().describe('Parameter description'),
});

// 2. Tool definition (for MCP registration)
export const exampleToolDefinition = {
  name: 'example_tool',
  description: 'What this tool does',
  inputSchema: ExampleInputSchema,
};

// 3. Execution function
export async function executeExample(
  input: z.infer<typeof ExampleInputSchema>,
  context: { apiKey?: string }
): Promise<ToolResult> {
  // Implementation
  return { content: [{ type: 'text', text: result }] };
}
```

## Adding a New Tool

1. Create file in `src/tools/`
2. Export schema, definition, and execute function
3. Register in `server.ts`:
   ```typescript
   import { toolDefinition, execute, InputSchema } from './tools/new-tool.js';
   
   // In setupTools():
   server.tool(toolDefinition.name, toolDefinition.description, InputSchema.shape, async (params) => {
     return execute(params, { apiKey: getApiKey() });
   });
   ```

## API Calls

Tools that need backend data use `src/utils/api.ts`:

```typescript
import { stacksfinderApi } from '../utils/api.js';

const result = await stacksfinderApi('/api/v1/endpoint', {
  method: 'POST',
  body: JSON.stringify(data),
  apiKey: context.apiKey,
});
```

## Free vs Pro Tools

| Tier | Auth Required | Rate Limit |
|------|---------------|------------|
| Free | No | Per-tool limits (e.g., 1x/day for demo) |
| Pro | `STACKSFINDER_API_KEY` env | Per-plan quotas |

Check API key presence in execute function:
```typescript
if (!context.apiKey) {
  return { content: [{ type: 'text', text: 'API key required for this tool' }] };
}
```

## Building & Testing

```bash
bun run build    # Build + copy data files
bun run dev      # Watch mode
bun test         # Run tests
```

## Environment Variables

| Var | Required | Description |
|-----|----------|-------------|
| `STACKSFINDER_API_KEY` | For Pro tools | User's API key |
| `STACKSFINDER_API_URL` | No | Override API URL (default: production) |
