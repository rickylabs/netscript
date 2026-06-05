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
export class MemorySagaStore implements SagaStorePort {
  readonly id: string;
  readonly #states = new Map<string, SagaStateEnvelope>();
  readonly #correlations = new Map<string, SagaInstanceId>();
  readonly #transitions = new Map<string, SagaTransitionRecord[]>();

  constructor(id = 'memory-saga-store') {
    this.id = id;
  }

  load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined> {
    return Promise.resolve(this.#states.get(instanceId) as SagaStateEnvelope<TState> | undefined);
  }

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

  appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void> {
    const records = this.#transitions.get(instanceId) ?? [];
    records.push(record);
    this.#transitions.set(instanceId, records);
    return Promise.resolve();
  }

  findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined> {
    return Promise.resolve(this.#correlations.get(correlationIndexKey(sagaId, correlationKey)));
  }

  saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void> {
    this.#correlations.set(
      correlationIndexKey(entry.sagaId, entry.correlationKey),
      entry.instanceId,
    );
    return Promise.resolve();
  }

  delete(instanceId: SagaInstanceId): Promise<void> {
    this.#states.delete(instanceId);
    this.#transitions.delete(instanceId);
    return Promise.resolve();
  }

  entries(): readonly SagaStateEnvelope[] {
    return Object.freeze([...this.#states.values()]);
  }

  transitions(instanceId: SagaInstanceId): readonly SagaTransitionRecord[] {
    return Object.freeze([...(this.#transitions.get(instanceId) ?? [])]);
  }

  clear(): void {
    this.#states.clear();
    this.#correlations.clear();
    this.#transitions.clear();
  }
}

function correlationIndexKey(sagaId: SagaId, correlationKey: SagaCorrelationKey): string {
  return `${sagaId}:${correlationKey}`;
}
