import type {
  SagaRuntime,
  SagaRuntimeNativeOptions,
  SagaStorePort,
} from '@netscript/plugin-sagas-core/runtime';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';

import { KvSagaStore, openSagaRuntimeKv } from './kv-saga-store.ts';

/** Options for the plugin-layer durable saga runtime factory. */
export type DurableSagaRuntimeOptions = Readonly<{
  kv?: Deno.Kv;
  store?: SagaStorePort;
  native?: SagaRuntimeNativeOptions;
}>;

/** Durable saga runtime resources owned by the plugin composition root. */
export type DurableSagaRuntime = Readonly<{
  runtime: SagaRuntime<'native'>;
  store: SagaStorePort;
  kv: Deno.Kv;
}>;

/** Create a native saga runtime backed by a durable Deno KV saga store. */
export async function createDurableSagaRuntime(
  options: DurableSagaRuntimeOptions = {},
): Promise<DurableSagaRuntime> {
  const kv = options.kv ?? await openSagaRuntimeKv();
  const store = options.store ?? options.native?.store ?? new KvSagaStore({ kv });
  const runtime = createSagaRuntime({
    adapter: 'native',
    native: {
      ...options.native,
      store,
    },
  });

  return Object.freeze({
    runtime,
    store,
    kv,
  });
}
