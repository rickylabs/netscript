/**
 * Test contracts and in-memory fixtures for `@netscript/kv`.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '../../adapters/memory.adapter.ts';
import type { KvStore } from '../../types/kv-store.ts';
import { ATOMIC_SCENARIOS, type StoreScenario } from './atomic-contract.ts';

/**
 * Factory used by downstream tests when they need a clean in-memory KV adapter.
 *
 * @returns A new volatile adapter that implements the public KV contract.
 */
export function createMemoryKvAdapter(): MemoryKvAdapter {
  return new MemoryKvAdapter();
}

/**
 * Options for {@linkcode runKvStoreContract}.
 */
export interface KvStoreContractOptions {
  /** Human-readable adapter name used in Deno test titles. */
  readonly name: string;
  /** Creates a fresh adapter for each contract scenario. */
  readonly make: () => KvStore | Promise<KvStore>;
  /** Skip every scenario, e.g. when the backing service is not configured. */
  readonly ignore?: boolean;
}

const CRUD_SCENARIO: StoreScenario = {
  title: 'stores, reads, lists, and deletes entries',
  async run(store) {
    await store.set(['contract', 'one'], { value: 1 });
    await store.set(['contract', 'two'], { value: 2 });

    const first = await store.get<{ value: number }>(['contract', 'one']);
    assert(first);
    assertEquals(first.value.value, 1);

    const values: number[] = [];
    for await (const entry of store.list<{ value: number }>({ prefix: ['contract'] })) {
      values.push(entry.value.value);
    }
    assertEquals(values, [1, 2]);

    await store.delete(['contract', 'one']);
    assertEquals(await store.get(['contract', 'one']), null);
  },
};

/**
 * Registers the canonical KV store contract tests for an adapter.
 *
 * Besides CRUD and listing, the contract requires Deno KV `atomic()` parity:
 * one versionstamp per commit shared by every mutated entry and returned,
 * `sum`/`min`/`max` combining with the stored value, and serializable
 * concurrent commits.
 *
 * @param options - Adapter factory and display name.
 */
export function runKvStoreContract(options: KvStoreContractOptions): void {
  for (const scenario of [CRUD_SCENARIO, ...ATOMIC_SCENARIOS]) {
    Deno.test({
      name: `${options.name}: ${scenario.title}`,
      ignore: options.ignore,
      async fn() {
        const store = await options.make();
        try {
          await scenario.run(store);
        } finally {
          await store.close();
        }
      },
    });
  }
}
