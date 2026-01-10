# @stacksfinder/mcp-server

[![smithery badge](https://smithery.ai/badge/hoklims/stacksfinder-mcp)](https://smithery.ai/server/hoklims/stacksfinder-mcp)
[![npm version](https://img.shields.io/npm/v/@stacksfinder/mcp-server.svg)](https://www.npmjs.com/package/@stacksfinder/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) server that brings **deterministic tech stack recommendations** to LLM clients like Claude, Cursor, Windsurf, and other MCP-compatible tools.

**Try it free** — 8 tools work without an account, including a daily demo recommendation and MCP project kit tools.

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
| `recommend_stack_demo` | **FREE 1x/day** — Full stack recommendation for any project type |
| `check_mcp_compatibility` | 🆕 Check conflicts, redundancies, and synergies between MCP servers |
| `generate_mcp_kit` | 🆕 Generate optimal stack + recommended MCPs from project description |
| `analyze_repo_mcps` | 🆕 Analyze your repository and recommend relevant MCP servers |
| `prepare_mcp_installation` | 🆕 Detect MCPs needed and generate `.env-mcp` template |
| `execute_mcp_installation` | 🆕 Parse `.env-mcp` and generate IDE install commands |

### Pro Tools (requires API key)

| Tool | Description |
|------|-------------|
| `recommend_stack` | Unlimited recommendations with priorities & constraints |
| `get_blueprint` | Fetch existing blueprint by ID |
| `create_blueprint` | Generate new blueprint with AI narrative |
| `setup_api_key` | Authenticate and create API key from MCP |
| `list_api_keys` | List your API keys |
| `revoke_api_key` | Revoke an API key |

### Audit Tools (requires API key) 🆕

| Tool | Description |
|------|-------------|
| `create_audit` | Run technical debt audit on your stack |
| `get_audit` | Fetch audit report by ID |
| `list_audits` | List your audit reports |
| `compare_audits` | Compare two audits to track progress |
| `get_audit_quota` | Check your remaining audit quota |
| `get_migration_recommendation` | **NEW** Analyze audit for migration opportunities with builder constraints |

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

### create_audit (Pro)

```
> create_audit name="Q1 2026 Review" technologies=[{name:"react",version:"18.2.0"},{name:"lodash",version:"4.17.20"},{name:"express",version:"4.17.0"}]

## Audit Report: Q1 2026 Review

**Health Score: 72/100** ⚠️

| Severity | Count |
|----------|-------|
| 🔴 Critical | 2 |
| 🟠 High | 1 |
| 🟡 Medium | 3 |
| 🟢 Low | 2 |
| ℹ️ Info | 5 |

### Critical Findings

**🔴 Security vulnerability in lodash** (lodash 4.17.20)
CVE-2021-23337 - Prototype pollution vulnerability
→ Upgrade to lodash 4.17.21 or later

**🔴 Outdated Express version** (express 4.17.0)
Express 4.17.0 is missing security patches
→ Upgrade to express 4.21+ for security fixes
```

### compare_audits (Pro)

```
> compare_audits baseAuditId="uuid-jan" compareAuditId="uuid-mar"

## Audit Comparison

**Trend: 📈 Improving** (+16 health score)

| Metric | January | March |
|--------|---------|-------|
| Health Score | 62 | 78 |
| Critical | 4 | 1 |
| High | 6 | 3 |

### Resolved Issues (6)
- ✅ Critical: lodash vulnerability
- ✅ High: moment.js deprecation
- ✅ High: outdated Node version
```

### check_mcp_compatibility 🆕

```
> check_mcp_compatibility mcps=["supabase-mcp", "neon-mcp", "prisma-mcp"]

## MCP Compatibility Check

**Health Score: 65/100** (Grade: C)

### ⚠️ Conflicts (1)
- **supabase-mcp** ↔ **neon-mcp**: Both provide database services

### 🔄 Redundancies (1)
- **prisma-mcp** + **supabase-mcp**: Supabase has built-in client

### ✅ Synergies (0)
None detected

### 💡 Suggestions
- Choose one database provider (Supabase OR Neon)
- If using Supabase, Prisma may be redundant
```

### generate_mcp_kit 🆕

```
> generate_mcp_kit projectDescription="SaaS for project management with Supabase and Stripe"

## Recommended Stack

| Category | Technology | Score |
|----------|------------|-------|
| meta-framework | SvelteKit | 84 |
| database | Supabase | 82 |
| auth | Better Auth | 80 |
| payments | Stripe | 96 |

## Recommended MCPs

| MCP | Priority | Why |
|-----|----------|-----|
| supabase-mcp | High | Direct database access |
| stripe-mcp | High | Payment integration |
| github-mcp | Medium | Version control |

Install all with:
claude mcp add-json supabase-mcp '{"command":"npx","args":["-y","@supabase/mcp"]}'
```

### prepare_mcp_installation 🆕

```
> prepare_mcp_installation

✅ Generated .env-mcp with 5 MCP(s) to install.

📋 Next steps:
1. Open .env-mcp
2. Fill in the 3 required environment variable(s)
3. Set INSTALL_xxx=false for any MCPs you want to skip
4. Run execute_mcp_installation to install the MCPs
```

### execute_mcp_installation 🆕

```
> execute_mcp_installation targetClient="claude-code"

# MCP Installation Summary

- ✅ Ready to install: 3
- ⏳ Missing credentials: 1
- ⏭️ Skipped: 1

## Ready to Install
- ✅ **Supabase MCP** (`supabase-mcp`)
- ✅ **GitHub MCP** (`github-mcp`)
- ✅ **Context7 MCP** (`context7-mcp`)

## Installation Command
claude mcp add-json supabase-mcp '...' && claude mcp add-json github-mcp '...'
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
- **Discord**: [discord.gg/scBHF2EumC](https://discord.gg/scBHF2EumC)
- **Glama**: [glama.ai/mcp/servers/@stacksfinder/mcp-server](https://glama.ai/mcp/servers/@stacksfinder/mcp-server)
- **Smithery**: [smithery.ai/server/hoklims/stacksfinder-mcp](https://smithery.ai/server/hoklims/stacksfinder-mcp)
- **GitHub**: [github.com/hoklims/stacksfinder-mcp](https://github.com/hoklims/stacksfinder-mcp)
- **npm**: [@stacksfinder/mcp-server](https://www.npmjs.com/package/@stacksfinder/mcp-server)

## License

MIT