import type { SagaCorrelationKey } from './ids.ts';
import type { SagaMessage } from './saga-message.ts';

/** Extracts a correlation key from an incoming saga message. */
export type SagaCorrelation<TMessage extends SagaMessage = SagaMessage> = (
  message: TMessage,
) => SagaCorrelationKey | undefined;

/** Named correlation rule stored on a saga definition. */
export type SagaCorrelationRule<TMessage extends SagaMessage = SagaMessage> = Readonly<{
  eventType: TMessage['type'] | '*';
  canStart: boolean;
  correlate: SagaCorrelation<TMessage>;
}>;
