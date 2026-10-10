/**
 * Shared `WatchableKv.watch()` contract for adapter authors.
 *
 * @module
 */

import { assert, assertEquals } from '@std/assert';
import { deadline, delay } from '@std/async';
import type { KvKey, WatchEvent, WatchOptions } from '../../types/common.ts';
import type { WatchableKv } from '../../types/watchable-kv.ts';
import { registerScenarios, type Scenario } from './scenario.ts';
import { MARKER_SHAPED_VALUES } from './values.ts';

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

/**
 * Time allowed for a write to reach an already-subscribed watcher; covers the
 * pub/sub hop of networked adapters.
 */
const DELIVERY_SETTLE_MS = 100;
/** Upper bound for one expected watch delivery. */
const DELIVERY_TIMEOUT_MS = 2_000;
/** Debounce window used by the debounce scenarios. */
const DEBOUNCE_MS = 400;
/** How soon an aborted stream must finish, well inside one debounce window. */
const ABORT_BUDGET_MS = 150;

const A: KvKey = ['contract', 'watch', 'a'];
const B: KvKey = ['contract', 'watch', 'b'];
const C: KvKey = ['contract', 'watch', 'c'];

/**
 * One open `watch()` stream plus the means to close it without hanging.
 */
class WatchProbe {
  readonly #kv: WatchableKv;
  readonly #controller = new AbortController();
  readonly #iterator: AsyncIterator<WatchEvent[]>;

  constructor(kv: WatchableKv, keys: KvKey[], options: Omit<WatchOptions, 'signal'> = {}) {
    this.#kv = kv;
    this.#iterator = kv.watch(keys, { ...options, signal: this.#controller.signal })
      [Symbol.asyncIterator]();
  }

  /** Request the next batch; the stream subscribes on its first request. */
  async next(): Promise<WatchEvent[]> {
    const result = await deadline(this.#iterator.next(), DELIVERY_TIMEOUT_MS);
    assert(!result.done, 'watch stream ended early');
    return result.value;
  }

  /**
   * Request the first batch, then wait until the stream is subscribed.
   *
   * The pending batch is wrapped so that awaiting the subscription does not
   * also await the batch itself.
   */
  async open(): Promise<{ readonly batch: Promise<WatchEvent[]> }> {
    const batch = this.next();
    await delay(DELIVERY_SETTLE_MS);
    return { batch };
  }

  /** Collect batches until `until` is observed; returns every value in order. */
  async collectUntil(until: unknown): Promise<unknown[]> {
    const values: unknown[] = [];
    while (!values.includes(until)) {
      values.push(...(await this.next()).map((event) => event.value));
    }
    return values;
  }

  /** Abort, wake a parked waiter with one more write, and finish the stream. */
  async close(wakeKey: KvKey): Promise<void> {
    this.#controller.abort();
    await this.#kv.set(wakeKey, 'wake');
    await deadline(Promise.resolve(this.#iterator.return?.()), DELIVERY_TIMEOUT_MS);
  }
}

type WatchScenario = Scenario<WatchableKv>;

const writeVersionstamp: WatchScenario = {
  title: 'watch events carry the versionstamp of the write',
  async run(kv) {
    const probe = new WatchProbe(kv, [A]);
    try {
      const pending = await probe.open();
      await kv.set(A, 'a1');
      const [event] = await pending.batch;
      assertEquals(event.value, 'a1');
      assertEquals(event.versionstamp, (await kv.get(A))?.versionstamp);
    } finally {
      await probe.close(A);
    }
  },
};

const valueFidelity: WatchScenario = {
  title: 'watch delivers marker-shaped JSON values unchanged',
  async run(kv) {
    const probe = new WatchProbe(kv, [A]);
    try {
      const first = await probe.open();
      const sentinel = 'done';
      for (const value of MARKER_SHAPED_VALUES) {
        await kv.set(A, value);
      }
      await kv.set(A, sentinel);

      const delivered = (await first.batch).map((event) => event.value);
      if (!delivered.includes(sentinel)) delivered.push(...await probe.collectUntil(sentinel));
      assertEquals(delivered, [...MARKER_SHAPED_VALUES, sentinel]);
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
      const first = await probe.open();
      await kv.set(A, 'A');
      assertEquals((await first.batch).map((event) => event.value), ['A']);

      // The consumer is between waits: B arrives while no batch is requested.
      await kv.set(B, 'B');
      await delay(DELIVERY_SETTLE_MS);
      assertEquals((await probe.next()).map((event) => event.value), ['B']);
    } finally {
      await probe.close(A);
    }
  },
};

const debounceKeepsQueuedEvents: WatchScenario = {
  title: 'watch with debounce never drops an event queued between batches',
  async run(kv) {
    const probe = new WatchProbe(kv, [A, B, C], { debounce: DEBOUNCE_MS });
    try {
      const first = await probe.open();
      await kv.set(A, 'A');
      const values = (await first.batch).map((event) => event.value);

      // B arrives while the consumer is between waits, and stays queued past
      // the debounce window of the batch that already resolved.
      await kv.set(B, 'B');
      await delay(DEBOUNCE_MS + DELIVERY_SETTLE_MS);
      await kv.set(C, 'C');

      if (!values.includes('C')) values.push(...await probe.collectUntil('C'));
      assertEquals(values, ['A', 'B', 'C']);
    } finally {
      await probe.close(A);
    }
  },
};

const abortEndsDebounceWindow: WatchScenario = {
  title: 'aborting during a debounce window ends the stream promptly',
  async run(kv) {
    const controller = new AbortController();
    const iterator = kv.watch([A], { debounce: DEBOUNCE_MS * 2, signal: controller.signal })
      [Symbol.asyncIterator]();
    const pending = iterator.next();
    await delay(DELIVERY_SETTLE_MS);

    // The event opens the debounce window; abort well inside it.
    await kv.set(A, 'A');
    await delay(DELIVERY_SETTLE_MS);
    controller.abort();

    const result = await deadline(pending, ABORT_BUDGET_MS);
    assert(result.done, 'an aborted watch must end instead of yielding');
    await deadline(Promise.resolve(iterator.return?.()), ABORT_BUDGET_MS);
  },
};

/**
 * Registers the canonical `watch()` contract tests for a `WatchableKv` adapter.
 *
 * The contract requires that watch events carry the versionstamp of the write
 * that produced them and deliver values unchanged; that a change received
 * while the consumer is between batches is delivered on the next request
 * without waiting for a later write; that `debounce` never drops a queued
 * change; and that aborting ends the stream promptly, even mid-debounce.
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
  registerScenarios(options, [
    writeVersionstamp,
    valueFidelity,
    noHeldBackEvents,
    debounceKeepsQueuedEvents,
    abortEndsDebounceWindow,
  ]);
}
