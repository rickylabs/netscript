import type { SagaCorrelationKey, SagaId, SagaInstanceId } from './ids.ts';
import type { CascadedMessage } from './cascaded-message.ts';
import type { SagaMessage } from './saga-message.ts';

/** Handler context passed to pure saga projections. */
export type SagaContext<TState = unknown, TMessage extends SagaMessage = SagaMessage> = Readonly<{
  sagaId: SagaId;
  instanceId: SagaInstanceId;
  correlationKey: SagaCorrelationKey;
  state: TState;
  message: TMessage;
  attempt: number;
  now: Date;
  traceparent?: string;
  tracestate?: string;
}>;

/** Synchronous saga handler that returns cascaded messages. */
export type SagaHandler<TState = unknown, TMessage extends SagaMessage = SagaMessage> = (
  saga: { state: TState },
  event: TMessage,
  context: SagaContext<TState, TMessage>,
) => readonly CascadedMessage[];
