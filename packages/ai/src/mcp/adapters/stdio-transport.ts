import type {
  McpBackoffConfig,
  McpClientConnection,
  McpConnectionState,
  McpConnectOptions,
  McpConnectorConfig,
  McpToolDescriptor,
  McpToolResult,
  McpTransportPort,
} from '../../ports/mcp-transport.ts';
import { BaseMcpTransport } from './base-transport.ts';
import { createTanstackStdioConnector } from './tanstack-connector.ts';

interface StdioConnectorConfig extends McpConnectorConfig {
  readonly serverId: string;
  readonly command: string;
  readonly args?: readonly string[];
  readonly env?: Readonly<Record<string, string>>;
  readonly cwd?: string;
}

/** Configuration for {@linkcode StdioMcpTransport}. */
export interface StdioMcpTransportConfig {
  /** Stable id assigned to this MCP server connection. */
  readonly serverId: string;
  /** Executable command for the MCP server. */
  readonly command: string;
  /** Command arguments. */
  readonly args?: readonly string[];
  /** Injected process environment for the child process. */
  readonly env?: Readonly<Record<string, string>>;
  /** Working directory for the child process. */
  readonly cwd?: string;
  /** Reconnect backoff policy. */
  readonly backoff?: McpBackoffConfig;
  /** Optional low-level connector for tests. */
  readonly connector?: (
    config: McpConnectorConfig,
    options: { readonly signal: AbortSignal },
  ) => Promise<McpClientConnection>;
}

/**
 * Stdio MCP transport.
 */
export class StdioMcpTransport implements McpTransportPort {
  readonly #delegate: BaseMcpTransport;

  /** Construct a stdio MCP transport from injected config. */
  constructor(config: StdioMcpTransportConfig) {
    this.#delegate = new class extends BaseMcpTransport {}(
      config.serverId,
      {
        serverId: config.serverId,
        command: config.command,
        args: config.args,
        env: config.env,
        cwd: config.cwd,
      },
      config.connector ?? createTanstackStdioConnector(),
      config.backoff,
    );
  }

  /** Stable id assigned to this MCP server connection. */
  get serverId(): string {
    return this.#delegate.serverId;
  }

  /** Current lifecycle state. */
  get state(): McpConnectionState {
    return this.#delegate.state;
  }

  /** Open the stdio connection and return discovered tools. */
  connect(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    return this.#delegate.connect(options);
  }

  /** Reconnect the stdio transport using the configured backoff policy. */
  reconnect(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    return this.#delegate.reconnect(options);
  }

  /** List currently discovered tools, connecting first when needed. */
  listTools(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    return this.#delegate.listTools(options);
  }

  /** Invoke a remote MCP tool through the stdio connection. */
  callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    options?: McpConnectOptions,
  ): Promise<McpToolResult> {
    return this.#delegate.callTool(name, args, options);
  }

  /** Subscribe to lifecycle state changes. */
  onStateChange(
    handler: (state: McpConnectionState, previous: McpConnectionState) => void,
  ): () => void {
    return this.#delegate.onStateChange(handler);
  }

  /** Close the transport and abort in-flight work. */
  stop(): Promise<void> {
    return this.#delegate.stop();
  }
}

export type { StdioConnectorConfig };
