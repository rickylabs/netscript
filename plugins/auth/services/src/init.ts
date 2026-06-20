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

/** Resolve and construct the auth backend registry from host service context. */
export async function initializeAuthService(
  ctx: PluginServiceContext,
  dbClient?: unknown,
): Promise<ResolvedAuthBackendRegistry> {
  return await createAuthServiceBackendRegistry({
    env: { ...Deno.env.toObject(), ...ctx.env },
    appsettings: serviceAppsettings(ctx),
    dbClient,
    kv: ctx.kv as WatchableKv,
  });
}

function serviceAppsettings(ctx: PluginServiceContext): AuthServiceAppsettings | undefined {
  const candidate = ctx as PluginServiceContext & {
    readonly appsettings?: AuthServiceAppsettings;
    readonly settings?: AuthServiceAppsettings;
    readonly config?: AuthServiceAppsettings;
  };
  return candidate.appsettings ?? candidate.settings ?? candidate.config;
}
