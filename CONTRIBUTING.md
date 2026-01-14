# Contributing to StacksFinder MCP Server

First off, thank you for considering contributing to StacksFinder MCP Server! This document provides guidelines and information about contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/hoklims/stacksfinder-mcp/issues) to avoid duplicates.

When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs. actual behavior
- **Environment details:**
  - Node.js version (`node --version`)
  - MCP client (Claude Code, Cursor, etc.)
  - Operating system
- **Error messages** and logs if applicable

### Suggesting Features

Feature requests are welcome! Please:

1. Check if the feature has already been requested
2. Provide a clear use case
3. Explain how it benefits the broader community

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests:**
   ```bash
   bun test --run
   ```
5. **Ensure TypeScript compiles:**
   ```bash
   bun run build
   ```
6. **Commit with a clear message:**
   ```bash
   git commit -m "feat: add new capability to analyze_tech"
   ```
7. **Push and create a PR**

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- Bun (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/hoklims/stacksfinder-mcp.git
cd stacksfinder-mcp/packages/mcp-server

# Install dependencies
bun install

# Build
bun run build

# Run tests
bun test
```

### Project Structure

```
packages/mcp-server/
├── src/
│   ├── index.ts          # Entry point (stdio transport)
│   ├── server.ts         # MCP server factory
│   ├── tools/            # Tool implementations
│   │   ├── analyze.ts
│   │   ├── compare.ts
│   │   └── ...
│   ├── utils/            # Shared utilities
│   │   ├── api-client.ts
│   │   ├── config.ts
│   │   └── logger.ts
│   └── data/             # Scoring data (copied from main app)
├── tests/                # Test suites
├── dist/                 # Build output
└── package.json
```

### Adding a New Tool

1. Create a new file in `src/tools/your-tool.ts`:
   ```typescript
   import { z } from 'zod';
   import type { ToolHandler } from '../types';

   const InputSchema = z.object({
     param: z.string().describe('Parameter description')
   });

   export const yourTool: ToolHandler = {
     name: 'your_tool',
     description: 'What this tool does',
     inputSchema: InputSchema,
     handler: async (input, context) => {
       // Implementation
       return { content: [{ type: 'text', text: 'Result' }] };
     }
   };
   ```

2. Register in `src/server.ts`
3. Add tests in `tests/your-tool.test.ts`
4. Update README.md with the new tool

## Coding Guidelines

### TypeScript

- Use strict TypeScript (`strict: true`)
- No `any` types without justification
- Export types for public APIs
- Use Zod for input validation

### Testing

- Write tests for all new tools
- Maintain existing test coverage
- Use descriptive test names:
  ```typescript
  it('should return error when technology ID is invalid', () => {});
  ```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `test:` Adding tests
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## Questions?

- Open a [GitHub Discussion](https://github.com/hoklims/stacksfinder-mcp/discussions)
- Join our [Discord](https://discord.gg/FqBqKe9N)
- Email: hello@stacksfinder.com

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
