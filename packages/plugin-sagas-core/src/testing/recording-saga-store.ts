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

/** Operation captured by `RecordingSagaStore`. */
export type RecordingSagaStoreOperation =
  | Readonly<{ kind: 'load'; instanceId: SagaInstanceId }>
  | Readonly<{ kind: 'save'; instanceId: SagaInstanceId; expectedVersion?: number }>
  | Readonly<{ kind: 'appendTransition'; instanceId: SagaInstanceId; version: number }>
  | Readonly<{ kind: 'findByCorrelation'; sagaId: SagaId; correlationKey: SagaCorrelationKey }>
  | Readonly<{ kind: 'saveCorrelation'; entry: SagaCorrelationIndexEntry }>
  | Readonly<{ kind: 'delete'; instanceId: SagaInstanceId }>;

/** Store wrapper that records persistence operations while delegating behavior. */
export class RecordingSagaStore implements SagaStorePort {
  /** Stable store identifier. */
  readonly id: string;
  readonly #delegate: SagaStorePort;
  readonly #operations: RecordingSagaStoreOperation[] = [];

  /** Create a recording wrapper around another saga store. */
  constructor(delegate: SagaStorePort, id = 'recording-saga-store') {
    this.id = id;
    this.#delegate = delegate;
  }

  /** Record and delegate a state load. */
  load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    this.#operations.push(Object.freeze({ kind: 'load', instanceId }));
    return this.#delegate.load<TState>(instanceId);
  }

  /** Record and delegate a state save. */
  save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options: SagaStoreWriteOptions = {},
  ): Promise<void> {
    this.#operations.push(Object.freeze({
      kind: 'save',
      instanceId: envelope.metadata.instanceId,
      expectedVersion: options.expectedVersion,
    }));
    return this.#delegate.save(envelope, options);
  }

  /** Record and delegate a transition append. */
  appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    this.#operations.push(Object.freeze({
      kind: 'appendTransition',
      instanceId,
      version: record.version,
    }));
    return this.#delegate.appendTransition(instanceId, record);
  }

  /** Record and delegate a correlation lookup. */
  findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    this.#operations.push(Object.freeze({ kind: 'findByCorrelation', sagaId, correlationKey }));
    return this.#delegate.findByCorrelation(sagaId, correlationKey);
  }

  /** Record and delegate saving a correlation index entry. */
  saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    this.#operations.push(Object.freeze({ kind: 'saveCorrelation', entry }));
    return this.#delegate.saveCorrelation(entry);
  }

  /** Record and delegate an instance delete. */
  delete(instanceId: SagaInstanceId): Promise<void> {
    this.#operations.push(Object.freeze({ kind: 'delete', instanceId }));
    return this.#delegate.delete(instanceId);
  }

  /** Return captured store operations. */
  operations(): readonly RecordingSagaStoreOperation[] {
    return Object.freeze([...this.#operations]);
  }
}
