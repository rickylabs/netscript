/**
 * RPC and error handler primitives for service endpoints.
 *
 * @example
 * ```typescript
 * import { createRPCHandler, createOpenAPIHandler, createNotFoundHandler } from '@netscript/service';
 *
 * const rpcHandler = createRPCHandler(router);
 * const openApiHandler = createOpenAPIHandler(router);
 *
 * app.use('/api/rpc/*', async (c) => {
 *   const response = await rpcHandler.handle(c.req.raw, { prefix: '/api/rpc' });
 *   return response ?? c.notFound();
 * });
 *
 * app.notFound(createNotFoundHandler('users'));
 * ```
 *
 * @module
 */

import type { Context } from 'hono';
import { RPCHandler } from '@orpc/server/fetch';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { CORSPlugin } from '@orpc/server/plugins';
import { StandardHandlerPlugin } from '@orpc/server/standard';
import { ZodSmartCoercionPlugin } from '@orpc/zod';
import { LoggingPlugin } from '@netscript/logger/orpc';
import { ErrorHandlingPlugin, TracingPlugin } from '@netscript/telemetry/orpc';

// Router type that matches oRPC router structure
// deno-lint-ignore no-explicit-any
type AnyRouter = Record<string, any>;

/**
 * Configuration options for RPC handlers.
 */
export interface RPCHandlerConfig {
  /** Service name for telemetry */
  serviceName?: string;
  /** Additional oRPC plugins */
  // deno-lint-ignore no-explicit-any
  plugins?: StandardHandlerPlugin<any>[];
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
// deno-lint-ignore no-explicit-any
export function createRPCPlugins(config: RPCHandlerConfig): StandardHandlerPlugin<any>[] {
  // deno-lint-ignore no-explicit-any
  const plugins: StandardHandlerPlugin<any>[] = [];

  // Tracing plugin
  if (config.tracing !== false && config.serviceName) {
    plugins.push(
      new TracingPlugin({
        serviceName: config.serviceName,
        recordInputKeys: true,
      }),
    );
  }

  // Error handling plugin
  if (config.errorHandling !== false && config.serviceName) {
    plugins.push(
      new ErrorHandlingPlugin({
        serviceName: config.serviceName,
        warnOnlyCodes: config.warnOnlyCodes ?? ['NOT_FOUND', 'VALIDATION_ERROR'],
      }),
    );
  }

  // Logging plugin
  if (config.logging !== false && config.serviceName) {
    plugins.push(
      new LoggingPlugin({
        serviceName: config.serviceName,
        debug: config.debug,
      }),
    );
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
// deno-lint-ignore no-explicit-any
export function createRPCHandler<T extends AnyRouter>(
  router: T,
  config?: RPCHandlerConfig,
): any {
  const plugins = createRPCPlugins(config ?? {});
  return new RPCHandler(router, { plugins });
}

/**
 * Creates an oRPC OpenAPI handler for REST-style API access.
 * Includes ZodSmartCoercionPlugin for automatic query string type coercion.
 *
 * @example
 * ```typescript
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
// deno-lint-ignore no-explicit-any
export function createOpenAPIHandler<T extends AnyRouter>(
  router: T,
  config?: RPCHandlerConfig,
): any {
  const plugins = [...createRPCPlugins(config ?? {}), new ZodSmartCoercionPlugin()];
  return new OpenAPIHandler(router, { plugins });
}

/**
 * Creates a 404 Not Found handler for unmatched routes.
 *
 * @example
 * ```typescript
 * app.notFound(createNotFoundHandler('users'));
 * ```
 */
export function createNotFoundHandler(serviceName: string) {
  return (c: Context): Response => {
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
 * app.onError(createErrorHandler('users'));
 * ```
 */
export function createErrorHandler(serviceName: string) {
  return (err: Error, c: Context): Response => {
    console.error(`[${serviceName}] Unhandled error:`, err);
    return c.json(
      {
        error: 'INTERNAL_ERROR',
        message: Deno.env.get('DENO_ENV') === 'development' ? err.message : 'Internal server error',
      },
      500,
    );
  };
}
