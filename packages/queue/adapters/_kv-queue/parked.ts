/**
 * Durable KV parking store for paused named queues on a shared Deno KV database.
 *
 * When a named queue is paused while sibling queues keep the shared `listenQueue` loop active,
 * parked envelopes are persisted once under `[KV_QUEUE_PARKED_PREFIX, queueName, ...]` instead of
 * periodically re-enqueueing them onto the native queue. That eliminates background SQLite write
 * amplification for the duration of the pause regardless of backlog depth, while preserving crash
 * durability, exact envelope metadata, and immediate atomic wakeup via `check + delete + enqueue`
 * when the queue resumes, stops, or restarts.
 *
 * @module
 */

import type { MessageEnvelope } from '../_envelope.ts';
import { classifyKvWriteFailure, retryKnownUncommittedWrite } from './write-retry.ts';

/** Internal Deno KV key prefix used to store parked envelopes for paused named queues. */
export const KV_QUEUE_PARKED_PREFIX = '__netscript_kv_queue_parked';

/** Maximum parked entries combined into one atomic Deno KV commit (matches Deno KV's 10-range cap). */
export const MAX_KV_PARK_BATCH = 10;

const UNPARK_LIST_PAGE_SIZE = 50;

/** Addressed envelope stored verbatim while its destination queue is paused. */
export type AddressedEnvelope = MessageEnvelope<unknown> & { queueName: string };

interface PendingPark {
  readonly envelope: AddressedEnvelope;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

interface UnparkLoopState {
  dirty: boolean;
  done: Promise<void>;
}

/** Callbacks binding {@link KvParkedQueueStore} to its owning dispatcher. */
export interface KvParkedQueueStoreHooks {
  readonly getKv: () => Promise<Deno.Kv>;
  readonly shouldStayParked: (queueName: string) => boolean;
  readonly onCommittedQueues: (queueNames: ReadonlySet<string>) => void;
}

/**
 * Serialized, batched KV parking store with atomic `check + delete + enqueue` unparking.
 */
export class KvParkedQueueStore {
  readonly #hooks: KvParkedQueueStoreHooks;
  readonly #pendingParks: PendingPark[] = [];
  readonly #unparkLoops = new Map<string, UnparkLoopState>();
  readonly #activeUnparks = new Set<Promise<void>>();
  #flushLoop: Promise<void> | null = null;
  #seq = 0;
  #everParked = false;
  #closed = false;

  constructor(hooks: KvParkedQueueStoreHooks) {
    this.#hooks = hooks;
  }

  /** Whether this store has persisted any parked rows or started any unpark work. */
  get hasActivity(): boolean {
    return this.#everParked || this.#activeUnparks.size > 0;
  }

  /**
   * Durably persist `envelope` once into the paused-queue KV prefix.
   *
   * Concurrent callers coalesce into sequential atomic batches of up to {@link MAX_KV_PARK_BATCH}
   * so draining a large paused backlog does not create self-inflicted SQLite lock contention.
   */
  park(envelope: AddressedEnvelope): Promise<void> {
    this.#everParked = true;
    const deferred = Promise.withResolvers<void>();
    this.#pendingParks.push({
      envelope,
      resolve: deferred.resolve,
      reject: deferred.reject,
    });
    this.#ensureFlushLoop();
    return deferred.promise;
  }

  /**
   * Schedule a single-flight atomic unpark pass for `queueName`.
   *
   * Safe to invoke concurrently: if a pass is already running for `queueName`, marks it dirty so
   * one more scan runs after the current pass, closing the concurrent park-vs-unpark race.
   */
  scheduleUnpark(queueName: string): Promise<void> {
    const existing = this.#unparkLoops.get(queueName);
    if (existing) {
      existing.dirty = true;
      return existing.done;
    }
    const state: UnparkLoopState = {
      dirty: true,
      done: Promise.resolve(),
    };
    const run = this.#runUnparkLoop(queueName, state);
    state.done = run;
    this.#unparkLoops.set(queueName, state);
    this.#trackUnpark(run);
    return run;
  }

  /**
   * Sweep all parked entries on startup so work orphaned by a prior process crash recovers
   * automatically without disturbing queues paused in the current process.
   */
  scheduleStartupRecoverySweep(): Promise<void> {
    const run = this.#sweepUnpausedQueues((queueName) => this.#hooks.shouldStayParked(queueName))
      .catch((error) => {
        if (this.#closed || isClosedKvError(error)) {
          return;
        }
        // Best-effort startup recovery: a transient failure leaves rows durable in KV for the
        // next listen/clearPause/stopQueue trigger.
      });
    this.#trackUnpark(run);
    return run;
  }

  /**
   * Flush pending park batches, wait for in-flight unparks, and atomically move any remaining
   * parked entries back to the native Deno KV queue before the shared KV handle closes.
   */
  async flushAndUnparkAllForClose(): Promise<void> {
    this.#closed = true;
    while (this.#flushLoop) {
      await this.#flushLoop.catch(() => undefined);
    }
    while (this.#activeUnparks.size > 0) {
      await Promise.allSettled([...this.#activeUnparks]);
    }
    if (!this.#everParked) {
      return;
    }
    try {
      await this.#sweepUnpausedQueues(() => false);
    } catch (error) {
      if (!isClosedKvError(error)) {
        throw error;
      }
    }
  }

  #ensureFlushLoop(): void {
    if (this.#flushLoop) {
      return;
    }
    const loop = this.#runFlushLoop().finally(() => {
      if (this.#flushLoop === loop) {
        this.#flushLoop = null;
      }
      if (this.#pendingParks.length > 0) {
        this.#ensureFlushLoop();
      }
    });
    this.#flushLoop = loop;
  }

  async #runFlushLoop(): Promise<void> {
    while (this.#pendingParks.length > 0) {
      const batch = this.#pendingParks.splice(0, MAX_KV_PARK_BATCH);
      await this.#commitParkBatch(batch);
    }
  }

  async #commitParkBatch(batch: readonly PendingPark[]): Promise<void> {
    if (batch.length === 0) {
      return;
    }
    let kv: Deno.Kv;
    try {
      kv = await this.#hooks.getKv();
    } catch (error) {
      for (const item of batch) {
        item.reject(error);
      }
      return;
    }

    const entries = batch.map((item) => ({
      item,
      key: [
        KV_QUEUE_PARKED_PREFIX,
        item.envelope.queueName,
        item.envelope.enqueuedAt,
        ++this.#seq,
        crypto.randomUUID(),
      ] as const,
    }));

    const commitAtomic = (): Promise<Deno.KvCommitResult | Deno.KvCommitError> => {
      const op = kv.atomic();
      for (const entry of entries) {
        op.set(entry.key, entry.item.envelope);
      }
      return op.commit();
    };

    try {
      const result = await retryKnownUncommittedWrite(commitAtomic);
      if (!result.ok) {
        throw new Error('Atomic park commit unexpectedly returned ok=false');
      }
      this.#resolveCommittedBatch(entries);
    } catch (error) {
      if (error instanceof TypeError && batch.length > 1) {
        for (const item of batch) {
          await this.#commitParkBatch([item]);
        }
        return;
      }
      if (classifyKvWriteFailure(error) === 'unknown_commit_outcome') {
        try {
          const probe = await kv.get(entries[0].key);
          if (probe.versionstamp !== null) {
            // All writes shared one atomic commit, so seeing the first key proves the whole batch
            // committed — never blindly replay.
            this.#resolveCommittedBatch(entries);
            return;
          }
        } catch {
          // Cannot verify commit status; surface the original failure without blind replay.
        }
      }
      for (const item of batch) {
        item.reject(error);
      }
    }
  }

  #resolveCommittedBatch(
    entries: ReadonlyArray<{ readonly item: PendingPark }>,
  ): void {
    const queueNames = new Set<string>();
    for (const entry of entries) {
      queueNames.add(entry.item.envelope.queueName);
      entry.item.resolve();
    }
    this.#hooks.onCommittedQueues(queueNames);
  }

  #trackUnpark(work: Promise<void>): void {
    this.#activeUnparks.add(work);
    const forget = () => this.#activeUnparks.delete(work);
    work.then(forget, forget);
  }

  async #runUnparkLoop(queueName: string, state: UnparkLoopState): Promise<void> {
    try {
      while (state.dirty) {
        state.dirty = false;
        if (this.#hooks.shouldStayParked(queueName)) {
          return;
        }
        const kv = await this.#hooks.getKv();
        await this.#drainQueue(kv, queueName, () => this.#hooks.shouldStayParked(queueName));
      }
    } catch (error) {
      if (!this.#closed && !isClosedKvError(error)) {
        // Leave any remaining rows durable in KV; a subsequent trigger or startup sweep recovers them.
      }
    } finally {
      if (this.#unparkLoops.get(queueName) === state) {
        this.#unparkLoops.delete(queueName);
      }
    }
  }

  async #sweepUnpausedQueues(shouldSkipQueue: (queueName: string) => boolean): Promise<void> {
    const kv = await this.#hooks.getKv();
    // Fast path: 0 parked rows across the database finishes in one read-only index lookup.
    const queueNames = new Set<string>();
    for await (const entry of kv.list({ prefix: [KV_QUEUE_PARKED_PREFIX] })) {
      const queueName = entry.key[1];
      if (typeof queueName === 'string') {
        if (shouldSkipQueue(queueName)) {
          this.#everParked = true;
        } else {
          queueNames.add(queueName);
        }
      }
    }
    for (const queueName of queueNames) {
      if (shouldSkipQueue(queueName)) {
        continue;
      }
      await this.#drainQueue(kv, queueName, () => shouldSkipQueue(queueName));
    }
  }

  async #drainQueue(
    kv: Deno.Kv,
    queueName: string,
    shouldStop: () => boolean,
  ): Promise<void> {
    const prefix = [KV_QUEUE_PARKED_PREFIX, queueName] as const;
    while (!shouldStop()) {
      const page: Deno.KvEntry<AddressedEnvelope>[] = [];
      for await (
        const entry of kv.list<AddressedEnvelope>({ prefix }, { limit: UNPARK_LIST_PAGE_SIZE })
      ) {
        page.push(entry);
      }
      if (page.length === 0) {
        return;
      }
      for (let offset = 0; offset < page.length; offset += MAX_KV_PARK_BATCH) {
        if (shouldStop()) {
          return;
        }
        const chunk = page.slice(offset, offset + MAX_KV_PARK_BATCH);
        await this.#moveBatchToNativeQueue(kv, chunk);
        if (offset + MAX_KV_PARK_BATCH < page.length || page.length === UNPARK_LIST_PAGE_SIZE) {
          await yieldTurn();
        }
      }
    }
  }

  async #moveBatchToNativeQueue(
    kv: Deno.Kv,
    entries: readonly Deno.KvEntry<AddressedEnvelope>[],
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }
    const commitMove = (): Promise<Deno.KvCommitResult | Deno.KvCommitError> => {
      const op = kv.atomic();
      for (const entry of entries) {
        op.check(entry).delete(entry.key).enqueue(entry.value);
      }
      return op.commit();
    };

    try {
      const result = await retryKnownUncommittedWrite(commitMove);
      if (result.ok) {
        return;
      }
      // CAS conflict ({ ok: false }): another unpark pass already moved at least one entry.
      if (entries.length > 1) {
        for (const entry of entries) {
          await this.#moveBatchToNativeQueue(kv, [entry]);
        }
      }
    } catch (error) {
      if (error instanceof TypeError && entries.length > 1) {
        for (const entry of entries) {
          await this.#moveBatchToNativeQueue(kv, [entry]);
        }
        return;
      }
      if (classifyKvWriteFailure(error) === 'unknown_commit_outcome') {
        try {
          const probe = await kv.get(entries[0].key);
          if (probe.versionstamp !== entries[0].versionstamp) {
            // Delete and enqueue shared one atomic commit, so a changed/missing versionstamp proves
            // the atomic move already committed — never replay.
            return;
          }
        } catch {
          // Cannot verify commit status; surface the original failure without blind replay.
        }
      }
      throw error;
    }
  }
}

function isClosedKvError(error: unknown): boolean {
  if (error instanceof Deno.errors.BadResource) {
    return true;
  }
  if (!(error instanceof Error)) {
    return false;
  }
  return error.name === 'BadResource' ||
    error.name === 'KvClosedError' ||
    /bad resource|kv.*closed|database.*closed/i.test(error.message);
}

function yieldTurn(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
