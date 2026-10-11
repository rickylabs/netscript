import type { Redis } from 'ioredis';

type Listener<T> = (message: T) => void;

interface Subscription<T> {
  readonly listeners: Set<Listener<T>>;
  readonly subscriber: Redis;
  readonly handler: (channel: string, message: string) => void;
}

/** Owns one Redis subscription per channel, shared by independent watch leases. */
export class WatchSubscriptions<T> {
  readonly #channels = new Map<string, Subscription<T>>();
  #tail: Promise<void> = Promise.resolve();

  constructor(
    private readonly subscriber: () => Promise<Redis>,
    private readonly parse: (message: string) => T | null,
  ) {}

  /** Install a listener before SUBSCRIBE acknowledgement and return its release. */
  async acquire(channel: string, listener: Listener<T>): Promise<() => Promise<void>> {
    await this.#serialize(async () => {
      let subscription = this.#channels.get(channel);
      if (subscription) {
        subscription.listeners.add(listener);
        return;
      }

      const subscriber = await this.subscriber();
      const listeners = new Set([listener]);
      const handler = (receivedChannel: string, message: string): void => {
        if (receivedChannel !== channel) return;
        const parsed = this.parse(message);
        if (parsed) { for (const notify of listeners) notify(parsed); }
      };
      subscription = { subscriber, listeners, handler };
      subscriber.on('message', handler);
      try {
        await subscriber.subscribe(channel);
        this.#channels.set(channel, subscription);
      } catch (error) {
        subscriber.off('message', handler);
        throw error;
      }
    });

    let released = false;
    return () => {
      if (released) return Promise.resolve();
      released = true;
      return this.#serialize(async () => {
        const subscription = this.#channels.get(channel);
        if (!subscription?.listeners.delete(listener) || subscription.listeners.size > 0) return;
        this.#channels.delete(channel);
        subscription.subscriber.off('message', subscription.handler);
        await subscription.subscriber.unsubscribe(channel);
      });
    };
  }

  // Acquiring during the last release must wait for UNSUBSCRIBE before SUBSCRIBE.
  #serialize(operation: () => Promise<void>): Promise<void> {
    const pending = this.#tail.then(operation);
    this.#tail = pending.catch(() => {});
    return pending;
  }
}
