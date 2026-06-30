/** @module @netscript/plugin-triggers-core/runtime */

import type {
  TriggerEventSubscriptionFilter,
  TriggerEventSubscriptionMessage,
  TriggerEventSubscriptionOptions,
  TriggerEventSubscriptionPort,
} from '../ports/mod.ts';

type Subscriber = {
  readonly filter: TriggerEventSubscriptionFilter;
  readonly queue: TriggerEventSubscriptionMessage[];
  wake?: () => void;
};

/** Create a single-replica in-process trigger event subscription hub. */
export function createEventSubscription(): TriggerEventSubscriptionPort {
  return new InProcessTriggerEventSubscription();
}

class InProcessTriggerEventSubscription implements TriggerEventSubscriptionPort {
  readonly #subscribers = new Set<Subscriber>();

  subscribe(
    filter: TriggerEventSubscriptionFilter = {},
    options: TriggerEventSubscriptionOptions = {},
  ): AsyncIterable<TriggerEventSubscriptionMessage> {
    const subscriber: Subscriber = { filter, queue: [] };
    this.#subscribers.add(subscriber);
    return this.#stream(subscriber, options.signal);
  }

  publish(message: TriggerEventSubscriptionMessage): Promise<void> {
    for (const subscriber of this.#subscribers) {
      if (matchesFilter(message, subscriber.filter)) {
        subscriber.queue.push(message);
        subscriber.wake?.();
        subscriber.wake = undefined;
      }
    }
    return Promise.resolve();
  }

  async *#stream(
    subscriber: Subscriber,
    signal: AbortSignal | undefined,
  ): AsyncGenerator<TriggerEventSubscriptionMessage> {
    const abort = (): void => {
      this.#subscribers.delete(subscriber);
      subscriber.wake?.();
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) {
      abort();
    }
    try {
      while (this.#subscribers.has(subscriber)) {
        const queued = subscriber.queue.shift();
        if (queued !== undefined) {
          yield queued;
          continue;
        }
        await new Promise<void>((resolve) => {
          subscriber.wake = resolve;
        });
      }
    } finally {
      signal?.removeEventListener('abort', abort);
      this.#subscribers.delete(subscriber);
      subscriber.wake?.();
    }
  }
}

function matchesFilter(
  message: TriggerEventSubscriptionMessage,
  filter: TriggerEventSubscriptionFilter,
): boolean {
  return (filter.triggerId === undefined || message.event.triggerId === filter.triggerId) &&
    (filter.kind === undefined || message.event.kind === filter.kind) &&
    (filter.status === undefined || message.event.status === filter.status);
}
