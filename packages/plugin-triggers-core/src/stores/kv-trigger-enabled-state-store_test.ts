import { assertEquals } from '@std/assert';
import { type KvEntry, type KvKey, type KvListOptions, MemoryKvAdapter } from '@netscript/kv';
import { defineWebhook } from '../builders/mod.ts';
import { KvTriggerEnabledStateStore } from './kv-trigger-enabled-state-store.ts';

class SequentialKvStore {
  readonly #kv = new MemoryKvAdapter();

  get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null> {
    return this.#kv.get<T>(key);
  }

  set(key: KvKey, value: unknown): Promise<void> {
    return this.#kv.set(key, value);
  }

  delete(key: KvKey): Promise<void> {
    return this.#kv.delete(key);
  }

  has(key: KvKey): Promise<boolean> {
    return this.#kv.has(key);
  }

  list<T = unknown>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
    return this.#kv.list<T>(options);
  }

  close(): Promise<void> {
    return this.#kv.close();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }
}

Deno.test('KvTriggerEnabledStateStore records overrides only with atomic KV', async () => {
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'orders-webhook',
    path: '/orders',
    verifier: 'memory',
  });
  const store = new KvTriggerEnabledStateStore({
    kv: new MemoryKvAdapter(),
    now: () => new Date('2026-01-01T00:00:00.000Z'),
  });

  assertEquals(await store.isEnabled(definition.id), true);
  assertEquals(await store.list(), []);

  await store.setEnabled(definition.id, false);
  assertEquals(await store.isEnabled(definition.id), false);
  assertEquals(await store.list(), [{
    triggerId: definition.id,
    enabled: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
  }]);

  await store.setEnabled(definition.id, true);
  assertEquals(await store.isEnabled(definition.id), true);
  assertEquals(await store.list(), []);
});

Deno.test('KvTriggerEnabledStateStore supports sequential KV adapters', async () => {
  const definition = defineWebhook(() => Promise.resolve([]), {
    id: 'orders-webhook-sequential',
    path: '/orders/sequential',
    verifier: 'memory',
  });
  const store = new KvTriggerEnabledStateStore({
    kv: new SequentialKvStore(),
    now: () => new Date('2026-01-02T00:00:00.000Z'),
  });

  await store.setEnabled(definition.id, false);
  assertEquals(await store.isEnabled(definition.id), false);
  assertEquals(await store.list(), [{
    triggerId: definition.id,
    enabled: false,
    updatedAt: '2026-01-02T00:00:00.000Z',
  }]);
});
