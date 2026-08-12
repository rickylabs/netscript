import type {
  CascadedMessage,
  SagaId,
  SagaInstanceId,
  SagaMessage,
  SagaState,
  SagaStateEnvelope,
} from '../domain/mod.ts';

/** Event types retained for deterministic saga replay. */
export type SagaHistoryEventType =
  | 'message-received'
  | 'state-committed'
  | 'cascaded-emitted'
  | 'signal-received'
  | 'query-served';

/** Event-sourced history record retained for deterministic saga replay. */
export type SagaHistoryEvent<TState extends SagaState = SagaState> = Readonly<{
  sagaId: SagaId;
  instanceId: SagaInstanceId;
  sequence: number;
  type: SagaHistoryEventType;
  occurredAt: Date;
  message?: SagaMessage;
  state?: SagaStateEnvelope<TState>;
  cascaded?: readonly CascadedMessage[];
}>;

/** Reserved port for deterministic replay and audit history. */
export interface SagaHistoryStorePort {
  /** Stable adapter identifier used by runtime diagnostics and plugin registration. */
  readonly id: string;
  /** Append a replayable history event. */
  append<TState extends SagaState>(event: SagaHistoryEvent<TState>): Promise<void>;
  /** Read all retained history events for an instance. */
  read(instanceId: SagaInstanceId): Promise<readonly SagaHistoryEvent[]>;
  /** Read retained history events after a sequence number. */
  readAfter(instanceId: SagaInstanceId, sequence: number): Promise<readonly SagaHistoryEvent[]>;
}
