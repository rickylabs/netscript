import type { CascadedMessage, CascadedMessageTarget, SagaMessage } from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';
import type { SagaIdempotencyPort } from '../ports/mod.ts';

/** Target tuple used to deduplicate idempotent saga messages. */
export type SagaIdempotencyTarget = Readonly<{
  kind: string;
  id: string;
}>;

/** Clock boundary used by the idempotency table. */
export type SagaIdempotencyClock = () => Date;

/** Options for the in-memory T1 idempotency table. */
export type SagaIdempotencyDedupTableOptions = Readonly<{
  ttlMs?: number;
  now?: SagaIdempotencyClock;
}>;

/** Result returned when reserving an idempotency key. */
export type SagaIdempotencyReservation = Readonly<{
  accepted: boolean;
  key: string;
  expiresAt: Date;
}>;

const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

type DedupEntry = Readonly<{
  expiresAt: Date;
}>;

/** In-memory idempotency table for local development and tests; use a durable port in production. */
export class SagaIdempotencyDedupTable {
  readonly #ttlMs: number;
  readonly #now: SagaIdempotencyClock;
  readonly #entries = new Map<string, DedupEntry>();

  /** Create an in-memory idempotency table. */
  constructor(options: SagaIdempotencyDedupTableOptions = {}) {
    const ttlMs = options.ttlMs ?? DEFAULT_IDEMPOTENCY_TTL_MS;
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw SagasError.validationFailed('Saga idempotency TTL must be a positive finite number.');
    }

    this.#ttlMs = ttlMs;
    this.#now = options.now ?? (() => new Date());
  }

  /** Reserve a target/key tuple; returns false when the tuple is still active. */
  reserve(target: SagaIdempotencyTarget, idempotencyKey: string): SagaIdempotencyReservation {
    const key = formatIdempotencyKey(target, idempotencyKey);
    const now = this.#now();
    const current = this.#entries.get(key);
    if (current && current.expiresAt > now) {
      return Object.freeze({
        accepted: false,
        key,
        expiresAt: current.expiresAt,
      });
    }

    const expiresAt = new Date(now.getTime() + this.#ttlMs);
    this.#entries.set(key, Object.freeze({ expiresAt }));
    return Object.freeze({
      accepted: true,
      key,
      expiresAt,
    });
  }

  /** Remove expired entries and return the number of retained tuples. */
  pruneExpired(): number {
    const now = this.#now();
    for (const [key, entry] of this.#entries) {
      if (entry.expiresAt <= now) {
        this.#entries.delete(key);
      }
    }
    return this.#entries.size;
  }

  /** Current number of retained tuples. */
  size(): number {
    this.pruneExpired();
    return this.#entries.size;
  }

  /** Clear the table for deterministic tests or runtime shutdown. */
  clear(): void {
    this.#entries.clear();
  }
}

/** Local/test idempotency adapter backed by process memory only. */
export class MemorySagaIdempotencyStore implements SagaIdempotencyPort {
  readonly #table: SagaIdempotencyDedupTable;

  /** Create a memory-backed idempotency store. */
  constructor(options: SagaIdempotencyDedupTableOptions = {}) {
    this.#table = new SagaIdempotencyDedupTable(options);
  }

  /** Reserve a target/key tuple through the underlying table. */
  reserve(
    target: SagaIdempotencyTarget,
    idempotencyKey: string,
  ): Promise<SagaIdempotencyReservation> {
    return Promise.resolve(this.#table.reserve(target, idempotencyKey));
  }

  /** Remove expired reservations and return the retained count. */
  pruneExpired(): number {
    return this.#table.pruneExpired();
  }

  /** Return the number of retained reservations. */
  size(): number {
    return this.#table.size();
  }

  /** Clear all retained reservations. */
  clear(): void {
    this.#table.clear();
  }
}

/** Resolve the dedup target for an incoming saga message. */
export function sagaMessageIdempotencyTarget(message: SagaMessage): SagaIdempotencyTarget {
  return Object.freeze({
    kind: 'message',
    id: message.type,
  });
}

/** Resolve the dedup target for a cascaded saga message. */
export function cascadedMessageIdempotencyTarget(message: CascadedMessage): SagaIdempotencyTarget {
  switch (message.kind) {
    case 'send':
      return fromCascadedTarget(message.target);
    case 'scheduled':
      return isCascadedMessage(message.message)
        ? cascadedMessageIdempotencyTarget(message.message)
        : sagaMessageIdempotencyTarget(message.message);
    case 'spawn':
      return Object.freeze({ kind: 'saga', id: message.sagaId });
    case 'complete':
    case 'fail':
    case 'compensate':
      return Object.freeze({ kind: 'cascade', id: message.kind });
  }
}

function fromCascadedTarget(target: CascadedMessageTarget): SagaIdempotencyTarget {
  return Object.freeze({
    kind: target.kind,
    id: target.id,
  });
}

function isCascadedMessage(message: SagaMessage | CascadedMessage): message is CascadedMessage {
  return 'kind' in message;
}

/** Format a saga idempotency target/key tuple for durable reservation adapters. */
export function sagaIdempotencyKey(
  target: SagaIdempotencyTarget,
  idempotencyKey: string,
): string {
  return `${target.kind}:${target.id}:${idempotencyKey}`;
}

const formatIdempotencyKey = sagaIdempotencyKey;
