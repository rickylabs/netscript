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
 * - Prisma store for durable saga state
 */

// Register Redis/Garnet KV adapter - must run before any getKv() call.
import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { createService } from '@netscript/service';
import { createSagaRuntime, type SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { type SagaStreamPrismaClient, startSagasStreamMirror } from '../../streams/server.ts';
import { router } from './router.ts';
import { registerSagas } from './init.ts';

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
): Promise<void> {
  const port = parseInt(ctx.env.PORT ?? Deno.env.get('PORT') ?? '8092');
  const dbClient = await ctx.db.getClient() as ServiceDatabaseClient;
  let sagaRuntime: SagaRuntime | undefined;

  await createService(router, {
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
      sagaRuntime = createSagaRuntime({ adapter: 'native' });
      await sagaRuntime.register(definitions);
      await sagaRuntime.start();
      void startSagasStreamMirror({ prisma: dbClient as unknown as SagaStreamPrismaClient })
        .catch((error) => {
          console.warn('[Sagas API] Durable stream hook skipped:', error);
        });

      console.log(`[Sagas API] Running on http://localhost:${port}`);
    })
    .serve();
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
