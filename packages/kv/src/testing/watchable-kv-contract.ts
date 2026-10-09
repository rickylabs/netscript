/**
 * Shared `WatchableKv.watch()` contract for adapter authors.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import type { KvKey, WatchEvent, WatchOptions } from '../../types/common.ts';
import type { WatchableKv } from '../../types/watchable-kv.ts';
import { DELIVERY_SETTLE_MS, DELIVERY_TIMEOUT_MS, sleep, withTimeout } from './_async.ts';

/**
 * Options for {@linkcode runWatchableKvContract}.
 */
export interface WatchableKvContractOptions {
  /** Human-readable adapter name used in Deno test titles. */
  readonly name: string;
  /** Creates a fresh adapter for each contract scenario. */
  readonly make: () => WatchableKv | Promise<WatchableKv>;
  /** Skip every scenario, e.g. when the backing service is not configured. */
  readonly ignore?: boolean;
}

const A: KvKey = ['contract', 'watch', 'a'];
const B: KvKey = ['contract', 'watch', 'b'];
const C: KvKey = ['contract', 'watch', 'c'];

/**
 * One open `watch()` stream plus the means to close it without hanging.
 */
class WatchProbe {
  readonly #kv: WatchableKv;
  readonly #controller = new AbortController();
  readonly #iterator: AsyncIterator<WatchEvent<string>[]>;

  constructor(kv: WatchableKv, keys: KvKey[], options: Omit<WatchOptions, 'signal'> = {}) {
    this.#kv = kv;
    this.#iterator = kv.watch<string>(keys, { ...options, signal: this.#controller.signal })
      [Symbol.asyncIterator]();
  }

  /** Request the next batch; the stream subscribes on its first request. */
  async next(label: string): Promise<WatchEvent<string>[]> {
    const result = await withTimeout(this.#iterator.next(), DELIVERY_TIMEOUT_MS, label);
    assert(!result.done, `${label}: watch stream ended early`);
    return result.value;
  }

  /** Abort, wake a parked waiter with one more write, and finish the stream. */
  async close(wakeKey: KvKey): Promise<void> {
    this.#controller.abort();
    await this.#kv.set(wakeKey, 'wake');
    await withTimeout(Promise.resolve(this.#iterator.return?.()), DELIVERY_TIMEOUT_MS, 'close');
  }
}

/**
 * Request the first batch, then wait until the stream is subscribed.
 *
 * The pending batch is wrapped so that awaiting the subscription does not
 * also await the batch itself.
 */
async function openBatch(
  probe: WatchProbe,
  label: string,
): Promise<{ readonly batch: Promise<WatchEvent<string>[]> }> {
  const batch = probe.next(label);
  await sleep(DELIVERY_SETTLE_MS);
  return { batch };
}

/** Collect batches until `until` is observed; returns every value in order. */
async function collectUntil(probe: WatchProbe, until: string): Promise<string[]> {
  const values: string[] = [];
  while (!values.includes(until)) {
    const batch = await probe.next(`delivery of ${until}`);
    values.push(...batch.map((event) => event.value as string));
  }
  return values;
}

interface WatchScenario {
  readonly title: string;
  readonly run: (kv: WatchableKv) => Promise<void>;
}

const commitVersionstamp: WatchScenario = {
  title: 'watch events carry the atomic commit versionstamp',
  async run(kv) {
    assert(kv.atomic, 'adapter does not implement atomic()');
    const probe = new WatchProbe(kv, [A]);
    try {
      const pending = await openBatch(probe, 'atomic commit event');
      const result = await kv.atomic([], [{ type: 'set', key: A, value: 'a1' }]);
      const [event] = await pending.batch;
      assert(result.ok);
      assertEquals(event.value, 'a1');
      assertEquals(event.versionstamp, result.versionstamp);
    } finally {
      await probe.close(A);
    }
  },
};

const noHeldBackEvents: WatchScenario = {
  title: 'watch delivers a change received between batches without a later write',
  async run(kv) {
    const probe = new WatchProbe(kv, [A, B]);
    try {
      const first = await openBatch(probe, 'first batch');
      await kv.set(A, 'A');
      assertEquals((await first.batch).map((event) => event.value), ['A']);

      // The consumer is between waits: B arrives while no batch is requested.
      await kv.set(B, 'B');
      await sleep(DELIVERY_SETTLE_MS);
      assertEquals((await probe.next('held-back B')).map((event) => event.value), ['B']);
    } finally {
      await probe.close(A);
    }
  },
};

const DEBOUNCE_MS = 400;

const debounceKeepsQueuedEvents: WatchScenario = {
  title: 'watch with debounce never drops an event queued between batches',
  async run(kv) {
    const probe = new WatchProbe(kv, [A, B, C], { debounce: DEBOUNCE_MS });
    try {
      const first = await openBatch(probe, 'first debounced batch');
      await kv.set(A, 'A');
      const values = (await first.batch).map((event) => event.value as string);

      // B arrives while the consumer is between waits, and stays queued past
      // the debounce window of the batch that already resolved.
      await kv.set(B, 'B');
      await sleep(DEBOUNCE_MS + DELIVERY_SETTLE_MS);
      await kv.set(C, 'C');

      if (!values.includes('C')) values.push(...await collectUntil(probe, 'C'));
      assertEquals(values, ['A', 'B', 'C']);
    } finally {
      await probe.close(A);
    }
  },
};

const SCENARIOS: readonly WatchScenario[] = [
  commitVersionstamp,
  noHeldBackEvents,
  debounceKeepsQueuedEvents,
];

/**
 * Registers the canonical `watch()` contract tests for a `WatchableKv` adapter.
 *
 * The contract requires that watch events carry the versionstamp of the
 * commit that produced them, that a change received while the consumer is
 * between batches is delivered on the next request without waiting for a
 * later write, and that `debounce` never drops a queued change.
 *
 * @example
 * ```ts
 * import { createMemoryKvAdapter, runWatchableKvContract } from "@netscript/kv/testing";
 *
 * runWatchableKvContract({
 *   name: "memory",
 *   make: () => createMemoryKvAdapter(),
 * });
 * ```
 *
 * @param options - Adapter factory and display name.
 */
export function runWatchableKvContract(options: WatchableKvContractOptions): void {
  for (const scenario of SCENARIOS) {
    Deno.test({
      name: `${options.name}: ${scenario.title}`,
      ignore: options.ignore,
      async fn() {
        const kv = await options.make();
        try {
          await scenario.run(kv);
        } finally {
          await kv.close();
        }
      },
    });
  }
}
