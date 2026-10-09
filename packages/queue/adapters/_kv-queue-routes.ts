/**
 * Listener registrations and the per-name route table of the queue dispatcher.
 *
 * @module
 */

import type { MessageEnvelope } from './_envelope.ts';

/** Handler that receives envelopes addressed to one queue name. */
export type KvEnvelopeHandler = (envelope: MessageEnvelope<unknown>) => Promise<void>;

/** One listener registration for a queue name, tracking the deliveries it has in flight. */
export class KvQueueRegistration {
  readonly #inFlight = new Set<Promise<void>>();

  constructor(
    private readonly handler: KvEnvelopeHandler,
    readonly end: () => void,
    readonly fail: (error: unknown) => void,
  ) {}

  deliver(envelope: MessageEnvelope<unknown>): Promise<void> {
    return track(this.#inFlight, this.handler(envelope));
  }

  /** Wait until every delivery already handed to this registration has settled. */
  async settle(): Promise<void> {
    await Promise.allSettled([...this.#inFlight]);
  }
}

/** Registrations of one queue name and its round-robin cursor. */
interface KvQueueRoute {
  readonly registrations: KvQueueRegistration[];
  cursor: number;
}

/** Registrations by queue name, chosen round-robin per name when a name has several. */
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
    if (!route) {
      return undefined;
    }
    route.cursor %= route.registrations.length;
    const registration = route.registrations[route.cursor];
    route.cursor += 1;
    return registration;
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
