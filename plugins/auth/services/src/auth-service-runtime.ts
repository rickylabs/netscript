import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { DbContext } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';
import { createAuthTelemetry } from '@netscript/plugin-auth-core/telemetry';
import { AUTH_PLUGIN_VERSION } from '../../src/constants.ts';
import { router } from './router.ts';
import type { AuthPluginServiceContext, AuthServiceBackendRegistry } from './init.ts';
import { currentAuthRequest, withAuthRequest } from './request-context.ts';
import { createAuthServiceGuard } from './auth-guard.ts';
import type { AuthRunningService } from './auth-service-types.ts';
import { createWorkosWorkerObserver } from './workos-worker-observer.ts';

/** Start the resolved service and register every background lifecycle with its builder. */
export async function serveAuthService(
  ctx: PluginServiceContext,
  dbClient: unknown,
  registry: AuthServiceBackendRegistry,
  port: number,
): Promise<AuthRunningService> {
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
  const service = await createPluginService(router, {
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
  }).onShutdown(async () => {
    await registry.background?.stop();
  }).serve();
  // Service identity owns cleanup; the supervisor retries without caller credentials.
  void registry.background?.start(createWorkosWorkerObserver(ctx.logger));
  return service;
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
