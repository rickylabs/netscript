import type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvSetOptions,
} from '@netscript/kv';
import {
  resolveWorkerIdempotencyKey,
  type WorkerIdempotencyClaim,
  type WorkerIdempotencyInput,
  type WorkerIdempotencyPort,
  type WorkerResolvedIdempotencyKey,
} from '../runtime/mod.ts';

export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvSetOptions,
} from '@netscript/kv';

const DEFAULT_ACTIVE_TTL_MS = 15 * 60_000;
const DEFAULT_APPLIED_TTL_MS = 24 * 60 * 60_000;
const ACTIVE_TTL_ENV = 'NETSCRIPT_WORKERS_IDEMPOTENCY_ACTIVE_TTL_MS';
const APPLIED_TTL_ENV = 'NETSCRIPT_WORKERS_IDEMPOTENCY_APPLIED_TTL_MS';
const DEFAULT_PREFIX: KvKey = ['workers', 'idempotency'];
const CLAIM_ATTEMPTS = 3;

/** Minimal durable KV shape required by worker applied-keys storage. */
export interface WorkerIdempotencyKvStore {
  /** Read a stored entry. */
  get<T = unknown>(key: KvKey): Promise<KvEntry<T> | null>;
  /** Store a value with optional TTL. */
  set(key: KvKey, value: unknown, options?: KvSetOptions): Promise<void>;
  /** Delete a key. */
  delete(key: KvKey): Promise<void>;
  /** Return whether a key currently exists. */
  has(key: KvKey): Promise<boolean>;
  /** Optional compare-and-swap operation used for first-wins claims. */
  atomic?(checks: AtomicCheck[], mutations: AtomicMutation[]): Promise<AtomicResult>;
}

/** Options for creating the worker KV idempotency store. */
export type KvWorkerIdempotencyStoreOptions = Readonly<{
  /** Shared durable KV handle used by the worker runtime. */
  kv: WorkerIdempotencyKvStore;
  /** Key prefix used for all worker idempotency entries. */
  prefix?: KvKey;
  /** Active claim TTL in milliseconds. */
  activeTtlMs?: number;
  /** Applied marker TTL in milliseconds. */
  appliedTtlMs?: number;
  /** Clock used for marker metadata. */
  now?: () => Date;
}>;

/** Durable KV-backed applied-keys store for worker jobs and tasks. */
export class KvWorkerIdempotencyStore implements WorkerIdempotencyPort {
  readonly #kv: WorkerIdempotencyKvStore;
  readonly #prefix: KvKey;
  readonly #activeTtlMs: number;
  readonly #appliedTtlMs: number;
  readonly #now: () => Date;

  /** Create a store over the shared workers KV handle. */
  constructor(options: KvWorkerIdempotencyStoreOptions) {
    assertDurableKv(options.kv);
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_PREFIX;
    this.#activeTtlMs = options.activeTtlMs ?? readTtlEnv(ACTIVE_TTL_ENV) ?? DEFAULT_ACTIVE_TTL_MS;
    this.#appliedTtlMs = options.appliedTtlMs ?? readTtlEnv(APPLIED_TTL_ENV) ??
      DEFAULT_APPLIED_TTL_MS;
    this.#now = options.now ?? (() => new Date());
  }

  /** Claim the resolved applied key for a single delivery. */
  async claim(input: WorkerIdempotencyInput): Promise<WorkerIdempotencyClaim> {
    const resolved = await resolveWorkerIdempotencyKey(input);
    if (this.#kv.atomic) {
      return await this.#atomicClaim(resolved, input);
    }
    return await this.#sequentialClaim(resolved, input);
  }

  /** Mark a claimed key as applied for the configured or supplied TTL. */
  async markApplied(
    key: string,
    ttlMs: number = this.#appliedTtlMs,
    token?: string,
  ): Promise<void> {
    const activeKey = this.#activeKey(key);
    const appliedKey = this.#appliedKey(key);
    const mutations: AtomicMutation[] = [{ type: 'delete', key: activeKey }];
    if (ttlMs > 0) {
      mutations.push({
        type: 'set',
        key: appliedKey,
        value: { appliedAt: this.#now().toISOString() },
        expireIn: ttlMs,
      });
    } else {
      mutations.push({ type: 'delete', key: appliedKey });
    }

    if (this.#kv.atomic) {
      const active = token ? await this.#kv.get<ActiveClaim>(activeKey) : null;
      if (token && active?.value.token !== token) throw new Error('Worker idempotency claim lost');
      const result = await this.#kv.atomic(
        token ? [{ key: activeKey, versionstamp: active!.versionstamp }] : [],
        mutations,
      );
      if (!result.ok) throw new Error('Worker idempotency claim lost');
      return;
    }

    if (token && (await this.#kv.get<ActiveClaim>(activeKey))?.value.token !== token) {
      throw new Error('Worker idempotency claim lost');
    }
    await this.#kv.delete(activeKey);
    if (ttlMs > 0) {
      await this.#kv.set(appliedKey, { appliedAt: this.#now().toISOString() }, { expireIn: ttlMs });
    } else {
      await this.#kv.delete(appliedKey);
    }
  }

  /** Release only the current owner when a claim token is supplied. */
  async release(key: string, token?: string): Promise<void> {
    const activeKey = this.#activeKey(key);
    if (!token) return await this.#kv.delete(activeKey);
    const active = await this.#kv.get<ActiveClaim>(activeKey);
    if (active?.value.token !== token) return;
    if (this.#kv.atomic) {
      await this.#kv.atomic(
        [{ key: activeKey, versionstamp: active.versionstamp }],
        [{ type: 'delete', key: activeKey }],
      );
    } else {
      await this.#kv.delete(activeKey);
    }
  }

  async #atomicClaim(
    resolved: WorkerResolvedIdempotencyKey,
    input: WorkerIdempotencyInput,
  ): Promise<WorkerIdempotencyClaim> {
    const activeKey = this.#activeKey(resolved.key);
    const appliedKey = this.#appliedKey(resolved.key);
    for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt++) {
      const [active, applied] = await Promise.all([
        this.#kv.get<ActiveClaim>(activeKey),
        this.#kv.get(appliedKey),
      ]);
      if (applied) return { ...resolved, claimed: false, alreadyApplied: true };
      // Only a newer broker lease for this exact message can replace a live marker.
      // Caller-key duplicates from other messages must still wait for its owner.
      if (
        active && !(input.messageId && active.value.messageId === input.messageId &&
          Number.isSafeInteger(input.deliveryCount) && input.deliveryCount! > 1 &&
          input.deliveryCount! > (active.value.deliveryCount ?? 1))
      ) {
        return { ...resolved, claimed: false, alreadyApplied: false };
      }
      const marker = this.#marker(resolved, input);
      const result = await this.#kv.atomic!(
        [
          { key: activeKey, versionstamp: active?.versionstamp ?? null },
          { key: appliedKey, versionstamp: null },
        ],
        [{ type: 'set', key: activeKey, value: marker, expireIn: this.#activeTtlMs }],
      );
      if (result.ok) {
        return { ...resolved, claimed: true, alreadyApplied: false, token: marker.token };
      }
    }
    return { ...resolved, claimed: false, alreadyApplied: await this.#kv.has(appliedKey) };
  }

  async #sequentialClaim(
    resolved: WorkerResolvedIdempotencyKey,
    input: WorkerIdempotencyInput,
  ): Promise<WorkerIdempotencyClaim> {
    const activeKey = this.#activeKey(resolved.key);
    const appliedKey = this.#appliedKey(resolved.key);
    if (await this.#kv.has(appliedKey)) {
      return { ...resolved, claimed: false, alreadyApplied: true };
    }
    if (await this.#kv.has(activeKey)) {
      return { ...resolved, claimed: false, alreadyApplied: false };
    }
    const marker = this.#marker(resolved, input);
    await this.#kv.set(activeKey, marker, { expireIn: this.#activeTtlMs });
    return { ...resolved, claimed: true, alreadyApplied: false, token: marker.token };
  }

  #marker(resolved: WorkerResolvedIdempotencyKey, input: WorkerIdempotencyInput): ActiveClaim {
    return {
      claimedAt: this.#now().toISOString(),
      source: resolved.source,
      token: crypto.randomUUID(),
      messageId: input.messageId,
      deliveryCount: input.deliveryCount ?? 1,
    };
  }

  #activeKey(key: string): KvKey {
    return [...this.#prefix, 'active', key];
  }

  #appliedKey(key: string): KvKey {
    return [...this.#prefix, 'applied', key];
  }
}

function assertDurableKv(kv: WorkerIdempotencyKvStore): void {
  const required: readonly (keyof WorkerIdempotencyKvStore)[] = ['get', 'set', 'delete', 'has'];
  for (const method of required) {
    if (typeof kv[method] !== 'function') {
      throw new TypeError(`Worker idempotency KV store is missing ${method}().`);
    }
  }
}

function readTtlEnv(name: string): number | undefined {
  try {
    const value = Deno.env.get(name);
    if (value === undefined || value.length === 0) {
      return undefined;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new TypeError(`${name} must be a non-negative finite millisecond value.`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof Deno.errors.PermissionDenied) {
      return undefined;
    }
    throw error;
  }
}

/** Broker generation and owner token retained alongside the active marker. */
type ActiveClaim = Readonly<{
  claimedAt: string;
  source: string;
  token: string;
  messageId?: string;
  deliveryCount?: number;
}>;
