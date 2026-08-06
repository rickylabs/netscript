import { assert, assertEquals } from '@std/assert';
import { HYBRID_DELEGATION_DEFAULT_MODEL } from '../config/models.ts';
import {
  HYBRID_MCP_PROTOCOL_VERSION,
  HYBRID_MCP_TOOL_NAME,
  HybridDelegationError,
  type HybridDelegationResult,
} from './hybrid-delegation.ts';
import { HybridMcpServer, type HybridMcpWorker, runHybridMcpStdio } from './hybrid-mcp-server.ts';

const result: HybridDelegationResult = {
  output: 'bounded result',
  requested: { provider: 'openrouter', model: HYBRID_DELEGATION_DEFAULT_MODEL, effort: 'high' },
  observed: {
    provider: 'openrouter',
    model: HYBRID_DELEGATION_DEFAULT_MODEL,
    effort: 'high',
    source: 'opencode_argv',
  },
  durationMs: 12,
};

class Worker implements HybridMcpWorker {
  request: unknown;
  delegate(request: unknown): Promise<HybridDelegationResult> {
    this.request = request;
    return Promise.resolve(result);
  }
}

Deno.test('hybrid MCP exposes exactly the delegation tool after initialization', async () => {
  const server = new HybridMcpServer(new Worker());
  const initialized = await server.handle({ jsonrpc: '2.0', id: 1, method: 'initialize' });
  assertEquals(initialized?.result?.protocolVersion, HYBRID_MCP_PROTOCOL_VERSION);
  assertEquals(
    await server.handle({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    undefined,
  );
  const listed = await server.handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  const tools = listed?.result?.tools as Array<{ name: string }>;
  assertEquals(tools.map((tool) => tool.name), [HYBRID_MCP_TOOL_NAME]);
});

Deno.test('hybrid MCP returns bounded structured tool success and errors', async () => {
  const worker = new Worker();
  const server = new HybridMcpServer(worker);
  const response = await server.handle({
    jsonrpc: '2.0',
    id: 'call',
    method: 'tools/call',
    params: { name: HYBRID_MCP_TOOL_NAME, arguments: { task: 'do work' } },
  });
  assertEquals(worker.request, { task: 'do work' });
  assertEquals(response?.result?.isError, false);
  assertEquals((response?.result?.content as Array<{ text: string }>)[0].text, 'bounded result');

  const failing = new HybridMcpServer({
    delegate() {
      throw new HybridDelegationError('invalid_request', 'bad request');
    },
  });
  const error = await failing.handle({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: HYBRID_MCP_TOOL_NAME, arguments: { task: '' } },
  });
  assertEquals(error?.result?.isError, true);
  assertEquals(error?.result?.structuredContent, {
    error: { code: 'invalid_request', message: 'bad request' },
  });
});

Deno.test('MCP cancellation notification aborts the matching worker request', async () => {
  let resolveStarted!: () => void;
  const started = new Promise<void>((resolve) => resolveStarted = resolve);
  const server = new HybridMcpServer({
    delegate(_request, signal) {
      resolveStarted();
      return new Promise((_resolve, reject) => {
        signal?.addEventListener(
          'abort',
          () => reject(new HybridDelegationError('cancelled', 'delegation was cancelled')),
          { once: true },
        );
      });
    },
  });
  const call = server.handle({
    jsonrpc: '2.0',
    id: 44,
    method: 'tools/call',
    params: { name: HYBRID_MCP_TOOL_NAME, arguments: { task: 'wait' } },
  });
  await started;
  await server.handle({
    jsonrpc: '2.0',
    method: 'notifications/cancelled',
    params: { requestId: 44, reason: 'client closed' },
  });
  const response = await call;
  assertEquals(response?.result?.isError, true);
  assertEquals(
    (response?.result?.structuredContent as { error: { code: string } }).error.code,
    'cancelled',
  );
});

Deno.test('duplicate in-flight request ids fail without replacing cancellation ownership', async () => {
  let resolveStarted!: () => void;
  const started = new Promise<void>((resolve) => resolveStarted = resolve);
  const server = new HybridMcpServer({
    delegate(_request, signal) {
      resolveStarted();
      return new Promise((_resolve, reject) =>
        signal?.addEventListener(
          'abort',
          () => reject(new HybridDelegationError('cancelled', 'cancelled')),
          { once: true },
        )
      );
    },
  });
  const request = {
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/call',
    params: { name: HYBRID_MCP_TOOL_NAME, arguments: { task: 'wait' } },
  } as const;
  const first = server.handle(request);
  await started;
  assertEquals((await server.handle(request))?.error?.message, 'Duplicate in-flight request id');
  await server.handle({
    jsonrpc: '2.0',
    method: 'notifications/cancelled',
    params: { requestId: 9 },
  });
  assertEquals((await first)?.result?.isError, true);
});

Deno.test('newline stdio isolates parse errors and emits JSON-RPC responses', async () => {
  const input = new Blob([
    '{bad json}\n',
    JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/list' }),
    '\n',
  ]).stream();
  const chunks: Uint8Array[] = [];
  const output = new WritableStream<Uint8Array>({
    write(chunk) {
      chunks.push(chunk);
    },
  });
  await runHybridMcpStdio(new HybridMcpServer(new Worker()), input, output);
  const bytes = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  const lines = new TextDecoder().decode(bytes).trim().split('\n').map((line) => JSON.parse(line));
  assertEquals(lines.length, 2);
  assert(lines.some((line) => line.error?.code === -32700));
  assert(lines.some((line) => line.id === 7 && line.result.tools.length === 1));
});

Deno.test('invalid and unknown protocol requests do not expose internal errors', async () => {
  const server = new HybridMcpServer(new Worker());
  assertEquals((await server.handle({ nope: true }))?.error?.code, -32600);
  assertEquals(
    (await server.handle({ jsonrpc: '2.0', id: 1, method: 'unknown' }))?.error?.code,
    -32601,
  );
  assertEquals(
    (await server.handle({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'other', arguments: {} },
    }))?.error?.code,
    -32602,
  );
});
