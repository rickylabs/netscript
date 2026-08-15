import type {
  McpClientConnection,
  McpClientConnector,
  McpConnectOptions,
  McpConnectorConfig,
  McpReadResourceResult,
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

interface TanstackClient {
  tools: () => Promise<readonly unknown[]>;
  callTool: (
    name: string,
    args?: Readonly<Record<string, unknown>>,
  ) => Promise<{
    readonly content?: unknown;
    readonly isError?: boolean;
  }>;
  readResource: (uri: string) => Promise<McpReadResourceResult>;
  close: () => Promise<void>;
}

/** Create a connector for TanStack Streamable-HTTP MCP clients. */
export function createTanstackHttpConnector(): McpClientConnector {
  return async (config, options) => {
    options.signal.throwIfAborted();
    const mcp = await import(TANSTACK_MCP_SPECIFIER);
    options.signal.throwIfAborted();
    const client = await settleWithSignal<TanstackClient>(
      mcp.createMCPClient({
        transport: {
          type: 'http',
          url: config.url,
          headers: config.headers,
          fetch: fetchWithSignal(config.fetch, options.signal),
        },
        prefix: config.serverId,
        name: 'netscript-ai',
        version: '0.0.1',
      }),
      options.signal,
      closeClient,
    );
    return toConnection(config.serverId, client);
  };
}

/** Create a connector for TanStack stdio MCP clients. */
export function createTanstackStdioConnector(): McpClientConnector {
  return async (config, options) => {
    options.signal.throwIfAborted();
    const mcp = await import(TANSTACK_MCP_SPECIFIER);
    const stdio = await import(TANSTACK_MCP_STDIO_SPECIFIER);
    options.signal.throwIfAborted();
    const client = await settleWithSignal<TanstackClient>(
      mcp.createMCPClient({
        transport: stdio.stdioTransport({
          command: requireString(config, 'command'),
          args: readStringArray(config, 'args'),
          env: readStringRecord(config, 'env'),
          cwd: readString(config, 'cwd'),
        }),
        prefix: config.serverId,
        name: 'netscript-ai',
        version: '0.0.1',
      }),
      options.signal,
      closeClient,
    );
    return toConnection(config.serverId, client);
  };
}

function toConnection(serverId: string, client: TanstackClient): McpClientConnection {
  return {
    async listTools(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
      options.signal?.throwIfAborted();
      const tools = await settleWithSignal(client.tools(), options.signal);
      return tools.map((tool) => toMcpToolDescriptor(serverId, tool));
    },
    async callTool(
      name: string,
      args: Readonly<Record<string, unknown>>,
      options: McpConnectOptions = {},
    ): Promise<McpToolResult> {
      options.signal?.throwIfAborted();
      const result = await settleWithSignal(client.callTool(name, args), options.signal);
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
    readResource(
      uri: string,
      options: McpConnectOptions = {},
    ): Promise<McpReadResourceResult> {
      return settleWithSignal(client.readResource(uri), options.signal);
    },
    close(options: McpConnectOptions = {}): Promise<void> {
      return settleWithSignal(client.close(), options.signal);
    },
  };
}

function fetchWithSignal(fetcher: typeof fetch | undefined, signal: AbortSignal): typeof fetch {
  const execute = fetcher ?? fetch;
  return (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const requestSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    return execute(input, {
      ...init,
      signal: requestSignal === undefined || requestSignal === null
        ? signal
        : AbortSignal.any([signal, requestSignal]),
    });
  };
}

function settleWithSignal<T>(
  operation: Promise<T>,
  signal?: AbortSignal,
  onLateSuccess?: (value: T) => Promise<void>,
): Promise<T> {
  if (signal === undefined) {
    return operation;
  }
  if (signal.aborted) {
    if (onLateSuccess !== undefined) {
      operation.then((value) => onLateSuccess(value).catch(() => undefined), () => {});
    }
    return Promise.reject(signal.reason);
  }
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const onAbort = (): void => {
      settled = true;
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        if (settled) {
          onLateSuccess?.(value).catch(() => undefined);
          return;
        }
        settled = true;
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        if (!settled) {
          settled = true;
          reject(error);
        }
      },
    );
  });
}

function closeClient(client: { close: () => Promise<void> }): Promise<void> {
  return client.close();
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

function requireString(value: unknown, key: string): string {
  const result = readString(value, key);
  if (result === undefined) {
    throw new TypeError(`MCP connector config requires a string ${key}`);
  }
  return result;
}

function readStringArray(value: unknown, key: string): string[] | undefined {
  const target = readProperty(value, key);
  return Array.isArray(target) && target.every((item) => typeof item === 'string')
    ? [...target]
    : undefined;
}

function readStringRecord(
  value: unknown,
  key: string,
): Readonly<Record<string, string>> | undefined {
  const target = readObject(value, key);
  if (target === undefined) {
    return undefined;
  }
  const result: Record<string, string> = {};
  for (const [name, item] of Object.entries(target)) {
    if (typeof item !== 'string') {
      return undefined;
    }
    result[name] = item;
  }
  return Object.freeze(result);
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
