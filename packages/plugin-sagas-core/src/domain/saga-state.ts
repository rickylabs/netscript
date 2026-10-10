import type { SagaInstanceId } from './ids.ts';
import type { SagaDurabilityTier, SagaInstanceStatus } from './constants.ts';

/** Metadata persisted with every saga instance. */
export type SagaStateMetadata<TInstanceId extends string = string> = Readonly<{
  instanceId: SagaInstanceId<TInstanceId>;
  /** Definition identity used to select topic retention for persisted runtime state. */
  sagaId?: string;
  version: number;
  status: SagaInstanceStatus;
  durability: SagaDurabilityTier;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  traceparent?: string;
  tracestate?: string;
  /** Error thrown by a `.compensate()` branch; such an instance is persisted as `failed`. */
  compensationError?: SagaCompensationError;
}>;

/** Serializable record of an error thrown by a `.compensate()` branch. */
export type SagaCompensationError = Readonly<{
  name: string;
  message: string;
}>;

/** Base state shape accepted by saga definitions. */
export type SagaState = Readonly<Record<string, unknown>>;

/** Persisted saga state envelope. */
export type SagaStateEnvelope<TState extends SagaState = SagaState> = Readonly<{
  metadata: SagaStateMetadata;
  state: TState;
}>;
