/**
 * FA4 — MCP App widget action call handler for `@netscript/fresh/ai`.
 *
 * The handler is intentionally route-agnostic: a Fresh route mounts it at the
 * server-rendered widget call endpoint and stamps that endpoint with
 * `?serverId=<mcp-server>`. Widget JSON may echo a `serverId`, but this handler
 * treats the body value as untrusted and rejects it when it differs from the
 * server id carried by the route URL. Calls then execute through the shared
 * keep-alive {@linkcode McpTransportPool}, so chat turns and widget actions use
 * the same warm MCP transports, including non-reconnectable stdio children.
 *
 * @module
 */

import { getParentContextFromHeaders } from '@netscript/telemetry/context';
import { getTracer } from '@netscript/telemetry/tracer';

const DEFAULT_SERVER_QUERY_PARAM = 'serverId';
const DEFAULT_TOOL_NAME_SEPARATOR = '__';
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';
const MCP_APP_CALL_SPAN = 'mcp.tool.call';
const MCP_APP_TRACER = '@netscript/fresh/ai/mcp-app';
const SPAN_KIND_CLIENT: McpAppCallSpanKind = 2;
const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;

/** Span context propagated into MCP App call spans. */
export interface McpAppCallTraceContext {
  /** Read a value from the context. */
  getValue(key: symbol): unknown;
  /** Return a context with the value set. */
  setValue(key: symbol, value: unknown): McpAppCallTraceContext;
  /** Return a context with the value removed. */
  deleteValue(key: symbol): McpAppCallTraceContext;
}

/** Attribute value accepted by MCP App call spans. */
export type McpAppCallAttributeValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[];

/** Span kind value accepted by MCP App call spans. */
export type McpAppCallSpanKind = 0 | 1 | 2 | 3 | 4;

/** Attribute bag attached to MCP App call spans. */
export type McpAppCallAttributes = Readonly<Record<string, McpAppCallAttributeValue | undefined>>;

/** Span options used when starting an MCP App call span. */
export interface McpAppCallSpanOptions {
  /** Span kind; client spans use `2`, matching OpenTelemetry's CLIENT value. */
  readonly kind?: McpAppCallSpanKind;
  /** Initial span attributes. */
  readonly attributes?: McpAppCallAttributes;
}

/** Minimal span contract used by the MCP App call handler. */
export interface McpAppCallSpan {
  /** Set a single span attribute. */
  setAttribute(key: string, value: McpAppCallAttributeValue): this;
  /** Set several span attributes. */
  setAttributes(attributes: McpAppCallAttributes): this;
  /** Set the terminal span status. */
  setStatus(status: { readonly code: number; readonly message?: string }): this;
  /** Record an exception on the span. */
  recordException(exception: Error | string): void;
  /** End the span. */
  end(): void;
}

/** Minimal tracer contract used by the MCP App call handler. */
export interface McpAppCallTracer {
  /** Start a span with optional parent context. */
  startSpan(
    name: string,
    options?: McpAppCallSpanOptions,
    context?: McpAppCallTraceContext,
  ): McpAppCallSpan;
}

/** Tool descriptor shape read from the source MCP server before a widget call. */
export interface McpAppCallToolDescriptor {
  /** Tool name exposed by the transport or pool. */
  readonly name: string;
  /** Server-native tool name before any local prefixing. */
  readonly remoteName: string;
  /** Id of the MCP server exposing this tool. */
  readonly serverId: string;
}

/** Result shape returned from a pooled MCP tool call. */
export interface McpAppCallToolResult {
  /** Id of the tool call this result answers. */
  readonly toolCallId: string;
  /** Serialized result payload. */
  readonly content: string;
  /** Terminal state, when tracked. */
  readonly state?: 'complete' | 'error';
  /** Error message when the tool failed. */
  readonly error?: string;
  /** `ui://` resources extracted by the shared MCP pool, when present. */
  readonly uiResources?: readonly unknown[];
}

/** Warm source-server client read from the shared MCP pool. */
export interface McpAppCallServerClient {
  /** List tools exposed by this source MCP server. */
  listTools(
    options?: { readonly signal?: AbortSignal },
  ): Promise<readonly McpAppCallToolDescriptor[]>;
}

/** Shared keep-alive MCP pool consumed by {@linkcode createMcpAppCallHandler}. */
export interface McpAppCallClientPool {
  /** Read a warm pooled client by MCP server id. */
  server(serverId: string): McpAppCallServerClient | undefined;
  /** Call a server-prefixed MCP tool through the shared pool. */
  callTool(
    name: string,
    args: Readonly<Record<string, unknown>>,
    options?: { readonly signal?: AbortSignal },
  ): Promise<McpAppCallToolResult>;
}

/** Options for {@link createMcpAppCallHandler}. */
export interface McpAppCallHandlerOptions {
  /**
   * Shared keep-alive MCP transport pool.
   *
   * Pass the `McpTransportPool` returned by `createMcpTransportPool(...)` from
   * `@netscript/ai/mcp`. Use the same pool for chat turns and widget action
   * calls so non-reconnectable stdio transports are reused instead of reopened
   * per widget click.
   */
  readonly clients: McpAppCallClientPool;
  /**
   * Query parameter that carries the server-selected MCP server id. Defaults to
   * `"serverId"`.
   */
  readonly serverIdQueryParam?: string;
  /** Tracer override for tests; defaults to the Fresh AI MCP-App tracer. */
  readonly tracer?: McpAppCallTracer;
}

type McpAppCallBody = {
  readonly threadId?: string;
  readonly serverId?: string;
  readonly toolName: string;
  readonly args?: Readonly<Record<string, unknown>>;
  readonly messageId?: string;
};

type McpAppCallResult =
  | { readonly ok: true; readonly result: McpAppCallToolResult }
  | { readonly ok: false; readonly error: string };

function jsonResponse(result: McpAppCallResult, status = 200): Response {
  return new Response(JSON.stringify(result), {
    status,
    headers: { 'content-type': JSON_CONTENT_TYPE },
  });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringField(record: Readonly<Record<string, unknown>>, name: string): string | undefined {
  const value = record[name];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function objectField(
  record: Readonly<Record<string, unknown>>,
  name: string,
): Readonly<Record<string, unknown>> | undefined {
  const value = record[name];
  if (value === undefined) {
    return undefined;
  }
  return isRecord(value) ? value : undefined;
}

function normalizeArgs(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === undefined) {
    return {};
  }
  return isRecord(value) ? value : undefined;
}

function parseMcpAppCallBody(value: unknown): McpAppCallBody | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.method === 'tools/call') {
    const params = objectField(value, 'params');
    if (params === undefined) {
      return null;
    }
    const toolName = stringField(params, 'name');
    const args = normalizeArgs(params.arguments);
    if (toolName === undefined || args === undefined) {
      return null;
    }
    return {
      threadId: stringField(value, 'threadId'),
      serverId: stringField(value, 'serverId'),
      toolName,
      args,
      messageId: stringField(value, 'messageId'),
    };
  }

  const toolName = stringField(value, 'toolName');
  const args = normalizeArgs(value.args);
  if (toolName === undefined || args === undefined) {
    return null;
  }
  return {
    threadId: stringField(value, 'threadId'),
    serverId: stringField(value, 'serverId'),
    toolName,
    args,
    messageId: stringField(value, 'messageId'),
  };
}

async function readCallBody(request: Request): Promise<McpAppCallBody | null> {
  try {
    return parseMcpAppCallBody(await request.json());
  } catch {
    return null;
  }
}

function requestServerId(request: Request, queryParam: string): string | null {
  const value = new URL(request.url).searchParams.get(queryParam);
  return value && value.trim().length > 0 ? value : null;
}

function parentFromRequest(request: Request): ReturnType<typeof getParentContextFromHeaders> {
  return getParentContextFromHeaders(Object.fromEntries(request.headers));
}

function isToolExposed(
  tool: McpAppCallToolDescriptor,
  serverId: string,
  toolName: string,
): boolean {
  return tool.remoteName === toolName ||
    tool.name === toolName ||
    tool.name === `${serverId}${DEFAULT_TOOL_NAME_SEPARATOR}${toolName}`;
}

function prefixedToolName(serverId: string, toolName: string): string {
  return `${serverId}${DEFAULT_TOOL_NAME_SEPARATOR}${toolName}`;
}

function freshAiMcpTracer(): McpAppCallTracer {
  const tracer = getTracer(MCP_APP_TRACER);
  return {
    startSpan(name, options, context) {
      return tracer.startSpan(name, options, context);
    },
  };
}

async function withMcpAppCallSpan<T>(
  tracer: McpAppCallTracer,
  parentContext: McpAppCallTraceContext,
  run: (span: McpAppCallSpan) => Promise<T>,
): Promise<T> {
  const span = tracer.startSpan(
    MCP_APP_CALL_SPAN,
    { kind: SPAN_KIND_CLIENT },
    parentContext,
  );
  try {
    const result = await run(span);
    span.setStatus({ code: SPAN_STATUS_OK });
    return result;
  } catch (error: unknown) {
    const exception = error instanceof Error ? error : new Error(String(error));
    span.setStatus({ code: SPAN_STATUS_ERROR, message: exception.message });
    span.recordException(exception);
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Build a Fresh-compatible MCP App widget action route handler.
 *
 * The returned handler accepts `POST` JSON from an MCP App bridge, verifies that
 * any body `serverId` matches the server id selected by the route URL, checks
 * the target tool is exposed by that same server, and invokes the tool through
 * the supplied {@linkcode McpTransportPool}. This pool-sharing pattern is the
 * intended FA3/FA4 wiring: one keep-alive MCP pool serves both chat turns and
 * rendered widget action calls.
 *
 * @param options Shared MCP pool, optional route query parameter, and tracer override.
 * @returns A request handler suitable for Fresh route exports.
 *
 * @example
 * ```ts
 * import { createMcpTransportPool } from '@netscript/ai/mcp';
 * import { createMcpAppCallHandler } from '@netscript/fresh/ai/sandbox';
 *
 * const clients = createMcpTransportPool({
 *   servers: [{ kind: 'streamable-http', serverId: 'widgets', url: 'https://mcp.example.test' }],
 * });
 *
 * export const handler = {
 *   POST: createMcpAppCallHandler({ clients }),
 * };
 * ```
 */
export function createMcpAppCallHandler(
  options: McpAppCallHandlerOptions,
): (request: Request) => Promise<Response> {
  const queryParam = options.serverIdQueryParam ?? DEFAULT_SERVER_QUERY_PARAM;
  const tracer = options.tracer ?? freshAiMcpTracer();

  return async (request: Request): Promise<Response> => {
    const body = await readCallBody(request);
    if (body === null) {
      return jsonResponse({ ok: false, error: 'Expected a JSON tools/call body.' }, 400);
    }

    const serverId = requestServerId(request, queryParam);
    if (serverId === null) {
      return jsonResponse({ ok: false, error: `Expected ?${queryParam}=<server-id>.` }, 400);
    }

    return await withMcpAppCallSpan(
      tracer,
      parentFromRequest(request),
      async (span) => {
        span.setAttributes({
          'mcp.server.id': serverId,
          'mcp.tool.name': body.toolName,
          'mcp.tool.thread_id': body.threadId,
          'mcp.tool.message_id': body.messageId,
        });

        if (body.serverId !== undefined && body.serverId !== serverId) {
          span.setAttribute('mcp.tool.ok', false);
          return jsonResponse(
            { ok: false, error: 'MCP widget may only call tools on its source server.' },
            403,
          );
        }

        const server = options.clients.server(serverId);
        if (server === undefined) {
          span.setAttribute('mcp.tool.ok', false);
          return jsonResponse({ ok: false, error: `Unknown MCP server: ${serverId}` }, 404);
        }

        const tools = await server.listTools({ signal: request.signal });
        if (!tools.some((tool) => isToolExposed(tool, serverId, body.toolName))) {
          span.setAttribute('mcp.tool.ok', false);
          return jsonResponse({ ok: false, error: `Tool not allowed: ${body.toolName}` }, 403);
        }

        const result = await options.clients.callTool(
          prefixedToolName(serverId, body.toolName),
          body.args ?? {},
          { signal: request.signal },
        );
        span.setAttribute('mcp.tool.ok', true);
        return jsonResponse({ ok: true, result });
      },
    );
  };
}
