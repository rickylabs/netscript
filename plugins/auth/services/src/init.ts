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
  return await createAuthServiceBackendRegistry({
    env: { ...Deno.env.toObject(), ...ctx.env },
    appsettings: serviceAppsettings(ctx),
    dbClient,
    kv: ctx.kv as WatchableKv,
  });
}

function serviceAppsettings(ctx: AuthPluginServiceContext): AuthServiceAppsettings | undefined {
  return ctx.appsettings;
}
