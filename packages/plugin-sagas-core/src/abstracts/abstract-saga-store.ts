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

/** Stub-only base for the named saga store extension axis. */
export abstract class AbstractSagaStore implements SagaStorePort {
  /** Stable store identifier. */
  abstract readonly id: string;

  /** Load a saga state envelope by instance id. */
  abstract load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined>;

  /** Save a saga state envelope with optional write constraints. */
  abstract save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options?: SagaStoreWriteOptions,
  ): Promise<void>;

  /** Append one transition record to an instance history. */
  abstract appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void>;

  /** Find an instance id by saga id and correlation key. */
  abstract findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined>;

  /** Save a saga correlation index entry. */
  abstract saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void>;

  /** Delete one saga instance and associated runtime state. */
  abstract delete(instanceId: SagaInstanceId): Promise<void>;
}
