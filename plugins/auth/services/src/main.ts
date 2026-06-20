/**
 * Auth service entrypoint.
 *
 * @module
 */

// Register Redis/Garnet KV adapter before backend composition can open KV.
import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { createService } from '@netscript/service';
import { AUTH_API_DEFAULT_PORT } from '../../src/constants.ts';
import { router } from './router.ts';
import { initializeAuthService } from './init.ts';
import type { AuthServiceRequest } from './routers/v1-types.ts';

export type { PluginServiceContext } from '@netscript/plugin/sdk';

type ServiceDatabaseClient = Record<string, unknown>;
type PluginServiceBootstrap = {
  createPluginServiceContext(pluginName: string): Promise<PluginServiceContext>;
};

/** Runtime handle returned after the auth service starts. */
export type AuthRunningService = Readonly<{
  /** Stop the auth service listener and release runtime resources. */
  stop(): Promise<void>;
  /** Additional host service fields supplied by `@netscript/service`. */
  readonly [key: string]: unknown;
}>;

/** Starts the Auth API service using host-provided infrastructure. */
export default async function createAuthService(
  ctx: PluginServiceContext,
): Promise<AuthRunningService> {
  const port = parseInt(ctx.env.PORT ?? Deno.env.get('PORT') ?? String(AUTH_API_DEFAULT_PORT));
  const dbClient = await ctx.db.getClient() as ServiceDatabaseClient;
  const registry = await initializeAuthService(ctx, dbClient);

  const running = await createService(router, {
    name: 'auth',
    version: '1.0.0',
    port,
  })
    .withCors()
    .withLogger()
    .withOpenAPI({
      title: 'Auth API',
      description: 'Unified auth service for NetScript applications',
    })
    .withDocs()
    .withDatabase(dbClient)
    .withContext((c: { req?: { raw?: Request; method?: string; path?: string } }) => ({
      registry,
      request: toServiceRequest(c),
    }))
    .withRPC({ traceContext: true })
    .withHealth()
    .withServiceInfo()
    .serve();
  return running as unknown as AuthRunningService;
}

function toServiceRequest(
  c: { req?: { raw?: Request; method?: string; path?: string } },
): AuthServiceRequest | undefined {
  const raw = c.req?.raw;
  if (!raw) {
    return undefined;
  }
  return {
    url: raw.url,
    method: raw.method,
    headers: new Headers(raw.headers),
  };
}

async function loadAuthServiceContext(): Promise<PluginServiceContext> {
  const bootstrapModule = Deno.env.get('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
  if (!bootstrapModule) {
    throw new Error(
      'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE is required to start auth service directly.',
    );
  }

  const { createPluginServiceContext } = await import(bootstrapModule) as PluginServiceBootstrap;
  return createPluginServiceContext('auth');
}

if (import.meta.main) {
  const ctx = await loadAuthServiceContext();
  await createAuthService(ctx);
}
