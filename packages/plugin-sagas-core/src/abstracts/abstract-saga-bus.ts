import type {
  SagaBusPort,
  SagaPublishOptions,
  SagaQueryDispatch,
  SagaSignalDispatch,
} from '../ports/mod.ts';
import type { CascadedMessage, SagaDefinition, SagaMessage } from '../domain/mod.ts';

/** Stub-only base for the named saga bus adapter extension axis. */
export abstract class AbstractSagaBus implements SagaBusPort {
  /** Stable bus identifier. */
  abstract readonly id: string;

  /** Start the bus. */
  abstract start(): Promise<void>;

  /** Stop the bus. */
  abstract stop(reason?: string): Promise<void>;

  /** Register saga definitions before message handling. */
  abstract register(definitions: readonly SagaDefinition[]): Promise<void>;

  /** Publish a saga message. */
  abstract publish(
    message: SagaMessage,
    options?: SagaPublishOptions,
  ): Promise<void>;

  /** Dispatch cascaded messages produced by a saga step. */
  abstract dispatchCascaded(messages: readonly CascadedMessage[]): Promise<void>;

  /** Dispatch a saga signal. */
  abstract signal<TPayload, TName extends string>(
    dispatch: SagaSignalDispatch<TPayload, TName>,
  ): Promise<void>;

  /** Dispatch a saga query. */
  abstract query<TResult, TName extends string>(
    dispatch: SagaQueryDispatch<TResult, TName>,
  ): Promise<TResult>;
}
