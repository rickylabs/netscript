import { SagaKvRetention, sagaRetentionRemaining } from './saga-kv-retention.ts';
import { SagasError } from '../domain/mod.ts';
import { getKv } from '@netscript/kv';
import type { AtomicMutation, KvKey, KvStore } from '@netscript/kv';
import type {
  SagaCorrelationIndexEntry,
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaStorePort,
  SagaStoreWriteOptions,
  SagaTransitionRecord,
} from '../runtime/mod.ts';

export type {
  AtomicCheck,
  AtomicMutation,
  AtomicResult,
  KvEntry,
  KvKey,
  KvListOptions,
  KvSetOptions,
  KvStore,
} from '@netscript/kv';

const DEFAULT_SAGA_KV_PREFIX = ['sagas'] as const satisfies KvKey;
const SAGA_KV_PATH_ENV = 'NETSCRIPT_SAGA_KV_PATH';

/** Options for the KV-backed saga runtime store. */
export type KvSagaStoreOptions = Readonly<{
  kv: KvStore;
  prefix?: KvKey;
  now?: () => Date;
  /** Terminal retention in days, resolved per instance; open instances never expire. */
  completedRetentionDays?: number | ((envelope: SagaStateEnvelope) => number);
}>;

/** Open the shared KV adapter used by production saga runtime stores. */
export function openSagaRuntimeKv(): Promise<KvStore> {
  const path = Deno.env.get(SAGA_KV_PATH_ENV);
  return path === undefined ? getKv() : getKv({ provider: 'deno-kv', path });
}

/** KV-backed saga state store for durable native saga execution. */
export class KvSagaStore implements SagaStorePort {
  /** Stable store identifier used by runtime diagnostics. */
  readonly id = 'kv-saga-store';
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;
  readonly #days: number | ((envelope: SagaStateEnvelope) => number);
  readonly #retention: SagaKvRetention;

  /** Create a saga store over the supplied KV adapter. */
  constructor(options: KvSagaStoreOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_SAGA_KV_PREFIX;
    this.#now = options.now ?? (() => new Date());
    this.#days = options.completedRetentionDays ?? 7;
    this.#retention = new SagaKvRetention(this.#kv, this.#prefix, this.#now);
  }

  /** Load a saga state envelope by instance id. */
  async load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    const entry = await this.#kv.get<SagaStateEnvelope<TState>>(this.#stateKey(instanceId));
    return entry?.value ?? undefined;
  }

  /** Save a saga state envelope with optimistic version checking. */
  async save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options: SagaStoreWriteOptions = {},
  ): Promise<void> {
    const key = this.#stateKey(envelope.metadata.instanceId);
    const current = await this.#kv.get<SagaStateEnvelope>(key);
    if (
      options.expectedVersion !== undefined &&
      current?.value?.metadata.version !== options.expectedVersion
    ) {
      throw versionMismatch(envelope.metadata.instanceId);
    }

    const expireIn = this.#remaining(envelope);
    const reverseKey: KvKey = [
      ...this.#prefix,
      'correlation-instance',
      envelope.metadata.instanceId,
    ];
    const correlation = await this.#kv.get<SagaCorrelationIndexEntry>(reverseKey);
    const mutations: AtomicMutation[] = expireIn === undefined
      ? [{ type: 'set', key, value: envelope }, {
        type: 'delete',
        key: this.#retention.key(envelope.metadata.instanceId),
      }]
      : [
        expireIn <= 0 ? { type: 'delete', key } : { type: 'set', key, value: envelope, expireIn },
        this.#retention.mutation(envelope.metadata.instanceId, this.#now().getTime() + expireIn),
      ];
    if (correlation) {
      const correlationKey = this.#correlationKey(
        correlation.value.sagaId,
        correlation.value.correlationKey,
      );
      for (
        const [ownedKey, value] of [[reverseKey, correlation.value], [
          correlationKey,
          envelope.metadata.instanceId,
        ]] as const
      ) {
        mutations.push(
          expireIn !== undefined && expireIn <= 0
            ? { type: 'delete', key: ownedKey }
            : { type: 'set', key: ownedKey, value, expireIn },
        );
      }
    }
    const result = await requireAtomic(this.#kv)(
      [{ key, versionstamp: current?.versionstamp ?? null }, {
        key: reverseKey,
        versionstamp: correlation?.versionstamp ?? null,
      }],
      mutations,
    );

    if (!result.ok) {
      throw versionMismatch(envelope.metadata.instanceId);
    }
  }

  /** Append a transition record for one saga instance. */
  async appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    const envelope = await this.load(instanceId);
    const expireIn = envelope ? this.#remaining(envelope) : undefined;
    const key = this.#transitionKey(instanceId, record.version);
    if (expireIn !== undefined && expireIn <= 0) await this.#kv.delete(key);
    else await this.#kv.set(key, record, expireIn === undefined ? undefined : { expireIn });
  }

  /** Find an instance id by saga id and correlation key. */
  async findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    const entry = await this.#kv.get<SagaInstanceId>(this.#correlationKey(sagaId, correlationKey));
    return entry?.value ?? undefined;
  }

  /** Save or update the correlation index for an instance. */
  async saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    const envelope = await this.load(entry.instanceId);
    const expireIn = envelope ? this.#remaining(envelope) : undefined;
    const key = this.#correlationKey(entry.sagaId, entry.correlationKey);
    const reverseKey: KvKey = [...this.#prefix, 'correlation-instance', entry.instanceId];
    const mutations: AtomicMutation[] = expireIn !== undefined && expireIn <= 0
      ? [{ type: 'delete', key }, { type: 'delete', key: reverseKey }]
      : [{ type: 'set', key, value: entry.instanceId, expireIn }, {
        type: 'set',
        key: reverseKey,
        value: entry,
        expireIn,
      }];
    await requireAtomic(this.#kv)([], mutations);
  }

  /** Delete persisted state, transition history, and matching correlation indexes. */
  async delete(instanceId: SagaInstanceId): Promise<void> {
    const mutations: AtomicMutation[] = [
      { type: 'delete', key: this.#stateKey(instanceId) },
      { type: 'delete', key: [...this.#prefix, 'correlation-instance', instanceId] },
      { type: 'delete', key: this.#retention.key(instanceId) },
    ];

    for await (
      const entry of this.#kv.list<SagaTransitionRecord>({
        prefix: this.#transitionPrefix(instanceId),
      })
    ) {
      mutations.push({ type: 'delete', key: entry.key });
    }

    for await (const entry of this.#kv.list({ prefix: [...this.#prefix, 'applied', instanceId] })) {
      mutations.push({ type: 'delete', key: entry.key });
    }

    for await (
      const entry of this.#kv.list<SagaInstanceId>({ prefix: this.#correlationsPrefix() })
    ) {
      if (entry.value === instanceId) {
        mutations.push({ type: 'delete', key: entry.key });
      }
    }

    await requireAtomic(this.#kv)([], mutations);
  }

  /** Return all stored state envelopes for diagnostics and tests. */
  async entries<TState extends SagaState = SagaState>(): Promise<
    readonly SagaStateEnvelope<TState>[]
  > {
    const entries: SagaStateEnvelope<TState>[] = [];
    for await (
      const entry of this.#kv.list<SagaStateEnvelope<TState>>({ prefix: this.#statesPrefix() })
    ) {
      entries.push(entry.value);
    }
    return Object.freeze(entries);
  }

  /** Return transition records for one instance in version order. */
  async transitions<TState extends SagaState = SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<readonly SagaTransitionRecord<TState>[]> {
    const records: SagaTransitionRecord<TState>[] = [];
    for await (
      const entry of this.#kv.list<SagaTransitionRecord<TState>>({
        prefix: this.#transitionPrefix(instanceId),
      })
    ) {
      records.push(entry.value);
    }
    return Object.freeze(records);
  }

  /**
   * Apply terminal deadlines to one bounded page of history and applied keys.
   * Production runtime composition calls this independently of API reads.
   *
   * @example
   * ```ts
   * import { MemoryKvAdapter } from '@netscript/kv';
   * import { KvSagaStore } from '@netscript/plugin-sagas-core/stores';
   * await using kv = new MemoryKvAdapter();
   * const store = new KvSagaStore({ kv });
   * await store.cleanupRetention();
   * ```
   */
  cleanupRetention(limit = 100): Promise<void> {
    return this.#retention.cleanup(limit);
  }

  #remaining(envelope: SagaStateEnvelope): number | undefined {
    const days = typeof this.#days === 'number' ? this.#days : this.#days(envelope);
    return sagaRetentionRemaining(envelope, days, this.#now());
  }

  /** Close the underlying KV handle. */
  close(): Promise<void> {
    return this.#kv.close();
  }

  #statesPrefix(): KvKey {
    return [...this.#prefix, 'state'];
  }

  #stateKey(instanceId: SagaInstanceId): KvKey {
    return [...this.#statesPrefix(), instanceId];
  }

  #correlationsPrefix(): KvKey {
    return [...this.#prefix, 'correlation'];
  }

  #correlationKey(sagaId: SagaId, correlationKey: SagaCorrelationKey): KvKey {
    return [...this.#correlationsPrefix(), sagaId, correlationKey];
  }

  #transitionsPrefix(): KvKey {
    return [...this.#prefix, 'transition'];
  }

  #transitionPrefix(instanceId: SagaInstanceId): KvKey {
    return [...this.#transitionsPrefix(), instanceId];
  }

  #transitionKey(instanceId: SagaInstanceId, version: number): KvKey {
    return [...this.#transitionPrefix(instanceId), version];
  }
}

function requireAtomic(kv: KvStore): NonNullable<KvStore['atomic']> {
  if (!kv.atomic) {
    throw SagasError.validationFailed('Saga KV store requires atomic compare-and-swap support.');
  }
  return kv.atomic.bind(kv);
}

function versionMismatch(instanceId: SagaInstanceId): SagasError {
  return SagasError.validationFailed(`Saga store version mismatch for ${instanceId}.`);
}
