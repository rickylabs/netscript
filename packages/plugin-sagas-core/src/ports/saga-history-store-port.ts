import type {
  CascadedMessage,
  SagaId,
  SagaInstanceId,
  SagaMessage,
  SagaState,
  SagaStateEnvelope,
} from '../domain/mod.ts';

/** Event types reserved for T3 replay history. */
export type SagaHistoryEventType =
  | 'message-received'
  | 'state-committed'
  | 'cascaded-emitted'
  | 'signal-received'
  | 'query-served';

/** Event-sourced history record reserved for T3 durability. */
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

/** Reserved T3 port for deterministic replay and audit history. */
export interface SagaHistoryStorePort {
  readonly id: string;
  append<TState extends SagaState>(event: SagaHistoryEvent<TState>): Promise<void>;
  read(instanceId: SagaInstanceId): Promise<readonly SagaHistoryEvent[]>;
  readAfter(instanceId: SagaInstanceId, sequence: number): Promise<readonly SagaHistoryEvent[]>;
}
