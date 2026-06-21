import type {
  SagaAppliedKeyOutcome,
  SagaAppliedKeyStore,
  SagaIdempotencyPort,
  SagaIdempotencyReservation,
  SagaIdempotencyTarget,
  SagaInstanceId,
} from '@netscript/plugin-sagas-core/runtime';
import { sagaIdempotencyKey } from '@netscript/plugin-sagas-core/runtime';

const DEFAULT_SAGA_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

type SagaIdempotencyReservationRecord = Readonly<{
  reservedAt: string;
  expiresAt: string;
}>;

/** Shared options for Deno KV-backed saga runtime stores. */
export type SagaRuntimeKvStoreOptions = Readonly<{
  kv: Deno.Kv;
  prefix?: readonly Deno.KvKeyPart[];
  now?: () => Date;
}>;

/** Options for Deno KV-backed saga transport idempotency reservations. */
export type KvSagaIdempotencyStoreOptions =
  & SagaRuntimeKvStoreOptions
  & Readonly<{
    ttlMs?: number;
  }>;

/** Options for Deno KV-backed saga applied-key records. */
export type KvSagaAppliedKeyStoreOptions =
  & SagaRuntimeKvStoreOptions
  & Readonly<{
    activeTtlMs?: number;
  }>;

/** Deno KV-backed saga transport idempotency reservation store. */
export class KvSagaIdempotencyStore implements SagaIdempotencyPort {
  readonly #kv: Deno.Kv;
  readonly #prefix: readonly Deno.KvKeyPart[];
  readonly #now: () => Date;
  readonly #ttlMs: number;

  /** Create an idempotency store over the supplied Deno KV database. */
  constructor(options: KvSagaIdempotencyStoreOptions) {
    validatePositiveTtl(options.ttlMs ?? DEFAULT_SAGA_IDEMPOTENCY_TTL_MS, 'ttlMs');
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? ['sagas'];
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
    if (current.value && new Date(current.value.expiresAt) <= now) {
      await this.#kv.delete(reservationKey);
    }
    const result = await this.#kv.atomic()
      .check({ key: reservationKey, versionstamp: null })
      .set(
        reservationKey,
        Object.freeze({ reservedAt: now.toISOString(), expiresAt: expiresAt.toISOString() }),
        { expireIn: this.#ttlMs },
      )
      .commit();

    return Object.freeze({
      accepted: result.ok,
      key,
      expiresAt,
    });
  }

  #reservationKey(key: string): Deno.KvKey {
    return [...this.#prefix, 'idempotency', key];
  }
}

/** Deno KV-backed saga applied-key store for exactly-once-effective handler effects. */
export class KvSagaAppliedKeyStore implements SagaAppliedKeyStore {
  readonly #kv: Deno.Kv;
  readonly #prefix: readonly Deno.KvKeyPart[];
  readonly #now: () => Date;
  readonly #activeTtlMs?: number;

  /** Create an applied-key store over the supplied Deno KV database. */
  constructor(options: KvSagaAppliedKeyStoreOptions) {
    if (options.activeTtlMs !== undefined) {
      validatePositiveTtl(options.activeTtlMs, 'activeTtlMs');
    }
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? ['sagas'];
    this.#now = options.now ?? (() => new Date());
    this.#activeTtlMs = options.activeTtlMs;
  }

  /** Record an instance/key tuple atomically; duplicates return `applied: false`. */
  async recordApplied(
    instanceId: SagaInstanceId,
    idempotencyKey: string,
  ): Promise<SagaAppliedKeyOutcome> {
    const value = Object.freeze({ appliedAt: this.#now().toISOString() });
    const atomic = this.#kv.atomic()
      .check({ key: this.#appliedKey(instanceId, idempotencyKey), versionstamp: null });

    if (this.#activeTtlMs === undefined) {
      atomic.set(this.#appliedKey(instanceId, idempotencyKey), value);
    } else {
      atomic.set(this.#appliedKey(instanceId, idempotencyKey), value, {
        expireIn: this.#activeTtlMs,
      });
    }

    const result = await atomic.commit();
    return Object.freeze({ applied: result.ok });
  }

  #appliedKey(instanceId: SagaInstanceId, idempotencyKey: string): Deno.KvKey {
    return [...this.#prefix, 'applied', instanceId, idempotencyKey];
  }
}

function validatePositiveTtl(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`Saga KV ${name} must be a positive finite number.`);
  }
}
