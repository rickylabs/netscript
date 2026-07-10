import { assertEquals } from '@std/assert';
import {
  createMcpTransportPoolFromTransports,
  type McpConnectionState,
  type McpConnectOptions,
  type McpPooledToolResult,
  type McpToolDescriptor,
  type McpToolResult,
  McpTransportPool,
  type McpTransportPort,
} from '@netscript/ai/mcp';
import { createInMemorySpanRecorder } from '@netscript/telemetry/testing';
import { createMcpAppCallHandler } from './sandbox.ts';

class FakeMcpTransport implements McpTransportPort {
  readonly serverId: string;
  state: McpConnectionState = 'connected';
  connectCount = 0;
  listCount = 0;
  callCount = 0;
  readonly calls: Array<Readonly<{ name: string; args: Readonly<Record<string, unknown>> }>> = [];
  readonly #tools: readonly McpToolDescriptor[];

  constructor(serverId: string, toolName: string) {
    this.serverId = serverId;
    this.#tools = [{
      name: toolName,
      remoteName: toolName,
      serverId,
      parameters: { type: 'object' },
    }];
  }

  connect(_options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    this.connectCount++;
    return Promise.resolve(this.#tools);
  }

  reconnect(_options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    this.connectCount++;
    return Promise.resolve(this.#tools);
  }

  listTools(_options?: McpConnectOptions): Promise<readonly McpToolDescriptor[]> {
    this.listCount++;
    return Promise.resolve(this.#tools);
  }

  callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    _options?: McpConnectOptions,
  ): Promise<McpToolResult> {
    this.callCount++;
    this.calls.push({ name, args });
    return Promise.resolve({
      toolCallId: `${this.serverId}:${name}`,
      content: JSON.stringify({ ok: true, serverId: this.serverId, name, args }),
      state: 'complete',
    });
  }

  onStateChange(
    _handler: (state: McpConnectionState, previous: McpConnectionState) => void,
  ): () => void {
    return () => {};
  }

  stop(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

class RecordingPool extends McpTransportPool {
  callCount = 0;

  override async callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    options?: McpConnectOptions,
  ): Promise<McpPooledToolResult> {
    this.callCount++;
    return await super.callTool(name, args, options);
  }
}

function callUrl(serverId: string): string {
  const url = new URL('https://app.test/api/mcp-apps/call');
  url.searchParams.set('serverId', serverId);
  return url.href;
}

function jsonRequest(serverId: string, body: Readonly<Record<string, unknown>>): Request {
  return new Request(callUrl(serverId), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

Deno.test('createMcpAppCallHandler routes same-server tool calls through the pool', async () => {
  const transport = new FakeMcpTransport('widgets', 'weather');
  const pool = new RecordingPool({ transports: [transport] });
  const handler = createMcpAppCallHandler({ clients: pool });

  const response = await handler(jsonRequest('widgets', {
    threadId: 'thread-1',
    serverId: 'widgets',
    toolName: 'weather',
    args: { city: 'Zurich' },
  }));
  const result = await response.json();

  assertEquals(response.status, 200);
  assertEquals(result.ok, true);
  assertEquals(pool.callCount, 1);
  assertEquals(transport.callCount, 1);
  assertEquals(transport.calls[0], { name: 'weather', args: { city: 'Zurich' } });
});

Deno.test('createMcpAppCallHandler rejects cross-server body ids before transport access', async () => {
  const widgets = new FakeMcpTransport('widgets', 'weather');
  const admin = new FakeMcpTransport('admin', 'delete_all');
  const pool = createMcpTransportPoolFromTransports({ transports: [widgets, admin] });
  const handler = createMcpAppCallHandler({ clients: pool });

  const response = await handler(jsonRequest('widgets', {
    serverId: 'admin',
    toolName: 'delete_all',
    args: {},
  }));
  const result = await response.json();

  assertEquals(response.status, 403);
  assertEquals(result.ok, false);
  assertEquals(widgets.listCount, 0);
  assertEquals(widgets.callCount, 0);
  assertEquals(admin.listCount, 0);
  assertEquals(admin.callCount, 0);
});

Deno.test('createMcpAppCallHandler uses the warm pool client for stdio-like transports', async () => {
  const stdio = new FakeMcpTransport('stdio-demo', 'inspect');
  const pool = createMcpTransportPoolFromTransports({ transports: [stdio] });
  const handler = createMcpAppCallHandler({ clients: pool });

  const response = await handler(jsonRequest('stdio-demo', {
    serverId: 'stdio-demo',
    toolName: 'inspect',
    args: { id: 'case-1' },
  }));

  assertEquals(response.status, 200);
  assertEquals(stdio.connectCount, 0);
  assertEquals(stdio.listCount, 1);
  assertEquals(stdio.callCount, 1);
  assertEquals(stdio.calls[0], { name: 'inspect', args: { id: 'case-1' } });
});

Deno.test('createMcpAppCallHandler emits an mcp.tool.call span', async () => {
  const transport = new FakeMcpTransport('widgets', 'weather');
  const pool = createMcpTransportPoolFromTransports({ transports: [transport] });
  const tracer = createInMemorySpanRecorder();
  const handler = createMcpAppCallHandler({ clients: pool, tracer });

  const response = await handler(jsonRequest('widgets', {
    serverId: 'widgets',
    toolName: 'weather',
    args: { city: 'Zurich' },
  }));

  assertEquals(response.status, 200);
  assertEquals(tracer.snapshots().map((span) => span.name), ['mcp.tool.call']);
  assertEquals(tracer.snapshots()[0]?.attributes['mcp.server.id'], 'widgets');
  assertEquals(tracer.snapshots()[0]?.attributes['mcp.tool.name'], 'weather');
  assertEquals(tracer.snapshots()[0]?.attributes['mcp.tool.ok'], true);
  assertEquals(tracer.snapshots()[0]?.ended, true);
});
