/**
 * Listener registrations and the per-name route table of the queue dispatcher.
 *
 * @module
 */

import { QueueConfigurationError } from '../../ports/errors.ts';
import type { MessageEnvelope } from '../_envelope.ts';

/** Upper concurrency bound matching timer and queue listener limits. */
export const MAX_KV_QUEUE_CONCURRENCY = 2_147_483_647;

/** Handler that receives envelopes addressed to one queue name. */
export type KvEnvelopeHandler = (envelope: MessageEnvelope<unknown>) => Promise<void>;

/** Validate a listener concurrency bound, defaulting to sequential (`1`) delivery. */
export function validateKvQueueConcurrency(concurrency: number | undefined): number {
  const resolved = concurrency ?? 1;
  if (!Number.isSafeInteger(resolved) || resolved < 1 || resolved > MAX_KV_QUEUE_CONCURRENCY) {
    throw new QueueConfigurationError(
      `concurrency must be an integer between 1 and ${MAX_KV_QUEUE_CONCURRENCY}`,
      { concurrency: resolved },
    );
  }
  return resolved;
}

interface QueuedDelivery {
  readonly envelope: MessageEnvelope<unknown>;
  readonly resolve: (admitted: boolean) => void;
  readonly reject: (error: unknown) => void;
}

/**
 * One listener registration for a queue name, bounding whole-delivery concurrency
 * across execution, settlement, cancellation, and drain.
 */
export class KvQueueRegistration {
  readonly #concurrency: number;
  readonly #activeDeliveries = new Set<Promise<void>>();
  readonly #waiters: QueuedDelivery[] = [];
  readonly #onAdmittedDelta?: (delta: 1 | -1) => void;
  #active = 0;
  #closed = false;

  constructor(
    private readonly handler: KvEnvelopeHandler,
    readonly end: () => void,
    readonly fail: (error: unknown) => void,
    concurrency = 1,
    onAdmittedDelta?: (delta: 1 | -1) => void,
  ) {
    this.#concurrency = validateKvQueueConcurrency(concurrency);
    this.#onAdmittedDelta = onAdmittedDelta;
  }

  /** Whether this registration can admit another delivery immediately without queueing. */
  get hasCapacity(): boolean {
    return !this.#closed && this.#active < this.#concurrency;
  }

  /**
   * Deliver one envelope within this registration's concurrency bound.
   *
   * Resolves `true` after the full delivery settles, or `false` if this registration
   * closed before the delivery could be admitted to a concurrency slot.
   */
  deliver(envelope: MessageEnvelope<unknown>): Promise<boolean> {
    if (this.#closed) {
      return Promise.resolve(false);
    }
    if (this.#active < this.#concurrency) {
      this.#active += 1;
      this.#onAdmittedDelta?.(1);
      return this.#runAdmitted(envelope).then(() => true);
    }
    const deferred = Promise.withResolvers<boolean>();
    this.#waiters.push({
      envelope,
      resolve: deferred.resolve,
      reject: deferred.reject,
    });
    return deferred.promise;
  }

  /** Stop admitting future or queued deliveries without cancelling already-admitted work. */
  close(): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    const pending = this.#waiters.splice(0, this.#waiters.length);
    for (const waiter of pending) {
      waiter.resolve(false);
    }
  }

  /** Wait until every delivery already admitted to this registration has settled. */
  async settle(): Promise<void> {
    while (this.#activeDeliveries.size > 0) {
      await Promise.allSettled([...this.#activeDeliveries]);
    }
  }

  #runAdmitted(envelope: MessageEnvelope<unknown>): Promise<void> {
    const work = (async () => {
      try {
        await this.handler(envelope);
      } finally {
        this.#releaseSlot();
      }
    })();
    return track(this.#activeDeliveries, work);
  }

  #releaseSlot(): void {
    if (!this.#closed && this.#waiters.length > 0) {
      const next = this.#waiters.shift()!;
      // Transfer the slot atomically so `#active` never exceeds `#concurrency` and
      // `settle()` never observes an empty gap while work is handed off.
      this.#runAdmitted(next.envelope).then(
        () => next.resolve(true),
        (error: unknown) => next.reject(error),
      );
      return;
    }
    this.#active -= 1;
    this.#onAdmittedDelta?.(-1);
  }
}

/** Registrations of one queue name and its round-robin cursor. */
interface KvQueueRoute {
  readonly registrations: KvQueueRegistration[];
  cursor: number;
}

/** Registrations by queue name, chosen round-robin per name with capacity preference. */
export class KvQueueRouteTable {
  readonly #routes = new Map<string, KvQueueRoute>();

  get isEmpty(): boolean {
    return this.#routes.size === 0;
  }

  add(queueName: string, registration: KvQueueRegistration): void {
    const route = this.#routes.get(queueName);
    if (route) {
      route.registrations.push(registration);
    } else {
      this.#routes.set(queueName, { registrations: [registration], cursor: 0 });
    }
  }

  remove(queueName: string, registration: KvQueueRegistration): void {
    const route = this.#routes.get(queueName);
    if (!route) {
      return;
    }
    const index = route.registrations.indexOf(registration);
    if (index >= 0) {
      route.registrations.splice(index, 1);
    }
    if (route.registrations.length === 0) {
      this.#routes.delete(queueName);
    }
  }

  next(queueName: string): KvQueueRegistration | undefined {
    const route = this.#routes.get(queueName);
    if (!route || route.registrations.length === 0) {
      return undefined;
    }
    const length = route.registrations.length;
    const start = route.cursor % length;
    for (let offset = 0; offset < length; offset++) {
      const index = (start + offset) % length;
      const candidate = route.registrations[index];
      if (candidate.hasCapacity) {
        route.cursor = (index + 1) % length;
        return candidate;
      }
    }
    const fallback = route.registrations[start];
    route.cursor = (start + 1) % length;
    return fallback;
  }

  drain(): KvQueueRegistration[] {
    const registrations = [...this.#routes.values()].flatMap((route) => route.registrations);
    this.#routes.clear();
    return registrations;
  }
}

/** Add a promise to an in-flight set until it settles; the returned promise keeps its outcome. */
export function track(inFlight: Set<Promise<void>>, work: Promise<void>): Promise<void> {
  inFlight.add(work);
  const forget = () => inFlight.delete(work);
  work.then(forget, forget);
  return work;
}
