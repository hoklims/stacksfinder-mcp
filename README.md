# @stacksfinder/mcp-server

MCP (Model Context Protocol) server that exposes StacksFinder's tech stack recommendation capabilities to LLM clients like Claude Desktop, Cursor, and other MCP-compatible tools.

## Installation

### Via npx (recommended)

```bash
npx @stacksfinder/mcp-server
```

### Global install

```bash
npm install -g @stacksfinder/mcp-server
stacksfinder-mcp
```

### From source

```bash
cd packages/mcp-server
bun install
bun run build
bun run start
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STACKSFINDER_API_URL` | No | `https://stacksfinder.com` | API base URL |
| `STACKSFINDER_API_KEY` | Yes* | - | API key for `recommend_stack` and `get_blueprint` tools |
| `STACKSFINDER_MCP_DEBUG` | No | `false` | Enable debug logging to stderr |

\* Required only for API-based tools (`recommend_stack`, `get_blueprint`). Local tools (`list_technologies`, `analyze_tech`, `compare_techs`) work without an API key.

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "stacksfinder": {
      "command": "npx",
      "args": ["-y", "@stacksfinder/mcp-server"],
      "env": {
        "STACKSFINDER_API_KEY": "sk_live_xxx"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "stacksfinder": {
      "command": "npx",
      "args": ["-y", "@stacksfinder/mcp-server"],
      "env": {
        "STACKSFINDER_API_KEY": "sk_live_xxx"
      }
    }
  }
}
```

## Available Tools

### `list_technologies`

Lists all available technology IDs. Use this for discovery before calling other tools.

**Input:**
```json
{
  "category": "meta-framework"  // Optional: filter by category
}
```

**Categories:** `frontend`, `backend`, `meta-framework`, `database`, `orm`, `auth`, `hosting`

### `analyze_tech`

Detailed analysis of a single technology with 6-dimension scores.

**Input:**
```json
{
  "technology": "nextjs",
  "context": "mvp"  // Optional: 'default' | 'mvp' | 'enterprise'
}
```

**Output includes:**
- 6-dimension scores (Performance, DX, Ecosystem, Maintainability, Cost, Compliance)
- Strengths and weaknesses
- Top 8 compatible technologies

### `compare_techs`

Side-by-side comparison of 2-4 technologies.

**Input:**
```json
{
  "technologies": ["nextjs", "sveltekit", "nuxt"],
  "context": "default"  // Optional
}
```

**Output includes:**
- Overall scores with grades
- Per-dimension winners with margins
- Compatibility matrix between all pairs
- Verdict and recommendation

### `recommend_stack` (requires API key)

Recommends an optimal tech stack for a project.

**Input:**
```json
{
  "projectType": "saas",
  "scale": "mvp",  // Optional: 'mvp' | 'startup' | 'growth' | 'enterprise'
  "priorities": ["time-to-market", "cost-efficiency"],  // Optional, max 3
  "constraints": ["real-time"]  // Optional
}
```

**Project Types:** `web-app`, `saas`, `api`, `e-commerce`, `content`, `dashboard`, `marketplace`

### `get_blueprint` (requires API key)

Fetches an existing blueprint by ID (generated via StacksFinder web UI).

**Input:**
```json
{
  "blueprintId": "uuid-here"
}
```

## Score Dimensions

All technology scores are measured across 6 dimensions (0-100):

| Dimension | Description |
|-----------|-------------|
| Performance (perf) | Runtime speed, bundle size, optimization potential |
| Developer Experience (dx) | Learning curve, tooling, documentation quality |
| Ecosystem | Community size, third-party integrations, job market |
| Maintainability (maintain) | Long-term code health, upgrade path, testing support |
| Cost Efficiency (cost) | Hosting costs, licensing, operational overhead |
| Compliance | Security features, audit readiness, enterprise policies |

## Contexts

Scores can vary by project context:

- **default**: General-purpose scores
- **mvp**: Optimized for speed-to-market, lower cost
- **enterprise**: Emphasizes compliance, maintainability, support

## Error Handling

The server returns structured errors with codes:

| Code | Description |
|------|-------------|
| `TECH_NOT_FOUND` | Unknown technology ID (includes suggestions) |
| `UNAUTHORIZED` | Invalid or missing API key |
| `RATE_LIMITED` | Too many API requests |
| `TIMEOUT` | API request timed out |
| `NOT_FOUND` | Blueprint not found |
| `INVALID_INPUT` | Invalid input parameters |
| `API_ERROR` | Unexpected API error |
| `CONFIG_ERROR` | Missing configuration |

When a technology isn't found, the error includes similar suggestions using Levenshtein distance:

```
**Error (TECH_NOT_FOUND)**: Technology "nexjs" not found.
**Suggestions**: nextjs, nuxt, nestjs
```

## API Protection

The server includes built-in protections for API-based tools:

- **Concurrency limit**: Max 2 simultaneous API requests
- **TTL cache**: 60-second cache for `recommend_stack` responses
- **Timeout**: 15-second request timeout

## Troubleshooting

### Debug mode

Enable verbose logging:

```bash
STACKSFINDER_MCP_DEBUG=true npx @stacksfinder/mcp-server
```

### Common issues

**"API key required"**
- Set `STACKSFINDER_API_KEY` in your MCP client config
- Get an API key from https://stacksfinder.com/settings/api

**"Rate limited"**
- The 60-second cache should prevent most rate limiting
- Wait and retry, or reduce request frequency

**"Technology not found"**
- Use `list_technologies` to see available IDs
- Check suggestions in the error message for typos

**Server not responding**
- Ensure stdout is not used for logging (we use stderr)
- Check MCP client logs for connection errors

## Data Version

Local data (technology scores, compatibility matrix) is versioned. The current version is included in all tool outputs:

```
Data version: 2024.12.29
```

This ensures reproducibility - same input + same data version = same output.

## SDK Compatibility

This server targets MCP SDK v1.x (`@modelcontextprotocol/sdk@^1.25.1`). The SDK v2 transition is in progress.

## Development

```bash
# Install dependencies
bun install

# Run in dev mode (with watch)
bun run dev

# Build
bun run build

# Run tests
bun test

# Check data sync with source
bun run check-data-sync
```

## License

MIT
