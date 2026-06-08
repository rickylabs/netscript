/**
 * Test contracts and in-memory fixtures for `@netscript/kv`.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '../../adapters/memory.adapter.ts';
import type { KvStore } from '../../types/kv-store.ts';

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
}

/**
 * Registers the canonical KV store contract tests for an adapter.
 *
 * @param options - Adapter factory and display name.
 */
export function runKvStoreContract(options: KvStoreContractOptions): void {
  Deno.test(`${options.name}: stores, reads, lists, and deletes entries`, async () => {
    const store = await options.make();
    try {
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
    } finally {
      await store.close();
    }
  });
}
