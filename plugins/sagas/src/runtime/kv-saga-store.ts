import { SagasError } from '@netscript/plugin-sagas-core/domain';
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
} from '@netscript/plugin-sagas-core/runtime';

const DEFAULT_SAGA_KV_PREFIX = ['sagas'] as const satisfies readonly Deno.KvKeyPart[];
const SAGA_KV_PATH_ENV = 'NETSCRIPT_SAGA_KV_PATH';

/** Options for the Deno KV-backed saga runtime store. */
export type KvSagaStoreOptions = Readonly<{
  kv: Deno.Kv;
  prefix?: readonly Deno.KvKeyPart[];
  now?: () => Date;
}>;

/** Open the Deno KV database used by production saga runtime stores. */
export function openSagaRuntimeKv(): Promise<Deno.Kv> {
  return Deno.openKv(Deno.env.get(SAGA_KV_PATH_ENV));
}

/** Deno KV-backed saga state store for durable native saga execution. */
export class KvSagaStore implements SagaStorePort {
  /** Stable store identifier used by runtime diagnostics. */
  readonly id = 'kv-saga-store';
  readonly #kv: Deno.Kv;
  readonly #prefix: readonly Deno.KvKeyPart[];

  /** Create a saga store over the supplied Deno KV database. */
  constructor(options: KvSagaStoreOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_SAGA_KV_PREFIX;
  }

  /** Load a saga state envelope by instance id. */
  async load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    const entry = await this.#kv.get<SagaStateEnvelope<TState>>(this.#stateKey(instanceId));
    return entry.value ?? undefined;
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
      current.value?.metadata.version !== options.expectedVersion
    ) {
      throw versionMismatch(envelope.metadata.instanceId);
    }

    const result = await this.#kv.atomic()
      .check({ key, versionstamp: current.versionstamp })
      .set(key, envelope)
      .commit();

    if (!result.ok) {
      throw versionMismatch(envelope.metadata.instanceId);
    }
  }

  /** Append a transition record for one saga instance. */
  async appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    await this.#kv.set(this.#transitionKey(instanceId, record.version), record);
  }

  /** Find an instance id by saga id and correlation key. */
  async findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    const entry = await this.#kv.get<SagaInstanceId>(this.#correlationKey(sagaId, correlationKey));
    return entry.value ?? undefined;
  }

  /** Save or update the correlation index for an instance. */
  async saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    await this.#kv.set(
      this.#correlationKey(entry.sagaId, entry.correlationKey),
      entry.instanceId,
    );
  }

  /** Delete persisted state, transition history, and matching correlation indexes. */
  async delete(instanceId: SagaInstanceId): Promise<void> {
    const atomic = this.#kv.atomic().delete(this.#stateKey(instanceId));

    for await (
      const entry of this.#kv.list<SagaTransitionRecord>({
        prefix: this.#transitionPrefix(instanceId),
      })
    ) {
      atomic.delete(entry.key);
    }

    for await (
      const entry of this.#kv.list<SagaInstanceId>({ prefix: this.#correlationsPrefix() })
    ) {
      if (entry.value === instanceId) {
        atomic.delete(entry.key);
      }
    }

    await atomic.commit();
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

  /** Close the underlying KV handle. */
  close(): void {
    this.#kv.close();
  }

  #statesPrefix(): Deno.KvKey {
    return [...this.#prefix, 'state'];
  }

  #stateKey(instanceId: SagaInstanceId): Deno.KvKey {
    return [...this.#statesPrefix(), instanceId];
  }

  #correlationsPrefix(): Deno.KvKey {
    return [...this.#prefix, 'correlation'];
  }

  #correlationKey(sagaId: SagaId, correlationKey: SagaCorrelationKey): Deno.KvKey {
    return [...this.#correlationsPrefix(), sagaId, correlationKey];
  }

  #transitionsPrefix(): Deno.KvKey {
    return [...this.#prefix, 'transition'];
  }

  #transitionPrefix(instanceId: SagaInstanceId): Deno.KvKey {
    return [...this.#transitionsPrefix(), instanceId];
  }

  #transitionKey(instanceId: SagaInstanceId, version: number): Deno.KvKey {
    return [...this.#transitionPrefix(instanceId), version];
  }
}

function versionMismatch(instanceId: SagaInstanceId): SagasError {
  return SagasError.validationFailed(`Saga store version mismatch for ${instanceId}.`);
}
