type SubscriptionEvent<T> =
  | { readonly kind: 'value'; readonly value: T }
  | { readonly kind: 'error'; readonly error: unknown }
  | { readonly kind: 'done' };

interface LogicalSubscriber<T> {
  readonly events: SubscriptionEvent<T>[];
  attached: boolean;
  wake?: () => void;
}

interface ActiveSubscription<T> {
  readonly controller: AbortController;
  readonly subscribers: Set<LogicalSubscriber<T>>;
  finished: Promise<void>;
}

interface ResolvedRetryConfig {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
}

interface SubscriptionRetryOptions {
  readonly maxAttempts?: number;
  readonly initialDelayMs?: number;
  readonly maxDelayMs?: number;
}

/** Shares one upstream async subscription among every active logical subscriber. */
export function createChatSubscriptionHub<T>(
  open: (signal: AbortSignal) => AsyncIterable<T>,
  lifetimeSignal: AbortSignal,
  retryOverrides?: SubscriptionRetryOptions,
): (signal?: AbortSignal) => AsyncIterable<T> {
  let active: ActiveSubscription<T> | undefined;
  const retry = resolveRetryConfig(retryOverrides);

  lifetimeSignal.addEventListener('abort', () => active?.controller.abort(), { once: true });

  const startSubscription = (): ActiveSubscription<T> => {
    const subscription: ActiveSubscription<T> = {
      controller: new AbortController(),
      subscribers: new Set(),
      finished: Promise.resolve(),
    };
    active = subscription;
    subscription.finished = runSubscription(subscription);
    return subscription;
  };

  const runSubscription = async (subscription: ActiveSubscription<T>): Promise<void> => {
    const signal = AbortSignal.any([lifetimeSignal, subscription.controller.signal]);
    try {
      for await (const value of subscribeWithRetry(open, retry, signal)) {
        publish(subscription, { kind: 'value', value });
      }
    } catch (error) {
      if (!signal.aborted) publish(subscription, { kind: 'error', error });
    } finally {
      publish(subscription, { kind: 'done' });
      if (active === subscription) active = undefined;
    }
  };

  const acquire = async (
    subscriber: LogicalSubscriber<T>,
    callerSignal?: AbortSignal,
  ): Promise<ActiveSubscription<T> | undefined> => {
    while (active?.controller.signal.aborted) await active.finished;
    if (callerSignal?.aborted || lifetimeSignal.aborted) return undefined;
    const subscription = active ?? startSubscription();
    subscriber.attached = true;
    subscription.subscribers.add(subscriber);
    return subscription;
  };

  return (callerSignal?: AbortSignal): AsyncIterable<T> =>
    (async function* () {
      if (callerSignal?.aborted || lifetimeSignal.aborted) return;

      const subscriber: LogicalSubscriber<T> = { events: [], attached: false };
      const wake = (): void => subscriber.wake?.();
      callerSignal?.addEventListener('abort', wake, { once: true });
      lifetimeSignal.addEventListener('abort', wake, { once: true });

      const subscription = await acquire(subscriber, callerSignal);
      if (!subscription) {
        callerSignal?.removeEventListener('abort', wake);
        lifetimeSignal.removeEventListener('abort', wake);
        return;
      }

      try {
        while (!callerSignal?.aborted && !lifetimeSignal.aborted) {
          const event = subscriber.events.shift();
          if (!event) {
            await new Promise<void>((resolve) => {
              subscriber.wake = resolve;
              if (
                subscriber.events.length > 0 || callerSignal?.aborted || lifetimeSignal.aborted
              ) {
                resolve();
              }
            });
            subscriber.wake = undefined;
            continue;
          }
          if (event.kind === 'value') {
            yield event.value;
            continue;
          }
          if (event.kind === 'error') throw event.error;
          return;
        }
      } finally {
        callerSignal?.removeEventListener('abort', wake);
        lifetimeSignal.removeEventListener('abort', wake);
        detach(subscription, subscriber);
      }
    })();
}

/**
 * Re-polls a transient pre-data subscription without changing the first-live-chunk boundary.
 */
async function* subscribeWithRetry<T>(
  open: (signal: AbortSignal) => AsyncIterable<T>,
  retry: ResolvedRetryConfig,
  signal: AbortSignal,
): AsyncGenerator<T, void, unknown> {
  let attempt = 0;

  while (!signal.aborted) {
    let yielded = false;
    try {
      for await (const chunk of open(signal)) {
        yielded = true;
        yield chunk;
      }
    } catch (error) {
      if (signal.aborted) return;
      if (yielded || !isTransientSubscribeError(error)) throw error;
    }

    if (signal.aborted || yielded) return;

    attempt += 1;
    if (attempt > retry.maxAttempts) return;
    await sleep(backoffDelay(attempt, retry), signal);
  }
}

function resolveRetryConfig(overrides?: SubscriptionRetryOptions): ResolvedRetryConfig {
  return {
    maxAttempts: overrides?.maxAttempts ?? 5,
    initialDelayMs: overrides?.initialDelayMs ?? 250,
    maxDelayMs: overrides?.maxDelayMs ?? 5000,
  };
}

function isTransientSubscribeError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (
    message.includes('401') || message.includes('403') ||
    message.includes('unauthorized') || message.includes('forbidden')
  ) {
    return false;
  }
  return (
    error instanceof TypeError ||
    message.includes('404') || message.includes('not found') ||
    message.includes('204') || message.includes('no content') ||
    message.includes('up to date') || message.includes('up-to-date') ||
    message.includes('premature close') || message.includes('err_stream_premature_close') ||
    message.includes('econnrefused') || message.includes('connection refused')
  );
}

function backoffDelay(attempt: number, retry: ResolvedRetryConfig): number {
  return Math.min(retry.initialDelayMs * 2 ** (attempt - 1), retry.maxDelayMs);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

function publish<T>(
  subscription: ActiveSubscription<T>,
  event: SubscriptionEvent<T>,
): void {
  for (const subscriber of subscription.subscribers) {
    subscriber.events.push(event);
    subscriber.wake?.();
  }
}

function detach<T>(
  subscription: ActiveSubscription<T>,
  subscriber: LogicalSubscriber<T>,
): void {
  if (!subscriber.attached) return;
  subscriber.attached = false;
  subscription.subscribers.delete(subscriber);
  if (subscription.subscribers.size === 0) subscription.controller.abort();
}
