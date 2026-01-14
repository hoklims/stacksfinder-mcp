import { z } from 'zod';
import { getConfig, getAuthToken } from '../utils/config.js';
import { McpError } from '../utils/errors.js';
import { debug, info } from '../utils/logger.js';

/**
 * Input schema for setup_api_key tool.
 */
export const SetupApiKeyInputSchema = z.object({
	email: z.string().email().describe('Your StacksFinder account email'),
	password: z.string().min(1).describe('Your StacksFinder account password'),
	keyName: z.string().max(100).optional().describe('Optional name for the API key')
});

export type SetupApiKeyInput = z.infer<typeof SetupApiKeyInputSchema>;

/**
 * Tool definition for setup_api_key.
 */
export const setupApiKeyToolDefinition = {
	name: 'setup_api_key',
	description: `Authenticates with your StacksFinder account and creates an API key using email/password.

**Tier**: Requires Pro or Team subscription

**Prerequisites**: A StacksFinder Pro/Team account at https://stacksfinder.com/pricing

**Next Steps**:
- Verify key created: \`list_api_keys()\`
- Use Pro features: \`recommend_stack()\`, \`create_audit()\`, \`create_blueprint()\`

**Common Pitfalls**:
- For ChatGPT OAuth users: Prefer \`create_api_key()\` instead (no email/password needed)
- If using ChatGPT with OAuth, you may need to pass dummy email/password values

**Example**: \`setup_api_key({ email: "you@example.com", password: "your-password", keyName: "my-key" })\``
};

/**
 * API response structure.
 */
interface SetupApiResponse {
	success: boolean;
	apiKey?: string;
	keyId?: string;
	prefix?: string;
	message?: string;
	error?: string;
}

/**
 * Execute setup_api_key tool.
 */
export async function executeSetupApiKey(
	input: SetupApiKeyInput
): Promise<{ text: string; isError?: boolean; apiKey?: string }> {
	const config = getConfig();
	const { email, password, keyName } = input;

	debug('Setting up API key for', email);

	try {
		const response = await fetch(`${config.apiUrl}/api/v1/mcp/setup`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email,
				password,
				keyName: keyName || 'MCP Auto-generated'
			})
		});

		const data = (await response.json()) as SetupApiResponse;

		if (!response.ok || !data.success) {
			let errorMessage = data.message || data.error || 'Failed to create API key';

			// Add helpful context for common errors
			if (data.error === 'TIER_REQUIRED') {
				errorMessage = `Pro or Team tier required. Upgrade at ${config.apiUrl}/pricing`;
			} else if (data.error === 'LIMIT_EXCEEDED') {
				errorMessage = `API key limit reached. Manage keys at ${config.apiUrl}/account/developer/api-keys`;
			} else if (data.error === 'INVALID_CREDENTIALS') {
				errorMessage = 'Invalid email or password. Please check your credentials.';
			}

			return {
				text: `**Error**: ${errorMessage}`,
				isError: true
			};
		}

		info('API key created successfully');

		// Return the key with instructions
		const text = `## API Key Created Successfully

**Key**: \`${data.apiKey}\`
**Key ID**: ${data.keyId}
**Prefix**: ${data.prefix}

**IMPORTANT**: Save this key now - it cannot be retrieved again!

### Configure in Claude Code

Run this command to add the key:

\`\`\`bash
claude mcp add-json stacksfinder '{"command": "npx", "args": ["-y", "@stacksfinder/mcp-server"], "env": {"STACKSFINDER_API_KEY": "${data.apiKey}"}}'
\`\`\`

Or set the environment variable:

\`\`\`bash
export STACKSFINDER_API_KEY="${data.apiKey}"
\`\`\`

### Manage Your Keys

View and manage keys at: ${config.apiUrl}/account/developer/api-keys`;

		return { text, apiKey: data.apiKey };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}

		const errorMessage = err instanceof Error ? err.message : 'Failed to setup API key';
		return {
			text: `**Error**: ${errorMessage}\n\nMake sure you can reach ${config.apiUrl}`,
			isError: true
		};
	}
}

/**
 * Input schema for list_api_keys tool.
 */
export const ListApiKeysInputSchema = z.object({});

export type ListApiKeysInput = z.infer<typeof ListApiKeysInputSchema>;

/**
 * Tool definition for list_api_keys.
 */
export const listApiKeysToolDefinition = {
	name: 'list_api_keys',
	description: 'Lists your StacksFinder API keys. Requires a configured API key.'
};

/**
 * API response for listing keys.
 */
interface ListKeysResponse {
	keys: Array<{
		id: string;
		name: string;
		prefix: string;
		suffix: string;
		scopes: string[];
		createdAt: string;
		lastUsedAt?: string;
		expiresAt?: string;
	}>;
	limits: {
		max: number;
		used: number;
		remaining: number;
	};
}

/**
 * Execute list_api_keys tool.
 */
export async function executeListApiKeys(): Promise<{ text: string; isError?: boolean }> {
	const config = getConfig();

	if (!config.apiKey) {
		return {
			text: `**Error**: No API key configured. Use \`setup_api_key\` tool first or set STACKSFINDER_API_KEY environment variable.`,
			isError: true
		};
	}

	debug('Listing API keys');

	try {
		const response = await fetch(`${config.apiUrl}/api/v1/keys`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 401) {
				return {
					text: '**Error**: Invalid API key. Please reconfigure with a valid key.',
					isError: true
				};
			}
			const errorText = await response.text();
			return {
				text: `**Error**: Failed to list keys (${response.status}): ${errorText}`,
				isError: true
			};
		}

		const data = (await response.json()) as ListKeysResponse;

		let text = `## Your API Keys

**Usage**: ${data.limits.used}/${data.limits.max} keys (${data.limits.remaining} remaining)

| Name | Prefix | Scopes | Created | Last Used |
|------|--------|--------|---------|-----------|
`;

		for (const key of data.keys) {
			const lastUsed = key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never';
			const created = new Date(key.createdAt).toLocaleDateString();
			const scopes = key.scopes.join(', ');
			text += `| ${key.name} | ${key.prefix}...${key.suffix} | ${scopes} | ${created} | ${lastUsed} |\n`;
		}

		if (data.keys.length === 0) {
			text += `| (no keys) | - | - | - | - |\n`;
		}

		text += `\nManage keys at: ${config.apiUrl}/account/developer/api-keys`;

		return { text };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Failed to list API keys';
		return {
			text: `**Error**: ${errorMessage}`,
			isError: true
		};
	}
}

/**
 * Input schema for revoke_api_key tool.
 */
export const RevokeApiKeyInputSchema = z.object({
	keyId: z.string().uuid().describe('The UUID of the API key to revoke')
});

export type RevokeApiKeyInput = z.infer<typeof RevokeApiKeyInputSchema>;

/**
 * Tool definition for revoke_api_key.
 */
export const revokeApiKeyToolDefinition = {
	name: 'revoke_api_key',
	description: 'Revokes an API key. This action cannot be undone.'
};

/**
 * Execute revoke_api_key tool.
 */
export async function executeRevokeApiKey(
	input: RevokeApiKeyInput
): Promise<{ text: string; isError?: boolean }> {
	const config = getConfig();
	const { keyId } = input;

	if (!config.apiKey) {
		return {
			text: `**Error**: No API key configured. Set STACKSFINDER_API_KEY environment variable.`,
			isError: true
		};
	}

	debug('Revoking API key', keyId);

	try {
		const response = await fetch(`${config.apiUrl}/api/v1/keys/${keyId}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 401) {
				return {
					text: '**Error**: Invalid API key. Please reconfigure with a valid key.',
					isError: true
				};
			}
			if (response.status === 404) {
				return {
					text: `**Error**: API key not found or already revoked.`,
					isError: true
				};
			}
			const errorText = await response.text();
			return {
				text: `**Error**: Failed to revoke key (${response.status}): ${errorText}`,
				isError: true
			};
		}

		return {
			text: `## API Key Revoked

The API key \`${keyId}\` has been revoked and can no longer be used.

**Note**: If you revoked the key you're currently using, you'll need to configure a new one.`
		};
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Failed to revoke API key';
		return {
			text: `**Error**: ${errorMessage}`,
			isError: true
		};
	}
}

// ============================================================================
// CREATE API KEY (OAuth-based, no email/password required)
// ============================================================================

/**
 * Input schema for create_api_key tool.
 * This tool is designed for OAuth-authenticated users (e.g., ChatGPT integration)
 * and doesn't require email/password.
 */
export const CreateApiKeyInputSchema = z.object({
	keyName: z.string().max(100).optional().describe('Optional name for the API key')
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeyInputSchema>;

/**
 * Tool definition for create_api_key.
 */
export const createApiKeyToolDefinition = {
	name: 'create_api_key',
	description: `Creates a new API key using OAuth authentication (preferred for ChatGPT users).

**Tier**: Requires Pro or Team subscription

**Prerequisites**: Authenticated via OAuth (ChatGPT Actions automatically handles this)

**Next Steps**:
- Verify key created: \`list_api_keys()\`
- Use Pro features: \`recommend_stack()\`, \`create_audit()\`, \`create_blueprint()\`

**Why use this over setup_api_key**:
- No email/password required
- Works seamlessly with ChatGPT OAuth integration
- Preferred method for ChatGPT users

**Common Pitfalls**:
- Requires Pro/Team subscription - upgrade at https://stacksfinder.com/pricing
- Key is shown only once - save it securely

**Example**: \`create_api_key({ keyName: "my-chatgpt-key" })\``
};

/**
 * Execute create_api_key tool.
 * Uses OAuth token from the request (ChatGPT integration) or existing API key.
 */
export async function executeCreateApiKey(
	input: CreateApiKeyInput
): Promise<{ text: string; isError?: boolean; apiKey?: string }> {
	const config = getConfig();
	const authToken = getAuthToken();
	const { keyName } = input;

	if (!authToken) {
		return {
			text: `**Error**: No authentication available. This tool requires OAuth authentication (via ChatGPT integration) or an existing API key.

If you're using Claude Code or another CLI, use \`setup_api_key\` with your email and password instead.`,
			isError: true
		};
	}

	debug('Creating API key via OAuth');

	try {
		const response = await fetch(`${config.apiUrl}/api/v1/keys`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${authToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				name: keyName || 'MCP Auto-generated'
			})
		});

		const data = (await response.json()) as {
			success?: boolean;
			apiKey?: string;
			keyId?: string;
			prefix?: string;
			message?: string;
			error?: string;
		};

		if (!response.ok) {
			let errorMessage = data.message || data.error || 'Failed to create API key';

			if (response.status === 401) {
				errorMessage = 'Authentication failed. Please reconnect your StacksFinder account.';
			} else if (response.status === 403) {
				errorMessage = `Pro or Team tier required. Upgrade at ${config.apiUrl}/pricing`;
			} else if (data.error === 'LIMIT_EXCEEDED') {
				errorMessage = `API key limit reached. Manage keys at ${config.apiUrl}/account/developer/api-keys`;
			}

			return {
				text: `**Error**: ${errorMessage}`,
				isError: true
			};
		}

		info('API key created successfully via OAuth');

		const text = `## API Key Created Successfully

**Key**: \`${data.apiKey}\`
**Key ID**: ${data.keyId}
**Prefix**: ${data.prefix}

**IMPORTANT**: Save this key now - it cannot be retrieved again!

### Configure in Claude Code

Run this command to add the key:

\`\`\`bash
claude mcp add-json stacksfinder '{"command": "npx", "args": ["-y", "@stacksfinder/mcp-server"], "env": {"STACKSFINDER_API_KEY": "${data.apiKey}"}}'
\`\`\`

Or set the environment variable:

\`\`\`bash
export STACKSFINDER_API_KEY="${data.apiKey}"
\`\`\`

### Manage Your Keys

View and manage keys at: ${config.apiUrl}/account/developer/api-keys`;

		return { text, apiKey: data.apiKey };
	} catch (err) {
		if (err instanceof McpError) {
			return { text: err.toResponseText(), isError: true };
		}

		const errorMessage = err instanceof Error ? err.message : 'Failed to create API key';
		return {
			text: `**Error**: ${errorMessage}\n\nMake sure you can reach ${config.apiUrl}`,
			isError: true
		};
	}
}
