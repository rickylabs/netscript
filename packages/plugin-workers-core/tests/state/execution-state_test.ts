import { assertEquals } from '@std/assert';
import type { KvEntry, KvListSelector, RegistryKvStore } from '../../src/registry/mod.ts';
import { type ExecutionMutationHook, KvExecutionState } from '../../src/state/mod.ts';

Deno.test('KvExecutionState.progress persists progress values', async () => {
  const state = new KvExecutionState({ kv: createMemoryKvStore() });
  const execution = await state.create({ jobId: 'import-users', triggeredBy: 'manual' });

  const updated = await state.progress(execution.id, 42, 'Imported 42 of 100 users');

  assertEquals(updated?.progressPercent, 42);
  assertEquals(updated?.progressMessage, 'Imported 42 of 100 users');
  assertEquals(await state.get(execution.id), updated);
});

Deno.test('KvExecutionState.progress invokes the mutation hook with the updated record', async () => {
  const state = new KvExecutionState({ kv: createMemoryKvStore() });
  const execution = await state.create({ jobId: 'import-users', triggeredBy: 'manual' });
  const mutations: Parameters<ExecutionMutationHook>[0][] = [];
  state.setMutationHook((mutation) => mutations.push(mutation));

  await state.progress(execution.id, 75);

  assertEquals(mutations, [{
    type: 'updated',
    execution: {
      ...execution,
      progressPercent: 75,
      progressMessage: null,
    },
  }]);
});

function createMemoryKvStore(): RegistryKvStore {
  const entries = new Map<string, KvEntry<unknown>>();
  return {
    get<TValue>(key: readonly unknown[]): Promise<KvEntry<TValue> | null> {
      const entry = entries.get(JSON.stringify(key));
      return Promise.resolve(entry ? { key: entry.key, value: entry.value as TValue } : null);
    },
    set<TValue>(key: readonly unknown[], value: TValue): Promise<void> {
      entries.set(JSON.stringify(key), { key, value });
      return Promise.resolve();
    },
    delete(key: readonly unknown[]): Promise<void> {
      entries.delete(JSON.stringify(key));
      return Promise.resolve();
    },
    async *list<TValue>(selector: KvListSelector): AsyncIterable<KvEntry<TValue>> {
      for (const entry of entries.values()) {
        if (startsWith(entry.key, selector.prefix)) {
          yield { key: entry.key, value: entry.value as TValue };
        }
      }
    },
  };
}

function startsWith(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  return prefix.every((part, index) => Object.is(key[index], part));
}
