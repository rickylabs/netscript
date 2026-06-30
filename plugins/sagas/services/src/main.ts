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
import type { SagaRuntime } from '@netscript/plugin-sagas-core/runtime';
import {
  KvSagaAppliedKeyStore,
  KvSagaIdempotencyStore,
  openSagaRuntimeKv,
  type PrismaSagaStoreClient,
  resolveSagaStoreBackend,
} from '@netscript/plugin-sagas-core/stores';
import { type SagaStreamPrismaClient, startSagasStreamMirror } from '../../streams/server.ts';
import { createDurableSagaRuntime, type DurableSagaRuntime } from '../../src/runtime/mod.ts';
import { createSagaTelemetry } from '../../src/telemetry/otel-saga-tracer.ts';
import { router } from './router.ts';
import { registerSagas } from './init.ts';
import type { SagaServiceDatabaseClient } from './routers/v1-types.ts';

export type { PluginServiceContext } from '@netscript/plugin/sdk';

type ServiceDatabaseClient =
  & SagaServiceDatabaseClient
  & PrismaSagaStoreClient
  & SagaStreamPrismaClient;
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
  const sagaStoreBackend = resolveSagaStoreBackend({
    env: { ...Deno.env.toObject(), ...ctx.env },
    appsettings: serviceAppsettings(ctx),
  });
  let dbClient: SagaServiceDatabaseClient = unavailableSagaDatabaseClient;
  let sagaRuntime: SagaRuntime | undefined;
  let durableRuntime: DurableSagaRuntime | undefined;

  const service = await createPluginService(router, {
    name: 'sagas',
    version: '1.0.0',
    port,
    openApi: {
      title: 'Sagas API',
      description: 'Sagas service for workflow orchestration and management',
    },
    context: () => ({ db: dbClient, sagaRuntime }),
    // Graceful shutdown: stop the saga runtime, then dispose the durable
    // runtime. This preserves the previous `stop()` wrapper's stop→dispose order
    // (the previous code stopped the runtime in a `try` and disposed in
    // `finally`); a single hook keeps that ordering deterministic rather than
    // relying on reverse-order hook execution.
    onShutdown: [async () => {
      try {
        await sagaRuntime?.stop('sagas-service-stop');
      } finally {
        await durableRuntime?.dispose();
      }
    }],
  }).serve();

  queueMicrotask(async () => {
    try {
      const resolvedDbClient = await ctx.db.getClient();
      assertServiceDatabaseClient(resolvedDbClient);
      dbClient = resolvedDbClient;
      const definitions = await registerSagas();
      const kv = await openSagaRuntimeKv();
      durableRuntime = await createDurableSagaRuntime({
        backend: sagaStoreBackend,
        kv,
        prisma: sagaStoreBackend === 'prisma' ? resolvedDbClient : undefined,
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
      void startSagasStreamMirror({ prisma: resolvedDbClient })
        .catch((error) => {
          console.warn('[Sagas API] Durable stream hook skipped:', error);
        });

      console.log(`[Sagas API] Running on http://localhost:${port}`);
    } catch (error) {
      console.error('[Sagas API] Failed to finish post-listen startup:', error);
    }
  });

  return service;
}

const unavailableSagaDatabaseClient: SagaServiceDatabaseClient = Object.freeze({
  sagaInstance: Object.freeze({
    findMany: rejectUnavailableDatabase,
    count: rejectUnavailableDatabase,
  }),
  sagaExecutionHistory: Object.freeze({
    findMany: rejectUnavailableDatabase,
    count: rejectUnavailableDatabase,
  }),
});

function rejectUnavailableDatabase(): Promise<never> {
  return Promise.reject(new Error('Sagas database client is not ready yet.'));
}

function assertServiceDatabaseClient(value: unknown): asserts value is ServiceDatabaseClient {
  if (!isObject(value)) {
    throw new Error('Sagas database client must be an object.');
  }

  const sagaInstance = Reflect.get(value, 'sagaInstance');
  const sagaExecutionHistory = Reflect.get(value, 'sagaExecutionHistory');
  const sagaRuntimeState = Reflect.get(value, 'sagaRuntimeState');
  const sagaRuntimeTransition = Reflect.get(value, 'sagaRuntimeTransition');
  const sagaRuntimeCorrelation = Reflect.get(value, 'sagaRuntimeCorrelation');

  if (
    !isObject(sagaInstance) ||
    !hasMethod(sagaInstance, 'findMany') ||
    !hasMethod(sagaInstance, 'count') ||
    !isObject(sagaExecutionHistory) ||
    !hasMethod(sagaExecutionHistory, 'findMany') ||
    !hasMethod(sagaExecutionHistory, 'count') ||
    !isObject(sagaRuntimeState) ||
    !isObject(sagaRuntimeTransition) ||
    !isObject(sagaRuntimeCorrelation) ||
    !hasMethod(value, '$transaction')
  ) {
    throw new Error('Sagas database client is missing required Prisma delegates.');
  }
}

function hasMethod(value: object, key: string): boolean {
  return typeof Reflect.get(value, key) === 'function';
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
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
