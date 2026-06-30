import type { AtomicMutation, KvKey, KvStore } from '@netscript/kv';
import type {
  SagaAppliedKeyOutcome,
  SagaAppliedKeyStore,
  SagaIdempotencyPort,
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
  SagaInstanceId,
} from '../runtime/mod.ts';
import { sagaIdempotencyKey } from '../runtime/mod.ts';

const DEFAULT_SAGA_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_SAGA_KV_PREFIX = ['sagas'] as const satisfies KvKey;

type SagaIdempotencyReservationRecord = Readonly<{
  reservedAt: string;
  expiresAt: string;
}>;

/** Shared options for KV-backed saga runtime stores. */
export type SagaRuntimeKvStoreOptions = Readonly<{
  kv: KvStore;
  prefix?: KvKey;
  now?: () => Date;
}>;

/** Options for KV-backed saga transport idempotency reservations. */
export type KvSagaIdempotencyStoreOptions =
  & SagaRuntimeKvStoreOptions
  & Readonly<{
    ttlMs?: number;
  }>;

/** Options for KV-backed saga applied-key records. */
export type KvSagaAppliedKeyStoreOptions =
  & SagaRuntimeKvStoreOptions
  & Readonly<{
    activeTtlMs?: number;
  }>;

/** KV-backed saga transport idempotency reservation store. */
export class KvSagaIdempotencyStore implements SagaIdempotencyPort {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;
  readonly #ttlMs: number;

  /** Create an idempotency store over the supplied KV adapter. */
  constructor(options: KvSagaIdempotencyStoreOptions) {
    validatePositiveTtl(options.ttlMs ?? DEFAULT_SAGA_IDEMPOTENCY_TTL_MS, 'ttlMs');
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_SAGA_KV_PREFIX;
    this.#now = options.now ?? (() => new Date());
    this.#ttlMs = options.ttlMs ?? DEFAULT_SAGA_IDEMPOTENCY_TTL_MS;
  }

  /** Reserve a target/key tuple atomically; duplicates return `accepted: false`. */
  async reserve(
    target: SagaIdempotencyTarget,
    idempotencyKey: string,
  ): Promise<SagaIdempotencyReservation> {
    const key = sagaIdempotencyKey(target, idempotencyKey);
    const now = this.#now();
    const expiresAt = new Date(now.getTime() + this.#ttlMs);
    const reservationKey = this.#reservationKey(key);
    const current = await this.#kv.get<SagaIdempotencyReservationRecord>(reservationKey);
    if (current?.value && new Date(current.value.expiresAt) <= now) {
      await this.#kv.delete(reservationKey);
    }
    const result = await requireAtomic(this.#kv)(
      [{ key: reservationKey, versionstamp: null }],
      [{
        type: 'set',
        key: reservationKey,
        value: Object.freeze({ reservedAt: now.toISOString(), expiresAt: expiresAt.toISOString() }),
        expireIn: this.#ttlMs,
      }],
    );

    return Object.freeze({
      accepted: result.ok,
      key,
      expiresAt,
    });
  }

  #reservationKey(key: string): KvKey {
    return [...this.#prefix, 'idempotency', key];
  }
}

/** KV-backed saga applied-key store for exactly-once-effective handler effects. */
export class KvSagaAppliedKeyStore implements SagaAppliedKeyStore {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;
  readonly #activeTtlMs?: number;

  /** Create an applied-key store over the supplied KV adapter. */
  constructor(options: KvSagaAppliedKeyStoreOptions) {
    if (options.activeTtlMs !== undefined) {
      validatePositiveTtl(options.activeTtlMs, 'activeTtlMs');
    }
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_SAGA_KV_PREFIX;
    this.#now = options.now ?? (() => new Date());
    this.#activeTtlMs = options.activeTtlMs;
  }

  /** Record an instance/key tuple atomically; duplicates return `applied: false`. */
  async recordApplied(
    instanceId: SagaInstanceId,
    idempotencyKey: string,
  ): Promise<SagaAppliedKeyOutcome> {
    const value = Object.freeze({ appliedAt: this.#now().toISOString() });
    const key = this.#appliedKey(instanceId, idempotencyKey);
    const mutation: AtomicMutation = this.#activeTtlMs === undefined
      ? { type: 'set', key, value }
      : { type: 'set', key, value, expireIn: this.#activeTtlMs };

    const result = await requireAtomic(this.#kv)([{ key, versionstamp: null }], [mutation]);
    return Object.freeze({ applied: result.ok });
  }

  #appliedKey(instanceId: SagaInstanceId, idempotencyKey: string): KvKey {
    return [...this.#prefix, 'applied', instanceId, idempotencyKey];
  }
}

function requireAtomic(kv: KvStore): NonNullable<KvStore['atomic']> {
  if (!kv.atomic) {
    throw new Error('Saga KV runtime store requires atomic compare-and-swap support.');
  }
  return kv.atomic.bind(kv);
}

function validatePositiveTtl(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`Saga KV ${name} must be a positive finite number.`);
  }
}
