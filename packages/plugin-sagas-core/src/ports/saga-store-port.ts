import type {
  SagaCorrelationKey,
  SagaId,
  SagaInstanceId,
  SagaState,
  SagaStateEnvelope,
  SagaTransitionRecord,
} from '../domain/mod.ts';

/** Optimistic write options for saga state persistence. */
export type SagaStoreWriteOptions = Readonly<{
  expectedVersion?: number;
}>;

/** Correlation index entry used for O(1) saga instance lookup. */
export type SagaCorrelationIndexEntry = Readonly<{
  sagaId: SagaId;
  correlationKey: SagaCorrelationKey;
  instanceId: SagaInstanceId;
}>;

/** Persistent state store boundary for T1 saga runtime guarantees. */
export interface SagaStorePort {
  readonly id: string;
  load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined>;
  save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options?: SagaStoreWriteOptions,
  ): Promise<void>;
  appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void>;
  findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined>;
  saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void>;
  delete(instanceId: SagaInstanceId): Promise<void>;
}
