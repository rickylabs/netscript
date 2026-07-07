/**
 * oRPC Tracing Plugin
 *
 * Enriches Deno OTEL HTTP spans with oRPC-specific metadata.
 * This plugin adds RPC attributes to the active span without creating duplicate spans.
 *
 * Uses oRPC's interceptor-based plugin architecture to hook into the request lifecycle.
 *
 * @module
 */

import {
  getActiveSpan,
  getTracer,
  SpanKind,
  SpanStatusCode,
  withSpan,
} from '../application/mod.ts';
import type { Attributes, AttributeValue, Tracer } from '../application/mod.ts';
import { SpanNames } from '../attributes/mod.ts';
import { contextWithSpan, getParentContextFromHeaders, withContextAsync } from '../context/mod.ts';
import type { PropagationHeaders } from '../context/mod.ts';
import type { GenericHandlerOptions } from './_types.ts';
import { extractInputKeys } from './_utils.ts';

const TRACER_NAME = '@netscript/orpc';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for the TracingPlugin
 */
export interface TracingPluginOptions {
  /**
   * Service name for rpc.service attribute.
   * If not provided, defaults to 'unknown'.
   */
  serviceName?: string;

  /**
   * Whether to record input keys (not values) in span attributes.
   * Useful for debugging without exposing sensitive data.
   * @default true
   */
  recordInputKeys?: boolean;

  /**
   * Maximum number of input keys to record.
   * Prevents attribute explosion for large inputs.
   * @default 20
   */
  maxInputKeys?: number;

  /**
   * Custom attribute prefix for all attributes set by this plugin.
   * @default '' (no prefix)
   */
  attributePrefix?: string;

  /**
   * Optional tracer override for tests. Production callers use the shared tracer.
   */
  tracer?: Tracer;
}

interface ErrorLike {
  readonly message?: string;
  readonly code?: string;
  readonly status?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function readProperty(source: unknown, key: string): unknown {
  return isRecord(source) ? source[key] : undefined;
}

function readHeaders(source: unknown): PropagationHeaders {
  const context = readProperty(source, 'context');
  const contextTraceHeaders = readProperty(context, 'traceHeaders');
  const request = readProperty(source, 'request');
  const requestHeaders = readProperty(request, 'headers');

  const traceparent = readHeaderValue(contextTraceHeaders, 'traceparent') ??
    readHeaderValue(requestHeaders, 'traceparent');
  const tracestate = readHeaderValue(contextTraceHeaders, 'tracestate') ??
    readHeaderValue(requestHeaders, 'tracestate');

  const headers: PropagationHeaders = {};
  if (traceparent) {
    headers.traceparent = traceparent;
  }
  if (tracestate) {
    headers.tracestate = tracestate;
  }
  return headers;
}

function readHeaderValue(source: unknown, key: string): string | undefined {
  if (!source) {
    return undefined;
  }
  if (source instanceof Headers) {
    return source.get(key) ?? undefined;
  }
  if (isRecord(source)) {
    const value = source[key] ?? source[key.toLowerCase()];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

function readPath(source: unknown): string {
  const path = readProperty(source, 'path');
  if (Array.isArray(path)) {
    return path.map((part) => String(part)).join('.');
  }
  return typeof path === 'string' ? path : 'unknown';
}

function toErrorLike(error: unknown): ErrorLike {
  if (error instanceof Error) {
    const code = readProperty(error, 'code');
    const status = readProperty(error, 'status');
    return {
      message: error.message,
      ...(typeof code === 'string' ? { code } : {}),
      ...(typeof status === 'number' ? { status } : {}),
    };
  }
  if (isRecord(error)) {
    const message = readProperty(error, 'message');
    const code = readProperty(error, 'code');
    const status = readProperty(error, 'status');
    return {
      ...(typeof message === 'string' ? { message } : {}),
      ...(typeof code === 'string' ? { code } : {}),
      ...(typeof status === 'number' ? { status } : {}),
    };
  }
  return { message: String(error) };
}

function recordException(span: { recordException(error: Error): void }, error: unknown): void {
  span.recordException(error instanceof Error ? error : new Error(String(error)));
}

function prefixedAttributes(
  prefix: string,
  attributes: Readonly<Record<string, AttributeValue>>,
): Attributes {
  const result: Attributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    result[`${prefix}${key}`] = value;
  }
  return result;
}

// ============================================================================
// PLUGIN IMPLEMENTATION
// ============================================================================

/**
 * TracingPlugin for oRPC handlers.
 *
 * Enriches the active Deno OTEL span with RPC-specific attributes:
 * - `rpc.system`: Always "orpc"
 * - `rpc.service`: The service name
 * - `rpc.method`: The full procedure path (e.g., "v1.users.list")
 * - `rpc.input_keys`: Comma-separated list of input keys (optional)
 * - `rpc.error.code`: Error code on failure
 *
 * @example
 * ```ts
 * import { TracingPlugin } from '@netscript/telemetry/orpc';
 * import { RPCHandler } from '@orpc/server/fetch';
 *
 * const rpcHandler = new RPCHandler(router, {
 *   plugins: [
 *     new TracingPlugin({ serviceName: 'users' }),
 *   ],
 * });
 * ```
 */
export class TracingPlugin {
  private readonly options: Required<Omit<TracingPluginOptions, 'tracer'>>;
  private readonly tracer?: Tracer;

  /**
   * Plugin order - run early to set attributes before other processing
   */
  order = 1000;

  /**
   * Create an oRPC tracing plugin.
   */
  constructor(options: TracingPluginOptions = {}) {
    this.tracer = options.tracer;
    this.options = {
      serviceName: options.serviceName ?? 'unknown',
      recordInputKeys: options.recordInputKeys ?? true,
      maxInputKeys: options.maxInputKeys ?? 20,
      attributePrefix: options.attributePrefix ?? '',
    };
  }

  /**
   * Initialize the plugin by adding interceptors to the handler options.
   * This is called by oRPC when the handler is created.
   *
   * Uses generic types to be compatible with any oRPC handler version.
   */
  // deno-lint-ignore no-explicit-any -- oRPC does not export the router type consumed by plugin init.
  init(handlerOptions: GenericHandlerOptions, _router?: any): void {
    const { serviceName, recordInputKeys, maxInputKeys, attributePrefix } = this.options;

    // Add root interceptor for request-level tracing
    handlerOptions.rootInterceptors ??= [];
    // deno-lint-ignore no-explicit-any
    handlerOptions.rootInterceptors.push(async (options: any) => {
      const headers = readHeaders(options);
      const parentContext = getParentContextFromHeaders(headers);
      const tracer = this.tracer ?? getTracer(TRACER_NAME);

      return await withSpan(
        tracer,
        SpanNames.RPC_SERVER,
        async (span) =>
          await withContextAsync(contextWithSpan(span, parentContext), async () => {
            span.setAttributes(prefixedAttributes(attributePrefix, {
              'rpc.system': 'orpc',
              'rpc.service': serviceName,
              'netscript.rpc.transport': 'orpc',
            }));
            try {
              const result = await options.next();
              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            } catch (error) {
              const err = toErrorLike(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: err.message,
              });
              span.setAttributes(prefixedAttributes(attributePrefix, {
                'rpc.error.code': err.code ?? 'UNKNOWN',
              }));
              recordException(span, error);
              throw error;
            }
          }),
        {
          kind: SpanKind.SERVER,
          parentContext,
          attributes: prefixedAttributes(attributePrefix, {
            'rpc.system': 'orpc',
            'rpc.service': serviceName,
            'netscript.rpc.transport': 'orpc',
          }),
        },
      );
    });

    // Add client interceptor for procedure-level metadata on the active SERVER span.
    handlerOptions.clientInterceptors ??= [];
    // deno-lint-ignore no-explicit-any
    handlerOptions.clientInterceptors.push(async (options: any) => {
      const span = getActiveSpan();
      const procedurePath = readPath(options);

      if (span) {
        span.setAttributes(prefixedAttributes(attributePrefix, {
          'rpc.method': procedurePath,
          'netscript.rpc.procedure': procedurePath,
        }));

        // Record input keys if enabled
        const input = readProperty(options, 'input');
        if (recordInputKeys && input) {
          const inputKeys = extractInputKeys(input, maxInputKeys);
          if (inputKeys.length > 0) {
            span.setAttribute(`${attributePrefix}rpc.input_keys`, inputKeys.join(','));
          }
        }

        // Add event for procedure start
        span.addEvent('rpc.procedure.start', {
          'rpc.method': procedurePath,
        });
      }

      try {
        const result = await options.next();

        if (span) {
          span.addEvent('rpc.procedure.success');
        }

        return result;
      } catch (error) {
        if (span) {
          const err = toErrorLike(error);

          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.message ?? 'Unknown oRPC error',
          });

          span.setAttributes(prefixedAttributes(attributePrefix, {
            'rpc.error.code': err.code ?? 'UNKNOWN',
            'rpc.error.message': err.message ?? 'Unknown oRPC error',
          }));

          if (err.status) {
            span.setAttribute(`${attributePrefix}rpc.error.status`, err.status);
          }

          recordException(span, error);
          span.addEvent('rpc.procedure.error', {
            'error.code': err.code ?? 'UNKNOWN',
            'error.message': err.message ?? 'Unknown oRPC error',
          });
        }

        throw error;
      }
    });
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a TracingPlugin instance.
 *
 * @param options - Plugin options
 * @returns A new TracingPlugin instance
 *
 * @example
 * ```ts
 * const plugin = createTracingPlugin({ serviceName: 'users' });
 * ```
 */
export function createTracingPlugin(options?: TracingPluginOptions): TracingPlugin {
  return new TracingPlugin(options);
}
