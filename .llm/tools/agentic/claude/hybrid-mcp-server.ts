/** Minimal newline-delimited MCP server for bounded OpenRouter delegation. */

import {
  HYBRID_MCP_PROTOCOL_VERSION,
  HYBRID_MCP_SERVER_NAME,
  HYBRID_MCP_SERVER_VERSION,
  HYBRID_MCP_TOOL_NAME,
  HybridDelegationError,
  type HybridDelegationRequest,
  type HybridDelegationResult,
} from './hybrid-delegation.ts';
import { HybridOpenCodeAdapter } from './hybrid-opencode-adapter.ts';

type RequestId = string | number;

export interface HybridMcpWorker {
  delegate(request: HybridDelegationRequest, signal?: AbortSignal): Promise<HybridDelegationResult>;
}

interface JsonRpcRequest {
  readonly jsonrpc: '2.0';
  readonly id?: RequestId;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  readonly jsonrpc: '2.0';
  readonly id: RequestId | null;
  readonly result?: Record<string, unknown>;
  readonly error?: { readonly code: number; readonly message: string };
}

const TOOL_SCHEMA = {
  type: 'object',
  properties: {
    task: { type: 'string', description: 'The bounded task to delegate.' },
    context: { type: 'string', description: 'Optional caller-selected context.' },
    model: { type: 'string', description: 'An approved centralized OpenRouter model id.' },
    effort: { type: 'string', description: 'Worker reasoning effort.' },
    timeoutMs: { type: 'integer', description: 'Bounded execution timeout in milliseconds.' },
  },
  required: ['task'],
  additionalProperties: false,
} as const;

function rpcError(id: RequestId | null, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message: message.slice(0, 512) } };
}

function parseRequest(value: unknown): JsonRpcRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid Request');
  }
  const record = value as Record<string, unknown>;
  if (record.jsonrpc !== '2.0' || typeof record.method !== 'string') {
    throw new Error('Invalid Request');
  }
  if (
    record.id !== undefined && typeof record.id !== 'string' && typeof record.id !== 'number'
  ) throw new Error('Invalid Request');
  if (
    record.params !== undefined &&
    (!record.params || typeof record.params !== 'object' || Array.isArray(record.params))
  ) {
    throw new Error('Invalid Request');
  }
  return value as JsonRpcRequest;
}

/** Handles the exact MCP surface required by the hybrid launcher. */
export class HybridMcpServer {
  readonly #active = new Map<RequestId, AbortController>();

  constructor(readonly worker: HybridMcpWorker) {}

  async handle(value: unknown): Promise<JsonRpcResponse | undefined> {
    let request: JsonRpcRequest;
    try {
      request = parseRequest(value);
    } catch {
      return rpcError(null, -32600, 'Invalid Request');
    }
    if (request.method === 'notifications/initialized') return undefined;
    if (request.method === 'notifications/cancelled') {
      const requestId = request.params?.requestId;
      if (typeof requestId === 'string' || typeof requestId === 'number') {
        this.#active.get(requestId)?.abort();
      }
      return undefined;
    }
    const id = request.id ?? null;
    if (id === null) return undefined;
    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: HYBRID_MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: HYBRID_MCP_SERVER_NAME, version: HYBRID_MCP_SERVER_VERSION },
        },
      };
    }
    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: [{
            name: HYBRID_MCP_TOOL_NAME,
            description: 'Delegate one bounded task to an approved OpenRouter worker.',
            inputSchema: TOOL_SCHEMA,
          }],
        },
      };
    }
    if (request.method !== 'tools/call') return rpcError(id, -32601, 'Method not found');
    if (this.#active.has(id)) return rpcError(id, -32600, 'Duplicate in-flight request id');
    if (request.params?.name !== HYBRID_MCP_TOOL_NAME) {
      return rpcError(id, -32602, 'Unknown tool');
    }
    const args = request.params.arguments;
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      return rpcError(id, -32602, 'Tool arguments must be an object');
    }
    const controller = new AbortController();
    this.#active.set(id, controller);
    try {
      const result = await this.worker.delegate(args as HybridDelegationRequest, controller.signal);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: result.output }],
          structuredContent: result,
          isError: false,
        },
      };
    } catch (error) {
      const known = error instanceof HybridDelegationError;
      const code = known ? error.code : 'worker_failed';
      const message = known ? error.message : 'delegation failed';
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `${code}: ${message.slice(0, 384)}` }],
          structuredContent: { error: { code, message: message.slice(0, 384) } },
          isError: true,
        },
      };
    } finally {
      this.#active.delete(id);
    }
  }
}

/** Runs concurrent JSON-RPC calls so cancellation notifications remain responsive. */
export async function runHybridMcpStdio(
  server: HybridMcpServer,
  input: ReadableStream<Uint8Array>,
  output: WritableStream<Uint8Array>,
): Promise<void> {
  const reader = input.getReader();
  const writer = output.getWriter();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const pending = new Set<Promise<void>>();
  let writes = Promise.resolve();
  let buffer = '';
  const emit = (response: JsonRpcResponse): Promise<void> => {
    writes = writes.then(() => writer.write(encoder.encode(`${JSON.stringify(response)}\n`)));
    return writes;
  };
  const dispatch = (value: unknown): void => {
    const operation = server.handle(value).then((response) => response && emit(response)).then(
      () => {},
    );
    pending.add(operation);
    operation.then(
      () => pending.delete(operation),
      () => pending.delete(operation),
    );
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split('\n');
      buffer = done ? '' : lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          dispatch(JSON.parse(line));
        } catch {
          await emit(rpcError(null, -32700, 'Parse error'));
        }
      }
      if (done) break;
    }
    await Promise.all(pending);
    await writes;
  } finally {
    reader.releaseLock();
    writer.releaseLock();
  }
}

function parseCwd(args: readonly string[]): string {
  if (args.length === 2 && args[0] === '--cwd' && args[1]) return args[1];
  throw new Error('usage: hybrid-mcp-server.ts --cwd <absolute-path>');
}

if (import.meta.main) {
  const cwd = parseCwd(Deno.args);
  const server = new HybridMcpServer(new HybridOpenCodeAdapter({ cwd }));
  await runHybridMcpStdio(server, Deno.stdin.readable, Deno.stdout.writable);
}
