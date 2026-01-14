# @stacksfinder/mcp-server

[![npm version](https://img.shields.io/npm/v/@stacksfinder/mcp-server.svg)](https://www.npmjs.com/package/@stacksfinder/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-8A2BE2.svg)](https://registry.modelcontextprotocol.io)
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
git clone https://github.com/hoklims/stacksfinder-mcp.git
cd stacksfinder-mcp
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
- [SMITHERY.md](SMITHERY.md) - Smithery deployment guide

## Links

- **Website**: [stacksfinder.com](https://stacksfinder.com)
- **Pricing**: [stacksfinder.com/pricing](https://stacksfinder.com/pricing)
- **MCP Registry**: [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io) (Official Anthropic)
- **Discord**: [discord.gg/scBHF2EumC](https://discord.gg/scBHF2EumC)
- **Glama**: [glama.ai/mcp/servers/@stacksfinder/mcp-server](https://glama.ai/mcp/servers/@stacksfinder/mcp-server)
- **Smithery**: [smithery.ai/server/hoklims/stacksfinder-mcp](https://smithery.ai/server/hoklims/stacksfinder-mcp)
- **GitHub**: [github.com/hoklims/stacksfinder-mcp](https://github.com/hoklims/stacksfinder-mcp)
- **npm**: [@stacksfinder/mcp-server](https://www.npmjs.com/package/@stacksfinder/mcp-server)

## License

MIT
