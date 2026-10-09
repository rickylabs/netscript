/**
 * `KvStore.atomic()` parity contract for adapters that implement it.
 *
 * Deno KV is the reference: one commit has one versionstamp, written to every
 * mutated entry and returned; `sum`/`min`/`max` combine with the stored value;
 * and concurrent commits are serializable.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import type { KvStore } from '../../types/kv-store.ts';
import type { KvStoreContractOptions } from './memory-kv.ts';
import { registerScenarios, type Scenario } from './scenario.ts';
import { BIGINT_VALUES, MARKER_SHAPED_VALUES } from './values.ts';

type StoreScenario = Scenario<KvStore>;

/**
 * Resolve the optional `atomic()` capability or fail the scenario.
 *
 * @param store - Store under test.
 * @returns The bound `atomic()` method.
 */
function requireAtomic(store: KvStore): NonNullable<KvStore['atomic']> {
  assert(store.atomic, 'adapter does not implement atomic()');
  return store.atomic.bind(store);
}

const commitVersionstamp: StoreScenario = {
  title: 'atomic writes one commit versionstamp to every entry and CAS accepts it',
  async run(store) {
    const atomic = requireAtomic(store);
    const a = ['contract', 'atomic', 'a'];
    const b = ['contract', 'atomic', 'b'];

    const result = await atomic([], [
      { type: 'set', key: a, value: 'a1' },
      { type: 'set', key: b, value: 'b1' },
    ]);

    assert(result.ok);
    assert(result.versionstamp);
    assertEquals((await store.get(a))?.versionstamp, result.versionstamp);
    assertEquals((await store.get(b))?.versionstamp, result.versionstamp);

    const cas = await atomic(
      [{ key: a, versionstamp: result.versionstamp }],
      [{ type: 'set', key: a, value: 'a2' }],
    );
    assert(cas.ok, 'a CAS on the returned commit versionstamp must succeed');
    assertEquals((await store.get(a))?.value, 'a2');
  },
};

const combineMutations: StoreScenario = {
  title: 'atomic sum/min/max combine with the stored value under the commit versionstamp',
  async run(store) {
    const atomic = requireAtomic(store);
    const counter = ['contract', 'combine', 'counter'];
    const commit = async (mutation: 'sum' | 'min' | 'max', value: bigint): Promise<bigint> => {
      const result = await atomic([], [{ type: mutation, key: counter, value }]);
      assert(result.ok);
      const entry = await store.get<bigint>(counter);
      assertEquals(entry?.versionstamp, result.versionstamp);
      return entry!.value;
    };

    assertEquals(await commit('sum', 5n), 5n);
    assertEquals(await commit('sum', 3n), 8n);
    assertEquals(await commit('min', 9n), 8n);
    assertEquals(await commit('min', 6n), 6n);
    assertEquals(await commit('max', 2n), 6n);
    assertEquals(await commit('max', 10n), 10n);
  },
};

const serializableCommits: StoreScenario = {
  title: 'concurrent atomic commits are serializable',
  async run(store) {
    const atomic = requireAtomic(store);
    const a = ['contract', 'serial', 'a'];
    const b = ['contract', 'serial', 'b'];
    await store.set(a, 0);
    await store.set(b, 0);
    const seenA = (await store.get(a))!.versionstamp;
    const seenB = (await store.get(b))!.versionstamp;

    const [wide, narrow] = await Promise.all([
      atomic(
        [{ key: a, versionstamp: seenA }, { key: b, versionstamp: seenB }],
        [{ type: 'set', key: a, value: 'wide' }, { type: 'set', key: b, value: 'wide' }],
      ),
      atomic([{ key: b, versionstamp: seenB }], [{ type: 'set', key: b, value: 'narrow' }]),
    ]);

    assertEquals(
      [wide.ok, narrow.ok].filter(Boolean).length,
      1,
      'both commits checked the same versionstamp of b; exactly one may win',
    );
    assertEquals((await store.get(b))?.value, wide.ok ? 'wide' : 'narrow');
  },
};

const valueFidelity: StoreScenario = {
  title: 'bigint and marker-shaped values round-trip through set and atomic',
  async run(store) {
    const atomic = requireAtomic(store);
    const values = [...BIGINT_VALUES, ...MARKER_SHAPED_VALUES];

    for (const [index, value] of values.entries()) {
      await store.set(['contract', 'set', index], value);
      const result = await atomic([], [{ type: 'set', key: ['contract', 'atomic', index], value }]);
      assert(result.ok);
      assertEquals((await store.get(['contract', 'set', index]))?.value, value);
      assertEquals((await store.get(['contract', 'atomic', index]))?.value, value);
    }
  },
};

/**
 * Registers the Deno KV `atomic()` parity contract for an adapter that
 * implements the optional `KvStore.atomic()` capability.
 *
 * Requires one versionstamp per commit, written to every mutated entry and
 * returned (so a compare-and-set on it succeeds); `sum`/`min`/`max` combining
 * with the stored value; serializable concurrent commits; and lossless
 * `bigint` values at any depth.
 *
 * @example
 * ```ts
 * import { createMemoryKvAdapter, runAtomicKvStoreContract } from "@netscript/kv/testing";
 *
 * runAtomicKvStoreContract({
 *   name: "memory",
 *   make: () => createMemoryKvAdapter(),
 * });
 * ```
 *
 * @param options - Adapter factory and display name.
 */
export function runAtomicKvStoreContract(options: KvStoreContractOptions): void {
  registerScenarios(options, [
    commitVersionstamp,
    combineMutations,
    serializableCommits,
    valueFidelity,
  ]);
}
