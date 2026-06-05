import type { SagaMessage } from '../domain/mod.ts';

/** Transport message envelope delivered to saga consumers. */
export type SagaTransportMessage<TMessage extends SagaMessage = SagaMessage> = Readonly<{
  topic: string;
  message: TMessage;
  receivedAt: Date;
  deliveryAttempt: number;
}>;

/** Acknowledgement handle for at-least-once transport implementations. */
export interface SagaTransportAck {
  ack(): Promise<void>;
  nack(reason?: string): Promise<void>;
}

/** Transport subscription returned by `SagaTransportPort.subscribe()`. */
export interface SagaTransportSubscription {
  readonly topic: string;
  unsubscribe(): Promise<void>;
}

/** Handler invoked by transport subscriptions. */
export type SagaTransportHandler<TMessage extends SagaMessage = SagaMessage> = (
  envelope: SagaTransportMessage<TMessage>,
  ack: SagaTransportAck,
) => Promise<void>;

/** Transport boundary for saga message delivery. */
export interface SagaTransportPort {
  readonly id: string;
  start(): Promise<void>;
  stop(reason?: string): Promise<void>;
  publish(topic: string, message: SagaMessage): Promise<void>;
  subscribe(topic: string, handler: SagaTransportHandler): Promise<SagaTransportSubscription>;
}
