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
  /** Stable adapter identifier used by runtime diagnostics and plugin registration. */
  readonly id: string;
  /** Load a persisted saga state envelope by instance id. */
  load<TState extends SagaState>(
    instanceId: SagaInstanceId,
  ): Promise<SagaStateEnvelope<TState> | undefined>;
  /** Save a saga state envelope, optionally using optimistic write constraints. */
  save<TState extends SagaState>(
    envelope: SagaStateEnvelope<TState>,
    options?: SagaStoreWriteOptions,
  ): Promise<void>;
  /** Append a transition record to an instance's transition history. */
  appendTransition<TState extends SagaState>(
    instanceId: SagaInstanceId,
    record: SagaTransitionRecord<TState>,
  ): Promise<void>;
  /** Resolve an instance id by saga id and correlation key. */
  findByCorrelation(
    sagaId: SagaId,
    correlationKey: SagaCorrelationKey,
  ): Promise<SagaInstanceId | undefined>;
  /** Save or update the correlation index for an instance. */
  saveCorrelation(entry: SagaCorrelationIndexEntry): Promise<void>;
  /** Delete persisted state and indexes for an instance. */
  delete(instanceId: SagaInstanceId): Promise<void>;
}
