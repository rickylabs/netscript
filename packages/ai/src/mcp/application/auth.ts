import type { McpAuthConfig } from '../../ports/mcp-transport.ts';

/** Build request headers for an injected MCP auth config. */
export function headersForAuth(
  auth: McpAuthConfig = { mode: 'none' },
): Readonly<Record<string, string>> {
  if (auth.mode === 'none') {
    return {};
  }
  if (auth.mode === 'api-token') {
    const headerName = auth.headerName ?? 'Authorization';
    const value = auth.scheme === undefined ? auth.token : `${auth.scheme} ${auth.token}`;
    return { [headerName]: value };
  }
  return { Authorization: `${auth.tokenType ?? 'Bearer'} ${auth.accessToken}` };
}
