import type {
  McpAuthConfig,
  McpBackoffConfig,
  McpClientConnection,
  McpConnectionState,
  McpConnectOptions,
  McpConnectorConfig,
  McpToolDescriptor,
  McpToolResult,
  McpTransportPort,
} from '../../ports/mcp-transport.ts';
import { headersForAuth } from '../application/auth.ts';
import { BaseMcpTransport } from './base-transport.ts';
import { createTanstackHttpConnector } from './tanstack-connector.ts';

interface StreamableHttpConnectorConfig extends McpConnectorConfig {
  readonly serverId: string;
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly fetch?: typeof fetch;
}

/** Configuration for {@linkcode StreamableHttpMcpTransport}. */
export interface StreamableHttpMcpTransportConfig {
  /** Stable id assigned to this MCP server connection. */
  readonly serverId: string;
  /** Streamable-HTTP endpoint URL. */
  readonly url: string;
  /** Injected auth config; defaults to `{ mode: "none" }`. */
  readonly auth?: McpAuthConfig;
  /** Additional static headers merged after auth headers. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Fetch implementation for tests or custom runtimes. */
  readonly fetch?: typeof fetch;
  /** Reconnect backoff policy. */
  readonly backoff?: McpBackoffConfig;
  /** Optional low-level connector for tests. */
  readonly connector?: (
    config: McpConnectorConfig,
    options: { readonly signal: AbortSignal },
  ) => Promise<McpClientConnection>;
}

/**
 * Reconnectable Streamable-HTTP MCP transport.
 */
export class StreamableHttpMcpTransport implements McpTransportPort {
  readonly #delegate: BaseMcpTransport;

  /** Construct a Streamable-HTTP MCP transport from injected config. */
  constructor(config: StreamableHttpMcpTransportConfig) {
    const connectorConfig = {
      serverId: config.serverId,
      url: config.url,
      headers: {
        ...headersForAuth(config.auth),
        ...(config.headers ?? {}),
      },
      fetch: config.fetch,
    };
    this.#delegate = new class extends BaseMcpTransport {}(
      config.serverId,
      connectorConfig,
      config.connector ?? createTanstackHttpConnector(),
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

  /** Open the HTTP connection and return discovered tools. */
  connect(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    return this.#delegate.connect(options);
  }

  /** Reconnect the HTTP transport using the configured backoff policy. */
  reconnect(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    return this.#delegate.reconnect(options);
  }

  /** List currently discovered tools, connecting first when needed. */
  listTools(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    return this.#delegate.listTools(options);
  }

  /** Invoke a remote MCP tool through the HTTP connection. */
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

export type { McpClientConnection, StreamableHttpConnectorConfig };
