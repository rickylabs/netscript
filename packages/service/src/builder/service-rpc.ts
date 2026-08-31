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
import { createServiceLogger } from '@netscript/logger';
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
  /** Deprecated RPC prefixes that continue to serve the same router. */
  rpcAliases?: readonly string[];
  /** Deprecated procedure prefixes already present inside the mounted router. */
  deprecatedRpcRoutes?: readonly {
    readonly pathPrefix: string;
    readonly replacementPrefix: string;
  }[];
  /** Optional RPC-only router; the main router remains the OpenAPI source. */
  rpcRouter?: ServiceRouter;
}

const warnedLegacyRpcPaths = new Set<string>();

/** Resolves the effective endpoint paths shared by RPC wiring and policy binding. */
export function resolveRpcWiringPaths(
  options?: RpcWiringOptions,
): { readonly rpcPath: string; readonly apiPath: string } {
  return {
    rpcPath: options?.rpcPath ?? '/api/rpc',
    apiPath: options?.apiPath ?? '/api',
  };
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
  buildContext: (c: Context) => object,
  options?: RpcWiringOptions,
): void {
  const { rpcPath, apiPath } = resolveRpcWiringPaths(options);
  const debug = options?.debug;

  const rpcHandler = createRPCHandler(options?.rpcRouter ?? router, { serviceName, debug });
  const openApiHandler = createOpenAPIHandler(router, { serviceName, debug });

  registerRpcPath(app, rpcHandler, rpcPath, buildContext, (c) => {
    for (const route of options?.deprecatedRpcRoutes ?? []) {
      if (
        c.req.path.startsWith(route.pathPrefix) &&
        !c.req.path.startsWith(route.replacementPrefix)
      ) {
        warnLegacyRpcPathOnce(serviceName, route.pathPrefix, route.replacementPrefix);
      }
    }
  });
  for (const alias of options?.rpcAliases ?? []) {
    if (alias === rpcPath) continue;
    registerRpcPath(app, rpcHandler, alias, buildContext, () => {
      warnLegacyRpcPathOnce(serviceName, alias, rpcPath);
    });
  }

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

function registerRpcPath(
  app: Hono,
  rpcHandler: ReturnType<typeof createRPCHandler>,
  path: string,
  buildContext: (c: Context) => object,
  onMatched?: (context: Context) => void,
): void {
  app.use(`${path}/*`, async (c: Context, next: () => Promise<void>) => {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: path as `/${string}`,
      context: buildContext(c),
    });

    if (matched) {
      onMatched?.(c);
      return c.newResponse(response.body, response);
    }

    return await next();
  });
}

function warnLegacyRpcPathOnce(serviceName: string, legacyPath: string, rpcPath: string): void {
  const key = `${serviceName}:${legacyPath}`;
  if (warnedLegacyRpcPaths.has(key)) return;
  warnedLegacyRpcPaths.add(key);
  createServiceLogger(serviceName).warn('Deprecated RPC route used', {
    legacyPath,
    replacementPath: rpcPath,
  });
}
