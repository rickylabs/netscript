import { AiError } from '../../contracts/errors.ts';
import type {
  McpConnectionState,
  McpConnectOptions,
  McpStateChangeHandler,
  McpToolDescriptor,
  McpToolResult,
  McpTransportPort,
} from '../../ports/mcp-transport.ts';
import { createMcpTransport, type McpTransportConfig } from './factory.ts';

/** Data-only `ui://` resource surfaced from an MCP tool result. */
export interface McpUiResource {
  /** The original `ui://` resource URI. */
  readonly uri: string;
  /** Alias consumed by iframe/widget renderers. */
  readonly src: string;
  /** MIME type of the resource payload, when advertised by the server. */
  readonly mimeType?: string;
  /** Inline text payload, when the server returns one. */
  readonly text?: string;
  /** Inline base64 payload, when the server returns one. */
  readonly blob?: string;
  /** MCP server id that produced the resource. */
  readonly serverId?: string;
  /** Server-native tool name that produced the resource. */
  readonly toolName?: string;
  /** Tool-call id associated with the result, when present. */
  readonly toolCallId?: string;
}

/** MCP tool result plus extracted `ui://` resources. */
export interface McpPooledToolResult extends McpToolResult {
  /** Data-only `ui://` resources found in the result payload. */
  readonly uiResources: readonly McpUiResource[];
}

/** Options accepted by {@linkcode createMcpTransportPool}. */
export interface McpTransportPoolConfig {
  /** Stable id assigned to this pool. */
  readonly serverId?: string;
  /** MCP servers keyed by each config's `serverId`. */
  readonly servers: readonly McpTransportConfig[];
  /** Separator between server id and remote tool name. Defaults to `__`. */
  readonly toolNameSeparator?: string;
}

/** Options accepted by {@linkcode createMcpTransportPoolFromTransports}. */
export interface McpTransportPoolOptions {
  /** Stable id assigned to this pool. */
  readonly serverId?: string;
  /** Caller-owned transports keyed by `transport.serverId`. */
  readonly transports: readonly McpTransportPort[];
  /** Separator between server id and remote tool name. Defaults to `__`. */
  readonly toolNameSeparator?: string;
}

interface ToolRoute {
  readonly transport: McpTransportPort;
  readonly remoteName: string;
}

const DEFAULT_POOL_ID = 'mcp-pool';
const DEFAULT_SEPARATOR = '__';

/** Multi-server MCP transport pool keyed by server id. */
export class McpTransportPool implements McpTransportPort {
  /** Stable id assigned to this pool. */
  readonly serverId: string;
  readonly #transports = new Map<string, McpTransportPort>();
  readonly #routes = new Map<string, ToolRoute>();
  readonly #handlers = new Set<McpStateChangeHandler>();
  readonly #toolNameSeparator: string;
  #state: McpConnectionState = 'disconnected';

  /** Construct a pool over caller-owned transports. */
  constructor(options: McpTransportPoolOptions) {
    this.serverId = options.serverId ?? DEFAULT_POOL_ID;
    this.#toolNameSeparator = options.toolNameSeparator ?? DEFAULT_SEPARATOR;
    for (const transport of options.transports) {
      if (this.#transports.has(transport.serverId)) {
        throw new AiError(`Duplicate MCP server id "${transport.serverId}" in pool.`);
      }
      this.#transports.set(transport.serverId, transport);
      transport.onStateChange(() => this.#refreshState());
    }
  }

  /** Current aggregate lifecycle state for the pool. */
  get state(): McpConnectionState {
    return this.#state;
  }

  /** Stable server ids currently owned by the pool. */
  get serverIds(): readonly string[] {
    return [...this.#transports.keys()];
  }

  /** Read a pooled transport by server id. */
  server(serverId: string): McpTransportPort | undefined {
    return this.#transports.get(serverId);
  }

  /** Open every pooled transport and return prefixed tool descriptors. */
  async connect(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
    this.#transition('connecting');
    const tools = await this.#collectTools((transport) => transport.connect(options));
    this.#transition('connected');
    return tools;
  }

  /** Reconnect every pooled transport and return prefixed tool descriptors. */
  async reconnect(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
    this.#transition('reconnecting');
    const tools = await this.#collectTools((transport) => transport.reconnect(options));
    this.#transition('connected');
    return tools;
  }

  /** List tools from all pooled transports without tearing down warm connections. */
  async listTools(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
    const tools = await this.#collectTools((transport) => transport.listTools(options));
    this.#refreshState();
    return tools;
  }

  /** Call a prefixed pooled tool name and extract `ui://` resources from the result. */
  async callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    options: McpConnectOptions = {},
  ): Promise<McpPooledToolResult> {
    const route = this.#routes.get(name) ?? this.#routeFromName(name);
    if (route === undefined) {
      throw new AiError(`MCP tool "${name}" is not registered in pool "${this.serverId}".`);
    }
    const result = await route.transport.callTool(route.remoteName, args, options);
    return withUiResources(result, route.transport.serverId, route.remoteName);
  }

  /** Subscribe to aggregate pool lifecycle state changes. */
  onStateChange(handler: McpStateChangeHandler): () => void {
    this.#handlers.add(handler);
    return () => this.#handlers.delete(handler);
  }

  /** Stop every pooled transport and clear discovered tool routes. */
  async stop(): Promise<void> {
    await Promise.all([...this.#transports.values()].map((transport) => transport.stop()));
    this.#routes.clear();
    this.#transition('closed');
  }

  async #collectTools(
    list: (transport: McpTransportPort) => Promise<readonly McpToolDescriptor[]>,
  ): Promise<readonly McpToolDescriptor[]> {
    const allTools: McpToolDescriptor[] = [];
    this.#routes.clear();
    for (const transport of this.#transports.values()) {
      const tools = await list(transport);
      for (const tool of tools) {
        const prefixed = this.#prefixTool(transport.serverId, tool);
        if (this.#routes.has(prefixed.name)) {
          throw new AiError(`Duplicate MCP tool name "${prefixed.name}" in pool.`);
        }
        this.#routes.set(prefixed.name, {
          transport,
          remoteName: prefixed.remoteName,
        });
        allTools.push(prefixed);
      }
    }
    return allTools;
  }

  #prefixTool(serverId: string, tool: McpToolDescriptor): McpToolDescriptor {
    const remoteName = tool.remoteName || tool.name;
    return {
      ...tool,
      name: `${serverId}${this.#toolNameSeparator}${remoteName}`,
      serverId,
      remoteName,
    };
  }

  #routeFromName(name: string): ToolRoute | undefined {
    const separatorAt = name.indexOf(this.#toolNameSeparator);
    if (separatorAt <= 0) {
      return undefined;
    }
    const serverId = name.slice(0, separatorAt);
    const remoteName = name.slice(separatorAt + this.#toolNameSeparator.length);
    const transport = this.#transports.get(serverId);
    return transport === undefined ? undefined : { transport, remoteName };
  }

  #refreshState(): void {
    const states = [...this.#transports.values()].map((transport) => transport.state);
    if (states.length === 0 || states.every((state) => state === 'closed')) {
      this.#transition('closed');
      return;
    }
    if (states.some((state) => state === 'reconnecting')) {
      this.#transition('reconnecting');
      return;
    }
    if (states.some((state) => state === 'connecting')) {
      this.#transition('connecting');
      return;
    }
    if (states.every((state) => state === 'connected')) {
      this.#transition('connected');
      return;
    }
    this.#transition('disconnected');
  }

  #transition(next: McpConnectionState): void {
    const previous = this.#state;
    if (previous === next) {
      return;
    }
    this.#state = next;
    for (const handler of this.#handlers) {
      handler(next, previous);
    }
  }
}

/** Create a multi-server MCP pool from serializable transport configs. */
export function createMcpTransportPool(config: McpTransportPoolConfig): McpTransportPool {
  return new McpTransportPool({
    serverId: config.serverId,
    transports: config.servers.map((server) => createMcpTransport(server)),
    toolNameSeparator: config.toolNameSeparator,
  });
}

/** Create a multi-server MCP pool over caller-owned transport instances. */
export function createMcpTransportPoolFromTransports(
  options: McpTransportPoolOptions,
): McpTransportPool {
  return new McpTransportPool(options);
}

/** Extract data-only `ui://` resources from an MCP tool result. */
export function extractMcpUiResources(result: McpToolResult): readonly McpUiResource[] {
  return withUiResources(result).uiResources;
}

function withUiResources(
  result: McpToolResult,
  serverId?: string,
  toolName?: string,
): McpPooledToolResult {
  const parsed = parseJson(result.content);
  const resources = parsed === undefined ? [] : collectUiResources(parsed, {
    serverId,
    toolName,
    toolCallId: result.toolCallId,
  });
  return { ...result, uiResources: resources };
}

interface ResourceContext {
  readonly serverId?: string;
  readonly toolName?: string;
  readonly toolCallId?: string;
}

function parseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function collectUiResources(value: unknown, context: ResourceContext): readonly McpUiResource[] {
  const resources = new Map<string, McpUiResource>();
  visit(value, (candidate) => {
    const resource = toUiResource(candidate, context);
    if (resource !== undefined) {
      resources.set(resource.uri, resource);
    }
  });
  return [...resources.values()];
}

function visit(value: unknown, inspect: (value: Readonly<Record<string, unknown>>) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      visit(item, inspect);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  inspect(value);
  for (const child of Object.values(value)) {
    visit(child, inspect);
  }
}

function toUiResource(
  value: Readonly<Record<string, unknown>>,
  context: ResourceContext,
): McpUiResource | undefined {
  const resource = isRecord(value.resource) ? value.resource : value;
  const uri = stringValue(resource.uri);
  if (uri === undefined || !uri.startsWith('ui://')) {
    return undefined;
  }
  return {
    uri,
    src: uri,
    ...optionalString('mimeType', resource.mimeType),
    ...optionalString('text', resource.text),
    ...optionalString('blob', resource.blob),
    ...optionalString('serverId', context.serverId),
    ...optionalString('toolName', context.toolName),
    ...optionalString('toolCallId', context.toolCallId),
  };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function optionalString(
  key: string,
  value: unknown,
): Readonly<Record<string, string>> {
  const string = stringValue(value);
  return string === undefined ? {} : { [key]: string };
}
