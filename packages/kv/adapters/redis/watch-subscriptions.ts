/**
 * Shared Redis channel subscriptions with independent watch leases.
 *
 * @module
 */

import { abortable, retry } from '@std/async';
import type { Redis } from 'ioredis';
import { KvClosedError, KvConnectionError, type KvError } from '../../application/errors.ts';

/** Total budget for restoring subscriptions and rereading state after an outage. */
export const REDIS_WATCH_RECOVERY_TIMEOUT_MS = 30_000;

interface Observer<T> {
  readonly message: (message: T) => void;
  readonly reconnect?: (signal: AbortSignal) => Promise<void>;
  readonly error?: (error: KvError) => void;
  readonly signal?: AbortSignal;
}

interface Subscription<T> {
  readonly listeners: Map<symbol, Observer<T>>;
  readonly lifetime: AbortController;
}

type Phase = 'connected' | 'recovering' | 'failed' | 'closed';

/** Owns one Redis subscription per channel, shared by independent watch leases. */
export class WatchSubscriptions<T> {
  readonly #channels = new Map<string, Subscription<T>>();
  #tail: Promise<void> = Promise.resolve();
  #client: Redis | null = null;
  #phase: Phase = 'connected';
  #failure: KvError | null = null;
  #recovery: Promise<void> | null = null;
  #budget: AbortController | null = null;
  #attempt: AbortController | null = null;

  constructor(
    private readonly subscriber: (signal?: AbortSignal) => Promise<Redis>,
    private readonly parse: (message: string) => T | null,
  ) {}

  /** Install a listener before SUBSCRIBE acknowledgement and return its release. */
  async acquire(
    channel: string,
    listener: (message: T) => void,
    options: Omit<Observer<T>, 'message'> = {},
  ): Promise<() => Promise<void>> {
    const lease = Symbol();
    // Recovery needs the serialization tail for acknowledgements. Never hold
    // that tail while waiting for the recovery itself or a fresh connection.
    if (this.#phase === 'failed' && this.#channels.size === 0) {
      this.#failure = null;
      this.#phase = 'connected';
    }
    await this.waitForRecovery(options.signal);
    const client = await this.subscriber(options.signal);
    await this.#serialize(async () => {
      if (this.#failure) throw this.#failure;
      options.signal?.throwIfAborted();
      if (
        client.status !== 'ready' ||
        (this.#channels.size > 0 && this.#client !== null && this.#client !== client)
      ) {
        throw new KvConnectionError('Redis watch connection changed during acquisition.');
      }
      let subscription = this.#channels.get(channel);
      if (subscription) {
        subscription.listeners.set(lease, { message: listener, ...options });
        return;
      }
      this.#bind(client);
      subscription = {
        listeners: new Map([[lease, { message: listener, ...options }]]),
        lifetime: new AbortController(),
      };
      this.#channels.set(channel, subscription);
      try {
        const subscribed = client.subscribe(channel);
        await (options.signal ? abortable(subscribed, options.signal) : subscribed);
      } catch (error) {
        this.#channels.delete(channel);
        throw error instanceof KvClosedError ? error : new KvConnectionError(
          'Redis watch subscription failed.',
          { cause: error },
        );
      }
    });

    let released = false;
    return () => {
      if (released) return Promise.resolve();
      released = true;
      const subscription = this.#channels.get(channel);
      if (!subscription?.listeners.delete(lease) || subscription.listeners.size > 0) {
        return Promise.resolve();
      }
      this.#channels.delete(channel);
      subscription.lifetime.abort();
      const recovering = this.#recovery !== null;
      if (recovering && this.#channels.size === 0) {
        this.#budget?.abort();
        const old = this.#client;
        this.#bind(null);
        old?.disconnect();
      }
      const removal = this.#serialize(async () => {
        if (this.#phase === 'closed' || this.#phase === 'failed') return;
        if (!this.#channels.has(channel) && this.#client?.status === 'ready') {
          await this.#client.unsubscribe(channel);
        }
      });
      // Cancellation during recovery is local and prompt. Its queued physical
      // unsubscribe precedes a future acquire without masking a stream failure.
      if (recovering) {
        void removal.catch(() => {});
        return Promise.resolve();
      }
      return removal.catch((error: unknown) => {
        if (this.#client?.status === 'ready' && this.#phase === 'connected') throw error;
      });
    };
  }

  /** Wait outside the channel-operation tail before reading recovered state. */
  async waitForRecovery(signal?: AbortSignal): Promise<void> {
    if (this.#recovery) await (signal ? abortable(this.#recovery, signal) : this.#recovery);
    signal?.throwIfAborted();
    if (this.#failure) throw this.#failure;
  }

  /** Fail live leases before the adapter closes its physical sockets. */
  close(): void {
    if (this.#phase === 'closed') return;
    this.#phase = 'closed';
    this.#failure = new KvClosedError('RedisKvAdapter is closed.');
    this.#budget?.abort(this.#failure);
    this.#attempt?.abort(this.#failure);
    for (const subscription of this.#channels.values()) {
      for (const observer of subscription.listeners.values()) observer.error?.(this.#failure);
      subscription.lifetime.abort(this.#failure);
    }
    this.#channels.clear();
    this.#bind(null);
  }

  readonly #message = (channel: string, message: string): void => {
    const listeners = this.#channels.get(channel)?.listeners;
    if (!listeners) return;
    const parsed = this.parse(message);
    if (parsed) { for (const observer of listeners.values()) observer.message(parsed); }
  };

  readonly #disconnected = (): void => {
    this.#attempt?.abort(new KvConnectionError('Redis watch connection changed during recovery.'));
    if (this.#recovery || this.#channels.size === 0 || this.#phase !== 'connected') return;
    this.#phase = 'recovering';
    const budget = new AbortController();
    this.#budget = budget;
    let lastFailure: unknown;
    const timeout = setTimeout(() =>
      budget.abort(
        new KvConnectionError(
          'Redis watch could not recover within 30 seconds.',
          { cause: lastFailure },
        ),
      ), REDIS_WATCH_RECOVERY_TIMEOUT_MS);
    this.#recovery = retry(async () => {
      try {
        await this.#restore(budget.signal);
      } catch (error) {
        lastFailure = error;
        throw error;
      }
    }, {
      // Even minimum-delay retries cannot exhaust before the total deadline.
      maxAttempts: Math.ceil(REDIS_WATCH_RECOVERY_TIMEOUT_MS / 100) + 1,
      minTimeout: 100,
      maxTimeout: 1_000,
      jitter: 0,
      signal: budget.signal,
    }).catch((cause: unknown) => {
      if (this.#phase === 'closed' || this.#channels.size === 0) return;
      this.#phase = 'failed';
      this.#failure = new KvConnectionError('Redis watch recovery failed.', { cause });
      for (const subscription of this.#channels.values()) {
        for (const observer of subscription.listeners.values()) observer.error?.(this.#failure);
      }
    }).finally(() => {
      clearTimeout(timeout);
      this.#recovery = null;
      this.#budget = null;
      this.#attempt = null;
      if (this.#phase === 'recovering') this.#phase = 'connected';
    });
  };

  async #restore(budget: AbortSignal): Promise<void> {
    const attempt = new AbortController();
    this.#attempt = attempt;
    const signal = AbortSignal.any([budget, attempt.signal]);
    const client = await this.subscriber(signal);
    signal.throwIfAborted();
    if (client.status !== 'ready') throw new KvConnectionError('Redis subscriber is reconnecting.');
    this.#bind(client);
    for (const [channel, subscription] of this.#channels) {
      await this.#serialize(async () => {
        if (this.#channels.get(channel) !== subscription) return;
        const subscribed = AbortSignal.any([signal, subscription.lifetime.signal]);
        await abortable(client.subscribe(channel), subscribed);
        subscribed.throwIfAborted();
      });
    }
    // Rereads are outside the serialization tail so abort/release can cancel
    // them. A second disconnect aborts this attempt before snapshots enqueue.
    await Promise.all(
      [...this.#channels.values()].flatMap((subscription) =>
        [...subscription.listeners.values()].map(async (observer) => {
          if (!observer.signal?.aborted) await observer.reconnect?.(signal);
        })
      ),
    );
    signal.throwIfAborted();
    this.#phase = 'connected';
  }

  #bind(client: Redis | null): void {
    if (client === this.#client) return;
    this.#client?.off('message', this.#message);
    this.#client?.off('close', this.#disconnected);
    this.#client?.off('end', this.#disconnected);
    this.#client = client;
    client?.on('message', this.#message);
    client?.on('close', this.#disconnected);
    client?.on('end', this.#disconnected);
  }

  // Acquiring during the last release must wait for UNSUBSCRIBE before SUBSCRIBE.
  #serialize(operation: () => Promise<void>): Promise<void> {
    const pending = this.#tail.then(operation);
    this.#tail = pending.catch(() => {});
    return pending;
  }
}
