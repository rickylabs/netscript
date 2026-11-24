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
import {
  closeQuietly,
  createKvQueueConnection,
  type KvDatabaseTarget,
  type KvQueueConnection,
} from './connection.ts';
import {
  type KvEnvelopeHandler,
  KvQueueRegistration,
  KvQueueRouteTable,
  track,
  validateKvQueueConcurrency,
} from './routes.ts';
import {
  isKvRequeueCommitted,
  requeueKvEnvelopeAtomically,
  retryKnownUncommittedWrite,
} from './write-retry.ts';
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
/** Bounded park delay for cancellation handbacks re-dequeued while a sibling queue stays live. */
const PAUSED_HANDBACK_PARK_DELAY_MS = 100;

/**
 * Routes one Deno KV database's queue to listeners registered by queue name.
 */
export class KvQueueDispatcher {
  readonly #connection: KvQueueConnection;
  readonly #policy: UnroutablePolicy;
  readonly #routes = new KvQueueRouteTable();
  readonly #pausedQueues = new Set<string>();
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

  /** Check whether a requeue for `(queueName, messageId, sourceEpoch)` already committed. */
  async isRequeueCommitted(
    queueName: string,
    messageId: string,
    sourceEpoch: number,
  ): Promise<boolean> {
    return await isKvRequeueCommitted(await this.kv(), queueName, messageId, sourceEpoch);
  }

  /** Atomically record a requeue marker and enqueue `next` in one KV transaction. */
  async requeue(
    source: MessageEnvelope<unknown> & { queueName: string },
    next: MessageEnvelope<unknown> & { queueName: string },
    delayMs?: number,
  ): Promise<void> {
    await requeueKvEnvelopeAtomically(await this.kv(), source, next, delayMs);
  }

  /**
   * Route envelopes addressed to `queueName` to `handler` until `signal` aborts.
   *
   * @param queueName - Queue name to receive.
   * @param handler - Envelope handler; a rejection leaves redelivery to Deno KV.
   * @param signal - Ends this registration when aborted.
   * @param concurrency - Maximum whole deliveries active simultaneously (default `1`).
   * @returns Resolves once the registration has ended and its admitted deliveries have settled;
   *   rejects if the shared listen loop fails.
   */
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
      if (!this.#routes.has(queueName)) {
        this.#pausedQueues.add(queueName);
      }
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
    this.#pausedQueues.delete(queueName);
    this.#routes.add(queueName, registration);
    this.#wakeRoutingWaiters();
    this.#startLoop();
    return promise;
  }

  /**
   * End every registration once its in-flight deliveries settle, stop listen loops this
   * dispatcher can stop, and close connections it opened.
   */
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

  #dispatch(rawMessage: unknown): Promise<void> {
    return track(this.#inFlight, this.#route(toAddressedEnvelope(rawMessage)));
  }

  async #route(envelope: MessageEnvelope<unknown> & { queueName: string }): Promise<void> {
    let cancelledHandback = envelope.parkedHandback === true;
    const deliverable = cancelledHandback ? withoutParkedHandback(envelope) : envelope;
    while (true) {
      const registration = this.#routes.next(deliverable.queueName);
      if (registration) {
        const admitted = await registration.deliver(deliverable);
        if (admitted) {
          return;
        }
        cancelledHandback = true;
        continue;
      }
      const parked = cancelledHandback ? { ...deliverable, parkedHandback: true } : deliverable;
      if (this.#routes.isEmpty) {
        if (this.#connection.dedicatedListener) {
          while (this.#routes.isEmpty && this.#admittedDeliveries > 0) {
            await this.#routingChanged.promise;
          }
          if (!this.#routes.isEmpty) {
            continue;
          }
          await this.enqueue(
            parked,
            Math.min(DEDICATED_HANDBACK_DELAY_MS, this.#policy.parkDelayMs),
          );
          return;
        }
        await this.enqueue(parked, this.#policy.parkDelayMs);
        return;
      }
      if (cancelledHandback || this.#pausedQueues.has(deliverable.queueName)) {
        const delayMs = envelope.parkedHandback
          ? Math.min(PAUSED_HANDBACK_PARK_DELAY_MS, this.#policy.parkDelayMs)
          : Math.min(DEDICATED_HANDBACK_DELAY_MS, this.#policy.parkDelayMs);
        await this.enqueue({ ...deliverable, parkedHandback: true }, delayMs);
        return;
      }
      await this.#reroute(deliverable);
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

/** A counted claim on the dispatcher for one KV database. */
export interface KvQueueDispatcherLease {
  /** Dispatcher shared by every claim on the same database. */
  readonly dispatcher: KvQueueDispatcher;
  /** Drop the claim; the last claim closes the dispatcher. */
  release(): Promise<void>;
}

interface DispatcherEntry {
  readonly dispatcher: KvQueueDispatcher;
  /** Caller-owned handles keep their entry: the loop lives as long as the caller's handle. */
  readonly retained: boolean;
  leases: number;
}

interface DispatcherRegistry<K> {
  get(key: K): DispatcherEntry | undefined;
  set(key: K, entry: DispatcherEntry): unknown;
  delete(key: K): boolean;
}

const dispatchersByPath = new Map<string, DispatcherEntry>();
const dispatchersByInstance = new WeakMap<Deno.Kv, DispatcherEntry>();

/**
 * Claim the process-wide dispatcher for a KV database, creating it on first claim.
 *
 * Databases are identified by caller-owned instance, or by the configured path string (an
 * omitted path is Deno's default location). A dispatcher on a caller-owned handle stays
 * registered after its last claim, so a later claim reuses its loop. Any other dispatcher leaves
 * the registry when its last claim is released, before it closes, so a concurrent claim starts a
 * fresh one; an in-memory database therefore does not outlive its last claim.
 *
 * @param target - Caller-owned instance or path to open.
 * @returns Lease that must be released when the caller stops using the queue.
 */
export function acquireKvQueueDispatcher(target: KvDatabaseTarget): KvQueueDispatcherLease {
  return 'kv' in target
    ? acquire(dispatchersByInstance, target.kv, target)
    : acquire(dispatchersByPath, target.path ?? '', target);
}

function acquire<K>(
  registry: DispatcherRegistry<K>,
  key: K,
  target: KvDatabaseTarget,
): KvQueueDispatcherLease {
  let entry = registry.get(key);
  if (!entry) {
    entry = {
      dispatcher: new KvQueueDispatcher(createKvQueueConnection(target)),
      retained: 'kv' in target,
      leases: 0,
    };
    registry.set(key, entry);
  }
  entry.leases += 1;
  const claimed = entry;
  let released = false;
  return {
    dispatcher: claimed.dispatcher,
    async release() {
      if (released) {
        return;
      }
      released = true;
      claimed.leases -= 1;
      if (claimed.leases > 0 || claimed.retained) {
        return;
      }
      // Leave the registry before closing, so a concurrent claim gets a fresh dispatcher
      // instead of one whose connections this close is about to invalidate.
      if (registry.get(key) === claimed) {
        registry.delete(key);
      }
      await claimed.dispatcher.close();
    },
  };
}

/** Let Deno acknowledge deliveries whose handlers just settled before their connection closes. */
function yieldToAcks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function withoutParkedHandback(
  envelope: MessageEnvelope<unknown> & { queueName: string },
): MessageEnvelope<unknown> & { queueName: string } {
  const { parkedHandback: _ignored, ...clean } = envelope;
  return clean;
}
