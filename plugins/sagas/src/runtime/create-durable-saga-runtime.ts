import { delay } from '@std/async';
import type {
  SagaClockPort,
  SagaRuntime,
  SagaRuntimeNativeOptions,
  SagaSleepOptions,
  SagaStorePort,
} from '@netscript/plugin-sagas-core/runtime';
import { createSagaRuntime, SagaCompensator } from '@netscript/plugin-sagas-core/runtime';
import { SagaInstrumentation } from '@netscript/plugin-sagas-core/telemetry';
import type { KvStore } from '@netscript/kv';

import {
  type DurableSagaStoreBackend,
  KvSagaStore,
  openSagaRuntimeKv,
  PrismaSagaStore,
  type PrismaSagaStoreClient,
} from '@netscript/plugin-sagas-core/stores';
import {
  ProjectingSagaStore,
  type SagaInstanceProjectionPort,
} from './saga-instance-projection.ts';

/** Options for the plugin-layer durable saga runtime factory. */
export type DurableSagaRuntimeOptions = Readonly<{
  backend?: DurableSagaStoreBackend;
  kv?: KvStore;
  prisma?: PrismaSagaStoreClient;
  store?: SagaStorePort;
  projection?: SagaInstanceProjectionPort;
  native?: SagaRuntimeNativeOptions;
}>;

/** Durable saga runtime resources owned by the plugin composition root. */
export type DurableSagaRuntime = Readonly<{
  runtime: SagaRuntime<'native'>;
  store: SagaStorePort;
  kv?: KvStore;
  dispose(): Promise<void>;
}>;

/**
 * Create an unstarted native saga runtime backed by a durable saga store.
 *
 * @deprecated Prefer `startSagaRunner` for the complete delivery, scheduler, registration, and
 * lifecycle composition. Low-level callers must still register definitions and call `start()`.
 */
export async function createDurableSagaRuntime(
  options: DurableSagaRuntimeOptions = {},
): Promise<DurableSagaRuntime> {
  const resources = await resolveStoreResources(options);
  const store = options.projection
    ? new ProjectingSagaStore(resources.store, options.projection)
    : resources.store;
  const instrumentation = options.native?.instrumentation ??
    options.native?.engineOptions?.instrumentation ?? new SagaInstrumentation();
  const runtime = createSagaRuntime({
    adapter: 'native',
    native: {
      ...options.native,
      store,
      instrumentation,
      compensator: options.native?.compensator ?? new SagaCompensator({
        clock: systemSagaClock,
        instrumentation,
      }),
    },
  });

  return Object.freeze({
    runtime,
    store,
    kv: resources.kv,
    dispose: resources.dispose,
  });
}

const systemSagaClock: SagaClockPort = Object.freeze({
  id: 'system-saga-clock',
  now: () => new Date(),
  sleep: (ms: number, options?: SagaSleepOptions) => delay(ms, { signal: options?.signal }),
});

type DurableSagaStoreResources = Readonly<{
  store: SagaStorePort;
  kv?: KvStore;
  dispose(): Promise<void>;
}>;

async function resolveStoreResources(
  options: DurableSagaRuntimeOptions,
): Promise<DurableSagaStoreResources> {
  const injectedStore = options.store ?? options.native?.store;
  if (injectedStore) {
    return Object.freeze({
      store: injectedStore,
      kv: options.kv,
      dispose: () => closeStore(injectedStore, options.kv),
    });
  }

  if (options.backend === 'prisma' || options.prisma !== undefined) {
    if (!options.prisma) {
      throw new Error('Prisma saga store backend requires a Prisma client.');
    }
    const store = new PrismaSagaStore({ prisma: options.prisma });
    return Object.freeze({
      store,
      dispose: () => closeStore(store),
    });
  }

  const kv = options.kv ?? await openSagaRuntimeKv();
  const store = new KvSagaStore({ kv });
  return Object.freeze({
    store,
    kv,
    dispose: () => closeStore(store),
  });
}

async function closeStore(store: SagaStorePort, kv?: KvStore): Promise<void> {
  const closeable = store as SagaStorePort & { close?: () => void | Promise<void> };
  if (closeable.close) {
    await closeable.close();
    return;
  }
  kv?.close();
}
