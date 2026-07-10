/**
 * oRPC OpenTelemetry plugin adapter.
 *
 * Registers oRPC's first-party OpenTelemetry instrumentation and annotates the
 * active oRPC span with NetScript RPC attributes.
 *
 * @module
 */

import { type Span, SpanStatusCode, trace } from '@opentelemetry/api';
import { ORPCInstrumentation, type ORPCInstrumentationConfig } from '@orpc/otel';
import type { Attributes, AttributeValue } from '../application/mod.ts';
import type { GenericHandlerOptions } from './_types.ts';
import { extractInputKeys } from './_utils.ts';

let sharedInstrumentation: ORPCInstrumentation | undefined;

/**
 * Options for the oRPC tracing plugin.
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
   * Optional upstream oRPC instrumentation config.
   */
  instrumentationConfig?: ORPCInstrumentationConfig;

  /**
   * Optional instrumentation instance for tests or custom composition roots.
   */
  instrumentation?: Pick<ORPCInstrumentation, 'enable'>;

  /**
   * Optional active-span reader for tests. Production uses
   * `trace.getActiveSpan()`.
   */
  activeSpanProvider?: () => Span | undefined;
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

function recordException(span: Span, error: unknown): void {
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

function getOrCreateInstrumentation(
  config?: ORPCInstrumentationConfig,
): ORPCInstrumentation {
  sharedInstrumentation ??= new ORPCInstrumentation(config);
  return sharedInstrumentation;
}

/**
 * Register oRPC's first-party OpenTelemetry instrumentation.
 *
 * @param config - Optional upstream instrumentation config.
 * @returns The enabled instrumentation instance.
 */
export function registerORPCInstrumentation(
  config?: ORPCInstrumentationConfig,
): ORPCInstrumentation {
  const instrumentation = getOrCreateInstrumentation(config);
  instrumentation.enable();
  return instrumentation;
}

/**
 * TracingPlugin for oRPC handlers.
 *
 * The plugin delegates span creation and lifecycle to `@orpc/otel`
 * `ORPCInstrumentation`. Its interceptors only enrich the active upstream span:
 * - `rpc.system`: Always "orpc"
 * - `rpc.service`: The service name
 * - `rpc.method`: The full procedure path (e.g. "v1.users.list")
 * - `rpc.input_keys`: Comma-separated list of input keys (optional)
 * - `netscript.rpc.*`: NetScript RPC attributes
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
  private readonly options: Required<
    Omit<
      TracingPluginOptions,
      'activeSpanProvider' | 'instrumentation' | 'instrumentationConfig'
    >
  >;
  private readonly instrumentation: Pick<ORPCInstrumentation, 'enable'>;
  private readonly activeSpanProvider: () => Span | undefined;

  /**
   * Plugin order - run early to set attributes before other processing.
   */
  order = 1000;

  /**
   * Create an oRPC tracing plugin.
   */
  constructor(options: TracingPluginOptions = {}) {
    this.instrumentation = options.instrumentation ??
      getOrCreateInstrumentation(options.instrumentationConfig);
    this.activeSpanProvider = options.activeSpanProvider ?? (() => trace.getActiveSpan());
    this.options = {
      serviceName: options.serviceName ?? 'unknown',
      recordInputKeys: options.recordInputKeys ?? true,
      maxInputKeys: options.maxInputKeys ?? 20,
      attributePrefix: options.attributePrefix ?? '',
    };
  }

  /**
   * Initialize the plugin by registering upstream instrumentation and adding
   * NetScript attribute interceptors to the handler options.
   */
  init(handlerOptions: GenericHandlerOptions, _router?: unknown): void {
    this.instrumentation.enable();

    const { serviceName, recordInputKeys, maxInputKeys, attributePrefix } = this.options;

    handlerOptions.rootInterceptors ??= [];
    handlerOptions.rootInterceptors.push(async (options: unknown) => {
      const span = this.activeSpanProvider();
      span?.setAttributes(prefixedAttributes(attributePrefix, {
        'rpc.system': 'orpc',
        'rpc.service': serviceName,
        'netscript.rpc.transport': 'orpc',
      }));

      try {
        const result = await readNext(options)();
        span?.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        if (span) {
          const err = toErrorLike(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.message,
          });
          span.setAttributes(prefixedAttributes(attributePrefix, {
            'rpc.error.code': err.code ?? 'UNKNOWN',
          }));
          recordException(span, error);
        }
        throw error;
      }
    });

    handlerOptions.clientInterceptors ??= [];
    handlerOptions.clientInterceptors.push(async (options: unknown) => {
      const span = this.activeSpanProvider();
      const procedurePath = readPath(options);

      if (span) {
        span.setAttributes(prefixedAttributes(attributePrefix, {
          'rpc.method': procedurePath,
          'netscript.rpc.procedure': procedurePath,
        }));

        const input = readProperty(options, 'input');
        if (recordInputKeys && input) {
          const inputKeys = extractInputKeys(input, maxInputKeys);
          if (inputKeys.length > 0) {
            span.setAttribute(`${attributePrefix}rpc.input_keys`, inputKeys.join(','));
          }
        }

        span.addEvent('rpc.procedure.start', {
          'rpc.method': procedurePath,
        });
      }

      try {
        const result = await readNext(options)();
        span?.addEvent('rpc.procedure.success');
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

function readNext(source: unknown): () => Promise<unknown> {
  const next = readProperty(source, 'next');
  if (typeof next !== 'function') {
    throw new TypeError('oRPC interceptor options must include next()');
  }
  return () => Promise.resolve(next.call(source));
}

/**
 * Create a TracingPlugin instance.
 *
 * @param options - Plugin options.
 * @returns A new TracingPlugin instance.
 *
 * @example
 * ```ts
 * const plugin = createTracingPlugin({ serviceName: 'users' });
 * ```
 */
export function createTracingPlugin(options?: TracingPluginOptions): TracingPlugin {
  return new TracingPlugin(options);
}
