/**
 * Process-wide dispatcher for named queues that share one Deno KV database.
 *
 * Deno KV exposes a single queue per database, and every `listenQueue` connection competes for
 * it. Named queues on one database therefore share one listen loop per database in each process,
 * and that loop routes every envelope to the listener registered for the envelope's queue name.
 *
 * An envelope whose queue name has no listener in this process is re-enqueued a bounded number
 * of times, then dead-lettered with reason `unroutable`; it is never acknowledged silently.
 *
 * @module
 */

import { DenoKvMessageQueue } from '@fedify/denokv';
import { type MessageEnvelope, toAddressedEnvelope, toDeadLetterRecord } from './_envelope.ts';
import { KvDeadLetterStore } from './kv-dead-letter-store.ts';

/** Handler that receives envelopes addressed to one queue name. */
export type KvEnvelopeHandler = (envelope: MessageEnvelope<unknown>) => Promise<void>;

/** Identifies one Deno KV database: a caller-owned instance, or a path or URL to open. */
export type KvDatabaseTarget =
  | { readonly kv: Deno.Kv }
  | { readonly path?: string };

/** Bounded re-enqueue policy for envelopes whose queue name has no listener in this process. */
export interface UnroutablePolicy {
  /** Re-enqueue hops allowed before the envelope is dead-lettered as `unroutable`. */
  readonly maxHops: number;
  /** Delay before the first hop; each further hop doubles it. */
  readonly baseDelayMs: number;
  /** Upper bound for a single hop delay. */
  readonly maxDelayMs: number;
}

/**
 * Eight hops with a doubling delay (0.5 s up to a 30 s cap, about 92 s in total). That covers a
 * listener that registers moments after its process starts consuming, and spans one 60 s poll of
 * another process listening on the same local database.
 */
export const DEFAULT_UNROUTABLE_POLICY: UnroutablePolicy = {
  maxHops: 8,
  baseDelayMs: 500,
  maxDelayMs: 30_000,
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

/** Connections a dispatcher uses for writes and for its listen loop. */
export interface KvQueueConnection {
  /** Connection used for enqueue and dead-letter writes. */
  shared(): Promise<Deno.Kv>;
  /** Connection consumed by one listen loop; the loop closes it when it stops. */
  listener(): Promise<Deno.Kv>;
  /** Record that the current listen loop stopped and closed its connection. */
  listenerStopped(): void;
  /** Close connections this object opened. Caller-owned instances are left open. */
  close(): Promise<void>;
}

const IN_MEMORY_PATH = ':memory:';

/**
 * Create the connection source for a KV database target.
 *
 * @param target - Caller-owned instance or path to open.
 * @returns Connection source for a dispatcher.
 */
export function createKvQueueConnection(target: KvDatabaseTarget): KvQueueConnection {
  if ('kv' in target) {
    return new SingleKvConnection(() => Promise.resolve(target.kv), false);
  }
  if (target.path === IN_MEMORY_PATH) {
    return new SingleKvConnection(() => Deno.openKv(IN_MEMORY_PATH), true);
  }
  return new PathKvConnection(target.path);
}

/**
 * One connection for writes and listening: a caller-owned instance, or an in-memory database,
 * which a second `openKv` call could not reach. Stopping the listen loop closes it.
 */
class SingleKvConnection implements KvQueueConnection {
  #kv: Promise<Deno.Kv> | null = null;

  constructor(
    private readonly open: () => Promise<Deno.Kv>,
    private readonly owned: boolean,
  ) {}

  shared(): Promise<Deno.Kv> {
    this.#kv ??= this.open();
    return this.#kv;
  }

  listener(): Promise<Deno.Kv> {
    return this.shared();
  }

  listenerStopped(): void {
    this.#kv = null;
  }

  async close(): Promise<void> {
    const kv = this.#kv;
    this.#kv = null;
    if (kv && this.owned) {
      await closeOpened(kv);
    }
  }
}

/** Opens a database by path: one shared write connection, and a fresh one per listen loop. */
class PathKvConnection implements KvQueueConnection {
  #shared: Promise<Deno.Kv> | null = null;

  constructor(private readonly path: string | undefined) {}

  shared(): Promise<Deno.Kv> {
    this.#shared ??= Deno.openKv(this.path);
    return this.#shared;
  }

  listener(): Promise<Deno.Kv> {
    return Deno.openKv(this.path);
  }

  listenerStopped(): void {}

  async close(): Promise<void> {
    const shared = this.#shared;
    this.#shared = null;
    if (shared) {
      await closeOpened(shared);
    }
  }
}

/** One listener registration for a queue name. */
interface KvQueueRoute {
  readonly handler: KvEnvelopeHandler;
  readonly end: () => void;
  readonly fail: (error: unknown) => void;
}

/** Listener registrations by queue name, chosen round-robin when a name has several. */
class KvQueueRouteTable {
  readonly #routes = new Map<string, KvQueueRoute[]>();
  #turn = 0;

  get isEmpty(): boolean {
    return this.#routes.size === 0;
  }

  add(queueName: string, route: KvQueueRoute): void {
    this.#routes.set(queueName, [...(this.#routes.get(queueName) ?? []), route]);
  }

  remove(queueName: string, route: KvQueueRoute): void {
    const remaining = (this.#routes.get(queueName) ?? []).filter((entry) => entry !== route);
    if (remaining.length === 0) {
      this.#routes.delete(queueName);
    } else {
      this.#routes.set(queueName, remaining);
    }
  }

  next(queueName: string): KvQueueRoute | undefined {
    const routes = this.#routes.get(queueName);
    if (!routes) {
      return undefined;
    }
    this.#turn = (this.#turn + 1) % Number.MAX_SAFE_INTEGER;
    return routes[this.#turn % routes.length];
  }

  drain(): KvQueueRoute[] {
    const routes = [...this.#routes.values()].flat();
    this.#routes.clear();
    return routes;
  }
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
  #writer: { readonly kv: Deno.Kv; readonly queue: DenoKvMessageQueue } | null = null;
  #loop: KvListenLoop | null = null;

  /**
   * Create a dispatcher.
   *
   * @param connection - Connection source for the database.
   * @param policy - Re-enqueue policy for envelopes with no local listener.
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
   * @returns Resolves when the registration ends; rejects if the shared listen loop fails.
   */
  listen(queueName: string, handler: KvEnvelopeHandler, signal: AbortSignal): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    if (signal.aborted) {
      resolve();
      return promise;
    }
    const route: KvQueueRoute = { handler, end: resolve, fail: reject };
    signal.addEventListener('abort', () => {
      this.#routes.remove(queueName, route);
      this.#stopLoopWhenIdle();
      resolve();
    }, { once: true });
    this.#routes.add(queueName, route);
    this.#startLoop();
    return promise;
  }

  /**
   * End every registration, stop the listen loop, and close connections this dispatcher opened.
   */
  async close(): Promise<void> {
    for (const route of this.#routes.drain()) {
      route.end();
    }
    const loop = this.#loop;
    this.#loop = null;
    if (loop) {
      loop.controller.abort();
      await loop.done;
    }
    this.#writer = null;
    await this.#connection.close();
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
    try {
      if (signal.aborted) {
        closeQuietly(kv);
        return;
      }
      await new DenoKvMessageQueue(kv).listen((rawMessage) => this.#dispatch(rawMessage), {
        signal,
      });
    } finally {
      this.#connection.listenerStopped();
    }
  }

  #stopLoopWhenIdle(): void {
    if (!this.#routes.isEmpty || !this.#loop) {
      return;
    }
    const loop = this.#loop;
    this.#loop = null;
    loop.controller.abort();
  }

  /** A loop that ends while still current ends or fails every registration it served. */
  #settleLoop(loop: KvListenLoop, error?: unknown): void {
    if (this.#loop !== loop) {
      return;
    }
    this.#loop = null;
    for (const route of this.#routes.drain()) {
      if (error === undefined) {
        route.end();
      } else {
        route.fail(error);
      }
    }
  }

  async #dispatch(rawMessage: unknown): Promise<void> {
    const envelope = toAddressedEnvelope(rawMessage);
    const route = this.#routes.next(envelope.queueName);
    if (route) {
      await route.handler(envelope);
      return;
    }
    await this.#reroute(envelope);
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
      { ...envelope, queueName: envelope.queueName },
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
 * omitted path is Deno's default location).
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
      if (registry.get(key) === claimed) {
        registry.delete(key);
      }
      await claimed.dispatcher.close();
    },
  };
}

async function closeOpened(kv: Promise<Deno.Kv>): Promise<void> {
  try {
    closeQuietly(await kv);
  } catch {
    // The connection never opened; there is nothing to release.
  }
}

function closeQuietly(kv: Deno.Kv): void {
  try {
    kv.close();
  } catch (error) {
    if (!(error instanceof Deno.errors.BadResource)) {
      throw error;
    }
  }
}
