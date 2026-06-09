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
  /** Mark the delivered transport message as successfully handled. */
  ack(): Promise<void>;
  /** Reject the delivered transport message, optionally with a diagnostic reason. */
  nack(reason?: string): Promise<void>;
}

/** Transport subscription returned by `SagaTransportPort.subscribe()`. */
export interface SagaTransportSubscription {
  /** Topic associated with this active subscription. */
  readonly topic: string;
  /** Cancel the subscription and release transport-side resources. */
  unsubscribe(): Promise<void>;
}

/** Handler invoked by transport subscriptions. */
export type SagaTransportHandler<TMessage extends SagaMessage = SagaMessage> = (
  envelope: SagaTransportMessage<TMessage>,
  ack: SagaTransportAck,
) => Promise<void>;

/** Transport boundary for saga message delivery. */
export interface SagaTransportPort {
  /** Stable adapter identifier used by runtime diagnostics and plugin registration. */
  readonly id: string;
  /** Start the transport adapter and allocate underlying resources. */
  start(): Promise<void>;
  /** Stop the transport adapter and release resources. */
  stop(reason?: string): Promise<void>;
  /** Publish a saga message to a transport topic. */
  publish(topic: string, message: SagaMessage): Promise<void>;
  /** Subscribe a handler to a transport topic. */
  subscribe(topic: string, handler: SagaTransportHandler): Promise<SagaTransportSubscription>;
}
