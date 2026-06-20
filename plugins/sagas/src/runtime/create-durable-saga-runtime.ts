import type {
  SagaRuntime,
  SagaRuntimeNativeOptions,
  SagaStorePort,
} from '@netscript/plugin-sagas-core/runtime';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';

import { KvSagaStore, openSagaRuntimeKv } from './kv-saga-store.ts';
import { PrismaSagaStore, type PrismaSagaStoreClient } from './prisma-saga-store.ts';

/** Durable saga store backend variants supported by the plugin runtime. */
export type DurableSagaStoreBackend = 'kv' | 'prisma';

/** Options for the plugin-layer durable saga runtime factory. */
export type DurableSagaRuntimeOptions = Readonly<{
  backend?: DurableSagaStoreBackend;
  kv?: Deno.Kv;
  prisma?: PrismaSagaStoreClient;
  store?: SagaStorePort;
  native?: SagaRuntimeNativeOptions;
}>;

/** Durable saga runtime resources owned by the plugin composition root. */
export type DurableSagaRuntime = Readonly<{
  runtime: SagaRuntime<'native'>;
  store: SagaStorePort;
  kv?: Deno.Kv;
  dispose(): Promise<void>;
}>;

/** Create a native saga runtime backed by a durable saga store. */
export async function createDurableSagaRuntime(
  options: DurableSagaRuntimeOptions = {},
): Promise<DurableSagaRuntime> {
  const resources = await resolveStoreResources(options);
  const runtime = createSagaRuntime({
    adapter: 'native',
    native: {
      ...options.native,
      store: resources.store,
    },
  });

  return Object.freeze({
    runtime,
    store: resources.store,
    kv: resources.kv,
    dispose: resources.dispose,
  });
}

type DurableSagaStoreResources = Readonly<{
  store: SagaStorePort;
  kv?: Deno.Kv;
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

async function closeStore(store: SagaStorePort, kv?: Deno.Kv): Promise<void> {
  const closeable = store as SagaStorePort & { close?: () => void | Promise<void> };
  if (closeable.close) {
    await closeable.close();
    return;
  }
  kv?.close();
}
