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
import type { DbContext } from '@netscript/service';
import { createAuthTelemetry } from '@netscript/plugin-auth-core/telemetry';
import { AUTH_PLUGIN_VERSION } from '../../src/constants.ts';
import { createAuthServiceGuard } from './auth-guard.ts';
import { currentAuthRequest, withAuthRequest } from './request-context.ts';
import type { AuthPluginServiceContext } from './init.ts';
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
  const port = Number.parseInt(portValue, 10);
  const dbClient = await ctx.db.getClient();
  const registry = await initializeAuthService(ctx, dbClient);
  const cookieName = registry.cookieName;
  const telemetry = createAuthTelemetry({
    subjectHashSalt: resolveAuditSalt(ctx),
  });

  // Data-only description of the auth service. `createPluginService` applies the
  // mandated builder chain in a fixed order — cors → logger → openapi → docs →
  // database → use(middleware) → context → withRPC → withHealth →
  // withServiceInfo — which is exactly the previous chain's order, so behavior
  // is preserved. The registry is resolved above (via `initializeAuthService`)
  // and captured by the context closure; no startup work is deferred.
  return await serveAuthService(ctx, registry, {
    // Only signout and operator revocation are guarded; the guard authenticates in-process
    // because the auth service cannot verify sessions by calling itself.
    auth: createAuthServiceGuard(registry),
    name: 'auth',
    version: AUTH_PLUGIN_VERSION,
    port,
    openApi: {
      title: 'Auth API',
      description: 'Unified auth service for NetScript applications',
    },
    docs: {},
    database: { context: toDbContext(dbClient) },
    middleware: [withAuthRequest],
    context: () => ({ registry, telemetry, cookieName, request: currentAuthRequest() }),
    traceContext: true,
  });
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

function resolveAuditSalt(ctx: PluginServiceContext): string | undefined {
  const env = { ...Deno.env.toObject(), ...ctx.env };
  return env.NETSCRIPT_AUTH_AUDIT_SALT ?? serviceAuditSalt(ctx);
}

function serviceAuditSalt(ctx: PluginServiceContext): string | undefined {
  if (!hasAuthAppsettings(ctx)) {
    return undefined;
  }
  return ctx.appsettings?.auth?.audit?.salt ?? ctx.appsettings?.Auth?.Audit?.Salt;
}

function hasAuthAppsettings(ctx: PluginServiceContext): ctx is AuthPluginServiceContext {
  return 'appsettings' in ctx;
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
