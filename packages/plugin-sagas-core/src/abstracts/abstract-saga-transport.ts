import type {
  SagaTransportHandler,
  SagaTransportPort,
  SagaTransportSubscription,
} from '../ports/mod.ts';
import type { SagaMessage } from '../domain/mod.ts';

/** Stub-only base for the named saga transport extension axis. */
export abstract class AbstractSagaTransport implements SagaTransportPort {
  abstract readonly id: string;

  abstract start(): Promise<void>;

  abstract stop(reason?: string): Promise<void>;

  abstract publish(topic: string, message: SagaMessage): Promise<void>;

  abstract subscribe(
    topic: string,
    handler: SagaTransportHandler,
  ): Promise<SagaTransportSubscription>;
}
