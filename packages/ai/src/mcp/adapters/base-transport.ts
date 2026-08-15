import type {
  McpBackoffConfig,
  McpClientConnection,
  McpClientConnector,
  McpConnectionState,
  McpConnectOptions,
  McpConnectorConfig,
  McpReadResourceResult,
  McpStateChangeHandler,
  McpToolDescriptor,
  McpToolResult,
  McpTransportPort,
} from '../../ports/mcp-transport.ts';
import { AiError } from '../../contracts/errors.ts';
import { abortableDelay, maxReconnectAttempts, retryDelayMs } from '../application/backoff.ts';
import { combineSignals } from '../application/signal.ts';

/** Shared lifecycle implementation for MCP transports. */
export class BaseMcpTransport implements McpTransportPort {
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
    await this.closeConnection(options);
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
    const signal = combineSignals(this.#stopController.signal, options.signal);
    return await settleOperation(connection.callTool(remoteName, args, { signal }), signal);
  }

  async readResource(
    uri: string,
    options: McpConnectOptions = {},
  ): Promise<McpReadResourceResult> {
    if (this.#state !== 'connected') {
      await this.connect(options);
    }
    const connection = this.#connection;
    if (connection === undefined) {
      throw new AiError(`MCP transport "${this.serverId}" is not connected.`);
    }
    const signal = combineSignals(this.#stopController.signal, options.signal);
    return await settleOperation(connection.readResource(uri, { signal }), signal);
  }

  async stop(options: McpConnectOptions = {}): Promise<void> {
    if (this.#state === 'closed') {
      return;
    }
    this.#stopController.abort(new DOMException('MCP transport stopped.', 'AbortError'));
    try {
      await this.closeConnection(options);
    } finally {
      this.#tools = new Map();
      this.transition('closed');
    }
  }

  protected currentTools(): readonly McpToolDescriptor[] {
    return [...this.#tools.values()];
  }

  async #replaceConnection(
    connection: McpClientConnection,
    signal: AbortSignal,
  ): Promise<readonly McpToolDescriptor[]> {
    this.#connection = connection;
    try {
      const tools = await connection.listTools({ signal });
      this.#tools = new Map(tools.map((tool) => [tool.name, tool]));
      this.transition('connected');
      return this.currentTools();
    } catch (error) {
      this.#connection = undefined;
      closeLateConnection(connection);
      throw error;
    }
  }

  async open(options: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    const signal = combineSignals(this.#stopController.signal, options.signal);
    signal.throwIfAborted();
    const connection = await settleConnection(this.#connector(this.#config, { signal }), signal);
    return await this.#replaceConnection(connection, signal);
  }

  async closeConnection(options: McpConnectOptions = {}): Promise<void> {
    const connection = this.#connection;
    this.#connection = undefined;
    this.#tools = new Map();
    if (connection !== undefined) {
      await settleOperation(connection.close(options), options.signal);
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

function settleConnection(
  operation: Promise<McpClientConnection>,
  signal: AbortSignal,
): Promise<McpClientConnection> {
  if (signal.aborted) {
    operation.then(closeLateConnection, () => {});
    return Promise.reject(signal.reason);
  }
  return new Promise<McpClientConnection>((resolve, reject) => {
    let settled = false;
    const onAbort = (): void => {
      settled = true;
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (connection) => {
        signal.removeEventListener('abort', onAbort);
        if (settled) {
          closeLateConnection(connection);
          return;
        }
        settled = true;
        resolve(connection);
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

function closeLateConnection(connection: McpClientConnection): void {
  connection.close().catch(() => undefined);
}

function settleOperation<T>(operation: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (signal === undefined) {
    return operation;
  }
  if (signal.aborted) {
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
        if (!settled) {
          settled = true;
          resolve(value);
        }
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
