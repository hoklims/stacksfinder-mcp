# Anthropic MCP Directory Submission

This document contains all materials needed to submit StacksFinder MCP Server to Anthropic's official MCP directory.

## Directory Entry (index.json)

Add this entry to `src/index.json` in the [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) repository:

```json
{
  "stacksfinder": {
    "name": "@stacksfinder/mcp-server",
    "description": "Deterministic tech stack recommendations and project cost estimates. 23 tools for architecture decisions, technology comparison, technical debt audits, and MCP compatibility checking. No hallucinations, just data.",
    "vendor": "StacksFinder",
    "sourceUrl": "https://github.com/hoklims/stacksfinder-mcp",
    "homepage": "https://stacksfinder.com",
    "license": "MIT",
    "runtime": "node",
    "categories": ["developer-tools", "productivity", "architecture"],
    "prompts": [
      "Recommend a tech stack for my SaaS project",
      "Compare Next.js vs SvelteKit for my use case",
      "Estimate the cost to build a marketplace app",
      "Analyze technical debt in my current stack",
      "What MCP servers would help with my React + Supabase project?"
    ]
  }
}
```

---

## Pull Request Template

### Title
```
Add StacksFinder MCP server
```

### Description

```markdown
## StacksFinder MCP Server

Adds deterministic tech stack recommendations and project cost estimates for developers.

### What is StacksFinder?

StacksFinder helps developers make confident technology decisions without relying on LLM hallucinations. All recommendations are based on versioned scoring data with transparent, reproducible results.

### Features (23 Tools)

**Free Tier (No account required):**
- `list_technologies` - Browse 30+ technology catalog
- `analyze_tech` - 6-dimension analysis (performance, DX, ecosystem, etc.)
- `compare_techs` - Side-by-side technology comparison
- `recommend_stack_demo` - 1x/day free recommendation
- `generate_mcp_kit` - Project kit with stack + MCP suggestions
- `analyze_repo_mcps` - Detect stack and recommend MCPs
- `prepare_mcp_installation` - Generate .env-mcp config
- `execute_mcp_installation` - IDE-specific install commands
- `check_mcp_compatibility` - Detect conflicts between MCPs

**Pro Tier:**
- `recommend_stack` - Unlimited recommendations with priorities
- `create_blueprint` / `get_blueprint` - Save and retrieve blueprints
- `create_audit` - Technical debt analysis
- `estimate_project` - Scope and pricing estimation
- API key management tools

### Why Include in Official Directory?

1. **Deterministic**: All scoring is lookup-table based, not LLM-generated
2. **Unique Value**: No other MCP provides architecture decision support
3. **Production Ready**: 23 tools, 70+ tests, TypeScript strict mode
4. **Cross-Platform**: Works with Claude Code, Desktop, Cursor, Windsurf, VS Code
5. **Free Tier**: Core functionality available without account

### Installation

```bash
# Claude Code
claude mcp add stacksfinder npx -y @stacksfinder/mcp-server

# npm
npm install -g @stacksfinder/mcp-server
```

### Links

- **Package:** https://www.npmjs.com/package/@stacksfinder/mcp-server
- **Homepage:** https://stacksfinder.com
- **Documentation:** https://stacksfinder.com/mcp/stacksfinder
- **GitHub:** https://github.com/hoklims/stacksfinder-mcp

### Checklist

- [x] Package published on npm (@stacksfinder/mcp-server v1.3.5)
- [x] MIT License
- [x] Comprehensive README with installation for all platforms
- [x] Example prompts included
- [x] Working installation instructions tested
- [x] CHANGELOG.md documenting version history
- [x] CONTRIBUTING.md with contribution guidelines
- [x] SECURITY.md with vulnerability disclosure policy
- [x] 70+ tests passing
- [x] TypeScript strict mode enabled
```

---

## Checklist Before Submission

- [ ] Package version is current on npm
- [ ] All tests pass: `bun test --run`
- [ ] Build succeeds: `bun run build`
- [ ] README is up to date
- [ ] CHANGELOG reflects latest changes
- [ ] Links are all valid

## Alternative Submission Methods

### 1. Official Form (if available)
Check https://docs.anthropic.com for any submission form.

### 2. GitHub PR (Primary Method)
1. Fork https://github.com/modelcontextprotocol/servers
2. Create branch: `add-stacksfinder-mcp`
3. Add entry to `src/index.json`
4. Optionally add `src/stacksfinder/README.md`
5. Open PR with description above

### 3. Community Directories
Already listed on:
- [Glama.ai](https://glama.ai/mcp/servers/@stacksfinder/mcp-server)
- [Smithery.ai](https://smithery.ai/server/@stacksfinder/mcp-server)

---

## Marketing After Acceptance

Once accepted, update communications:

1. **README Badge:**
   ```markdown
   [![Anthropic MCP Directory](https://img.shields.io/badge/Anthropic-MCP%20Directory-purple)](https://github.com/modelcontextprotocol/servers)
   ```

2. **Tweet:**
   > Excited to announce that StacksFinder is now in @AnthropicAI's official MCP directory!
   >
   > 23 tools for deterministic tech stack decisions - no hallucinations, just data.
   >
   > Try it: `claude mcp add stacksfinder npx -y @stacksfinder/mcp-server`

3. **LinkedIn Post:**
   > Why I built an MCP server for tech stack decisions (and got it into Anthropic's official directory)
   >
   > [Article about the journey]

4. **Dev.to Article:**
   > From idea to Anthropic's MCP directory: Building StacksFinder
