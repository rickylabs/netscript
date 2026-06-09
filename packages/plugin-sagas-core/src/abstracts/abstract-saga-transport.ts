import type {
  SagaTransportHandler,
  SagaTransportPort,
  SagaTransportSubscription,
} from '../ports/mod.ts';
import type { SagaMessage } from '../domain/mod.ts';

/** Stub-only base for the named saga transport extension axis. */
export abstract class AbstractSagaTransport implements SagaTransportPort {
  /** Stable transport identifier. */
  abstract readonly id: string;

  /** Start the transport. */
  abstract start(): Promise<void>;

  /** Stop the transport. */
  abstract stop(reason?: string): Promise<void>;

  /** Publish one message to a transport topic. */
  abstract publish(topic: string, message: SagaMessage): Promise<void>;

  /** Subscribe a handler to a transport topic. */
  abstract subscribe(
    topic: string,
    handler: SagaTransportHandler,
  ): Promise<SagaTransportSubscription>;
}
