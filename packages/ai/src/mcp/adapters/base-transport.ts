import type {
  McpBackoffConfig,
  McpClientConnection,
  McpClientConnector,
  McpConnectionState,
  McpConnectOptions,
  McpConnectorConfig,
  McpStateChangeHandler,
  McpToolDescriptor,
  McpToolResult,
  McpTransportPort,
} from '../../ports/mcp-transport.ts';
import { AiError } from '../../contracts/errors.ts';
import { abortableDelay, maxReconnectAttempts, retryDelayMs } from '../application/backoff.ts';
import { combineSignals } from '../application/signal.ts';

/** Shared lifecycle implementation for MCP transports. */
export abstract class BaseMcpTransport implements McpTransportPort {
  readonly serverId: string;
  readonly #config: McpConnectorConfig;
  readonly #connector: McpClientConnector;
  readonly #backoff?: McpBackoffConfig;
  readonly #stateHandlers = new Set<McpStateChangeHandler>();
  #state: McpConnectionState = 'disconnected';
  #connection?: McpClientConnection;
  #tools = new Map<string, McpToolDescriptor>();
  #stopController = new AbortController();

  constructor(
    serverId: string,
    config: McpConnectorConfig,
    connector: McpClientConnector,
    backoff?: McpBackoffConfig,
  ) {
    this.serverId = serverId;
    this.#config = config;
    this.#connector = connector;
    this.#backoff = backoff;
  }

  get state(): McpConnectionState {
    return this.#state;
  }

  onStateChange(handler: McpStateChangeHandler): () => void {
    this.#stateHandlers.add(handler);
    return () => this.#stateHandlers.delete(handler);
  }

  async connect(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
    if (this.#state === 'closed') {
      throw new AiError(`MCP transport "${this.serverId}" is closed.`);
    }
    if (this.#state === 'connected') {
      return this.currentTools();
    }
    this.transition('connecting');
    return await this.open(options);
  }

  async reconnect(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
    if (this.#state === 'closed') {
      throw new AiError(`MCP transport "${this.serverId}" is closed.`);
    }
    this.transition('reconnecting');
    await this.closeConnection();
    const signal = combineSignals(this.#stopController.signal, options.signal);
    let lastError: unknown;
    const attempts = maxReconnectAttempts(this.#backoff);
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      signal.throwIfAborted();
      if (attempt > 1) {
        await abortableDelay(retryDelayMs(this.#backoff, attempt - 1), signal);
      }
      try {
        return await this.open({ signal });
      } catch (error) {
        lastError = error;
        this.transition('reconnecting');
      }
    }
    this.transition('disconnected');
    throw lastError;
  }

  async listTools(options: McpConnectOptions = {}): Promise<readonly McpToolDescriptor[]> {
    if (this.#state !== 'connected') {
      return await this.connect(options);
    }
    return this.currentTools();
  }

  async callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    options: McpConnectOptions = {},
  ): Promise<McpToolResult> {
    if (this.#state !== 'connected') {
      await this.connect(options);
    }
    const connection = this.#connection;
    if (connection === undefined) {
      throw new AiError(`MCP transport "${this.serverId}" is not connected.`);
    }
    const remoteName = this.#tools.get(name)?.remoteName ?? name;
    return await connection.callTool(remoteName, args, {
      signal: combineSignals(this.#stopController.signal, options.signal),
    });
  }

  async stop(): Promise<void> {
    if (this.#state === 'closed') {
      return;
    }
    this.#stopController.abort(new DOMException('MCP transport stopped.', 'AbortError'));
    await this.closeConnection();
    this.#tools = new Map();
    this.transition('closed');
  }

  protected currentTools(): readonly McpToolDescriptor[] {
    return [...this.#tools.values()];
  }

  async #replaceConnection(
    connection: McpClientConnection,
    signal: AbortSignal,
  ): Promise<readonly McpToolDescriptor[]> {
    this.#connection = connection;
    const tools = await connection.listTools({ signal });
    this.#tools = new Map(tools.map((tool) => [tool.name, tool]));
    this.transition('connected');
    return this.currentTools();
  }

  async open(options: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    const signal = combineSignals(this.#stopController.signal, options.signal);
    signal.throwIfAborted();
    const connection = await this.#connector(this.#config, { signal });
    return await this.#replaceConnection(connection, signal);
  }

  async closeConnection(): Promise<void> {
    const connection = this.#connection;
    this.#connection = undefined;
    this.#tools = new Map();
    if (connection !== undefined) {
      await connection.close();
    }
  }

  private transition(next: McpConnectionState): void {
    const previous = this.#state;
    if (previous === next) {
      return;
    }
    this.#state = next;
    for (const handler of this.#stateHandlers) {
      handler(next, previous);
    }
  }
}
