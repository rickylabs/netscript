/**
 * Sagas Service
 *
 * oRPC-based Sagas API service for saga management, instance tracking,
 * and SSE streaming.
 *
 * Features:
 * - oRPC type-safe API
 * - OpenAPI documentation
 * - SSE streaming for real-time saga updates
 * - OpenTelemetry tracing
 * - Durable KV-backed saga state store
 */

// Register Redis/Garnet KV adapter - must run before any getKv() call.
import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { createService, type RunningService } from '@netscript/service';
import type { SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { type SagaStreamPrismaClient, startSagasStreamMirror } from '../../streams/server.ts';
import { createDurableSagaRuntime, type DurableSagaRuntime } from '../../src/runtime/mod.ts';
import { router } from './router.ts';
import { registerSagas } from './init.ts';

export type { PluginServiceContext } from '@netscript/plugin/sdk';

type ServiceDatabaseClient = Record<string, unknown>;
type PluginServiceBootstrap = {
  createPluginServiceContext(pluginName: string): Promise<PluginServiceContext>;
};

/**
 * Starts the Sagas API service using host-provided infrastructure.
 *
 * @param ctx - Host-provided plugin service context
 */
export default async function createSagasService(
  ctx: PluginServiceContext,
): Promise<RunningService> {
  const port = parseInt(ctx.env.PORT ?? Deno.env.get('PORT') ?? '8092');
  const dbClient = await ctx.db.getClient() as ServiceDatabaseClient;
  let sagaRuntime: SagaRuntime | undefined;
  let durableRuntime: DurableSagaRuntime | undefined;

  const running = await createService(router, {
    name: 'sagas',
    version: '1.0.0',
    port,
  })
    .withCors()
    .withLogger()
    .withOpenAPI({
      title: 'Sagas API',
      description: 'Sagas service for workflow orchestration and management',
    })
    .withDocs()
    .withDatabase(dbClient)
    .withContext(() => ({ sagaRuntime }))
    .withRPC({ traceContext: true })
    .withHealth()
    .withServiceInfo()
    .onStartup(async () => {
      const definitions = await registerSagas();
      durableRuntime = await createDurableSagaRuntime();
      sagaRuntime = durableRuntime.runtime;
      await sagaRuntime.register(definitions);
      await sagaRuntime.start();
      void startSagasStreamMirror({ prisma: dbClient as unknown as SagaStreamPrismaClient })
        .catch((error) => {
          console.warn('[Sagas API] Durable stream hook skipped:', error);
        });

      console.log(`[Sagas API] Running on http://localhost:${port}`);
    })
    .serve();

  return Object.freeze({
    ...running,
    stop: async () => {
      try {
        await sagaRuntime?.stop('sagas-service-stop');
      } finally {
        durableRuntime?.kv.close();
        await running.stop();
      }
    },
  });
}

async function loadSagasServiceContext(): Promise<PluginServiceContext> {
  const bootstrapModule = Deno.env.get('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
  if (!bootstrapModule) {
    throw new Error(
      'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE is required to start sagas service directly.',
    );
  }

  const { createPluginServiceContext } = await import(bootstrapModule) as PluginServiceBootstrap;
  return createPluginServiceContext('sagas');
}

if (import.meta.main) {
  const ctx = await loadSagasServiceContext();
  await createSagasService(ctx);
}
