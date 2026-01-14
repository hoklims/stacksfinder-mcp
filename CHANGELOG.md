# Changelog

All notable changes to `@stacksfinder/mcp-server` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.5] - 2025-01-13

### Added
- Smithery deployment requirements guide
- HTTP entry point for cloud deployment
- Chaos tests for MCP suggestions algorithm

### Fixed
- Default export for Cloudflare Workers compatibility
- Prevent server auto-start during Smithery scan
- Static JSON imports for Smithery bundling
- CJS compatibility + sandbox server mode

## [1.3.0] - 2025-01-10

### Added
- `estimate_project` tool - Scope, pricing, and market analysis
- `get_estimate_quota` tool - Check remaining estimate quota
- Deterministic pricing algorithm by region and seniority

## [1.2.2] - 2025-01-08

### Added
- Tool annotations for VS Code Copilot integration
- Integration tests for all tools

### Fixed
- Correct `recommend_stack` API request format

## [1.2.0] - 2025-01-06

### Added
- `check_mcp_compatibility` tool - Detect conflicts and synergies between MCPs
- Enhanced project-kit tools with smarter detection

### Changed
- Total tools increased to 21

## [1.1.0] - 2025-01-04

### Added
- Project Kit Phase 2 tools:
  - `generate_mcp_kit` - Generate tech stack + MCP recommendations
  - `analyze_repo_mcps` - Analyze repository and recommend MCPs
  - `prepare_mcp_installation` - Generate .env-mcp configuration
  - `execute_mcp_installation` - Generate IDE-specific install commands
- Interactive installation workflow
- Enhanced MCP suggestions algorithm

## [1.0.5] - 2025-01-02

### Added
- `get_migration_recommendation` tool - Analyze audits for migration opportunities
- Docker support for Glama.ai hosting
- Smithery deployment configuration

### Fixed
- Use npm install instead of npm ci in Dockerfile

## [1.0.0] - 2024-12-28

### Added
- Initial release with 16 core tools
- **Free Tier Tools:**
  - `list_technologies` - Browse technology catalog
  - `analyze_tech` - 6-dimension technology analysis
  - `compare_techs` - Side-by-side comparison
  - `recommend_stack_demo` - 1x/day free recommendation
- **Pro Tier Tools:**
  - `recommend_stack` - Unlimited recommendations
  - `create_blueprint` - Generate AI-powered blueprints
  - `get_blueprint` - Fetch existing blueprints
  - `setup_api_key` - API key management
  - `list_api_keys` / `revoke_api_key` - Key lifecycle
- **Audit Tools:**
  - `create_audit` - Technical debt analysis
  - `get_audit` / `list_audits` - Audit retrieval
  - `compare_audits` - Progress tracking
  - `get_audit_quota` - Quota management
- Multi-platform installation (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code)
- MIT License

---

## Tool Categories (v1.3.5)

| Category | Tools | Auth Required |
|----------|-------|---------------|
| Free | 9 | No |
| Pro | 6 | API Key |
| Audit | 6 | API Key |
| Estimator | 2 | API Key |
| **Total** | **23** | - |
