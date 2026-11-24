/**
 * Process-wide dispatcher for named queues that share one Deno KV database.
 *
 * Deno KV exposes a single queue per database, and every `listenQueue` connection competes for
 * it. Named queues on one database therefore share one listen loop per database in each process,
 * and that loop routes every envelope to the listener registered for the envelope's queue name.
 *
 * An envelope whose queue name has no listener in this process is re-enqueued a bounded number
 * of times, then dead-lettered with reason `unroutable`; it is never acknowledged silently. While
 * no listener at all is registered, envelopes are parked by delayed re-enqueue instead.
 *
 * Deno KV stops a queue listener only by closing its connection. A database opened by path gets a
 * dedicated listener connection, so its loop stops when the last listener leaves without touching
 * writes. An in-memory database or a caller-owned handle has a single connection: its loop runs
 * until that connection closes, which the dispatcher does only for connections it opened.
 *
 * @module
 */

import { DenoKvMessageQueue } from '@fedify/denokv';
import { type MessageEnvelope, toAddressedEnvelope, toDeadLetterRecord } from '../_envelope.ts';
import { closeQuietly, type KvQueueConnection } from './connection.ts';
import {
  type KvEnvelopeHandler,
  KvQueueRegistration,
  KvQueueRouteTable,
  track,
  validateKvQueueConcurrency,
} from './routes.ts';
import { retryKnownUncommittedWrite } from './write-retry.ts';
import { KvDeadLetterStore } from '../kv-dead-letter-store.ts';

export type { KvDatabaseTarget } from './connection.ts';
export type { KvEnvelopeHandler } from './routes.ts';

/** Re-enqueue policy for envelopes that no local listener receives. */
export interface UnroutablePolicy {
  /** Re-enqueue hops allowed before the envelope is dead-lettered as `unroutable`. */
  readonly maxHops: number;
  /** Delay before the first hop; each further hop doubles it. */
  readonly baseDelayMs: number;
  /** Upper bound for a single hop delay. */
  readonly maxDelayMs: number;
  /** Delay between re-enqueues of a parked envelope while no listener is registered at all. */
  readonly parkDelayMs: number;
}

/**
 * Eight hops with a doubling delay (0.5 s up to a 30 s cap, about 92 s in total). That covers a
 * listener that registers moments after its process starts consuming, and spans one 60 s poll of
 * another process listening on the same local database. Parked envelopes are retried every 5 s.
 */
export const DEFAULT_UNROUTABLE_POLICY: UnroutablePolicy = {
  maxHops: 8,
  baseDelayMs: 500,
  maxDelayMs: 30_000,
  parkDelayMs: 5_000,
};

/**
 * Delay before re-enqueue hop `hop` (zero-based).
 *
 * @param policy - Re-enqueue policy.
 * @param hop - Number of hops already taken.
 * @returns Delay in milliseconds.
 */
export function unroutableDelayMs(policy: UnroutablePolicy, hop: number): number {
  return Math.min(policy.baseDelayMs * 2 ** hop, policy.maxDelayMs);
}

/** A running listen loop. */
interface KvListenLoop {
  readonly controller: AbortController;
  readonly done: Promise<void>;
}

/**
 * Short handback delay used when a dedicated file-backed listen loop is closing
 * after draining admitted work: long enough that the closing loop will not reclaim
 * the envelope during `yieldToAcks()`, short enough that pause/resume picks it up promptly.
 */
const DEDICATED_HANDBACK_DELAY_MS = 25;
/** Bounded park delay for paused queues re-dequeued while a sibling queue stays live. */
const PAUSED_HANDBACK_PARK_DELAY_MS = 100;
const EXPLICIT_PAUSE_TOKEN = Symbol('explicit-pause');

/**
 * Routes one Deno KV database's queue to listeners registered by queue name.
 */
export class KvQueueDispatcher {
  readonly #connection: KvQueueConnection;
  readonly #policy: UnroutablePolicy;
  readonly #routes = new KvQueueRouteTable();
  readonly #pausedQueues = new Map<string, Set<symbol>>();
  readonly #inFlight = new Set<Promise<void>>();
  readonly #stopping = new Set<Promise<void>>();
  #admittedDeliveries = 0;
  #routingChanged = Promise.withResolvers<void>();
  #writer: { readonly kv: Deno.Kv; readonly queue: DenoKvMessageQueue } | null = null;
  #loop: KvListenLoop | null = null;

  /**
   * Create a dispatcher.
   *
   * @param connection - Connection source for the database.
   * @param policy - Re-enqueue policy for envelopes no local listener receives.
   */
  constructor(connection: KvQueueConnection, policy: UnroutablePolicy = DEFAULT_UNROUTABLE_POLICY) {
    this.#connection = connection;
    this.#policy = policy;
  }

  /**
   * Shared connection used for enqueue and dead-letter writes.
   *
   * @returns Open Deno KV connection.
   */
  kv(): Promise<Deno.Kv> {
    return this.#connection.shared();
  }

  /**
   * Enqueue an envelope on the database queue, retrying known-uncommitted SQLite busy
   * contention within the bounded write-retry policy.
   *
   * @param envelope - Envelope addressed to a queue name.
   * @param delayMs - Optional availability delay.
   */
  async enqueue(envelope: MessageEnvelope<unknown>, delayMs?: number): Promise<void> {
    const kv = await this.kv();
    if (this.#writer?.kv !== kv) {
      this.#writer = { kv, queue: new DenoKvMessageQueue(kv) };
    }
    const writer = this.#writer.queue;
    const delay = delayMs ? Temporal.Duration.from({ milliseconds: delayMs }) : undefined;
    await retryKnownUncommittedWrite(() => writer.enqueue(envelope, { delay }));
  }

  /** Mark `queueName` as paused by an identified live adapter/caller token. */
  markPaused(queueName: string, token: symbol): void {
    let tokens = this.#pausedQueues.get(queueName);
    if (!tokens) {
      tokens = new Set();
      this.#pausedQueues.set(queueName, tokens);
    }
    tokens.add(token);
  }

  /** Clear one pause token for `queueName`. */
  clearPause(queueName: string, token: symbol): void {
    const tokens = this.#pausedQueues.get(queueName);
    if (!tokens) return;
    tokens.delete(token);
    if (tokens.size === 0) {
      this.#pausedQueues.delete(queueName);
    }
  }

  /** Explicitly pause `queueName` so deliveries park at hop 0 while sibling routes stay live. */
  pauseQueue(queueName: string): void {
    this.markPaused(queueName, EXPLICIT_PAUSE_TOKEN);
  }

  /** Clear explicit pause state for `queueName` without registering a listener. */
  resumeQueue(queueName: string): void {
    this.clearPause(queueName, EXPLICIT_PAUSE_TOKEN);
  }

  /** Permanently retire `queueName` (clears pause state so future work follows bounded reroute). */
  stopQueue(queueName: string): void {
    this.#pausedQueues.delete(queueName);
  }

  /** Route envelopes addressed to `queueName` to `handler` until `signal` aborts. */
  listen(
    queueName: string,
    handler: KvEnvelopeHandler,
    signal: AbortSignal,
    concurrency = 1,
  ): Promise<void> {
    const boundedConcurrency = validateKvQueueConcurrency(concurrency);
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    if (signal.aborted) {
      resolve();
      return promise;
    }
    const leave = () => {
      this.#routes.remove(queueName, registration);
      registration.close();
      this.#wakeRoutingWaiters();
      void registration.settle()
        .then(() => this.#stopLoopWhenIdle())
        .then(() => resolve(), () => resolve());
    };
    const registration = new KvQueueRegistration(
      handler,
      () => {
        signal.removeEventListener('abort', leave);
        resolve();
      },
      (error) => {
        signal.removeEventListener('abort', leave);
        reject(error);
      },
      boundedConcurrency,
      (delta) => {
        this.#admittedDeliveries += delta;
        if (this.#admittedDeliveries === 0) {
          this.#wakeRoutingWaiters();
        }
      },
    );
    signal.addEventListener('abort', leave, { once: true });
    this.clearPause(queueName, EXPLICIT_PAUSE_TOKEN);
    this.#routes.add(queueName, registration);
    this.#wakeRoutingWaiters();
    this.#startLoop();
    return promise;
  }

  /** End registrations, stop dedicated loops, and close owned connections. */
  async close(): Promise<void> {
    this.#pausedQueues.clear();
    const registrations = this.#routes.drain();
    for (const registration of registrations) {
      registration.close();
    }
    this.#wakeRoutingWaiters();
    await this.#settleInFlight();
    for (const registration of registrations) {
      registration.end();
    }
    const loop = this.#loop;
    if (loop && this.#connection.dedicatedListener) {
      this.#loop = null;
      this.#retainStop(loop);
    }
    await Promise.all([...this.#stopping]);
    this.#writer = null;
    if (await this.#connection.close() && this.#loop) {
      await this.#loop.done;
    }
  }

  #startLoop(): void {
    if (this.#loop) {
      return;
    }
    const controller = new AbortController();
    const loop: KvListenLoop = {
      controller,
      done: this.#runLoop(controller.signal).then(
        () => this.#settleLoop(loop),
        (error: unknown) => this.#settleLoop(loop, error),
      ),
    };
    this.#loop = loop;
  }

  async #runLoop(signal: AbortSignal): Promise<void> {
    const kv = await this.#connection.listener();
    if (signal.aborted) {
      closeQuietly(kv);
      return;
    }
    // Only a dedicated listener connection may be closed on stop; Fedify closes it on abort.
    await new DenoKvMessageQueue(kv).listen(
      (rawMessage) => this.#dispatch(rawMessage),
      this.#connection.dedicatedListener ? { signal } : {},
    );
  }

  /** Stop a dedicated listen loop once no registration remains and in-flight work settled. */
  async #stopLoopWhenIdle(): Promise<void> {
    // The departing registration already drained its own work; other names keep the loop.
    if (!this.#connection.dedicatedListener || !this.#routes.isEmpty) {
      return;
    }
    await this.#settleInFlight();
    const loop = this.#loop;
    if (!loop || !this.#routes.isEmpty) {
      return;
    }
    this.#loop = null;
    await this.#retainStop(loop);
  }

  /** Abort a loop and keep its completion until it settles, so `close()` can await it. */
  #retainStop(loop: KvListenLoop): Promise<void> {
    const stopped = yieldToAcks().then(() => {
      loop.controller.abort();
      return loop.done;
    });
    this.#stopping.add(stopped);
    void stopped.then(() => this.#stopping.delete(stopped));
    return stopped;
  }

  async #settleInFlight(): Promise<void> {
    await Promise.allSettled([...this.#inFlight]);
  }

  /** A loop that ends while still current ends or fails every registration it served. */
  #settleLoop(loop: KvListenLoop, error?: unknown): void {
    if (this.#loop !== loop) {
      return;
    }
    this.#loop = null;
    for (const registration of this.#routes.drain()) {
      registration.close();
      if (error === undefined) {
        registration.end();
      } else {
        registration.fail(error);
      }
    }
    this.#wakeRoutingWaiters();
  }

  #wakeRoutingWaiters(): void {
    const current = this.#routingChanged;
    this.#routingChanged = Promise.withResolvers<void>();
    current.resolve();
  }

  #isPaused(queueName: string): boolean {
    return (this.#pausedQueues.get(queueName)?.size ?? 0) > 0;
  }

  #dispatch(rawMessage: unknown): Promise<void> {
    return track(this.#inFlight, this.#route(toAddressedEnvelope(rawMessage)));
  }

  async #route(envelope: MessageEnvelope<unknown> & { queueName: string }): Promise<void> {
    let cancelledHandback = false;
    while (true) {
      const registration = this.#routes.next(envelope.queueName);
      if (registration) {
        const admitted = await registration.deliver(envelope);
        if (admitted) {
          return;
        }
        cancelledHandback = true;
        continue;
      }
      if (this.#routes.isEmpty) {
        if (this.#connection.dedicatedListener) {
          while (this.#routes.isEmpty && this.#admittedDeliveries > 0) {
            await this.#routingChanged.promise;
          }
          if (!this.#routes.isEmpty) {
            continue;
          }
          await this.enqueue(
            envelope,
            Math.min(DEDICATED_HANDBACK_DELAY_MS, this.#policy.parkDelayMs),
          );
          return;
        }
        await this.enqueue(envelope, this.#policy.parkDelayMs);
        return;
      }
      if (this.#isPaused(envelope.queueName)) {
        await this.enqueue(
          envelope,
          Math.min(PAUSED_HANDBACK_PARK_DELAY_MS, this.#policy.parkDelayMs),
        );
        return;
      }
      if (cancelledHandback) {
        await this.enqueue(
          envelope,
          Math.min(DEDICATED_HANDBACK_DELAY_MS, this.#policy.parkDelayMs),
        );
        return;
      }
      await this.#reroute(envelope);
      return;
    }
  }

  async #reroute(envelope: MessageEnvelope<unknown> & { queueName: string }): Promise<void> {
    const hops = envelope.routingHops ?? 0;
    if (hops < this.#policy.maxHops) {
      await this.enqueue(
        { ...envelope, routingHops: hops + 1 },
        unroutableDelayMs(this.#policy, hops),
      );
      return;
    }
    const store = new KvDeadLetterStore({ queueName: envelope.queueName, denoKv: await this.kv() });
    await store.append(toDeadLetterRecord(
      envelope,
      'unroutable',
      {
        errorMessage:
          `No listener for queue '${envelope.queueName}' received the message after ${hops} re-enqueue hops.`,
      },
    ));
  }
}

export { acquireKvQueueDispatcher, type KvQueueDispatcherLease } from './registry.ts';

/** Let Deno acknowledge deliveries whose handlers just settled before their connection closes. */
function yieldToAcks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
