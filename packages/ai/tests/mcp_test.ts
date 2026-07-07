import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  createMcpTransport,
  createMcpTransportPool,
  createMcpTransportPoolFromTransports,
  type McpClientConnection,
  type McpConnectionState,
  type McpConnectOptions,
  type McpStateChangeHandler,
  type McpToolDescriptor,
  type McpToolResult,
  type McpTransportPort,
  registerMcpTools,
  StdioMcpTransport,
  StreamableHttpMcpTransport,
} from '../mcp.ts';
import { createToolRegistry } from '../tools.ts';

const searchTool: McpToolDescriptor = {
  name: 'demo_search',
  remoteName: 'search',
  serverId: 'demo',
  description: 'Search demo data',
  parameters: {
    type: 'object',
    properties: { q: { type: 'string' } },
    required: ['q'],
  },
};

function connection(tools: readonly McpToolDescriptor[] = [searchTool]): McpClientConnection {
  let closed = false;
  return {
    listTools(): Promise<readonly McpToolDescriptor[]> {
      assert(!closed, 'closed connection should not list tools');
      return Promise.resolve(tools);
    },
    callTool(name): Promise<{ toolCallId: string; content: string; state: 'complete' }> {
      assert(!closed, 'closed connection should not call tools');
      return Promise.resolve({ toolCallId: name, content: `called:${name}`, state: 'complete' });
    },
    close(): Promise<void> {
      closed = true;
      return Promise.resolve();
    },
  };
}

class RecordingTransport implements McpTransportPort {
  readonly serverId: string;
  readonly #tools: readonly McpToolDescriptor[];
  readonly #content: string;
  readonly #handlers = new Set<McpStateChangeHandler>();
  state: McpConnectionState = 'disconnected';
  connectCount = 0;
  calls: Array<{ readonly name: string; readonly args: Readonly<Record<string, unknown>> }> = [];

  constructor(serverId: string, tools: readonly McpToolDescriptor[], content = '{}') {
    this.serverId = serverId;
    this.#tools = tools;
    this.#content = content;
  }

  connect(): Promise<readonly McpToolDescriptor[]> {
    this.connectCount += 1;
    this.#setState('connected');
    return Promise.resolve(this.#tools);
  }

  reconnect(): Promise<readonly McpToolDescriptor[]> {
    this.#setState('reconnecting');
    this.#setState('connected');
    return Promise.resolve(this.#tools);
  }

  listTools(): Promise<readonly McpToolDescriptor[]> {
    if (this.state !== 'connected') {
      return this.connect();
    }
    return Promise.resolve(this.#tools);
  }

  callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    _options?: McpConnectOptions,
  ): Promise<McpToolResult> {
    this.calls.push({ name, args });
    return Promise.resolve({
      toolCallId: `${this.serverId}:${name}`,
      content: this.#content,
      state: 'complete',
    });
  }

  onStateChange(handler: McpStateChangeHandler): () => void {
    this.#handlers.add(handler);
    return () => this.#handlers.delete(handler);
  }

  stop(): Promise<void> {
    this.#setState('closed');
    return Promise.resolve();
  }

  #setState(next: McpConnectionState): void {
    const previous = this.state;
    if (previous === next) {
      return;
    }
    this.state = next;
    for (const handler of this.#handlers) {
      handler(next, previous);
    }
  }
}

function headersOf(value: unknown): Readonly<Record<string, string>> | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const entries = Object.entries(value).filter((entry): entry is [string, string] =>
    typeof entry[1] === 'string'
  );
  return Object.fromEntries(entries);
}

Deno.test('createMcpTransport selects stdio and Streamable-HTTP transports', () => {
  const stdio = createMcpTransport({
    kind: 'stdio',
    serverId: 'stdio-demo',
    command: 'demo-mcp',
    connector: () => Promise.resolve(connection()),
  });
  const http = createMcpTransport({
    kind: 'streamable-http',
    serverId: 'http-demo',
    url: 'https://mcp.example.test',
    connector: () => Promise.resolve(connection()),
  });

  assert(stdio instanceof StdioMcpTransport);
  assert(http instanceof StreamableHttpMcpTransport);
});

Deno.test('StreamableHttpMcpTransport applies none auth mode without credential headers', async () => {
  const seenHeaders: Array<Readonly<Record<string, string>> | undefined> = [];
  const transport = new StreamableHttpMcpTransport({
    serverId: 'demo',
    url: 'https://mcp.example.test',
    auth: { mode: 'none' },
    connector: (config) => {
      seenHeaders.push(headersOf(config.headers));
      return Promise.resolve(connection());
    },
  });

  await transport.connect();
  assertEquals(seenHeaders, [{}]);
});

Deno.test('StreamableHttpMcpTransport applies api-token auth headers from injected config', async () => {
  const seenHeaders: Array<Readonly<Record<string, string>> | undefined> = [];
  const transport = new StreamableHttpMcpTransport({
    serverId: 'demo',
    url: 'https://mcp.example.test',
    auth: { mode: 'api-token', token: 'abc123', scheme: 'Bearer' },
    connector: (config) => {
      seenHeaders.push(headersOf(config.headers));
      return Promise.resolve(connection());
    },
  });

  await transport.connect();
  assertEquals(seenHeaders, [{ Authorization: 'Bearer abc123' }]);
});

Deno.test('StreamableHttpMcpTransport applies oauth bearer headers from injected config', async () => {
  const seenHeaders: Array<Readonly<Record<string, string>> | undefined> = [];
  const transport = new StreamableHttpMcpTransport({
    serverId: 'demo',
    url: 'https://mcp.example.test',
    auth: { mode: 'oauth', accessToken: 'oauth-token' },
    connector: (config) => {
      seenHeaders.push(headersOf(config.headers));
      return Promise.resolve(connection());
    },
  });

  await transport.connect();
  assertEquals(seenHeaders, [{ Authorization: 'Bearer oauth-token' }]);
});

Deno.test('registerMcpTools adds tools on connect and removes them on stop', async () => {
  const registry = createToolRegistry();
  const transport = new StreamableHttpMcpTransport({
    serverId: 'demo',
    url: 'https://mcp.example.test',
    connector: () => Promise.resolve(connection()),
  });

  const registration = await registerMcpTools(registry, transport);
  assertEquals(registration.toolNames, ['demo_search']);
  assert(registry.has('demo_search'));

  await registration.stop();
  assertEquals(registry.has('demo_search'), false);
  assertEquals(transport.state, 'closed');
});

Deno.test('McpTransportPool keys servers and prefixes remote tool names', async () => {
  const first = new RecordingTransport('alpha', [{
    ...searchTool,
    name: 'search',
    remoteName: 'search',
    serverId: 'alpha',
  }]);
  const second = new RecordingTransport('beta', [{
    ...searchTool,
    name: 'search',
    remoteName: 'search',
    serverId: 'beta',
  }]);
  const pool = createMcpTransportPoolFromTransports({ transports: [first, second] });

  const tools = await pool.listTools();

  assertEquals(pool.serverIds, ['alpha', 'beta']);
  assertEquals(tools.map((tool) => tool.name), ['alpha__search', 'beta__search']);
  assertEquals(tools.map((tool) => tool.remoteName), ['search', 'search']);
});

Deno.test('McpTransportPool keeps transports warm across turns', async () => {
  const transport = new RecordingTransport('alpha', [searchTool]);
  const pool = createMcpTransportPoolFromTransports({ transports: [transport] });

  await pool.listTools();
  await pool.callTool('alpha__search', { q: 'one' });
  await pool.listTools();
  await pool.callTool('alpha__search', { q: 'two' });

  assertEquals(transport.connectCount, 1);
  assertEquals(transport.calls.map((call) => call.name), ['search', 'search']);
  assertEquals(transport.calls.map((call) => call.args), [{ q: 'one' }, { q: 'two' }]);
});

Deno.test('McpTransportPool extracts ui resources as plain resource and src data', async () => {
  const content = JSON.stringify({
    content: [{
      type: 'resource',
      resource: {
        uri: 'ui://widgets.example/weather/card.js',
        mimeType: 'text/javascript',
        text: 'customElements.define("weather-card", class extends HTMLElement {})',
      },
    }],
  });
  const transport = new RecordingTransport('widgets', [{
    ...searchTool,
    name: 'weather',
    remoteName: 'weather',
    serverId: 'widgets',
  }], content);
  const pool = createMcpTransportPoolFromTransports({ transports: [transport] });
  await pool.listTools();

  const result = await pool.callTool('widgets__weather', { city: 'Zurich' });

  assertEquals(result.uiResources, [{
    uri: 'ui://widgets.example/weather/card.js',
    src: 'ui://widgets.example/weather/card.js',
    mimeType: 'text/javascript',
    text: 'customElements.define("weather-card", class extends HTMLElement {})',
    serverId: 'widgets',
    toolName: 'weather',
    toolCallId: 'widgets:weather',
  }]);
});

Deno.test('createMcpTransportPool builds pooled transports from config', async () => {
  let connects = 0;
  const pool = createMcpTransportPool({
    servers: [{
      kind: 'streamable-http',
      serverId: 'http',
      url: 'https://mcp.example.test',
      connector: () => {
        connects += 1;
        return Promise.resolve(connection([{
          ...searchTool,
          name: 'search',
          remoteName: 'search',
          serverId: 'http',
        }]));
      },
    }],
  });

  assertEquals((await pool.listTools()).map((tool) => tool.name), ['http__search']);
  assertEquals((await pool.listTools()).map((tool) => tool.name), ['http__search']);
  assertEquals(connects, 1);
});

Deno.test('Streamable-HTTP reconnect backs off and resurfaces tools without duplicates', async () => {
  const registry = createToolRegistry();
  const connections = [
    () => Promise.resolve(connection([searchTool])),
    () => Promise.reject(new Error('mid-stream drop')),
    () => Promise.resolve(connection([searchTool])),
  ];
  const states: string[] = [];
  let calls = 0;
  const transport = new StreamableHttpMcpTransport({
    serverId: 'demo',
    url: 'https://mcp.example.test',
    backoff: { initialDelayMs: 0, maxDelayMs: 0, maxAttempts: 2 },
    connector: () => {
      const open = connections[calls];
      calls += 1;
      return open === undefined ? Promise.reject(new Error('unexpected connect')) : open();
    },
  });
  transport.onStateChange((state) => states.push(state));

  await registerMcpTools(registry, transport);
  assertEquals(registry.list().map((tool) => tool.name), ['demo_search']);

  await transport.reconnect();
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

  assertEquals(calls, 3);
  assertEquals(states.includes('reconnecting'), true);
  assertEquals(registry.list().map((tool) => tool.name), ['demo_search']);
});

Deno.test('stop aborts in-flight connect work and moves to closed', async () => {
  let signalSeen: AbortSignal | undefined;
  const transport = new StreamableHttpMcpTransport({
    serverId: 'demo',
    url: 'https://mcp.example.test',
    connector: (_config, options) => {
      signalSeen = options.signal;
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), {
          once: true,
        });
      });
    },
  });

  const pending = transport.connect();
  await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  await transport.stop();

  assertEquals(signalSeen?.aborted, true);
  assertEquals(transport.state, 'closed');
  await assertRejects(() => pending);
});
