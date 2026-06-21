/**
 * Auth service entrypoint.
 *
 * @module
 */

// Register Redis/Garnet KV adapter before backend composition can open KV.
import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { createService, type DbContext } from '@netscript/service';
import { AUTH_API_DEFAULT_PORT } from '../../src/constants.ts';
import { router } from './router.ts';
import { initializeAuthService } from './init.ts';
import { withAuthRequest } from './request-context.ts';

export type { PluginServiceContext } from '@netscript/plugin/sdk';

type PluginServiceBootstrap = {
  createPluginServiceContext(pluginName: string): Promise<PluginServiceContext>;
};

/** Network address assigned to the running auth service listener. */
export type AuthRunningServiceAddress = Readonly<{
  /** Listener hostname. */
  hostname: string;
  /** Listener port. */
  port: number;
  /** Listener transport. */
  transport: 'tcp' | 'unix';
}>;

/** Mountable fetch surface backing the running auth service. */
export type AuthServiceApp = Readonly<{
  /** Handles an incoming fetch request. */
  fetch(input: Request | string | URL, init?: RequestInit): Response | Promise<Response>;
  /** Convenience request helper exposed by the service runtime. */
  request(input: Request | string | URL, init?: RequestInit): Response | Promise<Response>;
}>;

/** Runtime handle returned after the auth service starts. */
export type AuthRunningService = Readonly<{
  /** Mountable service app backing the running listener. */
  app: AuthServiceApp;
  /** Address selected by Deno for the listener. */
  addr: AuthRunningServiceAddress;
  /** Stops the auth service listener and waits for shutdown to finish. */
  stop(): Promise<void>;
}>;

/** Starts the Auth API service using host-provided infrastructure. */
export default async function createAuthService(
  ctx: PluginServiceContext,
): Promise<AuthRunningService> {
  const port = parseInt(ctx.env.PORT ?? Deno.env.get('PORT') ?? String(AUTH_API_DEFAULT_PORT));
  const dbClient = await ctx.db.getClient();
  const registry = await initializeAuthService(ctx, dbClient);

  return await createService(router, {
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
    .withDatabase(toDbContext(dbClient))
    .use(withAuthRequest)
    .withContext(() => ({ registry }))
    .withRPC({ traceContext: true })
    .withHealth()
    .withServiceInfo()
    .serve();
}

function toDbContext(value: unknown): DbContext {
  if (isDbContext(value)) {
    return value;
  }
  return { value };
}

function isDbContext(value: unknown): value is DbContext {
  return typeof value === 'object' && value !== null;
}

async function loadAuthServiceContext(): Promise<PluginServiceContext> {
  const bootstrapModule = Deno.env.get('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
  if (!bootstrapModule) {
    throw new Error(
      'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE is required to start auth service directly.',
    );
  }

  const bootstrap = await import(bootstrapModule);
  if (!isPluginServiceBootstrap(bootstrap)) {
    throw new Error(
      'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE must export createPluginServiceContext.',
    );
  }
  return bootstrap.createPluginServiceContext('auth');
}

function isPluginServiceBootstrap(value: unknown): value is PluginServiceBootstrap {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof Reflect.get(value, 'createPluginServiceContext') === 'function';
}

if (import.meta.main) {
  const ctx = await loadAuthServiceContext();
  await createAuthService(ctx);
}
