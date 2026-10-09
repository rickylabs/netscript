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
import { type MessageEnvelope, toAddressedEnvelope, toDeadLetterRecord } from './_envelope.ts';
import {
  closeQuietly,
  createKvQueueConnection,
  type KvDatabaseTarget,
  type KvQueueConnection,
} from './_kv-queue-connection.ts';
import {
  type KvEnvelopeHandler,
  KvQueueRegistration,
  KvQueueRouteTable,
  track,
} from './_kv-queue-routes.ts';
import { KvDeadLetterStore } from './kv-dead-letter-store.ts';

export type { KvDatabaseTarget } from './_kv-queue-connection.ts';
export type { KvEnvelopeHandler } from './_kv-queue-routes.ts';

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
 * Routes one Deno KV database's queue to listeners registered by queue name.
 */
export class KvQueueDispatcher {
  readonly #connection: KvQueueConnection;
  readonly #policy: UnroutablePolicy;
  readonly #routes = new KvQueueRouteTable();
  readonly #inFlight = new Set<Promise<void>>();
  readonly #stopping = new Set<Promise<void>>();
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

  /** Whether a listen loop is consuming the database queue. */
  get isListening(): boolean {
    return this.#loop !== null;
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
   * Enqueue an envelope on the database queue.
   *
   * @param envelope - Envelope addressed to a queue name.
   * @param delayMs - Optional availability delay.
   */
  async enqueue(envelope: MessageEnvelope<unknown>, delayMs?: number): Promise<void> {
    const kv = await this.kv();
    if (this.#writer?.kv !== kv) {
      this.#writer = { kv, queue: new DenoKvMessageQueue(kv) };
    }
    await this.#writer.queue.enqueue(envelope, {
      delay: delayMs ? Temporal.Duration.from({ milliseconds: delayMs }) : undefined,
    });
  }

  /**
   * Route envelopes addressed to `queueName` to `handler` until `signal` aborts.
   *
   * @param queueName - Queue name to receive.
   * @param handler - Envelope handler; a rejection leaves redelivery to Deno KV.
   * @param signal - Ends this registration when aborted.
   * @returns Resolves once the registration has ended and its in-flight deliveries have settled;
   *   rejects if the shared listen loop fails.
   */
  listen(queueName: string, handler: KvEnvelopeHandler, signal: AbortSignal): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    if (signal.aborted) {
      resolve();
      return promise;
    }
    const leave = () => {
      this.#routes.remove(queueName, registration);
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
    );
    signal.addEventListener('abort', leave, { once: true });
    this.#routes.add(queueName, registration);
    this.#startLoop();
    return promise;
  }

  /**
   * End every registration once its in-flight deliveries settle, stop listen loops this
   * dispatcher can stop, and close connections it opened.
   */
  async close(): Promise<void> {
    const registrations = this.#routes.drain();
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
    if (!this.#connection.dedicatedListener) {
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
      if (error === undefined) {
        registration.end();
      } else {
        registration.fail(error);
      }
    }
  }

  #dispatch(rawMessage: unknown): Promise<void> {
    return track(this.#inFlight, this.#route(toAddressedEnvelope(rawMessage)));
  }

  async #route(envelope: MessageEnvelope<unknown> & { queueName: string }): Promise<void> {
    const registration = this.#routes.next(envelope.queueName);
    if (registration) {
      await registration.deliver(envelope);
    } else if (this.#routes.isEmpty) {
      await this.enqueue(envelope, this.#policy.parkDelayMs);
    } else {
      await this.#reroute(envelope);
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
 * omitted path is Deno's default location). A dispatcher whose loop still consumes a
 * caller-owned handle stays registered after its last claim, so a later claim reuses that loop.
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
    entry = { dispatcher: new KvQueueDispatcher(createKvQueueConnection(target)), leases: 0 };
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
      if (claimed.leases > 0) {
        return;
      }
      await claimed.dispatcher.close();
      const idle = claimed.leases === 0 && !claimed.dispatcher.isListening;
      if (idle && registry.get(key) === claimed) {
        registry.delete(key);
      }
    },
  };
}

/** Let Deno acknowledge deliveries whose handlers just settled before their connection closes. */
function yieldToAcks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
