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

import { trace } from '@opentelemetry/api';
import { SpanStatusCode } from '../application/mod.ts';
import type { GenericHandlerOptions } from './_types.ts';
import { extractInputKeys } from './_utils.ts';

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
  private readonly options: Required<TracingPluginOptions>;

  /**
   * Plugin order - run early to set attributes before other processing
   */
  order = 1000;

  /**
   * Create an oRPC tracing plugin.
   */
  constructor(options: TracingPluginOptions = {}) {
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
      const span = trace.getActiveSpan();

      if (span) {
        // Set base RPC attributes at request start
        span.setAttributes({
          [`${attributePrefix}rpc.system`]: 'orpc',
          [`${attributePrefix}rpc.service`]: serviceName,
        });
      }

      try {
        const result = await options.next();

        // Set success status if we have a matched response
        if (span && result?.matched) {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        return result;
      } catch (error) {
        // Handle errors at root level
        if (span) {
          const err = error as Error & { code?: string; status?: number };
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.message,
          });
          span.setAttributes({
            [`${attributePrefix}rpc.error.code`]: err.code ?? 'UNKNOWN',
          });
          span.recordException(err);
        }
        throw error;
      }
    });

    // Add client interceptor for procedure-level tracing
    handlerOptions.clientInterceptors ??= [];
    // deno-lint-ignore no-explicit-any
    handlerOptions.clientInterceptors.push(async (options: any) => {
      const span = trace.getActiveSpan();

      if (span) {
        // Set procedure path
        const procedurePath = Array.isArray(options.path)
          ? options.path.join('.')
          : String(options.path);
        span.setAttributes({
          [`${attributePrefix}rpc.method`]: procedurePath,
        });

        // Record input keys if enabled
        if (recordInputKeys && options.input) {
          const inputKeys = extractInputKeys(options.input, maxInputKeys);
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
          const err = error as Error & { code?: string; status?: number };

          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.message,
          });

          span.setAttributes({
            [`${attributePrefix}rpc.error.code`]: err.code ?? 'UNKNOWN',
            [`${attributePrefix}rpc.error.message`]: err.message,
          });

          if (err.status) {
            span.setAttribute(`${attributePrefix}rpc.error.status`, err.status);
          }

          span.recordException(err);
          span.addEvent('rpc.procedure.error', {
            'error.code': err.code ?? 'UNKNOWN',
            'error.message': err.message,
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
