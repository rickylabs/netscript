/**
 * RPC and error handler primitives for service endpoints.
 *
 * @example
 * ```typescript
 * import type { Hono } from 'hono';
 * import { createNotFoundHandler, createRPCHandler, type ServiceRouter } from '@netscript/service';
 *
 * declare const app: Hono;
 * declare const router: ServiceRouter;
 *
 * const rpcHandler = createRPCHandler(router);
 *
 * app.use('/api/rpc/*', async (c) => {
 *   const { matched, response } = await rpcHandler.handle(c.req.raw, { prefix: '/api/rpc' });
 *   return matched ? response : c.notFound();
 * });
 *
 * app.notFound(createNotFoundHandler('users'));
 * ```
 *
 * @module
 */

import { RPCHandler } from '@orpc/server/fetch';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { CORSPlugin, ResponseHeadersPlugin } from '@orpc/server/plugins';
import { experimental_ZodSmartCoercionPlugin as ZodSmartCoercionPlugin } from '@orpc/zod/zod4';
import { createServiceLogger } from '@netscript/logger';
import { LoggingPlugin } from '@netscript/logger/orpc';
import { ErrorHandlingPlugin, TracingPlugin } from '@netscript/telemetry/orpc';
import { PROCEDURE_RESPONSE_HEADERS_SYMBOL } from '../middleware/procedure-pipeline.ts';
import type {
  FetchHandler,
  ServiceErrorHandler,
  ServiceHandlerPlugin,
  ServiceNotFoundHandler,
  ServiceRouter,
} from '../types.ts';
import { isOrpcRouter } from './orpc-router.ts';

/**
 * Configuration options for RPC handlers.
 */
export interface RPCHandlerConfig {
  /** Service name for telemetry */
  serviceName?: string;
  /** Additional oRPC plugins */
  plugins?: ServiceHandlerPlugin[];
  /** Enable request tracing (default: true) */
  tracing?: boolean;
  /** Enable error handling plugin (default: true) */
  errorHandling?: boolean;
  /** Enable request deduplication for GET requests (default: true) */
  deduplication?: boolean;
  /** Error codes to log at warn level instead of error */
  warnOnlyCodes?: string[];
  /** Enable logging plugin (default: true) */
  logging?: boolean;
  /** Enable debug mode for verbose logging (default: NETSCRIPT_DEBUG env var) */
  debug?: boolean;
  /** Extra field-name fragments redacted from debug-mode RPC input logs (`LoggingPlugin`). */
  redactFields?: readonly string[];
  /** Optional error-code to HTTP-status map forwarded to tracing, logging, and error-handling plugins. */
  errorStatusMap?: Readonly<Record<string, number>>;
  /**
   * Enable oRPC `ResponseHeadersPlugin` so procedure middleware (such as
   * `withProcedureRateLimit()`) can emit HTTP response headers like `Retry-After`
   * without breaking application-owned non-`Headers` `resHeaders` context fields.
   * Defaults to `false` unless opted in (enabled automatically by `ServiceBuilder`
   * when procedure rate limits are configured).
   */
  responseHeaders?: boolean;
}

/**
 * Creates the standard set of oRPC plugins.
 *
 * @example
 * ```typescript
 * const plugins = createRPCPlugins({
 *   serviceName: 'users',
 *   tracing: true,
 *   errorHandling: true,
 * });
 * ```
 */
export function createRPCPlugins(config: RPCHandlerConfig): ServiceHandlerPlugin[] {
  const plugins: ServiceHandlerPlugin[] = [];

  // Tracing plugin
  if (config.tracing !== false && config.serviceName) {
    plugins.push(
      new TracingPlugin({
        serviceName: config.serviceName,
        recordInputKeys: true,
        errorStatusMap: config.errorStatusMap,
      }),
    );
  }

  // Error handling plugin
  if (config.errorHandling !== false && config.serviceName) {
    plugins.push(
      new ErrorHandlingPlugin({
        serviceName: config.serviceName,
        warnOnlyCodes: config.warnOnlyCodes ?? ['NOT_FOUND', 'VALIDATION_ERROR'],
        errorStatusMap: config.errorStatusMap,
      }),
    );
  }

  // Logging plugin
  if (config.logging !== false && config.serviceName) {
    plugins.push(
      new LoggingPlugin({
        serviceName: config.serviceName,
        debug: config.debug,
        redactFields: config.redactFields,
        errorStatusMap: config.errorStatusMap,
      }),
    );
  }

  // Response headers plugin (enabled when opted in, e.g. by ServiceBuilder.withProcedureRateLimit()).
  // Skip adding a second instance if the caller already supplied ResponseHeadersPlugin in config.plugins.
  const hasCallerResponseHeadersPlugin = config.plugins?.some(
    (plugin) => plugin instanceof ResponseHeadersPlugin,
  ) ?? false;
  if (config.responseHeaders === true && !hasCallerResponseHeadersPlugin) {
    plugins.push(createSafeResponseHeadersPlugin());
  }

  // CORS plugin
  plugins.push(new CORSPlugin());

  // Add any custom plugins
  if (config.plugins) {
    plugins.push(...config.plugins);
  }

  return plugins;
}

/**
 * Creates an oRPC RPC handler for type-safe client communication.
 *
 * @example
 * ```typescript
 * import type { Hono } from 'hono';
 * import type { ServiceRouter } from '@netscript/service';
 *
 * declare const app: Hono;
 * declare const router: ServiceRouter;
 *
 * const rpcHandler = createRPCHandler(router, { serviceName: 'users' });
 *
 * app.use('/api/rpc/*', async (c, next) => {
 *   const { matched, response } = await rpcHandler.handle(c.req.raw, {
 *     prefix: '/api/rpc',
 *     context: {},
 *   });
 *   if (matched) return c.newResponse(response.body, response);
 *   return await next();
 * });
 * ```
 */
export function createRPCHandler<T extends ServiceRouter>(
  router: T,
  config?: RPCHandlerConfig,
): FetchHandler {
  if (!isOrpcRouter(router)) {
    throw new TypeError('Service router must be an object');
  }

  const plugins = createRPCPlugins(config ?? {});
  return new RPCHandler(router, { plugins });
}

/**
 * Creates an oRPC OpenAPI handler for REST-style API access.
 * Includes ZodSmartCoercionPlugin for automatic query string type coercion.
 *
 * @example
 * ```typescript
 * import type { Hono } from 'hono';
 * import type { ServiceRouter } from '@netscript/service';
 *
 * declare const app: Hono;
 * declare const router: ServiceRouter;
 *
 * const openApiHandler = createOpenAPIHandler(router, { serviceName: 'users' });
 *
 * app.use('/api/*', async (c, next) => {
 *   const { matched, response } = await openApiHandler.handle(c.req.raw, {
 *     prefix: '/api',
 *     context: {},
 *   });
 *   if (matched) return c.newResponse(response.body, response);
 *   return await next();
 * });
 * ```
 */
export function createOpenAPIHandler<T extends ServiceRouter>(
  router: T,
  config?: RPCHandlerConfig,
): FetchHandler {
  if (!isOrpcRouter(router)) {
    throw new TypeError('Service router must be an object');
  }

  const plugins = [...createRPCPlugins(config ?? {}), new ZodSmartCoercionPlugin()];
  return new OpenAPIHandler(router, { plugins });
}

/**
 * Creates a 404 Not Found handler for unmatched routes.
 *
 * @example
 * ```typescript
 * import type { Hono } from 'hono';
 *
 * declare const app: Hono;
 *
 * app.notFound(createNotFoundHandler('users'));
 * ```
 */
export function createNotFoundHandler(serviceName: string): ServiceNotFoundHandler {
  return (c): Response => {
    return c.json(
      {
        error: 'NOT_FOUND',
        message: `Route not found on ${serviceName} service`,
        path: c.req.path,
      },
      404,
    );
  };
}

/**
 * Creates a global error handler for uncaught exceptions.
 *
 * @example
 * ```typescript
 * import type { Hono } from 'hono';
 *
 * declare const app: Hono;
 *
 * app.onError(createErrorHandler('users'));
 * ```
 */
export function createErrorHandler(serviceName: string): ServiceErrorHandler {
  const logger = createServiceLogger(serviceName);

  return (err, c): Response => {
    logger.error('Unhandled service error', {
      error: err.message,
      stack: err.stack,
    });

    return c.json(
      {
        error: 'INTERNAL_ERROR',
        message: Deno.env.get('DENO_ENV') === 'development' ? err.message : 'Internal server error',
      },
      500,
    );
  };
}

type UpstreamResponseHeadersInitOptions = Parameters<
  InstanceType<typeof ResponseHeadersPlugin>['init']
>[0];

type UpstreamRootInterceptor = NonNullable<
  UpstreamResponseHeadersInitOptions['rootInterceptors']
>[number];

interface StandardMatchedResult {
  readonly matched: true;
  readonly response: {
    readonly headers: Record<string, string | string[] | undefined>;
  };
}

/**
 * Wraps oRPC's `ResponseHeadersPlugin` so normal requests delegate directly to
 * upstream `context.resHeaders`, while requests whose caller context already
 * owns a non-`Headers` `resHeaders` property keep that value intact and channel
 * procedure-emitted headers (like `Retry-After`) through a private `Headers` slot.
 */
function createSafeResponseHeadersPlugin(): ServiceHandlerPlugin {
  const upstream = new ResponseHeadersPlugin();

  return {
    name: 'netscript-response-headers',
    init(handlerOptions: unknown): unknown {
      if (!isUpstreamResponseHeadersInitOptions(handlerOptions)) return handlerOptions;
      const captured: UpstreamResponseHeadersInitOptions = { rootInterceptors: [] };
      upstream.init(captured);
      const upstreamInterceptor = captured.rootInterceptors?.[0];
      if (!upstreamInterceptor) return handlerOptions;

      const safeInterceptor: UpstreamRootInterceptor = async (interceptorOptions) => {
        const ctx = interceptorOptions.context as Record<PropertyKey, unknown> | undefined;
        const callerResHeaders = ctx?.resHeaders;
        if (callerResHeaders === undefined || callerResHeaders instanceof Headers) {
          return await upstreamInterceptor(interceptorOptions);
        }

        const privateHeaders = new Headers();
        const nextContext = Object.assign({}, interceptorOptions.context, {
          [PROCEDURE_RESPONSE_HEADERS_SYMBOL]: privateHeaders,
        });
        const result = await interceptorOptions.next({
          ...interceptorOptions,
          context: nextContext,
        });

        if (!isStandardMatchedResult(result)) {
          return result;
        }

        let hasHeaders = false;
        const mergedHeaders: Record<string, string | string[] | undefined> = {
          ...result.response.headers,
        };
        for (const [key, value] of privateHeaders) {
          hasHeaders = true;
          const existing = mergedHeaders[key];
          if (Array.isArray(existing)) {
            mergedHeaders[key] = [...existing, value];
          } else if (existing !== undefined) {
            mergedHeaders[key] = [existing, value];
          } else {
            mergedHeaders[key] = value;
          }
        }

        if (!hasHeaders) {
          return result;
        }

        return {
          ...result,
          response: {
            ...result.response,
            headers: mergedHeaders,
          },
        };
      };

      handlerOptions.rootInterceptors ??= [];
      handlerOptions.rootInterceptors.push(safeInterceptor);
      return handlerOptions;
    },
  };
}

function isUpstreamResponseHeadersInitOptions(
  value: unknown,
): value is UpstreamResponseHeadersInitOptions {
  return typeof value === 'object' && value !== null;
}

function isStandardMatchedResult(value: unknown): value is StandardMatchedResult {
  if (typeof value !== 'object' || value === null) return false;
  if (Reflect.get(value, 'matched') !== true) return false;
  const response = Reflect.get(value, 'response');
  return typeof response === 'object' && response !== null &&
    typeof Reflect.get(response, 'headers') === 'object' &&
    Reflect.get(response, 'headers') !== null;
}
