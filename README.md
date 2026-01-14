# @stacksfinder/mcp-server

[![npm version](https://img.shields.io/npm/v/@stacksfinder/mcp-server.svg)](https://www.npmjs.com/package/@stacksfinder/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io)
[![LobeHub](https://img.shields.io/badge/LobeHub-MCP%20Directory-blue.svg)](https://lobehub.com/fr/mcp/hoklims-stacksfinder-mcp)

MCP (Model Context Protocol) server that brings **deterministic tech stack recommendations** to LLM clients like Claude, Cursor, Windsurf, and other MCP-compatible tools.

**Try it free** — 8 tools work without an account, including a daily demo recommendation and MCP project kit.

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

### Claude Code

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

### Estimator Tools (requires API key)

| Tool | Description |
|------|-------------|
| `estimate_project` | Estimate scope, pricing, and market analysis for a project |
| `get_estimate_quota` | Check your remaining estimate quota (weekly/monthly) |

### Pro Tools (requires API key)

| Tool | Description |
|------|-------------|
| `recommend_stack` | Unlimited recommendations with priorities & constraints |
| `get_blueprint` | Fetch existing blueprint by ID |
| `create_blueprint` | Generate new blueprint with AI narrative |
| `setup_api_key` | Authenticate and create API key from MCP |
| `list_api_keys` | List your API keys |
| `revoke_api_key` | Revoke an API key |

### Audit Tools (requires API key)

| Tool | Description |
|------|-------------|
| `create_audit` | Run technical debt audit on your stack |
| `get_audit` | Fetch audit report by ID |
| `list_audits` | List your audit reports |
| `compare_audits` | Compare two audits to track progress |
| `get_audit_quota` | Check your remaining audit quota |
| `get_migration_recommendation` | Analyze audit for migration opportunities with builder constraints |

### Project Kit Tools (no API key required)

| Tool | Description |
|------|-------------|
| `generate_mcp_kit` | Generate optimal tech stack + MCP recommendations from project description |
| `analyze_repo_mcps` | Analyze your repository and recommend relevant MCP servers |
| `prepare_mcp_installation` | Detect MCPs, generate `.env-mcp` template for credentials |
| `execute_mcp_installation` | Parse `.env-mcp` and generate IDE install commands |

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

**Health Score: 72/100** (warning)

| Severity | Count |
|----------|-------|
| [CRITICAL] | 2 |
| [HIGH] | 1 |
| [MEDIUM] | 3 |
| [LOW] | 2 |
| [INFO] | 5 |

### Critical Findings

**[CRITICAL] Security vulnerability in lodash** (lodash 4.17.20)
CVE-2021-23337 - Prototype pollution vulnerability
> Upgrade to lodash 4.17.21 or later

**[CRITICAL] Outdated Express version** (express 4.17.0)
Express 4.17.0 is missing security patches
> Upgrade to express 4.21+ for security fixes
```

### compare_audits (Pro)

```
> compare_audits baseAuditId="uuid-jan" compareAuditId="uuid-mar"

## Audit Comparison

**Trend: Improving** (+16 health score)

| Metric | January | March |
|--------|---------|-------|
| Health Score | 62 | 78 |
| Critical | 4 | 1 |
| High | 6 | 3 |

### Resolved Issues (6)
- [x] Critical: lodash vulnerability
- [x] High: moment.js deprecation
- [x] High: outdated Node version
```

### estimate_project (Pro)

```
> estimate_project specs="Build a SaaS project management tool with: user authentication, team workspaces, task boards with drag-and-drop, real-time collaboration, file attachments, Stripe billing integration, and email notifications. Target: small to medium teams." region="france" seniorityLevel="mid"

## Project Estimate

**ID**: `est_abc123`
**Confidence**: 85%
**Pricing Table Version**: 2026-01

### Scope Analysis

**Total Hours**: 280 - 420h
**Complexity**: high
**Buffer**: 10% (28-42h)

#### Feature Breakdown

| Feature | Hours | Complexity |
|---------|-------|------------|
| User Authentication | 16-24h | simple |
| Team Workspaces | 32-48h | medium |
| Task Boards | 48-72h | complex |
| Real-time Collaboration | 40-60h | complex |
| File Attachments | 24-36h | medium |
| Stripe Integration | 32-48h | medium |
| Email Notifications | 16-24h | simple |

### Pricing (EUR)

| Seniority | Min | Max |
|-----------|-----|-----|
| junior | 12 000 € | 21 000 € |
| mid | 18 000 € | 33 000 € |
| senior | 28 000 € | 50 400 € |
| expert | 40 000 € | 75 600 € |

**Adjustments Applied** (×1.15):
- Payment Integration: +5%
- Real-time Features: +10%
```

### generate_mcp_kit (Free)

```
> generate_mcp_kit projectDescription="I'm building a SaaS for project management with Supabase and Stripe"

## Recommended Tech Stack

| Category | Technology | Score |
|----------|------------|-------|
| meta-framework | SvelteKit | 84 |
| database | Supabase | 82 |
| auth | Supabase Auth | 80 |
| payments | Stripe | 96 |

## Recommended MCPs

| MCP | Priority | Why |
|-----|----------|-----|
| supabase-mcp | High | Direct database access |
| stripe-mcp | High | Payment management |
| context7 | Medium | Documentation lookup |

## Install Configs

Claude Code:
claude mcp add supabase-mcp npx -y @supabase/mcp-server
```

### analyze_repo_mcps (Free)

```
> analyze_repo_mcps

## Detected Technologies
- **Frontend**: SvelteKit (2.x)
- **Database**: PostgreSQL (via Drizzle)
- **Auth**: Lucia
- **Payments**: Paddle

## Recommended MCPs

### High Priority
**Neon MCP** (`@neondatabase/mcp-server`)
- Direct database access and query execution
- _Matched: drizzle, postgresql_

### Medium Priority
**Context7** (`context7`)
- Up-to-date documentation for any library
- _Matched: universal_
```

### prepare_mcp_installation (Free)

```
> prepare_mcp_installation

✅ Created .env-mcp with 3 MCPs requiring configuration.

## MCPs to Install

### 🔴 High Priority
- **Neon MCP** (1 required vars)
- **Paddle MCP** (2 required vars)

### 🟢 Low Priority
- **Context7** (0 required vars)

Edit .env-mcp to add your credentials, then run execute_mcp_installation.
```

### execute_mcp_installation (Free)

```
> execute_mcp_installation targetClient="claude-code"

✅ 2 MCPs ready, 1 pending credentials.

## Claude Code Installation

Run this command to install all ready MCPs:

claude mcp add neon-mcp npx -y @neondatabase/mcp-server && \
claude mcp add context7 npx -y context7

## Post-Installation
- Restart Claude Code to load new MCPs
- Run `claude mcp list` to verify installation
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

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

For security vulnerabilities, please see our [Security Policy](SECURITY.md).

## Documentation

- [CHANGELOG.md](CHANGELOG.md) - Version history and release notes
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [SECURITY.md](SECURITY.md) - Security policy and vulnerability reporting

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
