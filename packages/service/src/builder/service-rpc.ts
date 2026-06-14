/**
 * oRPC request wiring for the service builder.
 *
 * Registers the type-safe RPC endpoint and the REST-style OpenAPI endpoint onto
 * a Hono app. Kept separate from the builder class so the builder reads as a
 * lifecycle of one-line steps and the request-handling complexity lives here.
 *
 * @module
 */

import type { Context, Hono } from 'hono';
import { createOpenAPIHandler, createRPCHandler } from '../primitives/handlers.ts';
import type { ServiceRouter } from '../types.ts';

/** Options that shape oRPC endpoint registration. */
export interface RpcWiringOptions {
  /** Path for the type-safe RPC endpoint (default: `/api/rpc`). */
  rpcPath?: string;
  /** Path for the REST-style OpenAPI endpoint (default: `/api`). */
  apiPath?: string;
  /** Enables verbose oRPC logging. */
  debug?: boolean;
}

/**
 * Wires the oRPC RPC and OpenAPI handlers onto the Hono app.
 *
 * @param app - The Hono app to register routes on.
 * @param router - The service router exposed through both endpoints.
 * @param serviceName - Service name used for handler diagnostics.
 * @param buildContext - Per-request oRPC context factory.
 * @param options - Endpoint paths and debug flag.
 */
export function wireRpc(
  app: Hono,
  router: ServiceRouter,
  serviceName: string,
  buildContext: (c: Context) => Record<string, unknown>,
  options?: RpcWiringOptions,
): void {
  const rpcPath = options?.rpcPath ?? '/api/rpc';
  const apiPath = options?.apiPath ?? '/api';
  const debug = options?.debug;

  const rpcHandler = createRPCHandler(router, { serviceName, debug });
  const openApiHandler = createOpenAPIHandler(router, { serviceName, debug });

  // oRPC RPC endpoint (for type-safe clients).
  app.use(`${rpcPath}/*`, async (c: Context, next: () => Promise<void>) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: rpcPath as `/${string}`,
      context: buildContext(c),
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    return await next();
  });

  // oRPC OpenAPI endpoint (for REST clients).
  app.use(`${apiPath}/*`, async (c: Context, next: () => Promise<void>) => {
    const { matched, response } = await openApiHandler.handle(c.req.raw, {
      prefix: apiPath as `/${string}`,
      context: buildContext(c),
    });

    if (matched) {
      return c.newResponse(response.body, response);
    }

    return await next();
  });
}
