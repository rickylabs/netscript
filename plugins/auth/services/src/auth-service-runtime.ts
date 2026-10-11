import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { createPluginService, type PluginServiceConfig } from '@netscript/plugin/service';
import { router } from './router.ts';
import type { AuthServiceBackendRegistry } from './init.ts';
import type { AuthServiceContext } from './routers/v1-types.ts';
import type { AuthRunningService } from './auth-service-types.ts';
import { createWorkosWorkerObserver } from './workos-worker-observer.ts';

/** Apply the shipped service lifecycle to the entrypoint's existing data-only configuration. */
export async function serveAuthService(
  ctx: PluginServiceContext,
  registry: AuthServiceBackendRegistry,
  config: PluginServiceConfig<AuthServiceContext>,
): Promise<AuthRunningService> {
  const service = await createPluginService(router, config).onShutdown(async () => {
    await registry.background?.stop();
  }).serve();
  // Service identity owns cleanup; the supervisor retries without caller credentials.
  void registry.background?.start(createWorkosWorkerObserver(ctx.logger));
  return service;
}
