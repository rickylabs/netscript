/**
 * Test contracts and in-memory fixtures for `@netscript/kv`.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import { MemoryKvAdapter } from '../../adapters/memory.adapter.ts';
import type { KvStore } from '../../types/kv-store.ts';
import { registerScenarios, type Scenario } from './scenario.ts';
import { MARKER_SHAPED_VALUES } from './values.ts';

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

const CRUD_SCENARIO: Scenario<KvStore> = {
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

const VALUE_FIDELITY_SCENARIO: Scenario<KvStore> = {
  title: 'stores and lists marker-shaped JSON values unchanged',
  async run(store) {
    for (const [index, value] of MARKER_SHAPED_VALUES.entries()) {
      await store.set(['contract', 'values', index], value);
      assertEquals((await store.get(['contract', 'values', index]))?.value, value);
    }

    const listed: unknown[] = [];
    for await (const entry of store.list({ prefix: ['contract', 'values'] })) {
      listed.push(entry.value);
    }
    assertEquals(listed, MARKER_SHAPED_VALUES);
  },
};

/**
 * Registers the canonical KV store contract tests for an adapter.
 *
 * Covers CRUD, listing, and value fidelity: plain-JSON values, including
 * objects shaped like encoding markers, must read back unchanged. `atomic()`
 * is optional on `KvStore`; adapters that implement it should also run
 * {@linkcode runAtomicKvStoreContract}.
 *
 * @param options - Adapter factory and display name.
 */
export function runKvStoreContract(options: KvStoreContractOptions): void {
  registerScenarios(options, [CRUD_SCENARIO, VALUE_FIDELITY_SCENARIO]);
}
