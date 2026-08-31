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
import type { RunningService } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';
import { resolveSagaStoreBackend } from '@netscript/plugin-sagas-core/stores';
import { startSagasStreamMirror } from '../../streams/server.ts';
import { createSagaDeliveryPublisher } from '../../src/runtime/saga-delivery.ts';
import { resolveSagaServicePrismaClient } from './database-client.ts';
import { router } from './router.ts';
import { registerSagas } from './init.ts';
import type { SagaServiceDatabaseClient } from './routers/v1-types.ts';

export type { PluginServiceContext } from '@netscript/plugin/sdk';

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
  const portValue = ctx.env.PORT ?? Deno.env.get('PORT');
  if (portValue === undefined) {
    throw new Error('Sagas API requires the host-provided PORT environment variable.');
  }
  const port = Number.parseInt(portValue, 10);
  const sagaStoreBackend = resolveSagaStoreBackend({
    env: { ...Deno.env.toObject(), ...ctx.env },
    appsettings: serviceAppsettings(ctx),
  });
  let dbClient: SagaServiceDatabaseClient = emptySagaDatabaseClient;
  let useKvProjection = true;
  const sagaPublisher = createSagaDeliveryPublisher();

  const service = await createPluginService(router, {
    name: 'sagas',
    version: '1.0.0',
    port,
    openApi: {
      title: 'Sagas API',
      description: 'Sagas service for workflow orchestration and management',
    },
    context: () => ({ db: dbClient, sagaRuntime: sagaPublisher, useKvProjection }),
    onShutdown: [() => sagaPublisher.stop()],
  }).serve();

  queueMicrotask(async () => {
    try {
      const hostDbClient = await ctx.db.getClient();
      const sagaDbClient = resolveSagaServicePrismaClient(hostDbClient, sagaStoreBackend);
      if (sagaDbClient) {
        dbClient = sagaDbClient;
        useKvProjection = false;
      }
      await registerSagas();
      if (sagaDbClient) {
        void startSagasStreamMirror({ prisma: sagaDbClient })
          .catch((error) => {
            console.warn('[Sagas API] Durable stream hook skipped:', error);
          });
      } else {
        console.warn(
          '[Sagas API] Saga Prisma delegates unavailable; KV runtime continues without DB query projections.',
        );
      }

      console.log(`[Sagas API] Running on http://localhost:${port}`);
    } catch (error) {
      console.error('[Sagas API] Failed to finish post-listen startup:', error);
    }
  });

  return service;
}

const emptySagaDatabaseClient: SagaServiceDatabaseClient = Object.freeze({
  sagaInstance: Object.freeze({
    findMany: listNoSagaInstances,
    count: countNoSagaRows,
  }),
  sagaExecutionHistory: Object.freeze({
    findMany: listNoSagaHistory,
    count: countNoSagaRows,
  }),
});

function listNoSagaInstances(): Promise<[]> {
  return Promise.resolve([]);
}

function listNoSagaHistory(): Promise<[]> {
  return Promise.resolve([]);
}

function countNoSagaRows(): Promise<0> {
  return Promise.resolve(0);
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
