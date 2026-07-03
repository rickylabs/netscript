import type {
  McpClientConnection,
  McpClientConnector,
  McpConnectOptions,
  McpConnectorConfig,
  McpToolDescriptor,
  McpToolResult,
} from '../../ports/mcp-transport.ts';

const TANSTACK_MCP_SPECIFIER = ['@tanstack', '/ai-mcp'].join('');
const TANSTACK_MCP_STDIO_SPECIFIER = ['@tanstack', '/ai-mcp/stdio'].join('');

interface TanstackHttpConnectorConfig extends McpConnectorConfig {
  readonly serverId: string;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetch?: typeof fetch;
}

interface TanstackStdioConnectorConfig extends McpConnectorConfig {
  readonly serverId: string;
  readonly command: string;
  readonly args?: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
  readonly cwd?: string;
}

/** Create a connector for TanStack Streamable-HTTP MCP clients. */
export function createTanstackHttpConnector(): McpClientConnector {
  return async (config) => {
    const mcp = await import(TANSTACK_MCP_SPECIFIER);
    const client = await mcp.createMCPClient({
      transport: {
        type: 'http',
        url: config.url,
        headers: config.headers,
        fetch: config.fetch,
      },
      prefix: config.serverId,
      name: 'netscript-ai',
      version: '0.0.1',
    });
    return toConnection(config.serverId, client);
  };
}

/** Create a connector for TanStack stdio MCP clients. */
export function createTanstackStdioConnector(): McpClientConnector {
  return async (config) => {
    const mcp = await import(TANSTACK_MCP_SPECIFIER);
    const stdio = await import(TANSTACK_MCP_STDIO_SPECIFIER);
    const client = await mcp.createMCPClient({
      transport: stdio.stdioTransport({
        command: config.command,
        args: config.args,
        env: config.env,
        cwd: config.cwd,
      }),
      prefix: config.serverId,
      name: 'netscript-ai',
      version: '0.0.1',
    });
    return toConnection(config.serverId, client);
  };
}

function toConnection(serverId: string, client: {
  tools: () => Promise<readonly unknown[]>;
  callTool: (
    name: string,
    args?: Readonly<Record<string, unknown>>,
  ) => Promise<{
    readonly content?: unknown;
    readonly isError?: boolean;
  }>;
  close: () => Promise<void>;
}): McpClientConnection {
  return {
    async listTools(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
      options.signal?.throwIfAborted();
      const tools = await client.tools();
      return tools.map((tool) => toMcpToolDescriptor(serverId, tool));
    },
    async callTool(
      name: string,
      args: Readonly<Record<string, unknown>>,
      options: McpConnectOptions = {},
    ): Promise<McpToolResult> {
      options.signal?.throwIfAborted();
      const result = await client.callTool(name, args);
      if (result.isError) {
        return {
          toolCallId: name,
          content: stringifyContent(result.content),
          state: 'error',
          error: stringifyContent(result.content),
        };
      }
      return {
        toolCallId: name,
        content: stringifyContent(result.content),
        state: 'complete',
      };
    },
    close(): Promise<void> {
      return client.close();
    },
  };
}

function toMcpToolDescriptor(serverId: string, value: unknown): McpToolDescriptor {
  if (typeof value !== 'object' || value === null) {
    return emptyTool(serverId, 'unknown');
  }
  const name = readString(value, 'name') ?? 'unknown';
  const metadata = readObject(readObject(value, 'metadata'), 'mcp');
  const remoteName = readString(metadata, 'serverToolName') ?? name;
  const inputSchema = readObject(value, 'inputSchema');
  return {
    name,
    remoteName,
    serverId,
    description: readString(value, 'description') ?? undefined,
    parameters: {
      type: 'object',
      ...(inputSchema ?? {}),
    },
  };
}

function emptyTool(serverId: string, name: string): McpToolDescriptor {
  return {
    name,
    remoteName: name,
    serverId,
    parameters: { type: 'object', properties: {} },
  };
}

function readObject(
  value: unknown,
  key?: string,
): Readonly<Record<string, unknown>> | undefined {
  const target = key === undefined ? value : readProperty(value, key);
  return typeof target === 'object' && target !== null ? Object.freeze({ ...target }) : undefined;
}

function readString(value: unknown, key: string): string | undefined {
  const target = readProperty(value, key);
  return typeof target === 'string' ? target : undefined;
}

function readProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return undefined;
  }
  return Object.getOwnPropertyDescriptor(value, key)?.value;
}

function stringifyContent(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  return JSON.stringify(content ?? null);
}
