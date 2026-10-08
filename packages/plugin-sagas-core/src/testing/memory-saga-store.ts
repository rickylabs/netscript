import { snapshotTransitionCommit } from '../application/validate-transition-commit.ts';
import type {
  SagaTransitionCommitPort,
  SagaTransitionCommitRequest,
  SagaTransitionCommitResult,
  StoredCommandOutbox,
} from '../ports/saga-transition-commit-port.ts';
import type {
  SagaCorrelationIndexEntry,
  SagaStorePort,
  SagaStoreWriteOptions,
} from '../ports/mod.ts';
import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '../domain/mod.ts';
import { SagasError } from '../domain/mod.ts';

/** In-memory saga state store for deterministic tests. */
export class MemorySagaStore implements SagaStorePort, SagaTransitionCommitPort {
  /** Stable store identifier. */
  readonly id: string;
  /** Same-commit transition, replay and outbox participation in this deterministic store. */
  readonly transitionCommitCapabilities: SagaTransitionCommitPort['transitionCommitCapabilities'] =
    Object.freeze(
      { transitionOutbox: 'same_commit', optimisticVersion: true, replay: 'same_commit' } as const,
    );
  readonly #commands = new Map<string, StoredCommandOutbox>();
  readonly #applied = new Set<string>();
  readonly #owners = new Map<string, SagaId>();
  readonly #states = new Map<string, SagaStateEnvelope>();
  readonly #correlations = new Map<string, SagaInstanceId>();
  readonly #transitions = new Map<string, SagaTransitionRecord[]>();

  /** Create an in-memory saga state store. */
  constructor(id = 'memory-saga-store') {
    this.id = id;
  }

  /** Atomically commit a complete optimistic transition, or replay without new writes. */
  commitTransition(
    request: SagaTransitionCommitRequest,
    signal?: AbortSignal,
  ): Promise<SagaTransitionCommitResult> {
    try {
      signal?.throwIfAborted();
      const value = snapshotTransitionCommit(request);
      const instanceId = value.envelope.metadata.instanceId;
      const replay = value.appliedKeyHash === undefined
        ? undefined
        : JSON.stringify([instanceId, value.appliedKeyHash]);
      if (replay !== undefined && this.#applied.has(replay)) {
        return Promise.resolve(Object.freeze({ committed: false }));
      }
      const current = this.#states.get(instanceId);
      if (
        (value.expectedVersion === 0
          ? current !== undefined
          : current?.metadata.version !== value.expectedVersion) ||
        (this.#owners.has(instanceId) && this.#owners.get(instanceId) !== value.correlation.sagaId)
      ) {
        throw SagasError.validationFailed('Atomic saga store version mismatch.');
      }
      const key = correlationIndexKey(value.correlation.sagaId, value.correlation.correlationKey);
      const correlated = this.#correlations.get(key);
      if (correlated !== undefined && correlated !== instanceId) {
        throw SagasError.validationFailed(
          'Atomic saga correlation already belongs to another instance.',
        );
      }
      for (const command of value.commands) {
        if (this.#commands.has(command.id)) {
          throw SagasError.validationFailed('Atomic saga command identity already exists.');
        }
      }
      // No await or caller callback occurs between the condition and these map mutations.
      this.#states.set(instanceId, value.envelope);
      this.#owners.set(instanceId, value.correlation.sagaId);
      this.#correlations.set(key, instanceId);
      this.#transitions.set(instanceId, [
        ...(this.#transitions.get(instanceId) ?? []),
        value.record,
      ]);
      for (const command of value.commands) this.#commands.set(command.id, command);
      if (replay !== undefined) this.#applied.add(replay);
      return Promise.resolve(Object.freeze({ committed: true }));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /** Inspect snapshotted producer intents without implementing a second relay. */
  commandIntents(): readonly StoredCommandOutbox[] {
    return Object.freeze(structuredClone([...this.#commands.values()]));
  }

  /** Load a saga state envelope by instance id. */
  load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    return Promise.resolve(
      structuredClone(this.#states.get(instanceId)) as SagaStateEnvelope<TState> | undefined,
    );
  }

  /** Save a saga state envelope with optimistic version checking. */
  save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options: SagaStoreWriteOptions = {},
  ): Promise<void> {
    const current = this.#states.get(envelope.metadata.instanceId);
    if (
      options.expectedVersion !== undefined &&
      current?.metadata.version !== options.expectedVersion
    ) {
      return Promise.reject(
        SagasError.validationFailed(
          `Saga store version mismatch for ${envelope.metadata.instanceId}.`,
        ),
      );
    }

    this.#states.set(envelope.metadata.instanceId, envelope);
    return Promise.resolve();
  }

  /** Append a transition record for one saga instance. */
  appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    const records = this.#transitions.get(instanceId) ?? [];
    records.push(record);
    this.#transitions.set(instanceId, records);
    return Promise.resolve();
  }

  /** Find an instance id by saga id and correlation key. */
  findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    return Promise.resolve(this.#correlations.get(correlationIndexKey(sagaId, correlationKey)));
  }

  /** Save a saga correlation index entry. */
  saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    this.#correlations.set(
      correlationIndexKey(entry.sagaId, entry.correlationKey),
      entry.instanceId,
    );
    return Promise.resolve();
  }

  /** Delete a saga instance and transition history. */
  delete(instanceId: SagaInstanceId): Promise<void> {
    this.#states.delete(instanceId);
    this.#transitions.delete(instanceId);
    return Promise.resolve();
  }

  /** Return all stored state envelopes. */
  entries(): readonly SagaStateEnvelope[] {
    return Object.freeze(structuredClone([...this.#states.values()]));
  }

  /** Return transition records for one instance. */
  transitions(instanceId: SagaInstanceId): readonly SagaTransitionRecord[] {
    return Object.freeze(structuredClone([...(this.#transitions.get(instanceId) ?? [])]));
  }

  /** Clear all stored state, indexes, and transitions. */
  clear(): void {
    this.#states.clear();
    this.#correlations.clear();
    this.#transitions.clear();
    this.#commands.clear();
    this.#applied.clear();
    this.#owners.clear();
  }
}

function correlationIndexKey(sagaId: SagaId, correlationKey: SagaCorrelationKey): string {
  return JSON.stringify([sagaId, correlationKey]);
}
