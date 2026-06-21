/**
 * Auth plugin service initialization.
 *
 * @module
 */

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { WatchableKv } from '@netscript/kv';
import {
  type AuthServiceAppsettings,
  createAuthServiceBackendRegistry,
} from './backend-registry.ts';
import type { ResolvedAuthBackendRegistry } from '@netscript/plugin-auth-core/ports';

/** Auth plugin service context with the declared auth appsettings seam. */
export interface AuthPluginServiceContext extends PluginServiceContext {
  /** Host-provided appsettings contribution for the auth runtime-config topic. */
  readonly appsettings?: AuthServiceAppsettings;
}

/** Resolve and construct the auth backend registry from host service context. */
export async function initializeAuthService(
  ctx: AuthPluginServiceContext,
  dbClient?: unknown,
): Promise<ResolvedAuthBackendRegistry> {
  const kv = watchableKv(ctx.kv);
  return await createAuthServiceBackendRegistry({
    env: { ...Deno.env.toObject(), ...ctx.env },
    appsettings: serviceAppsettings(ctx),
    dbClient,
    kv,
  });
}

function serviceAppsettings(ctx: AuthPluginServiceContext): AuthServiceAppsettings | undefined {
  return ctx.appsettings;
}

function watchableKv(value: unknown): WatchableKv {
  if (isWatchableKv(value)) {
    return value;
  }
  throw new TypeError('Auth service requires a WatchableKv-compatible host context.');
}

function isWatchableKv(value: unknown): value is WatchableKv {
  return (
    typeof value === 'object' && value !== null &&
    'get' in value && typeof value.get === 'function' &&
    'has' in value && typeof value.has === 'function' &&
    'set' in value && typeof value.set === 'function' &&
    'delete' in value && typeof value.delete === 'function' &&
    'list' in value && typeof value.list === 'function' &&
    'close' in value && typeof value.close === 'function' &&
    Symbol.asyncDispose in value && typeof value[Symbol.asyncDispose] === 'function' &&
    'watch' in value && typeof value.watch === 'function' &&
    'watchPrefix' in value && typeof value.watchPrefix === 'function' &&
    'supportsWatch' in value && typeof value.supportsWatch === 'boolean'
  );
}
