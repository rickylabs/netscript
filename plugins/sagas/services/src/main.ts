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
 * - Durable KV-backed saga state, idempotency, and applied-key stores
 *
 * @module
 */

// Register Redis/Garnet KV adapter - must run before any getKv() call.
import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { createService, type RunningService } from '@netscript/service';
import type { SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import { type SagaStreamPrismaClient, startSagasStreamMirror } from '../../streams/server.ts';
import {
  createDurableSagaRuntime,
  type DurableSagaRuntime,
  KvSagaAppliedKeyStore,
  KvSagaIdempotencyStore,
  openSagaRuntimeKv,
  type PrismaSagaStoreClient,
  resolveSagaStoreBackend,
} from '../../src/runtime/mod.ts';
import { createSagaTelemetry } from '../../src/telemetry/otel-saga-tracer.ts';
import { router } from './router.ts';
import { registerSagas } from './init.ts';

export type { PluginServiceContext } from '@netscript/plugin/sdk';

type ServiceDatabaseClient = Record<string, unknown>;
type SagaServiceContextSettings = Readonly<{
  sagas?: { store?: { backend?: string } };
  Sagas?: { Store?: { Backend?: string } };
}>;
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
  const sagaStoreBackend = resolveSagaStoreBackend({
    env: { ...Deno.env.toObject(), ...ctx.env },
    appsettings: serviceAppsettings(ctx),
  });
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
      const kv = await openSagaRuntimeKv();
      durableRuntime = await createDurableSagaRuntime({
        backend: sagaStoreBackend,
        kv,
        prisma: sagaStoreBackend === 'prisma'
          ? dbClient as unknown as PrismaSagaStoreClient
          : undefined,
        native: {
          idempotency: new KvSagaIdempotencyStore({ kv }),
          instrumentation: createSagaTelemetry(),
          engineOptions: {
            appliedKeys: new KvSagaAppliedKeyStore({ kv }),
          },
        },
      });
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
        await durableRuntime?.dispose();
        await running.stop();
      }
    },
  });
}

function serviceAppsettings(ctx: PluginServiceContext): SagaServiceContextSettings | undefined {
  const candidate = ctx as PluginServiceContext & {
    readonly appsettings?: SagaServiceContextSettings;
    readonly settings?: SagaServiceContextSettings;
    readonly config?: SagaServiceContextSettings;
  };
  return candidate.appsettings ?? candidate.settings ?? candidate.config;
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
