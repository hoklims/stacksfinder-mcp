# @stacksfinder/mcp-server

[![npm version](https://img.shields.io/npm/v/@stacksfinder/mcp-server.svg)](https://www.npmjs.com/package/@stacksfinder/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

<a href="https://glama.ai/mcp/servers/@hoklims/stacksfinder-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@hoklims/stacksfinder-mcp/badge" alt="StacksFinder MCP server" />
</a>

MCP (Model Context Protocol) server that brings **deterministic tech stack recommendations** to LLM clients like Claude, Cursor, Windsurf, and other MCP-compatible tools.

**Try it free** — 4 tools work without an account, including a daily demo recommendation.

## Quick Start

### Claude Code (CLI)

```bash
# Add to Claude Code
claude mcp add stacksfinder npx -y @stacksfinder/mcp-server

# With API key for full features
claude mcp add-json stacksfinder '{
  "command": "npx",
  "args": ["-y", "@stacksfinder/mcp-server"],
  "env": {"STACKSFINDER_API_KEY": "sk_live_xxx"}
}'
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

### Cursor / Windsurf

Add to `.cursor/mcp.json` or `.windsurf/mcp.json` in your project root:

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

### VS Code + Copilot

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
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

### Free Tools (no account required)

| Tool | Description |
|------|-------------|
| `list_technologies` | List all 30+ tech IDs by category |
| `analyze_tech` | 6-dimension scores, strengths, weaknesses, compatible techs |
| `compare_techs` | Side-by-side comparison of 2-4 technologies |
| `recommend_stack` | **FREE 1x/day** — Full stack recommendation for any project type |

### Pro Tools (requires API key)

| Tool | Description |
|------|-------------|
| `recommend_stack` | Unlimited recommendations with priorities & constraints |
| `get_blueprint` | Fetch existing blueprint by ID |
| `create_blueprint` | Generate new blueprint with AI narrative |
| `setup_api_key` | Authenticate and create API key from MCP |
| `list_api_keys` | List your API keys |
| `revoke_api_key` | Revoke an API key |

Get your API key at [stacksfinder.com/pricing](https://stacksfinder.com/pricing)

## Tool Examples

### list_technologies

```
> list_technologies category="database"

Available databases:
- postgres (PostgreSQL)
- sqlite (SQLite)
- supabase (Supabase)
- planetscale (PlanetScale)
- turso (Turso)
- neon (Neon)
```

### analyze_tech

```
> analyze_tech technology="sveltekit" context="mvp"

## SvelteKit Analysis (MVP Context)

| Dimension | Score | Grade |
|-----------|-------|-------|
| Performance | 92 | A |
| DX | 88 | A |
| Ecosystem | 72 | B |
| Maintainability | 85 | A |
| Cost | 90 | A |
| Compliance | 75 | B |

**Overall: 84/100 (A)**

Strengths:
- Compiler-first architecture, tiny bundles
- Excellent TypeScript support
- Built-in SSR, SSG, and edge rendering

Weaknesses:
- Smaller ecosystem than React
- Fewer enterprise case studies
```

### compare_techs

```
> compare_techs technologies=["nextjs", "sveltekit", "nuxt"]

## Comparison: Next.js vs SvelteKit vs Nuxt

| Tech | Score | Grade |
|------|-------|-------|
| Next.js | 82 | A |
| SvelteKit | 84 | A |
| Nuxt | 79 | B |

Per-dimension winners:
- Performance: SvelteKit (+10)
- DX: SvelteKit (+3)
- Ecosystem: Next.js (+15)
```

### recommend_stack (Free Demo)

```
> recommend_stack projectType="saas" scale="mvp"

## Recommended Stack for SaaS (MVP)

| Category | Technology | Score | Grade |
|----------|------------|-------|-------|
| meta-framework | SvelteKit | 84 | A |
| database | Supabase | 82 | A |
| orm | Drizzle | 86 | A |
| auth | Better Auth | 80 | A |
| hosting | Vercel | 85 | A |
| payments | Paddle | 86 | A |

**Confidence**: medium (demo mode)

---
Want more? Upgrade to Pro for custom priorities, constraints, and AI narratives.
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STACKSFINDER_API_KEY` | For Pro tools | - | API key from stacksfinder.com |
| `STACKSFINDER_API_URL` | No | `https://stacksfinder.com` | API base URL |
| `STACKSFINDER_MCP_DEBUG` | No | `false` | Enable debug logging |

## Score Dimensions

All technology scores are measured across 6 dimensions (0-100):

| Dimension | Description |
|-----------|-------------|
| **Performance** | Runtime speed, bundle size, optimization potential |
| **DX** | Learning curve, tooling, documentation quality |
| **Ecosystem** | Community size, integrations, job market |
| **Maintainability** | Long-term code health, upgrade path |
| **Cost** | Hosting costs, licensing, operational overhead |
| **Compliance** | Security features, audit readiness |

## Contexts

Scores vary by project context:

- **default**: General-purpose scores
- **mvp**: Optimized for speed-to-market, lower cost
- **enterprise**: Emphasizes compliance, maintainability, support

## Error Handling

Structured errors with suggestions:

```
**Error (TECH_NOT_FOUND)**: Technology "nexjs" not found.
**Suggestions**: nextjs, nuxt, nestjs
```

## Troubleshooting

### Debug mode

```bash
STACKSFINDER_MCP_DEBUG=true npx @stacksfinder/mcp-server
```

### Common issues

| Issue | Solution |
|-------|----------|
| "API key required" | Get key at [stacksfinder.com/pricing](https://stacksfinder.com/pricing) |
| "Daily limit reached" | Wait 24h or upgrade to Pro |
| "Technology not found" | Use `list_technologies` to see valid IDs |

## Development

```bash
cd packages/mcp-server
bun install
bun run build
bun run dev      # Watch mode
bun test         # Run tests
```

## Links

- **Website**: [stacksfinder.com](https://stacksfinder.com)
- **Pricing**: [stacksfinder.com/pricing](https://stacksfinder.com/pricing)
- **GitHub**: [github.com/hoklims/stacksfinder-mcp](https://github.com/hoklims/stacksfinder-mcp)
- **npm**: [@stacksfinder/mcp-server](https://www.npmjs.com/package/@stacksfinder/mcp-server)

## License

MIT
