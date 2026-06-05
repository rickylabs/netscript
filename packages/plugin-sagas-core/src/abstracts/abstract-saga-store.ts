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
  abstract readonly id: string;

  abstract load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined>;

  abstract save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options?: SagaStoreWriteOptions,
  ): Promise<void>;

  abstract appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void>;

  abstract findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined>;

  abstract saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void>;

  abstract delete(instanceId: SagaInstanceId): Promise<void>;
}
