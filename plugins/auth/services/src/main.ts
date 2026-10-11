/**
 * Auth service entrypoint.
 *
 * @module
 */

// Register Redis/Garnet KV adapter before backend composition can open KV.
import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { initializeAuthService } from './init.ts';
import { serveAuthService } from './auth-service-runtime.ts';
import type { AuthRunningService } from './auth-service-types.ts';
export type { PluginServiceContext } from '@netscript/plugin/sdk';
export type { ServiceApp, ServiceEnvironment } from '@netscript/service';
export type {
  AuthRunningService,
  AuthRunningServiceAddress,
  AuthServiceApp,
} from './auth-service-types.ts';

type PluginServiceBootstrap = {
  createPluginServiceContext(pluginName: string): Promise<PluginServiceContext>;
};

/** Starts the Auth API service using host-provided infrastructure. */
export default async function createAuthService(
  ctx: PluginServiceContext,
): Promise<AuthRunningService> {
  const portValue = ctx.env.PORT ?? Deno.env.get('PORT');
  if (portValue === undefined) {
    throw new Error('Auth API requires the host-provided PORT environment variable.');
  }
  const dbClient = await ctx.db.getClient();
  const registry = await initializeAuthService(ctx, dbClient);
  return await serveAuthService(ctx, dbClient, registry, Number.parseInt(portValue, 10));
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
