/**
 * Model Context Protocol (MCP) transport port.
 *
 * The port owns NetScript's MCP lifecycle vocabulary: transport selection,
 * injected auth, connection state, tool discovery, invocation, and shutdown.
 * Concrete adapters may wrap `@tanstack/ai-mcp`, but no upstream SDK type leaks
 * through this public seam.
 *
 * @module
 */

import { AiNotConfiguredError } from '../contracts/errors.ts';

/** Supported MCP auth modes. */
export const MCP_AUTH_MODES = ['none', 'api-token', 'oauth'] as const;

/** Credentials mode for an MCP connection. */
export type McpAuthMode = 'none' | 'api-token' | 'oauth';

/** Supported MCP connection states. */
export const MCP_CONNECTION_STATES = [
  'disconnected',
  'connecting',
  'connected',
  'reconnecting',
  'closed',
] as const;

/** Lifecycle state for an MCP transport. */
export type McpConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'closed';

/** Supported MCP transport kinds. */
export const MCP_TRANSPORT_KINDS = ['stdio', 'streamable-http'] as const;

/** Transport selector used by {@linkcode createMcpTransport}. */
export type McpTransportKind = 'stdio' | 'streamable-http';

/** Authentication config supplied by the application composition root. */
export type McpAuthConfig =
  | { readonly mode: 'none' }
  | {
    readonly mode: 'api-token';
    readonly token: string;
    readonly headerName?: string;
    readonly scheme?: string;
  }
  | {
    readonly mode: 'oauth';
    readonly accessToken: string;
    readonly tokenType?: string;
  };

/** Backoff settings for reconnectable transports. */
export interface McpBackoffConfig {
  /** Initial retry delay in milliseconds. */
  readonly initialDelayMs?: number;
  /** Maximum retry delay in milliseconds. */
  readonly maxDelayMs?: number;
  /** Multiplicative factor applied after each failed reconnect. */
  readonly factor?: number;
  /** Maximum reconnect attempts before surfacing failure. */
  readonly maxAttempts?: number;
}

/** Options passed to MCP connect/reconnect operations. */
export interface McpConnectOptions {
  /** Cancellation signal threaded through connection setup and retry sleeps. */
  readonly signal?: AbortSignal;
}

/** JSON Schema object describing MCP tool arguments. */
export interface McpToolParameters {
  /** Always `object`; MCP tool arguments are keyed records. */
  readonly type: 'object';
  /** Schema for each named argument. */
  readonly properties?: Readonly<Record<string, { readonly [key: string]: unknown }>>;
  /** Names of required arguments. */
  readonly required?: readonly string[];
  /** Additional JSON Schema keywords. */
  readonly [key: string]: unknown;
}

/** A tool discovered on an MCP server, tagged with its owning server id. */
export interface McpToolDescriptor {
  /** Unique tool name exposed to the model. */
  readonly name: string;
  /** Human-/model-readable description of what the tool does. */
  readonly description?: string;
  /** JSON-Schema input contract for the tool arguments. */
  readonly parameters: McpToolParameters;
  /** Id of the MCP server exposing this tool. */
  readonly serverId: string;
  /** Original tool name on the MCP server before any local prefixing. */
  readonly remoteName: string;
}

/** The outcome of executing an MCP tool call. */
export interface McpToolResult {
  /** Id of the tool call this result answers. */
  readonly toolCallId: string;
  /** Result payload serialized for the AI tool loop. */
  readonly content: string;
  /** Terminal state, when tracked. */
  readonly state?: 'complete' | 'error';
  /** Error message when the tool failed. */
  readonly error?: string;
}

/** Handler invoked whenever an MCP transport changes state. */
export type McpStateChangeHandler = (
  state: McpConnectionState,
  previous: McpConnectionState,
) => void;

/** Result of opening a low-level MCP client connection. */
export interface McpClientConnection {
  /** List tools advertised by the connected server. */
  listTools(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]>;
  /** Invoke a named remote tool with arguments. */
  callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    options?: McpConnectOptions,
  ): Promise<McpToolResult>;
  /** Close the client connection and release resources. */
  close(): Promise<void>;
}

/** Serializable config handed to a low-level MCP connector. */
export interface McpConnectorConfig {
  /** Stable id assigned to the MCP server connection. */
  readonly serverId: string;
  /** Additional connector-specific values. */
  readonly [key: string]: unknown;
}

/** Low-level connector used by adapters to open an MCP client. */
export type McpClientConnector = (
  config: McpConnectorConfig,
  options: { readonly signal: AbortSignal },
) => Promise<McpClientConnection>;

/** Registry shape required by {@linkcode registerMcpTools}. */
export interface McpToolRegistry {
  /** Register a tool descriptor and optional handler. */
  register(
    tool: McpToolDescriptor,
    handler?: (
      call: {
        readonly id: string;
        readonly name: string;
        readonly arguments: string;
        readonly state?: string;
      },
    ) => unknown,
  ): void;
  /** Remove a registered tool by name, if present. */
  unregister(name: string): void;
}

/**
 * The MCP transport capability seam.
 */
export interface McpTransportPort {
  /** Stable id assigned to the MCP server connection. */
  readonly serverId: string;
  /** Current lifecycle state. */
  readonly state: McpConnectionState;
  /** Open the connection and return the currently discovered tool descriptors. */
  connect(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]>;
  /** Reconnect after a transport drop, applying the transport's backoff policy. */
  reconnect(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]>;
  /** List the currently discovered tools, connecting first when needed. */
  listTools(options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]>;
  /** Invoke a remote MCP tool. */
  callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    options?: McpConnectOptions,
  ): Promise<McpToolResult>;
  /** Subscribe to state changes; returns an unsubscribe function. */
  onStateChange(
    handler: (state: McpConnectionState, previous: McpConnectionState) => void,
  ): () => void;
  /** Close the transport and abort in-flight connect/reconnect work. */
  stop(): Promise<void>;
}

/**
 * Create the default throwing MCP transport. Every operation rejects with
 * {@linkcode AiNotConfiguredError}.
 */
export function createUnconfiguredMcpTransport(): McpTransportPort {
  const reject = (): Promise<never> =>
    Promise.reject(
      new AiNotConfiguredError('mcp', 'Inject an McpTransportPort via createAiRuntime.'),
    );
  return {
    serverId: 'unconfigured',
    state: 'closed',
    connect: reject,
    reconnect: reject,
    listTools: reject,
    callTool: reject,
    onStateChange(): () => void {
      return () => {};
    },
    stop(): Promise<void> {
      return Promise.resolve();
    },
  };
}
