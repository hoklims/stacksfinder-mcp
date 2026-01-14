# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| < 1.2   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email us at: **security@stacksfinder.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

1. **Acknowledgment:** We will acknowledge your report within 48 hours
2. **Assessment:** We will investigate and assess the severity within 7 days
3. **Resolution:** Critical issues will be patched within 14 days
4. **Disclosure:** We will coordinate responsible disclosure with you

### Scope

The following are in scope:

- `@stacksfinder/mcp-server` npm package
- StacksFinder API (api.stacksfinder.com)
- Authentication and API key handling
- Data validation and sanitization

### Out of Scope

- Third-party dependencies (report to their maintainers)
- Social engineering attacks
- Physical security
- Denial of service attacks

## Security Best Practices

### API Key Handling

- **Never commit API keys** to version control
- Store keys in environment variables or secure vaults
- Use `.env` files locally (add to `.gitignore`)
- Rotate keys if you suspect compromise

### Configuration

```bash
# Good: Environment variable
export STACKSFINDER_API_KEY="sk_..."

# Good: .env file (not committed)
echo "STACKSFINDER_API_KEY=sk_..." >> .env
echo ".env" >> .gitignore

# Bad: Hardcoded in code
const API_KEY = "sk_..."  # NEVER DO THIS
```

### MCP Configuration Security

When configuring the MCP server:

```json
{
  "mcpServers": {
    "stacksfinder": {
      "command": "npx",
      "args": ["-y", "@stacksfinder/mcp-server"],
      "env": {
        "STACKSFINDER_API_KEY": "${STACKSFINDER_API_KEY}"
      }
    }
  }
}
```

Use environment variable references (`${VAR}`) instead of hardcoding secrets.

## Security Features

### Input Validation

All tool inputs are validated using Zod schemas before processing:

```typescript
const InputSchema = z.object({
  technology: z.string().min(1).max(100),
  context: z.enum(['default', 'mvp', 'enterprise'])
});
```

### Rate Limiting

- Free tier: 1 recommendation per day
- API requests are rate-limited per key
- Quota tracking prevents abuse

### Data Privacy

- No user data is stored locally
- API keys are transmitted over HTTPS only
- Logs do not contain sensitive information

## Acknowledgments

We appreciate the security research community. Reporters of valid vulnerabilities will be acknowledged (with permission) in our security hall of fame.

---

**Contact:** security@stacksfinder.com
